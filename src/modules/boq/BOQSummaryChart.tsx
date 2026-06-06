import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BOQ_CATEGORIES } from '@/store/boqStore'
import type { BOQItem } from '@/types'

const COLORS = ['#f59e0b','#3b82f6','#9333ea','#f97316','#10b981','#ec4899','#14b8a6']

interface Props { items: BOQItem[] }

export function BOQSummaryChart({ items }: Props) {
  const data = BOQ_CATEGORIES
    .map((cat, i) => ({
      name:  cat.label,
      nameBn: cat.labelBn,
      value: items.filter(i => i.category === cat.id).reduce((s, i) => s + i.amount, 0),
      color: COLORS[i % COLORS.length],
    }))
    .filter(d => d.value > 0)

  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
      <p className="text-sm font-semibold text-surface-300 mb-3">Category বিভাজন</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={45} outerRadius={72}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip
            formatter={(val: number) => ['৳ ' + val.toLocaleString('en-BD', { maximumFractionDigits: 0 }), '']}
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="space-y-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-surface-400">{d.name}</span>
            </div>
            <span className="text-xs font-mono text-surface-300">
              {((d.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
