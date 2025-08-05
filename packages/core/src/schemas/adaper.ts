import { z } from 'zod';

const adapterIdSchema = z
  .string()
  .min(1, {
    error: 'Adapter ID must be at least 1 character long',
  })
  .max(100, {
    error: 'Adapter ID must not exceed 100 characters',
  })
  .describe('Unique identifier for the adapter');

export const adapterSchema = z.object({
  id: adapterIdSchema,
});

export const adapterConfigSchema = z.object({
  id: adapterIdSchema,
});
