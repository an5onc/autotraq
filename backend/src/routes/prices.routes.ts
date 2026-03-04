import { Router, Response } from 'express';
import { PrismaClient, PartCondition } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { serverError } from '../utils/response.js';
import { body, param, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();

// POST /api/prices/bulk — bulk update retail price for multiple parts
router.post('/bulk', [
  body('partIds').isArray().withMessage('partIds must be an array'),
  body('retailPriceCents').isInt({ min: 0 }).withMessage('retailPriceCents must be a non-negative integer')
], async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { partIds, retailPriceCents } = req.body;

    // Only admin and manager can update prices
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      return res.status(403).json({ error: 'Only admin and manager can update prices' });
    }

    const result = await prisma.part.updateMany({
      where: {
        id: { in: partIds }
      },
      data: {
        retailPriceCents
      }
    });

    res.json({
      success: true,
      message: `Updated ${result.count} parts with retail price of $${(retailPriceCents / 100).toFixed(2)}`,
      count: result.count
    });
  } catch (error) {
    serverError(res);
  }
});

// POST /api/prices/bulk-by-condition — set price = costCents * multiplier for all parts of that condition
router.post('/bulk-by-condition', [
  body('condition').isIn(Object.values(PartCondition)).withMessage('Invalid condition'),
  body('multiplier').isFloat({ min: 0 }).withMessage('multiplier must be a positive number')
], async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { condition, multiplier } = req.body;

    // Only admin and manager can update prices
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      return res.status(403).json({ error: 'Only admin and manager can update prices' });
    }

    // First, get all parts with this condition that have a costCents value
    const parts = await prisma.part.findMany({
      where: {
        condition,
        costCents: { not: null }
      }
    });

    // Update each part's retail price based on its cost * multiplier
    const updates = await Promise.all(
      parts.map(part =>
        prisma.part.update({
          where: { id: part.id },
          data: {
            retailPriceCents: Math.round(part.costCents! * multiplier)
          }
        })
      )
    );

    res.json({
      success: true,
      message: `Updated ${updates.length} ${condition} parts with ${multiplier}x cost multiplier`,
      count: updates.length
    });
  } catch (error) {
    serverError(res);
  }
});

// PUT /api/prices/:partId — update single part pricing
router.put('/:partId', [
  param('partId').isInt().withMessage('partId must be an integer'),
  body('retailPriceCents').optional().isInt({ min: 0 }).withMessage('retailPriceCents must be a non-negative integer'),
  body('isOem').optional().isBoolean().withMessage('isOem must be a boolean'),
  body('partType').optional().isIn(['OEM', 'Aftermarket', 'Remanufactured']).withMessage('Invalid part type')
], async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const partId = parseInt(req.params.partId);
    const { retailPriceCents, isOem, partType } = req.body;

    // Only admin and manager can update prices
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'manager')) {
      return res.status(403).json({ error: 'Only admin and manager can update prices' });
    }

    const updateData: any = {};
    if (retailPriceCents !== undefined) updateData.retailPriceCents = retailPriceCents;
    if (isOem !== undefined) updateData.isOem = isOem;
    if (partType !== undefined) updateData.partType = partType;

    const updatedPart = await prisma.part.update({
      where: { id: partId },
      data: updateData
    });

    res.json({
      success: true,
      part: updatedPart
    });
  } catch (error) {
    serverError(res);
  }
});

export default router;