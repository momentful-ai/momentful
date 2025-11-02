import { useContext } from 'react';
import { getBypassContext } from '../contexts/bypass-context';

export function useBypassContext(): boolean {
  const BypassContext = getBypassContext();
  const context = useContext(BypassContext);
  if (context === undefined) {
    throw new Error('useBypassContext must be used within a BypassProvider');
  }
  return context.isBypassEnabled;
}


