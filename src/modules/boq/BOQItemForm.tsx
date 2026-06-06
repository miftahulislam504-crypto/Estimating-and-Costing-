import React, { useState } from 'react'
import { useBOQStore, BOQ_CATEGORIES } from '@/store/boqStore'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { BOQItem, BOQCategory } from '@/types'

interface Props {
  projectId:       string
  defaultCategory: BOQCategory
  editItem?:       BOQItem
  onClose:         () => void
}

export function BOQItemForm({ projectId, defaultCategory, editItem, onClose }: Props) {
  const { addItem, updateItem } = useBOQStore()
  const isEdit = !!editItem

  const [form, setForm] = useState({
    itemNo:      editItem?.itemNo      ?? '',
    description: editItem?.description ?? '',
    unit:        editItem?.unit        ?? 'm³',
    quantity:    editItem?.quantity    ?? 0,
    rate:        editItem?.rate        ?? 0,
    category:    editItem?.category    ?? defaultCategory,
    notes:       editItem?.notes       ?? '',
  })

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const amount = form.quantity * form.rate

  function handleSave() {
    if (!form.description.trim()) return
    const item: BOQItem = {
      id:          editItem?.id ?? crypto.randomUUID(),
      itemNo:      form.itemNo,
      description: form.description,
      unit:        form.unit,
      quantity:    Number(form.quantity),
      rate:        Number(form.rate),
      amount,
      category:    form.category,
      source:      'manual',
      notes:       form.notes || undefined,
    }
    if (isEdit) updateItem(projectId, item)
    else        addItem(projectId, item)
    onClose()
  }

  const UNIT_OPTIONS = ['m³','m²','m','kg','MT','nos','bag','ton','ls','set','rft','sft','cft']
    .map(v => ({ value: v, label: v }))

  return (
    <Modal
      open
      title={`${isEdit ? 'BOQ Item সম্পাদনা' : 'নতুন BOQ Item'}`}
      onClose={onClose}
      size="md"
    >
      <div className="space-y-4">
        {/* Category + Item No */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={form.category}
            onChange={e => set('category', e.target.value)}
            options={BOQ_CATEGORIES.map(c => ({ value: c.id, label: `${c.label} — ${c.labelBn}` }))}
          />
          <Input
            label="Item No"
            value={form.itemNo}
            onChange={e => set('itemNo', e.target.value)}
            placeholder="A.1, B.2..."
          />
        </div>

        {/* Description */}
        <Input
          label="Description *"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="যেমন: RCC M20 — Column"
        />

        {/* Unit + Qty + Rate */}
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
            label="Rate (৳)"
            type="number" step="1" min={0}
            value={form.rate}
            onChange={e => set('rate', +e.target.value)}
            prefix="৳"
          />
        </div>

        {/* Live Amount */}
        <div className="bg-brand-900/30 border border-brand-800/40 rounded-lg px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-brand-400">Amount = {form.quantity} × {form.rate.toLocaleString()}</span>
          <span className="font-display font-bold text-brand-300 text-lg">
            ৳ {amount.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Notes */}
        <Input
          label="Notes (ঐচ্ছিক)"
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="অতিরিক্ত মন্তব্য..."
        />

        {/* Footer */}
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
