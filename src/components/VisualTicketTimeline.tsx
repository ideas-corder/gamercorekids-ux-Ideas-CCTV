import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  UserCheck,
  UserPlus,
  Clock,
  MessageSquare,
  Lock,
  CheckCircle2,
  History as HistoryIcon,
  Search,
  ArrowRight,
  Filter,
  ArrowUpDown,
  Tag,
  Shield,
  MapPin,
  Building
} from 'lucide-react';
import { Ticket, TicketComment, TicketHistoryItem } from '../types';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'CREATION' | 'STATUS_CHANGE' | 'ASSIGNMENT' | 'COMMENT' | 'RESOLUTION';
  title: string;
  performerName: string;
  performerRole?: string;
  description?: string;
  previousValue?: string;
  newValue?: string;
  isInternalNote?: boolean;
  rootCause?: string;
  correctiveAction?: string;
  rawEvent?: any;
}

interface VisualTicketTimelineProps {
  ticket: Ticket;
  compact?: boolean;
}

export const VisualTicketTimeline: React.FC<VisualTicketTimelineProps> = ({ ticket, compact = false }) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'STATUS' | 'ASSIGNMENT' | 'COMMENT'>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST_FIRST' | 'OLDEST_FIRST'>('NEWEST_FIRST');
  const [searchQuery, setSearchQuery] = useState('');

  // Normalize all timeline events from ticket data into a unified array
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    // 1. Creation Event
    events.push({
      id: `evt_create_${ticket.id}`,
      timestamp: ticket.created_at,
      type: 'CREATION',
      title: `Ticket Issued (${ticket.ticket_number})`,
      performerName: ticket.created_by_name || 'System Operator',
      description: `Dispatched incident for ${ticket.department_name} at ${ticket.location_name} (${ticket.region_name} Region). Priority: ${ticket.priority}`,
      newValue: 'NEW'
    });

    // 2. Initial Technician Assignment Event (if assigned at creation)
    if (ticket.assigned_technician_name && ticket.assigned_technician_name !== 'Unassigned') {
      events.push({
        id: `evt_init_assign_${ticket.id}`,
        timestamp: ticket.created_at,
        type: 'ASSIGNMENT',
        title: `Assigned to Field Specialist`,
        performerName: ticket.created_by_name || 'System',
        description: `Field operator assigned: ${ticket.assigned_technician_name}`,
        newValue: ticket.assigned_technician_name
      });
    }

    // 3. History Ledger Events
    if (ticket.history && ticket.history.length > 0) {
      ticket.history.forEach((h: TicketHistoryItem) => {
        let type: TimelineEvent['type'] = 'STATUS_CHANGE';
        const actionUpper = (h.action || '').toUpperCase();

        if (actionUpper.includes('ASSIGN')) {
          type = 'ASSIGNMENT';
        } else if (actionUpper.includes('RESOLV')) {
          type = 'RESOLUTION';
        } else if (actionUpper.includes('CLOSE') || actionUpper.includes('REOPEN')) {
          // Legacy history records may contain CLOSE/REOPEN actions.
          // Keep them visible as generic lifecycle history without
          // presenting CLOSED/REOPENED as current production statuses.
          type = 'STATUS_CHANGE';
        }

        events.push({
          id: `evt_hist_${h.id}`,
          timestamp: h.timestamp,
          type,
          title: h.action || 'Ticket Lifecycle Action',
          performerName: h.performed_by || 'Operator',
          performerRole: h.performed_by_role,
          description: h.reason,
          previousValue: h.previous_value,
          newValue: h.new_value
        });
      });
    }

    // 4. Comments & Communications
    if (ticket.comments && ticket.comments.length > 0) {
      ticket.comments.forEach((c: TicketComment) => {
        events.push({
          id: `evt_cmt_${c.id}`,
          timestamp: c.created_at,
          type: 'COMMENT',
          title: c.is_internal ? 'Confidential Internal Note Added' : 'Communication Note Posted',
          performerName: c.user_name,
          performerRole: c.user_role,
          description: c.comment,
          isInternalNote: c.is_internal
        });
      });
    }

    // 5. Resolution Event (if resolved & not duplicate)
    if (ticket.resolved_at || ticket.resolution_description) {
      const hasHistResolution = events.some(e => e.type === 'RESOLUTION');
      if (!hasHistResolution) {
        events.push({
          id: `evt_res_${ticket.id}`,
          timestamp: ticket.resolved_at || ticket.updated_at,
          type: 'RESOLUTION',
          title: 'Site Issue Resolved & Verified',
          performerName: ticket.resolved_by || 'Field Specialist',
          description: ticket.resolution_description,
          rootCause: ticket.root_cause,
          correctiveAction: ticket.corrective_action,
          newValue: 'RESOLVED'
        });
      }
    }


    // Deduplicate exact duplicate IDs
    const uniqueMap = new Map<string, TimelineEvent>();
    events.forEach(e => {
      if (!uniqueMap.has(e.id)) {
        uniqueMap.set(e.id, e);
      }
    });

    const uniqueEvents = Array.from(uniqueMap.values());

    // Sort by timestamp
    return uniqueEvents.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'NEWEST_FIRST' ? timeB - timeA : timeA - timeB;
    });
  }, [ticket, sortOrder]);

  // Filtered timeline events
  const filteredEvents = useMemo(() => {
    return timelineEvents.filter(evt => {
      // Category filter
      if (filterCategory === 'STATUS' && evt.type !== 'STATUS_CHANGE' && evt.type !== 'CREATION' && evt.type !== 'RESOLUTION') {
        return false;
      }
      if (filterCategory === 'ASSIGNMENT' && evt.type !== 'ASSIGNMENT') {
        return false;
      }
      if (filterCategory === 'COMMENT' && evt.type !== 'COMMENT') {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          evt.title.toLowerCase().includes(q) ||
          evt.performerName.toLowerCase().includes(q) ||
          (evt.description && evt.description.toLowerCase().includes(q)) ||
          (evt.previousValue && evt.previousValue.toLowerCase().includes(q)) ||
          (evt.newValue && evt.newValue.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [timelineEvents, filterCategory, searchQuery]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    } catch {
      return dateStr;
    }
  };

  const getEventBadgeAndIcon = (evt: TimelineEvent) => {
    switch (evt.type) {
      case 'CREATION':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          iconBg: 'bg-blue-600 text-white ring-4 ring-blue-50',
          icon: <Sparkles className="w-3.5 h-3.5" />,
          label: 'CREATION'
        };
      case 'ASSIGNMENT':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          iconBg: 'bg-indigo-600 text-white ring-4 ring-indigo-50',
          icon: <UserPlus className="w-3.5 h-3.5" />,
          label: 'ASSIGNMENT'
        };
      case 'STATUS_CHANGE':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          iconBg: 'bg-amber-500 text-white ring-4 ring-amber-50',
          icon: <Clock className="w-3.5 h-3.5" />,
          label: 'STATUS CHANGE'
        };
      case 'COMMENT':
        if (evt.isInternalNote) {
          return {
            bg: 'bg-amber-100/80 border-amber-300 text-amber-950',
            iconBg: 'bg-amber-600 text-white ring-4 ring-amber-100',
            icon: <Lock className="w-3.5 h-3.5" />,
            label: 'INTERNAL NOTE'
          };
        }
        return {
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
          iconBg: 'bg-teal-600 text-white ring-4 ring-teal-50',
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          label: 'PUBLIC NOTE'
        };
      case 'RESOLUTION':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          iconBg: 'bg-emerald-600 text-white ring-4 ring-emerald-50',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'RESOLUTION'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          iconBg: 'bg-slate-600 text-white ring-4 ring-slate-50',
          icon: <HistoryIcon className="w-3.5 h-3.5" />,
          label: 'EVENT'
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      {!compact && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Chronological Audit Lifecycle Timeline
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                {timelineEvents.length} Total Events
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortOrder(prev => (prev === 'NEWEST_FIRST' ? 'OLDEST_FIRST' : 'NEWEST_FIRST'))}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Toggle timeline chronological direction"
              >
                <ArrowUpDown className="w-3 h-3 text-slate-500" />
                <span>{sortOrder === 'NEWEST_FIRST' ? 'Newest First' : 'Oldest First'}</span>
              </button>
            </div>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" /> Filter:
              </span>
              <button
                onClick={() => setFilterCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  filterCategory === 'ALL'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Events ({timelineEvents.length})
              </button>
              <button
                onClick={() => setFilterCategory('STATUS')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  filterCategory === 'STATUS'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Status Changes
              </button>
              <button
                onClick={() => setFilterCategory('ASSIGNMENT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  filterCategory === 'ASSIGNMENT'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Assignments
              </button>
              <button
                onClick={() => setFilterCategory('COMMENT')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  filterCategory === 'COMMENT'
                    ? 'bg-[#0F2942] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Comments & Notes
              </button>
            </div>

            <div className="relative w-full sm:w-48">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline Node Graph */}
      <div className="relative pl-6 sm:pl-8 space-y-6 pt-2 pb-2">
        {/* Continuous Vertical Timeline Line */}
        <div className="absolute left-3.5 sm:left-4 top-4 bottom-4 w-0.5 bg-slate-200 -translate-x-1/2 rounded-full" />

        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
            No events match the current filter criteria.
          </div>
        ) : (
          filteredEvents.map(evt => {
            const badgeStyle = getEventBadgeAndIcon(evt);

            return (
              <div key={evt.id} className="relative group">
                {/* Node Icon Circle */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1 -translate-x-1/2 w-7 h-7 rounded-full ${badgeStyle.iconBg} flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 z-10`}
                >
                  {badgeStyle.icon}
                </div>

                {/* Event Card Content Box */}
                <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 shadow-2xs space-y-2 transition-all">
                  {/* Card Top Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle.bg}`}>
                        {badgeStyle.label}
                      </span>
                      <span className="font-bold text-slate-900">{evt.title}</span>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {formatDate(evt.timestamp)}
                    </span>
                  </div>

                  {/* Actor / Performer Info */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <span>Performed by <strong className="text-slate-900">{evt.performerName}</strong></span>
                    {evt.performerRole && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[9px] uppercase border border-slate-200">
                        {evt.performerRole}
                      </span>
                    )}
                  </div>

                  {/* Previous -> New Value Chip if present */}
                  {(evt.previousValue || evt.newValue) && evt.type !== 'CREATION' && evt.type !== 'COMMENT' && (
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono flex items-center gap-2 text-slate-800 w-fit">
                      {evt.previousValue && (
                        <>
                          <span className="text-slate-500 font-medium">{evt.previousValue}</span>
                          <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
                        </>
                      )}
                      <span className="font-bold text-emerald-700">{evt.newValue}</span>
                    </div>
                  )}

                  {/* Description / Note Text */}
                  {evt.description && (
                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        evt.isInternalNote
                          ? 'bg-amber-50/80 border border-amber-200 text-amber-950 font-medium'
                          : 'bg-slate-50/80 border border-slate-200/80 text-slate-800'
                      }`}
                    >
                      {evt.description}
                    </div>
                  )}

                  {/* Resolution Root Cause & Corrective Action Details */}
                  {evt.type === 'RESOLUTION' && (evt.rootCause || evt.correctiveAction) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      {evt.rootCause && (
                        <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-950">
                          <span className="font-bold block">Root Cause:</span>
                          <span>{evt.rootCause}</span>
                        </div>
                      )}
                      {evt.correctiveAction && (
                        <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-950">
                          <span className="font-bold block">Corrective Action:</span>
                          <span>{evt.correctiveAction}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
