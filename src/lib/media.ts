import { database } from './database';

export const ACCEPTABLE_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
] as const;

// Aspect ratio options for image generation - mapped to Runway SDK ratios
export const IMAGE_ASPECT_RATIOS = [
  { id: '1280:720', label: '16:9', description: 'Landscape (YouTube, Web)', runwayRatio: '1280:720' },
  { id: '720:1280', label: '9:16', description: 'Portrait (TikTok, Stories)', runwayRatio: '720:1280' },
  { id: '1024:1024', label: '1:1', description: 'Square (Instagram Feed)', runwayRatio: '1024:1024' },
  { id: '1920:1080', label: '16:9 (HD)', description: 'Full HD Landscape', runwayRatio: '1920:1080' },
  { id: '1080:1920', label: '9:16 (HD)', description: 'Full HD Portrait', runwayRatio: '1080:1920' },
] as const;

// Aspect ratio options for video generation
export const VIDEO_ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', description: 'Landscape (YouTube, Web)' },
  { id: '9:16', label: '9:16', description: 'Portrait (TikTok, Stories)' },
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
  { id: 'static', label: 'Static', description: 'No camera movement' },
  { id: 'zoom-in', label: 'Zoom In', description: 'Gradual zoom toward subject' },
  { id: 'zoom-out', label: 'Zoom Out', description: 'Gradual zoom away from subject' },
  { id: 'pan-left', label: 'Pan Left', description: 'Horizontal movement to the left' },
  { id: 'pan-right', label: 'Pan Right', description: 'Horizontal movement to the right' },
  { id: 'dynamic', label: 'Dynamic', description: 'AI-driven intelligent movement' },
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
  return ACCEPTABLE_IMAGE_TYPES.includes(file.type);
}
