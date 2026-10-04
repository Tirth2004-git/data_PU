import React, { useState } from 'react';
import { Phone, MessageCircle, Mail, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../common/CopyButton';

export default function QuickActionBar({ student, className = '' }) {
  const [copiedRoll, setCopiedRoll] = useState(false);

  if (!student) return null;

  const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
  const officialPhoneDigits = cleanPhone(student.officialPhone);
  const whatsappDigits = cleanPhone(student.whatsappNo || student.officialPhone);
  const officialEmail = student.officialEmail;

  const handleCopyRoll = async () => {
    if (!student.rollNo) return;
    const ok = await copyToClipboard(student.rollNo);
    if (ok) {
      setCopiedRoll(true);
      setTimeout(() => setCopiedRoll(false), 2000);
    }
  };

  return (
    <div className={`grid grid-cols-4 gap-2 sm:gap-3 ${className}`}>
      {/* 1. Call */}
      {officialPhoneDigits ? (
        <a
          href={`tel:${officialPhoneDigits}`}
          className="min-h-[48px] px-2 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors active:scale-95 text-center"
          title={`Call ${student.officialPhone}`}
        >
          <Phone className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <span>Call</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-[48px] px-2 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#1E2338]/50 border border-slate-200 dark:border-[#262B44] opacity-50 cursor-not-allowed flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[#5B6480] dark:text-[#98A0BE] text-xs text-center"
          title="Phone not recorded"
        >
          <Phone className="w-4 h-4 shrink-0" />
          <span>Call</span>
        </button>
      )}

      {/* 2. WhatsApp */}
      {whatsappDigits ? (
        <a
          href={`https://wa.me/91${whatsappDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[48px] px-2 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition-colors active:scale-95 text-center"
          title={`Chat with ${student.whatsappNo || student.officialPhone} on WhatsApp`}
        >
          <MessageCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>WhatsApp</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-[48px] px-2 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#1E2338]/50 border border-slate-200 dark:border-[#262B44] opacity-50 cursor-not-allowed flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[#5B6480] dark:text-[#98A0BE] text-xs text-center"
          title="WhatsApp not recorded"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>WhatsApp</span>
        </button>
      )}

      {/* 3. Email */}
      {officialEmail ? (
        <a
          href={`mailto:${officialEmail}`}
          className="min-h-[48px] px-2 py-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800/60 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-sky-700 dark:text-sky-300 font-semibold text-xs transition-colors active:scale-95 text-center"
          title={`Send email to ${officialEmail}`}
        >
          <Mail className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <span>Email</span>
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="min-h-[48px] px-2 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#1E2338]/50 border border-slate-200 dark:border-[#262B44] opacity-50 cursor-not-allowed flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[#5B6480] dark:text-[#98A0BE] text-xs text-center"
          title="Email not recorded"
        >
          <Mail className="w-4 h-4 shrink-0" />
          <span>Email</span>
        </button>
      )}

      {/* 4. Copy Roll No */}
      <button
        type="button"
        onClick={handleCopyRoll}
        className="min-h-[48px] px-2 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#1E2338] hover:bg-slate-200 dark:hover:bg-slate-700/60 border border-[#E4E7EF] dark:border-[#262B44] flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-[#141A33] dark:text-[#ECEEF8] font-semibold text-xs transition-colors active:scale-95 text-center"
        title="Copy student roll number"
      >
        {copiedRoll ? (
          <>
            <Check className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={2} />
            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.8} />
            <span>Copy Roll</span>
          </>
        )}
      </button>
    </div>
  );
}
