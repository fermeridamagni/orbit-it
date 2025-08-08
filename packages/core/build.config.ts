import { resolve } from 'node:path';
import { defineBuildConfig } from 'unbuild';

export const alias: Record<string, string> = {
  '@': resolve(__dirname, './src'),
  '@lib': resolve(__dirname, './src/lib'),
  '@services': resolve(__dirname, './src/lib/services'),
  '@utils': resolve(__dirname, './src/utils'),
  '@schemas': resolve(__dirname, './src/schemas'),
};

export default defineBuildConfig({
  entries: [
    {
      input: 'src/index.ts',
      format: 'esm',
      ext: 'mjs',
    },
    {
      input: 'src/index.ts',
      format: 'cjs',
      ext: 'cjs',
    },
  ],
  outDir: 'build',
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
  },
  alias,
});
