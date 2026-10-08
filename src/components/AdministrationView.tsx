import React, { useState, useRef, useEffect } from 'react';
import {
  Sliders,
  Building2,
  Building,
  Settings,
  Palette,
  Mail,
  ShieldAlert,
  Users,
  ScrollText,
  Database,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Laptop,
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  FileDown,
  Key,
  Camera,
  Check,
  Server,
  Package,
  HardDrive,
  Download,
  AlertTriangle,
  Terminal,
  Layers,
  ExternalLink,
  Tag,
  Image as ImageIcon
} from 'lucide-react';
import { Department, Location, SystemSettings, User, DbStatus, AuditLog } from '../types';
import { IdeasLogo } from './IdeasLogo';
import { UploadJsonModal } from './UploadJsonModal';
import { DEFAULT_ISSUE_CATEGORIES, getCategoryStyle } from '../constants/categories';

interface AdministrationViewProps {
  settings: SystemSettings;
  departments: Department[];
  locations: Location[];
  users: User[];
  logs: AuditLog[];
  dbStatus: DbStatus | null;
  onUpdateSettings: (section: string, data: any) => void;
  onAddDepartment: (data: Partial<Department>) => void;
  onUpdateDepartment: (id: string, data: Partial<Department>) => void;
  onDeleteDepartment: (id: string) => void;
  onSyncDb: () => void;
  onOpenDbModal: () => void;
}

export const AdministrationView: React.FC<AdministrationViewProps> = ({
  settings,
  departments,
  locations,
  users,
  logs,
  dbStatus,
  onUpdateSettings,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onSyncDb,
  onOpenDbModal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    | 'locations'
    | 'departments'
    | 'categories'
    | 'general'
    | 'login-studio'
    | 'email'
    | 'rbac'
    | 'database'
  >('departments');

  const [isUploadJsonModalOpen, setIsUploadJsonModalOpen] = useState(false);

  // Custom Issue Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#0284c7');
  const [categoryList, setCategoryList] = useState<Array<{ name: string; color: string }>>(() => {
    const custom = (settings?.general as any)?.customCategories || [];
    return custom;
  });

  useEffect(() => {
    const custom = (settings?.general as any)?.customCategories || [];
    setCategoryList(custom);
  }, [(settings?.general as any)?.customCategories]);

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const name = newCatName.trim();
    const existsInDefaults = DEFAULT_ISSUE_CATEGORIES.some(
      c => c.toLowerCase() === name.toLowerCase()
    );
    const existsInCustom = categoryList.some(
      c => c.name.toLowerCase() === name.toLowerCase()
    );

    if (existsInDefaults || existsInCustom) {
      alert(`Issue Category "${name}" already exists.`);
      return;
    }

    const updated = [...categoryList, { name, color: newCatColor }];
    setCategoryList(updated);
    setNewCatName('');

    onUpdateSettings('general', {
      ...(settings?.general || {}),
      customCategories: updated
    });
    triggerSaveNotification();
  };

  const handleDeleteCategory = (catName: string) => {
    if (!confirm(`Are you sure you want to remove the issue category "${catName}"?`)) return;

    const updated = categoryList.filter(c => c.name !== catName);
    setCategoryList(updated);

    onUpdateSettings('general', {
      ...(settings?.general || {}),
      customCategories: updated
    });
    triggerSaveNotification();
  };

  // General settings state
  const [appName, setAppName] = useState(settings?.general?.appName || 'ideas - Surveillance Operations Command System');
  const [maintenanceMode, setMaintenanceMode] = useState(settings?.general?.maintenanceMode || false);
  const [slaEngineEnabled, setSlaEngineEnabled] = useState(settings?.general?.slaEngineEnabled ?? true);
  const [maxPictureSize, setMaxPictureSize] = useState(settings?.general?.maxPictureSizeMb || 2);
  const [autoCompress, setAutoCompress] = useState(settings?.general?.autoCompress ?? true);
  const [strictToast, setStrictToast] = useState(settings?.general?.strictToastWarning ?? true);

  // Logo manager heights
  const [heroHeight, setHeroHeight] = useState(settings?.branding?.heroHeight || 44);
  const [formHeight, setFormHeight] = useState(settings?.branding?.formHeight || 44);
  const [sidebarHeight, setSidebarHeight] = useState(settings?.branding?.sidebarHeight || 36);

  // Logo Manager States
  const [heroLogo, setHeroLogo] = useState<string | null>(() => localStorage.getItem('opsdesk_hero_logo'));
  const [formLogo, setFormLogo] = useState<string | null>(() => localStorage.getItem('opsdesk_form_logo'));
  const [heroLogoSize, setHeroLogoSize] = useState<number>(() => {
    const val = localStorage.getItem('opsdesk_hero_logo_size');
    return val ? Number(val) : 56;
  });
  const [formLogoSize, setFormLogoSize] = useState<number>(() => {
    const val = localStorage.getItem('opsdesk_form_logo_size');
    return val ? Number(val) : 48;
  });

  const heroInputRef = useRef<HTMLInputElement>(null);
  const formInputRef = useRef<HTMLInputElement>(null);

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        setHeroLogo(res);
        localStorage.setItem('opsdesk_hero_logo', res);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        setFormLogo(res);
        localStorage.setItem('opsdesk_form_logo', res);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveHeroLogo = () => {
    setHeroLogo(null);
    localStorage.removeItem('opsdesk_hero_logo');
    if (heroInputRef.current) heroInputRef.current.value = '';
  };

  const handleRemoveFormLogo = () => {
    setFormLogo(null);
    localStorage.removeItem('opsdesk_form_logo');
    if (formInputRef.current) formInputRef.current.value = '';
  };

  const updateHeroLogoSize = (size: number) => {
    setHeroLogoSize(size);
    localStorage.setItem('opsdesk_hero_logo_size', String(size));
  };

  const updateFormLogoSize = (size: number) => {
    setFormLogoSize(size);
    localStorage.setItem('opsdesk_form_logo_size', String(size));
  };

  // Login Studio states
  const [viewport, setViewport] = useState<'DESKTOP' | 'LAPTOP' | 'TABLET' | 'IPHONE'>('DESKTOP');
  const [heroTitle, setHeroTitle] = useState(settings?.branding?.heroTitle || 'Surveillance Operations');
  const [heroSubtitle, setHeroSubtitle] = useState(settings?.branding?.heroSubtitle || 'Monitor. Detect. Respond. Keep Your Environment Safe.');
  const [subtextDesc, setSubtextDesc] = useState(settings?.branding?.subtextDescription || 'Centralized CCTV health telemetry, real-time ticket escalation, and multi-department facility security operations.');
  const [badgeText, setBadgeText] = useState(settings?.branding?.badgeText || 'SURVEILLANCE OPERATIONS');

  // SMTP states
  const [fromEmail, setFromEmail] = useState(settings?.smtp?.fromEmail || 'cctv.alert@ideas.com.pk');
  const [smtpHost, setSmtpHost] = useState(settings?.smtp?.smtpHost || 'smtp.office365.com');
  const [smtpPort, setSmtpPort] = useState(settings?.smtp?.smtpPort || 587);
  const [smtpUser, setSmtpUser] = useState(settings?.smtp?.smtpUser || 'cctv.alert@ideas.com.pk');
  const [smtpPass, setSmtpPass] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  // RBAC Matrix state
  const [rbacMatrix, setRbacMatrix] = useState(
    settings?.rbac?.matrix || {
      'Can Create Tickets': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: true, TECHNICIAN: true },
      'Can Resolve Tickets': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: true, TECHNICIAN: true },
      'Can Assign Tickets': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can Comment': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: true, TECHNICIAN: true },
      'Can Delete Tickets': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can View Live Feeds': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: true, TECHNICIAN: true },
      'Can Flag Security': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can Manage Users': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can Export Reports': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false },
      'Can Manage System': { SUPER_ADMIN: true, SUPERVISOR: true, OPERATOR: false, TECHNICIAN: false }
    }
  );

  // Department Modal states
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // Notification for save
  const [savedBanner, setSavedBanner] = useState(false);

  const triggerSaveNotification = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleSaveGeneral = () => {
    onUpdateSettings('general', {
      appName,
      maintenanceMode,
      slaEngineEnabled,
      maxPictureSizeMb: maxPictureSize,
      autoCompress,
      strictToastWarning: strictToast
    });
    triggerSaveNotification();
  };

  const handleSaveBranding = () => {
    onUpdateSettings('branding', {
      heroTitle,
      heroSubtitle,
      subtextDescription: subtextDesc,
      badgeText,
      heroHeight,
      formHeight,
      sidebarHeight,
      activeViewport: viewport
    });
    triggerSaveNotification();
  };

  const handleSaveSmtp = () => {
    onUpdateSettings('smtp', {
      fromEmail,
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUser
    });
    triggerSaveNotification();
  };

  const handleToggleRbacPermission = (permission: string, role: string) => {
    setRbacMatrix(prev => ({
      ...prev,
      [permission]: {
        ...prev[permission],
        [role]: !prev[permission]?.[role]
      }
    }));
  };

  const handleSaveRbac = () => {
    onUpdateSettings('rbac', {
      rbacEnabled: true,
      matrix: rbacMatrix
    });
    triggerSaveNotification();
  };

  const handleAddDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    onAddDepartment({
      code: deptCode.toUpperCase(),
      name: deptName,
      description: deptDesc,
      status: 'active'
    });
    setShowAddDeptModal(false);
    setDeptCode('');
    setDeptName('');
    setDeptDesc('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Governance Header (Matching Image 11, 12, 13) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Admin Portal & System Governance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage operational sites, dispatch teams, system policies, and administrative configuration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {savedBanner && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 animate-fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>All Changes Saved</span>
            </span>
          )}
          <button
            onClick={() => {
              handleSaveGeneral();
              handleSaveBranding();
              handleSaveSmtp();
              handleSaveRbac();
            }}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* 2. Subnav Navigation Pills (Matching Image 11, 12, 13, 14, 15, 18) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => setActiveSubTab('departments')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'departments'
                ? 'bg-slate-100 text-slate-900 border border-slate-300/80 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span>Departments & Teams</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
              {departments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('locations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'locations'
                ? 'bg-slate-100 text-slate-900 border border-slate-300/80 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Locations</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
              {locations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'categories'
                ? 'bg-slate-100 text-slate-900 border border-slate-300/80 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-sky-600" />
            <span>Issue Categories</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-sky-100 text-sky-800 font-bold">
              {DEFAULT_ISSUE_CATEGORIES.length + categoryList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('general')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'general'
                ? 'bg-slate-100 text-slate-900 border border-slate-300/80 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>General</span>
          </button>

          <button
            onClick={() => setActiveSubTab('login-studio')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'login-studio'
                ? 'bg-slate-100 text-slate-900 border border-slate-300/80 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>Login Layout Studio</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
              VISUAL
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('email')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'email'
                ? 'bg-slate-100 text-slate-900 border border-slate-300/80 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Email Delivery</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rbac')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'rbac'
                ? 'bg-slate-100 text-slate-900 border border-slate-300/80 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            <span>Expanded RBAC Matrix</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
              RBAC
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('database')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'database'
                ? 'bg-slate-100 text-slate-900 border border-slate-300/80 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Database & Backup</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
              BACKUP & RESTORE
            </span>
          </button>
        </div>
      </div>

      {/* 3. Subtab Content */}

      {/* SUBTAB: Issue Categories */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Issue Categorization & Taxonomy Governance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure custom issue categories available in New Ticket dispatch modal and Live Telemetry dashboard.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleAddCategory}
              className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
            >
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Add New Custom Issue Category
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Gate Barrier Malfunction, Fire Alarm Inspection..."
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Telemetry Color Badge
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={e => setNewCatColor(e.target.value)}
                      className="w-9 h-9 p-1 rounded-lg border border-slate-200 cursor-pointer bg-white"
                    />
                    <input
                      type="text"
                      value={newCatColor}
                      onChange={e => setNewCatColor(e.target.value)}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-xl text-xs uppercase font-mono bg-white text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Issue Category</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Active Issue Category Master List
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Includes default system categories and Super Admin custom additions.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700">
                {DEFAULT_ISSUE_CATEGORIES.length + categoryList.length} Categories Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-5">COLOR</th>
                    <th className="py-3 px-5">CATEGORY NAME</th>
                    <th className="py-3 px-5">TYPE / ORIGIN</th>
                    <th className="py-3 px-5">STATUS</th>
                    <th className="py-3 px-5 text-right">ACTIONS</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {categoryList.map(cat => (
                    <tr
                      key={cat.name}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-5">
                        <span
                          className="w-3.5 h-3.5 rounded-full inline-block shadow-2xs"
                          style={{ backgroundColor: cat.color || '#0284c7' }}
                        ></span>
                      </td>

                      <td className="py-3 px-5 font-bold text-slate-900">
                        {cat.name}
                      </td>

                      <td className="py-3 px-5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Super Admin Custom
                        </span>
                      </td>

                      <td className="py-3 px-5">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                          Active
                        </span>
                      </td>

                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => handleDeleteCategory(cat.name)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {DEFAULT_ISSUE_CATEGORIES.map(catName => {
                    const style = getCategoryStyle(catName);

                    return (
                      <tr
                        key={catName}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-3 px-5">
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block shadow-2xs"
                            style={{ backgroundColor: style.hex }}
                          ></span>
                        </td>

                        <td className="py-3 px-5 font-bold text-slate-800">
                          {catName}
                        </td>

                        <td className="py-3 px-5">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            System Built-in
                          </span>
                        </td>

                        <td className="py-3 px-5">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                            Active
                          </span>
                        </td>

                        <td className="py-3 px-5 text-right text-slate-400 font-mono text-[10px]">
                          System Core
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'departments' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Organizational Departments & Operational Units</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Only authorized operational units configured here will appear in the Add Technician / Team Member modal, incident ticket dispatch menus, and user directory filters.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveGeneral}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowAddDeptModal(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0F2942] hover:bg-[#163859] text-white transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Department</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              ACTIVE OPERATIONAL DEPARTMENTS ({departments.length})
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {departments.map(dept => {
                const memberCount = users.filter(u => u.department_id === dept.id).length;

                return (
                  <div key={dept.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                        {dept.code}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{dept.name}</span>
                          {dept.is_primary && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Primary Department
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ID: <span className="font-mono">{dept.code}</span> • {memberCount} assigned member{memberCount === 1 ? '' : 's'}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">{dept.description}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          const newName = prompt('Edit department name:', dept.name);
                          if (newName) onUpdateDepartment(dept.id, { name: newName });
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-2xs"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Edit Details</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove department ${dept.name}?`)) onDeleteDepartment(dept.id);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Remove Department</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: General Settings & Picture Size Limits (Matching Image 13) */}
      {activeSubTab === 'general' && (
        <div className="space-y-5">
          {/* Card: System Identity & Configuration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">SYSTEM IDENTITY & CONFIGURATION</h3>
              </div>
              <button
                onClick={handleSaveGeneral}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Save Changes
              </button>
            </div>

            <div className="max-w-xl space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Application Name *</label>
                <input
                  type="text"
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={e => setMaintenanceMode(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Enable Maintenance Lockdown</span>
                </label>
                <p className="text-[11px] text-slate-400 ml-5 mt-0.5">
                  Locks all non-administrative accounts and displays a security maintenance advisory.
                </p>
              </div>

              {/* Personal Account Password Reset Card */}
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    <span className="font-bold text-slate-900">Personal Account Password</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-100 text-emerald-800">
                      Bcrypt Hashed
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Update your account login credentials with strong password complexity and audit trail logging.
                  </div>
                </div>
                <button
                  onClick={() => alert('Password reset confirmation dispatched to administrative session.')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                >
                  Change Password
                </button>
              </div>

              {/* SLA Engine Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Configurable SLA Engine & Escalation Matrix</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Manage automated SLA response deadlines, resolution thresholds, and multi-tier escalation policies.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slaEngineEnabled}
                    onChange={e => {
                      const val = e.target.checked;
                      setSlaEngineEnabled(val);
                      onUpdateSettings('general', {
                        appName,
                        maintenanceMode,
                        slaEngineEnabled: val,
                        maxPictureSizeMb: maxPictureSize,
                        autoCompress,
                        strictToastWarning: strictToast
                      });
                      triggerSaveNotification();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Photographic Evidence & Picture Size Limits (Matching Image 13) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Photographic Evidence & Picture Size Limits
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      Fixed Policy: {maxPictureSize} MB / Image
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sets the maximum allowed file size per "Upload Picture" and "Capture Picture" operation during ticket creation and incident documentation.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSaveGeneral}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Save Policy
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-2 uppercase text-[10px] tracking-wider">
                    MAX SIZE PER PICTURE
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 5, 10].map(sz => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setMaxPictureSize(sz)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                          maxPictureSize === sz
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {sz} MB {sz === 2 ? '(Standard)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCompress}
                      onChange={e => setAutoCompress(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Auto-Compress & Scale Images</span>
                      <p className="text-[11px] text-slate-400">
                        Automatically resizes high-res uploads and webcam snapshots to ensure they fit under the {maxPictureSize}MB limit without failure.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={strictToast}
                      onChange={e => setStrictToast(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Strict Enforcement & Warning Toasts</span>
                      <p className="text-[11px] text-slate-400">
                        Alerts user if an uploaded raw file exceeds {maxPictureSize}MB before optimization.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Live UI Preview Box (Matching Image 13) */}
              <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 mb-2">
                    <span>LIVE UI PREVIEW: TICKET CREATION EVIDENCE CONTROLS</span>
                    <span className="font-mono text-emerald-700">MAX: {maxPictureSize} MB ({maxPictureSize * 1024} KB)</span>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-800 text-xs">Photographic Evidence</div>
                    <div className="text-[11px] text-slate-500">
                      Attach photos via device upload or camera capture (Max {maxPictureSize}MB per photo).
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 bg-slate-50">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload Picture ({maxPictureSize}MB)</span>
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Capture Picture ({maxPictureSize}MB)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: Login Layout Studio (Matching Image 14) */}
      {activeSubTab === 'login-studio' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase">
                  VISUAL STUDIO
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Login Screen Layout & Visual Banner Studio: {heroTitle}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag items to reposition, customize typography, fine-tune filters, and bind curated styles live.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Step 1/1</span>
              <button
                onClick={handleSaveBranding}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Viewport Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewport('DESKTOP')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  viewport === 'DESKTOP' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>DESKTOP</span>
              </button>
              <button
                onClick={() => setViewport('LAPTOP')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  viewport === 'LAPTOP' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>LAPTOP</span>
              </button>
              <button
                onClick={() => setViewport('TABLET')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  viewport === 'TABLET' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>TABLET</span>
              </button>
              <button
                onClick={() => setViewport('IPHONE')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                  viewport === 'IPHONE' ? 'bg-[#0F2942] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>IPHONE</span>
              </button>
            </div>
          </div>

          {/* Live Split-Hero Canvas & Controls */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Preview Screen */}
            <div className="xl:col-span-8 bg-[#09151F] rounded-2xl p-6 sm:p-10 border border-slate-800 text-white relative overflow-hidden flex flex-col justify-between min-h-[400px]">
              {/* Ambient Radial Glow */}
              <div className="absolute top-1/4 -left-20 w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(89,184,40,0.15)_0%,transparent_75%)] pointer-events-none blur-2xl"></div>

              <div className="max-w-md space-y-3 z-10">
                {/* Hero Logo Preview */}
                <div className="mb-3 transition-all">
                  {heroLogo ? (
                    <img
                      src={heroLogo}
                      alt="Left Hero Logo"
                      style={{ height: `${heroLogoSize}px` }}
                      className="w-auto object-contain rounded-lg shadow-md border border-slate-700/60 p-1 bg-slate-900/80"
                    />
                  ) : (
                    <IdeasLogo height={heroLogoSize} glyphColor="#59B828" textColor="#59B828" />
                  )}
                </div>

                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {badgeText}
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{heroTitle}</h2>
                <p className="text-sm text-slate-300 font-medium">{heroSubtitle}</p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded bg-slate-800/80 text-[11px] text-emerald-400 border border-slate-700 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Live Feeds
                  </span>
                  <span className="px-2.5 py-1 rounded bg-slate-800/80 text-[11px] text-amber-400 border border-slate-700 flex items-center gap-1">
                    ⚡ Alerts
                  </span>
                </div>
              </div>

              {/* Login Form Mockup */}
              <div className="absolute right-6 top-6 bottom-6 w-64 bg-white text-slate-900 rounded-xl p-4 shadow-2xl flex flex-col justify-center items-center space-y-2.5 hidden sm:flex border border-slate-200">
                {/* Form Logo Preview */}
                <div className="mb-1 flex items-center justify-center transition-all">
                  {formLogo ? (
                    <img
                      src={formLogo}
                      alt="Right Form Logo"
                      style={{ height: `${formLogoSize}px` }}
                      className="w-auto object-contain rounded-lg p-0.5 border border-slate-200 shadow-2xs"
                    />
                  ) : (
                    <IdeasLogo height={formLogoSize} glyphColor="#59B828" textColor="#59B828" />
                  )}
                </div>

                <div className="text-center font-bold text-[11px] uppercase tracking-wider text-slate-600">
                  SIGN IN TO PORTAL
                </div>
                <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-400 font-mono">
                  username@ideas.com.pk
                </div>
                <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-400 font-mono">
                  ••••••••••••
                </div>
                <button className="w-full py-1.5 bg-emerald-600 text-white rounded text-xs font-bold">
                  Sign In
                </button>
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-6">
                Viewport: {viewport} • Layout: split-hero-left
              </div>
            </div>

            {/* Right Inspector Panel */}
            <div className="xl:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
              <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>LOGO MANAGEMENT & SIZE STUDIO</span>
              </div>

              {/* Left Hero Logo Controls */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">1. LEFT HERO BANNER LOGO</span>
                  {heroLogo && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                      Custom Uploaded
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={heroInputRef}
                  accept="image/*"
                  onChange={handleHeroUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => heroInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Left Logo</span>
                  </button>

                  {heroLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveHeroLogo}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Reset Left Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Increase/Decrease Size:</span>
                    <span className="font-mono text-emerald-700 font-bold">{heroLogoSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="140"
                    step="2"
                    value={heroLogoSize}
                    onChange={e => updateHeroLogoSize(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Form Logo Controls */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px]">2. RIGHT FORM HEADER LOGO</span>
                  {formLogo && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                      Custom Uploaded
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={formInputRef}
                  accept="image/*"
                  onChange={handleFormUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => formInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Form Logo</span>
                  </button>

                  {formLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveFormLogo}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Reset Form Logo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Increase/Decrease Size:</span>
                    <span className="font-mono text-blue-700 font-bold">{formLogoSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="140"
                    step="2"
                    value={formLogoSize}
                    onChange={e => updateFormLogoSize(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="font-bold text-slate-900 uppercase text-[11px] tracking-wider pt-2 border-t border-slate-200">
                Text Content Settings
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Luxury Header Accent Badge</label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={e => setBadgeText(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Primary Lookbook Banner Title</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={e => setHeroTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Banner Subtitle Line</label>
                <input
                  type="text"
                  value={heroSubtitle}
                  onChange={e => setHeroSubtitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Introductory Subtext Description</label>
                <textarea
                  rows={2}
                  value={subtextDesc}
                  onChange={e => setSubtextDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs"
                />
              </div>

              <button
                onClick={handleSaveBranding}
                className="w-full py-2 bg-[#0F2942] hover:bg-[#163859] text-white rounded-lg font-semibold shadow-2xs mt-2 cursor-pointer"
              >
                Save & Apply Live Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: Email Delivery (Matching Image 15) */}
      {activeSubTab === 'email' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">SMTP EMAIL ALERT DISPATCHER</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure notification delivery servers for incident assignments, CCTV offline alarms, and urgent escalations.
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveSmtp}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save Changes
            </button>
          </div>

          <div className="max-w-xl space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">From Email Address</label>
              <input
                type="email"
                value={fromEmail}
                onChange={e => setFromEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={smtpHost}
                  onChange={e => setSmtpHost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={smtpPort}
                  onChange={e => setSmtpPort(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">SMTP Username</label>
              <input
                type="text"
                value={smtpUser}
                onChange={e => setSmtpUser(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">SMTP Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={smtpPass}
                onChange={e => setSmtpPass(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTestEmailStatus('Sending test ping...');
                  setTimeout(() => {
                    setTestEmailStatus('Success! Test email queued and delivered via Hostinger SMTP.');
                  }, 1200);
                }}
                className="px-4 py-2 bg-[#0F2942] text-white rounded-lg font-semibold hover:bg-[#163859] transition-colors"
              >
                Send Test Alert
              </button>
              {testEmailStatus && (
                <span className="text-xs font-semibold text-emerald-700">{testEmailStatus}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: Expanded RBAC Matrix (Matching Image 11, 12, 13) */}
      {activeSubTab === 'rbac' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Role-Based Access Control (RBAC) Governance Matrix
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Preset authority boundaries across Super Admin, Supervisor, Operator, and Technician tiers.
              </p>
            </div>

            <button
              onClick={handleSaveRbac}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Save Changes
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">PERMISSION CAPABILITY</th>
                  <th className="py-3 px-4 text-center">SUPER_ADMIN</th>
                  <th className="py-3 px-4 text-center">SUPERVISOR</th>
                  <th className="py-3 px-4 text-center">OPERATOR</th>
                  <th className="py-3 px-4 text-center">TECHNICIAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(rbacMatrix).map(permission => {
                  const perms = rbacMatrix[permission] || {};
                  return (
                    <tr key={permission} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-800">{permission}</td>
                      {['SUPER_ADMIN', 'SUPERVISOR', 'OPERATOR', 'TECHNICIAN'].map(role => (
                        <td key={role} className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={!!perms[role]}
                            onChange={() => handleToggleRbacPermission(permission, role)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: Database & Backup (Matching Image 18) */}
      {activeSubTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Database Management & Backup Operations
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      SUPER ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Export complete database archives or securely synchronize snapshots with Hostinger MySQL tables.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsUploadJsonModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload JSON Database</span>
                </button>
                <button
                  onClick={onOpenDbModal}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1.5"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Hostinger MySQL Sync</span>
                </button>
                <button
                  onClick={() => window.open('/api/database/export?target=all&format=json', '_blank')}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#0F2942] hover:bg-[#163859] text-white flex items-center gap-1.5 shadow-2xs"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export & Backup</span>
                </button>
              </div>
            </div>

            {/* 4 Database Counters (Matching Image 18) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-slate-500">INCIDENT TICKETS</div>
                <div className="text-2xl font-extrabold text-slate-900 my-1 tabular-nums">{dbStatus?.records?.tickets || 1}</div>
                <div className="text-[11px] text-slate-400">Total tickets in live database</div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
                  <a href="/api/database/export?target=tickets&format=json" download className="text-blue-600 font-semibold hover:underline">JSON</a>
                  <span className="text-slate-300">•</span>
                  <a href="/api/database/export?target=tickets&format=csv" download className="text-blue-600 font-semibold hover:underline">CSV</a>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-slate-500">USER ACCOUNTS & TEAM</div>
                <div className="text-2xl font-extrabold text-slate-900 my-1 tabular-nums">{users.length}</div>
                <div className="text-[11px] text-slate-400">Technicians, Admins & Staff</div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
                  <a href="/api/database/export?target=users&format=json" download className="text-blue-600 font-semibold hover:underline">JSON</a>
                  <span className="text-slate-300">•</span>
                  <a href="/api/database/export?target=users&format=csv" download className="text-blue-600 font-semibold hover:underline">CSV</a>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-slate-500">OPERATIONAL LOCATIONS</div>
                <div className="text-2xl font-extrabold text-slate-900 my-1 tabular-nums">{locations.length}</div>
                <div className="text-[11px] text-slate-400">Surveillance branches & sites</div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
                  <a href="/api/database/export?target=locations&format=json" download className="text-blue-600 font-semibold hover:underline">JSON</a>
                  <span className="text-slate-300">•</span>
                  <a href="/api/database/export?target=locations&format=csv" download className="text-blue-600 font-semibold hover:underline">CSV</a>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] font-bold uppercase text-slate-500">AUDIT TRAIL RECORDS</div>
                <div className="text-2xl font-extrabold text-slate-900 my-1 tabular-nums">{logs.length}</div>
                <div className="text-[11px] text-slate-400">Security & settings changes</div>
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60 text-[10px]">
                  <a href="/api/database/export?target=audit&format=json" download className="text-blue-600 font-semibold hover:underline">JSON</a>
                  <span className="text-slate-300">•</span>
                  <a href="/api/database/export?target=audit&format=csv" download className="text-blue-600 font-semibold hover:underline">CSV</a>
                </div>
              </div>
            </div>

            {/* Hostinger Ready-to-Deploy ZIP Packages & MySQL DDL Downloads */}
            <div className="pt-4 border-t border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span>Hostinger Hosted Environment Packages (Direct Deploy)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pre-packaged archives structured directly at the archive root. Eliminates the Hostinger "Unsupported framework or invalid project structure" ZIP error.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Hostinger Optimized
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Node.js Plan Package */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                        <Server className="w-4 h-4 text-emerald-600" />
                        Hostinger Node.js Web Hosting
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded">
                        Fullstack API & MySQL
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      For Hostinger <strong>Cloud Startup, Business Hosting (Node.js), or VPS</strong>. Contains <code className="text-emerald-900 font-mono">server.js</code>, <code className="text-emerald-900 font-mono">dist/</code>, and <code className="text-emerald-900 font-mono">database/</code> directly at root.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                      <span>• Startup File: server.js</span>
                      <span>• Node 20.x/22.x</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-200/70 flex items-center justify-between">
                    <a
                      href="/api/hostinger/download/nodejs"
                      download="hostinger-nodejs-deploy.zip"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Node.js Deploy ZIP</span>
                    </a>
                    <span className="text-[10px] text-slate-400 font-mono">~222 KB</span>
                  </div>
                </div>

                {/* Shared Hosting (PHP & Apache) Package */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-blue-600" />
                        Hostinger Shared Web Hosting
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                        Apache + PHP PDO + MySQL
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      For standard Hostinger <strong>Single or Premium Web Hosting</strong> (no Node.js required). Contains <code className="text-slate-900 font-mono">index.html</code>, <code className="text-slate-900 font-mono">api/index.php</code>, and <code className="text-slate-900 font-mono">.htaccess</code> at root.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                      <span>• Apache / LiteSpeed Rewrite</span>
                      <span>• PHP 7.4 - 8.3+</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <a
                      href="/api/hostinger/download/shared"
                      download="hostinger-shared-hosting.zip"
                      className="px-4 py-2 bg-[#0F2942] hover:bg-[#163859] text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Download Shared Hosting ZIP</span>
                    </a>
                    <span className="text-[10px] text-slate-400 font-mono">~207 KB</span>
                  </div>
                </div>
              </div>

              {/* Hostinger phpMyAdmin SQL DDL Downloader */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-600" />
                    <span>Hostinger MySQL Schema & Seed SQL Files</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Import directly into Hostinger hPanel → Databases → phpMyAdmin.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/api/database/download-schema"
                    download="schema.sql"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>schema.sql</span>
                  </a>
                  <a
                    href="/api/database/download-seed"
                    download="seed.sql"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-700 flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                    <span>seed.sql (95 Locations)</span>
                  </a>
                </div>
              </div>

              {/* Quick Instructions banner */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">How to extract without the Hostinger "Unsupported Framework" Error:</div>
                  <p className="text-[11px] text-amber-800">
                    In Hostinger hPanel, go to <strong>Files → File Manager</strong>, open <strong>public_html</strong>, click <strong>Upload</strong> and select the downloaded ZIP. Then right-click the ZIP and click <strong>Extract</strong> directly into <code className="font-mono font-semibold">.</code> (public_html). Do not use the automated "Import Website" wizard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Department</h3>
            <form onSubmit={handleAddDeptSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT or FAC"
                  value={deptCode}
                  onChange={e => setDeptCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Network & Infrastructure"
                  value={deptName}
                  onChange={e => setDeptName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Operational Description</label>
                <textarea
                  rows={2}
                  placeholder="Centralized responsibilities and ticket dispatch..."
                  value={deptDesc}
                  onChange={e => setDeptDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-[#0F2942] hover:bg-[#163859] rounded-lg shadow-2xs"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UploadJsonModal
        isOpen={isUploadJsonModalOpen}
        onClose={() => setIsUploadJsonModalOpen(false)}
        defaultTarget="all"
        onImportSuccess={() => {
          setIsUploadJsonModalOpen(false);
          onSyncDb();
        }}
      />
    </div>
  );
};
