import { z } from 'zod';

export const envSchema = z.object({
  GITHUB_TOKEN: z
    .string()
    .min(1)
    .describe('GitHub token with repo and workflow scopes'),
});
