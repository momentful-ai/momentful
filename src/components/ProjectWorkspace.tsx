import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Image as ImageIcon, Film, Grid3x3, List, Video, Download, Share2 } from 'lucide-react';
import { Project, MediaAsset, EditedImage, GeneratedVideo } from '../types';
import { supabase } from '../lib/supabase';
import { FileUpload } from './FileUpload';
import { MediaLibrary } from './MediaLibrary';
import { VideoGenerator } from './VideoGenerator';
import { ExportModal } from './ExportModal';
import { PublishModal } from './PublishModal';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ProjectWorkspaceProps {
  project: Project;
  onBack: () => void;
}

export function ProjectWorkspace({ project, onBack }: ProjectWorkspaceProps) {
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

  const loadProjectData = async () => {
    try {
      setLoading(true);

      const [mediaResult, editedResult, videosResult] = await Promise.all([
        supabase
          .from('media_assets')
          .select('*')
          .eq('project_id', project.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('edited_images')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('generated_videos')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false }),
      ]);

      if (mediaResult.error) throw mediaResult.error;
      if (editedResult.error) throw editedResult.error;
      if (videosResult.error) throw videosResult.error;

      setMediaAssets(mediaResult.data || []);
      setEditedImages(editedResult.data || []);
      setGeneratedVideos(videosResult.data || []);
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
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">{project.name}</h2>
            {project.description && (
              <p className="text-muted-foreground text-base">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => setShowVideoGenerator(true)}
              variant="default"
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
            <div className="flex gap-1 overflow-x-auto">
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
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />
                  )}
                </button>
              ))}
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
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              {activeTab === 'media' && (
                <MediaLibrary
                  projectId={project.id}
                  onRefresh={refreshKey}
                />
              )}
              {activeTab === 'edited' && (
                <EditedImagesView
                  images={editedImages}
                  viewMode={viewMode}
                  onExport={(image) => setExportAsset({ id: image.id, type: 'image', url: image.edited_url })}
                  onPublish={(image) => setPublishAsset({ id: image.id, type: 'image' })}
                />
              )}
              {activeTab === 'videos' && (
                <GeneratedVideosView
                  videos={generatedVideos}
                  viewMode={viewMode}
                  onExport={(video) => setExportAsset({ id: video.id, type: 'video', url: video.video_url })}
                  onPublish={(video) => setPublishAsset({ id: video.id, type: 'video' })}
                />
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

function EditedImagesView({
  images,
  viewMode,
  onExport,
  onPublish,
}: {
  images: EditedImage[];
  viewMode: 'grid' | 'list';
  onExport: (image: EditedImage) => void;
  onPublish: (image: EditedImage) => void;
}) {
  if (images.length === 0) {
    return (
      <Card className="border-2 border-dashed p-12 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-3">
          No edited images yet
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          Use AI to edit your product images with text prompts and context.
        </p>
      </Card>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
      {images.map((image) => (
        <Card key={image.id} className="group overflow-hidden hover-lift hover-glow">
          <div className="aspect-square bg-muted relative">
            <img
              src={image.edited_url}
              alt="Edited"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                onClick={() => onExport(image)}
                size="icon"
                variant="secondary"
                className="glass shadow-lg h-9 w-9"
                title="Export image"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onPublish(image)}
                size="icon"
                variant="secondary"
                className="glass shadow-lg h-9 w-9"
                title="Publish to social"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm font-medium mb-2 line-clamp-2">
              {image.prompt}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Badge variant="secondary">{image.ai_model}</Badge>
              <span>{new Date(image.created_at).toLocaleDateString()}</span>
            </div>
            {image.context && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                {image.context}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function GeneratedVideosView({
  videos,
  viewMode,
  onExport,
  onPublish,
}: {
  videos: GeneratedVideo[];
  viewMode: 'grid' | 'list';
  onExport: (video: GeneratedVideo) => void;
  onPublish: (video: GeneratedVideo) => void;
}) {
  if (videos.length === 0) {
    return (
      <Card className="border-2 border-dashed p-12 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Film className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-3">
          No generated videos yet
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto text-lg">
          Create professional marketing videos from your edited images.
        </p>
      </Card>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-2'}>
      {videos.map((video) => (
        <Card key={video.id} className="group overflow-hidden hover-lift hover-glow">
          <div className="aspect-video bg-black relative">
            <video
              src={video.video_url}
              controls
              className="w-full h-full"
            />
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                onClick={() => onExport(video)}
                size="icon"
                variant="secondary"
                className="glass shadow-lg h-9 w-9"
                title="Export video"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => onPublish(video)}
                size="icon"
                variant="secondary"
                className="glass shadow-lg h-9 w-9"
                title="Publish to social"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="gap-1">
                <Film className="w-3 h-3" />
                {video.duration}s
              </Badge>
              <Badge variant="outline">{video.aspect_ratio}</Badge>
            </div>
            {video.prompt && (
              <p className="text-sm font-medium mb-2 line-clamp-2">
                {video.prompt}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{video.ai_model}</span>
              <span>{new Date(video.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
