import { lazy } from 'react';

export const ImageEditor = lazy(() => import('./ImageEditor').then(module => ({ default: module.ImageEditor })));
export type { ImageEditorProps } from './types';

