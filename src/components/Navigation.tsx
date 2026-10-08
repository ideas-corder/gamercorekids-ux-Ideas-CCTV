import React from 'react';
import {
  LayoutDashboard,
  Eye,
  ShieldAlert,
  Building2,
  BarChart3,
  Clock,
  Users,
  ScrollText,
  SlidersHorizontal
} from 'lucide-react';
import { User } from '../types';

export type TabId =
  | 'dashboard'
  | 'observations'
  | 'technician-tickets'
  | 'locations'
  | 'technician-reports'
  | 'sla-engine'
  | 'users-teams'
  | 'audit-trail'
  | 'administration';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  currentUser: User;
  ticketsCount: number;
  slaEngineEnabled?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  ticketsCount,
  slaEngineEnabled = true
}) => {
  const tabs: { id: TabId; label: string; icon: React.ComponentType<any>; badge?: number; minRole?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'observations', label: 'Observations', icon: Eye, badge: ticketsCount },
    { id: 'technician-tickets', label: 'Technician Tickets', icon: ShieldAlert },
    { id: 'locations', label: 'Locations', icon: Building2 },
    { id: 'technician-reports', label: 'Technician Performance & Reports', icon: BarChart3 },
    { id: 'sla-engine', label: 'SLA Engine & Policies', icon: Clock },
    { id: 'users-teams', label: 'Users & Teams', icon: Users },
    { id: 'audit-trail', label: 'Audit Trail', icon: ScrollText },
    { id: 'administration', label: 'Administration', icon: SlidersHorizontal, minRole: 'SUPER_ADMIN' }
  ];

  // Filter based on user role (Super Admins see all, supervisors see operational tabs, technicians see assigned)
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isTechnician = currentUser.role === 'TECHNICIAN';

  const isSlaEnabled =
    slaEngineEnabled !== false &&
    (slaEngineEnabled as any) !== 'false' &&
    (slaEngineEnabled as any) !== 0 &&
    (slaEngineEnabled as any) !== '0';

  const tabIconColors: Record<TabId, { active: string; inactive: string; bg: string }> = {
    dashboard: { active: 'text-white', inactive: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    observations: { active: 'text-white', inactive: 'text-amber-400', bg: 'bg-amber-500/20' },
    'technician-tickets': { active: 'text-white', inactive: 'text-rose-400', bg: 'bg-rose-500/20' },
    locations: { active: 'text-white', inactive: 'text-purple-400', bg: 'bg-purple-500/20' },
    'technician-reports': { active: 'text-white', inactive: 'text-sky-400', bg: 'bg-sky-500/20' },
    'sla-engine': { active: 'text-white', inactive: 'text-teal-400', bg: 'bg-teal-500/20' },
    'users-teams': { active: 'text-white', inactive: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    'audit-trail': { active: 'text-white', inactive: 'text-fuchsia-400', bg: 'bg-fuchsia-500/20' },
    administration: { active: 'text-white', inactive: 'text-amber-300', bg: 'bg-amber-500/20' }
  };

  return (
    <nav className="bg-gradient-to-r from-[#071320] via-[#0F2942] to-[#0A1A2D] text-slate-200 border-b border-emerald-500/30 shadow-lg relative z-20">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            // Technicians can ONLY see Dashboard and Technician Tickets
            if (isTechnician && tab.id !== 'dashboard' && tab.id !== 'technician-tickets') {
              return null;
            }
            if (tab.minRole === 'SUPER_ADMIN' && !isSuperAdmin) {
              return null;
            }
            if (tab.id === 'sla-engine' && !isSlaEnabled) {
              return null;
            }

            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const colors = tabIconColors[tab.id];

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white ring-2 ring-emerald-400/60 shadow-md shadow-emerald-950/60 scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 hover:ring-1 hover:ring-slate-700'
                }`}
              >
                <div className={`p-1 rounded-lg shrink-0 transition-colors ${isActive ? 'bg-white/20' : colors.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : colors.inactive}`} />
                </div>
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`ml-1 px-2 py-0.2 rounded-full text-[10px] font-mono font-bold shadow-xs ${
                    isActive
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
