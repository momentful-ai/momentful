import { useUser } from '@clerk/clerk-react';

export function useUserId(): string {
  const { user } = useUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  return user.id;
}
