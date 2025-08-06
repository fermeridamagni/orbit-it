/**
 * @description This module exports an array of glob patterns that specify paths to ignore in a monorepo project.
 */
export const ignorePaths: string[] = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/.vscode/**",
  "**/logs/**",
  "**/temp/**",
  "**/tmp/**",
  "**/.turbo/**",
];
