"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea as TextArea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { WarningCircle, UploadSimple, X, SpinnerGap, PencilSimple, Trash, Plus } from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useTranslation } from "@/lib/i18n";
import { getImagePreviewUrl } from "@/lib/convex/client";
import { cn } from "@/lib/utils";
import {
  updateBusinessAction,
  requestAccountDeletionAction,
  requestEmailChangeAction,
  logoutAllDevicesAction,
} from "@/actions/settings-actions";
import {
  connectStripeAction,
  createStripeDashboardLinkAction,
  completeTestStripeOnboardingAction,
} from "@/actions/stripe-actions";
import type { Organization } from "@/lib/types";

interface SettingsContentProps {
  organization: Organization;
  user: { name?: string; email?: string; [key: string]: any };
}

export function SettingsContent({ organization, user }: SettingsContentProps) {
  const { t } = useTranslation();

  const [businessState, businessAction, isBusinessPending] = useActionState(
    updateBusinessAction,
    {},
  );

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const addressTextareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustAddressHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 32)}px`;
  };

  const [logoPreview, setLogoPreview] = useState<string | null>(
    organization.logoFileId
      ? getImagePreviewUrl(organization.logoFileId)
      : null,
  );
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    organization.bannerFileId
      ? getImagePreviewUrl(organization.bannerFileId)
      : null,
  );

  const [removeLogo, setRemoveLogo] = useState(false);
  const [removeBanner, setRemoveBanner] = useState(false);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [isStripeLoading, setIsStripeLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerPreview && bannerPreview.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [logoPreview, bannerPreview]);

  const [isEmailChanging, setIsEmailChanging] = useState(false);

  useEffect(() => {
    if (businessState.success) {
      toast.success(t("saved"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessState]);

  useEffect(() => {
    const handleResize = () => {
      if (addressTextareaRef.current) {
        adjustAddressHeight(addressTextareaRef.current);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [organization.address]);

  const handleLogoFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("imageTooLarge"));
      return;
    }
    if (!file.type.startsWith("image/")) return;

    setRemoveLogo(false);
    const url = URL.createObjectURL(file);
    setLogoPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });

    if (logoInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      logoInputRef.current.files = dataTransfer.files;
    }
  };

  const handleBannerFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error(t("imageTooLarge"));
      return;
    }
    if (!file.type.startsWith("image/")) return;

    setRemoveBanner(false);
    const url = URL.createObjectURL(file);
    setBannerPreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });

    if (bannerInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      bannerInputRef.current.files = dataTransfer.files;
    }
  };

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("settings")}</h1>
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Business & Stripe Settings */}
        <Card className="w-full flex flex-col">
          <CardHeader className="flex-col items-start pb-4">
            <h3 className="text-lg font-semibold">{t("businessSettings")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("businessSettingsDescription" as any)}
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <form
              action={businessAction}
              noValidate
              className="flex flex-col gap-6 flex-1"
            >
              <input
                type="hidden"
                name="organizationId"
                value={organization.$id}
              />
              <input
                type="hidden"
                name="existingLogoId"
                value={organization.logoFileId || ""}
              />
              <input
                type="hidden"
                name="removeLogo"
                value={removeLogo ? "true" : "false"}
              />
              <input
                type="hidden"
                name="existingBannerId"
                value={organization.bannerFileId || ""}
              />
              <input
                type="hidden"
                name="removeBanner"
                value={removeBanner ? "true" : "false"}
              />
              <input
                ref={logoInputRef}
                id="business-logo"
                name="logo"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoFile(file);
                }}
              />
              <input
                ref={bannerInputRef}
                id="business-banner"
                name="banner"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBannerFile(file);
                }}
              />

              {/* Form Fields: 2 Columns on md+, 1 Column on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="business-name"
                    className="text-sm font-medium"
                  >
                    {t("restaurantName")} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="business-name"
                    name="organizationName"
                    defaultValue={organization.name}
                    required
                    maxLength={80}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="business-user-name" className="text-sm font-medium">
                    {t("name")} <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="business-user-name"
                    name="userName"
                    defaultValue={user.name || ""}
                    maxLength={128}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="business-address"
                    className="text-sm font-medium"
                  >
                    {t("address")}
                  </label>
                  <TextArea
                    ref={addressTextareaRef}
                    id="business-address"
                    name="address"
                    defaultValue={organization.address}
                    rows={1}
                    maxLength={300}
                    onInput={(e) => adjustAddressHeight(e.currentTarget)}
                    className="min-h-8 py-1 resize-none overflow-hidden leading-5 md:text-sm transition-[height] duration-75"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="business-email" className="text-sm font-medium">
                    {t("email")}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <div className="w-full cursor-not-allowed" />
                        }
                      >
                        <Input
                          id="business-email"
                          value={user.email}
                          disabled
                          className="pointer-events-none"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {t("changeEmailTooltip" as any)}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* Visual Media & Stripe Integration: 2 Columns on xl+, 1 Column on mobile/tablet */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Brand Media Column */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{t("brandMedia")}</label>
                    <span className="text-xs text-muted-foreground">{t("bannerRecommended")}</span>
                  </div>

                  <div className="relative w-full aspect-[2.3/1] rounded-[22px] sm:rounded-[26px] overflow-hidden border border-border bg-muted/40 group/banner transition-all">
                    {/* Banner Area */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => bannerInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          bannerInputRef.current?.click();
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingBanner(true);
                      }}
                      onDragLeave={() => setIsDraggingBanner(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingBanner(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleBannerFile(file);
                      }}
                      className={cn(
                        "w-full h-full cursor-pointer relative flex flex-col items-center justify-center transition-colors",
                        isDraggingBanner && "bg-primary/10",
                      )}
                    >
                      {bannerPreview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={bannerPreview}
                            alt="Banner"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="text-white font-medium text-xs bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                              <PencilSimple className="w-3.5 h-3.5" />
                              {t("changeBanner")}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (bannerPreview.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
                                setBannerPreview(null);
                                setRemoveBanner(true);
                                if (bannerInputRef.current) bannerInputRef.current.value = "";
                              }}
                              className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-destructive hover:text-white text-white transition-colors shadow-sm"
                              title={t("removeBanner")}
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-full h-full bg-muted/40" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium text-xs bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                              <UploadSimple className="w-3.5 h-3.5" />
                              {t("uploadBanner")}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bottom-Left Logo Box */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        logoInputRef.current?.click();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          logoInputRef.current?.click();
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingLogo(true);
                      }}
                      onDragLeave={(e) => {
                        e.stopPropagation();
                        setIsDraggingLogo(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingLogo(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleLogoFile(file);
                      }}
                      className={cn(
                        "absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] sm:rounded-[12px] bg-muted border transition-all cursor-pointer flex items-center justify-center overflow-hidden group/logo",
                        (bannerPreview || logoPreview) ? "border-neutral-600" : "border-border",
                        isDraggingLogo && "border-primary ring-2 ring-primary/20",
                      )}
                      title={logoPreview ? t("changeLogo") : t("uploadLogo")}
                    >
                      {logoPreview ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logoPreview}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                            <span className="text-white bg-black/60 backdrop-blur-sm p-1.5 rounded-full flex items-center justify-center shadow-sm">
                              <PencilSimple className="w-3.5 h-3.5" />
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (logoPreview.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
                                setLogoPreview(null);
                                setRemoveLogo(true);
                                if (logoInputRef.current) logoInputRef.current.value = "";
                              }}
                              className="p-1.5 rounded-full bg-black/60 backdrop-blur-sm hover:bg-destructive hover:text-white text-white transition-colors shadow-sm"
                              title={t("removeLogo")}
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white bg-black/60 backdrop-blur-sm p-2 rounded-full flex items-center justify-center shadow-sm">
                              <UploadSimple className="w-4 h-4" />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Helper Subtext */}
                  <span className="text-xs text-muted-foreground px-1 mt-0.5">
                    {t("brandMediaDesc")}
                  </span>
                </div>

                {/* Stripe Settings Column / Panel */}
                <div className="flex flex-col justify-between gap-4 p-4 sm:p-5 border border-border rounded-[22px] sm:rounded-[26px] bg-muted/20">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-foreground">
                          {t("stripeSettings")}{" "}
                          <span className="text-destructive">*</span>
                        </h4>
                        {organization.stripeOnboardingComplete ? (
                          <Badge variant="default" className="bg-primary text-secondary font-semibold px-2.5 py-0.5 rounded-full text-xs">
                            {t("stripeConnected")}
                          </Badge>
                        ) : organization.stripeAccountId ? (
                          <Badge variant="outline" className="font-semibold px-2.5 py-0.5 rounded-full text-foreground border-border text-xs">
                            {t("stripeOnboardingIncomplete" as any)}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-semibold px-2.5 py-0.5 rounded-full text-xs">
                            {t("stripeNotConnected")}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {organization.stripeOnboardingComplete
                          ? t("stripeConnectedDesc" as any)
                          : t("stripeDescription" as any)}
                      </p>
                    </div>

                    {organization.stripeAccountId && (
                      <div className="bg-background/80 p-2.5 rounded-lg border text-xs flex flex-col gap-1">
                        <span className="font-medium text-foreground">{t("stripeAccountIdLabel" as any)}</span>
                        <code className="font-mono text-muted-foreground select-all break-all text-[11px]">
                          {organization.stripeAccountId}
                        </code>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 pt-2 mt-auto">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isStripeLoading}
                      onClick={async () => {
                        const newTab = window.open("about:blank", "_blank");
                        setIsStripeLoading(true);
                        try {
                          if (organization.stripeOnboardingComplete) {
                            const res = await createStripeDashboardLinkAction(organization.$id);
                            if (res.url) {
                              if (newTab) {
                                newTab.location.href = res.url;
                              } else {
                                window.open(res.url, "_blank");
                              }
                            } else {
                              if (newTab) newTab.close();
                              toast.error(res.error || t("error"));
                            }
                          } else {
                            const res = await connectStripeAction(organization.$id);
                            if (res.url) {
                              if (newTab) {
                                newTab.location.href = res.url;
                              } else {
                                window.open(res.url, "_blank");
                              }
                            } else {
                              if (newTab) newTab.close();
                              toast.error(res.error || t("error"));
                            }
                          }
                        } catch (err: any) {
                          if (newTab) newTab.close();
                          toast.error(err?.message || t("error"));
                        } finally {
                          setIsStripeLoading(false);
                        }
                      }}
                      className="w-full font-semibold"
                    >
                      {isStripeLoading ? <SpinnerGap className="mr-2 animate-spin" weight="bold" /> : null}
                      {organization.stripeOnboardingComplete
                        ? t("openStripeDashboard" as any)
                        : organization.stripeAccountId
                        ? t("continueOnboarding" as any)
                        : t("connectStripeWithIban" as any)}
                    </Button>

                    {process.env.NODE_ENV === "development" && !organization.stripeOnboardingComplete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        disabled={isStripeLoading}
                        onClick={async () => {
                          setIsStripeLoading(true);
                          try {
                            const res = await completeTestStripeOnboardingAction(organization.$id);
                            if (res.success) {
                              toast.success(t("stripeConnectedSuccessfully" as any));
                            } else {
                              toast.error(res.error || t("error"));
                            }
                          } finally {
                            setIsStripeLoading(false);
                          }
                        }}
                      >
                        {t("testOnboardingHelper" as any)}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {businessState.error && (
                <p className="text-sm text-destructive font-medium">
                  {businessState.error}
                </p>
              )}

              <div className="pt-2 w-full">
                <Button
                  type="submit"
                  disabled={isBusinessPending}
                  variant="outline"
                  className="w-full font-semibold"
                >
                  {isBusinessPending ? <SpinnerGap className="mr-2 animate-spin" weight="bold" /> : null}
                  {t("save")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="w-full flex flex-col border-destructive/50 border">
            <CardHeader className="flex-col items-start pb-4">
              <h3 className="text-lg font-semibold text-destructive">
                {t("dangerZone" as any)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("dangerZoneDescription" as any)}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 items-stretch">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="h-full flex flex-col justify-between gap-4 p-4 border border-border rounded-lg">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-medium text-foreground">{t("logoutAllDevices")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("logoutAllDevicesDescription")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isLoggingOutAll}
                    onClick={async () => {
                      setIsLoggingOutAll(true);
                      try {
                        await logoutAllDevicesAction();
                        // Redirection is handled by the action
                      } catch (error) {
                        setIsLoggingOutAll(false);
                      }
                    }}
                    className="w-full mt-auto font-semibold"
                  >
                    {isLoggingOutAll ? (
                      <SpinnerGap className="mr-2 animate-spin" weight="bold" />
                    ) : null}
                    {t("logoutAllDevices")}
                  </Button>
                </div>

                <div className="h-full flex flex-col justify-between gap-4 p-4 border border-border rounded-lg">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-medium text-foreground">{t("changeEmailAddress" as any)}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t("changeEmailDescription" as any)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isEmailChanging}
                    onClick={async () => {
                      setIsEmailChanging(true);
                      try {
                        const res = await requestEmailChangeAction();
                        if (res?.error) {
                          toast.error(res.error);
                        } else {
                          toast.success(t("changeEmailRequestSent" as any));
                        }
                      } finally {
                        setIsEmailChanging(false);
                      }
                    }}
                    className="w-full mt-auto font-semibold"
                  >
                    {isEmailChanging ? (
                      <SpinnerGap className="mr-2 animate-spin" weight="bold" />
                    ) : null}
                    {t("changeEmailButton" as any)}
                  </Button>
                </div>
              </div>

              <div className="w-full flex flex-col justify-between gap-4 p-4 border border-border rounded-lg">
                <div className="flex flex-col gap-1">
                  <h4 className="font-medium text-foreground">{t("deleteAccount")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t("deleteAccountDescription")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const res = await requestAccountDeletionAction();
                      if (res?.error) {
                        toast.error(res.error);
                      } else {
                        toast.success(t("deletionRequestSent"));
                      }
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="w-full mt-auto font-semibold border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                >
                  {isDeleting ? (
                    <SpinnerGap className="mr-2 animate-spin" weight="bold" />
                  ) : (
                    <WarningCircle className="mr-2" weight="bold" />
                  )}
                  {t("requestDeletion")}
                </Button>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
