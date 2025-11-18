import { MediaAsset, EditedImage, GeneratedVideo } from '../types';

/**
 * Type guard functions for identifying different types of media objects
 * Used to safely distinguish between MediaAsset, EditedImage, and GeneratedVideo
 */

// Type guard functions using unique property combinations
export function isMediaAsset(item: unknown): item is MediaAsset {
  return (
    typeof item === 'object' &&
    item !== null &&
    'file_type' in item &&      // Only MediaAsset has file_type
    !('prompt' in item) &&      // MediaAsset doesn't have prompt (unlike EditedImage)
    !('status' in item)         // MediaAsset doesn't have status (unlike GeneratedVideo)
  );
}

export function isEditedImage(item: unknown): item is EditedImage {
  return (
    typeof item === 'object' &&
    item !== null &&
    'prompt' in item         // Only EditedImage has prompt
  );
}

export function isGeneratedVideo(item: unknown): item is GeneratedVideo {
  return (
    typeof item === 'object' &&
    item !== null &&
    'status' in item        // GeneratedVideo doesn't have prompt (unlike EditedImage)
  );
}
