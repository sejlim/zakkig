import type { CustomizationStep } from './types'

export interface PresetTemplate {
  id: string
  nameDe: string
  nameEn: string
  icon: string
  descriptionDe: string
  descriptionEn: string
  steps: CustomizationStep[]
}

function generateId() {
  return crypto.randomUUID()
}

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'burger',
    nameDe: 'Burger',
    nameEn: 'Burger',
    icon: '🍔',
    descriptionDe: 'Patty-Wahl, Garstufe, Käse-Upgrade, Extra-Toppings & Soße',
    descriptionEn: 'Patty choice, doneness, cheese upgrade, extra toppings & sauce',
    steps: [
      {
        id: generateId(),
        name: 'Patty / Fleisch',

        minSelections: 1,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 0,
        options: [
          { id: generateId(), name: '100% Rindfleisch (150g)', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Double Patty (300g)', extraPrice: 350, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Crispy Chicken', extraPrice: 0, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Plant-Based Veggie Patty', extraPrice: 100, available: true, sortOrder: 3 },
        ],
      },
      {
        id: generateId(),
        name: 'Käse & Extras',

        minSelections: 0,
        maxSelections: 3,
        includedCount: 0,
        sortOrder: 1,
        options: [
          { id: generateId(), name: 'Cheddar Käse', extraPrice: 100, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Crispy Bacon', extraPrice: 150, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Spiegelei', extraPrice: 120, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Jalapeños', extraPrice: 80, available: true, sortOrder: 3 },
        ],
      },
      {
        id: generateId(),
        name: 'Soße',

        minSelections: 1,
        maxSelections: 2,
        includedCount: 1,
        sortOrder: 2,
        options: [
          { id: generateId(), name: 'Haussoße', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Smokey BBQ', extraPrice: 0, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Trüffel Mayo', extraPrice: 100, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Chili Cheese Soße', extraPrice: 80, available: true, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: 'pizza',
    nameDe: 'Pizza',
    nameEn: 'Pizza',
    icon: '🍕',
    descriptionDe: 'Größe, Teig/Boden, Soßenbasis & Extra-Belag',
    descriptionEn: 'Size, crust, sauce base & extra toppings',
    steps: [
      {
        id: generateId(),
        name: 'Größe',

        minSelections: 1,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 0,
        options: [
          { id: generateId(), name: 'Normal (Ø 28cm)', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Familie (Ø 38cm)', extraPrice: 500, available: true, sortOrder: 1 },
        ],
      },
      {
        id: generateId(),
        name: 'Teig & Rand',

        minSelections: 1,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 1,
        options: [
          { id: generateId(), name: 'Klassisch Italienisch (Dünn)', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Käserand (Stuffed Crust)', extraPrice: 250, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Dinkel-Teig', extraPrice: 150, available: true, sortOrder: 2 },
        ],
      },
      {
        id: generateId(),
        name: 'Extra Belag',

        minSelections: 0,
        maxSelections: 5,
        includedCount: 0,
        sortOrder: 2,
        options: [
          { id: generateId(), name: 'Extra Mozzarella', extraPrice: 150, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Salami Picrante', extraPrice: 180, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Frische Champignons', extraPrice: 120, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Parmaschinken & Rucola', extraPrice: 250, available: true, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: 'doener',
    nameDe: 'Döner & Kebab',
    nameEn: 'Kebab & Shawarma',
    icon: '🥙',
    descriptionDe: 'Brot/Dürüm, Fleisch/Veggie, Soßen & Salat-Wünsche',
    descriptionEn: 'Bread/Wrap, meat/veggie, sauces & salad preferences',
    steps: [
      {
        id: generateId(),
        name: 'Brot / Verpackung',

        minSelections: 1,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 0,
        options: [
          { id: generateId(), name: 'Fladenbrot', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Dürüm / Wrap', extraPrice: 50, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Döner-Teller (mit Pommes/Reis)', extraPrice: 350, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Döner-Box', extraPrice: 100, available: true, sortOrder: 3 },
        ],
      },
      {
        id: generateId(),
        name: 'Fleisch / Füllung',

        minSelections: 1,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 1,
        options: [
          { id: generateId(), name: 'Hähnchen-Döner', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Kalb- / Rindfleisch', extraPrice: 50, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Falafel (Veggie)', extraPrice: 0, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Halloumi (Veggie)', extraPrice: 50, available: true, sortOrder: 3 },
        ],
      },
      {
        id: generateId(),
        name: 'Soße',

        minSelections: 1,
        maxSelections: 2,
        includedCount: 1,
        sortOrder: 2,
        options: [
          { id: generateId(), name: 'Knoblauchsoße', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Kräutersoße', extraPrice: 0, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Scharfe Soße 🌶️', extraPrice: 0, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Sesam-Tahini (Vegan)', extraPrice: 0, available: true, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: 'bowl',
    nameDe: 'Bowl & Salat',
    nameEn: 'Bowl & Salad',
    icon: '🥗',
    descriptionDe: 'Basis (Reis/Quinoa/Salat), Proteine, Dressings & Toppings',
    descriptionEn: 'Base (Rice/Quinoa/Salad), proteins, dressings & toppings',
    steps: [
      {
        id: generateId(),
        name: 'Basis wählen',

        minSelections: 1,
        maxSelections: 2,
        includedCount: 1,
        sortOrder: 0,
        options: [
          { id: generateId(), name: 'Sushi Reis', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Quinoa & Linsen', extraPrice: 50, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Wildkräutersalat', extraPrice: 0, available: true, sortOrder: 2 },
        ],
      },
      {
        id: generateId(),
        name: 'Protein / Hauptzutat',

        minSelections: 1,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 1,
        options: [
          { id: generateId(), name: 'Gegrillter Lachs', extraPrice: 250, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Teriyaki Chicken', extraPrice: 150, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Marinierter Tofu (Vegan)', extraPrice: 0, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Avocado & Edamame', extraPrice: 100, available: true, sortOrder: 3 },
        ],
      },
      {
        id: generateId(),
        name: 'Dressing & Crunch',

        minSelections: 1,
        maxSelections: 3,
        includedCount: 2,
        sortOrder: 2,
        options: [
          { id: generateId(), name: 'Sesam-Ingwer Dressing', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Peanut-Lime Dressing', extraPrice: 0, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Röstzwiebeln & Nüsse', extraPrice: 50, available: true, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    id: 'kaffee',
    nameDe: 'Kaffee & Heißgetränke',
    nameEn: 'Coffee & Hot Drinks',
    icon: '☕',
    descriptionDe: 'Größe, Milchalternative (Hafer, Soja), Sirup-Shots & Extra Espresso',
    descriptionEn: 'Size, milk option (Oat, Soy), syrup shots & extra espresso',
    steps: [
      {
        id: generateId(),
        name: 'Größe',

        minSelections: 1,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 0,
        options: [
          { id: generateId(), name: 'Regular (300ml)', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Large (450ml)', extraPrice: 80, available: true, sortOrder: 1 },
        ],
      },
      {
        id: generateId(),
        name: 'Milch-Variante',

        minSelections: 1,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 1,
        options: [
          { id: generateId(), name: 'Vollmilch (3,5%)', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Oatly Hafermilch (Barista)', extraPrice: 50, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Laktosefreie Milch', extraPrice: 40, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Mandelmilch', extraPrice: 50, available: true, sortOrder: 3 },
        ],
      },
      {
        id: generateId(),
        name: 'Extras & Sirup',

        minSelections: 0,
        maxSelections: 2,
        includedCount: 0,
        sortOrder: 2,
        options: [
          { id: generateId(), name: 'Extra Espresso Shot ☕', extraPrice: 100, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Vanille Sirup', extraPrice: 60, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Karamell Sirup', extraPrice: 60, available: true, sortOrder: 2 },
        ],
      },
    ],
  },
  {
    id: 'kuchen',
    nameDe: 'Kuchen & Gebäck',
    nameEn: 'Cake & Pastry',
    icon: '🍰',
    descriptionDe: 'Sahne/Eis-Beilage, Temperatur & Extras',
    descriptionEn: 'Cream/Ice cream side, temperature & extras',
    steps: [
      {
        id: generateId(),
        name: 'Beilage',

        minSelections: 0,
        maxSelections: 2,
        includedCount: 0,
        sortOrder: 0,
        options: [
          { id: generateId(), name: 'Portion Frische Schlagsahne', extraPrice: 100, available: true, sortOrder: 0 },
          { id: generateId(), name: '1 Kugel Vanilleeis', extraPrice: 150, available: true, sortOrder: 1 },
        ],
      },
      {
        id: generateId(),
        name: 'Zubereitung',

        minSelections: 0,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 1,
        options: [
          { id: generateId(), name: 'Kalt servieren', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Warm servieren', extraPrice: 0, available: true, sortOrder: 1 },
        ],
      },
    ],
  },
  {
    id: 'eis',
    nameDe: 'Eis & Dessert',
    nameEn: 'Ice Cream & Dessert',
    icon: '🍦',
    descriptionDe: 'Waffel/Becher, Kugelauswahl, Soße & Toppings',
    descriptionEn: 'Cone/Cup, scoops, sauce & toppings',
    steps: [
      {
        id: generateId(),
        name: 'Servierart',

        minSelections: 1,
        maxSelections: 1,
        includedCount: 1,
        sortOrder: 0,
        options: [
          { id: generateId(), name: 'Waffel', extraPrice: 0, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Umweltfreundlicher Becher', extraPrice: 0, available: true, sortOrder: 1 },
        ],
      },
      {
        id: generateId(),
        name: 'Toppings & Soße',

        minSelections: 0,
        maxSelections: 3,
        includedCount: 0,
        sortOrder: 1,
        options: [
          { id: generateId(), name: 'Schokosoße', extraPrice: 60, available: true, sortOrder: 0 },
          { id: generateId(), name: 'Erdbeersoße', extraPrice: 60, available: true, sortOrder: 1 },
          { id: generateId(), name: 'Bunte Streusel', extraPrice: 50, available: true, sortOrder: 2 },
          { id: generateId(), name: 'Krokant & Nüsse', extraPrice: 80, available: true, sortOrder: 3 },
        ],
      },
    ],
  },
  {
    id: 'custom',
    nameDe: 'Von Grund auf neu',
    nameEn: 'Custom / From Scratch',
    icon: '🛠️',
    descriptionDe: 'Leerer Builder für maßgeschneiderte eigene Kreationen',
    descriptionEn: 'Empty builder for custom tailored creations',
    steps: [],
  },
]
