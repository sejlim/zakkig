"use client";

import { useActionState, useState, startTransition, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  signInAction,
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
import { useTranslation } from "@/lib/i18n";
import {
  Eye,
  EyeSlash,
  SignIn,
  CircleNotch,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInAction, {});
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
    <SignInForm state={state} formAction={formAction} isPending={isPending} />
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
    const res = await verifyOtpAction(state.userId, code);
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
        <CardTitle className="text-2xl">{t("verifyLogin")}</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          {t("verifyLoginDesc", { email: state.email || "" })}
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

function SignInForm({
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const errors: Record<string, string> = {};

    if (!formData.get("email")) {
      errors.email = t("emailRequired");
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.get("email") as string)
    ) {
      errors.email = t("emailInvalid");
    }

    if (!formData.get("password")) {
      errors.password = t("passwordRequired");
    }

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
        <CardTitle className="text-2xl">{t("signIn")}</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          {t("signInDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className={`text-sm font-semibold ${fieldErrors.email ? "text-destructive" : ""}`}
            >
              {t("email")}
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
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className={`text-sm font-semibold ${fieldErrors.password ? "text-destructive" : ""}`}
              >
                {t("password")}
              </label>
              <Link
                href="/reset-password"
                className="text-sm font-medium text-primary-foreground underline-offset-4 hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
            {fieldErrors.password && (
              <span className="text-sm text-destructive">
                {fieldErrors.password}
              </span>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 gap-2 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:bg-primary-foreground/20 disabled:text-primary-foreground/50 disabled:opacity-100"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                {t("signingIn")}
              </>
            ) : (
              <>
                <SignIn className="w-5 h-5" weight="bold" />
                {t("signIn")}
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pb-6 bg-transparent border-t border-primary-foreground/10">
        <p className="text-sm text-primary-foreground/80">
          {t("noAccount")}{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
          >
            {t("signUp")}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
