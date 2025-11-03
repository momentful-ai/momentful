import { MediaGrid } from '../shared';
import { EditedImage } from '../../types';

interface ImageEditorImageListProps {
  editedImages: EditedImage[];
  isLoading?: boolean;
  selectedImageId?: string | null;
  onSelectImage?: (image: EditedImage) => void;
  onEditImage?: (image: EditedImage) => void;
  onNavigateToVideo?: (imageId: string) => void;
}

export function ImageEditorImageList({
  editedImages,
  isLoading = false,
  selectedImageId,
  onSelectImage,
  onEditImage,
  onNavigateToVideo,
}: ImageEditorImageListProps) {
  return (
    <div className="min-h-[10vh]">
      <MediaGrid
        title="Editing History"
        items={editedImages}
        isLoading={isLoading}
        emptyMessage={{
          title: "No editing history yet",
          subtitle: "Generated images will appear here"
        }}
        selectedItemId={selectedImageId}
        onSelectItem={onSelectImage ? (item) => onSelectImage(item as EditedImage) : undefined}
        onEditItem={(item) => onEditImage?.(item as EditedImage)}
        onNavigateToVideo={onNavigateToVideo}
        gridCols={{ default: 4, md: 6 }}
        itemActions="edit"
        showPrompt={true}
        itemType="image"
        isSelectable={Boolean(onSelectImage)}
      />
    </div>
  );
}


