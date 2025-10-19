import { useUser } from '@clerk/clerk-react';
import { useBypassMode } from '../contexts/BypassContext';
import { getLocalDevUserId } from '../lib/local-mode';

export function useUserId(): string | null {
  // Always call useUser() first to maintain hook order
  const { user, isLoaded } = useUser();

  // Check if we're in bypass mode after calling useUser
  const isBypassEnabled = useBypassMode();

  if (isBypassEnabled) {
    return getLocalDevUserId();
  }

  // If Clerk is not loaded yet, return null
  if (!isLoaded) {
    return null;
  }

  // Return null if user is not authenticated
  // The AuthGuard component will show the sign-in screen
  return user?.id || null;
}
