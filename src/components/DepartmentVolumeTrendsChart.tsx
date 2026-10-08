import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  Calendar,
  Filter,
  ArrowUpRight,
  Shield,
  Activity,
  Zap,
  Building,
  Wrench,
  Server
} from 'lucide-react';
import { Ticket, Department } from '../types';

interface DepartmentVolumeTrendsChartProps {
  tickets: Ticket[];
  departments?: Department[];
  title?: string;
}

// Department Color Definitions matching OpsDesk Design Constitution
const DEPT_CONFIG: Record<
  string,
  { name: string; shortName: string; color: string; gradientId: string; icon: any }
> = {
  surveillance: {
    name: 'Security Operations & Surveillance',
    shortName: 'Surveillance',
    color: '#10B981', // Emerald
    gradientId: 'colorSurveillance',
    icon: Shield
  },
  security: {
    name: 'Physical Security & Access Control',
    shortName: 'Physical Security',
    color: '#0284C7', // Sky Blue
    gradientId: 'colorSecurity',
    icon: Activity
  },
  admin: {
    name: 'Administration & Facility Governance',
    shortName: 'Admin & Facility',
    color: '#8B5CF6', // Purple
    gradientId: 'colorAdmin',
    icon: Building
  },
  hvac: {
    name: 'HVAC & Environmental Maintenance',
    shortName: 'HVAC & Power',
    color: '#F59E0B', // Amber
    gradientId: 'colorHvac',
    icon: Wrench
  },
  it: {
    name: 'IT & Network Infrastructure',
    shortName: 'IT Infrastructure',
    color: '#EC4899', // Pink / Rose
    gradientId: 'colorIt',
    icon: Server
  }
};

export const DepartmentVolumeTrendsChart: React.FC<DepartmentVolumeTrendsChartProps> = ({
  tickets,
  departments,
  title = 'Daily Ticket Volume Trends Across Departments'
}) => {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30 | 60>(30);
  const [chartType, setChartType] = useState<'area' | 'bar' | 'line' | 'stacked'>('area');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Build daily time-series dataset over the selected time range
  const { chartData, metrics } = useMemo(() => {
    const dates: Array<{
      rawDate: Date;
      dateKey: string;
      formattedDate: string;
      shortDate: string;
      dayName: string;
    }> = [];

    const now = new Date();
    // Build array of dates going back timeRange days
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const shortDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const formattedDate = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      dates.push({
        rawDate: d,
        dateKey: isoStr,
        formattedDate,
        shortDate,
        dayName
      });
    }

    // Map tickets into daily department counts
    const dailyMap: Record<
      string,
      {
        surveillance: number;
        security: number;
        admin: number;
        hvac: number;
        it: number;
        total: number;
      }
    > = {};

    dates.forEach(d => {
      dailyMap[d.dateKey] = {
        surveillance: 0,
        security: 0,
        admin: 0,
        hvac: 0,
        it: 0,
        total: 0
      };
    });

    // Populate counts from live tickets
    tickets.forEach(ticket => {
      if (!ticket.created_at) return;
      const ticketDateKey = ticket.created_at.split('T')[0];

      if (dailyMap[ticketDateKey]) {
        const deptId = (ticket.department_id || '').toLowerCase();
        const deptName = (ticket.department_name || '').toLowerCase();

        if (deptId.includes('surveillance') || deptName.includes('surveillance')) {
          dailyMap[ticketDateKey].surveillance += 1;
        } else if (deptId.includes('security') || deptName.includes('security')) {
          dailyMap[ticketDateKey].security += 1;
        } else if (deptId.includes('admin') || deptName.includes('admin')) {
          dailyMap[ticketDateKey].admin += 1;
        } else if (deptId.includes('hvac') || deptName.includes('hvac')) {
          dailyMap[ticketDateKey].hvac += 1;
        } else if (deptId.includes('it') || deptName.includes('it') || deptName.includes('network')) {
          dailyMap[ticketDateKey].it += 1;
        } else {
          dailyMap[ticketDateKey].surveillance += 1; // Default
        }
        dailyMap[ticketDateKey].total += 1;
      }
    });

    // Create chart points with realistic operational baseline variance if data is sparse
    let maxDailyVolume = 0;
    let peakDate = '';
    let totalRangeTickets = 0;
    const deptTotals = { surveillance: 0, security: 0, admin: 0, hvac: 0, it: 0 };

    const dataPoints = dates.map(d => {
      const counts = dailyMap[d.dateKey];

      // Production data only: never manufacture ticket counts for dates
      // without actual records.
      const baseSurveillance = counts.surveillance;
      const baseSecurity = counts.security;
      const baseAdmin = counts.admin;
      const baseHvac = counts.hvac;
      const baseIt = counts.it;

      const dayTotal = counts.total;

      if (dayTotal > maxDailyVolume) {
        maxDailyVolume = dayTotal;
        peakDate = d.shortDate;
      }

      totalRangeTickets += dayTotal;
      deptTotals.surveillance += baseSurveillance;
      deptTotals.security += baseSecurity;
      deptTotals.admin += baseAdmin;
      deptTotals.hvac += baseHvac;
      deptTotals.it += baseIt;

      return {
        date: d.shortDate,
        fullDate: d.formattedDate,
        dateKey: d.dateKey,
        surveillance: baseSurveillance,
        security: baseSecurity,
        admin: baseAdmin,
        hvac: baseHvac,
        it: baseIt,
        total: dayTotal
      };
    });

    // Determine top department
    let topDeptKey = 'surveillance';
    let topDeptVal = 0;
    (Object.keys(deptTotals) as Array<keyof typeof deptTotals>).forEach(k => {
      if (deptTotals[k] > topDeptVal) {
        topDeptVal = deptTotals[k];
        topDeptKey = k;
      }
    });

    const avgDaily = (totalRangeTickets / timeRange).toFixed(1);
    const topDeptPercent = totalRangeTickets > 0 ? Math.round((topDeptVal / totalRangeTickets) * 100) : 0;

    return {
      chartData: dataPoints,
      metrics: {
        totalRangeTickets,
        avgDaily,
        maxDailyVolume,
        peakDate,
        topDeptName: DEPT_CONFIG[topDeptKey]?.shortName || 'Surveillance',
        topDeptColor: DEPT_CONFIG[topDeptKey]?.color || '#10B981',
        topDeptPercent,
        deptTotals
      }
    };
  }, [tickets, timeRange]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-xl text-white text-xs max-w-xs z-50">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
            <span>{point.fullDate}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 rounded text-emerald-400">
              {point.total} Tickets Total
            </span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(DEPT_CONFIG).map(([key, config]) => {
              const val = point[key] || 0;
              if (selectedDeptFilter !== 'ALL' && selectedDeptFilter !== key) return null;
              return (
                <div key={key} className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                    <span className="text-slate-300 truncate max-w-[140px]">{config.shortName}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
      {/* 1. Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time daily ticket inflow analytics aggregated by operational department
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Selector */}
          <div className="relative">
            <select
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              <option value="surveillance">Surveillance Operations</option>
              <option value="security">Physical Security</option>
              <option value="admin">Admin & Governance</option>
              <option value="hvac">HVAC & Environmental</option>
              <option value="it">IT & Network</option>
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            {([7, 14, 30, 60] as const).map(days => (
              <button
                key={days}
                onClick={() => setTimeRange(days)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeRange === days
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setChartType('area')}
              title="Area Trend Chart"
              className={`p-1.5 rounded-md transition-all ${
                chartType === 'area'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setChartType('bar')}
              title="Bar Chart"
              className={`p-1.5 rounded-md transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setChartType('line')}
              title="Line Chart"
              className={`p-1.5 rounded-md transition-all ${
                chartType === 'line'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setChartType('stacked')}
              title="Stacked Area Chart"
              className={`p-1.5 rounded-md transition-all ${
                chartType === 'stacked'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Summary Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {timeRange}-Day Total Inflow
          </div>
          <div className="text-xl font-extrabold text-slate-900 my-0.5 tabular-nums">
            {metrics.totalRangeTickets} <span className="text-xs font-normal text-slate-500">tickets</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Across all store locations</div>
        </div>

        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Daily Volume Avg
          </div>
          <div className="text-xl font-extrabold text-slate-900 my-0.5 tabular-nums">
            {metrics.avgDaily} <span className="text-xs font-normal text-slate-500">/ day</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            <span>Normal Operational Pace</span>
          </div>
        </div>

        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Peak Day Volume
          </div>
          <div className="text-xl font-extrabold text-slate-900 my-0.5 tabular-nums">
            {metrics.maxDailyVolume} <span className="text-xs font-normal text-slate-500">tickets</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Recorded on {metrics.peakDate}</div>
        </div>

        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Busiest Department
          </div>
          <div className="text-sm font-extrabold text-slate-900 my-0.5 truncate" style={{ color: metrics.topDeptColor }}>
            {metrics.topDeptName}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {metrics.topDeptPercent}% of total daily inflow
          </div>
        </div>
      </div>

      {/* 3. Main Recharts Visualization Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {Object.entries(DEPT_CONFIG).map(([key, config]) => {
                if (selectedDeptFilter !== 'ALL' && selectedDeptFilter !== key) return null;
                return <Bar key={key} dataKey={key} name={config.shortName} fill={config.color} radius={[3, 3, 0, 0]} />;
              })}
            </BarChart>
          ) : chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {Object.entries(DEPT_CONFIG).map(([key, config]) => {
                if (selectedDeptFilter !== 'ALL' && selectedDeptFilter !== key) return null;
                return (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={config.shortName}
                    stroke={config.color}
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: config.color }}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {Object.entries(DEPT_CONFIG).map(([key, config]) => (
                  <linearGradient key={key} id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {Object.entries(DEPT_CONFIG).map(([key, config]) => {
                if (selectedDeptFilter !== 'ALL' && selectedDeptFilter !== key) return null;
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={config.shortName}
                    stroke={config.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${config.gradientId})`}
                    stackId={chartType === 'stacked' ? '1' : undefined}
                  />
                );
              })}
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* 4. Department Legend Badges Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          {Object.entries(DEPT_CONFIG).map(([key, config]) => {
            const count = metrics.deptTotals[key as keyof typeof metrics.deptTotals] || 0;
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                <span className="font-semibold text-slate-700">{config.shortName}:</span>
                <span className="font-mono text-slate-500 font-bold">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Source: Live OpsDesk Incident Ledger & Telemetry
        </div>
      </div>
    </div>
  );
};
