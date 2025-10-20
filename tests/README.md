# Comprehensive Testing Suite

This directory contains comprehensive integration and end-to-end tests for the video display functionality. These tests validate the complete workflow from database operations to UI rendering.

## Overview

The `tests/` directory provides:

1. **Integration Tests** - Validate database connectivity, API calls, and data flow
2. **End-to-End Tests** - Simulate complete user workflows
3. **Component Tests** - Located in `src/__tests__/` for React component testing

## Available Scripts

### 1. `test-generated-videos-integration.js`
Comprehensive integration test that validates the entire video data pipeline.

**What it tests:**
- Database connectivity with anon key
- Video data retrieval from Supabase
- Video URL accessibility and validation
- Data structure compatibility with GeneratedVideosView component
- Component props formatting

**Usage:**
```bash
node tests/test-generated-videos-integration.js
```

**Sample Output:**
```
🚀 Starting GeneratedVideosView Integration Test...

🔗 Testing database connection...
✅ Database connection successful

🔍 Verifying video data in database...
✅ Found 2 video(s)

🌐 Testing video URL accessibility...
✅ Video URL is accessible (Status: 200)
✅ Content type is video: video/mp4

🔍 Verifying video data structure matches component expectations...
✅ All required fields present

✅ Video data structure is compatible with GeneratedVideosView

🎉 Integration test completed successfully!
```

### 2. `test-end-to-end-flow.js`
End-to-end test that simulates the complete user workflow from database to UI rendering.

**What it tests:**
- Database queries matching ProjectWorkspace.tsx implementation
- Data flow from database through component props
- Tab count calculations
- Component data structure validation
- Complete workflow simulation

**Usage:**
```bash
node tests/test-end-to-end-flow.js
```

**Sample Output:**
```
🚀 Starting End-to-End Flow Test...

📊 Step 1: Database Connection & Data Verification
✅ Found video data

🔄 Step 3: Simulating ProjectWorkspace Data Loading
✅ Generated videos: 2

🎬 Step 4: GeneratedVideosView Component Data
✅ Videos count: 2

✨ Step 7: Final Verification
✅ All tests passed

🎉 END-TO-END FLOW TEST COMPLETED SUCCESSFULLY!
```

## Prerequisites

1. **Environment Variables**: Same as `scripts/` directory
   ```bash
   export VITE_SUPABASE_URL="http://127.0.0.1:54321"
   export VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

2. **Test Data**: Run insertion scripts from `scripts/` directory first:
   ```bash
   node scripts/insert-sample-video.js
   ```

## Testing Workflow

### Quick Testing
1. **Insert test data**: `node scripts/insert-sample-video.js`
2. **Run integration test**: `node tests/test-generated-videos-integration.js`
3. **Run end-to-end test**: `node tests/test-end-to-end-flow.js`

### Comprehensive Testing
1. **Component tests**: `npm test GeneratedVideosView.test.tsx`
2. **Integration tests**: `node tests/test-generated-videos-integration.js`
3. **End-to-end tests**: `node tests/test-end-to-end-flow.js`

## Test Data

The tests use real data from your Supabase database:
- **Project ID**: `46b73af3-0bc6-4c64-b665-555495e618fe` (Necklace Showcase)
- **Sample Videos**: 2 videos with working URLs
- **Video URL**: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`

## Integration with CI/CD

These tests can be integrated into your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Integration Tests
  run: |
    node tests/test-generated-videos-integration.js
    node tests/test-end-to-end-flow.js

- name: Run Component Tests
  run: npm test GeneratedVideosView.test.tsx
```

## Troubleshooting

### Common Issues

1. **"No videos found"**
   - Run `node scripts/insert-sample-video.js` first
   - Check that the project exists in your database

2. **Database connection errors**
   - Verify environment variables are set correctly
   - Check that Supabase is running locally

3. **Video URL accessibility errors**
   - The test video URL should be publicly accessible
   - Check network connectivity

### Manual Database Inspection

```sql
-- Check current videos in the target project
SELECT * FROM generated_videos
WHERE project_id = '46b73af3-0bc6-4c64-b665-555495e618fe'
ORDER BY created_at DESC;

-- Check all projects
SELECT * FROM projects ORDER BY created_at DESC;
```

## Test Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| **Database Operations** | ✅ Integration tests | Full coverage |
| **API Endpoints** | ✅ E2E tests | Complete workflow |
| **React Components** | ✅ Component tests | 13/13 tests passing |
| **Data Flow** | ✅ E2E tests | Database → UI |

## Next Steps

After successful test runs:

1. **Verify UI functionality**: Open the app and check that videos display correctly
2. **Test with real video generation**: Generate actual videos through the UI
3. **Monitor for regressions**: Run tests periodically during development

The comprehensive testing suite ensures that the GeneratedVideosView component works correctly with real data from the database.
