import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as inventoryService from '../services/inventory.service.js';
import {
  ReceiveStockInput,
  CorrectStockInput,
  ReturnStockInput,
  OnHandQuery,
  EventsQuery,
  CreateLocationInput,
} from '../schemas/inventory.schema.js';
import { success, created, validationError, notFound, serverError } from '../utils/response.js';

export async function createLocation(req: AuthenticatedRequest, res: Response) {
  try {
    const input: CreateLocationInput = req.body;
    const location = await inventoryService.createLocation(input);
    created(res, location);
  } catch (err) {
    if (err instanceof Error && err.message === 'Location already exists') {
      validationError(res, err.message, { name: 'Location name is already in use' });
      return;
    }
    console.error('Create location error:', err);
    serverError(res);
  }
}

export async function getLocations(req: AuthenticatedRequest, res: Response) {
  try {
    const locations = await inventoryService.getLocations();
    success(res, locations);
  } catch (err) {
    console.error('Get locations error:', err);
    serverError(res);
  }
}

export async function receiveStock(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      validationError(res, 'User not authenticated');
      return;
    }
    const input: ReceiveStockInput = req.body;
    const event = await inventoryService.receiveStock(input, req.user.userId);
    created(res, event);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Part not found' || err.message === 'Location not found') {
        notFound(res, err.message);
        return;
      }
    }
    console.error('Receive stock error:', err);
    serverError(res);
  }
}

export async function correctStock(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      validationError(res, 'User not authenticated');
      return;
    }
    const input: CorrectStockInput = req.body;
    const event = await inventoryService.correctStock(input, req.user.userId);
    created(res, event);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Part not found' || err.message === 'Location not found') {
        notFound(res, err.message);
        return;
      }
      if (err.message.includes('Cannot correct')) {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Correct stock error:', err);
    serverError(res);
  }
}

export async function returnStock(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      validationError(res, 'User not authenticated');
      return;
    }
    const input: ReturnStockInput = req.body;
    const event = await inventoryService.returnStock(input, req.user.userId);
    created(res, event);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Part not found' || err.message === 'Location not found') {
        notFound(res, err.message);
        return;
      }
    }
    console.error('Return stock error:', err);
    serverError(res);
  }
}

export async function getOnHand(req: AuthenticatedRequest, res: Response) {
  try {
    const query: OnHandQuery = req.query as unknown as OnHandQuery;
    const onHand = await inventoryService.getOnHand(query);
    success(res, onHand);
  } catch (err) {
    console.error('Get on-hand error:', err);
    serverError(res);
  }
}

export async function getEvents(req: AuthenticatedRequest, res: Response) {
  try {
    const query: EventsQuery = req.query as unknown as EventsQuery;
    const result = await inventoryService.getEvents(query);
    success(res, result);
  } catch (err) {
    console.error('Get events error:', err);
    serverError(res);
  }
}
