import React from 'react';
import {
  Mail,
  Phone,
  MessageCircle,
  PhoneCall,
  Calendar,
  Clock,
  Flag,
  UserCheck,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { formatUtcDate, formatPhone } from '../../lib/fieldMap';
import CopyButton from '../common/CopyButton';

export default function QuickFactsContact({ student, className = '' }) {
  if (!student) return null;

  const isWhatsappSame =
    student.whatsappNo &&
    student.officialPhone &&
    String(student.whatsappNo).replace(/\D/g, '') === String(student.officialPhone).replace(/\D/g, '');

  const cleanDigits = (phone) => String(phone || '').replace(/\D/g, '');

  return (
    <div
      id="quick-facts-card"
      className={`bg-white dark:bg-[#171B2E] border border-[#E4E7EF] dark:border-[#262B44] rounded-2xl shadow-sm overflow-hidden ${className}`}
    >
      {/* Card Header */}
      <div className="px-4 py-3.5 border-b border-[#E4E7EF] dark:border-[#262B44] flex items-center justify-between bg-slate-50/60 dark:bg-[#1E2338]/40">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-[#141A33] dark:text-[#ECEEF8]">
            Quick Facts & Contact
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[#5B6480] dark:text-[#98A0BE]">
          ID #{student.rollNo?.slice(-4) || '—'}
        </span>
      </div>

      {/* Mini Facts Top Row: DOB, Age, Nationality */}
      <div className="grid grid-cols-3 divide-x divide-[#E4E7EF] dark:divide-[#262B44] border-b border-[#E4E7EF] dark:border-[#262B44] bg-slate-50/30 dark:bg-[#1E2338]/20">
        {/* DOB */}
        <div className="p-3 text-center">
          <div className="text-[11px] font-medium text-[#5B6480] dark:text-[#98A0BE] flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3 opacity-70" />
            <span>Born</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-[#141A33] dark:text-[#ECEEF8] mt-0.5">
            {formatUtcDate(student.dob)}
          </div>
        </div>

        {/* Age */}
        <div className="p-3 text-center">
          <div className="text-[11px] font-medium text-[#5B6480] dark:text-[#98A0BE] flex items-center justify-center gap-1">
            <Clock className="w-3 h-3 opacity-70" />
            <span>Age</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-[#141A33] dark:text-[#ECEEF8] mt-0.5">
            {student.age !== null && student.age !== undefined ? `${student.age} yrs` : '—'}
          </div>
        </div>

        {/* Nationality */}
        <div className="p-3 text-center">
          <div className="text-[11px] font-medium text-[#5B6480] dark:text-[#98A0BE] flex items-center justify-center gap-1">
            <Flag className="w-3 h-3 opacity-70" />
            <span>Country</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-[#141A33] dark:text-[#ECEEF8] mt-0.5 truncate px-1">
            {student.nationality || 'Indian'}
          </div>
        </div>
      </div>

      {/* Labelled Contact Rows (Min height 52px each) */}
      <div className="divide-y divide-[#E4E7EF] dark:divide-[#262B44]">
        {/* Official Email */}
        <div className="min-h-[52px] p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-[#1E2338]/40 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5B6480] dark:text-[#98A0BE] flex items-center gap-1.5 mb-0.5">
              <Mail className="w-3 h-3 text-indigo-500" />
              <span>Official Email</span>
            </div>
            {student.officialEmail ? (
              <a
                href={`mailto:${student.officialEmail}`}
                className="text-xs sm:text-sm font-medium text-[#141A33] dark:text-[#ECEEF8] hover:text-indigo-600 dark:hover:text-indigo-400 break-all select-all block transition-colors"
                title={`Send email to ${student.officialEmail}`}
              >
                {student.officialEmail}
              </a>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Not recorded</span>
            )}
          </div>
          {student.officialEmail && (
            <CopyButton
              text={student.officialEmail}
              title="Copy official email"
              touchTarget
              size="sm"
            />
          )}
        </div>

        {/* Personal Email */}
        <div className="min-h-[52px] p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-[#1E2338]/40 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5B6480] dark:text-[#98A0BE] flex items-center gap-1.5 mb-0.5">
              <Mail className="w-3 h-3 text-sky-500" />
              <span>Personal Email</span>
            </div>
            {student.personalEmail ? (
              <a
                href={`mailto:${student.personalEmail}`}
                className="text-xs sm:text-sm font-medium text-[#141A33] dark:text-[#ECEEF8] hover:text-indigo-600 dark:hover:text-indigo-400 break-all select-all block transition-colors"
                title={`Send email to ${student.personalEmail}`}
              >
                {student.personalEmail}
              </a>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Not recorded</span>
            )}
          </div>
          {student.personalEmail && (
            <CopyButton
              text={student.personalEmail}
              title="Copy personal email"
              touchTarget
              size="sm"
            />
          )}
        </div>

        {/* Official Phone */}
        <div className="min-h-[52px] p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-[#1E2338]/40 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5B6480] dark:text-[#98A0BE] flex items-center gap-1.5 mb-0.5">
              <Phone className="w-3 h-3 text-emerald-500" />
              <span>Official Phone</span>
            </div>
            {student.officialPhone ? (
              <a
                href={`tel:${cleanDigits(student.officialPhone)}`}
                className="text-sm font-mono font-medium text-[#141A33] dark:text-[#ECEEF8] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title={`Call ${student.officialPhone}`}
              >
                {formatPhone(student.officialPhone)}
              </a>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Not recorded</span>
            )}
          </div>
          {student.officialPhone && (
            <CopyButton
              text={student.officialPhone}
              title="Copy official phone"
              touchTarget
              size="sm"
            />
          )}
        </div>

        {/* WhatsApp Phone */}
        <div className="min-h-[52px] p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-[#1E2338]/40 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5B6480] dark:text-[#98A0BE] flex items-center gap-1.5">
                <MessageCircle className="w-3 h-3 text-teal-500" />
                <span>WhatsApp</span>
              </div>
              {isWhatsappSame && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40">
                  Same as official
                </span>
              )}
            </div>
            {student.whatsappNo ? (
              <a
                href={`https://wa.me/91${cleanDigits(student.whatsappNo)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono font-medium text-[#141A33] dark:text-[#ECEEF8] hover:text-teal-600 dark:hover:text-teal-400 inline-flex items-center gap-1 transition-colors"
                title={`Open WhatsApp chat with ${student.whatsappNo}`}
              >
                <span>{formatPhone(student.whatsappNo)}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Not recorded</span>
            )}
          </div>
          {student.whatsappNo && (
            <CopyButton
              text={student.whatsappNo}
              title="Copy WhatsApp number"
              touchTarget
              size="sm"
            />
          )}
        </div>

        {/* Alternate Phone */}
        <div className="min-h-[52px] p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-[#1E2338]/40 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5B6480] dark:text-[#98A0BE] flex items-center gap-1.5 mb-0.5">
              <PhoneCall className="w-3 h-3 text-amber-500" />
              <span>Alternate Phone</span>
            </div>
            {student.alternatePhone ? (
              <a
                href={`tel:${cleanDigits(student.alternatePhone)}`}
                className="text-sm font-mono font-medium text-[#141A33] dark:text-[#ECEEF8] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                title={`Call alternate phone ${student.alternatePhone}`}
              >
                {formatPhone(student.alternatePhone)}
              </a>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">Not recorded</span>
            )}
          </div>
          {student.alternatePhone && (
            <CopyButton
              text={student.alternatePhone}
              title="Copy alternate phone"
              touchTarget
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Card Footer: Snapshot Date */}
      <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-[#1E2338]/50 border-t border-[#E4E7EF] dark:border-[#262B44] flex items-center justify-between text-xs text-[#5B6480] dark:text-[#98A0BE]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-500 opacity-80" />
          <span>Snapshot as of {formatUtcDate(student.recordDate)}</span>
        </div>
        <span className="text-[11px] font-mono opacity-80">Verified</span>
      </div>
    </div>
  );
}
