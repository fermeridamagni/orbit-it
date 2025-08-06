import { cancel } from '@clack/prompts';

/**
 * @description Handles the cancellation of a command flow.
 * @param {string} [message] - Optional message to display on cancellation.
 */
export function onCommandFlowCancel(message?: string): never {
  cancel(message || 'Unknown error: Operation cancelled.');
  process.exit(1); // Exit the process with an error code
}

/**
 * @description Handles errors in the command flow.
 * @param {Error} error - The error object containing the error message.
 */
export function onCommandFlowError(error: Error): never {
  onCommandFlowCancel(error.message);
}
