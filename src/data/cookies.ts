import { Cookie } from '../types'

// Product to Recipe ID mapping:
// - Moonlight Morsels (1) → Recipe 4 (Chocolate Chip)
// - Midnight Obsidian (2) → Recipe 3 (Dark Chocolate Chip)
// - Solar Harvest (3) → Recipe 6 (Oatmeal Raisin)
// - Stardust Sweetness (4) → Recipe 1 (Sugar Cookie)
// - Cinnamon Comet (5) → Recipe 2 (Snickerdoodle)
// - Stellar Citrus (6) → Recipe 5 (Lemon Sugar)

export const PRODUCT_TO_RECIPE: Record<number, number> = {
  1: 4, // Moonlight Morsels → Chocolate Chip
  2: 3, // Midnight Obsidian → Dark Chocolate Chip
  3: 6, // Solar Harvest → Oatmeal Raisin
  4: 1, // Stardust Sweetness → Sugar Cookie
  5: 2, // Cinnamon Comet → Snickerdoodle
  6: 5, // Stellar Citrus → Lemon Sugar
}

export const cookies: Cookie[] = [
  {
    id: 1,
    name: 'Moonlight Morsels',
    description: 'Rich chocolate chip with cocoa undertones and crunchy edges for cosmic adventures',
    price: 3.75,
    flavor: 'Chocolate Chip',
    imageUrl: '/img/midnightmorsels.jpg',
    recipeId: 4,
    nutritionalFacts: {
      calories: 360,
      fat: 20,
      saturatedFat: 12,
      carbohydrates: 44,
      sugars: 28,
      protein: 4,
      fiber: 3,
      sodium: 220,
      allergens: 'Contains: Milk, Eggs, Wheat, Soy',
    },
  },
  {
    id: 2,
    name: 'Midnight Obsidian',
    description: 'Intensely decadent dark chocolate with premium dark chocolate chips and cocoa richness',
    price: 5.00,
    flavor: 'Dark Chocolate Chip · Specialty',
    imageUrl: '/img/midnightobsidian.jpg',
    recipeId: 3,
    nutritionalFacts: {
      calories: 540,
      fat: 28,
      saturatedFat: 16,
      carbohydrates: 58,
      sugars: 34,
      protein: 6,
      fiber: 6.5,
      sodium: 260,
      allergens: 'Contains: Milk, Eggs, Wheat, Soy',
    },
  },
  {
    id: 3,
    name: 'Solar Harvest',
    description: 'Wholesome oatmeal with plump raisins and warm spices for a nourishing treat',
    price: 3.75,
    flavor: 'Oatmeal Raisin',
    imageUrl: '/img/solarharvest.jpg',
    recipeId: 6,
    nutritionalFacts: {
      calories: 380,
      fat: 16,
      saturatedFat: 8,
      carbohydrates: 54,
      sugars: 30,
      protein: 5,
      fiber: 4,
      sodium: 230,
      allergens: 'Contains: Milk, Eggs, Wheat',
    },
  },
  {
    id: 4,
    name: 'Stardust Sweetness',
    description: 'Pure vanilla sugar cookie with delicate, buttery crumb that sparkles like stardust',
    price: 3.75,
    flavor: 'Sugar Cookie',
    imageUrl: '/img/stardustsweetness.png',
    recipeId: 1,
    nutritionalFacts: {
      calories: 315,
      fat: 15.5,
      saturatedFat: 9.5,
      carbohydrates: 45,
      sugars: 27,
      protein: 3.5,
      fiber: 1,
      sodium: 200,
      allergens: 'Contains: Milk, Eggs, Wheat',
    },
  },
  {
    id: 5,
    name: 'Cinnamon Comet',
    description: 'Snickerdoodle with warm cinnamon sugar coating in a meteor shower of spiced flavor',
    price: 3.75,
    flavor: 'Snickerdoodle',
    imageUrl: '/img/cinnamoncomet.jpg',
    recipeId: 2,
    nutritionalFacts: {
      calories: 320,
      fat: 16.5,
      saturatedFat: 10,
      carbohydrates: 44,
      sugars: 28,
      protein: 4,
      fiber: 1,
      sodium: 220,
      allergens: 'Contains: Milk, Eggs, Wheat',
    },
  },
  {
    id: 6,
    name: 'Stellar Citrus',
    description: 'Bright lemon cookie with zesty citrus notes, shining like a distant star',
    price: 4.00,
    flavor: 'Lemon',
    imageUrl: '/img/stellarcitrus.jpg',
    recipeId: 5,
    nutritionalFacts: {
      calories: 340,
      fat: 18,
      saturatedFat: 11,
      carbohydrates: 42,
      sugars: 26,
      protein: 3.5,
      fiber: 1,
      sodium: 210,
      allergens: 'Contains: Milk, Eggs, Wheat',
    },
  },
]

