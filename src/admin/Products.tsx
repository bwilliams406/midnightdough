import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Save, Loader2, DollarSign, Percent, Tag, Image } from 'lucide-react'
import { Product, DiscountTier, Recipe } from '../types/admin'
import { 
  subscribeToProducts, 
  subscribeToDiscountTiers,
  subscribeToRecipes,
  saveProduct, 
  saveDiscountTier,
  deleteProduct as deleteProductFromDb,
  deleteDiscountTier as deleteDiscountTierFromDb,
  getNextId 
} from '../lib/storage'

type ActiveTab = 'products' | 'discounts'

export function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('products')
  
  // Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    price: 0,
    flavor: '',
    imageUrl: '',
    recipeId: undefined,
    isActive: true,
    nutritionalFacts: {
      calories: 0, fat: 0, saturatedFat: 0, carbohydrates: 0,
      sugars: 0, protein: 0, fiber: 0, sodium: 0, allergens: ''
    }
  })

  // Discount Modal
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<DiscountTier | null>(null)
  const [discountForm, setDiscountForm] = useState<Omit<DiscountTier, 'id'>>({
    threshold: 0,
    discount: 0,
    label: '',
    isActive: true
  })

  useEffect(() => {
    let loadedCount = 0
    const checkLoaded = () => {
      loadedCount++
      if (loadedCount >= 3) setLoading(false)
    }

    const unsubProducts = subscribeToProducts((data) => {
      setProducts(data)
      checkLoaded()
    })
    const unsubDiscounts = subscribeToDiscountTiers((data) => {
      setDiscountTiers(data)
      checkLoaded()
    })
    const unsubRecipes = subscribeToRecipes((data) => {
      setRecipes(data)
      checkLoaded()
    })

    return () => {
      unsubProducts()
      unsubDiscounts()
      unsubRecipes()
    }
  }, [])

  // Product handlers
  const openAddProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '', description: '', price: 0, flavor: '', imageUrl: '',
      recipeId: undefined, isActive: true,
      nutritionalFacts: { calories: 0, fat: 0, saturatedFat: 0, carbohydrates: 0, sugars: 0, protein: 0, fiber: 0, sodium: 0, allergens: '' }
    })
    setIsProductModalOpen(true)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      flavor: product.flavor,
      imageUrl: product.imageUrl,
      recipeId: product.recipeId,
      isActive: product.isActive,
      nutritionalFacts: { ...product.nutritionalFacts }
    })
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = async () => {
    setSaving(true)
    try {
      if (editingProduct) {
        await saveProduct({ id: editingProduct.id, ...productForm })
      } else {
        const newId = await getNextId('products')
        await saveProduct({ id: newId, ...productForm })
      }
      setIsProductModalOpen(false)
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error saving product.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (confirm('Delete this product?')) {
      await deleteProductFromDb(id)
    }
  }

  // Discount handlers
  const openAddDiscount = () => {
    setEditingDiscount(null)
    setDiscountForm({ threshold: 0, discount: 0, label: '', isActive: true })
    setIsDiscountModalOpen(true)
  }

  const openEditDiscount = (tier: DiscountTier) => {
    setEditingDiscount(tier)
    setDiscountForm({
      threshold: tier.threshold,
      discount: tier.discount,
      label: tier.label,
      isActive: tier.isActive
    })
    setIsDiscountModalOpen(true)
  }

  const handleSaveDiscount = async () => {
    setSaving(true)
    try {
      if (editingDiscount) {
        await saveDiscountTier({ id: editingDiscount.id, ...discountForm })
      } else {
        const newId = await getNextId('discountTiers')
        await saveDiscountTier({ id: newId, ...discountForm })
      }
      setIsDiscountModalOpen(false)
    } catch (error) {
      console.error('Error saving discount:', error)
      alert('Error saving discount.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDiscount = async (id: number) => {
    if (confirm('Delete this discount tier?')) {
      await deleteDiscountTierFromDb(id)
    }
  }

  const toggleProductActive = async (product: Product) => {
    await saveProduct({ ...product, isActive: !product.isActive })
  }

  const toggleDiscountActive = async (tier: DiscountTier) => {
    await saveDiscountTier({ ...tier, isActive: !tier.isActive })
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
          <h1 className="text-3xl font-bold text-midnight">Products & Pricing</h1>
          <p className="text-gray-600 mt-1">Manage products, prices, and volume discounts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-md font-medium transition flex items-center gap-2 ${
            activeTab === 'products' ? 'bg-white text-midnight shadow-sm' : 'text-gray-600 hover:text-midnight'
          }`}
        >
          <Tag size={16} />
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('discounts')}
          className={`px-4 py-2 rounded-md font-medium transition flex items-center gap-2 ${
            activeTab === 'discounts' ? 'bg-white text-midnight shadow-sm' : 'text-gray-600 hover:text-midnight'
          }`}
        >
          <Percent size={16} />
          Volume Discounts ({discountTiers.length})
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={openAddProduct}
              className="flex items-center gap-2 bg-gold text-midnight px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              <Plus size={20} />
              Add Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              const linkedRecipe = recipes.find(r => r.id === product.recipeId)
              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    product.isActive ? 'border-gray-100' : 'border-red-200 opacity-60'
                  }`}
                >
                  {/* Image */}
                  <div className="h-32 bg-gray-100 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Image className="text-gray-300" size={48} />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-midnight">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.flavor}</p>
                      </div>
                      <span className="text-xl font-bold text-green-600">${product.price.toFixed(2)}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    
                    {linkedRecipe && (
                      <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block mb-3">
                        Linked: {linkedRecipe.displayName}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <button
                        onClick={() => toggleProductActive(product)}
                        className={`text-xs px-2 py-1 rounded ${
                          product.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditProduct(product)}
                          className="p-2 text-gray-500 hover:text-midnight hover:bg-gray-100 rounded-lg"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Discounts Tab */}
      {activeTab === 'discounts' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">
              Volume discounts apply automatically when customers order at or above the threshold quantity.
            </p>
            <button
              onClick={openAddDiscount}
              className="flex items-center gap-2 bg-gold text-midnight px-4 py-2 rounded-lg font-semibold hover:bg-yellow-400 transition"
            >
              <Plus size={20} />
              Add Discount Tier
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Quantity Threshold</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Discount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Label</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Example</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discountTiers.map((tier) => {
                  const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length || 4
                  const discountedPrice = avgPrice * (1 - tier.discount)
                  
                  return (
                    <tr key={tier.id} className={`border-b border-gray-50 ${!tier.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className="text-2xl font-bold text-midnight">{tier.threshold}+</span>
                        <span className="text-gray-500 ml-2">cookies</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xl font-bold text-green-600">{(tier.discount * 100).toFixed(0)}%</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-midnight">{tier.label}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleDiscountActive(tier)}
                          className={`text-xs px-2 py-1 rounded ${
                            tier.isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tier.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        ${avgPrice.toFixed(2)} → ${discountedPrice.toFixed(2)}/cookie
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditDiscount(tier)}
                            className="p-2 text-gray-500 hover:text-midnight hover:bg-gray-100 rounded-lg"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDiscount(tier.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Discount Preview */}
          <div className="mt-6 bg-gradient-to-r from-midnight to-gray-800 rounded-xl p-6 text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={20} />
              Discount Preview (Avg ${(products.reduce((sum, p) => sum + p.price, 0) / products.length || 4).toFixed(2)}/cookie)
            </h3>
            <div className="flex flex-wrap gap-3">
              {discountTiers.filter(t => t.isActive).map((tier) => {
                const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length || 4
                const total = tier.threshold * avgPrice * (1 - tier.discount)
                return (
                  <div key={tier.id} className="bg-white/10 rounded-lg p-3 text-center">
                    <p className="text-gold font-bold">{tier.threshold} cookies</p>
                    <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                    <p className="text-xs text-white/60">{tier.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-midnight">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Moonlight Morsels"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flavor/Type</label>
                  <input
                    type="text"
                    value={productForm.flavor}
                    onChange={(e) => setProductForm({ ...productForm, flavor: e.target.value })}
                    placeholder="e.g. Chocolate Chip"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link to Recipe</label>
                  <select
                    value={productForm.recipeId || ''}
                    onChange={(e) => setProductForm({ ...productForm, recipeId: Number(e.target.value) || undefined })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  >
                    <option value="">No linked recipe</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  placeholder="/img/cookie.jpg"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                />
              </div>

              {/* Nutritional Facts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nutritional Facts</label>
                <div className="grid grid-cols-4 gap-3">
                  {['calories', 'fat', 'carbohydrates', 'protein', 'sugars', 'fiber', 'sodium', 'saturatedFat'].map((field) => (
                    <div key={field}>
                      <label className="block text-xs text-gray-500 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                      <input
                        type="number"
                        value={(productForm.nutritionalFacts as unknown as Record<string, number>)[field] || 0}
                        onChange={(e) => setProductForm({
                          ...productForm,
                          nutritionalFacts: {
                            ...productForm.nutritionalFacts,
                            [field]: Number(e.target.value)
                          }
                        })}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <label className="block text-xs text-gray-500">Allergens</label>
                  <input
                    type="text"
                    value={productForm.nutritionalFacts.allergens}
                    onChange={(e) => setProductForm({
                      ...productForm,
                      nutritionalFacts: { ...productForm.nutritionalFacts, allergens: e.target.value }
                    })}
                    placeholder="Contains: Milk, Eggs, Wheat"
                    className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={productForm.isActive}
                  onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">Product is active and visible in store</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={saving || !productForm.name}
                className="flex-1 px-4 py-2 bg-gold text-midnight rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-midnight">
                {editingDiscount ? 'Edit Discount' : 'Add Discount Tier'}
              </h2>
              <button onClick={() => setIsDiscountModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Threshold</label>
                <input
                  type="number"
                  value={discountForm.threshold}
                  onChange={(e) => setDiscountForm({ ...discountForm, threshold: Number(e.target.value) })}
                  placeholder="e.g. 12"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                />
                <p className="text-xs text-gray-500 mt-1">Discount applies when ordering this many or more</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={discountForm.discount * 100}
                    onChange={(e) => setDiscountForm({ ...discountForm, discount: Number(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                  />
                  <span className="text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Label</label>
                <input
                  type="text"
                  value={discountForm.label}
                  onChange={(e) => setDiscountForm({ ...discountForm, label: e.target.value })}
                  placeholder="e.g. 10% off (Dozen)"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="discountActive"
                  checked={discountForm.isActive}
                  onChange={(e) => setDiscountForm({ ...discountForm, isActive: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="discountActive" className="text-sm text-gray-700">Discount tier is active</label>
              </div>

              {discountForm.threshold > 0 && discountForm.discount > 0 && (
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Preview: Order {discountForm.threshold}+ cookies</p>
                  <p className="text-2xl font-bold text-green-600">Save {(discountForm.discount * 100).toFixed(0)}%</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDiscount}
                disabled={saving || discountForm.threshold <= 0}
                className="flex-1 px-4 py-2 bg-gold text-midnight rounded-lg font-semibold hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Discount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

