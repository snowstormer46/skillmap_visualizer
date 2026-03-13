import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    BadgeCheck, Trash2, Search, Filter, Loader2, Plus, Sparkles, Award
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import SkillQuiz from '../components/SkillQuiz';
import { Skeleton } from '../components/SkeletonLoader';

interface Skill {
    id: number;
    name: string;
    level: string;
    category: string;
}

const LEVEL_STYLES: Record<string, string> = {
    Expert: 'bg-primary/10 text-primary border-primary/20',
    Intermediate: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Beginner: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Verified: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

export default function Skills() {
    const { toast } = useToast();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [verifyingSkill, setVerifyingSkill] = useState<string | null>(null);

    const fetchSkills = () => {
        setLoading(true);
        fetch('/api/skills', { credentials: 'include' })
            .then(res => res.ok ? res.json() : [])
            .then(data => setSkills(Array.isArray(data) ? data : []))
            .catch(() => setSkills([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchSkills(); }, []);

    const handleDelete = async (skill: Skill) => {
        if (!confirm(`Remove "${skill.name}" from your skills?`)) return;
        setDeletingId(skill.id);
        try {
            const res = await fetch(`/api/skills/${skill.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            if (res.ok) {
                setSkills(prev => prev.filter(s => s.id !== skill.id));
                toast(`"${skill.name}" removed from your skills.`, 'success');
            } else {
                toast('Failed to delete skill. Try again.', 'error');
            }
        } catch {
            toast('Network error. Please try again.', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const categories = ['All', ...Array.from(new Set(skills.map(s => s.category)))];

    const filtered = skills.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'All' || s.category === filterCategory;
        return matchSearch && matchCat;
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-5xl mx-auto space-y-8"
        >
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">My Skills</h1>
                    <p className="text-slate-500">Manage and verify your skill portfolio.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-xl border border-primary/20">
                        {skills.length} Total
                    </span>
                    <Link
                        to="/analyze"
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                    >
                        <Sparkles size={16} />
                        Add via Analysis
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search skills..."
                        className="w-full glass-panel border-none rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-1 focus:ring-primary/50 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                                filterCategory === cat ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-primary'
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Skills Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="glass-panel rounded-2xl p-5 space-y-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="size-10 rounded-xl" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 dark:border-white/10 space-y-6">
                    <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto">
                        <BadgeCheck size={40} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {skills.length === 0 ? 'No skills yet' : 'No skills match your filter'}
                        </h3>
                        <p className="text-slate-500 max-w-sm mx-auto">
                            {skills.length === 0
                                ? 'Run an analysis or take a quiz to add verified skills to your profile.'
                                : 'Try adjusting your search or category filter.'}
                        </p>
                    </div>
                    {skills.length === 0 && (
                        <Link
                            to="/analyze"
                            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                        >
                            <Sparkles size={16} />
                            Start Analysis
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filtered.map(skill => (
                            <motion.div
                                key={skill.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="group glass-panel rounded-2xl p-5 border border-slate-200 dark:border-white/5 hover:border-primary/30 transition-all space-y-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-11 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                            <Award size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{skill.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{skill.category}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(skill)}
                                        disabled={deletingId === skill.id}
                                        className="p-2 text-slate-300 dark:text-slate-700 hover:text-rose-500 dark:hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Remove skill"
                                    >
                                        {deletingId === skill.id
                                            ? <Loader2 size={16} className="animate-spin" />
                                            : <Trash2 size={16} />}
                                    </button>
                                </div>
                                <span className={cn(
                                    'inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border',
                                    LEVEL_STYLES[skill.level] || LEVEL_STYLES['Intermediate']
                                )}>
                                    {skill.level}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Skill Quiz Modal */}
            <AnimatePresence>
                {verifyingSkill && (
                    <SkillQuiz
                        skill={verifyingSkill}
                        onClose={() => setVerifyingSkill(null)}
                        onSuccess={() => { setVerifyingSkill(null); fetchSkills(); toast('Skill verified and added!', 'success'); }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
