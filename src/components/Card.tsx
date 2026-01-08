import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`
        backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6
        ${hover ? 'transition-transform duration-300 hover:scale-105 hover:bg-white/15' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
