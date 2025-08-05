import type { z } from 'zod';
import type { adapterConfigSchema, adapterSchema } from '../schemas/adaper';

export interface Adapter extends z.infer<typeof adapterSchema> {}

export interface AdapterConfig extends z.infer<typeof adapterConfigSchema> {}
