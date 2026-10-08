import React, { useState, useEffect, useCallback } from 'react';
import {
  Department,
  Region,
  Location,
  User,
  Ticket,
  SlaRule,
  AuditLog,
  SystemSettings,
  DbStatus
} from './types';
import * as api from './api';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ObservationsView } from './components/ObservationsView';
import { TechnicianTicketsView } from './components/TechnicianTicketsView';
import { LocationsView } from './components/LocationsView';
import { TechnicianReportsView } from './components/TechnicianReportsView';
import { SlaEngineView } from './components/SlaEngineView';
import { UsersTeamsView } from './components/UsersTeamsView';
import { AuditTrailView } from './components/AuditTrailView';
import { AdministrationView } from './components/AdministrationView';
import { TicketDetailModal } from './components/TicketDetailModal';
import { NewTicketModal } from './components/NewTicketModal';
import { HostingerDbModal } from './components/HostingerDbModal';
import { CommandPalette } from './components/CommandPalette';
import { LoginPage } from './components/LoginPage';
import { ISSUE_CATEGORIES } from './constants/categories';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeDepartmentId, setActiveDepartmentId] = useState<string>('all');
  const [regions, setRegions] = useState<Region[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [slaRules, setSlaRules] = useState<SlaRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Restore the authenticated session from the HttpOnly cookie.
  useEffect(() => {
    let mounted = true;

    api.getCurrentUser()
      .then(user => {
        if (mounted) {
          setCurrentUser(user);
        }
      })
      .finally(() => {
        if (mounted) {
          setAuthLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Load all initial data from backend
  const loadData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [
        deptsRes,
        regsRes,
        locsRes,
        usersRes,
        ticketsRes,
        slaRes,
        auditRes,
        settingsRes,
        statusRes
      ] = await Promise.all([
        api.fetchDepartments(),
        api.fetchRegions(),
        api.fetchLocations(),
        api.fetchUsers(),
        api.fetchTickets(activeDepartmentId),
        api.fetchSlaRules(),
        api.fetchAuditLogs(),
        api.fetchSettings(),
        api.fetchDbStatus()
      ]);

      setDepartments(Array.isArray(deptsRes) ? deptsRes : []);
      setRegions(Array.isArray(regsRes) ? regsRes : []);
      setLocations(Array.isArray(locsRes) ? locsRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      setTickets(Array.isArray(ticketsRes) ? ticketsRes : []);
      setSlaRules(Array.isArray(slaRes) ? slaRes : []);
      setAuditLogs(Array.isArray(auditRes) ? auditRes : []);
      if (settingsRes) setSettings(settingsRes);
      if (statusRes) setDbStatus(statusRes);
    } catch {
      // Gracefully continue with available state
    } finally {
      setLoading(false);
    }
  }, [activeDepartmentId, currentUser?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    setLoading(true);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } finally {
      setCurrentUser(null);
      setTickets([]);
      setUsers([]);
      setAuditLogs([]);
      setSlaRules([]);
      setSettings(null);
      setDbStatus(null);
      setActiveTab('dashboard');
    }
  };



  // Global hotkey: ⌘K to open search command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Handlers ---
  const handleCreateTicket = async (ticketData: Partial<Ticket>) => {
    try {
      const created = await api.createTicket(ticketData);
      setTickets(prev => [created, ...prev]);
      const logs = await api.fetchAuditLogs();
      setAuditLogs(logs);
      const status = await api.fetchDbStatus();
      setDbStatus(status);
    } catch (err) {
      console.error('Failed to create ticket:', err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: any) => {
    try {
      const updated = await api.updateTicket(ticketId, { status }, {
        id: currentUser!.id,
        name: currentUser!.name,
        role: currentUser!.role
      });
      setTickets(prev => prev.map(t => (t.id === ticketId ? updated : t)));
      if (selectedTicket?.id === ticketId) setSelectedTicket(updated);
      const logs = await api.fetchAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    }
  };

  const handleUpdateTicketPriority = async (ticketId: string, priority: any) => {
    try {
      const updated = await api.updateTicket(ticketId, { priority }, {
        id: currentUser!.id,
        name: currentUser!.name,
        role: currentUser!.role
      });
      setTickets(prev => prev.map(t => (t.id === ticketId ? updated : t)));
      if (selectedTicket?.id === ticketId) setSelectedTicket(updated);
      const logs = await api.fetchAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to update ticket priority:', err);
    }
  };

  const handleAssignTechnician = async (ticketId: string, techId: string, techName: string) => {
    try {
      const updated = await api.updateTicket(
        ticketId,
        { assigned_technician_id: techId || null, assigned_technician_name: techName },
        { id: currentUser!.id, name: currentUser!.name, role: currentUser!.role }
      );
      setTickets(prev => prev.map(t => (t.id === ticketId ? updated : t)));
      if (selectedTicket?.id === ticketId) setSelectedTicket(updated);
      const logs = await api.fetchAuditLogs();
      setAuditLogs(logs);
      const usersList = await api.fetchUsers();
      setUsers(usersList);
    } catch (err) {
      console.error('Failed to assign technician:', err);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await api.deleteTicket(ticketId, { id: currentUser!.id, name: currentUser!.name, role: currentUser!.role });
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      if (selectedTicket?.id === ticketId) setSelectedTicket(null);
      const logs = await api.fetchAuditLogs();
      setAuditLogs(logs);
      const status = await api.fetchDbStatus();
      setDbStatus(status);
    } catch (err) {
      console.error('Failed to delete ticket:', err);
    }
  };

  const handleAddComment = async (ticketId: string, comment: string) => {
    try {
      const newComment = await api.addTicketComment(ticketId, {
        user_id: currentUser!.id,
        user_name: currentUser!.name,
        user_role: currentUser!.role,
        comment
      });
      setTickets(prev =>
        prev.map(t => {
          if (t.id === ticketId) {
            const comments = t.comments ? [...t.comments, newComment] : [newComment];
            const updated = { ...t, comments };
            if (selectedTicket?.id === ticketId) setSelectedTicket(updated);
            return updated;
          }
          return t;
        })
      );
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleAddBranch = async (loc: Partial<Location>) => {
    try {
      const created = await api.createLocation(loc);
      setLocations(prev => [created, ...prev]);
    } catch (err) {
      console.error('Failed to add location:', err);
    }
  };

  const handleUpdateBranch = async (id: string, updates: Partial<Location>) => {
    try {
      const updated = await api.updateLocation(id, updates);
      setLocations(prev => prev.map(l => (l.id === id ? updated : l)));
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      await api.deleteLocation(id);
      setLocations(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete location:', err);
    }
  };

  const handleCreateRegion = async (name: string, code: string) => {
    try {
      const created = await api.createRegion({ name, code, status: 'ACTIVE' });
      setRegions(prev => [...prev, created]);
    } catch (err) {
      console.error('Failed to create region:', err);
    }
  };

  const handleDeleteRegion = async (id: string) => {
    try {
      await api.deleteRegion(id);
      setRegions(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Failed to delete region:', err);
    }
  };

  const handleAddUser = async (userData: Partial<User>) => {
    try {
      const created = await api.createUser(userData);
      if (!created) {
        throw new Error('User creation failed: server returned no user.');
      }
      setUsers(prev => [...prev, created]);
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    try {
      const updated = await api.updateUser(id, updates);
      setUsers(prev => prev.map(u => (u.id === id ? updated : u)));
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleAddDepartment = async (deptData: Partial<Department>) => {
    try {
      const created = await api.createDepartment(deptData);
      setDepartments(prev => [...prev, created]);
    } catch (err) {
      console.error('Failed to create department:', err);
    }
  };

  const handleUpdateDepartment = async (id: string, updates: Partial<Department>) => {
    try {
      const updated = await api.updateDepartment(id, updates);
      setDepartments(prev => prev.map(d => (d.id === id ? updated : d)));
    } catch (err) {
      console.error('Failed to update department:', err);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      await api.deleteDepartment(id);
      setDepartments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete department:', err);
    }
  };

  const handleUpdateSlaRule = async (id: string, updates: Partial<SlaRule>) => {
    try {
      const updated = await api.updateSlaRule(id, updates);
      setSlaRules(prev => prev.map(r => (r.id === id ? updated : r)));
    } catch (err) {
      console.error('Failed to update SLA rule:', err);
    }
  };

  const handleUpdateSettings = async (section: string, data: any) => {
    try {
      const updated = await api.updateSettings(section, data, currentUser!.name);
      setSettings(prev => (prev ? { ...prev, [section]: updated } : null));
      const logs = await api.fetchAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  const handleSyncDatabase = async () => {
    try {
      const res = await api.saveAndSyncDb(currentUser!.name);
      setDbStatus(res.status);
      const logs = await api.fetchAuditLogs();
      setAuditLogs(logs);
      return res;
    } catch (err) {
      console.error('Failed to sync database:', err);
      throw err;
    }
  };

  const activeDept = departments.find(d => d.id === activeDepartmentId) || departments[0] || {
    id: 'dept_surveillance',
    code: 'SEC',
    name: 'Security Operations & Surveillance',
    description: 'Centralized 24/7 surveillance monitoring and physical security.',
    is_primary: true,
    status: 'active'
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold">OPSDESK</div>
          <div className="text-sm text-slate-400 mt-2">
            Checking session...
          </div>
        </div>
      </div>
    );
  }

  // If no valid HttpOnly-cookie session exists, show the enterprise login page
  // before the general application loading state.
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09151F] text-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="mt-4 font-mono text-sm tracking-wider text-emerald-400 font-bold">
          INITIALIZING OPSDESK PORTAL
        </div>
        <div className="text-xs text-slate-400 mt-1">Connecting to Hostinger MySQL storage engine...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-emerald-500/20 selection:text-emerald-800">
      {/* 1. Header (Sticky) */}
      <Header
        currentTab={activeTab}
        departments={departments}
        activeDepartmentId={activeDepartmentId}
        onSelectDepartment={id => setActiveDepartmentId(id)}
        currentUser={currentUser!}
        onLogout={handleLogout}
        dbStatus={dbStatus}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenDbModal={() => setIsDbModalOpen(true)}
      />

      {/* 2. Navigation Pill Bar (Sticky) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        currentUser={currentUser!}
        ticketsCount={tickets.length}
      />

      {/* 3. Main View Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-6 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            department={activeDept}
            tickets={tickets}
            users={users}
            locations={locations}
            dbStatus={dbStatus}
            onNavigateTab={tab => setActiveTab(tab)}
            onSelectTicket={t => setSelectedTicket(t)}
            onOpenDbModal={() => setIsDbModalOpen(true)}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'observations' && (
          <ObservationsView
            tickets={tickets}
            users={users}
            locations={locations}
            regions={regions}
            currentUser={currentUser!}
            onOpenNewTicket={() => setIsNewTicketOpen(true)}
            onSelectTicket={t => setSelectedTicket(t)}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onUpdateTicketPriority={handleUpdateTicketPriority}
            onAssignTechnician={handleAssignTechnician}
            onDeleteTicket={handleDeleteTicket}
          />
        )}

        {activeTab === 'technician-tickets' && (
          <TechnicianTicketsView
            tickets={tickets}
            users={users}
            locations={locations}
            regions={regions}
            currentUser={currentUser!}
            onOpenNewTicket={() => setIsNewTicketOpen(true)}
            onSelectTicket={t => setSelectedTicket(t)}
            onUpdateTicketStatus={handleUpdateTicketStatus}
            onUpdateTicketPriority={handleUpdateTicketPriority}
            onAssignTechnician={handleAssignTechnician}
            onDeleteTicket={handleDeleteTicket}
          />
        )}

        {activeTab === 'locations' && (
          <LocationsView
            locations={locations}
            regions={regions}
            onAddBranch={handleAddBranch}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
            onCreateRegion={handleCreateRegion}
            onDeleteRegion={handleDeleteRegion}
            onSyncData={handleSyncDatabase}
          />
        )}

        {activeTab === 'technician-reports' && (
          <TechnicianReportsView
            users={users}
            tickets={tickets}
            onSelectTicket={t => setSelectedTicket(t)}
          />
        )}

        {activeTab === 'sla-engine' && (
          <SlaEngineView
            rules={slaRules}
            onUpdateRule={handleUpdateSlaRule}
          />
        )}

        {activeTab === 'users-teams' && (
          <UsersTeamsView
            users={users}
            departments={departments}
            currentUser={currentUser!}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onOpenManageDepartments={() => {
              setActiveTab('administration');
            }}
          />
        )}

        {activeTab === 'audit-trail' && (
          <AuditTrailView
            logs={auditLogs}
            onSyncDb={handleSyncDatabase}
          />
        )}

        {activeTab === 'administration' && (
          <AdministrationView
            settings={settings as any}
            departments={departments}
            locations={locations}
            users={users}
            logs={auditLogs}
            dbStatus={dbStatus}
            onUpdateSettings={handleUpdateSettings}
            onAddDepartment={handleAddDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onSyncDb={handleSyncDatabase}
            onOpenDbModal={() => setIsDbModalOpen(true)}
          />
        )}
      </main>

      {/* 4. Modals */}
      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          users={users}
          currentUser={currentUser!}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={handleUpdateTicketStatus}
          onUpdatePriority={handleUpdateTicketPriority}
          onAssignTechnician={handleAssignTechnician}
          onAddComment={handleAddComment}
        />
      )}

      {isNewTicketOpen && (
        <NewTicketModal
          departments={departments}
          locations={locations}
          regions={regions}
          users={users}
          currentUser={currentUser!}
          categories={[
            ...new Set([
              ...((settings?.general as any)?.customCategories || []).map(
                (c: { name: string }) => c.name
              ),
              ...ISSUE_CATEGORIES
            ])
          ]}
          onClose={() => setIsNewTicketOpen(false)}
          onSubmit={handleCreateTicket}
        />
      )}

      {isDbModalOpen && (
        <HostingerDbModal
          status={dbStatus}
          onClose={() => setIsDbModalOpen(false)}
          onTestConnection={api.testDbConnection}
          onSyncDatabase={handleSyncDatabase}
        />
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tickets={tickets}
        locations={locations}
        users={users}
        onSelectTicket={t => {
          setSelectedTicket(t);
          setActiveTab('observations');
        }}
        onNavigateTab={tab => setActiveTab(tab)}
      />
    </div>
  );
}
