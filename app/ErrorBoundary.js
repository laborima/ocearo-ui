import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to display fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error and error information
    this.setState({ error, errorInfo });
    console.error("Error caught in Error Boundary:", error, errorInfo);
  }

  handleRefresh = () => {
    // Refresh the page
    window.location.reload();
  };

  handleExitFullscreen = () => {
    // Exit fullscreen if in fullscreen mode
    if (document.fullscreenElement) {
        window.close();
      document.exitFullscreen().catch((err) => {
        console.error("Failed to exit fullscreen:", err);
      });
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-hud-bg text-hud-main p-6">
          <div className="tesla-card p-10 max-w-2xl w-full bg-hud-elevated backdrop-blur-xl border border-hud rounded-3xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-oRed/20 flex items-center justify-center mb-8">
              <div className="w-4 h-4 rounded-full bg-oRed animate-soft-pulse" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-oRed mb-6">
              System Critical Error
            </h1>
            <p className="text-lg font-medium text-hud-main/80 mb-8 max-w-md">
              <span className="text-hud-muted uppercase text-xs font-black tracking-widest block mb-2">Technical Status</span>
              {error ? error.toString() : "Unknown exception detected in UI thread"}
            </p>
            {errorInfo && (
              <details className="w-full whitespace-pre-wrap bg-hud-bg/5 p-6 rounded-2xl mb-10 text-left border border-hud group">
                <summary className="cursor-pointer text-oBlue text-xs font-black uppercase tracking-widest hover:text-hud-main transition-colors flex items-center justify-between">
                  <span>Diagnostic Stack Trace</span>
                  <span className="opacity-40 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <pre className="mt-6 text-xs font-mono text-hud-muted overflow-auto max-h-60 custom-scrollbar leading-relaxed">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button
                onClick={this.handleRefresh}
                className="px-8 py-4 bg-oBlue hover:bg-blue-600 text-hud-main rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 shadow-lg shadow-oBlue/20 active:scale-95"
              >
                Reboot Session
              </button>
              <button
                onClick={this.handleExitFullscreen}
                className="px-8 py-4 bg-hud-elevated hover:bg-hud-bg text-hud-main border border-hud rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 active:scale-95"
              >
                Exit Console
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
