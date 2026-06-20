import React from 'react'
import { clsx } from 'clsx'
import {
  LayoutDashboard, Calculator, FileSpreadsheet, TrendingUp,
  Package, DollarSign, BarChart3, FileText, Building2,
  ChevronLeft, ChevronRight, Settings, Zap, GitBranch, Lightbulb, Link2
} from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import type { AppView } from '@/types'

interface NavItem {
  id:       AppView
  label:    string
  icon:     React.ReactNode
  group:    'core' | 'planning' | 'advanced'
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Projects',        icon: <LayoutDashboard size={16} />, group: 'core' },
  { id: 'takeoff',      label: 'Quantity Takeoff', icon: <Calculator size={16} />,     group: 'core' },
  { id: 'boq',          label: 'BOQ',              icon: <FileSpreadsheet size={16} />, group: 'core' },
  { id: 'rate-analysis',label: 'Rate Analysis',    icon: <TrendingUp size={16} />,     group: 'core' },
  { id: 'cost-db',      label: 'Cost Database',    icon: <Package size={16} />,        group: 'core' },
  { id: 'estimation',   label: 'Cost Estimate',    icon: <DollarSign size={16} />,     group: 'planning' },
  { id: 'budget',       label: 'Budget',           icon: <BarChart3 size={16} />,      group: 'planning' },
  { id: 'procurement',  label: 'Procurement',      icon: <Package size={16} />,        group: 'planning' },
  { id: 'cashflow',     label: 'Cash Flow',        icon: <TrendingUp size={16} />,     group: 'planning' },
  { id: 'tender',       label: 'Tender & Bid',     icon: <FileText size={16} />,       group: 'planning' },
  { id: 'reports',      label: 'Reports',          icon: <FileText size={16} />,       group: 'advanced' },
  { id: 'variation',    label: 'Variation',        icon: <GitBranch size={16} />,      group: 'advanced' },
  { id: 'value-eng',    label: 'Value Eng.',       icon: <Lightbulb size={16} />,      group: 'advanced' },
  { id: 'bridge',       label: 'PM Bridge',        icon: <Link2 size={16} />,          group: 'advanced' },
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
      'flex flex-col h-full bg-white border-r border-surface-300 transition-all duration-300',
      sidebarOpen ? 'w-60' : 'w-14'
    )}>

      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-surface-300">
        {sidebarOpen && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm">
              <Building2 size={15} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-surface-950 text-sm leading-tight">CivilOS</p>
              <p className="text-brand-500 text-xs font-mono tracking-wide">Estimate</p>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-sm mx-auto">
            <Building2 size={15} className="text-white" />
          </div>
        )}
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="text-surface-500 hover:text-surface-700 hover:bg-surface-100 w-7 h-7 flex items-center justify-center rounded-md transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {/* Active Project */}
      {project && sidebarOpen && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-brand-50 border border-brand-100">
          <p className="text-xs text-brand-500 font-medium mb-0.5">Active Project</p>
          <p className="text-surface-900 text-sm font-semibold truncate">{project.name}</p>
          <p className="text-surface-500 text-xs truncate">{project.location}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {(['core', 'planning', 'advanced'] as const).map(group => {
          const items = NAV_ITEMS.filter(i => i.group === group)
          return (
            <div key={group} className="mb-5">
              {sidebarOpen && (
                <p className="text-xs font-semibold text-surface-400 uppercase tracking-widest px-2 mb-1.5">
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
                      'w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 text-left',
                      sidebarOpen ? 'px-2.5 py-2' : 'px-0 py-2 justify-center',
                      item.disabled
                        ? 'opacity-40 cursor-not-allowed text-surface-400'
                        : currentView === item.id
                          ? 'bg-brand-50 text-brand-600 font-semibold border border-brand-100'
                          : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100'
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {sidebarOpen && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="text-sm truncate">{item.label}</span>
                        {item.disabled && (
                          <span className="text-xs text-surface-400 font-mono">Soon</span>
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

      {/* Version badge */}
      {sidebarOpen && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-surface-100 border border-surface-200 flex items-center gap-2">
          <Zap size={11} className="text-warning-500" />
          <span className="text-xs text-surface-500">CivilOS Estimate v1.0</span>
        </div>
      )}

      {/* Expand toggle (when closed) */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="py-3.5 flex justify-center text-surface-400 hover:text-surface-600 border-t border-surface-300 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </aside>
  )
}
