import React, { useState } from 'react'
import { useVariationStore } from '@/store/variationStore'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { VariationItem, VariationType, VariationStatus } from '@/types'

interface Props {
  projectId: string
  editItem?: VariationItem
  nextVONo:  string
  onClose:   () => void
}

export function VariationForm({ projectId, editItem, nextVONo, onClose }: Props) {
  const { addItem, updateItem } = useVariationStore()
  const isEdit = !!editItem

  const [form, setForm] = useState({
    voNo:        editItem?.voNo        ?? nextVONo,
    type:        editItem?.type        ?? 'addition' as VariationType,
    status:      editItem?.status      ?? 'pending' as VariationStatus,
    description: editItem?.description ?? '',
    reason:      editItem?.reason      ?? '',
    unit:        editItem?.unit        ?? 'm³',
    quantity:    editItem?.quantity    ?? 0,
    unitRate:    editItem?.unitRate    ?? 0,
    originalRef: editItem?.originalRef ?? '',
    raisedBy:    editItem?.raisedBy    ?? '',
    notes:       editItem?.notes       ?? '',
  })

  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })) }

  const amount = form.type === 'omission'
    ? -(form.quantity * form.unitRate)
    : form.quantity * form.unitRate

  function handleSave() {
    if (!form.description.trim()) return
    const item: VariationItem = {
      id:          editItem?.id ?? crypto.randomUUID(),
      voNo:        form.voNo,
      type:        form.type,
      status:      form.status,
      description: form.description,
      reason:      form.reason,
      unit:        form.unit,
      quantity:    Number(form.quantity),
      unitRate:    Number(form.unitRate),
      amount,
      originalRef: form.originalRef,
      raisedBy:    form.raisedBy,
      raisedDate:  editItem?.raisedDate ?? new Date().toISOString(),
      notes:       form.notes || undefined,
    }
    if (isEdit) updateItem(projectId, item)
    else        addItem(projectId, item)
    onClose()
  }

  const UNITS = ['m³','m²','m','kg','MT','nos','bag','ls','set'].map(v => ({ value: v, label: v }))

  return (
    <Modal open title={isEdit ? 'Variation সম্পাদনা' : 'নতুন Variation Order'} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Input label="VO Number" value={form.voNo} onChange={e => set('voNo', e.target.value)} placeholder="VO-001" />
          <Select label="Type" value={form.type} onChange={e => set('type', e.target.value)}
            options={[
              { value: 'addition',     label: '+ সংযোজন (Addition)' },
              { value: 'omission',     label: '− বাদ (Omission)' },
              { value: 'substitution', label: '↔ প্রতিস্থাপন (Substitution)' },
            ]} />
          <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}
            options={[
              { value: 'pending',     label: 'অপেক্ষমাণ' },
              { value: 'approved',    label: 'অনুমোদিত' },
              { value: 'implemented', label: 'বাস্তবায়িত' },
              { value: 'rejected',    label: 'প্রত্যাখ্যাত' },
            ]} />
        </div>

        <Input label="Description *" value={form.description} onChange={e => set('description', e.target.value)} placeholder="পরিবর্তনের বিবরণ..." />
        <Input label="Reason / Cause" value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="কারণ..." />

        <div className="grid grid-cols-3 gap-3">
          <Select label="Unit" value={form.unit} onChange={e => set('unit', e.target.value)} options={UNITS} />
          <Input label="Quantity" type="number" step="0.01" value={form.quantity} onChange={e => set('quantity', +e.target.value)} />
          <Input label="Unit Rate ৳" type="number" value={form.unitRate} onChange={e => set('unitRate', +e.target.value)} prefix="৳" />
        </div>

        {/* Amount preview */}
        <div className={`px-4 py-3 rounded-lg border flex justify-between ${
          amount > 0 ? 'bg-red-900/20 border-red-800/40' :
          amount < 0 ? 'bg-emerald-900/20 border-emerald-800/40' :
          'bg-surface-700/30 border-surface-700'
        }`}>
          <span className="text-sm text-surface-400">
            {form.type === 'omission' ? 'Credit Amount' : 'Extra Amount'}
          </span>
          <span className={`font-mono font-bold text-lg ${amount > 0 ? 'text-red-400' : amount < 0 ? 'text-emerald-400' : 'text-surface-400'}`}>
            {amount > 0 ? '+' : ''}{amount !== 0 ? '৳ ' + Math.abs(amount).toLocaleString('en-BD', { maximumFractionDigits: 0 }) : '৳ 0'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Original BOQ Ref" value={form.originalRef} onChange={e => set('originalRef', e.target.value)} placeholder="B.3, C.1..." />
          <Input label="Raised By" value={form.raisedBy} onChange={e => set('raisedBy', e.target.value)} placeholder="Engineer name" />
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
