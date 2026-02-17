'use client';

import { Activity, Thermometer, Wind, TrendingUp, AlertCircle } from 'lucide-react';
import type { LatestVitalsData, TrendIndicator } from '@/types/patient-dashboard-v2.types';

interface VitalsGridProps {
  vitals: LatestVitalsData | null;
  isLoading?: boolean;
}

interface VitalMetric {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  status: 'normal' | 'warning' | 'critical';
  trend?: TrendIndicator;
  normalRange: string;
  remark?: string;
}

function getTrendIcon(trend: TrendIndicator | undefined) {
  if (!trend) return null;

  const { direction, percentage } = trend;
  const directionText = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const color = direction === 'up' ? 'text-red-400' : direction === 'down' && percentage < 0 ? 'text-green-400' : 'text-slate-400';

  return (
    <span className={`text-xs font-semibold ${color}`}>
      {directionText} {Math.abs(percentage || 0)}%
    </span>
  );
}

function getStatusBadge(status: 'normal' | 'warning' | 'critical') {
  if (status === 'critical')
    return <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
  if (status === 'warning')
    return <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full" />;
  return <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />;
}

function getBodyFatNormalRange(category: 'essential' | 'athletes' | 'fitness' | 'average' | 'obese'): string {
  const ranges: Record<string, string> = {
    essential: '< 13% (M) / < 20% (F)',
    athletes: '13-17% (M) / 20-24% (F)',
    fitness: '17-21% (M) / 24-31% (F)',
    average: '21-26% (M) / 31-36% (F)',
    obese: '> 26% (M) / > 36% (F)',
  };
  return ranges[category] || 'Variable';
}

function getBodyFatRemark(category: 'essential' | 'athletes' | 'fitness' | 'average' | 'obese'): string {
  const remarks: Record<string, string> = {
    essential: 'Essential fat - vital for health',
    athletes: 'Athletic fitness level - excellent',
    fitness: 'Fitness level - good health',
    average: 'Average - consider increased activity',
    obese: 'High risk - consult healthcare provider',
  };
  return remarks[category] || 'Monitor body composition';
}

function getBMIRemark(bmi: number): string {
  const remarks: Record<string, string> = {
    underweight: 'Below normal weight - consult provider',
    normal: 'Healthy weight range - maintain lifestyle',
    overweight: 'Above ideal weight - increase activity',
    obese: 'High risk - seek medical guidance',
  };

  if (bmi < 18.5) return remarks.underweight;
  if (bmi < 24.9) return remarks.normal;
  if (bmi < 29.9) return remarks.overweight;
  return remarks.obese;
}

export function VitalsGrid({ vitals, isLoading }: VitalsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-4 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg animate-pulse"
          >
            <div className="dark:h-20 dark:bg-slate-700/50 h-20 bg-slate-300/30 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!vitals?.vitals) {
    return (
      <div className="dark:bg-gradient-to-br dark:from-slate-900/50 dark:to-slate-800/50 bg-gradient-to-br from-slate-100/60 to-white/40 rounded-xl p-8 backdrop-blur-sm dark:border-white/10 border-slate-200 border text-center">
        <Activity className="w-12 h-12 mx-auto dark:text-slate-400 text-slate-600 mb-4" />
        <p className="dark:text-slate-300 text-slate-700">No vital signs recorded</p>
      </div>
    );
  }

  const current = vitals.vitals;
  const trends = vitals.trends;

  const metrics: VitalMetric[] = [
    {
      label: 'Blood Pressure',
      value: current.bpSystolic && current.bpDiastolic ? `${current.bpSystolic}/${current.bpDiastolic}` : '—',
      unit: 'mmHg',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-red-400',
      bgGradient: 'from-red-600/20 to-red-500/10',
      status: ((current.bpSystolic ?? 0) > 140 || (current.bpDiastolic ?? 0) > 90) ? 'warning' : 'normal',
      trend: trends?.bp ?? undefined,
      normalRange: '120/80',
    },
    {
      label: 'Heart Rate',
      value: current.pulseRate || '—',
      unit: 'bpm',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-pink-400',
      bgGradient: 'from-pink-600/20 to-pink-500/10',
      status: ((current.pulseRate ?? 0) < 60 || (current.pulseRate ?? 0) > 100) ? 'warning' : 'normal',
      trend: trends?.hr ?? undefined,
      normalRange: '60-100',
    },
    {
      label: 'Temperature',
      value: current.temp || '—',
      unit: '°F',
      icon: <Thermometer className="w-5 h-5" />,
      color: 'text-orange-400',
      bgGradient: 'from-orange-600/20 to-orange-500/10',
      status: ((current.temp ?? 0) < 98 || (current.temp ?? 0) > 99) ? 'warning' : 'normal',
      trend: trends?.temp ?? undefined,
      normalRange: '98.6',
    },
    {
      label: 'SpO₂',
      value: current.spo2 || '—',
      unit: '%',
      icon: <Wind className="w-5 h-5" />,
      color: 'text-cyan-400',
      bgGradient: 'from-cyan-600/20 to-cyan-500/10',
      status: ((current.spo2 ?? 0) < 95) ? 'warning' : 'normal',
      trend: trends?.spo2 ?? undefined,
      normalRange: '95-100',
    },
    {
      label: 'Weight',
      value: current.weight || '—',
      unit: 'kg',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-400',
      bgGradient: 'from-purple-600/20 to-purple-500/10',
      status: 'normal',
      trend: trends?.weight ?? undefined,
      normalRange: 'Individual',
    },
    {
      label: 'BMI',
      value: current.bmi ? parseFloat(current.bmi.toString()).toFixed(2) : '—',
      unit: 'kg/m²',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-green-400',
      bgGradient: 'from-green-600/20 to-green-500/10',
      status: current.bmi && current.bmi < 18.5 ? 'warning' : ((current.bmi ?? 0) > 29.9) ? 'critical' : ((current.bmi ?? 0) > 24.9) ? 'warning' : 'normal',
      trend: undefined,
      normalRange: '18.5-24.9',
      remark: current.bmi ? getBMIRemark(parseFloat(current.bmi.toString())) : undefined,
    },
    {
      label: 'Body Fat %',
      value: vitals?.bodyFatPercentage ? parseFloat(vitals.bodyFatPercentage.toString()).toFixed(1) : '—',
      unit: '%',
      icon: <Activity className="w-5 h-5" />,
      color: 'text-blue-400',
      bgGradient: 'from-blue-600/20 to-blue-500/10',
      status: vitals?.bodyFatCategory === 'obese' ? 'critical' : vitals?.bodyFatCategory === 'average' ? 'warning' : 'normal',
      trend: undefined,
      normalRange: vitals?.bodyFatCategory ? getBodyFatNormalRange(vitals.bodyFatCategory) : 'Variable',
      remark: vitals?.bodyFatCategory ? getBodyFatRemark(vitals.bodyFatCategory) : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={`dark:bg-gradient-to-br dark:${metric.bgGradient} bg-gradient-to-br from-${metric.color.split('-')[1]}-50/40 to-${metric.color.split('-')[1]}-50/20 rounded-xl p-5 backdrop-blur-sm dark:border-white/10 border-slate-200 border shadow-md dark:shadow-lg dark:hover:shadow-xl dark:hover:border-white/20 hover:border-slate-300 dark:hover:shadow-${metric.color.split('-')[1]}-500/20 hover:shadow-lg transition-all duration-300 group cursor-pointer hover:scale-105 hover:-translate-y-1`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={metric.color}>{metric.icon}</span>
              <div className="flex flex-col">
                <p className="text-xs dark:text-slate-400 text-slate-600 font-medium leading-tight">{metric.label}</p>
                <p className="text-xs dark:text-slate-500 text-slate-500 leading-tight">Normal: {metric.normalRange}</p>
              </div>
            </div>
            {getStatusBadge(metric.status)}
          </div>

          {/* Value */}
          <div className="mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-bold dark:text-white text-slate-900">{metric.value}</span>
              <span className="text-xs dark:text-slate-400 text-slate-600">{metric.unit}</span>
            </div>
          </div>

          {/* Trend */}
          {metric.trend && (
            <div className="flex items-center justify-between pt-2 dark:border-t dark:border-white/10 border-t border-slate-300">
              <span className="text-xs dark:text-slate-400 text-slate-600">vs last reading</span>
              {getTrendIcon(metric.trend)}
            </div>
          )}

          {/* Status message */}
          {metric.status === 'critical' && (
            <div className="mt-3 pt-3 dark:border-t dark:border-red-500/30 border-t border-red-300 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-red-400" />
              <p className="text-xs dark:text-red-300 text-red-600 font-medium">Needs attention</p>
            </div>
          )}
          {metric.status === 'warning' && (
            <div className="mt-3 pt-3 dark:border-t dark:border-yellow-500/30 border-t border-yellow-300 flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-yellow-400" />
              <p className="text-xs dark:text-yellow-300 text-yellow-600 font-medium">Monitor closely</p>
            </div>
          )}

          {/* Clinical remark */}
          {metric.remark && (
            <div className="mt-2 pt-2">
              <p className="text-xs dark:text-slate-300 text-slate-700 italic leading-snug">{metric.remark}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
