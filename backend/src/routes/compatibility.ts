import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Check part compatibility with vehicle
router.post('/check', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { partId, vehicleId, make, model, year } = req.body;

    const part = await prisma.part.findUnique({
      where: { id: partId },
      include: { fitments: true }
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    const universalFit = part.fitments.length === 0;
    let isCompatible = universalFit;
    let compatibilityDetails: Record<string, unknown> = {};

    if (vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
      if (vehicle) {
        isCompatible = universalFit || part.fitments.some(f => f.vehicleId === vehicle.id);
        compatibilityDetails = {
          vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          trim: vehicle.trim
        };
      }
    } else if (make && model && year) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { make, model, year: parseInt(year) }
      });
      if (vehicle) {
        isCompatible = universalFit || part.fitments.some(f => f.vehicleId === vehicle.id);
      }
      compatibilityDetails = {
        vehicle: `${year} ${make} ${model}`,
        directMatch: isCompatible
      };
    }

    res.json({
      partId: part.id,
      partName: part.name,
      sku: part.sku,
      isCompatible,
      compatibilityDetails,
      alternatives: [],
      universalFit,
      notes: generateCompatibilityNotes(universalFit, isCompatible)
    });

  } catch (error) {
    console.error('Compatibility check error:', error);
    res.status(500).json({ error: 'Failed to check compatibility' });
  }
});

// Get all compatible parts for a vehicle
router.get('/vehicle/:vehicleId/parts', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const vehicleId = parseInt(req.params.vehicleId);

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const compatibleParts = await prisma.part.findMany({
      where: {
        OR: [
          { fitments: { none: {} } },
          { fitments: { some: { vehicleId } } }
        ]
      },
      include: { fitments: true }
    });

    res.json({
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      totalParts: compatibleParts.length,
      parts: compatibleParts.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        retailPriceCents: p.retailPriceCents,
        universalFit: p.fitments.length === 0
      }))
    });

  } catch (error) {
    console.error('Vehicle parts lookup error:', error);
    res.status(500).json({ error: 'Failed to get compatible parts' });
  }
});

// Cross-reference parts (find interchangeable parts)
router.get('/cross-reference/:sku', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { sku } = req.params;

    const part = await prisma.part.findUnique({
      where: { sku },
      include: {
        interchangeMembers: { include: { group: true } }
      }
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    let interchangeableParts: { id: number; sku: string; name: string; retailPriceCents: number | null }[] = [];

    const groupIds = part.interchangeMembers.map(m => m.groupId);
    if (groupIds.length > 0) {
      const members = await prisma.interchangeGroupMember.findMany({
        where: {
          groupId: { in: groupIds },
          partId: { not: part.id }
        },
        include: { part: true }
      });
      interchangeableParts = members.map(m => ({
        id: m.part.id,
        sku: m.part.sku,
        name: m.part.name,
        retailPriceCents: m.part.retailPriceCents
      }));
    }

    res.json({
      originalPart: { id: part.id, sku: part.sku, name: part.name },
      directInterchange: interchangeableParts,
      similarParts: []
    });

  } catch (error) {
    console.error('Cross-reference error:', error);
    res.status(500).json({ error: 'Failed to find cross-references' });
  }
});

function generateCompatibilityNotes(universalFit: boolean, isCompatible: boolean): string[] {
  const notes: string[] = [];
  if (universalFit) {
    notes.push('Universal fit part - compatible with most vehicles');
  }
  if (!isCompatible) {
    notes.push('This part may not be compatible with your vehicle');
    notes.push('Please verify fitment before purchasing');
  }
  return notes;
}

export default router;
