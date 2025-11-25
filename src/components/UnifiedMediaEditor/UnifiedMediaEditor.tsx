import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { database } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { IMAGE_ASPECT_RATIOS, buildEnhancedImagePrompt, buildEnhancedVideoPrompt, mapAspectRatioToRunway } from '../../lib/media';
import { getErrorMessage } from '../../lib/utils';
import { videoModels } from '../../data/aiModels';
import { useUserId } from '../../hooks/useUserId';
import { useToast } from '../../hooks/useToast';
import { useSignedUrls } from '../../hooks/useSignedUrls';
import { useEditedImagesByLineage, useEditedImages } from '../../hooks/useEditedImages';
import { useMediaAssets } from '../../hooks/useMediaAssets';
import { useGeneratedVideos } from '../../hooks/useGeneratedVideos';
import { useUserGenerationLimits } from '../../hooks/useUserGenerationLimits';
import { handleStorageError, validateStoragePath } from '../../lib/storage-utils';
import { EditedImage, GeneratedVideo } from '../../types';
import { SelectedSource } from './types';
import * as RunwayAPI from '../../services/aiModels/runway';
import {
  createReplicateImageJob,
  pollReplicatePrediction,
} from '../../services/aiModels/replicate/api-client';
import { UnifiedMediaEditorProps, UnifiedEditorState, MediaEditorMode } from './types';
import { UnifiedLeftPanel } from './UnifiedLeftPanel';
import { UnifiedPreview } from './UnifiedPreview';
import { UnifiedControls } from './UnifiedControls';
import { UnifiedHeader } from './UnifiedHeader';
import { UnifiedSidebar } from './UnifiedSidebar';
import { LimitReachedDialog } from '../LimitReachedDialog';

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
  const { imagesRemaining, videosRemaining, refetch: refetchLimits } = useUserGenerationLimits();

  // Initialize state based on mode
  const [originalImageData, setOriginalImageData] = useState<{
    url?: string;
    storagePath?: string;
  } | undefined>(() => {
    if (sourceEditedImage) {
      return {
        url: sourceEditedImage.edited_url,
        storagePath: sourceEditedImage.storage_path
      };
    } else if (asset) {
      return {
        storagePath: asset.storage_path,
        url: undefined
      };
    }
    return undefined;
  });

  const [editedImageStoragePath, setEditedImageStoragePath] = useState<string | undefined>();
  const [showLimitDialog, setShowLimitDialog] = useState<{ type: 'images' | 'videos' } | null>(null);

  const [state, setState] = useState<UnifiedEditorState>(() => {
    let initialSelectedSources: SelectedSource[] = [];
    let initialSelectedImageForPreview: { id: string; url: string; storagePath?: string; fileName: string; type: 'edited_image' | 'media_asset' } | null = null;

    // Initialize selected sources and preview image based on props
    if (initialMode === 'image-edit') {
      if (sourceEditedImage) {
        // For edited images, we have the URL immediately
        const source: SelectedSource = {
          id: sourceEditedImage.id,
          type: 'edited_image',
          thumbnail: sourceEditedImage.edited_url,
          storagePath: sourceEditedImage.storage_path,
          name: sourceEditedImage.prompt.substring(0, 30),
        };
        initialSelectedSources = [source];
        initialSelectedImageForPreview = {
          id: sourceEditedImage.id,
          url: sourceEditedImage.edited_url || '',
          storagePath: sourceEditedImage.storage_path,
          fileName: sourceEditedImage.prompt.substring(0, 30),
          type: 'edited_image',
        };
      }
      // For assets, initialization happens in useEffect to get signed URLs
    }

    const baseState: UnifiedEditorState = {
      mode: initialMode,
      selectedSources: initialSelectedSources,
      // Image editing defaults
      productName: sourceEditedImage?.prompt ?? '',
      selectedRatio: IMAGE_ASPECT_RATIOS[0].id,
      isGenerating: false,
      showComparison: false,
      editedImageUrl: null,
      selectedImageForPreview: initialSelectedImageForPreview,
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
  const { data: mediaAssets = [] } = useMediaAssets(projectId);
  const { data: generatedVideos = [] } = useGeneratedVideos(projectId);
  const signedUrls = useSignedUrls();

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
          storagePath: imageToSelect.storage_path,
          name: imageToSelect.prompt.substring(0, 30),
        };
        setState(prev => ({ ...prev, selectedSources: [source] }));
      }
    }
  }, [initialSelectedImageId, editedImages, state.mode]);

  // Set original image data for signed URL handling
  useEffect(() => {
    if (asset && !sourceEditedImage) {
      // For media assets, pass storage path for signing
      setOriginalImageData({
        storagePath: asset.storage_path,
        url: undefined // Clear any old URL
      });
    } else if (sourceEditedImage) {
      // For edited images, use the stored signed URL as fallback and storage path for fresh signing
      setOriginalImageData({
        url: sourceEditedImage.edited_url,
        storagePath: sourceEditedImage.storage_path
      });
    } else {
      setOriginalImageData(undefined);
    }
  }, [asset, sourceEditedImage]);

  // Initialize selected image for preview in image-edit mode
  useEffect(() => {
    const initializeSelectedImage = async () => {
      if (state.mode === 'image-edit' && !state.selectedImageForPreview) {
        if (sourceEditedImage) {
          const source: SelectedSource = {
            id: sourceEditedImage.id,
            type: 'edited_image',
            thumbnail: sourceEditedImage.edited_url,
            storagePath: sourceEditedImage.storage_path,
            name: sourceEditedImage.prompt.substring(0, 30),
          };
          setState(prev => ({
            ...prev,
            selectedImageForPreview: {
              id: sourceEditedImage.id,
              url: sourceEditedImage.edited_url || '',
              storagePath: sourceEditedImage.storage_path,
              fileName: sourceEditedImage.prompt.substring(0, 30),
              type: 'edited_image',
            },
            selectedSources: [source],
          }));
        } else if (asset) {
          try {
            const assetUrl = await signedUrls.getSignedUrl('user-uploads', asset.storage_path);
            const source: SelectedSource = {
              id: asset.id,
              type: 'media_asset',
              thumbnail: assetUrl,
              storagePath: asset.storage_path,
              name: asset.file_name,
            };
            setState(prev => ({
              ...prev,
              selectedImageForPreview: {
                id: asset.id,
                url: assetUrl,
                storagePath: asset.storage_path,
                fileName: asset.file_name,
                type: 'media_asset',
              },
              selectedSources: [source],
            }));
          } catch (error) {
            console.error('Failed to initialize selected image:', error);
          }
        }
      }
    };

    initializeSelectedImage();
  }, [state.mode, state.selectedImageForPreview, sourceEditedImage, asset, signedUrls]);

  // Reset state when switching modes
  useEffect(() => {
    if (state.mode === 'image-edit') {
      setState(prev => ({
        ...prev,
        productName: sourceEditedImage?.prompt ?? '',
        showComparison: false,
        editedImageUrl: null,
        // Reset selected image for preview when switching to image-edit mode
        selectedImageForPreview: prev.selectedImageForPreview || null,
      }));
    } else {
      // Clear selected image for preview when switching away from image-edit mode
      setState(prev => ({
        ...prev,
        selectedImageForPreview: null,
      }));
    }
  }, [state.mode, sourceEditedImage]);


  const handleImageGenerate = async () => {
    if (!state.productName.trim() || !asset) return;

    // Check generation limit before proceeding
    if (imagesRemaining <= 0) {
      setShowLimitDialog({ type: 'images' });
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, showComparison: false, editedImageUrl: null }));

    try {
      if (!userId) {
        showToast('User must be logged in to generate images', 'error');
        return;
      }

      const imageUrl = sourceEditedImage?.edited_url || (await signedUrls.getSignedUrl('user-uploads', asset.storage_path));
      const enhancedPrompt = buildEnhancedImagePrompt(state.productName);

      showToast('Starting image generation...', 'info');

      const { id: predictionId } = await createReplicateImageJob({
        imageUrl,
        prompt: enhancedPrompt, // This is for the AI model
        aspectRatio: state.selectedRatio,
        userId,
        projectId,
        lineageId: lineageId || undefined,
        parentId: sourceEditedImage?.id,
      });

      // Metadata for server-side upload and DB creation (uses original prompt, not enhanced)
      const metadata = {
        userId,
        projectId,
        prompt: state.productName, // Original prompt for DB record
        lineageId: lineageId || undefined,
        parentId: sourceEditedImage?.id,
      };

      const result = await pollReplicatePrediction(
        predictionId,
        (prediction) => {
          if (prediction.status === 'processing' || prediction.status === 'starting') {
            showToast(`Generating... ${prediction.status}`, 'info');
          } else if (prediction.status === 'succeeded') {
            showToast('Generation complete! Uploading...', 'info');
          }
        },
        120,
        2000,
        metadata
      );

      // Server has already uploaded and created DB record
      if (!result.storagePath) {
        throw new Error('Server did not return storage path');
      }

      const uploadedImageUrl = await signedUrls.getSignedUrl('user-uploads', result.storagePath);
      setState(prev => ({ ...prev, editedImageUrl: uploadedImageUrl, showComparison: true }));
      setEditedImageStoragePath(result.storagePath);

      // Fetch the created image from database
      const createdImage = result.editedImageId 
        ? await database.editedImages.list(projectId, userId).then(images => 
            images.find(img => img.id === result.editedImageId)
          )
        : null;

      // Optimistic cache updates - update cache immediately without refetching
      if (createdImage) {
        queryClient.setQueryData<EditedImage[]>(['edited-images', projectId, userId], (old = []) => [createdImage, ...old]);
        if (createdImage.lineage_id) {
          queryClient.setQueryData<EditedImage[]>(['edited-images', 'lineage', createdImage.lineage_id, userId], (old = []) => [createdImage, ...old]);
        }
      }

      // Invalidate related queries in background (only refetch if actively used)
      // This ensures cache stays fresh without unnecessary refetches
      queryClient.invalidateQueries({
        queryKey: ['edited-images', projectId, userId],
        refetchType: 'active' // Only refetch if query is currently active
      });
      queryClient.invalidateQueries({
        queryKey: ['timelines', projectId, userId],
        refetchType: 'active'
      });

      // Invalidate thumbnail cache for new edited image
      queryClient.invalidateQueries({ queryKey: ['signed-url'] });
      // Dispatch custom event to trigger global thumbnail prefetch refresh
      window.dispatchEvent(new CustomEvent('thumbnail-cache-invalidated'));

      if (createdImage?.lineage_id) {
        queryClient.invalidateQueries({
          queryKey: ['timeline', createdImage.lineage_id, userId],
          refetchType: 'active'
        });
      }

      setState(prev => ({
        ...prev,
        // No need to update versions manually as we use editingHistory from hook
      }));

      showToast('Image generated and saved successfully!', 'success');
      // Refetch limits to update the count
      refetchLimits();
      onSave();
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage = getErrorMessage(error);
      // Check if it's a limit error
      if (errorMessage.includes('limit') || errorMessage.includes('403')) {
        setShowLimitDialog({ type: 'images' });
      } else {
        showToast(errorMessage, 'error');
      }
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

    // Check generation limit before proceeding
    if (videosRemaining <= 0) {
      setShowLimitDialog({ type: 'videos' });
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
        imageUrl = mediaAsset ? await signedUrls.getSignedUrl('user-uploads', mediaAsset.storage_path) : null;
      }

      if (!imageUrl) {
        showToast('Could not find image URL for selected source', 'error');
        return;
      }

      const enhancedPrompt = buildEnhancedVideoPrompt(state.prompt, state.cameraMovement);
      const runwayRatio = mapAspectRatioToRunway(state.aspectRatio);
      
      // Get lineage_id from preferred source
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

      const requestData: RunwayAPI.CreateJobRequest = {
        mode: 'image-to-video',
        promptImage: imageUrl,
        promptText: enhancedPrompt || undefined,
        ratio: runwayRatio,
        userId,
        projectId,
        name: state.prompt || 'Untitled Video',
        aiModel: state.selectedModel,
        aspectRatio: state.aspectRatio,
        cameraMovement: state.cameraMovement,
        lineageId: lineage_id,
        sourceIds: state.selectedSources.map(s => ({ type: s.type, id: s.id })),
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
            showToast('Video generation completed! Uploading...', 'info');
          } else if (status === 'FAILED') {
            showToast('Video generation failed!', 'error');
            setState(prev => ({ ...prev, videoError: true, isGenerating: false }));
          }
        }
      );

      if (result.status === 'SUCCEEDED') {
        // Server has already uploaded and created DB record
        if (!result.storagePath) {
          throw new Error('Server did not return storage path');
        }
        const uploadedVideoUrl = await signedUrls.getSignedUrl('generated-videos', result.storagePath);
        setState(prev => ({ ...prev, generatedVideoUrl: uploadedVideoUrl }));

        // Fetch the created video from database
        const createdVideo = result.videoId
          ? await database.generatedVideos.list(projectId, userId).then(videos =>
              videos.find(v => v.id === result.videoId)
            )
          : null;

        // Manually cache the signed URL for the new video so it's available immediately
        // This prevents a double-fetch when the video appears in the list
        queryClient.setQueryData(
          ['signed-url', 'generated_videos', result.storagePath],
          uploadedVideoUrl
        );

        // Optimistic cache updates - update cache immediately without refetching
        if (createdVideo) {
          queryClient.setQueryData<GeneratedVideo[]>(['generated-videos', projectId, userId], (old = []) => [createdVideo, ...old]);
        }

        // Invalidate related queries in background (only refetch if actively used)
        queryClient.invalidateQueries({
          queryKey: ['generated-videos', projectId, userId],
          refetchType: 'active'
        });

        // Invalidate timeline cache to refresh timeline with new video
        queryClient.invalidateQueries({
          queryKey: ['timelines', projectId, userId],
          refetchType: 'active'
        });

        // Dispatch custom event to trigger global thumbnail prefetch refresh
        window.dispatchEvent(new CustomEvent('thumbnail-cache-invalidated'));

        showToast('Video is ready to view!', 'success');
        // Refetch limits to update the count
        refetchLimits();
        onSave();
      } else {
        throw new Error('Video generation failed');
      }
    } catch (error) {
      console.error('Error generating video:', error);
      const errorMessage = getErrorMessage(error);
      // Check if it's a limit error
      if (errorMessage.includes('limit') || errorMessage.includes('403')) {
        setShowLimitDialog({ type: 'videos' });
      } else {
        showToast(errorMessage, 'error');
      }
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
            storagePath: latestImage.storage_path,
            name: latestImage.prompt.substring(0, 30),
          }];
        } else if (asset) {
          // Fallback to the original asset
          newSelectedSources = [{
            id: asset.id,
            type: 'media_asset',
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
  }, [asset, editingHistory]);

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

        // Validate storage path
        const pathValidation = validateStoragePath(userId, storagePath);
        if (!pathValidation.valid) {
          throw new Error(`Storage path validation failed: ${pathValidation.error}`);
        }

        try {
          await database.storage.upload('user-uploads', storagePath, file);
        } catch (error) {
          const errorResult = handleStorageError(error, 'batch image upload');
          throw new Error(errorResult.error);
        }

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

    // Invalidate media assets cache (only refetch if actively used)
    queryClient.invalidateQueries({
      queryKey: ['media-assets', projectId, userId],
      refetchType: 'active'
    });
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

  const handleImageClick = (source: SelectedSource) => {
    if (state.mode === 'image-edit') {
      // In image-edit mode, set the selected image for preview
      let imageUrl: string | null = null;
      let storagePath: string | null = null;
      let fileName: string = '';

      if (source.type === 'edited_image') {
        // Check both editedImages and editingHistory arrays
        const editedImage = editedImages.find(img => img.id === source.id)
          || editingHistory.find(img => img.id === source.id);
        if (editedImage) {
          imageUrl = editedImage.edited_url || null;
          storagePath = editedImage.storage_path || null;
          fileName = editedImage.prompt.substring(0, 30);
        }
      } else if (source.type === 'media_asset') {
        const mediaAsset = mediaAssets.find(asset => asset.id === source.id);
        if (mediaAsset) {
          // Use storage path directly - UnifiedPreview will handle signing
          imageUrl = null; // Will be fetched by UnifiedPreview
          storagePath = mediaAsset.storage_path;
          fileName = mediaAsset.file_name;
        }
      }

      // For media assets, we might not have imageUrl yet, but we have storagePath
      // For edited images, we usually have both
      if (storagePath || imageUrl) {
        setState(prev => ({
          ...prev,
          selectedImageForPreview: {
            id: source.id,
            url: imageUrl || '', // Will be populated by preview component if missing
            storagePath: storagePath || undefined,
            fileName,
            type: source.type,
          },
          selectedSources: [source], // Update selectedSources to show selection in UI
          editedImageUrl: null, // Clear any edited image when selecting a new source
          showComparison: false,
        }));
        // Update the original image state to reflect the selected image
        setOriginalImageData({
          url: imageUrl || undefined,
          storagePath: storagePath || undefined
        });
      }
    } else {
      // In video-generate mode, handle selection as single selection (no toggle)
      setState(prev => ({ ...prev, selectedSources: [source] }));
    }
  };

  const handleVersionSelect = (version: EditedImage) => {
    const source: SelectedSource = {
      id: version.id,
      type: 'edited_image',
      thumbnail: version.edited_url,
      storagePath: version.storage_path,
      name: version.prompt.substring(0, 30),
    };
    handleImageClick(source);
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
      {showLimitDialog && (
        <LimitReachedDialog
          type={showLimitDialog.type}
          onClose={() => setShowLimitDialog(null)}
        />
      )}
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
          generatedVideos={generatedVideos}
          selectedSources={state.selectedSources}
          isSelecting={state.isSelecting}
          onDragStart={handleDragStart}
          onClick={handleImageClick}
          onFileDrop={handleFileDrop}
          onRefresh={() => {
            // Only refetch active queries to avoid unnecessary network requests
            queryClient.refetchQueries({
              queryKey: ['edited-images', projectId],
              type: 'active' // Only refetch if query is currently active
            });
            queryClient.refetchQueries({
              queryKey: ['media-assets', projectId],
              type: 'active'
            });
            queryClient.refetchQueries({
              queryKey: ['generated-videos', projectId],
              type: 'active'
            });
          }}
        />

        <div className="flex-1 flex flex-col bg-card overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <UnifiedPreview
              mode={state.mode}
              // Image mode props
              originalImageUrl={state.mode === 'image-edit' && state.selectedImageForPreview?.url
                ? state.selectedImageForPreview.url
                : originalImageData?.url}
              originalImageStoragePath={state.mode === 'image-edit' && state.selectedImageForPreview?.storagePath
                ? state.selectedImageForPreview.storagePath
                : originalImageData?.storagePath}
              originalImageBucket="user-uploads"
              editedImageUrl={state.editedImageUrl}
              editedImageStoragePath={editedImageStoragePath}
              editedImageBucket="user-uploads"
              showComparison={state.showComparison}
              fileName={state.mode === 'image-edit' && state.selectedImageForPreview
                ? state.selectedImageForPreview.fileName
                : asset?.file_name}
              // Video mode props
              aspectRatio={state.aspectRatio}
              generatedVideoUrl={state.generatedVideoUrl}
              videoError={state.videoError}
              isGenerating={state.isGenerating}
              selectedSources={state.selectedSources}
              onRemoveSource={removeSource}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onRetryVideo={() => setState(prev => ({ ...prev, videoError: false, generatedVideoUrl: null }))}
            />
          </div>

          <div className="flex-shrink-0">
            <UnifiedControls
              mode={state.mode}
              // Image mode props
              prompt={state.mode === 'image-edit' ? state.productName : state.prompt}
              isGenerating={state.isGenerating}
              canGenerate={canGenerate}
              generateLabel={state.mode === 'image-edit' ? "Edit Image With AI" : "Generate Video"}
              generatingLabel={state.mode === 'image-edit' ? "Generating..." : "Generating Video..."}
              placeholder={state.mode === 'image-edit' ? "Product name (e.g., 'Shoes', 'Candle', 'Mug')" : "Describe the video scene..."}
              onPromptChange={(value) => setState(prev => ({
                ...prev,
                [prev.mode === 'image-edit' ? 'productName' : 'prompt']: value
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
          versions={editingHistory}
          onRatioChange={(ratio) => setState(prev => ({ ...prev, selectedRatio: ratio }))}
          onVersionSelect={handleVersionSelect}
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