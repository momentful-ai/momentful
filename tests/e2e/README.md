# End-to-End Tests

This directory contains Playwright-based end-to-end tests that verify the complete user flow without making any real API calls to external services.

## Overview

The E2E tests use mocked API responses to ensure:
- **Deterministic testing**: No external API dependencies
- **Fast execution**: Mocked responses return immediately
- **Cost efficiency**: No real API calls to Runway, Replicate, or other services
- **Reliable CI**: Tests run consistently across environments

## Test Coverage

### Core Flow Tests
- `generate-video.spec.ts`: Tests the complete "Generate → Save → Appears" workflow
  - ✅ Video generation with source selection
  - ✅ API mocking for Runway endpoints
  - ✅ Database mocking for Supabase operations
  - ✅ UI state verification (loading, success, error states)
  - ✅ Video display in Generated Videos tab

## Running Tests

### Local Development
```bash
# Run all E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headless mode
npm run test:e2e

# Run only specific tests
npx playwright test tests/e2e/generate-video.spec.ts
```

### CI Environment
```bash
# CI-optimized: runs only Chromium in headless mode
npm run test:e2e:ci
```

## Architecture

### Route Mocking Strategy
- **Runway API**: All `/api/runway/*` endpoints are mocked to return deterministic responses
- **Database**: All `/rest/v1/*` Supabase endpoints return test data
- **Authentication**: Environment variables enable bypass mode (`VITE_LOCAL_MODE=true`)

### Test Fixtures
- `e2e-setup.ts`: Combined fixture with Runway API mocks and database mocks
- `runway-routes.ts`: Runway API route mocking (success scenarios)
- `database-mocks.ts`: Supabase database mocking (test data)

### Environment Variables
- `VITE_LOCAL_MODE=true`: Enables authentication bypass in development/CI
- `VITE_LOCAL_USER_ID=local-dev-user`: Sets test user ID for database operations

## CI Integration

Tests are automatically run in GitHub Actions on every push and PR:

1. **Unit Tests**: Run Vitest tests with coverage
2. **E2E Tests**: Run Playwright tests against built application
3. **Artifacts**: Test results and traces are uploaded for debugging

### CI Configuration
- Tests run in headless mode for speed
- Only Chromium browser is tested in CI (Firefox/Safari only in local dev)
- Built application is served instead of dev server for consistency
- Environment variables are set at build time for bypass mode

## Debugging

### Local Debugging
```bash
# Run with UI to see browser interactions
npm run test:e2e:ui

# Run with debugging enabled
npx playwright test --debug
```

### CI Debugging
- Check uploaded artifacts in GitHub Actions for test results
- Download traces from failed tests to see exact failure points
- All tests include trace collection on failure

## Adding New Tests

1. **Create test file** in `tests/e2e/`
2. **Import fixtures** from `./fixtures/e2e-setup`
3. **Use Playwright best practices**:
   - Use `page.getByRole()` for element selection
   - Wait for elements with `await expect()`
   - Mock external APIs in fixture files
4. **Update CI config** if new dependencies are needed

## Troubleshooting

### Authentication Issues
- Ensure `VITE_LOCAL_MODE=true` and `VITE_LOCAL_USER_ID=local-dev-user` are set
- Check that bypass mode is working (should see "Development mode" in app)

### Network Issues
- All external APIs are blocked by default - check route mocks if tests fail
- Verify database mocks return expected data structure

### CI Issues
- Check that `serve` package is available (installed as dev dependency)
- Verify environment variables are set correctly in workflow
- Download test artifacts for detailed failure analysis
