'use client'

import { useState } from 'react'
import { List, BarChart3 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { calculateAgeInMonths, formatAge, getLengthPercentile, getWeightPercentile, getGrowthStatusColor } from '@/lib/pediatric-growth-utils'
import type { PediatricTabData } from '@/types/patient-profile-tabs'

type Props = { data: PediatricTabData }

export function PediatricTab({ data }: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list')

  if (data.pediatricMeasurements.length === 0) {
    return (
      <div className="glassmorphic-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">📏 Pediatric Measurements</h3>
        <p className="text-slate-600 dark:text-slate-400 text-center py-8">No pediatric measurements recorded</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">📏 Pediatric Measurements</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'chart'
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Chart
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <PediatricListView data={data} />
        ) : (
          <PediatricChartView data={data} />
        )}
      </div>
    </div>
  )
}

function PediatricListView({ data }: Props) {
  return (
    <div className="space-y-4">
      {data.pediatricMeasurements.map((p, i) => {
        const ageMonths = calculateAgeInMonths(new Date(data.dob!), new Date(p.dateTaken))
        const lengthPercentile = p.length ? getLengthPercentile(ageMonths, Number(p.length), data.gender as 'MALE' | 'FEMALE') : null
        const weightPercentile = p.length ? getWeightPercentile(ageMonths, Number(p.length), data.gender as 'MALE' | 'FEMALE') : null

        return (
          <div key={i} className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {new Date(p.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Age: {formatAge(new Date(data.dob!), new Date(p.dateTaken))} ({ageMonths} months)
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {new Date(p.dateTaken).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {p.length && (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Length</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">{p.length.toString()} cm</p>
                  {lengthPercentile && (
                    <p className={`text-xs font-semibold ${getGrowthStatusColor(lengthPercentile.status)}`}>
                      {lengthPercentile.percentile}
                    </p>
                  )}
                </div>
              )}
              {p.headCircumference && (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">HC</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mb-1">{p.headCircumference.toString()} cm</p>
                  <p className="text-xs text-slate-500">Head Circum.</p>
                </div>
              )}
              {p.waistCircumference && (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Waist</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{p.waistCircumference.toString()} cm</p>
                </div>
              )}
              {p.hipCircumference && (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Hip</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{p.hipCircumference.toString()} cm</p>
                </div>
              )}
              {p.midUpperArmCircumference && (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">MUAC</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{p.midUpperArmCircumference.toString()} cm</p>
                </div>
              )}
              {p.limbCircumference && (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Limb</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{p.limbCircumference.toString()} cm</p>
                </div>
              )}
              {p.skinfoldThickness && (
                <div className="p-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Skinfold</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{p.skinfoldThickness.toString()} mm</p>
                </div>
              )}
            </div>

            {p.remarks && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Remarks</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{p.remarks}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const PEDIATRIC_CHART_LABELS: Record<string, string> = {
  length: 'Length (cm)',
  headCircumference: 'HC (cm)',
  waistCircumference: 'Waist (cm)',
  hipCircumference: 'Hip (cm)',
  midUpperArmCircumference: 'MUAC (cm)',
  limbCircumference: 'Limb (cm)',
  skinfoldThickness: 'Skinfold (mm)',
}

function PediatricChartView({ data }: Props) {
  const chartData = data.pediatricMeasurements
    .map(p => ({
      date: new Date(p.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: new Date(p.dateTaken).getTime(),
      ageMonths: calculateAgeInMonths(new Date(data.dob!), new Date(p.dateTaken)),
      length: p.length ? Number(p.length) : null,
      headCircumference: p.headCircumference ? Number(p.headCircumference) : null,
      waistCircumference: p.waistCircumference ? Number(p.waistCircumference) : null,
      hipCircumference: p.hipCircumference ? Number(p.hipCircumference) : null,
      midUpperArmCircumference: p.midUpperArmCircumference ? Number(p.midUpperArmCircumference) : null,
      limbCircumference: p.limbCircumference ? Number(p.limbCircumference) : null,
      skinfoldThickness: p.skinfoldThickness ? Number(p.skinfoldThickness) : null,
    }))
    .sort((a, b) => a.timestamp - b.timestamp)

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
          <XAxis dataKey="date" stroke="rgb(100, 116, 139)" strokeOpacity={0.5} tick={{ fontSize: 12 }} />
          <YAxis stroke="rgb(100, 116, 139)" strokeOpacity={0.5} tick={{ fontSize: 12 }} />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: 'rgb(15, 23, 42)',
              border: '1px solid rgb(71, 85, 105)',
              borderRadius: '8px',
              color: 'rgb(226, 232, 240)',
            }}
            labelStyle={{ color: 'rgb(226, 232, 240)' }}
            formatter={(value, name) => {
              if (value === null) return 'N/A'
              const label = typeof name === 'string' ? (PEDIATRIC_CHART_LABELS[name] ?? name) : String(name)
              return [value, label]
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
          {data.pediatricMeasurements.some(p => p.length) && (
            <Line type="monotone" dataKey="length" stroke="#06b6d4" dot={false} name="Length (cm)" strokeWidth={2} />
          )}
          {data.pediatricMeasurements.some(p => p.headCircumference) && (
            <Line type="monotone" dataKey="headCircumference" stroke="#f97316" dot={false} name="HC (cm)" strokeWidth={2} />
          )}
          {data.pediatricMeasurements.some(p => p.waistCircumference) && (
            <Line type="monotone" dataKey="waistCircumference" stroke="#ec4899" dot={false} name="Waist (cm)" strokeWidth={2} />
          )}
          {data.pediatricMeasurements.some(p => p.midUpperArmCircumference) && (
            <Line type="monotone" dataKey="midUpperArmCircumference" stroke="#8b5cf6" dot={false} name="MUAC (cm)" strokeWidth={2} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
