import React, { useEffect, useState } from 'react';

export default function Stat({
  label,
  value,
  subtext,
  caption = 'as given in records',
  icon: Icon,
  delta,
  deltaType = 'neutral', // 'good' | 'warning' | 'danger' | 'neutral'
  color = 'indigo',
  className = '',
  onClick,
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const isNumber = typeof value === 'number' && !isNaN(value);

  useEffect(() => {
    if (!isNumber) return;

    let start = 0;
    const end = value;
    const duration = 600; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(end);
      }
    };

    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, isNumber]);

  const deltaColors = {
    good: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
    warning: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
    danger: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
    neutral: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  };

  const formattedVal = isNumber
    ? Number.isInteger(value)
      ? Math.round(displayValue).toLocaleString()
      : displayValue.toFixed(2)
    : value ?? '—';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-[16px] p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 card-print flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE] break-words flex-1 min-w-0">
          {label}
        </span>
        {Icon && (
          <div className="p-1.5 sm:p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-[#4F46E5] dark:text-[#8B93FF] shrink-0">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 my-1 min-w-0">
        <span className="text-2xl sm:text-3xl lg:text-[38px] font-bold tracking-tight text-[#141A33] dark:text-[#ECEEF8] tabular-nums leading-none">
          {formattedVal}
        </span>
        {delta && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold max-w-full truncate ${
              deltaColors[deltaType] || deltaColors.neutral
            }`}
          >
            {delta}
          </span>
        )}
      </div>

      {(subtext || caption) && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-[#5B6480] dark:text-[#98A0BE]">
          {subtext && <span className="font-medium truncate">{subtext}</span>}
          {caption && <span className="text-[11px] opacity-75 italic truncate">{caption}</span>}
        </div>
      )}
    </div>
  );
}
