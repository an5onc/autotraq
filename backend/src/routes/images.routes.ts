import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireManager } from '../middleware/auth.middleware.js';
import { validateParams } from '../middleware/validation.middleware.js';
import * as imagesController from '../controllers/images.controller.js';

const imageIdParamSchema = z.object({
  imageId: z.coerce.number().int().positive('Image ID must be a positive integer'),
});

const router = Router();

// Part-scoped routes (under /api/parts/:partId/images)
export const partImagesRouter = Router({ mergeParams: true });

// GET /api/parts/:partId/images - List images (all authenticated users)
partImagesRouter.get('/', authenticate, imagesController.getPartImages);

// POST /api/parts/:partId/images - Upload image (manager+)
partImagesRouter.post('/', authenticate, requireManager, imagesController.uploadImage);

// Image-scoped routes (under /api/images)
// POST /api/images/primary-bulk - Get primary images for multiple parts (for thumbnails)
router.post('/primary-bulk', authenticate, imagesController.getPrimaryImages);

// GET /api/images/:imageId - Get image metadata + data
router.get('/:imageId', authenticate, validateParams(imageIdParamSchema), imagesController.getImage);

// GET /api/images/:imageId/raw - Get raw binary image (for img src)
router.get('/:imageId/raw', validateParams(imageIdParamSchema), imagesController.getImageRaw); // No auth for caching

// PATCH /api/images/:imageId/primary - Set as primary (manager+)
router.patch('/:imageId/primary', authenticate, requireManager, validateParams(imageIdParamSchema), imagesController.setPrimaryImage);

// DELETE /api/images/:imageId - Delete image (manager+)
router.delete('/:imageId', authenticate, requireManager, validateParams(imageIdParamSchema), imagesController.deleteImage);

export default router;
