import { useState } from 'react';
import { database } from '../../lib/database';
import { IMAGE_ASPECT_RATIOS } from '../../lib/media';
import { useUserId } from '../../hooks/useUserId';
import { useToast } from '../../hooks/useToast';
import { imageModels } from '../../data/aiModels';
import {
  createRunwayImageJob,
  pollJobStatus,
  extractImageUrl,
} from '../../services/aiModels/runway/api-client';
import {
  createReplicateImageJob,
  pollReplicatePrediction,
  extractImageUrl as extractReplicateImageUrl,
} from '../../services/aiModels/replicate/api-client';
import { ImageEditorHeader } from './ImageEditorHeader';
import { ImageEditorPreview } from './ImageEditorPreview';
import { ImageEditorSidebar } from './ImageEditorSidebar';
import { PromptControls } from '../shared/PromptControls';
import { ImageEditorProps, VersionHistoryItem } from './types';

export function ImageEditor({ asset, projectId, onClose, onSave }: ImageEditorProps) {
  const userId = useUserId();
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useState(imageModels[0].id);
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<string>(IMAGE_ASPECT_RATIOS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionHistoryItem[]>([]);

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

    try {
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

      let generatedImageUrl: string | null = null;

      // Handle Runway Gen-4 Turbo
      if (selectedModel === 'runway-gen4-turbo') {
        // Get the Runway ratio from selected aspect ratio
        const selectedRatioOption = IMAGE_ASPECT_RATIOS.find((r) => r.id === selectedRatio);
        const runwayRatio = selectedRatioOption?.runwayRatio || IMAGE_ASPECT_RATIOS[0].runwayRatio;

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
        generatedImageUrl = extractImageUrl(result);
        if (!generatedImageUrl) {
          throw new Error('Failed to extract image URL from Runway response');
        }
      }
      // Handle Replicate Flux Pro
      else if (selectedModel === 'flux-pro') {
        // Create Replicate image generation job
        const { id: predictionId } = await createReplicateImageJob({
          imageUrl,
          prompt: enhancedPrompt,
          aspectRatio: selectedRatio,
        });

        // Poll for completion
        showToast('Generating image...', 'info');
        const result = await pollReplicatePrediction(
          predictionId,
          (prediction) => {
            if (prediction.status === 'processing' || prediction.status === 'starting') {
              showToast(`Generating... ${prediction.status}`, 'info');
            } else if (prediction.status === 'succeeded') {
              showToast('Generation complete!', 'success');
            }
          },
          120, // maxAttempts (4 minutes)
          2000 // intervalMs
        );

        // Extract image URL from response
        generatedImageUrl = extractReplicateImageUrl(result);
        if (!generatedImageUrl) {
          throw new Error('Failed to extract image URL from Replicate response');
        }
      }
      // Unsupported model
      else {
        showToast(`${selectedModel} is not yet implemented. Please use Runway Gen-4 Turbo or Flux Pro.`, 'warning');
        setIsGenerating(false);
        return;
      }

      showToast('Image generated! Uploading...', 'info');

      // Download and upload to storage
      const { storagePath, width, height } = await downloadAndUploadImage(
        generatedImageUrl,
        projectId
      );

      // Update state with new image
      const uploadedImageUrl = getAssetUrl(storagePath);
      setEditedImageUrl(uploadedImageUrl);
      setShowComparison(true);

      // Save to database immediately
      try {
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
          storage_path: storagePath,
          width,
          height,
        });

        showToast('Image generated and saved successfully!', 'success');
        // Automatically refresh parent component to show the new edited image
        onSave();
      } catch (saveError) {
        console.error('Error saving edited image:', saveError);
        showToast('Image generated but failed to save. You can generate again to retry.', 'warning');
      }

      // Add to version history
      setVersions([
        {
          prompt,
          model: selectedModel,
          timestamp: new Date().toISOString(),
        },
        ...versions,
      ]);
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate image. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedModelInfo = imageModels.find((m) => m.id === selectedModel);
  const originalImageUrl = getAssetUrl(asset.storage_path);

  return (
    <div className="min-h-screen bg-background flex flex-col animate-fade-in">
      <ImageEditorHeader onClose={onClose} />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <ImageEditorPreview
            originalImageUrl={originalImageUrl}
            editedImageUrl={editedImageUrl}
            showComparison={showComparison}
            fileName={asset.file_name}
          />

          <PromptControls
            prompt={prompt}
            selectedModelName={selectedModelInfo?.name || ''}
            isGenerating={isGenerating}
            canGenerate={!!prompt.trim()}
            generateLabel="Generate"
            generatingLabel="Generating..."
            placeholder="Describe how you want to edit this image... For example: 'Add a gradient background' or 'Make the product pop with vibrant colors'"
            context={context}
            onContextChange={setContext}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
            icon="wand"
          />
        </div>

        <ImageEditorSidebar
          selectedModel={selectedModel}
          selectedRatio={selectedRatio}
          versions={versions}
          onModelChange={setSelectedModel}
          onRatioChange={setSelectedRatio}
        />
      </div>
    </div>
  );
}

