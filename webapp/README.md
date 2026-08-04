# Zakkig Webapp

Dieses Verzeichnis enthält das Frontend für die Haupt-Applikation von Zakkig (das Dashboard für Restaurant-Betreiber sowie die Kitchen- und Availability-Terminals).

## 🏗️ Technologie-Stack
- **Framework:** Next.js (App Router, Server Actions, Server Components)
- **UI & Styling:** Tailwind CSS, Shadcn UI, Phosphor Icons
- **Backend & Auth:** Appwrite (Server-Side Rendering Auth, Realtime Databases)
- **State Management:** Zustand
- **Internationalisierung (i18n):** next-intl (Deutsch & Englisch)

---

## 🔒 Architektur & Authentifizierung

Die Applikation nutzt ein striktes **Server-Side Rendering (SSR) Authentifizierungs-Modell** in Kombination mit Appwrite.
- **Sichere Cookies:** Statt JWTs im LocalStorage abzulegen, erstellt Appwrite über Server Actions sichere `HttpOnly`-Cookies (`zakkig_session`). Das schützt effektiv vor XSS-Angriffen, da der Client-JavaScript-Code den Token nicht auslesen kann.
- **Session-Synchronisation (Polling):** Da die sicheren Cookies vor dem Browser versteckt sind, können klassische Appwrite Realtime-Websockets die User-Session clientseitig nicht authentifizieren. Daher nutzen wir für alle Seiten (Dashboard, Live-Orders, Availability) ein ressourcenschonendes **Background-Polling** (alle 15 Minuten). Wird eine Session (z.B. von einem anderen Gerät aus) serverseitig gelöscht oder das Konto gelöscht, merken die Clients dies beim nächsten Poll und werfen den Nutzer automatisch auf die `/` Route (Login) zurück.

---

## 🗺️ Routing & Bereiche

Die Webapp ist funktional in verschiedene "Zonen" unterteilt:

### 1. `(auth)` - Authentifizierungsbereich
Hier liegen die Routen für Login (`/sign-in`), Registrierung (`/sign-up`), Passwort vergessen, sowie die OTP-Bestätigungsseiten für E-Mail-Änderungen und Account-Löschungen. Alle Formulare nutzen serverseitige `useActionState` Hooks für sichere und js-unabhängige Verarbeitung. Standard-HTML `<form>`-Verhalten (inklusive nativen "Enter"-Submits) wird konsequent umgesetzt.

### 2. `(dashboard)` - Haupt-Dashboard
Die Kommandozentrale für Restaurantbetreiber.
- **DashboardShell:** Das globale Layout (Sidebar, Navigation), das auch das 15-minütige Session-Polling übernimmt.
- Beinhaltet die Verwaltung für **Speisekarten (`/menu`)**, **Organisationen (`/overview`)** und generelle **Einstellungen (`/settings`)**.
- In den Einstellungen gibt es dedizierte "Gefahrenzonen" (Konto löschen, Alle Geräte abmelden), die geschützt über Server Actions mit der Datenbank kommunizieren.

### 3. Terminals (`/orders` & `/availability`)
Zakkig bietet spezielle, isolierte Ansichten, die oft auf Tablets (in der Küche oder an der Theke) permanent geöffnet sind.
- **Live-Bestellungen (`/orders/[orgId]`):** Das "Kitchen Board". Eingehende Bestellungen werden über *Appwrite Realtime Websockets* in Echtzeit auf den Bildschirm gepusht.
- **Verfügbarkeits-Board (`/availability/[orgId]`):** Hier kann das Kassen-Personal blitzschnell einzelne Gerichte (oder Zusatzzutaten) als "Ausverkauft" markieren. Auch hier synchronisiert sich das UI sofort via Websockets mit allen anderen Geräten.
- **Sicherheitskonzept:** Beide Terminals loggen sich *nicht* mit dem globalen Admin-Cookie ein. Sie generieren über das Dashboard temporäre Terminal-Tokens (`order_session_...` und `availability_session_...`), die als Cookies gesetzt werden. Ein generischer `<SessionPoller />` überprüft auch hier alle 15 Minuten im Hintergrund, ob der Restaurantbesitzer die Erlaubnis für das spezifische Tablet widerrufen hat, und schließt die Ansicht bei Bedarf sofort.

---

## 🌍 Internationalisierung (i18n)

Die Webapp ist vollständig zweisprachig (Deutsch / Englisch).
- Die gesamte Logik läuft zentral über `next-intl`.
- Übersetzungen liegen in Standard JSON-Dateien. 
- *Wichtig für die Entwicklung:* Hardcodierte Texte im JSX sind strengstens untersagt. Alle Texte (auch Fallbacks) müssen über die `t("key")` Funktion aus der `i18n.ts` gezogen werden.

---

## ⚡ Datenfluss & Realtime

- **CRUD-Operationen:** Änderungen (z.B. Menü-Items erstellen, E-Mails ändern) laufen fast ausnahmslos über **Next.js Server Actions**. Das hält sensible Appwrite-Zugriffscodes (API Keys) sicher auf dem Server.
- **Realtime-Daten:** Für das Live-Erlebnis (Bestellungen, ausverkaufte Items) abonniert der Client über den öffentlichen Appwrite-Client Änderungen an bestimmten Datenbank-Dokumenten. Wenn der Server eine Änderung durchführt (z.B. Item ausverkauft), pusht Appwrite dies an alle lauschenden Clients, welche daraufhin ihr UI ohne Page-Reload aktualisieren.

---

## 💳 Zahlungsabwicklung (Stripe Connect)

Die Webapp integriert **Stripe Connect** für das Zahlungs-Routing (Multi-Party-Payments) zwischen dem Gast, dem Restaurant und der Zakkig Plattform.

### Onboarding (Dashboard)
- Restaurant-Besitzer können über das Dashboard (`/settings`) ein Stripe-Konto erstellen bzw. verbinden. 
- Wir nutzen den **Stripe Connect Onboarding Flow** mit Rückleitungen zur Applikation.
- Sobald das Onboarding abgeschlossen ist, wird in der Datenbank (`organizations`) der Status `stripeOnboardingComplete` gesetzt und die `stripeAccountId` hinterlegt.

### Guest Ordering & Checkout
- Die Gäste nutzen die Routen `/to-go/[orgId]` und `/to-stay/[orgId]`.
- Der Checkout passiert **embedded (direkt auf der Seite)** über das Stripe Payment Element (`@stripe/react-stripe-js`).
- Das System nutzt **Destination Charges (mit Transfer Data)**. Dabei läuft die Zahlung primär über den Stripe-Account der Plattform (Zakkig). Der Hauptbetrag (abzüglich der 1% Zakkig-Plattformgebühr) wird dabei automatisch als `transfer_data.amount` an das verbundene Restaurant-Konto weitergeleitet. Die Stripe-Transaktionsgebühren (Processing Fees) trägt somit automatisch das Restaurant.

### Serverseitige Appwrite Functions
Zur Absicherung der Stripe-Zahlungen nutzen wir Appwrite Serverless Functions (Code in `/appwrite/functions/`):
1. **`create-payment-intent`**: Wird vom Frontend über die Appwrite SDK aufgerufen, sobald der Checkout-Sheet geöffnet wird. Validiert den Warenkorb gegen die Datenbank, berechnet die Plattformgebühr (1%) und erstellt den Stripe PaymentIntent mit den nötigen Transfer-Daten für das Restaurant. Gibt das `client_secret` an das Frontend zurück.
2. **`stripe-webhook`**: Ein sicherer Endpunkt, der die Stripe Webhooks (`payment_intent.succeeded`) empfängt. Die Funktion validiert die Stripe-Signatur kryptografisch, schreibt daraufhin die finale Bestellung (`Order`) manipulationssicher in die Appwrite-Datenbank und leert den Warenkorb-State (per Metadaten) indirekt ab.
