import {
  group,
  intro,
  isCancel,
  log,
  note,
  select,
  updateSettings,
} from '@clack/prompts';
import { dryRunMessage, introMessage } from '@utils/banners';
import { onCommandFlowCancel } from '@utils/events';
import type { Command } from 'commander';
import { white } from 'picocolors';

export type InitCommandOptions = {
  dryRun?: boolean;
};

function initCommand(program: Command): Command {
  return program
    .command('init')
    .description('initialize the required config')
    .option('--dry-run', 'preview the configuration without making changes')
    .action(async (options: InitCommandOptions) => {
      const { dryRun } = options;

      updateSettings({
        aliases: {
          w: 'up',
          s: 'down',
          a: 'left',
          d: 'right',
          esc: 'cancel',
        },
      });

      intro(white(introMessage));

      if (dryRun) {
        log.info(dryRunMessage);
      }

      const userConfig = await group(
        {
          project: async () => {
            const type = await select({
              message: 'Select the project type',
              options: [
                {
                  label: 'Monorepo',
                  value: 'monorepo',
                },
                {
                  label: 'Single Package',
                  value: 'single-package',
                },
              ],
            });

            if (isCancel(type)) {
              onCommandFlowCancel();
            }

            return {
              type,
            };
          },
        },
        {
          onCancel: () => {
            onCommandFlowCancel('Initialization cancelled by user.');
          },
        }
      );

      if (dryRun) {
        note(JSON.stringify(userConfig, null, 2), 'Configuration Preview');
      }
    });
}

export default initCommand;
