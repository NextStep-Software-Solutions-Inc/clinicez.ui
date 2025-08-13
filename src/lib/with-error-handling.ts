import { hasContextProperty } from '@/lib/utils'

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


type CustomErrorHandler = (error: unknown, context: unknown) => Promise<string | undefined> | string | undefined;
type FunctionWithMessageAndData<T, A extends unknown[] = unknown[]> = (...args: A) => Promise<{ message: string; data: T }>;
type FinalResult<T extends FunctionWithMessageAndData<any>> = (...args: Parameters<T>) => Promise<Result<Awaited<ReturnType<T>>['data']>>;

export function withErrorHandling<TData, A extends unknown[]>(
  fn: FunctionWithMessageAndData<TData, A>,
  customErrorHandler?: CustomErrorHandler
): (...args: A) => Promise<Result<TData>> {
  return async (...args: A): Promise<Result<TData>> => {
    let message = "Operation completed successfully";
    try {
      const result = await fn(...args);
      return { ...result, status: true };
    } catch (error) {
      console.error(`Error in function: ${fn.name}: ${error}`);
      if (error instanceof Error) message = error.message;
      if (customErrorHandler) {
        const maybe = customErrorHandler(error, { functionName: fn.name, args });
        const m = maybe instanceof Promise ? await maybe : maybe;
        if (m !== undefined && m !== null) message = m.toString();
      };
      return { status: false, message, data: null };
    }
  };
}
