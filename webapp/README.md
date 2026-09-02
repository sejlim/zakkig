# Zakkig Webapp

Dieses Verzeichnis enthält die Haupt-Applikation von Zakkig (das Gastronomen-Dashboard, die Bestell-Oberflächen für Gäste sowie die Kitchen- und Verfügbarkeits-Terminals).

---

## 🏗️ Technologie-Stack

- **Framework:** Next.js (App Router, Server Actions, Server Components, Turbopack)
- **Backend Platform:** Convex (Reaktive Echtzeit-Datenbank, serverseitige Mutations/Queries/Actions, File Storage, Crons & HTTP Endpoints)
- **Authentifizierung:** Convex Auth & SSR Session Management mit HttpOnly-Cookies und E-Mail-OTP
- **E-Mail-Versand:** Hetzner Mailserver (SMTP via `mail.your-server.de`)
- **Zahlungsabwicklung:** Stripe Connect (Destination Charges mit 1% Plattform-Gebühr, Embedded Payment Element)
- **UI & Styling:** Tailwind CSS, Shadcn UI, Phosphor Icons
- **State Management:** Zustand & reaktive Convex Hooks (`useQuery`, `useMutation`)
- **Internationalisierung (i18n):** next-intl (Deutsch & Englisch)

---

## 🔒 Architektur & Authentifizierung

Die Applikation nutzt ein striktes **Server-Side Rendering (SSR) Authentifizierungs-Modell** in Verbindung mit Convex.

- **Sichere HttpOnly-Cookies:** Nach erfolgreicher Anmeldung oder Registrierung setzt der Server ein sicheres `HttpOnly`-Cookie (`zakkig_session`). Clientseitiger JavaScript-Code kann das Cookie nicht auslesen, was effektiven Schutz vor XSS bietet.
- **Zwei-Faktor E-Mail-OTP:** Sowohl bei der Registrierung als auch beim Login wird standardmäßig ein kryptografischer 6-stelliger Einmalcode per E-Mail versendet. Erst nach korrekter Eingabe wird die Sitzung aktiv.
- **Middleware & Session-Validierung:** `webapp/middleware.ts` und serverseitige Helfer in `lib/convex/auth.ts` (`getUser()`, `getAuthenticatedConvexClient()`) validieren bestehende Sessions für geschützte Routen.

---

## 📧 E-Mail-Infrastruktur

Der Versand von Transaktions-E-Mails (Anmeldecodes, Passwort-Resets, Bestätigungen für E-Mail-Änderungen und Account-Löschungen) ist in `convex/emails.ts` implementiert.

- **Primärer Versandweg:** Hetzner SMTP (`mail.your-server.de`, Port 587) mit TLS-Verschlüsselung.
- **Absender-Konfiguration:**
  - **Absender-E-Mail:** `noreply@zakkig.de`
  - **Absender-Name (Deutsch):** `Selim von zakkig`
  - **Absender-Name (Englisch):** `Selim at zakkig`
- **Verschlüsselung:** TLS/STARTTLS über Port 587.

---

## 🗄️ Datenmodell & Schema (`convex/schema.ts`)

Alle Tabellen sind typsicher über Convex definiert:

1. **`users` & `authAccounts`:** Benutzerkonten, Namen, E-Mail-Adressen und gehashte Zugangsdaten.
2. **`organizations`:** Restaurant-Stammdaten (Name, Adresse, Logo-Storage-ID, Owner-ID, Stripe-Verbindungsstatus, Tische, Schalter für Abholung / Tischbestellung).
3. **`menuCategories`:** Speisekarten-Kategorien mit Sortier-Index (`by_organizationId_and_sortOrder`).
4. **`menuItems`:** Gerichte & Getränke mit Preisen in Cent, Bild-Storage-ID, MwSt.-Satz, Verfügbarkeits-Status und JSON-konfigurierten `customizations` (z.B. Größen, Teig, Toppings).
5. **`orders`:** Bestellungen mit rollierender dreistelliger Bestellnummer (`001`–`999`), Bestelltyp (`takeaway` / `dine-in`), Tischnummer, Status (`in_progress`, `completed`, `cancelled`), Gesamtsumme und Gebührenaufschlüsselung.
6. **`orderSessions` & `availabilitySessions`:** Autorisierungs-Token für separate Tablet-Terminals.
7. **`verificationCodes`:** Temporäre Prüfcodes für Login-OTPs, Passwort-Resets und Stammdaten-Änderungen.

---

## ⚡ Reaktives Echtzeit-System (Realtime)

Convex synchronisiert Änderungen automatisch und ohne manuelle WebSocket-Verwaltung an alle aktiven Clients:

- **Kitchen Board (`/dashboard/[orgId]/live-orders` & `/orders/[orgId]`):** Nutzt reaktive `useQuery(api.orders.getLiveOrders)` Subscriptions. Sobald ein Gast bezahlt oder der Status geändert wird, aktualisieren sich alle Displays blitzschnell.
- **Verfügbarkeits-Board (`/availability/[orgId]`):** Kassenpersonal kann Speisen oder Optionen sekundenschnell als ausverkauft schalten (`toggleMenuItemAvailability`). Gäste und Terminals sehen dies sofort im UI.
- **Gast-Bestellverfolgung (`/to-go` & `/to-stay` Tracker):** Der Gast sieht den aktuellen Zubereitungs-Status seiner Bestellung in Echtzeit über `useQuery(api.orders.getOrder)`.

---

## 💳 Zahlungsabwicklung mit Stripe Connect

Zakkig verwendet **Stripe Connect Express** mit **Destination Charges**:

1. **Gastronomen-Onboarding:**
   - Restaurant-Inhaber verbinden im Dashboard unter `/settings` ihr Stripe-Konto über standardisierte Stripe Connect Onboarding Links (`convex/stripe.ts:createStripeConnectAccount`).
   - Sobald das Onboarding abgeschlossen ist, wird `stripeOnboardingComplete: true` in der Organisation hinterlegt.
2. **Checkout & Destination Charges:**
   - Gäste bestellen über `/to-go/[orgId]` (Abholung) oder `/to-stay/[orgId]?table=X` (am Tisch).
   - Beim Öffnen des Checkouts ruft der Client `createPaymentIntent` auf. Die Convex Action berechnet den Betrag, reserviert die 1% Plattform-Gebühr für Zakkig (`application_fee_amount`) und routet den Hauptbetrag per `transfer_data.destination` an das Restaurant.
   - Der Gast bezahlt direkt auf der Seite über das Stripe Payment Element.
3. **Stripe Webhook (`convex/http.ts`):**
   - Stripe sendet das Event `payment_intent.succeeded` an den HTTP-Endpunkt `POST /stripe/webhook`.
   - Die Signatur wird serverseitig via `stripe.webhooks.constructEvent` verifiziert.
   - Bei gültiger Zahlung wird die Bestellung über `api.orders.createPaidOrderFromWebhook` in Convex angelegt und die nächste fortlaufende 3-stellige Tagesnummer vergeben.

---

## 📁 Dateispeicher (Convex Storage)

Logos und Produktbilder werden im nativen Convex File Storage gespeichert:
- Serverseitig: `convex/storage.ts` generiert signierte Upload-URLs (`generateUploadUrl`) und löscht veraltete Dateien (`deleteFile`).
- Clientseitig: `lib/convex/storage.ts` (`uploadFileToConvex`) lädt Bilder direkt via POST-Request in den Storage hoch und speichert die resultierende Storage-ID im Dokument.
- Bildauslieferung: `getImagePreviewUrl` wandelt Storage-IDs in öffentliche CDN-URLs (`${CONVEX_URL}/api/storage/${storageId}`) um.

---

## 🗺️ Routing & Verzeichnisstruktur

```
webapp/
├── actions/             # Next.js Server Actions (Auth, Menu, Orders, Settings, Stripe)
├── app/
│   ├── (auth)/          # Login, Registrierung, Passwort-Reset
│   ├── (dashboard)/     # Hauptdashboard (Übersicht, Live-Bestellungen, Menü, Einstellungen, Archiv)
│   ├── availability/    # Terminal für Verfügbarkeiten (Ausverkauft-Schalter)
│   ├── orders/          # Separates Küchen-Terminal (Kitchen Board)
│   ├── to-go/           # Gast-Bestellung zum Abholen & Tracking
│   └── to-stay/         # Gast-Bestellung am Tisch & Tracking
├── components/          # React-Komponenten (Dashboard, Guest UI, Terminals, UI-Primitives)
├── convex/              # Convex Backend
│   ├── schema.ts        # Typsicheres Datenbank-Schema
│   ├── auth.ts          # Convex Auth Konfiguration
│   ├── authQueries.ts   # Interne Queries & Mutationen für Authentifizierung
│   ├── customAuth.ts    # Node Actions für Registrierung, Login & OTP
│   ├── emails.ts        # E-Mail-Versand (SMTP & Resend)
│   ├── http.ts          # HTTP-Router (Stripe Webhook)
│   ├── menu.ts          # Speisekarten-Logik
│   ├── orders.ts        # Bestellungen & rollierende Nummern
│   ├── organizations.ts # Restaurant-Verwaltung & Kaskadenlöschung
│   ├── sessions.ts      # Terminal-Token-Verwaltung
│   ├── storage.ts       # Datei-Upload & Löschung
│   ├── stripe.ts        # Stripe Connect & PaymentIntents
│   └── users.ts         # Benutzerprofil & Kontolöschung
├── lib/
│   ├── convex/          # Server- & Client-Helfer für Convex
│   ├── constants.ts     # Globale Konstanten & Timer
│   ├── i18n.ts          # Lokalisierung (next-intl)
│   └── types.ts         # TypeScript Interfaces
└── middleware.ts        # Edge Middleware für Auth-Prüfungen
```

---

## 🚀 Entwicklung & Deployment

### Lokaler Start
```bash
cd webapp
npm run dev
```
Die Webapp läuft lokal standardmäßig auf Port **3000** (`http://localhost:3000`).

### Typüberprüfung & Build
```bash
npm run typecheck
npm run build
```

### Convex Deployment
```bash
npx convex deploy --preview-name webapp
```
