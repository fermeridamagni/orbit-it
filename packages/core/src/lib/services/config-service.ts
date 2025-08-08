import { configSchema } from '@schemas/config-schema';
import { OrbitItError } from '@utils/errors';
import { readJsonFile, writeJsonFile, writeYmlFile } from '@utils/files';
import { ignorePaths } from '@utils/paths';
import fg from 'fast-glob';
import colors from 'picocolors';
import type z from 'zod';
import type { FunctionResult } from '@/types/functions';

export interface Config extends z.infer<typeof configSchema> {}

const configFileName = 'orbit-it';

export class ConfigService {
  private config: Config | undefined = undefined;

  async get(): Promise<FunctionResult<Config>> {
    let error: OrbitItError | undefined;
    let data: Config | undefined;

    try {
      if (this.config) {
        return {
          error: undefined,
          data: this.config,
        };
      }

      const foundConfig = await this.loadConfig();

      if (foundConfig.error) {
        throw foundConfig.error;
      }

      // Cache the loaded configuration
      this.config = foundConfig.data;

      data = foundConfig.data;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        // Handle unexpected errors
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'An unexpected error occurred.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }

  /**
   * @description Load the configuration file
   * @returns The loaded configuration or an error
   */
  private async loadConfig(): Promise<FunctionResult<Config>> {
    let error: OrbitItError | undefined;
    let data: Config | undefined;

    try {
      const exts = ['json', 'jsonc'];

      const entries = await fg(`./**/${configFileName}.{${exts.join(',')}}`, {
        cwd: process.cwd(),
        absolute: true,
        onlyFiles: true,
        ignore: ignorePaths,
      });

      if (entries.length === 0) {
        throw new OrbitItError({
          message: 'No configuration file found',
          content: [
            {
              message: `Run ${colors.bold('`orbit-it init`')} or see the documentation for more information.`,
            },
          ],
        });
      }

      if (entries.length > 1) {
        throw new OrbitItError({
          message: 'Multiple configuration files found',
          content: [
            {
              message: `Found multiple configuration files: ${entries.join(', ')}`,
            },
          ],
        });
      }

      // Read and load the first found configuration file
      const configFilePath = entries[0];
      const foundConfig = await readJsonFile(configFilePath);

      // Validate the imported configuration against the schema
      const parsedConfig = configSchema.safeParse(foundConfig);

      if (!parsedConfig.success) {
        throw new OrbitItError({
          message: 'Invalid configuration file',
          content: parsedConfig.error.issues.map((issue) => ({
            message: issue.message,
            target: issue.path.join('.'),
          })),
        });
      }

      // Save the loaded configuration
      this.config = data;

      data = parsedConfig.data;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        // Handle unexpected errors
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'An unexpected error occurred.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }

  /**
   * @description Setup the configuration
   * @param config The configuration to setup
   * @returns The result of the setup operation
   */
  async setup(config: Config): Promise<FunctionResult<Config>> {
    let error: OrbitItError | undefined;
    let data: Config | undefined;

    try {
      // Validate the provided configuration options
      const parsedConfig = configSchema.safeParse(config);

      if (!parsedConfig.success) {
        throw new OrbitItError({
          message: 'Invalid configuration options',
          content: parsedConfig.error.issues.map((issue) => ({
            message: issue.message,
            target: issue.path.join('.'),
          })),
        });
      }

      // Create the configuration object
      data = {
        ...parsedConfig.data,
        // Add any default values or transformations here if needed
      };

      await writeJsonFile(`./${configFileName}.jsonc`, data);
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        // Handle unexpected errors
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'An unexpected error occurred.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }

  async setupReleaseWorkflow(): Promise<FunctionResult<string>> {
    let error: OrbitItError | undefined;
    let data: string | undefined;

    try {
      const workflowContent = this.generateReleaseWorkflow();

      await writeYmlFile('.github/workflows/release.yml', workflowContent);

      data = workflowContent;
    } catch (foundError) {
      if (foundError instanceof OrbitItError) {
        error = foundError;
      } else if (foundError instanceof Error) {
        // Handle unexpected errors
        error = new OrbitItError({
          message: foundError.message,
          content: [{ message: 'An unexpected error occurred.' }],
        });
      }
    }

    return {
      error,
      data,
    };
  }

  private generateReleaseWorkflow(): string {
    const content = `name: Release Workflow
on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup PNPM
        uses: pnpm/action-setup@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org/'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm run test

      - name: Build Packages
        run: pnpm run build

      - name: Create release
        run: pnpm dlx orbit-it release
`;

    return content;
  }
}
