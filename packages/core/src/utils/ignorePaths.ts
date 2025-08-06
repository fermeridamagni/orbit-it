/**
 * @description An array of glob patterns that specify paths to ignore in a Node.js context.
 */
export const ignoreNodejsPaths: string[] = ['**/node_modules/**'];

/**
 * @description An array of glob patterns that specify paths to ignore in an editor context.
 */
export const ignoreEditorPaths: string[] = ['**/.vscode/**'];

/**
 * @description An array of glob patterns that specify paths to ignore in a build context.
 */
export const ignoreBuildPaths: string[] = [
  '**/build/**',
  '**/dist/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.cache/**',
  '**/out/**',
  '**/public/**',
  '**/tmp/**',
];

/**
 * @description An array of glob patterns that specify paths to ignore in a project.
 */
export const ignorePaths: string[] = [
  ...ignoreNodejsPaths,
  ...ignoreEditorPaths,
  ...ignoreBuildPaths,
  '**/.git/**',
  '**/logs/**',
];
