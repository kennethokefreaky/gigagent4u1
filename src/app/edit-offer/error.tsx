'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Edit Offer Page Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-text-primary font-bold text-xl mb-2">Something went wrong!</h2>
        <p className="text-text-secondary text-sm mb-6">
          There was an error loading the edit offer page. This might be due to missing offer data or a network issue.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-button-red text-white py-3 rounded-lg font-semibold hover:bg-button-red-hover transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/notifications'}
            className="w-full bg-surface border border-text-secondary text-text-primary py-3 rounded-lg font-semibold hover:bg-input-background transition-colors"
          >
            Back to Notifications
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-text-secondary text-sm cursor-pointer">Error Details</summary>
            <pre className="text-xs text-text-secondary mt-2 p-2 bg-surface rounded border overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

