export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-red mx-auto mb-4"></div>
        <div className="text-text-primary text-lg">Loading edit offer page...</div>
        <div className="text-text-secondary text-sm mt-2">Please wait while we load the offer details.</div>
      </div>
    </div>
  );
}

