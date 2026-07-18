'use client'

import { Button } from "@heroui/react"
import { SignOut } from '@phosphor-icons/react'
import { signOutAction } from '@/actions/auth-actions'
import { useTranslation } from '@/lib/i18n'

export function SignOutButton() {
  const { t } = useTranslation()
  
  return (
    <form action={signOutAction}>
      <Button variant="tertiary" size="sm" type="submit">
        <SignOut weight="bold" className="mr-2" />
        {t('signOut')}
      </Button>
    </form>
  )
}
