import React, { useState } from 'react'
import { useVEStore } from '@/store/veStore'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { ValueEngineeringItem, VECategory, VEStatus } from '@/types'

interface Props {
  projectId: string
  editItem?: ValueEngineeringItem
  onClose:   () => void
}

export function VEForm({ projectId, editItem, onClose }: Props) {
  const { addItem, updateItem } = useVEStore()
  const isEdit = !!editItem

  const [form, setForm] = useState({
    category:        (editItem?.category        ?? 'material')  as VECategory,
    status:          (editItem?.status          ?? 'proposed')  as VEStatus,
    title:           editItem?.title            ?? '',
    titleBn:         editItem?.titleBn          ?? '',
    description:     editItem?.description      ?? '',
    originalMethod:  editItem?.originalMethod   ?? '',
    proposedMethod:  editItem?.proposedMethod   ?? '',
    originalCost:    editItem?.originalCost     ?? 0,
    proposedCost:    editItem?.proposedCost     ?? 0,
    riskLevel:       editItem?.riskLevel        ?? 'low' as 'low'|'medium'|'high',
    implementationTime: editItem?.implementationTime ?? '',
    proposedBy:      editItem?.proposedBy       ?? '',
  })

  function set(k: string, v: string | number) { setForm(f => ({ ...f, [k]: v })) }

  const potentialSaving = Math.max(0, form.originalCost - form.proposedCost)
  const savingPercent   = form.originalCost > 0 ? Math.round((potentialSaving / form.originalCost) * 100) : 0

  function handleSave() {
    if (!form.title.trim()) return
    const item: ValueEngineeringItem = {
      id:              editItem?.id ?? crypto.randomUUID(),
      category:        form.category,
      status:          form.status,
      title:           form.title,
      titleBn:         form.titleBn,
      description:     form.description,
      originalMethod:  form.originalMethod,
      proposedMethod:  form.proposedMethod,
      originalCost:    Number(form.originalCost),
      proposedCost:    Number(form.proposedCost),
      potentialSaving,
      savingPercent,
      riskLevel:       form.riskLevel,
      implementationTime: form.implementationTime,
      proposedBy:      form.proposedBy,
      proposedDate:    editItem?.proposedDate ?? new Date().toISOString(),
    }
    if (isEdit) updateItem(projectId, item)
    else        addItem(projectId, item)
    onClose()
  }

  return (
    <Modal open title={isEdit ? 'VE Proposal সম্পাদনা' : 'নতুন VE Proposal'} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Category" value={form.category} onChange={e => set('category', e.target.value)}
            options={[
              { value: 'structural',  label: '🏗️ Structural' },
              { value: 'material',    label: '🧱 Material' },
              { value: 'method',      label: '⚙️ Method' },
              { value: 'design',      label: '📐 Design' },
              { value: 'procurement', label: '📦 Procurement' },
            ]} />
          <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}
            options={[
              { value: 'proposed',     label: 'প্রস্তাবিত' },
              { value: 'under_review', label: 'পর্যালোচনাধীন' },
              { value: 'accepted',     label: 'গৃহীত' },
              { value: 'rejected',     label: 'প্রত্যাখ্যাত' },
            ]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Title (English)" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Column Size Optimization" />
          <Input label="Title (বাংলা)"   value={form.titleBn} onChange={e => set('titleBn', e.target.value)} placeholder="কলামের আকার হ্রাস" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Original Method" value={form.originalMethod} onChange={e => set('originalMethod', e.target.value)} placeholder="বর্তমান পদ্ধতি..." />
          <Input label="Proposed Method" value={form.proposedMethod} onChange={e => set('proposedMethod', e.target.value)} placeholder="প্রস্তাবিত পদ্ধতি..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Original Cost ৳" type="number" value={form.originalCost} onChange={e => set('originalCost', +e.target.value)} prefix="৳" />
          <Input label="Proposed Cost ৳" type="number" value={form.proposedCost} onChange={e => set('proposedCost', +e.target.value)} prefix="৳" />
        </div>

        {/* Saving preview */}
        {potentialSaving > 0 && (
          <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-4 py-3 flex justify-between">
            <span className="text-sm text-surface-400">Potential Saving ({savingPercent}%)</span>
            <span className="font-display font-bold text-emerald-400 text-lg">
              ৳ {potentialSaving.toLocaleString('en-BD')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Select label="Risk Level" value={form.riskLevel} onChange={e => set('riskLevel', e.target.value)}
            options={[
              { value: 'low',    label: '✅ Low Risk' },
              { value: 'medium', label: '⚠️ Medium Risk' },
              { value: 'high',   label: '🔴 High Risk' },
            ]} />
          <Input label="Implementation Time" value={form.implementationTime} onChange={e => set('implementationTime', e.target.value)} placeholder="2 weeks" />
          <Input label="Proposed By" value={form.proposedBy} onChange={e => set('proposedBy', e.target.value)} placeholder="Engineer name" />
        </div>

        <div className="flex gap-3 pt-2 border-t border-surface-700">
          <Button variant="ghost" className="flex-1" onClick={onClose}>বাতিল</Button>
          <Button className="flex-1" onClick={handleSave} disabled={!form.title.trim()}>
            {isEdit ? 'আপডেট করুন' : 'যোগ করুন'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
