import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  SlidersHorizontal,
  FileSpreadsheet,
  Columns,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import api from '../api/axios';
import { config } from '../config';
import ScoreBadge from '../components/common/ScoreBadge';
import Badge from '../components/common/Badge';
import Chip from '../components/common/Chip';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import CopyButton from '../components/common/CopyButton';

export default function StudentsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL filters
  const search = searchParams.get('search') || '';
  const branch = searchParams.get('branch') || 'all';
  const division = searchParams.get('division') || 'all';
  const batch = searchParams.get('batch') || 'all';
  const campus = searchParams.get('campus') || 'all';
  const course = searchParams.get('course') || 'all';
  const hasLiveBacklog = searchParams.get('hasLiveBacklog') || 'all';
  const policySubmitted = searchParams.get('policySubmitted') || 'all';
  const cgpaMin = searchParams.get('cgpaMin') || '';
  const cgpaMax = searchParams.get('cgpaMax') || '';
  const sortBy = searchParams.get('sortBy') || 'rollNo';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);

  const [searchInput, setSearchInput] = useState(search);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Column definitions
  const [columnsVisibility, setColumnsVisibility] = useState({
    rollNo: true,
    fullName: true,
    branch: true,
    division: true,
    batch: true,
    cgpa: true,
    latestSgpa: true,
    totalLiveBacklogs: true,
    totalClosedBacklogs: true,
    policy: true,
    attention: true,
  });

  const toggleColumn = (key) => {
    setColumnsVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Fetch filter options dropdowns
  const { data: filterOptions } = useQuery({
    queryKey: ['studentFilters'],
    queryFn: async () => {
      const res = await api.get('/students/filters');
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Query students list
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      'students',
      { search, branch, division, batch, campus, course, hasLiveBacklog, policySubmitted, cgpaMin, cgpaMax, sortBy, sortOrder, page, limit },
    ],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (branch !== 'all') params.branch = branch;
      if (division !== 'all') params.division = division;
      if (batch !== 'all') params.batch = batch;
      if (campus !== 'all') params.campus = campus;
      if (course !== 'all') params.course = course;
      if (hasLiveBacklog !== 'all') params.hasLiveBacklog = hasLiveBacklog;
      if (policySubmitted !== 'all') params.policySubmitted = policySubmitted;
      if (cgpaMin) params.cgpaMin = cgpaMin;
      if (cgpaMax) params.cgpaMax = cgpaMax;

      const res = await api.get('/students', { params });
      return res.data;
    },
    keepPreviousData: true,
  });

  const updateParam = (newParams) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '' || v === 'all') {
        updated.delete(k);
      } else {
        updated.set(k, String(v));
      }
    });
    // Reset to page 1 on filter changes unless changing page itself
    if (!newParams.page && !newParams.limit) {
      updated.set('page', '1');
    }
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam({ search: searchInput.trim() });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      updateParam({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' });
    } else {
      updateParam({ sortBy: field, sortOrder: 'asc' });
    }
  };

  // Prefetch profile on row hover
  const handleRowHover = (rollNo) => {
    queryClient.prefetchQuery({
      queryKey: ['student', rollNo],
      queryFn: async () => {
        const res = await api.get(`/students/${rollNo}`);
        return res.data;
      },
      staleTime: 60 * 1000,
    });
  };


  // Export CSV
  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams(searchParams);
      params.delete('page');
      params.delete('limit');

      const response = await api.get(`/students/export?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'campus_compass_students.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const totalStudents = data?.total || 0;
  const totalPages = data?.pages || 1;
  const students = data?.items || [];

  const activeFilterCount = [
    search,
    branch !== 'all' ? branch : null,
    division !== 'all' ? division : null,
    batch !== 'all' ? batch : null,
    campus !== 'all' ? campus : null,
    course !== 'all' ? course : null,
    hasLiveBacklog !== 'all' ? hasLiveBacklog : null,
    policySubmitted !== 'all' ? policySubmitted : null,
    cgpaMin,
    cgpaMax,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#141A33] dark:text-[#ECEEF8]">
            Student Directory
          </h1>
          <p className="text-xs text-[#5B6480] dark:text-[#98A0BE] mt-0.5">
            Institutional academic ledger with advanced filtering, column customization, and analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Column Chooser Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnChooser(!showColumnChooser)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#171B2E] text-xs font-medium text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] dark:hover:text-[#ECEEF8]"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Columns</span>
            </button>

            {showColumnChooser && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-2xl shadow-popover p-3 z-30 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE] pb-1 border-b border-[#E4E7EF] dark:border-[#262B44]">
                  Toggle Columns
                </div>
                {Object.entries(columnsVisibility).map(([colKey, isVisible]) => (
                  <label
                    key={colKey}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1E2338]"
                  >
                    <span className="capitalize">{colKey.replace(/([A-Z])/g, ' $1')}</span>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => toggleColumn(colKey)}
                      className="rounded border-[#E4E7EF] dark:border-[#262B44] text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Sticky Mobile Toolbar (< md) */}
      <div className="md:hidden sticky top-14 z-10 -mx-3 -mt-2 px-3 py-2.5 bg-white/95 dark:bg-[#171B2E]/95 backdrop-blur-md border-b border-[#E4E7EF] dark:border-[#262B44] space-y-2">
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search roll no. or name"
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] placeholder:text-[#5B6480] dark:placeholder:text-[#98A0BE] focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateParam({ search: '' });
                }}
                className="absolute right-2.5 w-6 h-6 flex items-center justify-center text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Filter button */}
          <button
            type="button"
            onClick={() => setShowFilterSheet(true)}
            className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold shrink-0 min-w-[44px] ${
              activeFilterCount > 0
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-[#1E2338] border-[#E4E7EF] dark:border-[#262B44] text-slate-600 dark:text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort button */}
          <button
            type="button"
            onClick={() => setShowSortSheet(true)}
            className="h-9 px-3 rounded-xl border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#1E2338] text-slate-600 dark:text-slate-300 flex items-center gap-1.5 text-xs font-semibold shrink-0 min-w-[44px]"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sort</span>
          </button>
        </div>

        {/* Result count & active chips */}
        <div className="flex items-center justify-between text-[11px] text-[#5B6480] dark:text-[#98A0BE] px-0.5">
          <span>
            <strong className="font-mono text-[#141A33] dark:text-[#ECEEF8]">{totalStudents.toLocaleString()}</strong> students found
          </span>
          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-rose-600 dark:text-rose-400 font-semibold"
            >
              Reset ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Active Filter Chips on Mobile */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {search && <Chip onRemove={() => updateParam({ search: '' })}>Search: &ldquo;{search}&rdquo;</Chip>}
            {branch !== 'all' && <Chip onRemove={() => updateParam({ branch: 'all' })}>Branch: {branch}</Chip>}
            {division !== 'all' && <Chip onRemove={() => updateParam({ division: 'all' })}>Div: {division}</Chip>}
            {batch !== 'all' && <Chip onRemove={() => updateParam({ batch: 'all' })}>Batch: {batch}</Chip>}
            {hasLiveBacklog !== 'all' && (
              <Chip onRemove={() => updateParam({ hasLiveBacklog: 'all' })}>
                Backlogs: {hasLiveBacklog === 'true' ? 'Live' : 'Clean'}
              </Chip>
            )}
            {policySubmitted !== 'all' && (
              <Chip onRemove={() => updateParam({ policySubmitted: 'all' })}>
                Policy: {policySubmitted === 'true' ? 'Submitted' : 'Pending'}
              </Chip>
            )}
            {(cgpaMin || cgpaMax) && (
              <Chip onRemove={() => updateParam({ cgpaMin: '', cgpaMax: '' })}>
                CGPA: {cgpaMin || '0'}–{cgpaMax || '10'}
              </Chip>
            )}
          </div>
        )}
      </div>

      {/* Desktop Filter Chips & Search Bar (hidden md:block) */}
      <div className="hidden md:block bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-[16px] p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by roll number, name, phone..."
              className="w-full pl-10 pr-20 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] placeholder:text-[#5B6480] dark:placeholder:text-[#98A0BE] focus:outline-none focus:border-indigo-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateParam({ search: '' });
                }}
                className="absolute right-14 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filter Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              showFilterDrawer || activeFilterCount > 0
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-50 dark:bg-[#1E2338] border-[#E4E7EF] dark:border-[#262B44] text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Active Filter Chips Pill Row */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#E4E7EF] dark:border-[#262B44] text-xs">
            <span className="text-[#5B6480] dark:text-[#98A0BE] text-[11px] font-medium">Applied:</span>
            {search && <Chip onRemove={() => updateParam({ search: '' })}>Search: &ldquo;{search}&rdquo;</Chip>}
            {branch !== 'all' && <Chip onRemove={() => updateParam({ branch: 'all' })}>Branch: {branch}</Chip>}
            {division !== 'all' && <Chip onRemove={() => updateParam({ division: 'all' })}>Div: {division}</Chip>}
            {batch !== 'all' && <Chip onRemove={() => updateParam({ batch: 'all' })}>Batch: {batch}</Chip>}
            {hasLiveBacklog !== 'all' && (
              <Chip onRemove={() => updateParam({ hasLiveBacklog: 'all' })}>
                Backlogs: {hasLiveBacklog === 'true' ? 'With Live Backlogs' : 'Clean'}
              </Chip>
            )}
            {policySubmitted !== 'all' && (
              <Chip onRemove={() => updateParam({ policySubmitted: 'all' })}>
                Policy: {policySubmitted === 'true' ? 'Submitted' : policySubmitted === 'false' ? 'Pending' : 'Not recorded'}
              </Chip>
            )}
            {(cgpaMin || cgpaMax) && (
              <Chip onRemove={() => updateParam({ cgpaMin: '', cgpaMax: '' })}>
                CGPA: {cgpaMin || '0'} – {cgpaMax || '10'}
              </Chip>
            )}
          </div>
        )}

        {/* Expandable Filter Drawer */}
        {showFilterDrawer && (
          <div className="pt-4 border-t border-[#E4E7EF] dark:border-[#262B44] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 animate-in fade-in duration-150">
            {/* Branch */}
            <div>
              <label className="block text-[11px] font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1">
                Branch
              </label>
              <select
                value={branch}
                onChange={(e) => updateParam({ branch: e.target.value })}
                className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
              >
                <option value="all">All Branches</option>
                {(filterOptions?.branches || []).map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Division */}
            <div>
              <label className="block text-[11px] font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1">
                Division / Section
              </label>
              <select
                value={division}
                onChange={(e) => updateParam({ division: e.target.value })}
                className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
              >
                <option value="all">All Divisions</option>
                {(filterOptions?.divisions || []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch */}
            <div>
              <label className="block text-[11px] font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1">
                Graduation Batch
              </label>
              <select
                value={batch}
                onChange={(e) => updateParam({ batch: e.target.value })}
                className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
              >
                <option value="all">All Batches</option>
                {(filterOptions?.batches || []).map((b) => (
                  <option key={b} value={b}>
                    Batch {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Backlogs */}
            <div>
              <label className="block text-[11px] font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1">
                Live Backlogs Status
              </label>
              <select
                value={hasLiveBacklog}
                onChange={(e) => updateParam({ hasLiveBacklog: e.target.value })}
                className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
              >
                <option value="all">All Students</option>
                <option value="true">Has Live Backlogs (≥ 1)</option>
                <option value="false">Clean Standing (0 Backlogs)</option>
              </select>
            </div>

            {/* Policy Status */}
            <div>
              <label className="block text-[11px] font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1">
                Placement Policy
              </label>
              <select
                value={policySubmitted}
                onChange={(e) => updateParam({ policySubmitted: e.target.value })}
                className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
              >
                <option value="all">All Policies</option>
                <option value="true">Submitted</option>
                <option value="false">Pending</option>
                <option value="null">Not Recorded</option>
              </select>
            </div>

            {/* CGPA Range Slider / Inputs */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-[11px] font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1">
                CGPA Score Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={cgpaMin}
                  onChange={(e) => updateParam({ cgpaMin: e.target.value })}
                  placeholder="Min (e.g. 6.0)"
                  className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8]"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={cgpaMax}
                  onChange={(e) => updateParam({ cgpaMax: e.target.value })}
                  placeholder="Max (e.g. 10.0)"
                  className="w-full text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8]"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table / Mobile Cards */}
      <div className="bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-[16px] shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E7EF] dark:border-[#262B44] bg-slate-50/75 dark:bg-[#1E2338]/60 text-[#5B6480] dark:text-[#98A0BE] text-xs font-semibold select-none sticky top-0 z-10 backdrop-blur-sm">
                {columnsVisibility.rollNo && (
                  <th
                    onClick={() => handleSort('rollNo')}
                    className="px-4 py-3 cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8] whitespace-nowrap"
                  >
                    Roll No
                  </th>
                )}

                {columnsVisibility.fullName && (
                  <th
                    onClick={() => handleSort('fullName')}
                    className="px-4 py-3 cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8] whitespace-nowrap"
                  >
                    Student Name
                  </th>
                )}

                {columnsVisibility.branch && (
                  <th
                    onClick={() => handleSort('branch')}
                    className="px-4 py-3 cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8] whitespace-nowrap"
                  >
                    Branch
                  </th>
                )}

                {columnsVisibility.division && (
                  <th
                    onClick={() => handleSort('division')}
                    className="px-4 py-3 cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8] whitespace-nowrap"
                  >
                    Division
                  </th>
                )}

                {columnsVisibility.batch && (
                  <th
                    onClick={() => handleSort('batch')}
                    className="px-4 py-3 cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8] whitespace-nowrap"
                  >
                    Batch
                  </th>
                )}

                {columnsVisibility.cgpa && (
                  <th
                    onClick={() => handleSort('cgpa')}
                    className="px-4 py-3 cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8] whitespace-nowrap"
                  >
                    CGPA
                  </th>
                )}

                {columnsVisibility.latestSgpa && (
                  <th
                    onClick={() => handleSort('latestSgpa')}
                    className="px-4 py-3 cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8] whitespace-nowrap"
                  >
                    Latest SGPA
                  </th>
                )}

                {columnsVisibility.totalLiveBacklogs && (
                  <th
                    onClick={() => handleSort('totalLiveBacklogs')}
                    className="px-4 py-3 cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8] whitespace-nowrap"
                  >
                    Live
                  </th>
                )}

                {columnsVisibility.totalClosedBacklogs && (
                  <th
                    onClick={() => handleSort('totalClosedBacklogs')}
                    className="px-4 py-3 cursor-pointer hover:text-[#141A33] dark:hover:text-[#ECEEF8] whitespace-nowrap"
                  >
                    Closed
                  </th>
                )}

                {columnsVisibility.policy && (
                  <th className="px-4 py-3 whitespace-nowrap">Policy</th>
                )}

                {columnsVisibility.attention && (
                  <th className="px-4 py-3 whitespace-nowrap">Attention</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E4E7EF] dark:divide-[#262B44] text-[#141A33] dark:text-[#ECEEF8] text-xs">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <tr key={idx}>
                    <td className="p-4"><Skeleton className="w-28 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-36 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-24 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-12 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-12 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-16 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-16 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-12 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-12 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-16 h-4 rounded" /></td>
                    <td className="p-4"><Skeleton className="w-16 h-4 rounded" /></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center">
                    <EmptyState
                      title="No students match this query"
                      message="Try broadening your search term or resetting the branch/CGPA filters."
                      action={
                        activeFilterCount > 0 ? (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                          >
                            Reset all filters
                          </button>
                        ) : null
                      }
                    />
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const padding = 'px-4 py-3';

                  return (
                    <tr
                      key={student.rollNo}
                      onClick={() => navigate(`/students/${student.rollNo}`)}
                      onMouseEnter={() => handleRowHover(student.rollNo)}
                      className="cursor-pointer transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-[#1E2338]/60"
                    >
                      {/* Roll No */}
                      {columnsVisibility.rollNo && (
                        <td className={`${padding} font-mono font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap`}>
                          <div className="flex items-center gap-1.5">
                            <span>{student.rollNo}</span>
                            <CopyButton text={student.rollNo} size="sm" />
                          </div>
                        </td>
                      )}

                      {/* Name with initials avatar */}
                      {columnsVisibility.fullName && (
                        <td className={`${padding} whitespace-nowrap font-medium text-[#141A33] dark:text-[#ECEEF8]`}>
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/40">
                              {student.fullName
                                ? student.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
                                : 'S'}
                            </div>
                            <span className="truncate max-w-[180px]">{student.fullName}</span>
                          </div>
                        </td>
                      )}

                      {/* Branch */}
                      {columnsVisibility.branch && (
                        <td className={`${padding} text-[#5B6480] dark:text-[#98A0BE] truncate max-w-[160px]`} title={student.branch}>
                          {student.branch || '—'}
                        </td>
                      )}

                      {/* Division */}
                      {columnsVisibility.division && (
                        <td className={`${padding} font-mono text-[#141A33] dark:text-[#ECEEF8]`}>
                          {student.division || '—'}
                        </td>
                      )}

                      {/* Batch */}
                      {columnsVisibility.batch && (
                        <td className={`${padding} tabular-nums text-[#5B6480] dark:text-[#98A0BE]`}>
                          {student.batch || '—'}
                        </td>
                      )}

                      {/* CGPA */}
                      {columnsVisibility.cgpa && (
                        <td className={padding}>
                          {student.academics?.cgpa !== null && student.academics?.cgpa !== undefined ? (
                            <ScoreBadge score={student.academics.cgpa} size="sm" showBandLabel={false} />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}

                      {/* Latest SGPA */}
                      {columnsVisibility.latestSgpa && (
                        <td className={`${padding} tabular-nums font-mono`}>
                          {student.academics?.latestSgpa !== null && student.academics?.latestSgpa !== undefined ? (
                            student.academics.latestSgpa.toFixed(2)
                          ) : (
                            '—'
                          )}
                        </td>
                      )}

                      {/* Live Backlogs */}
                      {columnsVisibility.totalLiveBacklogs && (
                        <td className={padding}>
                          {(student.academics?.totalLiveBacklogs || 0) > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                              {student.academics.totalLiveBacklogs}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                      )}

                      {/* Closed Backlogs */}
                      {columnsVisibility.totalClosedBacklogs && (
                        <td className={`${padding} text-slate-500 tabular-nums`}>
                          {student.academics?.totalClosedBacklogs ?? 0}
                        </td>
                      )}

                      {/* Placement Policy */}
                      {columnsVisibility.policy && (
                        <td className={padding}>
                          {student.placementPolicySubmitted === true ? (
                            <Badge variant="success" size="sm">Submitted</Badge>
                          ) : student.placementPolicySubmitted === false ? (
                            <Badge variant="warning" size="sm">Pending</Badge>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Not recorded</span>
                          )}
                        </td>
                      )}

                      {/* Attention Level */}
                      {columnsVisibility.attention && (
                        <td className={padding}>
                          {student.attention?.level === 'High' ? (
                            <Badge variant="danger" size="sm" dot>{student.attention.level}</Badge>
                          ) : student.attention?.level === 'Medium' ? (
                            <Badge variant="warning" size="sm" dot>{student.attention.level}</Badge>
                          ) : (
                            <Badge variant="default" size="sm">Low</Badge>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View (< md) */}
        <div className="md:hidden space-y-3 p-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="min-h-[72px] p-3.5 rounded-2xl bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] space-y-2.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="w-28 h-4 rounded" />
                  <Skeleton className="w-14 h-4 rounded" />
                </div>
                <Skeleton className="w-48 h-4 rounded" />
                <Skeleton className="w-36 h-3 rounded" />
              </div>
            ))
          ) : students.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-2xl">
              <EmptyState
                title="No students found"
                message="Try relaxing your filters or searching by a different term."
                action={
                  activeFilterCount > 0 ? (
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                    >
                      Reset all filters
                    </button>
                  ) : null
                }
              />
            </div>
          ) : (
            students.map((student) => {
              const cgpa = student.academics?.cgpa ?? student.cgpa;
              const liveBacklogs = student.academics?.totalLiveBacklogs ?? student.totalLiveBacklogs ?? 0;
              const initials = student.fullName
                ? student.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
                : 'ST';

              return (
                <div
                  key={student.rollNo}
                  onClick={() => navigate(`/students/${student.rollNo}`)}
                  className="min-h-[72px] p-3.5 rounded-2xl bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between gap-2.5"
                >
                  {/* Top Row: Avatar, Name, Roll No + Copy, CGPA */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50 mt-0.5">
                      {initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-[#141A33] dark:text-[#ECEEF8] truncate">
                          {student.fullName}
                        </span>
                        {/* CGPA Score Chip */}
                        {cgpa !== null && cgpa !== undefined && (
                          <ScoreBadge score={cgpa} size="sm" showBandLabel={false} />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          {student.rollNo}
                        </span>
                        <CopyButton text={student.rollNo} size="sm" touchTarget={true} />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Branch · Division, and Live Backlog Chip */}
                  <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="text-[11px] text-[#5B6480] dark:text-[#98A0BE] truncate min-w-0 flex-1">
                      {student.branch || '—'} {student.division ? `· Div ${student.division}` : ''}
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {liveBacklogs > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                          {liveBacklogs} Live BL
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                          Clean
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Server-side Pagination Strip */}
        <div className="px-4 py-3 bg-slate-50/75 dark:bg-[#1E2338]/60 border-t border-[#E4E7EF] dark:border-[#262B44] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5B6480] dark:text-[#98A0BE]">
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="font-mono font-semibold text-[#141A33] dark:text-[#ECEEF8]">{students.length}</span> of{' '}
              <span className="font-mono font-semibold text-[#141A33] dark:text-[#ECEEF8]">{totalStudents.toLocaleString()}</span> students
            </span>

            {/* Per-page limit chooser */}
            <div className="hidden sm:flex items-center gap-1.5 ml-2 border-l border-[#E4E7EF] dark:border-[#262B44] pl-3">
              <span>Per page:</span>
              {[25, 50, 100].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateParam({ limit: num, page: 1 })}
                  className={`px-2 py-0.5 rounded font-mono ${
                    limit === num
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Prev / Next (at least 44x44px touch targets) */}
          <div className="flex items-center gap-2">
            <span className="mr-2">
              Page <span className="font-semibold text-[#141A33] dark:text-[#ECEEF8]">{page}</span> of{' '}
              <span className="font-semibold text-[#141A33] dark:text-[#ECEEF8]">{totalPages}</span>
            </span>

            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParam({ page: page - 1 })}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#171B2E] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#1E2338]"
              title="Previous Page"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => updateParam({ page: page + 1 })}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#171B2E] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-[#1E2338]"
              title="Next Page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setShowFilterSheet(false)}
          />
          <div
            className="relative w-full max-h-[85vh] bg-white dark:bg-[#171B2E] border-t border-[#E4E7EF] dark:border-[#262B44] rounded-t-3xl shadow-2xl flex flex-col z-10 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E7EF] dark:border-[#262B44]">
              <div>
                <h3 className="text-base font-bold text-[#141A33] dark:text-[#ECEEF8]">Filter Students</h3>
                <p className="text-xs text-[#5B6480] dark:text-[#98A0BE]">{totalStudents.toLocaleString()} matching records</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterSheet(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close filter sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Branch */}
              <div>
                <label className="block text-xs font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1.5">Branch</label>
                <select
                  value={branch}
                  onChange={(e) => updateParam({ branch: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8]"
                >
                  <option value="all">All Branches</option>
                  {(filterOptions?.branches || []).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Division */}
              <div>
                <label className="block text-xs font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1.5">Division</label>
                <select
                  value={division}
                  onChange={(e) => updateParam({ division: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8]"
                >
                  <option value="all">All Divisions</option>
                  {(filterOptions?.divisions || []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-xs font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1.5">Batch</label>
                <select
                  value={batch}
                  onChange={(e) => updateParam({ batch: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8]"
                >
                  <option value="all">All Batches</option>
                  {(filterOptions?.batches || []).map((b) => (
                    <option key={b} value={b}>Batch {b}</option>
                  ))}
                </select>
              </div>

              {/* Backlogs */}
              <div>
                <label className="block text-xs font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1.5">Live Backlogs</label>
                <select
                  value={hasLiveBacklog}
                  onChange={(e) => updateParam({ hasLiveBacklog: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8]"
                >
                  <option value="all">All Students</option>
                  <option value="true">Has Live Backlogs (≥ 1)</option>
                  <option value="false">Clean Standing (0 Backlogs)</option>
                </select>
              </div>

              {/* Policy */}
              <div>
                <label className="block text-xs font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1.5">Placement Policy</label>
                <select
                  value={policySubmitted}
                  onChange={(e) => updateParam({ policySubmitted: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8]"
                >
                  <option value="all">All Policies</option>
                  <option value="true">Submitted</option>
                  <option value="false">Pending</option>
                  <option value="null">Not Recorded</option>
                </select>
              </div>

              {/* CGPA Range */}
              <div>
                <label className="block text-xs font-semibold text-[#5B6480] dark:text-[#98A0BE] mb-1.5">CGPA Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={cgpaMin}
                    onChange={(e) => updateParam({ cgpaMin: e.target.value })}
                    placeholder="Min (e.g. 6.0)"
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8]"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={cgpaMax}
                    onChange={(e) => updateParam({ cgpaMax: e.target.value })}
                    placeholder="Max (e.g. 10.0)"
                    className="w-full text-xs p-3 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8]"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="p-4 border-t border-[#E4E7EF] dark:border-[#262B44] flex items-center gap-3 bg-white dark:bg-[#171B2E]">
              <button
                type="button"
                onClick={() => {
                  handleResetFilters();
                  setShowFilterSheet(false);
                }}
                className="flex-1 py-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowFilterSheet(false)}
                className="flex-2 py-3 min-h-[44px] rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm"
              >
                Apply ({totalStudents.toLocaleString()} results)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Bottom Sheet */}
      {showSortSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setShowSortSheet(false)}
          />
          <div
            className="relative w-full bg-white dark:bg-[#171B2E] border-t border-[#E4E7EF] dark:border-[#262B44] rounded-t-3xl shadow-2xl p-5 space-y-4 z-10 animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E4E7EF] dark:border-[#262B44]">
              <h3 className="text-base font-bold text-[#141A33] dark:text-[#ECEEF8]">Sort Students</h3>
              <button
                type="button"
                onClick={() => setShowSortSheet(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                aria-label="Close sort sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE]">Sort By</div>
              {[
                { key: 'rollNo', label: 'Enrollment Roll Number' },
                { key: 'fullName', label: 'Student Name' },
                { key: 'cgpa', label: 'Cumulative CGPA' },
                { key: 'latestSgpa', label: 'Latest SGPA' },
                { key: 'totalLiveBacklogs', label: 'Live Backlogs' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => updateParam({ sortBy: item.key })}
                  className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl text-xs font-medium transition-colors ${
                    sortBy === item.key
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-50 dark:bg-[#1E2338] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{item.label}</span>
                  {sortBy === item.key && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#E4E7EF] dark:border-[#262B44]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE]">Direction</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateParam({ sortOrder: 'asc' })}
                  className={`min-h-[44px] p-3 rounded-xl text-xs font-semibold text-center ${
                    sortOrder === 'asc'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#1E2338] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Ascending (A–Z / Low)
                </button>
                <button
                  type="button"
                  onClick={() => updateParam({ sortOrder: 'desc' })}
                  className={`min-h-[44px] p-3 rounded-xl text-xs font-semibold text-center ${
                    sortOrder === 'desc'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#1E2338] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Descending (Z–A / High)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSortSheet(false)}
              className="w-full min-h-[44px] py-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 mt-2"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
