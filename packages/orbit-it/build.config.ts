import { resolve } from 'node:path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    {
      input: 'src/index.ts',
      format: 'cjs',
      ext: 'cjs',
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
  alias: {
    '@': resolve(__dirname, './src'),
    '@schemas': resolve(__dirname, './src/schemas'),
    '@utils': resolve(__dirname, './src/utils'),
  },
});
