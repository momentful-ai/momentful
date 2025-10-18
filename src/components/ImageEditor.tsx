import { useState } from 'react';
import { X, Wand2, ArrowLeft, Sparkles, ImageIcon } from 'lucide-react';
import { MediaAsset } from '../types';
import { imageModels } from '../data/aiModels';

interface ImageEditorProps {
  asset: MediaAsset;
  projectId: string;
  onClose: () => void;
  onSave: () => void;
}

export function ImageEditor({ asset, projectId, onClose, onSave }: ImageEditorProps) {
  const [selectedModel, setSelectedModel] = useState(imageModels[0].id);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsGenerating(false);
    setShowComparison(true);
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
              onClick={onSave}
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
                {asset.thumbnail_url ? (
                  <img
                    src={asset.thumbnail_url}
                    alt={asset.file_name}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <ImageIcon className="w-24 h-24 text-slate-500" />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-400">
                    Original
                  </div>
                  <div className="aspect-square bg-slate-700 rounded-xl flex items-center justify-center">
                    {asset.thumbnail_url ? (
                      <img
                        src={asset.thumbnail_url}
                        alt="Original"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <ImageIcon className="w-16 h-16 text-slate-500" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium text-slate-400">
                    AI Edited
                  </div>
                  <div className="aspect-square bg-slate-700 rounded-xl flex items-center justify-center">
                    {asset.thumbnail_url ? (
                      <img
                        src={asset.thumbnail_url}
                        alt="Edited"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    ) : (
                      <ImageIcon className="w-16 h-16 text-slate-500" />
                    )}
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
