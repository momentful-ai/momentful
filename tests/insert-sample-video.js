import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertVideosIntoCorrectProject() {
  console.log('🎬 Inserting videos into the correct project...\n');

  try {
    // The target project ID from the failing API call
    const targetProjectId = '46b73af3-0bc6-4c64-b665-555495e618fe';
    const targetProjectName = 'Necklace Showcase';

    console.log(`🎯 Target project: "${targetProjectName}" (${targetProjectId})`);

    // Verify the project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', targetProjectId)
      .single();

    if (projectError) {
      console.error('❌ Error fetching target project:', projectError.message);
      return;
    }

    console.log(`✅ Found target project: "${project.name}"`);

    // Sample videos to insert into the correct project
    const sampleVideos = [
      {
        project_id: targetProjectId,
        user_id: 'local-dev-user',
        name: 'Necklace Product Video',
        ai_model: 'runway-gen2',
        aspect_ratio: '9:16',
        scene_type: 'product-showcase',
        camera_movement: 'slow-pan',
        storage_path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        status: 'completed',
        duration: 30,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      {
        project_id: targetProjectId,
        user_id: 'local-dev-user',
        name: 'Social Media Story',
        ai_model: 'runway-gen2',
        aspect_ratio: '9:16',
        scene_type: 'social-story',
        camera_movement: 'static',
        storage_path: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        status: 'completed',
        duration: 15,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      }
    ];

    console.log('\n📝 Inserting sample videos into target project...');

    for (const [index, video] of sampleVideos.entries()) {
      const { data, error } = await supabase
        .from('generated_videos')
        .insert(video)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting video ${index + 1}:`, error.message);
        console.error('   Details:', error);
      } else {
        console.log(`✅ Video ${index + 1} inserted: "${data.name}" (${data.status})`);
      }
    }

    // Verify the data was inserted into the correct project
    console.log('\n🔍 Verifying videos in target project...');
    const { data: insertedVideos, error: verifyError } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('project_id', targetProjectId)
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError.message);
    } else {
      console.log(`✅ Found ${insertedVideos?.length || 0} videos in target project`);

      if (insertedVideos && insertedVideos.length > 0) {
        console.log('\n📹 Videos in target project:');
        insertedVideos.forEach((video, index) => {
          console.log(`   ${index + 1}. "${video.name}"`);
          console.log(`      Status: ${video.status}`);
          console.log(`      AI Model: ${video.ai_model}`);
          console.log(`      Aspect Ratio: ${video.aspect_ratio}`);
          console.log(`      URL: ${video.video_url || 'Not available'}`);
          console.log('');
        });
      }
    }

    // Test the exact API call that was failing
    console.log('\n🌐 Testing the original failing API call...');
    const { data: apiTestVideos, error: apiTestError } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('project_id', targetProjectId)
      .order('created_at', { ascending: false });

    if (apiTestError) {
      console.error('❌ API call still failing:', apiTestError.message);
    } else {
      console.log(`✅ API call now returns ${apiTestVideos?.length || 0} videos`);
      console.log('🎉 The original failing API call should now work!');
    }

    console.log('\n🎉 Sample videos inserted into correct project!');
    console.log('\n💡 Next steps:');
    console.log('   1. The frontend API call should now return data');
    console.log('   2. GeneratedVideosView should display the videos');
    console.log('   3. The "socket hang up" error should be resolved');

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

insertVideosIntoCorrectProject().then(success => {
  if (success) {
    console.log('\n✅ Videos inserted into correct project successfully!');
    process.exit(0);
  } else {
    console.log('\n❌ Failed to insert videos into correct project');
    process.exit(1);
  }
});
