import { ReactNode } from 'react';
import { isLocalBypassEnabled } from '../lib/local-mode';
import { BypassContext } from './bypass-context';

interface BypassProviderProps {
  children: ReactNode;
}

export function BypassProvider({ children }: BypassProviderProps) {
  const isBypassEnabled = isLocalBypassEnabled();

  return (
    <BypassContext.Provider value={{ isBypassEnabled }}>
      {children}
    </BypassContext.Provider>
  );
}
