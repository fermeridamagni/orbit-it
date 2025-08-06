import { cancel } from '@clack/prompts';
import { errorOutro } from '@utils/banners';
import { bold, gray, red } from 'picocolors';

type CancelContent = { message: string; target?: string };

/**
 * @description Handles the cancellation of a command flow.
 * @param title - Optional title for the error message.
 * @param content - Optional content to display in the error message.
 */
export function onProcessCancel({
  title,
  content = [],
}: {
  title?: string;
  content?: string | CancelContent[];
}): never {
  const date = new Date().toLocaleString();
  const logDate = gray(`[${date}]:`);
  const logTitle = bold(title || 'Unknown error');
  let logMessage: string | string[] = '';

  if (Array.isArray(content) && content.length > 0) {
    logMessage = content.map((msg: CancelContent) => {
      return `- ${msg.target ? `[${red(`${msg.target}`)}]: ` : ''}${msg.message}`;
    });
  } else if (typeof content === 'string') {
    logMessage = content;
  } else {
    logMessage = errorOutro;
  }

  const completeLog = `${logDate} ${logTitle}\n\n${logMessage}`;

  // biome-ignore lint: Required for showing error in CLI
  console.error(completeLog);
  process.exit(1); // Exit the process with an error code
}

/**
 * @description Handles the cancellation of a @clack/prompts command flow.
 * @param message - Optional message to display on cancellation.
 */
export function onFlowCommandCancel(message?: string): never {
  cancel(message || 'Unknown error: Operation cancelled.');
  process.exit(0); // Exit the process gracefully
}
