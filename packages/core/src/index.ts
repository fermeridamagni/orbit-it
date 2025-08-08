import { ConfigService } from '@services/config-service';

export class OrbitIt {
  config: ConfigService;

  constructor() {
    this.config = new ConfigService();
  }
}

export type { Config } from '@services/config-service';
export { OrbitItError, type OrbitItErrorOptions } from '@utils/errors';
