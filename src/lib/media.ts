import { database } from './database';

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
  const acceptableTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];
  return acceptableTypes.includes(file.type);
}
