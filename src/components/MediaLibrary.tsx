import { useState, useEffect } from 'react';
import { Trash2, Image as ImageIcon, Film, Clock, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ImageEditor } from './ImageEditor';
import { MediaLibrarySkeleton } from './LoadingSkeleton';
import { MediaAsset } from '../types';

interface MediaLibraryProps {
  projectId: string;
  onRefresh?: number;
}

export function MediaLibrary({ projectId, onRefresh }: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);

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

  if (loading) {
    return <MediaLibrarySkeleton />;
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No media assets yet
        </h3>
        <p className="text-slate-600">
          Upload images and videos to get started with your project
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className={`group relative bg-white rounded-lg border-2 transition-all cursor-pointer hover:scale-105 animate-fade-in ${
              selectedAsset === asset.id
                ? 'border-blue-500 shadow-lg scale-105'
                : 'border-slate-200 hover:border-slate-300'
            }`}
            onClick={() => setSelectedAsset(asset.id === selectedAsset ? null : asset.id)}
          >
            <div className="aspect-square bg-slate-100 rounded-t-lg overflow-hidden relative">
              {asset.file_type === 'image' ? (
                <img
                  src={getAssetUrl(asset.storage_path)}
                  alt={asset.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  <video
                    src={getAssetUrl(asset.storage_path)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Film className="w-12 h-12 text-white" />
                  </div>
                  {asset.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(asset.duration)}
                    </div>
                  )}
                </div>
              )}

              {asset.file_type === 'image' && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAsset(asset);
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                    Edit with AI
                  </button>
                </div>
              )}
            </div>

            <div className="p-3">
              <p className="text-sm font-medium text-slate-900 truncate" title={asset.file_name}>
                {asset.file_name}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-500">
                  {formatFileSize(asset.file_size)}
                </p>
                {asset.width && asset.height && (
                  <p className="text-xs text-slate-500">
                    {asset.width} × {asset.height}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteAsset(asset.id, asset.storage_path);
              }}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {editingAsset && (
        <ImageEditor
          asset={editingAsset}
          projectId={projectId}
          onClose={() => setEditingAsset(null)}
          onSave={() => {
            setEditingAsset(null);
            loadAssets();
          }}
        />
      )}
    </>
  );
}
