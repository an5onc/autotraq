import { z } from 'zod';

export const receiveStockSchema = z.object({
  partId: z.number().int().positive('Part ID is required'),
  locationId: z.number().int().positive('Location ID is required'),
  qty: z.number().int().positive('Quantity must be a positive integer'),
  reason: z.string().optional(),
});

export const correctStockSchema = z.object({
  partId: z.number().int().positive('Part ID is required'),
  locationId: z.number().int().positive('Location ID is required'),
  qty: z.number().int().refine((val) => val !== 0, 'Quantity cannot be zero'),
  reason: z.string().min(1, 'Reason is required for corrections'),
});

export const onHandQuerySchema = z.object({
  partId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
});

export const eventsQuerySchema = z.object({
  partId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  type: z.enum(['RECEIVE', 'FULFILL', 'RETURN', 'CORRECTION']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100),
});

export type ReceiveStockInput = z.infer<typeof receiveStockSchema>;
export type CorrectStockInput = z.infer<typeof correctStockSchema>;
export type OnHandQuery = z.infer<typeof onHandQuerySchema>;
export type EventsQuery = z.infer<typeof eventsQuerySchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
