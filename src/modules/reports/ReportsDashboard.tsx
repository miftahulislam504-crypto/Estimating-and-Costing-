import React, { useState } from 'react'
import {
  FileText, Download, Printer, FileSpreadsheet,
  CheckCircle, BarChart3, Package, TrendingUp,
  GitCompare, Lightbulb, Building2
} from 'lucide-react'
import { useProjectStore }      from '@/store/projectStore'
import { useTakeoffStore }      from '@/store/takeoffStore'
import { useBOQStore }          from '@/store/boqStore'
import { useEstimationStore }   from '@/store/estimationStore'
import { useBudgetStore }       from '@/store/budgetStore'
import { useProcurementStore }  from '@/store/procurementStore'
import { useCashFlowStore }     from '@/store/cashFlowStore'
import { useTenderStore }       from '@/store/tenderStore'
import { useVariationStore }    from '@/store/variationStore'
import { useVEStore }           from '@/store/veStore'
import { Button, SectionHeader, EmptyState, Badge } from '@/components/ui'
import { generateBOQReport }         from './generators/boqReport'
import { generateEstimationReport }  from './generators/estimationReport'
import { generateCashFlowReport }    from './generators/cashFlowReport'
import { generateBOQExcel }          from './generators/excelExport'
import { generateProjectSummaryPDF } from './generators/summaryReport'

interface ReportDef {
  id:       string
  title:    string
  titleBn:  string
  desc:     string
  icon:     React.ReactNode
  formats:  ('pdf' | 'excel')[]
  available: boolean
}

export function ReportsDashboard() {
  const { activeProject }   = useProjectStore()
  const { getSummary }      = useTakeoffStore()
  const { getBOQ }          = useBOQStore()
  const { getEstimation }   = useEstimationStore()
  const { getBudget }       = useBudgetStore()
  const { getPlan: getProcurement } = useProcurementStore()
  const { getPlan: getCashFlow }    = useCashFlowStore()
  const { getPackage }      = useTenderStore()
  const { getRegister: getVariation } = useVariationStore()
  const { getRegister: getVE }        = useVEStore()

  const project = activeProject()
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated, setGenerated]   = useState<Set<string>>(new Set())

  if (!project) return (
    <EmptyState
      icon={<FileText size={28} />}
      title="কোনো প্রজেক্ট নেই"
      description="Dashboard থেকে প্রজেক্ট খুলুন।"
    />
  )

  const boq         = getBOQ(project.id)
  const estimation  = getEstimation(project.id)
  const budget      = getBudget(project.id)
  const procurement = getProcurement(project.id)
  const cashFlow    = getCashFlow(project.id)
  const tenderEng   = getPackage(project.id, 'engineer')
  const variation   = getVariation(project.id)
  const ve          = getVE(project.id)
  const takeoff     = getSummary(project.id)

  const reports: ReportDef[] = [
    {
      id: 'project-summary', title: 'Project Summary', titleBn: 'প্রজেক্ট সারসংক্ষেপ',
      desc: 'Complete project overview — all modules in one PDF',
      icon: <Building2 size={20} />, formats: ['pdf'], available: true,
    },
    {
      id: 'boq-report', title: 'BOQ Report', titleBn: 'বিওকিউ রিপোর্ট',
      desc: 'Complete Bill of Quantities with all categories',
      icon: <FileSpreadsheet size={20} />, formats: ['pdf', 'excel'], available: !!boq,
    },
    {
      id: 'estimation-report', title: 'Cost Estimate Report', titleBn: 'খরচ অনুমান রিপোর্ট',
      desc: 'Detailed cost estimation with breakdown',
      icon: <BarChart3 size={20} />, formats: ['pdf', 'excel'], available: !!estimation,
    },
    {
      id: 'cashflow-report', title: 'Cash Flow Report', titleBn: 'ক্যাশ ফ্লো রিপোর্ট',
      desc: 'Monthly cash in/out forecast with S-curve',
      icon: <TrendingUp size={20} />, formats: ['pdf', 'excel'], available: !!cashFlow,
    },
    {
      id: 'procurement-report', title: 'Procurement Report', titleBn: 'ক্রয় পরিকল্পনা',
      desc: 'Material procurement schedule',
      icon: <Package size={20} />, formats: ['excel'], available: !!procurement,
    },
    {
      id: 'tender-report', title: "Tender BOQ", titleBn: 'দরপত্র বিওকিউ',
      desc: "Engineer's, Owner's & Contractor estimates",
      icon: <FileText size={20} />, formats: ['pdf', 'excel'], available: !!tenderEng,
    },
    {
      id: 'variation-report', title: 'Variation Register', titleBn: 'ভেরিয়েশন রেজিস্টার',
      desc: 'All change orders and net variations',
      icon: <GitCompare size={20} />, formats: ['pdf', 'excel'], available: !!(variation && variation.items.length > 0),
    },
    {
      id: 've-report', title: 'Value Engineering', titleBn: 'ভ্যালু ইঞ্জিনিয়ারিং',
      desc: 'Cost optimization proposals and savings',
      icon: <Lightbulb size={20} />, formats: ['pdf'], available: !!(ve && ve.items.length > 0),
    },
  ]

  async function handleGenerate(reportId: string, format: 'pdf' | 'excel') {
    setGenerating(`${reportId}-${format}`)
    try {
      switch (reportId) {
        case 'project-summary':
          await generateProjectSummaryPDF(project!, takeoff, boq, estimation, budget, cashFlow)
          break
        case 'boq-report':
          if (format === 'pdf')   await generateBOQReport(project!, boq!)
          if (format === 'excel') await generateBOQExcel(project!, boq!)
          break
        case 'estimation-report':
          await generateEstimationReport(project!, estimation!, format)
          break
        case 'cashflow-report':
          await generateCashFlowReport(project!, cashFlow!, format)
          break
        case 'procurement-report':
          await generateBOQExcel(project!, boq!, 'procurement', procurement)
          break
        case 'tender-report':
          await generateBOQReport(project!, boq!, 'tender', tenderEng ?? undefined)
          break
        default:
          alert('এই report শীঘ্রই আসছে।')
      }
      setGenerated(s => new Set(s).add(`${reportId}-${format}`))
    } catch (e) {
      console.error(e)
      alert('Report generation-এ সমস্যা হয়েছে।')
    } finally {
      setGenerating(null)
    }
  }

  const availableCount = reports.filter(r => r.available).length

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="Reports & Export"
        subtitle={`${project.name} — PDF ও Excel রিপোর্ট`}
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Reports Available', value: availableCount,      color: 'bg-brand-900/30 border-brand-700/40 text-brand-400' },
          { label: 'BOQ Items',         value: boq?.items.length ?? 0,  color: 'bg-surface-800 border-surface-700 text-surface-200' },
          { label: 'Grand Total',       value: estimation ? '৳ ' + Math.round(estimation.grandTotal / 100000).toLocaleString() + 'L' : '—', color: 'bg-surface-800 border-surface-700 text-surface-200' },
          { label: 'Cash Flow Months',  value: cashFlow?.durationMonths ?? 0, color: 'bg-surface-800 border-surface-700 text-surface-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
            <p className="text-xl font-display font-bold">{s.value}</p>
            <p className="text-xs text-surface-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(report => (
          <div
            key={report.id}
            className={`bg-surface-800 border rounded-xl p-5 transition-all ${
              report.available ? 'border-surface-700 hover:border-surface-600' : 'border-surface-800 opacity-50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  report.available ? 'bg-brand-900/40 text-brand-400' : 'bg-surface-700 text-surface-500'
                }`}>
                  {report.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{report.titleBn}</h3>
                  <p className="text-xs text-surface-500">{report.title}</p>
                </div>
              </div>
              {!report.available && (
                <Badge variant="default">Data নেই</Badge>
              )}
            </div>

            <p className="text-xs text-surface-400 mb-4">{report.desc}</p>

            {/* Format buttons */}
            {report.available && (
              <div className="flex gap-2">
                {report.formats.includes('pdf') && (
                  <button
                    onClick={() => handleGenerate(report.id, 'pdf')}
                    disabled={generating !== null}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      generated.has(`${report.id}-pdf`)
                        ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
                        : 'bg-red-900/20 border-red-800/40 text-red-400 hover:bg-red-900/30'
                    } disabled:opacity-50`}
                  >
                    {generating === `${report.id}-pdf` ? (
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : generated.has(`${report.id}-pdf`) ? (
                      <CheckCircle size={12} />
                    ) : (
                      <Download size={12} />
                    )}
                    PDF
                  </button>
                )}
                {report.formats.includes('excel') && (
                  <button
                    onClick={() => handleGenerate(report.id, 'excel')}
                    disabled={generating !== null}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      generated.has(`${report.id}-excel`)
                        ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
                        : 'bg-emerald-900/20 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/30'
                    } disabled:opacity-50`}
                  >
                    {generating === `${report.id}-excel` ? (
                      <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : generated.has(`${report.id}-excel`) ? (
                      <CheckCircle size={12} />
                    ) : (
                      <FileSpreadsheet size={12} />
                    )}
                    Excel
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Note */}
      <div className="mt-6 bg-surface-800/50 border border-surface-700/50 rounded-xl p-4 text-center">
        <p className="text-xs text-surface-500">
          📄 PDF — jsPDF দিয়ে তৈরি, browser-এ সরাসরি download হবে।
          📊 Excel — SheetJS দিয়ে তৈরি, .xlsx format।
        </p>
      </div>
    </div>
  )
}
