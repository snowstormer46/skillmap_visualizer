import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  History,
  TrendingUp,
  Star,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  FlaskConical,
  Package,
  X,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Calendar,
  ArrowUpRight,
  Download,
  Archive,
  ChevronDown,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { SkeletonTable, Skeleton } from '../components/SkeletonLoader';
import * as XLSX from 'xlsx';


export default function Reports() {
  const { targetRole } = useTheme();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'archived'>('all');
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);


  const fetchData = () => {
    setLoading(true);
    fetch('/api/analyses', { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then(data => setAnalyses(Array.isArray(data) ? data : []))
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredAnalyses = useMemo(() => {
    let filtered = analyses.filter(a =>
      a.targetRole.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeFilter === 'recent') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(a => new Date(a.date) >= thirtyDaysAgo && !a.isArchived);
    } else if (activeFilter === 'archived') {
      filtered = filtered.filter(a => a.isArchived);
    } else {
      // 'all' filter shows everything except archived by default, 
      // or should it show everything? Usually 'All' means non-archived.
      filtered = filtered.filter(a => !a.isArchived);
    }

    return filtered;
  }, [analyses, searchQuery, activeFilter]);

  const handleArchive = async (id: number, currentStatus: boolean) => {
    try {
      await fetch(`/api/analyses/${id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isArchived: !currentStatus })
      });
      fetchData();
      toast(currentStatus ? 'Report unarchived.' : 'Report archived.', 'success');
    } catch (error) {
      toast('Failed to update report. Try again.', 'error');
      console.error('Error archiving analysis:', error);
    }
  };

  const handleExportAll = () => {
    if (analyses.length === 0) {
      toast('No reports to export.', 'warning');
      return;
    }
    const headers = ['Date', 'Target Role', 'Match Score (%)', 'Extracted Skills', 'Missing Skills'];
    const rows = analyses.map(a => [
      new Date(a.date).toLocaleDateString(),
      a.targetRole,
      a.matchScore,
      (a.extractedSkills || []).join('; '),
      (a.missingSkills || []).join('; '),
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillmap_reports_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${analyses.length} report${analyses.length > 1 ? 's' : ''} as CSV.`, 'success');
  };

  const handleExportJSON = () => {
    if (analyses.length === 0) return toast('No reports to export.', 'warning');
    const dataStr = JSON.stringify(analyses, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillmap_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data exported as JSON.', 'success');
  };

  const handleExportExcel = () => {
    if (analyses.length === 0) return toast('No reports to export.', 'warning');
    const worksheet = XLSX.utils.json_to_sheet(analyses.map(a => ({
      Date: new Date(a.date).toLocaleDateString(),
      'Target Role': a.targetRole,
      'Match Score': `${a.matchScore}%`,
      'Found Skills': (a.extractedSkills || []).join(', '),
      'Missing Skills': (a.missingSkills || []).join(', ')
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, `skillmap_stats_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast('Data exported as Excel.', 'success');
  };

  const handleExportWord = () => {
    if (analyses.length === 0) return toast('No reports to export.', 'warning');
    const content = `
      <html>
        <head><meta charset="utf-8"></head>
        <body>
          <h1>SkillMap Career Reports</h1>
          ${analyses.map(a => `
            <div style="margin-bottom: 40px; border-bottom: 2px solid #eee;">
              <h2>${a.targetRole} - ${new Date(a.date).toLocaleDateString()}</h2>
              <p><strong>Match Score:</strong> ${a.matchScore}%</p>
              <h3>Skills Found</h3>
              <p>${(a.extractedSkills || []).join(', ')}</p>
              <h3>Gaps to Bridge</h3>
              <p>${(a.missingSkills || []).join(', ')}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillmap_history_${new Date().toISOString().slice(0, 10)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data exported as Word document.', 'success');
  };

  const handleDownloadReport = (analysis: any) => {
    const lines = [
      `SkillMap Analysis Report`,
      `========================`,
      `Target Role : ${analysis.targetRole}`,
      `Date        : ${new Date(analysis.date).toLocaleString()}`,
      `Match Score : ${analysis.matchScore}%`,
      ``,
      `IDENTIFIED SKILLS`,
      `-----------------`,
      ...(analysis.extractedSkills || []).map((s: string) => `  • ${s}`),
      ``,
      `MISSING SKILLS`,
      `--------------`,
      ...(analysis.missingSkills || []).map((s: string) => `  • ${s}`),
      ``,
      `RECOMMENDED PROJECTS`,
      `--------------------`,
      ...(analysis.recommendedProjects || []).map((p: any) => `  • ${p.title} (${p.difficulty})`),
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skillmap_${analysis.targetRole.replace(/\s+/g, '_').toLowerCase()}_${new Date(analysis.date).toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Report downloaded as text file.', 'success');
  };

  const generatePDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
      toast('Could not find content to export.', 'warning');
      return;
    }

    toast('Generating PDF... Please wait.', 'success');

    try {
      const { default: html2canvas } = await import('html2canvas');
      const { jsPDF } = await import('jspdf');

      const originalStyle = element.style.cssText;
      const originalMaxHeight = element.style.maxHeight;
      const originalOverflow = element.style.overflow;

      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff',
      });

      element.style.maxHeight = originalMaxHeight;
      element.style.overflow = originalOverflow;
      element.style.cssText = originalStyle;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
      toast('PDF downloaded successfully.', 'success');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast('Failed to generate PDF.', 'error');
    }
  };

  const trendData = useMemo(() => {
    if (!analyses || !targetRole) return [];

    return analyses
      .filter(a => a.targetRole?.trim().toLowerCase() === targetRole.trim().toLowerCase() && !a.isArchived)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(a => {
        const d = new Date(a.date);
        return {
          date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          score: Math.round(Number(a.matchScore))
        };
      });
  }, [analyses, targetRole]);

  const stats = [
    { label: 'Total Analyses', value: analyses.length, icon: History, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Avg. Match Rate', value: `${Math.round(analyses.reduce((acc, a) => acc + a.matchScore, 0) / (analyses.length || 1))}%`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Highest Match', value: `${Math.max(...analyses.map(a => a.matchScore), 0)}%`, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <motion.div
      id="reports-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-10"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white text-center sm:text-left">Analysis History</h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg text-center sm:text-left">Detailed breakdown of your career progression for <span className="text-primary font-bold">{targetRole}</span>.</p>
        </div>
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Download size={18} />
            Export Data
            <ChevronDown size={16} className={cn("transition-transform", showExportMenu && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showExportMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-3 w-56 bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-2 z-50"
              >
                {[
                  { label: 'PDF Summary Report', sub: '.pdf', icon: FileText, action: () => generatePDF('reports-dashboard', `SkillMap_History_${new Date().toISOString().slice(0, 10)}.pdf`) },
                  { label: 'Excel Spreadsheet', sub: '.xlsx', icon: Package, action: handleExportExcel },
                  { label: 'Word Document', sub: '.doc', icon: FileText, action: handleExportWord },
                  { label: 'CSV File', sub: '.csv', icon: Download, action: handleExportAll },
                  { label: 'Data JSON', sub: '.json', icon: ArrowUpRight, action: handleExportJSON },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { item.action(); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all text-left group"
                  >
                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                      <item.icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{item.sub}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      {loading ? (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-8 glass-panel rounded-3xl flex items-center gap-6 border border-slate-200 dark:border-white/5">
                <Skeleton className="size-14 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
          <SkeletonTable rows={4} />
        </div>
      ) : (
        <>
          {/* Trend Chart */}
          {trendData.length > 0 && (
            <div className="glass-panel rounded-3xl p-8 border border-slate-200 dark:border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Match Score Trend</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target: {targetRole}</p>
                  </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      domain={['auto', 'auto']}
                      padding={{ top: 20, bottom: 20 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#fff'
                      }}
                      itemStyle={{ color: 'var(--color-primary)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-primary)"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorScore)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-primary)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex glass-panel p-1 rounded-xl bg-slate-100 dark:bg-navy-800/50">
              <button
                onClick={() => setActiveFilter('all')}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                  activeFilter === 'all' ? "bg-primary text-white" : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
                )}
              >
                All Reports
              </button>
              <button
                onClick={() => setActiveFilter('recent')}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                  activeFilter === 'recent' ? "bg-primary text-white" : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
                )}
              >
                Recent
              </button>
              <button
                onClick={() => setActiveFilter('archived')}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                  activeFilter === 'archived' ? "bg-primary text-white" : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
                )}
              >
                Archived
              </button>
            </div>

            <div className="ml-auto flex items-center gap-3 max-w-md flex-1">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search report history..."
                  className="w-full glass-panel border-none rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 glass-panel rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-all">
                <Filter size={16} />
                Filters
              </button>
            </div>
          </div>

      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5">
                <th className="px-8 py-5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">Target Role</th>
                <th className="px-8 py-5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">Match Score</th>
                <th className="px-8 py-5 text-slate-500 text-[10px] font-bold uppercase tracking-widest">Date Analyzed</th>
                <th className="px-8 py-5 text-slate-500 text-[10px] font-bold uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredAnalyses.map((analysis) => (
                <tr key={analysis.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "size-11 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110",
                        analysis.targetRole?.trim().toLowerCase() === targetRole?.trim().toLowerCase() ? "bg-primary/10 text-primary border-primary/20" : "bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10"
                      )}>
                        <BarChart3 size={20} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{analysis.targetRole}</span>
                        {analysis.targetRole?.trim().toLowerCase() === targetRole?.trim().toLowerCase() && (
                          <span className="text-[8px] font-black text-primary uppercase tracking-widest">Current Target</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-28 bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${analysis.matchScore}%` }}
                          className="bg-primary h-full shadow-[0_0_10px_rgba(19,109,236,0.5)]"
                        />
                      </div>
                      <span className="text-sm font-black text-primary">{analysis.matchScore}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-slate-500 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(analysis.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => handleArchive(analysis.id, analysis.is_archived)}
                        className={cn(
                          "transition-colors",
                          analysis.is_archived ? "text-primary hover:text-primary/80" : "text-slate-400 hover:text-rose-500"
                        )}
                        title={analysis.is_archived ? "Unarchive" : "Archive Report"}
                      >
                        <Archive size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedAnalysis(analysis)}
                        className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-primary/80 transition-all"
                      >
                        View Report
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
          {filteredAnalyses.map((analysis) => (
            <div key={analysis.id} className="p-5 space-y-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center border",
                    analysis.targetRole?.trim().toLowerCase() === targetRole?.trim().toLowerCase() ? "bg-primary/10 text-primary border-primary/20" : "bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10"
                  )}>
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{analysis.targetRole}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <Calendar size={10} />
                      {new Date(analysis.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button
                    onClick={() => handleArchive(analysis.id, analysis.is_archived)}
                    className={cn(
                      "p-2 rounded-lg transition-colors border border-slate-100 dark:border-white/10",
                      analysis.is_archived ? "text-primary bg-primary/5" : "text-slate-400 hover:text-rose-500"
                    )}
                  >
                    <Archive size={14} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Score</span>
                    <span className="text-sm font-black text-primary">{analysis.matchScore}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${analysis.matchScore}%` }}
                      className="bg-primary h-full"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnalysis(analysis)}
                  className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all whitespace-nowrap"
                >
                  View Report
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAnalyses.length === 0 && (
          <div className="px-8 py-12 text-center text-slate-500 italic">
            No matching analysis history found.
          </div>
        )}
      </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-8 glass-panel rounded-3xl flex items-center gap-6 hover:bg-slate-50 dark:hover:bg-white/10 transition-all group border border-slate-200 dark:border-white/5">
                  <div className={cn("size-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
                    <Icon size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </>
      )}

      {/* Detailed Report Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnalysis(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              id="pdf-report-content"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl p-8 sm:p-12"
            >
              <button
                onClick={() => setSelectedAnalysis(null)}
                className="absolute top-8 right-8 p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="space-y-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest">
                      <BarChart3 size={14} />
                      Analysis Report
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">{selectedAnalysis.targetRole}</h2>
                    <div className="flex items-center gap-4 text-slate-500 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(selectedAnalysis.date).toLocaleDateString()}
                      </div>
                      <div className="size-1 bg-slate-300 dark:bg-white/10 rounded-full" />
                      <div>{new Date(selectedAnalysis.date).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 bg-slate-50 dark:bg-white/5 p-8 rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-inner">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Match Score</p>
                      <p className="text-5xl font-black text-primary">{selectedAnalysis.matchScore}%</p>
                    </div>
                    <div className="size-20 rounded-full border-4 border-slate-200 dark:border-white/5 flex items-center justify-center relative">
                      <svg className="size-full -rotate-90">
                        <circle
                          cx="40" cy="40" r="36"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-slate-100 dark:text-white/5"
                        />
                        <motion.circle
                          initial={{ strokeDashoffset: 226 }}
                          animate={{ strokeDashoffset: 226 * (1 - selectedAnalysis.matchScore / 100) }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          cx="40" cy="40" r="36"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="6"
                          strokeDasharray={226}
                          className="text-primary"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Radar Chart */}
                  <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center min-h-[300px]">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 w-full">Skill Distribution</h4>
                    <div className="size-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Technical', A: selectedAnalysis.matchScore, fullMark: 100 },
                          { subject: 'Soft Skills', A: Math.min(100, selectedAnalysis.matchScore + 10), fullMark: 100 },
                          { subject: 'Tools', A: Math.max(0, selectedAnalysis.matchScore - 15), fullMark: 100 },
                          { subject: 'Experience', A: Math.max(0, selectedAnalysis.matchScore - 5), fullMark: 100 },
                          { subject: 'Domain', A: selectedAnalysis.matchScore, fullMark: 100 },
                        ]}>
                          <PolarGrid stroke="rgba(255,255,255,0.05)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fill: '#64748b' }} />
                          <Radar name="Skills" dataKey="A" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
 
                  {/* Skills Found */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle2 size={14} />
                      Skills Identified
                    </div>
                    <div className="glass-panel p-6 rounded-3xl border border-emerald-500/10 bg-emerald-500/5 min-h-[300px]">
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.extractedSkills?.length > 0 ? (
                          selectedAnalysis.extractedSkills.map((skill: string) => (
                            <span key={skill} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-lg border border-emerald-500/20">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-slate-500 text-sm italic">No skills identified in this analysis.</p>
                        )}
                      </div>
                    </div>
                  </div>
 
                  {/* Missing Skills */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                      <AlertCircle size={14} />
                      Missing Critical Skills
                    </div>
                    <div className="glass-panel p-6 rounded-3xl border border-amber-500/10 bg-amber-500/5 min-h-[300px]">
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.missingSkills?.length > 0 ? (
                          selectedAnalysis.missingSkills.map((skill: string) => (
                            <span key={skill} className="px-3 py-1.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-lg border border-amber-500/20">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-emerald-500 text-sm font-bold flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            No critical gaps found!
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommended Projects */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest">
                      <Lightbulb size={14} />
                      Recommended Projects to Bridge Gaps
                    </div>
                    <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">View All Projects</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {selectedAnalysis.recommendedProjects?.map((project: any, i: number) => (
                      <div key={i} className="p-8 glass-panel rounded-[2rem] border border-slate-200 dark:border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Package size={60} />
                        </div>
                        <div className="flex justify-between items-start mb-6">
                          <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Package size={24} />
                          </div>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2.5 py-1 rounded-full",
                            project.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-500' :
                              project.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-rose-500/10 text-rose-500'
                          )}>
                            {project.difficulty}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-3 text-lg leading-tight">{project.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed">{project.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {project.techStack?.slice(0, 3).map((tech: string) => (
                            <span key={tech} className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast('Link copied!', 'success'))}
                      className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold"
                    >
                      <ArrowUpRight size={16} />
                      Share Report
                    </button>
                    <button
                      onClick={() => handleDownloadReport(selectedAnalysis)}
                      className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold"
                    >
                      <FileText size={16} />
                      Download TXT
                    </button>
                    <button
                      onClick={() => generatePDF('pdf-report-content', `SkillMap_Report_${selectedAnalysis.targetRole.replace(/\s+/g, '_')}.pdf`)}
                      className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold"
                    >
                      <Download size={16} />
                      Export PDF
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                  >
                    Close Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
