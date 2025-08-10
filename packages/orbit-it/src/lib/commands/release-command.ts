import {
  cancel,
  confirm,
  group,
  intro,
  log,
  note,
  select,
  updateSettings,
} from '@clack/prompts';
import { OrbitIt, OrbitItError, type ReleaseType } from '@orbit-it/core';
import { banner, ciModeMessage, dryRunEnabledMessage } from '@utils/banners';
import { onCommandFlowCancel } from '@utils/events';
import type { Command } from 'commander';

export type ReleaseCommandOptions = {
  dryRun?: boolean;
  ci?: boolean;

  type?: ReleaseType;
  draft?: boolean;
};

function releaseCommand(program: Command): Command {
  const orbitIt = new OrbitIt();

  async function releaseHandler(options: ReleaseCommandOptions): Promise<{
    readonly releaseNotes: string;
    readonly tagName: string;
    readonly version: string;
  }> {
    try {
      const { draft, dryRun, type } = options;

      const foundEnv = await orbitIt.env.loadEnvironmentVariables();

      if (foundEnv.error || !foundEnv.data) {
        onCommandFlowCancel(foundEnv.error.message);
      }

      const releaseService = await orbitIt.createReleaseService(
        foundEnv.data.GITHUB_TOKEN
      );

      const releaseResult = await releaseService.execute({
        release: {
          type,
          draft,
        },
        dryRun,
      });

      if (releaseResult.error || !releaseResult.data) {
        onCommandFlowCancel(releaseResult.error.message);
      }

      return {
        releaseNotes: releaseResult.data.releaseNotes,
        tagName: releaseResult.data.tagName,
        version: releaseResult.data.version,
      };
    } catch (error) {
      if (error instanceof OrbitItError) {
        onCommandFlowCancel(error.message);
      }
    }
  }

  return program
    .command('release')
    .description('release a new version of the project')
    .option('--dry-run', 'preview the process without making changes', false)
    .option('--ci', 'run in CI mode, skipping interactive prompts', false)
    .option(
      '--type <type>',
      'specify the release type (major, minor, patch, prerelease)'
    )
    .option('--draft', 'create a draft release', false)
    .action(async (options: ReleaseCommandOptions) => {
      const { dryRun, ci, type } = options;

      intro(banner);

      const foundConfig = await orbitIt.config.get();

      if (foundConfig.error || !foundConfig.data) {
        onCommandFlowCancel(foundConfig.error.message);
      }

      if (dryRun) {
        log.info(dryRunEnabledMessage);
      }

      if (ci) {
        if (!type) {
          onCommandFlowCancel('Missing release type');
        }

        log.info(ciModeMessage);

        const { releaseNotes, tagName, version } =
          await releaseHandler(options);

        note(releaseNotes, 'Release Notes');
        note(`Tag: ${tagName}`, 'Tag Name');
        note(`Version: ${version}`, 'Version');
      } else {
        updateSettings({
          aliases: {
            w: 'up',
            s: 'down',
            a: 'left',
            d: 'right',
            esc: 'cancel',
          },
        });

        const userConfig = await group(
          {
            continue: async () =>
              await confirm({
                message: 'Do you want to continue?',
                initialValue: true,
              }),

            type: async () =>
              await select({
                message: 'Select the release type',
                options: [
                  {
                    label: 'Major',
                    value: 'major',
                  },
                  {
                    label: 'Minor',
                    value: 'minor',
                  },
                  {
                    label: 'Patch',
                    value: 'patch',
                  },
                  {
                    label: 'Prerelease',
                    value: 'prerelease',
                  },
                ],
                maxItems: 1,
              }),
            dryRun: async () =>
              await confirm({
                message: 'Do you want to run in dry run mode?',
                initialValue: false,
              }),
            draft: async () =>
              await confirm({
                message: 'Do you want to create a draft release?',
                initialValue: false,
              }),
          },
          {
            onCancel: () => {
              onCommandFlowCancel('Initialization cancelled by user.');
            },
          }
        );

        if (!userConfig.continue) {
          cancel('User cancelled the operation');
          return;
        }

        const { releaseNotes, tagName, version } =
          await releaseHandler(userConfig);

        note(releaseNotes, 'Release Notes');
        note(`Tag: ${tagName}`, 'Tag Name');
        note(`Version: ${version}`, 'Version');
      }
    });
}

export default releaseCommand;
