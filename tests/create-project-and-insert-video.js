#!/usr/bin/env node

/**
 * Script to create a test project and insert the specific video URL
 * This requires the service role key to bypass RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use environment variables for Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  console.log('\n💡 To get the service role key:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Settings > API');
  console.log('4. Copy the "service_role" key');
  console.log('5. Set it as SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// The specific video URL provided by the user
const SPECIFIC_VIDEO_URL = 'https://dnznrvs05pmza.cloudfront.net/veo3.1/projects/vertex-ai-claude-431722/locations/us-central1/publishers/google/models/veo-3.1-fast-generate-preview/operations/642e138d-84e0-46d9-97c3-656970f63d42/showcase_this_necklace_illuminated_in_a_dark_room.mp4?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiYTJkN2I5YjhlZTc0Mjg3YiIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc2MTA5MTIwMH0.yYT8k8EWwwzjCEXW2ECQmpZusaRN3KwXYZ0eIR4w2Lo';

async function createTestProject() {
  try {
    console.log('📝 Creating test project...');

    const testProject = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Project for Video Display',
      description: 'Project created for testing video display functionality'
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(testProject)
      .select()
      .single();

    if (error) {
      // Project might already exist
      if (error.code === '23505') {
        console.log('✅ Project already exists');
        return { exists: true };
      }
      console.error('❌ Error creating project:', error);
      return null;
    }

    console.log('✅ Project created successfully:', data.name);
    return data;

  } catch (error) {
    console.error('❌ Unexpected error creating project:', error);
    return null;
  }
}

async function insertSpecificVideo() {
  try {
    console.log('📝 Inserting specific video with provided URL:');
    console.log('🎬 URL:', SPECIFIC_VIDEO_URL.substring(0, 100) + '...');

    // Video data using the specific URL provided
    const specificVideo = {
      project_id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Specific Test Video - Illuminated Necklace',
      ai_model: 'veo-3.1-fast-generate-preview',
      aspect_ratio: '16:9',
      scene_type: 'product-showcase',
      camera_movement: 'static',
      storage_path: SPECIFIC_VIDEO_URL,
      status: 'completed',
      duration: 30,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('generated_videos')
      .insert(specificVideo)
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting specific video:', error);
      return null;
    }

    console.log('✅ Successfully inserted specific video!');
    console.log(`📹 Video ID: ${data.id}`);
    console.log(`📊 Status: ${data.status}`);
    console.log(`⏱️  Duration: ${data.duration}s`);
    return data;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting project creation and video insertion...\n');

  try {
    // Step 1: Create or verify project exists
    console.log('📋 Step 1: Creating test project...');
    const project = await createTestProject();

    if (!project) {
      throw new Error('Failed to create/access project');
    }

    // Step 2: Insert the specific video
    console.log('\n📋 Step 2: Inserting specific video...');
    const video = await insertSpecificVideo();

    if (!video) {
      throw new Error('Failed to insert video');
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps for testing:');
    console.log('1. Run the E2E test: node scripts/e2e-video-display-test.js');
    console.log('2. Or run the retrieve test: node scripts/retrieve-sample-video.js');
    console.log(`3. Video ID for reference: ${video.id}`);
    console.log(`4. Project ID: ${video.project_id}`);

    console.log('\n💡 The video is now available for testing the UI components!');
    console.log('   The fixes ensure it will display immediately with proper loading states.');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Ensure SUPABASE_SERVICE_ROLE_KEY is set correctly');
    console.log('- Verify the Supabase project is accessible');
    console.log('- Check that the database schema supports the insert operation');
    process.exit(1);
  }
}

main();
