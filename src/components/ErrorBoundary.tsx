import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
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
    console.error('Unhandled error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-tg-light-bg dark:bg-tg-dark-bg text-tg-light-text dark:text-tg-dark-text">
          <div className="bg-tg-light-surface dark:bg-tg-dark-surface border border-red-200 dark:border-red-900/30 p-8 rounded-2xl max-w-md w-full flex flex-col items-center text-center shadow-lg">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-tg-light-hint dark:text-tg-dark-hint mb-6">
              An unexpected error occurred in the application. Please try reloading the page.
            </p>
            {this.state.error && (
              <div className="w-full bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-4 mb-6 text-left overflow-auto max-h-32">
                <code className="text-xs text-red-600 dark:text-red-400 font-mono break-words">
                  {this.state.error.toString()}
                </code>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors w-full justify-center"
            >
              <RefreshCw size={18} /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
