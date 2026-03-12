import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Plus, Trash2, Loader2, Sparkles, CheckCircle2, FileText, X, AlertCircle } from 'lucide-react';
import { analyzeSkills, analyzeResume, suggestJobRoles, RoleSuggestion } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

export default function Analyze() {
  const navigate = useNavigate();
  const { targetRole: globalTargetRole, setTargetRole: setGlobalTargetRole } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetRole, setTargetRole] = useState(globalTargetRole);
  const [manualSkills, setManualSkills] = useState(['React.js', 'TypeScript', 'Tailwind CSS', 'Node.js']);
  const [newSkill, setNewSkill] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [suggestions, setSuggestions] = useState<RoleSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const analysisSteps = [
    "Reading document structure...",
    "Extracting technical competencies...",
    "Mapping against market requirements...",
    "Identifying critical skill gaps...",
    "Generating project recommendations..."
  ];

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill && !manualSkills.includes(newSkill)) {
      setManualSkills([...manualSkills, newSkill]);
      setNewSkill('');
      setError(null);
    }
  };

  const removeSkill = (skill: string) => {
    setManualSkills(manualSkills.filter(s => s !== skill));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      setResumeFile(file);
      setIsSuggesting(true);
      
      try {
        let text = '';
        if (file.type === 'text/plain') {
          text = await file.text();
          setResumeText(text);
        } else {
          // Send to server immediately for suggestion context if PDF/DOCX
          const formData = new FormData();
          formData.append('resume', file);
          const parseRes = await fetch('/api/parse-resume', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });
          if (parseRes.ok) {
            const data = await parseRes.json();
            text = data.text;
            setResumeText(text);
          } else {
            setResumeText('__pending__');
          }
        }

        if (text) {
          const suggestions = await suggestJobRoles(text);
          setSuggestions(suggestions);
        }
      } catch (err) {
        console.error('Suggestion failed:', err);
      } finally {
        setIsSuggesting(false);
      }
    }
  };

  // Live suggestions when skills or resume text changes
  React.useEffect(() => {
    const updateSuggestions = async () => {
      let text = resumeText;
      if (!text && manualSkills.length > 0) {
        text = manualSkills.join(' ');
      }
      
      if (text && text !== '__pending__') {
        const suggs = await suggestJobRoles(text);
        setSuggestions(suggs);
      } else if (!text) {
        setSuggestions([]);
      }
    };
    
    // Debounce to avoid excessive re-renders during typing/adding skills
    const timer = setTimeout(updateSuggestions, 500);
    return () => clearTimeout(timer);
  }, [manualSkills, resumeText]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setError(null);

    // Simulate progress steps
    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => (prev < analysisSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      let result;
      let finalSkills = manualSkills;

      if (resumeFile) {
        let textToAnalyze = resumeText;

        // If PDF/DOCX — send to server for real extraction first
        if (resumeText === '__pending__' || (!resumeText && resumeFile)) {
          const formData = new FormData();
          formData.append('resume', resumeFile);
          const parseRes = await fetch('/api/parse-resume', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });
          if (parseRes.ok) {
            const { text } = await parseRes.json();
            textToAnalyze = text;
            setResumeText(text);
          } else {
            throw new Error('Could not extract text from resume. Try uploading a .txt version.');
          }
        }

        const resumeResult = await analyzeResume(targetRole, textToAnalyze);
        result = resumeResult;
        finalSkills = resumeResult.extractedSkills || [];
      } else {
        result = await analyzeSkills(targetRole, manualSkills);
      }

      if (!result || typeof result.matchScore !== 'number') {
        throw new Error('Invalid analysis result from AI');
      }

      // Ensure we stay on the last step for a moment
      setAnalysisStep(analysisSteps.length - 1);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update global target role if it changed
      if (targetRole !== globalTargetRole) {
        setGlobalTargetRole(targetRole);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          targetRole,
          skills: finalSkills,
          ...result
        })
      });

      // Save failure is non-fatal — still navigate to results
      if (!response.ok) {
        console.warn('Analysis computed but could not be saved (DB unavailable). Navigating anyway.');
      }

      clearInterval(stepInterval);
      navigate('/reports');
    } catch (error: any) {
      clearInterval(stepInterval);
      console.error('Analysis failed:', error);
      setError(error.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="space-y-4 px-4 sm:px-0">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">Analyze Your Skills</h1>
        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">Upload your resume or enter details manually to visualize your skill gaps.</p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-sm font-bold"
        >
          <AlertCircle size={18} />
          {error}
        </motion.div>
      )}

      {/* Target Role */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-primary">
          <div className="size-6 rounded-full border-2 border-primary flex items-center justify-center">
            <div className="size-2 bg-primary rounded-full" />
          </div>
          <h3 className="font-bold uppercase tracking-widest text-xs">What is your Target Job Role?</h3>
        </div>
        <select
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        >
          <option value="Backend Developer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Backend Developer</option>
          <option value="Frontend Developer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Frontend Developer</option>
          <option value="Fullstack Engineer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Fullstack Engineer</option>
          <option value="Data Scientist" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Data Scientist</option>
          <option value="DevOps Engineer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">DevOps Engineer</option>
          <option value="Mobile Developer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Mobile Developer</option>
          <option value="Artificial Intelligence / Machine Learning Engineer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Artificial Intelligence / Machine Learning Engineer</option>
          <option value="Cybersecurity Engineer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Cybersecurity Engineer</option>
          <option value="Cloud Engineer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Cloud Engineer</option>
          <option value="Product Manager" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Product Manager</option>
          <option value="UI/UX Designer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">UI/UX Designer</option>
          <option value="Robotics Engineer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Robotics Engineer</option>
          <option value="Blockchain Developer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Blockchain Developer</option>
          <option value="AI Prompt Engineer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">AI Prompt Engineer</option>
          <option value="Digital Marketing Specialist" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Digital Marketing Specialist</option>
          <option value="Business Analyst" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Business Analyst</option>
          <option value="Data Engineer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">Data Engineer</option>
          <option value="IoT Engineer" className="bg-white dark:bg-navy-800 text-slate-900 dark:text-white">IoT Engineer</option>
        </select>
      </section>

      {/* Suggested Roles */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 text-primary">
              <Sparkles size={18} />
              <h3 className="font-bold uppercase tracking-widest text-xs">Recommended for You</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.role}
                  onClick={() => {
                    setTargetRole(suggestion.role);
                    // Visual feedback
                  }}
                  className={cn(
                    "p-4 rounded-2xl border text-left transition-all group relative overflow-hidden",
                    targetRole === suggestion.role
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/10"
                      : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-primary/50"
                  )}
                >
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <h4 className="font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors pr-8">
                      {suggestion.role}
                    </h4>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0">
                      {suggestion.matchScore}% Match
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 relative z-10 leading-relaxed">
                    {suggestion.reason}
                  </p>
                  {targetRole === suggestion.role && (
                    <div className="absolute top-2 right-2 text-primary">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={60} />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Based on your resume analysis. Click a role to set it as your target.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Resume Upload */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 text-primary">
          <Upload size={18} />
          <h3 className="font-bold uppercase tracking-widest text-xs">Resume Upload</h3>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.docx,.txt"
        />

        {!resumeFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-12 flex flex-col items-center justify-center gap-4 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="font-bold text-lg text-slate-900 dark:text-white">Drag & Drop Resume</p>
              <p className="text-xs text-slate-500 mt-1">Support PDF, DOCX, TXT (Max 5MB)</p>
            </div>
            <button className="mt-2 px-6 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-sm font-bold transition-all text-slate-700 dark:text-slate-300">
              Browse Files
            </button>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-6 flex items-center justify-between border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="size-10 sm:size-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                  <FileText size={24} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{resumeFile.name}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500">{(resumeFile.size / 1024).toFixed(1)} KB • Ready</p>
                </div>
              </div>
            <button
              onClick={() => {
                setResumeFile(null);
                setResumeText('');
              }}
              className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </section>

      {/* Manual Input - Only show if no resume uploaded */}
      {!resumeFile && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <Plus size={18} />
            <h3 className="font-bold uppercase tracking-widest text-xs">Manual Skill Input</h3>
          </div>
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              {manualSkills.map(skill => (
                <span key={skill} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg border border-primary/20">
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-white">
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
              <form onSubmit={handleAddSkill} className="flex-1 min-w-[150px]">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
                />
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Analyze Button */}
      <div className="pt-8">
        {isAnalyzing ? (
          <div className="glass-panel rounded-2xl p-8 space-y-6 border border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin text-primary" size={24} />
                <h4 className="font-bold text-slate-900 dark:text-white">AI Analysis in Progress</h4>
              </div>
              <span className="text-xs font-bold text-primary">{Math.round(((analysisStep + 1) / analysisSteps.length) * 100)}%</span>
            </div>

            <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
                className="h-full bg-primary shadow-[0_0_15px_rgba(19,109,236,0.5)]"
              />
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
              <Sparkles size={16} className="text-primary animate-pulse" />
              <p className="italic">{analysisSteps[analysisStep]}</p>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!resumeFile && manualSkills.length === 0)}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98]"
            >
              <Sparkles size={20} />
              {resumeFile ? 'Analyze Resume & Discover Gaps' : 'Analyze Profile & Discover Gaps'}
            </button>
            <p className="text-center text-slate-500 text-xs mt-4">Our AI will scan your {resumeFile ? 'resume' : 'profile'} against 10,000+ job descriptions.</p>
          </>
        )}
      </div>
    </motion.div>
  );
}
