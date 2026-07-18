"use client"

import { useActionState, useState, startTransition, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"
import { signUpAction, verifyOtpAction, resendOtpAction } from "@/actions/auth-actions"
import { Button, Card, Input, Separator, InputOTP, Checkbox, InputGroup } from "@heroui/react"
import { useTranslation } from "@/lib/i18n"
import { Eye, EyeSlash, Check, X, UserPlus, CheckCircle, CircleNotch, PaperPlaneRight } from "@phosphor-icons/react"

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, {})
  const { t, locale } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const errors: Record<string, string> = {}
    
    if (!formData.get("restaurantName")) errors.restaurantName = t('restaurantNameRequired' as any)
    if (!formData.get("email")) {
      errors.email = t('emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.get("email") as string)) {
      errors.email = t('emailInvalid')
    }
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

    if (!formData.get("terms")) errors.terms = t('termsRequired')

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
    const res = await verifyOtpAction(state.userId, code, state.pendingOrgData)
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
          <h1 className="text-xl font-semibold">{locale === 'de' ? 'E-Mail bestätigen' : 'Verify Email'}</h1>
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
        <h1 className="text-xl font-semibold">{t('signUp')}</h1>
        <p className="text-sm text-default-500">
          {t('signUpDescription')}
        </p>
      </Card.Header>

      <div>
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {state.error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t(state.error as any)}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="restaurantName" className={`text-sm font-medium ${fieldErrors.restaurantName ? "text-danger" : ""}`}>
                {t('restaurantName')} <span className="text-danger">*</span>
              </label>
              <Input
                id="restaurantName"
                name="restaurantName"
                type="text"
                placeholder={t('businessPlaceholder')}
                autoComplete="organization"
                className={fieldErrors.restaurantName ? "border-danger" : ""}
              />
              {fieldErrors.restaurantName && <span className="text-xs text-danger">{fieldErrors.restaurantName}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="name" className="text-sm font-medium">{t('name')}</label>
              </div>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t('namePlaceholder')}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className={`text-sm font-medium ${fieldErrors.email ? "text-danger" : ""}`}>
              {t('email')} <span className="text-danger">*</span>
            </label>
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

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className={`text-sm font-medium ${fieldErrors.password ? "text-danger" : ""}`}>
                {t('password')} <span className="text-danger">*</span>
              </label>
              <InputGroup>
                <InputGroup.Input
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
                  {passwordValue.length >= 8 ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-danger shrink-0 mt-0.5" weight="bold" />}
                  <span className={passwordValue.length >= 8 ? "text-emerald-700" : "text-muted-foreground"}>{t('passwordReqLength' as any)}</span>
                </div>
                <div className="flex items-start gap-2 text-xs mt-1">
                  {/[A-Z]/.test(passwordValue) ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-danger shrink-0 mt-0.5" weight="bold" />}
                  <span className={/[A-Z]/.test(passwordValue) ? "text-emerald-700" : "text-muted-foreground"}>{t('passwordReqUppercase' as any)}</span>
                </div>
                <div className="flex items-start gap-2 text-xs mt-1">
                  {/[a-z]/.test(passwordValue) ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-danger shrink-0 mt-0.5" weight="bold" />}
                  <span className={/[a-z]/.test(passwordValue) ? "text-emerald-700" : "text-muted-foreground"}>{t('passwordReqLowercase' as any)}</span>
                </div>
                <div className="flex items-start gap-2 text-xs mt-1">
                  {/[0-9]/.test(passwordValue) || /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue) ? <Check className="text-emerald-500 shrink-0 mt-0.5" weight="bold" /> : <X className="text-danger shrink-0 mt-0.5" weight="bold" />}
                  <span className={/[0-9]/.test(passwordValue) || /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue) ? "text-emerald-700 leading-tight" : "text-muted-foreground leading-tight"}>{t('passwordReqNumberOrSpecial' as any)}</span>
                </div>
              </div>
              
              {fieldErrors.password && <span className="text-xs text-danger">{fieldErrors.password}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className={`text-sm font-medium ${fieldErrors.confirmPassword ? "text-danger" : ""}`}>
                {t('confirmPassword')} <span className="text-danger">*</span>
              </label>
              <InputGroup>
                <InputGroup.Input
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
              {fieldErrors.confirmPassword && <span className="text-xs text-danger">{fieldErrors.confirmPassword}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1 my-2">
            <div className="flex items-start space-x-2">
              <Checkbox id="terms" name="terms" value="true" className={fieldErrors.terms ? "border-danger" : ""}>
                <Checkbox.Content>
                  <Checkbox.Control className="cursor-pointer">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                </Checkbox.Content>
              </Checkbox>
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className={cn("text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70", fieldErrors.terms ? "text-danger" : "")}
                >
                  {t('agreeToTerms')}
                </label>
                <p className="text-xs text-muted-foreground">
                  {locale === 'de' ? (
                    <>
                      Durch die Registrierung erklärst du dich mit unseren <a href="https://www.zakkig.de/agb" className="underline" target="_blank" rel="noreferrer">AGB</a> und unserer <a href="https://www.zakkig.de/datenschutz" className="underline" target="_blank" rel="noreferrer">Datenschutzerklärung</a> einverstanden.
                    </>
                  ) : (
                    <>
                      By registering, you agree to our <a href="https://www.zakkig.de/en/terms" className="underline" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="https://www.zakkig.de/en/privacy" className="underline" target="_blank" rel="noreferrer">Privacy Policy</a>.
                    </>
                  )}
                </p>
              </div>
            </div>
            {fieldErrors.terms && <span className="text-xs text-danger ml-6">{fieldErrors.terms}</span>}
          </div>

          <Button type="submit" className="w-full gap-2" isDisabled={isPending}>
            {isPending ? (
              <>
                <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                {t('signingUp')}
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" weight="bold" />
                {t('signUp')}
              </>
            )}
          </Button>
        </form>
      </div>

      <Separator />

      <Card.Footer className="justify-center mt-6">
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
    </Card>
  )
}
