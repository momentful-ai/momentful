import { useState } from 'react';
import { X, Download, Loader, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserId } from '../hooks/useUserId';

interface ExportModalProps {
  projectId: string;
  assetId: string;
  assetType: 'video' | 'image';
  assetUrl: string;
  onClose: () => void;
}

const VIDEO_FORMATS = [
  { id: 'mp4', label: 'MP4', description: 'Universal format, best compatibility' },
  { id: 'webm', label: 'WebM', description: 'Web optimized, smaller file size' },
  { id: 'mov', label: 'MOV', description: 'High quality, best for editing' },
];

const IMAGE_FORMATS = [
  { id: 'jpg', label: 'JPG', description: 'Compressed, smaller file size' },
  { id: 'png', label: 'PNG', description: 'Lossless, transparent backgrounds' },
  { id: 'webp', label: 'WebP', description: 'Modern format, best compression' },
];

const QUALITY_OPTIONS = [
  { id: 'high', label: 'High Quality', description: 'Best quality, larger file' },
  { id: 'medium', label: 'Medium Quality', description: 'Balanced quality and size' },
  { id: 'low', label: 'Low Quality', description: 'Smaller file, reduced quality' },
];

export function ExportModal({ projectId, assetId, assetType, assetUrl, onClose }: ExportModalProps) {
  const userId = useUserId();
  const [format, setFormat] = useState(assetType === 'video' ? 'mp4' : 'jpg');
  const [quality, setQuality] = useState('high');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const formats = assetType === 'video' ? VIDEO_FORMATS : IMAGE_FORMATS;

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');

    try {
      // Create export record
      const { data: exportData, error: exportError } = await supabase
        .from('exports')
        .insert({
          project_id: projectId,
          user_id: userId,
          export_type: assetType,
          asset_ids: [assetId],
          format,
          settings: { quality },
          status: 'processing',
        })
        .select()
        .single();

      if (exportError) throw exportError;

      // Simulate export processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update export record
      await supabase
        .from('exports')
        .update({
          status: 'completed',
          file_url: assetUrl,
          file_size: 1024000,
          completed_at: new Date().toISOString(),
        })
        .eq('id', exportData.id);

      // Trigger download
      const link = document.createElement('a');
      link.href = assetUrl;
      link.download = `export-${assetId}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Export {assetType === 'video' ? 'Video' : 'Image'}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <p className="text-slate-600 mt-1">
            Choose your export settings
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Format</h3>
            <div className="space-y-2">
              {formats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    format === f.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900">{f.label}</span>
                    {format === f.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{f.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Quality</h3>
            <div className="space-y-2">
              {QUALITY_OPTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setQuality(q.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    quality === q.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900">{q.label}</span>
                    {quality === q.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{q.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isExporting ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : exportStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Export Complete!</span>
              </>
            ) : exportStatus === 'error' ? (
              <>
                <XCircle className="w-5 h-5" />
                <span>Export Failed</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Export & Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
