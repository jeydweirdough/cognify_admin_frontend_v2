
import React, { useState, useRef, useEffect } from 'react';
import { cn } from './Button';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, children, align = 'right', className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-56 origin-top-right rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in zoom-in-95 duration-100",
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          <div className="py-1" role="none" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

export const DropdownMenuItem: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}> = ({ children, onClick, className, variant = 'default' }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      variant === 'destructive' && "text-destructive hover:bg-destructive/10 hover:text-destructive",
      className
    )}
  >
    {children}
  </button>
);

export const DropdownMenuSeparator = () => (
  <div className="-mx-1 my-1 h-px bg-muted" />
);

export const DropdownMenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
    {children}
  </div>
);
