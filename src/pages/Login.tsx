import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map as MapIcon, ArrowRight, Github, Mail, Lock, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

// Floating particle canvas
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,179,255,${p.alpha})`;
        ctx.fill();
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,179,255,${0.15 * (1 - d / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

const FEATURES = [
  { icon: '🗺️', text: 'AI-powered skill gap analysis' },
  { icon: '📈', text: 'Personalized career roadmaps' },
  { icon: '🏆', text: 'Skill verification quizzes' },
  { icon: '🤖', text: 'Personalized Job Recommendation' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(user => { if (user && !user.error) { localStorage.setItem('isLoggedIn', 'true'); navigate('/', { replace: true }); } })
      .catch(() => { });

    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('localhost') && !event.origin.endsWith('.run.app')) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        localStorage.setItem('isLoggedIn', 'true');
        window.location.href = '/';
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('isLoggedIn', 'true');
        setSuccess(true);
        setTimeout(() => { window.location.href = '/'; }, 800);
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    try {
      const { url } = await fetch(`/api/auth/url?provider=${provider}`).then(r => r.json());
      const w = 600, h = 700;
      window.open(url, 'oauth', `width=${w},height=${h},left=${(window.outerWidth - w) / 2},top=${(window.outerHeight - h) / 2}`);
    } catch { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-white dark:bg-[#060d1f] transition-colors duration-500">

      {/* ── LEFT PANEL: Animated background + branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative p-14 overflow-hidden bg-[#060d1f]">
        <ParticleField />

        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sky-400/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative flex items-center gap-3 z-10"
        >
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
            <MapIcon size={20} className="text-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">SkillMap</span>
        </motion.div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8 }}
            className="space-y-4"
          >
            <p className="text-primary text-xs font-black uppercase tracking-[0.25em]">Your career, reimagined</p>
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Navigate your<br />
              <span className="bg-gradient-to-r from-primary to-sky-300 bg-clip-text text-transparent">
                engineering future
              </span><br />
              with AI.
            </h2>
            <p className="text-white/40 text-base leading-relaxed max-w-sm">
              Understand your skill gaps, build a personalized roadmap, and accelerate your career — all in one place.
            </p>
          </motion.div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm">
                  {f.icon}
                </div>
                <span className="text-white/60 text-sm font-medium">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="relative z-10 text-white/20 text-xs font-medium"
        >
          "The best time to map your career was yesterday.<br />The second best time is now."
        </motion.p>
      </div>

      {/* ── RIGHT PANEL: Form ── */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-navy-950 relative overflow-hidden"
      >
        {/* Subtle top-right glow */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm space-y-8 relative z-10">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
              <MapIcon size={16} className="text-white" />
            </div>
            <span className="font-black text-slate-900 dark:text-white text-lg">SkillMap</span>
          </div>

          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Continue your engineering story</p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Email</label>
              <motion.div
                animate={{ scale: focusedField === 'email' ? 1.01 : 1 }}
                className="relative"
              >
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" size={16}
                  style={{ color: focusedField === 'email' ? 'var(--color-primary)' : '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
                {focusedField === 'email' && (
                  <motion.div layoutId="inputHighlight" className="absolute inset-0 rounded-xl ring-2 ring-primary/20 pointer-events-none" />
                )}
              </motion.div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Password</label>
              <motion.div
                animate={{ scale: focusedField === 'password' ? 1.01 : 1 }}
                className="relative"
              >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors" size={16}
                  style={{ color: focusedField === 'password' ? 'var(--color-primary)' : '#94a3b8' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </motion.div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || success}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden bg-primary text-white font-black py-4 rounded-xl shadow-xl shadow-primary/25 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.span key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <CheckCircle2 size={18} /> Signed in!
                  </motion.span>
                ) : loading ? (
                  <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Signing in…
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 group">
                    Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </motion.span>
                )}
              </AnimatePresence>
              {/* shimmer overlay */}
              {!loading && !success && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'linear', repeatDelay: 1.5 }}
                />
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-white/5" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-navy-950 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">or</span>
            </div>
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'GitHub', icon: Github, provider: 'github' as const },
              {
                label: 'Google', icon: () => (
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                ), provider: 'google' as const
              },
            ].map(({ label, icon: Icon, provider }) => (
              <motion.button
                key={provider}
                onClick={() => handleOAuth(provider)}
                disabled={loading}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2.5 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-sm shadow-sm transition-all disabled:opacity-50"
              >
                <Icon size={16} />
                {label}
              </motion.button>
            ))}
          </div>

          <p className="text-center text-sm text-slate-500">
            No account?{' '}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Create one free <Sparkles className="inline" size={12} />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
