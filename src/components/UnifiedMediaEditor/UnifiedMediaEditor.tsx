import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { database } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { IMAGE_ASPECT_RATIOS, buildEnhancedImagePrompt, buildEnhancedVideoPrompt } from '../../lib/media';
import { videoModels } from '../../data/aiModels';
import { useUserId } from '../../hooks/useUserId';
import { useToast } from '../../hooks/useToast';
import { useEditedImagesByLineage, useEditedImages } from '../../hooks/useEditedImages';
import { useMediaAssets } from '../../hooks/useMediaAssets';
import { EditedImage } from '../../types';
import { SelectedSource } from '../VideoGenerator/types';
import * as RunwayAPI from '../../services/aiModels/runway';
import {
  createReplicateImageJob,
  pollReplicatePrediction,
  extractImageUrl as extractReplicateImageUrl,
} from '../../services/aiModels/replicate/api-client';
import { UnifiedMediaEditorProps, UnifiedEditorState, MediaEditorMode } from './types';
import { UnifiedLeftPanel } from './UnifiedLeftPanel';
import { UnifiedPreview } from './UnifiedPreview';
import { UnifiedControls } from './UnifiedControls';
import { UnifiedHeader } from './UnifiedHeader';
import { UnifiedSidebar } from './UnifiedSidebar';

export function UnifiedMediaEditor({
  initialMode,
  projectId,
  onClose,
  onSave,
  asset,
  sourceEditedImage,
  initialSelectedImageId,
}: UnifiedMediaEditorProps) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Initialize state based on mode
  const [state, setState] = useState<UnifiedEditorState>(() => {
    const baseState: UnifiedEditorState = {
      mode: initialMode,
      selectedSources: [],
      // Image editing defaults
      productName: sourceEditedImage?.prompt ?? '',
      selectedRatio: IMAGE_ASPECT_RATIOS[0].id,
      isGenerating: false,
      showComparison: false,
      editedImageUrl: null,
      versions: [],
      // Video generation defaults
      prompt: '',
      cameraMovement: 'dynamic',
      aspectRatio: '9:16' as const,
      selectedModel: videoModels[0].id,
      generatedVideoUrl: null,
      videoError: false,
      isSelecting: false,
      selectionMode: 'add' as const,
    };
    return baseState;
  });

  // Selection refs for video mode
  const selectionStartRef = useRef<{ id: string; type: 'edited_image' | 'media_asset' } | null>(null);

  // Load data for both modes
  const { data: editedImages = [] } = useEditedImages(projectId);
  const { data: mediaAssetsData = [] } = useMediaAssets(projectId);

  // Filter media assets to only include images
  const mediaAssets = useMemo(() =>
    (mediaAssetsData || []).filter(asset => asset.file_type === 'image'),
    [mediaAssetsData]
  );

  // Determine lineage ID for editing history (image mode)
  const lineageId = sourceEditedImage?.lineage_id || asset?.lineage_id || null;
  const { data: editingHistory = [] } = useEditedImagesByLineage(lineageId);

  // Initialize selected image for video mode
  useEffect(() => {
    if (state.mode === 'video-generate' && initialSelectedImageId && editedImages.length > 0) {
      const imageToSelect = editedImages.find(img => img.id === initialSelectedImageId);
      if (imageToSelect) {
        const source = {
          id: imageToSelect.id,
          type: 'edited_image' as const,
          thumbnail: imageToSelect.edited_url,
          name: imageToSelect.prompt.substring(0, 30),
        };
        setState(prev => ({ ...prev, selectedSources: [source] }));
      }
    }
  }, [initialSelectedImageId, editedImages, state.mode]);

  // Reset state when switching modes
  useEffect(() => {
    if (state.mode === 'image-edit') {
      setState(prev => ({
        ...prev,
        productName: sourceEditedImage?.prompt ?? '',
        showComparison: false,
        editedImageUrl: null,
      }));
    }
  }, [state.mode, sourceEditedImage]);

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

  const handleImageGenerate = async () => {
    if (!state.productName.trim() || !asset) return;

    setState(prev => ({ ...prev, isGenerating: true, showComparison: false, editedImageUrl: null }));

    try {
      if (!userId) {
        showToast('User must be logged in to generate images', 'error');
        return;
      }

      const imageUrl = sourceEditedImage?.edited_url || getAssetUrl(asset.storage_path);
      const enhancedPrompt = buildEnhancedImagePrompt(state.productName);

      showToast('Starting image generation...', 'info');

      const { id: predictionId } = await createReplicateImageJob({
        imageUrl,
        prompt: enhancedPrompt,
        aspectRatio: state.selectedRatio,
      });

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

      const { storagePath, width, height } = await downloadAndUploadImage(generatedImageUrl, projectId);
      const uploadedImageUrl = getAssetUrl(storagePath);
      setState(prev => ({ ...prev, editedImageUrl: uploadedImageUrl, showComparison: true }));

      // Save to database
      const createdImage = await database.editedImages.create({
        project_id: projectId.trim(),
        user_id: userId.trim(),
        prompt: state.productName,
        context: { productName: state.productName },
        ai_model: 'flux-pro',
        storage_path: storagePath,
        width,
        height,
        lineage_id: lineageId || undefined,
        ...(sourceEditedImage
          ? { parent_id: sourceEditedImage.id }
          : undefined
        ),
      });

      // Cache updates
      queryClient.setQueryData<EditedImage[]>(['edited-images', projectId], (old = []) => [createdImage, ...old]);
      if (createdImage.lineage_id) {
        queryClient.setQueryData<EditedImage[]>(['edited-images', 'lineage', createdImage.lineage_id], (old = []) => [createdImage, ...old]);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['edited-images', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['timelines', projectId] }),
      ]);

      if (createdImage.lineage_id) {
        await queryClient.invalidateQueries({ queryKey: ['timeline', createdImage.lineage_id] });
      }

      setState(prev => ({
        ...prev,
        versions: [{
          prompt: state.productName,
          model: 'flux-pro',
          timestamp: new Date().toISOString(),
        }, ...prev.versions]
      }));

      showToast('Image generated and saved successfully!', 'success');
      onSave();
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleVideoGenerate = async () => {
    if (state.selectedSources.length === 0) {
      showToast('Please select at least one image to generate a video', 'warning');
      return;
    }
    if (!userId) {
      showToast('User must be logged in to generate videos', 'error');
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, videoError: false }));

    try {
      const imageSource = state.selectedSources.find(source =>
        source.type === 'edited_image' || source.type === 'media_asset'
      );

      if (!imageSource) {
        showToast('No valid image source found', 'error');
        return;
      }

      let imageUrl: string | null = null;
      if (imageSource.type === 'edited_image') {
        const editedImage = editedImages.find(img => img.id === imageSource.id);
        imageUrl = editedImage?.edited_url || null;
      } else if (imageSource.type === 'media_asset') {
        const mediaAsset = mediaAssets.find(asset => asset.id === imageSource.id);
        imageUrl = mediaAsset ? getAssetUrl(mediaAsset.storage_path) : null;
      }

      if (!imageUrl) {
        showToast('Could not find image URL for selected source', 'error');
        return;
      }

      const enhancedPrompt = buildEnhancedVideoPrompt(state.prompt, state.cameraMovement);
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
            setState(prev => ({ ...prev, videoError: true, isGenerating: false }));
          }
        }
      );

      if (result.status === 'SUCCEEDED' && result.output) {
        const runwayVideoUrl = typeof result.output === 'string'
          ? result.output
          : Array.isArray(result.output)
          ? result.output[0]
          : null;
        setState(prev => ({ ...prev, generatedVideoUrl: runwayVideoUrl as string }));

        let lineage_id: string | undefined;
        const preferredSource = state.selectedSources.find(s => s.type === 'edited_image') || state.selectedSources[0];

        if (preferredSource) {
          if (preferredSource.type === 'edited_image') {
            const { data: sourceData } = await supabase
              .from('edited_images')
              .select('lineage_id')
              .eq('id', preferredSource.id)
              .single();
            lineage_id = sourceData?.lineage_id;
          } else {
            const { data: sourceData } = await supabase
              .from('media_assets')
              .select('lineage_id')
              .eq('id', preferredSource.id)
              .single();
            lineage_id = sourceData?.lineage_id;
          }
        }

        const createdVideo = await database.generatedVideos.create({
          project_id: projectId.trim(),
          user_id: userId.trim(),
          name: state.prompt || 'Untitled Video',
          ai_model: state.selectedModel,
          aspect_ratio: state.aspectRatio,
          camera_movement: state.cameraMovement,
          runway_task_id: taskId,
          storage_path: runwayVideoUrl,
          status: 'completed',
          completed_at: new Date().toISOString(),
          lineage_id,
        });

        await Promise.all(state.selectedSources.map(async (source, index) => {
          await database.videoSources.create({
            video_id: createdVideo.id,
            source_type: source.type,
            source_id: source.id,
            sort_order: index,
          });
        }));

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
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleModeSwitch = useCallback((newMode: MediaEditorMode) => {
    setState(prev => {
      let newSelectedSources = prev.selectedSources;

      // When switching to video mode from image mode, pre-select the current result
      if (newMode === 'video-generate' && prev.mode === 'image-edit') {
        if (prev.editedImageUrl && editingHistory.length > 0) {
          // Use the most recent edited image
          const latestImage = editingHistory[0];
          newSelectedSources = [{
            id: latestImage.id,
            type: 'edited_image',
            thumbnail: latestImage.edited_url,
            name: latestImage.prompt.substring(0, 30),
          }];
        } else if (asset) {
          // Fallback to the original asset
          newSelectedSources = [{
            id: asset.id,
            type: 'media_asset',
            thumbnail: getAssetUrl(asset.storage_path),
            name: asset.file_name,
          }];
        }
      }

      return {
        ...prev,
        mode: newMode,
        selectedSources: newSelectedSources,
        // Reset mode-specific state
        isGenerating: false,
        showComparison: false,
        editedImageUrl: null,
        generatedVideoUrl: null,
        videoError: false,
        isSelecting: false,
      };
    });
  }, [asset, editingHistory, getAssetUrl]);

  const handleFileDrop = async (files: File[]) => {
    if (!userId || !projectId) {
      showToast('User ID and Project ID are required to upload files', 'error');
      return;
    }

    for (const file of files) {
      try {
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

    await queryClient.invalidateQueries({ queryKey: ['media-assets', projectId] });
  };

  // Video mode selection handlers
  const removeSource = (id: string) => {
    setState(prev => ({ ...prev, selectedSources: prev.selectedSources.filter(s => s.id !== id) }));
  };

  const addSource = (source: SelectedSource) => {
    if (!state.selectedSources.find(s => s.id === source.id)) {
      setState(prev => ({ ...prev, selectedSources: [source] })); // Single selection
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
    const isSelected = state.selectedSources.find(s => s.id === source.id);
    if (isSelected) {
      removeSource(source.id);
    } else {
      setState(prev => ({ ...prev, selectedSources: [source] }));
    }
  };

  const handleMouseUp = () => {
    setState(prev => ({ ...prev, isSelecting: false }));
    selectionStartRef.current = null;
  };

  useEffect(() => {
    if (state.isSelecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [state.isSelecting]);

  const canGenerate = state.mode === 'image-edit'
    ? !!state.productName.trim()
    : state.selectedSources.length > 0;

  return (
    <motion.div
      className="h-screen bg-background flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <UnifiedHeader
        mode={state.mode}
        onClose={onClose}
        onModeSwitch={handleModeSwitch}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <UnifiedLeftPanel
          mode={state.mode}
          editedImages={state.mode === 'image-edit' ? editingHistory : editedImages}
          mediaAssets={mediaAssets}
          selectedSources={state.selectedSources}
          isSelecting={state.isSelecting}
          onDragStart={handleDragStart}
          onMouseDown={handleImageMouseDown}
          onFileDrop={handleFileDrop}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['edited-images', projectId] });
            queryClient.invalidateQueries({ queryKey: ['media-assets', projectId] });
          }}
        />

        <div className="flex-1 flex flex-col bg-card overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <UnifiedPreview
              mode={state.mode}
              // Image mode props
              originalImageUrl={asset ? (sourceEditedImage?.edited_url || getAssetUrl(asset.storage_path)) : undefined}
              editedImageUrl={state.editedImageUrl}
              showComparison={state.showComparison}
              fileName={asset?.file_name}
              // Video mode props
              aspectRatio={state.aspectRatio}
              generatedVideoUrl={state.generatedVideoUrl}
              videoError={state.videoError}
              isGenerating={state.isGenerating}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onRetryVideo={() => setState(prev => ({ ...prev, videoError: false, generatedVideoUrl: null }))}
              onVideoError={() => setState(prev => ({ ...prev, videoError: true }))}
            />
          </div>

          <div className="flex-shrink-0">
            <UnifiedControls
              mode={state.mode}
              // Image mode props
              prompt={state.productName}
              isGenerating={state.isGenerating}
              canGenerate={canGenerate}
              generateLabel={state.mode === 'image-edit' ? "Edit Image With AI" : "Generate Video"}
              generatingLabel={state.mode === 'image-edit' ? "Generating..." : "Generating Video..."}
              placeholder={state.mode === 'image-edit' ? "Product name (e.g., 'Shoes', 'Candle', 'Mug')" : "Describe the video scene..."}
              onPromptChange={(value) => setState(prev => ({
                ...prev,
                [state.mode === 'image-edit' ? 'productName' : 'prompt']: value
              }))}
              onGenerate={state.mode === 'image-edit' ? handleImageGenerate : handleVideoGenerate}
              // Video mode props
              cameraMovement={state.cameraMovement}
              selectedSources={state.selectedSources}
              maxSelectedSources={1}
              onRemoveSource={removeSource}
            />
          </div>
        </div>

        <UnifiedSidebar
          mode={state.mode}
          // Image mode props
          selectedRatio={state.selectedRatio}
          versions={state.versions}
          onRatioChange={(ratio) => setState(prev => ({ ...prev, selectedRatio: ratio }))}
          // Video mode props
          selectedModel={state.selectedModel}
          aspectRatio={state.aspectRatio}
          cameraMovement={state.cameraMovement}
          onModelChange={(model) => setState(prev => ({ ...prev, selectedModel: model }))}
          onAspectRatioChange={(ratio) => setState(prev => ({ ...prev, aspectRatio: ratio }))}
          onCameraMovementChange={(movement) => setState(prev => ({ ...prev, cameraMovement: movement }))}
        />
      </div>
    </motion.div>
  );
}