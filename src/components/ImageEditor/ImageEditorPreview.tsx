interface ImageEditorPreviewProps {
  originalImageUrl: string;
  editedImageUrl: string | null;
  showComparison: boolean;
  fileName: string;
}

export function ImageEditorPreview({
  originalImageUrl,
  editedImageUrl,
  showComparison,
  fileName,
}: ImageEditorPreviewProps) {
  const shouldShowComparison = showComparison && !!editedImageUrl && editedImageUrl !== originalImageUrl;

  return (
    <div className="h-full bg-card overflow-hidden">
      <div className="h-full flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          {!shouldShowComparison ? (
            <div className="flex items-center justify-center w-full h-full animate-fade-in">
              <img
                src={originalImageUrl}
                alt={fileName}
                className="max-w-full max-h-full rounded-xl transition-transform hover:scale-105"
                style={{ objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 w-full h-full animate-fade-in">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Original
                </div>
                <div className="flex-1 flex items-center justify-center w-full">
                  <img
                    src={originalImageUrl}
                    alt="Original"
                    className="max-w-full max-h-full rounded-xl"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  AI Edited
                </div>
                <div className="flex-1 flex items-center justify-center w-full">
                  <img
                    src={editedImageUrl || originalImageUrl}
                    alt="Edited"
                    className="max-w-full max-h-full rounded-xl"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

