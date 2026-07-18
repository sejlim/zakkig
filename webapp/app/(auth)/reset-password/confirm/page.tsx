"use client"

import { useActionState, useState, startTransition, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"
import { confirmPasswordResetAction } from "@/actions/auth-actions"
import { Button, Card, Input, Separator, InputGroup } from "@heroui/react"
import { useTranslation } from "@/lib/i18n"
import { Eye, EyeSlash, Check, X, FloppyDisk, CircleNotch } from "@phosphor-icons/react"

function ResetPasswordConfirmForm() {
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const secret = searchParams.get("secret")
  
  const boundAction = confirmPasswordResetAction.bind(null, userId || "", secret || "")
  const [state, formAction, isPending] = useActionState(boundAction, {})
  
  const { t, locale } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const errors: Record<string, string> = {}
    
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string
    
    if (!password) {
      errors.password = t('passwordRequired')
    } else {
      const hasLength = password.length >= 8
      const hasUpperCase = /[A-Z]/.test(password)
      const hasLowerCase = /[a-z]/.test(password)
      const hasNumberOrSpecial = /[0-9]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)
      
      if (!hasLength || !hasUpperCase || !hasLowerCase || !hasNumberOrSpecial) {
        errors.password = t('passwordInvalid' as any)
      }
    }
    
    if (password !== confirmPassword) errors.confirmPassword = t('passwordMismatch')

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
    } else {
      setFieldErrors({})
      startTransition(() => {
        formAction(formData as any)
      })
    }
  }

  if (!userId || !secret) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <X className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold">{locale === 'de' ? 'Ungültiger Link' : 'Invalid Link'}</h2>
        <p className="text-muted-foreground mt-2">
          {locale === 'de' 
            ? 'Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.' 
            : 'This password reset link is invalid or has expired.'}
        </p>
        <Button type="button" onClick={() => window.location.href = "/reset-password"} className="mt-6">
          {locale === 'de' ? 'Neuen Link anfordern' : 'Request new link'}
        </Button>
      </div>
    )
  }

  if (state.success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <Check className="w-6 h-6 text-emerald-600" weight="bold" />
        </div>
        <h2 className="text-xl font-semibold">
          {locale === 'de' ? 'Passwort erfolgreich geändert' : 'Password successfully changed'}
        </h2>
        <p className="text-muted-foreground mt-2">
          {locale === 'de' 
            ? 'Du kannst dich nun mit deinem neuen Passwort anmelden.' 
            : 'You can now sign in with your new password.'}
        </p>
        <Button type="button" onClick={() => window.location.href = "/sign-in"} className="mt-6">
          {t('signIn')}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {state.error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t(state.error as any)}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={`text-sm font-medium ${fieldErrors.password ? "text-danger" : ""}`}>
            {locale === 'de' ? 'Neues Passwort' : 'New Password'} <span className="text-danger">*</span>
          </label>
          <InputGroup>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              className={fieldErrors.password ? "border-danger" : ""}
            />
            <InputGroup.Suffix>
              <button
                className="focus:outline-none"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <EyeSlash className="text-2xl text-default-400 pointer-events-none" weight="bold" /> : <Eye className="text-2xl text-default-400 pointer-events-none" weight="bold" />}
              </button>
            </InputGroup.Suffix>
          </InputGroup>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-1">
            <div className="flex items-start gap-2 text-xs mt-1">
              {passwordValue.length >= 8 ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-red-500 shrink-0 mt-0.5" weight="bold" />}
              <span className={passwordValue.length >= 8 ? "text-emerald-700" : "text-muted-foreground"}>{t('passwordReqLength' as any)}</span>
            </div>
            <div className="flex items-start gap-2 text-xs mt-1">
              {/[A-Z]/.test(passwordValue) ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-red-500 shrink-0 mt-0.5" weight="bold" />}
              <span className={/[A-Z]/.test(passwordValue) ? "text-emerald-700" : "text-muted-foreground"}>{t('passwordReqUppercase' as any)}</span>
            </div>
            <div className="flex items-start gap-2 text-xs mt-1">
              {/[a-z]/.test(passwordValue) ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-red-500 shrink-0 mt-0.5" weight="bold" />}
              <span className={/[a-z]/.test(passwordValue) ? "text-emerald-700" : "text-muted-foreground"}>{t('passwordReqLowercase' as any)}</span>
            </div>
            <div className="flex items-start gap-2 text-xs mt-1">
              {/[0-9]/.test(passwordValue) || /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue) ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-red-500 shrink-0 mt-0.5" weight="bold" />}
              <span className={/[0-9]/.test(passwordValue) || /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue) ? "text-emerald-700 leading-tight" : "text-muted-foreground leading-tight"}>{t('passwordReqNumberOrSpecial' as any)}</span>
            </div>
          </div>
          
          {fieldErrors.password && <span className="text-xs text-red-500">{fieldErrors.password}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className={`text-sm font-medium ${fieldErrors.confirmPassword ? "text-danger" : ""}`}>
            {t('confirmPassword')} <span className="text-danger">*</span>
          </label>
          <InputGroup>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              className={fieldErrors.confirmPassword ? "border-danger" : ""}
            />
            <InputGroup.Suffix>
              <button
                className="focus:outline-none"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? t('hidePassword') : t('showPassword')}
              >
                {showConfirmPassword ? <EyeSlash className="text-2xl text-default-400 pointer-events-none" weight="bold" /> : <Eye className="text-2xl text-default-400 pointer-events-none" weight="bold" />}
              </button>
            </InputGroup.Suffix>
          </InputGroup>
          {fieldErrors.confirmPassword && <span className="text-xs text-red-500">{fieldErrors.confirmPassword}</span>}
        </div>
      </div>

      <Button type="submit" className="w-full mt-4 gap-2" isDisabled={isPending}>
        {isPending ? (
          <>
            <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
            {locale === 'de' ? 'Wird geändert...' : 'Changing...'}
          </>
        ) : (
          <>
            <FloppyDisk className="w-5 h-5" weight="bold" />
            {locale === 'de' ? 'Passwort ändern' : 'Change Password'}
          </>
        )}
      </Button>
    </form>
  )
}

export default function ResetPasswordConfirmPage() {
  const { locale } = useTranslation()

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
        <h1 className="text-xl font-semibold">
          {locale === 'de' ? 'Passwort zurücksetzen' : 'Reset Password'}
        </h1>
        <p className="text-sm text-default-500">
          {locale === 'de' 
            ? 'Bitte gib dein neues Passwort ein.' 
            : 'Please enter your new password.'}
        </p>
      </Card.Header>

      <div>
        <Suspense fallback={<div className="h-40 flex items-center justify-center">Loading...</div>}>
          <ResetPasswordConfirmForm />
        </Suspense>
      </div>

      <Separator />

      <Card.Footer className="justify-center mt-6">
        <p className="text-sm text-muted-foreground">
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {locale === 'de' ? 'Zurück zur Anmeldung' : 'Back to sign in'}
          </Link>
        </p>
      </Card.Footer>
    </Card>
  )
}
