


type AsyncFunction<T, A extends any[]> = (...args: A) => Promise<{ status: boolean, message: string, data: T }>;
type Result<T> = { status: boolean, message: string, data: T | null };
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


type CustomErrorHandler = (error: unknown) => string | undefined;
type FunctionWithMessageAndData<T> = (...args: any[]) => Promise<{ message: string; data: T }>;
type FinalResult<T extends FunctionWithMessageAndData<any>> = (...args: Parameters<T>) => Promise<Result<Awaited<ReturnType<T>>['data']>>;

export function withErrorHandling<T extends FunctionWithMessageAndData<any>>(
  fn: T,
  customErrorHandler?: CustomErrorHandler
): FinalResult<T> {
  return async (...args: Parameters<T>): Promise<Result<Awaited<ReturnType<T>>['data']>> => {
    let message = "Operation completed successfully";
    try {
      const result = await fn(...args);
      return { ...result, status: true };
    } catch (error) {
      console.error(`Error in function: ${fn.name}: ${error}`);
      if (error instanceof Error) message = error.message;
      if (customErrorHandler) {
        const m = customErrorHandler(error);
        message = ((m as any) instanceof Promise ? await (m as unknown as Promise<string | undefined>) : m) || message;
      };
      return { status: false, message, data: null };
    }
  };
}
