import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'An unexpected error occurred in the studio interface.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF6F1] text-[#1E1816] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E5DAD0] rounded-2xl p-8 space-y-4">
            <p className="text-xs tracking-widest uppercase text-[#7B1829] font-medium">
              Signature Artistry by Farhana
            </p>
            <h1 className="text-2xl font-serif font-semibold">
              We paused to protect your session
            </h1>
            <p className="text-sm text-[#6B5B53] leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-[#7B1829] text-white text-sm font-medium rounded-lg hover:bg-[#61111F] transition-colors whitespace-nowrap"
            >
              Reload Studio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
