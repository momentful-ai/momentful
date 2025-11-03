import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement, Suspense } from 'react';
import { render } from '@testing-library/react';
import { EditedImage, MediaAsset, GeneratedVideo } from '../types';
import userEvent from '@testing-library/user-event';

/**
 * Creates a basic supabase mock for testing
 * Provides mocked from() method that returns a chainable query builder
 */
export const createSupabaseMock = () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
});

/**
 * Creates a supabase mock with storage functionality
 * Extends the basic mock with storage.from() and getPublicUrl() methods
 */
export const createSupabaseWithStorageMock = () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test' } })),
      })),
    },
  },
});

/**
 * Creates a database mock with storage functionality
 * Provides database.storage.getPublicUrl() method
 */
export const createDatabaseMock = () => ({
  database: {
    storage: {
      getPublicUrl: vi.fn((bucket: string, path: string) => `https://example.com/${bucket}/${path}`),
    },
  },
});

/**
 * Utility function to mock the supabase module with basic functionality
 */
export const mockSupabase = () => {
  vi.mock('../../lib/supabase', () => createSupabaseMock());
};

/**
 * Utility function to mock the supabase module with storage functionality
 */
export const mockSupabaseWithStorage = () => {
  vi.mock('../../lib/supabase', () => createSupabaseWithStorageMock());
};

/**
 * Utility function to mock the database module
 */
export const mockDatabase = () => {
  vi.mock('../../lib/database', () => createDatabaseMock());
};

/**
 * Utility function to mock both supabase and database modules
 */
export const mockSupabaseAndDatabase = () => {
  vi.mock('../../lib/supabase', () => createSupabaseWithStorageMock());
  vi.mock('../../lib/database', () => createDatabaseMock());
};

// =============================================================================
// VideoGenerator Test Utilities
// =============================================================================

/**
 * Creates a QueryClient with test-friendly default options
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
};

/**
 * Creates a render wrapper that includes QueryClientProvider and Suspense
 */
export const createTestRenderer = (queryClient: QueryClient) => {
  return (component: ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div>Loading...</div>}>
          {component}
        </Suspense>
      </QueryClientProvider>
    );
  };
};

/**
 * Factory function to create mock EditedImage objects
 */
export const createMockEditedImage = (overrides: Partial<EditedImage> = {}): EditedImage => ({
  id: 'edited-image-1',
  project_id: 'test-project',
  user_id: 'test-user-id',
  prompt: 'A beautiful landscape',
  context: {},
  ai_model: 'stable-diffusion',
  storage_path: 'edited-images/edited-image-1.jpg',
  edited_url: 'https://example.com/edited-images/edited-image-1.jpg',
  thumbnail_url: undefined,
  width: 512,
  height: 512,
  version: 1,
  parent_id: undefined,
  created_at: '2025-10-20T15:59:30.165+00:00',
  ...overrides,
});

/**
 * Factory function to create mock MediaAsset objects
 */
export const createMockMediaAsset = (overrides: Partial<MediaAsset> = {}): MediaAsset => ({
  id: 'media-asset-1',
  project_id: 'test-project',
  user_id: 'test-user-id',
  file_name: 'test-image.jpg',
  file_type: 'image' as const,
  file_size: 1024000,
  storage_path: 'user-uploads/test-user-id/test-project/test-image.jpg',
  thumbnail_url: undefined,
  width: 800,
  height: 600,
  duration: undefined,
  sort_order: 1,
  created_at: '2025-10-20T15:59:30.165+00:00',
  ...overrides,
});

/**
 * Factory function to create mock GeneratedVideo objects
 */
export const createMockGeneratedVideo = (overrides: Partial<GeneratedVideo> = {}): GeneratedVideo => ({
  id: 'generated-video-1',
  project_id: 'test-project',
  user_id: 'test-user-id',
  name: 'Test Video',
  ai_model: 'runway-gen2',
  aspect_ratio: '16:9',
  scene_type: 'product-showcase',
  camera_movement: 'static',
  storage_path: 'https://example.com/generated-video-1.mp4',
  thumbnail_url: undefined,
  duration: 30,
  status: 'completed',
  version: 1,
  parent_id: undefined,
  runway_task_id: 'runway-task-123',
  created_at: '2025-10-20T15:59:30.165+00:00',
  completed_at: '2025-10-20T15:59:30.166+00:00',
  ...overrides,
});

/**
 * Creates user event setup with default delay
 */
export const createUserEvent = () => userEvent.setup();

/**
 * Creates user event setup with no delay (for faster tests)
 */
export const createUserEventNoDelay = () => userEvent.setup({ delay: null });

/**
 * Mock setup utility for VideoGenerator tests
 * Sets up common mocks with default implementations
 */
export const setupVideoGeneratorMocks = () => {
  // Mock database implementations
  const { database } = vi.hoisted(() => ({
    database: {
      videoSources: { create: vi.fn() },
      editedImages: { list: vi.fn() },
      mediaAssets: { list: vi.fn(), create: vi.fn() },
      generatedVideos: { create: vi.fn() },
      storage: {
        getPublicUrl: vi.fn((bucket: string, path: string) => `https://example.com/${bucket}/${path}`),
        upload: vi.fn(),
      },
    },
  }));

  vi.mock('../../lib/database', () => ({ database }));

  return {
    database,
    mockEditedImages: [createMockEditedImage()],
    mockMediaAssets: [createMockMediaAsset()],
    mockGeneratedVideo: createMockGeneratedVideo(),
  };
};
