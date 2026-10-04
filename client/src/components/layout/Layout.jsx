import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { formatUtcDate } from '../../lib/fieldMap';
import { Database, Clock } from 'lucide-react';

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Fetch overview stats to get latest recordDate and total records count for footer strip
  const { data: overviewData } = useQuery({
    queryKey: ['analytics-overview-summary'],
    queryFn: async () => {
      const res = await api.get('/analytics/overview');
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const totalStudents = overviewData?.kpis?.totalStudents || 4589;
  const rawDate = overviewData?.dataAsOf || '2026-02-25T00:00:00.000Z';
  const dataAsOfFormatted = formatUtcDate(rawDate);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0E1120] text-[#141A33] dark:text-[#ECEEF8] transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 no-print">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-[#171B2E] shadow-2xl">
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />
        
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-6 max-w-workspace w-full mx-auto">
          <Outlet />
        </main>

        {/* Global Institutional Footer Strip */}
        <footer className="h-10 bg-white/70 dark:bg-[#171B2E]/70 backdrop-blur-md border-t border-[#E4E7EF] dark:border-[#262B44] px-4 sm:px-8 flex items-center justify-between text-xs text-[#5B6480] dark:text-[#98A0BE] no-print shrink-0 mb-[56px] lg:mb-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Data as of {dataAsOfFormatted}</span>
            </span>
            <span className="hidden sm:inline-block text-slate-300 dark:text-slate-700">|</span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-teal-500" />
              <span className="font-mono tabular-nums">{totalStudents.toLocaleString()}</span> students indexed
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] opacity-80">Parul University Institutional Records</span>
          </div>
        </footer>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
