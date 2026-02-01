import { z } from 'zod';

// Domain rule: only vehicles year 2000 or newer (per CLAUDE.md Section 3)
const MIN_YEAR = 2000;
const currentYear = new Date().getFullYear();
const MAX_YEAR = currentYear + 2; // Allow up to 2 years in the future for new models

export const createVehicleSchema = z.object({
  year: z
    .number()
    .int()
    .min(MIN_YEAR, `Vehicle year must be ${MIN_YEAR} or later`)
    .max(MAX_YEAR, `Vehicle year cannot exceed ${MAX_YEAR}`),
  make: z.string().min(1, 'Make is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  trim: z.string().max(50).optional(),
});

export const vehiclesQuerySchema = z.object({
  search: z.string().optional(),
  year: z.coerce.number().int().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(1000).optional().default(1000),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type VehiclesQuery = z.infer<typeof vehiclesQuerySchema>;
