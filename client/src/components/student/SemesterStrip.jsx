import React, { useState, useRef, useEffect } from 'react';
import ScoreBadge from '../common/ScoreBadge';
import { getScoreBand } from '../../lib/insights';
import { RotateCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SemesterStrip({ semesters = [], avgSgpa = null }) {
  const [flippedIndex, setFlippedIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    const itemWidth = 140;
    const idx = Math.round(scrollLeft / itemWidth);
    setActiveIndex(Math.min(semesters.length - 1, Math.max(0, idx)));
  };

  const toggleFlip = (idx) => {
    setFlippedIndex((prev) => (prev === idx ? null : idx));
  };

  if (!semesters || semesters.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Scrollable Container with edge fade */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 px-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
        >
          {semesters.map((sem, idx) => {
            const isFlipped = flippedIndex === idx;
            const prevSem = idx > 0 ? semesters[idx - 1] : null;
            const delta =
              prevSem && sem.sgpa !== null && prevSem.sgpa !== null
                ? Number((sem.sgpa - prevSem.sgpa).toFixed(2))
                : null;
            const isZeroDelta = delta !== null && Math.abs(delta) < 0.005;

            const band = getScoreBand(sem.sgpa);
            const vsAvg =
              sem.sgpa !== null && avgSgpa !== null
                ? Number((sem.sgpa - avgSgpa).toFixed(2))
                : null;

            return (
              <div
                key={sem.sem}
                data-sem-number={sem.sem}
                onClick={() => toggleFlip(idx)}
                className="w-[136px] sm:w-[150px] shrink-0 snap-start select-none cursor-pointer group"
              >
                <div
                  className={`h-full min-h-[148px] p-3 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    isFlipped
                      ? 'bg-indigo-900/90 text-white border-indigo-700 shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-[#171B2E] border-[#E4E7EF] dark:border-[#262B44] hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs'
                  }`}
                >
                  {!isFlipped ? (
                    <>
                      {/* Top: Sem & BL Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#141A33] dark:text-[#ECEEF8]">
                          Sem {sem.sem}
                        </span>
                        {sem.backlogCount > 0 ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                            {sem.backlogCount} BL
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            Clean
                          </span>
                        )}
                      </div>

                      {/* Middle: Score with absolute band */}
                      <div className="my-2">
                        {sem.sgpa !== null && sem.sgpa !== undefined ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl font-bold font-mono tabular-nums text-[#141A33] dark:text-[#ECEEF8]">
                              {sem.sgpa.toFixed(2)}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                sem.sgpa >= 8.5
                                  ? 'bg-emerald-500'
                                  : sem.sgpa >= 7.0
                                  ? 'bg-teal-500'
                                  : sem.sgpa >= 6.0
                                  ? 'bg-amber-500'
                                  : sem.sgpa >= 5.0
                                  ? 'bg-orange-500'
                                  : 'bg-rose-500'
                              }`}
                              title={band.label}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">No data</span>
                        )}
                        <div className="text-[10px] font-medium text-[#5B6480] dark:text-[#98A0BE]">
                          {band.label}
                        </div>
                      </div>

                      {/* Bottom: Delta vs previous */}
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E4E7EF] dark:border-[#262B44]/70">
                        {delta !== null ? (
                          <span
                            className={`font-mono font-medium ${
                              isZeroDelta
                                ? 'text-[#5B6480] dark:text-[#98A0BE]'
                                : delta > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isZeroDelta
                              ? '— 0.00'
                              : delta > 0
                              ? `▲ +${delta.toFixed(2)}`
                              : `▼ ${delta.toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">1st Term</span>
                        )}
                        <RotateCw className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    /* Flipped Side Details */
                    <div className="flex flex-col justify-between h-full text-xs">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold pb-1 border-b border-indigo-700/60 mb-2">
                          <span>Sem {sem.sem} Details</span>
                          <span className="text-indigo-300">Tap to flip</span>
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div>
                            <span className="opacity-70">Vs Career Avg:</span>{' '}
                            <strong className="font-mono">
                              {vsAvg !== null ? (vsAvg >= 0 ? `+${vsAvg.toFixed(2)}` : vsAvg.toFixed(2)) : '—'}
                            </strong>
                          </div>
                          <div>
                            <span className="opacity-70">Backlogs:</span>{' '}
                            <strong>{sem.backlogCount || 0}</strong>
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-indigo-300 pt-2 border-t border-indigo-700/60 flex items-center justify-between">
                        <span>Standing: {sem.backlogCount > 0 ? 'Backlog' : 'Clear'}</span>
                        <RotateCw className="w-3 h-3 text-indigo-200" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot Indicators */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {semesters.map((s, i) => (
          <button
            key={s.sem}
            type="button"
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTo({ left: i * 140, behavior: 'smooth' });
              }
            }}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              activeIndex === i
                ? 'w-5 bg-indigo-600 dark:bg-indigo-400'
                : 'w-1.5 bg-slate-300 dark:bg-slate-700'
            }`}
            aria-label={`Jump to Semester ${s.sem}`}
          />
        ))}
      </div>
    </div>
  );
}
