import { ReactNode, useEffect, useMemo, useState } from 'react';
import { SignIn, useUser, useSession } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { Moon, Sun } from 'lucide-react';
import { setClerkTokenProvider } from '../lib/supabase';
import { useBypassContext } from '../hooks/useBypassContext';
import { useTheme } from '../hooks/useTheme';
import { Button } from './ui/button';
import { DevToolbar } from './DevToolbar';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isBypassEnabled = useBypassContext();
  const { theme, setTheme } = useTheme();
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  const { isLoaded, isSignedIn } = useUser();
  const { session } = useSession();

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // Determine if dark theme is active
  const isDarkTheme = useMemo(() => {
    if (theme === 'system') {
      return systemPrefersDark;
    }
    return theme === 'dark';
  }, [theme, systemPrefersDark]);

  useEffect(() => {
    if (isBypassEnabled) {
      // In bypass mode, clear the token provider to use fallback
      setClerkTokenProvider(null);
      return;
    }

    if (!isSignedIn || !session) {
      setClerkTokenProvider(null);
      return;
    }

    // Set up the token provider to get fresh tokens from Clerk
    setClerkTokenProvider(async () => {
      const token = await session.getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Failed to get Clerk JWT token');
      }
      return token;
    });
  }, [isBypassEnabled, isSignedIn, session]);

  // In bypass mode, skip all auth checks
  if (isBypassEnabled) {
    return <>{children}</>;
  }

  if (!isLoaded) {
    return (
      <>
        <DevToolbar />
        <div className={`min-h-screen bg-gradient-to-br ${
          isDarkTheme ? 'from-slate-900 to-slate-800' : 'from-slate-50 to-slate-100'
        } flex items-center justify-center`}>
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
            isDarkTheme ? 'border-blue-400' : 'border-blue-500'
          }`} />
        </div>
      </>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <DevToolbar />
        <div className={`min-h-screen bg-gradient-to-br ${
          isDarkTheme ? 'from-slate-900 to-slate-800' : 'from-slate-50 to-slate-100'
        } flex items-center justify-center p-4 relative`}>
          <a 
            href="/" 
            className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-3 no-underline font-bold text-2xl z-10 transition-transform duration-300 hover:scale-105"
            style={{
              color: isDarkTheme ? '#f9fafb' : '#1f2937',
            }}
          >
            <div 
              className="flex items-center justify-center text-white"
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                borderRadius: '8px',
                fontSize: '1.2rem',
              }}
            >
              ✨
            </div>
            <span>momentful</span>
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 rounded-full"
            aria-label="Toggle theme"
          >
            {isDarkTheme ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className={`text-3xl font-bold mb-2 ${
                isDarkTheme ? 'text-white' : 'text-slate-900'
              }`}>
                Welcome to momentful!
              </h1>
              <p className={isDarkTheme ? 'text-slate-300' : 'text-slate-600'}>
                Create stunning marketing visuals with AI
              </p>
            </div>
            <SignIn
              appearance={{
                baseTheme: isDarkTheme ? dark : undefined,
                elements: {
                  rootBox: 'mx-auto',
                  card: 'shadow-xl',
                },
              }}
            />
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
