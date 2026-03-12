import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Rocket, Search, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { PROJECT_BANK } from '../services/geminiService';

export default function Projects() {
  const { targetRole } = useTheme();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'Relevance' | 'Difficulty'>('Relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setLoading(true);
    fetch('/api/analyses', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const filtered = (Array.isArray(data) ? data : []).filter((a: any) => a.targetRole === targetRole);
        setAnalyses(filtered);
      })
      .finally(() => setLoading(false));
  }, [targetRole]);

  const lastAnalysis = analyses[0];
 
  const recommendedProjects = useMemo(() => {
    const saved = lastAnalysis?.recommendedProjects || [];
    const bank = PROJECT_BANK[targetRole] || PROJECT_BANK['Backend Developer'] || [];
    
    // Merge and remove duplicates by title
    const seen = new Set(saved.map((p: any) => p.title));
    const merged = [...saved];
    
    for (const p of bank) {
      if (!seen.has(p.title)) {
        merged.push(p);
      }
    }
    
    return merged.length > 0 ? merged : [
      {
        title: "E-commerce API",
        description: "Demonstrates backend architecture and security standards essential for fintech and large-scale SaaS roles.",
        techStack: ["Node.js", "JWT", "MongoDB"],
        difficulty: "Intermediate",
        image: "https://picsum.photos/seed/ecommerce/800/450"
      },
      // ... more defaults if needed, but bank should cover it
    ];
  }, [lastAnalysis, targetRole]);

  const sortedProjects = [...recommendedProjects].sort((a, b) => {
    if (sortBy === 'Difficulty') {
      const levels: Record<string, number> = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      return levels[b.difficulty] - levels[a.difficulty];
    }
    return 0; // Relevance is default order
  });

  const filteredProjects = filter === 'All'
    ? sortedProjects
    : sortedProjects.filter((p: any) => p.difficulty === filter);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-10"
    >
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest w-fit">
          <Rocket size={12} />
          Skill Bridge
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Project Recommendations</h1>
        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed">
          Hands-on projects specifically curated to bridge your identified skill gaps for <span className="text-primary font-bold">{targetRole}</span>.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Curating projects for your role...</p>
        </div>
      ) : !lastAnalysis ? (
        <div className="glass-panel rounded-[2.5rem] p-8 sm:p-12 text-center border border-slate-200 dark:border-white/5">
          <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
            <Rocket size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">No Analysis Found</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            We haven't analyzed your skills for the <span className="text-primary font-bold">{targetRole}</span> role yet.
            Run an analysis to get personalized project recommendations.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            Start Analysis Now
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/10">
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Difficulty Level</span>
                <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                  {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFilter(level)}
                      className={cn(
                        "px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all flex-1 sm:flex-none text-center",
                        filter === level ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative group">
              <button
                onClick={() => setSortBy(sortBy === 'Relevance' ? 'Difficulty' : 'Relevance')}
                className="flex items-center gap-2 px-4 py-2.5 glass-panel rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-all"
              >
                <Filter size={16} />
                Sort by: {sortBy}
              </button>
            </div>
          </div>

          {paginatedProjects.length === 0 ? (
            <div className="py-20 text-center glass-panel rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
              <p className="text-slate-500 font-bold">No projects found matching the "{filter}" filter.</p>
              <button
                onClick={() => setFilter('All')}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {paginatedProjects.map((project: any, i: number) => (
                <motion.div
                  key={project.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group flex flex-col glass-panel rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-2xl"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent z-10" />
                    <img
                      src={project.image || `https://picsum.photos/seed/${project.title}/800/450`}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <span className={cn(
                      "absolute top-4 right-4 z-20 px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg shadow-lg",
                      project.difficulty === 'Beginner' && "bg-emerald-500 text-white",
                      project.difficulty === 'Intermediate' && "bg-amber-500 text-white",
                      project.difficulty === 'Advanced' && "bg-rose-500 text-white"
                    )}>
                      {project.difficulty}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-1 space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{project.title}</h3>

                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech: string) => (
                        <span key={tech} className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {tech}
                        </span>
                      ))}
                    </div>

                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed italic border-l-2 border-primary/30 pl-4">
                      "{project.description}"
                    </p>

                    <div className="pt-4 mt-auto">
                      <button
                        onClick={() => window.open(`https://github.com/search?q=${project.title.replace(/\s+/g, '+')}+${project.techStack[0]}`, '_blank')}
                        className="w-full py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white text-slate-900 dark:text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        View Project Details
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 pt-10">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="size-10 glass-panel rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "size-10 font-bold rounded-xl transition-all",
                    currentPage === i + 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "glass-panel text-slate-500 hover:text-white"
                  )}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="size-10 glass-panel rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
