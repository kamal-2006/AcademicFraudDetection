#!/usr/bin/env python3
"""
AI Proctoring Service — Face & Head Pose Detection
Uses OpenCV + MediaPipe (no GPU required).

Start:
    pip install -r requirements_proctoring.txt
    python proctoring_service.py

Endpoints:
    GET  /health        — liveness check
    POST /analyze       — analyze a base64 video frame
"""

import base64
import os
from datetime import datetime, timezone

import cv2
import mediapipe as mp
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

# ── Flask app ────────────────────────────────────────────────────
app = Flask(__name__)
CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        os.environ.get("FRONTEND_ORIGIN", ""),
    ],
)

# ── MediaPipe components ─────────────────────────────────────────
_mp_mesh = mp.solutions.face_mesh
_mp_det  = mp.solutions.face_detection

face_mesh = _mp_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=3,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
face_detector = _mp_det.FaceDetection(
    model_selection=0,          # short-range model (≤ 2 m)
    min_detection_confidence=0.5,
)

# ── Key MediaPipe landmark indices (478-point face-mesh model) ───
# Reference: https://developers.google.com/mediapipe/solutions/vision/face_landmarker
NOSE_TIP         = 4
CHIN             = 152
LEFT_EYE_OUTER   = 33    # student's right (image left for front-cam)
RIGHT_EYE_OUTER  = 263   # student's left  (image right)
FOREHEAD         = 10
NOSE_BRIDGE      = 6


# ── Helpers ──────────────────────────────────────────────────────

def _decode_image(data_url: str) -> np.ndarray | None:
    """Decode a base64 data-URL (or raw base64) to a BGR OpenCV image."""
    try:
        if "," in data_url:
            data_url = data_url.split(",", 1)[1]
        raw   = base64.b64decode(data_url)
        arr   = np.frombuffer(raw, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None


def _estimate_head_pose(face_landmarks) -> dict:
    """
    Compute yaw and pitch from MediaPipe normalised landmarks.

    Yaw  (horizontal): positive → student looking to their left
    Pitch (vertical):  low value → looking up; high value → looking down
    """
    lm = face_landmarks.landmark

    nose     = lm[NOSE_TIP]
    forehead = lm[FOREHEAD]
    chin_pt  = lm[CHIN]
    l_eye    = lm[LEFT_EYE_OUTER]
    r_eye    = lm[RIGHT_EYE_OUTER]

    face_width = abs(r_eye.x - l_eye.x)
    if face_width < 0.01:
        return {"direction": "straight", "yaw": 0.0, "pitch": 0.0}

    face_center_x = (l_eye.x + r_eye.x) / 2.0
    yaw_norm      = (nose.x - face_center_x) / (face_width * 0.5)

    face_height = abs(chin_pt.y - forehead.y)
    if face_height < 0.01:
        pitch_norm = 0.5
    else:
        eye_center_y = (l_eye.y + r_eye.y) / 2.0
        pitch_norm   = (nose.y - eye_center_y) / face_height

    # Classify direction
    YAW_SEVERE  = 0.55
    YAW_THRESH  = 0.25
    PITCH_UP    = 0.20
    PITCH_DOWN  = 0.65

    if abs(yaw_norm) > YAW_SEVERE:
        direction = "head_turned_away"
    elif abs(yaw_norm) > YAW_THRESH:
        # Front-facing camera: +yaw means nose shifts right in image = student looks left
        direction = "left" if yaw_norm > 0 else "right"
    elif pitch_norm < PITCH_UP:
        direction = "up"
    elif pitch_norm > PITCH_DOWN:
        direction = "down"
    else:
        direction = "straight"

    return {
        "direction": direction,
        "yaw":   round(float(yaw_norm),   3),
        "pitch": round(float(pitch_norm), 3),
    }


# ── Routes ───────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({
        "status":  "ok",
        "service": "proctoring",
        "version": "1.0.0",
        "ts":      datetime.now(timezone.utc).isoformat(),
    })


@app.post("/analyze")
def analyze_frame():
    """
    Analyze one video frame for face count and head pose.

    Request JSON:
        frame      str   Base64 data-URL or raw base64 image.
        sessionId  str?  (optional) session identifier for logging.

    Response JSON:
        face_count  int
        head_pose   {direction, yaw, pitch} | null
        alerts      str[]
        violations  [{type, severity, message}]
        timestamp   str  ISO-8601
    """
    body = request.get_json(force=True, silent=True) or {}
    if "frame" not in body:
        return jsonify({"error": "Missing 'frame' field"}), 400

    img = _decode_image(body["frame"])
    if img is None:
        return jsonify({"error": "Could not decode image — send a valid base64 JPEG/PNG"}), 422

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    alerts     = []
    violations = []
    head_pose  = None

    # ── 1. Count faces ──────────────────────────────────────────
    det_result = face_detector.process(rgb)
    face_count = len(det_result.detections) if det_result.detections else 0

    if face_count == 0:
        alerts.append("No face detected in frame.")
        violations.append({
            "type":     "no_face",
            "severity": "high",
            "message":  "Student's face is not visible. They may have left the workstation.",
        })

    elif face_count > 1:
        alerts.append(f"{face_count} faces detected.")
        violations.append({
            "type":     "multiple_faces",
            "severity": "high",
            "message":  f"{face_count} faces detected — possible external assistance.",
        })

    else:
        # ── 2. Head pose (face mesh, exactly 1 face) ────────────
        mesh_result = face_mesh.process(rgb)
        if mesh_result.multi_face_landmarks:
            head_pose = _estimate_head_pose(mesh_result.multi_face_landmarks[0])
            d = head_pose["direction"]

            if d == "head_turned_away":
                alerts.append("Student has turned head completely away from screen.")
                violations.append({
                    "type":     "head_turned_away",
                    "severity": "high",
                    "message":  "Head turned completely away — student is not facing the screen.",
                })
            elif d in ("left", "right"):
                alerts.append(f"Student is looking {d}.")
                violations.append({
                    "type":     f"looking_{d}",
                    "severity": "medium",
                    "message":  f"Student's gaze is directed {d} away from the screen.",
                })
            elif d in ("up", "down"):
                alerts.append(f"Student is looking {d}.")
                violations.append({
                    "type":     f"looking_{d}",
                    "severity": "low",
                    "message":  f"Student appears to be looking {d} — possible reference material.",
                })

    return jsonify({
        "face_count": face_count,
        "head_pose":  head_pose,
        "alerts":     alerts,
        "violations": violations,
        "timestamp":  datetime.now(timezone.utc).isoformat(),
    })


@app.errorhandler(404)
def not_found(_e):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": f"Internal server error: {e}"}), 500


# ── Entry point ──────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PROCTORING_PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"[Proctoring Service] Listening on http://0.0.0.0:{port}", flush=True)
    app.run(host="0.0.0.0", port=port, debug=debug)
