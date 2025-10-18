import { ReactNode } from 'react';
import { Sparkles, User } from 'lucide-react';
import { UserButton, useUser } from '@clerk/clerk-react';

interface LayoutProps {
  children: ReactNode;
}

const isClerkConfigured = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY &&
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key_here';

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Visual Studio
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {isClerkConfigured ? (
                <UserButton afterSignOutUrl="/" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User className="w-5 h-5" />
                  <span>Local Mode</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
