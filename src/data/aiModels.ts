import { AIModel } from '../types';

export const imageModels: AIModel[] = [
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
];
