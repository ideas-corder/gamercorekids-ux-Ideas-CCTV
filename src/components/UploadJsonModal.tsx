import React, { useState, useRef } from 'react';
import {
  Upload,
  FileJson,
  X,
  CheckCircle2,
  AlertCircle,
  Database,
  Users,
  MapPin,
  Ticket as TicketIcon,
  RefreshCw,
  FileCode2,
  Check,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { importJsonDatabase } from '../api';

interface UploadJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: 'users' | 'locations' | 'tickets' | 'all' | 'audit';
  onImportSuccess?: (result: any) => void;
}

export const UploadJsonModal: React.FC<UploadJsonModalProps> = ({
  isOpen,
  onClose,
  defaultTarget = 'all',
  onImportSuccess
}) => {
  const [targetModule, setTargetModule] = useState<'users' | 'locations' | 'tickets' | 'all'>(
    defaultTarget === 'audit' ? 'all' : defaultTarget
  );
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const mode = 'merge' as const;
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setParseError('Please select a valid .json file.');
      return;
    }

    setJsonFile(file);
    setParseError(null);
    setResultMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      parseAndValidateJson(content);
    };
    reader.onerror = () => {
      setParseError('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    setParseError(null);
    setResultMessage(null);
    if (text.trim()) {
      parseAndValidateJson(text);
    } else {
      setParsedData(null);
      setParsedCount(null);
    }
  };

  const parseAndValidateJson = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      setParsedData(parsed);

      let count = 0;
      if (Array.isArray(parsed)) {
        count = parsed.length;
      } else if (parsed && typeof parsed === 'object') {
        if (targetModule === 'all') {
          const uCount = Array.isArray(parsed.users) ? parsed.users.length : 0;
          const lCount = Array.isArray(parsed.locations) ? parsed.locations.length : 0;
          const tCount = Array.isArray(parsed.tickets) ? parsed.tickets.length : 0;
          count = uCount + lCount + tCount;
        } else if (targetModule === 'users' && Array.isArray(parsed.users)) {
          count = parsed.users.length;
        } else if (targetModule === 'locations' && Array.isArray(parsed.locations)) {
          count = parsed.locations.length;
        } else if (targetModule === 'tickets' && Array.isArray(parsed.tickets)) {
          count = parsed.tickets.length;
        } else if (Array.isArray(parsed.data)) {
          count = parsed.data.length;
        } else if (Array.isArray(parsed.records)) {
          count = parsed.records.length;
        } else {
          count = 1;
        }
      }
      setParsedCount(count);
      setParseError(null);
    } catch (err: any) {
      setParsedData(null);
      setParsedCount(null);
      setParseError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleUploadSubmit = async () => {
    if (!parsedData && !rawText.trim()) {
      setParseError('Please select a JSON file or paste valid JSON content.');
      return;
    }

    setLoading(true);
    setParseError(null);
    setResultMessage(null);

    try {
      const payloadToSend = parsedData || rawText;
      const res = await importJsonDatabase(targetModule, payloadToSend, mode);

      if (res.success) {
        setResultMessage(res.message);
        if (onImportSuccess) {
          onImportSuccess(res);
        }
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setParseError(res.message || 'Import failed.');
      }
    } catch (err: any) {
      setParseError(err.message || 'An error occurred during JSON database upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Upload JSON Database
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  {targetModule}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Import and restore user accounts, branch locations, or incident tickets from JSON database files.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Module Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Target Database Entity
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setTargetModule('users');
                if (rawText) parseAndValidateJson(rawText);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                targetModule === 'users'
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs">Users</div>
                <div className="text-[10px] text-slate-400 font-normal">Team & Staff</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetModule('locations');
                if (rawText) parseAndValidateJson(rawText);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                targetModule === 'locations'
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs">Locations</div>
                <div className="text-[10px] text-slate-400 font-normal">Branches & Sites</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetModule('tickets');
                if (rawText) parseAndValidateJson(rawText);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                targetModule === 'tickets'
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TicketIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs">Tickets</div>
                <div className="text-[10px] text-slate-400 font-normal">Incidents & Ops</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTargetModule('all');
                if (rawText) parseAndValidateJson(rawText);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                targetModule === 'all'
                  ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs">Full Snapshot</div>
                <div className="text-[10px] text-slate-400 font-normal">Entire Database</div>
              </div>
            </button>
          </div>
        </div>

        {/* Input Method Tabs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'file'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Select File (.json)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'paste'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Paste JSON Text</span>
            </button>
          </div>

          {activeTab === 'file' ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center bg-slate-50/60 hover:bg-emerald-50/30 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs group-hover:scale-105 transition-transform">
                <FileJson className="w-6 h-6" />
              </div>
              <div className="mt-3 font-semibold text-xs text-slate-800">
                {jsonFile ? jsonFile.name : 'Click to select or drag & drop .json file'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {jsonFile ? `${(jsonFile.size / 1024).toFixed(1)} KB` : 'Supports standard JSON format exported from OpsDesk'}
              </div>
            </div>
          ) : (
            <div>
              <textarea
                value={rawText}
                onChange={e => handleTextChange(e.target.value)}
                rows={6}
                placeholder={`Paste your JSON content here...\nExample:\n[\n  { "id": "usr_001", "name": "Ali Khan", "email": "ali@ideas.com.pk", "role": "TECHNICIAN" }\n]`}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
              />
            </div>
          )}
        </div>

        {/* Validation & Preview Card */}
        {parsedCount !== null && (
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">
                Valid JSON Structure Detected: {parsedCount} record(s) ready for import.
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 rounded text-emerald-900">
              Validated
            </span>
          </div>
        )}

        {/* Error Alert */}
        {parseError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Success Alert */}
        {resultMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        {/* Import Strategy */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">
            Import Strategy / Sync Mode
          </label>
          <div className="p-3 rounded-xl border border-emerald-500 bg-emerald-50/40 text-xs text-emerald-900">
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <div className="font-bold text-slate-900">
                  Merge & Upsert (Safe)
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Updates matching IDs or codes, and appends new records without deleting existing items.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Synchronizes with live Hostinger MySQL database</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || parsedCount === 0 || !!parseError}
              onClick={handleUploadSubmit}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading & Syncing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Import Database</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
