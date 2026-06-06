import React, { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { Button, Input, Select, Modal } from '@/components/ui'
import type { BuildingType, Region } from '@/types'

interface Props {
  onClose: () => void
}

const BUILDING_TYPES: { value: BuildingType; label: string }[] = [
  { value: 'residential',   label: 'আবাসিক (Residential)' },
  { value: 'commercial',    label: 'বাণিজ্যিক (Commercial)' },
  { value: 'mixed_use',     label: 'মিশ্র ব্যবহার (Mixed Use)' },
  { value: 'industrial',    label: 'শিল্প (Industrial)' },
  { value: 'institutional', label: 'প্রাতিষ্ঠানিক (Institutional)' },
  { value: 'hospital',      label: 'হাসপাতাল (Hospital)' },
  { value: 'school',        label: 'শিক্ষা প্রতিষ্ঠান (School)' },
]

const REGIONS: { value: Region; label: string }[] = [
  { value: 'dhaka',      label: 'ঢাকা' },
  { value: 'chattogram', label: 'চট্টগ্রাম' },
  { value: 'rajshahi',   label: 'রাজশাহী' },
  { value: 'sylhet',     label: 'সিলেট' },
  { value: 'khulna',     label: 'খুলনা' },
  { value: 'barishal',   label: 'বরিশাল' },
  { value: 'rangpur',    label: 'রংপুর' },
  { value: 'mymensingh', label: 'ময়মনসিংহ' },
]

export function ProjectForm({ onClose }: Props) {
  const { createProject, setView } = useProjectStore()

  const [form, setForm] = useState({
    name:         '',
    location:     '',
    region:       'dhaka' as Region,
    buildingType: 'residential' as BuildingType,
    totalFloors:  6,
    totalArea:    500,
    plotArea:     200,
    owner:        '',
    consultant:   '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())     e.name     = 'প্রজেক্টের নাম দিন'
    if (!form.location.trim()) e.location = 'অবস্থান দিন'
    if (form.totalFloors < 1)  e.totalFloors = 'কমপক্ষে ১ তলা হতে হবে'
    if (form.totalArea < 1)    e.totalArea   = 'মোট এরিয়া দিন'
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    setLoading(true)
    try {
      createProject({
        ...form,
        status: 'active',
        costSettings: {
          currency:        'BDT',
          unit:            'metric',
          markupPercent:   10,
          overheadPercent: 12,
          profitPercent:   8,
          vatPercent:      15,
          taxPercent:      0,
          contingencyPct:  5,
        },
      })
      setView('takeoff')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  function set(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  return (
    <Modal open title="নতুন প্রজেক্ট তৈরি করুন" onClose={onClose} size="lg">
      <div className="space-y-6">

        {/* Section: Basic Info */}
        <div>
          <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-3">
            প্রজেক্ট তথ্য
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="প্রজেক্টের নাম *"
              placeholder="যেমন: মিরপুর ৬ তলা ভবন"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              error={errors.name}
            />
            <Input
              label="অবস্থান *"
              placeholder="যেমন: মিরপুর-২, ঢাকা"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              error={errors.location}
            />
            <Select
              label="অঞ্চল"
              value={form.region}
              onChange={e => set('region', e.target.value)}
              options={REGIONS}
            />
            <Select
              label="বিল্ডিং টাইপ"
              value={form.buildingType}
              onChange={e => set('buildingType', e.target.value)}
              options={BUILDING_TYPES}
            />
          </div>
        </div>

        {/* Section: Building Data */}
        <div>
          <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-3">
            বিল্ডিং ডেটা
          </p>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="মোট ফ্লোর"
              type="number"
              min={1}
              max={40}
              value={form.totalFloors}
              onChange={e => set('totalFloors', +e.target.value)}
              error={errors.totalFloors}
              suffix="তলা"
            />
            <Input
              label="মোট এরিয়া"
              type="number"
              min={1}
              value={form.totalArea}
              onChange={e => set('totalArea', +e.target.value)}
              error={errors.totalArea}
              suffix="m²"
            />
            <Input
              label="প্লট এরিয়া"
              type="number"
              min={1}
              value={form.plotArea}
              onChange={e => set('plotArea', +e.target.value)}
              suffix="m²"
            />
          </div>
        </div>

        {/* Section: Parties */}
        <div>
          <p className="text-xs font-medium text-brand-400 uppercase tracking-wider mb-3">
            সংশ্লিষ্ট পক্ষ (ঐচ্ছিক)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="মালিক / Client"
              placeholder="মালিকের নাম"
              value={form.owner}
              onChange={e => set('owner', e.target.value)}
            />
            <Input
              label="Consultant / Engineer"
              placeholder="পরামর্শকের নাম"
              value={form.consultant}
              onChange={e => set('consultant', e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-2 border-t border-surface-700">
          <Button variant="ghost" className="flex-1" onClick={onClose}>বাতিল</Button>
          <Button className="flex-1" loading={loading} onClick={handleSubmit}>
            প্রজেক্ট তৈরি করুন
          </Button>
        </div>
      </div>
    </Modal>
  )
}
