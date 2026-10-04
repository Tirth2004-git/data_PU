import React from 'react';
import { Sun, Moon, LogOut, Menu, Shield } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import GlobalSearch from '../search/GlobalSearch';

export const Header = ({ onToggleSidebar }) => {
  const { isDark, toggleTheme } = useTheme();
  const { admin, logout } = useAuth();

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('campus-compass:open-search'));
  };

  return (
    <header className="h-14 lg:h-16 bg-white dark:bg-[#171B2E] border-b border-[#E4E7EF] dark:border-[#262B44] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 transition-colors no-print">
      {/* Mobile Brand / Page Title */}
      <div className="flex items-center gap-2.5 lg:hidden min-w-0">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
          CC
        </div>
        <span className="font-bold text-sm text-[#141A33] dark:text-[#ECEEF8] truncate">
          Campus Compass
        </span>
      </div>

      {/* Global Search Component (desktop search box, mobile full-screen modal) */}
      <div className="flex-1 flex justify-center max-w-2xl mx-auto">
        <GlobalSearch />
      </div>

      {/* Right Controls: Theme Toggle & Admin Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Admin Profile Pill */}
        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {admin?.name ? admin.name[0].toUpperCase() : 'A'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <span>{admin?.name || 'Administrator'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                Admin
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
              {admin?.email || 'admin@campuscompass.edu'}
            </div>
          </div>
        </div>

        {/* Quick Sign Out (Mobile / Small desktop) */}
        <button
          onClick={logout}
          className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
