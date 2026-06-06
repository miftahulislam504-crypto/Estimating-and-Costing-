import React, { useState } from 'react'
import { Save, ArrowLeft } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { Button, Input, Select, SectionHeader } from '@/components/ui'
import type { CostSettings } from '@/types'

export function CostSettingsPanel() {
  const { activeProject, updateCostSettings, setView } = useProjectStore()
  const project = activeProject()

  const [settings, setSettings] = useState<CostSettings>(
    project?.costSettings ?? {
      currency: 'BDT', unit: 'metric',
      markupPercent: 10, overheadPercent: 12,
      profitPercent: 8, vatPercent: 15,
      taxPercent: 0, contingencyPct: 5,
    }
  )
  const [saved, setSaved] = useState(false)

  if (!project) return null

  function handleSave() {
    updateCostSettings(project!.id, settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function set(key: keyof CostSettings, value: number | string) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  // Live calculation preview
  const base = 1_000_000
  const overhead    = base * settings.overheadPercent / 100
  const subtotal    = base + overhead
  const profit      = subtotal * settings.profitPercent / 100
  const markup      = (subtotal + profit) * settings.markupPercent / 100
  const contingency = base * settings.contingencyPct / 100
  const vat         = (subtotal + profit + markup) * settings.vatPercent / 100
  const total       = subtotal + profit + markup + contingency + vat

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <SectionHeader
        title="কস্ট সেটিংস"
        subtitle={`${project.name} — খরচের হিসাব পরামিতি`}
        action={
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />} onClick={() => setView('dashboard')}>
            ফিরে যান
          </Button>
        }
      />

      <div className="max-w-3xl space-y-8">

        {/* Basic */}
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-6">
          <p className="text-sm font-semibold text-brand-400 mb-4">মূল সেটিংস</p>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="মুদ্রা"
              value={settings.currency}
              onChange={e => set('currency', e.target.value)}
              options={[
                { value: 'BDT', label: 'বাংলাদেশি টাকা (BDT ৳)' },
                { value: 'USD', label: 'US Dollar ($)' },
              ]}
            />
            <Select
              label="পরিমাপ পদ্ধতি"
              value={settings.unit}
              onChange={e => set('unit', e.target.value)}
              options={[
                { value: 'metric',   label: 'মেট্রিক (m, m², m³)' },
                { value: 'imperial', label: 'Imperial (ft, sft, cft)' },
              ]}
            />
          </div>
        </div>

        {/* Percentages */}
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-6">
          <p className="text-sm font-semibold text-brand-400 mb-4">খরচ পরামিতি (%)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'overheadPercent',  label: 'Overhead',    hint: 'অফিস খরচ, ব্যবস্থাপনা' },
              { key: 'profitPercent',    label: 'Profit',      hint: 'ঠিকাদারের মুনাফা' },
              { key: 'markupPercent',    label: 'Markup',      hint: 'অতিরিক্ত মার্কআপ' },
              { key: 'contingencyPct',   label: 'Contingency', hint: 'অপ্রত্যাশিত খরচ' },
              { key: 'vatPercent',       label: 'VAT',         hint: 'মূল্য সংযোজন কর' },
              { key: 'taxPercent',       label: 'Tax',         hint: 'আয়কর / অন্যান্য কর' },
            ].map(f => (
              <Input
                key={f.key}
                label={f.label}
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={(settings as any)[f.key]}
                onChange={e => set(f.key as keyof CostSettings, +e.target.value)}
                suffix="%"
                hint={f.hint}
              />
            ))}
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-gradient-to-br from-brand-900/30 to-surface-800 border border-brand-800/40 rounded-xl p-6">
          <p className="text-sm font-semibold text-brand-400 mb-4">
            লাইভ প্রিভিউ — ১০,০০,০০০ টাকা Direct Cost-এর উপর
          </p>
          <div className="space-y-2">
            {[
              { label: 'Direct Cost (Base)',  value: base,       color: 'text-surface-200' },
              { label: `Overhead (${settings.overheadPercent}%)`,    value: overhead,    color: 'text-amber-400' },
              { label: `Profit (${settings.profitPercent}%)`,       value: profit,      color: 'text-emerald-400' },
              { label: `Markup (${settings.markupPercent}%)`,        value: markup,      color: 'text-blue-400' },
              { label: `Contingency (${settings.contingencyPct}%)`, value: contingency, color: 'text-purple-400' },
              { label: `VAT (${settings.vatPercent}%)`,              value: vat,         color: 'text-orange-400' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-surface-700/50">
                <span className="text-sm text-surface-400">{row.label}</span>
                <span className={`text-sm font-mono font-medium ${row.color}`}>
                  ৳ {row.value.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold text-white">মোট প্রাক্কলিত খরচ</span>
              <span className="text-lg font-display font-bold text-brand-400">
                ৳ {total.toLocaleString('en-BD', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        <Button size="lg" className="w-full" icon={<Save size={16} />} onClick={handleSave}>
          {saved ? '✓ সংরক্ষিত হয়েছে' : 'সেটিংস সংরক্ষণ করুন'}
        </Button>
      </div>
    </div>
  )
}
