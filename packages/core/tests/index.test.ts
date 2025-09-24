import { describe, expect, it } from 'vitest';
import { OrbitIt } from '../src/index';

describe('OrbitIt', () => {
  it('should create an instance with services initialized', () => {
    const orbitIt = new OrbitIt();
    
    expect(orbitIt).toBeDefined();
    expect(orbitIt.config).toBeDefined();
    expect(orbitIt.env).toBeDefined();
  });

  it('should create release service with valid token and config', async () => {
    const orbitIt = new OrbitIt();
    
    // Mock a valid config
    const mockConfig = {
      project: {
        type: 'monorepo' as const,
        environment: 'nodejs' as const,
        packageManager: 'pnpm' as const,
        workspaces: ['packages/*'],
        version: '1.0.0',
      },
      release: {
        strategy: 'auto' as const,
        versioningStrategy: 'fixed' as const,
        preReleaseIdentifier: 'beta',
      },
    };

    // Mock the config.get method to return our mock config
    orbitIt.config.get = async () => ({ data: mockConfig });
    
    const releaseService = await orbitIt.createReleaseService('fake-token');
    expect(releaseService).toBeDefined();
  });
});