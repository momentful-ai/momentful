import { useState, useEffect, useRef } from 'react';
import { X, Play, ArrowLeft, Sparkles, Film, GripVertical, Trash2, Check, Upload } from 'lucide-react';
import { EditedImage, MediaAsset } from '../types';
import { videoModels } from '../data/aiModels';
import { database } from '../lib/database';
import { useUserId } from '../hooks/useUserId';

interface VideoGeneratorProps {
  projectId: string;
  onClose: () => void;
  onSave: () => void;
}

interface SelectedSource {
  id: string;
  type: 'edited_image' | 'media_asset';
  thumbnail?: string;
  name: string;
}

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', description: 'Landscape (YouTube, Web)' },
  { id: '9:16', label: '9:16', description: 'Portrait (TikTok, Stories)' },
  { id: '1:1', label: '1:1', description: 'Square (Instagram Feed)' },
  { id: '4:5', label: '4:5', description: 'Portrait (Instagram)' },
] as const;

const SCENE_TYPES = [
  { id: 'product-showcase', label: 'Product Showcase', description: 'Highlight features and details' },
  { id: 'lifestyle', label: 'Lifestyle', description: 'Show product in real-life context' },
  { id: 'story-driven', label: 'Story-Driven', description: 'Narrative-focused presentation' },
  { id: 'comparison', label: 'Comparison', description: 'Before/after or side-by-side' },
];

const CAMERA_MOVEMENTS = [
  { id: 'static', label: 'Static', description: 'No camera movement' },
  { id: 'zoom-in', label: 'Zoom In', description: 'Gradual zoom toward subject' },
  { id: 'zoom-out', label: 'Zoom Out', description: 'Gradual zoom away from subject' },
  { id: 'pan-left', label: 'Pan Left', description: 'Horizontal movement to the left' },
  { id: 'pan-right', label: 'Pan Right', description: 'Horizontal movement to the right' },
  { id: 'dynamic', label: 'Dynamic', description: 'AI-driven intelligent movement' },
];

export function VideoGenerator({ projectId, onClose, onSave }: VideoGeneratorProps) {
  const userId = useUserId();
  const [selectedModel, setSelectedModel] = useState(videoModels[0].id);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  const [sceneType, setSceneType] = useState('product-showcase');
  const [cameraMovement, setCameraMovement] = useState('static');
  const [duration, setDuration] = useState(5);
  const [prompt, setPrompt] = useState('');
  const [selectedSources, setSelectedSources] = useState<SelectedSource[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const [leftPanelTab, setLeftPanelTab] = useState<'edited' | 'library'>('edited');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'add' | 'remove'>('add');
  const selectionStartRef = useRef<{ id: string; type: 'edited_image' | 'media_asset' } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadSources();
  }, [projectId]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 250 && newWidth <= 600) {
          setSidebarWidth(newWidth);
        }
      }
      if (isResizingLeft) {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 400) {
          setLeftPanelWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setIsResizingLeft(false);
    };

    if (isResizing || isResizingLeft) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, isResizingLeft]);

  const loadSources = async () => {
    try {
      const [editedResult, mediaResult] = await Promise.all([
        supabase
          .from('edited_images')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('media_assets')
          .select('*')
          .eq('project_id', projectId)
          .eq('file_type', 'image')
          .order('created_at', { ascending: false }),
      ]);

      if (editedResult.error) throw editedResult.error;
      if (mediaResult.error) throw mediaResult.error;

      setEditedImages(editedResult.data || []);
      setMediaAssets(mediaResult.data || []);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssetUrl = (storagePath: string) => {
    return database.storage.getPublicUrl('user-uploads', storagePath);
  };

  const handleGenerate = async () => {
    if (selectedSources.length === 0) return;

    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 5000));

    const dummyVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    setGeneratedVideoUrl(dummyVideoUrl);

    try {
      const selectedModelInfo = videoModels.find((m) => m.id === selectedModel);
      const sourceIds = selectedSources.map((s) => s.id).join(',');

      await database.generatedVideos.create({
        project_id: projectId,
        user_id: userId,
        name: prompt || 'Untitled Video',
        ai_model: selectedModel,
        aspect_ratio: aspectRatio,
        scene_type: sceneType,
        camera_movement: cameraMovement,
      });
    } catch (error) {
      console.error('Error saving video:', error);
    }

    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!generatedVideoUrl) return;
    onSave();
  };

  const removeSource = (id: string) => {
    setSelectedSources(selectedSources.filter((s) => s.id !== id));
  };

  const addSource = (source: SelectedSource) => {
    if (!selectedSources.find((s) => s.id === source.id)) {
      setSelectedSources([...selectedSources, source]);
    }
  };

  const handleDragStart = (e: React.DragEvent, source: SelectedSource) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(source));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const source = JSON.parse(e.dataTransfer.getData('application/json')) as SelectedSource;
      addSource(source);
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const handleImageMouseDown = (source: SelectedSource) => {
    const isSelected = selectedSources.find((s) => s.id === source.id);
    setSelectionMode(isSelected ? 'remove' : 'add');
    setIsSelecting(true);
    selectionStartRef.current = { id: source.id, type: source.type };

    if (isSelected) {
      removeSource(source.id);
    } else {
      addSource(source);
    }
  };

  const handleImageMouseEnter = (source: SelectedSource) => {
    if (!isSelecting) return;

    const isSelected = selectedSources.find((s) => s.id === source.id);

    if (selectionMode === 'add' && !isSelected) {
      addSource(source);
    } else if (selectionMode === 'remove' && isSelected) {
      removeSource(source.id);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    selectionStartRef.current = null;
  };

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelecting]);

  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    );

    if (imageFiles.length === 0) {
      return;
    }

    setIsUploading(true);

    for (const file of imageFiles) {
      try {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const storagePath = `${userId}/${projectId}/${fileName}`;

        await database.storage.upload('user-uploads', storagePath, file);

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

        await database.mediaAssets.create({
          project_id: projectId,
          user_id: userId,
          file_name: file.name,
          file_type: 'image',
          file_size: file.size,
          storage_path: storagePath,
          width: img.width,
          height: img.height,
        });
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }

    setIsUploading(false);
    await loadSources();
  };

  const canGenerate = selectedSources.length > 0;
  const selectedModelInfo = videoModels.find((m) => m.id === selectedModel);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Project</span>
            </button>
            <div className="h-6 w-px bg-border" />
            <h2 className="text-lg font-semibold text-foreground">Video Generator</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!generatedVideoUrl}
              className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg font-medium transition-colors"
            >
              Save to Project
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Media Library */}
        <aside
          ref={leftPanelRef}
          style={{ width: `${leftPanelWidth}px` }}
          className="bg-card border-r border-border flex flex-col overflow-hidden relative"
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors z-10"
            onMouseDown={() => setIsResizingLeft(true)}
          />

          {/* Tabs */}
          <div className="border-b border-border">
            <div className="flex">
              <button
                onClick={() => setLeftPanelTab('edited')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  leftPanelTab === 'edited'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Edited Images
                {leftPanelTab === 'edited' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setLeftPanelTab('library')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                  leftPanelTab === 'library'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Library
                {leftPanelTab === 'library' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto p-4 relative"
            style={{ userSelect: 'none' }}
            onDragOver={handleFileDragOver}
            onDragLeave={handleFileDragLeave}
            onDrop={handleFileDrop}
          >
            {isDraggingFile && (
              <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10 m-4">
                <div className="text-center">
                  <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
                  <p className="text-primary font-medium">Drop images here to upload</p>
                </div>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20 m-4 rounded-lg">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-foreground font-medium">Uploading...</p>
                </div>
              </div>
            )}
            {leftPanelTab === 'edited' ? (
              <div className="grid grid-cols-2 gap-2">
                {editedImages.map((image) => {
                  const source: SelectedSource = {
                    id: image.id,
                    type: 'edited_image',
                    thumbnail: image.edited_url,
                    name: image.prompt.substring(0, 30),
                  };
                  return (
                    <div
                      key={image.id}
                      draggable={!isSelecting}
                      onDragStart={(e) => !isSelecting && handleDragStart(e, source)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleImageMouseDown(source);
                      }}
                      onMouseEnter={() => handleImageMouseEnter(source)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                        selectedSources.find((s) => s.id === image.id)
                          ? 'border-primary ring-2 ring-primary'
                          : 'border-border'
                      }`}
                    >
                      <img
                        src={image.edited_url}
                        alt={image.prompt}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      {selectedSources.find((s) => s.id === image.id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {editedImages.length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground text-sm mb-2">No edited images yet</p>
                    <p className="text-xs text-muted-foreground/70">Drag and drop images here to upload</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {mediaAssets.map((asset) => {
                  const source: SelectedSource = {
                    id: asset.id,
                    type: 'media_asset',
                    thumbnail: getAssetUrl(asset.storage_path),
                    name: asset.file_name,
                  };
                  return (
                    <div
                      key={asset.id}
                      draggable={!isSelecting}
                      onDragStart={(e) => !isSelecting && handleDragStart(e, source)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleImageMouseDown(source);
                      }}
                      onMouseEnter={() => handleImageMouseEnter(source)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                        selectedSources.find((s) => s.id === asset.id)
                          ? 'border-primary ring-2 ring-primary'
                          : 'border-border'
                      }`}
                    >
                      <img
                        src={getAssetUrl(asset.storage_path)}
                        alt={asset.file_name}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                      {selectedSources.find((s) => s.id === asset.id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {mediaAssets.length === 0 && (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground text-sm mb-2">No library images yet</p>
                    <p className="text-xs text-muted-foreground/70">Drag and drop images here to upload</p>
                  </div>
                )}
              </div>
            )}

            {/* Upload hint */}
            {(editedImages.length > 0 || mediaAssets.length > 0) && (
              <div className="px-4 pb-3 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground/70 text-center">
                  Drag images here to upload or drag to canvas to add
                </p>
              </div>
            )}
          </div>
        </aside>

        <div className="flex-1 bg-card flex flex-col"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div
                className={`bg-muted rounded-xl flex items-center justify-center animate-fade-in ${
                  aspectRatio === '16:9' ? 'aspect-video' :
                  aspectRatio === '9:16' ? 'aspect-[9/16] max-w-md mx-auto' :
                  aspectRatio === '1:1' ? 'aspect-square max-w-2xl mx-auto' :
                  'aspect-[4/5] max-w-xl mx-auto'
                }`}
              >
                {generatedVideoUrl ? (
                  <video
                    src={generatedVideoUrl}
                    controls
                    className="w-full h-full rounded-xl"
                  />
                ) : (
                  <div className="text-center">
                    <Film className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {isGenerating ? 'Generating your video...' : 'Video preview will appear here'}
                    </p>
                  </div>
                )}
              </div>

              {selectedSources.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Source Media ({selectedSources.length})
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {selectedSources.map((source, index) => (
                      <div
                        key={source.id}
                        className="relative aspect-square bg-muted rounded-lg overflow-hidden group animate-scale-in hover:scale-105 transition-transform"
                      >
                        {source.thumbnail ? (
                          <img
                            src={source.thumbnail}
                            alt={source.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Film className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => removeSource(source.id)}
                            className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="absolute top-2 left-2 bg-foreground/80 text-background text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-card p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Using {selectedModelInfo?.name} • {sceneType.replace('-', ' ')} • {cameraMovement.replace('-', ' ')}
                </span>
              </div>

              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your video vision... For example: 'Create a dynamic product showcase with smooth transitions' or 'Show the product in a lifestyle setting with upbeat energy'"
                  className="w-full h-24 px-4 py-3 bg-background text-foreground placeholder-muted-foreground border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                      <span>Generating Video...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Generate Video</span>
                    </>
                  )}
                </button>
              </div>

              {!canGenerate && (
                <p className="text-xs text-destructive text-center">
                  Add at least one image or clip to generate video
                </p>
              )}
            </div>
          </div>
        </div>

        <aside
          ref={sidebarRef}
          style={{ width: `${sidebarWidth}px` }}
          className="bg-card border-l border-border flex flex-col overflow-y-auto relative"
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors z-10"
            onMouseDown={() => setIsResizing(true)}
          />
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Model</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the best AI model for your video
            </p>

            <div className="space-y-1.5">
              {videoModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all hover:scale-[1.02] ${
                    selectedModel === model.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm mb-0.5">
                        {model.name}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{model.description}</p>
                    </div>
                    {selectedModel === model.id && (
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-foreground mb-4">Aspect Ratio</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] ${
                    aspectRatio === ratio.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border/70'
                  }`}
                >
                  <div className="font-medium text-foreground text-sm mb-0.5">
                    {ratio.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ratio.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-border">
            <h3 className="font-semibold text-foreground mb-4">Scene Type</h3>
            <div className="space-y-1.5">
              {SCENE_TYPES.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => setSceneType(scene.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all hover:scale-[1.02] ${
                    sceneType === scene.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border/70'
                  }`}
                >
                  <div className="font-medium text-foreground text-sm mb-0.5">
                    {scene.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {scene.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Camera Movement</h3>
            <div className="space-y-1.5">
              {CAMERA_MOVEMENTS.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setCameraMovement(camera.id)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all hover:scale-[1.02] ${
                    cameraMovement === camera.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border/70'
                  }`}
                >
                  <div className="font-medium text-foreground text-sm mb-0.5">
                    {camera.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {camera.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

    </div>
  );
}

