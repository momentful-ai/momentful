import { useState } from 'react';
import { X, Youtube, Send, CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserId } from '../hooks/useUserId';

interface PublishModalProps {
  projectId: string;
  assetId: string;
  assetType: 'video' | 'image';
  onClose: () => void;
}

const PLATFORMS = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    description: 'Upload to YouTube channel',
    supportedTypes: ['video'] as const
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Send,
    description: 'Post to TikTok profile',
    supportedTypes: ['video'] as const
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Send,
    description: 'Share to Instagram feed or stories',
    supportedTypes: ['video', 'image'] as const
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Send,
    description: 'Post to Facebook page',
    supportedTypes: ['video', 'image'] as const
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Send,
    description: 'Tweet on X platform',
    supportedTypes: ['video', 'image'] as const
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Send,
    description: 'Share on LinkedIn profile',
    supportedTypes: ['video', 'image'] as const
  },
];

export function PublishModal({ projectId, assetId, assetType, onClose }: PublishModalProps) {
  const userId = useUserId();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const availablePlatforms = PLATFORMS.filter((p) =>
    p.supportedTypes.includes(assetType)
  );

  const handlePublish = async () => {
    if (!selectedPlatform) return;

    setIsPublishing(true);
    setPublishStatus('idle');

    try {
      // Simulate publishing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const platformUrl = `https://${selectedPlatform}.com/post/${assetId}`;

      // Create publish log
      const { error: publishError } = await supabase
        .from('publish_logs')
        .insert({
          project_id: projectId,
          user_id: userId,
          asset_id: assetId,
          asset_type: assetType,
          platform: selectedPlatform,
          platform_url: platformUrl,
          metadata: { title, description },
          status: 'published',
          published_at: new Date().toISOString(),
        });

      if (publishError) throw publishError;

      setPublishStatus('success');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Publish error:', error);
      setPublishStatus('error');
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedPlatformInfo = PLATFORMS.find((p) => p.id === selectedPlatform);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Publish {assetType === 'video' ? 'Video' : 'Image'}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <p className="text-slate-600 mt-1">
            Share your content to social platforms
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Select Platform</h3>
            <div className="grid grid-cols-2 gap-3">
              {availablePlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPlatform === platform.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-slate-700" />
                      <span className="font-medium text-slate-900">{platform.name}</span>
                    </div>
                    <p className="text-xs text-slate-600">{platform.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedPlatform && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Title / Caption
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Enter title for ${selectedPlatformInfo?.name}`}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description or caption..."
                  className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 sticky bottom-0 bg-white">
          <button
            onClick={handlePublish}
            disabled={!selectedPlatform || isPublishing}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isPublishing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : publishStatus === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Published Successfully!</span>
              </>
            ) : publishStatus === 'error' ? (
              <>
                <XCircle className="w-5 h-5" />
                <span>Publish Failed</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Publish to {selectedPlatformInfo?.name || 'Platform'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
