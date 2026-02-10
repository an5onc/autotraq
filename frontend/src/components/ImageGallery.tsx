import { useState, useRef } from 'react';
import { api, PartImage } from '../api/client';
import { Camera, Star, Trash2, Upload, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageGalleryProps {
  partId: number;
  images: PartImage[];
  canEdit: boolean;
  onImagesChange: () => void;
}

export function ImageGallery({ partId, images, canEdit, onImagesChange }: ImageGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let success = 0;
    let failed = 0;

    for (const file of Array.from(files)) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: Not an image file`);
        failed++;
        continue;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: File too large (max 5MB)`);
        failed++;
        continue;
      }

      try {
        await api.uploadPartImage(partId, file);
        success++;
      } catch (err) {
        toast.error(`${file.name}: ${err instanceof Error ? err.message : 'Upload failed'}`);
        failed++;
      }
    }

    setUploading(false);
    e.target.value = ''; // Reset input

    if (success > 0) {
      toast.success(`Uploaded ${success} image${success > 1 ? 's' : ''}`);
      onImagesChange();
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      await api.setImagePrimary(imageId);
      toast.success('Primary image updated');
      onImagesChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set primary');
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.deleteImage(imageId);
      toast.success('Image deleted');
      onImagesChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const lightboxIndex = lightboxImage !== null ? images.findIndex(img => img.id === lightboxImage) : -1;

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIndex === -1) return;
    const newIndex = direction === 'prev' 
      ? (lightboxIndex - 1 + images.length) % images.length
      : (lightboxIndex + 1) % images.length;
    setLightboxImage(images[newIndex].id);
  };

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-slate-800/50 border border-slate-700 border-dashed rounded-xl">
          <Camera className="w-12 h-12 text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">No images yet</p>
          {canEdit && (
            <p className="text-slate-600 text-xs mt-1">Upload photos to showcase this part</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
            >
              <img
                src={api.getImageUrl(image.id)}
                alt={image.filename}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setLightboxImage(image.id)}
              />
              
              {/* Primary badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-amber-500 text-slate-900 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Star className="w-3 h-3" /> Primary
                </div>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => setLightboxImage(image.id)}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  title="View full size"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                {canEdit && !image.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(image.id)}
                    className="p-2 bg-amber-500/80 hover:bg-amber-500 rounded-full transition-colors"
                    title="Set as primary"
                  >
                    <Star className="w-5 h-5 text-slate-900" />
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canEdit && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Images'}
          </button>
        </>
      )}

      {/* Lightbox */}
      {lightboxImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }}
                className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }}
                className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={api.getImageUrl(lightboxImage)}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
