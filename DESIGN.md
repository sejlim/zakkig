---
name: zakkig
description: "Kontaktloses Bestellen & Bezahlen für moderne Gastronomie"
colors:
  primary: "#000000"
  primary-foreground: "#ffffff"
  background: "#ffffff"
  foreground: "#000000"
  card: "#ffffff"
  card-foreground: "#000000"
  popover: "#ffffff"
  popover-foreground: "#000000"
  secondary: "#f7f7f7"
  secondary-foreground: "#000000"
  muted: "#f7f7f7"
  muted-foreground: "#71717a"
  accent: "#000000"
  accent-foreground: "#ffffff"
  destructive: "#dc2626"
  destructive-foreground: "#ffffff"
  border: "#ebebeb"
  input: "#ebebeb"
  ring: "#000000"
  sidebar: "#000000"
  sidebar-foreground: "#ffffff"
  sidebar-primary: "#ffffff"
  sidebar-primary-foreground: "#000000"
  sidebar-accent: "#2e2e2e"
  sidebar-accent-foreground: "#ffffff"
  sidebar-border: "rgba(255, 255, 255, 0.1)"
typography:
  display:
    fontFamily: "Poppins, ui-sans-serif, sans-serif, system-ui"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Poppins, ui-sans-serif, sans-serif, system-ui"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Poppins, ui-sans-serif, sans-serif, system-ui"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Poppins, ui-sans-serif, sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Poppins, ui-sans-serif, sans-serif, system-ui"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  dialog:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.xl}"
---

# Design System: zakkig

## Overview

**Creative North Star: "Radical Monochrome Precision"**

zakkig represents the intersection between high-performance operational utility and editorial architectural minimalism. Built for high-tempo hospitality environments—from lively bar counters to bustling pizza kitchens and seamless table ordering—the interface delivers instant readability, zero cognitive friction, and unmistakable confidence.

The aesthetic philosophy rejects decorative fluff, low-contrast dark grays, and faux-glassmorphism. Instead, it commits to a bold, uncompromising True Black & White palette (`#000000` / `#ffffff`). Every element has a definitive boundary, purposeful typography, and crisp tactile feedback. All dialogs, sheets, and focused interaction layers invert the visual hierarchy, pulling the user into an immersive, focused cockpit.

**Key Characteristics:**
- **Absolute Contrast:** Deepest black (`#000000`) and pure white (`#ffffff`) as the core aesthetic engine; no dark gray substitutes (`#171717`, `#18181b`).
- **Inverted Modal Architecture:** Dialogs, action drawers, and customization modals are strictly dark surfaces with crisp white typography.
- **Iconographic Discipline:** Exclusively Phosphor Icons (`@phosphor-icons/react`); absolutely zero emojis across code, UI, or communications.
- **Operational Speed:** Clear status badges, immediate touch targets, and persistent sticky carts designed for mobile one-handed guest ordering and kitchen glanceability.

## Colors

The palette is strictly monochromatic and high-contrast, supported only by muted neutrals for borders and secondary metadata, plus a single semantic destructive red.

### Primary
- **Absolute Black** (`#000000` / `oklch(0 0 0)`): The authoritative primary token. Used for primary buttons, inverted dialog containers, dashboard sidebar background, brand headers, and high-impact action badges.
- **Absolute White** (`#ffffff` / `oklch(1 0 0)`): Primary canvas background, inverted dialog typography, and primary button labels.

### Neutral
- **Muted Surface** (`#f7f7f7` / `oklch(0.97 0 0)`): Subtle secondary button backgrounds, input backdrops, and card hover fills.
- **Border & Divider** (`#ebebeb` / `oklch(0.922 0 0)`): Hairline structural separators, table borders, and default card outlines.
- **Subdued Text** (`#71717a` / `oklch(0.556 0 0)`): Helper text, descriptions, tax disclaimers, and timestamps.
- **Dark Sidebar Accent** (`#2e2e2e` / `oklch(0.18 0 0)`): Active item indicators inside the dark dashboard navigation.

### Destructive
- **Destructive Red** (`#dc2626` / `oklch(0.577 0.245 27.325)`): Reserved exclusively for irreversible actions (e.g. deleting categories, cancelling orders, deleting accounts).

### Named Rules
**The True Black Rule.** Never substitute `#000000` with dark charcoal or off-black hex codes (such as `#171717`, `#18181b`, `#121212`, or `zinc-900`). Primary buttons, dark dialogs, sidebar panels, and email highlights must resolve to pure `#000000`.

**The Inverted Dialog Rule.** Every modal, confirmation dialog, and customization sheet across both the guest frontend and merchant dashboard must render on a dark background (`bg-primary text-primary-foreground`) with a dimming overlay (`bg-black/50 backdrop-blur-sm`). No dialog in the application may render with a light background.

## Typography

**Primary Font Family:** `Poppins, ui-sans-serif, sans-serif, system-ui`

**Character:** Geometric, modern, and punchy. Poppins brings architectural weight to bold display headlines while remaining remarkably legible in dense kitchen tickets and ingredient modifier lists.

### Hierarchy
- **Display** (Bold 700, `clamp(2rem, 5vw, 3rem)`, `line-height: 1.1`, `tracking: -0.02em`): Hero headlines on the marketing website and primary dashboard welcome titles.
- **Headline** (SemiBold 600, `1.5rem` / `24px`, `line-height: 1.25`, `tracking: -0.01em`): Category section headers, modal titles, and large KPI metrics.
- **Title** (SemiBold 600, `1.125rem` / `18px`, `line-height: 1.3`): Menu item names, dialog sub-headers, and order ticket numbers.
- **Body** (Regular 400, `0.875rem` / `14px`, `line-height: 1.5`, `max-width: 65ch`): Item descriptions, explanations, and general paragraph content.
- **Label** (Medium 500, `0.75rem` / `12px`, `tracking: 0.05em`, uppercase when tabular): Status badges, table indicators, and metadata tags.

### Named Rules
**The Zero-Emoji Rule.** Emojis are strictly banned from all user-facing copy, code, comments, and commit messages. UI iconography must use Phosphor Icons exclusively.

**The Strict i18n Rule.** Never hardcode text strings in JSX or emails. All user-facing strings must be localized via `next-intl` or centralized translation dictionaries (`t("key")`).

## Layout

- **Spacing Rhythm:** Based on an 8pt spatial grid with a compact base spacing unit (`0.3rem` / `4.8px`). Common paddings: `p-3`, `p-4`, `p-6`.
- **Guest Mobile Frame:** Public guest ordering pages (`to-go`, `to-stay`) are designed mobile-first (`max-w-md` or `max-w-lg` centered container), optimizing for one-handed thumb interaction with sticky bottom navigation.
- **Merchant Dashboard Frame:** Two-column layout with a fixed high-contrast black sidebar (`bg-sidebar`) on desktop and fluid content canvas (`flex-1 p-6 md:p-8`).
- **Availability & Kitchen Terminals:** Glanceable full-screen responsive cards, maximizing horizontal and vertical density for tablet mounting.

## Elevation & Depth

The system uses a flat, border-defined architectural spatial model. Surfaces differentiate themselves through sharp tonal contrast rather than layered elevation shadows.

### Shadow Vocabulary
- **Shadow Zero / Flat** (`none`): Standard state for cards, tables, inputs, and inline controls. Separation is established via `border-border`.
- **Subtle Ambient Lift** (`shadow-xs` / `0 1px 3px rgba(0,0,0,0.05)`): Light floating elevation for interactive menu cards and dropdown menus.
- **Dialog Modal Lift** (`shadow-2xl` / `0 25px 50px -12px rgba(0,0,0,0.5)`): Inverted modal elevation above the dimmed backdrop overlay.

### Named Rules
**The Border-Over-Shadow Rule.** Structural containment must always be achieved through a clean 1px border stroke (`border border-border` or `border border-white/15` on dark surfaces) rather than heavy drop shadows.

## Shapes

- **Base Radius:** `--radius: 1.5rem` (24px).
- **Cards & Modals:** `rounded-xl` (16px) to `rounded-2xl` (20px) for container enclosures.
- **Buttons & Inputs:** `rounded-lg` (8px to 12px) for form elements; `rounded-full` for pills and quick-action chips.
- **Item Image Banner:** Full-width top banner with `overflow-hidden`, perfectly clipped to the container top corners with `object-cover`.

## Components

### Buttons
- **Primary Button:** `bg-black text-white hover:opacity-90 active:scale-[0.98] transition-all rounded-lg font-medium px-4 py-2` (or `rounded-full` for pill CTAs).
- **Secondary Button:** `bg-secondary text-secondary-foreground hover:bg-muted active:scale-[0.98] rounded-lg px-4 py-2`.
- **Inverted Action Button (inside Dark Modals):** `bg-white text-black hover:bg-zinc-100 font-semibold rounded-xl px-5 py-3.5`.
- **Destructive Button:** `bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg px-4 py-2`.

### Inverted Dialogs & Sheets
- **Container:** `bg-primary text-primary-foreground border border-white/15 rounded-2xl shadow-2xl p-6 max-w-lg`.
- **Overlay:** `fixed inset-0 bg-black/50 backdrop-blur-xs`.
- **Header:** High-contrast white title with close button (`CaretDown` / `X` icon in `16px`, `weight="bold"`).
- **Footer:** Bottom action bar with border divider `border-white/10`, hosting full-width action buttons with left-aligned label and right-aligned dynamic price.

### Floating Cart Banner (Guest Ordering)
- **Container:** `fixed bottom-4 left-4 right-4 max-w-lg mx-auto bg-black text-white rounded-full p-2 pl-4 pr-3 flex items-center justify-between shadow-xl z-40`.
- **Item Badge:** Small pill badge beside the cart icon indicating item count.
- **Title:** Centered "Zum Warenkorb" label between icon and price.
- **Visibility:** Automatically hidden when cart is empty; mounts smoothly when `itemCount > 0`.

### Menu & Availability Item Cards
- **Image Banner:** Full-width `h-40 sm:h-48` top image with `object-cover` and `overflow-hidden`.
- **Sold-out State:** Deactivated or unavailable items automatically transition to `grayscale opacity-75` with line-through text.
- **Guest Ordering Action Button:** Large full-width pill button (`rounded-full h-11 sm:h-12 w-full px-4 sm:px-5 flex items-center justify-between`) uniting the add action with the price. The left side holds the `<Plus>` icon, *"Hinzufügen"* label, and quantity badge; the right side displays the formatted price (including dynamic *"ab"* prefix for customizable items).

### Email Templates
- **Canvas:** `#f4f4f5` outer background, `#ffffff` card container (`border-radius: 24px`).
- **Brand Header:** Center-aligned or left-aligned `https://www.zakkig.de/full.svg` brand logo (`height: 56px`).
- **Headline & Links:** `#000000` bold typography, underlined links.
- **Code Box:** `#000000` rounded container (`border-radius: 16px`) with crisp `#ffffff` 48px tracked digits.
- **Action Button:** `#000000` rounded button with white text.

## Do's and Don'ts

### Do:
- **Do** use `#000000` and `#ffffff` as the unambiguous foundation for all primary UI surfaces.
- **Do** ensure every dialog, modal, and customization bottom sheet uses the inverted dark theme (`bg-black text-white`).
- **Do** use `@phosphor-icons/react` icons exclusively with standard weights (`regular` or `bold`).
- **Do** position toast notifications strictly at `top-center`.
- **Do** keep form error messages left-aligned with `text-destructive text-sm font-medium` without alert boxes or icons.
- **Do** format all guest ordering prices with proper localization (e.g. `12,50 €`).
- **Do** render item images in availability and menu screens as full-width top banner cards (`object-cover`).

### Don't:
- **Don't** use emojis anywhere in the codebase, UI, comments, or documentation.
- **Don't** introduce dark charcoal values like `#171717`, `#18181b`, or `zinc-900` for primary black elements.
- **Don't** render light-themed dialogs or modals anywhere in the application.
- **Don't** hardcode language strings directly in JSX or templates; always use `t("key")`.
- **Don't** use arrow icons next to prices in the floating cart banner.
- **Don't** add decorative AI comment dividers (`// ──────...──────`) or temporary debug logs.
- **Don't** allow client components to call mutating Convex functions directly without going through Server Actions.
