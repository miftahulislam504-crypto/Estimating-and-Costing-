import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { RateAnalysisItem } from '@/types'

const COLORS: Record<string, string> = {
  material:  '#3b82f6',
  labor:     '#10b981',
  equipment: '#f59e0b',
  overhead:  '#9333ea',
  profit:    '#ec4899',
}
const LABELS_BN: Record<string, string> = {
  material: 'উপকরণ', labor: 'শ্রম', equipment: 'যন্ত্র', overhead: 'ওভারহেড', profit: 'মুনাফা',
}

export function RateBreakdownChart({ item }: { item: RateAnalysisItem }) {
  // Group by category
  const grouped: Record<string, number> = {}
  for (const c of item.components) {
    grouped[c.category] = (grouped[c.category] ?? 0) + c.amount
  }

  const data = Object.entries(grouped)
    .filter(([, v]) => v > 0)
    .map(([cat, value]) => ({ name: LABELS_BN[cat] ?? cat, value, color: COLORS[cat] ?? '#64748b' }))

  if (data.length === 0) return null

  const total = item.totalRate

  return (
    <div>
      <p className="text-xs text-surface-500 mb-2">Cost Breakdown</p>
      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
          </Pie>
          <Tooltip
            formatter={(val: number) => ['৳ ' + val.toLocaleString('en-BD', { maximumFractionDigits: 0 }), '']}
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 6, fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-surface-400">{d.name}</span>
            </div>
            <span className="text-xs font-mono text-surface-300">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
