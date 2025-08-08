import { envSchema } from '@schemas/env-schema';
import type { Config } from '@services/config-service';
import { OrbitItError } from '@utils/errors';
import { ignorePaths, nodejsPatterns, pythonPatterns } from '@utils/paths';
import fg from 'fast-glob';
import type { z } from 'zod';
import type { FunctionResult } from '@/types/functions';

export type ProjectEnvironment = Config['project']['environment'];

export interface EnvVariables extends z.infer<typeof envSchema> {}

class EnvService {
  async detectEnvironment(): Promise<FunctionResult<ProjectEnvironment>> {
    let error: OrbitItError | undefined;
    let data: ProjectEnvironment | undefined;

    try {
      const isPython = await fg(pythonPatterns, {
        cwd: process.cwd(),
        onlyFiles: true,
        ignore: ignorePaths,
        absolute: true,
      });

      if (isPython) {
        return {
          data: 'python',
        };
      }

      const isNodejs = await fg(nodejsPatterns, {
        cwd: process.cwd(),
        onlyFiles: true,
        ignore: ignorePaths,
        absolute: true,
      });

      if (isNodejs) {
        return {
          data: 'nodejs',
        };
      }

      data = 'unknown';
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

  async loadEnvironmentVariables(): Promise<FunctionResult<EnvVariables>> {
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

      if (entries.length > 1) {
        throw new OrbitItError({
          message: 'Multiple .env files found',
          content: [
            {
              message:
                'Please ensure only one .env file exists in the root directory.',
            },
          ],
        });
      }

      const envFilePath = entries[0];

      process.loadEnvFile(envFilePath);

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
}

export default EnvService;
