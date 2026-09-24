"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

import Button from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-lg border border-danger-muted bg-surface text-center shadow-card">
        <h1 className="text-xl text-primary">Something went wrong</h1>

        <p className="mt-2 text-sm text-secondary">
          The page could not be loaded. Please try again. If it keeps
          happening, check that the database is running.
        </p>

        {error.digest && (
          <p className="mt-2 text-xs text-muted">
            Reference: {error.digest}
          </p>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Button
            type="button"
            onClick={reset}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Try again
          </Button>

          <Button href="/dashboard" variant="secondary">
            Go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
