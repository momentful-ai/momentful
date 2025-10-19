import { createContext, useContext, ReactNode } from 'react';
import { isLocalBypassEnabled } from '../lib/local-mode';

interface BypassContextType {
  isBypassEnabled: boolean;
}

const BypassContext = createContext<BypassContextType | undefined>(undefined);

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

export function useBypassMode() {
  const context = useContext(BypassContext);
  if (context === undefined) {
    throw new Error('useBypassMode must be used within a BypassProvider');
  }
  return context.isBypassEnabled;
}
