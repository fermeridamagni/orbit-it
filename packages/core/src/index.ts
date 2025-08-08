import ConfigService from '@services/config-service';
import EnvService from '@services/env-service';

export class OrbitIt {
  config: ConfigService;
  env: EnvService;

  constructor() {
    this.config = new ConfigService();
    this.env = new EnvService();
  }
}

export type { Config } from '@services/config-service';
export { OrbitItError, type OrbitItErrorOptions } from '@utils/errors';
