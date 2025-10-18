import { useState, useRef, useEffect } from 'react';
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
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
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
  }, [isResizing]);

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
    <div className="min-h-screen bg-background flex flex-col animate-fade-in">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Project</span>
            </button>
            <div className="h-6 w-px bg-border" />
            <h2 className="text-lg font-semibold text-foreground">Image Editor</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-all hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!showComparison}
              className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            >
              Save to Project
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-card flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              {!showComparison ? (
                <div className="aspect-video bg-muted rounded-xl flex items-center justify-center animate-fade-in">
                  <img
                    src={getAssetUrl(asset.storage_path)}
                    alt={asset.file_name}
                    className="w-full h-full object-contain rounded-xl transition-transform hover:scale-105"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 animate-fade-in">
                  <div>
                    <div className="mb-2 text-sm font-medium text-muted-foreground">
                      Original
                    </div>
                    <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                      <img
                        src={getAssetUrl(asset.storage_path)}
                        alt="Original"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-medium text-muted-foreground">
                      AI Edited
                    </div>
                    <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
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

          <div className="border-t border-border bg-card p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Wand2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Using {selectedModelInfo?.name}
                </span>
              </div>

              <div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe how you want to edit this image... For example: 'Add a gradient background' or 'Make the product pop with vibrant colors'"
                  className="w-full h-24 px-4 py-3 bg-background text-foreground placeholder-muted-foreground border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Optional context about the image..."
                  className="flex-1 px-4 py-3 bg-background text-foreground placeholder-muted-foreground border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95 whitespace-nowrap"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
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
              Choose the best AI model for your editing needs
            </p>

            <div className="space-y-2">
              {imageModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                    selectedModel === model.id
                      ? 'border-primary bg-primary/10 scale-105'
                      : 'border-border hover:border-border/70'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-foreground">
                      {model.name}
                    </span>
                    {selectedModel === model.id && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">{model.provider}</p>
                </button>
              ))}
            </div>
          </div>

          {versions.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-foreground">Version History</h4>
              </div>
              <div className="space-y-2">
                {versions.map((version, index) => (
                  <div
                    key={index}
                    className="bg-muted rounded-lg p-3 text-xs animate-slide-up hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">
                        Version {versions.length - index}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(version.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-1">{version.prompt}</p>
                    <p className="text-muted-foreground/70">
                      Model: {imageModels.find((m) => m.id === version.model)?.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
