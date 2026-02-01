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

    const buildTokenConditions = (token: string) => {
      const conditions: Record<string, unknown>[] = [
        { make: { contains: token } },
        { model: { contains: token } },
        { trim: { contains: token } },
      ];

      // Year matching: support partial years (e.g. "201" matches 2010-2019)
      if (/^\d+$/.test(token)) {
        const num = parseInt(token, 10);
        if (token.length === 4 && num >= 1900 && num <= 2100) {
          // Exact 4-digit year
          conditions.push({ year: num });
        } else if (token.length < 4) {
          // Partial year: "201" → 2010-2019, "20" → 2000-2099
          const padded = token.padEnd(4, '0');
          const low = parseInt(padded, 10);
          const high = parseInt(token.padEnd(4, '9'), 10);
          conditions.push({ year: { gte: low, lte: high } });
        }
      }

      return conditions;
    };

    if (tokens.length > 1) {
      where.AND = tokens.map(token => ({ OR: buildTokenConditions(token) }));
    } else {
      where.OR = buildTokenConditions(tokens[0]);
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
