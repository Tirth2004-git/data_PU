import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Search,
  ShieldCheck,
  MoreHorizontal,
  Sun,
  Moon,
  LogOut,
  Download,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { admin, logout } = useAuth();
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('campus-compass:open-search'));
  };

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: '/students',
      label: 'Students',
      icon: Users,
      exact: false,
    },
    // Center Search is handled specially
    {
      to: '/analytics/data-quality',
      label: 'Quality',
      icon: ShieldCheck,
      exact: true,
    },
  ];

  const isMoreActive = showMoreDrawer;

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Hidden on lg: screens) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#171B2E]/95 backdrop-blur-md border-t border-[#E4E7EF] dark:border-[#262B44] px-2 flex items-center justify-around no-print"
        style={{
          height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* 1. Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] h-[52px] px-1 rounded-xl transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <LayoutDashboard className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">Dashboard</span>
            </>
          )}
        </NavLink>

        {/* 2. Students */}
        <NavLink
          to="/students"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] h-[52px] px-1 rounded-xl transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <Users className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">Students</span>
            </>
          )}
        </NavLink>

        {/* 3. Center Search (Prominent) */}
        <button
          type="button"
          onClick={handleOpenSearch}
          aria-label="Open global search sheet"
          className="flex flex-col items-center justify-center -mt-3.5 group min-w-[56px] min-h-[44px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 border-2 border-white dark:border-[#171B2E] active:scale-95 transition-transform">
            <Search className="w-5 h-5" strokeWidth={2.3} />
          </div>
          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-tight mt-0.5 leading-none">
            Search
          </span>
        </button>

        {/* 4. Data Quality */}
        <NavLink
          to="/analytics/data-quality"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] h-[52px] px-1 rounded-xl transition-colors ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`p-1 rounded-lg ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <ShieldCheck className="w-5 h-5" strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">Quality</span>
            </>
          )}
        </NavLink>

        {/* 5. More (Theme toggle, PWA install, Admin, Logout) */}
        <button
          type="button"
          onClick={() => setShowMoreDrawer(true)}
          aria-label="Open More options menu"
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] h-[52px] px-1 rounded-xl transition-colors ${
            isMoreActive
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg ${isMoreActive ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
            <MoreHorizontal className="w-5 h-5" strokeWidth={isMoreActive ? 2.3 : 1.8} />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5 leading-none">More</span>
        </button>
      </nav>

      {/* "More" Bottom Sheet Drawer */}
      {showMoreDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMoreDrawer(false)}
          />

          <div
            className="relative w-full bg-white dark:bg-[#171B2E] border-t border-[#E4E7EF] dark:border-[#262B44] rounded-t-3xl shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200 z-10"
            style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Grab handle */}
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-[#E4E7EF] dark:border-[#262B44]">
              <div>
                <h3 className="text-base font-bold text-[#141A33] dark:text-[#ECEEF8]">Campus Compass</h3>
                <p className="text-xs text-[#5B6480] dark:text-[#98A0BE]">Institutional Admin Portal</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreDrawer(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admin identity block */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#1E2338]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                {admin?.name ? admin.name[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#141A33] dark:text-[#ECEEF8] flex items-center gap-1.5">
                  <span className="truncate">{admin?.name || 'Administrator'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                    Admin
                  </span>
                </div>
                <div className="text-[11px] text-[#5B6480] dark:text-[#98A0BE] truncate">
                  {admin?.email || 'admin@campuscompass.edu'}
                </div>
              </div>
            </div>

            {/* Menu Options List */}
            <div className="space-y-2">
              {/* Theme toggle row */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2338] text-xs font-medium text-[#141A33] dark:text-[#ECEEF8] min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  {isDark ? (
                    <Sun className="w-5 h-5 text-amber-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-600" />
                  )}
                  <span>Appearance: {isDark ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">Switch</span>
              </button>

              {/* Add to Home Screen Hint */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs">
                <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200">
                  <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Add to Home Screen (PWA)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  On Safari/Chrome on your phone, tap <strong>Share</strong> or <strong>⋮ Menu</strong> and choose <strong>&ldquo;Add to Home Screen&rdquo;</strong> for full-screen mobile app experience.
                </p>
              </div>

              {/* Logout button */}
              <button
                type="button"
                onClick={() => {
                  setShowMoreDrawer(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors min-h-[48px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Admin Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
