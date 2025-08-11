import ConfigService from '@services/config-service';
import EnvService from '@services/env-service';
import ReleaseService from '@services/release-service';

export class OrbitIt {
  config: ConfigService;
  env: EnvService;

  constructor() {
    this.config = new ConfigService();
    this.env = new EnvService();
  }

  async createReleaseService(token: string): Promise<ReleaseService> {
    const foundConfig = await this.config.get();

    if (foundConfig.error || !foundConfig.data) {
      throw foundConfig.error;
    }

    return new ReleaseService(token, {
      config: foundConfig.data,
    });
  }
}

export { configSchema } from '@schemas/config-schema';
export type { Config } from '@services/config-service';
export type { ReleaseType } from '@services/release-service';
export { OrbitItError, type OrbitItErrorOptions } from '@utils/errors';
