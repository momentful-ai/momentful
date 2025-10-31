import { test } from './fixtures/e2e-setup';
import { expect } from '@playwright/test';

/**
 * Test the complete video generation flow: Generate → Save → Appears
 * This test verifies the full user journey without making any real API calls.
 * Uses mocked Runway API and database responses for deterministic testing.
 */
test.describe('Video Generation Flow', () => {
  test('generate video → save to database → appears in videos tab', async ({ page }) => {
    // Navigate to the dashboard (bypass auth should be active)
    await page.goto('/');

    // Verify we're on the dashboard and bypass mode worked
    await expect(page.getByText('Your Projects')).toBeVisible();

    // Click on the test project to navigate to the project workspace
    await page.getByText('Test Project').click();

    // Verify we're in the project workspace
    await expect(page.getByText('Test Project')).toBeVisible();
    await expect(page.getByRole('button', { name: /generate video/i })).toBeVisible();

    // Navigate to the "Edited Images" tab (should have 1 edited image)
    await page.getByRole('button', { name: /edited images/i }).click();
    await expect(page.getByText('1')).toBeVisible(); // Badge showing count

    // Open the Video Generator modal
    await page.getByRole('button', { name: /generate video/i }).click();

    // Verify Video Generator modal opened
    await expect(page.getByText('Video Generator')).toBeVisible();
    await expect(page.getByText('Back to Project')).toBeVisible();

    // Switch to "Edited Images" tab in the generator
    await page.getByRole('button', { name: /edited images/i }).click();

    // Select the edited image
    const landscapeImage = page.getByAltText('A beautiful landscape');
    await expect(landscapeImage).toBeVisible();
    await landscapeImage.click();

    // Verify image is selected (should have selection indicator)
    await expect(page.locator('[class*="bg-primary"][class*="rounded-full"]')).toBeVisible();

    // Click "Generate Video" button
    await page.getByRole('button', { name: /^generate video$/i }).click();

    // Verify the generation process starts
    // Should show progress or spinner during generation
    await expect(page.locator('[class*="animate-spin"]')).toBeVisible();

    // Wait for video generation to complete
    // The mocked API will return success quickly
    await expect(page.locator('video')).toBeVisible({ timeout: 10000 });

    // Verify the video preview shows the generated video
    const videoElement = page.locator('video');
    await expect(videoElement).toBeVisible();
    await expect(videoElement).toHaveAttribute('src', /example\.com\/generated-video\.mp4/);

    // The Video Generator should close automatically after successful generation
    await expect(page.getByText('Video Generator')).not.toBeVisible();

    // Navigate to the "Generated Videos" tab
    await page.getByRole('button', { name: /generated videos/i }).click();

    // Verify the new video appears in the Generated Videos tab
    await expect(page.getByText('Untitled Video')).toBeVisible();
    await expect(page.getByText('runway-gen2')).toBeVisible();
    await expect(page.getByText('16:9')).toBeVisible();
    await expect(page.getByText('30s')).toBeVisible();

    // Verify the video element in the videos tab
    const videosTabVideo = page.locator('video');
    await expect(videosTabVideo).toBeVisible();
    await expect(videosTabVideo).toHaveAttribute('src', /example\.com\/generated-video\.mp4/);

    // Verify export and publish buttons are visible for completed video
    await expect(page.getByTitle('Export video')).toBeVisible();
    await expect(page.getByTitle('Publish to social')).toBeVisible();
  });

  test('can switch between video view modes', async ({ page }) => {
    // Navigate to project and generate a video first
    await page.goto('/');
    await page.getByText('Test Project').click();
    await page.getByRole('button', { name: /generate video/i }).click();

    // Switch to Edited Images and select an image
    await page.getByRole('button', { name: /edited images/i }).click();
    await page.getByAltText('A beautiful landscape').click();

    // Generate video
    await page.getByRole('button', { name: /^generate video$/i }).click();

    // Wait for completion and close generator
    await expect(page.locator('video')).toBeVisible();
    await expect(page.getByText('Video Generator')).not.toBeVisible();

    // Navigate to Generated Videos tab
    await page.getByRole('button', { name: /generated videos/i }).click();

    // Should default to grid view
    await expect(page.locator('[class*="grid grid-cols-"]')).toBeVisible();

    // Switch to list view
    await page.getByRole('button', { name: /list/i }).click();
    await expect(page.locator('[class*="space-y-2"]')).toBeVisible();

    // Switch back to grid view
    await page.getByRole('button', { name: /grid/i }).click();
    await expect(page.locator('[class*="grid grid-cols-"]')).toBeVisible();
  });
});
