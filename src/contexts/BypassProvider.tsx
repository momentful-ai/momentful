import { ReactNode } from 'react';
import { isLocalBypassEnabled } from '../lib/local-mode';
import { getBypassContext } from './bypass-context';

interface BypassProviderProps {
  children: ReactNode;
}

const BypassContext = getBypassContext();

export function BypassProvider({ children }: BypassProviderProps) {
  const isBypassEnabled = isLocalBypassEnabled();

  return (
    <BypassContext.Provider value={{ isBypassEnabled }}>
      {children}
    </BypassContext.Provider>
  );
}
