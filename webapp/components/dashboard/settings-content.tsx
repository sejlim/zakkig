"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea as TextArea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { WarningCircle, UploadSimple, X } from "@phosphor-icons/react";
import { RefreshButton } from "./refresh-button";
import { useTranslation } from "@/lib/i18n";
import { getImagePreviewUrl } from "@/lib/appwrite/client";
import { cn } from "@/lib/utils";
import {
  updateBusinessAction,
  requestAccountDeletionAction,
} from "@/actions/settings-actions";
import type { Organization } from "@/lib/types";
import type { Models } from "node-appwrite";

interface SettingsContentProps {
  organization: Organization;
  user: Models.User<Models.Preferences>;
}

export function SettingsContent({ organization, user }: SettingsContentProps) {
  const { t } = useTranslation();

  const [businessState, businessAction, isBusinessPending] = useActionState(
    updateBusinessAction,
    {},
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    organization.logoFileId ? getImagePreviewUrl(organization.logoFileId) : null,
  );
  const [removeLogo, setRemoveLogo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (businessState.success) {
      toast.success(t("saved"));
    }
  }, [businessState, t]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("imageTooLarge"));
        return;
      }
      if (!file.type.startsWith("image/")) return;
      
      setRemoveLogo(false);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      
      // Update file input using DataTransfer
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  return (
    <div className="flex-1 space-y-4 pb-12">
      <div className="flex items-center justify-between space-y-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("settings")}</h1>
        </div>
        <RefreshButton />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-6 w-full min-w-0">
          {/* Account Settings */}
          <Card>
            <CardHeader className="flex-col items-start pb-4">
              <h3 className="text-lg font-semibold">{t("accountSettings")}</h3>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="account-name" className="text-sm font-medium">
                  {t("name")}
                </label>
                <Input id="account-name" value={user.name || ""} disabled />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="account-email" className="text-sm font-medium">
                  {t("email")}
                </label>
                <Input id="account-email" value={user.email} disabled />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("accountDataInfo")}
              </p>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card>
            <CardHeader className="flex-col items-start pb-4">
              <h3 className="text-lg font-semibold">{t("businessSettings")}</h3>
            </CardHeader>
            <CardContent>
              <form
                action={businessAction}
                noValidate
                className="flex flex-col gap-4"
              >
                <input
                  type="hidden"
                  name="organizationId"
                  value={organization.$id}
                />
                <input
                  type="hidden"
                  name="existingLogoId"
                  value={organization.logoFileId}
                />
                <input
                  type="hidden"
                  name="removeLogo"
                  value={removeLogo ? "true" : "false"}
                />
                <div className="flex flex-col gap-2">
                  <label htmlFor="business-name" className="text-sm font-medium">
                    {t("restaurantName")}
                  </label>
                  <Input
                    id="business-name"
                    name="name"
                    defaultValue={organization.name}
                    required
                    maxLength={80}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="business-address" className="text-sm font-medium">
                    {t("address")}
                  </label>
                  <TextArea
                    id="business-address"
                    name="address"
                    defaultValue={organization.address}
                    rows={2}
                    maxLength={300}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">{t("logo")}</label>
                  <div
                    className={cn(
                      "relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden flex flex-col items-center justify-center min-h-[200px]",
                      isDragging
                        ? "border-primary-foreground bg-primary-foreground/10"
                        : imagePreview
                          ? "border-transparent"
                          : "border-muted-foreground/30 hover:border-primary/50 bg-muted/10",
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full min-h-[200px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Logo"
                          className="absolute inset-0 w-full h-full object-contain p-4"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 group">
                          <span className="text-white font-medium text-sm bg-black/50 px-3 py-1.5 rounded-full z-10 transition-transform group-hover:scale-105">
                            {t("changeImage")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview(null);
                            setRemoveLogo(true);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 hover:bg-destructive/90 transition-colors shadow-sm z-10"
                          title={t("removeImage")}
                        >
                          <X className="w-3.5 h-3.5" weight="bold" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
                        {isDragging ? (
                          <UploadSimple
                            className="w-10 h-10 text-primary"
                            weight="bold"
                          />
                        ) : (
                          <UploadSimple className="w-10 h-10 text-muted-foreground/70" />
                        )}
                        <p className="text-sm font-medium text-foreground">
                          {t("dragOrClick")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("maxFileSize")}
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      id="business-logo"
                      name="logo"
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error(t("imageTooLarge"));
                            e.target.value = "";
                            return;
                          }
                          setRemoveLogo(false);
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setImagePreview(e.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
                {businessState.error && (
                  <p className="text-sm text-destructive font-medium">
                    {businessState.error}
                  </p>
                )}
                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isBusinessPending} className="w-full sm:w-auto font-semibold px-8">
                    {t("save")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 w-full min-w-0">
          {/* Stripe Settings */}
          <Card>
            <CardHeader className="flex-col items-start pb-4">
              <h3 className="text-lg font-semibold">{t("stripeSettings")}</h3>
              <p className="text-sm text-muted-foreground">Stripe Connect</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{t("stripeNotConnected")}</Badge>
              </div>
              <Button
                variant="outline"
                onClick={() => toast(t("comingSoon") as string)}
                className="w-full sm:w-auto font-semibold"
              >
                {t("connectStripe")}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50 border">
            <CardHeader className="flex-col items-start pb-4">
              <h3 className="text-lg font-semibold text-destructive">
                {t("deleteAccount")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("deleteAccountDescription")}
              </p>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={async () => {
                  await requestAccountDeletionAction();
                  toast.success(t("deletionRequestSent"));
                }}
                className="w-full sm:w-auto font-semibold"
              >
                <WarningCircle className="mr-2" weight="bold" />
                {t("requestDeletion")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
