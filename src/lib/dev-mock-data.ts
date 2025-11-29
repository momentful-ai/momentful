import { MediaAsset, EditedImage, GeneratedVideo } from '../types';

// Mock data now points to local static files in public/dev-assets/
// In demo mode, getAssetUrl handles URL generation without pre-computed URLs
export const MOCK_MEDIA_ASSETS: MediaAsset[] = [
    {
        id: 'mock-asset-1',
        project_id: 'mock-project',
        user_id: 'mock-user',
        file_name: 'sample-1.jpg',
        file_type: 'image',
        file_size: 1024 * 1024 * 2,
        storage_path: '/dev-assets/media-library/sample-1.jpg',
        // Remove thumbnail_url - let getAssetUrl handle it in demo mode
        sort_order: 0,
        created_at: new Date().toISOString(),
        width: 800,
        height: 600,
    },
    {
        id: 'mock-asset-2',
        project_id: 'mock-project',
        user_id: 'mock-user',
        file_name: 'sample-2.jpg',
        file_type: 'image',
        file_size: 1024 * 1024 * 1.5,
        storage_path: '/dev-assets/media-library/sample-2.jpg',
        // Remove thumbnail_url - let getAssetUrl handle it in demo mode
        sort_order: 1,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        width: 800,
        height: 600,
    },
    {
        id: 'mock-asset-3',
        project_id: 'mock-project',
        user_id: 'mock-user',
        file_name: 'sample-3.jpg',
        file_type: 'image',
        file_size: 1024 * 1024 * 3,
        storage_path: '/dev-assets/media-library/sample-3.jpg',
        // Remove thumbnail_url - let getAssetUrl handle it in demo mode
        sort_order: 2,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        width: 800,
        height: 600,
    },
];

export const MOCK_EDITED_IMAGES: EditedImage[] = [
    {
        id: 'mock-edited-1',
        project_id: 'mock-project',
        user_id: 'mock-user',
        prompt: 'A futuristic cyberpunk city with neon lights',
        context: { style: 'cyberpunk' },
        ai_model: 'runway-gen4-turbo',
        storage_path: '/dev-assets/edited-images/edited-1.jpg',
        // Remove edited_url - let getAssetUrl handle it in demo mode
        width: 800,
        height: 600,
        created_at: new Date().toISOString(),
    },
    {
        id: 'mock-edited-2',
        project_id: 'mock-project',
        user_id: 'mock-user',
        prompt: 'Oil painting of a cottage in the woods',
        context: { style: 'oil painting' },
        ai_model: 'runway-gen4-turbo',
        storage_path: '/dev-assets/edited-images/edited-2.jpg',
        // Remove edited_url - let getAssetUrl handle it in demo mode
        width: 800,
        height: 600,
        created_at: new Date(Date.now() - 3600000).toISOString(),
    },
];

export const MOCK_GENERATED_VIDEOS: GeneratedVideo[] = [
    {
        id: 'mock-video-1',
        project_id: 'mock-project',
        user_id: 'mock-user',
        storage_path: '/dev-assets/generated-videos/video-1.mp4',
        thumbnail_url: '/dev-assets/generated-videos/video-1-thumb.jpg',
        status: 'completed',
        created_at: new Date().toISOString(),
        ai_model: 'runway-gen3-alpha',
        name: 'Sample Video 1',
        aspect_ratio: '16:9',
    },
    {
        id: 'mock-video-2',
        project_id: 'mock-project',
        user_id: 'mock-user',
        storage_path: '/dev-assets/generated-videos/video-2.mp4',
        thumbnail_url: '/dev-assets/generated-videos/video-2-thumb.jpg',
        status: 'completed',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        ai_model: 'runway-gen3-alpha',
        name: 'Sample Video 2',
        aspect_ratio: '16:9',
    },
];
