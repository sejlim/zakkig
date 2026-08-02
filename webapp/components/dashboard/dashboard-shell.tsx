"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChartBar,
  ClipboardText,
  ForkKnife,
  Gear,
  SignOut,
  Globe,
  List,
  CaretLeft,
  CaretRight,
  Archive,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/lib/i18n";
import { useLanguageStore } from "@/store/language-store";
import { useSidebarStore } from "@/store/sidebar-store";
import type { Organization } from "@/lib/types";
import type { Models } from "node-appwrite";
import Image from "next/image";
import { getImagePreviewUrl } from "@/lib/appwrite/client";
import { signOutAction } from "@/actions/auth-actions";

interface DashboardShellProps {
  organization: Organization | null;
  user: Models.User<Models.Preferences>;
  children: React.ReactNode;
}

export function DashboardShell({
  organization,
  user,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguageStore();
  const { isExpanded, toggleSidebar } = useSidebarStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // Fallback polling for session validation (checks every 15 minutes)
    const interval = setInterval(async () => {
      try {
        const { verifySessionAction } = await import("@/actions/auth-actions");
        const { isValid } = await verifySessionAction();
        if (!isValid) {
          window.location.href = "/sign-in";
        }
      } catch (e) {
        // ignore network errors
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => {
      clearInterval(interval);
    };
  }, []);

  const zakkigUrl = t("homepageUrl");

  const navItems = [
    {
      label: t("overview"),
      href: `/dashboard/${organization?.$id ?? "new"}/overview`,
      icon: ChartBar,
    },
    {
      label: t("menu"),
      href: `/dashboard/${organization?.$id ?? "new"}/menu`,
      icon: ForkKnife,
    },
    {
      label: t("orders"),
      href: `/dashboard/${organization?.$id ?? "new"}/live-orders`,
      icon: ClipboardText,
    },
    {
      label: t("archive"),
      href: `/dashboard/${organization?.$id ?? "new"}/archive`,
      icon: Archive,
    },
    {
      label: t("settings"),
      href: `/dashboard/${organization?.$id ?? "new"}/settings`,
      icon: Gear,
    },
  ];

  return (
    <div className="flex h-screen w-full bg-primary overflow-hidden print:h-auto print:overflow-visible print:block">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden block w-full h-full cursor-default border-none p-0"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-l border-primary-foreground/10 bg-primary text-primary-foreground lg:relative print:hidden",
          isExpanded ? "w-64" : "w-16",
          "max-lg:w-64", // Always wide on mobile
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-primary-foreground/10 shrink-0",
            isExpanded ? "justify-between px-4" : "justify-center px-2",
            "max-lg:justify-end max-lg:px-4",
          )}
        >
          {/* Desktop Logo */}
          {isExpanded && (
            <div className="hidden lg:flex flex-1">
              <Link
                href={zakkigUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="overflow-hidden"
              >
                <Image
                  src="https://www.zakkig.de/full.svg"
                  alt="zakkig logo"
                  width={100}
                  height={24}
                  priority
                  loading="eager"
                  className="h-6 w-auto brightness-0 invert"
                />
              </Link>
            </div>
          )}

          {/* Desktop Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden lg:flex shrink-0 h-9 w-9 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            {isExpanded ? (
              <CaretLeft weight="bold" />
            ) : (
              <CaretRight weight="bold" />
            )}
          </Button>

          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden shrink-0 h-9 w-9 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
          >
            <CaretLeft weight="bold" className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2">
          <div className="px-3">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start px-2.5 h-10 overflow-hidden",
                      isActive
                        ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90 hover:text-primary"
                        : "text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground",
                    )}
                    aria-label={!isExpanded ? item.label : undefined}
                    onClick={() => {
                      setIsMobileOpen(false);
                      router.push(item.href);
                    }}
                  >
                    <item.icon
                      weight={isActive ? "fill" : "regular"}
                      className="h-5 w-5 shrink-0"
                    />
                    {isExpanded && <span className="ml-1">{item.label}</span>}
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>

        <div
          className={cn(
            "border-t border-primary-foreground/10 flex flex-col gap-4 shrink-0",
            isExpanded ? "p-4" : "p-3 py-4",
          )}
        >
          <Link
            href={`/dashboard/${organization?.$id || "default"}/settings`}
            className={cn(
              "flex items-center gap-3 transition-opacity hover:opacity-80 cursor-pointer",
              !isExpanded && "justify-center",
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage
                src={
                  organization?.logoFileId
                    ? getImagePreviewUrl(organization.logoFileId)
                    : undefined
                }
                alt={organization?.name ?? "Z"}
              />
              <AvatarFallback className="bg-secondary text-primary font-semibold">
                {organization?.name?.charAt(0) ?? "Z"}
              </AvatarFallback>
            </Avatar>
            {isExpanded && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="truncate font-semibold text-sm">
                  {organization?.name ?? "Zakkig"}
                </span>
                <span className="text-xs text-primary-foreground/70 truncate">
                  {user?.name || user?.email || t("userFallback")}
                </span>
              </div>
            )}
          </Link>

          <div
            className={cn(
              "flex items-center gap-2",
              !isExpanded ? "flex-col" : "justify-between",
            )}
          >
            <form
              action={signOutAction}
              className={cn(!isExpanded && "w-full")}
            >
              <Button
                type="submit"
                variant="ghost"
                className={cn(
                  "justify-start h-10 overflow-hidden",
                  isExpanded ? "px-3" : "px-2.5 w-full",
                  "text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground",
                )}
              >
                <SignOut className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="ml-1">{t("signOut")}</span>}
              </Button>
            </form>
            <Button
              variant="ghost"
              onClick={() => setLocale(locale === "de" ? "en" : "de")}
              className={cn(
                "justify-start h-10 overflow-hidden",
                isExpanded ? "px-3" : "px-2.5 w-full",
                "text-primary-foreground/80 hover:bg-primary-foreground/20 hover:text-primary-foreground",
              )}
            >
              <Globe className="h-5 w-5 shrink-0" />
              {isExpanded && (
                <span className="ml-1">{locale.toUpperCase()}</span>
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background lg:rounded-l-[1.5rem] shadow-sm print:overflow-visible print:block print:bg-white print:shadow-none">
        <header className="flex h-16 shrink-0 items-center justify-start gap-2 border-b border-primary-foreground/10 px-4 lg:hidden print:hidden bg-primary text-primary-foreground">
          <Link href={zakkigUrl} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://www.zakkig.de/full.svg"
              alt="Zakkig"
              width={100}
              height={24}
              priority
              loading="eager"
              className="h-6 w-auto brightness-0 invert"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
            className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
          >
            <CaretRight weight="bold" className="h-6 w-6" />
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:pt-4 print:overflow-visible print:p-0 print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
