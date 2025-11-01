import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFile, downloadBulkAsZip } from '../../lib/download';
import JSZip from 'jszip';

// Mock JSZip
vi.mock('jszip', () => {
  return {
    default: vi.fn(() => ({
      file: vi.fn(),
      generateAsync: vi.fn().mockResolvedValue(new Blob(['zip-content'], { type: 'application/zip' })),
    })),
  };
});

describe('download', () => {
  beforeEach(() => {
    // Mock DOM APIs
    global.fetch = vi.fn();
    global.window = {
      URL: {
        createObjectURL: vi.fn((blob) => `blob:${blob.type}`),
        revokeObjectURL: vi.fn(),
      },
    } as unknown as Window & typeof globalThis;

    global.document = {
      createElement: vi.fn((tag) => {
        if (tag === 'a') {
          return {
            href: '',
            download: '',
            click: vi.fn(),
          } as unknown as HTMLAnchorElement;
        }
        return {};
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      } as unknown as HTMLBodyElement,
    } as unknown as Document;

    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadFile', () => {
    it('successfully downloads a file', async () => {
      const mockBlob = new Blob(['file content'], { type: 'text/plain' });
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      global.document.createElement = vi.fn(() => mockLink);

      await downloadFile('https://example.com/file.txt', 'file.txt');

      expect(global.fetch).toHaveBeenCalledWith('https://example.com/file.txt');
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.download).toBe('file.txt');
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('handles fetch errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
        blob: vi.fn(),
      });

      await expect(downloadFile('https://example.com/missing.txt', 'missing.txt')).rejects.toThrow(
        'Failed to fetch file: Not Found'
      );
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      global.fetch = vi.fn().mockRejectedValue(networkError);

      await expect(downloadFile('https://example.com/file.txt', 'file.txt')).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith('Error downloading file:', networkError);
    });

    it('handles blob creation errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockRejectedValue(new Error('Blob error')),
      });

      await expect(downloadFile('https://example.com/file.txt', 'file.txt')).rejects.toThrow();
    });
  });

  describe('downloadBulkAsZip', () => {
    it('successfully downloads multiple files as ZIP', async () => {
      const mockBlob1 = new Blob(['file1'], { type: 'text/plain' });
      const mockBlob2 = new Blob(['file2'], { type: 'text/plain' });

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          blob: vi.fn().mockResolvedValue(mockBlob1),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: vi.fn().mockResolvedValue(mockBlob2),
        });

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      global.document.createElement = vi.fn(() => mockLink);

      const mockZipInstance = {
        file: vi.fn(),
        generateAsync: vi.fn().mockResolvedValue(new Blob(['zip'], { type: 'application/zip' })),
      };

      // @ts-expect-error - JSZip constructor
      JSZip.mockReturnValue(mockZipInstance);

      const onProgress = vi.fn();

      await downloadBulkAsZip(
        [
          { url: 'https://example.com/file1.txt', filename: 'file1.txt' },
          { url: 'https://example.com/file2.txt', filename: 'file2.txt' },
        ],
        'archive',
        onProgress
      );

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(mockZipInstance.file).toHaveBeenCalledWith('file1.txt', mockBlob1);
      expect(mockZipInstance.file).toHaveBeenCalledWith('file2.txt', mockBlob2);
      expect(onProgress).toHaveBeenCalledWith(1, 2);
      expect(onProgress).toHaveBeenCalledWith(2, 2);
      expect(mockLink.download).toBe('archive.zip');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('throws error when no items provided', async () => {
      await expect(downloadBulkAsZip([], 'archive')).rejects.toThrow('No items to download');
    });

    it('continues downloading other files if one fails', async () => {
      const mockBlob = new Blob(['file1'], { type: 'text/plain' });

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          statusText: 'Not Found',
          blob: vi.fn(),
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: vi.fn().mockResolvedValue(mockBlob),
        });

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      global.document.createElement = vi.fn(() => mockLink);

      const mockZipInstance = {
        file: vi.fn(),
        generateAsync: vi.fn().mockResolvedValue(new Blob(['zip'], { type: 'application/zip' })),
      };

      // @ts-expect-error - JSZip constructor
      JSZip.mockReturnValue(mockZipInstance);

      await downloadBulkAsZip(
        [
          { url: 'https://example.com/missing.txt', filename: 'missing.txt' },
          { url: 'https://example.com/file1.txt', filename: 'file1.txt' },
        ],
        'archive'
      );

      expect(console.warn).toHaveBeenCalledWith('Failed to fetch missing.txt: Not Found');
      expect(mockZipInstance.file).toHaveBeenCalledTimes(1);
      expect(mockZipInstance.file).toHaveBeenCalledWith('file1.txt', mockBlob);
    });

    it('handles fetch errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      global.document.createElement = vi.fn(() => mockLink);

      const mockZipInstance = {
        file: vi.fn(),
        generateAsync: vi.fn().mockResolvedValue(new Blob(['zip'], { type: 'application/zip' })),
      };

      // @ts-expect-error - JSZip constructor
      JSZip.mockReturnValue(mockZipInstance);

      await downloadBulkAsZip(
        [{ url: 'https://example.com/file.txt', filename: 'file.txt' }],
        'archive'
      );

      expect(console.error).toHaveBeenCalledWith('Error fetching file.txt:', expect.any(Error));
      // Should still create ZIP even if file fetch failed
      expect(mockZipInstance.generateAsync).toHaveBeenCalled();
    });

    it('handles ZIP generation errors', async () => {
      const mockBlob = new Blob(['file1'], { type: 'text/plain' });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      const mockZipInstance = {
        file: vi.fn(),
        generateAsync: vi.fn().mockRejectedValue(new Error('ZIP generation failed')),
      };

      // @ts-expect-error - JSZip constructor
      JSZip.mockReturnValue(mockZipInstance);

      await expect(
        downloadBulkAsZip([{ url: 'https://example.com/file.txt', filename: 'file.txt' }], 'archive')
      ).rejects.toThrow('ZIP generation failed');

      expect(console.error).toHaveBeenCalledWith('Error creating ZIP file:', expect.any(Error));
    });

    it('calls onProgress callback during download', async () => {
      const mockBlob = new Blob(['file1'], { type: 'text/plain' });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        blob: vi.fn().mockResolvedValue(mockBlob),
      });

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      global.document.createElement = vi.fn(() => mockLink);

      const mockZipInstance = {
        file: vi.fn(),
        generateAsync: vi.fn().mockResolvedValue(new Blob(['zip'], { type: 'application/zip' })),
      };

      // @ts-expect-error - JSZip constructor
      JSZip.mockReturnValue(mockZipInstance);

      const onProgress = vi.fn();

      await downloadBulkAsZip(
        [
          { url: 'https://example.com/file1.txt', filename: 'file1.txt' },
          { url: 'https://example.com/file2.txt', filename: 'file2.txt' },
        ],
        'archive',
        onProgress
      );

      expect(onProgress).toHaveBeenCalledWith(1, 2);
      expect(onProgress).toHaveBeenCalledWith(2, 2);
    });
  });
});

