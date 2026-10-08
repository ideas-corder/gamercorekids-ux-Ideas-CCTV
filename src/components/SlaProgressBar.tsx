import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, AlertOctagon, ShieldCheck, Flame } from 'lucide-react';
import { Ticket } from '../types';

export const SLA_TARGET_HOURS: Record<Ticket['priority'], number> = {
  CRITICAL: 2,
  HIGH: 6,
  MEDIUM: 24,
  LOW: 72
};

export const SLA_RESPONSE_MINUTES: Record<Ticket['priority'], number> = {
  CRITICAL: 15,
  HIGH: 30,
  MEDIUM: 60,
  LOW: 120
};

interface SlaProgressBarProps {
  ticket: Ticket;
  variant?: 'compact' | 'detailed' | 'badge-only';
  showLabel?: boolean;
}

export const SlaProgressBar: React.FC<SlaProgressBarProps> = ({
  ticket,
  variant = 'compact',
  showLabel = true
}) => {
  const [now, setNow] = useState<number>(Date.now());

  // Keep ticker live
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000); // refresh every 30s
    return () => clearInterval(timer);
  }, []);

  const isResolved = ticket.status === 'RESOLVED';
  const targetTotalHours = SLA_TARGET_HOURS[ticket.priority] || 24;
  const targetTotalMs = targetTotalHours * 60 * 60 * 1000;

  const createdAtTime = new Date(ticket.created_at).getTime() || (now - 3600000);
  
  // Calculate deadline
  const deadlineTime = ticket.sla_deadline
    ? new Date(ticket.sla_deadline).getTime()
    : createdAtTime + targetTotalMs;

  const totalDurationMs = Math.max(targetTotalMs, deadlineTime - createdAtTime);
  const elapsedMs = Math.max(0, now - createdAtTime);
  const remainingMs = deadlineTime - now;

  // Percentage of time elapsed (0% at start, 100% at deadline)
  const elapsedPercent = Math.min(100, Math.max(0, (elapsedMs / totalDurationMs) * 100));
  // Percentage of time remaining
  const remainingPercent = Math.max(0, Math.min(100, 100 - elapsedPercent));

  const isBreached = remainingMs <= 0 || ticket.sla_status === 'BREACHED';
  const isAtRisk = !isBreached && !isResolved && (remainingPercent <= 30 || remainingMs <= 2 * 3600000); // less than 30% or <2h
  const isCriticalRisk = !isBreached && !isResolved && remainingPercent <= 15;

  // Format remaining time nicely
  const formatTimeRemaining = () => {
    if (isResolved) return 'Resolved On Time';
    if (isBreached) {
      const overMs = Math.abs(remainingMs);
      const overHrs = Math.floor(overMs / (1000 * 60 * 60));
      const overMins = Math.floor((overMs % (1000 * 60 * 60)) / (1000 * 60));
      return overHrs > 0 ? `Breached by ${overHrs}h ${overMins}m` : `Breached by ${overMins}m`;
    }

    const totalHoursLeft = Math.floor(remainingMs / (1000 * 60 * 60));
    const totalMinsLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (totalHoursLeft >= 24) {
      const days = (totalHoursLeft / 24).toFixed(1);
      return `${days}d left (${totalHoursLeft}h)`;
    }
    if (totalHoursLeft > 0) {
      return `${totalHoursLeft}h ${totalMinsLeft}m left`;
    }
    return `${Math.max(1, totalMinsLeft)}m left`;
  };

  // Color theme based on state
  const getTheme = () => {
    if (isResolved) {
      return {
        statusText: 'COMPLETED',
        textColor: 'text-emerald-700',
        badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        barColor: 'bg-emerald-500',
        pulse: false,
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      };
    }
    if (isBreached) {
      return {
        statusText: 'BREACHED',
        textColor: 'text-rose-700',
        badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
        barColor: 'bg-rose-600',
        pulse: true,
        icon: <Flame className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
      };
    }
    if (isCriticalRisk) {
      return {
        statusText: 'CRITICAL',
        textColor: 'text-rose-600',
        badgeBg: 'bg-rose-50 border-rose-200 text-rose-600',
        barColor: 'bg-rose-500',
        pulse: true,
        icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
      };
    }
    if (isAtRisk) {
      return {
        statusText: 'AT RISK',
        textColor: 'text-amber-700',
        badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
        barColor: 'bg-amber-500',
        pulse: true,
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      };
    }
    return {
      statusText: 'ON TRACK',
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      barColor: 'bg-emerald-500',
      pulse: false,
      icon: <Clock className="w-3.5 h-3.5 text-emerald-600" />
    };
  };

  const theme = getTheme();

  // 1. Badge Only Variant
  if (variant === 'badge-only') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${theme.badgeBg}`}>
        {theme.icon}
        <span>{theme.statusText}</span>
      </span>
    );
  }

  // 2. Detailed Variant (for Modal / Inspect panels)
  if (variant === 'detailed') {
    return (
      <div className="space-y-2 w-full">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase flex items-center gap-1 ${theme.badgeBg}`}>
              {theme.icon}
              <span>{theme.statusText}</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Target: <strong className="text-slate-800">{targetTotalHours}h</strong> ({ticket.priority} Tier)
            </span>
          </div>
          <span className={`font-mono text-xs font-bold ${theme.textColor}`}>
            {formatTimeRemaining()}
          </span>
        </div>

        {/* Progress Bar with Milestone Markings */}
        <div className="relative">
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/80 p-[1px]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${theme.barColor} ${theme.pulse ? 'animate-pulse' : ''}`}
              style={{ width: `${isResolved ? 100 : Math.max(5, remainingPercent)}%` }}
            ></div>
          </div>

          {/* SLA Threshold Markers */}
          <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
            <span>Created</span>
            <span className="text-amber-600 font-semibold">50% Half-Time</span>
            <span className={isBreached ? 'text-rose-600 font-bold' : ''}>Deadline ({targetTotalHours}h)</span>
          </div>
        </div>

        {!isResolved && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>
              Time Elapsed: <strong className="text-slate-700">{Math.floor(elapsedMs / (1000 * 60))} mins</strong> ({Math.round(elapsedPercent)}%)
            </span>
            <span>
              Time Remaining: <strong className={theme.textColor}>{Math.round(remainingPercent)}%</strong>
            </span>
          </div>
        )}
      </div>
    );
  }

  // 3. Compact Variant (for Tables & Cards)
  return (
    <div className="space-y-1 w-32 sm:w-36">
      {showLabel && (
        <div className="flex items-center justify-between text-[10px] leading-tight">
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isResolved ? 'bg-emerald-500' : isBreached ? 'bg-rose-500 animate-ping' : isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            <span className={`font-bold uppercase tracking-tight ${theme.textColor}`}>
              {theme.statusText}
            </span>
          </div>
          <span className="text-slate-500 font-mono text-[9px] truncate ml-1" title={formatTimeRemaining()}>
            {formatTimeRemaining()}
          </span>
        </div>
      )}

      {/* Visual Progress Bar Track */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60 relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ${theme.barColor} ${theme.pulse ? 'animate-pulse' : ''}`}
          style={{ width: `${isResolved ? 100 : Math.max(6, remainingPercent)}%` }}
        ></div>
      </div>
    </div>
  );
};
