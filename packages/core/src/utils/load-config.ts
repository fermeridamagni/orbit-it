import { configSchema } from '@schemas/config-schema';
import { OrbitItError } from '@utils/errors';
import { readJsonFile, writeJsonFile } from '@utils/files';
import { ignorePaths } from '@utils/ignore-paths';
import fg from 'fast-glob';
import { bold } from 'picocolors';
import type { z } from 'zod';
import type { FunctionResult } from '@/types/functions';

const configFileName = 'orbit-it';

export interface Config extends z.infer<typeof configSchema> {}

export type LoadConfigResult = Config & {
  path: string;
};

export async function loadConfig(): Promise<FunctionResult<LoadConfigResult>> {
  let error: OrbitItError | undefined;
  let data: LoadConfigResult | undefined;

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
            message: `Run ${bold('`orbit-it init`')} or see the documentation for more information.`,
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

    data = {
      path: configFilePath,
      ...parsedConfig.data,
    };
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
 * @description Defines the configuration for OrbitIt.
 * @param config The configuration object to define.
 * @returns The validated configuration object.
 * @example
 * ```ts
 * import { defineConfig } from 'orbit-it/config';
 *
 * export default defineConfig({
 *   // ...
 * });
 */
export function defineConfig(config: Config): Config {
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

  // Return the validated configuration
  return parsedConfig.data;
}

export async function setupConfig(
  config: Config
): Promise<FunctionResult<Config>> {
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
