import { cancel } from '@clack/prompts';
import type { OrbitItErrorOptions } from '@orbit-it/core';
import { errorMessage } from '@utils/banners';
import colors from 'picocolors';

function formatError({ message, content }: OrbitItErrorOptions): string {
  const date = new Date().toLocaleString();
  const logDate = colors.gray(`[${date}]`);
  const logMessage = colors.bold(message || 'Unknown error');
  let logContent: string | string[] = '';

  if (Array.isArray(content) && content.length > 0) {
    logContent = content.map((msg) => {
      return `- ${msg.target ? `[${colors.red(`${msg.target}`)}]: ` : ''}${msg.message}`;
    });
  } else if (typeof content === 'string') {
    logContent = content;
  } else {
    logContent = errorMessage;
  }

  const completeLog = `${logDate}: ${logMessage}\n\n${logContent}`;

  return completeLog;
}

/**
 * @description Handles the cancellation of a command flow.
 * @param title - Optional title for the error message.
 * @param content - Optional content to display in the error message.
 */
export function onProcessCancel({
  message,
  content = [],
}: OrbitItErrorOptions): never {
  const completeLog = formatError({ message, content });

  // biome-ignore lint: Required for showing error in CLI
  console.error(completeLog);
  process.exit(1); // Exit the process with an error code
}

/**
 * @description Handles the cancellation of a `@clack/prompts` command flow.
 * @param message - Optional message to display on cancellation.
 */
export function onCommandFlowCancel(message?: string): never {
  cancel(message || 'Command flow cancelled by user.');
  process.exit(0); // Exit the process gracefully
}
