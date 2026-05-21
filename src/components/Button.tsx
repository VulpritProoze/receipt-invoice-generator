import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
};

export default function Button({ children, className = '', variant = 'primary', ...rest }: Props) {
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
  };

  return (
    <button
      {...rest}
      className={`inline-flex items-center rounded-md px-3 py-1.5 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
