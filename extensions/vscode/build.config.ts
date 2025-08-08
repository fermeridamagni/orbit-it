import { resolve } from 'node:path';
import { defineBuildConfig } from 'unbuild';

export const alias: Record<string, string> = {
  '@': resolve(__dirname, './src'),
};

export default defineBuildConfig({
  entries: [
    {
      input: 'src/extension.ts',
      format: 'cjs',
      ext: 'cjs',
      name: 'extension',
    },
    {
      input: 'src/extension.ts',
      format: 'esm',
      ext: 'mjs',
      name: 'extension',
    },
  ],
  outDir: 'build',
  clean: true,
  declaration: false,
  rollup: {
    emitCJS: true,
  },
  alias,
});
