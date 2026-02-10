import { z } from 'zod';

// Part condition enum
export const partConditionEnum = z.enum([
  'NEW',
  'EXCELLENT', 
  'GOOD',
  'FAIR',
  'POOR',
  'CORE',
  'SALVAGE',
  'UNKNOWN',
]);

export type PartCondition = z.infer<typeof partConditionEnum>;

export const createPartSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  condition: partConditionEnum.optional().default('UNKNOWN'),
});

export const addFitmentSchema = z.object({
  vehicleId: z.number().int().positive('Vehicle ID must be a positive integer'),
});

export const partsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(5000).optional().default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const fitmentParamSchema = z.object({
  id: z.coerce.number().int().positive('Part ID must be a positive integer'),
  vehicleId: z.coerce.number().int().positive('Vehicle ID must be a positive integer'),
});

export const updatePartSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  condition: partConditionEnum.optional(),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
export type AddFitmentInput = z.infer<typeof addFitmentSchema>;
export type PartsQuery = z.infer<typeof partsQuerySchema>;
