import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAudioUrl } from '@/services/api';

interface Caption {
  index: number;
  caption: string;
  moods?: string[];
}

interface ImageCarouselProps {
  /**
   * Image paths - can be a single string or array of strings
   */
  images: string | string[] | null | undefined;

  /**
   * Captions for each image (optional)
   */
  captions?: Caption[] | null;

  /**
   * Alt text for the images
   */
  alt?: string;

  /**
   * Optional className for custom styling
   */
  className?: string;

  /**
   * Show navigation arrows (default: true if multiple images)
   */
  showArrows?: boolean;

  /**
   * Show dot indicators (default: true if multiple images)
   */
  showIndicators?: boolean;

  /**
   * Show captions overlay (default: true if captions provided)
   */
  showCaptions?: boolean;

  /**
   * Auto-play carousel (default: false)
   */
  autoPlay?: boolean;

  /**
   * Auto-play interval in milliseconds (default: 3000)
   */
  autoPlayInterval?: number;
}

/**
 * ImageCarousel component for displaying single or multiple images
 * with navigation arrows and dot indicators
 */
export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  captions,
  alt = 'Music cover',
  className,
  showArrows,
  showIndicators,
  showCaptions,
  autoPlay = false,
  autoPlayInterval = 3000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // DIAGNOSTIC LOGS
  console.log('[ImageCarousel] Received props:', {
    images,
    imagesType: typeof images,
    imagesIsArray: Array.isArray(images),
    imagesLength: Array.isArray(images) ? images.length : 'N/A',
    captions,
    captionsLength: captions?.length || 0,
    showCaptions,
  });

  // Normalize images to array
  const imageArray = React.useMemo(() => {
    if (!images) {
      console.log('[ImageCarousel] No images provided, using placeholder');
      return ['/placeholder-cover.png']; // Default placeholder
    }
    if (typeof images === 'string') {
      console.log('[ImageCarousel] Single image string:', images);
      return [images];
    }
    if (Array.isArray(images) && images.length > 0) {
      console.log('[ImageCarousel] Image array:', images);
      return images;
    }
    return ['/placeholder-cover.png'];
  }, [images]);

  const hasMultipleImages = imageArray.length > 1;
  const shouldShowArrows = showArrows ?? hasMultipleImages;
  const shouldShowIndicators = showIndicators ?? hasMultipleImages;
  const shouldShowCaptions = showCaptions ?? (captions && captions.length > 0);

  // Get caption for current image
  const currentCaption = React.useMemo(() => {
    if (!captions || !shouldShowCaptions) return null;
    return captions.find(c => c.index === currentIndex);
  }, [captions, currentIndex, shouldShowCaptions]);

  // Auto-play effect
  React.useEffect(() => {
    if (!autoPlay || !hasMultipleImages) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageArray.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, hasMultipleImages, imageArray.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + imageArray.length) % imageArray.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % imageArray.length);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Get full URL for image (ALWAYS use backend URL like dashboard does)
  const getImageUrl = (path: string) => {
    // Only skip if it's already a complete HTTP/HTTPS URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
      console.log('[ImageCarousel] Using complete URL:', path);
      return path;
    }
    // For all other paths (including those starting with /), build full backend URL
    const fullUrl = getAudioUrl(path);
    console.log('[ImageCarousel] Built backend URL:', fullUrl, 'from path:', path);
    return fullUrl;
  };

  // Error handler for image loading
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    console.error('[ImageCarousel] ❌ Failed to load image:', {
      src: img.src,
      originalPath: imageArray[currentIndex],
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      error: e,
    });
  };

  // Success handler for image loading
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    console.log('[ImageCarousel] ✅ Image loaded successfully:', {
      src: img.src,
      originalPath: imageArray[currentIndex],
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    });
  };

  // Log current URL being rendered
  const currentImageUrl = getImageUrl(imageArray[currentIndex]);
  console.log('[ImageCarousel] Rendering image:', {
    currentIndex,
    totalImages: imageArray.length,
    path: imageArray[currentIndex],
    fullUrl: currentImageUrl,
  });

  return (
    <div className={cn("relative w-full h-full overflow-hidden rounded-lg group", className)}>
      {/* Main Image */}
      <div className="relative w-full h-full">
        <img
          src={currentImageUrl}
          alt={`${alt} ${hasMultipleImages ? `(${currentIndex + 1}/${imageArray.length})` : ''}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />

        {/* Image count badge (top-right) */}
        {hasMultipleImages && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1}/{imageArray.length}
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      {shouldShowArrows && hasMultipleImages && (
        <>
          {/* Left Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2",
              "bg-black/50 hover:bg-black/70 text-white rounded-full p-2",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
            )}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2",
              "bg-black/50 hover:bg-black/70 text-white rounded-full p-2",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
            )}
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {shouldShowIndicators && hasMultipleImages && (
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 flex gap-2",
          shouldShowCaptions && currentCaption ? "bottom-20" : "bottom-3"
        )}>
          {imageArray.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToIndex(index);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                currentIndex === index
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/70"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Caption Overlay */}
      {shouldShowCaptions && currentCaption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 pt-8">
          <p className="text-white text-sm font-medium line-clamp-2">
            {currentCaption.caption}
          </p>
          {currentCaption.moods && currentCaption.moods.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {currentCaption.moods.map((mood, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm"
                >
                  {mood}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
