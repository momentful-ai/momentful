#!/usr/bin/env node

/**
 * Script to check the database schema and verify project exists
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use anon key for checking
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProjectExists() {
  try {
    console.log('🔍 Checking if project exists...');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655440000')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Project does not exist');
        return false;
      }
      console.error('❌ Error checking project:', error);
      return false;
    }

    console.log('✅ Project exists:', data.name);
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function checkGeneratedVideosTable() {
  try {
    console.log('\n🔍 Checking generated_videos table schema...');

    // Try to describe the table or check its columns
    // We'll try a simple query first
    const { data, error } = await supabase
      .from('generated_videos')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing generated_videos table:', error);
      return false;
    }

    console.log('✅ Can access generated_videos table');
    if (data && data.length > 0) {
      console.log('📋 Sample record columns:', Object.keys(data[0]));
    }
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function checkRLSPolicies() {
  try {
    console.log('\n🔍 Checking RLS policies...');

    // Try to insert a minimal record to test permissions
    const testRecord = {
      project_id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test RLS Check',
      ai_model: 'test',
      aspect_ratio: '16:9',
      storage_path: 'https://example.com/test.mp4',
      status: 'completed'
    };

    const { error } = await supabase
      .from('generated_videos')
      .insert(testRecord);

    if (error) {
      console.log('❌ RLS Policy blocked insertion:', error.message);
      console.log('💡 This is expected - RLS policies prevent unauthorized insertions');
      return false;
    }

    console.log('✅ RLS Policy allows insertion (unexpected for anon key)');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error checking RLS:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database schema check...\n');

  const projectExists = await checkProjectExists();
  const tableAccessible = await checkGeneratedVideosTable();
  const rlsCheck = await checkRLSPolicies();

  console.log('\n📊 Summary:');
  console.log(`Project exists: ${projectExists ? '✅' : '❌'}`);
  console.log(`Table accessible: ${tableAccessible ? '✅' : '❌'}`);
  console.log(`RLS allows anon inserts: ${rlsCheck ? '✅' : '❌'}`);

  if (projectExists && tableAccessible && !rlsCheck) {
    console.log('\n🎯 Ready for testing with service role key!');
    console.log('💡 To insert test data, use SUPABASE_SERVICE_ROLE_KEY');
  } else if (!projectExists) {
    console.log('\n⚠️  Project does not exist - may need to create it first');
  }
}

main();
