import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as partsService from '../services/parts.service.js';
import { CreatePartInput, AddFitmentInput, PartsQuery } from '../schemas/parts.schema.js';
import { success, created, validationError, notFound, serverError } from '../utils/response.js';

export async function createPart(req: AuthenticatedRequest, res: Response) {
  try {
    const input: CreatePartInput = req.body;
    const part = await partsService.createPart(input);
    created(res, part);
  } catch (err) {
    if (err instanceof Error && err.message === 'SKU already exists') {
      validationError(res, err.message, { sku: 'SKU is already in use' });
      return;
    }
    console.error('Create part error:', err);
    serverError(res);
  }
}

export async function getParts(req: AuthenticatedRequest, res: Response) {
  try {
    const query: PartsQuery = req.query as unknown as PartsQuery;
    const result = await partsService.getParts(query);
    success(res, result);
  } catch (err) {
    console.error('Get parts error:', err);
    serverError(res);
  }
}

export async function getPartById(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const part = await partsService.getPartById(id);
    success(res, part);
  } catch (err) {
    if (err instanceof Error && err.message === 'Part not found') {
      notFound(res, err.message);
      return;
    }
    console.error('Get part error:', err);
    serverError(res);
  }
}

export async function addFitment(req: AuthenticatedRequest, res: Response) {
  try {
    const partId = parseInt(req.params.id, 10);
    const input: AddFitmentInput = req.body;
    const fitment = await partsService.addFitment(partId, input.vehicleId);
    created(res, fitment);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Part not found' || err.message === 'Vehicle not found') {
        notFound(res, err.message);
        return;
      }
      if (err.message === 'Fitment already exists') {
        validationError(res, err.message);
        return;
      }
    }
    console.error('Add fitment error:', err);
    serverError(res);
  }
}

export async function removeFitment(req: AuthenticatedRequest, res: Response) {
  try {
    const partId = parseInt(req.params.id, 10);
    const vehicleId = parseInt(req.params.vehicleId, 10);
    await partsService.removeFitment(partId, vehicleId);
    success(res, { message: 'Fitment removed' });
  } catch (err) {
    if (err instanceof Error && err.message === 'Fitment not found') {
      notFound(res, err.message);
      return;
    }
    console.error('Remove fitment error:', err);
    serverError(res);
  }
}
