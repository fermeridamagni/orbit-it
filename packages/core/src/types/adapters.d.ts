import type { adapterConfigSchema, adapterSchema } from '@schemas/adaper';
import type { z } from 'zod';

export interface Adapter extends z.infer<typeof adapterSchema> {}

export interface AdapterConfig extends z.infer<typeof adapterConfigSchema> {}
