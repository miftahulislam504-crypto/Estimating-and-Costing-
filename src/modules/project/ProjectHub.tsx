import React, { useState } from 'react'
import { Plus, Building2, Archive, Trash2, Settings, ArrowRight, FolderOpen } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { Button, Badge, Card, EmptyState, SectionHeader } from '@/components/ui'
import { ProjectForm } from './ProjectForm'
import type { Project } from '@/types'

const BUILDING_TYPE_LABELS: Record<string, string> = {
  residential:   'আবাসিক',
  commercial:    'বাণিজ্যিক',
  industrial:    'শিল্প',
  mixed_use:     'মিশ্র',
  institutional: 'প্রাতিষ্ঠানিক',
  hospital:      'হাসপাতাল',
  school:        'শিক্ষা',
}

export function ProjectHub() {
  const { projects, setActiveProject, setView, deleteProject, archiveProject } = useProjectStore()
  const [showNewForm, setShowNewForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const active   = projects.filter(p => p.status !== 'archived')
  const archived = projects.filter(p => p.status === 'archived')

  function openProject(id: string) {
    setActiveProject(id)
    setView('takeoff')
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <SectionHeader
        title="প্রজেক্ট ড্যাশবোর্ড"
        subtitle="আপনার সকল Estimating প্রজেক্ট এখানে পরিচালনা করুন"
        action={
          <Button icon={<Plus size={16} />} onClick={() => setShowNewForm(true)}>
            নতুন প্রজেক্ট
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'মোট প্রজেক্ট',    value: projects.length,          color: 'bg-brand-500/10 text-brand-400 border-brand-700/30' },
          { label: 'সক্রিয়',           value: active.length,            color: 'bg-emerald-500/10 text-emerald-400 border-emerald-700/30' },
          { label: 'আর্কাইভড',         value: archived.length,          color: 'bg-amber-500/10 text-amber-400 border-amber-700/30' },
          { label: 'এই মাসে',          value: projects.filter(p => {
            const d = new Date(p.createdAt)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length, color: 'bg-purple-500/10 text-purple-400 border-purple-700/30' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
            <p className="text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active Projects */}
      {active.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={28} />}
          title="কোনো প্রজেক্ট নেই"
          description="প্রথম Estimating প্রজেক্ট তৈরি করুন। Structural Model থেকে Auto Quantity Takeoff শুরু হবে।"
          action={
            <Button icon={<Plus size={16} />} onClick={() => setShowNewForm(true)}>
              প্রথম প্রজেক্ট তৈরি করুন
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {active.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onOpen={() => openProject(p.id)}
              onSettings={() => { setActiveProject(p.id); setView('project-settings') }}
              onArchive={() => archiveProject(p.id)}
              onDelete={() => setConfirmDelete(p.id)}
            />
          ))}
        </div>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-surface-500 uppercase tracking-wider mb-3">
            আর্কাইভড প্রজেক্ট ({archived.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 opacity-60">
            {archived.map(p => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => openProject(p.id)}
                onSettings={() => {}}
                onArchive={() => {}}
                onDelete={() => setConfirmDelete(p.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewForm && (
        <ProjectForm onClose={() => setShowNewForm(false)} />
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-surface-800 border border-red-800/50 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-display font-bold text-white text-lg mb-2">প্রজেক্ট মুছে ফেলবেন?</h3>
            <p className="text-surface-400 text-sm mb-6">এই কাজ পূর্বাবস্থায় ফেরানো যাবে না। প্রজেক্টের সব ডেটা মুছে যাবে।</p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(null)}>বাতিল</Button>
              <Button variant="danger" className="flex-1" onClick={() => { deleteProject(confirmDelete); setConfirmDelete(null) }}>
                মুছে ফেলুন
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project, onOpen, onSettings, onArchive, onDelete
}: {
  project:    Project
  onOpen:     () => void
  onSettings: () => void
  onArchive:  () => void
  onDelete:   () => void
}) {
  const date = new Date(project.updatedAt).toLocaleDateString('bn-BD')

  return (
    <Card hover className="group p-0 overflow-hidden">
      {/* Color bar */}
      <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-400" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="font-display font-semibold text-white truncate">{project.name}</h3>
            <p className="text-surface-400 text-sm mt-0.5">{project.location}</p>
          </div>
          <Badge variant={project.status === 'active' ? 'success' : 'warning'}>
            {project.status === 'active' ? 'সক্রিয়' : 'আর্কাইভড'}
          </Badge>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'বিল্ডিং টাইপ', value: BUILDING_TYPE_LABELS[project.buildingType] ?? project.buildingType },
            { label: 'মোট ফ্লোর',    value: `${project.totalFloors} তলা` },
            { label: 'মোট এরিয়া',   value: `${project.totalArea.toLocaleString()} m²` },
            { label: 'আপডেট',        value: date },
          ].map(m => (
            <div key={m.label} className="bg-surface-900/50 rounded-lg px-3 py-2">
              <p className="text-xs text-surface-500">{m.label}</p>
              <p className="text-sm text-surface-200 font-medium">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" className="flex-1" icon={<ArrowRight size={14} />} onClick={onOpen}>
            খুলুন
          </Button>
          <button
            onClick={onSettings}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-300 hover:bg-surface-700 transition-colors"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={onArchive}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-amber-400 hover:bg-surface-700 transition-colors"
          >
            <Archive size={14} />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-700 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Card>
  )
}
