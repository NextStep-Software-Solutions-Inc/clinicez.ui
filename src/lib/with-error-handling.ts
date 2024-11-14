
type CustomErrorHandler = (error: unknown) => string;
type AsyncFunction<T, A extends any[]> = (...args: A) => Promise<{ status: boolean, message: string, data: T }>;
type Result<T> = { status: boolean, message: string, data: T | null };
type FinalResult<T extends (...args: any[]) => Promise<any>> = (...args: Parameters<T>) => Promise<Result<Awaited<ReturnType<T>>>>;

// Simplified promiseWrapper function
export const promiseWrapper = <T, A extends any[]>(originalFn: AsyncFunction<T, A>): AsyncFunction<T | null, A> => {
  return (...args: A): Promise<Result<T | null>> => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await originalFn(...args);
        if (res.status) {
          resolve(res);
        } else {
          reject(res.message);
        }
      } catch (error) {
        reject(error);
      }
    });
  };
};

export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T, customErrorHandler?: CustomErrorHandler): FinalResult<T> {
  return async (...args: Parameters<T>) => {
    let message = "Operation completed successfully";
    try {
      const result = await fn(...args);
      return { ...result, status: true, message };
    } catch (error) {
      if (error instanceof Error) message = error.message;
      if (customErrorHandler) message = customErrorHandler(error);
      return { status: false, message, data: null };
    }
  };
}