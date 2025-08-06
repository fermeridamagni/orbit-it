import { z } from 'zod';

export const configSchema = z.object({
  project: z.object({
    type: z.enum(['single', 'monorepo']),
  }),
});
