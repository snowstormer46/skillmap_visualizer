import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Trophy,
  RefreshCw,
  BadgeCheck
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '../lib/utils';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface SkillQuizProps {
  skill: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SkillQuiz({ skill, onClose, onSuccess }: SkillQuizProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentStep(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Generate a 3-question multiple choice quiz to verify proficiency in the skill: "${skill}". 
        Each question should have 4 options and a clear explanation for the correct answer.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER, description: "0-indexed index of the correct option" },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || '[]');
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No questions were generated. Please try again.');
      }
      setQuestions(data);
    } catch (err: any) {
      console.error('Quiz Generation Error:', err);
      setError(err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQuiz();
  }, [skill]);

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    const isCorrect = selectedOption === questions[currentStep].correctAnswer;
    if (isCorrect) setScore(prev => prev + 1);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleSaveSkill = async () => {
    setSaving(true);
    try {
      // Check if skill is already verified to avoid duplicates
      const existingRes = await fetch('/api/skills', { credentials: 'include' });
      if (existingRes.ok) {
        const existing: any[] = await existingRes.json();
        const isDuplicate = existing.some(s => s.name.toLowerCase() === skill.toLowerCase());
        if (isDuplicate) {
          setAlreadySaved(true);
          setSaving(false);
          return;
        }
      }

      await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: skill,
          level: score === 3 ? 'Expert' : 'Intermediate',
          category: 'Verified'
        })
      });
      onSuccess();
    } catch (err) {
      console.error('Error saving skill:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-xl glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Loading State */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-6">
            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary relative">
              <Loader2 className="animate-spin" size={40} />
              <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" size={24} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Generating Verification Quiz</h3>
              <p className="text-sm text-slate-500">AI is crafting questions for <span className="text-primary font-bold">{skill}</span>...</p>
            </div>
          </div>

          /* Error State */
        ) : error ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-6 text-center">
            <div className="size-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Quiz Generation Failed</h3>
              <p className="text-sm text-slate-500 max-w-sm">{error}</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-bold rounded-xl transition-all hover:bg-slate-300 dark:hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={generateQuiz}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          </div>

          /* Result State */
        ) : isFinished ? (
          <div className="p-12 text-center space-y-8">
            <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto shadow-xl shadow-primary/10">
              <Trophy size={48} />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">Quiz Complete!</h3>
              <p className="text-slate-500">
                You scored <span className="text-primary font-bold">{score} out of {questions.length}</span>.
              </p>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
              {alreadySaved ? (
                <div className="space-y-4">
                  <p className="text-sm text-primary font-bold flex items-center justify-center gap-2">
                    <BadgeCheck size={18} />
                    Already in Your Verified Skills!
                  </p>
                  <p className="text-xs text-slate-500">{skill} was already verified. No duplicates added.</p>
                  <button onClick={onClose} className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                    Close
                  </button>
                </div>
              ) : score >= 2 ? (
                <div className="space-y-4">
                  <p className="text-sm text-emerald-500 font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} />
                    Verification Successful!
                  </p>
                  <p className="text-xs text-slate-500">Add this verified skill to your profile to boost your alignment score.</p>
                  <button
                    onClick={handleSaveSkill}
                    disabled={saving}
                    className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:scale-100"
                  >
                    {saving && <Loader2 className="animate-spin" size={18} />}
                    Add to Verified Skills
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-amber-500 font-bold flex items-center justify-center gap-2">
                    <AlertCircle size={18} />
                    Needs More Practice
                  </p>
                  <p className="text-xs text-slate-500">We recommend reviewing {skill} concepts and trying again later.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={generateQuiz}
                      className="flex-1 py-4 bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-slate-300 dark:hover:bg-white/20"
                    >
                      <RefreshCw size={16} />
                      Retry
                    </button>
                    <button
                      onClick={onClose}
                      className="flex-1 py-4 bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white font-black rounded-xl transition-all hover:bg-slate-300 dark:hover:bg-white/20"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          /* Quiz State */
        ) : (
          <div className="p-8 sm:p-10 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Question {currentStep + 1} of {questions.length}</span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">{skill} Verification</h4>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                className="h-full bg-primary"
              />
            </div>

            {/* Question */}
            <div className="space-y-6">
              <p className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {questions[currentStep].question}
              </p>

              <div className="grid grid-cols-1 gap-3">
                {questions[currentStep].options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleOptionSelect(i)}
                    className={cn(
                      "w-full p-4 rounded-xl text-left text-sm font-medium transition-all border-2",
                      selectedOption === i
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-slate-200 dark:hover:border-white/10 text-slate-600 dark:text-slate-400",
                      isAnswered && i === questions[currentStep].correctAnswer && "border-emerald-500 bg-emerald-500/10 text-emerald-500",
                      isAnswered && selectedOption === i && i !== questions[currentStep].correctAnswer && "border-rose-500 bg-rose-500/10 text-rose-500"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      {option}
                      {isAnswered && i === questions[currentStep].correctAnswer && <CheckCircle2 size={16} />}
                      {isAnswered && selectedOption === i && i !== questions[currentStep].correctAnswer && <AlertCircle size={16} />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border-l-4 border-primary"
                >
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    <span className="font-bold text-primary mr-1">Explanation:</span>
                    {questions[currentStep].explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <div className="pt-4">
              {!isAnswered ? (
                <button
                  onClick={handleConfirm}
                  disabled={selectedOption === null}
                  className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
                >
                  Confirm Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl flex items-center justify-center gap-2 hover:scale-105 transition-all"
                >
                  {currentStep === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
