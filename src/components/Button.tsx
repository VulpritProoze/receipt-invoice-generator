import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children: React.ReactNode;
};

export default function Button({ children, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700 ${className}`}
    >
      {children}
    </button>
  );
}
