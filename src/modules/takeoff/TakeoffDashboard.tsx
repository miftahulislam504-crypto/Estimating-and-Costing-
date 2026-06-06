import React, { useState } from 'react'
import {
  Plus, Calculator, RefreshCw, Download, Upload,
  Layers, Box, Columns, Grid3X3, Square, DoorOpen, AppWindow
} from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useTakeoffStore } from '@/store/takeoffStore'
import { Button, StatCard, SectionHeader, Badge, Card, EmptyState } from '@/components/ui'
import { TakeoffTable } from './TakeoffTable'
import { ElementForm } from './ElementForm'
import { TakeoffSummaryChart } from './TakeoffSummaryChart'
import type { ElementType } from '@/types'

const ELEMENT_TABS: { type: ElementType | 'all'; label: string; labelBn: string; icon: React.ReactNode }[] = [
  { type: 'all',     label: 'All',      labelBn: 'সব',      icon: <Layers size={14} /> },
  { type: 'beam',    label: 'Beams',    labelBn: 'বিম',     icon: <Box size={14} /> },
  { type: 'column',  label: 'Columns',  labelBn: 'কলাম',   icon: <Columns size={14} /> },
  { type: 'slab',    label: 'Slabs',    labelBn: 'স্ল্যাব', icon: <Grid3X3 size={14} /> },
  { type: 'footing', label: 'Footings', labelBn: 'ফুটিং',  icon: <Square size={14} /> },
  { type: 'wall',    label: 'Walls',    labelBn: 'দেয়াল',  icon: <Square size={14} /> },
  { type: 'door',    label: 'Doors',    labelBn: 'দরজা',   icon: <DoorOpen size={14} /> },
  { type: 'window',  label: 'Windows',  labelBn: 'জানালা', icon: <AppWindow size={14} /> },
]

export function TakeoffDashboard() {
  const { activeProject } = useProjectStore()
  const { getElements, getSummary, addElement, recompute } = useTakeoffStore()

  const project = activeProject()
  const [activeTab, setActiveTab]   = useState<ElementType | 'all'>('all')
  const [showForm, setShowForm]     = useState(false)
  const [formType, setFormType]     = useState<ElementType>('beam')
  const [showChart, setShowChart]   = useState(false)

  if (!project) return (
    <div className="flex-1 flex items-center justify-center">
      <EmptyState
        icon={<Calculator size={28} />}
        title="কোনো প্রজেক্ট নির্বাচিত নেই"
        description="Dashboard থেকে একটি প্রজেক্ট খুলুন।"
      />
    </div>
  )

  const elements = getElements(project.id)
  const summary  = getSummary(project.id)

  const filtered = activeTab === 'all'
    ? elements
    : elements.filter(e => e.type === activeTab)

  function openAddForm(type: ElementType) {
    setFormType(type)
    setShowForm(true)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Quantity Takeoff"
        subtitle={`${project.name} — Structural Element কোয়ান্টিটি`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={() => recompute(project.id)}>
              Recompute
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={14} />}>
              Export
            </Button>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => openAddForm('beam')}>
              Element যোগ করুন
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <StatCard
            label="Concrete"
            value={summary.totalConcreteVol.toFixed(2)}
            unit="m³"
            color="teal"
          />
          <StatCard
            label="Steel"
            value={(summary.totalSteelWeight / 1000).toFixed(2)}
            unit="MT"
            color="purple"
          />
          <StatCard
            label="Formwork"
            value={summary.totalFormworkArea.toFixed(1)}
            unit="m²"
            color="amber"
          />
          <StatCard
            label="Brick"
            value={summary.totalBrickQty.toLocaleString()}
            unit="nos"
            color="amber"
          />
          <StatCard
            label="Plaster"
            value={summary.totalPlasterArea.toFixed(1)}
            unit="m²"
            color="green"
          />
          <StatCard
            label="Paint"
            value={summary.totalPaintArea.toFixed(1)}
            unit="m²"
            color="green"
          />
          <StatCard
            label="Doors"
            value={summary.totalDoors}
            color="teal"
          />
          <StatCard
            label="Windows"
            value={summary.totalWindows}
            color="teal"
          />
        </div>
      )}

      {/* Floor Summary */}
      {summary && summary.byFloor.length > 1 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-surface-500 uppercase tracking-wider mb-3">ফ্লোর ভিত্তিক সারসংক্ষেপ</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {summary.byFloor.map(f => (
              <div key={f.floor} className="flex-shrink-0 bg-surface-800 border border-surface-700 rounded-lg px-4 py-3 min-w-[140px]">
                <p className="text-xs text-surface-500 mb-1">ফ্লোর {f.floor}</p>
                <p className="text-sm font-mono text-brand-400">{f.concreteVol.toFixed(2)} m³</p>
                <p className="text-xs text-surface-400">{(f.steelWeight / 1000).toFixed(2)} MT steel</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick add buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs text-surface-500 self-center mr-1">দ্রুত যোগ করুন:</span>
        {ELEMENT_TABS.filter(t => t.type !== 'all').map(t => (
          <button
            key={t.type}
            onClick={() => openAddForm(t.type as ElementType)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-800 border border-surface-700 text-surface-300 hover:border-brand-600 hover:text-brand-300 transition-all"
          >
            {t.icon}
            {t.labelBn}
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4 bg-surface-900 p-1 rounded-xl border border-surface-800 overflow-x-auto">
        {ELEMENT_TABS.map(t => {
          const count = t.type === 'all'
            ? elements.length
            : elements.filter(e => e.type === t.type).length
          return (
            <button
              key={t.type}
              onClick={() => setActiveTab(t.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === t.type
                  ? 'bg-brand-600 text-white'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
              }`}
            >
              {t.icon}
              {t.labelBn}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === t.type ? 'bg-brand-400/30' : 'bg-surface-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      {elements.length === 0 ? (
        <EmptyState
          icon={<Calculator size={28} />}
          title="কোনো Element নেই"
          description="Structural element যোগ করুন। System স্বয়ংক্রিয়ভাবে Concrete, Steel, Formwork হিসাব করবে।"
          action={
            <Button icon={<Plus size={16} />} onClick={() => openAddForm('beam')}>
              প্রথম Element যোগ করুন
            </Button>
          }
        />
      ) : (
        <TakeoffTable
          projectId={project.id}
          elements={filtered}
          activeTab={activeTab}
        />
      )}

      {/* Element Form Modal */}
      {showForm && (
        <ElementForm
          projectId={project.id}
          defaultType={formType}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
