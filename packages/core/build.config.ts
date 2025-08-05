import { defineBuildConfig } from 'unbuild';

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
    },
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    esbuild: {
      exclude: ['zod', '@octokit/rest', 'simple-git', 'picocolors'],
    },
  },
});
