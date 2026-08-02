"use client";

import { useActionState, startTransition, useEffect, Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";
import { isDisposableEmail } from "@/lib/disposable-domains";
import { sendEmailChangeOtpAction } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { X, CircleNotch, ArrowLeft, EnvelopeSimple } from "@phosphor-icons/react";
import { toast } from "sonner";

function ChangeEmailConfirmForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const [state, dispatch, isPending] = useActionState<{ success?: boolean; error?: string; email?: string; userId?: string; token?: string; }, FormData>(sendEmailChangeOtpAction, {});
  const { t, locale } = useTranslation();

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success(t("emailChangeConfirmSent" as any));
      // Redirect to OTP page with userId, email and token
      router.push(`/change-email/otp?userId=${state.userId}&email=${encodeURIComponent(state.email as string)}&token=${state.token}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, router]);

  const [fieldError, setFieldError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("newEmail") as string;
    
    setFieldError("");
    
    if (!email) {
      setFieldError(t("emailRequired" as any));
      toast.error(t("emailRequired" as any));
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError(t("emailInvalid" as any));
      toast.error(t("emailInvalid" as any));
      return;
    }
    
    if (isDisposableEmail(email)) {
      setFieldError(t("disposableEmail" as any));
      toast.error(t("disposableEmail" as any));
      return;
    }

    startTransition(() => {
      dispatch(formData);
    });
  };

  if (!userId || !token) {
    return <InvalidLinkState />;
  }

  return (
    <>
      <CardHeader className="flex-col items-start gap-1 pt-4">
        <CardTitle className="text-2xl">{t("newEmailAddress" as any)}</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          {t("newEmailAddressDesc" as any)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="token" value={token} />
          
          <div className="flex flex-col gap-2">
            <label htmlFor="newEmail" className="text-sm font-medium">
              {t("email")}
            </label>
            <Input
              id="newEmail"
              name="newEmail"
              type="email"
              placeholder="name@beispiel.de"
              disabled={isPending}
              className={cn(
                "h-12 border-primary-foreground/20 bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/30",
                fieldError ? "border-red-400 focus-visible:ring-red-400" : ""
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full gap-2 mt-4 h-11 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                {t("pleaseWait" as any)}
              </>
            ) : (
              <>
                <EnvelopeSimple className="w-5 h-5" weight="bold" />
                {t("requestVerificationCode" as any)}
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pb-6 bg-transparent border-t border-primary-foreground/10 pt-6">
        <p className="text-sm text-primary-foreground/80">
          {t("changedMind" as any)}{" "}
          <Link
            href="/dashboard"
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
          >
            {t("backToDashboard" as any)}
          </Link>
        </p>
      </CardFooter>
    </>
  );
}

function InvalidLinkState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-primary-foreground">
      <X className="w-12 h-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold">{t("invalidToken" as any)}</h2>
      <p className="text-primary-foreground/80 mt-2">{t("invalidLinkDesc" as any)}</p>
      <Link href="/dashboard" className="mt-6">
        <Button type="button" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
          {t("backToDashboard" as any)}
        </Button>
      </Link>
    </div>
  );
}

export default function ChangeEmailConfirmPage() {
  const { t } = useTranslation();

  return (
    <Card className="w-full bg-primary text-primary-foreground border-border/5">
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
        <ChangeEmailConfirmForm />
      </Suspense>
    </Card>
  );
}
