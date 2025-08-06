import { resolve } from 'node:path';
import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: ['src/index.ts'],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    output: {
      banner: '#!/usr/bin/env node',
    },
  },
  alias: {
    '@': resolve(__dirname, './src'),
    '@utils': resolve(__dirname, './src/utils'),
  },
});
