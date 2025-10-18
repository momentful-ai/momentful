import { ReactNode } from 'react';
import { Sparkles, LogOut, User, Moon, Sun } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { isLocalMode } from '../lib/local-mode';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const localMode = isLocalMode();
  const { user } = localMode ? { user: null } : useUser();
  const { signOut } = localMode ? { signOut: () => {} } : useClerk();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full glass border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="gradient-primary p-2 rounded-xl shadow-lg">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gradient">
                Visual Studio
              </h1>
              {localMode && (
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md font-medium border border-border">
                  Local Mode
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              {localMode ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="hidden sm:inline text-sm text-muted-foreground">Local Dev</span>
                </div>
              ) : (
                user && (
                  <>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <span className="max-w-[150px] truncate text-sm text-muted-foreground">
                        {user.firstName || user.emailAddresses[0]?.emailAddress}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => signOut()}
                      className="gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </Button>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
