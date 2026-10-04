import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  message = 'Try adjusting your search query, filter criteria, or selecting another category.',
  icon: Icon = Inbox,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[16px] border border-dashed border-[#E4E7EF] dark:border-[#262B44] bg-white/50 dark:bg-[#171B2E]/40 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[#5B6480] dark:text-[#98A0BE] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-[#141A33] dark:text-[#ECEEF8] mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#5B6480] dark:text-[#98A0BE] max-w-sm mb-5">
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
