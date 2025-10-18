import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, Grid3x3, List, Video, Pencil, Check, X } from 'lucide-react';
import { Project, MediaAsset, EditedImage, GeneratedVideo } from '../types';
import { database } from '../lib/database';
import { FileUpload } from './FileUpload';
import { MediaLibrary } from './MediaLibrary';
import { VideoGenerator } from './VideoGenerator';
import { ExportModal } from './ExportModal';
import { PublishModal } from './PublishModal';
import { EditedImagesView } from './EditedImagesView';
import { GeneratedVideosView } from './GeneratedVideosView';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
  onUpdateProject?: (project: Project) => void;
  onEditImage?: (asset: MediaAsset, projectId: string) => void;
}

export function ProjectWorkspace({ project, onBack, onUpdateProject, onEditImage }: ProjectWorkspaceProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const [currentProject, setCurrentProject] = useState(project);
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'media' | 'edited' | 'videos'>('media');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [exportAsset, setExportAsset] = useState<{ id: string; type: 'video' | 'image'; url: string } | null>(null);
  const [publishAsset, setPublishAsset] = useState<{ id: string; type: 'video' | 'image' } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadProjectData();
  }, [project.id]);

  useEffect(() => {
    setCurrentProject(project);
    setEditedName(project.name);
  }, [project]);

  const handleStartEdit = () => {
    setIsEditingName(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleSaveName = async () => {
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
  };

  const handleCancelEdit = () => {
    setEditedName(currentProject.name);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const loadProjectData = async () => {
    try {
      setLoading(true);

      const [mediaAssets, editedImages, videos] = await Promise.all([
        database.mediaAssets.list(project.id),
        database.editedImages.list(project.id),
        database.generatedVideos.list(project.id),
      ]);

      setMediaAssets(mediaAssets);
      setEditedImages(editedImages);
      setGeneratedVideos(videos);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'media' as const, label: 'Media Library', count: mediaAssets.length },
    { id: 'edited' as const, label: 'Edited Images', count: editedImages.length },
    { id: 'videos' as const, label: 'Generated Videos', count: generatedVideos.length },
  ];

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
              onClick={() => setShowVideoGenerator(true)}
              variant="gradient"
              size="lg"
              className="flex-1 sm:flex-initial gap-2"
            >
              <Video className="w-5 h-5" />
              Generate Video
            </Button>
            <Button
              onClick={() => setShowUploadModal(true)}
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
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
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
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                onClick={() => setViewMode('grid')}
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  viewMode === 'grid' && 'bg-muted'
                )}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setViewMode('list')}
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8',
                  viewMode === 'list' && 'bg-muted'
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64 animate-fade-in">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {activeTab === 'media' && (
                <div key="media-tab" className="animate-fade-in">
                  <MediaLibrary
                    projectId={project.id}
                    onRefresh={refreshKey}
                    onEditImage={onEditImage}
                    viewMode={viewMode}
                  />
                </div>
              )}
              {activeTab === 'edited' && (
                <div key="edited-tab" className="animate-fade-in">
                  <EditedImagesView
                    images={editedImages}
                    viewMode={viewMode}
                    onExport={(image) => setExportAsset({ id: image.id, type: 'image', url: image.edited_url })}
                    onPublish={(image) => setPublishAsset({ id: image.id, type: 'image' })}
                  />
                </div>
              )}
              {activeTab === 'videos' && (
                <div key="videos-tab" className="animate-fade-in">
                  <GeneratedVideosView
                    videos={generatedVideos}
                    viewMode={viewMode}
                    onExport={(video) => setExportAsset({ id: video.id, type: 'video', url: video.video_url })}
                    onPublish={(video) => setPublishAsset({ id: video.id, type: 'video' })}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {showUploadModal && (
        <FileUpload
          projectId={project.id}
          onUploadComplete={() => {
            setShowUploadModal(false);
            setRefreshKey((prev) => prev + 1);
            loadProjectData();
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
            loadProjectData();
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
