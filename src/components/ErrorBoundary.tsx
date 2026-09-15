import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ArtisanPro ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', '/');
      } catch {
        // ignore
      }
    }
  };

  private handleFullReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleSafeStorageReset = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('artisanpro_social_posts');
      } catch (e) {
        console.warn(e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF6B00] flex items-center justify-center mx-auto border border-orange-200 shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-neutral-900">
                Une interruption est survenue
              </h2>
              <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                L'application a intercepté une anomalie d'affichage. Vos données sont protégées. Cliquez ci-dessous pour reprendre votre navigation en toute sécurité.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-neutral-50 rounded-xl p-3 text-left border border-neutral-200 overflow-x-auto text-[11px] font-mono text-neutral-700 max-h-32">
                <span className="font-bold text-red-600 block">Détail technique :</span>
                {this.state.error.toString()}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-3 rounded-xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reprendre la navigation</span>
              </button>

              <button
                type="button"
                onClick={this.handleFullReload}
                className="w-full py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Recharger la page</span>
              </button>

              <button
                type="button"
                onClick={this.handleSafeStorageReset}
                className="w-full py-2 rounded-xl text-[11px] text-neutral-400 hover:text-neutral-700 font-medium transition-colors cursor-pointer"
              >
                Nettoyer le cache local temporaire
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
