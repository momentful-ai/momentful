import { getLocalOverride } from './local-mode';

/**
 * Check if demo data mode is enabled
 * This should be used throughout the app to bypass Supabase calls
 */
export function isDemoMode(): boolean {
    return getLocalOverride('DEV_DEMO_DATA') === 'true';
}

/**
 * Check if a path is a local dev asset
 */
export function isDevAssetPath(path: string): boolean {
    return path.startsWith('/dev-assets/');
}
