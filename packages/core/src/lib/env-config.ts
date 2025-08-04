import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    GITHUB_TOKEN: z.string().describe('GitHub Personal Access Token'),
  },
  runtimeEnv: process.env,
});
