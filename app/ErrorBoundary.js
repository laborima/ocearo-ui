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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-900">
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Something went wrong.
          </h1>
          <p className="text-lg mb-2">
            <strong>Error:</strong> {error ? error.toString() : "Unknown error"}
          </p>
          {errorInfo && (
            <details className="whitespace-pre-wrap bg-gray-200 p-4 rounded-lg mb-4">
              <summary className="cursor-pointer text-blue-500 underline">
                Stack Trace
              </summary>
              <pre className="mt-2">{errorInfo.componentStack}</pre>
            </details>
          )}
          <div className="flex space-x-4">
            <button
              onClick={this.handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Page
            </button>
            <button
              onClick={this.handleExitFullscreen}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Exit Fullscreen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
