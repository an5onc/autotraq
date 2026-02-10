import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as partsService from '../services/parts.service.js';
import * as auditService from '../services/audit.service.js';
import { CreatePartInput, UpdatePartInput, AddFitmentInput, PartsQuery } from '../schemas/parts.schema.js';
import { success, created, validationError, notFound, serverError } from '../utils/response.js';

export async function createPart(req: AuthenticatedRequest, res: Response) {
  try {
    const input: CreatePartInput = req.body;
    const part = await partsService.createPart(input);
    
    // Audit log
    if (req.user) {
      auditService.log({
        action: auditService.AuditActions.CREATE,
        entityType: 'Part',
        entityId: part.id,
        entityName: `${part.sku} - ${part.name}`,
        userId: req.user.userId,
        userName: req.user.name,
        details: { sku: part.sku, name: part.name, condition: part.condition },
        ipAddress: req.ip,
      });
    }
    
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

export async function updatePart(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const input: UpdatePartInput = req.body;
    const part = await partsService.updatePart(id, input);
    
    // Audit log
    if (req.user) {
      auditService.log({
        action: auditService.AuditActions.UPDATE,
        entityType: 'Part',
        entityId: part.id,
        entityName: `${part.sku} - ${part.name}`,
        userId: req.user.userId,
        userName: req.user.name,
        details: { changes: input },
        ipAddress: req.ip,
      });
    }
    
    success(res, part);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Part not found') { notFound(res, err.message); return; }
      if (err.message === 'SKU already exists') { validationError(res, err.message, { sku: 'SKU is already in use' }); return; }
    }
    console.error('Update part error:', err);
    serverError(res);
  }
}

export async function deletePart(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    // Get part info before deletion for audit
    const part = await partsService.getPartById(id);
    await partsService.deletePart(id);
    
    // Audit log
    if (req.user) {
      auditService.log({
        action: auditService.AuditActions.DELETE,
        entityType: 'Part',
        entityId: id,
        entityName: `${part.sku} - ${part.name}`,
        userId: req.user.userId,
        userName: req.user.name,
        details: { sku: part.sku, name: part.name },
        ipAddress: req.ip,
      });
    }
    
    success(res, { message: 'Part deleted' });
  } catch (err) {
    if (err instanceof Error && err.message === 'Part not found') { notFound(res, err.message); return; }
    console.error('Delete part error:', err);
    serverError(res);
  }
}

export async function generatePartBarcode(req: AuthenticatedRequest, res: Response) {
  try {
    const id = parseInt(req.params.id, 10);
    const part = await partsService.generatePartBarcode(id);
    success(res, part);
  } catch (err) {
    if (err instanceof Error && err.message === 'Part not found') { notFound(res, err.message); return; }
    console.error('Generate barcode error:', err);
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
