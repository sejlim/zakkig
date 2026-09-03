"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  Check,
  Info,
  WarningCircle,
  ExclamationMark,
  SpinnerGap,
} from "@phosphor-icons/react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <Check weight="bold" className="size-[18px] text-inherit" />,
        info: <Info weight="fill" className="size-[18px] text-inherit" />,
        warning: (
          <WarningCircle weight="fill" className="size-[18px] text-inherit" />
        ),
        error: (
          <ExclamationMark weight="bold" className="size-[18px] text-inherit" />
        ),
        loading: (
          <SpinnerGap className="size-[18px] animate-spin text-inherit" />
        ),
      }}
      toastOptions={{
        className:
          "!font-sans !shadow-none !rounded-full !font-bold !border-none !text-[16px] !p-4 !items-center data-[type=error]:!bg-destructive data-[type=error]:!text-destructive-foreground data-[type=success]:!bg-primary data-[type=success]:!text-primary-foreground data-[type=warning]:!bg-primary data-[type=warning]:!text-primary-foreground data-[type=info]:!bg-primary data-[type=info]:!text-primary-foreground data-[type=default]:!bg-primary data-[type=default]:!text-primary-foreground",
        classNames: {
          icon: "!shrink-0 !self-center",
          content:
            "!flex-1 !flex !flex-col !items-center !justify-center !text-center",
          title: "!text-center !w-full !font-semibold",
          description:
            "!font-medium !opacity-90 !text-[14px] !text-center !w-full",
          actionButton: "!bg-background !text-foreground",
          cancelButton: "!bg-transparent !text-inherit",
        },
      }}
      position="top-center"
      {...props}
    />
  );
};

export { Toaster };
