import React, { useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  User,
  Shield,
  Send,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Building,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  History,
  Check,
  Sparkles
} from 'lucide-react';
import { Ticket, User as AppUser, TicketStatus } from '../types';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  users: AppUser[];
  currentUser: AppUser;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus, extraData?: any) => void;
  onUpdatePriority: (ticketId: string, priority: any) => void;
  onAssignTechnician: (ticketId: string, technicianId: string, technicianName: string) => void;
  onAddComment: (ticketId: string, comment: string, isInternal?: boolean) => void;
  slaEngineEnabled?: boolean;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  users,
  currentUser,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onAssignTechnician,
  onAddComment,
  slaEngineEnabled = true
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'history'>('details');
  const [commentText, setCommentText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Workflow Dialog States
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionDesc, setResolutionDesc] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');


  if (!ticket) return null;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(ticket.id, commentText, isInternalNote);
    setCommentText('');
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionDesc.trim()) return;
    onUpdateStatus(ticket.id, 'RESOLVED', {
      resolution_description: resolutionDesc,
      root_cause: rootCause,
      corrective_action: correctiveAction
    });
    setShowResolveModal(false);
    setResolutionDesc('');
    setRootCause('');
    setCorrectiveAction('');
  };

  const priorityBadgeStyle = {
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
    MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
    LOW: 'bg-slate-50 text-slate-700 border-slate-200'
  }[ticket.priority] || 'bg-slate-50 text-slate-700 border-slate-200';

  const statusBadgeStyle = {
    NEW: 'bg-blue-50 text-blue-700 border-blue-200',
    OPEN: 'bg-sky-50 text-sky-700 border-sky-200',
    ASSIGNED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'IN PROGRESS': 'bg-amber-50 text-amber-700 border-amber-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }[ticket.status] || 'bg-slate-100 text-slate-700 border-slate-200';

  const lifecycleStages: TicketStatus[] = [
    'NEW',
    'OPEN',
    'ASSIGNED',
    'IN PROGRESS',
    'RESOLVED'
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto relative">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-base font-bold text-amber-600">{ticket.ticket_number}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${statusBadgeStyle}`}>
                {ticket.status}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${priorityBadgeStyle}`}>
                {ticket.priority}
              </span>
              {ticket.source && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 font-mono">
                  {ticket.source}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">{ticket.subject}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
              <span>Department: <strong className="text-slate-700">{ticket.department_name}</strong></span>
              <span>•</span>
              <span>Requester: <strong className="text-slate-700">{ticket.created_by_name}</strong></span>
              <span>•</span>
              <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
              activeTab === 'details' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Ticket Overview & Diagnostic Findings</span>
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
              activeTab === 'comments' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Activity Notes & Communications ({ticket.comments?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
              activeTab === 'history' ? 'bg-[#0F2942] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit History Ledger ({ticket.history?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-5">
            {/* Operational Metadata Grid */}
            <div className={`grid grid-cols-1 ${slaEngineEnabled ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-slate-400">LOCATION & REGION</div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{ticket.location_name}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{ticket.region_name} Region</div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-slate-400">ASSIGNED FIELD TECHNICIAN</div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs mt-1">
                  <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{ticket.assigned_technician_name}</span>
                </div>
                <select
                  value={ticket.assigned_technician_id || ''}
                  onChange={e => {
                    const u = users.find(usr => usr.id === e.target.value);
                    onAssignTechnician(ticket.id, e.target.value, u ? u.name : 'Unassigned');
                  }}
                  className="mt-1 text-[11px] font-medium text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none w-full"
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              {slaEngineEnabled && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[10px] font-bold uppercase text-slate-400">SLA RESOLUTION TIMER</div>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-xs mt-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{ticket.sla_status} ({ticket.sla_remaining_hours}h left)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Lifecycle Controls */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span>Transition Lifecycle State</span>
                <span className="text-[11px] text-slate-400 font-mono">Current: {ticket.status}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {lifecycleStages.map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      if (st === 'RESOLVED') {
                        setShowResolveModal(true);
                      } else {
                        onUpdateStatus(ticket.id, st);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      ticket.status === st
                        ? 'bg-[#0F2942] text-white shadow-2xs ring-2 ring-emerald-400/40'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}

              </div>
            </div>

            {/* Resolution Information Banner if Resolved or Closed */}
            {(ticket.status === 'RESOLVED' || ticket.resolution_description) && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resolution Record</span>
                  <span className="text-[11px] font-mono text-emerald-700">Resolved by {ticket.resolved_by || 'Field Specialist'}</span>
                </div>
                {ticket.resolution_description && (
                  <div>
                    <span className="font-bold text-emerald-950 block">Resolution Description:</span>
                    <p className="text-emerald-900 mt-0.5">{ticket.resolution_description}</p>
                  </div>
                )}
                {ticket.root_cause && (
                  <div>
                    <span className="font-bold text-emerald-950 block">Identified Root Cause:</span>
                    <p className="text-emerald-900 mt-0.5">{ticket.root_cause}</p>
                  </div>
                )}
                {ticket.corrective_action && (
                  <div>
                    <span className="font-bold text-emerald-950 block">Corrective Action Taken:</span>
                    <p className="text-emerald-900 mt-0.5">{ticket.corrective_action}</p>
                  </div>
                )}
              </div>
            )}

            {/* Narrative / Findings */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Incident Description & Initial Observations
              </label>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                {ticket.description || 'No diagnostic notes attached to this ticket.'}
              </div>
            </div>

            {/* Photographic Evidence Gallery */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-slate-500" />
                  <span>Photographic Evidence & Site Verification ({ticket.evidence_images?.length || 0})</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Policy: Max 2 MB / Image</span>
              </div>

              {ticket.evidence_images && ticket.evidence_images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ticket.evidence_images.map((img, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group bg-slate-900">
                      <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                  No photographic evidence currently attached.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COMMENTS & NOTES */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
              <span>Activity Notes & Communications Log</span>
              <span className="text-[11px] text-slate-400 font-mono">{ticket.comments?.length || 0} Total Notes</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto p-1">
              {!ticket.comments || ticket.comments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  No activity notes or replies posted yet.
                </div>
              ) : (
                ticket.comments.map(cmt => (
                  <div
                    key={cmt.id}
                    className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                      cmt.is_internal
                        ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px] border-b border-black/5 pb-1 mb-1">
                      <div className="flex items-center gap-2">
                        <span>{cmt.user_name} ({cmt.user_role})</span>
                        {cmt.is_internal ? (
                          <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> INTERNAL NOTE
                          </span>
                        ) : (
                          <span className="px-2 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                            PUBLIC REPLY
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono font-normal">
                        {new Date(cmt.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="leading-relaxed whitespace-pre-wrap">{cmt.comment}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Add Communication Note</span>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={e => setIsInternalNote(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Confidential Internal Note</span>
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder={
                    isInternalNote
                      ? 'Type internal team note (hidden from end-user requester)...'
                      : 'Type public reply to requester / location manager...'
                  }
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 focus:bg-white text-slate-800"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F2942] hover:bg-[#163859] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs self-end h-10"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: HISTORY LEDGER */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
              <span>Complete Lifecycle Audit Trail</span>
              <span className="text-[11px] text-slate-400 font-mono">{ticket.history?.length || 0} Events</span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {!ticket.history || ticket.history.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                  No historical entries recorded.
                </div>
              ) : (
                ticket.history.map(item => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-start gap-3">
                    <div className="p-2 bg-slate-200/60 text-slate-700 rounded-lg shrink-0 mt-0.5">
                      <History className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                        <span className="uppercase text-amber-700 font-mono">{item.action}</span>
                        <span className="text-slate-400 font-mono font-normal">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-700 mt-1 font-medium">
                        Performed by <strong className="text-slate-900">{item.performed_by}</strong>
                      </div>
                      {(item.previous_value || item.new_value) && (
                        <div className="text-[11px] font-mono text-slate-500 mt-1 bg-white p-1.5 rounded border border-slate-200">
                          {item.previous_value && <span>Prev: {item.previous_value} → </span>}
                          <span>New: {item.new_value}</span>
                        </div>
                      )}
                      {item.reason && <div className="text-[11px] text-slate-500 italic mt-0.5">Note: {item.reason}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODAL: RESOLUTION WORKFLOW */}
        {showResolveModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Record Ticket Resolution</span>
                </h3>
                <button onClick={() => setShowResolveModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmResolve} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Resolution Summary *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe how the issue was investigated and resolved on site..."
                    value={resolutionDesc}
                    onChange={e => setResolutionDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Root Cause</label>
                  <input
                    type="text"
                    placeholder="e.g. RJ45 corrosion, PoE switch port over-budget, faulty cable termination"
                    value={rootCause}
                    onChange={e => setRootCause(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Corrective Action Taken</label>
                  <input
                    type="text"
                    placeholder="e.g. Re-crimped connector, rebalanced PoE load on Switch Port 04"
                    value={correctiveAction}
                    onChange={e => setCorrectiveAction(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                  >
                    Confirm Resolution
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
