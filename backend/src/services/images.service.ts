import prisma from '../repositories/prisma.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadImageInput {
  partId: number;
  filename: string;
  mimeType: string;
  data: string; // Base64 encoded
  isPrimary?: boolean;
}

/**
 * Upload an image for a part
 */
export async function uploadImage(input: UploadImageInput) {
  // Validate mime type
  if (!ALLOWED_TYPES.includes(input.mimeType)) {
    throw new Error(`Invalid image type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
  }

  // Validate size (base64 is ~33% larger than binary)
  const estimatedSize = (input.data.length * 3) / 4;
  if (estimatedSize > MAX_IMAGE_SIZE) {
    throw new Error(`Image too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`);
  }

  // Verify part exists
  const part = await prisma.part.findUnique({ where: { id: input.partId } });
  if (!part) {
    throw new Error('Part not found');
  }

  // If this is primary, unset other primary images
  if (input.isPrimary) {
    await prisma.partImage.updateMany({
      where: { partId: input.partId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  // If no images exist yet, make this primary by default
  const existingCount = await prisma.partImage.count({ where: { partId: input.partId } });
  const shouldBePrimary = input.isPrimary || existingCount === 0;

  return prisma.partImage.create({
    data: {
      partId: input.partId,
      filename: input.filename,
      mimeType: input.mimeType,
      data: input.data,
      isPrimary: shouldBePrimary,
    },
  });
}

/**
 * Get all images for a part
 */
export async function getPartImages(partId: number) {
  return prisma.partImage.findMany({
    where: { partId },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      filename: true,
      mimeType: true,
      isPrimary: true,
      createdAt: true,
      // Exclude data for list view (too large)
    },
  });
}

/**
 * Get a single image with full data
 */
export async function getImage(imageId: number) {
  return prisma.partImage.findUnique({
    where: { id: imageId },
  });
}

/**
 * Get primary image for a part (thumbnail)
 */
export async function getPrimaryImage(partId: number) {
  return prisma.partImage.findFirst({
    where: { partId, isPrimary: true },
  });
}

/**
 * Set an image as primary
 */
export async function setPrimaryImage(imageId: number) {
  const image = await prisma.partImage.findUnique({ where: { id: imageId } });
  if (!image) {
    throw new Error('Image not found');
  }

  // Unset other primary images for this part
  await prisma.partImage.updateMany({
    where: { partId: image.partId, isPrimary: true },
    data: { isPrimary: false },
  });

  // Set this one as primary
  return prisma.partImage.update({
    where: { id: imageId },
    data: { isPrimary: true },
  });
}

/**
 * Get primary images for multiple parts (for list view thumbnails)
 */
export async function getPrimaryImages(partIds: number[]) {
  if (partIds.length === 0) return [];
  
  const images = await prisma.partImage.findMany({
    where: {
      partId: { in: partIds },
      isPrimary: true,
    },
    select: {
      id: true,
      partId: true,
      filename: true,
      mimeType: true,
    },
  });
  
  return images;
}

/**
 * Delete an image
 */
export async function deleteImage(imageId: number) {
  const image = await prisma.partImage.findUnique({ where: { id: imageId } });
  if (!image) {
    throw new Error('Image not found');
  }

  await prisma.partImage.delete({ where: { id: imageId } });

  // If we deleted the primary image, set another as primary
  if (image.isPrimary) {
    const nextImage = await prisma.partImage.findFirst({
      where: { partId: image.partId },
      orderBy: { createdAt: 'asc' },
    });
    if (nextImage) {
      await prisma.partImage.update({
        where: { id: nextImage.id },
        data: { isPrimary: true },
      });
    }
  }

  return { deleted: true };
}
