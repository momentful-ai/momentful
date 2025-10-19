import { useContext } from 'react';
import { BypassContext } from '../contexts/bypass-context';

export function useBypassContext(): boolean {
  const context = useContext(BypassContext);
  if (context === undefined) {
    throw new Error('useBypassContext must be used within a BypassProvider');
  }
  return context.isBypassEnabled;
}


