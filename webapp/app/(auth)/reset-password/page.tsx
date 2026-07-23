"use client";

import { useActionState, useState, startTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/language-switcher";
import { resetPasswordAction } from "@/actions/auth-actions";
import { useTranslation } from "@/lib/i18n";
import { PaperPlaneRight, CircleNotch, ArrowLeft } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useEffect } from "react";
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

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    {},
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { t, locale } = useTranslation();

  useEffect(() => {
    if (state.error) {
      toast.error(t(state.error as any));
    }
    if (state.success) {
      toast.success(t("resetPasswordSent"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const errors: Record<string, string> = {};
    if (!email) {
      errors.email = t("emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t("emailInvalid");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Card className="w-full bg-primary text-primary-foreground border-none shadow-none sm:border-primary-foreground/10 sm:shadow-sm">
      <div className="w-full flex items-center justify-between px-6 pt-6 pb-4 border-b border-primary-foreground/10">
        <Link
          href={
            locale === "en"
              ? "https://www.zakkig.de/en"
              : "https://www.zakkig.de"
          }
          target="_blank"
          rel="noreferrer"
        >
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
          className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        />
      </div>
      {state.success ? (
        <>
          <CardHeader className="flex-col items-start gap-1 pt-4">
            <CardTitle className="text-2xl">
              {t("resetPasswordLinkSent" as any)}
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              {t("resetPasswordSent")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <Link href="/sign-in" className="w-full">
                <Button
                  type="button"
                  className="w-full gap-2 h-11 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <ArrowLeft className="w-5 h-5" weight="bold" />
                  {t("backToSignIn")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </>
      ) : (
        <>
          <CardHeader className="flex-col items-start gap-1 pt-4">
            <CardTitle className="text-2xl">{t("resetPassword")}</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              {t("resetPasswordDescription")}
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

              <Button
                type="submit"
                className="w-full gap-2 mt-2 h-11 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:bg-primary-foreground/20 disabled:text-primary-foreground/50 disabled:opacity-100"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <CircleNotch
                      className="w-5 h-5 animate-spin"
                      weight="bold"
                    />
                    {t("sendingResetLink")}
                  </>
                ) : (
                  <>
                    <PaperPlaneRight className="w-5 h-5" weight="bold" />
                    {t("sendLink")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </>
      )}

      {!state.success && (
        <>
          <CardFooter className="justify-center pb-6 bg-transparent border-t border-primary-foreground/10">
            <p className="text-sm text-primary-foreground/80">
              {t("rememberedAccount")}{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-primary-foreground underline-offset-4 hover:underline"
              >
                {t("signIn")}
              </Link>
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
