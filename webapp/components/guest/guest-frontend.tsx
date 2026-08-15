"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus, ShoppingCart, ForkKnife, ShoppingBag, PicnicTable } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useTranslation, formatPrice } from "@/lib/i18n";
import { getImagePreviewUrl } from "@/lib/appwrite/client";
import { useCartStore } from "@/store/cart-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CartSheet } from "@/components/guest/cart-sheet";
import { OrderTracker } from "@/components/guest/order-tracker";
import { LanguageSwitcher } from "@/components/language-switcher";
import Image from "next/image";
import { CustomizationModal } from "@/components/guest/customization-modal";
import { cn } from "@/lib/utils";
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
  const orderingBadgeText =
    type === "takeaway"
      ? t("titleToGo" as any)
      : `${t("titleToStay" as any)} ${tableNumber || ""}`;

  const OrderingIcon = type === "takeaway" ? ShoppingBag : PicnicTable;

  return (
    <header className="bg-primary text-primary-foreground relative z-20 flex flex-col items-center px-4 pt-5 pb-6 shrink-0">
      <div className="max-w-sm w-full flex flex-col items-stretch">
        {organization.logoFileId ? (
          <div className="w-full relative rounded-2xl overflow-hidden bg-white shadow-sm flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImagePreviewUrl(organization.logoFileId)}
              alt={organization.name}
              className="w-full h-auto object-contain rounded-2xl p-2.5 max-h-[360px]"
            />
          </div>
        ) : (
          <div className="w-full py-6 flex items-center justify-center text-center">
            <h2 className="text-3xl font-black tracking-tight text-primary-foreground">
              {organization.name}
            </h2>
          </div>
        )}

        <div id="header-text" className="w-full mt-3 flex items-center gap-2">
          <span className="flex-1 text-xs font-semibold tracking-wide uppercase text-primary-foreground flex items-center justify-center gap-2 bg-transparent px-4 py-2.5 rounded-full border border-primary-foreground/20 truncate whitespace-nowrap min-w-0">
            <OrderingIcon weight="bold" className="h-4 w-4 shrink-0" />
            <span className="truncate">{orderingBadgeText}</span>
          </span>
          <LanguageSwitcher
            variant="ghost"
            className="h-auto text-xs font-semibold tracking-wide uppercase text-primary-foreground flex items-center justify-center gap-1.5 bg-transparent px-3.5 py-2.5 rounded-full border border-primary-foreground/20 hover:bg-primary-foreground/15 shrink-0"
          />
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
      <header className="p-6 text-center text-primary-foreground shrink-0">
        <h2 className="text-xl font-bold tracking-tight">zakkig</h2>
      </header>
      <div className="flex-1 bg-background text-foreground rounded-t-[2rem] md:rounded-[2rem] shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-6 md:my-4 md:max-w-md md:mx-auto w-full border-t md:border border-primary-foreground/10">
        <div className="h-24 w-24 bg-emerald-500/15 text-emerald-600 rounded-full flex items-center justify-center mb-2">
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
  isSticky,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  isSticky: boolean;
}) {
  const { t } = useTranslation();
  const { items: cartItems, addItem, updateQuantity } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.$id || "");
  const [customizationItem, setCustomizationItem] = useState<MenuItem | null>(null);

  const isClickScrolling = useRef(false);
  const clickScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const categoryNavRef = useRef<HTMLDivElement | null>(null);

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
          if (rect.top <= 130) {
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
      const y = el.getBoundingClientRect().top + window.scrollY - 70;
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
      <div 
        id="category-nav"
        ref={categoryNavRef}
        className={cn(
          "sticky top-0 z-30 bg-background border-b border-border px-4 md:px-6 overflow-x-auto no-scrollbar scroll-smooth transition-all duration-150",
          isSticky ? "rounded-none pt-3.5 pb-3.5" : "rounded-t-[2.5rem] pt-7 pb-4"
        )}
      >
        <div className="flex gap-2 min-w-max">
          {categories.map((c) => (
            <button
              key={c.$id}
              data-category-id={c.$id}
              onClick={() => scrollToCategory(c.$id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
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
      
      <div className="p-4 md:p-6 pb-28 md:pb-32 space-y-10">
        {categories.map((category) => {
          const categoryItems = items.filter((i) => i.categoryId === category.$id);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.$id} id={category.$id} className="space-y-4 scroll-m-24">
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
                          <h3 className="font-semibold text-lg leading-tight">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-bold">
                              {formatPrice(item.price)}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            className="rounded-full px-4"
                            onClick={() => handleAddClick(item)}
                          >
                            <Plus weight="bold" className="mr-1" /> {t("addToCart")}
                            {totalQuantity > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-2 px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-primary-foreground text-primary border-none font-bold shadow-sm rounded-full"
                              >
                                {totalQuantity}
                              </Badge>
                            )}
                          </Button>
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

function GuestCart({
  setActiveTab,
  setCheckoutOpen,
}: {
  setActiveTab: (tab: "menu" | "cart") => void;
  setCheckoutOpen: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const { items: cartItems, updateQuantity, total } = useCartStore();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t("cart")}</h2>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>{t("emptyCart")}</p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => setActiveTab("menu")}
          >
            {t("menuTab")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-border">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                  {item.customizations && item.customizations.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.customizations
                        .map((c) => `${c.stepName}: ${c.optionName}`)
                        .join(", ")}
                    </p>
                  )}
                  <p className="text-sm font-bold mt-1 text-primary">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-muted/80 p-1 rounded-full border shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs font-bold w-4 text-center">
                    {item.quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="space-y-2">
            <div className="flex justify-between text-base font-bold">
              <span>{t("total")}</span>
              <span>{formatPrice(total())}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("taxNote")}
            </p>
          </div>

          <Button
            size="lg"
            className="w-full mt-6 rounded-full font-bold h-12 text-base shadow-md"
            onClick={() => setCheckoutOpen(true)}
          >
            {t("checkout")}
          </Button>
        </div>
      )}
    </div>
  );
}

function GuestBottomNav({
  activeTab,
  setActiveTab,
}: {
  activeTab: "menu" | "cart";
  setActiveTab: (tab: "menu" | "cart") => void;
}) {
  const { t } = useTranslation();
  const { itemCount } = useCartStore();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none flex items-center justify-center">
      <div className="bg-primary text-primary-foreground rounded-full border border-primary-foreground/20 p-1.5 flex items-center gap-1.5 pointer-events-auto max-w-sm w-full shadow-lg">
        {/* Menu Tab */}
        <button
          id="tab-menu"
          type="button"
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full transition-all text-xs font-semibold tracking-wide uppercase",
            activeTab === "menu"
              ? "bg-primary-foreground text-primary shadow-sm"
              : "text-primary-foreground hover:bg-primary-foreground/15",
          )}
          onClick={() => {
            setActiveTab("menu");
            setTimeout(() => {
              const el = document.getElementById("header-text");
              if (el) {
                const y =
                  el.getBoundingClientRect().top + window.scrollY - 10;
                window.scrollTo({ top: y, behavior: "smooth" });
              }
            }, 50);
          }}
        >
          <ForkKnife
            weight={activeTab === "menu" ? "fill" : "regular"}
            className="h-4 w-4 shrink-0"
          />
          <span>{t("menuTab")}</span>
        </button>

        {/* Cart Tab */}
        <button
          id="tab-cart"
          type="button"
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-full transition-all text-xs font-semibold tracking-wide uppercase relative",
            activeTab === "cart"
              ? "bg-primary-foreground text-primary shadow-sm"
              : "text-primary-foreground hover:bg-primary-foreground/15",
          )}
          onClick={() => setActiveTab("cart")}
        >
          <ShoppingCart
            weight={activeTab === "cart" ? "fill" : "regular"}
            className="h-4 w-4 shrink-0"
          />
          <span>{t("cartTab")}</span>
          {itemCount() > 0 && (
            <Badge
              className={cn(
                "px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center border-none font-bold text-xs shadow-sm",
                activeTab === "cart"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary-foreground text-primary",
              )}
            >
              {itemCount()}
            </Badge>
          )}
        </button>
      </div>
    </div>
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
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"menu" | "cart">("menu");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [dineInSuccess, setDineInSuccess] = useState<{
    orderNumber: string;
  } | null>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const headerEl = document.getElementById("header-text");
      if (headerEl) {
        const rect = headerEl.getBoundingClientRect();
        setIsSticky(rect.bottom <= 0);
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className="flex flex-col min-h-screen bg-primary">
      <GuestHeader
        organization={organization}
        type={type}
        tableNumber={tableNumber}
      />

      {/* Main Section as rounded white Card inside dark canvas */}
      <div
        className={cn(
          "flex-1 bg-background text-foreground shadow-2xl flex flex-col md:max-w-2xl md:mx-auto w-full transition-all duration-150",
          isSticky ? "rounded-none" : "rounded-t-[2.5rem]"
        )}
      >
        {activeTab === "menu" ? (
          <GuestMenu categories={categories} items={items} isSticky={isSticky} />
        ) : (
          <main className="flex-1 px-4 md:px-6 pt-7 md:pt-8 pb-28 md:pb-32">
            <GuestCart
              setActiveTab={setActiveTab}
              setCheckoutOpen={setCheckoutOpen}
            />
          </main>
        )}
      </div>

      <GuestBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

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
    </div>
  );
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 256 256" {...props}>
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm45.66,85.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
    </svg>
  );
}
