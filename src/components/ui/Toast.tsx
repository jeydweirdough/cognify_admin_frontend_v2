
import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { cn } from './Button';

export type ToastType = 'success' | 'error' | 'loading' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      if (type !== 'loading') {
        const timer = setTimeout(() => onClose(), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, type]);

  if (!shouldRender) return null;

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    loading: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
    info: <AlertCircle className="h-5 w-5 text-blue-500" />,
  };

  return (
    <div className={cn(
      "fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg border bg-card shadow-lg transition-all duration-300 transform",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
    )}>
      {icons[type]}
      <span className="text-sm font-medium pr-4">{message}</span>
      {type !== 'loading' && (
        <button onClick={onClose} className="hover:bg-muted p-1 rounded-full transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};
