import { createContext } from 'react';

export interface BypassContextType {
  isBypassEnabled: boolean;
}

// Lazy initialize context to avoid createContext being called at module load time
let BypassContext: React.Context<BypassContextType | undefined>;
export const getBypassContext = () => {
  if (!BypassContext) {
    BypassContext = createContext<BypassContextType | undefined>(undefined);
  }
  return BypassContext;
};


