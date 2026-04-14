import prisma from '../repositories/prisma.js';
import { CreatePartInput, UpdatePartInput, PartsQuery } from '../schemas/parts.schema.js';
import { generateBarcode } from './barcode.service.js';
import { lookupSku } from './sku.service.js';
import { haversineDistance, zipToCoords } from '../utils/distance.js';

export async function createPart(input: CreatePartInput) {
  // Check if SKU already exists
  const existing = await prisma.part.findUnique({
    where: { sku: input.sku },
  });

  if (existing) {
    throw new Error('SKU already exists');
  }

  // Auto-generate barcode for any SKU
  let barcodeData: string | undefined;
  let skuDecoded: string | undefined;
  try {
    barcodeData = await generateBarcode(input.sku);
    const decoded = await lookupSku(input.sku);
    if (decoded) skuDecoded = JSON.stringify(decoded);
  } catch {
    // Non-standard SKU format, no barcode
  }

  return prisma.part.create({
    data: {
      sku: input.sku,
      name: input.name,
      description: input.description,
      condition: input.condition,
      minStock: input.minStock,
      costCents: input.costCents,
      retailPriceCents: input.retailPriceCents,
      barcodeData,
      skuDecoded,
    },
  });
}

// Helper function to calculate stock by location for multiple parts
async function calculateStockByLocation(partIds: number[]): Promise<Map<number, Map<number, number>>> {
  if (partIds.length === 0) return new Map();

  const results = await prisma.inventoryEvent.groupBy({
    by: ['partId', 'locationId'],
    where: { partId: { in: partIds } },
    _sum: { qtyDelta: true },
  });

  const stockMap = new Map<number, Map<number, number>>();
  for (const r of results) {
    if (!stockMap.has(r.partId)) {
      stockMap.set(r.partId, new Map());
    }
    const locationMap = stockMap.get(r.partId)!;
    locationMap.set(r.locationId, r._sum.qtyDelta || 0);
  }
  return stockMap;
}

export async function getParts(query: PartsQuery & { zip?: string }) {
  const { search, condition, page, limit, zip, priceMin, priceMax } = query;
  const skip = (page - 1) * limit;

  const conditionFilter = condition ? { condition } : {};

  // Build price filter — only apply when caller explicitly passes bounds.
  // Using gte/lte on a nullable column automatically excludes NULL rows in SQL.
  const priceFilter: Record<string, unknown> =
    priceMin !== undefined || priceMax !== undefined
      ? {
          costCents: {
            ...(priceMin !== undefined ? { gte: priceMin } : {}),
            ...(priceMax !== undefined ? { lte: priceMax } : {}),
          },
        }
      : {};

  const where = {
    ...conditionFilter,
    ...priceFilter,
    ...(search ? {
      OR: [
        { sku: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ],
    } : {}),
  };

  const [parts, total, locations] = await Promise.all([
    prisma.part.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        fitments: {
          include: {
            vehicle: true,
          },
        },
        interchangeMembers: {
          include: {
            group: true,
          },
        },
      },
    }),
    prisma.part.count({ where }),
    prisma.location.findMany(),
  ]);

  // Get stock by location for all parts
  const partIds = parts.map(p => p.id);
  const stockByLocation = await calculateStockByLocation(partIds);

  // Get ZIP coordinates if provided
  let zipCoords: { lat: number; lng: number } | null = null;
  if (zip) {
    zipCoords = await zipToCoords(zip);
  }

  // Enhance parts with stock by location and distance info
  const enhancedParts = parts.map(part => {
    const locationStock = stockByLocation.get(part.id) || new Map();
    const stockLocations = [];
    let totalStock = 0;

    for (const location of locations) {
      const qty = locationStock.get(location.id) || 0;
      if (qty > 0) {
        totalStock += qty;
        const locationData: any = {
          locationId: location.id,
          locationName: location.name,
          quantity: qty,
          address: location.address,
          city: location.city,
          state: location.state,
          zipCode: location.zipCode,
        };

        // Calculate distance if we have ZIP coordinates and location coordinates
        if (zipCoords && location.lat && location.lng) {
          locationData.distanceMiles = Math.round(haversineDistance(
            zipCoords.lat,
            zipCoords.lng,
            location.lat,
            location.lng
          ) * 10) / 10; // Round to 1 decimal place
        }

        stockLocations.push(locationData);
      }
    }

    // Sort locations by distance if available
    if (zipCoords) {
      stockLocations.sort((a, b) => (a.distanceMiles || 9999) - (b.distanceMiles || 9999));
    }

    return {
      ...part,
      retailPriceCents: part.retailPriceCents,
      isOem: part.isOem,
      partType: part.partType,
      stockOnHand: totalStock,
      stockLocations,
    };
  });

  return {
    parts: enhancedParts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPartById(id: number) {
  const [part, locations] = await Promise.all([
    prisma.part.findUnique({
      where: { id },
      include: {
        fitments: {
          include: {
            vehicle: true,
          },
        },
        interchangeMembers: {
          include: {
            group: {
              include: {
                members: {
                  include: {
                    part: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.location.findMany(),
  ]);

  if (!part) {
    throw new Error('Part not found');
  }

  // Get stock by location for this part
  const stockByLocation = await calculateStockByLocation([part.id]);
  const locationStock = stockByLocation.get(part.id) || new Map();
  const stockLocations = [];
  let totalStock = 0;

  for (const location of locations) {
    const qty = locationStock.get(location.id) || 0;
    if (qty > 0) {
      totalStock += qty;
      stockLocations.push({
        locationId: location.id,
        locationName: location.name,
        quantity: qty,
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
      });
    }
  }

  return {
    ...part,
    retailPriceCents: part.retailPriceCents,
    isOem: part.isOem,
    partType: part.partType,
    stockOnHand: totalStock,
    stockLocations,
  };
}

export async function updatePart(id: number, data: UpdatePartInput) {
  const part = await prisma.part.findUnique({ where: { id } });
  if (!part) throw new Error('Part not found');

  if (data.sku && data.sku !== part.sku) {
    const existing = await prisma.part.findUnique({ where: { sku: data.sku } });
    if (existing) throw new Error('SKU already exists');
  }

  return prisma.part.update({
    where: { id },
    data,
    include: {
      fitments: { include: { vehicle: true } },
      interchangeMembers: { include: { group: { include: { members: { include: { part: true } } } } } },
    },
  });
}

export async function deletePart(id: number) {
  const part = await prisma.part.findUnique({ where: { id } });
  if (!part) throw new Error('Part not found');

  await prisma.$transaction([
    prisma.partFitment.deleteMany({ where: { partId: id } }),
    prisma.interchangeGroupMember.deleteMany({ where: { partId: id } }),
    prisma.requestItem.deleteMany({ where: { partId: id } }),
    prisma.inventoryEvent.deleteMany({ where: { partId: id } }),
    prisma.part.delete({ where: { id } }),
  ]);
}

export async function generatePartBarcode(id: number) {
  const part = await prisma.part.findUnique({ where: { id } });
  if (!part) throw new Error('Part not found');

  const barcodeData = await generateBarcode(part.sku);
  let skuDecoded: string | undefined;
  try {
    const decoded = await lookupSku(part.sku);
    if (decoded) skuDecoded = JSON.stringify(decoded);
  } catch {
    // Non-standard SKU
  }

  return prisma.part.update({
    where: { id },
    data: { barcodeData, skuDecoded },
    include: {
      fitments: { include: { vehicle: true } },
      interchangeMembers: { include: { group: { include: { members: { include: { part: true } } } } } },
    },
  });
}

export async function addFitment(partId: number, vehicleId: number) {
  // Verify part exists
  const part = await prisma.part.findUnique({ where: { id: partId } });
  if (!part) {
    throw new Error('Part not found');
  }

  // Verify vehicle exists
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // Check if fitment already exists
  const existing = await prisma.partFitment.findUnique({
    where: { partId_vehicleId: { partId, vehicleId } },
  });

  if (existing) {
    throw new Error('Fitment already exists');
  }

  return prisma.partFitment.create({
    data: { partId, vehicleId },
    include: { vehicle: true },
  });
}

export async function removeFitment(partId: number, vehicleId: number) {
  const fitment = await prisma.partFitment.findUnique({
    where: { partId_vehicleId: { partId, vehicleId } },
  });

  if (!fitment) {
    throw new Error('Fitment not found');
  }

  await prisma.partFitment.delete({
    where: { partId_vehicleId: { partId, vehicleId } },
  });
}

export async function getAllPartsForExport() {
  const parts = await prisma.part.findMany({
    select: {
      id: true, sku: true, name: true, description: true, condition: true,
      minStock: true, costCents: true, createdAt: true,
      inventoryEvents: { select: { qtyDelta: true } },
    },
    orderBy: { sku: 'asc' },
  });
  return parts.map(p => ({
    ...p,
    onHand: p.inventoryEvents.reduce((sum: number, e: { qtyDelta: number }) => sum + e.qtyDelta, 0),
  }));
}
