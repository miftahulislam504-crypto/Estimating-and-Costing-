import React from 'react'
import { Sidebar }               from '@/components/layout/Sidebar'
import { useProjectStore }       from '@/store/projectStore'
import { ProjectHub }            from '@/modules/project/ProjectHub'
import { CostSettingsPanel }     from '@/modules/project/CostSettings'
import { TakeoffDashboard }      from '@/modules/takeoff/TakeoffDashboard'
import { BOQDashboard }          from '@/modules/boq/BOQDashboard'
import { RateAnalysisDashboard } from '@/modules/rate-analysis/RateAnalysisDashboard'
import { CostDBDashboard }       from '@/modules/cost-db/CostDBDashboard'
import { EstimationDashboard }   from '@/modules/estimation/EstimationDashboard'
import { BudgetDashboard }       from '@/modules/budget/BudgetDashboard'
import { ProcurementDashboard }  from '@/modules/procurement/ProcurementDashboard'

function ComingSoon({ title, sprint }: { title: string; sprint: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-4 mx-auto text-3xl">🚧</div>
        <h2 className="font-display font-bold text-white text-xl mb-2">{title}</h2>
        <p className="text-surface-500 text-sm">{sprint}-এ আসবে।</p>
      </div>
    </div>
  )
}

export default function App() {
  const { currentView } = useProjectStore()

  function renderView() {
    switch (currentView) {
      case 'dashboard':        return <ProjectHub />
      case 'project-settings': return <CostSettingsPanel />
      case 'takeoff':          return <TakeoffDashboard />
      case 'boq':              return <BOQDashboard />
      case 'rate-analysis':    return <RateAnalysisDashboard />
      case 'cost-db':          return <CostDBDashboard />
      case 'estimation':       return <EstimationDashboard />
      case 'budget':           return <BudgetDashboard />
      case 'procurement':      return <ProcurementDashboard />
      case 'cashflow':         return <ComingSoon title="Cash Flow Engine"  sprint="Sprint 5" />
      case 'reports':          return <ComingSoon title="Reports & Export"  sprint="Sprint 7" />
      default:                 return <ProjectHub />
    }
  }

  return (
    <div className="h-screen flex bg-surface-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">{renderView()}</main>
    </div>
  )
}
