import { z } from 'zod';

const requestItemSchema = z.object({
  partId: z.number().int().positive('Part ID is required'),
  qtyRequested: z.number().int().positive('Quantity must be a positive integer'),
  locationId: z.number().int().positive().optional(),
});

export const createRequestSchema = z.object({
  items: z.array(requestItemSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

export const requestsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'FULFILLED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type RequestsQuery = z.infer<typeof requestsQuerySchema>;
