import React from 'react';
import Spinner from './Spinner';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  loading = false,
  disabled = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 focus:ring-indigo-500',
    secondary: 'bg-white/10 hover:bg-white/15 text-white border border-white/10 focus:ring-indigo-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 focus:ring-rose-500',
    success: 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-600/20 focus:ring-teal-500',
    outline: 'border border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400 focus:ring-indigo-500',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      <span>{children}</span>
    </button>
  );
};

export default Button;
