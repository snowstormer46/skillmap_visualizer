import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map as MapIcon, ArrowRight, Github, Mail, Lock, User, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

/* ─── Spinning Wire-frame Globe Canvas ─── */
function SpinningGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let angle = 0;
    let raf: number;

    const R = Math.min(W, H) * 0.46;  // bigger
    const LAT_N = 18;   // more latitude lines
    const LON_N = 24;   // more longitude lines
    const TILT = 23.5 * (Math.PI / 180); // Earth-like axial tilt

    const project3D = (lat: number, lon: number): { x: number; y: number; z: number } => {
      const x0 = Math.cos(lat) * Math.cos(lon);
      const y0 = Math.sin(lat);
      const z0 = Math.cos(lat) * Math.sin(lon);
      // Apply rotation around y-axis (spin) then tilt around z-axis
      const xR = x0 * Math.cos(angle) - z0 * Math.sin(angle);
      const yR = y0;
      const zR = x0 * Math.sin(angle) + z0 * Math.cos(angle);
      // Tilt
      const xT = xR;
      const yT = yR * Math.cos(TILT) - zR * Math.sin(TILT);
      const zT = yR * Math.sin(TILT) + zR * Math.cos(TILT);
      return { x: W / 2 + xT * R, y: H / 2 - yT * R, z: zT };
    };

    const drawArc = (points: { x: number; y: number; z: number }[], alpha: number) => {
      if (points.length < 2) return;
      for (let i = 0; i < points.length - 1; i++) {
        const p = points[i];
        const p2 = points[i + 1];
        // sqrt falloff: edge (z=0) → 0.71 instead of 0.5, back still fades to 0
        const brightness = Math.sqrt(Math.max(0, (p.z + 1) / 2));
        const a = brightness * alpha;
        if (a < 0.03) continue;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(56, 182, 255, ${a})`;
        ctx.lineWidth = brightness > 0.5 ? 1.3 : 0.8;
        ctx.stroke();
      }
    };

    const STEPS = 128;  // smoother curves

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Atmosphere glow — stronger
      const grd = ctx.createRadialGradient(W / 2, H / 2, R * 0.75, W / 2, H / 2, R * 1.4);
      grd.addColorStop(0, 'rgba(24, 100, 220, 0.25)');
      grd.addColorStop(0.5, 'rgba(24, 100, 220, 0.1)');
      grd.addColorStop(1, 'rgba(24, 100, 220, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, R * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Equator highlight ring
      const eqGrd = ctx.createRadialGradient(W / 2, H / 2, R * 0.92, W / 2, H / 2, R * 1.08);
      eqGrd.addColorStop(0, 'rgba(99, 210, 255, 0.12)');
      eqGrd.addColorStop(1, 'rgba(99, 210, 255, 0)');
      ctx.fillStyle = eqGrd;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, R * 1.08, 0, Math.PI * 2);
      ctx.fill();

      // Latitude lines
      for (let i = 0; i <= LAT_N; i++) {
        const lat = -Math.PI / 2 + (Math.PI / LAT_N) * i;
        const isEq = i === LAT_N / 2;
        const isTrop = i === Math.round(LAT_N * 0.33) || i === Math.round(LAT_N * 0.67);
        const pts: { x: number; y: number; z: number }[] = [];
        for (let j = 0; j <= STEPS; j++) {
          pts.push(project3D(lat, (2 * Math.PI / STEPS) * j));
        }
        drawArc(pts, isEq ? 0.8 : isTrop ? 0.55 : 0.3);
      }

      // Longitude lines
      for (let i = 0; i < LON_N; i++) {
        const lon = (2 * Math.PI / LON_N) * i;
        const pts: { x: number; y: number; z: number }[] = [];
        for (let j = 0; j <= STEPS; j++) {
          pts.push(project3D(-Math.PI / 2 + (Math.PI / STEPS) * j, lon));
        }
        drawArc(pts, 0.35);
      }

      // Glowing dots at intersections — every line
      for (let i = 0; i <= LAT_N; i++) {
        const lat = -Math.PI / 2 + (Math.PI / LAT_N) * i;
        for (let j = 0; j < LON_N; j++) {
          const lon = (2 * Math.PI / LON_N) * j;
          const p = project3D(lat, lon);
          const brightness = Math.sqrt(Math.max(0, (p.z + 1) / 2));
          if (brightness < 0.15) continue;
          ctx.beginPath();
          ctx.arc(p.x, p.y, brightness > 0.8 ? 2.5 : 1.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99, 210, 255, ${brightness * 0.9})`;
          ctx.fill();
        }
      }

      angle += 0.004;
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

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />;
}

/* ─── Signup Page ─── */
export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  };

  useEffect(() => {
    if (!email) {
      setEmailError('');
      return;
    }
    const timer = setTimeout(() => {
      if (!validateEmail(email)) {
        setEmailError('Please enter a valid email address.');
      } else {
        setEmailError('');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const passwordStrength = (() => {
    if (!password) return null;
    if (password.length < 6) return { level: 0, label: 'Too short', color: 'bg-rose-500' };
    if (password.length < 8) return { level: 1, label: 'Weak', color: 'bg-amber-500' };
    const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
    if (score === 0) return { level: 2, label: 'Fair', color: 'bg-amber-400' };
    if (score === 1) return { level: 3, label: 'Good', color: 'bg-emerald-400' };
    return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
  })();

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(u => { if (u && !u.error) { localStorage.setItem('isLoggedIn', 'true'); navigate('/', { replace: true }); } })
      .catch(() => { });
    const onMsg = (e: MessageEvent) => {
      if (!e.origin.includes('localhost') && !e.origin.endsWith('.run.app')) return;
      if (e.data?.type === 'OAUTH_AUTH_SUCCESS') { localStorage.setItem('isLoggedIn', 'true'); window.location.href = '/'; }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [navigate]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('isLoggedIn', 'true');
        setSuccess(true);
        setTimeout(() => { window.location.href = '/'; }, 800);
      } else {
        setError(data.error || 'Signup failed. Please try again.');
      }
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    try {
      const { url } = await fetch(`/api/auth/url?provider=${provider}`).then(r => r.json());
      const w = 600, h = 700;
      const popup = window.open(url, 'oauth', `width=${w},height=${h},left=${(window.outerWidth - w) / 2},top=${(window.outerHeight - h) / 2}`);
      if (!popup) { alert('Please allow popups for OAuth sign-in.'); setLoading(false); }
    } catch { setLoading(false); }
  };

  const fields = [
    { id: 'name', label: 'Full Name', icon: User, type: 'text', value: name, set: setName, ph: 'Akash Bihari' },
    { id: 'email', label: 'Email', icon: Mail, type: 'email', value: email, set: setEmail, ph: 'name@company.com' },
    { id: 'password', label: 'Password', icon: Lock, type: 'password', value: password, set: setPassword, ph: 'Min. 8 characters' },
  ];

  return (
    <div className="min-h-screen flex overflow-hidden bg-white dark:bg-[#060d1f] transition-colors duration-500 relative">

      {/* ── Globe background (full page, blurred behind form) ── */}
      <div className="absolute inset-0 z-0">
        <SpinningGlobe />
        {/* Dark vignette so form is readable - adjust for light mode */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-white/40 dark:via-[#060d1f]/60 to-white/90 dark:to-[#060d1f]/90" />
      </div>

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-sky-400/10 rounded-full blur-[80px] pointer-events-none z-0" />

      {/* ── Central form card ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="size-11 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40">
              <MapIcon size={22} className="text-white" />
            </div>
            <span className="text-slate-900 dark:text-white font-black text-2xl tracking-tight">SkillMap</span>
          </motion.div>

          {/* Card */}
          <div className="bg-white/80 dark:bg-white/[0.04] backdrop-blur-2xl rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl p-8 space-y-6">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Begin your journey</h1>
              <p className="text-slate-500 dark:text-white/40 text-sm">Map your career path with the power of AI.</p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 dark:text-rose-400 text-sm font-medium text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-4">
              {fields.map(({ id, label, icon: Icon, type, value, set, ph }) => (
                <div key={id} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest ml-1">{label}</label>
                  <motion.div animate={{ scale: focused === id ? 1.01 : 1 }} className="relative">
                    <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                      style={{ color: focused === id ? 'var(--color-primary)' : '#94a3b8' }} />
                    <input
                      type={type}
                      value={value}
                      onChange={e => set(e.target.value)}
                      onFocus={() => setFocused(id)}
                      onBlur={() => setFocused(null)}
                      placeholder={ph}
                      required
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all focus:border-primary/60 focus:bg-white/8 focus:ring-2 focus:ring-primary/20"
                    />
                  </motion.div>

                  {/* Password strength */}
                  {id === 'email' && emailError && (
                    <p className="text-[10px] font-bold ml-1 text-rose-500">
                      {emailError}
                    </p>
                  )}
                  {id === 'password' && passwordStrength && (
                    <div className="space-y-1 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(lvl => (
                          <div key={lvl} className={`h-1 flex-1 rounded-full transition-all duration-300 ${lvl <= passwordStrength.level ? passwordStrength.color : 'bg-slate-200 dark:bg-white/10'}`} />
                        ))}
                      </div>
                      <p className={`text-[10px] font-bold ml-0.5 ${passwordStrength.level <= 1 ? 'text-rose-500' : passwordStrength.level <= 2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={loading || success || !!emailError || !email || !password || !name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full relative overflow-hidden bg-primary text-white font-black py-4 rounded-xl shadow-xl shadow-primary/30 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                <AnimatePresence mode="wait">
                  {success ? (
                    <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                      <CheckCircle2 size={18} /> Account created!
                    </motion.span>
                  ) : loading ? (
                    <motion.span key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" /> Creating account…
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 group">
                      <Sparkles size={16} />
                      Create My Account
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </motion.span>
                  )}
                </AnimatePresence>
                {/* shimmer */}
                {!loading && !success && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'linear', repeatDelay: 2 }}
                  />
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-transparent px-4 text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest">or</span>
              </div>
            </div>

            {/* OAuth */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'GitHub', icon: Github, p: 'github' as const },
                {
                  label: 'Google', p: 'google' as const, icon: () => (
                    <svg className="size-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )
                },
              ].map(({ label, icon: Icon, p }) => (
                <motion.button
                  key={p}
                  onClick={() => handleOAuth(p)}
                  disabled={loading}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2.5 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 font-bold text-sm backdrop-blur-sm transition-all disabled:opacity-50"
                >
                  <Icon size={16} /> {label}
                </motion.button>
              ))}
            </div>

            <p className="text-center mt-6 text-sm text-slate-500 dark:text-white/30">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
