import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, interactive, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`card-base p-5 ${
        interactive
          ? 'cursor-pointer transition-colors duration-150 hover:border-brand-600/60 dark:hover:border-brand-500/60'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
