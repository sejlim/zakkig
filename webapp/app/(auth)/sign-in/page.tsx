"use client"

import { useActionState, useState, startTransition, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { signInAction, verifyOtpAction, resendOtpAction } from "@/actions/auth-actions"
import { Button, Card, Input, Separator, InputOTP, InputGroup } from "@heroui/react"
import { useTranslation } from "@/lib/i18n"
import { Eye, EyeSlash, SignIn, CheckCircle, CircleNotch, PaperPlaneRight } from "@phosphor-icons/react"

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInAction, {})
  const { t, locale } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  
  // OTP State
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (state.requiresOtp && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [state.requiresOtp, countdown])

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const errors: Record<string, string> = {}
    
    if (!formData.get("email")) {
      errors.email = t('emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.get("email") as string)) {
      errors.email = t('emailInvalid')
    }
    
    if (!formData.get("password")) {
      errors.password = t('passwordRequired')
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
    } else {
      setFieldErrors({})
      startTransition(() => {
        formAction(formData)
      })
    }
  }

  const submitOtp = async (code: string) => {
    if (!state.userId) return
    setIsVerifying(true)
    setOtpError("")
    const res = await verifyOtpAction(state.userId, code)
    setIsVerifying(false)
    if (res?.error) {
      setOtpError(t(res.error as any))
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    await submitOtp(otp)
  }

  const handleResendOtp = async () => {
    if (countdown > 0 || !state.userId || !state.email) return
    setCountdown(60)
    await resendOtpAction(state.userId, state.email)
  }

  if (state.requiresOtp) {
    return (
      <Card className="w-full">
        <div className="w-full flex items-center justify-between px-6 py-4">
          <Link href={locale === 'en' ? 'https://www.zakkig.de/en' : 'https://www.zakkig.de'} target="_blank" rel="noreferrer">
            <Image src="https://www.zakkig.de/full.svg" alt="zakkig" width={120} height={40} priority className="w-auto h-8 hover:opacity-80 transition-opacity" />
          </Link>
          <LanguageSwitcher />
        </div>
        <Separator />
        <Card.Header className="flex-col items-start gap-1">
          <h1 className="text-xl font-semibold">{locale === 'de' ? 'Anmeldung bestätigen' : 'Verify Login'}</h1>
          <p className="text-sm text-default-500">
            {locale === 'de' 
              ? `Wir haben dir einen 6-stelligen Code an ${state.email} gesendet. Trage den Code in das folgende Eingabefeld ein und bestätige um fortzufahren.` 
              : `We have sent a 6-digit code to ${state.email}. Enter the code in the input field below and confirm to continue.`}
          </p>
        </Card.Header>
        <div>
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            {otpError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {otpError}
              </div>
            )}
            <div className="flex flex-col items-center justify-center gap-4 py-4 w-full">
              <div className="w-full">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val)
                    if (val.length === 6) {
                      submitOtp(val)
                    }
                  }}
                  isDisabled={isVerifying}
                  autoFocus
                >
                <InputOTP.Group className="w-full flex">
                  <InputOTP.Slot index={0} className="h-14 flex-1 text-2xl" />
                  <InputOTP.Slot index={1} className="h-14 flex-1 text-2xl" />
                  <InputOTP.Slot index={2} className="h-14 flex-1 text-2xl" />
                  <InputOTP.Slot index={3} className="h-14 flex-1 text-2xl" />
                  <InputOTP.Slot index={4} className="h-14 flex-1 text-2xl" />
                  <InputOTP.Slot index={5} className="h-14 flex-1 text-2xl" />
                </InputOTP.Group>
                </InputOTP>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-1/2"
                isDisabled={countdown > 0}
                onClick={handleResendOtp}
              >
                {countdown > 0 ? t('resendIn').replace('{time}', countdown.toString()) : t('resendCode')}
              </Button>
              <Button type="submit" className="w-full sm:w-1/2 gap-2" isDisabled={isVerifying || otp.length < 6}>
                {isVerifying ? (
                  <>
                    <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                    {t('verifying')}
                  </>
                ) : (
                  <>
                    <PaperPlaneRight className="w-5 h-5" weight="bold" />
                    {t('confirm')}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    )
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
        <h1 className="text-xl font-semibold">{t('signIn')}</h1>
        <p className="text-sm text-default-500">
          {t('signInDescription')}
        </p>
      </Card.Header>

      <div>
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className={`text-sm font-medium ${fieldErrors.password ? "text-danger" : ""}`}>{t('password')}</label>
              <Link
                href="/reset-password"
                className="text-xs font-medium text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <InputGroup>
              <InputGroup.Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
            {fieldErrors.password && <span className="text-xs text-danger">{fieldErrors.password}</span>}
          </div>

          <Button type="submit" className="w-full mt-2 gap-2" isDisabled={isPending}>
            {isPending ? (
              <>
                <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                {t('signingIn')}
              </>
            ) : (
              <>
                <SignIn className="w-5 h-5" weight="bold" />
                {t('signIn')}
              </>
            )}
          </Button>
        </form>
      </div>

      <Separator />

      <Card.Footer className="justify-center mt-6">
        <p className="text-sm text-muted-foreground">
          {t('noAccount')}{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t('signUp')}
          </Link>
        </p>
      </Card.Footer>
    </Card>
  )
}
