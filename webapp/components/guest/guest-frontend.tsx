'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, ShoppingCart, ForkKnife } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useTranslation, formatPrice } from '@/lib/i18n'
import { getImagePreviewUrl } from '@/lib/appwrite/client'
import { useCartStore } from '@/store/cart-store'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CartSheet } from '@/components/guest/cart-sheet'
import { OrderTracker } from '@/components/guest/order-tracker'
import { LanguageSwitcher } from '@/components/language-switcher'
import Image from 'next/image'
import type { Organization, MenuCategory, MenuItem, Order } from '@/lib/types'

interface GuestFrontendProps {
  organization: Organization
  categories: MenuCategory[]
  items: MenuItem[]
  type: 'dine-in' | 'takeaway'
  tableNumber?: string
  orderId?: string
  initialOrder?: Order | null
}

export function GuestFrontend({ organization, categories, items, type, tableNumber, orderId, initialOrder }: GuestFrontendProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'menu' | 'cart'>('menu')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  
  // Zustand store
  const { items: cartItems, addItem, removeItem, updateQuantity, total, itemCount } = useCartStore()

  // Dine-in order success state (does not use OrderTracker)
  const [dineInSuccess, setDineInSuccess] = useState<{ orderNumber: string } | null>(null)

  if (orderId && type === 'takeaway') {
    return <OrderTracker orderId={orderId} organization={organization} initialOrder={initialOrder} />
  }

  if (dineInSuccess && type === 'dine-in') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6">
        <div className="h-24 w-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">{t('orderPlaced')}</h1>
        <div>
          <p className="text-muted-foreground mb-2">{t('yourOrderNumber')}</p>
          <div className="text-5xl font-mono font-bold tracking-tighter">{dineInSuccess.orderNumber}</div>
        </div>
        <div className="bg-muted p-4 rounded-lg w-full max-w-sm mt-8">
          <p className="font-medium">{t('waitAtTable')}</p>
        </div>
        <Button variant="outline" className="mt-8" onClick={() => {
          setDineInSuccess(null);
          useCartStore.getState().clearCart();
        }}>
          Neue Bestellung
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/10 pb-20">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between">
        <div className="w-10" /> {/* Spacer for centering */}
        <div className="text-center flex-1">
          <h1 className="text-lg font-bold">{organization.name}</h1>
          {type === 'dine-in' && tableNumber && (
            <p className="text-sm text-muted-foreground">{t('table')} {tableNumber}</p>
          )}
        </div>
        <LanguageSwitcher className="w-10 h-10 -mr-2" />
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
        {activeTab === 'menu' ? (
          <div className="space-y-8">
            {categories.map(category => {
              const categoryItems = items.filter(i => i.categoryId === category.$id)
              if (categoryItems.length === 0) return null
              
              return (
                <div key={category.$id} className="space-y-4">
                  <h2 className="text-xl font-semibold sticky top-16 bg-muted/10 py-2 backdrop-blur-sm z-10">
                    {category.name}
                  </h2>
                  <div className="space-y-4">
                    {categoryItems.map(item => {
                      const cartItem = cartItems.find(i => i.menuItemId === item.$id)
                      const quantity = cartItem?.quantity || 0

                      return (
                        <Card key={item.$id} className="overflow-hidden shadow-sm">
                          <div className="flex">
                            <div className="flex-1 p-4 flex flex-col justify-between">
                              <div>
                                <h3 className="font-medium text-lg leading-tight">{item.name}</h3>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <div className="mt-4 flex items-end justify-between">
                                <div className="flex flex-col">
                                  <span className="font-medium">{formatPrice(item.price)}</span>
                                  <span className="text-[10px] text-muted-foreground">{t('priceWithTax')}</span>
                                </div>
                                {quantity > 0 ? (
                                  <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                                    <button 
                                      type="button"
                                      aria-label={t('removeFromCart')}
                                      className="w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-sm text-foreground"
                                      onClick={() => updateQuantity(item.$id, quantity - 1)}
                                    >
                                      <Minus weight="bold" />
                                    </button>
                                    <span className="font-medium w-4 text-center">{quantity}</span>
                                    <button 
                                      type="button"
                                      aria-label={t('addToCart')}
                                      className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                                      onClick={() => updateQuantity(item.$id, quantity + 1)}
                                    >
                                      <Plus weight="bold" />
                                    </button>
                                  </div>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    className="rounded-full px-4"
                                    onClick={() => addItem({ menuItemId: item.$id, name: item.name, price: item.price })}
                                  >
                                    <Plus weight="bold" className="mr-1" /> {t('addToCart')}
                                  </Button>
                                )}
                              </div>
                            </div>
                            {item.imageId && (
                              <div className="w-28 sm:w-36 relative shrink-0">
                                <Image 
                                  src={getImagePreviewUrl(item.imageId)} 
                                  alt={item.name} 
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 112px, 144px"
                                />
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('cart')}</h2>
            
            {cartItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>{t('emptyCart')}</p>
                <Button className="mt-6" variant="outline" onClick={() => setActiveTab('menu')}>
                  {t('menuTab')}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.menuItemId} className="flex justify-between items-center bg-background p-4 rounded-lg shadow-sm border">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-muted-foreground text-sm">{formatPrice(item.price)}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                        <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                          <button 
                            type="button"
                            aria-label={t('removeFromCart')}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-sm text-foreground"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                          >
                            <Minus weight="bold" />
                          </button>
                          <span className="font-medium w-4 text-center">{item.quantity}</span>
                          <button 
                            type="button"
                            aria-label={t('addToCart')}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                          >
                            <Plus weight="bold" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>{t('orderTotal')}</span>
                  <span>{formatPrice(total())}</span>
                </div>
                
                <Button 
                  className="w-full text-lg py-6" 
                  size="lg"
                  onClick={() => setCheckoutOpen(true)}
                >
                  {t('checkout')}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t pb-safe">
        <div className="flex max-w-md mx-auto">
          <button 
            type="button"
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 ${activeTab === 'menu' ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('menu')}
          >
            <ForkKnife weight={activeTab === 'menu' ? 'fill' : 'regular'} className="h-6 w-6" />
            <span className="text-xs font-medium">{t('menuTab')}</span>
          </button>
          <button 
            type="button"
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 relative ${activeTab === 'cart' ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('cart')}
          >
            <ShoppingCart weight={activeTab === 'cart' ? 'fill' : 'regular'} className="h-6 w-6" />
            <span className="text-xs font-medium">{t('cartTab')}</span>
            {itemCount() > 0 && (
              <Badge variant="secondary" className="absolute top-1 right-[20%] sm:right-[30%] px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center">
                {itemCount()}
              </Badge>
            )}
          </button>
        </div>
      </div>

      <CartSheet 
        open={checkoutOpen} 
        onOpenChange={setCheckoutOpen} 
        organization={organization}
        type={type}
        tableNumber={tableNumber}
        onOrderSuccess={(orderId, orderNumber) => {
          setCheckoutOpen(false)
          useCartStore.getState().clearCart()
          if (type === 'takeaway') {
            router.push(`/to-go/${organization.$id}?order=${orderId}`)
          } else {
            setDineInSuccess({ orderNumber })
          }
        }}
      />
    </div>
  )
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 256 256" {...props}>
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
    </svg>
  )
}
