import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  FileQuestion,
  Users,
  Phone,
  Mail,
  Award,
  Layers,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Database,
} from 'lucide-react';
import api from '../api/axios';
import Card from '../components/common/Card';
import Stat from '../components/common/Stat';
import Badge from '../components/common/Badge';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';

export default function DataQuality() {
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dataQualityMetrics'],
    queryFn: async () => {
      const res = await api.get('/analytics/data-quality');
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12">
        <EmptyState
          title="Data Quality Service Error"
          message={error?.response?.data?.error?.message || 'Failed to load data quality metrics.'}
          action={
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  const { summary = {}, qualityMetrics = {} } = data || {};
  const {
    missingCgpa = { count: 0, samples: [] },
    missingPhone = { count: 0, samples: [] },
    missingEmail = { count: 0, samples: [] },
    missingAnySgpa = { count: 0, samples: [] },
    policyNotRecorded = { count: 0, samples: [] },
    marksCheck = { tenthCount: 0, tenthSamples: [], twelfthCount: 0, twelfthSamples: [] },
    backlogConsistency = { evaluated: 0, matching: 0, mismatched: 0, samples: [] },
    unimportedSourceRows = { count: 0, items: [] },
  } = qualityMetrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#141A33] dark:text-[#ECEEF8]">
          Data Quality & Hygiene Audit
        </h1>
        <p className="text-xs text-[#5B6480] dark:text-[#98A0BE] mt-0.5">
          Automated integrity scan across all {summary.totalStudents?.toLocaleString()} normalized documents and {summary.totalRawRows?.toLocaleString()} raw source records.
        </p>
      </div>

      {/* Top Hygiene Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backlog Sum Mismatches */}
        <Stat
          label="Backlog Sum Mismatches"
          value={backlogConsistency.mismatched}
          subtext={`${((backlogConsistency.mismatched / (summary.totalStudents || 1)) * 100).toFixed(1)}% of students`}
          caption="semester sum ≠ live + closed"
          icon={AlertTriangle}
          deltaType={backlogConsistency.mismatched > 0 ? 'warning' : 'good'}
        />

        {/* Missing CGPA */}
        <Stat
          label="Missing CGPA"
          value={missingCgpa.count}
          subtext="documents without CGPA"
          caption="uncomputed academic standing"
          icon={Award}
          deltaType={missingCgpa.count > 0 ? 'warning' : 'good'}
        />

        {/* Policy Not Recorded */}
        <Stat
          label="Policy Not Recorded"
          value={policyNotRecorded.count}
          subtext="null undertaking values"
          caption="unsolicited placement status"
          icon={FileQuestion}
          deltaType="neutral"
          onClick={() => navigate('/students?policySubmitted=null')}
        />

        {/* Missing Semester SGPA */}
        <Stat
          label="Incomplete SGPAs"
          value={missingAnySgpa.count}
          subtext="≥ 1 null semester score"
          caption="lateral or skipped exams"
          icon={Layers}
          deltaType="neutral"
        />
      </div>

      {/* Section 1: Backlog Sum Consistency Audit */}
      <Card
        title="Semester Backlog Sum vs (Live + Closed) Discrepancy Audit"
        subtitle={`${backlogConsistency.matching.toLocaleString()} of ${backlogConsistency.evaluated.toLocaleString()} students (${((backlogConsistency.matching / (backlogConsistency.evaluated || 1)) * 100).toFixed(1)}%) match perfectly. Below are sample discrepancies.`}
        icon={AlertTriangle}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1E2338]/60 text-[#5B6480] dark:text-[#98A0BE] font-semibold border-b border-[#E4E7EF] dark:border-[#262B44]">
              <tr>
                <th className="px-4 py-2.5">Roll No</th>
                <th className="px-4 py-2.5">Student Name</th>
                <th className="px-4 py-2.5">Branch</th>
                <th className="px-4 py-2.5">Semesters Breakdown</th>
                <th className="px-4 py-2.5">Semester Sum</th>
                <th className="px-4 py-2.5">Live + Closed</th>
                <th className="px-4 py-2.5">Discrepancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EF] dark:divide-[#262B44]">
              {backlogConsistency.samples.map((item) => (
                <tr
                  key={item.rollNo}
                  onClick={() => navigate(`/students/${item.rollNo}`)}
                  className="hover:bg-slate-50 dark:hover:bg-[#1E2338]/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                    {item.rollNo}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-[#141A33] dark:text-[#ECEEF8]">
                    {item.fullName}
                  </td>
                  <td className="px-4 py-2.5 text-[#5B6480] dark:text-[#98A0BE]">{item.branch}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-400">
                    [{item.semesterCounts.join(', ')}]
                  </td>
                  <td className="px-4 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {item.semesterBacklogSum}
                  </td>
                  <td className="px-4 py-2.5 font-mono">
                    {item.totalLiveBacklogs} live + {item.totalClosedBacklogs} closed = {item.sumLiveClosed}
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-rose-600 dark:text-rose-400">
                    {item.difference > 0 ? `+${item.difference}` : item.difference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section 2: Audit of the 6 Raw Rows Merged via Roll No Deduplication */}
      <Card
        title="Deduplicated Source Rows (6 Raw CSV Pairs)"
        subtitle="The raw CSV contains 4,595 rows but produces 4,589 students because of exactly 6 duplicate Roll Number enrollments merged during normalization."
        icon={Database}
      >
        <div className="space-y-4">
          {unimportedSourceRows.items.map((dup, idx) => (
            <div
              key={dup.rollNo}
              className="p-4 rounded-xl border border-[#E4E7EF] dark:border-[#262B44] bg-slate-50/60 dark:bg-[#1E2338]/40 space-y-2.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#141A33] dark:text-[#ECEEF8]">
                    #{idx + 1}. Duplicate Roll No:
                  </span>
                  <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {dup.rollNo}
                  </span>
                  <button
                    onClick={() => navigate(`/students/${dup.rollNo}`)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 ml-2"
                  >
                    <span>View Merged Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <Badge variant="warning" size="sm">{dup.occurrences} Raw Rows in CSV</Badge>
              </div>

              <div className="text-xs text-[#5B6480] dark:text-[#98A0BE]">
                <strong>Reason:</strong> {dup.reason}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {dup.rows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-slate-400">
                      <span>Row Occurrence {rIdx + 1}</span>
                      <span>S no: #{row.sNo}</span>
                    </div>
                    <div className="font-semibold text-[#141A33] dark:text-[#ECEEF8]">
                      {row.fullName}
                    </div>
                    <div className="text-[#5B6480] dark:text-[#98A0BE] truncate">
                      {row.branch} · {row.campus} (CGPA: {row.cgpa ?? '—'})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Section 3: Missing Fields & Range Check Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing CGPA Samples */}
        <Card
          title={`Students Missing CGPA (${missingCgpa.count})`}
          subtitle="Records with null or omitted CGPA values."
          icon={Award}
          action={
            <button
              onClick={() => navigate('/students')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Browse in table
            </button>
          }
        >
          {missingCgpa.samples.length === 0 ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">All students have valid CGPA scores!</p>
          ) : (
            <div className="divide-y divide-[#E4E7EF] dark:divide-[#262B44] text-xs">
              {missingCgpa.samples.map((s) => (
                <div
                  key={s.rollNo}
                  onClick={() => navigate(`/students/${s.rollNo}`)}
                  className="py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1E2338] px-2 rounded-lg cursor-pointer"
                >
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">{s.rollNo}</span>
                  <span className="font-medium text-[#141A33] dark:text-[#ECEEF8]">{s.fullName}</span>
                  <span className="text-slate-400">{s.branch}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Policy Not Recorded Samples */}
        <Card
          title={`Policy Status Not Recorded (${policyNotRecorded.count})`}
          subtitle="Students with null or unsubmitted placement policy undertakings."
          icon={FileQuestion}
          action={
            <button
              onClick={() => navigate('/students?policySubmitted=null')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View in table
            </button>
          }
        >
          {policyNotRecorded.samples.length === 0 ? (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">All student policies are recorded!</p>
          ) : (
            <div className="divide-y divide-[#E4E7EF] dark:divide-[#262B44] text-xs">
              {policyNotRecorded.samples.map((s) => (
                <div
                  key={s.rollNo}
                  onClick={() => navigate(`/students/${s.rollNo}`)}
                  className="py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1E2338] px-2 rounded-lg cursor-pointer"
                >
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">{s.rollNo}</span>
                  <span className="font-medium text-[#141A33] dark:text-[#ECEEF8]">{s.fullName}</span>
                  <span className="text-slate-400">{s.division || s.branch}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
