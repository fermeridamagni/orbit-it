import { z } from 'zod';

export const configSchema = z.object({
  project: z.object({
    type: z.enum(['monorepo', 'single-package']),
  }),
});

export const configOptionsSchema = z.object({
  project: z.object({
    type: z.enum(['monorepo', 'single-package']),
  }),
});
