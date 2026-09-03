"use client";

import { useState, startTransition, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { confirmEmailChangeOtpAction, sendEmailChangeOtpAction } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useTranslation } from "@/lib/i18n";
import {
  CircleNotch,
  PaperPlaneRight,
  Clock,
} from "@phosphor-icons/react";
import { toast } from "sonner";

function ChangeEmailOtpForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const { t } = useTranslation();
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
    if (!userId || !token || !email) return;
    setIsVerifying(true);
    
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("token", token);
    formData.append("email", email);
    formData.append("otp", code);

    const res = await confirmEmailChangeOtpAction({}, formData);
    setIsVerifying(false);
    
    if (res?.error) {
      toast.error(res.error);
    } else if (res?.success) {
      toast.success(t("emailChangedSuccess" as any));
      router.push("/");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitOtp(otp);
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || !userId || !token || !email) return;
    setCountdown(60);
    
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("token", token);
    formData.append("newEmail", email);
    
    const res = await sendEmailChangeOtpAction({}, formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(t("newOtpSent" as any));
    }
  };

  return (
    <>
      <CardHeader className="flex-col items-start gap-1 pt-4">
        <CardTitle className="text-2xl">{t("verifyLogin" as any)}</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          {t("verifyLoginDesc" as any, { email: email || "" })}
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
          <div className="flex items-center justify-center gap-1.5 text-xs text-primary-foreground/75 font-medium -mt-1 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{t("otpValidDuration" as any)}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              type="button"
              className="w-full sm:w-1/2 h-11 bg-transparent border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 disabled:border-primary-foreground/10 disabled:text-primary-foreground/40 disabled:opacity-100"
              disabled={countdown > 0}
              onClick={handleResendOtp}
            >
              {countdown > 0
                ? t("resendIn" as any).replace("{time}", countdown.toString())
                : t("resendCode" as any)}
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-1/2 gap-2 h-11 bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:bg-primary-foreground/20 disabled:text-primary-foreground/50 disabled:opacity-100"
              disabled={isVerifying || otp.length < 6}
            >
              {isVerifying ? (
                <>
                  <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                  {t("verifying" as any)}
                </>
              ) : (
                <>
                  <PaperPlaneRight className="w-5 h-5" weight="bold" />
                  {t("confirm" as any)}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  );
}

export default function ChangeEmailOtpPage() {
  const { t } = useTranslation();

  return (
    <Card className="w-full bg-primary text-primary-foreground border-border/5 shadow-none sm:shadow-sm">
      <div className="w-full flex items-center justify-between px-6 pt-6 pb-4 border-b border-primary-foreground/10">
        <Link href={t("homepageUrl" as any)} target="_blank" rel="noreferrer">
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

      <Suspense
        fallback={
          <CardContent>
            <div className="h-40 flex items-center justify-center">
              <CircleNotch className="w-8 h-8 animate-spin text-primary-foreground/50" />
            </div>
          </CardContent>
        }
      >
        <ChangeEmailOtpForm />
      </Suspense>
    </Card>
  );
}
