import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface State { hasError: boolean; message: string; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, message: '' };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('Uncaught error:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950 p-8">
                    <div className="max-w-md text-center space-y-6">
                        <div className="size-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                            <AlertTriangle size={40} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Something went wrong</h2>
                            <p className="text-slate-500 text-sm">{this.state.message || 'An unexpected error occurred.'}</p>
                        </div>
                        <button
                            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload(); }}
                            className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                        >
                            Reload App
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
