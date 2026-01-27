import prisma from '../repositories/prisma.js';
import { CreatePartInput, PartsQuery } from '../schemas/parts.schema.js';

export async function createPart(input: CreatePartInput) {
  // Check if SKU already exists
  const existing = await prisma.part.findUnique({
    where: { sku: input.sku },
  });

  if (existing) {
    throw new Error('SKU already exists');
  }

  return prisma.part.create({
    data: input,
  });
}

export async function getParts(query: PartsQuery) {
  const { search, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { sku: { contains: search } },
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }
    : {};

  const [parts, total] = await Promise.all([
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
  ]);

  return {
    parts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPartById(id: number) {
  const part = await prisma.part.findUnique({
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
  });

  if (!part) {
    throw new Error('Part not found');
  }

  return part;
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
