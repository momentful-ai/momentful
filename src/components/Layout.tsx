import { ReactNode } from 'react';
import { Sparkles, LogOut, User } from 'lucide-react';
import { useUser, useClerk } from '@clerk/clerk-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Visual Studio
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {user && (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-5 h-5" />
                    <span className="max-w-[150px] truncate">{user.firstName || user.emailAddresses[0]?.emailAddress}</span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
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
