import React, { useState, useEffect, useMemo } from 'react'
import { useTakeoffStore } from '@/store/takeoffStore'
import { Button, Input, Select, Modal } from '@/components/ui'
import {
  makeBeam, makeColumn, makeSlab, makeFooting, makeWall,
  computeQuantities
} from './QuantityEngine'
import type {
  StructuralElement, ElementType,
  BeamElement, ColumnElement, SlabElement, FootingElement,
  WallElement, DoorElement, WindowElement
} from '@/types'

interface Props {
  projectId:    string
  defaultType:  ElementType
  editElement?: StructuralElement
  onClose:      () => void
}

const TYPE_OPTIONS: { value: ElementType; label: string }[] = [
  { value: 'beam',    label: 'বিম (Beam)' },
  { value: 'column',  label: 'কলাম (Column)' },
  { value: 'slab',    label: 'স্ল্যাব (Slab)' },
  { value: 'footing', label: 'ফুটিং (Footing)' },
  { value: 'wall',    label: 'দেয়াল (Wall / Masonry)' },
  { value: 'door',    label: 'দরজা (Door)' },
  { value: 'window',  label: 'জানালা (Window)' },
]

const CONCRETE_GRADES = ['M15','M20','M25','M30','M35'].map(v => ({ value: v, label: v }))
const STEEL_GRADES    = ['Fe415','Fe500','Fe500D','Fe550'].map(v => ({ value: v, label: v }))
const FLOORS          = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: `ফ্লোর ${i + 1}`
}))

function makeDefault(type: ElementType): StructuralElement {
  switch (type) {
    case 'beam':    return makeBeam()
    case 'column':  return makeColumn()
    case 'slab':    return makeSlab()
    case 'footing': return makeFooting()
    case 'wall':    return makeWall()
    case 'door':    return { id: crypto.randomUUID(), tag: 'D1', type: 'door', width: 0.9, height: 2.1, count: 1, floor: 1, material: 'wood' } as DoorElement
    case 'window':  return { id: crypto.randomUUID(), tag: 'W1', type: 'window', width: 1.2, height: 1.2, count: 1, floor: 1, material: 'steel' } as WindowElement
    default: return makeBeam()
  }
}

export function ElementForm({ projectId, defaultType, editElement, onClose }: Props) {
  const { addElement, updateElement } = useTakeoffStore()
  const isEdit = !!editElement

  const [elType, setElType] = useState<ElementType>(editElement?.type ?? defaultType)
  const [data, setData]     = useState<StructuralElement>(editElement ?? makeDefault(defaultType))

  useEffect(() => {
    if (!isEdit) setData(makeDefault(elType))
  }, [elType])

  function set(key: string, value: string | number) {
    setData(d => ({ ...d, [key]: value }))
  }

  const preview = useMemo(() => {
    try {
      const q = computeQuantities({ ...data, type: elType })
      const parts: string[] = []
      if (q.concreteVolume > 0) parts.push(`Concrete: ${q.concreteVolume.toFixed(3)} m³`)
      if (q.steelWeight > 0)    parts.push(`Steel: ${q.steelWeight.toFixed(1)} kg`)
      if (q.formworkArea > 0)   parts.push(`Formwork: ${q.formworkArea.toFixed(2)} m²`)
      if (q.brickQty > 0)       parts.push(`Brick: ${q.brickQty.toLocaleString()} nos`)
      return parts.join('  ·  ')
    } catch {
      return ''
    }
  }, [data, elType])

  function handleSave() {
    const el = { ...data, type: elType }
    if (isEdit) updateElement(projectId, el)
    else        addElement(projectId, el)
    onClose()
  }

  const commonFields = (
    <div className="grid grid-cols-3 gap-3">
      <Input label="Tag / ID" value={data.tag} onChange={e => set('tag', e.target.value)} placeholder="B1, C2..." />
      <Input label="সংখ্যা (Count)" type="number" min={1} value={data.count} onChange={e => set('count', +e.target.value)} />
      {'floor' in data && (
        <Select label="ফ্লোর" value={String((data as any).floor)} onChange={e => set('floor', +e.target.value)} options={FLOORS} />
      )}
    </div>
  )

  const gradeFields = (
    <div className="grid grid-cols-2 gap-3">
      {'concreteGrade' in data && (
        <Select label="Concrete Grade" value={(data as any).concreteGrade} onChange={e => set('concreteGrade', e.target.value)} options={CONCRETE_GRADES} />
      )}
      {'steelGrade' in data && (
        <Select label="Steel Grade" value={(data as any).steelGrade} onChange={e => set('steelGrade', e.target.value)} options={STEEL_GRADES} />
      )}
    </div>
  )

  let dimensionFields: React.ReactNode = null

  switch (elType) {
    case 'beam': {
      const b = data as BeamElement
      dimensionFields = (
        <div className="grid grid-cols-3 gap-3">
          <Input label="দৈর্ঘ্য L" type="number" step="0.01" value={b.length} onChange={e => set('length', +e.target.value)} suffix="m" hint="স্প্যান" />
          <Input label="প্রস্থ B"  type="number" step="0.01" value={b.width}  onChange={e => set('width',  +e.target.value)} suffix="m" />
          <Input label="গভীরতা D" type="number" step="0.01" value={b.depth}  onChange={e => set('depth',  +e.target.value)} suffix="m" />
        </div>
      ); break
    }
    case 'column': {
      const c = data as ColumnElement
      dimensionFields = (
        <div className="grid grid-cols-3 gap-3">
          <Input label="প্রস্থ B"  type="number" step="0.01" value={c.width}  onChange={e => set('width',  +e.target.value)} suffix="m" />
          <Input label="গভীরতা D" type="number" step="0.01" value={c.depth}  onChange={e => set('depth',  +e.target.value)} suffix="m" />
          <Input label="উচ্চতা H" type="number" step="0.01" value={c.height} onChange={e => set('height', +e.target.value)} suffix="m" />
        </div>
      ); break
    }
    case 'slab': {
      const s = data as SlabElement
      dimensionFields = (
        <div className="grid grid-cols-3 gap-3">
          <Input label="দৈর্ঘ্য L"  type="number" step="0.01"  value={s.length}    onChange={e => set('length',    +e.target.value)} suffix="m" />
          <Input label="প্রস্থ W"   type="number" step="0.01"  value={s.width}     onChange={e => set('width',     +e.target.value)} suffix="m" />
          <Input label="পুরুত্ব t" type="number" step="0.001" value={s.thickness} onChange={e => set('thickness', +e.target.value)} suffix="m" hint="যেমন 0.125" />
        </div>
      ); break
    }
    case 'footing': {
      const f = data as FootingElement
      dimensionFields = (
        <div className="grid grid-cols-3 gap-3">
          <Input label="দৈর্ঘ্য L" type="number" step="0.01" value={f.length} onChange={e => set('length', +e.target.value)} suffix="m" />
          <Input label="প্রস্থ W"  type="number" step="0.01" value={f.width}  onChange={e => set('width',  +e.target.value)} suffix="m" />
          <Input label="গভীরতা D" type="number" step="0.01" value={f.depth}  onChange={e => set('depth',  +e.target.value)} suffix="m" />
        </div>
      ); break
    }
    case 'wall': {
      const w = data as WallElement
      dimensionFields = (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Input label="দৈর্ঘ্য L"  type="number" step="0.01"  value={w.length}    onChange={e => set('length',    +e.target.value)} suffix="m" />
            <Input label="উচ্চতা H"  type="number" step="0.01"  value={w.height}    onChange={e => set('height',    +e.target.value)} suffix="m" />
            <Input label="পুরুত্ব t" type="number" step="0.001" value={w.thickness} onChange={e => set('thickness', +e.target.value)} suffix="m" hint='0.25 = 10"' />
          </div>
          <Select label="ইটের ধরন" value={w.brickType} onChange={e => set('brickType', e.target.value)}
            options={[
              { value: '1st_class', label: '১ম শ্রেণির ইট (1st Class)' },
              { value: '2nd_class', label: '২য় শ্রেণির ইট (2nd Class)' },
              { value: 'block',     label: 'কংক্রিট ব্লক (Block)' },
            ]} />
        </div>
      ); break
    }
    case 'door': {
      const d = data as DoorElement
      dimensionFields = (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="প্রস্থ W"  type="number" step="0.01" value={d.width}  onChange={e => set('width',  +e.target.value)} suffix="m" />
            <Input label="উচ্চতা H" type="number" step="0.01" value={d.height} onChange={e => set('height', +e.target.value)} suffix="m" />
          </div>
          <Select label="উপাদান" value={d.material} onChange={e => set('material', e.target.value)}
            options={[
              { value: 'wood',  label: 'কাঠের দরজা (Wood)' },
              { value: 'steel', label: 'স্টিলের দরজা (Steel)' },
              { value: 'upvc',  label: 'uPVC দরজা' },
            ]} />
        </div>
      ); break
    }
    case 'window': {
      const w = data as WindowElement
      dimensionFields = (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="প্রস্থ W"  type="number" step="0.01" value={w.width}  onChange={e => set('width',  +e.target.value)} suffix="m" />
            <Input label="উচ্চতা H" type="number" step="0.01" value={w.height} onChange={e => set('height', +e.target.value)} suffix="m" />
          </div>
          <Select label="উপাদান" value={w.material} onChange={e => set('material', e.target.value)}
            options={[
              { value: 'steel',    label: 'স্টিল (Steel)' },
              { value: 'upvc',     label: 'uPVC' },
              { value: 'aluminum', label: 'অ্যালুমিনিয়াম' },
            ]} />
        </div>
      ); break
    }
  }

  return (
    <Modal open title={`${isEdit ? 'সম্পাদনা' : 'নতুন'} — ${TYPE_OPTIONS.find(t => t.value === elType)?.label ?? 'Element'}`} onClose={onClose} size="md">
      <div className="space-y-4">
        {!isEdit && (
          <Select label="Element টাইপ" value={elType} onChange={e => setElType(e.target.value as ElementType)} options={TYPE_OPTIONS} />
        )}
        {commonFields}
        <div className="border-t border-surface-700 pt-4">
          <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-3">মাত্রা (Dimensions)</p>
          {dimensionFields}
        </div>
        {['beam','column','slab','footing'].includes(elType) && (
          <div className="border-t border-surface-700 pt-4">
            <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-3">উপকরণ গ্রেড</p>
            {gradeFields}
          </div>
        )}
        {preview && (
          <div className="bg-brand-900/30 border border-brand-800/40 rounded-lg px-4 py-3">
            <p className="text-xs text-brand-400 font-medium mb-1">⚡ Auto Calculated</p>
            <p className="text-sm font-mono text-brand-200 leading-relaxed">{preview}</p>
          </div>
        )}
        <div className="flex gap-3 pt-2 border-t border-surface-700">
          <Button variant="ghost" className="flex-1" onClick={onClose}>বাতিল</Button>
          <Button className="flex-1" onClick={handleSave}>{isEdit ? 'আপডেট করুন' : 'যোগ করুন'}</Button>
        </div>
      </div>
    </Modal>
  )
}
