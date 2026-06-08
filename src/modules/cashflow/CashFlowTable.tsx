import React, { useState } from 'react'
import { useCashFlowStore } from '@/store/cashFlowStore'
import type { CashFlowPlan } from '@/types'

const fmtN = (n: number) =>
  Math.round(Math.abs(n)).toLocaleString('en-BD')

export function CashFlowTable({
  plan, projectId
}: { plan: CashFlowPlan; projectId: string }) {
  const { updateMonth } = useCashFlowStore()
  const [editCell, setEditCell] = useState<{ row: number; col: 'cashIn' | 'cashOut' } | null>(null)
  const [editVal, setEditVal]   = useState(0)

  function startEdit(row: number, col: 'cashIn' | 'cashOut', val: number) {
    setEditCell({ row, col })
    setEditVal(val)
  }

  function commitEdit() {
    if (!editCell) return
    updateMonth(projectId, editCell.row, { [editCell.col]: editVal })
    setEditCell(null)
  }

  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-surface-900/80 border-b border-surface-700">
            <tr>
              <th className="px-3 py-2.5 text-left text-surface-500 uppercase tracking-wider sticky left-0 bg-surface-900/80 w-28">Month</th>
              <th className="px-3 py-2.5 text-right text-surface-500 uppercase tracking-wider text-brand-500">Advance ৳</th>
              <th className="px-3 py-2.5 text-right text-surface-500 uppercase tracking-wider">Receipt ৳</th>
              <th className="px-3 py-2.5 text-right text-surface-500 uppercase tracking-wider">Retention ৳</th>
              <th className="px-3 py-2.5 text-right text-surface-500 uppercase tracking-wider text-emerald-500">Total In ৳</th>
              <th className="px-3 py-2.5 text-right text-surface-500 uppercase tracking-wider text-amber-500">Total Out ৳</th>
              <th className="px-3 py-2.5 text-right text-surface-500 uppercase tracking-wider">Net Flow ৳</th>
              <th className="px-3 py-2.5 text-right text-surface-500 uppercase tracking-wider">Balance ৳</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700/30">
            {plan.months.map((m, i) => {
              const isNegBal  = m.runningBalance < 0
              const isNegFlow = m.netFlow < 0

              return (
                <tr key={i} className="hover:bg-surface-750/40 transition-colors">
                  <td className="px-3 py-2 font-medium text-surface-200 sticky left-0 bg-surface-800 whitespace-nowrap">
                    {m.label.split(' ')[0]}
                    <span className="text-surface-500 ml-1 text-xs">{m.label.split(' ').slice(1).join(' ')}</span>
                  </td>

                  {/* Advance */}
                  <td className="px-3 py-2 text-right font-mono text-brand-400">
                    {m.advanceReceipt > 0 ? fmtN(m.advanceReceipt) : '—'}
                  </td>

                  {/* Contract Receipt */}
                  <td className="px-3 py-2 text-right font-mono text-surface-300">
                    {m.contractReceipt > 0 ? fmtN(m.contractReceipt) : '—'}
                  </td>

                  {/* Retention Release */}
                  <td className="px-3 py-2 text-right font-mono text-purple-400">
                    {m.retentionRelease > 0 ? fmtN(m.retentionRelease) : '—'}
                  </td>

                  {/* Total Cash In — editable */}
                  <td className="px-3 py-2 text-right">
                    {editCell?.row === i && editCell.col === 'cashIn' ? (
                      <input
                        type="number"
                        value={editVal}
                        onChange={e => setEditVal(+e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => e.key === 'Enter' && commitEdit()}
                        autoFocus
                        className="w-24 bg-surface-900 border border-brand-500 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(i, 'cashIn', m.cashIn)}
                        className="font-mono font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {fmtN(m.cashIn)}
                      </button>
                    )}
                  </td>

                  {/* Total Cash Out — editable */}
                  <td className="px-3 py-2 text-right">
                    {editCell?.row === i && editCell.col === 'cashOut' ? (
                      <input
                        type="number"
                        value={editVal}
                        onChange={e => setEditVal(+e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => e.key === 'Enter' && commitEdit()}
                        autoFocus
                        className="w-24 bg-surface-900 border border-brand-500 rounded px-1.5 py-0.5 text-right font-mono text-xs text-white focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => startEdit(i, 'cashOut', m.cashOut)}
                        className="font-mono font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        {fmtN(m.cashOut)}
                      </button>
                    )}
                  </td>

                  {/* Net Flow */}
                  <td className="px-3 py-2 text-right font-mono font-semibold">
                    <span className={isNegFlow ? 'text-red-400' : 'text-emerald-400'}>
                      {isNegFlow ? '−' : '+'}{fmtN(m.netFlow)}
                    </span>
                  </td>

                  {/* Running Balance */}
                  <td className="px-3 py-2 text-right font-mono font-bold">
                    <span className={isNegBal ? 'text-red-400' : 'text-brand-400'}>
                      {isNegBal ? '−' : ''}{fmtN(m.runningBalance)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="border-t-2 border-surface-600 bg-surface-900/60">
            <tr>
              <td className="px-3 py-3 font-bold text-surface-300 text-xs uppercase">মোট</td>
              <td colSpan={3} />
              <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">
                {fmtN(plan.totalCashIn)}
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-amber-400">
                {fmtN(plan.totalCashOut)}
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-surface-200">
                {plan.netProfit >= 0 ? '+' : '−'}{fmtN(plan.netProfit)}
              </td>
              <td className="px-3 py-3 text-right font-mono font-bold text-brand-400">
                {fmtN(plan.months[plan.months.length - 1]?.runningBalance ?? 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-surface-600 text-center py-2">
        Cash In / Out cells-এ click করে সরাসরি edit করুন
      </p>
    </div>
  )
}
