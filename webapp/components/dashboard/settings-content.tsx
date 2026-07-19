'use client'

import { useActionState, useEffect } from 'react'
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea as TextArea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { WarningCircle } from '@phosphor-icons/react'
import { PageHeader } from './page-header'
import { useTranslation } from '@/lib/i18n'
import { updateBusinessAction, requestAccountDeletionAction } from '@/actions/settings-actions'
import type { Organization } from '@/lib/types'
import type { Models } from 'node-appwrite'

interface SettingsContentProps {
  organization: Organization
  user: Models.User<Models.Preferences>
}

export function SettingsContent({ organization, user }: SettingsContentProps) {
  const { t } = useTranslation()

  const [businessState, businessAction, isBusinessPending] = useActionState(
    updateBusinessAction,
    {},
  )

  useEffect(() => {
    if (businessState.success) {
      toast.success(t('saved') as string)
    }
  }, [businessState.success, t])

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader title={t('settings')} />

      {/* Account Settings */}
      <Card>
        <CardHeader className="flex-col items-start">
          <h3 className="text-lg font-semibold">{t('accountSettings')}</h3>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{t('name')}</label>
            <Input value={user.name || ''} disabled />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">{t('email')}</label>
            <Input value={user.email} disabled />
          </div>
          <p className="text-sm text-muted-foreground">
            Account-Daten können derzeit über das Appwrite Dashboard geändert werden.
          </p>
        </CardContent>
      </Card>

      {/* Business Settings */}
      <Card>
        <CardHeader className="flex-col items-start">
          <h3 className="text-lg font-semibold">{t('businessSettings')}</h3>
        </CardHeader>
        <CardContent>
          <form action={businessAction} noValidate className="flex flex-col gap-4">
            <input type="hidden" name="organizationId" value={organization.$id} />
            <input type="hidden" name="existingLogoId" value={organization.logoFileId} />
            <div className="flex flex-col gap-2">
              <label htmlFor="business-name" className="text-sm font-medium">{t('name')}</label>
              <Input
                id="business-name"
                name="name"
                defaultValue={organization.name}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="business-address" className="text-sm font-medium">{t('address')}</label>
              <TextArea
                id="business-address"
                name="address"
                defaultValue={organization.address}
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="business-logo" className="text-sm font-medium">{t('logo')}</label>
              <Input id="business-logo" name="logo" type="file" accept="image/*" />
            </div>
            {businessState.error && (
              <p className="text-sm text-destructive">{businessState.error}</p>
            )}
            <Button type="submit" disabled={isBusinessPending}>
              {t('save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stripe Settings (Placeholder) */}
      <Card>
        <CardHeader className="flex-col items-start">
          <h3 className="text-lg font-semibold">{t('stripeSettings')}</h3>
          <p className="text-sm text-muted-foreground">Stripe Connect</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t('stripeNotConnected')}</Badge>
          </div>
          <Button
            variant="outline"
            onClick={() => toast(t('comingSoon') as string)}
          >
            {t('connectStripe')}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive/50 border">
        <CardHeader className="flex-col items-start">
          <h3 className="text-lg font-semibold text-destructive">{t('deleteAccount')}</h3>
          <p className="text-sm text-muted-foreground">{t('deleteAccountDescription')}</p>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={async () => {
              await requestAccountDeletionAction()
              toast.success('Löschanfrage gesendet.')
            }}
          >
            <WarningCircle className="mr-2" />
            {t('requestDeletion')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
