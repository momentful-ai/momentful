import { useUser } from '@clerk/clerk-react';
import { isLocalMode, LOCAL_DEV_USER_ID } from '../lib/local-mode';

export function useUserId(): string {
  if (isLocalMode()) {
    return LOCAL_DEV_USER_ID;
  }

  const { user } = useUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user.id;
}
