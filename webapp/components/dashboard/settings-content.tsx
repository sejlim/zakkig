'use client'

import { useActionState } from 'react'
import { toast, Card, CardHeader, div as CardContent, Button, Input, TextArea, Separator as Separator, Chip as Badge, Alert } from "@heroui/react"
import { WarningCircle } from '@phosphor-icons/react'
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

  if (businessState.success) {
    toast({ title: t('saved'), color: "success" })
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">{t('settings')}</h1>

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
          <form action={businessAction} className="flex flex-col gap-4">
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
              <p className="text-sm text-danger">{businessState.error}</p>
            )}
            <Button type="submit" disabled={isBusinessPending} color="primary">
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
            <Badge color="secondary">{t('stripeNotConnected')}</Badge>
          </div>
          <Button
            variant="bordered"
            onPress={() => toast({ title: t('comingSoon'), color: "default" })}
          >
            {t('connectStripe')}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-danger/50 border">
        <CardHeader className="flex-col items-start">
          <h3 className="text-lg font-semibold text-danger">{t('deleteAccount')}</h3>
          <p className="text-sm text-muted-foreground">{t('deleteAccountDescription')}</p>
        </CardHeader>
        <CardContent>
          <Button
            color="danger"
            onPress={async () => {
              await requestAccountDeletionAction()
              toast({ title: 'Löschanfrage gesendet.', color: "success" })
            }}
          >
            <WarningCircle data-icon="inline-start" />
            {t('requestDeletion')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
