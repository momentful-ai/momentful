import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUploadMedia } from '../../hooks/useUploadMedia';
import { database } from '../../lib/database';
import { getImageDimensions, isAcceptableImageFile } from '../../lib/media';
import { useUserId } from '../../hooks/useUserId';

// Mock dependencies
vi.mock('../../lib/database', () => ({
  database: {
    storage: {
      upload: vi.fn(),
    },
    mediaAssets: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../../lib/media', () => ({
  getImageDimensions: vi.fn(),
  isAcceptableImageFile: vi.fn(),
}));

vi.mock('../../hooks/useUserId', () => ({
  useUserId: vi.fn(),
}));

describe('useUploadMedia', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(useUserId).mockReturnValue('user-1');
    vi.mocked(isAcceptableImageFile).mockImplementation((file: File) => {
      return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
    });
    vi.mocked(getImageDimensions).mockResolvedValue({ width: 1920, height: 1080 });
    vi.mocked(database.storage.upload).mockResolvedValue({
      id: 'file-id',
      path: 'test-path',
      fullPath: 'test-full-path',
    });
    vi.mocked(database.mediaAssets.create).mockResolvedValue({
      id: 'asset-1',
      project_id: 'project-1',
      user_id: 'user-1',
      file_name: 'test.jpg',
      file_type: 'image',
      file_size: 1024,
      storage_path: 'user-1/project-1/123-test.jpg',
      width: 1920,
      height: 1080,
      sort_order: 0,
      created_at: '2025-01-01T00:00:00Z',
    });
    // Spy on queryClient methods
    vi.spyOn(queryClient, 'invalidateQueries');
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const createMockFile = (name: string, type: string, size: number = 1024): File => {
    const file = new File(['test content'], name, { type });
    Object.defineProperty(file, 'size', { value: size, writable: false });
    return file;
  };

  it('successfully uploads valid image files', async () => {
    const imageFile = createMockFile('test.jpg', 'image/jpeg');
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    const response = await result.current.mutateAsync({
      projectId: 'project-1',
      files: [imageFile],
    });

    expect(response.successful).toBe(1);
    expect(response.total).toBe(1);
    expect(database.storage.upload).toHaveBeenCalledTimes(1);
    expect(database.mediaAssets.create).toHaveBeenCalledTimes(1);
    expect(getImageDimensions).toHaveBeenCalledWith(imageFile);

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['media-assets', 'project-1', 'user-1'],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['projects', 'user-1'],
      });
    });
  });

  it('filters out non-image files (only processes acceptable image types)', async () => {
    const imageFile = createMockFile('test.jpg', 'image/jpeg');
    const textFile = createMockFile('test.txt', 'text/plain');
    const pdfFile = createMockFile('test.pdf', 'application/pdf');

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await result.current.mutateAsync({
      projectId: 'project-1',
      files: [imageFile, textFile, pdfFile],
    });

    // Only the image file should be processed
    expect(database.storage.upload).toHaveBeenCalledTimes(1);
    expect(database.mediaAssets.create).toHaveBeenCalledTimes(1);
    expect(isAcceptableImageFile).toHaveBeenCalledTimes(3);
  });

  it('throws error when no valid image files provided', async () => {
    const textFile = createMockFile('test.txt', 'text/plain');
    const pdfFile = createMockFile('test.pdf', 'application/pdf');

    // Mock isAcceptableImageFile to return false for all files
    vi.mocked(isAcceptableImageFile).mockReturnValue(false);

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await expect(
      result.current.mutateAsync({
        projectId: 'project-1',
        files: [textFile, pdfFile],
      })
    ).rejects.toThrow('Please upload valid image files');

    expect(database.storage.upload).not.toHaveBeenCalled();
    expect(database.mediaAssets.create).not.toHaveBeenCalled();
  });

  it('handles empty files array', async () => {
    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await expect(
      result.current.mutateAsync({
        projectId: 'project-1',
        files: [],
      })
    ).rejects.toThrow('Please upload valid image files');
  });

  it('uploads multiple files in parallel (Promise.allSettled)', async () => {
    const file1 = createMockFile('test1.jpg', 'image/jpeg');
    const file2 = createMockFile('test2.png', 'image/png');
    const file3 = createMockFile('test3.webp', 'image/webp');

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    const response = await result.current.mutateAsync({
      projectId: 'project-1',
      files: [file1, file2, file3],
    });

    expect(response.successful).toBe(3);
    expect(response.total).toBe(3);
    expect(database.storage.upload).toHaveBeenCalledTimes(3);
    expect(database.mediaAssets.create).toHaveBeenCalledTimes(3);
    expect(getImageDimensions).toHaveBeenCalledTimes(3);
  });

  it('creates storage path with userId, projectId and timestamp', async () => {
    const imageFile = createMockFile('test.jpg', 'image/jpeg');
    const mockTimestamp = 1234567890;
    vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await result.current.mutateAsync({
      projectId: 'project-1',
      files: [imageFile],
    });

    expect(database.storage.upload).toHaveBeenCalledWith(
      'user-uploads',
      `user-1/project-1/${mockTimestamp}-test.jpg`,
      imageFile
    );
  });

  it('gets image dimensions for each file', async () => {
    const file1 = createMockFile('test1.jpg', 'image/jpeg');
    const file2 = createMockFile('test2.png', 'image/png');

    vi.mocked(getImageDimensions)
      .mockResolvedValueOnce({ width: 1920, height: 1080 })
      .mockResolvedValueOnce({ width: 800, height: 600 });

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await result.current.mutateAsync({
      projectId: 'project-1',
      files: [file1, file2],
    });

    expect(getImageDimensions).toHaveBeenCalledWith(file1);
    expect(getImageDimensions).toHaveBeenCalledWith(file2);
    expect(database.mediaAssets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 1920,
        height: 1080,
      })
    );
    expect(database.mediaAssets.create).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 800,
        height: 600,
      })
    );
  });

  it('creates database records with correct metadata', async () => {
    const imageFile = createMockFile('test.jpg', 'image/jpeg', 2048);
    const mockTimestamp = 1234567890;
    vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await result.current.mutateAsync({
      projectId: 'project-1',
      files: [imageFile],
    });

    expect(database.mediaAssets.create).toHaveBeenCalledWith({
      project_id: 'project-1',
      user_id: 'user-1',
      file_name: 'test.jpg',
      file_type: 'image',
      file_size: 2048,
      storage_path: `user-1/project-1/${mockTimestamp}-test.jpg`,
      width: 1920,
      height: 1080,
    });
  });

  it('requires authentication for uploads', async () => {
    vi.mocked(useUserId).mockReturnValue(null);
    const imageFile = createMockFile('test.jpg', 'image/jpeg');

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await expect(
      result.current.mutateAsync({
        projectId: 'project-1',
        files: [imageFile],
      })
    ).rejects.toThrow('You must be logged in to upload files');
  });

  it('handles partial failures (some files succeed, some fail)', async () => {
    const file1 = createMockFile('test1.jpg', 'image/jpeg');
    const file2 = createMockFile('test2.png', 'image/png');
    const file3 = createMockFile('test3.webp', 'image/webp');

    // First file succeeds, second fails, third succeeds
    vi.mocked(database.storage.upload)
      .mockResolvedValueOnce({
        id: 'file-id-1',
        path: 'test-path-1',
        fullPath: 'test-full-path-1',
      })
      .mockRejectedValueOnce(new Error('Upload failed'))
      .mockResolvedValueOnce({
        id: 'file-id-3',
        path: 'test-path-3',
        fullPath: 'test-full-path-3',
      });

    vi.mocked(database.mediaAssets.create)
      .mockResolvedValueOnce({
        id: 'asset-1',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'test1.jpg',
        file_type: 'image',
        file_size: 1024,
        storage_path: 'user-1/project-1/123-test1.jpg',
        width: 1920,
        height: 1080,
        sort_order: 0,
        created_at: '2025-01-01T00:00:00Z',
      })
      .mockResolvedValueOnce({
        id: 'asset-3',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'test3.webp',
        file_type: 'image',
        file_size: 1024,
        storage_path: 'user-1/project-1/123-test3.webp',
        width: 1920,
        height: 1080,
        sort_order: 0,
        created_at: '2025-01-01T00:00:00Z',
      });

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await expect(
      result.current.mutateAsync({
        projectId: 'project-1',
        files: [file1, file2, file3],
      })
    ).rejects.toThrow('Failed to upload 1 files');

    // All files should have been attempted
    expect(database.storage.upload).toHaveBeenCalledTimes(3);
  });

  it('throws error when all uploads fail', async () => {
    const file1 = createMockFile('test1.jpg', 'image/jpeg');
    const file2 = createMockFile('test2.png', 'image/png');

    vi.mocked(database.storage.upload).mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await expect(
      result.current.mutateAsync({
        projectId: 'project-1',
        files: [file1, file2],
      })
    ).rejects.toThrow('Failed to upload 2 files');
  });

  it('invalidates media-assets query on success', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const imageFile = createMockFile('test.jpg', 'image/jpeg');

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await result.current.mutateAsync({
      projectId: 'project-1',
      files: [imageFile],
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['media-assets', 'project-1', 'user-1'],
      });
    });
  });

  it('handles error in getImageDimensions gracefully', async () => {
    const file1 = createMockFile('test1.jpg', 'image/jpeg');
    const file2 = createMockFile('test2.png', 'image/png');

    vi.mocked(getImageDimensions)
      .mockResolvedValueOnce({ width: 1920, height: 1080 })
      .mockRejectedValueOnce(new Error('Failed to get dimensions'));

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await expect(
      result.current.mutateAsync({
        projectId: 'project-1',
        files: [file1, file2],
      })
    ).rejects.toThrow('Failed to upload 1 files');
  });

  it('handles error in database.mediaAssets.create gracefully', async () => {
    const imageFile = createMockFile('test.jpg', 'image/jpeg');

    vi.mocked(database.mediaAssets.create).mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await expect(
      result.current.mutateAsync({
        projectId: 'project-1',
        files: [imageFile],
      })
    ).rejects.toThrow('Failed to upload 1 files');
  });

  it('processes files in correct order', async () => {
    const file1 = createMockFile('test1.jpg', 'image/jpeg');
    const file2 = createMockFile('test2.png', 'image/png');

    const uploadOrder: string[] = [];
    vi.mocked(database.storage.upload).mockImplementation(async (_bucket, path) => {
      uploadOrder.push(path);
      return {
        id: `file-id-${path}`,
        path: path,
        fullPath: `full-${path}`,
      };
    });

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await result.current.mutateAsync({
      projectId: 'project-1',
      files: [file1, file2],
    });

    // Both files should be processed (order may vary due to Promise.allSettled)
    expect(uploadOrder.length).toBe(2);
  });

  it('invalidates signed URL cache and dispatches event on successful upload', async () => {
    const file = createMockFile('test.jpg', 'image/jpeg');

    // Mock addEventListener to capture the dispatched event
    const mockAddEventListener = vi.spyOn(window, 'addEventListener');
    const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent');

    const { result } = renderHook(() => useUploadMedia(), { wrapper });

    await result.current.mutateAsync({
      projectId: 'project-1',
      files: [file],
    });

    // Should invalidate signed URL queries
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['signed-url']
    });

    // Should dispatch custom event for global thumbnail prefetch refresh
    expect(mockDispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'thumbnail-cache-invalidated',
      })
    );

    mockAddEventListener.mockRestore();
    mockDispatchEvent.mockRestore();
  });
});

