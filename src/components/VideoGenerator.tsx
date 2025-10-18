import { useState, useEffect } from 'react';
import { X, Play, ArrowLeft, Sparkles, Film, Plus, GripVertical, Trash2 } from 'lucide-react';
import { EditedImage, MediaAsset } from '../types';
import { videoModels } from '../data/aiModels';

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
  const [selectedModel, setSelectedModel] = useState(videoModels[0].id);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  const [sceneType, setSceneType] = useState('product-showcase');
  const [cameraMovement, setCameraMovement] = useState('static');
  const [selectedSources, setSelectedSources] = useState<SelectedSource[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);

  const handleGenerate = async () => {
    if (selectedSources.length === 0) return;

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    setIsGenerating(false);
  };

  const removeSource = (id: string) => {
    setSelectedSources((prev) => prev.filter((s) => s.id !== id));
  };

  const selectedModelInfo = videoModels.find((m) => m.id === selectedModel);
  const canGenerate = selectedSources.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
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
              onClick={onSave}
              disabled={!isGenerating}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Save to Project
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-slate-800 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div
              className={`bg-slate-700 rounded-xl flex items-center justify-center ${
                aspectRatio === '16:9' ? 'aspect-video' :
                aspectRatio === '9:16' ? 'aspect-[9/16] max-w-md mx-auto' :
                aspectRatio === '1:1' ? 'aspect-square max-w-2xl mx-auto' :
                'aspect-[4/5] max-w-xl mx-auto'
              }`}
            >
              <div className="text-center">
                <Film className="w-24 h-24 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">
                  {isGenerating ? 'Generating your video...' : 'Video preview will appear here'}
                </p>
              </div>
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
                      className="relative aspect-square bg-slate-700 rounded-lg overflow-hidden group"
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

        <aside className="w-96 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
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
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedModel === model.id
                      ? 'border-blue-500 bg-blue-50'
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
            <h3 className="font-semibold text-slate-900 mb-4">Source Media</h3>
            <button
              onClick={() => setShowSourceSelector(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Images or Clips</span>
            </button>
            {selectedSources.length === 0 && (
              <p className="text-xs text-red-600 mt-2">
                At least one edited image or video clip is required
              </p>
            )}
          </div>

          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Aspect Ratio</h3>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    aspectRatio === ratio.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900 mb-1">
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
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    sceneType === scene.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900 mb-1">
                    {scene.label}
                  </div>
                  <div className="text-xs text-slate-600">
                    {scene.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Camera Movement</h3>
            <div className="space-y-2">
              {CAMERA_MOVEMENTS.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setCameraMovement(camera.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    cameraMovement === camera.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium text-slate-900 mb-1">
                    {camera.label}
                  </div>
                  <div className="text-xs text-slate-600">
                    {camera.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
            {!canGenerate && (
              <p className="text-xs text-slate-500 text-center mt-2">
                Add source media to generate video
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
