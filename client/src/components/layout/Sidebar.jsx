import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckCheck,
  LogOut,
  Compass,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ onNavigate }) {
  const { logout, admin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/students',
      label: 'Students',
      icon: Users,
    },
    {
      to: '/data-quality',
      label: 'Data Quality',
      icon: CheckCheck,
    },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-white dark:bg-[#171B2E] border-r border-[#E4E7EF] dark:border-[#262B44] flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-200`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#E4E7EF] dark:border-[#262B44]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
              <Compass className="w-5 h-5" strokeWidth={1.8} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-sm tracking-tight text-[#141A33] dark:text-[#ECEEF8] leading-tight truncate">
                  Campus Compass
                </h1>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                  Admin Workspace
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[#5B6480] dark:text-[#98A0BE] hover:bg-slate-100 dark:hover:bg-[#1E2338]"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {!collapsed && (
            <div className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-wider text-[#5B6480] dark:text-[#98A0BE]">
              Navigation
            </div>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center ${
                  collapsed ? 'justify-center px-2' : 'px-3.5'
                } py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-[#5B6480] dark:text-[#98A0BE] hover:bg-slate-100 dark:hover:bg-[#1E2338] hover:text-[#141A33] dark:hover:text-[#ECEEF8]'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Admin User Info & Logout */}
      <div className="p-3 border-t border-[#E4E7EF] dark:border-[#262B44] space-y-2">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-[#1E2338] rounded-xl border border-[#E4E7EF] dark:border-[#262B44]">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
              <ShieldCheck className="w-4 h-4" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#141A33] dark:text-[#ECEEF8] truncate">
                {admin?.name || 'Administrator'}
              </p>
              <p className="text-[11px] text-[#5B6480] dark:text-[#98A0BE] truncate">
                {admin?.email || 'admin@campuscompass.edu'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center px-2' : 'justify-center gap-2 px-3.5'
          } py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
