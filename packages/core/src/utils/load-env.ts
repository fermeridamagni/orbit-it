import { envSchema } from '@schemas/env-schema';
import { OrbitItError } from '@utils/errors';
import { ignorePaths } from '@utils/ignore-paths';
import fg from 'fast-glob';
import type z from 'zod';
import type { FunctionResult } from '@/types/functions';

export interface EnvVariables extends z.infer<typeof envSchema> {}

export async function loadEnv(): Promise<FunctionResult<EnvVariables>> {
  let error: OrbitItError | undefined;
  let data: EnvVariables | undefined;

  try {
    // Find all .env files in the current directory
    const entries = await fg('./**/*.env*', {
      cwd: process.cwd(),
      onlyFiles: true,
      absolute: true,
      dot: true,
      ignore: ignorePaths,
    });

    if (entries.length === 0) {
      throw new OrbitItError({
        message: 'No .env file found',
        content: [
          {
            message: 'Please create a .env file in the root directory.',
          },
        ],
      });
    }

    // Load the first .env file found
    process.loadEnvFile(entries[0]);

    // Validate environment variables
    const parsedEnv = envSchema.safeParse(process.env);

    if (!parsedEnv.success) {
      throw new OrbitItError({
        message: 'Environment variables missing',
        content: parsedEnv.error.issues.map((issue) => ({
          message: issue.message,
          target: issue.path.join('.'),
        })),
      });
    }

    data = parsedEnv.data;
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
