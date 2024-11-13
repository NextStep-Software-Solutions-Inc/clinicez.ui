type AsyncFunctionResult<T> = {
    message: string;
    data: T;
  };
type AsyncFunction<T> = (...args: any[]) => Promise<AsyncFunctionResult<T>>;
type CustomErrorHandler = (error: unknown) => string;

export const withErrorHandling = <T>(fn: AsyncFunction<T>, customErrorHandler?: CustomErrorHandler) => async (...args: any[]): Promise<{ status: boolean, message: string, data: T  | null }> => {
  let message = "Operation completed successfully";
  try {

    const result = await fn(...args);
   
    return { status: true, message: result.message, data: result.data };

  } catch (error) {

    console.error(`Error: ${error}`);
    if (error instanceof Error) message = error.message;
    if (customErrorHandler) message = customErrorHandler(error);

    return { status: false, message, data: null };
  }
};