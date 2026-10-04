import React from 'react';
import { getScoreBand } from '../../lib/insights';
import { Award, CheckCircle, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

export default function ScoreBadge({
  score,
  label = null, // optional override
  showBandLabel = true,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const isPresent = score !== null && score !== undefined && !isNaN(score);
  const band = getScoreBand(score);

  const icons = {
    '≥ 8.5': Award,
    '7.0–8.49': CheckCircle,
    '6.0–6.99': CheckCircle,
    '5.0–5.99': AlertTriangle,
    '< 5.0': AlertOctagon,
    Unknown: HelpCircle,
  };

  const IconComponent = icons[band.band] || HelpCircle;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${band.bgClass} ${band.borderClass} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      title={isPresent ? `Score: ${Number(score).toFixed(2)} (${band.label} Band: ${band.band})` : 'No score recorded'}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
      <span className="tabular-nums font-mono font-semibold">
        {isPresent ? Number(score).toFixed(2) : '—'}
      </span>
      {showBandLabel && (
        <span className="opacity-90 font-sans text-[11px] ml-0.5 border-l border-current/20 pl-1.5">
          {label || band.label}
        </span>
      )}
    </span>
  );
}
