import type {
  StructuralElement,
  ElementQuantity,
  TakeoffSummary,
  FloorSummary,
  BeamElement,
  ColumnElement,
  SlabElement,
  FootingElement,
  StaircaseElement,
  WallElement,
} from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

// Steel density kg/m³
const STEEL_DENSITY = 7850

// Average reinforcement ratios (as fraction of volume → weight in kg/m³)
// These are typical Bangladesh practice values
const STEEL_RATIO: Record<string, number> = {
  beam:      110,   // kg per m³ concrete
  column:    130,
  slab:       85,
  footing:    80,
  staircase: 100,
}

// Brick calculation: number of bricks per m³ masonry (1st class 250×120×75mm)
const BRICKS_PER_M3 = 450
// Mortar wastage factor
const BRICK_WASTAGE = 1.10

// Plaster factor: area per m² of masonry surface
const PLASTER_BOTH_SIDES = 2.0

// ─── Main Compute Function ────────────────────────────────────────────────────

export function computeQuantities(el: StructuralElement): ElementQuantity {
  const base: ElementQuantity = {
    elementId:      el.id,
    elementTag:     el.tag,
    elementType:    el.type,
    floor:          ('floor' in el ? el.floor : 0),
    concreteVolume: 0,
    steelWeight:    0,
    formworkArea:   0,
    brickQty:       0,
    plasterArea:    0,
    paintArea:      0,
    count:          el.count,
  }

  switch (el.type) {
    case 'beam':      return computeBeam(el as BeamElement, base)
    case 'column':    return computeColumn(el as ColumnElement, base)
    case 'slab':      return computeSlab(el as SlabElement, base)
    case 'footing':   return computeFooting(el as FootingElement, base)
    case 'staircase': return computeStaircase(el as StaircaseElement, base)
    case 'wall':      return computeWall(el as WallElement, base)
    case 'door':
    case 'window':
      return { ...base, count: el.count }
    default:
      return base
  }
}

// ─── Beam ─────────────────────────────────────────────────────────────────────

function computeBeam(el: BeamElement, base: ElementQuantity): ElementQuantity {
  const grossVol  = el.length * el.width * el.depth          // m³ per beam
  const concreteVolume = grossVol * el.count

  const steelWeight   = concreteVolume * STEEL_RATIO.beam    // kg

  // Formwork = bottom + 2 sides (no top — slab forms top)
  const fwPerBeam  = (el.width + 2 * el.depth) * el.length
  const formworkArea = fwPerBeam * el.count

  return { ...base, concreteVolume, steelWeight, formworkArea }
}

// ─── Column ───────────────────────────────────────────────────────────────────

function computeColumn(el: ColumnElement, base: ElementQuantity): ElementQuantity {
  const grossVol = el.width * el.depth * el.height
  const concreteVolume = grossVol * el.count

  const steelWeight  = concreteVolume * STEEL_RATIO.column

  // Formwork = 4 sides
  const fwPerCol   = 2 * (el.width + el.depth) * el.height
  const formworkArea = fwPerCol * el.count

  return { ...base, concreteVolume, steelWeight, formworkArea }
}

// ─── Slab ─────────────────────────────────────────────────────────────────────

function computeSlab(el: SlabElement, base: ElementQuantity): ElementQuantity {
  const grossVol = el.length * el.width * el.thickness
  const concreteVolume = grossVol * el.count

  const steelWeight  = concreteVolume * STEEL_RATIO.slab

  // Formwork = bottom face only
  const formworkArea = el.length * el.width * el.count

  // Paint area = top surface (floor finish counted separately in BOQ)
  const paintArea    = el.length * el.width * el.count

  return { ...base, concreteVolume, steelWeight, formworkArea, paintArea }
}

// ─── Footing ──────────────────────────────────────────────────────────────────

function computeFooting(el: FootingElement, base: ElementQuantity): ElementQuantity {
  const grossVol = el.length * el.width * el.depth
  const concreteVolume = grossVol * el.count

  const steelWeight  = concreteVolume * STEEL_RATIO.footing

  // Formwork = 4 sides (bottom is on ground)
  const fwPerFt    = 2 * (el.length + el.width) * el.depth
  const formworkArea = fwPerFt * el.count

  return { ...base, concreteVolume, steelWeight, formworkArea }
}

// ─── Staircase ─────────────────────────────────────────────────────────────────

function computeStaircase(el: StaircaseElement, base: ElementQuantity): ElementQuantity {
  const grossVol       = el.length * el.width * el.thickness
  const concreteVolume = grossVol * el.count

  const steelWeight  = concreteVolume * STEEL_RATIO.staircase

  // Formwork = soffit area (underside of flight)
  const formworkArea = el.length * el.width * el.count

  return { ...base, concreteVolume, steelWeight, formworkArea }
}

// ─── Wall ─────────────────────────────────────────────────────────────────────

function computeWall(el: WallElement, base: ElementQuantity): ElementQuantity {
  const wallVolume = el.length * el.height * el.thickness * el.count  // m³

  const brickQty = Math.ceil(wallVolume * BRICKS_PER_M3 * BRICK_WASTAGE)

  // Plaster on both sides
  const plasterArea = el.length * el.height * el.count * PLASTER_BOTH_SIDES
  const paintArea   = plasterArea

  return { ...base, brickQty, plasterArea, paintArea }
}

// ─── Summary Builder ──────────────────────────────────────────────────────────

export function buildSummary(
  projectId: string,
  elements:  StructuralElement[],
  quantities: ElementQuantity[]
): TakeoffSummary {

  const totalConcreteVol  = sum(quantities, 'concreteVolume')
  const totalSteelWeight  = sum(quantities, 'steelWeight')
  const totalFormworkArea = sum(quantities, 'formworkArea')
  const totalBrickQty     = sum(quantities, 'brickQty')
  const totalPlasterArea  = sum(quantities, 'plasterArea')
  const totalPaintArea    = sum(quantities, 'paintArea')

  const totalDoors   = elements.filter(e => e.type === 'door').reduce((a, e) => a + e.count, 0)
  const totalWindows = elements.filter(e => e.type === 'window').reduce((a, e) => a + e.count, 0)

  // Group by floor
  const floorMap = new Map<number, FloorSummary>()
  for (const q of quantities) {
    const f = q.floor
    if (!floorMap.has(f)) {
      floorMap.set(f, { floor: f, concreteVol: 0, steelWeight: 0, formworkArea: 0, brickQty: 0 })
    }
    const fs = floorMap.get(f)!
    fs.concreteVol  += q.concreteVolume
    fs.steelWeight  += q.steelWeight
    fs.formworkArea += q.formworkArea
    fs.brickQty     += q.brickQty
  }

  const byFloor = Array.from(floorMap.values()).sort((a, b) => a.floor - b.floor)

  return {
    projectId,
    totalConcreteVol,
    totalSteelWeight,
    totalFormworkArea,
    totalBrickQty,
    totalPlasterArea,
    totalPaintArea,
    totalDoors,
    totalWindows,
    byFloor,
    elements: quantities,
    computedAt: new Date().toISOString(),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sum(arr: ElementQuantity[], key: keyof ElementQuantity): number {
  return arr.reduce((acc, q) => acc + (Number(q[key]) || 0), 0)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatQty(n: number, unit: string): string {
  return `${round2(n).toLocaleString('en-BD')} ${unit}`
}

// ─── Element Factory ──────────────────────────────────────────────────────────

export function makeBeam(partial: Partial<BeamElement> = {}): BeamElement {
  return {
    id:            crypto.randomUUID(),
    tag:           'B1',
    type:          'beam',
    length:        4.0,
    width:         0.30,
    depth:         0.45,
    count:         1,
    floor:         1,
    concreteGrade: 'M20',
    steelGrade:    'Fe500',
    ...partial,
  }
}

export function makeColumn(partial: Partial<ColumnElement> = {}): ColumnElement {
  return {
    id:            crypto.randomUUID(),
    tag:           'C1',
    type:          'column',
    width:         0.30,
    depth:         0.45,
    height:        3.0,
    count:         1,
    floor:         1,
    concreteGrade: 'M20',
    steelGrade:    'Fe500',
    ...partial,
  }
}

export function makeSlab(partial: Partial<SlabElement> = {}): SlabElement {
  return {
    id:            crypto.randomUUID(),
    tag:           'S1',
    type:          'slab',
    length:        5.0,
    width:         4.0,
    thickness:     0.125,
    count:         1,
    floor:         1,
    concreteGrade: 'M20',
    steelGrade:    'Fe500',
    ...partial,
  }
}

export function makeFooting(partial: Partial<FootingElement> = {}): FootingElement {
  return {
    id:            crypto.randomUUID(),
    tag:           'F1',
    type:          'footing',
    length:        1.5,
    width:         1.5,
    depth:         0.45,
    count:         1,
    concreteGrade: 'M20',
    steelGrade:    'Fe500',
    ...partial,
  }
}

export function makeWall(partial: Partial<WallElement> = {}): WallElement {
  return {
    id:        crypto.randomUUID(),
    tag:       'W1',
    type:      'wall',
    length:    4.0,
    height:    3.0,
    thickness: 0.25,
    count:     1,
    floor:     1,
    brickType: '1st_class',
    ...partial,
  }
}
