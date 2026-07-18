"use client"

import { useActionState, useState, startTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { resetPasswordAction } from "@/actions/auth-actions"
import { useTranslation } from "@/lib/i18n"
import { PaperPlaneRight, CircleNotch } from "@phosphor-icons/react"
import { Button, Card, Input, Separator } from "@heroui/react"

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    {},
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { t, locale } = useTranslation()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    const errors: Record<string, string> = {}
    if (!email) {
      errors.email = t('emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('emailInvalid')
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    startTransition(() => {
      formAction(formData)
    })
  }

  return (
    <Card className="w-full">
      <div className="w-full flex items-center justify-between px-6 py-4">
        <Link href={locale === 'en' ? 'https://www.zakkig.de/en' : 'https://www.zakkig.de'} target="_blank" rel="noreferrer">
          <Image
            src="https://www.zakkig.de/full.svg"
            alt="zakkig"
            width={120}
            height={40}
            priority
            className="w-auto h-8 hover:opacity-80 transition-opacity"
          />
        </Link>
        <LanguageSwitcher />
      </div>
      <Separator />
      <Card.Header className="flex-col items-start gap-1">
        <h1 className="text-xl font-semibold">{t('resetPassword')}</h1>
        <p className="text-sm text-default-500">
          {t('resetPasswordDescription')}
        </p>
      </Card.Header>

      <div>
        {state.success ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {t('resetPasswordSent')}
            </div>
            <Link href="/sign-in" className="w-full">
              <Button variant="outline" className="w-full">
                {t('backToSignIn')}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {state.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {t(state.error as any)}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className={`text-sm font-medium ${fieldErrors.email ? "text-danger" : ""}`}>{t('email')}</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                className={fieldErrors.email ? "border-danger" : ""}
              />
              {fieldErrors.email && <span className="text-xs text-danger">{fieldErrors.email}</span>}
            </div>

            <Button type="submit" className="w-full gap-2" isDisabled={isPending}>
              {isPending ? (
                <>
                  <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                  {t('sendingResetLink')}
                </>
              ) : (
                <>
                  <PaperPlaneRight className="w-5 h-5" weight="bold" />
                  {t('sendLink')}
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      {!state.success && (
        <>
          <Separator />
          <Card.Footer className="justify-center">
            <p className="text-sm text-muted-foreground">
              {t('hasAccount')}{" "}
              <Link
                href="/sign-in"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t('signIn')}
              </Link>
            </p>
          </Card.Footer>
        </>
      )}
    </Card>
  )
}
