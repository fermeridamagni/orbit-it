import ConfigService from '@services/config-service';
import EnvService from '@services/env-service';
import ReleaseService, {
  type ReleaseServiceOptions,
} from '@services/release-service';

export class OrbitIt {
  config: ConfigService;
  env: EnvService;

  constructor() {
    this.config = new ConfigService();
    this.env = new EnvService();
  }

  createReleaseService(options: ReleaseServiceOptions): ReleaseService {
    return new ReleaseService(options);
  }
}

export type { Config } from '@services/config-service';
export type { ReleaseType } from '@services/release-service';
export { OrbitItError, type OrbitItErrorOptions } from '@utils/errors';
