import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Palette, Type, PanelLeft, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const {
    themeMode, setThemeMode,
    accentColor, setAccentColor,
    fontSize, setFontSize,
    sidebarExpanded, setSidebarExpanded
  } = useTheme();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch('/api/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setName(data.name);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        setName(data.user.name);
        window.dispatchEvent(new CustomEvent('user-updated', { detail: data.user }));
        toast('Profile saved successfully!', 'success');
      } else {
        toast(data.error || 'Failed to save profile.', 'error');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const accentColors = ['#136dec', '#f43f5e', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Theme & UI Settings</h1>
        <p className="text-slate-600 dark:text-slate-500">Customize your workspace appearance and interaction preferences.</p>
      </div>

      <div className="space-y-10">
        {/* Profile Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Your Profile</h3>
          <div className="p-8 glass-panel rounded-3xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-navy-800/50 flex flex-col sm:flex-row items-center gap-8">
            <div className="size-24 rounded-full bg-primary/10 border-4 border-white dark:border-navy-900 flex items-center justify-center text-primary text-3xl font-black shadow-xl">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 space-y-4 text-center sm:text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-panel border-none rounded-xl py-3 px-4 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    disabled
                    className="w-full glass-panel border-none rounded-xl py-3 px-4 text-sm text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Appearance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setThemeMode('light')}
              className={`p-6 border-2 rounded-2xl transition-all text-left ${themeMode === 'light'
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/10'
                }`}
            >
              <div className="flex justify-between items-center mb-4">
                <Sun size={24} className={themeMode === 'light' ? 'text-primary' : 'text-slate-400'} />
                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${themeMode === 'light' ? 'border-primary' : 'border-slate-300 dark:border-white/20'
                  }`}>
                  {themeMode === 'light' && <div className="size-2.5 bg-primary rounded-full" />}
                </div>
              </div>
              <p className={`font-bold ${themeMode === 'light' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Light Mode</p>
              <p className="text-xs text-slate-500">Classic bright look</p>
            </button>

            <button
              onClick={() => setThemeMode('dark')}
              className={`p-6 border-2 rounded-2xl transition-all text-left ${themeMode === 'dark'
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/10'
                }`}
            >
              <div className="flex justify-between items-center mb-4">
                <Moon size={24} className={themeMode === 'dark' ? 'text-primary' : 'text-slate-400'} />
                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${themeMode === 'dark' ? 'border-primary' : 'border-slate-300 dark:border-white/20'
                  }`}>
                  {themeMode === 'dark' && <div className="size-2.5 bg-primary rounded-full" />}
                </div>
              </div>
              <p className={`font-bold ${themeMode === 'dark' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Dark Mode</p>
              <p className="text-xs text-slate-500">Reduced eye strain</p>
            </button>
          </div>
        </section>

        {/* Accent Color */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Accent Color</h3>
          <div className="flex flex-wrap gap-4 p-6 glass-panel rounded-2xl border border-slate-200 dark:border-white/5 bg-white/50 dark:bg-navy-800/50">
            {accentColors.map((color) => (
              <button
                key={color}
                onClick={() => setAccentColor(color)}
                className={`size-12 rounded-full border-4 border-white dark:border-navy-900 ring-2 transition-all hover:scale-110 ${accentColor === color ? 'ring-primary' : 'ring-transparent'
                  }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <div className="h-12 w-px bg-slate-200 dark:bg-white/10 mx-2" />
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="size-12 rounded-full bg-slate-100 dark:bg-white/5 border-4 border-white dark:border-navy-900 cursor-pointer overflow-hidden"
              />
              <span className="text-xs font-mono text-slate-500 uppercase">{accentColor}</span>
            </div>
          </div>
        </section>

        {/* Layout & Interaction */}
        <section className="space-y-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Layout & Interaction</h3>

          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="w-full flex items-center justify-between p-6 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-left"
          >
            <div className="flex gap-4 items-center">
              <div className={`p-3 rounded-xl ${sidebarExpanded ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-white/5 text-slate-500'}`}>
                <PanelLeft size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Expanded Sidebar</p>
                <p className="text-xs text-slate-500">Show full labels in the navigation menu</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative p-1 transition-colors ${sidebarExpanded ? 'bg-primary' : 'bg-slate-300 dark:bg-white/10'}`}>
              <motion.div
                animate={{ x: sidebarExpanded ? 24 : 0 }}
                className="size-4 bg-white rounded-full shadow-sm"
              />
            </div>
          </button>

          <div className="p-6 glass-panel rounded-2xl border border-slate-200 dark:border-white/5 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500">
                  <Type size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Base Font Size</p>
                  <p className="text-xs text-slate-500">Adjust the overall scale of the UI</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-primary/10 text-primary px-3 py-1 rounded-lg border border-primary/20">{fontSize}px</span>
            </div>
            <div className="space-y-4">
              <input
                type="range"
                min="12"
                max="20"
                step="1"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full accent-primary bg-slate-200 dark:bg-white/10 h-2 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">
                <span>Small (12px)</span>
                <span>Standard (16px)</span>
                <span>Large (20px)</span>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex gap-4">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="animate-spin" size={18} />}
            Apply & Refresh
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="px-8 py-4 border border-slate-200 dark:border-white/10 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </motion.div>
  );
}
