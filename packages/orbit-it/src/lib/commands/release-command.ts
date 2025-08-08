import { intro, log, updateSettings } from '@clack/prompts';
import { OrbitIt } from '@orbit-it/core';
import { banner, dryRunEnabledMessage, errorMessage } from '@utils/banners';
import { onCommandFlowCancel } from '@utils/events';
import type { Command } from 'commander';
import colors from 'picocolors';

export type ReleaseCommandOptions = {
  dryRun?: boolean;
  ci?: boolean;
};

function releaseCommand(program: Command): Command {
  return program
    .command('release')
    .description('Release a new version of the project')
    .option('--dry-run', 'Preview the process without making changes')
    .option('--ci', 'Run in CI mode, skipping interactive prompts')
    .action(async (options: ReleaseCommandOptions) => {
      const { dryRun, ci } = options;

      updateSettings({
        aliases: {
          w: 'up',
          s: 'down',
          a: 'left',
          d: 'right',
          esc: 'cancel',
        },
      });

      if (dryRun) {
        log.info(dryRunEnabledMessage);
      }

      const orbitIt = new OrbitIt();

      const foundConfig = await orbitIt.config.get();

      if (foundConfig.error) {
        intro(errorMessage);
        onCommandFlowCancel(foundConfig.error.message);
      }

      // const foundEnv = await loadEnv(foundConfig.data);

      // if (foundEnv.error) {
      //   intro(errorMessage);
      //   onCommandFlowCancel(foundEnv.error.message);
      // }

      intro(colors.white(banner));
    });
}

export default releaseCommand;
