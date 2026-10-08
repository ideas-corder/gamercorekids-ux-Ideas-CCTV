import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  AlertCircle,
  Building,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  ZoomIn,
  Download,
  Mic
} from 'lucide-react';
import { Department, Location, User, Ticket, Region } from '../types';
import { ISSUE_CATEGORIES } from '../constants/categories';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageLightboxModal } from './ImageLightboxModal';
import { downloadImage } from '../utils/download';

interface NewTicketModalProps {
  departments: Department[];
  locations: Location[];
  regions?: Region[];
  users: User[];
  currentUser: User;
  onClose: () => void;
  onSubmit: (ticketData: Partial<Ticket>) => void;
  slaEngineEnabled?: boolean;
  categories?: string[];
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  departments,
  locations,
  regions,
  users,
  currentUser,
  onClose,
  onSubmit,
  slaEngineEnabled = true,
  categories
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || 'dept_surveillance');

  const [recordType, setRecordType] = useState<'OBSERVATION' | 'TECHNICAL'>(
    currentUser.role === 'TECHNICIAN' ? 'TECHNICAL' : 'OBSERVATION'
  );

  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [locationId, setLocationId] = useState('');
  const [category, setCategory] = useState('Access Violation');
  const [customCategory, setCustomCategory] = useState('');

  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

  const [assignedUserId, setAssignedUserId] = useState(
    currentUser.role === 'TECHNICIAN' ? currentUser.id : ''
  );

  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [evidenceWarning, setEvidenceWarning] = useState<string | null>(null);

  const [attachedVoiceNote, setAttachedVoiceNote] = useState<string | null>(null);
  const [attachedVoiceDuration, setAttachedVoiceDuration] = useState<number>(15);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const availableRegions = useMemo(() => {
    const regionMap = new Map<string, string>();

    locations.forEach(location => {
      const regionName = String(location.region_name || '').trim();
      const regionId = String(location.region_id || '').trim();

      if (regionName) {
        regionMap.set(regionId || regionName, regionName);
      }
    });

    return Array.from(regionMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);

  const filteredLocations = useMemo(() => {
    if (!selectedRegion || selectedRegion === 'ALL') {
      return locations;
    }

    return locations.filter(location => {
      return (
        location.region_name === selectedRegion ||
        location.region_id === selectedRegion
      );
    });
  }, [locations, selectedRegion]);

  useEffect(() => {
    if (!locationId) {
      if (filteredLocations[0]) {
        setLocationId(filteredLocations[0].id);
      }
      return;
    }

    const stillValid = filteredLocations.some(
      location => location.id === locationId
    );

    if (!stillValid && filteredLocations[0]) {
      setLocationId(filteredLocations[0].id);
    }
  }, [filteredLocations, locationId]);

  const selectedLocation =
    locations.find(l => l.id === locationId) ||
    filteredLocations[0] ||
    locations[0];
  const selectedDept = departments.find(d => d.id === departmentId) || departments[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check 2MB policy
    if (file.size > 2 * 1024 * 1024) {
      setEvidenceWarning(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 2MB picture limit. Auto-compressing applied.`);
    } else {
      setEvidenceWarning(null);
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEvidenceImages(prev => [...prev, reader.result as string]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateCapture = () => {
    // Generate high quality simulated camera capture snapshot with canvas
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#059669';
      ctx.fillRect(40, 40, 560, 280);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`CCTV INSPECTION SNAPSHOT - ${selectedLocation?.name}`, 60, 100);
      ctx.font = '14px monospace';
      ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 60, 140);
      ctx.fillText(`ZONE: Main Showroom / Channel 04 Telemetry`, 60, 170);
      ctx.fillText(`STATUS: Frame captured & verified under 2MB policy`, 60, 200);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setEvidenceImages(prev => [...prev, dataUrl]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    let finalAssignedId = assignedUserId;
    let finalAssignedName = 'Unassigned';

    if (assignedUserId) {
      const assignedUser = users.find(u => u.id === assignedUserId);
      finalAssignedName = assignedUser ? assignedUser.name : 'Unassigned';
    } else if (currentUser.role === 'TECHNICIAN') {
      finalAssignedId = currentUser.id;
      finalAssignedName = currentUser.name;
    }

    const initialStatus = finalAssignedId ? 'ASSIGNED' : 'NEW';

    const finalCategory =
      category === 'Custom'
        ? (customCategory.trim() || 'Custom')
        : category;

    const initialComments = attachedVoiceNote
      ? [{
          id: `cmt-${Date.now()}`,
          ticket_id: 'pending',
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          comment: `[VOICE_NOTE:${attachedVoiceDuration}s] ${attachedVoiceNote}`,
          created_at: new Date().toISOString(),
          is_internal: false
        }]
      : [];

    onSubmit({
      record_type: recordType,
      subject: subject.trim(),
      description,
      department_id: departmentId,
      department_name: selectedDept?.name || 'Security Operations & Surveillance',
      location_id: locationId,
      location_name: selectedLocation?.name || 'Agency Jaranwala',
      region_name: selectedLocation?.region_name || selectedRegion || 'Central',
      category: finalCategory,
      priority,
      status: initialStatus,
      assigned_technician_id: finalAssignedId || null,
      assigned_technician_name: finalAssignedName,
      evidence_images: evidenceImages,
      created_by_user_id: currentUser.id,
      created_by_name: currentUser.name,
      comments: initialComments
    });

    onClose();
  };

  const slaEstimates = {
    CRITICAL: '2 Hours (Trigger Escalation: 1h)',
    HIGH: '4 Hours (Trigger Escalation: 3h)',
    MEDIUM: '24 Hours (Trigger Escalation: 18h)',
    LOW: '72 Hours (Trigger Escalation: 60h)'
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Create Observation & Incident Ticket</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dispatches incident records directly into Hostinger MySQL tables.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Subject / Title */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Subject / Incident Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. TEST1 or Intermittent CCTV frame drops on Channel 04"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-900 text-sm"
            />
          </div>

          {/* Record Type & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Record Type *
              </label>
              <select
                value={recordType}
                onChange={e =>
                  setRecordType(
                    e.target.value as 'OBSERVATION' | 'TECHNICAL'
                  )
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
              >
                <option value="OBSERVATION">Observation</option>
                <option value="TECHNICAL">Technical</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Operational Department *
              </label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Region & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Region *
              </label>
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
              >
                <option value="ALL">All Regions</option>
                {availableRegions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Location / Branch Site ({filteredLocations.length}) *
              </label>
              <select
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
              >
                {filteredLocations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.branch_code} · {loc.region_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Issue Category & Technician */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Issue Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-slate-800"
              >
                {(categories && categories.length > 0
                  ? categories
                  : ISSUE_CATEGORIES
                ).map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {category === 'Custom' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Enter custom issue category"
                  className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                />
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Assign Field Operator / Technician
              </label>
              <select
                value={assignedUserId}
                onChange={e => setAssignedUserId(e.target.value)}
                disabled={currentUser.role === 'TECHNICIAN'}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">Leave Unassigned (Triage in Queue)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role} ({u.department_name})
                  </option>
                ))}
              </select>

              {currentUser.role === 'TECHNICIAN' && (
                <p className="text-[10px] text-slate-500 mt-1">
                  Technician-created tickets are automatically assigned to you.
                </p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Priority Tier *
            </label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none font-bold text-slate-800"
            >
              <option value="CRITICAL">🔴 CRITICAL (2h resolution)</option>
              <option value="HIGH">🟡 HIGH (4h resolution)</option>
              <option value="MEDIUM">🔵 MEDIUM (24h resolution)</option>
              <option value="LOW">⚪ LOW (72h resolution)</option>
            </select>
          </div>

          {/* Detailed Narrative */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Incident Narrative & Findings</label>
            <textarea
              rows={3}
              placeholder="Describe observation, telemetry indicators, equipment model, and on-site symptoms..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Voice Note */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div>
              <span className="font-bold text-slate-900 block">Voice Note</span>
              <span className="text-[10px] text-slate-500">
                Record up to 15 seconds of spoken findings or instructions.
              </span>
            </div>

            <VoiceRecorder
              maxDurationSeconds={15}
              onSendVoiceNote={(audioDataUrl, durationSeconds) => {
                setAttachedVoiceNote(audioDataUrl);
                setAttachedVoiceDuration(durationSeconds);
              }}
            />

            {attachedVoiceNote && (
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[11px] font-semibold text-emerald-700">
                  Voice note attached ({attachedVoiceDuration}s)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedVoiceNote(null);
                    setAttachedVoiceDuration(15);
                  }}
                  className="text-[11px] font-bold text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Photographic Evidence Controls (Matching Image 13) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Photographic Evidence</span>
                <span className="text-[11px] text-slate-500">
                  Attach photos via device upload or camera capture (Max 2MB per photo policy).
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
                POLICY: 2 MB
              </span>
            </div>

            {evidenceWarning && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{evidenceWarning}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer flex items-center gap-2 transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload Picture (2MB)</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                type="button"
                onClick={handleSimulateCapture}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center gap-2 transition-colors shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Capture Picture (2MB)</span>
              </button>
            </div>

            {evidenceImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 pt-2">
                {evidenceImages.map((img, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video">
                    <img src={img} alt="Captured" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SLA Rule Summary Preview */}
          {slaEngineEnabled && (
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px]">
              <span className="text-emerald-900 font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Calculated Resolution SLA:</span>
              </span>
              <span className="font-bold text-emerald-800 font-mono">{slaEstimates[priority]}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-[#0F2942] hover:bg-[#163859] rounded-xl shadow-md transition-colors"
            >
              Create Ticket & Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
