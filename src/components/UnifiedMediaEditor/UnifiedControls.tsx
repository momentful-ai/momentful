import { PromptControls } from '../shared/PromptControls';
import { ImageEditorSidebar } from '../ImageEditor/ImageEditorSidebar';
import { VideoGeneratorControls } from '../VideoGenerator/VideoGeneratorControls';
import { VideoGeneratorSidebar } from '../VideoGenerator/VideoGeneratorSidebar';
import { EditorMode } from './types';

interface UnifiedControlsProps {
  mode: EditorMode;
  prompt: string;
  onPromptChange: (prompt: string) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  hasAsset: boolean; // Whether there's an asset available for image editing
  // Image editing props
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
  versions: any[];
  // Video generation props
  selectedModel: string;
  onModelChange: (model: string) => void;
  aspectRatioVideo: '16:9' | '9:16' | '1:1' | '4:5';
  onAspectRatioChange: (ratio: '16:9' | '9:16' | '1:1' | '4:5') => void;
  cameraMovement: string;
  onCameraMovementChange: (movement: string) => void;
  selectedSources: string[];
  onRemoveSource?: (id: string) => void;
}

export function UnifiedControls({
  mode,
  prompt,
  onPromptChange,
  isGenerating,
  canGenerate,
  onGenerate,
  hasAsset,
  selectedRatio,
  onRatioChange,
  versions,
  selectedModel,
  onModelChange,
  aspectRatioVideo,
  onAspectRatioChange,
  cameraMovement,
  onCameraMovementChange,
  selectedSources,
  onRemoveSource
}: UnifiedControlsProps) {
  return (
    <div className="flex border-t bg-card">
      <div className="flex-1">
        {mode === 'image' ? (
          hasAsset ? (
            <PromptControls
              prompt={prompt}
              isGenerating={isGenerating}
              canGenerate={canGenerate}
              generateLabel="Edit Image With AI"
              generatingLabel="Generating..."
              placeholder="Product name (e.g., 'Shoes', 'Candle', 'Mug')"
              onPromptChange={onPromptChange}
              onGenerate={onGenerate}
              icon="wand"
            >
              {/* Image editing specific controls can go here if needed */}
            </PromptControls>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p className="text-sm">Select an image from the left panel to start editing</p>
            </div>
          )
        ) : (
            <VideoGeneratorControls
            prompt={prompt}
            cameraMovement={cameraMovement}
            canGenerate={canGenerate}
            isGenerating={isGenerating}
            selectedSources={selectedSources.map(id => ({
              id,
              type: 'edited_image' as const,
              thumbnail: '', // TODO: Add thumbnail
              name: 'Selected Image'
            }))}
            maxSelectedSources={1}
            onPromptChange={onPromptChange}
            onGenerate={onGenerate}
            onRemoveSource={(id) => {
              if (onRemoveSource) {
                onRemoveSource(id);
              }
            }}
          />
        )}
      </div>

      {((mode === 'image' && hasAsset) || mode === 'video') && (
        <div className="flex-none w-80 border-l">
          {mode === 'image' ? (
            <ImageEditorSidebar
              selectedRatio={selectedRatio}
              versions={versions}
              onRatioChange={onRatioChange}
            />
          ) : (
            <VideoGeneratorSidebar
              selectedModel={selectedModel}
              aspectRatio={aspectRatioVideo}
              cameraMovement={cameraMovement}
              onModelChange={onModelChange}
              onAspectRatioChange={onAspectRatioChange}
              onCameraMovementChange={onCameraMovementChange}
            />
          )}
        </div>
      )}
    </div>
  );
}