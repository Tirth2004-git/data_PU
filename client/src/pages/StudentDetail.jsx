import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Copy,
  Check,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  Award,
  Layers,
  Search,
  Code,
  Info,
  CheckCircle2,
  XCircle,
  BarChart2,
  PieChart as PieChartIcon,
  Flag,
  Share2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import api from '../api/axios';
import { config } from '../config';
import Card from '../components/common/Card';
import Stat from '../components/common/Stat';
import Badge from '../components/common/Badge';
import ScoreBadge from '../components/common/ScoreBadge';
import SectionHeader from '../components/common/SectionHeader';
import SectionNav from '../components/common/SectionNav';
import ProgressRing from '../components/common/ProgressRing';
import CopyButton, { copyToClipboard } from '../components/common/CopyButton';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import {
  formatUtcDate,
  formatPhone,
  getAllFields,
} from '../lib/fieldMap';
import {
  generateStudentInsights,
  getScoreBand,
} from '../lib/insights';
import { useTheme } from '../context/ThemeContext';
import QuickActionBar from '../components/student/QuickActionBar';
import QuickFactsContact from '../components/student/QuickFactsContact';
import SemesterStrip from '../components/student/SemesterStrip';

export default function StudentDetail() {
  const { rollNo } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [activeSection, setActiveSection] = useState('overview');
  const [allFieldsSearch, setAllFieldsSearch] = useState('');
  const [showEmptyAndSystem, setShowEmptyAndSystem] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [isFullScale, setIsFullScale] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isDataNotesOpen, setIsDataNotesOpen] = useState(false);
  const [showStickyMiniHeader, setShowStickyMiniHeader] = useState(false);
  const [activeAccordionGroups, setActiveAccordionGroups] = useState({
    Identification: true,
    'Contact & Personal': true,
    'Academic Profile': true,
    'Current Academics': true,
    'Academic Journey': true,
    Backlogs: true,
    Placement: true,
    'System & Metadata': false,
  });

  const heroRef = useRef(null);

  // Monitor hero scroll to trigger sticky mini header and sticky mobile action bar
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setShowStickyMiniHeader(rect.bottom < 60);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch full student document
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['student', rollNo],
    queryFn: async () => {
      const res = await api.get(`/students/${rollNo}`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  // Fetch cohort insights
  const { data: cohortData } = useQuery({
    queryKey: ['student-insights', rollNo],
    queryFn: async () => {
      const res = await api.get(`/students/${rollNo}/insights`);
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const student = data?.student;
  const navigation = data?.navigation;
  const cohort = cohortData?.cohort;

  // Compute deterministic insights
  const insights = useMemo(() => {
    if (!student) return null;
    return generateStudentInsights(student);
  }, [student]);

  const semAnalytics = insights?.semesterAnalytics;
  const backlogConsistency = insights?.backlogConsistency;
  const attention = insights?.attention;
  const eligibility = insights?.eligibility;
  const dataNotes = insights?.dataNotes || [];
  const scoreBand = insights?.scoreBand;

  // All Fields disclosure
  const allFieldRows = useMemo(() => {
    if (!student) return [];
    return getAllFields(student);
  }, [student]);

  const filteredFieldRows = useMemo(() => {
    return allFieldRows.filter((r) => {
      // Filter out empty and system columns when toggle is off
      if (!showEmptyAndSystem) {
        if (/^Unnamed: \d+$/i.test(r.key)) return false;
        if (r.rawValue === null || r.rawValue === undefined || r.rawValue === '') return false;
      }

      if (!allFieldsSearch.trim()) return true;
      const q = allFieldsSearch.toLowerCase();
      return (
        r.key.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q) ||
        String(r.formatted).toLowerCase().includes(q)
      );
    });
  }, [allFieldRows, allFieldsSearch, showEmptyAndSystem]);

  // Group filtered rows by category group for mobile accordions
  const groupedFields = useMemo(() => {
    const map = {};
    filteredFieldRows.forEach((r) => {
      const g = r.group || 'Other Fields';
      if (!map[g]) map[g] = [];
      map[g].push(r);
    });
    return map;
  }, [filteredFieldRows]);

  const toggleAccordionGroup = (group) => {
    setActiveAccordionGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const handleCopyJson = async () => {
    if (!student) return;
    const ok = await copyToClipboard(JSON.stringify(student, null, 2));
    if (ok) {
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.open(`/students/${rollNo}/print`, '_blank');
  };

  // Prepare chart datasets
  const semesterChartData = useMemo(() => {
    if (!student?.academics?.semesters) return [];
    return student.academics.semesters.map((s, idx, arr) => {
      const prev = idx > 0 ? arr[idx - 1] : null;
      const delta = prev && s.sgpa !== null && prev.sgpa !== null
        ? Number((s.sgpa - prev.sgpa).toFixed(2))
        : null;
      return {
        sem: `Sem ${s.sem}`,
        semNumber: s.sem,
        sgpa: s.sgpa,
        backlogCount: s.backlogCount || 0,
        delta,
      };
    });
  }, [student]);

  // SGPA Dynamic Zoom Domain Calculation (Bug 12)
  const validSgpas = useMemo(() => {
    return (student?.academics?.semesters || [])
      .map((s) => s.sgpa)
      .filter((v) => v !== null && v !== undefined && !isNaN(v));
  }, [student]);

  const sgpaYDomain = useMemo(() => {
    if (isFullScale || validSgpas.length === 0) return [0, 10];
    const min = Math.min(...validSgpas, student?.academics?.cgpa || 10);
    const max = Math.max(...validSgpas, student?.academics?.cgpa || 0);
    const low = Math.max(0, Math.floor(min - 0.5));
    const high = Math.min(10, Math.ceil(max + 0.5));
    return [low, high];
  }, [validSgpas, isFullScale, student?.academics?.cgpa]);

  const allZeroBacklogs = useMemo(() => {
    return (student?.academics?.semesters || []).every((s) => (s.backlogCount || 0) === 0);
  }, [student]);

  const maxBacklogInSem = useMemo(() => {
    const list = (student?.academics?.semesters || []).map((s) => s.backlogCount || 0);
    return Math.max(1, ...list);
  }, [student]);

  // Backlog Donut Data
  const liveCount = student?.academics?.totalLiveBacklogs || 0;
  const closedCount = student?.academics?.totalClosedBacklogs || 0;
  const backlogDonutData = [
    { name: 'Live Backlogs', value: liveCount, color: '#DC2626' },
    { name: 'Closed Backlogs', value: closedCount, color: '#14B8A6' },
  ].filter((d) => d.value > 0);

  // Radar Data (Bug 14: Short labels)
  const radarData = useMemo(() => {
    if (!student) return [];
    const list = [];
    if (student.tenth?.marks) list.push({ subject: '10th', score: student.tenth.marks, fullMark: 100 });
    if (student.twelfth?.marks) list.push({ subject: '12th', score: student.twelfth.marks, fullMark: 100 });
    if (student.academics?.cgpa) list.push({ subject: 'CGPA', score: student.academics.cgpa * 10, fullMark: 100 });
    if (student.academics?.avgSgpa) list.push({ subject: 'Avg SGPA', score: student.academics.avgSgpa * 10, fullMark: 100 });
    return list;
  }, [student]);

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'semesters', label: 'Semesters' },
    { id: 'journey', label: 'Journey' },
    { id: 'backlogs', label: 'Backlogs' },
    { id: 'placement', label: 'Placement' },
    { id: 'cohort', label: 'Cohort' },
    { id: 'all-fields', label: 'All Fields' },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-workspace mx-auto p-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <EmptyState
          title="Student Record Not Found"
          message={`No student enrollment record matching roll number '${rollNo}' was found in the institutional database.`}
          action={
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-xs"
            >
              Return to Student Directory
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 relative">
      {/* Sticky Mini Header (Section 4) */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#171B2E]/95 backdrop-blur-md border-b border-[#E4E7EF] dark:border-[#262B44] px-4 h-14 flex items-center justify-between transition-all duration-200 lg:hidden ${
          showStickyMiniHeader ? 'translate-y-0 opacity-100 shadow-md' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => navigate('/students')}
            className="p-2 -ml-2 text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] dark:hover:text-[#ECEEF8] rounded-xl"
            aria-label="Back to students"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1 truncate text-xs font-semibold text-[#141A33] dark:text-[#ECEEF8]">
            <span className="truncate">{student.fullName}</span>
            <span className="text-[#5B6480] dark:text-[#98A0BE] font-mono ml-1.5 font-normal">
              · CGPA {student.academics?.cgpa ? student.academics.cgpa.toFixed(2) : '—'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-[#1E2338]"
          title="Print Report"
          aria-label="Print Report"
        >
          <Printer className="w-4 h-4" />
        </button>
      </div>

      {/* Top App Bar Navigation on Desktop / Tablet (Section 3.1) */}
      <div className="flex items-center justify-between gap-3 no-print">
        <button
          type="button"
          onClick={() => navigate('/students')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] dark:hover:text-[#ECEEF8] transition-colors min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Students</span>
        </button>

        <div className="flex items-center gap-2">
          {navigation?.prevRollNo && (
            <Link
              to={`/students/${navigation.prevRollNo}`}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#171B2E] text-xs font-medium text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] flex items-center justify-center gap-1"
              title={`Previous: ${navigation.prevName}`}
              aria-label="Previous student"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </Link>
          )}

          {navigation?.nextRollNo && (
            <Link
              to={`/students/${navigation.nextRollNo}`}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1.5 rounded-xl border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#171B2E] text-xs font-medium text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] flex items-center justify-center gap-1"
              title={`Next: ${navigation.nextName}`}
              aria-label="Next student"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}

          {/* Print Report Desktop Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          {/* Mobile "⋯" Menu for Print / Actions */}
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#171B2E] text-[#5B6480] dark:text-[#98A0BE] flex items-center justify-center"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-2xl shadow-popover p-2 z-30 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    handlePrint();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl text-[#141A33] dark:text-[#ECEEF8] hover:bg-slate-100 dark:hover:bg-[#1E2338]"
                >
                  <Printer className="w-4 h-4 text-indigo-500" />
                  <span>Print Report (PDF)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Compact Hero (Section 3.1 & Bugs 1, 3) */}
      <div
        ref={heroRef}
        id="hero-header"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-6 shadow-md border border-indigo-900/40"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Avatar and Primary Identity */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            {/* 56px Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-300 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0 border-2 border-white/20">
              {student.fullName
                ? student.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
                : 'ST'}
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* 20px semibold Name with anywhere wrap */}
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight break-words [overflow-wrap:anywhere] leading-snug">
                  {student.fullName}
                </h1>
                {/* S.No chip (renamed from #SNo, hidden on < 480px) */}
                {student.sNo && (
                  <span className="hidden xs:inline-flex text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                    S.No {student.sNo}
                  </span>
                )}
              </div>

              {/* Mono Roll Number with 44x44 copy target */}
              <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-indigo-300">
                <span className="font-semibold tracking-wide">{student.rollNo}</span>
                <CopyButton
                  text={student.rollNo}
                  touchTarget
                  className="text-indigo-200 hover:text-white"
                  title="Copy enrollment roll number"
                />
              </div>

              {/* One horizontally scrollable chips row with right-edge fade */}
              <div className="relative pt-1 max-w-full">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 whitespace-nowrap text-xs">
                  {student.branch && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/90 border border-white/10 shrink-0">
                      {student.branch}
                    </span>
                  )}
                  {student.division && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/25 text-indigo-200 border border-indigo-400/30 font-mono shrink-0 truncate max-w-[140px]">
                      {student.division}
                    </span>
                  )}
                  {student.batch && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/90 border border-white/10 shrink-0">
                      Batch {student.batch}
                    </span>
                  )}
                  {student.campus && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/90 border border-white/10 shrink-0">
                      {student.campus}
                    </span>
                  )}
                  {student.course && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/90 border border-white/10 shrink-0">
                      {student.course}
                    </span>
                  )}
                  {student.nationality && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/90 border border-white/10 shrink-0 flex items-center gap-1">
                      <Flag className="w-3 h-3 text-teal-400" />
                      <span>{student.nationality}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Snapshot Date Line (Bug 3) */}
              <div className="text-[11px] text-white/70 pt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 opacity-70" />
                <span>Updated {formatUtcDate(student.recordDate)}</span>
              </div>
            </div>
          </div>

          {/* Status Badges Container (Bug 1: display:flex; flex-wrap:wrap; gap:8px) */}
          <div id="hero-status-badges" className="flex flex-wrap items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
            {/* Attention Level Badge */}
            {attention && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border shadow-xs whitespace-nowrap ${
                  attention.level === 'High'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : attention.level === 'Medium'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span>{attention.level} Attention</span>
              </span>
            )}

            {/* Backlog Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap border shadow-xs ${
                liveCount > 0
                  ? 'bg-rose-600/90 text-white border-rose-400/40'
                  : 'bg-emerald-600/90 text-white border-emerald-400/40'
              }`}
            >
              {liveCount > 0 ? `${liveCount} Live Backlog${liveCount > 1 ? 's' : ''}` : 'No Backlogs (Clean)'}
            </span>

            {/* Placement Policy Status Tri-state Badge (Bug 8) */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap border ${
                student.placementPolicySubmitted === true
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                  : student.placementPolicySubmitted === false
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/10 text-white/70 border-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 opacity-80" />
              <span>
                {student.placementPolicySubmitted === true
                  ? 'Policy submitted'
                  : student.placementPolicySubmitted === false
                  ? 'Not submitted'
                  : 'Not recorded'}
              </span>
            </span>

            {/* Administrative Remarks Badge */}
            {student.remarks && (
              <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-xl bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 font-mono whitespace-nowrap">
                Remarks: {student.remarks}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Quick Action Bar (Section 3.2: Call, WhatsApp, Email, Copy roll) */}
      <div id="section-actions">
        <QuickActionBar student={student} />
      </div>

      {/* 3. Mobile Quick Facts & Contact (Section 2 & 3.3 - placed BEFORE KPIs on mobile) */}
      <div id="section-quickFacts" className="lg:hidden">
        <QuickFactsContact student={student} />
      </div>

      {/* 4. KPI Block (Section 3.4 & Bug 2) */}
      <div id="section-kpis" className="space-y-2.5">
        {/* Row 1: Two Large Cards (CGPA & Latest SGPA) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* CGPA Card */}
          <div className="bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <span className="text-xs uppercase font-bold tracking-wider text-[#5B6480] dark:text-[#98A0BE] block truncate">
                Cumulative CGPA
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#141A33] dark:text-[#ECEEF8] font-mono tabular-nums">
                {student.academics?.cgpa !== null && student.academics?.cgpa !== undefined
                  ? student.academics.cgpa.toFixed(2)
                  : '—'}
              </div>
              <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                {scoreBand?.label} ({scoreBand?.band})
              </div>
            </div>
            <ProgressRing
              value={student.academics?.cgpa}
              size={68}
              strokeWidth={6}
              label=""
            />
          </div>

          {/* Latest SGPA Card */}
          <div className="bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
                Latest SGPA
              </span>
              {semAnalytics?.latestVsPrevious && (
                <span
                  className={`text-xs font-semibold font-mono px-2 py-0.5 rounded-full ${
                    semAnalytics.latestVsPrevious.isZero
                      ? 'bg-slate-100 dark:bg-slate-800 text-[#5B6480] dark:text-[#98A0BE]'
                      : semAnalytics.latestVsPrevious.delta > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {semAnalytics.latestVsPrevious.indicator} {semAnalytics.latestVsPrevious.formattedDelta}
                </span>
              )}
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#141A33] dark:text-[#ECEEF8] font-mono tabular-nums my-1">
              {student.academics?.latestSgpa !== null && student.academics?.latestSgpa !== undefined
                ? student.academics.latestSgpa.toFixed(2)
                : '—'}
            </div>

            <div className="text-xs text-[#5B6480] dark:text-[#98A0BE] truncate">
              {semAnalytics?.latestVsPrevious?.prevSgpa
                ? `vs ${semAnalytics.latestVsPrevious.prevSgpa.toFixed(2)} previous semester`
                : 'Latest completed semester'}
            </div>
          </div>
        </div>

        {/* Row 2: Five Compact Tiles in 3-column grid (3 + 2, height ≤ 84px) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* AVG SGPA */}
          <div className="h-[78px] p-3 rounded-2xl bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] shadow-xs flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
              Avg SGPA
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-[#141A33] dark:text-[#ECEEF8]">
              {student.academics?.avgSgpa !== null && student.academics?.avgSgpa !== undefined
                ? student.academics.avgSgpa.toFixed(2)
                : '—'}
            </div>
          </div>

          {/* LIVE BL. (red only when > 0, green otherwise) */}
          <div className="h-[78px] p-3 rounded-2xl bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] shadow-xs flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
              Live BL.
            </span>
            <div
              className={`text-xl font-bold font-mono tabular-nums ${
                liveCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {liveCount}
            </div>
          </div>

          {/* CLOSED BL. */}
          <div className="h-[78px] p-3 rounded-2xl bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] shadow-xs flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
              Closed BL.
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-[#141A33] dark:text-[#ECEEF8]">
              {closedCount}
            </div>
          </div>

          {/* 10TH */}
          <div className="h-[78px] p-3 rounded-2xl bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] shadow-xs flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
              10th Marks
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-[#141A33] dark:text-[#ECEEF8]">
              {student.tenth?.marks !== null && student.tenth?.marks !== undefined
                ? `${student.tenth.marks}%`
                : '—'}
            </div>
          </div>

          {/* 12TH */}
          <div className="h-[78px] p-3 rounded-2xl bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[11px] uppercase font-bold tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
              12th Marks
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-[#141A33] dark:text-[#ECEEF8]">
              {student.twelfth?.marks !== null && student.twelfth?.marks !== undefined
                ? `${student.twelfth.marks}%`
                : '—'}
            </div>
          </div>
        </div>

        {/* Single footnote under KPI section (Bug 2) */}
        <p className="text-[11px] text-[#5B6480] dark:text-[#98A0BE] italic">
          Values shown exactly as stored in records.
        </p>
      </div>

      {/* 5. Sticky Section Pills (Section 3.5) */}
      <div className="sticky top-14 lg:top-16 z-30 bg-slate-50/90 dark:bg-[#0E1120]/90 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <SectionNav
          sections={sections}
          activeSection={activeSection}
          onSelect={scrollToSection}
        />
      </div>

      {/* Main 2-Column Layout (Desktop right rail, Mobile full width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* SECTION 1: Overview & Automated Insights (Bug 10, 11) */}
          <section id="overview" className="space-y-4 scroll-mt-28">
            <Card
              title="Academic Insights & Analysis"
              subtitle="Deterministic findings generated directly from student records without guesswork."
              icon={Sparkles}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Best / Worst Sems with absolute band colors */}
                {semAnalytics?.bestSemester && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] space-y-1">
                    <span className="text-[11px] font-bold text-[#5B6480] dark:text-[#98A0BE] uppercase tracking-wider">
                      Performance Range
                    </span>
                    <p className="text-xs text-[#141A33] dark:text-[#ECEEF8] leading-relaxed">
                      Best semester:{' '}
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                        Sem {semAnalytics.bestSemester.sem} ({semAnalytics.bestSemester.sgpa.toFixed(2)})
                      </strong>
                      . Lowest semester:{' '}
                      <strong
                        className={`font-mono ${
                          semAnalytics.worstSemester.sgpa >= 7.0
                            ? 'text-teal-600 dark:text-teal-400'
                            : semAnalytics.worstSemester.sgpa >= 6.0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        Sem {semAnalytics.worstSemester.sem} ({semAnalytics.worstSemester.sgpa.toFixed(2)})
                      </strong>
                      .
                    </p>
                  </div>
                )}

                {/* 3-Semester Trend with tolerance */}
                {semAnalytics?.lastThreeTrend && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] space-y-1">
                    <span className="text-[11px] font-bold text-[#5B6480] dark:text-[#98A0BE] uppercase tracking-wider">
                      3-Semester Trajectory
                    </span>
                    <p className="text-xs text-[#141A33] dark:text-[#ECEEF8] leading-relaxed">
                      <span
                        className={`font-semibold mr-1.5 ${
                          semAnalytics.lastThreeTrend.trend === 'improving'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : semAnalytics.lastThreeTrend.trend === 'declining'
                            ? semAnalytics.lastThreeTrend.color === 'red'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                            : 'text-[#5B6480] dark:text-[#98A0BE]'
                        }`}
                      >
                        {semAnalytics.lastThreeTrend.label} Trajectory
                      </span>
                      <span className="font-mono text-xs opacity-90">
                        ({semAnalytics.lastThreeTrend.text})
                      </span>
                    </p>
                  </div>
                )}

                {/* Largest Volatility Spikes */}
                {semAnalytics?.largestDrop && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-bold text-[#5B6480] dark:text-[#98A0BE] uppercase tracking-wider">
                      Progression Volatility
                    </span>
                    <p className="text-xs text-[#141A33] dark:text-[#ECEEF8] leading-relaxed">
                      Largest shift: Sem {semAnalytics.largestDrop.fromSem} → {semAnalytics.largestDrop.toSem} (
                      <span
                        className={
                          Math.abs(semAnalytics.largestDrop.diff) >= 1.0
                            ? 'text-rose-600 dark:text-rose-400 font-semibold font-mono'
                            : 'text-[#5B6480] dark:text-[#98A0BE] font-mono'
                        }
                      >
                        {semAnalytics.largestDrop.diff.toFixed(2)}
                      </span>
                      )
                      {semAnalytics.largestRise && (
                        <span>
                          , largest rise: Sem {semAnalytics.largestRise.fromSem} → {semAnalytics.largestRise.toSem} (+
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                            {semAnalytics.largestRise.diff.toFixed(2)}
                          </span>
                          )
                        </span>
                      )}
                      .
                    </p>
                  </div>
                )}
              </div>

              {/* Data Quality Notes Collapsible Accordion (Closed by default) */}
              {dataNotes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#E4E7EF] dark:border-[#262B44]">
                  <button
                    type="button"
                    onClick={() => setIsDataNotesOpen(!isDataNotesOpen)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] dark:hover:text-[#ECEEF8] transition-colors py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Data Quality Notes ({dataNotes.length})</span>
                    </span>
                    {isDataNotesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isDataNotesOpen && (
                    <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                      {dataNotes.map((note) => (
                        <div
                          key={note.key}
                          className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-[#1E2338] text-[#5B6480] dark:text-[#98A0BE] border border-[#E4E7EF] dark:border-[#262B44] flex items-start gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <div>
                            <strong className="text-[#141A33] dark:text-[#ECEEF8] font-medium mr-1.5">
                              {note.title}:
                            </strong>
                            <span>{note.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </section>

          {/* SECTION 2: Semesters (Section 3.6 & Bugs 12, 13) */}
          <section id="semesters" className="space-y-4 scroll-mt-28">
            <Card
              title="Semester Progression & Charts"
              subtitle="SGPA progression across Semesters 1 to 5 with backlog tracking and delta comparisons."
              icon={TrendingUp}
            >
              {/* Horizontal Snap-Scroll Semester Strip (Section 3.6) */}
              <div className="mb-6">
                <SemesterStrip
                  semesters={student.academics?.semesters || []}
                  avgSgpa={student.academics?.avgSgpa}
                />
              </div>

              {/* SGPA Area Chart with Dynamic Zoom (Bug 12) */}
              <div className="space-y-6 pt-2 border-t border-[#E4E7EF] dark:border-[#262B44]">
                <div>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE] flex items-center gap-2">
                      <span>SGPA Progression (Sem 1 – 5)</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {isFullScale ? 'Scale 0–10' : 'Zoomed View'}
                      </span>
                    </h4>

                    {/* Scale Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsFullScale(!isFullScale)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#171B2E] text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] transition-colors"
                    >
                      {isFullScale ? 'Zoom scale' : 'Full 0–10 scale'}
                    </button>
                  </div>

                  <div className="h-56 sm:h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={semesterChartData}
                        margin={{ top: 12, right: 65, left: -15, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="sgpaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262B44' : '#E4E7EF'} />
                        <XAxis dataKey="sem" tick={{ fontSize: 11, fill: isDark ? '#98A0BE' : '#5B6480' }} />
                        <YAxis
                          domain={sgpaYDomain}
                          allowDecimals
                          tick={{ fontSize: 11, fill: isDark ? '#98A0BE' : '#5B6480' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#171B2E' : '#FFFFFF',
                            borderColor: isDark ? '#262B44' : '#E4E7EF',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                          formatter={(value, name) => [`${Number(value).toFixed(2)} SGPA`, 'Score']}
                        />
                        {student.academics?.cgpa && (
                          <ReferenceLine
                            y={student.academics.cgpa}
                            stroke="#8B5CF6"
                            strokeDasharray="4 4"
                            label={{
                              value: `CGPA ${student.academics.cgpa.toFixed(2)}`,
                              position: 'right',
                              fill: '#8B5CF6',
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          />
                        )}
                        <Area
                          type="monotone"
                          dataKey="sgpa"
                          stroke="#4F46E5"
                          strokeWidth={2.5}
                          fill="url(#sgpaGradient)"
                          dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#FFFFFF' }}
                          activeDot={{ r: 6 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Backlog Count Bar Chart (Bug 13) */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE] mb-2">
                    Backlogs Registered Per Semester
                  </h4>

                  {allZeroBacklogs ? (
                    <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                          No backlogs in any semester
                        </div>
                        <div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                          All 5 semesters passed with clean academic standing on initial examination.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-36 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={semesterChartData}
                          margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262B44' : '#E4E7EF'} />
                          <XAxis dataKey="sem" tick={{ fontSize: 11, fill: isDark ? '#98A0BE' : '#5B6480' }} />
                          <YAxis
                            allowDecimals={false}
                            domain={[0, maxBacklogInSem]}
                            ticks={Array.from({ length: maxBacklogInSem + 1 }, (_, i) => i)}
                            tick={{ fontSize: 11, fill: isDark ? '#98A0BE' : '#5B6480' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#171B2E' : '#FFFFFF',
                              borderColor: isDark ? '#262B44' : '#E4E7EF',
                              borderRadius: '12px',
                              fontSize: '12px',
                            }}
                            formatter={(value) => [`${value} Backlogs`, 'Backlogs']}
                          />
                          <Bar dataKey="backlogCount" radius={[6, 6, 0, 0]}>
                            {semesterChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.backlogCount > 0 ? '#DC2626' : (isDark ? '#262B44' : '#E4E7EF')}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </section>

          {/* SECTION 3: Academic Journey (Section 3.7 & Bug 14) */}
          <section id="journey" className="space-y-4 scroll-mt-28">
            <Card
              title="Academic Journey & Progression"
              subtitle="Timeline across 10th Secondary, 12th Higher Secondary, Diploma (if present), and ongoing B.Tech course."
              icon={GraduationCap}
            >
              {/* Vertical / Responsive Timeline Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
                {/* 10th */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44]">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                    10th Secondary
                  </span>
                  <div className="text-xl font-bold text-[#141A33] dark:text-[#ECEEF8] tabular-nums">
                    {student.tenth?.marks ? `${student.tenth.marks}%` : '—'}
                  </div>
                  <div className="text-xs text-[#5B6480] dark:text-[#98A0BE] mt-1 truncate">
                    {student.tenth?.board || 'Secondary Board'} · {student.tenth?.passingYear || '—'}
                  </div>
                </div>

                {/* 12th */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44]">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                    12th Higher Sec
                  </span>
                  <div className="text-xl font-bold text-[#141A33] dark:text-[#ECEEF8] tabular-nums">
                    {student.twelfth?.marks ? `${student.twelfth.marks}%` : '—'}
                  </div>
                  <div className="text-xs text-[#5B6480] dark:text-[#98A0BE] mt-1 truncate">
                    {student.twelfth?.board || 'Higher Sec Board'} · {student.twelfth?.passingYear || '—'}
                  </div>
                </div>

                {/* Diploma */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44]">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                    Diploma
                  </span>
                  <div className="text-xl font-bold text-[#141A33] dark:text-[#ECEEF8] tabular-nums">
                    {student.diploma?.marks ? `${student.diploma.marks}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-[#5B6480] dark:text-[#98A0BE] mt-1 truncate">
                    {student.diploma?.degreeName || 'Standard Entry'}
                  </div>
                </div>

                {/* Current B.Tech */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44]">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                    B.Tech Degree
                  </span>
                  <div className="text-xl font-bold text-[#141A33] dark:text-[#ECEEF8] tabular-nums">
                    CGPA {student.academics?.cgpa ? student.academics.cgpa.toFixed(2) : '—'}
                  </div>
                  <div className="text-xs text-[#5B6480] dark:text-[#98A0BE] mt-1 truncate">
                    Expected {student.batch || '2027'}
                  </div>
                </div>
              </div>

              {/* Multi-Dimensional Academic Profile Radar Chart (Bug 14) */}
              {radarData.length >= 3 && (
                <div className="pt-4 border-t border-[#E4E7EF] dark:border-[#262B44]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE] mb-2 text-center">
                    Multi-Dimensional Academic Profile
                  </h4>

                  {/* Horizontal Progress Bars on screens < 380px, Radar Chart on >= 380px */}
                  <div className="sm:hidden space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#1E2338]/60 border border-[#E4E7EF] dark:border-[#262B44]">
                    {radarData.map((d) => (
                      <div key={d.subject} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#141A33] dark:text-[#ECEEF8]">{d.subject}</span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                            {d.score.toFixed(1)} / 100
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, d.score))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={radarData}
                        margin={{ top: 15, right: 35, bottom: 15, left: 35 }}
                      >
                        <PolarGrid stroke={isDark ? '#262B44' : '#E4E7EF'} />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fontSize: 11, fill: isDark ? '#ECEEF8' : '#141A33', fontWeight: 600 }}
                        />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Student"
                          dataKey="score"
                          stroke="#4F46E5"
                          fill="#4F46E5"
                          fillOpacity={0.35}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDark ? '#171B2E' : '#FFFFFF',
                            borderColor: isDark ? '#262B44' : '#E4E7EF',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                          formatter={(value) => [`${value.toFixed(1)} / 100`, 'Score']}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </Card>
          </section>

          {/* SECTION 4: Backlogs */}
          <section id="backlogs" className="space-y-4 scroll-mt-28">
            <Card
              title="Backlog Intelligence & Audit"
              subtitle="Analysis of active versus resolved course backlogs and semester consistency."
              icon={AlertTriangle}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-48 w-full flex items-center justify-center">
                  {liveCount === 0 && closedCount === 0 ? (
                    <div className="text-center p-6 text-emerald-600 dark:text-emerald-400 font-semibold text-xs sm:text-sm">
                      Zero backlogs recorded across entire academic career ✓
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={backlogDonutData}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {backlogDonutData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
                      Backlog Audit Result
                    </span>
                    <div className="text-xs text-[#141A33] dark:text-[#ECEEF8] leading-relaxed">
                      {liveCount} live backlogs, {closedCount} closed backlogs.
                      <div className="mt-1 font-medium text-indigo-600 dark:text-indigo-400 font-mono">
                        {backlogConsistency?.badgeText}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* SECTION 5: Placement */}
          <section id="placement" className="space-y-4 scroll-mt-28">
            <Card
              title="Placement Policy & Eligibility Engine"
              subtitle="Tri-state placement compliance and deterministic criteria verification."
              icon={ShieldCheck}
            >
              <div className="space-y-4">
                {/* Tri-state banner (Bug 8) */}
                <div
                  className={`p-4 rounded-2xl border flex items-center gap-3 ${
                    student.placementPolicySubmitted === true
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : student.placementPolicySubmitted === false
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold">
                      {student.placementPolicySubmitted === true
                        ? 'Placement Policy Undertaking Submitted'
                        : student.placementPolicySubmitted === false
                        ? 'Placement Policy Undertaking Pending'
                        : 'Placement Policy Status Not Recorded'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5">
                      {student.placementPolicySubmitted === true
                        ? 'Student is verified compliant with institutional training and placement guidelines.'
                        : student.placementPolicySubmitted === false
                        ? 'Student has not yet submitted the required placement undertaking form.'
                        : 'No placement policy submission record exists for this enrollment.'}
                    </div>
                  </div>
                </div>

                {/* Eligibility Checklist */}
                {eligibility && (
                  <div className="space-y-2">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-[#5B6480] dark:text-[#98A0BE] block">
                      Placement Criteria Status
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {eligibility.checks.map((c, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-2xl border border-[#E4E7EF] dark:border-[#262B44] bg-slate-50 dark:bg-[#1E2338] text-xs flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-[#141A33] dark:text-[#ECEEF8]">{c.label}</div>
                            <div className="text-[11px] text-[#5B6480] dark:text-[#98A0BE] mt-0.5">{c.reason}</div>
                          </div>
                          {c.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* SECTION 6: Cohort Comparison */}
          <section id="cohort" className="space-y-4 scroll-mt-28">
            <Card
              title="Cohort Benchmarking & Class Standing"
              subtitle="Relative position within division, branch, and graduation batch."
              icon={User}
            >
              {cohort ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
                      Division: {cohort.division?.label}
                    </span>
                    <div className="text-xl font-bold font-mono text-[#141A33] dark:text-[#ECEEF8]">
                      #{cohort.division?.rank || '—'}{' '}
                      <span className="text-xs font-normal text-[#5B6480] dark:text-[#98A0BE]">
                        of {cohort.division?.total || '—'}
                      </span>
                    </div>
                    <div className="text-xs text-[#5B6480] dark:text-[#98A0BE]">
                      Percentile:{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {cohort.division?.percentile ? `${cohort.division.percentile}%` : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
                      Branch: {cohort.branch?.label}
                    </span>
                    <div className="text-xl font-bold font-mono text-[#141A33] dark:text-[#ECEEF8]">
                      #{cohort.branch?.rank || '—'}{' '}
                      <span className="text-xs font-normal text-[#5B6480] dark:text-[#98A0BE]">
                        of {cohort.branch?.total || '—'}
                      </span>
                    </div>
                    <div className="text-xs text-[#5B6480] dark:text-[#98A0BE]">
                      Percentile:{' '}
                      <strong className="text-teal-600 dark:text-teal-400">
                        {cohort.branch?.percentile ? `${cohort.branch.percentile}%` : '—'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
                      Batch: {cohort.batch?.label}
                    </span>
                    <div className="text-xl font-bold font-mono text-[#141A33] dark:text-[#ECEEF8]">
                      #{cohort.batch?.rank || '—'}{' '}
                      <span className="text-xs font-normal text-[#5B6480] dark:text-[#98A0BE]">
                        of {cohort.batch?.total || '—'}
                      </span>
                    </div>
                    <div className="text-xs text-[#5B6480] dark:text-[#98A0BE]">
                      Percentile:{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">
                        {cohort.batch?.percentile ? `${cohort.batch.percentile}%` : '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <Skeleton className="h-28 rounded-2xl" />
              )}
            </Card>
          </section>

          {/* SECTION 7: All Fields (Stacked List on Mobile, Table on Desktop) (Bug 15 & Section 3.9) */}
          <section id="all-fields" className="space-y-4 scroll-mt-28">
            <Card
              title="All Dataset Fields (Complete Raw Representation)"
              subtitle="Full tabular disclosure of every single column and nested key stored in MongoDB for this student."
              icon={Code}
              action={
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#171B2E] text-xs font-semibold hover:border-indigo-500 transition-colors"
                >
                  {jsonCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600">Copied Full JSON</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Copy Full JSON</span>
                    </>
                  )}
                </button>
              }
            >
              {/* Controls: Search & Toggle Empty/System Columns (Bug 15) */}
              <div className="space-y-3 mb-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={allFieldsSearch}
                      onChange={(e) => setAllFieldsSearch(e.target.value)}
                      placeholder="Filter 39 raw database fields..."
                      className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#1E2338] border border-[#E4E7EF] dark:border-[#262B44] text-[#141A33] dark:text-[#ECEEF8] focus:outline-none"
                    />
                  </div>

                  {/* Toggle empty & system columns */}
                  <button
                    type="button"
                    onClick={() => setShowEmptyAndSystem(!showEmptyAndSystem)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[#E4E7EF] dark:border-[#262B44] bg-white dark:bg-[#171B2E] text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] shrink-0"
                  >
                    {showEmptyAndSystem ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{showEmptyAndSystem ? 'Hide Empty/System Columns' : 'Show Empty/System Columns'}</span>
                  </button>
                </div>
              </div>

              {/* Mobile View: Stacked List Grouped by Accordion Groups */}
              <div className="md:hidden space-y-3">
                {Object.entries(groupedFields).map(([groupName, rows]) => {
                  const isOpen = activeAccordionGroups[groupName] !== false;
                  return (
                    <div
                      key={groupName}
                      className="border border-[#E4E7EF] dark:border-[#262B44] rounded-2xl overflow-hidden bg-white dark:bg-[#171B2E]"
                    >
                      <button
                        type="button"
                        onClick={() => toggleAccordionGroup(groupName)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-slate-50/70 dark:bg-[#1E2338]/50 text-xs font-bold text-[#141A33] dark:text-[#ECEEF8] border-b border-[#E4E7EF] dark:border-[#262B44]"
                      >
                        <span>
                          {groupName} ({rows.length})
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isOpen && (
                        <div className="divide-y divide-[#E4E7EF] dark:divide-[#262B44]">
                          {rows.map((row) => (
                            <div key={row.key} className="p-3.5 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono text-[#5B6480] dark:text-[#98A0BE] font-medium break-all">
                                  {row.rawKey}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                                  {row.type}
                                </span>
                              </div>
                              <div className="text-sm font-semibold text-[#141A33] dark:text-[#ECEEF8] break-words [overflow-wrap:anywhere]">
                                {row.formatted}
                              </div>
                              {row.label && row.label !== row.rawKey && (
                                <div className="text-[11px] text-slate-400">{row.label}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Full Table */}
              <div className="hidden md:block border border-[#E4E7EF] dark:border-[#262B44] rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#1E2338]/60 text-[#5B6480] dark:text-[#98A0BE] font-semibold border-b border-[#E4E7EF] dark:border-[#262B44]">
                    <tr>
                      <th className="px-4 py-2.5">Original Column / Key</th>
                      <th className="px-4 py-2.5">Category Group</th>
                      <th className="px-4 py-2.5">Stored Value</th>
                      <th className="px-4 py-2.5">Value Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E7EF] dark:divide-[#262B44]">
                    {filteredFieldRows.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-[#1E2338]/50">
                        <td className="px-4 py-2.5 font-mono text-[#141A33] dark:text-[#ECEEF8] font-medium">
                          {row.rawKey}
                        </td>
                        <td className="px-4 py-2.5 text-[#5B6480] dark:text-[#98A0BE]">{row.group}</td>
                        <td className="px-4 py-2.5 font-medium text-[#141A33] dark:text-[#ECEEF8] break-all">
                          {row.formatted}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-slate-400">{row.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </div>

        {/* Desktop Sticky Right Rail: Quick Facts & Contact (Section 2 & 3.3) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4 no-print">
          <QuickFactsContact student={student} />
        </div>
      </div>
    </div>
  );
}
