import prisma from '../repositories/prisma.js';

export interface SolutionQuery {
  year: number;
  make: string;
  model: string;
  system?: string;
  component?: string;
  partName?: string;
}

export interface SolutionResult {
  exact: any[];
  interchange: any[];
  alternatives: any[];
  query: {
    vehicle: string;
    matchedVehicleId: number | null;
    totalResults: number;
  };
}

export async function findSolutions(query: SolutionQuery): Promise<SolutionResult> {
  const vehicleLabel = `${query.year} ${query.make} ${query.model}`;

  // Step 1: Find the exact vehicle (MySQL is case-insensitive by default)
  const vehicle = await prisma.vehicle.findFirst({
    where: {
      year: query.year,
      make: query.make,
      model: query.model,
    },
  });

  if (!vehicle) {
    return {
      exact: [],
      interchange: [],
      alternatives: [],
      query: { vehicle: vehicleLabel, matchedVehicleId: null, totalResults: 0 },
    };
  }

  // Step 2: Find exact-fit parts via PartFitment
  const partWhere: any = {};
  if (query.partName) {
    partWhere.OR = [
      { name: { contains: query.partName } },
      { description: { contains: query.partName } },
    ];
  }
  if (query.system) {
    partWhere.sku = { startsWith: query.system };
  }

  const exactFitments = await prisma.partFitment.findMany({
    where: {
      vehicleId: vehicle.id,
      ...(Object.keys(partWhere).length > 0 ? { part: partWhere } : {}),
    },
    include: {
      part: {
        include: {
          inventoryEvents: true,
        },
      },
    },
  });

  const exactParts = exactFitments.map(f => {
    const stock = f.part.inventoryEvents.reduce((sum, e) => sum + e.qtyDelta, 0);
    return {
      id: f.part.id,
      name: f.part.name,
      sku: f.part.sku,
      description: f.part.description,
      condition: f.part.condition,
      costCents: f.part.costCents,
      matchType: 'exact' as const,
      fitsVehicle: vehicleLabel,
      stockOnHand: stock,
    };
  });

  const exactPartIds = exactParts.map(p => p.id);

  // Step 3: Find interchange parts
  const interchangeParts: any[] = [];
  if (exactPartIds.length > 0) {
    const members = await prisma.interchangeGroupMember.findMany({
      where: {
        group: {
          members: {
            some: { partId: { in: exactPartIds } },
          },
        },
        partId: { notIn: exactPartIds },
      },
      include: {
        part: {
          include: {
            fitments: { include: { vehicle: true }, take: 5 },
            inventoryEvents: true,
          },
        },
        group: true,
      },
    });

    for (const m of members) {
      const stock = m.part.inventoryEvents.reduce((sum, e) => sum + e.qtyDelta, 0);
      interchangeParts.push({
        id: m.part.id,
        name: m.part.name,
        sku: m.part.sku,
        description: m.part.description,
        condition: m.part.condition,
        costCents: m.part.costCents,
        matchType: 'interchange' as const,
        interchangeGroup: m.group.name,
        fitsVehicles: m.part.fitments.map(f => `${f.vehicle.year} ${f.vehicle.make} ${f.vehicle.model}`),
        stockOnHand: stock,
      });
    }
  }

  // Step 4: Find alternatives (same SKU prefix, same make, not already found)
  const alternatives: any[] = [];
  const foundIds = [...exactPartIds, ...interchangeParts.map(p => p.id)];

  if (exactParts.length > 0) {
    const skuPrefixes = [...new Set(exactParts.map(p => {
      const parts = p.sku.split('-');
      return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : parts[0];
    }))];

    for (const prefix of skuPrefixes) {
      const altParts = await prisma.part.findMany({
        where: {
          sku: { startsWith: prefix },
          id: { notIn: foundIds },
          fitments: {
            some: { vehicle: { make: query.make } },
          },
        },
        include: {
          fitments: { include: { vehicle: true }, take: 5 },
          inventoryEvents: true,
        },
        take: 10,
      });

      for (const part of altParts) {
        const stock = part.inventoryEvents.reduce((sum, e) => sum + e.qtyDelta, 0);
        alternatives.push({
          id: part.id,
          name: part.name,
          sku: part.sku,
          description: part.description,
          condition: part.condition,
          costCents: part.costCents,
          matchType: 'alternative' as const,
          fitsVehicles: part.fitments.map(f => `${f.vehicle.year} ${f.vehicle.make} ${f.vehicle.model}`),
          stockOnHand: stock,
        });
      }
    }
  } else if (query.partName) {
    const searchParts = await prisma.part.findMany({
      where: {
        OR: [
          { name: { contains: query.partName } },
          { description: { contains: query.partName } },
        ],
        fitments: {
          some: { vehicle: { make: query.make } },
        },
      },
      include: {
        fitments: { include: { vehicle: true }, take: 5 },
        inventoryEvents: true,
      },
      take: 20,
    });

    for (const part of searchParts) {
      const stock = part.inventoryEvents.reduce((sum, e) => sum + e.qtyDelta, 0);
      alternatives.push({
        id: part.id,
        name: part.name,
        sku: part.sku,
        description: part.description,
        condition: part.condition,
        costCents: part.costCents,
        matchType: 'alternative' as const,
        fitsVehicles: part.fitments.map(f => `${f.vehicle.year} ${f.vehicle.make} ${f.vehicle.model}`),
        stockOnHand: stock,
      });
    }
  }

  const totalResults = exactParts.length + interchangeParts.length + alternatives.length;

  return {
    exact: exactParts,
    interchange: interchangeParts,
    alternatives,
    query: { vehicle: vehicleLabel, matchedVehicleId: vehicle.id, totalResults },
  };
}

export async function getAvailableMakes(year?: number): Promise<string[]> {
  const makes = await prisma.vehicle.findMany({
    where: year ? { year } : undefined,
    select: { make: true },
    distinct: ['make'],
    orderBy: { make: 'asc' },
  });
  return makes.map(m => m.make);
}

export async function getModelsByMake(make: string, year?: number): Promise<string[]> {
  const models = await prisma.vehicle.findMany({
    where: year ? { make, year } : { make },
    select: { model: true },
    distinct: ['model'],
    orderBy: { model: 'asc' },
  });
  return models.map(m => m.model);
}

export async function getYearsByMakeModel(make?: string, model?: string): Promise<number[]> {
  const where: any = {};
  if (make) where.make = make;
  if (model) where.model = model;
  const years = await prisma.vehicle.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' },
  });
  return years.map(y => y.year);
}

export async function findRelatedParts(partIds: number[], vehicleId?: number): Promise<any[]> {
  if (partIds.length === 0) return [];

  // Get the source parts to find SKU prefixes + names for category matching
  const sourceParts = await prisma.part.findMany({
    where: { id: { in: partIds } },
    select: { id: true, sku: true, name: true },
  });

  const skuPrefixes = [...new Set(sourceParts.map(p => {
    const parts = p.sku.split('-');
    return parts[0]; // top-level category prefix
  }))];

  // Find parts in same SKU family that aren't already in results
  const related = await prisma.part.findMany({
    where: {
      sku: { in: skuPrefixes.map(prefix => prefix) },
      id: { notIn: partIds },
      ...(vehicleId ? {
        fitments: { some: { vehicleId } }
      } : {}),
    },
    include: { inventoryEvents: true },
    take: 8,
  });

  // Also do name-based similarity — common part pairings
  const COMMON_PAIRS: Record<string, string[]> = {
    'brake pad': ['rotor', 'brake fluid', 'caliper', 'brake hardware'],
    'rotor': ['brake pad', 'caliper', 'brake hardware'],
    'alternator': ['belt', 'battery', 'tensioner'],
    'water pump': ['thermostat', 'coolant', 'belt', 'hose'],
    'timing belt': ['water pump', 'tensioner', 'idler'],
    'spark plug': ['ignition wire', 'coil pack', 'air filter'],
    'oxygen sensor': ['air filter', 'fuel filter', 'catalytic converter'],
    'ball joint': ['tie rod', 'control arm', 'alignment'],
    'strut': ['spring', 'mount', 'sway bar link'],
    'fuel pump': ['fuel filter', 'strainer', 'sending unit'],
  };

  const nameKeywords = sourceParts.flatMap(p => {
    const name = p.name.toLowerCase();
    return Object.entries(COMMON_PAIRS)
      .filter(([key]) => name.includes(key))
      .flatMap(([, pairs]) => pairs);
  });

  let namePairs: any[] = [];
  if (nameKeywords.length > 0) {
    namePairs = await prisma.part.findMany({
      where: {
        id: { notIn: [...partIds, ...related.map(p => p.id)] },
        OR: nameKeywords.map(kw => ({ name: { contains: kw } })),
        ...(vehicleId ? {
          fitments: { some: { vehicleId } }
        } : {}),
      },
      include: { inventoryEvents: true },
      take: 6,
    });
  }

  const allRelated = [...related, ...namePairs];

  return allRelated.map(part => {
    const stock = part.inventoryEvents.reduce((sum: number, e: any) => sum + e.qtyDelta, 0);
    return {
      id: part.id,
      name: part.name,
      sku: part.sku,
      condition: part.condition,
      costCents: part.costCents,
      stockOnHand: stock,
    };
  });
}

export async function findBySkuOrOem(query: string): Promise<any[]> {
  const parts = await prisma.part.findMany({
    where: {
      OR: [
        { sku: { contains: query } },
        { name: { contains: query } },
        { description: { contains: query } },
      ],
    },
    include: {
      fitments: {
        include: { vehicle: true },
        take: 5,
      },
      inventoryEvents: true,
    },
    take: 20,
  });

  return parts.map(part => {
    const stock = part.inventoryEvents.reduce((sum, e) => sum + e.qtyDelta, 0);
    return {
      id: part.id,
      name: part.name,
      sku: part.sku,
      description: part.description,
      condition: part.condition,
      costCents: part.costCents,
      stockOnHand: stock,
      fitsVehicles: part.fitments.map(f => `${f.vehicle.year} ${f.vehicle.make} ${f.vehicle.model}`),
    };
  });
}
