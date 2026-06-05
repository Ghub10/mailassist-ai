import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={[
        'bg-white border border-zinc-200 rounded-xl p-5 shadow-sm',
        onClick ? 'cursor-pointer hover:shadow-md hover:border-violet-100 transition-shadow duration-200' : '',
        className,
      ].join(' ')}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
