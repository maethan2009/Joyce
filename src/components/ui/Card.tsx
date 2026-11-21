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
      className={`card-base p-5 ${interactive ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
