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
      packageManager: z
        .enum(['npm', 'yarn', 'pnpm'])
        .default('pnpm')
        .describe('The package manager used in the project'),
      environment: z
        .enum(['nodejs', 'python'])
        .describe('The runtime environment for the project'),
      envFile: z.string().optional().describe('Path to the environment file'),
    })
    .describe('Project configuration'),
  release: z.object({
    strategy: z
      .enum(['auto', 'manual'])
      .default('auto')
      .describe(
        'The release strategy to use. Auto means releases are managed automatically, manual means you control when releases happen.'
      ),
    versioningStrategy: z
      .enum(['fixed', 'independent'])
      .default('fixed')
      .describe(
        'The versioning strategy to use. Fixed means all packages share the same version, independent means each package can have its own version.'
      ),
    preReleaseIdentifier: z
      .string()
      .default('beta')
      .describe(
        'An optional pre-release identifier to append to versions, e.g., "alpha", "beta", etc.'
      ),
  }),
});
