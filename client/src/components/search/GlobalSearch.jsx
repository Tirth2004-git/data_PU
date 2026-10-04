import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  Clock,
  X,
  AlertCircle,
  CornerDownLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import api from '../../api/axios';
import { config } from '../../config';
import ScoreBadge from '../common/ScoreBadge';

/**
 * Highlights typed tokens inside target text
 */
function highlightMatch(text, query) {
  if (!text || !query || !query.trim()) return text;

  const rawTokens = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (rawTokens.length === 0) return text;

  const regex = new RegExp(`(${rawTokens.join('|')})`, 'gi');
  const parts = String(text).split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <span
        key={i}
        className="bg-indigo-500/25 text-indigo-700 dark:text-indigo-300 font-bold px-0.5 rounded"
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchError, setSearchError] = useState(null);

  const inputRef = useRef(null);
  const activeRequestControllerRef = useRef(null);
  const navigate = useNavigate();

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(config.storageKeys.recentSearches);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveRecentSearch = (item) => {
    try {
      const updated = [
        item,
        ...recentSearches.filter((s) => s.rollNo !== item.rollNo && s.text !== item.text),
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(config.storageKeys.recentSearches, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const removeRecentSearch = (e, index) => {
    e.stopPropagation();
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    localStorage.setItem(config.storageKeys.recentSearches, JSON.stringify(updated));
  };

  // Keyboard shortcut Ctrl/Cmd + K & Custom Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    const handleOpenSearch = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('campus-compass:open-search', handleOpenSearch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('campus-compass:open-search', handleOpenSearch);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Debounced search logic (150ms)
  useEffect(() => {
    const trimmed = query.trim();
    setSearchError(null);

    if (!trimmed) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const isDigits = /^\d+$/.test(trimmed);
    if (!isDigits && trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSelectedIndex(-1);

    const timer = setTimeout(async () => {
      if (activeRequestControllerRef.current) {
        activeRequestControllerRef.current.abort();
      }

      const controller = new AbortController();
      activeRequestControllerRef.current = controller;

      try {
        const res = await api.get('/students/suggest', {
          params: { q: trimmed },
          signal: controller.signal,
        });

        if (res.data?.success) {
          setSuggestions(res.data.suggestions || []);
        }
      } catch (err) {
        const isCanceled = err.name === 'CanceledError' || err.code === 'ERR_CANCELED';
        if (!isCanceled) {
          console.error('Autocomplete search error:', err);
          setSearchError('Search request error');
        }
      } finally {
        if (activeRequestControllerRef.current === controller) {
          setLoading(false);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectStudent = (student) => {
    saveRecentSearch({
      rollNo: student.rollNo,
      text: `${student.rollNo} - ${student.fullName}`,
      branch: student.branch,
    });
    setIsOpen(false);
    navigate(`/students/${student.rollNo}`);
  };

  const handleSelectRecent = (recent) => {
    if (recent.rollNo) {
      setIsOpen(false);
      navigate(`/students/${recent.rollNo}`);
    } else if (recent.text) {
      setIsOpen(false);
      navigate(`/students?search=${encodeURIComponent(recent.text)}`);
    }
  };

  const handleKeyDown = (e) => {
    const trimmed = query.trim();

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectStudent(suggestions[selectedIndex]);
      } else if (trimmed) {
        saveRecentSearch({ text: trimmed });
        setIsOpen(false);
        navigate(`/students?search=${encodeURIComponent(trimmed)}`);
      }
    }
  };

  return (
    <>
      {/* Search Trigger Button in Header (hidden on mobile as bottom nav handles it) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="hidden lg:flex w-full max-w-md items-center justify-between px-3.5 py-2 text-xs text-[#5B6480] dark:text-[#98A0BE] bg-slate-100 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-150 shadow-xs group"
        aria-label="Search roll number or name"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" strokeWidth={1.8} />
          <span className="truncate whitespace-nowrap text-left">Search roll no. or name</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-[#171B2E] text-slate-500 dark:text-slate-400 border border-[#E4E7EF] dark:border-[#262B44] rounded shadow-2xs shrink-0">
          ⌘K
        </kbd>
      </button>

      {/* Command Palette / Full-Screen Search Sheet on Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-start sm:pt-20 sm:px-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs cmd-palette">
          {/* Backdrop on tablet/desktop */}
          <div
            className="hidden sm:block fixed inset-0 -z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog Container: full-screen sheet on mobile, modal on desktop */}
          <div className="w-full sm:max-w-2xl bg-white dark:bg-[#171B2E] sm:border sm:border-[#E4E7EF] sm:dark:border-[#262B44] sm:rounded-2xl shadow-popover overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[80vh] animate-in fade-in duration-150 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            
            {/* Input Header */}
            <div className="flex items-center px-4 py-3 sm:py-3.5 border-b border-[#E4E7EF] dark:border-[#262B44] gap-3 bg-white dark:bg-[#171B2E] shrink-0">
              {loading ? (
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
              ) : (
                <Search className="w-5 h-5 text-slate-400 shrink-0" strokeWidth={1.8} />
              )}
              
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search roll no. or name"
                className="w-full bg-transparent text-base text-[#141A33] dark:text-[#ECEEF8] placeholder:text-[#5B6480] dark:placeholder:text-[#98A0BE] focus:outline-none"
                style={{ fontSize: '16px' }} // Explicit 16px to prevent iOS auto-zoom
              />
              
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
                  title="Clear input"
                  aria-label="Clear search input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-9 px-3 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0"
                aria-label="Close search"
              >
                Close
              </button>
            </div>

            {/* Results or Recents Container */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#E4E7EF] dark:divide-[#262B44]">
              {/* Empty query state: Recent searches */}
              {!query.trim() && (
                <div>
                  {recentSearches.length > 0 ? (
                    <div className="p-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE] px-2 py-1 flex items-center justify-between">
                        <span>Recent Searches</span>
                        <Clock className="w-3.5 h-3.5 opacity-60" />
                      </div>
                      <div className="mt-1 space-y-1">
                        {recentSearches.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectRecent(item)}
                            className="flex items-center justify-between px-3 py-3 rounded-xl text-xs sm:text-sm text-[#141A33] dark:text-[#ECEEF8] hover:bg-slate-100 dark:hover:bg-[#1E2338] cursor-pointer group min-h-[48px]"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                                {item.rollNo || item.text}
                              </span>
                              {item.branch && (
                                <span className="text-slate-400 dark:text-slate-500 truncate">
                                  · {item.branch}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(e, idx)}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500"
                              title="Remove"
                              aria-label="Remove recent search"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-[#5B6480] dark:text-[#98A0BE]">
                      Start typing to search 4,589 students by enrollment roll number or name.
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions List */}
              {query.trim() && (
                <div>
                  {suggestions.length > 0 ? (
                    <div className="p-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE] px-3 py-1.5 flex items-center justify-between">
                        <span>Students ({suggestions.length})</span>
                        <span className="text-[10px] font-normal lowercase opacity-70 hidden sm:inline">
                          use ↑ ↓ to navigate · enter to open
                        </span>
                      </div>
                      <div className="space-y-1.5 mt-1">
                        {suggestions.map((s, idx) => {
                          const isSelected = idx === selectedIndex;
                          const hasBacklogs = (s.totalLiveBacklogs || 0) > 0;

                          return (
                            <div
                              key={s.rollNo}
                              onClick={() => handleSelectStudent(s)}
                              onMouseEnter={() => setSelectedIndex(idx)}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 min-h-[60px] ${
                                isSelected
                                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-[#141A33] dark:text-[#ECEEF8] border border-indigo-200 dark:border-indigo-800/60'
                                  : 'hover:bg-slate-50 dark:hover:bg-[#1E2338] text-[#141A33] dark:text-[#ECEEF8] border border-transparent'
                              }`}
                            >
                              {/* Left: Avatar + Names + Roll */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50">
                                  {s.fullName
                                    ? s.fullName
                                        .split(' ')
                                        .slice(0, 2)
                                        .map((w) => w[0])
                                        .join('')
                                        .toUpperCase()
                                    : 'ST'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-xs sm:text-sm truncate">
                                      {highlightMatch(s.fullName, query)}
                                    </span>
                                    <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                      {highlightMatch(s.rollNo, query)}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#5B6480] dark:text-[#98A0BE] truncate mt-0.5">
                                    {s.branch || '—'} {s.division ? `· Div ${s.division}` : ''}
                                  </div>
                                </div>
                              </div>

                              {/* Right: CGPA and Backlog Badges */}
                              <div className="flex items-center gap-2 shrink-0 ml-3">
                                {s.cgpa !== null && s.cgpa !== undefined && (
                                  <ScoreBadge score={s.cgpa} size="sm" showBandLabel={false} />
                                )}
                                {hasBacklogs ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                                    {s.totalLiveBacklogs} Backlog{s.totalLiveBacklogs > 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                                    Clean
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    !loading && (
                      <div className="p-8 text-center">
                        <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-80" />
                        <p className="text-xs sm:text-sm text-[#141A33] dark:text-[#ECEEF8] font-medium">
                          No student starts with or contains &ldquo;{query}&rdquo;
                        </p>
                        <p className="text-xs text-[#5B6480] dark:text-[#98A0BE] mt-1">
                          Check for spelling errors or try searching by exact enrollment roll number.
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Desktop Footer Strip */}
            <div className="hidden sm:flex px-4 py-2.5 bg-slate-50 dark:bg-[#1E2338]/60 border-t border-[#E4E7EF] dark:border-[#262B44] items-center justify-between text-[11px] text-[#5B6480] dark:text-[#98A0BE]">
              <div className="flex items-center gap-3">
                <span>Navigate with <kbd className="font-mono font-semibold">↑</kbd> <kbd className="font-mono font-semibold">↓</kbd></span>
                <span>Select with <kbd className="font-mono font-semibold">↵</kbd></span>
              </div>
              <div>Campus Compass Intelligence</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
