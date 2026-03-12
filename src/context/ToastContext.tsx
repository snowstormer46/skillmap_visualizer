import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-500',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    info: 'bg-primary/10 border-primary/30 text-primary',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 items-center pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => {
                        const Icon = icons[t.type];
                        return (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl text-sm font-bold pointer-events-auto max-w-sm ${styles[t.type]}`}
                            >
                                <Icon size={18} className="shrink-0" />
                                <span className="flex-1 text-slate-800 dark:text-white">{t.message}</span>
                                <button onClick={() => dismiss(t.id)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
                                    <X size={14} />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within a ToastProvider');
    return ctx;
}
