import { MediaAsset, EditedImage, GeneratedVideo } from './index';

export type TimelineNode = 
  | { type: 'media_asset'; data: MediaAsset }
  | { type: 'edited_image'; data: EditedImage }
  | { type: 'generated_video'; data: GeneratedVideo };

export interface TimelineEdge {
  from: string; // node id
  to: string;   // node id
}

export interface TimelineData {
  nodes: TimelineNode[];
  edges: TimelineEdge[];
  metadata?: Record<string, unknown>;
}

