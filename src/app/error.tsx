"use client";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Something broke</h1>
          <div className="subtitle">{error.message}</div>
        </div>
      </div>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </>
  );
}
