'use client'

import { useState, useTransition } from 'react'
import { AppleLogo, CreditCard, GoogleLogo } from '@phosphor-icons/react'
import { useTranslation, formatPrice } from '@/lib/i18n'
import { useCartStore } from '@/store/cart-store'
import { placeOrderAction } from '@/actions/order-actions'
import { 
  Drawer,
  Button,
  Input,
  Label,
  ToggleButtonGroup,
  ToggleButton,
  Separator,
  toast
} from '@heroui/react'
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
      toast.danger(t('error'))
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
        toast.danger(result.error || t('error'))
      }
    })
  }

  return (
    <Drawer.Backdrop isOpen={open} onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom" className="h-[90vh] sm:h-auto rounded-t-xl px-4 sm:max-w-md mx-auto">
        <Drawer.Dialog>
          <Drawer.Header className="text-left mb-6">
            <Drawer.Heading>{t('checkout')}</Drawer.Heading>
            <div className="text-sm text-muted-foreground mt-2">
              {t('orderTotal')}: <span className="font-bold text-foreground">{formatPrice(total())}</span>
            </div>
          </Drawer.Header>

          <Drawer.Body className="p-0">
            <form action={onSubmit} className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)] pb-8 px-1">
              <div className="space-y-3">
                <Label>{t('paymentMethod')}</Label>
                <ToggleButtonGroup 
                  selectionMode="single"
                  selectedKeys={new Set([paymentMethod])} 
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    if (selected) setPaymentMethod(selected);
                  }}
                  className="justify-start flex-wrap gap-2 w-full"
                >
                  <ToggleButton id="apple-pay" className="flex-1 h-12" aria-label="Apple Pay">
                    <AppleLogo weight="fill" className="mr-2 h-5 w-5" /> Apple Pay
                  </ToggleButton>
                  <ToggleButton id="google-pay" className="flex-1 h-12" aria-label="Google Pay">
                    <GoogleLogo weight="bold" className="mr-2 h-5 w-5" /> Google Pay
                  </ToggleButton>
                  <ToggleButton id="card" className="flex-1 h-12" aria-label="Card">
                    <CreditCard className="mr-2 h-5 w-5" /> {t('card')}
                  </ToggleButton>
                </ToggleButtonGroup>
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

              <Button type="submit" className="w-full h-14 text-lg" isPending={isPending} variant="primary">
                {isPending ? t('loading') : t('placeOrder')}
              </Button>
              
              <p className="text-center text-muted-foreground text-xs leading-relaxed mt-2">
                {t('paymentDisclaimer')} {t('agreeToTerms')}
              </p>
            </form>
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
