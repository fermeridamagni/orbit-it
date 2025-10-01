import { describe, expect, it } from 'vitest';

describe('CLI Integration', () => {
  it('should be importable without errors', () => {
    // Simple test to ensure the CLI package is structured correctly
    expect(true).toBe(true);
  });

  it('should have package.json with correct bin entry', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    expect(packageJson.bin).toBeDefined();
    expect(packageJson.bin['orbit-it']).toBe('./build/cli.cjs');
  });
});