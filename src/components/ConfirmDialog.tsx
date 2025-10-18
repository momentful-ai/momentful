import { AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
}: ConfirmDialogProps) {
  const typeColors = {
    danger: {
      icon: 'text-red-500',
      bg: 'bg-red-50',
      button: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      icon: 'text-orange-500',
      bg: 'bg-orange-50',
      button: 'bg-orange-500 hover:bg-orange-600',
    },
    info: {
      icon: 'text-blue-500',
      bg: 'bg-blue-50',
      button: 'bg-blue-500 hover:bg-blue-600',
    },
  };

  const colors = typeColors[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
          <AlertCircle className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
          {title}
        </h2>
        <p className="text-slate-600 text-center mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${colors.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
