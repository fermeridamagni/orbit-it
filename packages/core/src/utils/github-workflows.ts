import { OrbitItError } from '@utils/errors';
import { writeYmlFile } from '@utils/files';
import type { FunctionResult } from '@/types/functions';

export async function setupReleaseWorkflow(): Promise<FunctionResult<string>> {
  let error: OrbitItError | undefined;
  let data: string | undefined;

  try {
    const workflowContent = generateReleaseWorkflow();

    await writeYmlFile('.github/workflows/release.yml', workflowContent);

    data = workflowContent;
  } catch (foundError) {
    if (foundError instanceof OrbitItError) {
      error = foundError;
    } else if (foundError instanceof Error) {
      // Handle unexpected errors
      error = new OrbitItError({
        message: foundError.message,
        content: [{ message: 'An unexpected error occurred.' }],
      });
    }
  }

  return {
    error,
    data,
  };
}

function generateReleaseWorkflow(): string {
  const content = `name: Release Workflow
on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup PNPM
        uses: pnpm/action-setup@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org/'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm run test

      - name: Build Packages
        run: pnpm run build

      - name: Create release
        run: pnpm dlx orbit-it release
`;

  return content;
}
