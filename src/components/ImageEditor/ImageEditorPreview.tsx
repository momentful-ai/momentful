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
  return (
    <div className="flex-1 bg-card flex flex-col">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {!showComparison ? (
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center animate-fade-in">
              <img
                src={originalImageUrl}
                alt={fileName}
                className="w-full h-full object-contain rounded-xl transition-transform hover:scale-105"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 animate-fade-in">
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  Original
                </div>
                <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                  <img
                    src={originalImageUrl}
                    alt="Original"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-medium text-muted-foreground">
                  AI Edited
                </div>
                <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                  <img
                    src={editedImageUrl || originalImageUrl}
                    alt="Edited"
                    className="w-full h-full object-contain rounded-xl"
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

