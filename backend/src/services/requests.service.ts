import prisma from '../repositories/prisma.js';
import { RequestStatus } from '@prisma/client';
import { CreateRequestInput, RequestsQuery } from '../schemas/requests.schema.js';
import * as inventoryService from './inventory.service.js';

/**
 * REQUESTS SERVICE
 *
 * Request lifecycle per CLAUDE.md Section 9:
 * PENDING -> APPROVED -> FULFILLED
 *         -> CANCELLED (optional)
 */

export async function createRequest(input: CreateRequestInput, userId: number) {
  // Validate all parts exist
  for (const item of input.items) {
    const part = await prisma.part.findUnique({ where: { id: item.partId } });
    if (!part) {
      throw new Error(`Part with ID ${item.partId} not found`);
    }
  }

  // Create request with items
  const request = await prisma.request.create({
    data: {
      notes: input.notes,
      createdBy: userId,
      items: {
        create: input.items.map((item) => ({
          partId: item.partId,
          qtyRequested: item.qtyRequested,
          locationId: item.locationId,
        })),
      },
    },
    include: {
      items: {
        include: { part: true, location: true },
      },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  return request;
}

export async function getRequests(query: RequestsQuery) {
  const { status, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { part: true, location: true },
        },
        creator: { select: { id: true, name: true } },
      },
    }),
    prisma.request.count({ where }),
  ]);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getRequestById(id: number) {
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      items: {
        include: { part: true, location: true },
      },
      creator: { select: { id: true, name: true, email: true } },
      inventoryEvents: {
        include: { part: true, location: true },
      },
    },
  });

  if (!request) {
    throw new Error('Request not found');
  }

  return request;
}

/**
 * Approve a request
 * Valid transition: PENDING -> APPROVED
 */
export async function approveRequest(requestId: number, userId: number) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Request not found');
  }

  // Validate state transition
  if (request.status !== RequestStatus.PENDING) {
    throw new Error(
      `Cannot approve request. Current status is ${request.status}. ` +
      `Only PENDING requests can be approved.`
    );
  }

  return prisma.request.update({
    where: { id: requestId },
    data: {
      status: RequestStatus.APPROVED,
      approvedBy: userId,
      approvedAt: new Date(),
    },
    include: {
      items: {
        include: { part: true, location: true },
      },
      creator: { select: { id: true, name: true } },
    },
  });
}

/**
 * Fulfill a request
 * Valid transition: APPROVED -> FULFILLED
 * Creates inventory events for each item (decreases stock)
 */
export async function fulfillRequest(requestId: number, userId: number) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      items: {
        include: { part: true, location: true },
      },
    },
  });

  if (!request) {
    throw new Error('Request not found');
  }

  // Validate state transition
  if (request.status !== RequestStatus.APPROVED) {
    throw new Error(
      `Cannot fulfill request. Current status is ${request.status}. ` +
      `Only APPROVED requests can be fulfilled.`
    );
  }

  // Validate all items have a location
  for (const item of request.items) {
    if (!item.locationId) {
      throw new Error(
        `Request item for part ${item.part.sku} does not have a location specified`
      );
    }
  }

  // Create fulfill events for each item (this decreases inventory)
  const fulfillItems = request.items.map((item) => ({
    partId: item.partId,
    qty: item.qtyRequested,
    locationId: item.locationId!,
  }));

  await inventoryService.fulfillItems(fulfillItems, requestId, userId);

  // Update request status and item quantities
  const updatedRequest = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: RequestStatus.FULFILLED,
      fulfilledBy: userId,
      fulfilledAt: new Date(),
      items: {
        updateMany: request.items.map((item) => ({
          where: { id: item.id },
          data: { qtyFulfilled: item.qtyRequested },
        })),
      },
    },
    include: {
      items: {
        include: { part: true, location: true },
      },
      creator: { select: { id: true, name: true } },
      inventoryEvents: true,
    },
  });

  return updatedRequest;
}

/**
 * Cancel a request
 * Valid transitions: PENDING -> CANCELLED, APPROVED -> CANCELLED
 */
export async function cancelRequest(requestId: number, userId: number) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error('Request not found');
  }

  // Validate state transition
  if (request.status === RequestStatus.FULFILLED) {
    throw new Error('Cannot cancel a fulfilled request');
  }

  if (request.status === RequestStatus.CANCELLED) {
    throw new Error('Request is already cancelled');
  }

  return prisma.request.update({
    where: { id: requestId },
    data: {
      status: RequestStatus.CANCELLED,
    },
    include: {
      items: {
        include: { part: true, location: true },
      },
      creator: { select: { id: true, name: true } },
    },
  });
}

/**
 * Validates request state transitions
 * Used for unit testing per CLAUDE.md Section 8
 */
export function canTransition(
  currentStatus: RequestStatus,
  targetStatus: RequestStatus
): boolean {
  const validTransitions: Record<RequestStatus, RequestStatus[]> = {
    [RequestStatus.PENDING]: [RequestStatus.APPROVED, RequestStatus.CANCELLED],
    [RequestStatus.APPROVED]: [RequestStatus.FULFILLED, RequestStatus.CANCELLED],
    [RequestStatus.FULFILLED]: [],
    [RequestStatus.CANCELLED]: [],
  };

  return validTransitions[currentStatus].includes(targetStatus);
}
