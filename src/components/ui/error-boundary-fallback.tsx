import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback = ({ error, resetError }: ErrorFallbackProps) => {
  return (
    <div className="min-h-[400px] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">
            We encountered an error while loading this content.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-left bg-muted p-3 rounded-lg mt-4">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 whitespace-pre-wrap text-destructive">
                {error.message}
              </pre>
            </details>
          )}
        </div>
        <Button onClick={resetError} variant="outline">
          Try Again
        </Button>
      </div>
    </div>
  );
};
