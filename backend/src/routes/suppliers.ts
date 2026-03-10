import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all suppliers
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, status, sortBy = 'name', sortOrder = 'asc' } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: {
        [sortBy as string]: sortOrder
      },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            parts: true
          }
        }
      }
    });

    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Get supplier by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        parts: {
          take: 10,
          orderBy: { lastOrdered: 'desc' }
        },
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            purchaseOrders: true,
            parts: true
          }
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier' });
  }
});

// Create new supplier
router.post('/', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const {
      name,
      code,
      contactPerson,
      email,
      phone,
      address,
      city,
      state,
      zip,
      country = 'USA',
      website,
      taxId,
      paymentTerms = 'NET30',
      shippingMethod,
      accountNumber,
      notes,
      minimumOrderAmount = 0,
      leadTimeDays = 7
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        error: 'Name, email, and phone are required'
      });
    }

    // Generate supplier code if not provided
    const supplierCode = code || await generateSupplierCode(name);

    const supplier = await prisma.supplier.create({
      data: {
        name,
        code: supplierCode,
        contactPerson,
        email,
        phone,
        address,
        city,
        state,
        zip,
        country,
        website,
        taxId,
        paymentTerms,
        shippingMethod,
        accountNumber,
        notes,
        minimumOrderAmount,
        leadTimeDays,
        status: 'ACTIVE',
        rating: 5.0,
        createdBy: req.user.id
      }
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.createdBy;

    const supplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier (soft delete)
router.delete('/:id', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);

    // Check if supplier has active purchase orders
    const activePOs = await prisma.purchaseOrder.count({
      where: {
        supplierId,
        status: {
          in: ['PENDING', 'ORDERED', 'PARTIAL']
        }
      }
    });

    if (activePOs > 0) {
      return res.status(400).json({
        error: 'Cannot delete supplier with active purchase orders'
      });
    }

    await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date()
      }
    });

    res.json({ message: 'Supplier deactivated successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

// Get supplier performance metrics
router.get('/:id/performance', authenticate, async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
    }

    // Get purchase order statistics
    const poStats = await prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: {
        supplierId,
        createdAt: dateFilter
      },
      _count: true,
      _sum: {
        totalAmount: true
      }
    });

    // Get average delivery time
    const deliveredOrders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        status: 'RECEIVED',
        receivedDate: { not: null },
        createdAt: dateFilter
      },
      select: {
        createdAt: true,
        receivedDate: true
      }
    });

    const deliveryTimes = deliveredOrders.map(order => {
      if (order.receivedDate) {
        return Math.floor(
          (order.receivedDate.getTime() - order.createdAt.getTime()) /
          (1000 * 60 * 60 * 24)
        );
      }
      return 0;
    }).filter(days => days > 0);

    const avgDeliveryDays = deliveryTimes.length > 0
      ? deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length
      : 0;

    // Get quality metrics (returns/defects)
    const qualityIssues = await prisma.qualityIssue.count({
      where: {
        supplierId,
        createdAt: dateFilter
      }
    });

    // Get top parts supplied
    const topParts = await prisma.part.findMany({
      where: {
        supplierId
      },
      orderBy: {
        quantity: 'desc'
      },
      take: 5,
      select: {
        id: true,
        name: true,
        sku: true,
        quantity: true,
        cost: true
      }
    });

    res.json({
      purchaseOrders: poStats,
      avgDeliveryDays: Math.round(avgDeliveryDays * 10) / 10,
      onTimeDeliveryRate: calculateOnTimeRate(deliveredOrders),
      qualityIssues,
      topParts,
      totalSpend: poStats.reduce((sum, stat) => sum + (stat._sum.totalAmount || 0), 0)
    });
  } catch (error) {
    console.error('Error fetching supplier performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Create purchase order for supplier
router.post('/:id/purchase-orders', authenticate, authorize(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    const {
      items, // Array of { partId, quantity, unitCost }
      shippingCost = 0,
      taxAmount = 0,
      notes,
      expectedDeliveryDate
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Purchase order must have items' });
    }

    // Calculate total
    const subtotal = items.reduce((sum: number, item: any) =>
      sum + (item.quantity * item.unitCost), 0
    );
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Generate PO number
    const poNumber = await generatePONumber();

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        status: 'PENDING',
        subtotal,
        shippingCost,
        taxAmount,
        totalAmount,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
        notes,
        createdBy: req.user.id,
        items: {
          create: items.map((item: any) => ({
            partId: item.partId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.quantity * item.unitCost
          }))
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            part: true
          }
        }
      }
    });

    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
});

// Helper functions
async function generateSupplierCode(name: string): Promise<string> {
  const prefix = name.substring(0, 3).toUpperCase();
  const count = await prisma.supplier.count({
    where: {
      code: {
        startsWith: prefix
      }
    }
  });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

async function generatePONumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  const count = await prisma.purchaseOrder.count({
    where: {
      poNumber: {
        startsWith: `PO-${year}${month}`
      }
    }
  });

  return `PO-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}

function calculateOnTimeRate(orders: any[]): number {
  if (orders.length === 0) return 100;

  const onTime = orders.filter(order => {
    if (!order.expectedDeliveryDate || !order.receivedDate) return true;
    return order.receivedDate <= order.expectedDeliveryDate;
  }).length;

  return Math.round((onTime / orders.length) * 100);
}

export default router;