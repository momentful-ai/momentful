# Video Display Testing Scripts

This directory contains scripts for inserting sample video data and basic database operations. For comprehensive integration and end-to-end testing, see the `tests/` directory.

## Overview

These scripts help you:

1. Insert sample video data into Supabase for testing
2. Retrieve and validate video data structure
3. Test database operations with different authentication approaches

## Prerequisites

1. **Environment Variables**: Make sure you have the following environment variables set:

   **For Service Role Key approach (recommended for testing):**
   - `SUPABASE_SERVICE_ROLE_KEY` (or `VITE_SUPABASE_SERVICE_ROLE_KEY` for local development)
   - `VITE_SUPABASE_URL` (for local development with Supabase CLI)

   **For Anon Key approach (with authentication):**
   - `VITE_SUPABASE_ANON_KEY` (your project's anon/public key)
   - `VITE_SUPABASE_URL` (for local development with Supabase CLI)

2. **Dependencies**: Install the required packages:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

## Available Scripts

### 1. `insert-sample-video.js`
Inserts a sample video record into the Supabase database for testing purposes.

**Usage:**
```bash
node scripts/insert-sample-video.js
```

**What it does:**
- Creates a sample video record with fake data
- Uses a publicly available test video URL
- Outputs the generated video ID for reference

**Sample Output:**
```
🚀 Starting sample video insertion script...

📝 Inserting sample video: {
  project_id: '550e8400-e29b-41d4-a716-446655440000',
  user_id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Sample Test Video',
  ai_model: 'runway-gen2',
  aspect_ratio: '16:9',
  scene_type: 'product-showcase',
  camera_movement: 'static',
  storage_path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  status: 'completed',
  duration: 30,
  created_at: '2024-01-01T12:00:00.000Z',
  completed_at: '2024-01-01T12:00:00.000Z'
}

✅ Successfully inserted sample video with ID: abc-123-def-456
```

### 2. `retrieve-sample-video.js`
Retrieves and verifies the structure of videos from the database.

**Usage:**
```bash
node scripts/retrieve-sample-video.js
```

**What it does:**
- Fetches all videos for a specific project
- Verifies that all required fields are present
- Validates data types and values
- Outputs detailed information about the retrieved videos

**Sample Output:**
```
🚀 Starting sample video retrieval script...

🔍 Retrieving generated videos for project: 550e8400-e29b-41d4-a716-446655440000

✅ Successfully retrieved 1 video(s)

🔍 Verifying video structure...

✅ Field present: id = abc-123-def-456
✅ Field present: project_id = 550e8400-e29b-41d4-a716-446655440000
✅ Field present: user_id = 550e8400-e29b-41d4-a716-446655440001
✅ Field present: name = Sample Test Video
✅ Field present: ai_model = runway-gen2
✅ Field present: aspect_ratio = 16:9
✅ Field present: scene_type = product-showcase
✅ Field present: camera_movement = static
✅ Field present: storage_path = https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
✅ Field present: status = completed
✅ Field present: duration = 30
✅ Field present: created_at = 2024-01-01T12:00:00.000Z
✅ Field present: completed_at = 2024-01-01T12:00:00.000Z

✅ All expected fields are present and correctly structured
📹 Video ID: abc-123-def-456
🎬 Video URL: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
📊 Status: completed
⏱️  Duration: 30s

🎉 Video retrieval and structure verification successful!
```

### 3. `e2e-video-display-test.js`
Comprehensive end-to-end test that validates the complete video display workflow using service role key.

**Usage:**
```bash
node scripts/e2e-video-display-test.js
```

**What it does:**
1. **Inserts** a test video into the database
2. **Retrieves** the video to verify database operations
3. **Validates** data structure and field types
4. **Tests** UI component rendering (simulated)
5. **Cleans up** test data automatically

**Sample Output:**
```
🚀 Starting E2E Video Display Test...

📥 Step 1: Inserting test video...
✅ Test video inserted with ID: abc-123-def-456

📤 Step 2: Retrieving test video...
✅ Retrieved test video: abc-123-def-456

🔍 Step 3: Verifying data structure...
✅ Video data structure is valid

🎨 Step 4: Testing UI component rendering...
✅ Video rendering verification passed

🧹 Step 5: Cleaning up test data...
✅ Test data cleaned up successfully

🎉 E2E Video Display Test PASSED!
✅ Video data insertion: SUCCESS
✅ Video data retrieval: SUCCESS
✅ Data structure validation: SUCCESS
✅ UI component rendering: SUCCESS

🏆 All tests passed! Video display functionality is working correctly.
```

### 4. `insert-sample-video-anon.js` (Alternative)
Alternative script that uses Supabase anon key with proper authentication instead of service role key.

**Usage:**
```bash
node scripts/insert-sample-video-anon.js
```

**What it does:**
- Creates or signs in a test user account
- Inserts sample video data using the authenticated user's context
- Respects Row Level Security (RLS) policies

**Prerequisites:**
- You need a test user account in your Supabase project
- The script will try to sign in with `test@example.com` / `test-password-123`
- If the user doesn't exist, it will attempt to create it

### 5. `retrieve-sample-video-anon.js` (Alternative)
Alternative script that retrieves videos using Supabase anon key with authentication.

**Usage:**
```bash
node scripts/retrieve-sample-video-anon.js
```

**What it does:**
- Signs in the same test user as the insert script
- Retrieves videos for that authenticated user (respects RLS)
- Validates the retrieved data structure

**Note:** Must be run after `insert-sample-video-anon.js` using the same test user.

### 6. `create-project-and-insert-video.js` (Service Role Key Required)
Script to create a test project and insert a specific video URL. Requires service role key.

**Usage:**
```bash
node scripts/create-project-and-insert-video.js
```

**What it does:**
- Creates a test project (or verifies it exists)
- Inserts your specific video URL into the database
- Sets up everything needed for testing

**Prerequisites:**
- `SUPABASE_SERVICE_ROLE_KEY` environment variable must be set
- Get this from Supabase Dashboard > Settings > API > service_role key

**Sample Output:**
```
🚀 Starting project creation and video insertion...

📋 Step 1: Creating test project...
✅ Project created successfully: Test Project for Video Display

📋 Step 2: Inserting specific video...
✅ Successfully inserted specific video!
📹 Video ID: abc-123-def-456
📊 Status: completed
⏱️  Duration: 30s

🎉 Setup completed successfully!

📋 Next steps for testing:
1. Run the E2E test: node scripts/e2e-video-display-test.js
2. Or run the retrieve test: node scripts/retrieve-sample-video.js
```

## Test Data

The scripts use the following test data:

- **Project ID**: `550e8400-e29b-41d4-a716-446655440000`
- **User ID**: `550e8400-e29b-41d4-a716-446655440001`
- **Video URL**: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4` (publicly available test video)

## Authentication Approaches

### Option 1: Service Role Key (Recommended for Testing)
**Pros:**
- ✅ Simpler setup - no authentication required
- ✅ Bypasses RLS policies - can use fake data
- ✅ Perfect for automated testing and CI/CD
- ✅ No need to manage test user accounts

**Cons:**
- ❌ Doesn't test RLS policy enforcement
- ❌ Uses elevated permissions (not realistic for production)

**Environment Variables:**
```bash
export VITE_SUPABASE_URL="http://127.0.0.1:54321"  # or your remote URL
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Option 2: Anon Key with Authentication (Production-like)
**Pros:**
- ✅ Tests real authentication flow
- ✅ Validates RLS policies work correctly
- ✅ More realistic for production scenarios
- ✅ Tests user permissions properly

**Cons:**
- ❌ More complex setup - requires test user account
- ❌ Must manage authentication state
- ❌ Cannot use completely fake data

**Environment Variables:**
```bash
export VITE_SUPABASE_URL="http://127.0.0.1:54321"  # or your remote URL
export VITE_SUPABASE_ANON_KEY="your-anon-key"
```

**Setup Steps:**
1. Create a test user in your Supabase dashboard or via script
2. Ensure the user has permission to insert/retrieve videos
3. Run the anon key scripts

## Environment Setup

### For Local Development (Supabase CLI)
```bash
# For Service Role Key approach
export VITE_SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_SERVICE_ROLE_KEY="your-local-service-key"

# For Anon Key approach
export VITE_SUPABASE_URL="http://127.0.0.1:54321"
export VITE_SUPABASE_ANON_KEY="your-local-anon-key"
```

### For Production/Remote Supabase
```bash
# For Service Role Key approach
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-production-service-key"

# For Anon Key approach
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-production-anon-key"
```

## Troubleshooting

### Common Issues

1. **"SUPABASE_SERVICE_ROLE_KEY environment variable is required"**
   - Make sure you've set the environment variable correctly
   - Check that your Supabase project is running (for local development)

2. **Database connection errors**
   - Verify that your Supabase instance is accessible
   - Check network connectivity for remote instances

3. **Permission errors**
   - Ensure the service role key has the necessary permissions
   - Check RLS (Row Level Security) policies on the `generated_videos` table

### Manual Database Inspection

If you need to manually inspect the test data:

```sql
-- Check for test videos in the database
SELECT * FROM generated_videos
WHERE name LIKE '%Test%' OR name LIKE '%Sample%'
ORDER BY created_at DESC;

-- Clean up test data manually
DELETE FROM generated_videos
WHERE name = 'Sample Test Video' OR name = 'E2E Test Video';
```

## Integration with Application

These scripts test the same database operations and data structures that the actual application uses. They verify that:

- The `generated_videos` table schema is correct
- Database queries work as expected
- The video display logic in the UI components functions properly
- The complete flow from database insertion to UI rendering works

## Testing Structure

This project uses a two-tier testing approach:

### `scripts/` Directory
- **Basic insertion and retrieval scripts** for setting up test data
- **Simple database operation tests** with service role or anon key authentication
- **Quick validation** of database operations

### `tests/` Directory
- **Comprehensive integration tests** that validate the complete workflow
- **End-to-end tests** that simulate real user scenarios
- **Component tests** using React Testing Library
- **Production-like testing** with realistic data flows

## Next Steps

After running these scripts successfully:

1. **Verify the fixes work**: The recent changes to `GeneratedVideosView` and `VideoGenerator` should now properly display videos
2. **Run comprehensive tests**: Use the `tests/` directory scripts for full validation
3. **Test with real video generation**: Generate an actual video through the UI to confirm the full workflow
4. **Monitor for regressions**: Run tests periodically to catch any breaking changes

The scripts are designed to be run independently and can be integrated into your CI/CD pipeline for automated testing.
