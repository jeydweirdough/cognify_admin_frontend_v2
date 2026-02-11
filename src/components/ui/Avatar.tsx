
import React from 'react';
import { cn } from './Button';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  fallback: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, fallback, className, ...props }) => {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-muted",
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} className="aspect-square h-full w-full object-cover" alt="Avatar" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold uppercase">
          {fallback}
        </div>
      )}
    </div>
  );
};
