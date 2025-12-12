import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Search, Save, Loader2, ArrowRightLeft, Package, AlertTriangle, DollarSign } from 'lucide-react'
import { Ingredient } from '../types/admin'
import { 
  subscribeToIngredients, 
  saveIngredient, 
  deleteIngredient as deleteIngredientFromDb,
  getNextId
} from '../lib/storage'
import { 
  MeasurementUnit, 
  UNIT_OPTIONS, 
  UNITS, 
  convert, 
  formatAmount,
  formatAsFraction,
  getCompatibleUnits
} from '../lib/conversions'

const CATEGORIES = [
  'Fats',
  'Sugars',
  'Flour & Starches',
  'Leaveners',
  'Eggs & Dairy',
  'Flavorings',
  'Spices',
  'Mix-ins',
]

interface RestockData {
  ingredient: Ingredient
  amount: number
  unit: MeasurementUnit
  purchasePrice: number
}

export function Ingredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  
  // Track display units per ingredient (id -> displayUnit)
  const [displayUnits, setDisplayUnits] = useState<Record<number, MeasurementUnit>>({})
  
  const [formData, setFormData] = useState({
    name: '',
    unit: 'g' as MeasurementUnit,
    packageSize: 0,
    packagePrice: 0,
    category: 'Fats',
    currentStock: 0,
    minThreshold: 0,
    reorderAmount: 0,
    stockValue: 0,
    costPerUnit: 0,
  })
  
  const [restockModal, setRestockModal] = useState<RestockData | null>(null)

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToIngredients((data) => {
      setIngredients(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const filteredIngredients = ingredients.filter((ing) => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || ing.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Calculate total inventory value
  const totalInventoryValue = ingredients.reduce((sum, ing) => {
    return sum + (ing.stockValue ?? 0)
  }, 0)

  // Get display unit for an ingredient (defaults to stored unit)
  const getDisplayUnit = (ing: Ingredient): MeasurementUnit => {
    return displayUnits[ing.id] || (ing.unit as MeasurementUnit)
  }

  // Get converted stock for display
  const getDisplayStock = (ing: Ingredient): number => {
    const displayUnit = getDisplayUnit(ing)
    const storedUnit = ing.unit as MeasurementUnit
    const currentStock = ing.currentStock ?? 0
    if (displayUnit === storedUnit) return currentStock
    return convert(currentStock, storedUnit, displayUnit)
  }

  // Change display unit for an ingredient
  const handleDisplayUnitChange = (ingId: number, newUnit: MeasurementUnit) => {
    setDisplayUnits(prev => ({ ...prev, [ingId]: newUnit }))
  }

  const openAddModal = () => {
    setEditingIngredient(null)
    setFormData({ 
      name: '', 
      unit: 'g', 
      packageSize: 0, 
      packagePrice: 0, 
      category: 'Fats',
      currentStock: 0,
      minThreshold: 0,
      reorderAmount: 0,
      stockValue: 0,
      costPerUnit: 0,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setFormData({
      name: ingredient.name,
      unit: ingredient.unit as MeasurementUnit,
      packageSize: ingredient.packageSize,
      packagePrice: ingredient.packagePrice,
      category: ingredient.category,
      currentStock: ingredient.currentStock ?? 0,
      minThreshold: ingredient.minThreshold ?? 0,
      reorderAmount: ingredient.reorderAmount ?? ingredient.packageSize,
      stockValue: ingredient.stockValue ?? 0,
      costPerUnit: ingredient.costPerUnit ?? (ingredient.packagePrice / ingredient.packageSize),
    })
    setIsModalOpen(true)
  }
  
  const openRestockModal = (ingredient: Ingredient) => {
    setRestockModal({
      ingredient,
      amount: ingredient.reorderAmount ?? ingredient.packageSize,
      unit: ingredient.unit as MeasurementUnit,
      purchasePrice: ingredient.packagePrice, // Default to standard package price
    })
  }
  
  const handleRestock = async () => {
    if (!restockModal) return
    setSaving(true)
    try {
      const { ingredient, amount, unit, purchasePrice } = restockModal
      
      // Convert restock amount to base unit if different
      const baseUnit = ingredient.unit as MeasurementUnit
      const restockAmountInBaseUnits = unit === baseUnit 
        ? amount 
        : convert(amount, unit, baseUnit)
      
      const currentStock = ingredient.currentStock ?? 0
      const currentValue = ingredient.stockValue ?? 0
      
      // Calculate new totals
      const newStock = currentStock + restockAmountInBaseUnits
      const newValue = currentValue + purchasePrice
      
      // Calculate weighted average cost per unit
      const newCostPerUnit = newStock > 0 ? newValue / newStock : 0
      
      // Save updated ingredient
      await saveIngredient({
        ...ingredient,
        currentStock: newStock,
        stockValue: newValue,
        costPerUnit: newCostPerUnit,
        lastRestocked: new Date().toISOString(),
      })
      
      setRestockModal(null)
    } catch (error) {
      console.error('Error restocking:', error)
      alert('Error updating stock')
    } finally {
      setSaving(false)
    }
  }
  
  const getStockStatus = (ing: Ingredient) => {
    const current = ing.currentStock ?? 0
    const threshold = ing.minThreshold ?? 0
    if (current <= 0) return 'out'
    if (current <= threshold) return 'low'
    if (current <= threshold * 1.5) return 'warning'
    return 'ok'
  }

  // Handle unit change with automatic conversion
  const handleUnitChange = (newUnit: MeasurementUnit) => {
    const oldUnit = formData.unit as MeasurementUnit
    
    // Check if units are compatible (same category)
    if (UNITS[oldUnit].category === UNITS[newUnit].category) {
      // Convert the package size and stock
      const convertedSize = convert(formData.packageSize, oldUnit, newUnit)
      const convertedStock = convert(formData.currentStock, oldUnit, newUnit)
      const convertedThreshold = convert(formData.minThreshold, oldUnit, newUnit)
      const convertedReorder = convert(formData.reorderAmount, oldUnit, newUnit)
      setFormData({ 
        ...formData, 
        unit: newUnit, 
        packageSize: Number(formatAmount(convertedSize)),
        currentStock: Number(formatAmount(convertedStock)),
        minThreshold: Number(formatAmount(convertedThreshold)),
        reorderAmount: Number(formatAmount(convertedReorder)),
      })
    } else {
      // Different category, just change unit without converting
      setFormData({ ...formData, unit: newUnit })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Calculate stock value and cost per unit if not set
      const stockValue = formData.stockValue || (formData.currentStock * (formData.packagePrice / formData.packageSize))
      const costPerUnit = formData.costPerUnit || (formData.packagePrice / formData.packageSize)
      
      const dataToSave = {
        ...formData,
        stockValue,
        costPerUnit,
      }
      
      if (editingIngredient) {
        await saveIngredient({ id: editingIngredient.id, ...dataToSave })
      } else {
        const newId = await getNextId('ingredients')
        await saveIngredient({ id: newId, ...dataToSave })
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving ingredient:', error)
      alert('Error saving ingredient. Check console for details.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this ingredient?')) {
      try {
        await deleteIngredientFromDb(id)
      } catch (error) {
        console.error('Error deleting ingredient:', error)
        alert('Error deleting ingredient.')
      }
    }
  }

  // Get restock amount in display unit
  const getRestockDisplayAmount = (): number => {
    if (!restockModal) return 0
    return restockModal.amount
  }

  // Handle restock unit change with conversion
  const handleRestockUnitChange = (newUnit: MeasurementUnit) => {
    if (!restockModal) return
    const oldUnit = restockModal.unit
    
    if (UNITS[oldUnit].category === UNITS[newUnit].category) {
      const convertedAmount = convert(restockModal.amount, oldUnit, newUnit)
      setRestockModal({
        ...restockModal,
        unit: newUnit,
        amount: Number(formatAmount(convertedAmount)),
      })
    } else {
      setRestockModal({ ...restockModal, unit: newUnit })
    }
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
          <h1 className="text-3xl font-bold text-midnight">Ingredients</h1>
          <p className="text-gray-600 mt-1">Manage inventory with cost tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-green-50 rounded-lg px-4 py-2 border border-green-200">
            <p className="text-xs text-green-600 font-medium">Total Inventory Value</p>
            <p className="text-xl font-bold text-green-700">${totalInventoryValue.toFixed(2)}</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-gold text-midnight px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
          >
            <Plus size={20} />
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Ingredient</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Unit</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Stock</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Value</th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Cost/Unit</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map((ing) => {
              const displayUnit = getDisplayUnit(ing)
              const displayStock = getDisplayStock(ing)
              const stockStatus = getStockStatus(ing)
              const stockValue = ing.stockValue ?? 0
              const costPerUnit = ing.costPerUnit ?? (ing.packagePrice / ing.packageSize)
              const isVolumeUnit = UNITS[displayUnit].category === 'volume'
              
              return (
                <tr key={ing.id} className={`border-b border-gray-50 hover:bg-gray-50 ${
                  stockStatus === 'out' ? 'bg-red-50' : 
                  stockStatus === 'low' ? 'bg-amber-50/50' : ''
                }`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {stockStatus !== 'ok' && stockStatus !== 'warning' && (
                        <AlertTriangle size={14} className={
                          stockStatus === 'out' ? 'text-red-500' : 'text-amber-500'
                        } />
                      )}
                      <span className="font-medium text-midnight">{ing.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {ing.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={displayUnit}
                      onChange={(e) => handleDisplayUnitChange(ing.id, e.target.value as MeasurementUnit)}
                      className="px-2 py-1 border border-gray-200 rounded text-sm bg-white hover:border-gold focus:outline-none focus:border-gold cursor-pointer"
                    >
                      <optgroup label="Weight">
                        <option value="g">g</option>
                        <option value="oz">oz</option>
                        <option value="lb">lb</option>
                        <option value="kg">kg</option>
                      </optgroup>
                      <optgroup label="Volume">
                        <option value="cup">cup</option>
                        <option value="tbsp">tbsp</option>
                        <option value="tsp">tsp</option>
                        <option value="ml">ml</option>
                        <option value="fl_oz">fl oz</option>
                      </optgroup>
                      <optgroup label="Count">
                        <option value="each">each</option>
                      </optgroup>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-medium text-midnight">
                      {isVolumeUnit && displayStock < 4 
                        ? formatAsFraction(displayStock)
                        : formatAmount(displayStock)}
                    </span>
                    <span className="text-gray-400 ml-1 text-sm">{UNITS[displayUnit].shortLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium text-green-600">${stockValue.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stockStatus === 'out' ? 'bg-red-100 text-red-700' :
                        stockStatus === 'low' ? 'bg-amber-100 text-amber-700' :
                        stockStatus === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {stockStatus === 'out' ? 'OUT' :
                         stockStatus === 'low' ? 'LOW' :
                         stockStatus === 'warning' ? 'WARN' : 'OK'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <span className="text-gray-600">${costPerUnit.toFixed(4)}</span>
                    <span className="text-gray-400">/{ing.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openRestockModal(ing)}
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                        title="Restock"
                      >
                        <Package size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(ing)}
                        className="p-1.5 text-gray-500 hover:text-midnight hover:bg-gray-100 rounded transition"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(ing.id)}
                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-midnight">
                {editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Unsalted Butter"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Measurement Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleUnitChange(e.target.value as MeasurementUnit)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  >
                    {UNIT_OPTIONS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick unit conversion buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ArrowRightLeft size={14} className="inline mr-1" />
                  Quick Convert To
                </label>
                <div className="flex flex-wrap gap-2">
                  {getCompatibleUnits(formData.unit).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => handleUnitChange(unit)}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        formData.unit === unit
                          ? 'bg-gold text-midnight font-semibold'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {UNITS[unit].shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Size ({UNITS[formData.unit].shortLabel})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.packageSize}
                    onChange={(e) => setFormData({ ...formData, packageSize: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.packagePrice}
                    onChange={(e) => setFormData({ ...formData, packagePrice: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
              
              {/* Inventory Section */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-midnight mb-3 flex items-center gap-2">
                  <Package size={16} />
                  Inventory Tracking
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Min Threshold
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.minThreshold}
                      onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Reorder Qty
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.reorderAmount}
                      onChange={(e) => setFormData({ ...formData, reorderAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                    />
                  </div>
                </div>
                
                {/* Cost Tracking */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <DollarSign size={12} className="inline" /> Stock Value ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.stockValue}
                      onChange={(e) => setFormData({ ...formData, stockValue: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                      placeholder="Total value of stock"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cost per Unit ($)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm"
                      placeholder="Avg cost per unit"
                    />
                  </div>
                </div>
              </div>

              {formData.packageSize > 0 && formData.packagePrice > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Standard Price per {UNITS[formData.unit].shortLabel}</span>
                    <span className="font-bold text-green-600">
                      ${(formData.packagePrice / formData.packageSize).toFixed(4)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || formData.packageSize <= 0}
                className="flex-1 px-4 py-2 bg-gold text-midnight rounded-lg font-semibold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced Restock Modal with Unit Conversion & Cost Tracking */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-midnight flex items-center gap-2">
                <Package className="text-blue-500" />
                Restock {restockModal.ingredient.name}
              </h2>
              <button
                onClick={() => setRestockModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Current Stock Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Current Stock</p>
                  <p className="font-mono font-bold text-midnight">
                    {formatAmount(restockModal.ingredient.currentStock ?? 0)} {restockModal.ingredient.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Value</p>
                  <p className="font-bold text-green-600">
                    ${(restockModal.ingredient.stockValue ?? 0).toFixed(2)}
                  </p>
                </div>
              </div>
              {(restockModal.ingredient.currentStock ?? 0) > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Current Cost/Unit</p>
                  <p className="font-mono text-gray-600">
                    ${(restockModal.ingredient.costPerUnit ?? 0).toFixed(4)}/{restockModal.ingredient.unit}
                  </p>
                </div>
              )}
            </div>
            
            {/* Restock Amount with Unit Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Add
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={getRestockDisplayAmount()}
                  onChange={(e) => setRestockModal({ ...restockModal, amount: Number(e.target.value) })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-lg font-mono"
                />
                <select
                  value={restockModal.unit}
                  onChange={(e) => handleRestockUnitChange(e.target.value as MeasurementUnit)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold bg-white"
                >
                  <optgroup label="Weight">
                    <option value="g">g</option>
                    <option value="oz">oz</option>
                    <option value="lb">lb</option>
                    <option value="kg">kg</option>
                  </optgroup>
                  <optgroup label="Volume">
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="ml">ml</option>
                    <option value="fl_oz">fl oz</option>
                  </optgroup>
                  <optgroup label="Count">
                    <option value="each">each</option>
                  </optgroup>
                </select>
              </div>
              
              {/* Quick amount buttons */}
              <div className="flex gap-2 mt-2">
                {[0.5, 1, 2, 5].map(mult => (
                  <button
                    key={mult}
                    onClick={() => setRestockModal({ 
                      ...restockModal, 
                      amount: (restockModal.ingredient.reorderAmount ?? restockModal.ingredient.packageSize) * mult,
                      unit: restockModal.ingredient.unit as MeasurementUnit,
                    })}
                    className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition"
                  >
                    {mult === 0.5 ? '½' : mult}x pkg
                  </button>
                ))}
              </div>
            </div>
            
            {/* Purchase Price */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign size={14} className="inline" /> Purchase Price (what you paid)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={restockModal.purchasePrice}
                  onChange={(e) => setRestockModal({ ...restockModal, purchasePrice: Number(e.target.value) })}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-lg font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Standard pkg price: ${restockModal.ingredient.packagePrice.toFixed(2)}
              </p>
            </div>
            
            {/* Calculation Preview */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Adding</span>
                <span className="font-mono font-medium">
                  {formatAmount(restockModal.unit === restockModal.ingredient.unit 
                    ? restockModal.amount 
                    : convert(restockModal.amount, restockModal.unit, restockModal.ingredient.unit as MeasurementUnit)
                  )} {restockModal.ingredient.unit}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Adding Value</span>
                <span className="font-medium text-green-600">+${restockModal.purchasePrice.toFixed(2)}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">New Total Stock</span>
                  <span className="font-mono font-bold text-midnight">
                    {formatAmount(
                      (restockModal.ingredient.currentStock ?? 0) + 
                      (restockModal.unit === restockModal.ingredient.unit 
                        ? restockModal.amount 
                        : convert(restockModal.amount, restockModal.unit, restockModal.ingredient.unit as MeasurementUnit))
                    )} {restockModal.ingredient.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-700 font-medium">New Total Value</span>
                  <span className="font-bold text-green-600">
                    ${((restockModal.ingredient.stockValue ?? 0) + restockModal.purchasePrice).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-700 font-medium">New Avg Cost/Unit</span>
                  <span className="font-mono text-blue-600">
                    ${(
                      ((restockModal.ingredient.stockValue ?? 0) + restockModal.purchasePrice) /
                      ((restockModal.ingredient.currentStock ?? 0) + 
                        (restockModal.unit === restockModal.ingredient.unit 
                          ? restockModal.amount 
                          : convert(restockModal.amount, restockModal.unit, restockModal.ingredient.unit as MeasurementUnit)))
                    ).toFixed(4)}/{restockModal.ingredient.unit}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setRestockModal(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                disabled={saving || restockModal.amount <= 0 || restockModal.purchasePrice <= 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Package size={18} />
                )}
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
