import React from 'react'
import { Sidebar }                   from '@/components/layout/Sidebar'
import { useProjectStore }           from '@/store/projectStore'
import { ProjectHub }                from '@/modules/project/ProjectHub'
import { CostSettingsPanel }         from '@/modules/project/CostSettings'
import { TakeoffDashboard }          from '@/modules/takeoff/TakeoffDashboard'
import { BOQDashboard }              from '@/modules/boq/BOQDashboard'
import { RateAnalysisDashboard }     from '@/modules/rate-analysis/RateAnalysisDashboard'
import { CostDBDashboard }           from '@/modules/cost-db/CostDBDashboard'
import { EstimationDashboard }       from '@/modules/estimation/EstimationDashboard'
import { BudgetDashboard }           from '@/modules/budget/BudgetDashboard'
import { ProcurementDashboard }      from '@/modules/procurement/ProcurementDashboard'
import { CashFlowDashboard }         from '@/modules/cashflow/CashFlowDashboard'
import { TenderDashboard }           from '@/modules/tender/TenderDashboard'
import { VariationDashboard }        from '@/modules/variation/VariationDashboard'
import { ValueEngineeringDashboard } from '@/modules/value-eng/ValueEngineeringDashboard'
import { ReportsDashboard }          from '@/modules/reports/ReportsDashboard'
import { PMBridgeDashboard }         from '@/modules/bridge/PMBridgeDashboard'

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
      case 'cashflow':         return <CashFlowDashboard />
      case 'tender':           return <TenderDashboard />
      case 'variation':        return <VariationDashboard />
      case 'value-eng':        return <ValueEngineeringDashboard />
      case 'reports':          return <ReportsDashboard />
      case 'bridge':           return <PMBridgeDashboard />
      default:                 return <ProjectHub />
    }
  }

  return (
    // Light Clean — white/grey app shell
    <div className="h-screen flex bg-surface-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">{renderView()}</main>
    </div>
  )
}
