import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import * as imagesService from '../services/images.service.js';
import * as auditService from '../services/audit.service.js';
import { success, created, notFound, validationError, serverError } from '../utils/response.js';

/**
 * POST /api/parts/:partId/images - Upload image
 */
export async function uploadImage(req: AuthenticatedRequest, res: Response) {
  try {
    const partId = parseInt(req.params.partId);
    const { filename, mimeType, data, isPrimary } = req.body;

    if (!filename || !mimeType || !data) {
      validationError(res, 'Missing required fields: filename, mimeType, data');
      return;
    }

    const image = await imagesService.uploadImage({
      partId,
      filename,
      mimeType,
      data,
      isPrimary,
    });

    // Audit log
    if (req.user) {
      auditService.log({
        action: auditService.AuditActions.CREATE,
        entityType: 'PartImage',
        entityId: image.id,
        entityName: `${filename} (Part #${partId})`,
        userId: req.user.userId,
        userName: req.user.name,
        details: { filename, mimeType, isPrimary: image.isPrimary },
        ipAddress: req.ip,
      });
    }

    created(res, {
      id: image.id,
      filename: image.filename,
      mimeType: image.mimeType,
      isPrimary: image.isPrimary,
      createdAt: image.createdAt,
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Invalid image type') || err.message.includes('too large') || err.message === 'Part not found')) {
      validationError(res, err.message);
      return;
    }
    console.error('Upload image error:', err);
    serverError(res);
  }
}

/**
 * GET /api/parts/:partId/images - List images for a part
 */
export async function getPartImages(req: AuthenticatedRequest, res: Response) {
  try {
    const partId = parseInt(req.params.partId);
    const images = await imagesService.getPartImages(partId);
    success(res, images);
  } catch (err) {
    console.error('Get part images error:', err);
    serverError(res);
  }
}

/**
 * GET /api/images/:imageId - Get single image with data
 */
export async function getImage(req: AuthenticatedRequest, res: Response) {
  try {
    const imageId = parseInt(req.params.imageId);
    const image = await imagesService.getImage(imageId);
    
    if (!image) {
      notFound(res, 'Image not found');
      return;
    }

    success(res, image);
  } catch (err) {
    console.error('Get image error:', err);
    serverError(res);
  }
}

/**
 * GET /api/images/:imageId/raw - Get image as binary (for img src)
 */
export async function getImageRaw(req: AuthenticatedRequest, res: Response) {
  try {
    const imageId = parseInt(req.params.imageId);
    const image = await imagesService.getImage(imageId);
    
    if (!image) {
      notFound(res, 'Image not found');
      return;
    }

    // Decode base64 and send as binary
    const buffer = Buffer.from(image.data, 'base64');
    res.set('Content-Type', image.mimeType);
    res.set('Content-Length', buffer.length.toString());
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24h
    res.send(buffer);
  } catch (err) {
    console.error('Get image raw error:', err);
    serverError(res);
  }
}

/**
 * PATCH /api/images/:imageId/primary - Set as primary image
 */
export async function setPrimaryImage(req: AuthenticatedRequest, res: Response) {
  try {
    const imageId = parseInt(req.params.imageId);
    const image = await imagesService.setPrimaryImage(imageId);

    if (req.user) {
      auditService.log({
        action: auditService.AuditActions.UPDATE,
        entityType: 'PartImage',
        entityId: image.id,
        entityName: `${image.filename} (Part #${image.partId})`,
        userId: req.user.userId,
        userName: req.user.name,
        details: { action: 'set_primary' },
        ipAddress: req.ip,
      });
    }

    success(res, { id: image.id, isPrimary: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Image not found') {
      notFound(res, err.message);
      return;
    }
    console.error('Set primary image error:', err);
    serverError(res);
  }
}

/**
 * DELETE /api/images/:imageId - Delete image
 */
export async function deleteImage(req: AuthenticatedRequest, res: Response) {
  try {
    const imageId = parseInt(req.params.imageId);
    
    // Get image info before delete for audit
    const image = await imagesService.getImage(imageId);
    if (!image) {
      notFound(res, 'Image not found');
      return;
    }

    await imagesService.deleteImage(imageId);

    if (req.user) {
      auditService.log({
        action: auditService.AuditActions.DELETE,
        entityType: 'PartImage',
        entityId: imageId,
        entityName: `${image.filename} (Part #${image.partId})`,
        userId: req.user.userId,
        userName: req.user.name,
        ipAddress: req.ip,
      });
    }

    success(res, { deleted: true });
  } catch (err) {
    console.error('Delete image error:', err);
    serverError(res);
  }
}
