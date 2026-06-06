import React, { useState } from 'react'
import { useBudgetStore, BUDGET_CATEGORIES } from '@/store/budgetStore'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { BudgetLine, BudgetCategory } from '@/types'

interface Props {
  projectId: string
  editLine?: BudgetLine
  onClose:   () => void
}

export function BudgetLineForm({ projectId, editLine, onClose }: Props) {
  const { addLine, updateLine } = useBudgetStore()
  const isEdit = !!editLine

  const [form, setForm] = useState({
    category:    (editLine?.category    ?? 'structure') as BudgetCategory,
    description: editLine?.description  ?? '',
    allocated:   editLine?.allocated    ?? 0,
    actual:      editLine?.actual       ?? 0,
    notes:       editLine?.notes        ?? '',
  })

  function set(k: string, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const variance = form.allocated - form.actual

  function handleSave() {
    if (!form.description.trim()) return
    const line: BudgetLine = {
      id:          editLine?.id ?? crypto.randomUUID(),
      category:    form.category,
      description: form.description,
      allocated:   Number(form.allocated),
      actual:      Number(form.actual),
      variance,
      percent:     0,   // recalculated by store
      notes:       form.notes || undefined,
    }
    if (isEdit) updateLine(projectId, line.id, line)
    else        addLine(projectId, line)
    onClose()
  }

  return (
    <Modal
      open
      title={isEdit ? 'Budget Line সম্পাদনা' : 'নতুন Budget Line'}
      onClose={onClose}
      size="md"
    >
      <div className="space-y-4">
        <Select
          label="Category"
          value={form.category}
          onChange={e => set('category', e.target.value)}
          options={BUDGET_CATEGORIES.map(c => ({
            value: c.id,
            label: `${c.icon} ${c.label} — ${c.labelBn}`,
          }))}
        />

        <Input
          label="Description *"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="বাজেট লাইনের বিবরণ..."
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Allocated Budget ৳"
            type="number" step="1000" min={0}
            value={form.allocated}
            onChange={e => set('allocated', +e.target.value)}
            prefix="৳"
            hint="পরিকল্পিত বাজেট"
          />
          <Input
            label="Actual Spent ৳"
            type="number" step="1000" min={0}
            value={form.actual}
            onChange={e => set('actual', +e.target.value)}
            prefix="৳"
            hint="এখন পর্যন্ত খরচ"
          />
        </div>

        {/* Variance preview */}
        <div className={`px-4 py-3 rounded-lg border flex justify-between items-center ${
          variance < 0
            ? 'bg-red-900/20 border-red-800/40'
            : 'bg-emerald-900/20 border-emerald-800/40'
        }`}>
          <span className="text-sm text-surface-400">Variance (Allocated − Actual)</span>
          <span className={`font-mono font-bold text-lg ${
            variance < 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {variance < 0 ? '-' : '+'}৳ {Math.abs(variance).toLocaleString('en-BD')}
          </span>
        </div>

        <Input
          label="Notes (ঐচ্ছিক)"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="অতিরিক্ত মন্তব্য..."
        />

        <div className="flex gap-3 pt-2 border-t border-surface-700">
          <Button variant="ghost" className="flex-1" onClick={onClose}>বাতিল</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!form.description.trim()}>
            {isEdit ? 'আপডেট করুন' : 'যোগ করুন'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
