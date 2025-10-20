#!/usr/bin/env node

/**
 * Alternative script using Supabase anon key with proper authentication
 * This retrieves videos using the authenticated user's context (respects RLS)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use environment variables for Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

// Test user credentials (same as in insert script)
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test-password-123';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function signInTestUser() {
  console.log('🔐 Signing in test user...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.error('❌ Error signing in:', error);
    return null;
  }

  console.log(`✅ Signed in as: ${data.user.email}`);
  return data.user;
}

async function retrieveSampleVideos(projectId = '550e8400-e29b-41d4-a716-446655440000') {
  try {
    console.log(`🔍 Retrieving generated videos for project: ${projectId}`);

    const { data, error } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error retrieving videos:', error);
      return null;
    }

    console.log(`✅ Successfully retrieved ${data.length} video(s)`);

    if (data.length === 0) {
      console.log('ℹ️  No videos found for this project');
      return [];
    }

    return data;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return null;
  }
}

async function verifySampleVideoStructure(videos) {
  if (!videos || videos.length === 0) {
    console.log('❌ No videos to verify');
    return false;
  }

  console.log('\n🔍 Verifying video structure...');

  const sampleVideo = videos[0];

  const expectedFields = [
    'id', 'project_id', 'user_id', 'name', 'ai_model',
    'aspect_ratio', 'scene_type', 'camera_movement',
    'storage_path', 'status', 'duration', 'created_at', 'completed_at'
  ];

  let allFieldsPresent = true;

  for (const field of expectedFields) {
    if (!(field in sampleVideo)) {
      console.log(`❌ Missing field: ${field}`);
      allFieldsPresent = false;
    } else {
      console.log(`✅ Field present: ${field} = ${sampleVideo[field]}`);
    }
  }

  if (allFieldsPresent) {
    console.log('\n✅ All expected fields are present and correctly structured');
    console.log(`📹 Video ID: ${sampleVideo.id}`);
    console.log(`🎬 Video URL: ${sampleVideo.storage_path}`);
    console.log(`📊 Status: ${sampleVideo.status}`);
    console.log(`⏱️  Duration: ${sampleVideo.duration}s`);
    console.log(`👤 User ID: ${sampleVideo.user_id}`);
  }

  return allFieldsPresent;
}

async function main() {
  console.log('🚀 Starting sample video retrieval with anon key...\n');

  try {
    // Sign in the test user
    const user = await signInTestUser();

    if (!user) {
      throw new Error('Failed to authenticate test user');
    }

    const videos = await retrieveSampleVideos();

    if (videos === null) {
      throw new Error('Failed to retrieve videos');
    }

    const isValid = await verifySampleVideoStructure(videos);

    if (isValid) {
      console.log('\n🎉 Video retrieval and structure verification successful!');
      console.log('The sample video is ready for UI component testing.');
      console.log(`\nAuthenticated as user: ${user.email} (ID: ${user.id})`);
    } else {
      console.log('\n❌ Video structure verification failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you have run the insert script first');
    console.log('2. Verify the test user exists and is authenticated');
    console.log('3. Check RLS policies allow the authenticated user to view videos');
    process.exit(1);
  }
}

main();
