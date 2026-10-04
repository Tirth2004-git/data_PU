import React from 'react';

export default function Chip({
  children,
  icon: Icon,
  variant = 'default', // 'default' | 'accent' | 'teal' | 'outline'
  size = 'md', // 'sm' | 'md'
  onRemove,
  onClick,
  className = '',
}) {
  const baseClasses =
    'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-150 select-none';

  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5',
    md: 'text-xs px-3 py-1',
  };

  const variantClasses = {
    default:
      'bg-slate-100 dark:bg-[#1E2338] text-[#141A33] dark:text-[#ECEEF8] border border-[#E4E7EF] dark:border-[#262B44]',
    accent:
      'bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-[#8B93FF] border border-indigo-200 dark:border-indigo-800/50',
    teal:
      'bg-teal-50 dark:bg-teal-950/40 text-[#0D9488] dark:text-[#2DD4BF] border border-teal-200 dark:border-teal-800/50',
    outline:
      'bg-transparent text-[#5B6480] dark:text-[#98A0BE] border border-[#E4E7EF] dark:border-[#262B44] hover:bg-slate-50 dark:hover:bg-slate-800',
  };

  return (
    <span
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.default
      } ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 opacity-80" strokeWidth={1.5} />}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-rose-500 rounded-full focus:outline-none"
        >
          ×
        </button>
      )}
    </span>
  );
}
