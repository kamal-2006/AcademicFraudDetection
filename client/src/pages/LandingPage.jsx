import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  ChartNoAxesCombined,
  FileSearch,
  GraduationCap,
  Lock,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

const featureItems = [
  {
    title: 'Plagiarism Detection',
    description:
      'Detect copied content using AI-driven semantic similarity and pattern analysis.',
    icon: FileSearch,
  },
  {
    title: 'AI-Based Exam Proctoring',
    description:
      'Monitor suspicious behavior in real time with face, motion, and activity tracking.',
    icon: ScanFace,
  },
  {
    title: 'Certificate Verification',
    description:
      'Validate uploaded certificates with secure metadata checks and document integrity scans.',
    icon: ShieldCheck,
  },
  {
    title: 'Fraud Detection System',
    description:
      'Aggregate signals across attendance, exams, and submissions to flag anomalies.',
    icon: ShieldAlert,
  },
  {
    title: 'Real-Time Alerts',
    description:
      'Notify faculty and admins instantly when suspicious activity crosses risk thresholds.',
    icon: BellRing,
  },
  {
    title: 'Analytics Dashboard',
    description:
      'Visualize trends, risk scores, and incidents to support transparent decisions.',
    icon: ChartNoAxesCombined,
  },
];

const workSteps = [
  {
    title: 'User Registration',
    description: 'Students and staff register with role-based secure onboarding.',
    icon: UserCheck,
  },
  {
    title: 'Login & Dashboard Access',
    description: 'Users access personalized dashboards with controlled permissions.',
    icon: Lock,
  },
  {
    title: 'Perform Activities',
    description: 'Assignments, exams, and certificate uploads are submitted normally.',
    icon: GraduationCap,
  },
  {
    title: 'Fraud Detection Processing',
    description: 'AI models evaluate behavioral and content signals continuously.',
    icon: ShieldAlert,
  },
  {
    title: 'Alerts & Reports Generation',
    description: 'The system generates actionable alerts, evidence, and audit-ready reports.',
    icon: BellRing,
  },
];

const useRevealOnScroll = () => {
  useEffect(() => {
    const elements = document.querySelectorAll('[data-reveal]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);
};

function LandingPage() {
  const [isSticky, setIsSticky] = useState(false);

  const year = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const onScroll = () => {
      setIsSticky(window.scrollY > 12);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useRevealOnScroll();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-300/30">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.22),_transparent_48%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.24),_transparent_40%),linear-gradient(160deg,_#020617,_#0f172a_42%,_#111827)]" />

      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          isSticky
            ? 'border-white/20 bg-slate-950/90 shadow-xl shadow-slate-950/20 backdrop-blur-xl'
            : 'border-transparent bg-transparent'
        }`}
      >
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a href="#top" className="text-base font-semibold tracking-tight text-white md:text-lg">
            Intelligent Academic Fraud Detection System
          </a>

          <div className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
            <a href="#features" className="transition hover:text-cyan-300">Features</a>
            <a href="#how-it-works" className="transition hover:text-cyan-300">How It Works</a>
            <a href="#about" className="transition hover:text-cyan-300">About</a>
            <a href="#cta" className="transition hover:text-cyan-300">Start</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-cyan-300/50 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-300/10"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:scale-105 hover:from-cyan-300 hover:to-blue-400"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main id="top" className="mx-auto w-full max-w-7xl px-5 pb-20 pt-10 md:px-8 md:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div data-reveal className="reveal-fade space-y-6">
            <p className="inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-200/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100">
              AI Security For Education
            </p>
            <h1 className="text-balance text-4xl font-bold leading-tight text-white md:text-6xl">
              Intelligent Academic Fraud Detection System
            </h1>
            <p className="max-w-xl text-base text-slate-300 md:text-lg">
              Ensuring academic integrity using AI-powered monitoring and fraud detection.
              Built for institutions that need transparency, automation, and trust at scale.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5 hover:from-cyan-300 hover:to-blue-400"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:bg-cyan-200/10"
              >
                Login
              </Link>
            </div>
          </div>

          <div data-reveal className="reveal-fade relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-cyan-400/20 via-blue-500/10 to-teal-300/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-900/20">
              <svg
                viewBox="0 0 600 420"
                className="h-auto w-full"
                role="img"
                aria-label="AI-powered academic fraud monitoring illustration"
              >
                <defs>
                  <linearGradient id="cardGradient" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.18" />
                  </linearGradient>
                </defs>
                <rect x="35" y="30" width="530" height="360" rx="26" fill="#0b1220" stroke="#334155" />
                <rect x="62" y="62" width="210" height="135" rx="18" fill="url(#cardGradient)" stroke="#67e8f9" />
                <rect x="290" y="62" width="248" height="55" rx="12" fill="#172554" stroke="#60a5fa" />
                <rect x="290" y="132" width="248" height="55" rx="12" fill="#0f172a" stroke="#1d4ed8" />
                <circle cx="165" cy="278" r="68" fill="#042f2e" stroke="#2dd4bf" />
                <circle cx="165" cy="278" r="38" fill="#0f766e" stroke="#5eead4" />
                <path d="M376 250h132M376 282h132M376 314h85" stroke="#7dd3fc" strokeWidth="9" strokeLinecap="round" />
                <path d="M84 110h140M84 132h108" stroke="#cffafe" strokeWidth="9" strokeLinecap="round" />
                <path d="M320 92h178" stroke="#bfdbfe" strokeWidth="7" strokeLinecap="round" />
              </svg>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                  Proctoring status: <span className="font-semibold text-cyan-300">Live</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                  Risk score: <span className="font-semibold text-teal-300">Low</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                  Integrity checks: <span className="font-semibold text-blue-300">Verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="pt-24">
          <div data-reveal className="reveal-fade mb-10 text-center">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Powerful Features</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              Built to protect academic workflows from assignment submission to exam completion.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureItems.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                data-reveal
                className="reveal-fade group rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg shadow-slate-900/30 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:shadow-cyan-900/40"
              >
                <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/30 to-blue-500/30 text-cyan-100 transition group-hover:scale-105">
                  <Icon size={22} />
                </span>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="pt-24">
          <div data-reveal className="reveal-fade mb-10 text-center">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">How It Works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-300">
              A transparent, role-based process that keeps monitoring automated and actionable.
            </p>
          </div>

          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {workSteps.map(({ title, description, icon: Icon }, index) => (
              <li
                key={title}
                data-reveal
                className="reveal-fade rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition hover:border-cyan-300/50"
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300/20 text-sm font-bold text-cyan-200">
                    {index + 1}
                  </span>
                  <Icon size={19} className="text-teal-200" />
                </div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="about" className="pt-24">
          <div
            data-reveal
            className="reveal-fade rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-slate-800/85 p-8 md:p-12"
          >
            <h2 className="text-3xl font-semibold text-white md:text-4xl">About The System</h2>
            <p className="mt-4 max-w-3xl text-slate-300">
              The Intelligent Academic Fraud Detection System empowers institutions to uphold
              academic integrity with AI-supported automation. It improves transparency across
              evaluations, secures sensitive academic evidence, and creates reliable digital audit
              trails for faculty and administrators.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {['Academic Integrity', 'Automation', 'Transparency', 'Security'].map((item) => (
                <div key={item} className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 text-center text-sm font-medium text-cyan-50">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cta" className="pt-24">
          <div
            data-reveal
            className="reveal-fade flex flex-col items-center justify-between gap-6 rounded-3xl border border-cyan-200/20 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 p-8 text-center md:flex-row md:p-10 md:text-left"
          >
            <div>
              <h2 className="text-3xl font-semibold text-white">Start securing academic integrity today</h2>
              <p className="mt-2 text-slate-200">
                Launch a safer, more transparent academic workflow in minutes.
              </p>
            </div>
            <Link
              to="/register"
              className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              Register Now
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 px-5 py-6 text-sm text-slate-400 md:flex-row md:items-center md:px-8">
          <p>Intelligent Academic Fraud Detection System</p>
          <p>Team Integrity Labs | contact@integritylabs.edu</p>
          <p>Copyright {year}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
