import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
const mockPrismaInventoryEvent = {
  aggregate: vi.fn(),
  create: vi.fn(),
  findMany: vi.fn(),
  groupBy: vi.fn(),
  count: vi.fn(),
};

const mockPrismaPart = {
  findUnique: vi.fn(),
};

const mockPrismaLocation = {
  findUnique: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
};

vi.mock('../../src/repositories/prisma.js', () => ({
  default: {
    inventoryEvent: mockPrismaInventoryEvent,
    part: mockPrismaPart,
    location: mockPrismaLocation,
  },
}));

// Import after mocking
import * as inventoryService from '../../src/services/inventory.service.js';

describe('Inventory Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateOnHand', () => {
    it('should return 0 when no events exist', async () => {
      mockPrismaInventoryEvent.aggregate.mockResolvedValue({ _sum: { qtyDelta: null } });

      const result = await inventoryService.calculateOnHand(1, 1);

      expect(result).toBe(0);
      expect(mockPrismaInventoryEvent.aggregate).toHaveBeenCalledWith({
        where: { partId: 1, locationId: 1 },
        _sum: { qtyDelta: true },
      });
    });

    it('should sum positive deltas (RECEIVE events)', async () => {
      mockPrismaInventoryEvent.aggregate.mockResolvedValue({ _sum: { qtyDelta: 100 } });

      const result = await inventoryService.calculateOnHand(1, 1);

      expect(result).toBe(100);
    });

    it('should correctly handle mixed positive and negative deltas', async () => {
      // Simulating: RECEIVE +10, FULFILL -3 = 7
      mockPrismaInventoryEvent.aggregate.mockResolvedValue({ _sum: { qtyDelta: 7 } });

      const result = await inventoryService.calculateOnHand(1, 1);

      expect(result).toBe(7);
    });

    it('should handle CORRECTION events (positive adjustment)', async () => {
      // Simulating: RECEIVE +10, CORRECTION +5 = 15
      mockPrismaInventoryEvent.aggregate.mockResolvedValue({ _sum: { qtyDelta: 15 } });

      const result = await inventoryService.calculateOnHand(1, 1);

      expect(result).toBe(15);
    });

    it('should handle CORRECTION events (negative adjustment)', async () => {
      // Simulating: RECEIVE +10, CORRECTION -3 = 7
      mockPrismaInventoryEvent.aggregate.mockResolvedValue({ _sum: { qtyDelta: 7 } });

      const result = await inventoryService.calculateOnHand(1, 1);

      expect(result).toBe(7);
    });
  });

  describe('receiveStock', () => {
    it('should create a RECEIVE event with positive qty', async () => {
      mockPrismaPart.findUnique.mockResolvedValue({ id: 1, sku: 'TEST-001' });
      mockPrismaLocation.findUnique.mockResolvedValue({ id: 1, name: 'Warehouse' });
      mockPrismaInventoryEvent.create.mockResolvedValue({
        id: 1,
        type: 'RECEIVE',
        qtyDelta: 10,
        partId: 1,
        locationId: 1,
        createdBy: 1,
      });

      const result = await inventoryService.receiveStock(
        { partId: 1, locationId: 1, qty: 10, reason: 'Test' },
        1
      );

      expect(mockPrismaInventoryEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'RECEIVE',
            qtyDelta: 10, // Must be positive
          }),
        })
      );
      expect(result.qtyDelta).toBe(10);
    });

    it('should throw error if part not found', async () => {
      mockPrismaPart.findUnique.mockResolvedValue(null);

      await expect(
        inventoryService.receiveStock({ partId: 999, locationId: 1, qty: 10 }, 1)
      ).rejects.toThrow('Part not found');
    });

    it('should throw error if location not found', async () => {
      mockPrismaPart.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaLocation.findUnique.mockResolvedValue(null);

      await expect(
        inventoryService.receiveStock({ partId: 1, locationId: 999, qty: 10 }, 1)
      ).rejects.toThrow('Location not found');
    });
  });

  describe('correctStock', () => {
    it('should create a CORRECTION event with positive qty', async () => {
      mockPrismaPart.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaLocation.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaInventoryEvent.aggregate.mockResolvedValue({ _sum: { qtyDelta: 10 } });
      mockPrismaInventoryEvent.create.mockResolvedValue({
        id: 1,
        type: 'CORRECTION',
        qtyDelta: 5,
        partId: 1,
        locationId: 1,
        reason: 'Found extra',
      });

      const result = await inventoryService.correctStock(
        { partId: 1, locationId: 1, qty: 5, reason: 'Found extra' },
        1
      );

      expect(result.type).toBe('CORRECTION');
      expect(result.qtyDelta).toBe(5);
    });

    it('should reject negative correction that would result in negative stock', async () => {
      mockPrismaPart.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaLocation.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaInventoryEvent.aggregate.mockResolvedValue({ _sum: { qtyDelta: 5 } });

      await expect(
        inventoryService.correctStock(
          { partId: 1, locationId: 1, qty: -10, reason: 'Adjustment' },
          1
        )
      ).rejects.toThrow('Cannot correct by -10. Current on-hand is 5');
    });
  });
});
