import {
  group,
  intro,
  isCancel,
  log,
  note,
  select,
  tasks,
  updateSettings,
} from '@clack/prompts';
import { loadConfig, setupConfig } from '@orbit-it/core';
import { banner, dryRunMessage } from '@utils/banners';
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
    .option('--dry-run', 'preview the process without making changes')
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

      intro(white(banner));

      if (dryRun) {
        log.info(dryRunMessage);
      }

      const foundConfig = await loadConfig();

      if (foundConfig.data) {
        note(JSON.stringify(foundConfig.data, null, 2), 'Found Configuration');
        return;
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

      const tasksResult = await tasks([
        {
          title: 'Generating configuration files',
          task: async () => {
            if (dryRun) {
              // simulate 2000ms delay for dry run
              await new Promise((resolve) => setTimeout(resolve, 2000));

              return 'Configuration files would be generated.';
            }

            const result = await setupConfig(userConfig);

            if (result.error) {
              onCommandFlowCancel('Error generating configuration files');
            }

            return 'Configuration files generated successfully.';
          },
        },
      ]);

      if (isCancel(tasksResult)) {
        onCommandFlowCancel('Task execution cancelled by user.');
      }

      note(JSON.stringify(userConfig, null, 2), 'Configuration Preview');
    });
}

export default initCommand;
