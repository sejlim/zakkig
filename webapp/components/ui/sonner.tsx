"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  Check,
  Info,
  WarningCircle,
  Warning,
  SpinnerGap,
} from "@phosphor-icons/react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <Check weight="bold" className="size-[18px] text-inherit" />
        ),
        info: <Info weight="fill" className="size-[18px] text-inherit" />,
        warning: (
          <WarningCircle weight="fill" className="size-[18px] text-inherit" />
        ),
        error: (
          <WarningCircle weight="fill" className="size-[18px] text-inherit" />
        ),
        loading: (
          <SpinnerGap className="size-[18px] animate-spin text-inherit" />
        ),
      }}
      toastOptions={{
        className:
          "!font-sans !shadow-none !rounded-full !font-bold !border-none !text-[16px] !p-4 !items-center data-[type=error]:!bg-destructive data-[type=error]:!text-destructive-foreground data-[type=success]:!bg-primary data-[type=success]:!text-primary-foreground data-[type=warning]:!bg-primary data-[type=warning]:!text-primary-foreground data-[type=info]:!bg-primary data-[type=info]:!text-primary-foreground data-[type=default]:!bg-primary data-[type=default]:!text-primary-foreground",
        classNames: {
          description: "!font-medium !opacity-90 !text-[14px]",
          actionButton: "!bg-background !text-foreground",
          cancelButton: "!bg-transparent !text-inherit",
        },
      }}
      {...props}
      position={isMobile ? "bottom-center" : "top-center"}
    />
  );
};

export { Toaster };
