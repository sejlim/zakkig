"use client";

import { useActionState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea as TextArea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { WarningCircle } from "@phosphor-icons/react";
import { RefreshButton } from "./refresh-button";
import { useTranslation } from "@/lib/i18n";
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

  return (
    <div className="flex-1 space-y-4 max-w-2xl">
      <div className="flex items-center justify-between space-y-2 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("settings")}</h1>
        </div>
        <RefreshButton />
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader className="flex-col items-start">
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
        <CardHeader className="flex-col items-start">
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
            <div className="flex flex-col gap-2">
              <label htmlFor="business-name" className="text-sm font-medium">
                {t("name")}
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
              <label htmlFor="business-logo" className="text-sm font-medium">
                {t("logo")}
              </label>
              <Input
                id="business-logo"
                name="logo"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && file.size > 5 * 1024 * 1024) {
                    toast.error(t("imageTooLarge"));
                    e.target.value = "";
                  }
                }}
              />
            </div>
            {businessState.error && (
              <p className="text-sm text-destructive">{businessState.error}</p>
            )}
            <Button type="submit" disabled={isBusinessPending}>
              {t("save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stripe Settings (Placeholder) */}
      <Card>
        <CardHeader className="flex-col items-start">
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
          >
            {t("connectStripe")}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Danger Zone */}
      <Card className="border-destructive/50 border">
        <CardHeader className="flex-col items-start">
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
          >
            <WarningCircle className="mr-2" />
            {t("requestDeletion")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
