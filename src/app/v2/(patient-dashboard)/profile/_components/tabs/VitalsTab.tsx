'use client'

import { useState } from 'react'
import { List, BarChart3 } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  calculateBMI,
  calculateBodyFat,
  getBMICategoryWithColor,
  getBodyFatCategoryWithColor,
  getVitalStatusColor,
  generateVitalRemarks,
} from '../../_lib/vitals-utils'
import type { VitalsTabData } from '@/types/patient-profile-tabs'

type Props = { data: VitalsTabData }

export function VitalsTab({ data }: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list')

  if (data.vitalSigns.length === 0) {
    return (
      <div className="glassmorphic-card p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">❤️ Vital Signs</h3>
        <p className="text-slate-600 dark:text-slate-400 text-center py-8">No vital signs recorded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">📊 Vital Signs History</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Latest measurements and trends</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">List</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'chart'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">Chart</span>
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <VitalsListView data={data} />
        ) : (
          <VitalsChartView data={data} />
        )}
      </div>
    </div>
  )
}

function VitalsListView({ data }: Props) {
  return (
    <div className="space-y-3">
      {data.vitalSigns.map((v, i) => {
        const bmi = calculateBMI(v.weight, v.height)
        const bodyFat = calculateBodyFat(v.weight, v.height, data.gender)
        const bmiInfo = getBMICategoryWithColor(bmi ? parseFloat(bmi) : null)
        const bodyFatInfo = getBodyFatCategoryWithColor(bodyFat ? parseFloat(bodyFat) : null, data.gender)
        const remarks = generateVitalRemarks(v, data.gender)
        const dateTime = new Date(v.dateTaken)
        const date = dateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const time = dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

        return (
          <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{date}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{time}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">BP</p>
                    {v.bpSystolic && v.bpDiastolic ? (
                        <p className={`text-sm font-bold ${getVitalStatusColor(v.bpSystolic, 90, 120, 140) || getVitalStatusColor(v.bpDiastolic, 60, 80, 90)}`}>
                        {v.bpSystolic}/{v.bpDiastolic}
                        </p>
                    ) : "-"}
                  <p className="text-xs text-slate-500 dark:text-slate-400">mmHg</p>
                </div>
            
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">HR</p>
                    {v.pulseRate ? (
                    <p className={`text-sm font-bold ${getVitalStatusColor(v.pulseRate, 60, 100, 120)}`}>{v.pulseRate}</p>
                    ) : "-"}
                  <p className="text-xs text-slate-500 dark:text-slate-400">bpm</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Temp</p>
                  {
                    v.temp ? (
                      <p className={`text-sm font-bold ${getVitalStatusColor(v.temp, 36.1, 37.2, 38)}`}>{v.temp}</p>
                    ) : "-"
                  }
                  <p className="text-xs text-slate-500 dark:text-slate-400">°C</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">SpO₂</p>
                  {v.spo2 ? (
                    <p className={`text-sm font-bold ${getVitalStatusColor(v.spo2, 94, 98, 100)}`}>{v.spo2}</p>
                  ) : "-"}  
                  <p className="text-xs text-slate-500 dark:text-slate-400">%</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">RR</p>
                  {v.respRate ? (
                    <p className={`text-sm font-bold ${getVitalStatusColor(v.respRate, 12, 16, 20)}`}>{v.respRate}</p>
                  ) : "-"}
                  <p className="text-xs text-slate-500 dark:text-slate-400">br/min</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Weight</p>
                  {v.weight ? (
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{v.weight}</p>
                  ) : "-"}
                  <p className="text-xs text-slate-500 dark:text-slate-400">kg</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Height</p>
                  {v.height ? (
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{v.height}</p>
                  ) : "-"}  
                  <p className="text-xs text-slate-500 dark:text-slate-400">cm</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">BMI</p>
                    {bmi ? (<>
                      <p className={`text-sm font-bold ${bmiInfo.color}`}>{bmi}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{bmiInfo.category}</p>
                    </>) : "-"}
                </div>
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Body Fat</p>
                  {bodyFat ? (
                    <>
                      <p className={`text-sm font-bold ${bodyFatInfo.color}`}>{bodyFat}%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{bodyFatInfo.category}</p>
                    </>
                  ) : "-"}  
                </div>
            </div>

            {remarks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">Remarks</p>
                <ul className="space-y-1">
                  {remarks.map((remark, idx) => (
                    <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">{remark}</li>
                  ))}
                </ul>
              </div>
            )}

            {v.notes && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{v.notes}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function VitalsChartView({ data }: Props) {
  const chartData = data.vitalSigns
    .map(v => ({
      date: new Date(v.dateTaken).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: new Date(v.dateTaken).getTime(),
      bpSystolic: v.bpSystolic,
      bpDiastolic: v.bpDiastolic,
      pulseRate: v.pulseRate,
      temp: v.temp,
      spo2: v.spo2,
      respRate: v.respRate,
    }))
    .slice()
    .reverse()
    .sort((a, b) => a.timestamp - b.timestamp)

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'rgb(15, 23, 42)',
      border: '1px solid rgb(71, 85, 105)',
      borderRadius: '8px',
      color: 'rgb(226, 232, 240)',
    },
    labelStyle: { color: 'rgb(226, 232, 240)' },
  }

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
          <XAxis dataKey="date" stroke="rgb(100, 116, 139)" strokeOpacity={0.5} tick={{ fontSize: 12 }} />
          <YAxis stroke="rgb(100, 116, 139)" strokeOpacity={0.5} tick={{ fontSize: 12 }} />
          <RechartsTooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
          {data.vitalSigns.some(v => v.bpSystolic) && (
            <Line type="monotone" dataKey="bpSystolic" stroke="#ef4444" dot={false} name="BP Systolic (mmHg)" strokeWidth={2} />
          )}
          {data.vitalSigns.some(v => v.bpDiastolic) && (
            <Line type="monotone" dataKey="bpDiastolic" stroke="#f97316" dot={false} name="BP Diastolic (mmHg)" strokeWidth={2} />
          )}
          {data.vitalSigns.some(v => v.pulseRate) && (
            <Line type="monotone" dataKey="pulseRate" stroke="#06b6d4" dot={false} name="Heart Rate (bpm)" strokeWidth={2} />
          )}
          {data.vitalSigns.some(v => v.temp) && (
            <Line type="monotone" dataKey="temp" stroke="#ec4899" dot={false} name="Temperature (°C)" strokeWidth={2} />
          )}
          {data.vitalSigns.some(v => v.spo2) && (
            <Line type="monotone" dataKey="spo2" stroke="#8b5cf6" dot={false} name="SpO₂ (%)" strokeWidth={2} />
          )}
          {data.vitalSigns.some(v => v.respRate) && (
            <Line type="monotone" dataKey="respRate" stroke="#14b8a6" dot={false} name="Respiration Rate (br/min)" strokeWidth={2} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
