import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  icon: Icon,
  noPadding = false,
  ...props
}) {
  return (
    <div
      className={`bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-[16px] shadow-sm hover:shadow-md transition-shadow duration-200 card-print ${className}`}
      {...props}
    >
      {(title || subtitle || action || Icon) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E7EF] dark:border-[#262B44]">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-[#8B93FF]">
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-base font-semibold text-[#141A33] dark:text-[#ECEEF8]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-[#5B6480] dark:text-[#98A0BE] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex items-center space-x-2">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
}
