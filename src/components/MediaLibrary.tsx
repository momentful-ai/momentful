import { useState, useEffect } from 'react';
import { Trash2, Image as ImageIcon, Film, Clock, Wand2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MediaLibrarySkeleton } from './LoadingSkeleton';
import { MediaAsset } from '../types';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface MediaLibraryProps {
  projectId: string;
  onRefresh?: number;
  onEditImage?: (asset: MediaAsset, projectId: string) => void;
}

export function MediaLibrary({ projectId, onRefresh, onEditImage }: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadAssets();
  }, [projectId, onRefresh]);

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAsset = async (assetId: string, storagePath: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: storageError } = await supabase.storage
        .from('user-uploads')
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('media_assets')
        .delete()
        .eq('id', assetId);

      if (dbError) throw dbError;

      setAssets((prev) => prev.filter((a) => a.id !== assetId));
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete asset. Please try again.');
    }
  };

  const getAssetUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (files: File[]) => {
    const imageFiles = files.filter((file) =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
    );

    if (imageFiles.length === 0) {
      alert('Please upload valid image files');
      return;
    }

    setUploading(true);

    try {
      for (const file of imageFiles) {
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const storagePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

        const { error: dbError } = await supabase
          .from('media_assets')
          .insert({
            project_id: projectId,
            file_name: file.name,
            file_type: 'image',
            file_size: file.size,
            storage_path: storagePath,
            width: img.width,
            height: img.height,
          });

        if (dbError) throw dbError;
      }

      await loadAssets();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload some files');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  if (loading) {
    return <MediaLibrarySkeleton />;
  }

  if (assets.length === 0) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative"
      >
        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center border-2 border-dashed border-primary">
            <div className="text-center">
              <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
              <p className="text-2xl font-semibold text-primary">Drop images to upload</p>
            </div>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xl font-semibold">Uploading...</p>
            </div>
          </div>
        )}
        <Card className="border-2 border-dashed p-12 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">
            No media assets yet
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto text-lg mb-2">
            Upload images and videos to get started with your project
          </p>
          <p className="text-muted-foreground/60 flex items-center gap-2 justify-center">
            <Upload className="w-4 h-4" />
            Drag images here to upload
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative"
    >
      {isDragging && (
        <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-card rounded-xl p-8 shadow-2xl border-2 border-dashed border-primary">
            <Upload className="w-16 h-16 text-primary mx-auto mb-4" />
            <p className="text-2xl font-semibold text-primary">Drop images to upload</p>
          </div>
        </div>
      )}
      {uploading && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card rounded-xl p-8 shadow-2xl">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xl font-semibold">Uploading...</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {assets.map((asset, index) => (
          <Card
            key={asset.id}
            className={cn(
              'group relative overflow-hidden cursor-pointer hover-lift hover-glow transition-all animate-slide-up',
              selectedAsset === asset.id
                ? 'ring-2 ring-primary shadow-xl'
                : 'hover:ring-2 hover:ring-primary/50'
            )}
            style={{
              animationDelay: `${index * 30}ms`,
              animationFillMode: 'backwards'
            }}
            onClick={() => setSelectedAsset(asset.id === selectedAsset ? null : asset.id)}
          >
            <div className="aspect-square bg-muted overflow-hidden relative">
              {asset.file_type === 'image' ? (
                <img
                  src={getAssetUrl(asset.storage_path)}
                  alt={asset.file_name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={getAssetUrl(asset.storage_path)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Film className="w-12 h-12 text-white drop-shadow-lg" />
                  </div>
                  {asset.duration && (
                    <Badge className="absolute bottom-2 right-2 gap-1 shadow-lg">
                      <Clock className="w-3 h-3" />
                      {formatDuration(asset.duration)}
                    </Badge>
                  )}
                </div>
              )}

              {asset.file_type === 'image' && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditImage?.(asset, projectId);
                    }}
                    variant="secondary"
                    className="glass shadow-lg gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Edit with AI
                  </Button>
                </div>
              )}

              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAsset(asset.id, asset.storage_path);
                }}
                size="icon"
                variant="destructive"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3">
              <p className="text-sm font-medium truncate mb-1" title={asset.file_name}>
                {asset.file_name}
              </p>
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="text-xs">
                  {formatFileSize(asset.file_size)}
                </Badge>
                {asset.width && asset.height && (
                  <span className="text-xs text-muted-foreground">
                    {asset.width} × {asset.height}
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
