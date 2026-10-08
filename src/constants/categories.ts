export const ISSUE_CATEGORIES = [
  'Access Violation',
  'Stock Mismanagement',
  'Stock Handling-Misuse',
  'Cash Till SOP Violation',
  'Cash Handling',
  'Security Guard Sleeping',
  'Security Guard Missing',
  'Security Guard Negligence',
  'CCTV CAM Issue',
  'NVR Issue',
  'NVR Recording Issue',
  'NVR HDD Issue',
  'Security Alarm Triggered',
  'Customer Service',
  'Safety Violation',
  'Stock Inventory',
  'Sop Violation',
  'Fumigation Needed',
  'Hygiene Issue',
  'Suspicious Activity',
  'Short Staff',
  'Store Late Open',
  'Safety Observation',
  'Routine Check',
  'Security Incident',
  'Custom'
] as const;

export const CATEGORY_COLORS: Record<string, { hex: string; bg: string; text: string; border: string }> = {
  'Access Violation': { hex: '#ef4444', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Stock Mismanagement': { hex: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'Stock Handling-Misuse': { hex: '#ea580c', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  'Cash Till SOP Violation': { hex: '#dc2626', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'Cash Handling': { hex: '#d97706', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Security Guard Sleeping': { hex: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Security Guard Missing': { hex: '#7c3aed', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  'Security Guard Negligence': { hex: '#6366f1', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'CCTV CAM Issue': { hex: '#0284c7', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'NVR Issue': { hex: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'NVR Recording Issue': { hex: '#1d4ed8', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  'NVR HDD Issue': { hex: '#0369a1', bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300' },
  'Security Alarm Triggered': { hex: '#b91c1c', bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
  'Customer Service': { hex: '#06b6d4', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'Safety Violation': { hex: '#e11d48', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  'Stock Inventory': { hex: '#eab308', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  'Sop Violation': { hex: '#c026d3', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  'Fumigation Needed': { hex: '#14b8a6', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Hygiene Issue': { hex: '#0d9488', bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  'Suspicious Activity': { hex: '#9333ea', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  'Short Staff': { hex: '#64748b', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  'Store Late Open': { hex: '#475569', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  'Safety Observation': { hex: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Routine Check': { hex: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  'Security Incident': { hex: '#dc2626', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  'Custom': { hex: '#d946ef', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  'GENERAL': { hex: '#0284c7', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'HARDWARE / CAMERA': { hex: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'NETWORK / CONNECTIVITY': { hex: '#06b6d4', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'ACCESS CONTROL': { hex: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'HVAC / CHILLER': { hex: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' }
};

const FALLBACK_PALETTE = [
  { hex: '#0284c7', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  { hex: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  { hex: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  { hex: '#ef4444', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  { hex: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  { hex: '#06b6d4', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  { hex: '#f97316', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { hex: '#ec4899', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  { hex: '#14b8a6', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' }
];

export const DEFAULT_ISSUE_CATEGORIES = ISSUE_CATEGORIES;

export function getCategoryStyle(catName: string, customCategories?: Array<{ name: string; color?: string }>) {
  if (customCategories && Array.isArray(customCategories)) {
    const found = customCategories.find(c => typeof c === 'object' && c?.name && c.name.toLowerCase() === catName.toLowerCase());
    if (found?.color) {
      return {
        hex: found.color,
        bg: 'bg-slate-50',
        text: 'text-slate-800',
        border: 'border-slate-200'
      };
    }
  }
  if (CATEGORY_COLORS[catName]) {
    return CATEGORY_COLORS[catName];
  }
  let hash = 0;
  for (let i = 0; i < catName.length; i++) {
    hash = catName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}
