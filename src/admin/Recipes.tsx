import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react'
import { Ingredient, Recipe, RecipeIngredient } from '../types/admin'
import { 
  subscribeToRecipes, 
  subscribeToIngredients, 
  saveRecipe, 
  deleteRecipe as deleteRecipeFromDb,
  getNextId 
} from '../lib/storage'
import { UNITS, MeasurementUnit, convert, formatAmount, formatAsFraction } from '../lib/conversions'

export function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  
  // Track display units for recipe ingredients: recipeId -> ingredientIndex -> displayUnit
  const [displayUnits, setDisplayUnits] = useState<Record<string, MeasurementUnit>>({})
  
  const [formData, setFormData] = useState<Omit<Recipe, 'id'>>({
    name: '',
    displayName: '',
    baseYield: 24,
    baseCookieSize: 50,
    totalDough: 1200,
    ovenTemp: '350°F (175°C)',
    bakeTime: '10-12 min',
    instructions: '',
    ingredients: [],
  })

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubRecipes = subscribeToRecipes((data) => {
      setRecipes(data)
      setLoading(false)
    })
    const unsubIngredients = subscribeToIngredients((data) => {
      setIngredients(data)
    })

    return () => {
      unsubRecipes()
      unsubIngredients()
    }
  }, [])

  const getIngredientById = (id: number) => ingredients.find((i) => i.id === id)

  // Get display unit for a recipe ingredient
  const getDisplayUnit = (recipeId: number, idx: number, defaultUnit: MeasurementUnit): MeasurementUnit => {
    const key = `${recipeId}-${idx}`
    return displayUnits[key] || defaultUnit
  }

  // Set display unit for a recipe ingredient
  const setDisplayUnit = (recipeId: number, idx: number, unit: MeasurementUnit) => {
    const key = `${recipeId}-${idx}`
    setDisplayUnits(prev => ({ ...prev, [key]: unit }))
  }

  const calculateRecipeCost = (recipe: Recipe) => {
    return recipe.ingredients.reduce((total, ri) => {
      const ing = getIngredientById(ri.ingredientId)
      if (!ing) return total
      const pricePerUnit = ing.packagePrice / ing.packageSize
      return total + pricePerUnit * ri.amount
    }, 0)
  }

  const openAddModal = () => {
    setEditingRecipe(null)
    setFormData({
      name: '',
      displayName: '',
      baseYield: 24,
      baseCookieSize: 50,
      totalDough: 1200,
      ovenTemp: '350°F (175°C)',
      bakeTime: '10-12 min',
      instructions: '',
      ingredients: [],
    })
    setIsModalOpen(true)
  }

  const openEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setFormData({
      name: recipe.name,
      displayName: recipe.displayName,
      baseYield: recipe.baseYield,
      baseCookieSize: recipe.baseCookieSize,
      totalDough: recipe.totalDough,
      ovenTemp: recipe.ovenTemp,
      bakeTime: recipe.bakeTime,
      instructions: recipe.instructions,
      ingredients: [...recipe.ingredients],
    })
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingRecipe) {
        await saveRecipe({ id: editingRecipe.id, ...formData })
      } else {
        const newId = await getNextId('recipes')
        await saveRecipe({ id: newId, ...formData })
      }
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Error saving recipe. Check console for details.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await deleteRecipeFromDb(id)
      } catch (error) {
        console.error('Error deleting recipe:', error)
        alert('Error deleting recipe.')
      }
    }
  }

  const addIngredientToRecipe = () => {
    if (ingredients.length === 0) return
    setFormData({
      ...formData,
      ingredients: [
        ...formData.ingredients,
        { ingredientId: ingredients[0].id, amount: 0, category: 'Dry' },
      ],
    })
  }

  const updateRecipeIngredient = (index: number, field: keyof RecipeIngredient, value: number | string) => {
    const updated = [...formData.ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, ingredients: updated })
  }

  const removeRecipeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    })
  }

  // Unit dropdown component
  const UnitDropdown = ({ 
    value, 
    onChange, 
    storedUnit 
  }: { 
    value: MeasurementUnit
    onChange: (unit: MeasurementUnit) => void
    storedUnit: MeasurementUnit
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MeasurementUnit)}
      className="px-2 py-1 border border-gray-200 rounded text-xs bg-white hover:border-gold focus:outline-none focus:border-gold cursor-pointer"
      onClick={(e) => e.stopPropagation()}
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
      {storedUnit === 'each' && (
        <optgroup label="Count">
          <option value="each">ea</option>
        </optgroup>
      )}
    </select>
  )

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-midnight">Recipes</h1>
          <p className="text-gray-600 mt-1">Manage your cookie recipes • Click unit to convert</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-gold text-midnight px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
        >
          <Plus size={20} />
          Add Recipe
        </button>
      </div>

      {/* Recipe Cards */}
      <div className="space-y-4">
        {recipes.map((recipe) => {
          const isExpanded = expandedRecipe === recipe.id
          const cost = calculateRecipeCost(recipe)
          const costPerCookie = cost / recipe.baseYield

          return (
            <div
              key={recipe.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center text-2xl">
                    🍪
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-midnight">{recipe.displayName}</h3>
                    <p className="text-sm text-gray-500">{recipe.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Yield</p>
                    <p className="font-semibold text-midnight">{recipe.baseYield} cookies</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Size</p>
                    <p className="font-semibold text-midnight">{recipe.baseCookieSize}g</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Cost/Cookie</p>
                    <p className="font-semibold text-green-600">${costPerCookie.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditModal(recipe); }}
                      className="p-2 text-gray-500 hover:text-midnight hover:bg-gray-100 rounded-lg transition"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(recipe.id); }}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-6 bg-gray-50">
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Oven Temp</p>
                      <p className="font-medium text-midnight">{recipe.ovenTemp}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Bake Time</p>
                      <p className="font-medium text-midnight">{recipe.bakeTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Total Batch Cost</p>
                      <p className="font-medium text-green-600">${cost.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Instructions</p>
                    <p className="text-midnight">{recipe.instructions}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Ingredients ({recipe.ingredients.length})</p>
                    <div className="bg-white rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left px-4 py-2">Ingredient</th>
                            <th className="text-left px-4 py-2">Category</th>
                            <th className="text-left px-4 py-2">Unit</th>
                            <th className="text-right px-4 py-2">Amount</th>
                            <th className="text-right px-4 py-2">Cost</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipe.ingredients.map((ri, idx) => {
                            const ing = getIngredientById(ri.ingredientId)
                            if (!ing) return null
                            const storedUnit = ing.unit as MeasurementUnit
                            const displayUnit = getDisplayUnit(recipe.id, idx, storedUnit)
                            const convertedAmount = convert(ri.amount, storedUnit, displayUnit)
                            const pricePerUnit = ing.packagePrice / ing.packageSize
                            const itemCost = pricePerUnit * ri.amount
                            const isVolume = UNITS[displayUnit].category === 'volume'
                            
                            return (
                              <tr key={idx} className="border-b border-gray-50">
                                <td className="px-4 py-2">{ing.name}</td>
                                <td className="px-4 py-2 text-gray-500">{ri.category}</td>
                                <td className="px-4 py-2">
                                  <UnitDropdown
                                    value={displayUnit}
                                    onChange={(unit) => setDisplayUnit(recipe.id, idx, unit)}
                                    storedUnit={storedUnit}
                                  />
                                </td>
                                <td className="px-4 py-2 text-right font-medium">
                                  {isVolume && convertedAmount < 4 
                                    ? formatAsFraction(convertedAmount)
                                    : formatAmount(convertedAmount)
                                  }
                                </td>
                                <td className="px-4 py-2 text-right text-green-600">${itemCost.toFixed(2)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-midnight">
                {editingRecipe ? 'Edit Recipe' : 'Add Recipe'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Chocolate Chip"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g. Moonlight Morsels"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base Yield</label>
                  <input
                    type="number"
                    value={formData.baseYield}
                    onChange={(e) => setFormData({ ...formData, baseYield: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cookie Size (g)</label>
                  <input
                    type="number"
                    value={formData.baseCookieSize}
                    onChange={(e) => setFormData({ ...formData, baseCookieSize: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Oven Temp</label>
                  <input
                    type="text"
                    value={formData.ovenTemp}
                    onChange={(e) => setFormData({ ...formData, ovenTemp: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bake Time</label>
                  <input
                    type="text"
                    value={formData.bakeTime}
                    onChange={(e) => setFormData({ ...formData, bakeTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                />
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Ingredients</label>
                  <button
                    type="button"
                    onClick={addIngredientToRecipe}
                    className="text-sm text-gold hover:text-yellow-600 font-medium flex items-center gap-1"
                  >
                    <Plus size={16} /> Add Ingredient
                  </button>
                </div>
                
                {formData.ingredients.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-500">
                    No ingredients added yet. Click "Add Ingredient" to start.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.ingredients.map((ri, idx) => {
                      const selectedIngredient = getIngredientById(ri.ingredientId)
                      const storedUnit = selectedIngredient?.unit as MeasurementUnit || 'g'
                      return (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <select
                            value={ri.ingredientId}
                            onChange={(e) => updateRecipeIngredient(idx, 'ingredientId', Number(e.target.value))}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                          >
                            {ingredients.map((ing) => {
                              const ingUnit = UNITS[ing.unit as MeasurementUnit]
                              return (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} ({ingUnit?.shortLabel || ing.unit})
                                </option>
                              )
                            })}
                          </select>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={ri.amount}
                              onChange={(e) => updateRecipeIngredient(idx, 'amount', Number(e.target.value))}
                              placeholder="Amount"
                              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-right"
                            />
                            <span className="text-sm text-gray-500 w-8 font-medium">
                              {UNITS[storedUnit]?.shortLabel || storedUnit}
                            </span>
                          </div>
                          <select
                            value={ri.category}
                            onChange={(e) => updateRecipeIngredient(idx, 'category', e.target.value)}
                            className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                          >
                            <option value="Wet">Wet</option>
                            <option value="Dry">Dry</option>
                            <option value="Mix-in">Mix-in</option>
                            <option value="Topping">Topping</option>
                            <option value="Rolling">Rolling</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => removeRecipeIngredient(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.displayName}
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
                    Save Recipe
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
