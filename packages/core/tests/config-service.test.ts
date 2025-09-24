import { describe, expect, it } from 'vitest';
import ConfigService from '../src/lib/services/config-service';

describe('ConfigService', () => {
  it('should create an instance', () => {
    const configService = new ConfigService();
    expect(configService).toBeDefined();
  });

  it('should validate configuration schema', async () => {
    const configService = new ConfigService();
    const validConfig = {
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

    const result = await configService.setup(validConfig);
    
    // Should not have error for valid config
    expect(result.error).toBeUndefined();
  });
});