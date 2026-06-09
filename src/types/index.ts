// ─── Project ────────────────────────────────────────────────────────────────

export type BuildingType =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'mixed_use'
  | 'institutional'
  | 'hospital'
  | 'school'

export type MeasurementUnit = 'metric' | 'imperial'

export type Region = 'dhaka' | 'chattogram' | 'rajshahi' | 'sylhet' | 'khulna' | 'barishal' | 'rangpur' | 'mymensingh'

export interface CostSettings {
  currency:        string   // 'BDT'
  unit:            MeasurementUnit
  markupPercent:   number
  overheadPercent: number
  profitPercent:   number
  vatPercent:      number
  taxPercent:      number
  contingencyPct:  number
}

export interface Project {
  id:           string
  name:         string
  location:     string
  region:       Region
  buildingType: BuildingType
  totalFloors:  number
  totalArea:    number   // m²
  plotArea:     number   // m²
  owner:        string
  consultant:   string
  createdAt:    string
  updatedAt:    string
  status:       'active' | 'archived' | 'completed'
  costSettings: CostSettings
  thumbnail?:   string
}

// ─── Quantity Takeoff ────────────────────────────────────────────────────────

export type ElementType =
  | 'beam'
  | 'column'
  | 'slab'
  | 'footing'
  | 'staircase'
  | 'wall'
  | 'door'
  | 'window'

export interface BeamElement {
  id:        string
  tag:       string          // e.g. "B1", "B2"
  type:      'beam'
  length:    number          // m
  width:     number          // m
  depth:     number          // m
  count:     number
  floor:     number
  concreteGrade: string      // M20, M25...
  steelGrade:    string      // Fe500
}

export interface ColumnElement {
  id:        string
  tag:       string
  type:      'column'
  width:     number
  depth:     number
  height:    number
  count:     number
  floor:     number
  concreteGrade: string
  steelGrade:    string
}

export interface SlabElement {
  id:        string
  tag:       string
  type:      'slab'
  length:    number
  width:     number
  thickness: number
  count:     number
  floor:     number
  concreteGrade: string
  steelGrade:    string
}

export interface FootingElement {
  id:        string
  tag:       string
  type:      'footing'
  length:    number
  width:     number
  depth:     number
  count:     number
  concreteGrade: string
  steelGrade:    string
}

export interface WallElement {
  id:        string
  tag:       string
  type:      'wall'
  length:    number
  height:    number
  thickness: number  // m
  count:     number
  floor:     number
  brickType: '1st_class' | '2nd_class' | 'block'
}

export interface StaircaseElement {
  id:        string
  tag:       string
  type:      'staircase'
  length:    number          // m (flight length)
  width:     number          // m
  thickness: number          // m (slab thickness)
  count:     number
  floor:     number
  concreteGrade: string
  steelGrade:    string
}

export interface DoorElement {
  id:     string
  tag:    string
  type:   'door'
  width:  number
  height: number
  count:  number
  floor:  number
  material: 'wood' | 'steel' | 'upvc'
}

export interface WindowElement {
  id:     string
  tag:    string
  type:   'window'
  width:  number
  height: number
  count:  number
  floor:  number
  material: 'steel' | 'upvc' | 'aluminum'
}

export type StructuralElement =
  | BeamElement
  | ColumnElement
  | SlabElement
  | FootingElement
  | StaircaseElement
  | WallElement
  | DoorElement
  | WindowElement

// ─── Computed Quantities ─────────────────────────────────────────────────────

export interface ElementQuantity {
  elementId:      string
  elementTag:     string
  elementType:    ElementType
  floor:          number
  // Concrete
  concreteVolume: number    // m³
  // Steel
  steelWeight:    number    // kg
  // Formwork
  formworkArea:   number    // m²
  // Masonry
  brickQty:       number    // nos (for walls)
  // Finishes
  plasterArea:    number    // m²
  paintArea:      number    // m²
  // Counts
  count:          number
}

export interface TakeoffSummary {
  projectId:         string
  totalConcreteVol:  number   // m³
  totalSteelWeight:  number   // kg
  totalFormworkArea: number   // m²
  totalBrickQty:     number
  totalPlasterArea:  number   // m²
  totalPaintArea:    number   // m²
  totalDoors:        number
  totalWindows:      number
  byFloor:           FloorSummary[]
  elements:          ElementQuantity[]
  computedAt:        string
}

export interface FloorSummary {
  floor:        number
  concreteVol:  number
  steelWeight:  number
  formworkArea: number
  brickQty:     number
}


// ─── BOQ (Phase 3) ───────────────────────────────────────────────────────────

export type BOQCategory =
  | 'earthwork'
  | 'concrete'
  | 'reinforcement'
  | 'masonry'
  | 'finishing'
  | 'mep'
  | 'external'

export interface BOQItem {
  id:          string
  itemNo:      string
  description: string
  unit:        string
  quantity:    number
  rate:        number
  amount:      number        // quantity × rate (auto)
  category:    BOQCategory
  source:      'auto' | 'manual'   // auto = from takeoff, manual = user added
  notes?:      string
}

export interface BOQSection {
  category:  BOQCategory
  label:     string
  items:     BOQItem[]
  subtotal:  number
}

export interface BOQ {
  projectId:   string
  items:       BOQItem[]
  grandTotal:  number
  generatedAt: string
  version:     number
}

// ─── Rate Analysis (Phase 4) ─────────────────────────────────────────────────

export type RateCategory = 'material' | 'labor' | 'equipment' | 'overhead' | 'profit'

export interface RateComponent {
  id:          string
  category:    RateCategory
  description: string
  unit:        string
  quantity:    number
  unitRate:    number
  amount:      number   // quantity × unitRate
}

export interface RateAnalysisItem {
  id:          string
  code:        string        // e.g. "RA-001"
  workItem:    string        // e.g. "1 m³ RCC M20"
  unit:        string        // m³, m², kg...
  components:  RateComponent[]
  totalRate:   number        // sum of all components
  isTemplate:  boolean
  concreteGrade?: string
  notes?:      string
}

export interface RateAnalysisStore {
  projectId:   string
  items:       RateAnalysisItem[]
  updatedAt:   string
}

// ─── Cost Database (Phase 5 — referenced in Rate Analysis) ───────────────────

export interface MaterialRate {
  id:          string
  name:        string
  nameBn:      string
  unit:        string
  rate:        number          // BDT
  region:      Region
  category:    'cement' | 'sand' | 'stone' | 'brick' | 'steel' | 'paint' | 'tile' | 'other'
}

export interface LaborRate {
  id:      string
  role:    string
  roleBn:  string
  unit:    'day' | 'hour' | 'm²' | 'm³'
  rate:    number
  region:  Region
}

export interface EquipmentRate {
  id:      string
  name:    string
  nameBn:  string
  unit:    'day' | 'hour' | 'm³'
  rate:    number
  region:  Region
}

// ─── App State ────────────────────────────────────────────────────────────────

export type AppView =
  | 'dashboard'
  | 'project-new'
  | 'project-settings'
  | 'takeoff'
  | 'boq'
  | 'rate-analysis'
  | 'cost-db'
  | 'estimation'
  | 'budget'
  | 'procurement'
  | 'cashflow'
  | 'tender'
  | 'variation'
  | 'value-eng'
  | 'reports'
  | 'bridge'

// ─── Cost Database (Phase 5) — user-editable rates ───────────────────────────

export interface CostDBEntry {
  id:        string
  type:      'material' | 'labor' | 'equipment'
  name:      string
  nameBn:    string
  unit:      string
  baseRate:  number
  userRate?: number
  region:    Region
  category:  string
  updatedAt: string
}

export interface CostDBSnapshot {
  projectId:  string
  region:     Region
  entries:    CostDBEntry[]
  updatedAt:  string
}

// ─── Estimation (Phase 6) ─────────────────────────────────────────────────────

export type EstimationCategory =
  | 'structure'
  | 'architecture'
  | 'mep'
  | 'external'
  | 'preliminaries'
  | 'contingency'

export interface EstimationLineItem {
  id:          string
  category:    EstimationCategory
  description: string
  unit:        string
  quantity:    number
  unitRate:    number
  amount:      number
  source:      'boq' | 'manual' | 'calculated'
}

export interface ProjectEstimation {
  projectId:        string
  version:          number
  lineItems:        EstimationLineItem[]
  directCost:       number
  overheadCost:     number
  profitCost:       number
  markupCost:       number
  contingencyCost:  number
  vatAmount:        number
  taxAmount:        number
  grandTotal:       number
  costPerSqm:       number
  costPerSqft:      number
  costPerFloor:     number
  preparedAt:       string
  preparedBy:       string
  validityDays:     number
}

// ─── Budget (Phase 7) ─────────────────────────────────────────────────────────

export type BudgetCategory =
  | 'structure'
  | 'architecture'
  | 'mep'
  | 'external'
  | 'preliminaries'
  | 'contingency'
  | 'land'
  | 'design_fee'
  | 'supervision'

export interface BudgetLine {
  id:          string
  category:    BudgetCategory
  description: string
  allocated:   number   // planned budget
  actual:      number   // spent so far
  variance:    number   // allocated - actual
  percent:     number   // % of total
  notes?:      string
}

export interface ProjectBudget {
  projectId:      string
  lines:          BudgetLine[]
  totalAllocated: number
  totalActual:    number
  totalVariance:  number
  contingencyPct: number
  version:        number
  createdAt:      string
  updatedAt:      string
}

// ─── Procurement (Phase 8) ────────────────────────────────────────────────────

export type ProcurementStatus =
  | 'planned'
  | 'ordered'
  | 'delivered'
  | 'cancelled'

export interface ProcurementItem {
  id:           string
  material:     string
  materialBn:   string
  unit:         string
  totalQty:     number        // total required
  orderedQty:   number
  deliveredQty: number
  unitRate:     number
  totalCost:    number
  supplier?:    string
  status:       ProcurementStatus
  scheduledDate: string       // ISO
  notes?:       string
}

export interface MonthlySchedule {
  month:     number           // 1-12
  year:      number
  label:     string           // "Month 1", "January 2025"
  items:     ProcurementScheduleItem[]
  totalCost: number
}

export interface ProcurementScheduleItem {
  materialId: string
  material:   string
  unit:       string
  quantity:   number
  unitRate:   number
  cost:       number
}

export interface ProcurementPlan {
  projectId:      string
  items:          ProcurementItem[]
  schedule:       MonthlySchedule[]
  totalCost:      number
  generatedAt:    string
  durationMonths: number
}

// ─── Cash Flow (Phase 9) ──────────────────────────────────────────────────────

export interface CashFlowMonth {
  month:         number
  year:          number
  label:         string
  cashIn:        number
  cashOut:       number
  netFlow:       number
  runningBalance:number
  // breakdown
  contractReceipt:   number
  advanceReceipt:    number
  retentionRelease:  number
  materialCost:      number
  laborCost:         number
  equipmentCost:     number
  overheadCost:      number
  subcontractCost:   number
}

export interface CashFlowPlan {
  projectId:      string
  months:         CashFlowMonth[]
  totalCashIn:    number
  totalCashOut:   number
  netProfit:      number
  peakNegative:   number
  durationMonths: number
  generatedAt:    string
}

// ─── Tender (Phase 10) ────────────────────────────────────────────────────────

export type TenderType = 'engineer' | 'owner' | 'contractor'

export interface TenderItem {
  id:          string
  itemNo:      string
  description: string
  unit:        string
  quantity:    number
  unitRate:    number
  amount:      number
  category:    string
}

export interface TenderPackage {
  projectId:       string
  tenderNo:        string
  tenderType:      TenderType
  projectName:     string
  location:        string
  owner:           string
  consultant:      string
  contractor?:     string
  items:           TenderItem[]
  directCost:      number
  contingency:     number
  grandTotal:      number
  preparedBy:      string
  preparedDate:    string
  validityDays:    number
  notes:           string
}

// ─── Variation / Change Order (Phase 11) ─────────────────────────────────────

export type VariationStatus = 'pending' | 'approved' | 'rejected' | 'implemented'
export type VariationType   = 'addition' | 'omission' | 'substitution'

export interface VariationItem {
  id:          string
  voNo:        string          // Variation Order number e.g. "VO-001"
  type:        VariationType
  status:      VariationStatus
  description: string
  reason:      string
  unit:        string
  quantity:    number
  unitRate:    number
  amount:      number          // +ve = extra, -ve = credit
  originalRef: string          // BOQ item reference
  raisedBy:    string
  raisedDate:  string
  approvedBy?: string
  approvedDate?: string
  notes?:      string
}

export interface VariationRegister {
  projectId:      string
  items:          VariationItem[]
  originalCost:   number
  netVariation:   number        // sum of all approved amounts
  revisedCost:    number        // originalCost + netVariation
  updatedAt:      string
}

// ─── Value Engineering (Phase 12) ────────────────────────────────────────────

export type VECategory =
  | 'structural'
  | 'material'
  | 'method'
  | 'design'
  | 'procurement'

export type VEStatus = 'proposed' | 'under_review' | 'accepted' | 'rejected'

export interface ValueEngineeringItem {
  id:              string
  category:        VECategory
  status:          VEStatus
  title:           string
  titleBn:         string
  description:     string
  originalMethod:  string
  proposedMethod:  string
  originalCost:    number
  proposedCost:    number
  potentialSaving: number
  savingPercent:   number
  riskLevel:       'low' | 'medium' | 'high'
  implementationTime: string   // e.g. "2 weeks"
  proposedBy:      string
  proposedDate:    string
  notes?:          string
}

export interface VERegister {
  projectId:      string
  items:          ValueEngineeringItem[]
  totalPotentialSaving: number
  totalAcceptedSaving:  number
  updatedAt:      string
}

// ─── PM Bridge / DataBridge (Phase 15) ───────────────────────────────────────

export interface CivilOSDataBridge {
  // Format version
  version:    '2.0'
  exportedAt: string
  exportedBy: string    // 'CivilOS Estimate'

  // Project core
  project: {
    id:           string
    name:         string
    location:     string
    region:       Region
    buildingType: BuildingType
    totalFloors:  number
    totalArea:    number
    plotArea:     number
    owner:        string
    consultant:   string
  }

  // Estimation summary
  estimation: {
    grandTotal:       number
    directCost:       number
    overheadCost:     number
    profitCost:       number
    contingencyCost:  number
    vatAmount:        number
    costPerSqm:       number
    costPerSqft:      number
    costPerFloor:     number
    preparedAt:       string
  } | null

  // Budget allocation
  budget: {
    totalAllocated:  number
    totalActual:     number
    totalVariance:   number
    lines: {
      category:    string
      description: string
      allocated:   number
      actual:      number
    }[]
  } | null

  // Procurement plan
  procurement: {
    totalCost:      number
    durationMonths: number
    items: {
      material:  string
      unit:      string
      totalQty:  number
      unitRate:  number
      totalCost: number
      status:    string
    }[]
    monthlyTotals: {
      label:     string
      totalCost: number
    }[]
  } | null

  // Cash flow
  cashFlow: {
    durationMonths: number
    totalCashIn:    number
    totalCashOut:   number
    netProfit:      number
    peakNegative:   number
    months: {
      label:          string
      cashIn:         number
      cashOut:        number
      netFlow:        number
      runningBalance: number
    }[]
  } | null

  // Takeoff summary
  takeoff: {
    totalConcreteVol:  number
    totalSteelWeight:  number
    totalFormworkArea: number
    totalBrickQty:     number
    totalPlasterArea:  number
    totalPaintArea:    number
    totalDoors:        number
    totalWindows:      number
  } | null

  // Variation summary
  variation: {
    originalCost:  number
    netVariation:  number
    revisedCost:   number
    approvedCount: number
    pendingCount:  number
  } | null

  // Value engineering
  valueEngineering: {
    totalPotentialSaving: number
    totalAcceptedSaving:  number
    proposalCount:        number
    acceptedCount:        number
  } | null
}

export interface BridgeExportLog {
  id:         string
  exportedAt: string
  format:     'civilos' | 'json' | 'csv'
  modules:    string[]
  fileSize:   string
}
