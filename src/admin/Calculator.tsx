import { useState, useMemo, useEffect } from 'react'
import { Calculator as CalcIcon, Printer, Download, Loader2, DollarSign, TrendingUp, Percent } from 'lucide-react'
import { Ingredient, Recipe, CalculatedIngredient } from '../types/admin'
import { subscribeToIngredients, subscribeToRecipes } from '../lib/storage'
import { UNITS, MeasurementUnit, convert, formatAmount, formatAsFraction } from '../lib/conversions'
import { cookies } from '../data/cookies'
import { getDiscountForQuantity, VOLUME_DISCOUNTS, BATCH_LABELS } from '../utils/pricing'

type TabType = 'recipe' | 'profit'

export function Calculator() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(24)
  const [cookieSize, setCookieSize] = useState(50)
  const [activeTab, setActiveTab] = useState<TabType>('recipe')
  const [displayUnits, setDisplayUnits] = useState<Record<number, MeasurementUnit>>({})

  useEffect(() => {
    let loadedCount = 0
    const checkLoaded = () => {
      loadedCount++
      if (loadedCount >= 2) setLoading(false)
    }

    const unsubIngredients = subscribeToIngredients((data) => {
      setIngredients(data)
      checkLoaded()
    })
    const unsubRecipes = subscribeToRecipes((data) => {
      setRecipes(data)
      checkLoaded()
    })

    return () => {
      unsubIngredients()
      unsubRecipes()
    }
  }, [])

  useEffect(() => {
    setDisplayUnits({})
  }, [selectedRecipeId])

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId)

  // Find matching product from cookies.ts
  const matchedProduct = useMemo(() => {
    if (!selectedRecipe) return null
    // Try to match by recipe name to cookie flavor or name
    return cookies.find(c => 
      c.name.toLowerCase().includes(selectedRecipe.name.toLowerCase()) ||
      c.flavor.toLowerCase().includes(selectedRecipe.name.toLowerCase()) ||
      selectedRecipe.displayName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0])
    )
  }, [selectedRecipe])

  const calculations = useMemo(() => {
    if (!selectedRecipe) return null

    const baseTotal = selectedRecipe.baseYield * selectedRecipe.baseCookieSize
    const targetTotal = quantity * cookieSize
    const scaleFactor = targetTotal / baseTotal

    const calculatedIngredients: CalculatedIngredient[] = selectedRecipe.ingredients.map((ri) => {
      const ing = ingredients.find((i) => i.id === ri.ingredientId)
      if (!ing) return null
      const pricePerUnit = ing.packagePrice / ing.packageSize
      const scaledAmount = ri.amount * scaleFactor
      return {
        ingredient: ing,
        baseAmount: ri.amount,
        scaledAmount,
        cost: pricePerUnit * scaledAmount,
        category: ri.category,
      }
    }).filter(Boolean) as CalculatedIngredient[]

    const totalCost = calculatedIngredients.reduce((sum, ci) => sum + ci.cost, 0)
    const costPerCookie = totalCost / quantity
    const totalDough = targetTotal

    return {
      scaleFactor,
      calculatedIngredients,
      totalCost,
      costPerCookie,
      totalDough,
    }
  }, [selectedRecipe, quantity, cookieSize, ingredients])

  // Profit calculations
  const profitMetrics = useMemo(() => {
    if (!calculations || !matchedProduct) return null

    const salePrice = matchedProduct.price
    const costPerCookie = calculations.costPerCookie
    const { discount, label: discountLabel } = getDiscountForQuantity(quantity)
    
    // Apply discount to sale price
    const discountedPrice = salePrice * (1 - discount)
    
    // Profit per cookie
    const profitPerCookie = discountedPrice - costPerCookie
    const profitMargin = (profitPerCookie / discountedPrice) * 100
    
    // Totals
    const grossRevenue = salePrice * quantity
    const netRevenue = discountedPrice * quantity
    const totalProfit = profitPerCookie * quantity
    const discountAmount = grossRevenue - netRevenue

    // Break-even analysis
    const breakEvenQuantity = Math.ceil(calculations.totalCost / profitPerCookie)

    return {
      salePrice,
      discountedPrice,
      discount,
      discountLabel,
      costPerCookie,
      profitPerCookie,
      profitMargin,
      grossRevenue,
      netRevenue,
      totalProfit,
      discountAmount,
      breakEvenQuantity,
    }
  }, [calculations, matchedProduct, quantity])

  // Volume discount tiers preview
  const discountTiers = useMemo(() => {
    if (!calculations || !matchedProduct) return []

    return VOLUME_DISCOUNTS.filter(t => t.threshold > 0).map(tier => {
      const salePrice = matchedProduct.price * (1 - tier.discount)
      const profit = salePrice - calculations.costPerCookie
      const margin = (profit / salePrice) * 100
      return {
        ...tier,
        label: BATCH_LABELS[tier.threshold] || `${tier.threshold}+`,
        salePrice,
        profit,
        margin,
      }
    })
  }, [calculations, matchedProduct])

  const handlePrint = () => window.print()

  const handleExport = () => {
    if (!calculations || !selectedRecipe) return

    const lines = [
      `Batch Calculator - ${selectedRecipe.displayName}`,
      `Quantity: ${quantity} cookies | Size: ${cookieSize}g`,
      `Scale Factor: ${calculations.scaleFactor.toFixed(2)}x`,
      ``,
      `INGREDIENTS:`,
      ...calculations.calculatedIngredients.map(
        (ci) => `  ${ci.ingredient.name}: ${ci.scaledAmount.toFixed(1)} ${ci.ingredient.unit} ($${ci.cost.toFixed(2)})`
      ),
      ``,
      `COSTS:`,
      `  Total Ingredient Cost: $${calculations.totalCost.toFixed(2)}`,
      `  Cost per Cookie: $${calculations.costPerCookie.toFixed(2)}`,
    ]

    if (profitMetrics) {
      lines.push(
        ``,
        `PROFIT ANALYSIS:`,
        `  Sale Price: $${profitMetrics.salePrice.toFixed(2)}`,
        `  Discount Applied: ${profitMetrics.discountLabel || 'None'}`,
        `  Net Price: $${profitMetrics.discountedPrice.toFixed(2)}`,
        `  Profit per Cookie: $${profitMetrics.profitPerCookie.toFixed(2)}`,
        `  Profit Margin: ${profitMetrics.profitMargin.toFixed(1)}%`,
        ``,
        `  Gross Revenue: $${profitMetrics.grossRevenue.toFixed(2)}`,
        `  Net Revenue: $${profitMetrics.netRevenue.toFixed(2)}`,
        `  Total Profit: $${profitMetrics.totalProfit.toFixed(2)}`
      )
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-${selectedRecipe.name.toLowerCase().replace(/\s+/g, '-')}-${quantity}cookies.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getDisplayUnit = (idx: number, defaultUnit: MeasurementUnit): MeasurementUnit => {
    return displayUnits[idx] || defaultUnit
  }

  const setDisplayUnit = (idx: number, unit: MeasurementUnit) => {
    setDisplayUnits(prev => ({ ...prev, [idx]: unit }))
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-midnight">Batch Calculator</h1>
          <p className="text-gray-600 mt-1">Scale recipes • Analyze profits • Apply discounts</p>
        </div>
        {calculations && (
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <Printer size={18} />
              Print
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-gold text-midnight px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('recipe')}
          className={`px-4 py-2 rounded-md font-medium transition ${
            activeTab === 'recipe'
              ? 'bg-white text-midnight shadow-sm'
              : 'text-gray-600 hover:text-midnight'
          }`}
        >
          <CalcIcon size={16} className="inline mr-2" />
          Recipe Calculator
        </button>
        <button
          onClick={() => setActiveTab('profit')}
          className={`px-4 py-2 rounded-md font-medium transition ${
            activeTab === 'profit'
              ? 'bg-white text-midnight shadow-sm'
              : 'text-gray-600 hover:text-midnight'
          }`}
        >
          <TrendingUp size={16} className="inline mr-2" />
          Profit Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-midnight mb-4">Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipe</label>
              <select
                value={selectedRecipeId ?? ''}
                onChange={(e) => {
                  const id = Number(e.target.value)
                  setSelectedRecipeId(id || null)
                  const recipe = recipes.find((r) => r.id === id)
                  if (recipe) {
                    setQuantity(recipe.baseYield)
                    setCookieSize(recipe.baseCookieSize)
                  }
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
              >
                <option value="">Choose a recipe...</option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName} ({r.name})
                  </option>
                ))}
              </select>
            </div>

            {matchedProduct && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-medium">Linked Product</p>
                <p className="text-green-800 font-semibold">{matchedProduct.name}</p>
                <p className="text-green-700">${matchedProduct.price.toFixed(2)} / cookie</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cookie Quantity</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-lg"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {[6, 12, 24, 36, 48, 72, 100].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`px-3 py-1 rounded-lg text-sm transition ${
                      quantity === q
                        ? 'bg-gold text-midnight font-semibold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cookie Size (g)</label>
              <input
                type="number"
                value={cookieSize}
                onChange={(e) => setCookieSize(Number(e.target.value))}
                min={20}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-lg"
              />
              <div className="flex gap-2 mt-2 flex-wrap">
                {[30, 40, 50, 60, 80, 100].map((s) => (
                  <button
                    key={s}
                    onClick={() => setCookieSize(s)}
                    className={`px-3 py-1 rounded-lg text-sm transition ${
                      cookieSize === s
                        ? 'bg-gold text-midnight font-semibold'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}g
                  </button>
                ))}
              </div>
            </div>

            {calculations && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase">Scale</p>
                    <p className="text-xl font-bold text-midnight">{calculations.scaleFactor.toFixed(2)}x</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase">Dough</p>
                    <p className="text-xl font-bold text-midnight">{calculations.totalDough.toLocaleString()}g</p>
                  </div>
                </div>
                {profitMetrics && profitMetrics.discountLabel && (
                  <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
                    <p className="text-yellow-700 font-semibold">{profitMetrics.discountLabel}</p>
                    <p className="text-xs text-yellow-600">Volume discount applied</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2">
          {!selectedRecipe ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
              <CalcIcon className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-400">Select a Recipe</h3>
              <p className="text-gray-400 mt-2">Choose a recipe to see calculations</p>
            </div>
          ) : calculations ? (
            <>
              {/* TAB: Recipe Calculator */}
              {activeTab === 'recipe' && (
                <div className="space-y-6">
                  {/* Cost Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Total Cost</p>
                      <p className="text-3xl font-bold text-red-600">${calculations.totalCost.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Cost/Cookie</p>
                      <p className="text-3xl font-bold text-midnight">${calculations.costPerCookie.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Bake Settings</p>
                      <p className="text-lg font-bold text-midnight">{selectedRecipe.ovenTemp}</p>
                      <p className="text-sm text-gray-500">{selectedRecipe.bakeTime}</p>
                    </div>
                  </div>

                  {/* Ingredients Table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-semibold text-midnight">Scaled Ingredients</h3>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-6 py-3 font-semibold text-gray-600">Ingredient</th>
                          <th className="text-left px-6 py-3 font-semibold text-gray-600">Cat</th>
                          <th className="text-left px-6 py-3 font-semibold text-gray-600">Unit</th>
                          <th className="text-right px-6 py-3 font-semibold text-gray-600">Base</th>
                          <th className="text-right px-6 py-3 font-semibold text-gray-600">Scaled</th>
                          <th className="text-right px-6 py-3 font-semibold text-gray-600">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculations.calculatedIngredients.map((ci, idx) => {
                          const storedUnit = ci.ingredient.unit as MeasurementUnit
                          const displayUnit = getDisplayUnit(idx, storedUnit)
                          const convertedBase = convert(ci.baseAmount, storedUnit, displayUnit)
                          const convertedScaled = convert(ci.scaledAmount, storedUnit, displayUnit)
                          const isVolume = UNITS[displayUnit].category === 'volume'
                          
                          return (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-6 py-3 font-medium text-midnight">{ci.ingredient.name}</td>
                              <td className="px-6 py-3">
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{ci.category}</span>
                              </td>
                              <td className="px-6 py-3">
                                <select
                                  value={displayUnit}
                                  onChange={(e) => setDisplayUnit(idx, e.target.value as MeasurementUnit)}
                                  className="px-2 py-1 border border-gray-200 rounded text-xs bg-white cursor-pointer"
                                >
                                  <optgroup label="Weight">
                                    <option value="g">g</option>
                                    <option value="oz">oz</option>
                                    <option value="lb">lb</option>
                                  </optgroup>
                                  <optgroup label="Volume">
                                    <option value="cup">cup</option>
                                    <option value="tbsp">tbsp</option>
                                    <option value="tsp">tsp</option>
                                  </optgroup>
                                </select>
                              </td>
                              <td className="px-6 py-3 text-right text-gray-500">
                                {isVolume && convertedBase < 4 ? formatAsFraction(convertedBase) : formatAmount(convertedBase)}
                              </td>
                              <td className="px-6 py-3 text-right font-semibold text-midnight">
                                {isVolume && convertedScaled < 4 ? formatAsFraction(convertedScaled) : formatAmount(convertedScaled)}
                              </td>
                              <td className="px-6 py-3 text-right text-green-600">${ci.cost.toFixed(2)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={5} className="px-6 py-3 text-right font-semibold">Total</td>
                          <td className="px-6 py-3 text-right text-green-600 font-bold">${calculations.totalCost.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Instructions */}
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-midnight mb-3">Instructions</h3>
                    <p className="text-gray-600">{selectedRecipe.instructions}</p>
                  </div>
                </div>
              )}

              {/* TAB: Profit Analysis */}
              {activeTab === 'profit' && profitMetrics && (
                <div className="space-y-6">
                  {/* Profit Summary Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="text-gray-400" size={18} />
                        <p className="text-sm text-gray-500">Sale Price</p>
                      </div>
                      <p className="text-2xl font-bold text-midnight">${profitMetrics.discountedPrice.toFixed(2)}</p>
                      {profitMetrics.discountLabel && (
                        <p className="text-xs text-yellow-600 mt-1">{profitMetrics.discountLabel} applied</p>
                      )}
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-gray-400" size={18} />
                        <p className="text-sm text-gray-500">Profit/Cookie</p>
                      </div>
                      <p className={`text-2xl font-bold ${profitMetrics.profitPerCookie >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${profitMetrics.profitPerCookie.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent className="text-gray-400" size={18} />
                        <p className="text-sm text-gray-500">Margin</p>
                      </div>
                      <p className={`text-2xl font-bold ${profitMetrics.profitMargin >= 50 ? 'text-green-600' : profitMetrics.profitMargin >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {profitMetrics.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <CalcIcon className="text-gray-400" size={18} />
                        <p className="text-sm text-gray-500">Break-even</p>
                      </div>
                      <p className="text-2xl font-bold text-midnight">{profitMetrics.breakEvenQuantity}</p>
                      <p className="text-xs text-gray-500">cookies needed</p>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-semibold text-midnight">Order Financial Summary ({quantity} cookies)</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Gross Revenue (before discount)</span>
                          <span className="font-medium">${profitMetrics.grossRevenue.toFixed(2)}</span>
                        </div>
                        {profitMetrics.discountAmount > 0 && (
                          <div className="flex justify-between py-2 text-yellow-600">
                            <span>Volume Discount ({profitMetrics.discountLabel})</span>
                            <span className="font-medium">-${profitMetrics.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-t pt-3">
                          <span className="text-gray-600">Net Revenue</span>
                          <span className="font-semibold text-midnight">${profitMetrics.netRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-red-600">
                          <span>Ingredient Cost</span>
                          <span className="font-medium">-${calculations.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-3 border-t border-dashed text-lg">
                          <span className="font-semibold text-midnight">Total Profit</span>
                          <span className={`font-bold ${profitMetrics.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${profitMetrics.totalProfit.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Volume Discount Tiers */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-semibold text-midnight">Volume Discount Analysis</h3>
                      <p className="text-sm text-gray-500">How discounts affect profit margins</p>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-6 py-3 font-semibold text-gray-600">Quantity</th>
                          <th className="text-left px-6 py-3 font-semibold text-gray-600">Discount</th>
                          <th className="text-right px-6 py-3 font-semibold text-gray-600">Sale Price</th>
                          <th className="text-right px-6 py-3 font-semibold text-gray-600">Cost</th>
                          <th className="text-right px-6 py-3 font-semibold text-gray-600">Profit</th>
                          <th className="text-right px-6 py-3 font-semibold text-gray-600">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discountTiers.map((tier, idx) => (
                          <tr 
                            key={idx} 
                            className={`border-b border-gray-50 ${tier.threshold === quantity || (quantity >= tier.threshold && quantity < (discountTiers[idx - 1]?.threshold || 999)) ? 'bg-gold/10' : ''}`}
                          >
                            <td className="px-6 py-3 font-medium text-midnight">
                              {tier.threshold}+ ({tier.label})
                            </td>
                            <td className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${tier.discount > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                {tier.discount > 0 ? `${(tier.discount * 100).toFixed(0)}% off` : 'No discount'}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right">${tier.salePrice.toFixed(2)}</td>
                            <td className="px-6 py-3 text-right text-gray-500">${calculations.costPerCookie.toFixed(2)}</td>
                            <td className={`px-6 py-3 text-right font-medium ${tier.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${tier.profit.toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${tier.margin >= 50 ? 'bg-green-100 text-green-700' : tier.margin >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {tier.margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                      <h3 className="font-semibold text-midnight">Ingredient Cost Breakdown</h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-2">
                        {calculations.calculatedIngredients
                          .sort((a, b) => b.cost - a.cost)
                          .map((ci, idx) => {
                            const pct = (ci.cost / calculations.totalCost) * 100
                            return (
                              <div key={idx} className="flex items-center gap-3">
                                <span className="w-32 text-sm text-gray-600 truncate">{ci.ingredient.name}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                  <div 
                                    className="bg-gold h-full rounded-full" 
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-600 w-16 text-right">${ci.cost.toFixed(2)}</span>
                                <span className="text-xs text-gray-400 w-12 text-right">{pct.toFixed(0)}%</span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profit' && !matchedProduct && (
                <div className="bg-yellow-50 rounded-xl p-8 border border-yellow-200 text-center">
                  <p className="text-yellow-700 font-semibold">No Product Linked</p>
                  <p className="text-yellow-600 mt-2 text-sm">
                    This recipe isn't linked to a product in your store. 
                    Add a matching cookie in cookies.ts to see profit analysis.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
