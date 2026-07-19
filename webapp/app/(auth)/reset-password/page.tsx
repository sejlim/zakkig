"use client"

import { useActionState, useState, startTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { resetPasswordAction } from "@/actions/auth-actions"
import { useTranslation } from "@/lib/i18n"
import { PaperPlaneRight, CircleNotch } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"


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
    <Card className="w-full border-none shadow-none sm:border-solid sm:shadow-sm">
      <div className="w-full flex items-center justify-between px-6 pt-6 pb-2">
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
      <CardHeader className="flex-col items-start gap-1">
        <CardTitle className="text-2xl">{t('resetPassword')}</CardTitle>
        <CardDescription>
          {t('resetPasswordDescription')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {state.success ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {t('resetPasswordSent')}
            </div>
            <Link href="/sign-in" className="w-full">
              <Button variant="outline" className="w-full h-11">
                {t('backToSignIn')}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {state.error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {t(state.error as any)}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className={`text-sm font-semibold ${fieldErrors.email ? "text-destructive" : ""}`}>{t('email')}</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
                className={`h-11 ${fieldErrors.email ? "border-destructive" : ""}`}
              />
              {fieldErrors.email && <span className="text-sm text-destructive">{fieldErrors.email}</span>}
            </div>

            <Button type="submit" className="w-full gap-2 mt-2 h-11" disabled={isPending}>
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
      </CardContent>

      {!state.success && (
        <>
          <CardFooter className="justify-center pb-6">
            <p className="text-sm text-muted-foreground">
              {t('rememberedAccount')}{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {t('signIn')}
              </Link>
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
