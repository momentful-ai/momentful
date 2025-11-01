import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { ArrowLeft, Upload, Grid3x3, List, Video, Pencil, Check, X, Download } from 'lucide-react';
import { Project, MediaAsset } from '../../types';
import { database } from '../../lib/database';
import { FileUpload } from '../FileUpload';
import { MediaLibrary } from '../MediaLibrary/MediaLibrary';
import { VideoGenerator } from '../VideoGenerator';
import { ExportModal } from '../ExportModal';
import { PublishModal } from '../PublishModal';
import { EditedImagesView } from './EditedImagesView';
import { GeneratedVideosView } from './GeneratedVideosView';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { mergeName } from '../../lib/utils';
import { downloadBulkAsZip } from '../../lib/download';
import { getAssetUrl } from '../../lib/media';
import { useToast } from '../../hooks/useToast';
import { useMediaAssets } from '../../hooks/useMediaAssets';
import { useEditedImages } from '../../hooks/useEditedImages';
import { useGeneratedVideos } from '../../hooks/useGeneratedVideos';

// Memoized components to prevent unnecessary re-renders
const MemoizedMediaLibrary = memo(MediaLibrary);
const MemoizedEditedImagesView = memo(EditedImagesView);
const MemoizedGeneratedVideosView = memo(GeneratedVideosView);

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
  onUpdateProject?: (project: Project) => void;
  onEditImage?: (asset: MediaAsset, projectId: string) => void;
  defaultTab?: 'media' | 'edited' | 'videos';
  onMounted?: () => void;
}

function ProjectWorkspaceComponent({ project, onBack, onUpdateProject, onEditImage, defaultTab = 'media', onMounted }: ProjectWorkspaceProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [currentProject, setCurrentProject] = useState(project);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'media' | 'edited' | 'videos'>(defaultTab);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [exportAsset, setExportAsset] = useState<{ id: string; type: 'video' | 'image'; url: string } | null>(null);
  const [publishAsset, setPublishAsset] = useState<{ id: string; type: 'video' | 'image' } | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const { showToast } = useToast();

  // Use React Query hooks with lazy loading based on active tab
  // React Query shares cache between queries with the same key, so enabling all queries
  // for counts won't cause duplicate fetches - they'll use the same cache entry.
  // With localStorage persistence, cached data is available immediately on mount.
  const { data: mediaAssets = [] } = useMediaAssets(project.id, { enabled: activeTab === 'media' });
  const { data: editedImages = [] } = useEditedImages(project.id, { enabled: activeTab === 'edited' });
  const { data: generatedVideos = [] } = useGeneratedVideos(project.id, { enabled: activeTab === 'videos' });

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
    if (editedName.trim() && editedName !== currentProject.name) {
      try {
        await database.projects.update(currentProject.id, { name: editedName.trim() });
        const updatedProject = { ...currentProject, name: editedName.trim() };
        setCurrentProject(updatedProject);
        onUpdateProject?.(updatedProject);
      } catch (error) {
        console.error('Error updating project name:', error);
        setEditedName(currentProject.name);
      }
    }
    setIsEditingName(false);
  }, [editedName, currentProject, onUpdateProject]);

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

  const handleTabClick = useCallback((tabId: 'media' | 'edited' | 'videos') => {
    setActiveTab(tabId);
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  const handleShowVideoGenerator = useCallback(() => {
    setShowVideoGenerator(true);
  }, []);

  const handleShowUploadModal = useCallback(() => {
    setShowUploadModal(true);
  }, []);

  const handleDownloadAllMedia = useCallback(async () => {
    if (mediaAssets.length === 0) return;

    setIsDownloadingAll(true);
    try {
      const items = mediaAssets.map((asset) => ({
        url: getAssetUrl(asset.storage_path),
        filename: asset.file_name,
      }));

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
  }, [mediaAssets, currentProject.name, showToast]);

  const handleDownloadAllEdited = useCallback(async () => {
    if (editedImages.length === 0) return;

    setIsDownloadingAll(true);
    try {
      const items = editedImages.map((image) => ({
        url: image.edited_url,
        filename: `edited-${image.id}.png`,
      }));

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
      const items = completedVideos.map((video) => ({
        url: video.storage_path!,
        filename: `${video.name || `video-${video.id}`}.mp4`,
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
  ], [tabCounts]);

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
              onClick={handleShowUploadModal}
              variant="gradient"
              size="lg"
              className="flex-1 sm:flex-initial gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Media
            </Button>
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
                    onClick={() => handleTabClick(tab.id)}
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
                    onExport={(image) => setExportAsset({ id: image.id, type: 'image', url: image.edited_url })}
                    onPublish={(image) => setPublishAsset({ id: image.id, type: 'image' })}
                  />
                </div>
              )}
              {activeTab === 'videos' && (
                <div key="videos-tab" className="animate-fade-in">
                  <MemoizedGeneratedVideosView
                projectId={project.id}
                    viewMode={viewMode}
                    onExport={(video) => setExportAsset({ id: video.id, type: 'video', url: video.storage_path || '' })}
                    onPublish={(video) => setPublishAsset({ id: video.id, type: 'video' })}
                  />
                </div>
          )}
        </div>
      </Card>

      {showUploadModal && (
        <FileUpload
          projectId={project.id}
          onUploadComplete={() => {
            setShowUploadModal(false);
            // Cache invalidation handled by useUploadMedia hook
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {showVideoGenerator && (
        <VideoGenerator
          projectId={project.id}
          onClose={() => setShowVideoGenerator(false)}
          onSave={() => {
            setShowVideoGenerator(false);
            // Cache invalidation handled by VideoGenerator
          }}
        />
      )}

      {exportAsset && (
        <ExportModal
          projectId={project.id}
          assetId={exportAsset.id}
          assetType={exportAsset.type}
          assetUrl={exportAsset.url}
          onClose={() => setExportAsset(null)}
        />
      )}

      {publishAsset && (
        <PublishModal
          projectId={project.id}
          assetId={publishAsset.id}
          assetType={publishAsset.type}
          onClose={() => setPublishAsset(null)}
        />
      )}
    </div>
  );
}

export const ProjectWorkspace = memo(ProjectWorkspaceComponent);
