import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Image as ImageIcon, Film, Grid3x3, List } from 'lucide-react';
import { Project, MediaAsset, EditedImage, GeneratedVideo } from '../types';
import { supabase } from '../lib/supabase';
import { FileUpload } from './FileUpload';
import { MediaLibrary } from './MediaLibrary';

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
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{project.name}</h2>
            {project.description && (
              <p className="text-slate-600 mt-1">{project.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
          >
            <Upload className="w-5 h-5" />
            Upload Media
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <div className="flex items-center justify-between px-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                    {tab.count}
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-1 border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
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
                <EditedImagesView images={editedImages} viewMode={viewMode} />
              )}
              {activeTab === 'videos' && (
                <GeneratedVideosView videos={generatedVideos} viewMode={viewMode} />
              )}
            </>
          )}
        </div>
      </div>

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
    </div>
  );
}

function MediaLibraryView({
  assets,
  viewMode,
  projectId,
}: {
  assets: MediaAsset[];
  viewMode: 'grid' | 'list';
  projectId: string;
}) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No media uploaded yet
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Upload your product images or videos to get started with AI editing and video generation.
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map((asset) => (
          <MediaAssetCard key={asset.id} asset={asset} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {assets.map((asset) => (
        <MediaAssetRow key={asset.id} asset={asset} />
      ))}
    </div>
  );
}

function MediaAssetCard({ asset }: { asset: MediaAsset }) {
  return (
    <div className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
      {asset.thumbnail_url ? (
        <img
          src={asset.thumbnail_url}
          alt={asset.file_name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          {asset.file_type === 'video' ? (
            <Film className="w-8 h-8 text-slate-400" />
          ) : (
            <ImageIcon className="w-8 h-8 text-slate-400" />
          )}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white text-sm font-medium truncate">
            {asset.file_name}
          </p>
        </div>
      </div>
    </div>
  );
}

function MediaAssetRow({ asset }: { asset: MediaAsset }) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
      <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
        {asset.thumbnail_url ? (
          <img
            src={asset.thumbnail_url}
            alt={asset.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            {asset.file_type === 'video' ? (
              <Film className="w-6 h-6 text-slate-400" />
            ) : (
              <ImageIcon className="w-6 h-6 text-slate-400" />
            )}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{asset.file_name}</p>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="capitalize">{asset.file_type}</span>
          <span>{formatFileSize(asset.file_size)}</span>
          {asset.width && asset.height && (
            <span>{asset.width} × {asset.height}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EditedImagesView({
  images,
  viewMode,
}: {
  images: EditedImage[];
  viewMode: 'grid' | 'list';
}) {
  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No edited images yet
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Use AI to edit your product images with text prompts and context.
        </p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-2'}>
      {images.map((image) => (
        <div key={image.id} className="group relative bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-square bg-slate-100">
            <img
              src={image.edited_url}
              alt="Edited"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-slate-900 mb-1 line-clamp-2">
              {image.prompt}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{image.ai_model}</span>
              <span>{new Date(image.created_at).toLocaleDateString()}</span>
            </div>
            {image.context && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                {image.context}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function GeneratedVideosView({
  videos,
  viewMode,
}: {
  videos: GeneratedVideo[];
  viewMode: 'grid' | 'list';
}) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Film className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No generated videos yet
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          Create professional marketing videos from your edited images.
        </p>
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-2'}>
      {videos.map((video) => (
        <div key={video.id} className="aspect-video bg-slate-100 rounded-lg" />
      ))}
    </div>
  );
}
