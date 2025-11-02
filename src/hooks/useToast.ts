import { useContext } from 'react';
import { getToastContext } from '../contexts/toast-context';

export function useToast() {
  const ToastContext = getToastContext();
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}


