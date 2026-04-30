import { Component, type ErrorInfo, type ReactNode } from "react";
import { trackError } from "@/lib/error-tracker";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackError(
      `React crash: ${error.message}`,
      error.stack,
      {
        type: "react_error_boundary",
        componentStack: errorInfo.componentStack,
      }
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred. Our team has been notified and the details have been logged automatically.
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="gap-2 bg-emerald-600 text-white"
              data-testid="button-error-reload"
            >
              <RefreshCw className="w-4 h-4" />
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
