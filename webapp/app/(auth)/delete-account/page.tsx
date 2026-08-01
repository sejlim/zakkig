"use client";

import { useActionState, startTransition, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { confirmAccountDeletionAction } from "@/actions/settings-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { X, CircleNotch, ArrowLeft, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";

function DeleteAccountConfirmForm() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const boundAction = confirmAccountDeletionAction.bind(
    null,
    userId || "",
    token || "",
  );
  
  const formAction = async (prevState: any, formData: FormData) => {
    return await boundAction();
  };

  const [state, dispatch, isPending] = useActionState(formAction, {});
  const { t, locale } = useTranslation();

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
    if (state.success) {
      toast.success(t("accountDeletedSuccess" as any));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(() => {
      dispatch(new FormData());
    });
  };

  if (!userId || !token) {
    return <InvalidLinkState locale={locale} />;
  }

  if (state.success) {
    return <SuccessState locale={locale} t={t} />;
  }

  return (
    <DeleteConfirmFormContent
      locale={locale}
      t={t}
      isPending={isPending}
      handleSubmit={handleSubmit}
    />
  );
}

function InvalidLinkState({ locale }: { locale: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <X className="w-12 h-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold">{t("invalidToken" as any)}</h2>
      <p className="text-muted-foreground mt-2">{t("invalidLinkDesc" as any)}</p>
      <Link href="/dashboard" className="mt-6">
        <Button type="button">
          {t("backToDashboard" as any)}
        </Button>
      </Link>
    </div>
  );
}

function SuccessState({ locale, t }: { locale: string; t: any }) {
  return (
    <>
      <CardHeader className="flex-col items-start gap-1 pt-4">
        <CardTitle className="text-2xl">
          {t("accountDeletedSuccess" as any)}
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          {t("accountDeletedDesc" as any)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-2">
          <Link href={t("homepageUrl" as any)} className="w-full">
            <Button
              type="button"
              className="w-full gap-2 h-11 text-base bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <ArrowLeft className="w-5 h-5" weight="bold" />
              {t("backHome" as any)}
            </Button>
          </Link>
        </div>
      </CardContent>
    </>
  );
}

function DeleteConfirmFormContent({
  locale,
  t,
  isPending,
  handleSubmit,
}: any) {
  return (
    <>
      <CardHeader className="flex-col items-start gap-1 pt-4">
        <CardTitle className="text-2xl">{t("deleteAccountConfirmTitle" as any)}</CardTitle>
        <CardDescription className="text-primary-foreground/80">
          {t("deleteAccountConfirmDesc" as any)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <Button
            type="submit"
            variant="destructive"
            className="w-full gap-2 mt-4 h-11 text-base bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <CircleNotch className="w-5 h-5 animate-spin" weight="bold" />
                {t("deletingAccount" as any)}
              </>
            ) : (
              <>
                <Trash className="w-5 h-5" weight="bold" />
                {t("deleteAccountConfirmButton" as any)}
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center pb-6 bg-transparent border-t border-primary-foreground/10 pt-6">
        <p className="text-sm text-primary-foreground/80">
          <Link
            href="/dashboard"
            className="font-semibold text-primary-foreground underline-offset-4 hover:underline flex items-center gap-2 justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToDashboard" as any)}
          </Link>
        </p>
      </CardFooter>
    </>
  );
}

export default function DeleteAccountConfirmPage() {
  const { t, locale } = useTranslation();

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
        <DeleteAccountConfirmForm />
      </Suspense>
    </Card>
  );
}
