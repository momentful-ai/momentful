import { useState, useEffect } from 'react';
import { X, Play, ArrowLeft, Sparkles, Film, Plus, GripVertical, Trash2, Check } from 'lucide-react';
import { EditedImage, MediaAsset } from '../types';
import { videoModels } from '../data/aiModels';
import { supabase } from '../lib/supabase';
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
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSources();
  }, [projectId]);

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
    const { data } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(storagePath);
    return data.publicUrl;
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

      const { error } = await supabase
        .from('generated_videos')
        .insert({
          project_id: projectId,
          user_id: userId,
          video_url: dummyVideoUrl,
          prompt,
          aspect_ratio: aspectRatio,
          scene_type: sceneType,
          camera_movement: cameraMovement,
          duration,
          ai_model: selectedModel,
          model_provider: selectedModelInfo?.provider || '',
          source_asset_ids: sourceIds,
        });

      if (error) throw error;
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

  const canGenerate = selectedSources.length > 0;
  const selectedModelInfo = videoModels.find((m) => m.id === selectedModel);

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col animate-fade-in">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Project</span>
            </button>
            <div className="h-6 w-px bg-slate-700" />
            <h2 className="text-lg font-semibold text-white">Video Generator</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!generatedVideoUrl}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Save to Project
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-slate-800 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <div
                className={`bg-slate-700 rounded-xl flex items-center justify-center animate-fade-in ${
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
                    <Film className="w-24 h-24 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">
                      {isGenerating ? 'Generating your video...' : 'Video preview will appear here'}
                    </p>
                  </div>
                )}
              </div>

              {selectedSources.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">
                    Source Media ({selectedSources.length})
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {selectedSources.map((source, index) => (
                      <div
                        key={source.id}
                        className="relative aspect-square bg-slate-700 rounded-lg overflow-hidden group animate-scale-in hover:scale-105 transition-transform"
                      >
                        {source.thumbnail ? (
                          <img
                            src={source.thumbnail}
                            alt={source.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Film className="w-8 h-8 text-slate-500" />
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
                        <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-700 bg-slate-800 p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-slate-300">
                  Using {selectedModelInfo?.name} • {sceneType.replace('-', ' ')} • {cameraMovement.replace('-', ' ')}
                </span>
              </div>

              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your video vision... For example: 'Create a dynamic product showcase with smooth transitions' or 'Show the product in a lifestyle setting with upbeat energy'"
                  className="w-full h-24 px-4 py-3 bg-slate-700 text-white placeholder-slate-400 border border-slate-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSourceSelector(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Media ({selectedSources.length})</span>
                </button>

                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
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
                <p className="text-xs text-red-400 text-center">
                  Add at least one image or clip to generate video
                </p>
              )}
            </div>
          </div>
        </div>

        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900">AI Model</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Choose the best AI model for your video
            </p>

            <div className="space-y-2">
              {videoModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedModel === model.id
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-slate-900">
                      {model.name}
                    </span>
                    {selectedModel === model.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{model.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{model.provider}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Aspect Ratio</h3>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all hover:scale-105 ${
                    aspectRatio === ratio.id
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900 text-sm mb-1">
                    {ratio.label}
                  </div>
                  <div className="text-xs text-slate-600">
                    {ratio.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Scene Type</h3>
            <div className="space-y-2">
              {SCENE_TYPES.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => setSceneType(scene.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    sceneType === scene.id
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900 text-sm mb-1">
                    {scene.label}
                  </div>
                  <div className="text-xs text-slate-600">
                    {scene.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Camera Movement</h3>
            <div className="space-y-2">
              {CAMERA_MOVEMENTS.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setCameraMovement(camera.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    cameraMovement === camera.id
                      ? 'border-blue-500 bg-blue-50 scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900 text-sm mb-1">
                    {camera.label}
                  </div>
                  <div className="text-xs text-slate-600">
                    {camera.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {showSourceSelector && (
        <SourceSelectorModal
          editedImages={editedImages}
          mediaAssets={mediaAssets}
          selectedSources={selectedSources}
          onSelectSource={(source) => {
            if (!selectedSources.find((s) => s.id === source.id)) {
              setSelectedSources([...selectedSources, source]);
            }
          }}
          onClose={() => setShowSourceSelector(false)}
          getAssetUrl={getAssetUrl}
        />
      )}
    </div>
  );
}

interface SourceSelectorModalProps {
  editedImages: EditedImage[];
  mediaAssets: MediaAsset[];
  selectedSources: SelectedSource[];
  onSelectSource: (source: SelectedSource) => void;
  onClose: () => void;
  getAssetUrl: (path: string) => string;
}

function SourceSelectorModal({
  editedImages,
  mediaAssets,
  selectedSources,
  onSelectSource,
  onClose,
  getAssetUrl,
}: SourceSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<'edited' | 'original'>('edited');

  const isSelected = (id: string) => selectedSources.some((s) => s.id === id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col animate-scale-in shadow-2xl">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Select Source Media</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all hover:rotate-90 duration-200"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <p className="text-slate-600 mt-1">
            Choose edited images or original media to include in your video
          </p>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex gap-1 px-6">
            <button
              onClick={() => setActiveTab('edited')}
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'edited'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Edited Images ({editedImages.length})
              {activeTab === 'edited' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`px-4 py-3 font-medium text-sm transition-colors relative ${
                activeTab === 'original'
                  ? 'text-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Original Media ({mediaAssets.length})
              {activeTab === 'original' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'edited' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {editedImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => {
                    onSelectSource({
                      id: image.id,
                      type: 'edited_image',
                      thumbnail: image.edited_url,
                      name: image.prompt.substring(0, 30),
                    });
                    onClose();
                  }}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    isSelected(image.id)
                      ? 'border-blue-500 ring-2 ring-blue-500 scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={image.edited_url}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                  />
                  {isSelected(image.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'original' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {mediaAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => {
                    onSelectSource({
                      id: asset.id,
                      type: 'media_asset',
                      thumbnail: getAssetUrl(asset.storage_path),
                      name: asset.file_name,
                    });
                    onClose();
                  }}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    isSelected(asset.id)
                      ? 'border-blue-500 ring-2 ring-blue-500 scale-105'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={getAssetUrl(asset.storage_path)}
                    alt={asset.file_name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected(asset.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
