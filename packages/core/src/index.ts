import { ConfigService } from '@services/config-service';

export class OrbitItClient {
  config: ConfigService;

  constructor() {
    this.config = new ConfigService();
  }
}

export type { Config } from '@services/config-service';
export default OrbitItClient;
