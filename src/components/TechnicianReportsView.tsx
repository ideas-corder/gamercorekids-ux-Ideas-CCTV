import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Award,
  AlertTriangle,
  Search,
  ChevronRight,
  TrendingUp,
  X,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { User, Ticket } from '../types';

interface TechnicianReportsViewProps {
  users: User[];
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const TechnicianReportsView: React.FC<TechnicianReportsViewProps> = ({
  users,
  tickets,
  onSelectTicket
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const activeTechnicians = users.length;
  const totalWorkload = tickets.filter(t => t.status !== 'RESOLVED' && t.assigned_technician_id).length;
  const activeBreaches = tickets.filter(t => t.sla_status === 'BREACHED').length;

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department_name.toLowerCase().includes(q);
  });

  const getUserAssignedTickets = (userId: string) => {
    return tickets.filter(t => t.assigned_technician_id === userId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Cards (Matching Image 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Active Technicians */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Active Technicians</div>
            <div className="text-3xl font-extrabold text-slate-900 my-1 tabular-nums">{activeTechnicians}</div>
            <div className="text-[11px] font-medium text-emerald-600">Field operations fully staffed</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Workload */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Workload</div>
            <div className="text-3xl font-extrabold text-slate-900 my-1 tabular-nums">{totalWorkload}</div>
            <div className="text-[11px] font-medium text-blue-600">Assigned across technicians</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Avg SLA Compliance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Avg SLA Compliance</div>
            <div className="text-3xl font-extrabold text-slate-900 my-1 tabular-nums">100%</div>
            <div className="text-[11px] font-medium text-amber-600">Target threshold &gt; 95%</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Active SLA Breaches */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Active SLA Breaches</div>
            <div className="text-3xl font-extrabold text-rose-600 my-1 tabular-nums">{activeBreaches}</div>
            <div className="text-[11px] font-medium text-rose-600">Requires immediate escalation</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2. Technician Performance Matrix (Matching Image 6) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Technician Performance Matrix</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time workload, SLA compliance, and ticket status breakdown.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search technician..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">TECHNICIAN</th>
                <th className="py-3.5 px-4 text-center">ASSIGNED</th>
                <th className="py-3.5 px-4 text-center">OPEN</th>
                <th className="py-3.5 px-4 text-center">IN PROGRESS</th>
                <th className="py-3.5 px-4 text-center">PENDING</th>
                <th className="py-3.5 px-4 text-center">RESOLVED</th>
                <th className="py-3.5 px-4 text-center">SLA BREACHED</th>
                <th className="py-3.5 px-4 text-center">COMPLIANCE</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map(user => {
                const assigned = getUserAssignedTickets(user.id);
                const openCount = assigned.filter(t => t.status === 'OPEN' || t.status === 'NEW').length;
                const inProgCount = assigned.filter(t => t.status === 'IN PROGRESS').length;
                const resolvedCount = assigned.filter(t => t.status === 'RESOLVED').length;
                const breachedCount = assigned.filter(t => t.sla_status === 'BREACHED').length;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Technician Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {user.avatar_initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Assigned */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                      {assigned.length}
                    </td>

                    {/* Open */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block w-6 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-50 text-blue-700">
                        {openCount}
                      </span>
                    </td>

                    {/* In Progress */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block w-6 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-700">
                        {inProgCount}
                      </span>
                    </td>

                    {/* Pending */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block w-6 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-50 text-purple-700">
                        0
                      </span>
                    </td>

                    {/* Resolved */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block w-6 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700">
                        {resolvedCount}
                      </span>
                    </td>

                    {/* SLA Breached */}
                    <td className="py-3.5 px-4 text-center font-mono text-rose-600 font-semibold">
                      {breachedCount}
                    </td>

                    {/* Compliance Progress Bar */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 font-mono">100%</span>
                      </div>
                    </td>

                    {/* Action: View Profile */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1.5 rounded-md bg-[#0F2942] hover:bg-[#163859] text-white text-[11px] font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs"
                      >
                        <span>View Profile</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                  {selectedUser.avatar_initials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedUser.name}</h3>
                  <div className="text-xs text-slate-400 font-mono">{selectedUser.email}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 font-semibold text-[10px] uppercase">Department</div>
                <div className="font-bold text-slate-900 mt-1">{selectedUser.department_name}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 font-semibold text-[10px] uppercase">Role Tier</div>
                <div className="font-bold text-slate-900 mt-1">{selectedUser.role}</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 font-semibold text-[10px] uppercase">Status</div>
                <div className="font-bold text-emerald-700 mt-1">● {selectedUser.status} (Idle)</div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-slate-400 font-semibold text-[10px] uppercase">SLA Compliance</div>
                <div className="font-bold text-emerald-700 mt-1">100% Target Met</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">Assigned Incidents ({getUserAssignedTickets(selectedUser.id).length})</div>
              {getUserAssignedTickets(selectedUser.id).length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  No tickets currently assigned to this operator.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {getUserAssignedTickets(selectedUser.id).map(t => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedUser(null);
                        onSelectTicket(t);
                      }}
                      className="p-3 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-blue-600">{t.ticket_number}</div>
                        <div className="text-xs font-medium text-slate-800">{t.subject}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
