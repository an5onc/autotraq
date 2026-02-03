import prisma from '../repositories/prisma.js';
import { InventoryEventType } from '@prisma/client';
import {
  ReceiveStockInput,
  CorrectStockInput,
  ReturnStockInput,
  OnHandQuery,
  EventsQuery,
  CreateLocationInput,
} from '../schemas/inventory.schema.js';

/**
 * INVENTORY SERVICE
 *
 * Per CLAUDE.md Section 2: Inventory must be auditable via append-only ledger.
 * The `inventory_events` table is the source of truth.
 * Current quantity is derived by summing all events.
 */

export async function createLocation(input: CreateLocationInput) {
  const existing = await prisma.location.findUnique({
    where: { name: input.name },
  });

  if (existing) {
    throw new Error('Location already exists');
  }

  return prisma.location.create({
    data: input,
  });
}

export async function getLocations() {
  return prisma.location.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Receive stock - creates a RECEIVE event (positive qty)
 */
export async function receiveStock(input: ReceiveStockInput, userId: number) {
  // Validate part exists
  const part = await prisma.part.findUnique({ where: { id: input.partId } });
  if (!part) {
    throw new Error('Part not found');
  }

  // Validate location exists
  const location = await prisma.location.findUnique({ where: { id: input.locationId } });
  if (!location) {
    throw new Error('Location not found');
  }

  // Create inventory event (always positive for RECEIVE)
  const event = await prisma.inventoryEvent.create({
    data: {
      type: InventoryEventType.RECEIVE,
      qtyDelta: Math.abs(input.qty), // Ensure positive
      partId: input.partId,
      locationId: input.locationId,
      reason: input.reason,
      createdBy: userId,
    },
    include: {
      part: true,
      location: true,
      user: { select: { id: true, name: true } },
    },
  });

  return event;
}

/**
 * Return stock - creates a RETURN event (positive qty, puts items back in inventory)
 */
export async function returnStock(input: ReturnStockInput, userId: number) {
  // Validate part exists
  const part = await prisma.part.findUnique({ where: { id: input.partId } });
  if (!part) {
    throw new Error('Part not found');
  }

  // Validate location exists
  const location = await prisma.location.findUnique({ where: { id: input.locationId } });
  if (!location) {
    throw new Error('Location not found');
  }

  // Create inventory event (always positive for RETURN - adds back to inventory)
  const event = await prisma.inventoryEvent.create({
    data: {
      type: InventoryEventType.RETURN,
      qtyDelta: Math.abs(input.qty), // Ensure positive
      partId: input.partId,
      locationId: input.locationId,
      reason: input.reason,
      createdBy: userId,
    },
    include: {
      part: true,
      location: true,
      user: { select: { id: true, name: true } },
    },
  });

  return event;
}

/**
 * Correct stock - creates a CORRECTION event (can be positive or negative)
 */
export async function correctStock(input: CorrectStockInput, userId: number) {
  // Validate part exists
  const part = await prisma.part.findUnique({ where: { id: input.partId } });
  if (!part) {
    throw new Error('Part not found');
  }

  // Validate location exists
  const location = await prisma.location.findUnique({ where: { id: input.locationId } });
  if (!location) {
    throw new Error('Location not found');
  }

  // For negative corrections, check we have enough stock
  if (input.qty < 0) {
    const onHand = await calculateOnHand(input.partId, input.locationId);
    if (onHand + input.qty < 0) {
      throw new Error(`Cannot correct by ${input.qty}. Current on-hand is ${onHand}`);
    }
  }

  // Create inventory event
  const event = await prisma.inventoryEvent.create({
    data: {
      type: InventoryEventType.CORRECTION,
      qtyDelta: input.qty,
      partId: input.partId,
      locationId: input.locationId,
      reason: input.reason,
      createdBy: userId,
    },
    include: {
      part: true,
      location: true,
      user: { select: { id: true, name: true } },
    },
  });

  return event;
}

/**
 * Fulfill request - creates FULFILL events (negative qty) for each item
 * Called by requests.service when fulfilling a request
 */
export async function fulfillItems(
  items: Array<{ partId: number; qty: number; locationId: number }>,
  requestId: number,
  userId: number
) {
  const events = [];

  for (const item of items) {
    // Check sufficient stock
    const onHand = await calculateOnHand(item.partId, item.locationId);
    if (onHand < item.qty) {
      const part = await prisma.part.findUnique({ where: { id: item.partId } });
      throw new Error(
        `Insufficient stock for part ${part?.sku || item.partId}. ` +
        `Requested: ${item.qty}, Available: ${onHand}`
      );
    }

    // Create FULFILL event (negative delta)
    const event = await prisma.inventoryEvent.create({
      data: {
        type: InventoryEventType.FULFILL,
        qtyDelta: -Math.abs(item.qty), // Ensure negative
        partId: item.partId,
        locationId: item.locationId,
        requestId,
        createdBy: userId,
      },
    });

    events.push(event);
  }

  return events;
}

/**
 * Calculate on-hand quantity by summing all inventory events
 * This is the source of truth per CLAUDE.md Section 2
 */
export async function calculateOnHand(partId?: number, locationId?: number): Promise<number> {
  const where: Record<string, number> = {};
  if (partId) where.partId = partId;
  if (locationId) where.locationId = locationId;

  const result = await prisma.inventoryEvent.aggregate({
    where,
    _sum: { qtyDelta: true },
  });

  return result._sum.qtyDelta || 0;
}

/**
 * Get on-hand quantities, optionally filtered by part/location
 */
export async function getOnHand(query: OnHandQuery) {
  const { partId, locationId } = query;

  // If specific part and location, return single value
  if (partId && locationId) {
    const qty = await calculateOnHand(partId, locationId);
    const part = await prisma.part.findUnique({ where: { id: partId } });
    const location = await prisma.location.findUnique({ where: { id: locationId } });
    return [{
      partId,
      locationId,
      part,
      location,
      quantity: qty,
    }];
  }

  // Otherwise, aggregate by part and location
  const events = await prisma.inventoryEvent.groupBy({
    by: ['partId', 'locationId'],
    where: {
      ...(partId && { partId }),
      ...(locationId && { locationId }),
    },
    _sum: { qtyDelta: true },
  });

  // Enrich with part and location details
  const results = await Promise.all(
    events.map(async (e) => {
      const [part, location] = await Promise.all([
        prisma.part.findUnique({ where: { id: e.partId } }),
        prisma.location.findUnique({ where: { id: e.locationId } }),
      ]);
      return {
        partId: e.partId,
        locationId: e.locationId,
        part,
        location,
        quantity: e._sum.qtyDelta || 0,
      };
    })
  );

  // Filter out zero quantities
  return results.filter((r) => r.quantity !== 0);
}

/**
 * Get inventory events with pagination and filtering
 */
export async function getEvents(query: EventsQuery) {
  const { partId, locationId, type, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (partId) where.partId = partId;
  if (locationId) where.locationId = locationId;
  if (type) where.type = type;

  const [events, total] = await Promise.all([
    prisma.inventoryEvent.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        part: true,
        location: true,
        user: { select: { id: true, name: true } },
        request: true,
      },
    }),
    prisma.inventoryEvent.count({ where }),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
