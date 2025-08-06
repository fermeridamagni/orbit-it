import { configSchema } from '@schemas/config-schema';
import { OrbitItError } from '@utils/errors';
import { ignorePaths } from '@utils/ignorePaths';
import fg from 'fast-glob';
import { bold } from 'picocolors';
import type { z } from 'zod';
import type { FunctionResult } from '@/types/functions';

export interface Config extends z.infer<typeof configSchema> {}

export async function loadConfig(): Promise<FunctionResult<Config>> {
  let error: OrbitItError | undefined;
  let data: Config | undefined;

  try {
    const ext = ['json', 'jsonc', 'js', 'ts'];

    const entries = await fg(`./**/orbit-it.config.{${ext.join(',')}}`, {
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

    let configFilePath: string | undefined;

    // Find the first valid config file
    for (const entry of entries) {
      if (ext.includes(entry.split('.').pop() || '')) {
        configFilePath = entry;
        break;
      }
    }

    // Import the configuration file dynamically
    const configModule = await import(configFilePath);

    // Validate the imported configuration against the schema
    const parsedConfig = configSchema.safeParse(
      configModule.default || configModule
    );

    if (!parsedConfig.success) {
      throw new OrbitItError({
        message: 'Invalid configuration file',
        content: parsedConfig.error.issues.map((issue) => ({
          message: issue.message,
          target: issue.path.join('.'),
        })),
      });
    }

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
