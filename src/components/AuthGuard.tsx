import { ReactNode, useEffect } from 'react';
import { SignIn, useUser, useAuth } from '@clerk/clerk-react';
import { setSupabaseAuth } from '../lib/supabase-auth';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const syncAuth = async () => {
      if (isSignedIn) {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          await setSupabaseAuth(token);
        }
      }
    };

    syncAuth();
  }, [isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome to Visual Studio
            </h1>
            <p className="text-slate-600">
              Create stunning marketing visuals with AI
            </p>
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'shadow-xl',
              },
            }}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
