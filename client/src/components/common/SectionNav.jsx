import React from 'react';

export default function SectionNav({
  sections = [],
  activeSection,
  onSelect,
  className = '',
}) {
  return (
    <nav
      className={`sticky top-16 z-20 flex items-center gap-1 p-1.5 bg-white/90 dark:bg-[#171B2E]/90 backdrop-blur-md border border-[#E4E7EF] dark:border-[#262B44] rounded-[16px] shadow-sm overflow-x-auto no-scrollbar ${className}`}
    >
      {sections.map((sec) => {
        const isActive = activeSection === sec.id;
        const Icon = sec.icon;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => onSelect(sec.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
              isActive
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#5B6480] dark:text-[#98A0BE] hover:text-[#141A33] dark:hover:text-[#ECEEF8] hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" strokeWidth={1.8} />}
            <span>{sec.label}</span>
            {sec.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-[#5B6480] dark:text-[#98A0BE]'
                }`}
              >
                {sec.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
