import imageCompression from 'browser-image-compression';

/**
 * Compresses and converts an image to WebP format
 * @param file - The image file to compress and convert
 * @param options - Compression options
 * @returns Promise<File> - The compressed WebP file
 */
export const compressAndConvertToWebP = async (
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  }
): Promise<File> => {
  // If not an image, return as is
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 1920,
    quality = 0.85
  } = options || {};

  // First, compress the image using browser-image-compression
  const compressionOptions = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    initialQuality: 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);

    // Check if browser supports WebP
    const canvas = document.createElement('canvas');
    const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

    if (!supportsWebP) {
      // Browser doesn't support WebP, return compressed file as fallback
      console.warn('WebP not supported, using compressed original format');
      return compressedFile;
    }

    // Convert to WebP using Canvas API
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        ctx?.drawImage(img, 0, 0);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new File with .webp extension
              const webpFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, '') + '.webp',
                {
                  type: 'image/webp',
                  lastModified: Date.now()
                }
              );
              resolve(webpFile);
            } else {
              // Fallback to compressed file if WebP conversion fails
              console.warn('WebP conversion failed, using compressed original format');
              resolve(compressedFile);
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        // Fallback to compressed file if image load fails
        console.warn('Image load failed, using compressed original format');
        resolve(compressedFile);
      };

      // Load the compressed image
      const reader = new FileReader();
      reader.onloadend = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        // Fallback to compressed file if read fails
        console.warn('File read failed, using compressed original format');
        resolve(compressedFile);
      };
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    // If compression fails, throw error
    throw new Error(`Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Compresses multiple images to WebP format
 * @param files - Array of image files to compress
 * @param options - Compression options
 * @returns Promise<File[]> - Array of compressed WebP files
 */
export const compressMultipleImagesToWebP = async (
  files: File[],
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
  }
): Promise<File[]> => {
  const results = await Promise.allSettled(
    files.map(file => compressAndConvertToWebP(file, options))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<File> => result.status === 'fulfilled')
    .map(result => result.value);
};

