import { useQuery } from '@tanstack/react-query';
import { database } from '../lib/database';
import { MediaAsset } from '../types';

/**
 * Hook to fetch the source MediaAsset from an EditedImage's source_asset_id
 * Used when editing an EditedImage - we need to get the original MediaAsset
 * to pass to the ImageEditor component
 */
export function useSourceMediaAsset(sourceAssetId: string | null | undefined) {
  return useQuery<MediaAsset | null>({
    queryKey: ['media-asset', sourceAssetId],
    queryFn: async () => {
      if (!sourceAssetId) {
        return null;
      }
      try {
        return await database.mediaAssets.getById(sourceAssetId);
      } catch (error) {
        console.error('Error fetching source media asset:', error);
        return null;
      }
    },
    enabled: !!sourceAssetId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

