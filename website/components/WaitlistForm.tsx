"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslation } from "../lib/i18n";
import { addToWaitlist } from "../app/actions/waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, CircleNotch } from "@phosphor-icons/react";

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

type FormData = z.infer<typeof waitlistSchema>;

export function WaitlistForm() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [showRedText, setShowRedText] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setStatus("loading");
    try {
      const response = await addToWaitlist({ email: data.email });
      if (response.success) {
        setStatus("success");
        toast.success(t("formSuccess"), {
          icon: <Check weight="bold" />,
        });
        form.reset();
      } else {
        setStatus("error");
        toast.error(
          response.errorCode === "EMAIL_ALREADY_EXISTS"
            ? t("formDuplicateError")
            : t("formError"),
        );
        setShowRedText(true);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      toast.error(t("formError"));
      setShowRedText(true);
    }
  };

  const onInvalid = () => {
    const error = form.formState.errors.email;
    if (error) {
      const val = form.getValues("email");
      const isEmpty = !val || val.trim() === "";
      toast.error(
        isEmpty ? t("formRequiredError") : t("formInvalidEmailError"),
      );
      setShowRedText(true);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="flex flex-col sm:flex-row gap-3 w-full"
      >
        <div className="w-full sm:w-80 sm:flex-none flex flex-col">
          <Input
            aria-label={t("formPlaceholder")}
            id="email"
            type="email"
            placeholder={t("formPlaceholder")}
            disabled={status === "loading"}
            className={`w-full h-12 px-6 rounded-full bg-white/10 hover:bg-white/15 focus:outline-none focus:bg-white/15 border-none transition-colors text-base placeholder:text-zinc-500 ${showRedText ? "text-destructive" : "text-white"}`}
            {...form.register("email", {
              onChange: () => {
                if (showRedText) setShowRedText(false);
              },
            })}
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading"}
          className="h-12 px-8 bg-white text-black hover:bg-zinc-200 rounded-full font-semibold text-base sm:w-auto w-full transition-colors flex items-center justify-center"
        >
          {status === "loading" && (
            <CircleNotch className="w-5 h-5 mr-2 animate-spin" weight="bold" />
          )}
          {t("formButton")}
        </Button>
      </form>
      <p className="mt-4 text-xs text-zinc-500 font-light text-left leading-normal px-4">
        {t("waitlistConsentPrefix")}{" "}
        <a
          href={t("privacyUrl" as any)}
          className="text-white hover:underline font-normal"
        >
          {t("waitlistConsentLinkText")}
        </a>{" "}
        {t("waitlistConsentSuffix")}
      </p>
    </div>
  );
}
