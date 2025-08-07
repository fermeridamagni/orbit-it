import {
  group,
  intro,
  isCancel,
  log,
  note,
  outro,
  select,
  tasks,
  text,
  updateSettings,
} from '@clack/prompts';
import { loadConfig, setupConfig, setupReleaseWorkflow } from '@orbit-it/core';
import { banner, dryRunEnabledMessage, successMessage } from '@utils/banners';
import { onCommandFlowCancel } from '@utils/events';
import type { Command } from 'commander';
import colors from 'picocolors';

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

      intro(colors.white(banner));

      if (dryRun) {
        log.info(dryRunEnabledMessage);
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
          release: async () => {
            const strategy = await select({
              message: 'Select the release strategy',
              options: [
                {
                  label: 'Auto',
                  value: 'auto',
                },
                {
                  label: 'Manual',
                  value: 'manual',
                },
              ],
            });

            if (isCancel(strategy)) {
              onCommandFlowCancel();
            }

            const versioningStrategy = await select({
              message: 'Select the versioning strategy',
              options: [
                {
                  label: 'Fixed',
                  value: 'fixed',
                },
                {
                  label: 'Independent',
                  value: 'independent',
                },
              ],
            });

            if (isCancel(versioningStrategy)) {
              onCommandFlowCancel();
            }

            const preReleaseIdentifier = await text({
              message: 'Enter an optional pre-release identifier',
              placeholder: 'beta',
              initialValue: 'beta',
            });

            if (isCancel(preReleaseIdentifier)) {
              onCommandFlowCancel();
            }

            return {
              strategy,
              versioningStrategy,
              preReleaseIdentifier,
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
          task: async (message) => {
            message('Generating configuration files...');

            if (dryRun) {
              // simulate 1000ms delay for dry run
              await new Promise((resolve) => setTimeout(resolve, 1000));

              return 'Configuration files would be generated.';
            }

            const setupConfigResult = await setupConfig(userConfig);

            if (setupConfigResult.error) {
              onCommandFlowCancel('Error generating configuration files');
            }

            note(
              JSON.stringify(setupConfigResult.data, null, 2),
              colors.bgGreen(colors.white(colors.bold('orbit-it.jsonc')))
            );

            if (userConfig.release.strategy === 'auto') {
              message('Generating auto release configuration...');

              const setupWorkflowResult = await setupReleaseWorkflow();

              if (setupWorkflowResult.error) {
                onCommandFlowCancel(setupWorkflowResult.error.message);
              }

              note(
                setupWorkflowResult.data,
                colors.bgGreen(
                  colors.white(colors.bold('.github/workflows/release.yml'))
                )
              );
            }

            return 'Configuration files generated successfully.';
          },
        },
      ]);

      if (isCancel(tasksResult)) {
        onCommandFlowCancel('Task execution cancelled by user.');
      }

      outro(successMessage);
    });
}

export default initCommand;
