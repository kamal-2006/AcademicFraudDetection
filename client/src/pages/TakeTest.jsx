import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import {
  Camera, CameraOff, Mic, MicOff, Maximize2, AlertTriangle, CheckCircle,
  Clock, Shield, Eye, EyeOff, ChevronRight, ChevronLeft,
  Send, RotateCcw, Award, XCircle, Activity, Volume2,
} from 'lucide-react';
import api from '../api/axios';

// ── Constants ────────────────────────────────────────────────────
const MODEL_CDN =
  'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

const PHASES = {
  PRE:        'pre',        // landing page
  VERIFY:     'verify',     // camera/mic gate — must pass before exam
  SETUP:      'setup',      // fetching questions & creating session
  CALIBRATE:  'calibrate',  // pre-test eye/attention calibration
  EXAM:       'exam',       // active exam
  TERMINATED: 'terminated', // auto-terminated by fraud score
  DONE:       'done',       // submitted & result shown
};

// Fraud points per violation type
const FRAUD_POINTS = {
  multiple_faces:   30,
  no_face:          20,
  fullscreen_exit:  25,
  tab_switch:       20,
  noise_detected:   15,
  camera_disabled:  40,
  looking_left:     10,
  looking_right:    10,
  looking_up:       10,
  looking_down:     10,
  head_turned_away: 15,
  copy_paste:       15,
  devtools_open:    30,
};
const FRAUD_THRESHOLD = 100; // auto-terminate at or above this

const CALIBRATION_DOTS = [
  { id: 'top-left', top: '12%', left: '8%' },
  { id: 'top-right', top: '12%', left: '92%' },
  { id: 'bottom-left', top: '88%', left: '8%' },
  { id: 'bottom-right', top: '88%', left: '92%' },
  { id: 'center', top: '50%', left: '50%' },
];

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const EVENT_MSGS = {
  multiple_faces:   '⚠ Multiple faces detected in camera frame.',
  no_face:          '⚠ No face detected — please stay in view.',
  fullscreen_exit:  '⚠ You exited fullscreen. Returning…',
  camera_disabled:  '⚠ Camera unavailable.',
  tab_switch:       '🚨 Tab/window switch detected — this has been logged as academic fraud.',
  noise_detected:   '⚠ Noise detected near microphone.',
  looking_left:     '⚠ Head turned left — please face the screen.',
  looking_right:    '⚠ Head turned right — please face the screen.',
  looking_up:       '⚠ Looking upward detected — please face the screen.',
  looking_down:     '⚠ Looking downward detected — avoid reading notes.',
  head_turned_away: '⚠ Head turned completely away from screen.',
  copy_paste:       '🚨 Copy/paste action detected — this has been logged as academic fraud.',
  devtools_open:    '🚨 Developer tools access detected — this has been logged.',
};

// ── Fraud warning toast (local) ──────────────────────────────────
let _warningId = 0;

// ── Head pose estimator (uses face-api.js 68-point landmarks) ────
// Landmark indices: jaw 0-16 | nose bridge 27-30 | eyes 36-47
const estimateHeadPose = (landmarks) => {
  const pts = landmarks.positions;

  const jawLeft  = pts[0];   // leftmost jaw edge
  const jawRight = pts[16];  // rightmost jaw edge
  const noseTip  = pts[30];  // nose tip

  const faceWidth = jawRight.x - jawLeft.x;
  if (faceWidth < 1) return { direction: 'straight', yawNorm: 0, pitchNorm: 0.5 };

  const faceCenterX = (jawLeft.x + jawRight.x) / 2;
  // yawNorm > 0  → nose shifted right in image → face turned to student's left
  // yawNorm < 0  → nose shifted left  in image → face turned to student's right
  const yawNorm = (noseTip.x - faceCenterX) / (faceWidth * 0.5);

  // Vertical pitch using eye-center → chin distance
  const eyeIndices = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47];
  const eyeCenterY = eyeIndices.reduce((s, i) => s + pts[i].y, 0) / eyeIndices.length;
  const chinY      = pts[8].y;
  const noseBridgeY = pts[27].y;
  const faceHeight  = Math.max(chinY - noseBridgeY, 1);
  const pitchNorm   = (noseTip.y - eyeCenterY) / faceHeight;

  const YAW_SEVERE = 0.55;
  const YAW_THRESH = 0.25;
  const PITCH_UP   = 0.20;
  const PITCH_DOWN = 0.65;

  let direction = 'straight';
  if (Math.abs(yawNorm) > YAW_SEVERE)       direction = 'head_turned_away';
  else if (Math.abs(yawNorm) > YAW_THRESH)  direction = yawNorm > 0 ? 'left' : 'right';
  else if (pitchNorm < PITCH_UP)            direction = 'up';
  else if (pitchNorm > PITCH_DOWN)          direction = 'down';

  return { direction, yawNorm, pitchNorm };
};

// ── Main Component ───────────────────────────────────────────────
const TakeTest = () => {
  /* ─ Phase / flow ─ */
  const [phase, setPhase]     = useState(PHASES.PRE);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  /* ─ Exam data ─ */
  const [questions, setQuestions]   = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers]       = useState({});
  const [result, setResult]         = useState(null);
  const [elapsed, setElapsed]       = useState(0);

  /* ─ Camera / mic state ─ */
  const [modelsReady, setModelsReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady]       = useState(false);
  const [faceStatus, setFaceStatus]   = useState('loading');
  // loading | ok | none | multiple | off

  /* ─ Proctoring/fraud state ─ */
  const [fraudScore, setFraudScore]     = useState(0);
  const [fraudCount, setFraudCount]     = useState(0);
  const [warnings, setWarnings]         = useState([]);
  const [sessionId, setSessionId]       = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationLog, setViolationLog] = useState([]);
  const [headPoseDir, setHeadPoseDir]   = useState('straight');
  const [concurrentLoginDetected, setConcurrentLoginDetected] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [calibrationClickedDots, setCalibrationClickedDots] = useState([]);
  // 'straight' | 'left' | 'right' | 'up' | 'down' | 'head_turned_away' | 'unknown'

  /* ─ Verification gate state ─ */
  const [verifyFaceOk, setVerifyFaceOk]     = useState(false);
  const [verifyMicOk, setVerifyMicOk]       = useState(false);
  const [verifyLoading, setVerifyLoading]   = useState(false);
  const [verifyError, setVerifyError]       = useState('');
  const [micLevel, setMicLevel]             = useState(0);

  /* ─ Refs ─ */
  const videoRef         = useRef(null);
  const streamRef        = useRef(null);
  const micStreamRef     = useRef(null);
  const audioCtxRef      = useRef(null);
  const analyserRef      = useRef(null);
  const detectTimer      = useRef(null);
  const noiseTimer       = useRef(null);
  const clockTimer       = useRef(null);
  const sessionIdRef     = useRef(null);
  const phaseRef         = useRef(PHASES.PRE);
  const fraudScoreRef    = useRef(0);
  const lastEventTime    = useRef({});
  const terminatingRef   = useRef(false);
  const lookAwayStartRef   = useRef(null);   // timestamp when gaze first left screen
  const pyAnalysisTimer    = useRef(null);   // periodic Python-service snapshot interval
  const heartbeatTimer     = useRef(null);   // concurrent-login polling interval
  const tabSwitchCountRef  = useRef(0);      // cumulative tab/window switches

  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { fraudScoreRef.current = fraudScore; }, [fraudScore]);

  /* ──────────────────────────────────────────────────────────────
     Heartbeat polling — detect concurrent login from another device
     Polls GET /api/test/sessions/:id/heartbeat every 10s during EXAM.
     If concurrentLoginDetected is true the session was already flagged
     server-side; we transition to the terminated screen immediately.
  ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== PHASES.EXAM || !sessionId) {
      clearInterval(heartbeatTimer.current);
      return;
    }

    const checkHeartbeat = async () => {
      try {
        const res = await api.get(`/test/sessions/${sessionId}/heartbeat`);
        const s = res.data.data;
        if (s.concurrentLoginDetected) {
          // Another device logged in — session was terminated server-side
          clearInterval(heartbeatTimer.current);
          clearInterval(detectTimer.current);
          clearInterval(noiseTimer.current);
          clearInterval(clockTimer.current);
          clearInterval(pyAnalysisTimer.current);
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          setCameraReady(false);
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          setConcurrentLoginDetected(true);
          setPhase(PHASES.TERMINATED);
        }
      } catch { /* silent — network blip does not terminate the exam */ }
    };

    heartbeatTimer.current = setInterval(checkHeartbeat, 10_000);
    return () => clearInterval(heartbeatTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sessionId]);

  /* ──────────────────────────────────────────────────────────────
     Re-attach camera stream whenever a new video element mounts
     (happens on every phase transition that renders a <video>)
  ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    if (video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
    }
    if (video.paused) video.play().catch(() => {});
  }, [phase]);

  /* ──────────────────────────────────────────────────────────────
     Add a local warning toast  (auto-dismiss 6 s)
  ────────────────────────────────────────────────────────────── */
  const pushWarning = useCallback((msg) => {
    const id = ++_warningId;
    setWarnings((w) => [{ id, msg }, ...w].slice(0, 4));
    setTimeout(() => setWarnings((w) => w.filter((x) => x.id !== id)), 6000);
  }, []);

  /* ──────────────────────────────────────────────────────────────
     Central fraud event handler — scores, logs, and auto-terminates
  ────────────────────────────────────────────────────────────── */
  const handleFraudEvent = useCallback(async (eventType, details, faceCount) => {
    const now = Date.now();
    const debounceMs = 5000;
    if ((now - (lastEventTime.current[eventType] || 0)) < debounceMs) return;
    lastEventTime.current[eventType] = now;

    const pts = FRAUD_POINTS[eventType] || 0;

    let newScore = fraudScoreRef.current;
    if (pts > 0) {
      newScore = fraudScoreRef.current + pts;
      fraudScoreRef.current = newScore;
      setFraudScore(newScore);
      setFraudCount((c) => c + 1);
      setViolationLog((v) => [...v, { eventType, pts, time: new Date().toLocaleTimeString() }]);
      const msg = EVENT_MSGS[eventType] || details || 'Suspicious activity detected.';
      pushWarning(`${msg}  (+${pts} pts)`);
    }

    const sid = sessionIdRef.current;
    if (sid) {
      try {
        await api.post(`/test/sessions/${sid}/fraud`, {
          eventType,
          details: details || EVENT_MSGS[eventType] || '',
          faceCount: faceCount ?? null,
          pointsAdded: pts,
          fraudScoreAtTime: newScore,
        });
      } catch { /* silent */ }
    }

    // Auto-terminate when threshold reached
    if (newScore >= FRAUD_THRESHOLD && !terminatingRef.current) {
      terminatingRef.current = true;
      if (sid) {
        try {
          await api.post(`/test/sessions/${sid}/fraud`, {
            eventType: 'terminated',
            details: 'Automatically terminated: fraud score reached 100',
            pointsAdded: 0,
            fraudScoreAtTime: newScore,
          });
        } catch {}
      }
      clearInterval(detectTimer.current);
      clearInterval(noiseTimer.current);
      clearInterval(clockTimer.current);
      clearInterval(pyAnalysisTimer.current);
      clearInterval(heartbeatTimer.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraReady(false);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setPhase(PHASES.TERMINATED);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushWarning]);

  /* ──────────────────────────────────────────────────────────────
     Pre-test calibration (5 fixed dots)
  ────────────────────────────────────────────────────────────── */
  const handleCalibrationDotClick = useCallback((dotId) => {
    if (phaseRef.current !== PHASES.CALIBRATE) return;

    setCalibrationClickedDots((prev) => {
      if (prev.includes(dotId)) return prev;
      const updated = [...prev, dotId];
      if (updated.length === CALIBRATION_DOTS.length) {
        setTimeout(() => setPhase(PHASES.EXAM), 250);
      }
      return updated;
    });
  }, []);

  /* ──────────────────────────────────────────────────────────────
     Camera helpers
  ────────────────────────────────────────────────────────────── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
      return true;
    } catch {
      setCameraReady(false);
      setFaceStatus('off');
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  /* ──────────────────────────────────────────────────────────────
     Microphone / noise detection helpers
  ────────────────────────────────────────────────────────────── */
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setMicReady(true);
      return true;
    } catch {
      setMicReady(false);
      return false;
    }
  }, []);

  const stopMic = useCallback(() => {
    clearInterval(noiseTimer.current);
    analyserRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setMicReady(false);
    setMicLevel(0);
  }, []);

  const startNoiseDetection = useCallback(() => {
    const NOISE_THRESHOLD = 32;
    noiseTimer.current = setInterval(() => {
      const analyser = analyserRef.current;
      if (!analyser) return;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buf);
      const rms = Math.sqrt(buf.reduce((sum, v) => sum + v * v, 0) / buf.length);
      setMicLevel(Math.min(100, Math.round((rms / 128) * 100)));
      if (rms > NOISE_THRESHOLD && phaseRef.current === PHASES.EXAM) {
        handleFraudEvent('noise_detected', `Noise RMS: ${rms.toFixed(1)}`);
      }
    }, 1500);
  }, [handleFraudEvent]);

  /* ──────────────────────────────────────────────────────────────
     Face + head-pose detection loop  (every 2 s)
     Uses face-api.js TinyFaceDetector + 68-point landmark model.
  ────────────────────────────────────────────────────────────── */
  const startDetection = useCallback(() => {
    if (!modelsReady) return;

    detectTimer.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || !streamRef.current) {
        setFaceStatus('off');
        setHeadPoseDir('unknown');
        lookAwayStartRef.current = null;
        handleFraudEvent('camera_disabled', 'Camera stream lost');
        return;
      }
      try {
        // detectAllFaces().withFaceLandmarks(true) uses the tiny 68-point model
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4, inputSize: 160 }))
          .withFaceLandmarks(true);

        const n = detections.length;

        if (n === 0) {
          setFaceStatus('none');
          setHeadPoseDir('unknown');
          lookAwayStartRef.current = null;
          handleFraudEvent('no_face', 'No face detected', 0);
        } else if (n > 1) {
          setFaceStatus('multiple');
          setHeadPoseDir('unknown');
          lookAwayStartRef.current = null;
          handleFraudEvent('multiple_faces', `${n} faces detected`, n);
        } else {
          setFaceStatus('ok');

          // ── Head pose estimation ──────────────────────────────
          const pose = estimateHeadPose(detections[0].landmarks);
          setHeadPoseDir(pose.direction);

          if (pose.direction !== 'straight') {
            // Start or accumulate the look-away timer
            if (!lookAwayStartRef.current) {
              lookAwayStartRef.current = Date.now();
            } else {
              const awayMs = Date.now() - lookAwayStartRef.current;
              if (awayMs >= 5000) {
                // Student has been looking away for 5+ continuous seconds
                const evType = pose.direction === 'head_turned_away'
                  ? 'head_turned_away'
                  : `looking_${pose.direction}`;
                handleFraudEvent(
                  evType,
                  `Looking ${pose.direction.replace('_', ' ')} for ${Math.round(awayMs / 1000)}s`,
                );
                lookAwayStartRef.current = Date.now(); // reset; keep tracking
              }
            }
          } else {
            // Back to straight — reset look-away timer
            lookAwayStartRef.current = null;
          }
        }
      } catch {
        setFaceStatus('off');
      }
    }, 2000);
  }, [modelsReady, handleFraudEvent]);

  /* Start face + head-pose detection when exam goes live */
  useEffect(() => {
    if (phase === PHASES.EXAM && modelsReady && cameraReady) {
      startDetection();
    }
    return () => clearInterval(detectTimer.current);
  }, [phase, modelsReady, cameraReady, startDetection]);

  /* ──────────────────────────────────────────────────────────────
     Periodic Python-service analysis (every 10 s, best-effort)
     Captures a video frame, sends to Node → Python for deep analysis.
     Falls back silently if the Python service is not running.
  ────────────────────────────────────────────────────────────── */
  const startPyAnalysis = useCallback(() => {
    pyAnalysisTimer.current = setInterval(async () => {
      const video = videoRef.current;
      const sid   = sessionIdRef.current;
      if (!video || !streamRef.current || !sid) return;

      try {
        // Capture current video frame to a base64 JPEG
        const canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth  || 320;
        canvas.height = video.videoHeight || 240;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = canvas.toDataURL('image/jpeg', 0.6);

        const res = await api.post('/test/proctoring/analyze', { frame, sessionId: sid });
        const data = res.data?.data;

        // If Python service flagged violations, log them locally too
        if (data?.violations?.length) {
          for (const v of data.violations) {
            if (v.type && FRAUD_POINTS[v.type]) {
              await handleFraudEvent(v.type, v.message || '');
            }
          }
        }
      } catch { /* silent — Python service may not be running */ }
    }, 10000);
  }, [handleFraudEvent]);

  useEffect(() => {
    if (phase === PHASES.EXAM && modelsReady && cameraReady) {
      startPyAnalysis();
    }
    return () => clearInterval(pyAnalysisTimer.current);
  }, [phase, modelsReady, cameraReady, startPyAnalysis]);

  /* Start noise detection when exam goes live */
  useEffect(() => {
    if (phase === PHASES.EXAM && micReady) {
      startNoiseDetection();
    }
    return () => clearInterval(noiseTimer.current);
  }, [phase, micReady, startNoiseDetection]);

  useEffect(() => {
    if (phase !== PHASES.CALIBRATE) {
      setCalibrationClickedDots([]);
    }
  }, [phase]);

  /* ──────────────────────────────────────────────────────────────
     Fullscreen + visibility + focus + keyboard + context-menu
  ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const onFsChange = () => {
      const inFs = !!document.fullscreenElement;
      setIsFullscreen(inFs);
      if (!inFs && phaseRef.current === PHASES.EXAM) {
        handleFraudEvent('fullscreen_exit', 'Student exited fullscreen');
        // Do NOT auto-re-enter; the pause overlay lets the student return manually
      }
    };

    // Tab switch — browser tab hidden (Ctrl+Tab, clicking another tab)
    const onVisibility = () => {
      if (document.hidden && phaseRef.current === PHASES.EXAM) {
        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);
        setShowTabWarning(true);
        handleFraudEvent(
          'tab_switch',
          `Tab switch #${tabSwitchCountRef.current} — student left exam tab`,
        );
      }
    };

    // Window blur — application-level focus loss (Alt+Tab, clicking taskbar, etc.)
    // Only fires when document is still visible (tab switch already handled above)
    const onWindowBlur = () => {
      if (phaseRef.current === PHASES.EXAM && !document.hidden) {
        tabSwitchCountRef.current += 1;
        setTabSwitchCount(tabSwitchCountRef.current);
        setShowTabWarning(true);
        handleFraudEvent(
          'tab_switch',
          `Window focus lost #${tabSwitchCountRef.current} — student switched to another application`,
        );
      }
    };

    // Warn before leaving / refreshing the page during exam
    const onBeforeUnload = (e) => {
      if (phaseRef.current === PHASES.EXAM) {
        e.preventDefault();
        // Standard way to trigger browser's built-in leave confirmation
        e.returnValue = 'Leaving this page will end your exam. Are you sure?';
        return e.returnValue;
      }
    };

    // Block common devtools & view-source shortcuts
    const onKeyDown = (e) => {
      if (phaseRef.current !== PHASES.EXAM) return;
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key   = e.key.toUpperCase();
      // Block copy / paste / cut via keyboard
      if (ctrl && ['C', 'V', 'X', 'A'].includes(key)) {
        e.preventDefault();
        if (['C', 'V', 'X'].includes(key)) {
          handleFraudEvent('copy_paste', `Keyboard ${key === 'C' ? 'copy' : key === 'V' ? 'paste' : 'cut'} detected`);
        }
        return;
      }
      if (
        e.key === 'F12' ||
        (ctrl && shift && ['I', 'J', 'K'].includes(key)) ||
        (ctrl && key === 'U')
      ) {
        e.preventDefault();
        handleFraudEvent('devtools_open', 'Developer tools shortcut detected');
      }
    };

    // Block clipboard copy/cut/paste events (e.g. right-click menu, Edit menu)
    const onCopy = (e) => {
      if (phaseRef.current === PHASES.EXAM) {
        e.preventDefault();
        handleFraudEvent('copy_paste', 'Copy action detected');
      }
    };
    const onPaste = (e) => {
      if (phaseRef.current === PHASES.EXAM) {
        e.preventDefault();
        handleFraudEvent('copy_paste', 'Paste action detected');
      }
    };
    const onCut = (e) => {
      if (phaseRef.current === PHASES.EXAM) {
        e.preventDefault();
        handleFraudEvent('copy_paste', 'Cut action detected');
      }
    };
    // Prevent text selection
    const onSelectStart = (e) => {
      if (phaseRef.current === PHASES.EXAM) e.preventDefault();
    };

    // Prevent right-click context menu during exam
    const onContextMenu = (e) => {
      if (phaseRef.current === PHASES.EXAM) e.preventDefault();
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy',        onCopy);
    document.addEventListener('paste',       onPaste);
    document.addEventListener('cut',         onCut);
    document.addEventListener('selectstart', onSelectStart);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy',        onCopy);
      document.removeEventListener('paste',       onPaste);
      document.removeEventListener('cut',         onCut);
      document.removeEventListener('selectstart', onSelectStart);
    };
  }, [handleFraudEvent]);

  /* ──────────────────────────────────────────────────────────────
     Timer — paused automatically when not in fullscreen during exam
  ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    clearInterval(clockTimer.current);
    if (phase === PHASES.EXAM && isFullscreen) {
      clockTimer.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    }
    return () => clearInterval(clockTimer.current);
  }, [phase, isFullscreen]);

  /* ──────────────────────────────────────────────────────────────
     VERIFY PHASE — request camera + mic, then allow exam start
  ────────────────────────────────────────────────────────────── */
  const handleEnterVerify = async () => {
    setPhase(PHASES.VERIFY);
    setVerifyLoading(true);
    setVerifyError('');

    try {
      await Promise.all([
        // Load both face-detector and landmark models together
        Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_CDN),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_CDN),
        ]).then(() => setModelsReady(true)),
        startCamera(),
        startMic(),
      ]);
    } catch (err) {
      setVerifyError(err.message || 'Permission denied.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Live face check during verify phase
  useEffect(() => {
    if (phase !== PHASES.VERIFY || !modelsReady || !cameraReady) return;
    const id = setInterval(async () => {
      const video = videoRef.current;
      if (!video) return;
      try {
        const dets = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4, inputSize: 160 })
        );
        setVerifyFaceOk(dets.length === 1);
      } catch {
        setVerifyFaceOk(false);
      }
      setVerifyMicOk(micReady);
    }, 1500);
    return () => clearInterval(id);
  }, [phase, modelsReady, cameraReady, micReady]);

  /* ──────────────────────────────────────────────────────────────
     Start exam (called after verification passed)
  ────────────────────────────────────────────────────────────── */
  const handleStartExam = async () => {
    if (!verifyFaceOk) return;
    setPhase(PHASES.SETUP);
    setLoading(true);
    setError('');

    try {
      const qRes = await api.get('/test/questions?limit=10');
      const qs = qRes.data.data;
      if (!qs?.length) throw new Error('No questions available. Please contact faculty.');
      setQuestions(qs);

      const sRes = await api.post('/test/sessions', { questionIds: qs.map((q) => q._id) });
      const sid = sRes.data.data._id;
      setSessionId(sid);
      sessionIdRef.current = sid;

      await api.post(`/test/sessions/${sid}/fraud`, {
        eventType: 'session_start', details: 'Exam started', pointsAdded: 0, fraudScoreAtTime: 0,
      }).catch(() => {});

      try { await document.documentElement.requestFullscreen(); } catch {}

      setCalibrationClickedDots([]);
      setPhase(PHASES.CALIBRATE);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start exam.');
      setPhase(PHASES.VERIFY);
      stopCamera();
      stopMic();
    } finally {
      setLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────
     Submit exam
  ────────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!sessionId || loading) return;
    setLoading(true);

    clearInterval(detectTimer.current);
    clearInterval(noiseTimer.current);
    clearInterval(clockTimer.current);
    clearInterval(pyAnalysisTimer.current);
    clearInterval(heartbeatTimer.current);

    const payload = questions.map((q) => ({
      questionId: q._id,
      selectedOption: answers[q._id] || null,
    }));

    try {
      await api.post(`/test/sessions/${sessionId}/fraud`, {
        eventType: 'session_end', details: 'Exam submitted normally',
        pointsAdded: 0, fraudScoreAtTime: fraudScoreRef.current,
      }).catch(() => {});

      const res = await api.put(`/test/sessions/${sessionId}/submit`, { answers: payload });
      setResult(res.data.data);

      stopCamera();
      stopMic();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setPhase(PHASES.DONE);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────
     Reset everything
  ────────────────────────────────────────────────────────────── */
  const resetAll = () => {
    stopCamera();
    stopMic();
    clearInterval(detectTimer.current);
    clearInterval(noiseTimer.current);
    clearInterval(clockTimer.current);
    clearInterval(pyAnalysisTimer.current);
    clearInterval(heartbeatTimer.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setPhase(PHASES.PRE);
    setQuestions([]);
    setAnswers({});
    setCurrentIdx(0);
    setElapsed(0);
    setFraudScore(0);
    setFraudCount(0);
    fraudScoreRef.current = 0;
    terminatingRef.current = false;
    setFaceStatus('loading');
    setSessionId(null);
    setResult(null);
    setViolationLog([]);
    setHeadPoseDir('straight');
    setConcurrentLoginDetected(false);
    setTabSwitchCount(0);
    setShowTabWarning(false);
    setCalibrationClickedDots([]);
    tabSwitchCountRef.current = 0;
    lookAwayStartRef.current = null;
    setError('');
    setVerifyFaceOk(false);
    setVerifyMicOk(false);
    setVerifyError('');
    lastEventTime.current = {};
  };

  /* ──────────────────────────────────────────────────────────────
     Fraud score HUD color
  ────────────────────────────────────────────────────────────── */
  const hudColor = fraudScore < 40
    ? '#16a34a'
    : fraudScore < 70
      ? '#d97706'
      : fraudScore < 90
        ? '#ea580c'
        : '#dc2626';

  /* ──────────────────────────────────────────────────────────────
     Face status indicator helpers
  ────────────────────────────────────────────────────────────── */
  const faceDot = {
    loading:  { color: '#9ca3af', label: 'Loading…' },
    ok:       { color: '#16a34a', label: '✓ Face OK' },
    none:     { color: '#dc2626', label: '✗ No face!' },
    multiple: { color: '#d97706', label: '⚠ Multiple!' },
    off:      { color: '#dc2626', label: '✗ Camera off' },
  }[faceStatus] ?? { color: '#9ca3af', label: '…' };

  const headPoseDot = (() => {
    if (faceStatus !== 'ok') return null;
    const dirLabel = {
      straight:         { color: '#16a34a', label: '↕ Facing screen' },
      left:             { color: '#ea580c', label: '⚠ Looking left' },
      right:            { color: '#ea580c', label: '⚠ Looking right' },
      up:               { color: '#d97706', label: '⚠ Looking up' },
      down:             { color: '#d97706', label: '⚠ Looking down' },
      head_turned_away: { color: '#dc2626', label: '⚠ Head turned away' },
      unknown:          { color: '#9ca3af', label: 'Detecting…' },
    };
    return dirLabel[headPoseDir] ?? { color: '#9ca3af', label: headPoseDir };
  })();

  /* ──────────────────────────────────────────────────────────────
     Current question
  ────────────────────────────────────────────────────────────── */
  const q        = questions[currentIdx];
  const answered = Object.keys(answers).length;

  /* ══════════════════════════════════════════════════════════════
     RENDER: PRE
  ══════════════════════════════════════════════════════════════ */
  if (phase === PHASES.PRE) {
    return (
      <div>
        <div className="stu-card" style={{ maxWidth: 540 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', marginBottom: '1.25rem',
          }}>
            <Shield size={26} />
          </div>

          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 800, color: '#1a0836', letterSpacing: '-0.02em' }}>
            AI-Proctored Exam
          </h2>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
            This test is monitored by AI. By starting, you agree to the following conditions:
          </p>

          <ul style={{ margin: '0 0 1.5rem', padding: '0 0 0 1.25rem', fontSize: '0.83rem', color: '#374151', lineHeight: 2.1 }}>
            <li>Webcam &amp; microphone must remain active throughout the exam.</li>
            <li>Only <strong>one face</strong> may appear in the camera frame.</li>
            <li>Switching tabs or applications will be flagged.</li>
            <li>Exiting fullscreen mode will be flagged.</li>
            <li>Excessive background noise will be flagged.</li>
            <li>Before the exam starts, click 5 calibration dots at screen corners and center.</li>
            <li>Looking <strong>left, right, up, or down</strong> for more than 5 seconds will be flagged.</li>
            <li>Head turned <strong>completely away</strong> from the screen will be flagged.</li>
            <li>A <strong>fraud score</strong> accumulates per violation. Reaching <strong>100</strong> auto-terminates the exam.</li>
          </ul>

          {/* Fraud score reference table */}
          <div style={{
            background: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 10,
            padding: '0.875rem 1rem', marginBottom: '1.5rem',
          }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fraud Score Table
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.2rem 1rem', fontSize: '0.8rem', color: '#374151' }}>
              {Object.entries(FRAUD_POINTS).map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <span style={{ textTransform: 'capitalize', padding: '0.1rem 0' }}>{k.replace(/_/g, ' ')}</span>
                  <span style={{ fontWeight: 700, color: '#7c3aed', textAlign: 'right', padding: '0.1rem 0' }}>+{v} pts</span>
                </div>
              ))}
              <span style={{ fontWeight: 700, color: '#dc2626', padding: '0.25rem 0 0' }}>Auto-terminate threshold</span>
              <span style={{ fontWeight: 800, color: '#dc2626', textAlign: 'right', padding: '0.25rem 0 0' }}>100 pts</span>
            </div>
          </div>

          <button className="stu-btn-primary" onClick={handleEnterVerify}>
            Continue to Camera Check →
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER: VERIFY  (camera/mic gate)
  ══════════════════════════════════════════════════════════════ */
  if (phase === PHASES.VERIFY) {
    const canStart = verifyFaceOk && !verifyLoading;

    return (
      <div>
        <div className="stu-card" style={{ maxWidth: 560 }}>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#1a0836' }}>
            Camera &amp; Microphone Check
          </h2>
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: '#6b7280' }}>
            Position your face in the centre of the frame. The exam will not start until camera verification passes.
          </p>

          {/* Live camera preview */}
          <div style={{
            position: 'relative', borderRadius: 14, overflow: 'hidden',
            background: '#0f0f1a', marginBottom: '1rem',
            border: `2px solid ${verifyFaceOk ? '#16a34a' : '#e5e7eb'}`,
            boxShadow: verifyFaceOk ? '0 0 0 3px #bbf7d0' : 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}>
            <video
              ref={videoRef}
              autoPlay muted playsInline
              style={{ width: '100%', maxHeight: 240, display: 'block', transform: 'scaleX(-1)' }}
            />
            {verifyLoading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 10, color: '#fff',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  animation: 'stu-spin 0.8s linear infinite',
                }} />
                <span style={{ fontSize: '0.8rem' }}>Initialising…</span>
              </div>
            )}
            {!verifyLoading && (
              <div style={{
                position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.72)', borderRadius: 999, padding: '4px 14px',
                display: 'flex', alignItems: 'center', gap: 7, color: '#fff', fontSize: '0.78rem',
                whiteSpace: 'nowrap',
              }}>
                <span style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: verifyFaceOk ? '#16a34a' : '#dc2626', flexShrink: 0,
                }} />
                {verifyFaceOk ? "1 face detected — you're ready" : 'Position face in frame…'}
              </div>
            )}
          </div>

          {/* Status checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { ok: cameraReady,  icon: <Camera size={15} />,  label: 'Camera active' },
              { ok: verifyFaceOk, icon: <Eye size={15} />,     label: 'Face detected' },
              { ok: micReady,     icon: <Mic size={15} />,     label: 'Microphone active', optional: true },
            ].map(({ ok, icon, label, optional }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                fontSize: '0.83rem',
                color: ok ? '#16a34a' : optional ? '#d97706' : '#dc2626',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: ok ? '#dcfce7' : optional ? '#fef3c7' : '#fee2e2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {ok ? <CheckCircle size={13} /> : icon}
                </span>
                {label}
                {optional && !ok && (
                  <span style={{ color: '#9ca3af', fontSize: '0.73rem' }}>(optional — noise detection disabled)</span>
                )}
              </div>
            ))}

            {/* Mic level bar */}
            {micReady && (
              <div style={{ paddingLeft: '1.75rem' }}>
                <div style={{ height: 4, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden', maxWidth: 200 }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    background: micLevel > 60 ? '#dc2626' : micLevel > 30 ? '#d97706' : '#16a34a',
                    width: `${micLevel}%`, transition: 'width 0.2s ease',
                  }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Mic level</span>
              </div>
            )}
          </div>

          {verifyError && (
            <div className="stu-alert stu-alert-warn" style={{ marginBottom: '1rem' }}>
              <AlertTriangle size={14} />
              <span>{verifyError}</span>
            </div>
          )}
          {error && (
            <div className="stu-alert stu-alert-warn" style={{ marginBottom: '1rem' }}>
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="stu-btn-primary"
              onClick={handleStartExam}
              disabled={!canStart || loading}
              style={{ opacity: (!canStart || loading) ? 0.55 : 1 }}
            >
              {loading ? 'Starting…' : 'Start Calibration'}
            </button>
            <button
              className="stu-btn-secondary"
              onClick={() => { stopCamera(); stopMic(); setPhase(PHASES.PRE); }}
              disabled={loading}
            >
              ← Back
            </button>
          </div>
        </div>
        <style>{`@keyframes stu-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER: SETUP
  ══════════════════════════════════════════════════════════════ */
  if (phase === PHASES.SETUP) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: 300, gap: '1rem',
      }}>
        <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          border: '4px solid #ede9fe', borderTopColor: '#7c3aed',
          animation: 'stu-spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#7c3aed', fontWeight: 600, fontSize: '0.95rem' }}>
          Preparing exam environment…
        </p>
        <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
          Loading questions and preparing your calibration step.
        </p>
        <style>{`@keyframes stu-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER: CALIBRATE
  ══════════════════════════════════════════════════════════════ */
  if (phase === PHASES.CALIBRATE) {
    const completed = calibrationClickedDots.length;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0f172a' }}>
        <video ref={videoRef} autoPlay muted playsInline style={{ display: 'none' }} />

        <div style={{
          position: 'absolute',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 12,
          padding: '0.85rem 1rem',
          textAlign: 'center',
          minWidth: 320,
          border: '1px solid #e2e8f0',
        }}>
          <p style={{ margin: 0, fontSize: '0.86rem', color: '#0f172a', fontWeight: 700 }}>
            Pre-test Calibration: Click all 5 dots (corners + center)
          </p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
            Completed: {completed}/{CALIBRATION_DOTS.length} · exam starts automatically after all are clicked
          </p>
        </div>

        {CALIBRATION_DOTS.map((dot) => {
          const clicked = calibrationClickedDots.includes(dot.id);
          return (
            <button
              key={dot.id}
              type="button"
              onClick={() => handleCalibrationDotClick(dot.id)}
              disabled={clicked}
              aria-label={`Calibration dot ${dot.id}`}
              style={{
                position: 'absolute',
                top: dot.top,
                left: dot.left,
                transform: 'translate(-50%, -50%)',
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '2px solid #ffffff',
                background: clicked ? '#22c55e' : '#f59e0b',
                boxShadow: clicked
                  ? '0 0 0 4px rgba(34,197,94,0.25)'
                  : '0 0 0 5px rgba(245,158,11,0.3)',
                cursor: clicked ? 'default' : 'pointer',
                zIndex: 10002,
                transition: 'all 0.15s ease',
              }}
            />
          );
        })}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER: TERMINATED
  ══════════════════════════════════════════════════════════════ */
  if (phase === PHASES.TERMINATED) {
    // ── Concurrent login variant ──────────────────────────────────
    if (concurrentLoginDetected) {
      return (
        <div>
          <div className="stu-card" style={{ maxWidth: 540, textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: '#fff7ed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <Shield size={36} color="#ea580c" />
            </div>

            <h2 style={{ margin: '0 0 0.375rem', fontSize: '1.35rem', fontWeight: 800, color: '#ea580c' }}>
              Session Terminated — Concurrent Login Detected
            </h2>
            <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
              A login was detected from{' '}
              <strong style={{ color: '#ea580c' }}>another device or browser</strong> while
              your quiz was in progress. Your session has been automatically flagged and
              terminated. This incident has been logged and will be reviewed by faculty.
            </p>

            <div style={{
              background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 12,
              padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left',
            }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                What happened?
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.825rem', color: '#78350f', lineHeight: 1.65 }}>
                <li>Your account was signed in on a second device while this quiz was active.</li>
                <li>The system treats this as a potential academic integrity violation.</li>
                <li>Your answers up to this point were not saved.</li>
                <li>Please contact your faculty if you believe this was an error.</li>
              </ul>
            </div>

            <button className="stu-btn-secondary" onClick={resetAll}>
              <RotateCcw size={14} />
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    // ── Normal fraud-score termination variant ─────────────────────
    return (
      <div>
        <div className="stu-card" style={{ maxWidth: 540, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            <XCircle size={36} color="#dc2626" />
          </div>

          <h2 style={{ margin: '0 0 0.375rem', fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>
            Exam Terminated
          </h2>
          <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
            Your exam was automatically terminated because the fraud score reached{' '}
            <strong style={{ color: '#dc2626' }}>100 points</strong>. This session has been logged and will be reviewed by faculty.
          </p>

          {/* Final fraud score */}
          <div style={{
            background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 12,
            padding: '1rem 1.25rem', marginBottom: '1.25rem',
          }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>
              {fraudScoreRef.current}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: 4 }}>Final Fraud Score</div>
          </div>

          {violationLog.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Violations Detected
              </p>
              {violationLog.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.35rem 0.75rem', marginBottom: '0.3rem',
                  background: '#fef2f2', borderRadius: 8, fontSize: '0.8rem',
                }}>
                  <span style={{ color: '#374151', textTransform: 'capitalize' }}>
                    {v.eventType.replace(/_/g, ' ')}
                  </span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>+{v.pts} pts · {v.time}</span>
                </div>
              ))}
            </div>
          )}

          <button className="stu-btn-secondary" onClick={resetAll}>
            <RotateCcw size={14} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER: DONE  (results)
  ══════════════════════════════════════════════════════════════ */
  if (phase === PHASES.DONE && result) {
    const pct    = result.percentageScore ?? 0;
    const passed = pct >= 50;

    return (
      <div>
        <div className="stu-card" style={{ maxWidth: 520, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: passed ? '#d1fae5' : '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem',
          }}>
            {passed
              ? <Award size={32} color="#059669" />
              : <AlertTriangle size={32} color="#dc2626" />}
          </div>

          <h2 style={{ margin: '0 0 0.375rem', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {passed ? 'Test Completed! 🎉' : 'Test Submitted'}
          </h2>
          <p style={{ margin: '0 0 1.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
            {passed ? 'Great effort! Your results are saved.' : 'Keep practising. You can do better!'}
          </p>

          {/* Score ring */}
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: `conic-gradient(${passed ? '#7c3aed' : '#ef4444'} ${pct * 3.6}deg, #f3f4f6 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', position: 'relative',
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%', background: '#fff',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a0836', lineHeight: 1 }}>{pct}%</span>
              <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 500 }}>score</span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Score',      value: `${result.score}/${result.totalMarks}` },
              { label: 'Duration',   value: `${Math.round((result.duration || 0) / 60)} min` },
              { label: 'Fraud pts',  value: fraudScoreRef.current },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: '#f9f8fd', borderRadius: 10, padding: '0.75rem 0.5rem',
              }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a0836' }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{label}</div>
              </div>
            ))}
          </div>

          {result.status === 'flagged' && (
            <div className="stu-alert stu-alert-warn" style={{ marginBottom: '1rem' }}>
              <AlertTriangle size={14} />
              <span>This session has been flagged for faculty review.</span>
            </div>
          )}

          <button className="stu-btn-secondary" onClick={resetAll}>
            <RotateCcw size={14} />
            Take Another Test
          </button>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     RENDER: EXAM
  ══════════════════════════════════════════════════════════════ */
  if (phase === PHASES.EXAM) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#f8f7ff', overflowY: 'auto',
      }}>

        {/* ── Tab-switch / window-focus warning overlay ── */}
        {showTabWarning && isFullscreen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            background: 'rgba(15,0,30,0.93)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff', borderRadius: 20, padding: '2.5rem',
              textAlign: 'center', maxWidth: 440, margin: '1rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              border: '3px solid #dc2626',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#fee2e2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <AlertTriangle size={34} color="#dc2626" />
              </div>
              <h2 style={{ margin: '0 0 0.5rem', color: '#dc2626', fontSize: '1.25rem', fontWeight: 800 }}>
                Tab Switch Detected!
              </h2>
              <p style={{ color: '#4b5563', fontSize: '0.875rem', lineHeight: 1.65, margin: '0 0 0.75rem' }}>
                You switched away from the exam window. This violation has been{' '}
                <strong style={{ color: '#dc2626' }}>logged as academic fraud</strong>{' '}
                and added to your proctoring record.
              </p>
              <div style={{
                background: '#fff5f5', border: '1px solid #fecaca',
                borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem',
              }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>
                  {tabSwitchCount}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 2 }}>
                  tab switch{tabSwitchCount !== 1 ? 'es' : ''} recorded this session
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0 0 1.25rem' }}>
                Repeated violations will result in automatic exam termination.
              </p>
              <button
                className="stu-btn-primary"
                onClick={() => setShowTabWarning(false)}
                style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
              >
                I Understand — Return to Exam
              </button>
            </div>
          </div>
        )}

        {/* ── Fullscreen enforcement overlay ── */}
        {!isFullscreen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.88)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: '#fff', borderRadius: 20, padding: '2.5rem',
              textAlign: 'center', maxWidth: 420, margin: '1rem',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}>
                <Maximize2 size={32} color="#dc2626" />
              </div>
              <h2 style={{ margin: '0 0 0.5rem', color: '#dc2626', fontSize: '1.3rem', fontWeight: 800 }}>
                Exam Paused
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                You exited fullscreen mode. The exam is paused and this violation has been logged.
                Please return to fullscreen to continue.
              </p>
              <button
                className="stu-btn-primary"
                onClick={() => document.documentElement.requestFullscreen().catch(() => {})}
                style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
              >
                <Maximize2 size={15} /> Return to Fullscreen
              </button>
            </div>
          </div>
        )}

        {/* ── Exam content ── */}
        <div style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Left: question panel ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

          {/* Fraud warning toasts */}
          {warnings.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              {warnings.map(({ id, msg }) => (
                <div key={id} className="stu-alert stu-alert-warn" style={{ marginBottom: '0.4rem' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem' }}>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Question progress bar */}
          <div style={{
            background: '#ede9fe', borderRadius: 999, height: 6,
            marginBottom: '1.25rem', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
              width: `${((currentIdx + 1) / questions.length) * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Question card */}
          {q && (
            <div className="stu-card" style={{ marginBottom: '1rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: '1.25rem', gap: '0.75rem',
              }}>
                <span style={{
                  background: '#ede9fe', color: '#7c3aed',
                  padding: '0.25rem 0.625rem', borderRadius: 999,
                  fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {q.subject}
                </span>
                <span style={{ color: '#9ca3af', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> {fmt(elapsed)} · Q {currentIdx + 1}/{questions.length}
                </span>
              </div>

              <p style={{
                fontSize: '1rem', fontWeight: 600, color: '#1a0836',
                lineHeight: 1.6, margin: '0 0 1.5rem',
              }}>
                {q.text}
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {q.options.map((opt) => {
                  const selected = answers[q._id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setAnswers((a) => ({ ...a, [q._id]: opt.id }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.875rem',
                        padding: '0.875rem 1rem',
                        border: `2px solid ${selected ? '#7c3aed' : '#e8e4f3'}`,
                        borderRadius: 10,
                        background: selected ? '#f5f3ff' : '#fff',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.12s', fontFamily: 'inherit',
                      }}
                    >
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 700,
                        background: selected ? '#7c3aed' : '#f3f0fb',
                        color: selected ? '#fff' : '#7c3aed',
                        transition: 'all 0.12s',
                      }}>
                        {opt.id}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#1a0836', lineHeight: 1.5 }}>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  className="stu-btn-secondary"
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                >
                  <ChevronLeft size={15} /> Previous
                </button>
                {currentIdx < questions.length - 1 ? (
                  <button className="stu-btn-primary" onClick={() => setCurrentIdx((i) => i + 1)}>
                    Next <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    className="stu-btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
                  >
                    {loading ? 'Submitting…' : <><Send size={14} /> Submit Exam</>}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Question navigator grid */}
          <div className="stu-card">
            <h4 style={{ margin: '0 0 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Question Navigator
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {questions.map((_, i) => {
                const isAnswered = !!answers[questions[i]._id];
                const isCurrent  = i === currentIdx;
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    style={{
                      width: 34, height: 34, borderRadius: 8,
                      border: `2px solid ${isCurrent ? '#7c3aed' : isAnswered ? '#7c3aed' : '#e8e4f3'}`,
                      background: isCurrent ? '#7c3aed' : isAnswered ? '#ede9fe' : '#fff',
                      color: isCurrent ? '#fff' : isAnswered ? '#7c3aed' : '#9ca3af',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.1s', fontFamily: 'inherit',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.775rem', color: '#9ca3af' }}>
              Answered {answered} / {questions.length}
            </p>
          </div>
        </div>

        {/* ── Right: proctoring HUD ── */}
        <div style={{ width: 240, flexShrink: 0 }}>

          {/* Timer */}
          <div className="stu-card" style={{ marginBottom: '0.875rem', textAlign: 'center' }}>
            <Clock size={16} color="#7c3aed" style={{ margin: '0 auto 0.375rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1a0836', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
              {fmt(elapsed)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 }}>Time elapsed</div>
          </div>

          {/* Webcam feed */}
          <div className="stu-card" style={{ marginBottom: '0.875rem', padding: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151' }}>Webcam</span>
              {cameraReady ? <Camera size={13} color="#059669" /> : <CameraOff size={13} color="#dc2626" />}
            </div>
            <div style={{ background: '#111', borderRadius: 8, overflow: 'hidden', aspectRatio: '4/3', position: 'relative' }}>
              <video
                ref={videoRef}
                autoPlay muted playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
              {!cameraReady && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
                }}>
                  <CameraOff size={24} color="#9ca3af" />
                  <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>No camera</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.625rem' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: faceDot.color, flexShrink: 0,
                boxShadow: `0 0 5px ${faceDot.color}`,
              }} />
              <span style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 500 }}>
                {faceDot.label}
              </span>
            </div>
            {headPoseDot && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.35rem' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: headPoseDot.color,
                  boxShadow: `0 0 5px ${headPoseDot.color}`,
                }} />
                <span style={{ fontSize: '0.72rem', color: '#374151', fontWeight: 500 }}>
                  {headPoseDot.label}
                </span>
              </div>
            )}
          </div>

          {/* Fraud score HUD */}
          <div className="stu-card" style={{ marginBottom: '0.875rem', padding: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Activity size={12} color="#7c3aed" /> Fraud Score
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: hudColor }}>{fraudScore}</span>
            </div>
            <div style={{ background: '#f3f4f6', borderRadius: 999, height: 7, overflow: 'hidden', marginBottom: '0.35rem' }}>
              <div style={{
                height: '100%', borderRadius: 999,
                background: hudColor,
                width: `${Math.min(100, fraudScore)}%`,
                transition: 'width 0.4s ease, background 0.4s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#9ca3af' }}>
              <span>0</span>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>100 → terminate</span>
            </div>
            {fraudScore >= 70 && (
              <p style={{ margin: '0.45rem 0 0', fontSize: '0.72rem', color: hudColor, fontWeight: 700, lineHeight: 1.4 }}>
                ⚠ High fraud score — reduce violations!
              </p>
            )}
            {fraudCount > 0 && (
              <div style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid #f3f4f6', fontSize: '0.72rem', color: '#6b7280' }}>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>{fraudCount}</span> violation{fraudCount !== 1 ? 's' : ''} logged
              </div>
            )}
          </div>

          {/* Mic level */}
          {micReady && (
            <div className="stu-card" style={{ marginBottom: '0.875rem', padding: '0.625rem 0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: '0.375rem' }}>
                <Volume2 size={12} color="#7c3aed" />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mic Level</span>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 999, width: `${micLevel}%`,
                  background: micLevel > 60 ? '#dc2626' : micLevel > 30 ? '#d97706' : '#16a34a',
                  transition: 'width 0.2s ease, background 0.3s',
                }} />
              </div>
            </div>
          )}

          {/* Security indicators */}
          <div className="stu-card" style={{ padding: '0.875rem', marginBottom: '0.875rem' }}>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Security
            </h4>
            {[
              { label: 'Fullscreen', ok: isFullscreen,        icon: Maximize2 },
              { label: 'Camera',     ok: cameraReady,         icon: cameraReady ? Camera : CameraOff },
              { label: 'Face Check', ok: faceStatus === 'ok', icon: faceStatus === 'ok' ? Eye : EyeOff },
              { label: 'Microphone', ok: micReady,            icon: micReady ? Mic : MicOff },
            ].map(({ label, ok, icon: Icon }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f3f0fb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Icon size={13} color={ok ? '#059669' : '#dc2626'} />
                  <span style={{ fontSize: '0.78rem', color: '#374151' }}>{label}</span>
                </div>
                {ok
                  ? <CheckCircle size={13} color="#059669" />
                  : <AlertTriangle size={13} color="#dc2626" />}
              </div>
            ))}
          </div>

          {/* Submit shortcut */}
          <button
            className="stu-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', justifyContent: 'center',
              background: 'linear-gradient(135deg, #059669, #047857)',
              boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
            }}
          >
            <Send size={14} />
            {loading ? 'Submitting…' : 'Submit Exam'}
          </button>
        </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TakeTest;
