'use client'

import { useActionState, useEffect } from 'react'
import { toast, Card, Button, Input, TextArea, Separator, Chip as Badge, Alert } from "@heroui/react"
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
        <Card.Header className="flex-col items-start">
          <h3 className="text-lg font-semibold">{t('accountSettings')}</h3>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
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
        </Card.Content>
      </Card>

      {/* Business Settings */}
      <Card>
        <Card.Header className="flex-col items-start">
          <h3 className="text-lg font-semibold">{t('businessSettings')}</h3>
        </Card.Header>
        <Card.Content>
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
            <Button type="submit" isDisabled={isBusinessPending} variant="primary">
              {t('save')}
            </Button>
          </form>
        </Card.Content>
      </Card>

      {/* Stripe Settings (Placeholder) */}
      <Card>
        <Card.Header className="flex-col items-start">
          <h3 className="text-lg font-semibold">{t('stripeSettings')}</h3>
          <p className="text-sm text-muted-foreground">Stripe Connect</p>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="soft">{t('stripeNotConnected')}</Badge>
          </div>
          <Button
            variant="outline"
            onPress={() => toast(t('comingSoon') as string)}
          >
            {t('connectStripe')}
          </Button>
        </Card.Content>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-danger/50 border">
        <Card.Header className="flex-col items-start">
          <h3 className="text-lg font-semibold text-danger">{t('deleteAccount')}</h3>
          <p className="text-sm text-muted-foreground">{t('deleteAccountDescription')}</p>
        </Card.Header>
        <Card.Content>
          <Button
            variant="danger"
            onPress={async () => {
              await requestAccountDeletionAction()
              toast.success('Löschanfrage gesendet.')
            }}
          >
            <WarningCircle data-icon="inline-start" />
            {t('requestDeletion')}
          </Button>
        </Card.Content>
      </Card>
    </div>
  )
}
