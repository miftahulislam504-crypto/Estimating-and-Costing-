import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { BUDGET_CATEGORIES } from '@/store/budgetStore'
import type { ProjectBudget } from '@/types'

const COLORS = ['#0694a2','#3b82f6','#ec4899','#14b8a6','#f59e0b','#9333ea','#f97316','#6366f1','#f43f5e']

const tooltipStyle = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 8,
  fontSize: 12,
}

const fmt = (v: number) => '৳ ' + Math.round(v / 1000).toLocaleString('en-BD') + 'K'

export function BudgetChart({ budget }: { budget: ProjectBudget }) {

  // Bar: Allocated vs Actual per category
  const barData = budget.lines.map(line => {
    const cat = BUDGET_CATEGORIES.find(c => c.id === line.category)
    return {
      name:      cat?.labelBn ?? line.category,
      Allocated: Math.round(line.allocated),
      Actual:    Math.round(line.actual),
    }
  })

  // Pie: allocation distribution
  const pieData = budget.lines.map((line, i) => ({
    name:  BUDGET_CATEGORIES.find(c => c.id === line.category)?.labelBn ?? line.category,
    value: Math.round(line.allocated),
    color: COLORS[i % COLORS.length],
  }))

  return (
    <div className="space-y-4">
      {/* Pie */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-surface-300 mb-3">Budget বণ্টন</p>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%" cy="50%"
              innerRadius={45} outerRadius={72}
              dataKey="value" paddingAngle={2}
            >
              {pieData.map((d, i) => (
                <Cell key={i} fill={d.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => [fmt(val), '']}
              contentStyle={tooltipStyle}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1 mt-1">
          {pieData.map((d, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-surface-400 truncate max-w-[100px]">{d.name}</span>
              </div>
              <span className="text-xs font-mono text-surface-500">
                {budget.totalAllocated > 0
                  ? ((d.value / budget.totalAllocated) * 100).toFixed(1)
                  : '0'}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar: Allocated vs Actual */}
      <div className="bg-surface-800 border border-surface-700 rounded-xl p-4">
        <p className="text-sm font-semibold text-surface-300 mb-3">Allocated vs Actual</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} layout="vertical" margin={{ left: 4, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={v => Math.round(v / 1000) + 'K'}
              tick={{ fontSize: 9, fill: '#64748b' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              width={56}
            />
            <Tooltip
              formatter={(val: number) => [fmt(val), '']}
              contentStyle={tooltipStyle}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10, color: '#64748b' }}
            />
            <Bar dataKey="Allocated" fill="#0694a2" radius={[0, 3, 3, 0]} barSize={6} />
            <Bar dataKey="Actual"    fill="#f59e0b" radius={[0, 3, 3, 0]} barSize={6} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
