"use client";

import { useTransition, Fragment, useState } from "react";
import { Copy, ArrowsClockwise, QrCode, WarningCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReactQRCode } from "@lglab/react-qr-code";
import { generateAvailabilitySessionAction } from "@/actions/availability-actions";
import { generateOrderSessionAction } from "@/actions/order-actions";

export function SessionsOverviewCard({
  availabilityToken,
  orderToken,
  organizationId,
  baseUrl,
}: {
  availabilityToken: string;
  orderToken: string;
  organizationId: string;
  baseUrl: string;
}) {
  const { t } = useTranslation();
  const [isPending, startTransition] = useTransition();

  const [availabilityQrOpen, setAvailabilityQrOpen] = useState(false);
  const [orderQrOpen, setOrderQrOpen] = useState(false);
  const [regenerateAvailabilityOpen, setRegenerateAvailabilityOpen] = useState(false);
  const [regenerateOrderOpen, setRegenerateOrderOpen] = useState(false);

  const getLink = (path: string, token: string) => `${baseUrl}/${path}/${organizationId}?token=${token}`;

  function copyLinkText(path: string, token: string) {
    const link = getLink(path, token);
    navigator.clipboard.writeText(link);
    toast.success(t("linkCopied"));
  }

  function confirmRegenerateAvailability() {
    startTransition(async () => {
      const result = await generateAvailabilitySessionAction(organizationId);
      if (result.success && result.session) {
        toast.success(t("regeneratedAvailability"));
      } else if (result.error) {
        toast.error(result.error);
      }
      setRegenerateAvailabilityOpen(false);
    });
  }

  function confirmRegenerateOrder() {
    startTransition(async () => {
      const result = await generateOrderSessionAction(organizationId);
      if (result.success && result.session) {
        toast.success(t("regeneratedOrder"));
      } else if (result.error) {
        toast.error(result.error);
      }
      setRegenerateOrderOpen(false);
    });
  }

  return (
    <Fragment>
      {/* Availability Sessions Card */}
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-start justify-between gap-4 w-full">
            <h3 className="text-lg font-semibold leading-tight tracking-tight flex-1">{t("availabilitySessions")}</h3>
            <Dialog open={availabilityQrOpen} onOpenChange={setAvailabilityQrOpen}>
              <DialogTrigger render={<Button variant="default" size="icon" className="shrink-0 rounded-full h-8 w-8" />}>
                <QrCode className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] bg-primary text-primary-foreground border-border/20">
                <DialogHeader>
                  <DialogTitle className="text-primary-foreground text-lg font-bold">{t("availabilitySessions")}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-6 p-6">
                  <a 
                    href={getLink("availability", availabilityToken)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="cursor-pointer [&_image]:invert"
                  >
                    <ReactQRCode
                      value={getLink("availability", availabilityToken)}
                      size={240}
                      level="H"
                      background="transparent"
                      dataModulesSettings={{ color: "#ffffff", style: "square-sm" }}
                      finderPatternOuterSettings={{ color: "#ffffff", style: "square" }}
                      finderPatternInnerSettings={{ color: "#ffffff", style: "square" }}
                      imageSettings={{
                        src: "https://www.zakkig.de/full_qr.png",
                        height: Math.round((50 * 240) / 280),
                        width: Math.round((157 * 240) / 280),
                        excavate: true,
                      }}
                    />
                  </a>
                  <div className="flex items-start gap-2.5 text-xs text-left text-primary-foreground font-medium bg-primary-foreground/10 p-3 rounded-lg w-[240px]">
                    <WarningCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary-foreground" weight="fill" />
                    <span>{t("staffQrWarning")}</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            {t("availabilitySessionsDesc")}
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end gap-3 pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => copyLinkText("availability", availabilityToken)}
              className="w-full sm:flex-1 gap-2"
              disabled={isPending}
            >
              <Copy className="h-4 w-4 shrink-0" weight="bold" />
              <span>{t("copyLink")}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setRegenerateAvailabilityOpen(true)}
              className="w-full sm:flex-1 gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              disabled={isPending}
            >
              <ArrowsClockwise className="h-4 w-4" weight="bold" />
              <span>{t("createSession")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Sessions Card */}
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-start justify-between gap-4 w-full">
            <h3 className="text-lg font-semibold leading-tight tracking-tight flex-1">{t("liveOrderSessions")}</h3>
            <Dialog open={orderQrOpen} onOpenChange={setOrderQrOpen}>
              <DialogTrigger render={<Button variant="default" size="icon" className="shrink-0 rounded-full h-8 w-8" />}>
                <QrCode className="h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] bg-primary text-primary-foreground border-border/20">
                <DialogHeader>
                  <DialogTitle className="text-primary-foreground text-lg font-bold">{t("liveOrderSessions")}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-6 p-6">
                  <a 
                    href={getLink("orders", orderToken)} 
                    target="_blank" 
                    rel="noreferrer"
                    className="cursor-pointer [&_image]:invert"
                  >
                    <ReactQRCode
                      value={getLink("orders", orderToken)}
                      size={240}
                      level="H"
                      background="transparent"
                      dataModulesSettings={{ color: "#ffffff", style: "square-sm" }}
                      finderPatternOuterSettings={{ color: "#ffffff", style: "square" }}
                      finderPatternInnerSettings={{ color: "#ffffff", style: "square" }}
                      imageSettings={{
                        src: "https://www.zakkig.de/full_qr.png",
                        height: Math.round((50 * 240) / 280),
                        width: Math.round((157 * 240) / 280),
                        excavate: true,
                      }}
                    />
                  </a>
                  <div className="flex items-start gap-2.5 text-xs text-left text-primary-foreground font-medium bg-primary-foreground/10 p-3 rounded-lg w-[240px]">
                    <WarningCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary-foreground" weight="fill" />
                    <span>{t("staffQrWarning")}</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1">
            {t("orderSessionsDesc")}
          </p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end gap-3 pt-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => copyLinkText("orders", orderToken)}
              className="w-full sm:flex-1 gap-2"
              disabled={isPending}
            >
              <Copy className="h-4 w-4 shrink-0" weight="bold" />
              <span>{t("copyLink")}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setRegenerateOrderOpen(true)}
              className="w-full sm:flex-1 gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              disabled={isPending}
            >
              <ArrowsClockwise className="h-4 w-4" weight="bold" />
              <span>{t("createSession")}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Regenerate Availability Confirmation Dialog */}
      <Dialog open={regenerateAvailabilityOpen} onOpenChange={setRegenerateAvailabilityOpen}>
        <DialogContent className="bg-primary text-primary-foreground border-border/20">
          <DialogHeader>
            <DialogTitle>{t("regenerateAvailabilityTitle")}</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              {t("regenerateAvailabilityDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-3 mt-2">
            <Button variant="outline" onClick={() => setRegenerateAvailabilityOpen(false)} className="flex-1 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground">
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmRegenerateAvailability} disabled={isPending} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("regenerateConfirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Regenerate Order Confirmation Dialog */}
      <Dialog open={regenerateOrderOpen} onOpenChange={setRegenerateOrderOpen}>
        <DialogContent className="bg-primary text-primary-foreground border-border/20">
          <DialogHeader>
            <DialogTitle>{t("regenerateOrderTitle")}</DialogTitle>
            <DialogDescription className="text-primary-foreground/80">
              {t("regenerateOrderDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex w-full gap-3 mt-2">
            <Button variant="outline" onClick={() => setRegenerateOrderOpen(false)} className="flex-1 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground hover:text-primary-foreground">
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmRegenerateOrder} disabled={isPending} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("regenerateConfirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}
