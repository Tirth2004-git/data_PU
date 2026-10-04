import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export async function copyToClipboard(text) {
  if (!text) return false;
  const str = String(text);
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(str);
      if (typeof navigator?.vibrate === 'function') navigator.vibrate(10);
      return true;
    } catch {
      // Fallback
    }
  }

  // Fallback for non-HTTPS / older mobile webviews
  try {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.contain = 'strict';
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    el.style.fontSize = '12pt'; // Prevent iOS zoom
    document.body.appendChild(el);
    el.select();
    el.setSelectionRange(0, 99999);
    const success = document.execCommand('copy');
    document.body.removeChild(el);
    if (success && typeof navigator?.vibrate === 'function') navigator.vibrate(10);
    return success;
  } catch (err) {
    console.error('Copy fallback failed:', err);
    return false;
  }
}

export default function CopyButton({
  text,
  label,
  className = '',
  size = 'sm',
  title = 'Copy to clipboard',
  touchTarget = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] dark:hover:text-[#ECEEF8] hover:bg-slate-100 dark:hover:bg-[#1E2338] transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 active:scale-95 ${
        touchTarget ? 'min-w-[44px] min-h-[44px] p-2.5' : 'px-2 py-1'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className={`${iconSizes[size]} text-emerald-500`} strokeWidth={2} />
          {label && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{label === 'Copy' ? 'Copied' : label}</span>}
        </>
      ) : (
        <>
          <Copy className={iconSizes[size]} strokeWidth={1.5} />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
