import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-xl font-semibold">Något gick fel</h2>
          <p className="text-muted-foreground max-w-sm text-sm">
            {this.state.error?.message ?? 'Ett oväntat fel uppstod.'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
          >
            Försök igen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
