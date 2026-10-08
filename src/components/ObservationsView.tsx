import React, { useState } from 'react';
import {
  Plus,
  FileDown,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Trash2,
  UserPlus,
  Store,
  ChevronDown,
  Check,
  Building2,
  ShieldAlert,
  AlertTriangle,
  User as UserIcon,
  MapPin,
  Calendar
} from 'lucide-react';
import { Ticket, User, Location, Region } from '../types';

interface ObservationsViewProps {
  tickets: Ticket[];
  users: User[];
  locations: Location[];
  regions: Region[];
  currentUser: User;
  onOpenNewTicket: () => void;
  onSelectTicket: (ticket: Ticket) => void;
  onUpdateTicketStatus: (ticketId: string, status: any) => void;
  onUpdateTicketPriority: (ticketId: string, priority: any) => void;
  onAssignTechnician: (ticketId: string, technicianId: string, technicianName: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  slaEngineEnabled?: boolean;
}

export const ObservationsView: React.FC<ObservationsViewProps> = ({
  tickets,
  users,
  locations,
  regions,
  currentUser,
  onOpenNewTicket,
  onSelectTicket,
  onUpdateTicketStatus,
  onUpdateTicketPriority,
  onAssignTechnician,
  onDeleteTicket,
  slaEngineEnabled = true
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'new' | 'open' | 'in_progress' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [technicianFilter, setTechnicianFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [assignDropdownId, setAssignDropdownId] = useState<string | null>(null);

  // Status breakdown calculations
  const totalCount = tickets.length;
  const newCount = tickets.filter(t => t.status === 'NEW').length;
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  const totalActiveQueue = openCount + newCount;
  const openPercent = totalCount > 0 ? Math.round(((openCount + newCount) / totalCount) * 100) : 0;
  const inProgressPercent = totalCount > 0 ? Math.round((inProgressCount / totalCount) * 100) : 0;
  const resolvedPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Filter application
  const filteredTickets = tickets.filter(t => {
    // Tab pill filter
    if (selectedFilter === 'new' && t.status !== 'NEW') return false;
    if (selectedFilter === 'open' && t.status !== 'OPEN') return false;
    if (selectedFilter === 'in_progress' && t.status !== 'IN PROGRESS') return false;
    if (selectedFilter === 'resolved' && t.status !== 'RESOLVED') return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        t.ticket_number.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.location_name.toLowerCase().includes(q) ||
        t.region_name.toLowerCase().includes(q) ||
        t.assigned_technician_name.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Dropdown filters
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (technicianFilter !== 'ALL' && t.assigned_technician_id !== technicianFilter) return false;
    if (regionFilter !== 'ALL' && t.region_name !== regionFilter) return false;
    if (branchFilter !== 'ALL' && t.location_id !== branchFilter) return false;

    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTicketIds(filteredTickets.map(t => t.id));
    } else {
      setSelectedTicketIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTicketIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Download PDF & New Ticket */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Observations</h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete incident and observation repository across all lifecycle states, stores, locations, and technician dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-2xs"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Download PDF Report</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
              {filteredTickets.length}
            </span>
          </button>

          <button
            onClick={onOpenNewTicket}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0F2942] hover:bg-[#163859] text-white transition-colors flex items-center gap-2 shadow-2xs"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Ticket Lifecycle Overview Cards (Matching Image 3) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              TICKET LIFECYCLE OVERVIEW
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              {totalCount} Total
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Click any card below to filter the queue</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: OPEN TICKETS */}
          <div
            onClick={() => setSelectedFilter(selectedFilter === 'open' ? 'all' : 'open')}
            className={`border rounded-xl p-4 transition-all cursor-pointer ${
              selectedFilter === 'open'
                ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-bold text-blue-900 uppercase">OPEN TICKETS</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mb-3">Awaiting review, triage & technician dispatch</div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{totalActiveQueue}</span>
                <span className="text-xs font-semibold text-blue-600">{openPercent}% of queue</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 hover:text-blue-700 flex items-center gap-1">
                Filter Open →
              </span>
            </div>
          </div>

          {/* Card 2: IN PROGRESS */}
          <div
            onClick={() => setSelectedFilter(selectedFilter === 'in_progress' ? 'all' : 'in_progress')}
            className={`border rounded-xl p-4 transition-all cursor-pointer ${
              selectedFilter === 'in_progress'
                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold text-amber-900 uppercase">IN PROGRESS</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mb-3">Under active field diagnosis, parts replacement & repair</div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{inProgressCount}</span>
                <span className="text-xs font-semibold text-amber-600">{inProgressPercent}% of queue</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 hover:text-amber-700 flex items-center gap-1">
                Filter Progress →
              </span>
            </div>
          </div>

          {/* Card 3: RESOLVED */}
          <div
            onClick={() => setSelectedFilter(selectedFilter === 'resolved' ? 'all' : 'resolved')}
            className={`border rounded-xl p-4 transition-all cursor-pointer ${
              selectedFilter === 'resolved'
                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20'
                : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-900 uppercase">RESOLVED</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 mb-3">Verified functional, closed & completed operational logs</div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{resolvedCount}</span>
                <span className="text-xs font-semibold text-emerald-600">{resolvedPercent}% resolution rate</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 hover:text-emerald-700 flex items-center gap-1">
                Filter Resolved →
              </span>
            </div>
          </div>
        </div>

        {/* Lifecycle Distribution Bar */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
            <span>Lifecycle Distribution</span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                ● Open: {totalActiveQueue} ({openPercent}%)
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                ● In Progress: {inProgressCount} ({inProgressPercent}%)
              </span>
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                ● Resolved: {resolvedCount} ({resolvedPercent}%)
              </span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${Math.max(openPercent, 10)}%` }}></div>
            <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${inProgressPercent}%` }}></div>
            <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${resolvedPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
        {/* Row 1: Filter Pills + Search Input + Quick Filter + Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> FILTER:
            </span>

            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Observations <span className="ml-1 opacity-80">{totalCount}</span>
            </button>

            <button
              onClick={() => setSelectedFilter('new')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'new'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              ● New <span className="ml-1 opacity-80">{newCount}</span>
            </button>

            <button
              onClick={() => setSelectedFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              ● Open <span className="ml-1 opacity-80">{openCount}</span>
            </button>

            <button
              onClick={() => setSelectedFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'in_progress'
                  ? 'bg-orange-500 text-white'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
              }`}
            >
              ● In Progress <span className="ml-1 opacity-80">{inProgressCount}</span>
            </button>

            <button
              onClick={() => setSelectedFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedFilter === 'resolved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              ● Resolved <span className="ml-1 opacity-80">{resolvedCount}</span>
            </button>

          </div>

          {/* Search Box & Quick Controls */}
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by ticket #, subject, or location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-800"
              />
            </div>

            <select className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none">
              <option>All Views & Filters</option>
              <option>My Assigned Tickets</option>
              {slaEngineEnabled && <option>SLA At Risk</option>}
              <option>Critical & High Priority</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white flex items-center gap-1.5 shrink-0"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 pt-3 border-t border-slate-100">
            {/* 1. STATUS */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
                <span>STATUS</span>
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="NEW">NEW</option>
                <option value="OPEN">OPEN</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            {/* 2. PRIORITY */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>PRIORITY</span>
              </div>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            {/* 3. TECHNICIAN */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>TECHNICIAN</span>
              </div>
              <select
                value={technicianFilter}
                onChange={e => setTechnicianFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Technicians</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. REGION */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                <span>REGION</span>
              </div>
              <select
                value={regionFilter}
                onChange={e => setRegionFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Regions</option>
                {regions.map(r => (
                  <option key={r.id} value={r.name.replace(' Region', '')}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. BRANCH */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>BRANCH</span>
              </div>
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Branches ({locations.length})</option>
                {locations.slice(0, 30).map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. DATE RANGE */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>DATE RANGE</span>
              </div>
              <select
                value={dateRangeFilter}
                onChange={e => setDateRangeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="THIS_WEEK">This Week</option>
                <option value="THIS_MONTH">This Month</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 4. Table Controls Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing <span className="font-bold text-slate-900">{filteredTickets.length}</span> of{' '}
          <span className="font-bold text-slate-900">{tickets.length}</span> total tickets
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const resolved = filteredTickets.filter(t => t.status === 'RESOLVED');
              setSelectedTicketIds(resolved.map(t => t.id));
            }}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium"
          >
            Select Resolved
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export PDF ({filteredTickets.length})</span>
          </button>
          <span className="text-slate-400">Sorted by createdAt (DESC)</span>
        </div>
      </div>

      {/* 5. Main Tickets Table (Exact styling from Image 3) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedTicketIds.length === filteredTickets.length && filteredTickets.length > 0}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="py-3.5 px-4">TICKET #</th>
                <th className="py-3.5 px-4">CREATED DATE ↓</th>
                <th className="py-3.5 px-4">SUBJECT / TITLE</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">PRIORITY</th>
                {slaEngineEnabled && <th className="py-3.5 px-4">SLA STATUS</th>}
                <th className="py-3.5 px-4">ASSIGNED TECHNICIAN</th>
                <th className="py-3.5 px-4">LOCATION / SITE</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold">No observation tickets found</p>
                    <p className="text-xs mt-1">Adjust filters or create a new incident ticket.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => {
                  const isChecked = selectedTicketIds.includes(ticket.id);

                  // Priority colors
                  const priorityStyles = {
                    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
                    HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
                    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
                    LOW: 'bg-slate-50 text-slate-700 border-slate-200'
                  }[ticket.priority];

                  // Status colors
                  const statusStyles = {
                    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
                    OPEN: 'bg-sky-50 text-sky-700 border-sky-200',
                    ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    'IN PROGRESS': 'bg-amber-50 text-amber-700 border-amber-200',
                    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  }[ticket.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr
                      key={ticket.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isChecked ? 'bg-emerald-50/20' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(ticket.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Ticket Number in Orange (Exact Image 3) */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-600 whitespace-nowrap">
                        <button
                          onClick={() => onSelectTicket(ticket)}
                          className="hover:underline text-left"
                        >
                          {ticket.ticket_number}
                        </button>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(ticket.created_at)}
                      </td>

                      {/* Subject / Title */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => onSelectTicket(ticket)}
                            className="hover:text-blue-600 cursor-pointer"
                          >
                            {ticket.subject}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {ticket.comments?.length || 0}
                          </span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={ticket.status}
                          onChange={e => onUpdateTicketStatus(ticket.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${statusStyles}`}
                        >
                          <option value="NEW">NEW</option>
                          <option value="OPEN">OPEN</option>
                          <option value="ASSIGNED">ASSIGNED</option>
                                              <option value="IN PROGRESS">IN PROGRESS</option>
                                    <option value="RESOLVED">RESOLVED</option>
                                                                </select>
                      </td>

                      {/* Priority Dropdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={ticket.priority}
                          onChange={e => onUpdateTicketPriority(ticket.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border focus:outline-none cursor-pointer ${priorityStyles}`}
                        >
                          <option value="CRITICAL">CRITICAL</option>
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                        </select>
                      </td>

                      {/* SLA Status Bar */}
                      {slaEngineEnabled && (
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-1 w-32">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-emerald-700">● {ticket.sla_status}</span>
                              <span className="text-slate-400 font-mono">{ticket.sla_remaining_hours}h left</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }}></div>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Assigned Technician */}
                      <td className="py-3.5 px-4 whitespace-nowrap relative">
                        <div className="relative">
                          <button
                            onClick={() => setAssignDropdownId(assignDropdownId === ticket.id ? null : ticket.id)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 text-[11px] font-medium transition-colors"
                          >
                            <UserPlus className="w-3 h-3 text-amber-600" />
                            <span className="truncate max-w-[100px]">{ticket.assigned_technician_name}</span>
                          </button>

                          {assignDropdownId === ticket.id && (
                            <div className="absolute left-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-40">
                              <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400">
                                Assign Field Technician
                              </div>
                              <button
                                onClick={() => {
                                  onAssignTechnician(ticket.id, '', 'Unassigned');
                                  setAssignDropdownId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50"
                              >
                                Mark Unassigned
                              </button>
                              {users.map(u => (
                                <button
                                  key={u.id}
                                  onClick={() => {
                                    onAssignTechnician(ticket.id, u.id, u.name);
                                    setAssignDropdownId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex items-center justify-between"
                                >
                                  <span>{u.name}</span>
                                  {ticket.assigned_technician_id === u.id && (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location / Site */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{ticket.location_name}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectTicket(ticket)}
                            title="Inspect ticket details and comments"
                            className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Permanently delete ticket ${ticket.ticket_number}?`)) {
                                onDeleteTicket(ticket.id);
                              }
                            }}
                            title="Delete ticket"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
