import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, TrendingUp, BookOpen, Target, Award,
  ArrowRight, Zap, CheckCircle2, AlertCircle, Loader2,
  Star, Map, Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Markdown from 'react-markdown';
import SkillQuiz from '../components/SkillQuiz';
import { cn } from '../lib/utils';

// Animated number counter
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.round(start));
    }, 25);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
}

// Progress ring SVG
function ProgressRing({ pct, size = 120, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-slate-200 dark:text-white/5" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - (pct / 100) * circ }}
        transition={{ duration: 1.8, ease: 'easeOut', delay: 0.4 }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#136DEC" />
          <stop offset="100%" stopColor="#6EE7FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '🌅' };
  if (h < 17) return { text: 'Good afternoon', emoji: '☀️' };
  return { text: 'Good evening', emoji: '🌙' };
}

function getChapterNumber(score: number) {
  if (score < 20) return { n: 'I', label: 'The Beginning', color: 'from-slate-500 to-slate-600' };
  if (score < 40) return { n: 'II', label: 'Finding Your Path', color: 'from-amber-500 to-orange-500' };
  if (score < 60) return { n: 'III', label: 'Gaining Momentum', color: 'from-primary to-sky-400' };
  if (score < 80) return { n: 'IV', label: 'The Rising Expert', color: 'from-emerald-500 to-teal-400' };
  return { n: 'V', label: 'The Master\'s Path', color: 'from-violet-500 to-purple-400' };
}

export default function Dashboard() {
  const { targetRole } = useTheme();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingSkill, setVerifyingSkill] = useState<string | null>(null);

  const refreshSkills = useCallback(() => {
    fetch('/api/skills', { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => setSkills(Array.isArray(data) ? data : []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const fetchData = async () => {
      try {
        const [userRes, skillsRes, analysesRes] = await Promise.all([
          fetch('/api/user', { credentials: 'include' }).catch(() => ({ ok: false })),
          fetch('/api/skills', { credentials: 'include' }).catch(() => ({ ok: false })),
          fetch('/api/analyses', { credentials: 'include' }).catch(() => ({ ok: false })),
        ]);
        if (!isMounted) return;
        const [userData, skillsData, analysesData] = await Promise.all([
          (userRes as Response).ok ? (userRes as Response).json() : null,
          (skillsRes as Response).ok ? (skillsRes as Response).json() : [],
          (analysesRes as Response).ok ? (analysesRes as Response).json() : [],
        ]);
        if (!isMounted) return;
        setUser(userData && !userData.error ? userData : null);
        setSkills(Array.isArray(skillsData) ? skillsData : []);
        const roleAnalyses = (Array.isArray(analysesData) ? analysesData : []).filter((a: any) => a.target_role === targetRole);
        setLastAnalysis(roleAnalyses[0] || null);
      } catch (e) { console.error(e); } finally { if (isMounted) setLoading(false); }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [targetRole]);

  const score = lastAnalysis?.match_score ?? 0;
  const chapter = getChapterNumber(score);
  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || 'Adventurer';
  const analysisCount = lastAnalysis ? 1 : 0;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
        <div className="h-56 bg-slate-200 dark:bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-200 dark:bg-white/5 rounded-2xl" />)}
        </div>
        <div className="h-48 bg-slate-200 dark:bg-white/5 rounded-3xl" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* ═══ HERO: Book Cover ═══ */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[2rem] p-8 md:p-12 bg-gradient-to-br from-navy-900 via-[#0d1b40] to-[#0a0e2a] border border-white/5 shadow-2xl"
      >
        {/* decorative orbs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none hidden sm:block" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(255,255,255,0.3) 30px, rgba(255,255,255,0.3) 31px)'
        }} />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 text-sky-300/60 text-xs font-bold uppercase tracking-[0.2em]">
              <BookOpen size={12} />
              {greeting.emoji} {greeting.text}, {firstName}
            </div>
            <div>
              <p className="text-white/60 text-sm font-medium mb-1">The Making of a</p>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                {targetRole}
              </h1>
            </div>
            <div className={cn('inline-flex flex-wrap items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl sm:rounded-full bg-gradient-to-r text-white text-sm font-bold shadow-lg', chapter.color)}>
              <span className="font-black text-[10px] opacity-70 uppercase tracking-widest">Chapter</span>
              <span className="text-lg sm:text-xl font-black">{chapter.n}</span>
              <span className="hidden sm:block w-px h-4 bg-white/30" />
              <span className="w-full sm:w-auto">{chapter.label}</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-md">
              {score === 0
                ? `Your story as a ${targetRole} is about to begin. Run your first analysis to unlock your personalized career narrative.`
                : `You've written ${skills.length} skills into your story and are ${score}% of the way to your ${targetRole} destiny. The next chapter awaits.`}
            </p>
          </div>

          {/* Ring */}
          <div className="relative shrink-0 flex items-center justify-center">
            <ProgressRing pct={score} size={140} stroke={10} />
            <div className="absolute text-center">
              <p className="text-3xl font-black text-white">
                <AnimatedNumber value={score} suffix="%" />
              </p>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Readiness</p>
            </div>
          </div>
        </div>

        {/* Bottom stats strip */}
        <div className="relative mt-8 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 text-center">
          {[
            { icon: Award, value: skills.length, label: 'Skills Mastered' },
            { icon: Target, value: lastAnalysis?.missing_skills?.length ?? 0, label: 'Skills Remaining' },
            { icon: Flame, value: analysisCount, label: 'Analyses Run' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label}>
              <div className="flex items-center justify-center gap-2 text-white/30 mb-1">
                <Icon size={14} />
                <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
              </div>
              <p className="text-2xl font-black text-white"><AnimatedNumber value={value} /></p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ CHAPTER 1: Your Arsenal ═══ */}
      {skills.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-3xl sm:text-4xl font-black text-slate-200 dark:text-white/10 select-none">01</span>
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">Your Arsenal</p>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Skills You've Mastered</h2>
              </div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
            <Link to="/skills" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 20).map((skill: any, i: number) => (
              <motion.span
                key={skill.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 * i, type: 'spring', stiffness: 400 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20"
              >
                <CheckCircle2 size={12} />
                {skill.name}
              </motion.span>
            ))}
            {skills.length > 20 && (
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-500 text-xs font-bold rounded-xl border border-slate-200 dark:border-white/5">
                +{skills.length - 20} more
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ CHAPTER 2: The Road Ahead ═══ */}
      {lastAnalysis?.missing_skills?.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-3xl sm:text-4xl font-black text-slate-200 dark:text-white/10 select-none">02</span>
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-amber-500 uppercase tracking-widest">Quests Awaiting</p>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">The Skills You Still Need</h2>
              </div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-amber-500/10 bg-amber-500/5">
            <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-5 leading-relaxed">
              "Every master was once a beginner. These are the chapters yet to be written in your story — each one a stepping stone to your future self."
            </p>
            <div className="flex flex-wrap gap-3">
              {lastAnalysis.missing_skills.map((skill: string) => (
                <div key={skill} className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-navy-800 rounded-xl border border-amber-500/20 shadow-sm hover:border-amber-500/50 hover:shadow-amber-500/10 hover:shadow-lg transition-all">
                  <AlertCircle size={14} className="text-amber-500 shrink-0" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-100 capitalize">{skill}</span>
                  <button
                    onClick={() => setVerifyingSkill(skill)}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold"
                  >
                    <Sparkles size={9} />
                    Verify
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ CHAPTER 3: Recommended Projects ═══ */}
      {lastAnalysis?.recommended_projects?.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-3xl sm:text-4xl font-black text-slate-200 dark:text-white/10 select-none">03</span>
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-violet-500 uppercase tracking-widest">Build to Learn</p>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Recommended Projects</h2>
              </div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
            <Link to="/projects" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Browse All <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {lastAnalysis.recommended_projects.slice(0, 3).map((proj: any, i: number) => (
              <motion.div
                key={proj.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="glass-panel p-5 rounded-2xl border border-violet-500/10 bg-violet-500/5 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 leading-snug">{proj.title}</h3>
                  {proj.difficulty && (
                    <span className={`shrink-0 text-[10px] font-black px-2 py-1 rounded-lg ${proj.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                      proj.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                        'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>{proj.difficulty}</span>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic">
                    "{proj.description}"
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.techStack?.slice(0, 3).map((tech: string) => (
                    <span key={tech} className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                      {tech}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ CHAPTER 4: Your Next Mission (empty state) ═══ */}
      {!lastAnalysis && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden glass-panel rounded-[2rem] p-10 text-center border-2 border-dashed border-slate-200 dark:border-white/10 space-y-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-sky-500/5 pointer-events-none" />
          <div className="relative space-y-4">
            <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto">
              <Map size={36} />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Begin Your Story</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Your Journey Awaits</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
                Every great career starts with a single step. Analyze your skills or upload your resume to unlock your personalized career story and discover what it takes to become a <strong>{targetRole}</strong>.
              </p>
            </div>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 bg-primary text-white px-10 py-4 rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-105 transition-transform"
            >
              <Sparkles size={18} />
              Begin My Analysis
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Skill Quiz */}
      <AnimatePresence>
        {verifyingSkill && (
          <SkillQuiz
            skill={verifyingSkill}
            onClose={() => setVerifyingSkill(null)}
            onSuccess={() => {
              setVerifyingSkill(null);
              refreshSkills();
              toast('Skill verified and added!', 'success');
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
