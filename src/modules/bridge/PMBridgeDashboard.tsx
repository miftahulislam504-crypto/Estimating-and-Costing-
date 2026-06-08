import React, { useState, useRef } from 'react'
import {
  Link2, Download, Upload, CheckCircle2, Circle,
  ArrowRight, FileJson, Package, RefreshCw, Eye,
  Building2, BarChart3, TrendingUp, Truck, GitBranch,
  Lightbulb, Calculator, DollarSign, Layers
} from 'lucide-react'
import { useProjectStore }      from '@/store/projectStore'
import { useTakeoffStore }      from '@/store/takeoffStore'
import { useEstimationStore }   from '@/store/estimationStore'
import { useBudgetStore }       from '@/store/budgetStore'
import { useProcurementStore }  from '@/store/procurementStore'
import { useCashFlowStore }     from '@/store/cashFlowStore'
import { useVariationStore }    from '@/store/variationStore'
import { useVEStore }           from '@/store/veStore'
import { Button, SectionHeader, EmptyState, Badge } from '@/components/ui'
import {
  buildDataBridge, downloadCivilOS, downloadJSON, downloadCSV, importCivilOSFile
} from './bridgeBuilder'
import type { CivilOSDataBridge, BridgeExportLog } from '@/types'

const fmt = (n: number) => '৳ ' + Math.round(n).toLocaleString('en-BD')

// ─── Module status config ─────────────────────────────────────────────────────

interface ModuleStatus {
  id:       string
  label:    string
  labelBn:  string
  icon:     React.ReactNode
  hasData:  boolean
  summary:  string
  color:    string
}

export function PMBridgeDashboard() {
  const { activeProject, setView }   = useProjectStore()
  const { getSummary }               = useTakeoffStore()
  const { getEstimation }            = useEstimationStore()
  const { getBudget }                = useBudgetStore()
  const { getPlan: getProcurement }  = useProcurementStore()
  const { getPlan: getCashFlow }     = useCashFlowStore()
  const { getRegister: getVariation } = useVariationStore()
  const { getRegister: getVE }        = useVEStore()

  const project    = activeProject()
  const [logs, setLogs]           = useState<BridgeExportLog[]>([])
  const [preview, setPreview]     = useState<CivilOSDataBridge | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!project) return (
    <EmptyState
      icon={<Link2 size={28} />}
      title="কোনো প্রজেক্ট নেই"
      description="Dashboard থেকে প্রজেক্ট খুলুন।"
    />
  )

  const takeoff    = getSummary(project.id)
  const estimation = getEstimation(project.id)
  const budget     = getBudget(project.id)
  const procurement = getProcurement(project.id)
  const cashFlow   = getCashFlow(project.id)
  const variation  = getVariation(project.id)
  const ve         = getVE(project.id)

  const modules: ModuleStatus[] = [
    {
      id: 'takeoff', label: 'Quantity Takeoff', labelBn: 'কোয়ান্টিটি টেকঅফ',
      icon: <Calculator size={16} />, hasData: !!takeoff,
      summary: takeoff ? `${takeoff.totalConcreteVol.toFixed(1)} m³ concrete, ${(takeoff.totalSteelWeight/1000).toFixed(1)} MT steel` : 'No data',
      color: 'text-brand-400',
    },
    {
      id: 'estimation', label: 'Cost Estimation', labelBn: 'খরচ অনুমান',
      icon: <DollarSign size={16} />, hasData: !!estimation,
      summary: estimation ? `Grand Total: ${fmt(estimation.grandTotal)}` : 'No data',
      color: 'text-emerald-400',
    },
    {
      id: 'budget', label: 'Budget', labelBn: 'বাজেট',
      icon: <BarChart3 size={16} />, hasData: !!budget,
      summary: budget ? `Allocated: ${fmt(budget.totalAllocated)}` : 'No data',
      color: 'text-amber-400',
    },
    {
      id: 'procurement', label: 'Procurement Plan', labelBn: 'ক্রয় পরিকল্পনা',
      icon: <Truck size={16} />, hasData: !!procurement,
      summary: procurement ? `${procurement.items.length} materials, ${procurement.durationMonths} months` : 'No data',
      color: 'text-purple-400',
    },
    {
      id: 'cashflow', label: 'Cash Flow', labelBn: 'ক্যাশ ফ্লো',
      icon: <TrendingUp size={16} />, hasData: !!cashFlow,
      summary: cashFlow ? `${cashFlow.durationMonths} months, Net: ${cashFlow.netProfit >= 0 ? '+' : ''}${fmt(cashFlow.netProfit)}` : 'No data',
      color: 'text-blue-400',
    },
    {
      id: 'variation', label: 'Variations', labelBn: 'ভেরিয়েশন',
      icon: <GitBranch size={16} />, hasData: !!(variation && variation.items.length > 0),
      summary: variation?.items.length ? `${variation.items.length} VOs, Net: ${fmt(variation.netVariation)}` : 'No data',
      color: 'text-orange-400',
    },
    {
      id: 'value-eng', label: 'Value Engineering', labelBn: 'ভ্যালু ইঞ্জিনিয়ারিং',
      icon: <Lightbulb size={16} />, hasData: !!(ve && ve.items.length > 0),
      summary: ve?.items.length ? `${ve.items.length} proposals, Saving: ${fmt(ve.totalPotentialSaving)}` : 'No data',
      color: 'text-pink-400',
    },
  ]

  const readyCount = modules.filter(m => m.hasData).length

  function handleExport(format: 'civilos' | 'json') {
    const bridge   = buildDataBridge(project, takeoff, estimation, budget, procurement, cashFlow, variation ?? null, ve ?? null)
    const filename = `${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}`
    let sizeKB     = ''

    if (format === 'civilos') sizeKB = downloadCivilOS(bridge, `${filename}.civilos`)
    else                       sizeKB = downloadJSON(bridge,    `${filename}.json`)

    setLogs(prev => [{
      id:         crypto.randomUUID(),
      exportedAt: new Date().toISOString(),
      format,
      modules:    modules.filter(m => m.hasData).map(m => m.label),
      fileSize:   sizeKB,
    }, ...prev.slice(0, 9)])
  }

  function handleCSVExport() {
    if (!estimation) { alert('Estimation data নেই।'); return }
    const rows: string[][] = [
      ['CivilOS Estimate Export', project.name, new Date().toLocaleDateString('en-BD')],
      [],
      ['Module', 'Metric', 'Value'],
      ['Project', 'Name',        project.name],
      ['Project', 'Location',    project.location],
      ['Project', 'Total Area',  project.totalArea + ' m²'],
      ['Project', 'Floors',      project.totalFloors + ''],
      ...(takeoff ? [
        ['Takeoff', 'Concrete', takeoff.totalConcreteVol.toFixed(2) + ' m³'],
        ['Takeoff', 'Steel',    (takeoff.totalSteelWeight / 1000).toFixed(2) + ' MT'],
      ] : []),
      ...(estimation ? [
        ['Estimation', 'Direct Cost',  Math.round(estimation.directCost) + ''],
        ['Estimation', 'Grand Total',  Math.round(estimation.grandTotal) + ''],
        ['Estimation', 'Cost/m²',      Math.round(estimation.costPerSqm) + ''],
      ] : []),
      ...(cashFlow ? [
        ['Cash Flow', 'Duration',  cashFlow.durationMonths + ' months'],
        ['Cash Flow', 'Net Profit', Math.round(cashFlow.netProfit) + ''],
      ] : []),
    ]
    downloadCSV(rows, `${project.name.replace(/\s+/g, '_')}_Summary.csv`)
  }

  function handlePreview() {
    const bridge = buildDataBridge(project, takeoff, estimation, budget, procurement, cashFlow, variation ?? null, ve ?? null)
    setPreview(bridge)
    setShowPreview(true)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const data = await importCivilOSFile(file)
      setImportResult(`✓ Import successful — ${data.project.name} (v${data.version})`)
    } catch (err: any) {
      setImportResult(`✗ Import failed: ${err.message}`)
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <SectionHeader
        title="PM Bridge"
        subtitle={`${project.name} — Project Management-এ Data পাঠান`}
      />

      {/* Ecosystem flow diagram */}
      <div className="mb-6 bg-surface-800 border border-surface-700 rounded-xl p-5">
        <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-4">
          CivilOS Ecosystem Data Flow
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Architectural', color: 'bg-blue-900/40 border-blue-700/50 text-blue-300' },
            { label: 'Structural',    color: 'bg-purple-900/40 border-purple-700/50 text-purple-300' },
            { label: 'Estimate ✓',   color: 'bg-brand-900/40 border-brand-600/60 text-brand-300 shadow-glow' },
            { label: 'PM',            color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300' },
          ].map((app, i) => (
            <React.Fragment key={app.label}>
              <div className={`px-4 py-2 rounded-lg border text-sm font-semibold ${app.color}`}>
                {app.label}
              </div>
              {i < 3 && (
                <ArrowRight size={16} className="text-surface-600" />
              )}
            </React.Fragment>
          ))}
          <span className="text-xs text-surface-500 ml-2">← .civilos DataBridge format</span>
        </div>
      </div>

      {/* Module readiness grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-surface-300">
            Data Readiness
          </p>
          <Badge variant={readyCount === modules.length ? 'success' : readyCount > 3 ? 'info' : 'warning'}>
            {readyCount}/{modules.length} modules ready
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {modules.map(mod => (
            <div
              key={mod.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                mod.hasData
                  ? 'bg-surface-800 border-surface-700'
                  : 'bg-surface-900/40 border-surface-800 opacity-60'
              }`}
            >
              <div className={`flex-shrink-0 ${mod.hasData ? mod.color : 'text-surface-600'}`}>
                {mod.hasData
                  ? <CheckCircle2 size={18} className="text-emerald-500" />
                  : <Circle size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${mod.color}`}>{mod.icon}</span>
                  <p className="text-sm font-medium text-surface-200">{mod.labelBn}</p>
                </div>
                <p className="text-xs text-surface-500 truncate">{mod.summary}</p>
              </div>
              {!mod.hasData && (
                <button
                  onClick={() => setView(mod.id as any)}
                  className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0"
                >
                  যান →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

        {/* .civilos export */}
        <div className="bg-gradient-to-br from-brand-900/40 to-surface-800 border border-brand-700/40 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center text-brand-400">
              <Package size={20} />
            </div>
            <div>
              <p className="font-semibold text-white">.civilos Format</p>
              <p className="text-xs text-surface-400">PM App-এর জন্য</p>
            </div>
          </div>
          <p className="text-xs text-surface-400 mb-4">
            CivilOS PM App-এ import করার জন্য এই format ব্যবহার করুন।
            Budget, Cash Flow, Procurement সব একসাথে পাঠায়।
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" size="sm" icon={<Download size={13} />}
              onClick={() => handleExport('civilos')}>
              Export .civilos
            </Button>
            <Button variant="outline" size="sm" icon={<Eye size={13} />}
              onClick={handlePreview}>
              Preview
            </Button>
          </div>
        </div>

        {/* JSON / CSV export */}
        <div className="bg-surface-800 border border-surface-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-surface-700 flex items-center justify-center text-surface-400">
              <FileJson size={20} />
            </div>
            <div>
              <p className="font-semibold text-white">JSON / CSV Format</p>
              <p className="text-xs text-surface-400">Other tools-এর জন্য</p>
            </div>
          </div>
          <p className="text-xs text-surface-400 mb-4">
            JSON format সব ধরনের software-এ compatible।
            CSV format Excel বা Google Sheets-এ সরাসরি open করা যায়।
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1"
              icon={<Download size={13} />} onClick={() => handleExport('json')}>
              JSON
            </Button>
            <Button variant="outline" size="sm" className="flex-1"
              icon={<Download size={13} />} onClick={handleCSVExport}>
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Import section */}
      <div className="mb-6 bg-surface-800 border border-surface-700 rounded-xl p-5">
        <p className="text-sm font-semibold text-surface-300 mb-1 flex items-center gap-2">
          <Upload size={16} className="text-brand-400" />
          .civilos File Import
        </p>
        <p className="text-xs text-surface-500 mb-4">
          অন্য module থেকে আনা .civilos file এখানে import করুন।
        </p>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".civilos,.json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="outline" size="sm"
            icon={importing ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
            loading={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? 'Importing...' : 'File Choose করুন'}
          </Button>
          {importResult && (
            <p className={`text-xs font-mono ${importResult.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
              {importResult}
            </p>
          )}
        </div>
      </div>

      {/* Export log */}
      {logs.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-surface-300 mb-3">Export History</p>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-surface-200 font-medium">
                      {log.format === 'civilos' ? '.civilos' : log.format.toUpperCase()} export
                    </p>
                    <p className="text-xs text-surface-500">
                      {new Date(log.exportedAt).toLocaleString('en-BD')} • {log.fileSize}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {log.modules.slice(0, 3).map(m => (
                    <span key={m} className="text-xs bg-surface-700 text-surface-400 px-2 py-0.5 rounded">{m}</span>
                  ))}
                  {log.modules.length > 3 && (
                    <span className="text-xs bg-surface-700 text-surface-500 px-2 py-0.5 rounded">+{log.modules.length - 3}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What's included */}
      <div className="bg-surface-800/50 border border-surface-700/50 rounded-xl p-5">
        <p className="text-sm font-semibold text-surface-300 mb-3">.civilos Package-এ যা থাকে</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-surface-400">
          {[
            '📋 Project Info',
            '📐 Quantity Takeoff',
            '💰 Cost Estimation',
            '📊 Budget Allocation',
            '🏗️ Procurement Plan',
            '📈 Cash Flow Forecast',
            '🔄 Variation Register',
            '💡 VE Proposals',
            '⚙️ Cost Settings',
          ].map(item => (
            <div key={item} className="flex items-center gap-2 bg-surface-800 rounded-lg px-3 py-2">
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && preview && (
        <DataPreviewModal data={preview} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}

// ─── Data Preview Modal ───────────────────────────────────────────────────────

function DataPreviewModal({
  data, onClose
}: { data: CivilOSDataBridge; onClose: () => void }) {
  const [tab, setTab] = useState<'summary' | 'raw'>('summary')

  const json = JSON.stringify(data, null, 2)
  const sizeKB = (new Blob([json]).size / 1024).toFixed(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-800 border border-surface-700 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-card-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700">
          <div>
            <p className="font-display font-bold text-white">.civilos Preview</p>
            <p className="text-xs text-surface-500">Size: {sizeKB} KB • Version: {data.version}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-900 rounded-lg p-0.5">
              {(['summary', 'raw'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    tab === t ? 'bg-brand-600 text-white' : 'text-surface-400 hover:text-surface-200'
                  }`}>
                  {t === 'summary' ? 'Summary' : 'Raw JSON'}
                </button>
              ))}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'summary' ? (
            <div className="space-y-4">
              {/* Project */}
              <Section title="Project">
                <Row k="Name"     v={data.project.name} />
                <Row k="Location" v={data.project.location} />
                <Row k="Floors"   v={data.project.totalFloors + ' floors'} />
                <Row k="Area"     v={data.project.totalArea + ' m²'} />
              </Section>

              {/* Estimation */}
              {data.estimation && (
                <Section title="Cost Estimation">
                  <Row k="Grand Total"  v={'৳ ' + Math.round(data.estimation.grandTotal).toLocaleString('en-BD')} highlight />
                  <Row k="Cost/m²"      v={'৳ ' + Math.round(data.estimation.costPerSqm).toLocaleString('en-BD')} />
                  <Row k="Cost/sft"     v={'৳ ' + Math.round(data.estimation.costPerSqft).toLocaleString('en-BD')} />
                  <Row k="Direct Cost"  v={'৳ ' + Math.round(data.estimation.directCost).toLocaleString('en-BD')} />
                </Section>
              )}

              {/* Cash Flow */}
              {data.cashFlow && (
                <Section title="Cash Flow">
                  <Row k="Duration"    v={data.cashFlow.durationMonths + ' months'} />
                  <Row k="Cash In"     v={'৳ ' + Math.round(data.cashFlow.totalCashIn).toLocaleString('en-BD')} />
                  <Row k="Cash Out"    v={'৳ ' + Math.round(data.cashFlow.totalCashOut).toLocaleString('en-BD')} />
                  <Row k="Net Profit"  v={(data.cashFlow.netProfit >= 0 ? '+' : '') + '৳ ' + Math.round(data.cashFlow.netProfit).toLocaleString('en-BD')} />
                </Section>
              )}

              {/* Procurement */}
              {data.procurement && (
                <Section title="Procurement">
                  <Row k="Total Cost"  v={'৳ ' + Math.round(data.procurement.totalCost).toLocaleString('en-BD')} />
                  <Row k="Materials"   v={data.procurement.items.length + ' items'} />
                  <Row k="Duration"    v={data.procurement.durationMonths + ' months'} />
                </Section>
              )}

              {/* VE */}
              {data.valueEngineering && (
                <Section title="Value Engineering">
                  <Row k="Proposals"       v={data.valueEngineering.proposalCount + ''} />
                  <Row k="Accepted"        v={data.valueEngineering.acceptedCount + ''} />
                  <Row k="Total Saving"    v={'৳ ' + Math.round(data.valueEngineering.totalPotentialSaving).toLocaleString('en-BD')} highlight />
                </Section>
              )}
            </div>
          ) : (
            <pre className="text-xs font-mono text-surface-300 bg-surface-900 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap break-all">
              {json}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-900/60 rounded-xl p-4">
      <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-surface-400">{k}</span>
      <span className={`text-xs font-mono font-semibold ${highlight ? 'text-brand-400' : 'text-surface-200'}`}>{v}</span>
    </div>
  )
}
