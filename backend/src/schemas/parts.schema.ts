import { z } from 'zod';

export const createPartSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
});

export const addFitmentSchema = z.object({
  vehicleId: z.number().int().positive('Vehicle ID must be a positive integer'),
});

export const partsQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export const fitmentParamSchema = z.object({
  id: z.coerce.number().int().positive('Part ID must be a positive integer'),
  vehicleId: z.coerce.number().int().positive('Vehicle ID must be a positive integer'),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type AddFitmentInput = z.infer<typeof addFitmentSchema>;
export type PartsQuery = z.infer<typeof partsQuerySchema>;
