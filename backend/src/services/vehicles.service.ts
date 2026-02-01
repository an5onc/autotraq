import prisma from '../repositories/prisma.js';
import { CreateVehicleInput, VehiclesQuery } from '../schemas/vehicles.schema.js';

// Domain rule: only vehicles year 2000 or newer (per CLAUDE.md Section 3)
const MIN_YEAR = 2000;

export async function createVehicle(input: CreateVehicleInput) {
  // Double-check year constraint (schema validation should catch this, but defense in depth)
  if (input.year < MIN_YEAR) {
    throw new Error(`Vehicle year must be ${MIN_YEAR} or later`);
  }

  // Check for duplicate vehicle
  const existing = await prisma.vehicle.findFirst({
    where: {
      year: input.year,
      make: input.make,
      model: input.model,
      trim: input.trim || null,
    },
  });

  if (existing) {
    throw new Error('Vehicle already exists');
  }

  return prisma.vehicle.create({
    data: {
      year: input.year,
      make: input.make,
      model: input.model,
      trim: input.trim,
    },
  });
}

export async function getVehicles(query: VehiclesQuery) {
  const { search, year, make, model, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (search) {
    // Split search into tokens so "2014 ford" matches year=2014 AND make=Ford
    const tokens = search.trim().split(/\s+/).filter(Boolean);

    if (tokens.length > 1) {
      // Multi-word: AND each token — each must match at least one field
      const andConditions = tokens.map(token => {
        const conditions: Record<string, unknown>[] = [
          { make: { contains: token } },
          { model: { contains: token } },
          { trim: { contains: token } },
        ];
        const yearNum = parseInt(token, 10);
        if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
          conditions.push({ year: yearNum });
        }
        return { OR: conditions };
      });
      where.AND = andConditions;
    } else {
      // Single word: OR across all fields
      const searchConditions: Record<string, unknown>[] = [
        { make: { contains: search } },
        { model: { contains: search } },
        { trim: { contains: search } },
      ];
      const yearNum = parseInt(search, 10);
      if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
        searchConditions.push({ year: yearNum });
      }
      where.OR = searchConditions;
    }
  }

  if (year) where.year = year;
  if (make) where.make = { contains: make };
  if (model) where.model = { contains: model };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ year: 'desc' }, { make: 'asc' }, { model: 'asc' }],
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    vehicles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getVehicleById(id: number) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      fitments: {
        include: {
          part: true,
        },
      },
    },
  });

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  return vehicle;
}

export async function getDistinctMakes(year: number) {
  const vehicles = await prisma.vehicle.findMany({
    where: { year },
    select: { make: true },
    distinct: ['make'],
    orderBy: { make: 'asc' },
  });
  return vehicles.map((v) => v.make);
}

export async function getDistinctModels(year: number, make: string) {
  const vehicles = await prisma.vehicle.findMany({
    where: { year, make },
    select: { id: true, model: true, trim: true },
    orderBy: { model: 'asc' },
  });
  return vehicles;
}

/**
 * Validates that a year is >= 2000
 * Used for unit testing per CLAUDE.md Section 8
 */
export function validateVehicleYear(year: number): boolean {
  return year >= MIN_YEAR;
}
