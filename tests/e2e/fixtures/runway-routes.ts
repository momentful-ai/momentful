/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test';

/**
 * Playwright test fixture that mocks Runway API endpoints to prevent real API calls.
 * This ensures E2E tests are deterministic, fast, and don't incur API costs.
 */
export const test = base.extend({
  context: async ({ context }, useFixture) => {
    // Mock POST /api/runway/jobs (create job)
    await context.route('**/api/runway/jobs', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-123',
          status: 'PROCESSING'
        }),
      });
    });

    // Mock GET /api/runway/jobs/:id (poll job status)
    // First call returns processing with progress, second returns success
    let pollCount = 0;
    await context.route('**/api/runway/jobs/task-123', async route => {
      pollCount++;

      if (pollCount === 1) {
        // First poll: still processing with progress
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: 'task-123',
            status: 'PROCESSING',
            progress: 0.42
          }),
        });
      } else {
        // Subsequent polls: completed successfully
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            id: 'task-123',
            status: 'SUCCEEDED',
            output: 'https://example.com/generated-video.mp4'
          }),
        });
      }
    });

    // Hard block any accidental calls to real Runway API
    await context.route('https://api.runwayml.com/**', route => route.abort());

    // Also block any other potential external API calls (safety net)
    await context.route('https://api.replicate.com/**', route => route.abort());

    await useFixture(context);
  },
});

/**
 * Alternative fixture for testing failure scenarios
 */
export const testFailure = base.extend({
  context: async ({ context }, useFixture) => {
    // Mock POST /api/runway/jobs (create job)
    await context.route('**/api/runway/jobs', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          taskId: 'task-456',
          status: 'PROCESSING'
        }),
      });
    });

    // Mock GET /api/runway/jobs/:id (poll job status) - always fails
    await context.route('**/api/runway/jobs/task-456', async route => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: 'task-456',
          status: 'FAILED',
          failure: 'Video generation failed due to insufficient quality'
        }),
      });
    });

    // Hard block any accidental calls to real Runway API
    await context.route('https://api.runwayml.com/**', route => route.abort());

    await useFixture(context);
  },
});
