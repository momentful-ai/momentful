import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Environment variables for tests */
    env: {
      // Set environment variables for the test environment (only in local development)
      ...(!process.env.CI && {
        VITE_LOCAL_MODE: 'true',
        VITE_LOCAL_USER_ID: 'local-dev-user',
      }),
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Run headless in CI for faster execution
        headless: process.env.CI ? true : undefined,
      },
    },

    // Only run additional browsers in local development, not in CI
    ...(process.env.CI ? [] : [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },

      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ]),

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? {
    // In CI, serve the built app (already built with bypass mode)
    command: 'npx serve -s dist -l 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
  } : {
    // In local development, use the dev server with bypass mode
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    env: {
      VITE_LOCAL_MODE: 'true',
      VITE_LOCAL_USER_ID: 'local-dev-user',
    },
  },
});
