"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Minus, ShoppingCart, ArrowLeft } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { getImagePreviewUrl } from "@/lib/convex/client";
import { useCartStore } from "@/store/cart-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartSheet } from "@/components/guest/cart-sheet";
import { OrderTracker } from "@/components/guest/order-tracker";
import { LanguageSwitcher } from "@/components/language-switcher";
import Image from "next/image";
import { CustomizationModal } from "@/components/guest/customization-modal";
import { cn, hasPaidCustomizations } from "@/lib/utils";
import { Storefront } from "@phosphor-icons/react/dist/ssr";
import type { Organization, MenuCategory, MenuItem, Order } from "@/lib/types";

interface GuestFrontendProps {
  organization: Organization;
  categories: MenuCategory[];
  items: MenuItem[];
  type: "dine-in" | "takeaway";
  tableNumber?: string;
  orderId?: string;
  initialOrder?: Order | null;
}

function GuestHeader({
  organization,
  type,
  tableNumber,
}: {
  organization: Organization;
  type: string;
  tableNumber?: string;
}) {
  const { t } = useTranslation();
  const orderingSubtitle =
    type === "takeaway"
      ? t("titleToGo")
      : tableNumber
      ? t("titleToStay", { table: tableNumber })
      : t("titleToStayNoTable");

  return (
    <header className="bg-primary text-primary-foreground relative z-20 flex flex-col items-center px-4 pt-4 pb-6 shrink-0">
      <div className="max-w-[500px] w-full flex flex-col items-stretch">
        {/* Lieferando-style Hero Banner Box with Bottom-Left Logo Box */}
        <div className="relative w-full aspect-[2.3/1] rounded-[22px] sm:rounded-[26px] overflow-hidden bg-black border border-white/15 shadow-sm">
          {organization.bannerFileId ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={getImagePreviewUrl(organization.bannerFileId)}
              alt={organization.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-black" />
          )}

          {/* Bottom Row: Logo Box (Left), Language Switcher (Right) */}
          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-10 flex items-end justify-between gap-2">
            {/* Left: Logo Box */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-900 rounded-[10px] sm:rounded-[12px] border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
              {organization.logoFileId ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getImagePreviewUrl(organization.logoFileId)}
                  alt={organization.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-900" />
              )}
            </div>

            {/* Right: Language Switcher */}
            <div className="shrink-0 flex items-center justify-end">
              <LanguageSwitcher
                variant="default"
                className="h-9 text-xs font-semibold tracking-wide uppercase bg-primary text-primary-foreground flex items-center justify-center gap-1.5 px-3.5 rounded-full border border-primary-foreground/20 hover:bg-neutral-800 hover:text-primary-foreground shrink-0 shadow-sm transition-colors cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div id="header-text" className="w-full mt-3.5 flex flex-col">
          <p className="text-sm sm:text-base font-semibold text-primary-foreground leading-snug mb-1">
            {orderingSubtitle}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary-foreground leading-tight">
            {organization.name}
          </h1>
          {organization.address && (
            <p className="text-xs sm:text-sm text-primary-foreground/75 font-medium mt-1 whitespace-pre-wrap">
              {organization.address}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

function GuestOrderSuccess({
  orderNumber,
  setDineInSuccess,
}: {
  orderNumber: string;
  setDineInSuccess: (val: null) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <header className="p-6 text-center text-primary-foreground shrink-0 max-w-[500px] mx-auto w-full">
        <h2 className="text-xl font-bold tracking-tight">zakkig</h2>
      </header>
      <div className="flex-1 bg-background text-foreground rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-6 md:my-4 max-w-[500px] mx-auto w-full border-t md:border border-primary-foreground/10">
        <div className="h-24 w-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">{t("orderPlaced")}</h1>
        <div>
          <p className="text-muted-foreground mb-2">{t("yourOrderNumber")}</p>
          <div className="text-6xl font-black tracking-wider text-primary tabular-nums">
            {orderNumber}
          </div>
        </div>
        <div className="bg-muted/50 p-4 rounded-xl w-full max-w-xs mt-4 border">
          <p className="font-medium text-sm">{t("waitAtTable")}</p>
        </div>
        <Button
          variant="outline"
          className="mt-6 font-semibold"
          onClick={() => {
            setDineInSuccess(null);
            useCartStore.getState().clearCart();
          }}
        >
          {t("orderAgain" as any) || "Neue Bestellung"}
        </Button>
      </div>
    </div>
  );
}

function GuestMenu({
  categories,
  items,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
}) {
  const { t } = useTranslation();
  const { items: cartItems, addItem, updateQuantity } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.$id || "");
  const [customizationItem, setCustomizationItem] = useState<MenuItem | null>(null);

  const [isSticky, setIsSticky] = useState(false);

  const isClickScrolling = useRef(false);
  const clickScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const categoryNavRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isClickScrolling.current) return;
      
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 20) {
        if (categories.length > 0) {
          setActiveCategory(categories[categories.length - 1].$id);
          return;
        }
      }

      let currentActiveId = categories[0]?.$id;
      for (const category of categories) {
        const el = document.getElementById(category.$id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 90) {
            currentActiveId = category.$id;
          }
        }
      }
      if (currentActiveId) setActiveCategory(currentActiveId);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [categories]);

  useEffect(() => {
    if (activeCategory && categoryNavRef.current) {
      const activeBtn = categoryNavRef.current.querySelector(`[data-category-id="${activeCategory}"]`) as HTMLElement;
      if (activeBtn) {
        const container = categoryNavRef.current;
        const scrollLeft = activeBtn.offsetLeft - container.offsetWidth / 2 + activeBtn.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
    }
  }, [activeCategory]);

  const scrollToCategory = (id: string) => {
    isClickScrolling.current = true;
    setActiveCategory(id);
    if (clickScrollTimeout.current) clearTimeout(clickScrollTimeout.current);
    clickScrollTimeout.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 1000);

    const el = document.getElementById(id);
    if (el) {
      const offset = 75;
      const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleAddClick = (item: MenuItem) => {
    if (item.customizations && item.customizations !== "[]") {
      setCustomizationItem(item);
    } else {
      addItem({ id: item.$id, menuItemId: item.$id, name: item.name, price: item.price });
    }
  };

  const handleCustomizationAdd = (item: MenuItem, selections: any[], totalPrice: number) => {
    const confString = selections.map((s: any) => `${s.stepName}:${s.optionName}`).join('|');
    const hash = btoa(encodeURIComponent(confString)).slice(0, 10);
    const cartItemId = `${item.$id}-${hash}`;
    addItem({ id: cartItemId, menuItemId: item.$id, name: item.name, price: totalPrice, customizations: selections });
  };

  return (
    <>
      <div ref={sentinelRef} className="h-px w-full pointer-events-none -mb-px" />
      <div 
        id="category-nav"
        className={cn(
          "sticky top-0 z-30 w-full bg-background border-b border-border shadow-xs overflow-hidden transition-all duration-150",
          isSticky ? "rounded-none" : "rounded-t-[1.5rem]"
        )}
      >
        <div
          ref={categoryNavRef}
          className="overflow-x-auto no-scrollbar overscroll-x-contain px-4 py-3 sm:py-3.5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex gap-2 min-w-max">
            {categories.map((c) => (
              <button
                key={c.$id}
                data-category-id={c.$id}
                onClick={() => scrollToCategory(c.$id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors border cursor-pointer",
                  activeCategory === c.$id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border hover:bg-muted"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 md:p-6 pb-28 md:pb-32 space-y-10">
        {categories.map((category) => {
          const categoryItems = items.filter((i) => i.categoryId === category.$id);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.$id} id={category.$id} className="space-y-4 scroll-mt-20">
              <h2 className="text-2xl font-bold">{category.name}</h2>
              <div className="space-y-4">
                {categoryItems.map((item) => {
                  const itemCartItems = cartItems.filter((i) => i.menuItemId === item.$id);
                  const totalQuantity = itemCartItems.reduce((acc, curr) => acc + curr.quantity, 0);

                  return (
                    <Card
                      key={item.$id}
                      className="overflow-hidden shadow-sm hover:shadow-md transition-shadow p-0 gap-0"
                    >
                      {item.imageId && (
                        <div className="relative w-full h-48 bg-muted">
                          <Image
                            src={getImagePreviewUrl(item.imageId)}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 500px"
                          />
                        </div>
                      )}
                      <div className="p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-lg leading-tight break-words">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 break-words">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 relative">
                          <Button
                            size="lg"
                            className="w-full rounded-full h-11 sm:h-12 px-4 sm:px-5 flex items-center justify-between font-bold text-sm sm:text-base cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                            onClick={() => handleAddClick(item)}
                          >
                            <div className="flex items-center justify-center shrink-0">
                              <Plus weight="bold" className="h-[18px] w-[18px]" />
                            </div>

                            <span className="font-bold text-sm sm:text-base truncate text-center flex-1 px-3">
                              {t("addToCart")}
                            </span>

                            <span className="font-bold text-sm sm:text-base tabular-nums shrink-0">
                              {hasPaidCustomizations(item.customizations)
                                ? t("fromPrice", { price: formatPrice(item.price) })
                                : formatPrice(item.price)}
                            </span>
                          </Button>

                          {totalQuantity > 0 && (
                            <span
                              className={cn(
                                "absolute -top-1.5 -right-1 h-5 rounded-full bg-primary text-primary-foreground border-2 border-background text-[11px] font-extrabold flex items-center justify-center leading-none shadow-md tabular-nums pointer-events-none",
                                totalQuantity > 9
                                  ? "min-w-5 px-1.5"
                                  : "w-5 aspect-square p-0"
                              )}
                            >
                              {totalQuantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      <CustomizationModal
        item={customizationItem}
        open={!!customizationItem}
        onOpenChange={(open) => !open && setCustomizationItem(null)}
        onAddToCart={handleCustomizationAdd}
      />
    </>
  );
}

function CartHeader({
  onBack,
}: {
  onBack: () => void;
}) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border shrink-0">
      <div className="max-w-[500px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            onClick={onBack}
            className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-neutral-800 shadow-sm transition-colors shrink-0 cursor-pointer"
            aria-label={t("backToMenu")}
          >
            <ArrowLeft weight="bold" className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {t("cart")}
          </h1>
        </div>

        <LanguageSwitcher
          variant="default"
          size="lg"
          className="h-9 px-3.5 text-xs font-bold tracking-wide uppercase bg-primary text-primary-foreground rounded-full hover:bg-neutral-800 hover:text-primary-foreground shadow-sm transition-colors cursor-pointer border-0 shrink-0"
        />
      </div>
    </header>
  );
}

function GuestCart({
  setActiveTab,
}: {
  setActiveTab: (tab: "menu" | "cart") => void;
}) {
  const { t } = useTranslation();
  const { items: cartItems, updateQuantity } = useCartStore();

  return (
    <div className="space-y-6">
      {cartItems.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
          <ShoppingCart weight="bold" className="h-12 w-12 text-foreground" />
          <p className="font-semibold text-foreground text-base sm:text-lg">
            {t("emptyCart")}
          </p>
          <Button
            size="lg"
            className="mt-2 rounded-full font-bold h-12 px-8 text-base shadow-md bg-primary text-primary-foreground hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center"
            onClick={() => {
              setActiveTab("menu");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <ArrowLeft weight="bold" className="mr-2.5 h-5 w-5" />
            <span>{t("backToMenu")}</span>
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="py-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-snug break-words">{item.name}</h3>
                {item.customizations && item.customizations.length > 0 && (
                  <div className="flex flex-col items-start gap-1 mt-1.5">
                    {item.customizations.map((c, cIdx) => (
                      <span
                        key={cIdx}
                        className="inline-block max-w-full text-xs leading-normal text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/40 break-words"
                      >
                        {c.stepName ? (
                          <span className="font-medium text-foreground/80">
                            {c.stepName}:{" "}
                          </span>
                        ) : null}
                        <span>{c.optionName}</span>
                        {typeof c.extraPrice === "number" && c.extraPrice > 0 && (
                          <>
                            {" "}
                            <span className="text-muted-foreground/80 font-normal whitespace-nowrap">
                              (+{formatPrice(c.extraPrice)})
                            </span>
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <span className="text-sm font-bold text-primary tabular-nums text-right leading-snug">
                  {formatPrice(item.price * item.quantity)}
                </span>

                <div className="flex items-center gap-1 bg-muted/80 p-1 h-9 rounded-full border border-border/60 shrink-0">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full cursor-pointer hover:bg-background"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus weight="bold" className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs font-bold tabular-nums min-w-[14px] text-center px-0.5">
                    {item.quantity}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full cursor-pointer hover:bg-background"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus weight="bold" className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LieferandoCartBanner({
  onOpenCart,
}: {
  onOpenCart: () => void;
}) {
  const { t } = useTranslation();
  const { items, itemCount, total } = useCartStore();
  const count = itemCount();

  if (count === 0 || items.length === 0) {
    return null;
  }

  return (
    <aside
      aria-label={t("cart")}
      className="fixed bottom-4 left-0 right-0 z-40 flex items-center justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="w-full max-w-[500px] px-4 flex justify-center">
        <button
          type="button"
          id="floating-cart-banner"
          onClick={onOpenCart}
          className="pointer-events-auto w-full h-12 bg-primary text-primary-foreground rounded-full shadow-2xl border border-primary-foreground/20 px-5 flex items-center justify-between hover:bg-neutral-800 hover:text-primary-foreground active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <ShoppingCart weight="bold" className="h-[18px] w-[18px]" />
            <span className="absolute -top-1.5 -right-2 w-4 h-4 min-w-4 aspect-square rounded-full bg-primary-foreground text-primary text-[10px] font-extrabold flex items-center justify-center leading-none shadow-sm tabular-nums p-0">
              {count}
            </span>
          </div>

          <span className="font-bold text-base truncate text-center flex-1 px-3">
            {t("viewCart")}
          </span>

          <span className="font-bold text-base tabular-nums shrink-0">
            {formatPrice(total())}
          </span>
        </button>
      </div>
    </aside>
  );
}

export function GuestFrontend({
  organization,
  categories,
  items,
  type,
  tableNumber,
  orderId,
  initialOrder,
}: GuestFrontendProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const { items: cartItems, total } = useCartStore();

  const [activeTab, setActiveTab] = useState<"menu" | "cart">("menu");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [dineInSuccess, setDineInSuccess] = useState<{
    orderNumber: string;
  } | null>(null);

  const cartScrollRef = useRef<HTMLElement>(null);
  const [hasScrollBelow, setHasScrollBelow] = useState(false);

  const checkCartScroll = useCallback(() => {
    const el = cartScrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollHeight > el.clientHeight + 2;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 4;
    setHasScrollBelow(hasOverflow && !isAtBottom);
  }, []);

  useEffect(() => {
    if (activeTab !== "cart") return;

    checkCartScroll();
    const timeout = setTimeout(checkCartScroll, 60);

    const el = cartScrollRef.current;
    if (!el) return () => clearTimeout(timeout);

    const resizeObserver = new ResizeObserver(() => {
      checkCartScroll();
    });
    resizeObserver.observe(el);

    return () => {
      clearTimeout(timeout);
      resizeObserver.disconnect();
    };
  }, [activeTab, cartItems, checkCartScroll]);

  useEffect(() => {
    const orgName = organization.name;
    if (orderId && type === "takeaway") {
      document.title = `zakkig: ${t("orderStatus")} - ${orgName}`;
      return;
    }
    const prefix =
      type === "takeaway"
        ? t("titleToGo")
        : tableNumber
        ? t("titleToStay", { table: tableNumber })
        : t("titleToStayNoTable");
    document.title = `zakkig: ${prefix} ${orgName}`;
  }, [locale, organization.name, type, tableNumber, orderId, t]);

  if (orderId && type === "takeaway") {
    return (
      <OrderTracker
        orderId={orderId}
        organization={organization}
        initialOrder={initialOrder}
      />
    );
  }

  if (dineInSuccess && type === "dine-in") {
    return (
      <GuestOrderSuccess
        orderNumber={dineInSuccess.orderNumber}
        setDineInSuccess={setDineInSuccess}
      />
    );
  }

  return (
    <>
      {activeTab === "cart" ? (
        <div className="h-dvh bg-primary text-foreground flex flex-col items-center overflow-hidden">
          <div className="w-full max-w-[500px] bg-background h-full flex flex-col shadow-2xl overflow-hidden">
            <CartHeader
              onBack={() => {
                setActiveTab("menu");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            <main
              ref={cartScrollRef}
              onScroll={checkCartScroll}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-6 py-4"
            >
              <GuestCart
                setActiveTab={setActiveTab}
              />
            </main>

            {cartItems.length > 0 && (
              <footer
                className={cn(
                  "shrink-0 border-t border-border bg-background px-4 md:px-6 py-4 pb-6 transition-shadow duration-200",
                  hasScrollBelow
                    ? "shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
                    : "shadow-none"
                )}
              >
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base sm:text-lg font-bold">
                      {t("total")}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {t("taxNote")}
                    </span>
                  </div>
                  <span className="text-base sm:text-lg font-bold tabular-nums">
                    {formatPrice(total())}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="w-full mt-3 rounded-full font-bold h-12 text-base shadow-md bg-primary text-primary-foreground hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer"
                  onClick={() => setCheckoutOpen(true)}
                >
                  {t("checkout")}
                </Button>
              </footer>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col min-h-screen bg-primary overflow-x-clip">
          <GuestHeader
            organization={organization}
            type={type}
            tableNumber={tableNumber}
          />

          {/* Main Section as rounded white Card inside dark canvas */}
          <div className="flex-1 bg-background text-foreground shadow-2xl flex flex-col max-w-[500px] mx-auto w-full rounded-t-[1.5rem]">
            <GuestMenu
              categories={categories}
              items={items}
            />
          </div>

          <LieferandoCartBanner
            onOpenCart={() => {
              setActiveTab("cart");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}

      <CartSheet
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        organization={organization}
        type={type}
        tableNumber={tableNumber}
        onOrderSuccess={(orderId, orderNumber) => {
          setCheckoutOpen(false);
          useCartStore.getState().clearCart();
          if (type === "takeaway") {
            router.push(`/to-go/${organization.$id}?order=${orderId}`);
          } else {
            setDineInSuccess({ orderNumber });
          }
        }}
      />
    </>
  );
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 256 256" {...props}>
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
    </svg>
  );
}
