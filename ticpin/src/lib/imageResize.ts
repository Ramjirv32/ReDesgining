// Image resizing utility functions for browser
export interface ImageDimensions {
    width: number;
    height: number;
}

// Target dimensions for different categories
export const IMAGE_DIMENSIONS: Record<string, ImageDimensions> = {
    // Dining
    'dining_portrait': { width: 900, height: 1200 },
    'dining_landscape': { width: 1600, height: 900 },
    // Events
    'events_portrait': { width: 900, height: 1200 },
    'events_landscape': { width: 1600, height: 900 },
    // Play
    'play_portrait': { width: 900, height: 1200 },
    'play_landscape': { width: 1600, height: 900 },
    'play_secondary_banner': { width: 1600, height: 900 }
};

/**
 * Resize image to target dimensions using Canvas API
 */
export async function resizeImage(
    file: File,
    targetDimensions: ImageDimensions
): Promise<File> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = targetDimensions.width;
            canvas.height = targetDimensions.height;

            if (ctx) {
                // Calculate aspect ratios
                const imgAspect = img.width / img.height;
                const targetAspect = targetDimensions.width / targetDimensions.height;

                let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

                if (imgAspect > targetAspect) {
                    // Image is wider than target, fit to height
                    drawHeight = targetDimensions.height;
                    drawWidth = drawHeight * imgAspect;
                    drawX = (targetDimensions.width - drawWidth) / 2;
                    drawY = 0;
                } else {
                    // Image is taller than target, fit to width
                    drawWidth = targetDimensions.width;
                    drawHeight = drawWidth / imgAspect;
                    drawX = 0;
                    drawY = (targetDimensions.height - drawHeight) / 2;
                }

                // Draw and crop image
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        const resizedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(resizedFile);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                }, 'image/jpeg', 0.8);
            } else {
                reject(new Error('Failed to get canvas context'));
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Resize image if it doesn't match target dimensions
 */
export async function autoResizeImage(
    file: File,
    targetDimensions: ImageDimensions
): Promise<File> {
    try {
        const currentDimensions = await getImageDimensions(file);
        const isPortrait = currentDimensions.height > currentDimensions.width;
        const targetIsPortrait = targetDimensions.height > targetDimensions.width;
        
        // Check if resizing is needed
        if (
            (isPortrait && targetIsPortrait && currentDimensions.width !== targetDimensions.width) ||
            (!isPortrait && !targetIsPortrait && currentDimensions.width !== targetDimensions.width) ||
            (isPortrait && !targetIsPortrait) ||
            (!isPortrait && targetIsPortrait) ||
            currentDimensions.height !== targetDimensions.height ||
            currentDimensions.width !== targetDimensions.width
        ) {
            console.log(`Resizing image from ${currentDimensions.width}x${currentDimensions.height} to ${targetDimensions.width}x${targetDimensions.height}`);
            return await resizeImage(file, targetDimensions);
        }
        
        return file;
    } catch (error) {
        console.error('Error getting image dimensions:', error);
        return file;
    }
}
