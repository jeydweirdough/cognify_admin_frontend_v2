
import React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, description, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div className="relative bg-background w-full max-w-lg rounded-lg shadow-xl border animate-in zoom-in-95 duration-200">
        <div className="flex flex-col p-6 space-y-1.5 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
            <button 
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
