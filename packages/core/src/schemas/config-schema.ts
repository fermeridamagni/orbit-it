import { z } from 'zod';

export const configSchema = z.object({
  $schema: z
    .string()
    .default('node_modules/orbit-it/assets/schema.json')
    .describe('The path to the Orbit It schema file'),
  project: z
    .object({
      type: z
        .enum(['monorepo', 'single-package'])
        .describe('The type of project to manage'),
    })
    .describe('Project configuration'),
});
