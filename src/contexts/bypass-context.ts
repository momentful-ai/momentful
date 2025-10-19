import { createContext } from 'react';

export interface BypassContextType {
  isBypassEnabled: boolean;
}

export const BypassContext = createContext<BypassContextType | undefined>(undefined);


