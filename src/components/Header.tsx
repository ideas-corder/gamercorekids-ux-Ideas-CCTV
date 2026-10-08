import React, { useState, useEffect } from 'react';
import { Search, Bell, CheckCircle2, AlertTriangle, Shield, RefreshCw, Database, ChevronDown, LogOut, Sun, Moon } from 'lucide-react';
import { Department, User, DbStatus } from '../types';
import { IdeasLogo } from './IdeasLogo';

interface HeaderProps {
  currentTab: string;
  departments: Department[];
  activeDepartmentId: string;
  onSelectDepartment: (id: string) => void;
  currentUser: User;
  onLogout: () => void;
  dbStatus: DbStatus | null;
  onOpenCommandPalette: () => void;
  onOpenDbModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  departments,
  activeDepartmentId,
  onSelectDepartment,
  currentUser,
  onLogout,
  dbStatus,
  onOpenCommandPalette,
  onOpenDbModal
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDeptMenu, setShowDeptMenu] = useState(false);

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('opsdesk_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  useEffect(() => {
    const isDark = themeMode === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    if (isDark) {
      document.body.className = 'bg-[#07121E] text-slate-100 font-sans';
    } else {
      document.body.className = 'bg-slate-50 text-slate-900 font-sans';
    }
  }, [themeMode]);

  const handleThemeChange = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    localStorage.setItem('opsdesk_theme', mode);
  };

  const activeDept = departments.find(d => d.id === activeDepartmentId) || departments[0];

  const recentAlerts = [
    { id: 1, title: 'CCTV Stream Normalized', time: '4m ago', type: 'info', location: 'Agency Jaranwala' },
    { id: 2, title: 'New Incident CMP-2026-531656', time: '12m ago', type: 'warning', location: 'Agency Jaranwala' },
    { id: 3, title: 'Hostinger MySQL Heartbeat OK', time: '20m ago', type: 'success', location: 'Database Cluster' }
  ];

  return (
    <header className="bg-gradient-to-r from-[#06121E] via-[#0D2235] to-[#081827] text-white border-b border-slate-800/90 sticky top-0 z-30 shadow-xl backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Current View */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <IdeasLogo size="sm" glyphColor="#59B828" textColor="#59B828" />
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-[#59B828]/15 text-[#59B828] border border-[#59B828]/40 uppercase shadow-2xs">
              OPS DESK
            </span>
          </div>

          <div className="h-5 w-px bg-slate-800"></div>

          <h1 className="text-lg lg:text-xl font-extrabold tracking-tight text-white capitalize drop-shadow-xs">
            {currentTab.replace('-', ' ')}
          </h1>

          {/* Department Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDeptMenu(!showDeptMenu)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#59B828] animate-pulse"></span>
              <span className="truncate max-w-[130px] sm:max-w-none">{activeDept?.name || 'All Departments'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showDeptMenu && (
              <div className="absolute left-0 mt-2 w-72 bg-[#0B1827] border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fade-in text-white">
                <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                  Switch Operational Scope
                </div>
                <button
                  onClick={() => {
                    onSelectDepartment('all');
                    setShowDeptMenu(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
                    activeDepartmentId === 'all' ? 'text-[#59B828] font-bold bg-[#59B828]/10' : 'text-slate-300'
                  }`}
                >
                  <span>All Operational Units (Global)</span>
                  {activeDepartmentId === 'all' && <CheckCircle2 className="w-4 h-4 text-[#59B828]" />}
                </button>
                {departments.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => {
                      onSelectDepartment(dept.id);
                      setShowDeptMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
                      activeDepartmentId === dept.id ? 'text-[#59B828] font-bold bg-[#59B828]/10' : 'text-slate-300'
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate font-bold">{dept.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{dept.code} · {dept.description}</div>
                    </div>
                    {activeDepartmentId === dept.id && <CheckCircle2 className="w-4 h-4 text-[#59B828] shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Portal with ⌘K */}
        <div className="flex-1 max-w-xl hidden md:block">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-4 py-2 text-xs bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 rounded-xl text-slate-400 hover:text-slate-200 transition-all shadow-inner group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-[#59B828] group-hover:scale-110 transition-transform" />
              <span className="text-xs text-slate-300 font-medium">Search portal, branch, ticket #, or technician...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-[#59B828] bg-[#59B828]/15 border border-[#59B828]/40 rounded-lg shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: DB Status Pill, Notification Bell, User Account */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Hostinger DB Status Trigger */}
          <button
            onClick={onOpenDbModal}
            title="Inspect Hostinger MySQL Connectivity & Sync Ledger"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#59B828]/15 hover:bg-[#59B828]/25 border border-[#59B828]/40 rounded-xl text-xs font-bold text-[#59B828] transition-all cursor-pointer shadow-2xs"
          >
            <Database className="w-3.5 h-3.5 text-[#59B828]" />
            <span>MySQL: {dbStatus?.connected ? 'Connected' : 'Sync Active'}</span>
            <span className="w-2 h-2 rounded-full bg-[#59B828] animate-ping"></span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#06121E]"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0B1827] border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-white animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live System Alerts</span>
                  <span className="text-[10px] text-[#59B828] font-mono font-bold">3 unread</span>
                </div>
                <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
                  {recentAlerts.map(alert => (
                    <div key={alert.id} className="p-3 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                        <span>{alert.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{alert.time}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{alert.location}</div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-800 text-center">
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-xs text-[#59B828] hover:underline font-bold cursor-pointer"
                  >
                    Mark all alerts as acknowledged
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-slate-800"></div>

          {/* User Account */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-2 ring-[#59B828]/50">
                  {currentUser.avatar_initials || 'SU'}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#59B828] border-2 border-[#06121E] rounded-full"></span>
              </div>

              <div className="hidden lg:block">
                <div className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-mono font-bold text-[#59B828] uppercase tracking-wider">
                  {currentUser.role}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0B1827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 text-slate-900 dark:text-white animate-fade-in">
                {/* User Info Header */}
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    {currentUser.name}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {currentUser.email}
                  </div>

                  <div className="mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#59B828]/15 text-[#59B828] border border-[#59B828]/30">
                    {currentUser.role} · Active Session
                  </div>
                </div>

                {/* Appearance / Light & Dark Mode Selector */}
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Appearance Theme</span>
                    <span className="text-[#59B828] font-mono font-bold">{themeMode.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        themeMode === 'light'
                          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        themeMode === 'dark'
                          ? 'bg-[#0F2942] text-white shadow-sm ring-1 ring-slate-700'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5 text-sky-400" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>

                {/* Action Links */}
                <div className="p-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onOpenDbModal();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Database className="w-3.5 h-3.5 text-[#59B828]" />
                    <span>Hostinger MySQL Sync Status</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
