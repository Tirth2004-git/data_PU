import React from 'react';

export default function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-start sm:items-center gap-3">
        {Icon && (
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-[#8B93FF] shrink-0">
            <Icon className="w-5 h-5" strokeWidth={1.5} />
          </div>
        )}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141A33] dark:text-[#ECEEF8]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[#5B6480] dark:text-[#98A0BE] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2 self-start sm:self-auto">{action}</div>}
    </div>
  );
}
