import { ReactNode } from "react";
import { LogOut, User, Moon, Sun } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useBypassContext } from "../hooks/useBypassContext";
import { useTheme } from "../hooks/useTheme";
import { useUserGenerationLimits } from "../hooks/useUserGenerationLimits";
import { Button } from "./ui/button";
import { DevToolbar } from "./DevToolbar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isBypassEnabled = useBypassContext();

  // Always call Clerk hooks first to maintain hook order
  const { user } = useUser();
  const { signOut } = useClerk();

  // Override with null values in bypass mode
  const displayUser = isBypassEnabled ? null : user;
  const displaySignOut = isBypassEnabled ? () => {} : signOut;
  const { theme, setTheme } = useTheme();
  const {
    imagesRemaining,
    videosRemaining,
    isLoading: limitsLoading,
  } = useUserGenerationLimits();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="sticky top-0 z-40 w-full glass border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="/"
                className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
              >
                <img
                  src="/logo-text.png"
                  alt="momentful"
                  className="h-6 w-auto"
                />
                <h1
                  className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-[-0.03em] font-medium"
                  style={{ fontFamily: '"M PLUS Rounded 1c", sans-serif' }}
                >
                  momentful
                </h1>
              </a>
              {isBypassEnabled && (
                <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-md font-medium border border-border">
                  Local Mode
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              {isBypassEnabled ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <span className="hidden sm:inline text-sm text-muted-foreground">
                    Local Dev
                  </span>
                </div>
              ) : (
                displayUser && (
                  <>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="max-w-[150px] truncate text-sm text-muted-foreground">
                          {displayUser.firstName ||
                            displayUser.emailAddresses[0]?.emailAddress}
                        </span>
                        {!limitsLoading && (
                          <span className="text-xs text-muted-foreground/70">
                            {imagesRemaining} images, {videosRemaining} videos
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => displaySignOut()}
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
      <DevToolbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
