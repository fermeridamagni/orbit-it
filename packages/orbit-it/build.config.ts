import { resolve } from 'node:path';
import { configSchema, writeJsonFile } from '@orbit-it/core';
import { defineBuildConfig } from 'unbuild';
import { z } from 'zod';

export const alias = {
  '@': resolve(__dirname, './src'),
  '@lib': resolve(__dirname, './src/lib'),
  '@schemas': resolve(__dirname, './src/schemas'),
  '@utils': resolve(__dirname, './src/utils'),

  '@commands': resolve(__dirname, './src/lib/commands'),
};

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

    {
      input: 'src/config.ts',
      format: 'esm',
      ext: 'mjs',
      name: 'config',
    },
    {
      input: 'src/config.ts',
      format: 'cjs',
      ext: 'cjs',
      name: 'config',
    },
  ],
  outDir: 'build',
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    output: {
      banner: (chunk) =>
        chunk.fileName.includes('cli') && '#!/usr/bin/env node',
    },
  },
  hooks: {
    'build:done': () => {
      const jsonConfigSchema = z.toJSONSchema(configSchema, {
        target: 'draft-7',
      });
      const filePath = resolve(__dirname, './assets/schema.json');
      writeJsonFile(filePath, jsonConfigSchema);
    },
  },
  alias,
});
