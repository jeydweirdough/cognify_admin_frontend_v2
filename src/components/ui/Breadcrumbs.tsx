
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from './Button';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  const navigate = useNavigate();

  return (
    <nav className={cn("flex mb-4 items-center text-sm text-muted-foreground", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <button 
            onClick={() => navigate('/dashboard')}
            className="hover:text-foreground transition-colors flex items-center"
          >
            <Home className="h-4 w-4" />
          </button>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4" />
            {item.path ? (
              <button 
                onClick={() => navigate(item.path!)}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
