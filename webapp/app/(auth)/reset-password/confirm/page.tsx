"use client"

import { useActionState, useState, startTransition, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"
import { confirmPasswordResetAction } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useTranslation } from "@/lib/i18n"
import { Eye, EyeSlash, Check, X, FloppyDisk, CircleNotch, ArrowLeft } from "@phosphor-icons/react"
import { toast } from "sonner"

function ResetPasswordConfirmForm() {
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const secret = searchParams.get("secret")
  
  const boundAction = confirmPasswordResetAction.bind(null, userId || "", secret || "")
  const [state, formAction, isPending] = useActionState(boundAction, {})
  
  const { t, locale } = useTranslation()

  useEffect(() => {
    if (state.error) {
      toast.error(t(state.error as any))
    }
    if (state.success) {
      toast.success(locale === 'de' ? 'Passwort erfolgreich geändert' : 'Password successfully changed')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

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
      <>
        <CardHeader className="flex-col items-start gap-1 pt-4">
          <CardTitle className="text-2xl">
            {locale === 'de' ? 'Passwort erfolgreich geändert' : 'Password successfully changed'}
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            {locale === 'de' 
              ? 'Du kannst dich nun mit deinem neuen Passwort anmelden.' 
              : 'You can now sign in with your new password.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-2">
            <Link href="/sign-in" className="w-full">
              <Button type="button" className="w-full gap-2 h-11 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <ArrowLeft className="w-5 h-5" weight="bold" />
                {t('signIn')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader className="flex-col items-start gap-1 pt-4">
        <CardTitle className="text-2xl">
          {locale === 'de' ? 'Passwort zurücksetzen' : 'Reset Password'}
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          {locale === 'de' 
            ? 'Bitte gib dein neues Passwort ein.' 
            : 'Please enter your new password.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">


      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className={`text-sm font-semibold ${fieldErrors.password ? "text-destructive" : ""}`}>
            {locale === 'de' ? 'Neues Passwort' : 'New Password'} <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              className={`h-11 border-primary-foreground/20 placeholder:text-primary-foreground/50 text-primary-foreground pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? <EyeSlash className="w-5 h-5 text-primary-foreground/50" weight="bold" /> : <Eye className="w-5 h-5 text-primary-foreground/50" weight="bold" />}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-1">
            <div className="flex items-start gap-2 text-xs mt-1">
              {passwordValue.length >= 8 ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-destructive shrink-0 mt-0.5" weight="bold" />}
              <span className={passwordValue.length >= 8 ? "text-primary-foreground" : "text-primary-foreground/50"}>{t('passwordReqLength' as any)}</span>
            </div>
            <div className="flex items-start gap-2 text-xs mt-1">
              {/[A-Z]/.test(passwordValue) ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-destructive shrink-0 mt-0.5" weight="bold" />}
              <span className={/[A-Z]/.test(passwordValue) ? "text-primary-foreground" : "text-primary-foreground/50"}>{t('passwordReqUppercase' as any)}</span>
            </div>
            <div className="flex items-start gap-2 text-xs mt-1">
              {/[a-z]/.test(passwordValue) ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-destructive shrink-0 mt-0.5" weight="bold" />}
              <span className={/[a-z]/.test(passwordValue) ? "text-primary-foreground" : "text-primary-foreground/50"}>{t('passwordReqLowercase' as any)}</span>
            </div>
            <div className="flex items-start gap-2 text-xs mt-1">
              {/[0-9]/.test(passwordValue) || /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue) ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-destructive shrink-0 mt-0.5" weight="bold" />}
              <span className={/[0-9]/.test(passwordValue) || /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue) ? "text-primary-foreground leading-tight" : "text-primary-foreground/50 leading-tight"}>{t('passwordReqNumberOrSpecial' as any)}</span>
            </div>
          </div>
          
          {fieldErrors.password && <span className="text-sm text-destructive">{fieldErrors.password}</span>}
        </div>

        <div className="flex flex-col gap-1.5 mt-2">
          <label htmlFor="confirmPassword" className={`text-sm font-semibold ${fieldErrors.confirmPassword ? "text-destructive" : ""}`}>
            {t('confirmPassword')} <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              className={`h-11 border-primary-foreground/20 placeholder:text-primary-foreground/50 text-primary-foreground pr-10 ${fieldErrors.confirmPassword ? "border-destructive" : ""}`}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? t('hidePassword') : t('showPassword')}
            >
              {showConfirmPassword ? <EyeSlash className="w-5 h-5 text-primary-foreground/50" weight="bold" /> : <Eye className="w-5 h-5 text-primary-foreground/50" weight="bold" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && <span className="text-sm text-destructive">{fieldErrors.confirmPassword}</span>}
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full gap-2 mt-4 h-11 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:bg-primary-foreground/20 disabled:text-primary-foreground/50 disabled:opacity-100" 
        disabled={isPending}
      >
        {isPending ? (
          <>
            <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
            {locale === 'de' ? 'Speichern...' : 'Saving...'}
          </>
        ) : (
          <>
            <FloppyDisk className="w-5 h-5" weight="bold" />
            {locale === 'de' ? 'Passwort ändern' : 'Change Password'}
          </>
        )}
        </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pb-6 bg-transparent border-t border-primary-foreground/10">
        <p className="text-sm text-primary-foreground/80">
          {t('rememberedAccount')}{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
          >
            {t('signIn')}
          </Link>
        </p>
      </CardFooter>
    </>
  )
}

export default function ResetPasswordConfirmPage() {
  const { locale } = useTranslation()

  return (
    <Card className="w-full bg-primary text-primary-foreground border-border/5">
      <div className="w-full flex items-center justify-between px-6 pt-6 pb-4 border-b border-primary-foreground/10">
        <Link href={locale === 'en' ? 'https://www.zakkig.de/en' : 'https://www.zakkig.de'} target="_blank" rel="noreferrer">
          <Image
            src="https://www.zakkig.de/full.svg"
            alt="zakkig"
            width={120}
            height={40}
            priority
            className="w-auto h-8 hover:opacity-80 transition-opacity brightness-0 invert"
          />
        </Link>
        <LanguageSwitcher variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" />
      </div>

      <Suspense fallback={<CardContent><div className="h-40 flex items-center justify-center">Loading...</div></CardContent>}>
        <ResetPasswordConfirmForm />
      </Suspense>
    </Card>
  )
}
