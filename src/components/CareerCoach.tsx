import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Send,
  User,
  Bot,
  X,
  Loader2,
  Sparkles,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getCoachResponse } from '../services/geminiService';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function CareerCoach() {
  const { targetRole } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resetChat = useCallback(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Hello! I'm your Career Coach. I can help you with your path to becoming a **${targetRole}**. Ask me about interview prep, skill building, or market insights!`,
        timestamp: new Date(),
        suggestions: [
          `Interview prep for ${targetRole}`,
          'Resume tips for tech roles',
          'Salary expectations'
        ]
      }
    ]);
  }, [targetRole]);

  useEffect(() => {
    if (isOpen && messages.length === 0) resetChat();
  }, [isOpen, messages.length, resetChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Artificial delay for "expert thought" feel
    setTimeout(() => {
      const response = getCoachResponse(text, targetRole);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        suggestions: response.suggestions
      }]);
      setIsLoading(false);
    }, 600);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };


  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 size-16 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
          >
            <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 size-5 bg-neon-green rounded-full border-4 border-white dark:border-navy-950 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end p-4 sm:p-8 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
            />

            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md h-full glass-panel rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
            >
              <div className="p-6 border-b border-white/10 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Career Coach</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="size-1.5 bg-neon-green rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expert Advice</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={resetChat}
                    title="Clear chat"
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-amber-400 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'assistant' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                        }`}>
                        {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant'
                        ? 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-tl-none'
                        : 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
                        }`}>
                        <div className="markdown-body">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                        <span className={`text-[8px] mt-2 block opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Bot size={18} />
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                        <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="size-2 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                {/* Dynamic Suggestions for the last assistant message */}
                {!isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].suggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col gap-2 pt-2"
                  >
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Follow up questions</p>
                    <div className="flex flex-wrap gap-2">
                      {messages[messages.length - 1].suggestions?.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(s)}
                          className="px-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-primary hover:bg-primary/5 hover:text-primary rounded-xl text-xs font-bold transition-all text-slate-600 dark:text-slate-400 text-left flex items-center gap-2 group shadow-sm"
                        >
                          {s}
                          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Removed static initial suggestions block since it's now handled dynamically */}

              <div className="p-6 border-t border-white/10 bg-slate-50/50 dark:bg-navy-900/50">
                <form onSubmit={handleFormSubmit} className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask your coach anything..."
                    disabled={isLoading}
                    className="w-full bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-primary/20"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  <Sparkles size={10} className="text-primary" />
                  Expert Career Insights
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
