import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, Database, Lock, Cloud, Plus, Minus, Maximize2,
  Code, Layers, Cpu, Globe, Shield, Terminal, Server,
  Layout as LayoutIcon, Search, Zap, X, ExternalLink, Sparkles, ChevronRight, Map as MapIcon,
  Award, BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../context/ThemeContext';
import SkillQuiz from '../components/SkillQuiz';

import { Link } from 'react-router-dom';

interface RoadmapNode {
  id: string;
  label: string;
  icon: any;
  stage: number;  // column index (0-based)
  dependencies?: string[];
  status?: 'completed' | 'available' | 'locked';
}

const ROADMAP_TEMPLATES: Record<string, RoadmapNode[]> = {
  'Backend Developer': [
    { id: 'lang', label: 'Language (Node/Go/Python)', icon: Code, stage: 0 },
    { id: 'db', label: 'Relational DB (SQL)', icon: Database, stage: 1, dependencies: ['lang'] },
    { id: 'api', label: 'REST & API Design', icon: Globe, stage: 2, dependencies: ['db'] },
    { id: 'auth', label: 'Auth & Security', icon: Shield, stage: 2, dependencies: ['db'] },
    { id: 'cache', label: 'Caching (Redis)', icon: Zap, stage: 3, dependencies: ['api'] },
    { id: 'micro', label: 'Microservices', icon: Layers, stage: 3, dependencies: ['auth'] },
    { id: 'cloud', label: 'Cloud (AWS/GCP)', icon: Cloud, stage: 4, dependencies: ['cache', 'micro'] },
  ],
  'Frontend Developer': [
    { id: 'html', label: 'HTML & CSS', icon: LayoutIcon, stage: 0 },
    { id: 'js', label: 'JavaScript / TS', icon: Code, stage: 1, dependencies: ['html'] },
    { id: 'react', label: 'React / Vue', icon: Layers, stage: 2, dependencies: ['js'] },
    { id: 'state', label: 'State Management', icon: Cpu, stage: 3, dependencies: ['react'] },
    { id: 'styling', label: 'Tailwind / UI Libs', icon: Zap, stage: 3, dependencies: ['react'] },
    { id: 'testing', label: 'Unit Testing', icon: Shield, stage: 4, dependencies: ['state', 'styling'] },
  ],
  'Fullstack Engineer': [
    { id: 'web', label: 'Web Fundamentals', icon: Globe, stage: 0 },
    { id: 'fe', label: 'Frontend Frameworks', icon: LayoutIcon, stage: 1, dependencies: ['web'] },
    { id: 'be', label: 'Backend Runtimes', icon: Server, stage: 1, dependencies: ['web'] },
    { id: 'db', label: 'Database Systems', icon: Database, stage: 2, dependencies: ['fe', 'be'] },
    { id: 'devops', label: 'Deployment & CI/CD', icon: Terminal, stage: 3, dependencies: ['db'] },
  ],
  'DevOps Engineer': [
    { id: 'linux', label: 'Linux & Shell', icon: Terminal, stage: 0 },
    { id: 'docker', label: 'Containerization', icon: Layers, stage: 1, dependencies: ['linux'] },
    { id: 'k8s', label: 'Orchestration (K8s)', icon: Cloud, stage: 2, dependencies: ['docker'] },
    { id: 'iac', label: 'Infrastructure as Code', icon: Code, stage: 2, dependencies: ['docker'] },
    { id: 'monitoring', label: 'Observability', icon: Search, stage: 3, dependencies: ['k8s', 'iac'] },
  ],
  'Data Scientist': [
    { id: 'python', label: 'Python & Stats', icon: Code, stage: 0 },
    { id: 'data', label: 'Data Manipulation', icon: Database, stage: 1, dependencies: ['python'] },
    { id: 'viz', label: 'Visualization', icon: LayoutIcon, stage: 2, dependencies: ['data'] },
    { id: 'ml', label: 'Machine Learning', icon: Cpu, stage: 2, dependencies: ['data'] },
    { id: 'dl', label: 'Deep Learning', icon: Zap, stage: 3, dependencies: ['ml'] },
  ],
  'Mobile Developer': [
    { id: 'lang', label: 'Dart/Swift/Kotlin', icon: Code, stage: 0 },
    { id: 'ui', label: 'UI Frameworks', icon: LayoutIcon, stage: 1, dependencies: ['lang'] },
    { id: 'state', label: 'State Management', icon: Cpu, stage: 2, dependencies: ['ui'] },
    { id: 'storage', label: 'Local DB', icon: Database, stage: 2, dependencies: ['lang'] },
    { id: 'publish', label: 'App Stores', icon: Globe, stage: 3, dependencies: ['state', 'storage'] },
  ],
  'Artificial Intelligence / Machine Learning Engineer': [
    { id: 'math', label: 'Math & Stats', icon: LayoutIcon, stage: 0 },
    { id: 'python', label: 'Python & ML Libs', icon: Code, stage: 1, dependencies: ['math'] },
    { id: 'ml', label: 'Classical ML', icon: Cpu, stage: 2, dependencies: ['python'] },
    { id: 'dl', label: 'Deep Learning', icon: Zap, stage: 2, dependencies: ['python'] },
    { id: 'deploy', label: 'ML Deployment', icon: Cloud, stage: 3, dependencies: ['ml', 'dl'] },
  ],
  'Cybersecurity Engineer': [
    { id: 'net', label: 'Networking Basics', icon: Globe, stage: 0 },
    { id: 'sys', label: 'OS & Scripting', icon: Terminal, stage: 0 },
    { id: 'sec', label: 'Security Principles', icon: Shield, stage: 1, dependencies: ['net', 'sys'] },
    { id: 'def', label: 'Defense & Monitoring', icon: Search, stage: 2, dependencies: ['sec'] },
    { id: 'off', label: 'Ethical Hacking', icon: Zap, stage: 3, dependencies: ['sec'] },
  ],
  'Cloud Engineer': [
    { id: 'sys', label: 'Linux & Networking', icon: Terminal, stage: 0 },
    { id: 'cloud', label: 'Cloud Fundamentals', icon: Cloud, stage: 1, dependencies: ['sys'] },
    { id: 'iac', label: 'IaC (Terraform)', icon: Code, stage: 2, dependencies: ['cloud'] },
    { id: 'serverless', label: 'Serverless apps', icon: Zap, stage: 2, dependencies: ['cloud'] },
    { id: 'arch', label: 'Cloud Architecture', icon: Layers, stage: 3, dependencies: ['iac'] },
  ],
  'Product Manager': [
    { id: 'user', label: 'User Research', icon: Search, stage: 0 },
    { id: 'agile', label: 'Agile & Scrum', icon: Layers, stage: 1, dependencies: ['user'] },
    { id: 'roadmap', label: 'Roadmapping', icon: MapIcon, stage: 2, dependencies: ['agile'] },
    { id: 'metrics', label: 'Data & Metrics', icon: Database, stage: 2, dependencies: ['user'] },
    { id: 'launch', label: 'GTM Strategy', icon: Globe, stage: 3, dependencies: ['roadmap', 'metrics'] },
  ],
  'UI/UX Designer': [
    { id: 'research', label: 'UX Research', icon: Search, stage: 0 },
    { id: 'wire', label: 'Wireframing', icon: LayoutIcon, stage: 1, dependencies: ['research'] },
    { id: 'ui', label: 'UI & Visual Design', icon: Sparkles, stage: 2, dependencies: ['wire'] },
    { id: 'proto', label: 'Prototyping', icon: Zap, stage: 3, dependencies: ['ui'] },
    { id: 'test', label: 'Usability Testing', icon: Check, stage: 4, dependencies: ['proto'] },
  ],
  'Robotics Engineer': [
    { id: 'math', label: 'Calc & Linear Alg', icon: LayoutIcon, stage: 0 },
    { id: 'prog', label: 'C++ & Python', icon: Code, stage: 1, dependencies: ['math'] },
    { id: 'os', label: 'ROS', icon: Layers, stage: 2, dependencies: ['prog'] },
    { id: 'cv', label: 'Computer Vision', icon: Search, stage: 3, dependencies: ['os'] },
    { id: 'control', label: 'Control Systems', icon: Cpu, stage: 3, dependencies: ['os'] },
  ],
  'Blockchain Developer': [
    { id: 'crypto', label: 'Cryptography basics', icon: Shield, stage: 0 },
    { id: 'dist', label: 'Distributed Ledgers', icon: Database, stage: 1, dependencies: ['crypto'] },
    { id: 'smart', label: 'Smart Contracts', icon: Code, stage: 2, dependencies: ['dist'] },
    { id: 'dapp', label: 'DApp Dev (Web3)', icon: Globe, stage: 3, dependencies: ['smart'] },
    { id: 'sec', label: 'Contract Security', icon: Check, stage: 4, dependencies: ['dapp'] },
  ],
  'AI Prompt Engineer': [
    { id: 'nlp', label: 'NLP Basics', icon: Search, stage: 0 },
    { id: 'llm', label: 'LLM Architecture', icon: Layers, stage: 1, dependencies: ['nlp'] },
    { id: 'few', label: 'Few-Shot Prompting', icon: Code, stage: 2, dependencies: ['llm'] },
    { id: 'cot', label: 'Chain of Thought', icon: Cpu, stage: 3, dependencies: ['few'] },
    { id: 'eval', label: 'Model Evaluation', icon: Check, stage: 4, dependencies: ['cot'] },
  ],
  'Digital Marketing Specialist': [
    { id: 'seo', label: 'SEO Fundamentals', icon: Search, stage: 0 },
    { id: 'content', label: 'Content Strategy', icon: LayoutIcon, stage: 1, dependencies: ['seo'] },
    { id: 'social', label: 'Social Media', icon: Globe, stage: 1, dependencies: ['seo'] },
    { id: 'paid', label: 'Paid Ads (SEM)', icon: Zap, stage: 2, dependencies: ['content', 'social'] },
    { id: 'analytics', label: 'Web Analytics', icon: Database, stage: 3, dependencies: ['paid'] },
  ],
  'Business Analyst': [
    { id: 'req', label: 'Requirements Gathering', icon: Search, stage: 0 },
    { id: 'process', label: 'Process Modeling', icon: Layers, stage: 1, dependencies: ['req'] },
    { id: 'data', label: 'Data Analysis', icon: Database, stage: 2, dependencies: ['process'] },
    { id: 'viz', label: 'Data Visualization', icon: LayoutIcon, stage: 2, dependencies: ['data'] },
    { id: 'comm', label: 'Stakeholder Comms', icon: Globe, stage: 3, dependencies: ['viz'] },
  ],
  'Data Engineer': [
    { id: 'sql', label: 'Advanced SQL', icon: Database, stage: 0 },
    { id: 'python', label: 'Python/Scala', icon: Code, stage: 1, dependencies: ['sql'] },
    { id: 'pipe', label: 'ETL Pipelines', icon: Layers, stage: 2, dependencies: ['python'] },
    { id: 'big', label: 'Big Data (Spark)', icon: Zap, stage: 3, dependencies: ['pipe'] },
    { id: 'cloud', label: 'Cloud Data Warehouses', icon: Cloud, stage: 4, dependencies: ['big'] },
  ],
  'IoT Engineer': [
    { id: 'hw', label: 'Hardware Basics', icon: Cpu, stage: 0 },
    { id: 'emb', label: 'Embedded C/C++', icon: Code, stage: 1, dependencies: ['hw'] },
    { id: 'net', label: 'IoT Protocols', icon: Globe, stage: 2, dependencies: ['emb'] },
    { id: 'edge', label: 'Edge Computing', icon: Zap, stage: 3, dependencies: ['net'] },
    { id: 'cloud', label: 'Cloud Integration', icon: Cloud, stage: 4, dependencies: ['edge'] },
  ]
};

const NODE_W = 140;
const NODE_H = 120;
const STAGE_GAP = 180;
const NODE_GAP = 30;

export default function Roadmap() {
  const { targetRole } = useTheme();
  const [zoom, setZoom] = useState(1);
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [markingLearned, setMarkingLearned] = useState(false);
  const [verifyingSkill, setVerifyingSkill] = useState<string | null>(null);
  const [showIntelligence, setShowIntelligence] = useState(false);

  // Drag-to-pan
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const didDrag = React.useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    isDragging.current = true;
    didDrag.current = false;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: canvasRef.current.scrollLeft,
      scrollTop: canvasRef.current.scrollTop,
    };
    canvasRef.current.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !canvasRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    canvasRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
    canvasRef.current.scrollTop = dragStart.current.scrollTop - dy;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  };

  // Ctrl + scroll to zoom
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(z => Math.min(Math.max(z - e.deltaY * 0.001, 0.4), 2));
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const fetchData = () => {
    Promise.all([
      fetch('/api/skills', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
      fetch('/api/analyses', { credentials: 'include' }).then(r => r.ok ? r.json() : []),
    ]).then(([skillsData, analysesData]) => {
      setUserSkills((Array.isArray(skillsData) ? skillsData : []).map((s: any) => s.name.toLowerCase()));
      const filtered = (Array.isArray(analysesData) ? analysesData : []).filter((a: any) => a.targetRole === targetRole && !a.isArchived);
      setLastAnalysis(filtered[0] || null);
    });
  };

  useEffect(() => { fetchData(); }, [targetRole]);

  const { nodes } = useMemo(() => {
    const template = (ROADMAP_TEMPLATES[targetRole] || ROADMAP_TEMPLATES['Backend Developer']).map(n => ({ ...n }));
    const extracted = lastAnalysis?.extractedSkills?.map((s: string) => s.toLowerCase()) || [];
    const missing = lastAnalysis?.missingSkills?.map((s: string) => s.toLowerCase()) || [];

    const allNodes = template.map(node => {
      const labelLower = node.label.toLowerCase();
      const isCompleted = userSkills.some(s => labelLower.includes(s)) || extracted.some((s: string) => labelLower.includes(s));
      const isMissing = missing.some((s: string) => labelLower.includes(s));
      let status: 'completed' | 'available' | 'locked' = 'locked';
      if (isCompleted) status = 'completed';
      else if (isMissing) status = 'available';
      else {
        const depsMet = !node.dependencies || node.dependencies.every(depId => {
          const dep = template.find(n => n.id === depId);
          if (!dep) return true;
          const dl = dep.label.toLowerCase();
          return userSkills.some(s => dl.includes(s)) || extracted.some((s: string) => dl.includes(s));
        });
        if (depsMet) status = 'available';
      }
      return { ...node, status };
    });

    return { nodes: allNodes };
  }, [targetRole, userSkills, lastAnalysis]);

  // Compute pixel positions per stage/row
  const stageGroups = useMemo(() => {
    const map: Record<number, RoadmapNode[]> = {};
    nodes.forEach(n => { (map[n.stage] = map[n.stage] || []).push(n); });
    return map;
  }, [nodes]);

  const maxStage = Math.max(...nodes.map(n => n.stage));

  // Pixel position for a node
  const nodePos = (node: RoadmapNode) => {
    const siblings = stageGroups[node.stage] || [];
    const idx = siblings.indexOf(node);
    const count = siblings.length;
    const totalH = count * NODE_H + (count - 1) * NODE_GAP;
    const startY = (CANVAS_H - totalH) / 2;
    return {
      x: STAGE_PADDING + node.stage * (NODE_W + STAGE_GAP) + NODE_W / 2,
      y: startY + idx * (NODE_H + NODE_GAP) + NODE_H / 2,
    };
  };

  const CANVAS_H = 560;
  const CANVAS_W = STAGE_PADDING * 2 + (maxStage + 1) * NODE_W + maxStage * STAGE_GAP;

  const handleMarkAsLearned = async (node: RoadmapNode) => {
    setMarkingLearned(true);
    try {
      await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: node.label.split('(')[0].trim(), level: 'Intermediate', category: 'Roadmap' }),
      });
      fetchData();
      setSelectedNode(prev => prev ? { ...prev, status: 'completed' } : null);
    } catch (e) { console.error(e); }
    finally { setMarkingLearned(false); }
  };

  const readiness = Math.round((nodes.filter(n => n.status === 'completed').length / nodes.length) * 100);

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-slate-50 dark:bg-navy-950 transition-colors duration-500">

      {/* Top Stats Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 md:px-8 py-3 sm:py-4 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-navy-800/50 backdrop-blur-sm shrink-0 gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0 min-w-0">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Readiness</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[200px]">{targetRole}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <div className="w-24 sm:w-48 h-2 sm:h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden shrink-0">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${readiness}%` }}
                className="h-full bg-primary shadow-[0_0_12px_rgba(19,109,236,0.5)]"
              />
            </div>
            <span className="text-base sm:text-xl font-black text-primary shrink-0">{readiness}%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-6 text-xs font-bold text-slate-500">
          {[
            { color: 'bg-primary', label: 'Completed' },
            { color: 'bg-sky-400', label: 'Available' },
            { color: 'bg-slate-300 dark:bg-slate-700', label: 'Locked' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn('size-3 rounded-full', color)} />
              {label}
            </div>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="hidden lg:block text-[10px] text-slate-400 font-medium mr-1">Ctrl + scroll to zoom</span>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))} className="size-8 glass-panel rounded-lg flex items-center justify-center text-slate-500 hover:text-primary transition-all"><Minus size={16} /></button>
          <span className="text-xs font-bold text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="size-8 glass-panel rounded-lg flex items-center justify-center text-slate-500 hover:text-primary transition-all"><Plus size={16} /></button>
          <button onClick={() => setZoom(1)} className="size-8 glass-panel rounded-lg flex items-center justify-center text-slate-500 hover:text-primary transition-all"><Maximize2 size={14} /></button>
          <button onClick={() => setShowIntelligence(true)} className="lg:hidden size-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center hover:bg-primary/20 transition-all font-bold">
            <Sparkles size={16} />
          </button>
        </div>
      </div>

      {/* Canvas + Extra Skills sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scrollable Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-auto select-none"
          style={{ cursor: 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: CANVAS_W, height: CANVAS_H }}>
            <svg
              width={CANVAS_W}
              height={CANVAS_H}
              className="absolute top-0 left-0 pointer-events-none"
            >
              {/* Connection lines */}
              {nodes.map(node =>
                node.dependencies?.map(depId => {
                  const dep = nodes.find(n => n.id === depId);
                  if (!dep) return null;
                  const from = nodePos(dep);
                  const to = nodePos(node);
                  const both = node.status === 'completed' && dep.status === 'completed';
                  const mx = (from.x + to.x) / 2;
                  return (
                    <path
                      key={`${depId}-${node.id}`}
                      d={`M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`}
                      fill="none"
                      stroke={both ? 'var(--color-primary)' : '#334155'}
                      strokeWidth={both ? 2.5 : 1.5}
                      strokeDasharray={both ? undefined : '6 4'}
                      opacity={both ? 0.7 : 0.3}
                    />
                  );
                })
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const { x, y } = nodePos(node);
              const Icon = node.icon;
              const isActive = selectedNode?.id === node.id;
              return (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.08, zIndex: 30 }}
                  onClick={() => { if (!didDrag.current) setSelectedNode(node); }}
                  className="absolute flex flex-col items-center cursor-pointer"
                  style={{ left: x - NODE_W / 2, top: y - NODE_H / 2, width: NODE_W }}
                >
                  <div className={cn(
                    'size-16 rounded-2xl border-2 flex items-center justify-center shadow-lg transition-all duration-300',
                    node.status === 'completed' && 'border-primary bg-primary/10 text-primary shadow-primary/20',
                    node.status === 'available' && 'border-sky-400 bg-sky-400/10 text-sky-400 shadow-sky-400/20',
                    node.status === 'locked' && 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-white/5 text-slate-400 opacity-50',
                    isActive && 'ring-4 ring-primary/30 scale-110',
                  )}>
                    {node.status === 'completed' ? <Check size={28} /> : <Icon size={28} />}
                  </div>
                  <div className={cn(
                    'mt-2.5 px-2 py-1 rounded-lg text-center',
                    isActive ? 'bg-primary' : 'bg-white/60 dark:bg-navy-900/60 backdrop-blur-sm',
                  )}>
                    <span className={cn(
                      'text-[11px] font-bold leading-tight block',
                      node.status === 'completed' && !isActive && 'text-slate-900 dark:text-white',
                      node.status === 'available' && !isActive && 'text-sky-400',
                      node.status === 'locked' && !isActive && 'text-slate-400',
                      isActive && 'text-white',
                    )}>
                      {node.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Roadmap Intelligence / Suggestions Panel - Desktop */}
        <div className="hidden lg:block w-80 shrink-0 border-l border-slate-200 dark:border-white/5 bg-white/50 dark:bg-navy-800/50 overflow-y-auto p-6 space-y-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
              <Sparkles size={14} />
              Roadmap Intelligence
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Suggestions</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Personalized tips to accelerate your <span className="text-primary font-bold">{targetRole}</span> journey.</p>
          </div>

          <div className="space-y-4">
            {/* Suggestion 1: Foundations */}
            {nodes.filter(n => n.stage === 0 && n.status !== 'completed').length > 0 && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-xs">
                  <Layers size={14} />
                  Master Foundations
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  You have incomplete foundational nodes. Focus on <strong>{nodes.find(n => n.stage === 0 && n.status !== 'completed')?.label}</strong> before moving to advanced stages.
                </p>
              </div>
            )}

            {/* Suggestion 2: Readiness specific */}
            {readiness < 40 ? (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                  <Zap size={14} />
                  Quick Win
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Take a verification quiz for <strong>{nodes.find(n => n.status === 'available')?.label || 'next available skill'}</strong> to jumpstart your readiness score.
                </p>
              </div>
            ) : readiness < 80 ? (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                  <Check size={14} />
                  Bridging the Gap
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  You're making great progress! Try building the <strong>{lastAnalysis?.recommendedProjects?.[0]?.title || 'recommended project'}</strong> to verify your advanced skills.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs">
                  <Award size={14} />
                  Interview Ready
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your profile is highly competitive. Focus on **Role-Based Interview Prep** in the Career Coach to finalize your readiness.
                </p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-white/5">
            <Link to="/reports" className="group flex items-center justify-between p-4 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-white/5 hover:border-primary/50 transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className="size-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 size={16} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">View Full History</p>
                  <p className="text-[9px] text-slate-500">Track trend progress</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Intelligence Drawer */}
      <AnimatePresence>
        {showIntelligence && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIntelligence(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-navy-900 z-[70] shadow-2xl p-6 overflow-y-auto space-y-8 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                  <Sparkles size={14} />
                  Intelligence
                </div>
                <button onClick={() => setShowIntelligence(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Suggestions content */}
                {nodes.filter(n => n.stage === 0 && n.status !== 'completed').length > 0 && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                      <Layers size={14} />
                      Master Foundations
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Focus on <strong>{nodes.find(n => n.stage === 0 && n.status !== 'completed')?.label}</strong>.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                    <Zap size={14} />
                    Quick Win
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Verify <strong>{nodes.find(n => n.status === 'available')?.label || 'next available skill'}</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 dark:border-white/5">
                <Link to="/reports" className="group flex items-center justify-between p-4 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={16} className="text-primary" />
                    <span className="text-xs font-bold">View Full History</span>
                  </div>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Node Detail Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: 20 }}
            className="fixed sm:absolute bottom-4 right-4 sm:top-20 sm:bottom-auto z-40 w-[calc(100vw-2rem)] sm:w-72 glass-panel p-5 sm:p-6 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl space-y-4 sm:space-y-5"
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className={cn(
                'size-12 rounded-xl flex items-center justify-center',
                selectedNode.status === 'completed' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-500',
              )}>
                <selectedNode.icon size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 dark:text-white text-sm">{selectedNode.label}</h4>
                <span className={cn(
                  'text-[10px] font-bold uppercase tracking-widest',
                  selectedNode.status === 'completed' ? 'text-primary' :
                    selectedNode.status === 'available' ? 'text-sky-400' : 'text-slate-500',
                )}>
                  {selectedNode.status}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {selectedNode.status === 'completed'
                ? `You've mastered ${selectedNode.label}. This is a core pillar of your ${targetRole} path.`
                : `Mastering ${selectedNode.label} will significantly boost your readiness for ${targetRole} roles.`}
            </p>

            {selectedNode.status !== 'completed' && (
              <div className="space-y-2.5">
                {selectedNode.status === 'available' && (
                  <>
                    <button
                      onClick={() => setVerifyingSkill(selectedNode.label.split('(')[0].trim())}
                      className="w-full py-2.5 bg-primary/10 text-primary border border-primary/30 text-xs font-bold rounded-xl hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} />
                      Take Verification Quiz
                    </button>
                    <button
                      onClick={() => handleMarkAsLearned(selectedNode)}
                      disabled={markingLearned}
                      className="w-full py-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {markingLearned
                        ? <div className="size-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        : <Check size={14} />}
                      Mark as Learned
                    </button>
                  </>
                )}
                <button
                  onClick={() => window.open(`https://www.google.com/search?q=learn+${selectedNode.label.split('(')[0].trim()}+for+${targetRole}`, '_blank')}
                  className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  Find Learning Resources
                  <ExternalLink size={12} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Quiz */}
      <AnimatePresence>
        {verifyingSkill && (
          <SkillQuiz
            skill={verifyingSkill}
            onClose={() => setVerifyingSkill(null)}
            onSuccess={() => { setVerifyingSkill(null); fetchData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const STAGE_PADDING = 60;
