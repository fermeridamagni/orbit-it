/**
 * @description An array of glob patterns that specify paths to ignore in an editor context.
 */
export const ignoreEditorPaths: string[] = [
  '**/.vscode/**',
  '**/.windsurf/**',
  '**/.idea/**',
  '**/.cursor/**',
  '**/.claude/**',
];

/**
 * @description An array of glob patterns that specify paths to ignore in a Git context.
 */
export const ignoreGitPaths: string[] = ['**/.git/**'];

/**
 * @description An array of glob patterns that specify paths to ignore in a build context.
 */
export const ignoreCommonBuildPaths: string[] = [
  '**/build/**',
  '**/dist/**',
  '**/coverage/**',
  '**/.cache/**',
  '**/out/**',
  '**/public/**',
  '**/tmp/**',
  '**/logs/**',
];

/**
 * @description An array of glob patterns that specify paths to ignore in a Node.js context.
 */
export const ignoreNodejsPaths: string[] = [
  '**/node_modules/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/.next/**',
  '**/.nuxt/**',
];

/**
 * @description An array of glob patterns that specify paths to include in a Node.js context.
 */
export const nodejsPatterns = ['**/*.{js,jsx,ts,tsx}'];

/**
 * @description An array of glob patterns that specify paths to ignore in a Python context.
 */
export const ignorePythonPaths: string[] = ['**/venv/**', '**/__pycache__/**'];

/**
 * @description An array of glob patterns that specify paths to include in a Python context.
 */
export const pythonPatterns = ['**/*.py'];

/**
 * @description An array of glob patterns that specify paths to ignore in a project.
 */
export const ignorePaths: string[] = [
  ...ignoreEditorPaths,
  ...ignoreGitPaths,
  ...ignoreCommonBuildPaths,
  ...ignoreNodejsPaths,
  ...ignorePythonPaths,
];
