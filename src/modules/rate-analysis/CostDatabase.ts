import type { MaterialRate, LaborRate, EquipmentRate, Region } from '@/types'

// ─── Material Rates (BDT) — Dhaka 2024 ───────────────────────────────────────

export const MATERIAL_RATES: MaterialRate[] = [
  // Cement
  { id: 'm-001', name: 'Cement (OPC 50kg bag)',     nameBn: 'সিমেন্ট (OPC ৫০কেজি)',  unit: 'bag',  rate: 580,   region: 'dhaka', category: 'cement' },
  { id: 'm-002', name: 'Cement (OPC 50kg bag)',     nameBn: 'সিমেন্ট (OPC ৫০কেজি)',  unit: 'bag',  rate: 560,   region: 'rajshahi', category: 'cement' },
  { id: 'm-003', name: 'Cement (OPC 50kg bag)',     nameBn: 'সিমেন্ট (OPC ৫০কেজি)',  unit: 'bag',  rate: 575,   region: 'chattogram', category: 'cement' },

  // Sand
  { id: 'm-010', name: 'Sand (Fine, river)',        nameBn: 'বালি (মোটা, নদী)',      unit: 'm³',   rate: 2200,  region: 'dhaka', category: 'sand' },
  { id: 'm-011', name: 'Sand (Fine, river)',        nameBn: 'বালি (মোটা, নদী)',      unit: 'm³',   rate: 1800,  region: 'rajshahi', category: 'sand' },
  { id: 'm-012', name: 'Sand (Fine, river)',        nameBn: 'বালি (মোটা, নদী)',      unit: 'm³',   rate: 2000,  region: 'chattogram', category: 'sand' },

  // Stone chips
  { id: 'm-020', name: 'Stone Chips (20mm)',        nameBn: 'পাথর চিপস (২০মিমি)',   unit: 'm³',   rate: 3500,  region: 'dhaka', category: 'stone' },
  { id: 'm-021', name: 'Stone Chips (20mm)',        nameBn: 'পাথর চিপস (২০মিমি)',   unit: 'm³',   rate: 3200,  region: 'rajshahi', category: 'stone' },
  { id: 'm-022', name: 'Stone Chips (20mm)',        nameBn: 'পাথর চিপস (২০মিমি)',   unit: 'm³',   rate: 3300,  region: 'chattogram', category: 'stone' },

  // Brick
  { id: 'm-030', name: 'Brick 1st Class',           nameBn: '১ম শ্রেণির ইট',         unit: 'nos',  rate: 14,    region: 'dhaka', category: 'brick' },
  { id: 'm-031', name: 'Brick 1st Class',           nameBn: '১ম শ্রেণির ইট',         unit: 'nos',  rate: 12,    region: 'rajshahi', category: 'brick' },
  { id: 'm-032', name: 'Brick 2nd Class',           nameBn: '২য় শ্রেণির ইট',         unit: 'nos',  rate: 11,    region: 'dhaka', category: 'brick' },

  // Steel / Rod
  { id: 'm-040', name: 'Steel Rod Fe500 (all dia)', nameBn: 'রড Fe500 (সব সাইজ)',    unit: 'MT',   rate: 98000, region: 'dhaka', category: 'steel' },
  { id: 'm-041', name: 'Steel Rod Fe500 (all dia)', nameBn: 'রড Fe500 (সব সাইজ)',    unit: 'MT',   rate: 96000, region: 'rajshahi', category: 'steel' },
  { id: 'm-042', name: 'Steel Rod Fe500 (all dia)', nameBn: 'রড Fe500 (সব সাইজ)',    unit: 'MT',   rate: 97000, region: 'chattogram', category: 'steel' },

  // Paint
  { id: 'm-050', name: 'Interior Paint (20L)',      nameBn: 'ইন্টেরিয়র পেইন্ট',     unit: 'tin',  rate: 6500,  region: 'dhaka', category: 'paint' },
  { id: 'm-051', name: 'Exterior Paint (20L)',      nameBn: 'এক্সটেরিয়র পেইন্ট',   unit: 'tin',  rate: 7500,  region: 'dhaka', category: 'paint' },
  { id: 'm-052', name: 'Primer (20L)',              nameBn: 'প্রাইমার',              unit: 'tin',  rate: 4500,  region: 'dhaka', category: 'paint' },

  // Tiles
  { id: 'm-060', name: 'Floor Tile (600×600mm)',    nameBn: 'ফ্লোর টাইলস',          unit: 'm²',   rate: 850,   region: 'dhaka', category: 'tile' },
  { id: 'm-061', name: 'Wall Tile (300×600mm)',     nameBn: 'ওয়াল টাইলস',           unit: 'm²',   rate: 750,   region: 'dhaka', category: 'tile' },
  { id: 'm-062', name: 'Toilet Tile',               nameBn: 'বাথরুম টাইলস',         unit: 'm²',   rate: 650,   region: 'dhaka', category: 'tile' },
]

// ─── Labor Rates (BDT/day) ────────────────────────────────────────────────────

export const LABOR_RATES: LaborRate[] = [
  { id: 'l-001', role: 'Mason (1st class)',     roleBn: 'রাজমিস্ত্রী (১ম)',    unit: 'day', rate: 900,  region: 'dhaka' },
  { id: 'l-002', role: 'Mason (2nd class)',     roleBn: 'রাজমিস্ত্রী (২য়)',   unit: 'day', rate: 750,  region: 'dhaka' },
  { id: 'l-003', role: 'Helper / Laborer',      roleBn: 'হেলপার',              unit: 'day', rate: 600,  region: 'dhaka' },
  { id: 'l-004', role: 'Bar Bender',            roleBn: 'রড বাঁধাই',           unit: 'day', rate: 850,  region: 'dhaka' },
  { id: 'l-005', role: 'Carpenter',             roleBn: 'কাঠমিস্ত্রী',         unit: 'day', rate: 900,  region: 'dhaka' },
  { id: 'l-006', role: 'Electrician',           roleBn: 'ইলেকট্রিশিয়ান',      unit: 'day', rate: 1000, region: 'dhaka' },
  { id: 'l-007', role: 'Plumber',               roleBn: 'প্লাম্বার',            unit: 'day', rate: 950,  region: 'dhaka' },
  { id: 'l-008', role: 'Painter',               roleBn: 'রঙমিস্ত্রী',          unit: 'day', rate: 800,  region: 'dhaka' },
  { id: 'l-009', role: 'Tile Fixer',            roleBn: 'টাইলস মিস্ত্রী',     unit: 'day', rate: 900,  region: 'dhaka' },
  { id: 'l-010', role: 'Welder',                roleBn: 'ওয়েল্ডার',            unit: 'day', rate: 1100, region: 'dhaka' },
  // Rajshahi rates
  { id: 'l-011', role: 'Mason (1st class)',     roleBn: 'রাজমিস্ত্রী (১ম)',    unit: 'day', rate: 800,  region: 'rajshahi' },
  { id: 'l-012', role: 'Helper / Laborer',      roleBn: 'হেলপার',              unit: 'day', rate: 500,  region: 'rajshahi' },
  { id: 'l-013', role: 'Bar Bender',            roleBn: 'রড বাঁধাই',           unit: 'day', rate: 750,  region: 'rajshahi' },
]

// ─── Equipment Rates (BDT/day) ────────────────────────────────────────────────

export const EQUIPMENT_RATES: EquipmentRate[] = [
  { id: 'e-001', name: 'Concrete Mixer (0.5 cft)', nameBn: 'কংক্রিট মিক্সার',  unit: 'day', rate: 2500,  region: 'dhaka' },
  { id: 'e-002', name: 'Concrete Vibrator',        nameBn: 'ভাইব্রেটর',        unit: 'day', rate: 1500,  region: 'dhaka' },
  { id: 'e-003', name: 'Excavator (JCB)',          nameBn: 'এক্সকাভেটর',       unit: 'day', rate: 18000, region: 'dhaka' },
  { id: 'e-004', name: 'Mobile Crane (5 ton)',     nameBn: 'মোবাইল ক্রেন',     unit: 'day', rate: 25000, region: 'dhaka' },
  { id: 'e-005', name: 'Tower Crane',              nameBn: 'টাওয়ার ক্রেন',     unit: 'day', rate: 45000, region: 'dhaka' },
  { id: 'e-006', name: 'Bar Cutting Machine',      nameBn: 'রড কাটার মেশিন',  unit: 'day', rate: 1200,  region: 'dhaka' },
  { id: 'e-007', name: 'Bar Bending Machine',      nameBn: 'রড বাঁকানো মেশিন', unit: 'day', rate: 1200,  region: 'dhaka' },
  { id: 'e-008', name: 'Concrete Pump',            nameBn: 'কংক্রিট পাম্প',    unit: 'day', rate: 15000, region: 'dhaka' },
  { id: 'e-009', name: 'Transit Mixer',            nameBn: 'ট্রানজিট মিক্সার', unit: 'day', rate: 8000,  region: 'dhaka' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getMaterialRate(category: MaterialRate['category'], region: Region): number {
  const found = MATERIAL_RATES.find(m => m.category === category && m.region === region)
  if (found) return found.rate
  // fallback to dhaka
  return MATERIAL_RATES.find(m => m.category === category && m.region === 'dhaka')?.rate ?? 0
}

export function getLaborRate(role: string, region: Region): number {
  const found = LABOR_RATES.find(l => l.role === role && l.region === region)
  if (found) return found.rate
  return LABOR_RATES.find(l => l.role === role && l.region === 'dhaka')?.rate ?? 0
}

// ─── Rate Analysis Templates ──────────────────────────────────────────────────
// Pre-built component breakdowns for common work items

export interface RateTemplate {
  code:      string
  workItem:  string
  unit:      string
  components: {
    category:    'material' | 'labor' | 'equipment'
    description: string
    unit:        string
    quantity:    number
    baseRate:    number   // BDT — will be overridden by live DB
  }[]
}

export const RATE_TEMPLATES: RateTemplate[] = [
  {
    code:     'RA-C01',
    workItem: 'Plain Cement Concrete (1:2:4) — 1 m³',
    unit:     'm³',
    components: [
      { category: 'material', description: 'Cement (OPC)',     unit: 'bag',  quantity: 7.0,  baseRate: 580 },
      { category: 'material', description: 'Sand (Fine)',      unit: 'm³',   quantity: 0.44, baseRate: 2200 },
      { category: 'material', description: 'Stone Chips 20mm', unit: 'm³',   quantity: 0.88, baseRate: 3500 },
      { category: 'labor',    description: 'Mason (1st)',      unit: 'day',  quantity: 0.5,  baseRate: 900 },
      { category: 'labor',    description: 'Helper',           unit: 'day',  quantity: 2.5,  baseRate: 600 },
      { category: 'equipment',description: 'Mixer',            unit: 'day',  quantity: 0.2,  baseRate: 2500 },
      { category: 'equipment',description: 'Vibrator',         unit: 'day',  quantity: 0.2,  baseRate: 1500 },
    ],
  },
  {
    code:     'RA-C02',
    workItem: 'RCC M20 (1:1.5:3) — 1 m³',
    unit:     'm³',
    components: [
      { category: 'material', description: 'Cement (OPC)',     unit: 'bag',  quantity: 8.5,  baseRate: 580 },
      { category: 'material', description: 'Sand (Fine)',      unit: 'm³',   quantity: 0.44, baseRate: 2200 },
      { category: 'material', description: 'Stone Chips 20mm', unit: 'm³',   quantity: 0.88, baseRate: 3500 },
      { category: 'labor',    description: 'Mason (1st)',      unit: 'day',  quantity: 0.6,  baseRate: 900 },
      { category: 'labor',    description: 'Helper',           unit: 'day',  quantity: 3.0,  baseRate: 600 },
      { category: 'equipment',description: 'Mixer',            unit: 'day',  quantity: 0.25, baseRate: 2500 },
      { category: 'equipment',description: 'Vibrator',         unit: 'day',  quantity: 0.25, baseRate: 1500 },
    ],
  },
  {
    code:     'RA-C03',
    workItem: 'RCC M25 (1:1:2) — 1 m³',
    unit:     'm³',
    components: [
      { category: 'material', description: 'Cement (OPC)',     unit: 'bag',  quantity: 11.0, baseRate: 580 },
      { category: 'material', description: 'Sand (Fine)',      unit: 'm³',   quantity: 0.44, baseRate: 2200 },
      { category: 'material', description: 'Stone Chips 20mm', unit: 'm³',   quantity: 0.88, baseRate: 3500 },
      { category: 'labor',    description: 'Mason (1st)',      unit: 'day',  quantity: 0.7,  baseRate: 900 },
      { category: 'labor',    description: 'Helper',           unit: 'day',  quantity: 3.5,  baseRate: 600 },
      { category: 'equipment',description: 'Mixer',            unit: 'day',  quantity: 0.3,  baseRate: 2500 },
      { category: 'equipment',description: 'Vibrator',         unit: 'day',  quantity: 0.3,  baseRate: 1500 },
    ],
  },
  {
    code:     'RA-R01',
    workItem: 'Reinforcement Bar Fe500 — 1 MT',
    unit:     'MT',
    components: [
      { category: 'material', description: 'Steel Rod Fe500',  unit: 'MT',   quantity: 1.03, baseRate: 98000 },
      { category: 'labor',    description: 'Bar Bender',       unit: 'day',  quantity: 2.5,  baseRate: 850 },
      { category: 'labor',    description: 'Helper',           unit: 'day',  quantity: 2.5,  baseRate: 600 },
      { category: 'equipment',description: 'Bar Cutting M/C',  unit: 'day',  quantity: 0.3,  baseRate: 1200 },
      { category: 'equipment',description: 'Bar Bending M/C',  unit: 'day',  quantity: 0.3,  baseRate: 1200 },
    ],
  },
  {
    code:     'RA-F01',
    workItem: 'Formwork (Shuttering) — 1 m²',
    unit:     'm²',
    components: [
      { category: 'material', description: 'Timber / Plywood', unit: 'm²',   quantity: 0.3,  baseRate: 1200 },
      { category: 'material', description: 'Nails & Binding',  unit: 'kg',   quantity: 0.3,  baseRate: 150 },
      { category: 'labor',    description: 'Carpenter',        unit: 'day',  quantity: 0.2,  baseRate: 900 },
      { category: 'labor',    description: 'Helper',           unit: 'day',  quantity: 0.2,  baseRate: 600 },
    ],
  },
  {
    code:     'RA-M01',
    workItem: 'Brick Masonry (1:4) — 1 m³',
    unit:     'm³',
    components: [
      { category: 'material', description: 'Brick 1st Class',  unit: 'nos',  quantity: 475,  baseRate: 14 },
      { category: 'material', description: 'Cement (OPC)',     unit: 'bag',  quantity: 1.5,  baseRate: 580 },
      { category: 'material', description: 'Sand (Fine)',      unit: 'm³',   quantity: 0.35, baseRate: 2200 },
      { category: 'labor',    description: 'Mason (1st)',      unit: 'day',  quantity: 1.0,  baseRate: 900 },
      { category: 'labor',    description: 'Helper',           unit: 'day',  quantity: 1.5,  baseRate: 600 },
    ],
  },
  {
    code:     'RA-P01',
    workItem: 'Plaster (1:4) both sides — 1 m²',
    unit:     'm²',
    components: [
      { category: 'material', description: 'Cement (OPC)',     unit: 'bag',  quantity: 0.22, baseRate: 580 },
      { category: 'material', description: 'Sand (Fine)',      unit: 'm³',   quantity: 0.03, baseRate: 2200 },
      { category: 'labor',    description: 'Mason (1st)',      unit: 'day',  quantity: 0.08, baseRate: 900 },
      { category: 'labor',    description: 'Helper',           unit: 'day',  quantity: 0.12, baseRate: 600 },
    ],
  },
  {
    code:     'RA-PT01',
    workItem: 'Paint (2 coats, interior) — 1 m²',
    unit:     'm²',
    components: [
      { category: 'material', description: 'Interior Paint',   unit: 'ltr',  quantity: 0.15, baseRate: 350 },
      { category: 'material', description: 'Primer',           unit: 'ltr',  quantity: 0.08, baseRate: 250 },
      { category: 'labor',    description: 'Painter',          unit: 'day',  quantity: 0.05, baseRate: 800 },
      { category: 'labor',    description: 'Helper',           unit: 'day',  quantity: 0.03, baseRate: 600 },
    ],
  },
  {
    code:     'RA-T01',
    workItem: 'Floor Tile (600×600) — 1 m²',
    unit:     'm²',
    components: [
      { category: 'material', description: 'Floor Tile 600mm', unit: 'm²',   quantity: 1.05, baseRate: 850 },
      { category: 'material', description: 'Cement (OPC)',     unit: 'bag',  quantity: 0.18, baseRate: 580 },
      { category: 'material', description: 'Sand (Fine)',      unit: 'm³',   quantity: 0.02, baseRate: 2200 },
      { category: 'labor',    description: 'Tile Fixer',       unit: 'day',  quantity: 0.12, baseRate: 900 },
      { category: 'labor',    description: 'Helper',           unit: 'day',  quantity: 0.12, baseRate: 600 },
    ],
  },
  {
    code:     'RA-E01',
    workItem: 'Earthwork Excavation — 1 m³',
    unit:     'm³',
    components: [
      { category: 'labor',     description: 'Helper',          unit: 'day',  quantity: 0.5,  baseRate: 600 },
      { category: 'equipment', description: 'Excavator (JCB)', unit: 'day',  quantity: 0.05, baseRate: 18000 },
    ],
  },
]
