import { resolve } from 'node:path';
import { configSchema } from '@orbit-it/core';
import { writeJsonFile } from '@orbit-it/core/utils';
import { defineBuildConfig } from 'unbuild';
import { z } from 'zod';

export const alias: Record<string, string> = {
  '@': resolve(__dirname, './src'),
  '@lib': resolve(__dirname, './src/lib'),
  '@schemas': resolve(__dirname, './src/schemas'),
  '@utils': resolve(__dirname, './src/utils'),

  '@commands': resolve(__dirname, './src/lib/commands'),
};

async function generateJsonConfigSchema(): Promise<void> {
  const jsonConfigSchema = z.toJSONSchema(configSchema, {
    target: 'draft-7',
  });

  const filePath = resolve(__dirname, './assets/schema.json');
  await writeJsonFile(filePath, jsonConfigSchema);
}

export default defineBuildConfig({
  entries: [
    {
      input: 'src/cli.ts',
      format: 'cjs',
      ext: 'cjs',
      name: 'cli',
    },
    {
      input: 'src/cli.ts',
      format: 'esm',
      ext: 'mjs',
      name: 'cli',
    },
  ],
  outDir: 'build',
  clean: true,
  declaration: false,
  rollup: {
    emitCJS: true,
    output: {
      banner: '#!/usr/bin/env node',
    },
  },
  hooks: {
    'build:done': async () => {
      await generateJsonConfigSchema();
    },
  },
  alias,
});
