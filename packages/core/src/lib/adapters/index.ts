import type { Adapter, AdapterConfig } from '@/types/adapters';

function createAdapter(config: AdapterConfig): Adapter {
  return {
    id: config.id,
  };
}

export default createAdapter;
