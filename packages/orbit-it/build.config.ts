import { defineBuildConfig } from 'unbuild';

const banner = '#!/usr/bin/env node';

export default defineBuildConfig({
  entries: ['src/index.ts'],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    esbuild: {
      exclude: [],
    },
  },
  hooks: {
    'rollup:options': (_ctx, options) => {
      if (options.output) {
        // Add shebang to the CLI output file
        options.output = Array.isArray(options.output)
          ? options.output.map((output) => ({
              ...output,
              banner,
            }))
          : {
              ...options.output,
              banner,
            };
      }
    },
  },
});
