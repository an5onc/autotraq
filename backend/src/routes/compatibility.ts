import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Check part compatibility with vehicle
router.post('/check', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { partId, vehicleId, vin, make, model, year } = req.body;

    // Get part details
    const part = await prisma.part.findUnique({
      where: { id: partId },
      include: { fitments: true }
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    // Check compatibility
    let isCompatible = false;
    let compatibilityDetails = {};

    if (vehicleId) {
      // Check by vehicle ID
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: vehicleId }
      });

      if (vehicle) {
        isCompatible = checkVehicleCompatibility(part, vehicle);
        compatibilityDetails = {
          vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          trim: vehicle.trim,
          engine: vehicle.engine
        };
      }
    } else if (make && model && year) {
      // Check by make/model/year
      isCompatible = part.fitments.some(fitment =>
        fitment.make === make &&
        fitment.model === model &&
        fitment.yearStart <= year &&
        fitment.yearEnd >= year
      );

      compatibilityDetails = {
        vehicle: `${year} ${make} ${model}`,
        directMatch: isCompatible
      };
    }

    // Find alternative parts if not compatible
    const alternatives = !isCompatible
      ? await findAlternativeParts(part, { make, model, year })
      : [];

    res.json({
      partId: part.id,
      partName: part.name,
      sku: part.sku,
      isCompatible,
      compatibilityDetails,
      alternatives: alternatives.map(alt => ({
        id: alt.id,
        sku: alt.sku,
        name: alt.name,
        price: alt.retailPrice,
        inStock: alt.quantity > 0
      })),
      universalFit: part.fitments.length === 0,
      notes: generateCompatibilityNotes(part, isCompatible)
    });

  } catch (error) {
    console.error('Compatibility check error:', error);
    res.status(500).json({ error: 'Failed to check compatibility' });
  }
});

// Get all compatible parts for a vehicle
router.get('/vehicle/:vehicleId/parts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params;
    const { category } = req.query;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Find all compatible parts
    const compatibleParts = await prisma.part.findMany({
      where: {
        ...(category && { category: String(category) }),
        OR: [
          // Universal parts
          { fitments: { none: {} } },
          // Specific fitments
          {
            fitments: {
              some: {
                make: vehicle.make,
                model: vehicle.model,
                yearStart: { lte: vehicle.year },
                yearEnd: { gte: vehicle.year }
              }
            }
          }
        ]
      },
      include: {
        fitments: true
      }
    });

    // Group by category
    const partsByCategory: { [key: string]: any[] } = {};

    compatibleParts.forEach(part => {
      const cat = part.category || 'Other';
      if (!partsByCategory[cat]) {
        partsByCategory[cat] = [];
      }
      partsByCategory[cat].push({
        id: part.id,
        sku: part.sku,
        name: part.name,
        price: part.retailPrice,
        inStock: part.quantity > 0,
        quantity: part.quantity
      });
    });

    res.json({
      vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      totalParts: compatibleParts.length,
      categories: Object.keys(partsByCategory),
      partsByCategory
    });

  } catch (error) {
    console.error('Vehicle parts lookup error:', error);
    res.status(500).json({ error: 'Failed to get compatible parts' });
  }
});

// Cross-reference parts (find interchangeable parts)
router.get('/cross-reference/:sku', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sku } = req.params;

    const part = await prisma.part.findUnique({
      where: { sku },
      include: { interchangeGroup: true }
    });

    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }

    // Find interchangeable parts
    let interchangeableParts: any[] = [];

    if (part.interchangeGroupId) {
      interchangeableParts = await prisma.part.findMany({
        where: {
          interchangeGroupId: part.interchangeGroupId,
          id: { not: part.id }
        }
      });
    }

    // Also find parts with similar specs (mock logic)
    const similarParts = await prisma.part.findMany({
      where: {
        category: part.category,
        id: { not: part.id },
        // Would add more specific criteria in production
      },
      take: 5
    });

    res.json({
      originalPart: {
        id: part.id,
        sku: part.sku,
        name: part.name,
        manufacturer: part.manufacturer
      },
      directInterchange: interchangeableParts.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        manufacturer: p.manufacturer,
        price: p.retailPrice,
        inStock: p.quantity > 0
      })),
      similarParts: similarParts.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        manufacturer: p.manufacturer,
        price: p.retailPrice,
        matchConfidence: calculateMatchConfidence(part, p)
      }))
    });

  } catch (error) {
    console.error('Cross-reference error:', error);
    res.status(500).json({ error: 'Failed to find cross-references' });
  }
});

// Helper functions
function checkVehicleCompatibility(part: any, vehicle: any): boolean {
  if (part.fitments.length === 0) {
    return true; // Universal part
  }

  return part.fitments.some((fitment: any) =>
    fitment.make === vehicle.make &&
    fitment.model === vehicle.model &&
    fitment.yearStart <= vehicle.year &&
    fitment.yearEnd >= vehicle.year
  );
}

async function findAlternativeParts(originalPart: any, vehicleInfo: any): Promise<any[]> {
  // Mock implementation - would query for similar parts
  return [];
}

function generateCompatibilityNotes(part: any, isCompatible: boolean): string[] {
  const notes: string[] = [];

  if (part.fitments.length === 0) {
    notes.push('Universal fit part - compatible with most vehicles');
  }

  if (!isCompatible) {
    notes.push('This part may not be compatible with your vehicle');
    notes.push('Please verify fitment before purchasing');
  }

  if (part.notes) {
    notes.push(part.notes);
  }

  return notes;
}

function calculateMatchConfidence(part1: any, part2: any): number {
  let confidence = 0;

  // Same category
  if (part1.category === part2.category) confidence += 40;

  // Same manufacturer
  if (part1.manufacturer === part2.manufacturer) confidence += 30;

  // Similar name
  if (part1.name && part2.name) {
    const nameSimilarity = calculateStringSimilarity(part1.name, part2.name);
    confidence += nameSimilarity * 30;
  }

  return Math.min(confidence, 95);
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export default router;