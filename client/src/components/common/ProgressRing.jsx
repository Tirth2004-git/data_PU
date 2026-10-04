import React from 'react';
import { getScoreBand } from '../../lib/insights';

export default function ProgressRing({
  value,
  max = 10,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  className = '',
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const validVal = typeof value === 'number' && !isNaN(value) ? Math.max(0, Math.min(value, max)) : 0;
  const percent = max > 0 ? (validVal / max) * 100 : 0;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const band = getScoreBand(value);

  const strokeColors = {
    emerald: '#10B981',
    teal: '#14B8A6',
    amber: '#F59E0B',
    orange: '#F97316',
    red: '#EF4444',
    slate: '#94A3B8',
  };

  const ringColor = strokeColors[band.color] || '#4F46E5';

  const innerDiameter = Math.max(10, size - strokeWidth * 2);
  // Scale font size dynamically based on inner diameter so numbers up to "10.00" never touch circular border
  const fontSize = Math.max(11, Math.round(innerDiameter * 0.27));

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 block"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-[#262B44]"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none p-1"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <span
          className="font-bold tracking-tight text-[#141A33] dark:text-[#ECEEF8] tabular-nums font-mono leading-none"
          style={{ fontSize: `${fontSize}px` }}
        >
          {typeof value === 'number' ? value.toFixed(2) : '—'}
        </span>
        {label && (
          <span
            className="font-medium text-[#5B6480] dark:text-[#98A0BE] uppercase tracking-wider leading-tight mt-0.5"
            style={{ fontSize: `${Math.max(9, Math.round(innerDiameter * 0.14))}px` }}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span
            className="text-[#5B6480] dark:text-[#98A0BE] leading-tight"
            style={{ fontSize: `${Math.max(8, Math.round(innerDiameter * 0.11))}px` }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
