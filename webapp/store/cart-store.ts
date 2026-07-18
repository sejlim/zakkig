'use client'

import { create } from 'zustand'
import type { CartItem } from '@/lib/types'

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (menuItemId: string) => void
  updateQuantity: (menuItemId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.menuItemId === item.menuItemId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItemId === item.menuItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity: 1 }] }
    }),

  removeItem: (menuItemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.menuItemId !== menuItemId),
    })),

  updateQuantity: (menuItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.menuItemId !== menuItemId) }
      }
      return {
        items: state.items.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i,
        ),
      }
    }),

  clearCart: () => set({ items: [] }),

  total: () => {
    const { items } = get()
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  itemCount: () => {
    const { items } = get()
    return items.reduce((sum, item) => sum + item.quantity, 0)
  },
}))
