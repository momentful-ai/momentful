import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { ArrowLeft, Upload, Grid3x3, List, Video, Pencil, Check, X, Download } from 'lucide-react';
import { Project, MediaAsset, EditedImage, GeneratedVideo } from '../../types';
import { TimelineNode as TimelineNodeType } from '../../types/timeline';
import { database } from '../../lib/database';
import { MediaLibrary } from '../MediaLibrary/MediaLibrary';
import { EditedImagesView } from './EditedImagesView';
import { GeneratedVideosView } from './GeneratedVideosView';
import { TimelineView } from './TimelineView';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { ConfirmDialog } from '../ConfirmDialog';
import { mergeName } from '../../lib/utils';
import { downloadBulkAsZip, downloadFileByStoragePath } from '../../lib/download';
import { ACCEPTABLE_IMAGE_TYPES, isAcceptableImageFile } from '../../lib/media';
import { useToast } from '../../hooks/useToast';
import { useSignedUrls } from '../../hooks/useSignedUrls';
import { useMediaAssets } from '../../hooks/useMediaAssets';
import { useEditedImages } from '../../hooks/useEditedImages';
import { useGeneratedVideos } from '../../hooks/useGeneratedVideos';
import { handleStorageError, validateStoragePath } from '../../lib/storage-utils';
import { useTimelinesByProject } from '../../hooks/useTimeline';
import { useUploadMedia } from '../../hooks/useUploadMedia';
import { useUserId } from '../../hooks/useUserId';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteMediaAsset } from '../../hooks/useDeleteMediaAsset';
import { useDeleteEditedImage } from '../../hooks/useDeleteEditedImage';

// Memoized components to prevent unnecessary re-renders
const MemoizedMediaLibrary = memo(MediaLibrary);
const MemoizedEditedImagesView = memo(EditedImagesView);
const MemoizedGeneratedVideosView = memo(GeneratedVideosView);

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
  onUpdateProject?: (project: Project) => void;
  onEditImage?: (asset: MediaAsset | EditedImage, projectId: string) => void;
  onGenerateVideo?: (projectId: string, imageId?: string) => void;
  defaultTab?: 'media' | 'edited' | 'videos';
  onMounted?: () => void;
}

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 50 * 1024 * 1024;

function ProjectWorkspaceComponent({ project, onBack, onUpdateProject, onEditImage, onGenerateVideo, defaultTab = 'media', onMounted }: ProjectWorkspaceProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [currentProject, setCurrentProject] = useState(project);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'media' | 'edited' | 'videos' | 'timeline'>('media');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [timelineItemToDelete, setTimelineItemToDelete] = useState<{ item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType; type: string } | null>(null);
  const { showToast } = useToast();
  const signedUrls = useSignedUrls();
  const userId = useUserId();
  const uploadMutation = useUploadMedia();
  const queryClient = useQueryClient();
  const deleteMediaAssetMutation = useDeleteMediaAsset();
  const deleteEditedImageMutation = useDeleteEditedImage();

  // Use React Query hooks with lazy loading based on active tab
  // React Query shares cache between queries with the same key, so enabling all queries
  // for counts won't cause duplicate fetches - they'll use the same cache entry.
  // With localStorage persistence, cached data is available immediately on mount.
  const { data: mediaAssets = [] } = useMediaAssets(project.id, { enabled: activeTab === 'media' });
  const { data: editedImages = [] } = useEditedImages(project.id, { enabled: activeTab === 'edited' });
  const { data: generatedVideos = [] } = useGeneratedVideos(project.id, { enabled: activeTab === 'videos' });
  const { data: lineages = [] } = useTimelinesByProject(project.id, { enabled: true });

  // Load counts for all tabs - these queries share cache with the active tab queries above
  // They'll use cached data immediately and won't refetch if data is fresh (staleTime: 5min)
  const { data: mediaAssetsForCount = [] } = useMediaAssets(project.id, { enabled: true });
  const { data: editedImagesForCount = [] } = useEditedImages(project.id, { enabled: true });
  const { data: generatedVideosForCount = [] } = useGeneratedVideos(project.id, { enabled: true });

  useEffect(() => {
    setCurrentProject(project);
    setEditedName(project.name);
  }, [project]);

  useEffect(() => {
    // Update active tab when defaultTab prop changes
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    // Notify parent when component is mounted/remounted
    onMounted?.();
  }, [onMounted]);

  const handleStartEdit = useCallback(() => {
    setIsEditingName(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const handleSaveName = useCallback(async () => {
    if (editedName.trim() && editedName !== currentProject.name && userId) {
      try {
        await database.projects.update(currentProject.id, userId, { name: editedName.trim() });
        const updatedProject = { ...currentProject, name: editedName.trim() };
        setCurrentProject(updatedProject);
        onUpdateProject?.(updatedProject);
        // Invalidate the projects query cache to ensure all components show the updated name
        await queryClient.invalidateQueries({ queryKey: ['projects', userId] });
      } catch (error) {
        console.error('Error updating project name:', error);
        setEditedName(currentProject.name);
      }
    }
    setIsEditingName(false);
  }, [editedName, currentProject, onUpdateProject, userId, queryClient]);

  const handleCancelEdit = useCallback(() => {
    setEditedName(currentProject.name);
    setIsEditingName(false);
  }, [currentProject.name]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveName, handleCancelEdit]);

  const handleTabClick = useCallback((tabId: 'media' | 'edited' | 'videos' | 'timeline') => {
    setActiveTab(tabId);
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  const handleShowVideoGenerator = useCallback(() => {
    onGenerateVideo?.(project.id);
  }, [onGenerateVideo, project.id]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const filesArray = Array.from(files);
    
    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of filesArray) {
      const isImage = isAcceptableImageFile(file);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

      if (!isImage && !isVideo) {
        errors.push(`${file.name}: File type not supported`);
        continue;
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        errors.push(`${file.name}: Image exceeds 50MB limit`);
        continue;
      }

      if (isVideo && file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Video exceeds 100MB limit`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      errors.forEach(error => showToast(error, 'error'));
    }

    if (validFiles.length === 0) {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      // Separate images and videos
      const imageFiles = validFiles.filter(isAcceptableImageFile);
      const videoFiles = validFiles.filter(f => ALLOWED_VIDEO_TYPES.includes(f.type));

      // Upload images using the hook
      if (imageFiles.length > 0) {
        await uploadMutation.mutateAsync({ projectId: project.id, files: imageFiles });
      }

      // Upload videos directly (since hook only handles images)
      if (videoFiles.length > 0 && userId) {
        for (const file of videoFiles) {
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.name}`;
          const storagePath = `${userId}/${project.id}/${fileName}`;

          // Validate storage path
          const pathValidation = validateStoragePath(userId, storagePath);
          if (!pathValidation.valid) {
            throw new Error(`Storage path validation failed: ${pathValidation.error}`);
          }

          try {
            await database.storage.upload('user-uploads', storagePath, file);
          } catch (error) {
            const errorResult = handleStorageError(error, 'video upload');
            throw new Error(errorResult.error);
          }

          // Get video dimensions
          const video = document.createElement('video');
          const videoUrl = URL.createObjectURL(file);
          await new Promise<void>((resolve, reject) => {
            video.onloadedmetadata = () => {
              database.mediaAssets.create({
                project_id: project.id,
                user_id: userId,
                file_name: file.name,
                file_type: 'video',
                file_size: file.size,
                storage_path: storagePath,
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration,
              }).then(() => {
                URL.revokeObjectURL(videoUrl);
                resolve();
              }).catch(reject);
            };
            video.onerror = reject;
            video.src = videoUrl;
          });
        }
        // Invalidate media assets query after video uploads
        await queryClient.invalidateQueries({ queryKey: ['media-assets', project.id, userId] });
        // Invalidate timeline cache to refresh timeline with new video
        await queryClient.invalidateQueries({ queryKey: ['timelines', project.id, userId] });
      }

      showToast(`Successfully uploaded ${validFiles.length} file(s)`, 'success');
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload files. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [project.id, userId, uploadMutation, queryClient, showToast]);

  const handleExportImage = useCallback(async (image: EditedImage) => {
    try {
      const filename = `edited-image-${image.id}.png`;
      await downloadFileByStoragePath(image.storage_path, filename, 'user-uploads');
      showToast(`Downloaded ${filename}`, 'success');
    } catch (error) {
      console.error('Error downloading image:', error);
      showToast('Failed to download image. Please try again.', 'error');
    }
  }, [showToast]);

  const handleExportVideo = useCallback(async (video: GeneratedVideo) => {
    if (!video.storage_path) {
      showToast('Video is not available for download', 'error');
      return;
    }
    try {
      const filename = `${video.name || `video-${video.id}`}.mp4`;
      await downloadFileByStoragePath(video.storage_path, filename, 'generated-videos');
      showToast(`Downloaded ${filename}`, 'success');
    } catch (error) {
      console.error('Error downloading video:', error);
      showToast('Failed to download video. Please try again.', 'error');
    }
  }, [showToast]);

  // Handle timeline item download
  const handleTimelineDownload = useCallback(async (item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => {
    try {
      // Extract the actual item from TimelineNode if needed
      let actualItem: MediaAsset | EditedImage | GeneratedVideo;
      if ('type' in item && 'data' in item) {
        actualItem = item.data;
      } else {
        actualItem = item;
      }

      if ('file_type' in actualItem) {
        // MediaAsset
        await downloadFileByStoragePath(actualItem.storage_path, actualItem.file_name, 'user-uploads');
        showToast(`Downloaded ${actualItem.file_name}`, 'success');
      } else if ('edited_url' in actualItem) {
        // EditedImage
        const filename = `edited-image-${actualItem.id}.png`;
        await downloadFileByStoragePath(actualItem.storage_path, filename, 'user-uploads');
        showToast(`Downloaded ${filename}`, 'success');
      } else if ('storage_path' in actualItem && actualItem.storage_path) {
        // GeneratedVideo
        const filename = `${(actualItem as GeneratedVideo).name || `video-${actualItem.id}`}.mp4`;
        await downloadFileByStoragePath(actualItem.storage_path, filename, 'generated-videos');
        showToast(`Downloaded ${filename}`, 'success');
      } else {
        showToast('Item is not available for download', 'error');
      }
    } catch (error) {
      console.error('Error downloading timeline item:', error);
      showToast('Failed to download item. Please try again.', 'error');
    }
  }, [showToast]);

  // Handle timeline item delete - set item to confirm deletion
  const handleTimelineDelete = useCallback((item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => {
    // Extract the actual item from TimelineNode if needed
    let actualItem: MediaAsset | EditedImage | GeneratedVideo;
    let itemType: string;
    if ('type' in item && 'data' in item) {
      actualItem = item.data;
      itemType = item.type;
    } else {
      actualItem = item;
      if ('file_type' in actualItem) {
        itemType = 'media_asset';
      } else if ('edited_url' in actualItem) {
        itemType = 'edited_image';
      } else {
        itemType = 'generated_video';
      }
    }

    setTimelineItemToDelete({ item: actualItem, type: itemType });
  }, []);

  const confirmTimelineDelete = useCallback(() => {
    if (!timelineItemToDelete) return;

    const { item, type } = timelineItemToDelete;

    if (type === 'media_asset' && 'file_type' in item) {
      // MediaAsset
      deleteMediaAssetMutation.mutate(
        {
          assetId: item.id,
          storagePath: item.storage_path,
          projectId: project.id,
        },
        {
          onSuccess: () => {
            showToast('Asset deleted successfully', 'success');
          },
          onError: () => {
            showToast('Failed to delete asset. Please try again.', 'error');
          },
        }
      );
    } else if (type === 'edited_image' && 'edited_url' in item) {
      // EditedImage
      deleteEditedImageMutation.mutate(
        {
          imageId: item.id,
          storagePath: item.storage_path,
          projectId: project.id,
        },
        {
          onSuccess: () => {
            showToast('Image deleted successfully', 'success');
          },
          onError: () => {
            showToast('Failed to delete image. Please try again.', 'error');
          },
        }
      );
    } else {
      showToast('Delete not supported for this item type', 'error');
    }

    setTimelineItemToDelete(null);
  }, [timelineItemToDelete, project.id, deleteMediaAssetMutation, deleteEditedImageMutation, showToast]);

  // Handle timeline edit image - same logic as EditedImagesView
  const handleTimelineEditImage = useCallback((item: MediaAsset | EditedImage) => {
    if (!onEditImage) return;

    // Pass the item directly to onEditImage, same as EditedImagesView
    onEditImage(item, project.id);
  }, [onEditImage, project.id]);

  const handleDownloadAllMedia = useCallback(async () => {
    if (mediaAssets.length === 0) return;

    setIsDownloadingAll(true);
    try {
      const items = await Promise.all(mediaAssets.map(async (asset) => ({
        url: await signedUrls.getSignedUrl('user-uploads', asset.storage_path),
        filename: asset.file_name,
      })));

      await downloadBulkAsZip(items, `${currentProject.name}-media-library`, (current, total) => {
        showToast(`Downloading ${current}/${total} files...`, 'info');
      });

      showToast(`Downloaded ${mediaAssets.length} files as ${currentProject.name}-media-library.zip`, 'success');
    } catch (error) {
      console.error('Error downloading all media:', error);
      showToast('Failed to download files. Please try again.', 'error');
    } finally {
      setIsDownloadingAll(false);
    }
  }, [mediaAssets, signedUrls, currentProject.name, showToast]);

  const handleDownloadAllEdited = useCallback(async () => {
    if (editedImages.length === 0) return;

    setIsDownloadingAll(true);
    try {
      const items = await Promise.all(editedImages.map(async (image) => ({
        url: await database.storage.getSignedUrl('user-uploads', image.storage_path),
        filename: `edited-${image.id}.png`,
      })));

      await downloadBulkAsZip(items, `${currentProject.name}-edited-images`, (current, total) => {
        showToast(`Downloading ${current}/${total}...`, 'info');
      });

      showToast(`Downloaded ${editedImages.length} files as ${currentProject.name}-edited-images.zip`, 'success');
    } catch (error) {
      console.error('Error downloading all edited images:', error);
      showToast('Failed to download files. Please try again.', 'error');
    } finally {
      setIsDownloadingAll(false);
    }
  }, [editedImages, currentProject.name, showToast]);

  const handleDownloadAllVideos = useCallback(async () => {
    const completedVideos = generatedVideos.filter((video) => video.status === 'completed' && video.storage_path);
    if (completedVideos.length === 0) {
      showToast('No completed videos available to download', 'info');
      return;
    }

    setIsDownloadingAll(true);
    try {
      const items = await Promise.all(completedVideos.map(async (video) => {
        // Check if it's already a full URL (external) or needs signed URL
        let url: string;
        if (video.storage_path!.startsWith('http')) {
          url = video.storage_path!;
        } else {
          url = await database.storage.getSignedUrl('generated-videos', video.storage_path!);
        }
        return {
          url,
          filename: `${video.name || `video-${video.id}`}.mp4`,
        };
      }));

      await downloadBulkAsZip(items, `${currentProject.name}-videos`, (current, total) => {
        showToast(`Downloading ${current}/${total} videos...`, 'info');
      });

      showToast(`Downloaded ${completedVideos.length} videos as ${currentProject.name}-videos.zip`, 'success');
    } catch (error) {
      console.error('Error downloading all videos:', error);
      showToast('Failed to download videos. Please try again.', 'error');
    } finally {
      setIsDownloadingAll(false);
    }
  }, [generatedVideos, currentProject.name, showToast]);

  const getCurrentTabDownloadHandler = useCallback(() => {
    switch (activeTab) {
      case 'media':
        return handleDownloadAllMedia;
      case 'edited':
        return handleDownloadAllEdited;
      case 'videos':
        return handleDownloadAllVideos;
      default:
        return undefined;
    }
  }, [activeTab, handleDownloadAllMedia, handleDownloadAllEdited, handleDownloadAllVideos]);

  const getCurrentTabCount = useCallback(() => {
    switch (activeTab) {
      case 'media':
        return mediaAssets.length;
      case 'edited':
        return editedImages.length;
      case 'videos':
        return generatedVideos.filter((v) => v.status === 'completed' && v.storage_path).length;
      default:
        return 0;
    }
  }, [activeTab, mediaAssets.length, editedImages.length, generatedVideos]);

  const tabCounts = useMemo(() => ({
    media: mediaAssetsForCount.length,
    edited: editedImagesForCount.length,
    videos: generatedVideosForCount.length,
  }), [mediaAssetsForCount.length, editedImagesForCount.length, generatedVideosForCount.length]);

  const tabs = useMemo(() => [
    { id: 'media' as const, label: 'Media Library', count: tabCounts.media },
    { id: 'edited' as const, label: 'Edited Images', count: tabCounts.edited },
    { id: 'videos' as const, label: 'Generated Videos', count: tabCounts.videos },
    { id: 'timeline' as const, label: 'Timeline', count: lineages.length },
  ], [tabCounts, lineages.length]);

  return (
    <div>
      <div className="mb-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 gap-2 -ml-2 hover:translate-x-[-4px] transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 group">
              {isEditingName ? (
                <>
                  <input
                    ref={inputRef}
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 px-3 py-2 text-3xl sm:text-4xl font-bold bg-background border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    maxLength={100}
                  />
                  <Button
                    onClick={handleSaveName}
                    variant="ghost"
                    size="icon"
                    className="text-green-600 hover:text-green-700 hover:bg-green-100"
                  >
                    <Check className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </>
              ) : (
                <>
                  <h2 className="text-3xl sm:text-4xl font-bold">{currentProject.name}</h2>
                  <Button
                    onClick={handleStartEdit}
                    variant="ghost"
                    size="icon"
                    className="opacity-50 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    title="Edit project name"
                  >
                    <Pencil className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
            {currentProject.description && (
              <p className="text-muted-foreground text-base">{currentProject.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={handleShowVideoGenerator}
              variant="gradient"
              size="lg"
              className="flex-1 sm:flex-initial gap-2"
            >
              <Video className="w-5 h-5" />
              Generate Video
            </Button>
            <Button
              onClick={handleUploadClick}
              variant="gradient"
              size="lg"
              className="flex-1 sm:flex-initial gap-2"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Media
                </>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={[...ACCEPTABLE_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="border-b">
          <div className="flex items-center justify-between px-6">
            <div className="flex-1 flex items-center gap-4 overflow-x-auto">
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id as 'media' | 'edited' | 'videos' | 'timeline')}
                    className={mergeName(
                      'px-4 py-4 font-medium text-sm transition-all relative whitespace-nowrap',
                      activeTab === tab.id
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab.label}
                    <Badge variant="secondary" className="ml-2">
                      {tab.count}
                    </Badge>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary animate-slide-in-right" />
                    )}
                  </button>
                ))}
              </div>
              {activeTab === 'media' && (
                <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground/60 ml-auto mr-4">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Drag images below to upload</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getCurrentTabCount() > 0 && getCurrentTabDownloadHandler() && (
                <Button
                  onClick={getCurrentTabDownloadHandler()}
                  variant="secondary"
                  size="sm"
                  disabled={isDownloadingAll}
                  className="glass gap-2"
                >
                  {isDownloadingAll ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download All</span>
                      <Badge variant="secondary" className="ml-1">
                        {getCurrentTabCount()}
                      </Badge>
                    </>
                  )}
                </Button>
              )}
              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  onClick={() => handleViewModeChange('grid')}
                  variant="ghost"
                  size="icon"
                  className={mergeName(
                    'h-8 w-8',
                    viewMode === 'grid' && 'bg-muted'
                  )}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleViewModeChange('list')}
                  variant="ghost"
                  size="icon"
                  className={mergeName(
                    'h-8 w-8',
                    viewMode === 'list' && 'bg-muted'
                  )}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
              {activeTab === 'media' && (
                <div key="media-tab" className="animate-fade-in">
                  <MemoizedMediaLibrary
                    projectId={project.id}
                    onEditImage={onEditImage}
                    viewMode={viewMode}
                  />
                </div>
              )}
              {activeTab === 'edited' && (
                <div key="edited-tab" className="animate-fade-in">
                  <MemoizedEditedImagesView
                    projectId={project.id}
                    viewMode={viewMode}
                    onExport={handleExportImage}
                    onEditImage={onEditImage}
                  />
                </div>
              )}
              {activeTab === 'videos' && (
                <div key="videos-tab" className="animate-fade-in">
                  <MemoizedGeneratedVideosView
                    projectId={project.id}
                    viewMode={viewMode}
                    onExport={handleExportVideo}
                  />
                </div>
          )}
          {activeTab === 'timeline' && (
            <div key="timeline-tab" className="animate-fade-in">
              <TimelineView
                projectId={project.id}
                viewMode={viewMode}
                onEditImage={handleTimelineEditImage}
                onDownload={handleTimelineDownload}
                onDelete={handleTimelineDelete}
              />
            </div>
          )}
        </div>
      </Card>

      {timelineItemToDelete && (
        <ConfirmDialog
          title="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmTimelineDelete}
          onCancel={() => setTimelineItemToDelete(null)}
        />
      )}
    </div>
  );
}

export const ProjectWorkspace = memo(ProjectWorkspaceComponent);
