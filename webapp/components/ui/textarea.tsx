"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

function Textarea({
  className,
  maxLength,
  onKeyDown,
  onPaste,
  ...props
}: React.ComponentProps<"textarea">) {
  const { t } = useTranslation();
  const max = maxLength ?? 1000;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      max &&
      e.currentTarget.value.length >= max &&
      e.key.length === 1 &&
      !e.ctrlKey &&
      !e.metaKey &&
      !e.altKey &&
      e.currentTarget.selectionStart === e.currentTarget.selectionEnd
    ) {
      toast.error(t("charLimitExceeded"), { id: "textarea-max-limit-toast" });
    }
    onKeyDown?.(e);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (max && pasted && e.currentTarget.value.length + pasted.length > max) {
      toast.error(t("charLimitExceeded"), { id: "textarea-max-limit-toast" });
    }
    onPaste?.(e);
  };

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      maxLength={max}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      {...props}
    />
  );
}

export { Textarea };
