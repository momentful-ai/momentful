import { createContext } from 'react';
import type { ToastProps } from '../components/Toast';

export interface ToastContextType {
  showToast: (message: string, type: ToastProps['type']) => void;
}

// Lazy initialize context to avoid createContext being called at module load time
let ToastContext: React.Context<ToastContextType | undefined>;
export const getToastContext = () => {
  if (!ToastContext) {
    ToastContext = createContext<ToastContextType | undefined>(undefined);
  }
  return ToastContext;
};


