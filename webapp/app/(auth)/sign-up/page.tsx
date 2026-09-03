"use client";

import {
  useActionState,
  useState,
  startTransition,
  useEffect,
  useRef,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";
import {
  signUpAction,
  checkEmailExistsAction,
  verifyOtpAction,
  resendOtpAction,
} from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/lib/i18n";
import { isDisposableEmail } from "@/lib/disposable-domains";
import {
  Eye,
  EyeSlash,
  Check,
  X,
  UserPlus,
  CircleNotch,
  PaperPlaneRight,
  ArrowLeft,
  ArrowRight,
  Clock,
} from "@phosphor-icons/react";
import { toast } from "sonner";

export default function SignUpPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, {});
  const { t } = useTranslation();

  useEffect(() => {
    if (state.error) {
      toast.error(t(state.error as any));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state.requiresOtp) {
    return <OtpForm state={state} />;
  }

  return (
    <SignUpForm state={state} formAction={formAction} isPending={isPending} />
  );
}

function OtpForm({ state }: { state: any }) {
  const { t, locale } = useTranslation();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const submitOtp = async (code: string) => {
    if (!state.userId) return;
    setIsVerifying(true);
    const res = await verifyOtpAction(state.userId, code, state.pendingOrgData);
    setIsVerifying(false);
    if (res?.error) {
      toast.error(t(res.error as any));
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitOtp(otp);
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || !state.userId || !state.email) return;
    setCountdown(60);
    await resendOtpAction(state.userId, state.email);
  };

  return (
    <Card className="w-full bg-primary text-primary-foreground border-none shadow-none sm:border-primary-foreground/10 sm:shadow-sm">
      <div className="w-full flex items-center justify-between px-6 pt-6 pb-4 border-b border-primary-foreground/10">
        <Link href={t("homepageUrl")} target="_blank" rel="noreferrer">
          <Image
            src="https://www.zakkig.de/full.svg"
            alt="zakkig"
            width={120}
            height={40}
            priority
            className="w-auto h-8 hover:opacity-80 transition-opacity brightness-0 invert"
          />
        </Link>
        <LanguageSwitcher
          variant="outline"
          className="h-10 px-3 bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        />
      </div>
      <CardHeader className="flex-col items-start gap-1 pt-4">
        <CardTitle className="text-2xl">{t("verifyEmail")}</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          {t("verifyEmailDesc", { email: state.email || "" })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleVerifyOtp}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col items-center justify-center gap-4 py-4 w-full">
            <div className="w-full">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(val) => {
                  setOtp(val);
                  if (val.length === 6) {
                    submitOtp(val);
                  }
                }}
                disabled={isVerifying}
                autoFocus
              >
                <InputOTPGroup className="w-full flex gap-2">
                  <InputOTPSlot
                    index={0}
                    className="h-14 flex-1 text-2xl rounded-md border-primary-foreground/20 text-primary-foreground"
                  />
                  <InputOTPSlot
                    index={1}
                    className="h-14 flex-1 text-2xl rounded-md border-primary-foreground/20 text-primary-foreground"
                  />
                  <InputOTPSlot
                    index={2}
                    className="h-14 flex-1 text-2xl rounded-md border-primary-foreground/20 text-primary-foreground"
                  />
                  <InputOTPSlot
                    index={3}
                    className="h-14 flex-1 text-2xl rounded-md border-primary-foreground/20 text-primary-foreground"
                  />
                  <InputOTPSlot
                    index={4}
                    className="h-14 flex-1 text-2xl rounded-md border-primary-foreground/20 text-primary-foreground"
                  />
                  <InputOTPSlot
                    index={5}
                    className="h-14 flex-1 text-2xl rounded-md border-primary-foreground/20 text-primary-foreground"
                  />
                </InputOTPGroup>
              </InputOTP>
              <div className="flex items-center justify-center gap-1.5 text-xs text-primary-foreground/75 mt-3 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{t("otpValidDuration")}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full">
            <Button
              type="button"
              className="w-full sm:w-1/2 h-11 bg-transparent border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 disabled:border-primary-foreground/10 disabled:text-primary-foreground/40 disabled:opacity-100"
              disabled={countdown > 0}
              onClick={handleResendOtp}
            >
              {countdown > 0
                ? t("resendIn").replace("{time}", countdown.toString())
                : t("resendCode")}
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-1/2 gap-2 h-11 bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:bg-primary-foreground/20 disabled:text-primary-foreground/50 disabled:opacity-100"
              disabled={isVerifying || otp.length < 6}
            >
              {isVerifying ? (
                <>
                  <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                  {t("verifying")}
                </>
              ) : (
                <>
                  <PaperPlaneRight className="w-5 h-5" weight="bold" />
                  {t("confirm")}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SignUpForm({
  state,
  formAction,
  isPending,
}: {
  state: any;
  formAction: (payload: FormData) => void;
  isPending: boolean;
}) {
  const { t, locale } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Wizard State
  const [step, setStep] = useState(1);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleNext = async () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!fd.get("restaurantName"))
        errors.restaurantName = t("restaurantNameRequired" as any);
    } else if (step === 2) {
      const email = fd.get("email") as string;
      if (!email) {
        errors.email = t("emailRequired");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = t("emailInvalid");
      } else if (isDisposableEmail(email)) {
        errors.email = t("disposableEmail" as any);
        toast.error(t("disposableEmail" as any));
      }

      const password = fd.get("password") as string;
      if (!password) {
        errors.password = t("passwordRequired");
      } else {
        const hasLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumberOrSpecial =
          /[0-9]/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password);
        if (
          !hasLength ||
          !hasUpperCase ||
          !hasLowerCase ||
          !hasNumberOrSpecial
        ) {
          errors.password = t("passwordInvalid" as any);
        }
      }

      if (Object.keys(errors).length === 0) {
        setIsCheckingEmail(true);
        const res = await checkEmailExistsAction(email);
        setIsCheckingEmail(false);
        if (res.exists) {
          errors.email = t("authErrorUserExists" as any);
          toast.error(t("authErrorUserExists" as any));
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
    } else {
      setFieldErrors({});
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setFieldErrors({});
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (step < 3) {
      handleNext();
      return;
    }

    const formData = new FormData(e.currentTarget);
    const errors: Record<string, string> = {};

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword)
      errors.confirmPassword = t("passwordMismatch");
    if (!formData.get("terms")) errors.terms = t("termsRequired");

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
    } else {
      setFieldErrors({});
      startTransition(() => {
        formAction(formData);
      });
    }
  };

  return (
    <Card className="w-full bg-primary text-primary-foreground border-none shadow-none sm:border-primary-foreground/10 sm:shadow-sm">
      <div className="w-full flex items-center justify-between px-6 pt-6 pb-4 border-b border-primary-foreground/10">
        <Link href={t("homepageUrl")} target="_blank" rel="noreferrer">
          <Image
            src="https://www.zakkig.de/full.svg"
            alt="zakkig"
            width={120}
            height={40}
            priority
            loading="eager"
            className="w-auto h-8 hover:opacity-80 transition-opacity brightness-0 invert"
          />
        </Link>
        <LanguageSwitcher
          variant="outline"
          className="h-10 px-3 bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        />
      </div>
      <CardHeader className="flex-col items-start gap-1 pt-4">
        <CardTitle className="text-2xl">{t("signUp")}</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          {t("signUpDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Progress Bar (Dynamic Segments) */}
        <div className="flex w-full gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                s <= step
                  ? "flex-[2] bg-primary-foreground"
                  : "flex-1 bg-primary-foreground/20",
              )}
            />
          ))}
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          {/* Step 1: Business & Name */}
          <div className={cn("flex-col gap-5", step === 1 ? "flex" : "hidden")}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="restaurantName"
                className={`text-sm font-semibold ${fieldErrors.restaurantName ? "text-destructive" : ""}`}
              >
                {t("restaurantName")}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="restaurantName"
                name="restaurantName"
                type="text"
                placeholder={t("businessPlaceholder")}
                autoComplete="organization"
                maxLength={80}
                className={`h-11 border-primary-foreground/20 placeholder:text-primary-foreground/50 text-primary-foreground ${fieldErrors.restaurantName ? "border-destructive" : ""}`}
              />
              {fieldErrors.restaurantName && (
                <span className="text-sm text-destructive">
                  {fieldErrors.restaurantName}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-semibold">
                {t("name")}
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder={t("namePlaceholder")}
                autoComplete="name"
                maxLength={80}
                className="h-11 border-primary-foreground/20 placeholder:text-primary-foreground/50 text-primary-foreground"
              />
            </div>
          </div>

          {/* Step 2: Email & Password */}
          <div className={cn("flex-col gap-5", step === 2 ? "flex" : "hidden")}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className={`text-sm font-semibold ${fieldErrors.email ? "text-destructive" : ""}`}
              >
                {t("email")} <span className="text-destructive">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                maxLength={100}
                className={`h-11 border-primary-foreground/20 placeholder:text-primary-foreground/50 text-primary-foreground ${fieldErrors.email ? "border-destructive" : ""}`}
              />
              {fieldErrors.email && (
                <span className="text-sm text-destructive">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className={`text-sm font-semibold ${fieldErrors.password ? "text-destructive" : ""}`}
              >
                {t("password")} <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  maxLength={100}
                  className={`h-11 border-primary-foreground/20 placeholder:text-primary-foreground/50 text-primary-foreground ${fieldErrors.password ? "border-destructive pr-10" : "pr-10"}`}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? t("hidePassword") : t("showPassword")}
                >
                  {showPassword ? (
                    <EyeSlash
                      className="w-5 h-5 text-primary-foreground/50"
                      weight="bold"
                    />
                  ) : (
                    <Eye
                      className="w-5 h-5 text-primary-foreground/50"
                      weight="bold"
                    />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                <div className="flex items-start gap-2 text-xs">
                  {passwordValue.length >= 8 ? (
                    <Check
                      className="text-emerald-500 shrink-0 mt-0.5"
                      weight="bold"
                    />
                  ) : (
                    <X
                      className="text-destructive shrink-0 mt-0.5"
                      weight="bold"
                    />
                  )}
                  <span
                    className={
                      passwordValue.length >= 8
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {t("passwordReqLength" as any)}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  {/[A-Z]/.test(passwordValue) ? (
                    <Check
                      className="text-emerald-500 shrink-0 mt-0.5"
                      weight="bold"
                    />
                  ) : (
                    <X
                      className="text-destructive shrink-0 mt-0.5"
                      weight="bold"
                    />
                  )}
                  <span
                    className={
                      /[A-Z]/.test(passwordValue)
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {t("passwordReqUppercase" as any)}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  {/[a-z]/.test(passwordValue) ? (
                    <Check
                      className="text-emerald-500 shrink-0 mt-0.5"
                      weight="bold"
                    />
                  ) : (
                    <X
                      className="text-destructive shrink-0 mt-0.5"
                      weight="bold"
                    />
                  )}
                  <span
                    className={
                      /[a-z]/.test(passwordValue)
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }
                  >
                    {t("passwordReqLowercase" as any)}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  {/[0-9]/.test(passwordValue) ||
                  /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue) ? (
                    <Check
                      className="text-emerald-500 shrink-0 mt-0.5"
                      weight="bold"
                    />
                  ) : (
                    <X
                      className="text-destructive shrink-0 mt-0.5"
                      weight="bold"
                    />
                  )}
                  <span
                    className={
                      /[0-9]/.test(passwordValue) ||
                      /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue)
                        ? "text-primary-foreground leading-tight"
                        : "text-muted-foreground leading-tight"
                    }
                  >
                    {t("passwordReqNumberOrSpecial" as any)}
                  </span>
                </div>
              </div>

              {fieldErrors.password && (
                <span className="text-sm text-destructive">
                  {fieldErrors.password}
                </span>
              )}
            </div>
          </div>

          {/* Step 3: Confirm Password & Terms */}
          <div className={cn("flex-col gap-5", step === 3 ? "flex" : "hidden")}>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirmPassword"
                className={`text-sm font-semibold ${fieldErrors.confirmPassword ? "text-destructive" : ""}`}
              >
                {t("confirmPassword")}{" "}
                <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  maxLength={100}
                  className={`h-11 border-primary-foreground/20 placeholder:text-primary-foreground/50 text-primary-foreground ${fieldErrors.confirmPassword ? "border-destructive pr-10" : "pr-10"}`}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={
                    showConfirmPassword ? t("hidePassword") : t("showPassword")
                  }
                >
                  {showConfirmPassword ? (
                    <EyeSlash
                      className="w-5 h-5 text-primary-foreground/50"
                      weight="bold"
                    />
                  ) : (
                    <Eye
                      className="w-5 h-5 text-primary-foreground/50"
                      weight="bold"
                    />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="text-sm text-destructive">
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1 my-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  name="terms"
                  value="true"
                  className={`mt-0.5 border-primary-foreground/20 data-[state=checked]:bg-primary-foreground data-[state=checked]:text-primary ${fieldErrors.terms ? "border-destructive" : ""}`}
                />
                <div className="grid gap-1.5 leading-tight">
                  <label
                    htmlFor="terms"
                    className={cn(
                      "text-sm font-medium cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                      fieldErrors.terms ? "text-destructive" : "",
                    )}
                  >
                    {t("agreeToTerms")}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {t("termsAgreementPrefix")}
                    <a
                      href={t("termsUrl")}
                      className="underline hover:text-foreground"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("termsAndConditions")}
                    </a>
                    {t("termsAgreementMiddle")}
                    <a
                      href={t("privacyUrl")}
                      className="underline hover:text-foreground"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("privacyPolicy")}
                    </a>
                    {t("termsAgreementSuffix")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-2">
            {step > 1 && (
              <Button
                type="button"
                onClick={handleBack}
                className="flex-1 h-11 gap-2 text-base bg-transparent border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 disabled:border-primary-foreground/10 disabled:text-primary-foreground/40 disabled:opacity-100"
                disabled={isPending || isCheckingEmail}
              >
                <ArrowLeft className="w-5 h-5" weight="bold" />
                {t("back")}
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="submit"
                className={cn(
                  "h-11 gap-2 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:bg-primary-foreground/20 disabled:text-primary-foreground/50 disabled:opacity-100",
                  step === 1 ? "w-full" : "flex-1",
                )}
                disabled={isCheckingEmail}
              >
                {isCheckingEmail ? (
                  <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" weight="bold" />
                    {t("next")}
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 h-11 gap-2 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:bg-primary-foreground/20 disabled:text-primary-foreground/50 disabled:opacity-100"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <CircleNotch
                      className="w-5 h-5 animate-spin"
                      weight="bold"
                    />
                    {t("signingUp")}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" weight="bold" />
                    {t("signUp")}
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center pb-6 bg-transparent border-t border-primary-foreground/10">
        <p className="text-sm text-primary-foreground/80">
          {t("hasAccount")}{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
          >
            {t("signIn")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
