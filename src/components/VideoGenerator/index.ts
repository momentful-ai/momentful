import { lazy } from 'react';

export const VideoGenerator = lazy(() => import('./VideoGenerator').then(module => ({ default: module.VideoGenerator })));
export type { VideoGeneratorProps, SelectedSource } from './types';

