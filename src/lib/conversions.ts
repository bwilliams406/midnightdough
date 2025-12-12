// Unit conversion utility for baking measurements
// Supports weight, volume, and cross-category conversions using densities

export type MeasurementUnit = 
  | 'g' | 'kg' | 'oz' | 'lb' 
  | 'ml' | 'l' | 'cup' | 'tbsp' | 'tsp' | 'fl_oz'
  | 'each'

export interface UnitInfo {
  label: string
  shortLabel: string
  category: 'weight' | 'volume' | 'count'
  toBase: number  // For weight: to grams. For volume: to ml
}

// Unit definitions - all convert to base (grams for weight, ml for volume)
export const UNITS: Record<MeasurementUnit, UnitInfo> = {
  // Weight units (base: grams)
  g:    { label: 'Grams', shortLabel: 'g', category: 'weight', toBase: 1 },
  kg:   { label: 'Kilograms', shortLabel: 'kg', category: 'weight', toBase: 1000 },
  oz:   { label: 'Ounces', shortLabel: 'oz', category: 'weight', toBase: 28.3495 },
  lb:   { label: 'Pounds', shortLabel: 'lb', category: 'weight', toBase: 453.592 },
  
  // Volume units (base: ml)
  ml:     { label: 'Milliliters', shortLabel: 'ml', category: 'volume', toBase: 1 },
  l:      { label: 'Liters', shortLabel: 'L', category: 'volume', toBase: 1000 },
  cup:    { label: 'Cups', shortLabel: 'cup', category: 'volume', toBase: 236.588 },
  tbsp:   { label: 'Tablespoons', shortLabel: 'tbsp', category: 'volume', toBase: 14.787 },
  tsp:    { label: 'Teaspoons', shortLabel: 'tsp', category: 'volume', toBase: 4.929 },
  fl_oz:  { label: 'Fluid Ounces', shortLabel: 'fl oz', category: 'volume', toBase: 29.5735 },
  
  // Count units
  each: { label: 'Each', shortLabel: 'ea', category: 'count', toBase: 1 },
}

// Default density for weight-to-volume conversion (g/ml)
// Most baking ingredients are close to water (1 g/ml)
// Adjust per ingredient if needed for more accuracy
const DEFAULT_DENSITY = 1.0

// Convert between ANY units (including weight ↔ volume)
// Uses density for cross-category conversions
export function convert(
  amount: number, 
  fromUnit: MeasurementUnit, 
  toUnit: MeasurementUnit,
  density: number = DEFAULT_DENSITY
): number {
  if (amount === 0) return 0
  if (fromUnit === toUnit) return amount
  
  const fromInfo = UNITS[fromUnit]
  const toInfo = UNITS[toUnit]
  
  // Count units can't be converted
  if (fromInfo.category === 'count' || toInfo.category === 'count') {
    return amount
  }
  
  // Same category - simple conversion
  if (fromInfo.category === toInfo.category) {
    const inBase = amount * fromInfo.toBase
    return inBase / toInfo.toBase
  }
  
  // Cross-category: weight ↔ volume using density
  if (fromInfo.category === 'weight' && toInfo.category === 'volume') {
    // weight to volume: grams → ml → target volume
    const inGrams = amount * fromInfo.toBase
    const inMl = inGrams / density  // g ÷ (g/ml) = ml
    return inMl / toInfo.toBase
  }
  
  if (fromInfo.category === 'volume' && toInfo.category === 'weight') {
    // volume to weight: volume → ml → grams → target weight
    const inMl = amount * fromInfo.toBase
    const inGrams = inMl * density  // ml × (g/ml) = g
    return inGrams / toInfo.toBase
  }
  
  return amount
}

// Format a number for display (smart rounding)
export function formatAmount(amount: number): string {
  if (amount === 0) return '0'
  if (amount < 0.01) return amount.toFixed(4)
  if (amount < 0.1) return amount.toFixed(3)
  if (amount < 1) return amount.toFixed(2)
  if (amount < 10) return Number(amount.toFixed(2)).toString()
  if (amount < 100) return Number(amount.toFixed(1)).toString()
  return Math.round(amount).toString()
}

// Format as fraction for display (1/4, 1/2, 3/4, etc.)
export function formatAsFraction(amount: number): string {
  if (amount === 0) return '0'
  
  const fractions: [number, string][] = [
    [0.125, '⅛'],
    [0.25, '¼'],
    [0.333, '⅓'],
    [0.375, '⅜'],
    [0.5, '½'],
    [0.625, '⅝'],
    [0.666, '⅔'],
    [0.75, '¾'],
    [0.875, '⅞'],
  ]
  
  const whole = Math.floor(amount)
  const decimal = amount - whole
  
  // Find closest fraction
  let closestFraction = ''
  let closestDiff = 0.1
  
  for (const [value, symbol] of fractions) {
    const diff = Math.abs(decimal - value)
    if (diff < closestDiff) {
      closestDiff = diff
      closestFraction = symbol
    }
  }
  
  if (closestFraction && closestDiff < 0.06) {
    if (whole > 0) {
      return `${whole} ${closestFraction}`
    }
    return closestFraction
  }
  
  // No close fraction, use decimal
  return formatAmount(amount)
}

// Get compatible units for a given unit (same category)
export function getCompatibleUnits(unit: MeasurementUnit): MeasurementUnit[] {
  const category = UNITS[unit].category
  return (Object.entries(UNITS) as [MeasurementUnit, UnitInfo][])
    .filter(([_, info]) => info.category === category)
    .map(([u]) => u)
}

// Get all units except 'each' for display purposes
export function getAllDisplayUnits(): MeasurementUnit[] {
  return ['g', 'oz', 'lb', 'kg', 'cup', 'tbsp', 'tsp', 'ml', 'fl_oz', 'each']
}

// Unit selector options grouped by category
export const UNIT_OPTIONS = [
  { 
    label: 'Weight', 
    options: [
      { value: 'g', label: 'Grams (g)' },
      { value: 'oz', label: 'Ounces (oz)' },
      { value: 'lb', label: 'Pounds (lb)' },
      { value: 'kg', label: 'Kilograms (kg)' },
    ]
  },
  { 
    label: 'Volume', 
    options: [
      { value: 'cup', label: 'Cups' },
      { value: 'tbsp', label: 'Tablespoons (tbsp)' },
      { value: 'tsp', label: 'Teaspoons (tsp)' },
      { value: 'fl_oz', label: 'Fluid Ounces (fl oz)' },
      { value: 'ml', label: 'Milliliters (ml)' },
      { value: 'l', label: 'Liters (L)' },
    ]
  },
  { 
    label: 'Count', 
    options: [
      { value: 'each', label: 'Each' },
    ]
  },
]
