import { useState } from 'react';
import { X, Wand2, ArrowLeft, Sparkles, ImageIcon, History } from 'lucide-react';
import { MediaAsset } from '../types';
import { imageModels } from '../data/aiModels';
import { supabase } from '../lib/supabase';
import { useUserId } from '../hooks/useUserId';

interface ImageEditorProps {
  asset: MediaAsset;
  projectId: string;
  onClose: () => void;
  onSave: () => void;
}

export function ImageEditor({ asset, projectId, onClose, onSave }: ImageEditorProps) {
  const userId = useUserId();
  const [selectedModel, setSelectedModel] = useState(imageModels[0].id);
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [versions, setVersions] = useState<Array<{ prompt: string; model: string; timestamp: string }>>([]);

  const getAssetUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    setEditedImageUrl(getAssetUrl(asset.storage_path));
    setShowComparison(true);

    setVersions([
      {
        prompt,
        model: selectedModel,
        timestamp: new Date().toISOString(),
      },
      ...versions,
    ]);

    setIsGenerating(false);
  };

  const handleSave = async () => {
    try {
      const selectedModelInfo = imageModels.find((m) => m.id === selectedModel);

      const { error } = await supabase
        .from('edited_images')
        .insert({
          project_id: projectId,
          user_id: userId,
          original_asset_id: asset.id,
          edited_url: editedImageUrl || getAssetUrl(asset.storage_path),
          prompt,
          context: context || null,
          ai_model: selectedModel,
          model_provider: selectedModelInfo?.provider || '',
        });

      if (error) throw error;

      onSave();
    } catch (error) {
      console.error('Error saving edited image:', error);
      alert('Failed to save edited image. Please try again.');
    }
  };

  const selectedModelInfo = imageModels.find((m) => m.id === selectedModel);

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
            <h2 className="text-lg font-semibold text-white">Image Editor</h2>
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
              disabled={!showComparison}
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
            {!showComparison ? (
              <div className="aspect-video bg-slate-700 rounded-xl flex items-center justify-center">
                <img
                  src={getAssetUrl(asset.storage_path)}
                  alt={asset.file_name}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-400">
                    Original
                  </div>
                  <div className="aspect-square bg-slate-700 rounded-xl flex items-center justify-center">
                    <img
                      src={getAssetUrl(asset.storage_path)}
                      alt="Original"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-400">
                    AI Edited
                  </div>
                  <div className="aspect-square bg-slate-700 rounded-xl flex items-center justify-center">
                    <img
                      src={editedImageUrl || getAssetUrl(asset.storage_path)}
                      alt="Edited"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="w-96 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900">AI Model</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Choose the best AI model for your editing needs
            </p>

            <div className="space-y-2">
              {imageModels.map((model) => (
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

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Editing Instructions
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe how you want to edit this image... For example: 'Add a gradient background' or 'Make the product pop with vibrant colors'"
                className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-2">
                Be specific about the changes you want to make to the image
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Context (Optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Add context about the image... For example: 'This is a product photo for an e-commerce listing' or 'This will be used in social media ads'"
                className="w-full h-20 px-4 py-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-2">
                Help the AI understand the purpose and usage of this image
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Wand2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">
                    Using {selectedModelInfo?.name}
                  </h4>
                  <p className="text-sm text-blue-700">
                    {selectedModelInfo?.description}
                  </p>
                </div>
              </div>
            </div>

            {versions.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-slate-600" />
                  <h4 className="text-sm font-medium text-slate-900">Version History</h4>
                </div>
                <div className="space-y-2">
                  {versions.map((version, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 rounded-lg p-3 text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-900">
                          Version {versions.length - index}
                        </span>
                        <span className="text-slate-500">
                          {new Date(version.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-1">{version.prompt}</p>
                      <p className="text-slate-500">
                        Model: {imageModels.find((m) => m.id === version.model)?.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Generate Edited Image</span>
                </>
              )}
            </button>
            {!prompt.trim() && (
              <p className="text-xs text-slate-500 text-center mt-2">
                Enter editing instructions to generate
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
