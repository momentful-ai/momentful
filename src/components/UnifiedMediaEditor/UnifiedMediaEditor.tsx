import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { database } from '../../lib/database';
import { IMAGE_ASPECT_RATIOS, buildEnhancedImagePrompt, buildEnhancedVideoPrompt } from '../../lib/media';
import { useUserId } from '../../hooks/useUserId';
import { useToast } from '../../hooks/useToast';
import { useEditedImagesByLineage, useEditedImages } from '../../hooks/useEditedImages';
import { useMediaAssets } from '../../hooks/useMediaAssets';
import { EditedImage } from '../../types';
import {
  createReplicateImageJob,
  pollReplicatePrediction,
  extractImageUrl as extractReplicateImageUrl,
} from '../../services/aiModels/replicate/api-client';
import { videoModels } from '../../data/aiModels';
import * as RunwayAPI from '../../services/aiModels/runway';
import { UnifiedLeftPanel } from './UnifiedLeftPanel';
import { UnifiedPreview } from './UnifiedPreview';
import { UnifiedControls } from './UnifiedControls';
import { UnifiedHeader } from './UnifiedHeader';
import { EditorMode, UnifiedMediaEditorProps, SharedState } from './types';

export function UnifiedMediaEditor({
  projectId,
  onClose,
  onSave,
  asset,
  sourceEditedImage,
  onNavigateToVideo,
  onSelectImageToEdit,
  initialSelectedImageId,
  initialMode = 'image'
}: UnifiedMediaEditorProps) {
  // onSave is part of the interface but intentionally unused (auto-close was removed)
  void onSave;

  const userId = useUserId();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const selectedModel = 'flux-pro';
  const [currentMode, setCurrentMode] = useState<EditorMode>(initialMode);

  // Shared state that persists across mode switches
  const [sharedState, setSharedState] = useState<SharedState>({
    selectedImages: initialSelectedImageId ? [initialSelectedImageId] : [],
    prompt: sourceEditedImage?.prompt ?? '',
  });

  // Update shared state when initialSelectedImageId changes
  useEffect(() => {
    if (initialSelectedImageId) {
      setSharedState(prev => ({
        ...prev,
        selectedImages: [initialSelectedImageId]
      }));
    }
  }, [initialSelectedImageId]);

  // Update mode when initialMode changes (for navigation between modes)
  useEffect(() => {
    setCurrentMode(initialMode);
  }, [initialMode]);

  // Image editing state
  const [selectedRatio, setSelectedRatio] = useState<string>(IMAGE_ASPECT_RATIOS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Video generation state
  const [selectedModelVideo, setSelectedModelVideo] = useState(videoModels[0].id);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('9:16');
  const [cameraMovement, setCameraMovement] = useState('dynamic');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<boolean>(false);

  // Determine lineage ID for editing history
  const lineageId = sourceEditedImage?.lineage_id || asset?.lineage_id || null;
  const { data: editingHistory = [] } = useEditedImagesByLineage(lineageId);

  // Video generation data
  const { data: editedImagesData = [] } = useEditedImages(projectId);
  const { data: mediaAssetsData = [] } = useMediaAssets(projectId);
  const editedImages = editedImagesData;
  const mediaAssets = mediaAssetsData.filter(asset => asset.file_type === 'image');

  // Reset state when switching modes or assets
  useEffect(() => {
    setEditedImageUrl(null);
    setShowComparison(false);
    setSelectedImageId(null);
    setGeneratedVideoUrl(null);
    setVideoError(false);
    setSharedState(prev => ({
      ...prev,
      prompt: sourceEditedImage?.prompt ?? ''
    }));
  }, [currentMode, asset, sourceEditedImage]);

  // Pre-select image for video generation when switching to video mode
  useEffect(() => {
    if (currentMode === 'video' && initialSelectedImageId && editedImages.length > 0) {
      const imageToSelect = editedImages.find(img => img.id === initialSelectedImageId);
      if (imageToSelect) {
        setSharedState(prev => ({
          ...prev,
          selectedImages: [imageToSelect.id]
        }));
      }
    }
  }, [currentMode, initialSelectedImageId, editedImages]);

  const getAssetUrl = (storagePath: string) => {
    return database.storage.getPublicUrl('user-uploads', storagePath);
  };

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

  const downloadAndUploadImage = async (
    imageUrl: string,
    projectId: string
  ): Promise<{ storagePath: string; width: number; height: number }> => {
    if (!userId) {
      throw new Error('User ID is required to upload images');
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const timestamp = Date.now();
    const fileName = `edited-${timestamp}.png`;
    const storagePath = `${userId}/${projectId}/${fileName}`;

    const file = new File([blob], fileName, { type: 'image/png' });
    await database.storage.upload('user-uploads', storagePath, file);

    const { width, height } = await getImageDimensionsFromUrl(imageUrl);

    return { storagePath, width, height };
  };

  const handleGenerateImage = async () => {
    if (!sharedState.prompt.trim()) return;
    if (!asset) return;

    setIsGenerating(true);
    setShowComparison(false);
    setEditedImageUrl(null);

    try {
      if (!userId) {
        showToast('User must be logged in to generate images', 'error');
        setIsGenerating(false);
        return;
      }

      const imageUrl = sourceEditedImage?.edited_url || getAssetUrl(asset.storage_path);
      const enhancedPrompt = buildEnhancedImagePrompt(sharedState.prompt);

      showToast('Starting image generation...', 'info');

      const { id: predictionId } = await createReplicateImageJob({
        imageUrl,
        prompt: enhancedPrompt,
        aspectRatio: selectedRatio,
      });

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
        120,
        2000
      );

      const generatedImageUrl = extractReplicateImageUrl(result);
      if (!generatedImageUrl) {
        throw new Error('Failed to extract image URL from Replicate response');
      }

      showToast('Image generated! Uploading...', 'info');

      const { storagePath, width, height } = await downloadAndUploadImage(
        generatedImageUrl,
        projectId
      );

      const uploadedImageUrl = getAssetUrl(storagePath);
      setEditedImageUrl(uploadedImageUrl);
      setShowComparison(true);

      // Save to database
      const createdImage = await database.editedImages.create({
        project_id: projectId.trim(),
        user_id: userId.trim(),
        prompt: sharedState.prompt,
        context: { productName: sharedState.prompt },
        ai_model: selectedModel,
        storage_path: storagePath,
        width,
        height,
        lineage_id: lineageId || undefined,
        ...(sourceEditedImage
          ? { parent_id: sourceEditedImage.id }
          : undefined
        ),
      });

      // Update cache
      queryClient.setQueryData<EditedImage[]>(
        ['edited-images', projectId],
        (old = []) => [createdImage, ...old]
      );

      if (createdImage.lineage_id) {
        queryClient.setQueryData<EditedImage[]>(
          ['edited-images', 'lineage', createdImage.lineage_id],
          (old = []) => [createdImage, ...old]
        );
      }

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['edited-images', projectId] });
      if (createdImage.lineage_id) {
        await queryClient.invalidateQueries({ queryKey: ['edited-images', 'lineage', createdImage.lineage_id] });
      }

      await queryClient.invalidateQueries({ queryKey: ['timelines', projectId] });
      if (createdImage.lineage_id) {
        await queryClient.invalidateQueries({ queryKey: ['timeline', createdImage.lineage_id] });
        await queryClient.refetchQueries({ queryKey: ['timeline', createdImage.lineage_id] });
      }

      setSelectedImageId(createdImage.id);
      showToast('Image generated and saved successfully!', 'success');
      onSave();

      // Add to version history
      setVersions([
        {
          prompt: sharedState.prompt,
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

  const handleGenerateVideo = async () => {
    if (sharedState.selectedImages.length === 0) {
      showToast('Please select at least one image to generate a video', 'warning');
      return;
    }
    if (!userId) {
      showToast('User must be logged in to generate videos', 'error');
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError(false);

    try {
      const imageSource = sharedState.selectedImages[0];
      let imageUrl: string | null = null;

      if (imageSource) {
        const editedImage = editedImages.find(img => img.id === imageSource);
        imageUrl = editedImage?.edited_url || null;
      }

      if (!imageUrl) {
        showToast('Could not find image URL for selected source', 'error');
        return;
      }

      const enhancedPrompt = buildEnhancedVideoPrompt(sharedState.prompt, cameraMovement);
      const requestData: RunwayAPI.CreateJobRequest = {
        mode: 'image-to-video',
        promptImage: imageUrl,
        promptText: enhancedPrompt || undefined,
      };

      showToast('Starting video generation...', 'info');

      const { taskId } = await RunwayAPI.createRunwayJob(requestData);

      const result = await RunwayAPI.pollJobStatus(
        taskId,
        (status: string, progress?: number) => {
          if (status === 'PROCESSING' && progress !== undefined) {
            const percentage = Math.round(progress * 100);
            showToast(`Video generation in progress... ${percentage}%`, 'info');
          } else if (status === 'PROCESSING') {
            showToast('Video generation in progress...', 'info');
          } else if (status === 'SUCCEEDED') {
            showToast('Video generation completed!', 'success');
          } else if (status === 'FAILED') {
            showToast('Video generation failed!', 'error');
            setVideoError(true);
            setIsGeneratingVideo(false);
          }
        }
      );

      if (result.status === 'SUCCEEDED' && result.output) {
        const runwayVideoUrl = typeof result.output === 'string'
          ? result.output
          : Array.isArray(result.output)
          ? result.output[0]
          : null;
        setGeneratedVideoUrl(runwayVideoUrl as string);

        if (!runwayVideoUrl) {
          throw new Error('No video URL in response');
        }

        showToast('Video generated successfully!', 'success');

        const createdVideo = await database.generatedVideos.create({
          project_id: projectId.trim(),
          user_id: userId.trim(),
          name: sharedState.prompt || 'Untitled Video',
          ai_model: selectedModelVideo,
          aspect_ratio: aspectRatio,
          camera_movement: cameraMovement,
          runway_task_id: taskId,
          storage_path: runwayVideoUrl,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

        await queryClient.invalidateQueries({ queryKey: ['generated-videos', projectId] });

        showToast('Video is ready to view!', 'success');
        onSave();
      } else {
        throw new Error('Video generation failed');
      }

    } catch (error) {
      console.error('Error generating video:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to generate video. Please try again.',
        'error'
      );
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleModeChange = (newMode: EditorMode) => {
    setCurrentMode(newMode);
  };

  const originalImageUrl = sourceEditedImage?.edited_url || (asset ? getAssetUrl(asset.storage_path) : null);

  // For video-only mode, we might not have an asset
  const hasAsset = !!(asset || sourceEditedImage);

  return (
    <motion.div
      className="h-screen bg-background flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <UnifiedHeader
        onClose={onClose}
        currentMode={currentMode}
        onModeChange={handleModeChange}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <UnifiedLeftPanel
            key={currentMode}
            mode={currentMode}
            editingHistory={editingHistory}
            editedImages={editedImages}
            mediaAssets={mediaAssets}
            selectedImageId={selectedImageId}
            selectedImages={sharedState.selectedImages}
            projectId={projectId}
            userId={userId}
            onEditImage={(image) => {
              if (onSelectImageToEdit) {
                onSelectImageToEdit(image);
              }
            }}
            onSelectImage={(imageId) => {
              setSharedState(prev => ({
                ...prev,
                selectedImages: [imageId]
              }));
            }}
            onNavigateToVideo={onNavigateToVideo}
            onFileDrop={async (files) => {
              // TODO: Implement file drop handling
              console.log('File drop not implemented yet', files);
            }}
            onRefresh={() => {
              // TODO: Implement refresh
              console.log('Refresh not implemented yet');
            }}
          />
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <UnifiedPreview
              mode={currentMode}
              originalImageUrl={originalImageUrl}
              editedImageUrl={editedImageUrl}
              showComparison={showComparison}
              fileName={asset?.file_name}
              aspectRatio={aspectRatio}
              generatedVideoUrl={generatedVideoUrl}
              videoError={videoError}
              isGenerating={isGenerating || isGeneratingVideo}
              onVideoError={() => setVideoError(true)}
              onRetryVideo={() => {
                setVideoError(false);
                setGeneratedVideoUrl(null);
              }}
            />
          </div>

          <div className="flex-none">
            <UnifiedControls
              mode={currentMode}
              prompt={sharedState.prompt}
              onPromptChange={(prompt) => setSharedState(prev => ({ ...prev, prompt }))}
              isGenerating={isGenerating || isGeneratingVideo}
              canGenerate={currentMode === 'image' ? (hasAsset && !!sharedState.prompt.trim()) : sharedState.selectedImages.length > 0}
              onGenerate={currentMode === 'image' ? handleGenerateImage : handleGenerateVideo}
              hasAsset={hasAsset}
              // Image editing controls
              selectedRatio={selectedRatio}
              onRatioChange={setSelectedRatio}
              versions={versions}
              // Video generation controls
              selectedModel={selectedModelVideo}
              onModelChange={setSelectedModelVideo}
              aspectRatioVideo={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              cameraMovement={cameraMovement}
              onCameraMovementChange={setCameraMovement}
              selectedSources={sharedState.selectedImages}
              onRemoveSource={(id) => {
                setSharedState(prev => ({
                  ...prev,
                  selectedImages: prev.selectedImages.filter(imgId => imgId !== id)
                }));
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}