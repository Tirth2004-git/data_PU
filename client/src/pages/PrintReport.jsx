import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import ScoreBadge from '../components/common/ScoreBadge';
import { formatUtcDate, formatPhone } from '../lib/fieldMap';
import { generateStudentInsights } from '../lib/insights';

export default function PrintReport() {
  const { rollNo } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student', rollNo],
    queryFn: async () => {
      const res = await api.get(`/students/${rollNo}`);
      return res.data;
    },
  });

  const student = data?.student;
  const insights = student ? generateStudentInsights(student) : null;

  useEffect(() => {
    if (student) {
      document.title = `Campus_Compass_${student.rollNo}_${student.fullName.replace(/\s+/g, '_')}`;
    }
  }, [student]);

  if (isLoading) {
    return <div className="p-8 text-center text-sm">Preparing student institutional dossier...</div>;
  }

  if (isError || !student) {
    return <div className="p-8 text-center text-rose-600">Failed to load student record for print.</div>;
  }

  return (
    <div className="bg-white text-slate-900 p-8 max-w-4xl mx-auto space-y-6 print:p-0">
      {/* Non-print action header */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate(`/students/${student.rollNo}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Profile</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Institutional Letterhead Header */}
      <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
            Parul University
          </h1>
          <p className="text-xs text-indigo-700 font-semibold tracking-wider uppercase">
            Official Academic Record & Performance Dossier
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Generated from Campus Compass Enterprise Ledger · Confidential
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-slate-900">
            ROLL: {student.rollNo}
          </div>
          <div className="text-[11px] text-slate-500">
            Snapshot: {formatUtcDate(student.recordDate)}
          </div>
          <div className="text-[10px] text-slate-400">
            Print Date: {new Date().toLocaleDateString('en-GB')}
          </div>
        </div>
      </div>

      {/* Identity Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Student Name</span>
          <span className="font-bold text-slate-900 text-sm">{student.fullName}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Branch & Division</span>
          <span className="font-semibold text-slate-800">{student.branch} (Div {student.division})</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Graduation Batch</span>
          <span className="font-semibold text-slate-800">Batch {student.batch} · {student.campus}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Date of Birth & Age</span>
          <span className="font-semibold text-slate-800">{formatUtcDate(student.dob)} ({student.age} yrs)</span>
        </div>
      </div>

      {/* Academic KPIs Grid */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="p-3 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Cumulative CGPA</span>
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {student.academics?.cgpa ? student.academics.cgpa.toFixed(2) : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">{insights?.scoreBand?.label}</span>
        </div>

        <div className="p-3 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Average SGPA</span>
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {student.academics?.avgSgpa ? student.academics.avgSgpa.toFixed(2) : '—'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Semesters 1–5</span>
        </div>

        <div className="p-3 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Live Backlogs</span>
          <span className={`text-2xl font-bold font-mono ${student.academics?.totalLiveBacklogs > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {student.academics?.totalLiveBacklogs ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Active Exams</span>
        </div>

        <div className="p-3 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Closed Backlogs</span>
          <span className="text-2xl font-bold text-slate-900 font-mono">
            {student.academics?.totalClosedBacklogs ?? 0}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Cleared Exams</span>
        </div>
      </div>

      {/* Semester Marks Table */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Semester Progression Transcript
        </h3>
        <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-100 font-semibold text-slate-700 border-b border-slate-200">
            <tr>
              <th className="p-2.5">Semester</th>
              <th className="p-2.5">SGPA</th>
              <th className="p-2.5">Backlogs Incurred</th>
              <th className="p-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {(student.academics?.semesters || []).map((sem) => (
              <tr key={sem.sem}>
                <td className="p-2.5 font-semibold">Semester {sem.sem}</td>
                <td className="p-2.5 font-mono font-bold">
                  {sem.sgpa !== null ? sem.sgpa.toFixed(2) : '—'}
                </td>
                <td className="p-2.5 font-mono">{sem.backlogCount ?? 0}</td>
                <td className="p-2.5">
                  {sem.backlogCount > 0 ? (
                    <span className="text-rose-600 font-semibold">Backlog Recorded</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Clean</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Prior Academics & Placement */}
      <div className="grid grid-cols-2 gap-4">
        {/* Prior Education */}
        <div className="p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Secondary & Higher Secondary
          </h4>
          <div className="flex justify-between">
            <span className="text-slate-500">10th Marks & Board:</span>
            <span className="font-bold">{student.tenth?.marks}% ({student.tenth?.board || '—'}) · {student.tenth?.passingYear}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">12th Marks & Board:</span>
            <span className="font-bold">{student.twelfth?.marks}% ({student.twelfth?.board || '—'}) · {student.twelfth?.passingYear}</span>
          </div>
          {student.diploma && (
            <div className="flex justify-between">
              <span className="text-slate-500">Diploma:</span>
              <span className="font-bold">{student.diploma.marks}% ({student.diploma.degreeName})</span>
            </div>
          )}
        </div>

        {/* Placement Status */}
        <div className="p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
          <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            Placement Eligibility & Undertaking
          </h4>
          <div className="flex justify-between">
            <span className="text-slate-500">Placement Policy Undertaking:</span>
            <span className="font-bold">
              {student.placementPolicySubmitted ? 'Submitted (YES)' : 'Pending'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Corporate Drive Status:</span>
            <span className="font-bold">
              {insights?.eligibility?.isEligible ? 'Eligible' : 'Not Eligible (Remedial Required)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Official Contact:</span>
            <span className="font-mono">{formatPhone(student.officialPhone)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
        Parul University Academic Administration · Campus Compass Verified Record · Data as of {formatUtcDate(student.recordDate)}
      </div>
    </div>
  );
}
