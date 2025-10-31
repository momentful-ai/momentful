import { useState, useRef, useEffect } from 'react';
import { Wand2, ArrowLeft, Sparkles, History, Crop } from 'lucide-react';
import { MediaAsset } from '../types';
import { imageModels } from '../data/aiModels';
import { database } from '../lib/database';
import { useUserId } from '../hooks/useUserId';
import { useToast } from '../hooks/useToast';
import {
  createRunwayImageJob,
  pollJobStatus,
  extractImageUrl,
} from '../services/aiModels/runway/api-client';

// Aspect ratio options for image generation - mapped to Runway SDK ratios
const ASPECT_RATIOS = [
  { id: '1280:720', label: '16:9', description: 'Landscape (YouTube, Web)', runwayRatio: '1280:720' },
  { id: '720:1280', label: '9:16', description: 'Portrait (TikTok, Stories)', runwayRatio: '720:1280' },
  { id: '1024:1024', label: '1:1', description: 'Square (Instagram Feed)', runwayRatio: '1024:1024' },
  { id: '1920:1080', label: '16:9 (HD)', description: 'Full HD Landscape', runwayRatio: '1920:1080' },
  { id: '1080:1920', label: '9:16 (HD)', description: 'Full HD Portrait', runwayRatio: '1080:1920' },
] as const;

interface ImageEditorProps {
  asset: MediaAsset;
  projectId: string;
  onClose: () => void;
  onSave: () => void;
}

export function ImageEditor({ asset, projectId, onClose, onSave }: ImageEditorProps) {
  const userId = useUserId();
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useState(imageModels[0].id);
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<string>(ASPECT_RATIOS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [generatedStoragePath, setGeneratedStoragePath] = useState<string | null>(null);
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
    return database.storage.getPublicUrl('user-uploads', storagePath);
  };

  /**
   * Get image dimensions from a URL
   */
  const getImageDimensionsFromUrl = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  /**
   * Download image from URL and upload to Supabase storage
   */
  const downloadAndUploadImage = async (
    imageUrl: string,
    projectId: string
  ): Promise<{ storagePath: string; width: number; height: number }> => {
    if (!userId) {
      throw new Error('User ID is required to upload images');
    }

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const timestamp = Date.now();
    const fileName = `edited-${timestamp}.png`;
    // Use standardized path format: userId/projectId/filename
    const storagePath = `${userId}/${projectId}/${fileName}`;

    // Convert blob to File
    const file = new File([blob], fileName, { type: 'image/png' });

    // Upload to Supabase storage
    await database.storage.upload('user-uploads', storagePath, file);

    // Get image dimensions
    const { width, height } = await getImageDimensionsFromUrl(imageUrl);

    return { storagePath, width, height };
  };

  /**
   * Build enhanced prompt for product image generation
   */
  const buildEnhancedPrompt = (userPrompt: string, context: string): string => {
    let enhancedPrompt = userPrompt.trim();

    // Add context if provided
    if (context.trim()) {
      enhancedPrompt = `${context.trim()}. ${enhancedPrompt}`;
    }

    // Append enhancement instructions for product images
    enhancedPrompt += '. Remove background clutter, create studio-quality lighting, professional product photography, white background, sharp focus';

    return enhancedPrompt;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setShowComparison(false);
    setEditedImageUrl(null);
    setGeneratedStoragePath(null);

    try {
      // Only Runway Gen-4 Turbo is currently implemented
      if (selectedModel !== 'runway-gen4-turbo') {
        showToast(`${selectedModel} is not yet implemented. Please use Runway Gen-4 Turbo.`, 'warning');
        setIsGenerating(false);
        return;
      }

      if (!userId) {
        showToast('User must be logged in to generate images', 'error');
        setIsGenerating(false);
        return;
      }

      // Get source image URL
      const imageUrl = getAssetUrl(asset.storage_path);

      // Build enhanced prompt
      const enhancedPrompt = buildEnhancedPrompt(prompt, context);

      showToast('Starting image generation...', 'info');

      // Get the Runway ratio from selected aspect ratio
      const selectedRatioOption = ASPECT_RATIOS.find((r) => r.id === selectedRatio);
      const runwayRatio = selectedRatioOption?.runwayRatio || ASPECT_RATIOS[0].runwayRatio;

      // Create Runway image generation job
      const { taskId } = await createRunwayImageJob({
        mode: 'image-generation',
        promptImage: imageUrl,
        promptText: enhancedPrompt,
        model: 'gen4_image_turbo',
        ratio: runwayRatio,
      });

      // Poll for completion
      showToast('Generating image...', 'info');
      const result = await pollJobStatus(
        taskId,
        (status, progress) => {
          if (progress !== undefined) {
            showToast(`Generating... ${progress}%`, 'info');
          } else {
            showToast(`Status: ${status}`, 'info');
          }
        },
        60, // maxAttempts
        2000 // intervalMs
      );

      // Extract image URL from response
      const generatedImageUrl = extractImageUrl(result);
      if (!generatedImageUrl) {
        throw new Error('Failed to extract image URL from Runway response');
      }

      showToast('Image generated! Uploading...', 'info');

      // Download and upload to storage
      const { storagePath } = await downloadAndUploadImage(
        generatedImageUrl,
        projectId
      );

      // Update state with new image
      const uploadedImageUrl = getAssetUrl(storagePath);
      setEditedImageUrl(uploadedImageUrl);
      setGeneratedStoragePath(storagePath);
      setShowComparison(true);

      // Add to version history
      setVersions([
        {
          prompt,
          model: selectedModel,
          timestamp: new Date().toISOString(),
        },
        ...versions,
      ]);

      showToast('Image generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate image. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      showToast('User must be logged in to save images', 'error');
      return;
    }

    if (!generatedStoragePath || !editedImageUrl) {
      showToast('Please generate an image before saving', 'warning');
      return;
    }

    try {
      // Get dimensions from the generated image
      const { width, height } = await getImageDimensionsFromUrl(editedImageUrl);

      // Parse context safely - handle empty string and invalid JSON
      let parsedContext = {};
      if (context && typeof context === 'string') {
        try {
          const trimmed = context.trim();
          if (trimmed) {
            parsedContext = JSON.parse(trimmed);
          }
        } catch {
          // If JSON parsing fails, treat context as a plain string and wrap it
          parsedContext = { text: context };
        }
      } else if (context && typeof context === 'object') {
        parsedContext = context;
      }

      await database.editedImages.create({
        project_id: projectId,
        user_id: userId,
        source_asset_id: asset.id,
        prompt,
        context: parsedContext,
        ai_model: selectedModel,
        storage_path: generatedStoragePath,
        width,
        height,
      });

      showToast('Image saved successfully', 'success');
      onSave();
    } catch (error) {
      console.error('Error saving edited image:', error);
      showToast('Failed to save edited image. Please try again.', 'error');
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

            <div className="space-y-1.5">
              {imageModels.map((model) => (
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
            <div className="flex items-center gap-2 mb-2">
              <Crop className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Aspect Ratio</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Choose the output aspect ratio for your edited image
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  onClick={() => setSelectedRatio(ratio.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all hover:scale-[1.02] ${
                    selectedRatio === ratio.id
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
