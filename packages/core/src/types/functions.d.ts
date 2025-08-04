/**
 * @description The result type for functions that return a success or failure message.
 */
export type FunctionResult<T = { [key: string]: string } | undefined | null> = {
  success: boolean;
  message: string;
  data?: T; // Optional data returned on success
};
