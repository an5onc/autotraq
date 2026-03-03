import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as requestsService from '../services/requests.service.js';
import { CreateRequestInput, RequestsQuery } from '../schemas/requests.schema.js';
import { success, created, validationError, notFound, serverError } from '../utils/response.js';

export async function createRequest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      validationError(res, 'User not authenticated');
      return;
    }
    const input: CreateRequestInput = req.body;
    const request = await requestsService.createRequest(input, req.user.userId);
    created(res, request);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Part with ID')) {
      notFound(res, err.message);
      return;
    }
    console.error('Create request error:', err);
    serverError(res);
  }
}

export async function getRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const query: RequestsQuery = req.query as unknown as RequestsQuery;
    const result = await requestsService.getRequests(query);
    success(res, result);
  } catch (err) {
    console.error('Get requests error:', err);
    serverError(res);
  }
}

export async function getRequestById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const request = await requestsService.getRequestById(id);
    success(res, request);
  } catch (err) {
    if (err instanceof Error && err.message === 'Request not found') {
      notFound(res, err.message);
      return;
    }
    console.error('Get request error:', err);
    serverError(res);
  }
}

export async function approveRequest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      validationError(res, 'User not authenticated');
      return;
    }
    const id = parseInt(req.params.id, 10);
    const request = await requestsService.approveRequest(id, req.user.userId);
    success(res, request);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Request not found') {
        notFound(res, err.message);
        return;
      }
      if (err.message.includes('Cannot approve')) {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Approve request error:', err);
    serverError(res);
  }
}

export async function fulfillRequest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      validationError(res, 'User not authenticated');
      return;
    }
    const id = parseInt(req.params.id, 10);
    const request = await requestsService.fulfillRequest(id, req.user.userId);
    success(res, request);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Request not found') {
        notFound(res, err.message);
        return;
      }
      if (err.message.includes('Cannot fulfill') || err.message.includes('Insufficient stock')) {
        validationError(res, err.message);
        return;
      }
      if (err.message.includes('does not have a location')) {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Fulfill request error:', err);
    serverError(res);
  }
}

export async function cancelRequest(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      validationError(res, 'User not authenticated');
      return;
    }
    const id = parseInt(req.params.id, 10);
    const request = await requestsService.cancelRequest(id, req.user.userId);
    success(res, request);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Request not found') {
        notFound(res, err.message);
        return;
      }
      if (err.message.includes('Cannot cancel') || err.message.includes('already cancelled')) {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Cancel request error:', err);
    serverError(res);
  }
}

// POST /api/requests/scan-fulfill
// Given a scanned SKU, finds the oldest approved request containing that part and fulfills it
export async function scanFulfill(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) { validationError(res, 'User not authenticated'); return; }
    const { sku } = req.body;
    if (!sku) { validationError(res, 'SKU is required'); return; }

    const result = await requestsService.scanFulfill(sku, req.user.userId);
    if (!result) {
      notFound(res, `No approved requests found containing part SKU: ${sku}`);
      return;
    }
    success(res, result);
  } catch (err) {
    if (err instanceof Error) {
      validationError(res, err.message);
      return;
    }
    serverError(res);
  }
}
