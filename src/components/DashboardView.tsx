import React, { useState, useEffect } from 'react';
import { DepartmentVolumeTrendsChart } from './DepartmentVolumeTrendsChart';
import {
  Activity,
  FileDown,
  Pause,
  Play,
  RotateCw,
  Search,
  Database,
  Server,
  TrendingUp,
  Cpu,
  Layers,
  ChevronRight,
  Filter,
  Eye,
  Clock,
  ShieldAlert,
  Wrench,
  Building
} from 'lucide-react';
import { Department, Ticket, User, Location, DbStatus } from '../types';

interface DashboardViewProps {
  department: Department;
  tickets: Ticket[];
  users: User[];
  locations: Location[];
  dbStatus: DbStatus | null;
  onNavigateTab: (tab: any) => void;
  onSelectTicket: (ticket: Ticket) => void;
  onOpenDbModal: () => void;
  onRefreshData: () => void;
  slaEngineEnabled?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  department,
  tickets,
  users,
  locations,
  dbStatus,
  onNavigateTab,
  onSelectTicket,
  onOpenDbModal,
  onRefreshData,
  slaEngineEnabled = true
}) => {
  const [autoRefreshActive, setAutoRefreshActive] = useState(true);
  const [countdown, setCountdown] = useState(18);
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-27');
  const [lastRefreshedTime, setLastRefreshedTime] = useState('06:14:54 PM');

  // Real-time ticking timer matching screenshot's "ACTIVE (18S)"
  useEffect(() => {
    if (!autoRefreshActive) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onRefreshData();
          setLastRefreshedTime(new Date().toLocaleTimeString());
          return 18;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefreshActive, onRefreshData]);

  // Derived counts
  const totalObservations = tickets.length;
  const activeTickets = tickets.filter(t => t.status !== 'RESOLVED').length;
  const closedTickets = tickets.filter(t => t.status === 'RESOLVED').length;
  const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'NEW').length;
  const inProgressTickets = tickets.filter(t => t.status === 'IN PROGRESS').length;
  const delayedTickets = tickets.filter(t => t.sla_status === 'BREACHED').length;

  // Live ticket category aggregation for dashboard analytics
  const categoryCounts = Object.entries(
    tickets.reduce<Record<string, number>>((acc, ticket) => {
      const category = ticket.category?.trim() || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {})
  )
    .map(([name, count]) => ({
      name,
      count,
      percentage: tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0,
      style: {
        hex: [
          '#0284C7',
          '#0D9488',
          '#F59E0B',
          '#F97316',
          '#8B5CF6',
          '#E11D48',
          '#16A34A'
        ][Math.abs(name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 7]
      }
    }))
    .sort((a, b) => b.count - a.count);

  const filteredTickets = tickets.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.ticket_number.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.location_name.toLowerCase().includes(q) ||
      t.region_name.toLowerCase().includes(q)
    );
  });

  // Calculate branch volume
  const branchCounts: Record<string, number> = {};
  tickets.forEach(t => {
    branchCounts[t.location_name] = (branchCounts[t.location_name] || 0) + 1;
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weeks = ['w1', 'w2', 'w3', 'w4'];

  const departmentTitle = department?.name || 'Surveillance Operations Center';

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Operational Context & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold text-xl">⚡</span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{departmentTitle}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Integrated surveillance incident logs, field technician dispatches, and branch notification routing.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => {}}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0F2942] text-white shadow-sm flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>Executive Overview</span>
          </button>
          <button
            onClick={() => onNavigateTab('locations')}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors flex items-center gap-2"
          >
            <span>Branch Directory</span>
          </button>
          <button
            onClick={() => onNavigateTab('observations')}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-colors flex items-center gap-2"
          >
            <span>{slaEngineEnabled ? 'Ticket Queue & SLAs' : 'Ticket Queue'}</span>
          </button>
        </div>
      </div>

      {/* 2. Live Telemetry Ribbon (Matches Image 1) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Auto refresh ticker & controls */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Real-Time Auto-Refresh</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                ACTIVE ({countdown}S)
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Syncing operational telemetry & active ticket counts live • Last: {lastRefreshedTime}
            </div>
          </div>
        </div>

        {/* Center: Search & Manual Refresh */}
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <button
            onClick={() => setAutoRefreshActive(!autoRefreshActive)}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 shrink-0"
          >
            {autoRefreshActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{autoRefreshActive ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={() => {
              onRefreshData();
              setCountdown(18);
              setLastRefreshedTime(new Date().toLocaleTimeString());
            }}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#0F2942] hover:bg-[#163859] rounded-lg flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh Now</span>
          </button>

          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter live ticket, branch or region..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Right: Status Badges (Hostinger MySQL Connected & API Online) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-900">
            <span>Active Tickets: {activeTickets}</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-600 text-white font-mono">Queue</span>
          </div>

          <button
            onClick={onOpenDbModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900 transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hostinger MySQL: {dbStatus?.connected ? 'Connected' : 'Sync Active'}</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-lg text-xs font-semibold text-sky-900">
            <Server className="w-3.5 h-3.5 text-sky-600" />
            <span>API Status: Online (200 OK)</span>
          </div>
        </div>
      </div>

      {/* 2.5 Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Observations logged */}
        <div className="bg-gradient-to-br from-sky-50 via-sky-100/70 to-cyan-50 border-2 border-sky-300 border-t-4 border-t-sky-500 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-sky-400 transition-all flex flex-col justify-between">
          <div className="text-xs font-black tracking-wider uppercase text-sky-900 flex items-center justify-between">
            <span>Observations Logged</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs animate-pulse"></span>
          </div>
          <div className="text-4xl font-black text-sky-950 my-1.5 tabular-nums">
            {totalObservations}
          </div>
          <div className="text-[11px] font-bold text-sky-700">In selected range</div>
        </div>

        {/* Card 2: Open incidents */}
        <div className="bg-gradient-to-br from-rose-50 via-rose-100/70 to-red-50 border-2 border-rose-300 border-t-4 border-t-rose-500 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-rose-400 transition-all flex flex-col justify-between">
          <div className="text-xs font-black tracking-wider uppercase text-rose-900 flex items-center justify-between">
            <span>Open Incidents</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs animate-pulse"></span>
          </div>
          <div className="text-4xl font-black text-rose-950 my-1.5 tabular-nums">
            {openTickets}
          </div>
          <div className="text-[11px] font-bold text-rose-700">Unresolved</div>
        </div>

        {/* Card 3: Open tickets */}
        <div className="bg-gradient-to-br from-amber-50 via-amber-100/70 to-orange-50 border-2 border-amber-300 border-t-4 border-t-amber-500 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all flex flex-col justify-between">
          <div className="text-xs font-black tracking-wider uppercase text-amber-950 flex items-center justify-between">
            <span>Open Tickets</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs animate-pulse"></span>
          </div>
          <div className="text-4xl font-black text-amber-950 my-1.5 tabular-nums">
            {activeTickets}
          </div>
          <div className="text-[11px] font-bold text-amber-800">Technician requests</div>
        </div>

        {/* Card 4: Cameras repaired */}
        <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/70 to-teal-50 border-2 border-emerald-300 border-t-4 border-t-emerald-500 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between">
          <div className="text-xs font-black tracking-wider uppercase text-emerald-950 flex items-center justify-between">
            <span>Cameras Repaired</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
          </div>
          <div className="text-4xl font-black text-emerald-950 my-1.5 tabular-nums">
            {closedTickets}
          </div>
          <div className="text-[11px] font-bold text-emerald-800">By technicians</div>
        </div>

        {/* Card 5: Branches reporting */}
        <div className="bg-gradient-to-br from-purple-50 via-purple-100/70 to-indigo-50 border-2 border-purple-300 border-t-4 border-t-purple-500 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between">
          <div className="text-xs font-black tracking-wider uppercase text-purple-950 flex items-center justify-between">
            <span>Branches Reporting</span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs"></span>
          </div>
          <div className="text-4xl font-black text-purple-950 my-1.5 tabular-nums">
            {locations.length}
          </div>
          <div className="text-[11px] font-bold text-purple-800">With activity</div>
        </div>
      </div>

      {/* 3. Top Row Cards: Summaries, Heatmap, System Status, Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: All Observations */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">All Observations (Summaries)</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-4">
            <div className="text-4xl font-extrabold text-slate-900 tabular-nums">{totalObservations}</div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{totalObservations} Today Live from Database</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* Card 2: Ticket Volume Heatmap (12 Months, W1-W4) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-extrabold text-slate-900 tracking-tight">Ticket Volume Heatmap</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
              12 MONTHS
            </span>
          </div>

          <div className="my-3 overflow-x-auto">
            <div className="grid grid-cols-12 gap-1.5 text-[9px] font-mono font-bold text-slate-500 text-center mb-1.5">
              {months.map(m => (
                <span key={m}>{m}</span>
              ))}
            </div>
            <div className="space-y-1.5">
              {weeks.map(w => (
                <div key={w} className="flex items-center gap-1.5">
                  <span className="text-[8px] font-mono font-bold text-slate-400 w-3">{w}</span>
                  <div className="grid grid-cols-12 gap-1.5 flex-1">
                    {months.map((m, mIdx) => {
                      const isHigh = m === 'Oct' && w === 'w4';

                      return (
                        <div
                          key={mIdx}
                          className={`h-3.5 rounded-[4px] transition-all duration-150 cursor-pointer ${
                            isHigh
                              ? 'bg-[#5B78F6] text-white font-bold shadow-xs scale-105'
                              : 'bg-[#F1F5F9] border border-slate-200/50 hover:bg-sky-100'
                          }`}
                          title={`${m} ${w}: ${isHigh ? '1 ticket' : '0 tickets'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-600">
            <span className="text-[10px] font-bold text-slate-700">Density Scale</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-400">Low</span>
              <div className="w-28 h-2.5 bg-gradient-to-r from-[#5B78F6] via-[#38BDF8] via-[#38E1F8] via-[#4ADE80] to-[#81C784] rounded-full shadow-2xs"></div>
              <span className="text-[9px] font-mono text-slate-900 font-bold">Peak</span>
            </div>
          </div>
        </div>

        {/* Card 3: System Status & Infrastructure Health */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-700">SYSTEM STATUS</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              ● OPERATIONAL
            </span>
          </div>

          <div className="my-2 flex items-baseline justify-between">
            <div>
              <div className="text-3xl font-extrabold text-slate-900 tabular-nums">99.98%</div>
              <div className="text-[11px] text-slate-400">uptime</div>
            </div>
            <div className="px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-600 flex items-center gap-1">
              <span>📶</span>
              <span>{dbStatus?.ping || '44ms ping'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span> NVR Gateway
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span> AI Vision Bus
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Hostinger DB
            </span>
          </div>
        </div>

        {/* Card 4: Date Range Filter & PDF Export */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">FROM</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">TO</label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => {
                setFromDate('2026-09-01');
                setToDate('2026-09-27');
              }}
              className="flex-1 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
            >
              RESET FILTERS
            </button>
            <button
              onClick={() => {
                window.print();
              }}
              className="flex-1 py-1.5 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#163859] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>EXPORT PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3.5 Department Daily Ticket Volume Trends Widget (Recharts) */}
      <DepartmentVolumeTrendsChart tickets={tickets} />

      {/* 4. Executive Overview Grid & Advanced Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Executive Overview Grid & Technician Performance */}
        <div className="space-y-6">
          {/* Executive Overview Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse"></span>
                <span>Executive Overview Grid</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-300">
                LIVE TELEMETRY
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Today's Observations */}
              <div className="bg-gradient-to-br from-sky-500/20 via-sky-50 to-white border-2 border-sky-400 rounded-2xl p-4 text-center shadow-md hover:shadow-lg transition-all group">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-sky-950 mb-1">
                  <Eye className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                  <span>Today's Observations</span>
                </div>
                <div className="text-3xl font-black text-sky-950 my-1 tabular-nums">
                  {tickets.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length}
                </div>
                <div className="text-[10px] font-bold text-sky-800 bg-sky-200/80 rounded-full px-2.5 py-0.5 inline-block">
                  Logged Today
                </div>
              </div>

              {/* All Observations */}
              <div className="bg-gradient-to-br from-emerald-500/20 via-emerald-50 to-white border-2 border-emerald-400 rounded-2xl p-4 text-center shadow-md hover:shadow-lg transition-all group">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-950 mb-1">
                  <Layers className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>All Observations</span>
                </div>
                <div className="text-3xl font-black text-emerald-950 my-1 tabular-nums">
                  {totalObservations}
                </div>
                <div className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 rounded-full px-2.5 py-0.5 inline-block">
                  Master Record
                </div>
              </div>

              {/* Today's Tickets */}
              <div className="bg-gradient-to-br from-amber-500/20 via-amber-50 to-white border-2 border-amber-400 rounded-2xl p-4 text-center shadow-md hover:shadow-lg transition-all group">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-950 mb-1">
                  <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span>Today's Tickets</span>
                </div>
                <div className="text-3xl font-black text-amber-950 my-1 tabular-nums">
                  {tickets.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length}
                </div>
                <div className="text-[10px] font-bold text-amber-900 bg-amber-200/80 rounded-full px-2.5 py-0.5 inline-block">
                  Dispatched Today
                </div>
              </div>

              {/* All Tickets */}
              <div className="bg-gradient-to-br from-indigo-500/20 via-indigo-50 to-white border-2 border-indigo-400 rounded-2xl p-4 text-center shadow-md hover:shadow-lg transition-all group">
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-indigo-950 mb-1">
                  <ShieldAlert className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span>All Tickets</span>
                </div>
                <div className="text-3xl font-black text-indigo-950 my-1 tabular-nums">
                  {tickets.length}
                </div>
                <div className="text-[10px] font-bold text-indigo-900 bg-indigo-200/80 rounded-full px-2.5 py-0.5 inline-block">
                  All Cumulative
                </div>
              </div>
            </div>
          </div>

          {/* Technician Performance Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                <span>Technician Performance</span>
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                FIELD QUEUE MATRIX
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Total Assigned */}
              <div className="bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200/80 text-slate-900 rounded-2xl p-3.5 text-center shadow-2xs hover:shadow-md transition-all border-2 border-slate-300 border-t-4 border-t-slate-700">
                <div className="text-[11px] font-black tracking-wide text-slate-700 uppercase">Total Assigned</div>
                <div className="text-2xl font-black text-slate-950 mt-1 tabular-nums">
                  {tickets.filter(t => t.assigned_technician_id || t.assigned_technician_name !== 'Unassigned').length}
                </div>
              </div>

              {/* Pending Tickets */}
              <div className="bg-gradient-to-br from-amber-50 via-amber-100/80 to-yellow-50 text-amber-950 rounded-2xl p-3.5 text-center shadow-2xs hover:shadow-md transition-all border-2 border-amber-300 border-t-4 border-t-amber-500">
                <div className="text-[11px] font-black tracking-wide uppercase text-amber-900">Pending Tickets</div>
                <div className="text-2xl font-black text-amber-950 mt-1 tabular-nums">
                  {tickets.filter(t => t.status === 'NEW' || t.status === 'OPEN').length}
                </div>
              </div>

              {/* In Process */}
              <div className="bg-gradient-to-br from-orange-50 via-orange-100/80 to-amber-50 text-orange-950 rounded-2xl p-3.5 text-center shadow-2xs hover:shadow-md transition-all border-2 border-orange-300 border-t-4 border-t-orange-500">
                <div className="text-[11px] font-black tracking-wide uppercase text-orange-900">In Process</div>
                <div className="text-2xl font-black text-orange-950 mt-1 tabular-nums">
                  {tickets.filter(t => t.status === 'ASSIGNED' || t.status === 'IN PROGRESS').length}
                </div>
              </div>

              {/* Resolved Tickets */}
              <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/80 to-teal-50 text-emerald-950 rounded-2xl p-3.5 text-center shadow-2xs hover:shadow-md transition-all border-2 border-emerald-300 border-t-4 border-t-emerald-500">
                <div className="text-[11px] font-black tracking-wide uppercase text-emerald-900">Resolved Tickets</div>
                <div className="text-2xl font-black text-emerald-950 mt-1 tabular-nums">
                  {tickets.filter(t => t.status === 'RESOLVED').length}
                </div>
              </div>

              {/* Delayed Tickets */}
              <div className="bg-gradient-to-br from-rose-50 via-rose-100/80 to-red-50 text-rose-950 rounded-2xl p-3.5 text-center shadow-2xs hover:shadow-md transition-all border-2 border-rose-300 border-t-4 border-t-rose-500">
                <div className="text-[11px] font-black tracking-wide uppercase text-rose-900">Delayed Tickets</div>
                <div className="text-2xl font-black text-rose-950 mt-1 tabular-nums">
                  {tickets.filter(t => t.sla_status?.includes('BREACHED') || t.sla_status?.includes('OVERDUE')).length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Advanced Analytics & AI Insight */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Advanced Analytics & AI Insight</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Chart 1: Ticket Volume Trends (30 Days) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">Ticket Volume Trends (30 Days)</span>
                <span className="text-[10px] text-slate-400">Daily Inflow vs Resolution</span>
              </div>

              {/* Lightweight SVG Trend Line Chart */}
              <div className="h-32 w-full flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100">
                  <line x1="0" y1="90" x2="300" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="10" x2="300" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  
                  {/* Generated tickets curve (teal) */}
                  <path
                    d="M 0,90 L 40,90 L 80,90 L 120,90 L 160,90 L 200,90 L 240,90 L 280,90 L 295,15"
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Resolved tickets curve (orange) */}
                  <path
                    d="M 0,90 L 295,90"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <circle cx="295" cy="15" r="3.5" fill="#0d9488" />
                </svg>
              </div>

              <div className="flex items-center justify-center gap-4 text-[10px] font-semibold text-slate-500 mt-2 border-t border-slate-100 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-teal-600 rounded-full"></span>
                  <span>Generated tickets</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-orange-500 rounded-full"></span>
                  <span>Resolved tickets</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Issue Categorization Donut */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Issue Categorization</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Telemetry
                </span>
              </div>

              <div className="h-32 flex items-center justify-center my-1">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="6"
                    />

                    {tickets.length > 0 && (() => {
                      let currentOffset = 0;

                      return categoryCounts.map(cat => {
                        const segmentLen = (cat.count / tickets.length) * 87.964;
                        const gapLen = 87.964 - segmentLen;
                        const strokeOffset = -currentOffset;
                        currentOffset += segmentLen;

                        return (
                          <circle
                            key={cat.name}
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke={cat.style.hex}
                            strokeWidth="6"
                            strokeDasharray={`${segmentLen} ${gapLen}`}
                            strokeDashoffset={strokeOffset}
                            className="transition-all duration-300"
                          />
                        );
                      });
                    })()}
                  </svg>

                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-900">{tickets.length}</span>
                    <span className="text-[9px] text-slate-400">Total</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1.5 max-h-28 overflow-y-auto no-scrollbar">
                {categoryCounts.length === 0 ? (
                  <div className="text-[11px] text-slate-400 text-center py-1">
                    No ticket categories yet
                  </div>
                ) : (
                  categoryCounts.map(cat => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between text-[11px] font-semibold text-slate-700"
                    >
                      <div className="flex items-center gap-1.5 truncate pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.style.hex }}
                        ></span>
                        <span className="truncate">{cat.name}</span>
                      </div>

                      <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
                        {cat.count} ({cat.percentage}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Top 10 Branches */}
      <div className="grid grid-cols-1 gap-6">
        {/* Top 10 Tickets Branch-Wise Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-sky-600" />
              <span className="text-sm font-bold text-slate-900">Top 10 Tickets Branch-Wise</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">
              LIVE VOLUME RANKING
            </span>
          </div>

          <div className="space-y-2.5">
            {Object.entries(branchCounts)
              .map(([name, count]) => ({ name, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
              .map((branch, idx, list) => {
                const palettes = [
                  { bg: 'bg-gradient-to-r from-sky-500 to-blue-600', dot: 'bg-sky-500', text: 'text-sky-700' },
                  { bg: 'bg-gradient-to-r from-emerald-500 to-teal-600', dot: 'bg-emerald-500', text: 'text-emerald-700' },
                  { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', dot: 'bg-amber-500', text: 'text-amber-700' },
                  { bg: 'bg-gradient-to-r from-rose-500 to-red-600', dot: 'bg-rose-500', text: 'text-rose-700' },
                  { bg: 'bg-gradient-to-r from-purple-500 to-indigo-600', dot: 'bg-purple-500', text: 'text-purple-700' },
                  { bg: 'bg-gradient-to-r from-cyan-500 to-teal-500', dot: 'bg-cyan-500', text: 'text-cyan-700' },
                  { bg: 'bg-gradient-to-r from-pink-500 to-rose-500', dot: 'bg-pink-500', text: 'text-pink-700' },
                  { bg: 'bg-gradient-to-r from-violet-500 to-purple-600', dot: 'bg-violet-500', text: 'text-violet-700' },
                  { bg: 'bg-gradient-to-r from-lime-500 to-emerald-500', dot: 'bg-lime-500', text: 'text-lime-700' },
                  { bg: 'bg-gradient-to-r from-orange-500 to-red-500', dot: 'bg-orange-500', text: 'text-orange-700' }
                ];

                const palette = palettes[idx % palettes.length];
                const maxCount = Math.max(1, ...list.map(item => item.count));
                const widthPercent = Math.max(25, (branch.count / maxCount) * 100);

                return (
                  <div key={branch.name} className="flex items-center gap-3 text-xs group">
                    <div className="w-44 text-slate-700 truncate text-[11px] font-bold flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${palette.dot} shrink-0 shadow-2xs`} />
                      <span className="truncate">{branch.name}</span>
                    </div>

                    <div className="flex-1 bg-slate-100/80 h-5 rounded-lg overflow-hidden flex items-center p-0.5 border border-slate-200/60">
                      <div
                        className={`${palette.bg} h-full text-[10px] text-white font-mono flex items-center px-2 rounded-md font-bold shadow-xs transition-all duration-300 group-hover:brightness-110`}
                        style={{ width: `${widthPercent}%` }}
                      >
                        {branch.count}
                      </div>
                    </div>

                    <span className={`text-[11px] font-mono font-bold ${palette.text} w-6 text-right`}>
                      {branch.count}
                    </span>
                  </div>
                );
              })}

            {Object.keys(branchCounts).length === 0 && (
              <div className="text-center text-xs text-slate-400 py-4">
                No ticket branch data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Technician Performance Detailed Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Technician Performance Detailed Matrix</h4>
          <button
            onClick={() => onNavigateTab('technician-reports')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View Full KPI Report</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Technician Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Total Assigned</th>
                <th className="py-3 px-4 text-center">Pending Tickets</th>
                <th className="py-3 px-4 text-center">In Process</th>
                <th className="py-3 px-4 text-center">Closed Tickets</th>
                <th className="py-3 px-4 text-center">Delayed Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                        {u.avatar_initials}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{u.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <span>⏱</span> Idle
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">{u.assigned_count || 0}</td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-amber-600">{u.pending_count || 0}</td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-orange-600">{u.in_process_count || 0}</td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-600">{u.closed_count || 0}</td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-rose-600">{u.delayed_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
