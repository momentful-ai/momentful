import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { Button } from './ui/button';
import { isLocalhost, getLocalOverride } from '../lib/local-mode';

export function DevToolbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<string>('clerk');
  const [supabaseBackend, setSupabaseBackend] = useState<string>('hosted');
  const [showAllSkeletons, setShowAllSkeletons] = useState<boolean>(false);

  // Load initial values from localStorage
  useEffect(() => {
    const authOverride = getLocalOverride('DEV_AUTH_MODE');
    const supabaseOverride = getLocalOverride('DEV_SUPABASE_BACKEND');
    const skeletonsOverride = getLocalOverride('DEV_SHOW_ALL_SKELETONS');

    if (authOverride) setAuthMode(authOverride);
    if (supabaseOverride) setSupabaseBackend(supabaseOverride);
    if (skeletonsOverride === 'true') setShowAllSkeletons(true);
  }, []);

  // Only show in local development
  // Check both Vite dev mode and localhost to ensure it's not shown in production builds
  const isDev = import.meta.env.DEV && isLocalhost();
  if (!isDev) return null;

  const handleAuthModeChange = (mode: string) => {
    setAuthMode(mode);
    localStorage.setItem('DEV_AUTH_MODE', mode);
    window.location.reload();
  };

  const handleSupabaseBackendChange = (backend: string) => {
    setSupabaseBackend(backend);
    localStorage.setItem('DEV_SUPABASE_BACKEND', backend);
    window.location.reload();
  };

  const handleShowAllSkeletonsChange = (enabled: boolean) => {
    setShowAllSkeletons(enabled);
    localStorage.setItem('DEV_SHOW_ALL_SKELETONS', enabled ? 'true' : 'false');
    // Dispatch custom event so components can react without reload
    window.dispatchEvent(new CustomEvent('dev-skeletons-toggle', { detail: { enabled } }));
  };

  if (!isOpen) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-background/80 backdrop-blur-sm border border-border shadow-lg"
        >
          <Settings className="w-4 h-4 mr-2" />
          Dev
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Development Toolbar</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            Auth Mode
          </label>
          <div className="flex gap-2">
            <Button
              variant={authMode === 'clerk' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAuthModeChange('clerk')}
              className="flex-1"
            >
              Clerk
            </Button>
            <Button
              variant={authMode === 'bypass' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAuthModeChange('bypass')}
              className="flex-1"
            >
              Bypass
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            Supabase Backend
          </label>
          <div className="flex gap-2">
            <Button
              variant={supabaseBackend === 'hosted' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSupabaseBackendChange('hosted')}
              className="flex-1"
            >
              Hosted
            </Button>
            <Button
              variant={supabaseBackend === 'local' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSupabaseBackendChange('local')}
              className="flex-1"
            >
              Local
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-2">
            Show All Loading Skeletons
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleShowAllSkeletonsChange(!showAllSkeletons)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                showAllSkeletons ? 'bg-primary' : 'bg-muted'
              }`}
              role="switch"
              aria-checked={showAllSkeletons}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showAllSkeletons ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs text-muted-foreground">
              {showAllSkeletons ? 'On' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Auth & Backend changes require page reload. Only visible in local dev mode.
        </p>
      </div>
    </div>
  );
}
