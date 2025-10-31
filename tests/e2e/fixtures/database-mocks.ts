import { test as base } from '@playwright/test';

/**
 * Playwright test fixture that mocks database calls to return test data.
 * This ensures E2E tests have consistent data without requiring database setup.
 */
export const test = base.extend({
  context: async ({ context }, use) => {
    // Mock projects list to return a test project
    await context.route('**/rest/v1/projects**', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify([
          {
            id: '46b73af3-0bc6-4c64-b665-555495e618fe',
            user_id: 'local-dev-user',
            name: 'Test Project',
            description: 'Test project for E2E testing',
            thumbnail_url: null,
            created_at: '2025-10-20T15:59:30.165+00:00',
            updated_at: '2025-10-20T15:59:30.165+00:00',
            previewImages: [],
          }
        ]),
      });
    });

    // Mock media assets for the test project
    await context.route('**/rest/v1/media_assets**', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify([
          {
            id: 'media-asset-1',
            project_id: '46b73af3-0bc6-4c64-b665-555495e618fe',
            user_id: 'local-dev-user',
            file_name: 'test-image.jpg',
            file_type: 'image',
            file_size: 1024000,
            storage_path: 'user-uploads/local-dev-user/46b73af3-0bc6-4c64-b665-555495e618fe/test-image.jpg',
            thumbnail_url: null,
            width: 800,
            height: 600,
            duration: null,
            sort_order: 1,
            created_at: '2025-10-20T15:59:30.165+00:00',
          }
        ]),
      });
    });

    // Mock edited images for the test project
    await context.route('**/rest/v1/edited_images**', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify([
          {
            id: 'edited-image-1',
            project_id: '46b73af3-0bc6-4c64-b665-555495e618fe',
            user_id: 'local-dev-user',
            source_asset_id: null,
            prompt: 'A beautiful landscape',
            context: {},
            ai_model: 'stable-diffusion',
            storage_path: 'edited-images/edited-image-1.jpg',
            edited_url: 'https://example.com/edited-images/edited-image-1.jpg',
            thumbnail_url: null,
            width: 512,
            height: 512,
            version: 1,
            parent_id: null,
            created_at: '2025-10-20T15:59:30.165+00:00',
          }
        ]),
      });
    });

    // Mock generated videos - initially empty, then return a new video after creation
    let videosCreated = false;
    await context.route('**/rest/v1/generated_videos**', async route => {
      if (route.request().method() === 'GET') {
        // GET request - return videos list
        const body = videosCreated
          ? JSON.stringify([
              {
                id: 'generated-video-1',
                project_id: '46b73af3-0bc6-4c64-b665-555495e618fe',
                user_id: 'local-dev-user',
                name: 'Untitled Video',
                ai_model: 'runway-gen2',
                aspect_ratio: '16:9',
                scene_type: 'product-showcase',
                camera_movement: 'static',
                storage_path: 'https://example.com/generated-video-1.mp4',
                video_url: 'https://example.com/generated-video-1.mp4',
                thumbnail_url: null,
                duration: 30,
                status: 'completed',
                version: 1,
                parent_id: null,
                runway_task_id: 'task-123',
                created_at: '2025-10-20T15:59:30.165+00:00',
                completed_at: '2025-10-20T15:59:30.166+00:00',
              }
            ])
          : JSON.stringify([]);

        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body,
        });
      } else if (route.request().method() === 'POST') {
        // POST request - video creation
        videosCreated = true;
        await route.fulfill({
          status: 201,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: 'generated-video-1',
            project_id: '46b73af3-0bc6-4c64-b665-555495e618fe',
            user_id: 'local-dev-user',
            name: 'Untitled Video',
            ai_model: 'runway-gen2',
            aspect_ratio: '16:9',
            scene_type: 'product-showcase',
            camera_movement: 'static',
            storage_path: 'https://example.com/generated-video-1.mp4',
            video_url: 'https://example.com/generated-video-1.mp4',
            thumbnail_url: null,
            duration: 30,
            status: 'completed',
            version: 1,
            parent_id: null,
            runway_task_id: 'task-123',
            created_at: '2025-10-20T15:59:30.165+00:00',
            completed_at: '2025-10-20T15:59:30.166+00:00',
          }),
        });
      }
    });

    await use(context);
  },
});
