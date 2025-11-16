# Storage Setup Guide

This guide explains how to set up and manage Supabase storage buckets for the application.

## Overview

The application uses the following storage architecture:

- **Shared Buckets**: All users share the same buckets but have isolated access via path-based security
- **Path Structure**: Files are stored as `{userId}/{projectId}/{filename}`
- **Security**: Row Level Security (RLS) policies ensure users can only access their own files

## Required Buckets

| Bucket | Purpose | Public | Size Limit | MIME Types |
|--------|---------|--------|------------|------------|
| `user-uploads` | Original user-uploaded images/videos | No | 50MB* | Images, videos |
| `edited-images` | AI-generated edited images | No | 25MB* | Images only |
| `generated-videos` | AI-generated videos | No | 100MB* | Videos only |
| `thumbnails` | Generated thumbnails | No | 2MB* | Images only |

*Size limits are conservative defaults. Adjust based on your Supabase plan limits.

## Setup Instructions

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
npm run supabase:setup-storage
```

This will automatically create all required buckets and verify they exist.

### Option 2: Manual Setup

If you prefer to create buckets manually, go to [Supabase Dashboard → Storage](https://supabase.com/dashboard/project/fzsrtmkvzeqfyhyzjcer/storage) and create these buckets:

**Bucket: `user-uploads`**
- Name: `user-uploads`
- Public: `No`
- File size limit: `52428800` (50MB) - adjust based on your plan limits
- Allowed MIME types: `image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm`

**Bucket: `edited-images`**
- Name: `edited-images`
- Public: `No`
- File size limit: `26214400` (25MB) - adjust based on your plan limits
- Allowed MIME types: `image/jpeg,image/png,image/webp`

**Bucket: `generated-videos`**
- Name: `generated-videos`
- Public: `No`
- File size limit: `104857600` (100MB) - adjust based on your plan limits
- Allowed MIME types: `video/mp4,video/webm`

**Bucket: `thumbnails`**
- Name: `thumbnails`
- Public: `No`
- File size limit: `2097152` (2MB) - adjust based on your plan limits
- Allowed MIME types: `image/jpeg,image/png,image/webp`

**Note:** File size limits may need to be adjusted based on your Supabase plan. The automated script uses conservative limits that work with most plans.

### 2. Apply Storage Policies

After creating buckets, apply the storage policies:

```bash
npm run supabase:push
```

This will create RLS policies that ensure users can only access files in their own user folder.

### 3. Verify Setup

Run the storage verification script:

```bash
npm run supabase:setup-storage
```

This will check that all buckets exist and report any issues.

## File Organization

Files are organized hierarchically:

```
user-uploads/
├── user123/
│   ├── project456/
│   │   ├── 1699123456789-image.jpg
│   │   ├── 1699123456790-video.mp4
│   │   └── 1699123456800-edited.png
│   └── project789/
│       └── 1699123456810-thumbnail.jpg
└── user456/
    └── project101/
        └── 1699123456820-image.png
```

## Security

- **Path Validation**: All uploads validate that the storage path starts with the user's ID
- **RLS Policies**: Database policies check `starts_with(name, auth.jwt()->>'user_id' || '/')`
- **JWT Claims**: Clerk provides `user_id` in JWT for policy evaluation

## Error Handling

The application includes comprehensive error handling for storage operations:

- **Bucket Not Found**: Clear error messages directing users to contact support
- **Permission Denied**: Indicates authentication issues
- **File Too Large**: Specific messaging for size limits
- **Network Errors**: Retry logic for transient failures

## Troubleshooting

### "Bucket not found" Error
- Ensure all required buckets are created in the Supabase dashboard
- Check that bucket names match exactly: `user-uploads`, `edited-images`, `generated-videos`, `thumbnails`

### Upload Failures
- Verify JWT integration is working: `npm run supabase:verify-jwt`
- Check browser console for detailed error messages
- Ensure user is authenticated before uploading

### Permission Errors
- Confirm RLS policies are applied: `npm run supabase:push`
- Verify Clerk JWT template includes `user_id` claim
- Check that user ID is correctly retrieved in the application

## Scripts

- `npm run supabase:setup-storage` - Check and create missing buckets
- `npm run supabase:push` - Apply storage policies
- `npm run supabase:verify-jwt` - Test JWT integration

## API Reference

### Server-side Storage Utilities (`api/shared/storage.ts`)

```typescript
// Check if bucket exists
await bucketExists('user-uploads');

// Create all required buckets
await ensureBucketsExist();

// Get list of missing buckets
await getMissingBuckets();

// Validate storage path
validateStoragePath(userId, storagePath);

// Handle storage errors
handleStorageError(error, 'upload operation');
```

### Client-side Storage Utilities (`src/lib/storage-utils.ts`)

```typescript
// Handle client-side storage errors
handleStorageError(error, 'upload');

// Validate paths
validateStoragePath(userId, storagePath);

// Check if error is retryable
isRetryableError(error);
```
