import { AIModel } from '../types';

export const imageModels: AIModel[] = [
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    description: 'Best for realistic product photos and detailed edits',
    type: 'image',
    provider: 'Stability AI',
  },
  {
    id: 'dalle-3',
    name: 'DALL-E 3',
    description: 'Best for creative interpretations and artistic styles',
    type: 'image',
    provider: 'OpenAI',
  },
  {
    id: 'midjourney-v6',
    name: 'Midjourney v6',
    description: 'Best for stylized marketing imagery and brand aesthetics',
    type: 'image',
    provider: 'Midjourney',
  },
  {
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'Best for fast iterations and lifestyle scenes',
    type: 'image',
    provider: 'Replicate',
  },
];

export const videoModels: AIModel[] = [
  {
    id: 'runway-gen2',
    name: 'Runway Gen-2',
    description: 'Best for smooth camera movements and cinematic effects',
    type: 'video',
    provider: 'Runway',
  },
  {
    id: 'pika-labs',
    name: 'Pika Labs',
    description: 'Best for dynamic product showcases and transitions',
    type: 'video',
    provider: 'Pika',
  },
  {
    id: 'stable-video',
    name: 'Stable Video Diffusion',
    description: 'Best for consistent quality and precise control',
    type: 'video',
    provider: 'Stability AI',
  },
  {
    id: 'luma-ai',
    name: 'Luma Dream Machine',
    description: 'Best for realistic motion and natural animations',
    type: 'video',
    provider: 'Luma AI',
  },
];
