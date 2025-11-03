import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { database } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { useUserId } from '../../hooks/useUserId';
import { useToast } from '../../hooks/useToast';
import { useEditedImages } from '../../hooks/useEditedImages';
import { useMediaAssets } from '../../hooks/useMediaAssets';
import { videoModels } from '../../data/aiModels';
import * as RunwayAPI from '../../services/aiModels/runway';
import { VideoGeneratorHeader } from './VideoGeneratorHeader';
import { VideoGeneratorLeftPanel } from './VideoGeneratorLeftPanel';
import { VideoGeneratorPreview } from './VideoGeneratorPreview';
import { VideoGeneratorControls } from './VideoGeneratorControls';
import { VideoGeneratorSidebar } from './VideoGeneratorSidebar';
import { SelectedSource, VideoGeneratorProps } from './types';

export function VideoGenerator({ projectId, onClose, onSave, initialSelectedImageId }: VideoGeneratorProps) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useState(videoModels[0].id);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('9:16');
  const [cameraMovement, setCameraMovement] = useState('dynamic');
  const [prompt, setPrompt] = useState('');
  const [selectedSources, setSelectedSources] = useState<SelectedSource[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'add' | 'remove'>('add');
  const selectionStartRef = useRef<{ id: string; type: 'edited_image' | 'media_asset' } | null>(null);

  // Use React Query hooks to load sources
  const { data: editedImagesData = [] } = useEditedImages(projectId);
  const { data: mediaAssetsData = [] } = useMediaAssets(projectId);

  // Filter media assets to only include images
  const editedImages = editedImagesData;
  const mediaAssets = useMemo(() => 
    (mediaAssetsData || []).filter(asset => asset.file_type === 'image'),
    [mediaAssetsData]
  );

  // Pre-select image if initialSelectedImageId is provided
  useEffect(() => {
    if (initialSelectedImageId && editedImages.length > 0) {
      const imageToSelect = editedImages.find(img => img.id === initialSelectedImageId);
      if (imageToSelect) {
        const source: SelectedSource = {
          id: imageToSelect.id,
          type: 'edited_image',
          thumbnail: imageToSelect.edited_url,
          name: imageToSelect.prompt.substring(0, 30),
        };
        setSelectedSources([source]);
      }
    }
  }, [initialSelectedImageId, editedImages]);

  const getAssetUrl = (storagePath: string) => {
    return database.storage.getPublicUrl('user-uploads', storagePath);
  };

  /**
   * Build enhanced prompt for video generation with camera movement details
   */
  const buildEnhancedPrompt = (userPrompt: string, cameraMovement: string): string => {
    let enhancedPrompt = userPrompt.trim();

    // Add camera movement specific instructions
    switch (cameraMovement) {
      case 'static':
        enhancedPrompt += '. Keep the camera completely still and static throughout the video.';
        break;
      case 'zoom-in':
        enhancedPrompt += '. Use a gradual zoom-in effect that brings the viewer closer to the product details.';
        break;
      case 'zoom-out':
        enhancedPrompt += '. Use a gradual zoom-out effect that shows the product in its environment.';
        break;
      case 'pan-left':
        enhancedPrompt += '. Use a smooth leftward panning motion across the product.';
        break;
      case 'pan-right':
        enhancedPrompt += '. Use a smooth rightward panning motion across the product.';
        break;
      case 'rotate-around':
        enhancedPrompt += '. Create a 360-degree rotation around the product, showing it from all angles.';
        break;
      case 'dynamic':
        enhancedPrompt += '. Use dynamic, intelligent camera movements that highlight the product effectively.';
        break;
      default:
        break;
    }

    return enhancedPrompt;
  };

  const handleGenerate = async () => {
    if (selectedSources.length === 0) {
      showToast('Please select at least one image to generate a video', 'warning');
      return;
    }
    if (!userId) {
      showToast('User must be logged in to generate videos', 'error');
      return;
    }

    setIsGenerating(true);
    setVideoError(false);

    try {
      // Find the first image source (Runway Gen-2 typically uses one image)
      const imageSource = selectedSources.find(source =>
        source.type === 'edited_image' || source.type === 'media_asset'
      );

      if (!imageSource) {
        showToast('No valid image source found', 'error');
        return;
      }

      // Get the actual image data based on the source type
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

      // Prepare the request for Runway API with enhanced prompt
      const enhancedPrompt = buildEnhancedPrompt(prompt, cameraMovement);
      const requestData: RunwayAPI.CreateJobRequest = {
        mode: 'image-to-video',
        promptImage: imageUrl,
        promptText: enhancedPrompt || undefined,
      };

      showToast('Starting video generation...', 'info');

      // Create the Runway job
      const { taskId } = await RunwayAPI.createRunwayJob(requestData);

      // Poll for completion with progress updates
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
            setIsGenerating(false);
          }
        }
      );

      // Store the Runway task ID for later reference
      const runwayTaskId = taskId;

      if (result.status === 'SUCCEEDED' && result.output) {
        // Extract video URL from the response - use direct Runway URL
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

        // Calculate lineage_id from first selected source (prefer edited_image)
        let lineage_id: string | undefined;

        const preferredSource = selectedSources.find(s => s.type === 'edited_image') || selectedSources[0];

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

        // Create video record
        const createdVideo = await database.generatedVideos.create({
          project_id: projectId.trim(),
          user_id: userId.trim(),
          name: prompt || 'Untitled Video',
          ai_model: selectedModel,
          aspect_ratio: aspectRatio,
          camera_movement: cameraMovement,
          runway_task_id: runwayTaskId,
          storage_path: runwayVideoUrl,
          status: 'completed',
          completed_at: new Date().toISOString(),
          lineage_id,
        });

        // Create video_sources
        await Promise.all(selectedSources.map(async (source, index) => {
          await database.videoSources.create({
            video_id: createdVideo.id,
            source_type: source.type,
            source_id: source.id,
            sort_order: index,
          });
        }));

        // Invalidate generated videos query to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['generated-videos', projectId] });

        showToast('Video is ready to view!', 'success');

        // Trigger parent refresh to update the videos list immediately
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
      setIsGenerating(false);
    }
  };

  const removeSource = (id: string) => {
    setSelectedSources(selectedSources.filter((s) => s.id !== id));
  };

  const addSource = (source: SelectedSource) => {
    if (!selectedSources.find((s) => s.id === source.id)) {
      setSelectedSources([...selectedSources, source]);
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
    const isSelected = selectedSources.find((s) => s.id === source.id);
    setSelectionMode(isSelected ? 'remove' : 'add');
    setIsSelecting(true);
    selectionStartRef.current = { id: source.id, type: source.type };

    if (isSelected) {
      removeSource(source.id);
    } else {
      addSource(source);
    }
  };

  const handleImageMouseEnter = (source: SelectedSource) => {
    if (!isSelecting) return;

    const isSelected = selectedSources.find((s) => s.id === source.id);

    if (selectionMode === 'add' && !isSelected) {
      addSource(source);
    } else if (selectionMode === 'remove' && isSelected) {
      removeSource(source.id);
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    selectionStartRef.current = null;
  };

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isSelecting]);

  const handleFileDrop = async (files: File[]) => {
    if (!userId || !userId.trim()) {
      showToast('User ID is required to upload files', 'error');
      return;
    }
    if (!projectId || !projectId.trim()) {
      showToast('Project ID is required to upload files', 'error');
      return;
    }

    for (const file of files) {
      try {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const storagePath = `${userId.trim()}/${projectId.trim()}/${fileName}`;

        await database.storage.upload('user-uploads', storagePath, file);

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

        await database.mediaAssets.create({
          project_id: projectId.trim(),
          user_id: userId.trim(),
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

    // Cache invalidation handled by useUploadMedia hook (if used) or manual invalidation
    await queryClient.invalidateQueries({ queryKey: ['media-assets', projectId] });
  };

  const canGenerate = selectedSources.length > 0;
  const selectedModelInfo = videoModels.find((m) => m.id === selectedModel);

  return (
    <motion.div
      className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <VideoGeneratorHeader onClose={onClose} />

      <div className="flex-1 flex overflow-hidden">
        <VideoGeneratorLeftPanel
          editedImages={editedImages}
          mediaAssets={mediaAssets}
          selectedSources={selectedSources}
          isSelecting={isSelecting}
          projectId={projectId}
          userId={userId}
          onDragStart={handleDragStart}
          onMouseDown={handleImageMouseDown}
          onMouseEnter={handleImageMouseEnter}
          onFileDrop={handleFileDrop}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['edited-images', projectId] });
            queryClient.invalidateQueries({ queryKey: ['media-assets', projectId] });
          }}
        />

        <div className="flex-1 flex flex-col bg-card overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <VideoGeneratorPreview
              aspectRatio={aspectRatio}
              generatedVideoUrl={generatedVideoUrl}
              videoError={videoError}
              isGenerating={isGenerating}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onRetryVideo={() => {
                setVideoError(false);
                setGeneratedVideoUrl(null);
              }}
              onVideoError={() => setVideoError(true)}
            />
          </div>
          <div className="flex-shrink-0">
            <VideoGeneratorControls
              prompt={prompt}
              selectedModel={selectedModelInfo?.name || ''}
              cameraMovement={cameraMovement}
              canGenerate={canGenerate}
              isGenerating={isGenerating}
              selectedSources={selectedSources}
              onPromptChange={setPrompt}
              onGenerate={handleGenerate}
              onRemoveSource={removeSource}
            />
          </div>
        </div>
        <VideoGeneratorSidebar
          selectedModel={selectedModel}
          aspectRatio={aspectRatio}
          cameraMovement={cameraMovement}
          onModelChange={setSelectedModel}
          onAspectRatioChange={setAspectRatio}
          onCameraMovementChange={setCameraMovement}
        />
      </div>
    </motion.div>
  );
}

