"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus, ShoppingCart, ForkKnife } from "@phosphor-icons/react";
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
  return (
    <header className="bg-primary text-primary-foreground rounded-b-3xl shadow-lg border-b border-primary-foreground/10 relative z-20 overflow-hidden flex flex-col">
      {organization.logoFileId ? (
        <div className="w-full h-40 md:h-48 relative flex-shrink-0">
          <Image src={getImagePreviewUrl(organization.logoFileId)} alt={organization.name} fill className="object-contain p-4" sizes="100vw" />
        </div>
      ) : (
        <div className="w-full py-12 md:py-16 flex items-center justify-center flex-shrink-0 px-4">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-center text-primary">
            {organization.name}
          </h2>
        </div>
      )}
      
      <div id="header-text" className={`flex flex-col items-center justify-center gap-2 ${organization.logoFileId ? 'pt-1 pb-5' : 'pb-6'}`}>
        <span className="text-base font-medium text-primary-foreground text-center">
          {type === "takeaway" ? t("titleToGo" as any) : `${t("titleToStay" as any)} ${tableNumber || ""}`}
        </span>
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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6">
      <div className="h-24 w-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
        <CheckCircle className="h-12 w-12" />
      </div>
      <h1 className="text-3xl font-bold">{t("orderPlaced")}</h1>
      <div>
        <p className="text-muted-foreground mb-2">{t("yourOrderNumber")}</p>
        <div className="text-5xl font-bold tracking-tighter tabular-nums">
          {orderNumber}
        </div>
      </div>
      <div className="bg-muted p-4 rounded-lg w-full max-w-sm mt-8">
        <p className="font-medium">{t("waitAtTable")}</p>
      </div>
      <Button
        variant="outline"
        className="mt-8"
        onClick={() => {
          setDineInSuccess(null);
          useCartStore.getState().clearCart();
        }}
      >
        Neue Bestellung
      </Button>
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
          if (rect.top <= 150) {
            currentActiveId = category.$id;
          } else {
            break;
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
    // Generate a unique ID for this configuration
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
        className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-6 shadow-sm overflow-x-auto no-scrollbar scroll-smooth"
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
      
      <div className="space-y-10">
        {categories.map((category) => {
          const categoryItems = items.filter((i) => i.categoryId === category.$id);
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.$id} id={category.$id} className="space-y-4 scroll-m-40">
              <h2 className="text-2xl font-bold">{category.name}</h2>
              <div className="space-y-4">
                {categoryItems.map((item) => {
                  const itemCartItems = cartItems.filter((i) => i.menuItemId === item.$id);
                  const totalQuantity = itemCartItems.reduce((acc, curr) => acc + curr.quantity, 0);

                  return (
                    <Card key={item.$id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow p-0 gap-0">
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
                      <div className="flex">
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-bold">{formatPrice(item.price)}</span>
                            </div>
                            
                            <Button size="sm" className="rounded-full px-4" onClick={() => handleAddClick(item)}>
                              <Plus weight="bold" className="mr-1" /> {t("addToCart")}
                              {totalQuantity > 0 && <Badge variant="secondary" className="ml-2 px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-primary-foreground text-primary border-none font-bold shadow-sm rounded-full">{totalQuantity}</Badge>}
                            </Button>
                          </div>
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
        <div className="space-y-6">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-background p-4 rounded-lg shadow-sm border"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  {item.customizations && item.customizations.length > 0 && (
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {item.customizations.map((c, i) => (
                        <li key={i}>+ {c.optionName}</li>
                      ))}
                    </ul>
                  )}
                  <div className="text-muted-foreground text-sm mt-1">
                    {formatPrice(item.price)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  <div className="flex items-center gap-3 bg-muted rounded-full p-1">
                    <button
                      type="button"
                      aria-label={t("removeFromCart")}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-background shadow-sm text-foreground"
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      <Minus weight="bold" />
                    </button>
                    <span className="font-medium w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={t("addToCart")}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                    >
                      <Plus weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between items-center text-xl font-bold">
            <span>{t("orderTotal")}</span>
            <span>{formatPrice(total())}</span>
          </div>

          <Button
            className="w-full text-lg py-6"
            size="lg"
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
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex items-stretch justify-between gap-3">
      {/* Left side: Main Nav */}
      <div className="flex-1 bg-primary text-primary-foreground/70 rounded-t-[2.5rem] shadow-[0_-8px_30px_rgba(0,0,0,0.2)] border-t border-x border-primary-foreground/10 pb-safe pb-2 pt-2 px-2 flex pointer-events-auto">
        <button
          type="button"
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-1.5 transition-colors ${activeTab === "menu" ? "text-primary-foreground" : "hover:text-primary-foreground/90"}`}
          onClick={() => {
            setActiveTab("menu");
            setTimeout(() => {
              const el = document.getElementById("header-text");
              if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 10;
                window.scrollTo({ top: y, behavior: "smooth" });
              }
            }, 50);
          }}
        >
          <ForkKnife
            weight={activeTab === "menu" ? "fill" : "regular"}
            className="h-5 w-5"
          />
          <span className="text-[11px] font-semibold tracking-wide uppercase">{t("menuTab")}</span>
        </button>
        <button
          type="button"
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-1.5 relative transition-colors ${activeTab === "cart" ? "text-primary-foreground" : "hover:text-primary-foreground/90"}`}
          onClick={() => setActiveTab("cart")}
        >
          <ShoppingCart
            weight={activeTab === "cart" ? "fill" : "regular"}
            className="h-5 w-5"
          />
          <span className="text-[11px] font-semibold tracking-wide uppercase">{t("cartTab")}</span>
          {itemCount() > 0 && (
            <Badge
              className="absolute top-1 right-[20%] sm:right-[30%] px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center bg-primary-foreground text-primary border-none font-bold shadow-sm"
            >
              {itemCount()}
            </Badge>
          )}
        </button>
      </div>
      
      {/* Right side: Language Switcher */}
      <div className="bg-primary text-primary-foreground/70 rounded-t-[2.5rem] shadow-[0_-8px_30px_rgba(0,0,0,0.2)] border-t border-x border-primary-foreground/10 pb-safe pb-2 pt-2 px-2 flex pointer-events-auto items-center justify-center">
        <LanguageSwitcher className="h-10 px-3 text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10" variant="ghost" />
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
    <div className="flex flex-col min-h-screen bg-muted/10 pb-20">
      <GuestHeader
        organization={organization}
        type={type}
        tableNumber={tableNumber}
      />

      <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
        {activeTab === "menu" ? (
          <GuestMenu categories={categories} items={items} />
        ) : (
          <GuestCart
            setActiveTab={setActiveTab}
            setCheckoutOpen={setCheckoutOpen}
          />
        )}
      </main>

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
