import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught React runtime error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
          <div className="max-w-md w-full text-center bg-white dark:bg-[#1E293B] p-8 rounded-3xl shadow-lg border border-slate-200 dark:border-white/10 flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Something went wrong</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                An unexpected application rendering error occurred. You can retry the operation or return to the main dashboard.
              </p>
              {this.state.error?.message && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[11px] font-mono text-left break-all max-h-32 overflow-y-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow hover:opacity-90 transition-all cursor-pointer"
              >
                Retry Request
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
