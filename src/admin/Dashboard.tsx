import { useState, useEffect } from 'react'
import { Package, BookOpen, DollarSign, Loader2, RotateCcw, Tag } from 'lucide-react'
import { Ingredient, Recipe, Product } from '../types/admin'
import { subscribeToIngredients, subscribeToRecipes, subscribeToProducts, resetToDefaults } from '../lib/storage'

export function Dashboard() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    if (confirm('This will reset ALL recipes and ingredients to the original defaults. Are you sure?')) {
      setResetting(true)
      try {
        await resetToDefaults()
        alert('Data reset to defaults!')
      } catch (error) {
        console.error('Error resetting:', error)
        alert('Error resetting data. Check console.')
      } finally {
        setResetting(false)
      }
    }
  }

  useEffect(() => {
    let loadedCount = 0
    const checkLoaded = () => {
      loadedCount++
      if (loadedCount >= 3) setLoading(false)
    }

    const unsubIngredients = subscribeToIngredients((data) => {
      setIngredients(data)
      checkLoaded()
    })
    const unsubRecipes = subscribeToRecipes((data) => {
      setRecipes(data)
      checkLoaded()
    })
    const unsubProducts = subscribeToProducts((data) => {
      setProducts(data)
      checkLoaded()
    })

    return () => {
      unsubIngredients()
      unsubRecipes()
      unsubProducts()
    }
  }, [])

  // Calculate total inventory value from actual stock values
  const totalInventoryValue = ingredients.reduce(
    (sum, ing) => sum + (ing.stockValue ?? 0),
    0
  )

  const activeProducts = products.filter(p => p.isActive)
  
  const stats = [
    {
      label: 'Active Products',
      value: `${activeProducts.length}/${products.length}`,
      icon: Tag,
      color: 'bg-orange-500',
    },
    {
      label: 'Total Ingredients',
      value: ingredients.length,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Recipes',
      value: recipes.length,
      icon: BookOpen,
      color: 'bg-green-500',
    },
    {
      label: 'Inventory Value',
      value: `$${totalInventoryValue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-gold',
    },
  ]

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
          <h1 className="text-3xl font-bold text-midnight">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to the Midnight Dough admin portal • Data synced to Firebase
          </p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
        >
          <RotateCcw size={18} className={resetting ? 'animate-spin' : ''} />
          {resetting ? 'Resetting...' : 'Reset to Defaults'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-midnight">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Recipes */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-midnight mb-4">Recipes</h2>
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-midnight">{recipe.displayName}</p>
                  <p className="text-sm text-gray-500">{recipe.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-midnight">
                    {recipe.baseYield} cookies
                  </p>
                  <p className="text-xs text-gray-500">{recipe.baseCookieSize}g each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ingredient Categories with Values */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-midnight mb-4">
            Inventory by Category
          </h2>
          <div className="space-y-3">
            {[...new Set(ingredients.map((i) => i.category))].map((category) => {
              const categoryIngredients = ingredients.filter(
                (i) => i.category === category
              )
              const categoryValue = categoryIngredients.reduce(
                (sum, ing) => sum + (ing.stockValue ?? 0), 0
              )
              return (
                <div
                  key={category}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-midnight">{category}</p>
                    <p className="text-xs text-gray-500">{categoryIngredients.length} items</p>
                  </div>
                  <span className="font-bold text-green-600">
                    ${categoryValue.toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
