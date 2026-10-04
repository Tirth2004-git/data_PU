import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  ArrowRight,
  Filter,
  RotateCcw,
  Clock,
  Sparkles,
  BarChart2,
  PieChart as PieIcon,
  ChevronRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  CartesianGrid,
} from 'recharts';
import api from '../api/axios';
import Card from '../components/common/Card';
import Stat from '../components/common/Stat';
import Badge from '../components/common/Badge';
import Chip from '../components/common/Chip';
import ScoreBadge from '../components/common/ScoreBadge';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import Sparkline from '../components/common/Sparkline';
import { formatUtcDate, shortBranch } from '../lib/fieldMap';
import { useTheme } from '../context/ThemeContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // Dashboard scoping filters
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch filter options for dropdowns
  const { data: filterOptions } = useQuery({
    queryKey: ['studentFilters'],
    queryFn: async () => {
      const res = await api.get('/students/filters');
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  // Query analytics overview with filters
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['analyticsOverview', { selectedBranch, selectedBatch, selectedCampus, selectedCourse }],
    queryFn: async () => {
      const params = {};
      if (selectedBranch !== 'all') params.branch = selectedBranch;
      if (selectedBatch !== 'all') params.batch = selectedBatch;
      if (selectedCampus !== 'all') params.campus = selectedCampus;
      if (selectedCourse !== 'all') params.course = selectedCourse;

      const res = await api.get('/analytics/overview', { params });
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  const handleResetFilters = () => {
    setSelectedBranch('all');
    setSelectedBatch('all');
    setSelectedCampus('all');
    setSelectedCourse('all');
  };

  const hasActiveFilters =
    selectedBranch !== 'all' ||
    selectedBatch !== 'all' ||
    selectedCampus !== 'all' ||
    selectedCourse !== 'all';

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <EmptyState
          title="Analytics Service Unavailable"
          message={error?.response?.data?.error?.message || error?.message || 'Failed to aggregate analytics.'}
          icon={AlertTriangle}
          action={
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Retry Aggregation
            </button>
          }
        />
      </div>
    );
  }

  const {
    kpis = {},
    cgpaHistogram = [],
    branchStats = [],
    backlogDistribution = [],
    divisionStats = [],
    policyDistribution = [],
    needsAttention = [],
    dataAsOf,
  } = data || {};

  // Score band colors for CGPA histogram
  const cgpaBarColors = {
    '0–5': '#DC2626', // Red
    '5–6': '#F97316', // Orange
    '6–7': '#F59E0B', // Amber
    '7–8': '#14B8A6', // Teal
    '8–9': '#10B981', // Emerald
    '9–10': '#059669', // Deep Emerald
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#141A33] dark:text-[#ECEEF8]">
            Academic Intelligence Workspace
          </h1>
          <p className="text-xs text-[#5B6480] dark:text-[#98A0BE] mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Dataset snapshot as of {formatUtcDate(dataAsOf || '2026-02-25')}</span>
            {isFetching && <span className="text-[11px] text-indigo-500 animate-pulse ml-2">(refreshing...)</span>}
          </p>
        </div>

        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <span>Open Full Directory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scoping Filter Bar (Collapsible on mobile) */}
      <div className="bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-[16px] p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#141A33] dark:text-[#ECEEF8]">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>Scope Analytics</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid (Always visible on md+, toggleable on mobile) */}
        <div className={`${showFilters ? 'grid' : 'hidden md:grid'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80`}>
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
          >
            <option value="all">All Branches</option>
            {(filterOptions?.branches || []).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Batch Filter */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
          >
            <option value="all">All Batches</option>
            {(filterOptions?.batches || []).map((b) => (
              <option key={b} value={b}>
                Batch {b}
              </option>
            ))}
          </select>

          {/* Campus Filter */}
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
          >
            <option value="all">All Campuses</option>
            {(filterOptions?.campuses || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Course Filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="text-xs p-2 rounded-xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
          >
            <option value="all">All Courses</option>
            {(filterOptions?.courses || []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stat Cards (2-column on mobile, 4-column on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <Stat
          label="Total Students"
          value={kpis.totalStudents || 0}
          caption="active ledger"
          icon={Users}
          onClick={() => navigate('/students')}
        />

        {/* Average CGPA */}
        <Stat
          label="Average CGPA"
          value={kpis.averageCgpa || 0}
          caption="score band weighted"
          icon={GraduationCap}
          delta={kpis.averageCgpa >= 6.0 ? 'Acceptable' : 'Sub-par'}
          deltaType={kpis.averageCgpa >= 6.0 ? 'good' : 'warning'}
        />

        {/* Live Backlogs */}
        <Stat
          label="Students with Live Backlogs"
          value={kpis.studentsWithLiveBacklogs || 0}
          subtext={`${kpis.liveBacklogsPercentage || 0}% of cohort`}
          caption="immediate remedial pool"
          icon={AlertTriangle}
          deltaType="danger"
          onClick={() => navigate('/students?hasLiveBacklog=true')}
        />

        {/* Placement Policy Submitted */}
        <Stat
          label="Policy Undertakings Submitted"
          value={kpis.policySubmitted || 0}
          subtext={`${kpis.policySubmittedPercentage || 0}% of cohort`}
          caption="eligible for corporate drives"
          icon={FileCheck}
          deltaType="good"
          onClick={() => navigate('/students?policySubmitted=true')}
        />
      </div>

      {/* Primary Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. CGPA Distribution Histogram */}
        <Card
          title="CGPA Score Distribution"
          subtitle="Click any score band bar to drill down to students in that bracket."
          icon={BarChart2}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cgpaHistogram} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262B44' : '#E4E7EF'} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: isDark ? '#98A0BE' : '#5B6480' }} />
                <YAxis tick={{ fontSize: 11, fill: isDark ? '#98A0BE' : '#5B6480' }} />
                <Tooltip
                  cursor={{ fill: isDark ? '#1E2338' : '#F1F5F9' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#171B2E' : '#FFFFFF',
                    borderColor: isDark ? '#262B44' : '#E4E7EF',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                  onClick={(entry) => {
                    if (entry && entry.cgpaMin !== undefined) {
                      navigate(`/students?cgpaMin=${entry.cgpaMin}&cgpaMax=${entry.cgpaMax}`);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {cgpaHistogram.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={cgpaBarColors[entry.bucket] || '#4F46E5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap mt-3 text-[11px] text-[#5B6480] dark:text-[#98A0BE]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> ≥ 8.5 Outstanding</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> 7.0–8.49 Very Good</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 6.0–6.99 Good</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> 5.0–5.99 Average</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &lt; 5.0 Remedial</span>
          </div>
        </Card>

        {/* 2. Live Backlog Distribution */}
        <Card
          title="Live Backlogs Distribution"
          subtitle="Students categorized by active backlog frequency (0, 1, 2, 3, 4+)."
          icon={AlertTriangle}
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backlogDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262B44' : '#E4E7EF'} />
                <XAxis dataKey="backlogs" tick={{ fontSize: 11, fill: isDark ? '#98A0BE' : '#5B6480' }} />
                <YAxis tick={{ fontSize: 11, fill: isDark ? '#98A0BE' : '#5B6480' }} />
                <Tooltip
                  cursor={{ fill: isDark ? '#1E2338' : '#F1F5F9' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#171B2E' : '#FFFFFF',
                    borderColor: isDark ? '#262B44' : '#E4E7EF',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                  onClick={(entry) => {
                    if (entry && entry.backlogs === '0') {
                      navigate('/students?hasLiveBacklog=false');
                    } else {
                      navigate('/students?hasLiveBacklog=true');
                    }
                  }}
                  className="cursor-pointer"
                >
                  {backlogDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.backlogs === '0' ? '#10B981' : entry.backlogs === '1' ? '#F59E0B' : '#DC2626'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-xs text-[#5B6480] dark:text-[#98A0BE] mt-3">
            Click on any bar to inspect students in that backlog tier.
          </div>
        </Card>

        {/* 3. Branch Performance (Average CGPA & Count) */}
        <Card
          title="Average CGPA by Branch"
          subtitle="Comparative academic achievement across engineering disciplines."
          icon={GraduationCap}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={(branchStats || []).slice(0, 8).map((b) => ({
                  ...b,
                  displayName: shortBranch(b.branch),
                  fullName: b.branch,
                }))}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#262B44' : '#E4E7EF'} />
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11, fill: isDark ? '#98A0BE' : '#5B6480' }} />
                <YAxis
                  dataKey="displayName"
                  type="category"
                  tick={{ fontSize: 10, fill: isDark ? '#ECEEF8' : '#141A33' }}
                  width={90}
                />
                <Tooltip
                  formatter={(value, name, item) => [value, `Avg CGPA (${item.payload.fullName})`]}
                  contentStyle={{
                    backgroundColor: isDark ? '#171B2E' : '#FFFFFF',
                    borderColor: isDark ? '#262B44' : '#E4E7EF',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="avgCgpa"
                  fill="#4F46E5"
                  radius={[0, 6, 6, 0]}
                  onClick={(entry) => navigate(`/students?branch=${encodeURIComponent(entry.branch)}`)}
                  className="cursor-pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 4. Placement Policy Status Donut */}
        <Card
          title="Placement Policy Undertakings"
          subtitle="Submission rates for institutional placement policy adherence."
          icon={ShieldCheck}
        >
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={policyDistribution}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  onClick={(entry) => {
                    const status = entry.name === 'Submitted' ? 'true' : entry.name === 'Pending' ? 'false' : 'null';
                    navigate(`/students?policySubmitted=${status}`);
                  }}
                  className="cursor-pointer"
                >
                  {policyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#171B2E' : '#FFFFFF',
                    borderColor: isDark ? '#262B44' : '#E4E7EF',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs mt-2">
            {policyDistribution.map((p) => (
              <span key={p.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span>{p.name}: <strong className="font-mono">{p.count}</strong></span>
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Needs Attention Table & Mobile Cards */}
      <Card
        title="Immediate Remedial Attention Priority (Top 10)"
        subtitle="Students with critical live backlog accumulation requiring immediate academic mentorship."
        icon={AlertTriangle}
        action={
          <button
            onClick={() => navigate('/students?hasLiveBacklog=true&sortBy=totalLiveBacklogs&sortOrder=desc')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All Attention Cases</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1E2338]/60 text-[#5B6480] dark:text-[#98A0BE] font-semibold border-b border-[#E4E7EF] dark:border-[#262B44]">
              <tr>
                <th className="px-4 py-2.5">Roll No</th>
                <th className="px-4 py-2.5">Student Name</th>
                <th className="px-4 py-2.5">Branch</th>
                <th className="px-4 py-2.5">Division</th>
                <th className="px-4 py-2.5">CGPA</th>
                <th className="px-4 py-2.5">Live Backlogs</th>
                <th className="px-4 py-2.5">Attention Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EF] dark:divide-[#262B44]">
              {needsAttention.map((s) => (
                <tr
                  key={s.rollNo}
                  onClick={() => navigate(`/students/${s.rollNo}`)}
                  className="hover:bg-slate-50 dark:hover:bg-[#1E2338]/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                    {s.rollNo}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#141A33] dark:text-[#ECEEF8]">
                    {s.fullName}
                  </td>
                  <td className="px-4 py-3 text-[#5B6480] dark:text-[#98A0BE] truncate max-w-[160px]">
                    {shortBranch(s.branch)}
                  </td>
                  <td className="px-4 py-3 font-mono">{s.division || '—'}</td>
                  <td className="px-4 py-3">
                    {s.cgpa !== null ? <ScoreBadge score={s.cgpa} size="sm" showBandLabel={false} /> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      {s.liveBacklogs} Live
                    </span>
                  </td>
                  <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium">
                    {s.attentionReason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (< md) */}
        <div className="md:hidden space-y-2.5">
          {needsAttention.map((s) => (
            <div
              key={s.rollNo}
              onClick={() => navigate(`/students/${s.rollNo}`)}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] hover:border-indigo-400 space-y-2 cursor-pointer shadow-xs active:scale-[0.99] transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs sm:text-sm text-[#141A33] dark:text-[#ECEEF8] truncate">
                    {s.fullName}
                  </div>
                  <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {s.rollNo}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {s.cgpa !== null && <ScoreBadge score={s.cgpa} size="sm" showBandLabel={false} />}
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                    {s.liveBacklogs} Live
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[#5B6480] dark:text-[#98A0BE] truncate max-w-[180px]">
                  {shortBranch(s.branch)} {s.division ? `· Div ${s.division}` : ''}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-medium truncate max-w-[140px]">
                  {s.attentionReason}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
