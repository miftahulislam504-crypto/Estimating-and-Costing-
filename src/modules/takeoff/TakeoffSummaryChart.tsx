import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import type { TakeoffSummary } from '@/types'

interface Props {
  summary: TakeoffSummary
}

const COLORS = ['#0694a2', '#9333ea', '#f59e0b', '#10b981', '#ef4444']

export function TakeoffSummaryChart({ summary }: Props) {
  const floorData = summary.byFloor.map(f => ({
    name: `F${f.floor}`,
    concrete: +f.concreteVol.toFixed(2),
    steel:    +(f.steelWeight / 1000).toFixed(2),
    formwork: +f.formworkArea.toFixed(1),
  }))

  const pieData = [
    { name: 'Concrete (m³)', value: +summary.totalConcreteVol.toFixed(2) },
    { name: 'Steel (MT)',     value: +(summary.totalSteelWeight / 1000).toFixed(2) },
    { name: 'Formwork (m²)', value: +summary.totalFormworkArea.toFixed(1) },
  ].filter(d => d.value > 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Floor-wise bar */}
      {floorData.length > 1 && (
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
          <p className="text-sm font-medium text-surface-300 mb-4">ফ্লোর ভিত্তিক Concrete (m³)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={floorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="concrete" fill="#0694a2" radius={[4, 4, 0, 0]} name="Concrete m³" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quantity distribution pie */}
      {pieData.length > 0 && (
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
          <p className="text-sm font-medium text-surface-300 mb-4">Quantity Distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
