import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { database } from '../../lib/database';
import { useUserId } from '../../hooks/useUserId';
import { useToast } from '../../hooks/useToast';
import { videoModels } from '../../data/aiModels';
import { EditedImage, MediaAsset } from '../../types';
import * as RunwayAPI from '../../services/aiModels/runway';
import { VideoGeneratorHeader } from './VideoGeneratorHeader';
import { VideoGeneratorLeftPanel } from './VideoGeneratorLeftPanel';
import { VideoGeneratorPreview } from './VideoGeneratorPreview';
import { VideoGeneratorControls } from './VideoGeneratorControls';
import { VideoGeneratorSidebar } from './VideoGeneratorSidebar';
import { SelectedSource, VideoGeneratorProps } from './types';

export function VideoGenerator({ projectId, onClose, onSave }: VideoGeneratorProps) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedModel, setSelectedModel] = useState(videoModels[0].id);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('16:9');
  const [sceneType, setSceneType] = useState('product-showcase');
  const [cameraMovement, setCameraMovement] = useState('static');
  const [prompt, setPrompt] = useState('');
  const [selectedSources, setSelectedSources] = useState<SelectedSource[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [editedImages, setEditedImages] = useState<EditedImage[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'add' | 'remove'>('add');
  const selectionStartRef = useRef<{ id: string; type: 'edited_image' | 'media_asset' } | null>(null);

  const loadSources = useCallback(async () => {
    try {
      const [editedImagesData, mediaAssetsData] = await Promise.all([
        database.editedImages.list(projectId),
        database.mediaAssets.list(projectId),
      ]);

      setEditedImages(editedImagesData || []);
      // Filter media assets to only include images
      const imageAssets = (mediaAssetsData || []).filter(asset => asset.file_type === 'image');
      setMediaAssets(imageAssets);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const getAssetUrl = (storagePath: string) => {
    return database.storage.getPublicUrl('user-uploads', storagePath);
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

      // Prepare the request for Runway API
      const requestData: RunwayAPI.CreateJobRequest = {
        mode: 'image-to-video',
        promptImage: imageUrl,
        promptText: prompt.trim() || undefined,
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

        // Save video metadata to database with Runway URL
        await database.generatedVideos.create({
          project_id: projectId,
          user_id: userId,
          name: prompt || 'Untitled Video',
          ai_model: selectedModel,
          aspect_ratio: aspectRatio,
          scene_type: sceneType,
          camera_movement: cameraMovement,
          runway_task_id: runwayTaskId,
          video_url: runwayVideoUrl,
          storage_path: runwayVideoUrl,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

        console.log('Generated video URL:', runwayVideoUrl);
        setGeneratedVideoUrl(runwayVideoUrl);

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
    if (!userId) return;

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

    // Invalidate queries to refresh the UI
    await queryClient.invalidateQueries({ queryKey: ['media-assets', projectId] });
  };

  const canGenerate = selectedSources.length > 0;
  const selectedModelInfo = videoModels.find((m) => m.id === selectedModel);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-fade-in">
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
          onRefresh={loadSources}
        />

        <div className="flex-1 flex flex-col">
          <VideoGeneratorPreview
            aspectRatio={aspectRatio}
            generatedVideoUrl={generatedVideoUrl}
            videoError={videoError}
            isGenerating={isGenerating}
            selectedSources={selectedSources}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onRemoveSource={removeSource}
            onRetryVideo={() => {
              setVideoError(false);
              setGeneratedVideoUrl(null);
            }}
            onVideoError={() => setVideoError(true)}
          />

          <VideoGeneratorControls
            prompt={prompt}
            selectedModel={selectedModelInfo?.name || ''}
            sceneType={sceneType}
            cameraMovement={cameraMovement}
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            onPromptChange={setPrompt}
            onGenerate={handleGenerate}
          />
        </div>

        <VideoGeneratorSidebar
          selectedModel={selectedModel}
          aspectRatio={aspectRatio}
          sceneType={sceneType}
          cameraMovement={cameraMovement}
          onModelChange={setSelectedModel}
          onAspectRatioChange={setAspectRatio}
          onSceneTypeChange={setSceneType}
          onCameraMovementChange={setCameraMovement}
        />
      </div>
    </div>
  );
}

