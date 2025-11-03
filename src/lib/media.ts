import { database } from './database';

export const ACCEPTABLE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
] as const;

// Aspect ratio options for image generation - mapped to Runway SDK ratios
export const IMAGE_ASPECT_RATIOS = [
  { id: '720:1280', label: '9:16', description: 'Portrait (TikTok, Stories)', runwayRatio: '720:1280' },
  { id: '1280:720', label: '16:9', description: 'Landscape (YouTube, Web)', runwayRatio: '1280:720' },
  { id: '1024:1024', label: '1:1', description: 'Square (Instagram Feed)', runwayRatio: '1024:1024' },
  { id: '1920:1080', label: '16:9 (HD)', description: 'Full HD Landscape', runwayRatio: '1920:1080' },
  { id: '1080:1920', label: '9:16 (HD)', description: 'Full HD Portrait', runwayRatio: '1080:1920' },
] as const;

// Aspect ratio options for video generation
export const VIDEO_ASPECT_RATIOS = [
  { id: '9:16', label: '9:16', description: 'Portrait (TikTok, Stories)' },
  { id: '16:9', label: '16:9', description: 'Landscape (YouTube, Web)' },
  { id: '1:1', label: '1:1', description: 'Square (Instagram Feed)' },
  { id: '4:5', label: '4:5', description: 'Portrait (Instagram)' },
] as const;

// Scene types for video generation
export const VIDEO_SCENE_TYPES = [
  { id: 'product-showcase', label: 'Product Showcase', description: 'Highlight features and details' },
  { id: 'lifestyle', label: 'Lifestyle', description: 'Show product in real-life context' },
  { id: 'story-driven', label: 'Story-Driven', description: 'Narrative-focused presentation' },
  { id: 'comparison', label: 'Comparison', description: 'Before/after or side-by-side' },
] as const;

// Camera movements for video generation
export const VIDEO_CAMERA_MOVEMENTS = [
  { id: 'dynamic', label: 'Dynamic', description: 'AI-driven intelligent movement' },
  { id: 'static', label: 'Static', description: 'No camera movement' },
  { id: 'zoom-in', label: 'Zoom In', description: 'Gradual zoom toward subject' },
  { id: 'zoom-out', label: 'Zoom Out', description: 'Gradual zoom away from subject' },
  { id: 'pan-left', label: 'Pan Left', description: 'Horizontal movement to the left' },
  { id: 'pan-right', label: 'Pan Right', description: 'Horizontal movement to the right' },
  { id: 'rotate-left', label: 'Rotate Left', description: 'Clockwise rotation around subject' },
  { id: 'rotate-right', label: 'Rotate Right', description: 'Counter-clockwise rotation around subject' },
] as const;

export function getAssetUrl(storagePath: string): string {
  return database.storage.getPublicUrl('user-uploads', storagePath);
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function isAcceptableImageFile(file: File): boolean {
  return (ACCEPTABLE_IMAGE_TYPES as readonly string[]).includes(file.type);
}

/**
 * Build enhanced prompt for image generation with product details
 */
export function buildEnhancedImagePrompt(productName: string): string {
  const cleanProductName = productName.trim();
  return `keep the ${cleanProductName} exactly the same. turn it into a studio quality photo, with excellent lighting, contrasting background and realistic placement`;
}

/**
 * Build enhanced prompt for video generation with camera movement details
 */
export function buildEnhancedVideoPrompt(userPrompt: string, cameraMovement: string): string {
  let enhancedPrompt = userPrompt.trim();

  // Add camera movement specific instructions
  switch (cameraMovement) {
    case 'static':
      enhancedPrompt += '. Keep the camera completely still and static throughout the video.';
      break;
    case 'zoom-in':
      enhancedPrompt += '. Use a gradual zoom-in effect that brings the viewer closer to the product details.';
      break;
    case 'zoom-out':
      enhancedPrompt += '. Use a gradual zoom-out effect that shows the product in its environment.';
      break;
    case 'pan-left':
      enhancedPrompt += '. Use a smooth leftward panning motion across the product.';
      break;
    case 'pan-right':
      enhancedPrompt += '. Use a smooth rightward panning motion across the product.';
      break;
    case 'rotate-left':
      enhancedPrompt += '. Use a clockwise rotation around the product, showing it from different angles.';
      break;
    case 'rotate-right':
      enhancedPrompt += '. Use a counter-clockwise rotation around the product, showing it from different angles.';
      break;
    case 'dynamic':
      enhancedPrompt += '. Use dynamic, intelligent camera movements that highlight the product effectively.';
      break;
    default:
      break;
  }

  return enhancedPrompt;
}
