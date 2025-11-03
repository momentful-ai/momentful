import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { database } from '../../lib/database';
import { IMAGE_ASPECT_RATIOS } from '../../lib/media';
import { useUserId } from '../../hooks/useUserId';
import { useToast } from '../../hooks/useToast';
import { useEditedImagesBySource } from '../../hooks/useEditedImages';
import { EditedImage } from '../../types';
import {
  createReplicateImageJob,
  pollReplicatePrediction,
  extractImageUrl as extractReplicateImageUrl,
} from '../../services/aiModels/replicate/api-client';
import { ImageEditorHeader } from './ImageEditorHeader';
import { ImageEditorPreview } from './ImageEditorPreview';
import { ImageEditorSidebar } from './ImageEditorSidebar';
import { ImageEditorImageList } from './ImageEditorImageList';
import { PromptControls } from '../shared/PromptControls';
import { ImageEditorProps, VersionHistoryItem } from './types';

export function ImageEditor({ asset, projectId, onClose, onSave, onNavigateToVideo, onSelectImageToEdit, sourceEditedImage }: ImageEditorProps) {
  // onSave is part of the interface but intentionally unused (auto-close was removed)
  void onSave; // Prevents unused variable warning
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const selectedModel = 'flux-pro';
  const [productName, setProductName] = useState('');
  const [selectedRatio, setSelectedRatio] = useState<string>(IMAGE_ASPECT_RATIOS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionHistoryItem[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Fetch editing history for this source asset
  const { data: editingHistory = [], isLoading: isLoadingHistory } = useEditedImagesBySource(asset.id);

  useEffect(() => {
    setEditedImageUrl(null);
    setShowComparison(false);
    setSelectedImageId(null);
    setProductName(sourceEditedImage?.prompt ?? '');
  }, [asset.id, sourceEditedImage?.id, sourceEditedImage?.prompt]);

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
   * Build enhanced prompt for product image generation using product name
   */
  const buildEnhancedPrompt = (productName: string): string => {
    const cleanProductName = productName.trim();
    return `keep the ${cleanProductName} exactly the same. turn it into a studio quality photo, with excellent lighting, contrasting background and realistic placement`;
  };

  const handleGenerate = async () => {
    if (!productName.trim()) return;

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
      const enhancedPrompt = buildEnhancedPrompt(productName);

      showToast('Starting image generation...', 'info');

      let generatedImageUrl: string | null = null;

      // Create Replicate image generation job with Flux Pro
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
        // Validate required fields before saving
        if (!projectId || !projectId.trim()) {
          throw new Error('Project ID is required to save edited image');
        }
        if (!userId || !userId.trim()) {
          throw new Error('User ID is required to save edited image');
        }

        const createdImage = await database.editedImages.create({
          project_id: projectId.trim(),
          user_id: userId.trim(),
          prompt: productName,
          context: { productName: productName },
          ai_model: selectedModel,
          storage_path: storagePath,
          width,
          height,
          source_asset_id: asset.id,
        });

        // Optimistically update the source-specific query cache for immediate UI feedback
        queryClient.setQueryData<EditedImage[]>(
          ['edited-images', 'source', asset.id],
          (old = []) => [createdImage, ...old]
        );

        // Optimistically update the project-wide query cache
        queryClient.setQueryData<EditedImage[]>(
          ['edited-images', projectId],
          (old = []) => [createdImage, ...old]
        );

        // Invalidate edited images queries (for future mounts/refocus)
        await queryClient.invalidateQueries({ queryKey: ['edited-images', projectId] });
        await queryClient.invalidateQueries({ queryKey: ['edited-images', 'source', asset.id] });

        // Force immediate refetch of active queries (for currently mounted components)
        await queryClient.refetchQueries({ queryKey: ['edited-images', projectId] });
        await queryClient.refetchQueries({ queryKey: ['edited-images', 'source', asset.id] });

        // Invalidate timeline queries if lineage_id is available
        if (createdImage.lineage_id) {
          await queryClient.invalidateQueries({ queryKey: ['timeline', createdImage.lineage_id] });
        }
        await queryClient.invalidateQueries({ queryKey: ['timelines', projectId] });

        // Set the newly created image as selected
        setSelectedImageId(createdImage.id);

        showToast('Image generated and saved successfully!', 'success');
        
        // Notify parent component that save completed
        onSave();
        // Note: Removed auto-close - user stays in editor to see history
      } catch (saveError) {
        console.error('Error saving edited image:', saveError);
        const errorMessage =
          saveError instanceof Error
            ? saveError.message
            : 'Image generated but failed to save. You can generate again to retry.';
        showToast(errorMessage, saveError instanceof Error && errorMessage.includes('required') ? 'error' : 'warning');
      }

      // Add to version history
      setVersions([
        {
          prompt: productName,
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

  const selectedModelName = 'Flux Pro';
  // If sourceEditedImage is provided, use its edited_url as the source image
  // Otherwise, use the asset's storage_path
  const originalImageUrl = sourceEditedImage?.edited_url || getAssetUrl(asset.storage_path);

  return (
    <motion.div
      className="h-screen bg-background flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <ImageEditorHeader onClose={onClose} />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <ImageEditorPreview
              originalImageUrl={originalImageUrl}
              editedImageUrl={editedImageUrl}
              showComparison={showComparison}
              fileName={asset.file_name}
            />
          </div>

          <div className="flex-none">
            <PromptControls
              prompt={productName}
              selectedModelName={selectedModelName}
              isGenerating={isGenerating}
              canGenerate={!!productName.trim()}
              generateLabel="Generate"
              generatingLabel="Generating..."
              placeholder="Product name (e.g., 'iPhone 15', 'Nike Air Max')"
              onPromptChange={setProductName}
              onGenerate={handleGenerate}
              icon="wand"
            >
              <ImageEditorImageList
                editedImages={editingHistory}
                isLoading={isLoadingHistory}
                selectedImageId={selectedImageId}
                onSelectImage={(image) => {
                  setSelectedImageId(image.id);
                  setEditedImageUrl(image.edited_url);
                  setShowComparison(true);
                }}
                onEditImage={(image) => {
                  if (onSelectImageToEdit) {
                    onSelectImageToEdit(image);
                  }
                }}
                onNavigateToVideo={onNavigateToVideo}
              />
            </PromptControls>
          </div>
        </div>

        <ImageEditorSidebar
          selectedRatio={selectedRatio}
          versions={versions}
          onRatioChange={setSelectedRatio}
        />
      </div>
    </motion.div>
  );
}

