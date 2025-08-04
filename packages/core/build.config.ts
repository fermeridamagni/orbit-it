import { dirname } from 'node:path';
import { fileURLToPath, resolve } from 'node:url';
import { defineBuildConfig } from 'unbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineBuildConfig({
  entries: [
    {
      input: 'src/index.ts',
      format: 'esm',
    },
    {
      input: 'src/index.ts',
      format: 'cjs',
      ext: 'cjs',
      declaration: false,
    },
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
    esbuild: {
      exclude: ['@t3-oss/env-core', 'zod'],
    },
  },
  alias: {
    '@': resolve(__dirname, 'src'),
    '@lib': resolve(__dirname, 'src/lib'),
  },
});
