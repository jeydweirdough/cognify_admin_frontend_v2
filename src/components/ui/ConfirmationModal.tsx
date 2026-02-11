
import React from 'react';
import { AlertTriangle, Info, LogOut, Trash2 } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { cn } from './Button';

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'logout';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger': return <Trash2 className="h-6 w-6 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case 'logout': return <LogOut className="h-6 w-6 text-primary" />;
      default: return <Info className="h-6 w-6 text-blue-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger': return 'bg-destructive hover:bg-destructive/90 text-destructive-foreground';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'logout': return 'bg-primary hover:bg-primary/90 text-primary-foreground';
      default: return 'bg-primary hover:bg-primary/90 text-primary-foreground';
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="">
      <div className="flex flex-col items-center text-center space-y-4 pt-2 pb-2">
        <div className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center mb-2 shadow-sm",
          variant === 'danger' && "bg-destructive/10",
          variant === 'warning' && "bg-amber-50",
          variant === 'logout' && "bg-primary/10",
          variant === 'info' && "bg-blue-50"
        )}>
          {getIcon()}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-[320px] leading-relaxed">
            {message}
          </p>
        </div>
        <div className="flex gap-3 w-full pt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 font-semibold">
            {cancelText}
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={cn("flex-1 font-bold shadow-md", getConfirmButtonClass())}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
