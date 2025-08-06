import { resolve } from 'node:path';
import { defineBuildConfig } from 'unbuild';

export const alias = {
  '@': resolve(__dirname, './src'),
  '@lib': resolve(__dirname, './src/lib'),
  '@schemas': resolve(__dirname, './src/schemas'),
  '@commands': resolve(__dirname, './src/commands'),
  '@utils': resolve(__dirname, './src/utils'),
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
      banner: (chunk) => {
        return chunk.fileName.includes('cli') ? '#!/usr/bin/env node' : '';
      },
    },
  },
  alias,
});
