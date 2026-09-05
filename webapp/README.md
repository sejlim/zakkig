# Zakkig Webapp

Dieses Verzeichnis enthält die Haupt-Applikation von Zakkig (das Gastronomen-Dashboard, die Bestell-Oberflächen für Gäste sowie die Kitchen- und Verfügbarkeits-Terminals).

---

## Technologie-Stack

- **Framework:** Next.js (App Router, Server Actions, Server Components, Turbopack)
- **Backend Platform:** Convex (Reaktive Echtzeit-Datenbank, serverseitige Mutations/Queries/Actions, File Storage, Crons & HTTP Endpoints)
- **Authentifizierung:** Convex Auth & SSR Session Management mit HttpOnly-Cookies und E-Mail-OTP
- **E-Mail-Versand:** Hetzner Mailserver (SMTP via `mail.your-server.de`)
- **Zahlungsabwicklung:** Stripe Connect (Destination Charges mit 1% Plattform-Gebühr, Embedded Payment Element)
- **UI & Styling:** Tailwind CSS, Shadcn UI, Phosphor Icons
- **State Management:** Zustand & reaktive Convex Hooks (`useQuery`, `useMutation`)
- **Internationalisierung (i18n):** next-intl (Deutsch & Englisch)

---

## Architektur & Authentifizierung

Die Applikation nutzt ein striktes **Server-Side Rendering (SSR) Authentifizierungs-Modell** in Verbindung mit Convex.

- **Sichere HttpOnly-Cookies:** Nach erfolgreicher Anmeldung oder Registrierung setzt der Server ein sicheres `HttpOnly`-Cookie (`zakkig_session`). Clientseitiger JavaScript-Code kann das Cookie nicht auslesen, was effektiven Schutz vor XSS bietet.
- **Zwei-Faktor E-Mail-OTP:** Sowohl bei der Registrierung als auch beim Login wird standardmäßig ein kryptografischer 6-stelliger Einmalcode per E-Mail versendet. Erst nach korrekter Eingabe wird die Sitzung aktiv.
- **Proxy & Session-Validierung:** `webapp/proxy.ts` und serverseitige Helfer in `lib/convex/auth.ts` (`getUser()`, `getAuthenticatedConvexClient()`) validieren bestehende Sessions für geschützte Routen.

---

## E-Mail-Infrastruktur

Der Versand von Transaktions-E-Mails (Anmeldecodes, Passwort-Resets, Bestätigungen für E-Mail-Änderungen und Account-Löschungen) ist in `convex/emails.ts` implementiert.

- **Primärer Versandweg:** Hetzner SMTP (`mail.your-server.de`, Port 587) mit TLS-Verschlüsselung.
- **Absender-Konfiguration:**
  - **Absender-E-Mail:** `noreply@zakkig.de`
  - **Absender-Name (Deutsch):** `Selim von zakkig`
  - **Absender-Name (Englisch):** `Selim at zakkig`
- **Verschlüsselung:** TLS/STARTTLS über Port 587.

---

## Datenmodell & Schema (`convex/schema.ts`)

Alle Tabellen sind typsicher über Convex definiert:

1. **`users` & `authAccounts`:** Benutzerkonten, Namen, E-Mail-Adressen und gehashte Zugangsdaten.
2. **`organizations`:** Restaurant-Stammdaten (Name, Adresse, Logo-Storage-ID, Owner-ID, Stripe-Verbindungsstatus, Tische, Schalter für Abholung / Tischbestellung).
3. **`menuCategories`:** Speisekarten-Kategorien mit Sortier-Index (`by_organizationId_and_sortOrder`).
4. **`menuItems`:** Gerichte & Getränke mit Preisen in Cent, Bild-Storage-ID, MwSt.-Satz, Verfügbarkeits-Status und JSON-konfigurierten `customizations` (z.B. Größen, Teig, Toppings).
5. **`orders`:** Bestellungen mit rollierender dreistelliger Bestellnummer (`001`–`999`), Bestelltyp (`takeaway` / `dine-in`), Tischnummer, Status (`in_progress`, `completed`, `cancelled`), Gesamtsumme und Gebührenaufschlüsselung.
6. **`orderSessions` & `availabilitySessions`:** Autorisierungs-Token für separate Tablet-Terminals.
7. **`verificationCodes`:** Temporäre Prüfcodes für Login-OTPs, Passwort-Resets und Stammdaten-Änderungen.

---

## Reaktives Echtzeit-System (Realtime)

Convex synchronisiert Änderungen automatisch und ohne manuelle WebSocket-Verwaltung an alle aktiven Clients:

- **Kitchen Board (`/dashboard/[orgId]/live-orders` & `/orders/[orgId]`):** Nutzt reaktive `useQuery(api.orders.getLiveOrders)` Subscriptions. Sobald ein Gast bezahlt oder der Status geändert wird, aktualisieren sich alle Displays blitzschnell.
- **Verfügbarkeits-Board (`/availability/[orgId]`):** Kassenpersonal kann Speisen oder Optionen sekundenschnell als ausverkauft schalten (`toggleMenuItemAvailability`). Gäste und Terminals sehen dies sofort im UI.
- **Gast-Bestellverfolgung (`/to-go` & `/to-stay` Tracker):** Der Gast sieht den aktuellen Zubereitungs-Status seiner Bestellung in Echtzeit über `useQuery(api.orders.getOrder)`.

---

## Ablaufzeiten & Lifecycle-Management (TTL & Timeouts)

Um höchste Sicherheit, Speicher-Hygiene und eine transparente Nutzererfahrung zu gewährleisten, folgt die Plattform strikten und einheitlichen Ablaufzeiten:

| Komponente / Vorgang | Gültigkeit / Timeout | Verhalten nach Ablauf | Sicherheitsfunktion |
| :--- | :--- | :--- | :--- |
| **Auth OTP (Login & Registrierung)** | 30 Minuten | Code verfällt und wird serverseitig abgelehnt | Schutz vor Replay- und Brute-Force-Angriffen |
| **Brute-Force Lockout (OTP)** | 5 Fehlversuche | Sofortige Löschung des Codes | Verhindert systematisches Durchprobieren von Einmalcodes |
| **Unverifizierte Accounts** | 30 Minuten | Vollständige Bereinigung via Convex Scheduler (`cleanupUnverifiedUser`) | Gibt die E-Mail-Adresse wieder frei, verhindert Ghost-Accounts |
| **Passwort-Reset Link** | 30 Minuten | Token wird ungültig, Neuanforderung erforderlich | Schutz vor missbräuchlicher Passwortänderung über alte Links |
| **Account-Löschung & E-Mail-Änderung** | 30 Minuten | Signierter Bestätigungslink verfällt | Schutz vor verspäteter Token-Ausnutzung |
| **Kitchen Board Auto-Archivierung** | 30 Minuten | Bestellung wird automatisch ins Archiv verschoben (`KITCHEN_CLEANUP_MINUTES = 30`) | Hält die Küchenansicht aufgeräumt und fokussiert |
| **Takeaway Live-Tracker (Gast)** | 10 Minuten | Tracker schaltet auf Abschluss-Screen um (`TRACKING_EXPIRY_MINUTES = 10`) | Datenschutz und Vermeidung verwaister Live-Links |
| **Terminal Pairing-Tokens** | Dauerhaft (Widerrufbar) | Gespeichert in sicheren HttpOnly SameSite=lax Cookies (`order_session_*`) | Sicherer Tablet-Betrieb ohne XSS-Gefährdung |

---

## Dateispeicher & Upload-Limits (Convex Storage)

Logos, Restaurant-Banner und Speisekarten-Bilder werden im nativen Convex File Storage gespeichert und unterliegen strengen Sicherheits- und Größenbegrenzungen:

- **Maximale Dateigröße:** Einheitlich 10 MB pro Datei (`MAX_IMAGE_SIZE_MB = 10`, `MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024`).
- **Erlaubte Dateitypen:** JPG, PNG, WebP (`image/jpeg`, `image/png`, `image/webp`).
- **Clientseitige Validierung:** Sofortiges Feedback bei Überschreiten von 10 MB via Toast-Meldung ("Das Bild darf maximal 10 MB groß sein.") und transparente Kennzeichnung im UI ("JPG, PNG bis 10 MB", "max. 10 MB").
- **Serverseitige Enforcierung (Defense-in-Depth):**
  - Vor dem Upload in Convex File Storage validiert `lib/convex/storage.ts` (`uploadFileToConvex`) die Dateigröße.
  - Alle Server Actions (`createMenuItemAction`, `updateMenuItemAction`, `updateBusinessAction`) prüfen Dateigröße und Dateityp (`file.type.startsWith("image/")`) serverseitig ab, bevor eine Speicheroperation angestoßen wird.
- **Speicherbereinigung:** Beim Aktualisieren oder Löschen von Artikeln und Logos werden alte Dateien automatisch über `ctx.storage.delete` aus dem Speicher entfernt.

---

## Sicherheit & Mandantentrennung (Defense-in-Depth)

1. **Strikte Mandanten-Isolation:** Jede Server Action, die Betriebsdaten liest oder modifiziert, autorisiert den Aufruf über `requireOwner(organizationId)` oder `requireStaffOrOwner(organizationId)`.
2. **Anti-IDOR Schutz (Insecure Direct Object Reference):**
   - Beim Bearbeiten oder Löschen von Kategorien (`updateCategoryAction`, `deleteCategoryAction`) wird validiert, dass die Kategorie tatsächlich zur autorisierten `organizationId` gehört.
   - Beim Bearbeiten, Löschen oder Umschalten der Verfügbarkeit von Speisen (`updateMenuItemAction`, `deleteMenuItemAction`, `toggleMenuItemAvailability`) wird geprüft, dass der Artikel zur autorisierten Organisation gehört.
   - Beim Aktualisieren des Bestellstatus auf dem Küchenboard (`updateOrderStatusAction`) wird geprüft, dass die Bestellung der autorisierten Organisation zugeordnet ist.
3. **Zero Data Leakage an Gast-Schnittstellen:**
   - Auf öffentlichen Gast-Seiten (`/to-go/[orgId]`, `/to-stay/[orgId]`) werden sensible Betreiberdaten (`stripeAccountId`, `taxId`, `ownerId`) vor der Serialisierung in den React Server Component Payload unkenntlich gemacht bzw. genullt.
   - Bei der Bestellverfolgung werden Plattform- und Zahlungsgebühren (`zakkigFee`, `stripeFee`, `netAmount`, `stripePaymentId`) serverseitig auf 0 gesetzt, sodass Gäste ausschließlich für sie relevante Bestelldaten einsehen können.
4. **Serverseitige Preis- und Integritätsprüfung:**
   - Gast-Warenkörbe werden im Checkout niemals ungeprüft akzeptiert. Die Convex Action `createPaymentIntent` liest alle Artikelpreise direkt aus der Datenbank und rechnet die Gesamtsumme centgenau nach.

## Routing & Verzeichnisstruktur

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
└── proxy.ts             # Proxy für Session- & Auth-Prüfungen
```

---

## Entwicklung & Deployment

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
