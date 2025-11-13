import React from 'react';
import { X, Plus } from 'lucide-react';

interface ImagePreviewProps {
  images: File[];
  onRemoveImage: (index: number) => void;
  onAddMore?: () => void;
  maxImages?: number;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  onRemoveImage,
  onAddMore,
  maxImages = 3,
}) => {
  const [previews, setPreviews] = React.useState<string[]>([]);

  // Generate preview URLs from files
  React.useEffect(() => {
    const newPreviews: string[] = [];

    images.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === images.length) {
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Cleanup URLs on unmount
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [images]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {images.length} / {maxImages} {images.length === 1 ? 'imagem' : 'imagens'}
        </p>
        {images.length < maxImages && onAddMore && (
          <button
            type="button"
            onClick={onAddMore}
            className="flex items-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar mais
          </button>
        )}
      </div>

      {/* Grid of images */}
      <div className="grid grid-cols-3 gap-3">
        {previews.map((preview, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group"
          >
            {/* Image */}
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemoveImage(index)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              aria-label={`Remover imagem ${index + 1}`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Image number badge */}
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Help text */}
      {images.length > 1 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          As imagens serão combinadas para criar uma música única conectando todas as cenas.
        </p>
      )}
    </div>
  );
};
