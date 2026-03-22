import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary p-4 border border-red-500 bg-red-50 rounded m-4">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong.</h2>
          <details className="whitespace-pre-wrap text-sm text-red-600">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              this.setState({ hasError: false });
              if (this.props.onReset) this.props.onReset();
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
