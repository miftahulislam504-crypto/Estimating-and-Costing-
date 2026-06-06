import React, { useState } from 'react'
import { useEstimationStore, ESTIMATION_CATEGORIES } from '@/store/estimationStore'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { EstimationLineItem, EstimationCategory } from '@/types'

interface Props {
  projectId: string
  editItem?: EstimationLineItem
  onClose:   () => void
}

const UNIT_OPTIONS = ['m³','m²','m','kg','MT','nos','bag','ls','set','rft','sft']
  .map(v => ({ value: v, label: v }))

export function LineItemForm({ projectId, editItem, onClose }: Props) {
  const { addLineItem, updateLineItem } = useEstimationStore()
  const isEdit = !!editItem

  const [form, setForm] = useState({
    category:    (editItem?.category ?? 'structure') as EstimationCategory,
    description: editItem?.description ?? '',
    unit:        editItem?.unit        ?? 'm³',
    quantity:    editItem?.quantity    ?? 0,
    unitRate:    editItem?.unitRate    ?? 0,
  })

  function set(k: string, v: string | number) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const amount = form.quantity * form.unitRate

  function handleSave() {
    if (!form.description.trim()) return
    const item: EstimationLineItem = {
      id:          editItem?.id ?? crypto.randomUUID(),
      category:    form.category,
      description: form.description,
      unit:        form.unit,
      quantity:    Number(form.quantity),
      unitRate:    Number(form.unitRate),
      amount,
      source:      'manual',
    }
    if (isEdit) updateLineItem(projectId, item)
    else        addLineItem(projectId, item)
    onClose()
  }

  return (
    <Modal
      open
      title={isEdit ? 'Line Item সম্পাদনা' : 'নতুন Line Item'}
      onClose={onClose}
      size="md"
    >
      <div className="space-y-4">
        <Select
          label="Category"
          value={form.category}
          onChange={e => set('category', e.target.value)}
          options={ESTIMATION_CATEGORIES.map(c => ({ value: c.id, label: `${c.label} — ${c.labelBn}` }))}
        />
        <Input
          label="Description *"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="কাজের বিবরণ..."
        />
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="Unit"
            value={form.unit}
            onChange={e => set('unit', e.target.value)}
            options={UNIT_OPTIONS}
          />
          <Input
            label="Quantity"
            type="number" step="0.01" min={0}
            value={form.quantity}
            onChange={e => set('quantity', +e.target.value)}
          />
          <Input
            label="Unit Rate ৳"
            type="number" step="1" min={0}
            value={form.unitRate}
            onChange={e => set('unitRate', +e.target.value)}
            prefix="৳"
          />
        </div>

        {/* Live amount */}
        <div className="bg-brand-900/30 border border-brand-800/40 rounded-lg px-4 py-3 flex justify-between">
          <span className="text-sm text-brand-400">
            {form.quantity} × {form.unitRate.toLocaleString()} =
          </span>
          <span className="font-display font-bold text-brand-300 text-lg">
            ৳ {amount.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
          </span>
        </div>

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
