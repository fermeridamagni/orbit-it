import { blue } from 'picocolors';

export const banner = `
 ██████╗ ██████╗ ██████╗ ██╗████████╗    ██╗████████╗
██╔═══██╗██╔══██╗██╔══██╗██║╚══██╔══╝    ██║╚══██╔══╝
██║   ██║██████╔╝██████╔╝██║   ██║       ██║   ██║   
██║   ██║██╔══██╗██╔══██╗██║   ██║       ██║   ██║   
╚██████╔╝██║  ██║██████╔╝██║   ██║       ██║   ██║   
 ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝       ╚═╝   ╚═╝   `;

export const descriptionMessage =
  '🚀 Orbit It - Manage Your Repositories and Monorepos on GitHub';

export const dryRunEnabledMessage = `Dry run mode ${blue('enabled')}. No changes will be made.`;

export const ciModeMessage = `CI mode ${blue('enabled')}. Skipping interactive prompts.`;

export const successMessage = '🚀 Orbit It. All done!';

export const errorMessage = '🚀 Orbit It. Something went wrong.';
