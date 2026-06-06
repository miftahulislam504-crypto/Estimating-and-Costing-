import React from 'react'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Calculator, FileSpreadsheet, TrendingUp,
  Package, DollarSign, BarChart3, FileText, Building2,
  ChevronLeft, ChevronRight, Settings, Zap
} from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import type { AppView } from '@/types'

interface NavItem {
  id:       AppView
  label:    string
  labelBn:  string
  icon:     React.ReactNode
  group:    'core' | 'planning' | 'advanced'
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Projects',      labelBn: 'প্রজেক্ট',       icon: <LayoutDashboard size={18} />, group: 'core' },
  { id: 'takeoff',      label: 'Quantity Takeoff', labelBn: 'কোয়ান্টিটি',   icon: <Calculator size={18} />,     group: 'core' },
  { id: 'boq',          label: 'BOQ',           labelBn: 'বিওকিউ',          icon: <FileSpreadsheet size={18} />, group: 'core' },
  { id: 'rate-analysis',label: 'Rate Analysis', labelBn: 'রেট এনালাইসিস',  icon: <TrendingUp size={18} />,     group: 'core' },
  { id: 'cost-db',      label: 'Cost Database', labelBn: 'কস্ট ডেটাবেজ',  icon: <Package size={18} />,        group: 'core' },
  { id: 'estimation',   label: 'Cost Estimate', labelBn: 'খরচ অনুমান',      icon: <DollarSign size={18} />,     group: 'planning' },
  { id: 'budget',       label: 'Budget',        labelBn: 'বাজেট',           icon: <BarChart3 size={18} />,      group: 'planning' },
  { id: 'procurement',  label: 'Procurement',   labelBn: 'ক্রয় পরিকল্পনা',  icon: <Package  size={18} />,       group: 'planning' },
  { id: 'cashflow',     label: 'Cash Flow',     labelBn: 'ক্যাশ ফ্লো',      icon: <TrendingUp size={18} />,     group: 'planning', disabled: true },
  { id: 'reports',      label: 'Reports',       labelBn: 'রিপোর্ট',         icon: <FileText size={18} />,       group: 'advanced', disabled: true },
]

const GROUPS = {
  core:     'Foundation',
  planning: 'Planning',
  advanced: 'Advanced',
}

export function Sidebar() {
  const { currentView, setView, sidebarOpen, toggleSidebar, activeProject } = useProjectStore()
  const project = activeProject()

  return (
    <aside className={clsx(
      'flex flex-col h-full bg-surface-900 border-r border-surface-800 transition-all duration-300',
      sidebarOpen ? 'w-64' : 'w-16'
    )}>

      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-surface-800">
        {sidebarOpen && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow">
              <Building2 size={16} className="text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">CivilOS</p>
              <p className="text-brand-400 text-xs font-mono">Estimate</p>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-glow mx-auto">
            <Building2 size={16} className="text-white" />
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="text-surface-500 hover:text-surface-300 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Active Project */}
      {project && sidebarOpen && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-brand-900/30 border border-brand-800/50">
          <p className="text-xs text-brand-400 font-medium mb-0.5">Active Project</p>
          <p className="text-white text-sm font-medium truncate">{project.name}</p>
          <p className="text-surface-500 text-xs">{project.location}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {(['core', 'planning', 'advanced'] as const).map(group => {
          const items = NAV_ITEMS.filter(i => i.group === group)
          return (
            <div key={group} className="mb-6">
              {sidebarOpen && (
                <p className="text-xs font-medium text-surface-600 uppercase tracking-widest px-3 mb-2">
                  {GROUPS[group]}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setView(item.id)}
                    disabled={item.disabled}
                    title={!sidebarOpen ? item.label : undefined}
                    className={clsx(
                      'w-full flex items-center gap-3 rounded-lg transition-all duration-150',
                      sidebarOpen ? 'px-3 py-2' : 'px-0 py-2 justify-center',
                      item.disabled
                        ? 'opacity-30 cursor-not-allowed'
                        : currentView === item.id
                          ? 'bg-brand-900/60 text-brand-300 border border-brand-800/50'
                          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800'
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="text-sm font-medium truncate">{item.label}</span>
                        {item.disabled && (
                          <span className="text-xs text-surface-600 font-mono">Soon</span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Sprint badge */}
      {sidebarOpen && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-surface-800 border border-surface-700 flex items-center gap-2">
          <Zap size={12} className="text-amber-400" />
          <span className="text-xs text-surface-400">Sprint 4 — Budget + Procurement</span>
        </div>
      )}

      {/* Collapse toggle (when closed) */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="py-4 flex justify-center text-surface-500 hover:text-surface-300 border-t border-surface-800 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </aside>
  )
}
