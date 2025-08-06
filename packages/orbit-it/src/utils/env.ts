import { envSchema } from '@schemas/env-schema';
import { onProcessCancel } from '@utils/events';
import { ignorePaths } from '@utils/ignorePaths';
import fg from 'fast-glob';
import type z from 'zod';

export interface EnvVariables extends z.infer<typeof envSchema> {}

export async function validateEnvConfig(): Promise<EnvVariables> {
  // Find all .env files in the current directory
  const entries = await fg('./**/*.env*', {
    cwd: process.cwd(),
    onlyFiles: true,
    absolute: true,
    dot: true,
    ignore: ignorePaths,
  });

  if (entries.length === 0) {
    onProcessCancel({
      title: 'No .env file found',
      content: 'Please create a .env file in the root directory.',
    });
  }

  // Load the first .env file found
  process.loadEnvFile(entries[0]);

  // Validate environment variables
  const validateEnv = envSchema.safeParse(process.env);

  if (!validateEnv.success) {
    onProcessCancel({
      title: 'Environment variables missing',
      content: validateEnv.error.issues.map((issue) => ({
        message: issue.message,
        target: issue.path.join('.'),
      })),
    });
  }

  return validateEnv.data;
}
