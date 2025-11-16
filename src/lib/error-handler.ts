/**
 * Centralized error handling utilities
 */

interface ErrorLogOptions {
  context?: string;
  data?: any;
  silent?: boolean;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Logs errors in development, silently handles in production
 */
export const logError = (error: Error | unknown, options: ErrorLogOptions = {}) => {
  if (process.env.NODE_ENV === 'development' && !options.silent) {
    console.group(`[Error${options.context ? ` - ${options.context}` : ''}]`);
    console.error(error);
    if (options.data) {
      console.log('Additional data:', options.data);
    }
    console.groupEnd();
  }
  
  // In production, you could send to error tracking service here
  // e.g., Sentry, LogRocket, etc.
};

/**
 * Handles async errors with optional retry logic
 */
export const handleAsyncError = async <T>(
  fn: () => Promise<T>,
  options: ErrorLogOptions & { retries?: number; retryDelay?: number } = {}
): Promise<T | null> => {
  const { retries = 0, retryDelay = 1000, ...logOptions } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        logError(error, logOptions);
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  return null;
};

/**
 * Gets user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again.';
};
