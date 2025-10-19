import { createContext } from 'react';
import type { ToastProps } from '../components/Toast';

export interface ToastContextType {
  showToast: (message: string, type: ToastProps['type']) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);


