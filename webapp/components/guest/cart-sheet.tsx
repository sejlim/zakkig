'use client'

import { useState, useTransition } from 'react'
import { AppleLogo, CreditCard, GoogleLogo, CircleNotch } from '@phosphor-icons/react'
import { useTranslation, formatPrice } from '@/lib/i18n'
import { useCartStore } from '@/store/cart-store'
import { placeOrderAction } from '@/actions/order-actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Organization } from '@/lib/types'

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization
  type: 'dine-in' | 'takeaway'
  tableNumber?: string
  onOrderSuccess: (orderId: string, orderNumber: string) => void
}

export function CartSheet({ open, onOpenChange, organization, type, tableNumber, onOrderSuccess }: CartSheetProps) {
  const { t } = useTranslation()
  const { items, total } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<string>('apple-pay')
  const [isPending, startTransition] = useTransition()
  
  async function onSubmit(formData: FormData) {
    const email = formData.get('email') as string
    
    if (!email) {
      toast.error(t('error'))
      return
    }

    formData.append('organizationId', organization.$id)
    formData.append('type', type)
    if (tableNumber) formData.append('tableNumber', tableNumber)
    formData.append('items', JSON.stringify(items))
    formData.append('total', total().toString())

    startTransition(async () => {
      const result = await placeOrderAction({}, formData)
      
      if (result.success && result.orderId && result.orderNumber) {
        onOrderSuccess(result.orderId, result.orderNumber)
      } else {
        toast.error(result.error || t('error'))
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] sm:h-auto rounded-t-xl px-4 sm:max-w-md mx-auto">
        <SheetHeader className="text-left mb-6">
          <SheetTitle>{t('checkout')}</SheetTitle>
          <div className="text-sm text-muted-foreground mt-2">
            {t('orderTotal')}: <span className="font-bold text-foreground">{formatPrice(total())}</span>
          </div>
        </SheetHeader>

        <div className="p-0">
          <form action={onSubmit} noValidate className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)] pb-8 px-1">
            <div className="space-y-3">
              <Label>{t('paymentMethod')}</Label>
              <div className="flex flex-wrap gap-2 w-full">
                <Button 
                  type="button" 
                  variant={paymentMethod === 'apple-pay' ? 'default' : 'outline'} 
                  onClick={() => setPaymentMethod('apple-pay')} 
                  className="flex-1 h-12"
                >
                  <AppleLogo weight="fill" className="mr-2 h-5 w-5" /> Apple Pay
                </Button>
                <Button 
                  type="button" 
                  variant={paymentMethod === 'google-pay' ? 'default' : 'outline'} 
                  onClick={() => setPaymentMethod('google-pay')} 
                  className="flex-1 h-12"
                >
                  <GoogleLogo weight="bold" className="mr-2 h-5 w-5" /> Google Pay
                </Button>
                <Button 
                  type="button" 
                  variant={paymentMethod === 'card' ? 'default' : 'outline'} 
                  onClick={() => setPaymentMethod('card')} 
                  className="flex-1 h-12"
                >
                  <CreditCard className="mr-2 h-5 w-5" /> {t('card')}
                </Button>
              </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Testmodus: Zahlung wird simuliert.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('emailForReceipt')}</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="name@beispiel.de" 
                  required 
                />
              </div>

              <Separator />

              <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                <p><strong>{t('buyingFrom')}</strong> {organization.name}</p>
              </div>

              <Button type="submit" className="w-full h-14 text-lg" disabled={isPending}>
                {isPending && <CircleNotch className="mr-2 h-5 w-5 animate-spin" />}
                {isPending ? t('loading') : t('placeOrder')}
              </Button>
              
              <p className="text-center text-muted-foreground text-xs leading-relaxed mt-2">
                {t('paymentDisclaimer')} {t('agreeToTerms')}
              </p>
            </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
