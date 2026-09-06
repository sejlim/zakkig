# zakkig: Vision, Produkt & Systemarchitektur

Dieses Dokument ist die zentrale Source of Truth für die B2B Gastro Plattform **zakkig** (konsequent kleingeschrieben). Es vereint die fachliche Vision, das Geschäftsmodell, den detaillierten Anforderungskatalog, die rechtlichen und steuerlichen Vorgaben sowie die vollständige technische Implementierung als hochskalierbares, reaktives SaaS-System auf Basis von Convex & Next.js.

---

## TEIL 1: PRODUKTVISION & GESCHÄFTSMODELL

### 1.1 Was ist zakkig?

zakkig ist ein smartes Tool für die Gastronomie, das den Bestellvorgang und Bezahlvorgang radikal vereinfacht. Es fungiert als eigenständiger Kanal neben der bestehenden Kasse, absolut vergleichbar mit den Devices bekannter Lieferdienste. Das System fokussiert sich dabei konsequent auf zwei Hauptprinzipien: Dine-in (Bestellungen direkt am Tisch) und Takeaway (Ausser-Haus-Verkauf).

Der bewusste Fokus liegt auf maximaler Simplizität: zakkig ist ein reines Add-On-System für den Betrieb vor Ort, das ohne jegliche technische Vorkenntnisse oder langwierige Einarbeitung sofort genutzt werden kann.

### 1.2 Die Nutzererfahrung (UX) & Bring Your Own Device

- **Für den Gast (Bring Your Own Device):** zakkig setzt auf das absolute BYOD-Prinzip. Der Gast nutzt ausschließlich sein eigenes Smartphone. Er scannt lediglich einen QR-Code am Tisch oder am Tresen, wählt sein Essen aus der digitalen Speisekarte und bezahlt sofort. Niemand muss dafür eine App herunterladen oder sich registrieren.
- **Für den Wirt:** Kein Umstellungsstress, kein Risiko, keine teuren Sondergeräte. Fällt das WLAN vor Ort einmal aus, bestellen die Gäste klassisch beim Kellner. Da zakkig in stressigen Stoßzeiten lautlos rund ein Viertel aller Bestellungen übernimmt, hilft es perfekt gegen den heutigen Personalmangel. Zudem geht kein Umsatz verloren, weil Gäste nicht mehr lange auf das Bestellen eines zweiten Getränks warten müssen.
- **Für die Küche und den Service:** Die zentrale Drehscheibe ist das Kitchen Board. Hierfür wird keine teure Spezialhardware benötigt, ein simples und günstiges Standard-Tablet genügt völlig. Die Küche markiert Speisen per Fingertipp als fertig. Die Kellner sehen beim Vorbeigehen sofort, was zu welchem Tisch gebracht werden muss, und haken es nach dem Servieren dort direkt ab.

### 1.3 Geschäftsmodell, Payment & Zielgruppe

- **Die Zielgruppe:** zakkig richtet sich primär an Gastronomien, die ohnehin bereits klassische Kartenzahlung unterstützen.
- **Keine Grundgebühren:** zakkig verdient nur dann mit, wenn der Wirt auch wirklich echten Umsatz generiert.
- **Payment Infrastruktur (Stripe Connect):** Wir nutzen Stripe Connect als Zahlungsabwickler, um rechtlich und sicherheitstechnisch auf dem höchsten Standard zu agieren und niemals sensible Bankdaten der Gastronomen zwischenspeichern zu müssen.
  - **Onboarding & KYC:** Beim Setup verknüpfen die Gastronomen einen eigenen Stripe-Connect-Account via OAuth. Die komplette Identitätsprüfung (KYC) und Speicherung der Auszahlungsdaten liegt zu 100 % bei Stripe.
  - **Kostenstruktur & Split Payments (Pay-as-you-go):** Stripe arbeitet nach einem strikten Pay-as-you-go-Modell ohne monatliche Fixkosten. Die Zahlungen fließen direkt über Stripe. Bei jeder Transaktion behält Stripe seine regulären Transaktionskosten ein. Zusätzlich ziehen wir über die Stripe-API (`application_fee_amount`) vollautomatisch unsere **zakkig-Plattformgebühr (1 % vom Umsatz)** ab. Der Wirt trägt diese Gebührenkombination (wie beim klassischen EC-Terminal) und erhält die Restsumme direkt auf sein Bankkonto.
  - **Methoden:** Wir integrieren hochkonvertierende Methoden wie Apple Pay, Google Pay und Standard-Kartenzahlung. Teure Kreditkarten (wie American Express) können über die API gezielt ausgesperrt werden, um die Margen der Wirte zu schützen.
- **Finanzamt & TSE Konformität:** Jede digitale Bestellung wird vom Wirt als Gesamtsumme unter dem Namen zakkig in seine Hauptkasse eingetippt. Dadurch wird alles sofort vom gesetzlichen Sicherheitsbaustein (TSE) signiert. Am Monatsende reicht der Export einer Zusammenfassung für den Steuerberater.

---

## TEIL 2: ANFORDERUNGSKATALOG & FEATURES (Web-App: app.zakkig.de)

Das System ist extrem fokussiert und verzichtet bewusst auf unnötige Extras. Alles dreht sich um den perfekten digitalen Bestellablauf. Die App ist konsequent mehrsprachig (i18n) ausgelegt. Standardmäßig ist Deutsch aktiv, Englisch wird voll unterstützt. Ein Language-Switcher befindet sich in der Navigations-Sidebar.

### 2.1 Routing & Zugriffskonzept

**Authentifizierung (Offen für Registrierung/Login)**

- `app.zakkig.de/sign-in`
- `app.zakkig.de/sign-up`
- `app.zakkig.de/reset-password`

**Dashboard (Geschützt)**
Erfordert eine gültige Session (E-Mail, Passwort, HttpOnly Cookie).

- `app.zakkig.de/dashboard/{organizationId}/overview`
- `app.zakkig.de/dashboard/{organizationId}/live-orders`
- `app.zakkig.de/dashboard/{organizationId}/archive`
- `app.zakkig.de/dashboard/{organizationId}/menu`
- `app.zakkig.de/dashboard/{organizationId}/settings`

**Staff Devices (Geschützt)**
Einmaliges Pairing über das Dashboard erzeugt eine dauerhafte Session. Keine Passwort-Eingabe im Küchenalltag.

- `app.zakkig.de/orders/{organizationId}` (Kitchen Board)
- `app.zakkig.de/availability/{organizationId}` (Verfügbarkeits-Steuerung)

**Gast-Routen (Öffentlich, Keine Session)**
Zugriff ausschließlich über Parameter, ohne Registrierung.

- `app.zakkig.de/to-go/{organizationId}` (To-Go Menü)
- `app.zakkig.de/to-go/{organizationId}?order={orderId}` (To-Go Status-Tracker)
- `app.zakkig.de/to-stay/{organizationId}?table={tableNumber}` (To-Stay Menü am Tisch)

### 2.2 Core Features: Dashboard (SaaS Admin)

- **Overview (`/dashboard/{organizationId}/overview`):**
  - **Kopfbereich:** Anzeige von Betriebsdaten (Logo, Ladenname, Standort).
  - **Statistik-Kacheln:** Zwei Hauptkacheln (Anzahl der Bestellungen & Netto-Umsatz abzüglich aller Gebühren). Zeitraum umschaltbar (24 Stunden, 30 Tage, 90 Tage) inklusive Graphen.
  - **Quick-Links:** Navigation zu den weiteren Dashboard-Seiten.
  - **Kitchen-Session Management:** Ansicht zum Erstellen und Verwalten von Kitchen-Sessions inkl. kopierbarem Pairing-Link.
  - **QR-Code Generator:** Erstellung von QR-Codes für To-Go und To-Stay (inkl. sichtbarer Tischnummer über dem Code). Generierte QR-Codes sind als PDF für den Druck herunterladbar.
- **Live-Bestellungen (`/live-orders`):** Echtzeit-Ansicht der aktiven Bestellungen (In Bearbeitung, Abgeschlossen, Storniert).
- **Archiv (`/archive`):** Detaillierte Historien-Tabelle aller vergangenen Bestellungen mit Filter-/Suchfunktionen und dem DATEV CSV-Export für den Steuerberater. Die Sortierung erfolgt millisekundengenau absteigend (neueste Bestellungen oben), während die Anzeige im Interface sauber auf die Minute formatiert ist.
- **Menu (`/menu`):** Zentrale Verwaltung der Speisekarte, Getränke, Kategorien, Preise und Bilder.
- **Settings (`/settings`):** Verwaltung von Account- und Betriebsdaten (z. B. Logo-Upload im Full-Width Layout auf Desktop) und Stripe-Details. Die Kontolöschung erfolgt über einen zweistufigen Verifizierungsprozess: Eine serverseitige Mutation (`deleteAccount`) generiert einen temporären Token und sendet eine Bestätigungs-E-Mail über den eigenen SMTP-Server. Erst nach Klick auf den E-Mail-Link wird das Konto restlos gelöscht.

### 2.3 Core Features: Kitchen Board View

- **Aufbau:** Ansicht mit den Status "In Bearbeitung", "Abgeschlossen" und "Storniert". Aktualisiert sich reaktiv in Echtzeit.
- **Ablauf:** Eingehende Bestellungen erscheinen als Kacheln in historischer Reihenfolge. Ein Klick markiert die Bestellung als abgeschlossen und verschiebt sie.
- **Cleanup & Auto-Archivierung:** Abgeschlossene Kacheln bleiben für 30 Minuten auf dem Kitchen Board sichtbar und zeigen einen Live-Timer an ("Auto-Archiv in X Min."). Anschließend werden sie automatisch ausgeblendet und sind im Archiv auffindbar.

### 2.4 Core Features: Gast-Frontend (To-Stay & To-Go)

- **Layout & Guest Flow (Lieferando-Style):**
  - **Initialzustand:** Sauberes Menü ohne störende Navigations-Tabs am unteren Bildschirmrand, wenn der Warenkorb leer ist.
  - **Schwebender Warenkorb-Banner:** Sobald Artikel in den Warenkorb gelegt werden, ploppt unten ein dezenter schwebender Pill-Banner auf (Artikelanzahl, Zwischensumme, "Zum Warenkorb"). Beim Leeren des Warenkorbs blendet sich der Banner automatisch wieder aus.
  - **Fokussierte Warenkorb-Seite:** Beim Klick auf den Banner wechselt die Ansicht in den Warenkorb – das Restaurant-Hero-Banner wird ausgeblendet und ein Zurück-Pfeil oben links führt jederzeit zurück zum Menü.
- **Warenkorb (Client State):** Wird lokal via `Zustand` verwaltet. Mengenänderungen (+ / -) sind direkt möglich. Bei einem Page-Reload wird der Warenkorb resettet.
- **Checkout:** Abfrage der E-Mail-Adresse (Pflicht für digitalen Beleg), Auswahl der Zahlungsmethode (Apple Pay, Google Pay, Karte) und sofortige Bezahlung. Der Bon wird per E-Mail gesendet.
- **Bestellnummern (Rolling 001 - 999):** Die für Gäste, Gastronomen und Küche sichtbare Bestellnummer rotiert fortlaufend im dreistelligen Format von `001` bis `999` und beginnt danach automatisch wieder bei `001`. Intern wird jede Bestellung zusätzlich durch eine eindeutige Dokumenten-ID sowie die Stripe-Payment-ID identifiziert.
- **Nach der Bestellung:**
  - **To-Stay:** Anzeige der Bestellnummer auf dem Screen. Gast wartet am Tisch. (Page-Reload resettet den State für eine potenzielle neue Bestellung).
  - **To-Go:** Automatische Weiterleitung auf den Order-Tracker mit Live-Status und Anzeige der 3-stelligen Abholnummer. Der Link bleibt nach Bestellabschluss (Abholbereit) 10 Minuten lang mit einem Live-Restzeit-Countdown aktiv ("Tracking-Link aktiv für noch X:XX Min."), danach wird er ungültig und schaltet auf den sauberen Ablauf-Screen um.

### 2.5 Lifecycle & Ablaufzeiten (Sicherheitsstandard & Auto-Cleanup)

Das Gesamtsystem erzwingt standardisierte Ablaufzeiten für maximale Datensparsamkeit, Sicherheit und konsistente Betriebsabläufe:

| Komponente / Vorgang | Gültigkeit / Timeout | Verhalten nach Ablauf | Sicherheitsfunktion |
| :--- | :--- | :--- | :--- |
| **Auth OTP (Login & Registrierung)** | 30 Minuten | Code verfällt und wird serverseitig abgelehnt | Schutz vor Replay- und Brute-Force-Angriffen |
| **Brute-Force Lockout (OTP)** | 5 Fehlversuche | Sofortige Löschung des Codes | Verhindert systematisches Durchprobieren von Einmalcodes |
| **Unverifizierte Accounts** | 30 Minuten | Vollständige Bereinigung via Convex Scheduler | Gibt die E-Mail-Adresse wieder frei, verhindert Ghost-Accounts |
| **Passwort-Reset Link** | 30 Minuten | Token wird ungültig, Neuanforderung erforderlich | Schutz vor missbräuchlicher Passwortänderung über alte Links |
| **Account-Löschung & E-Mail-Änderung** | 30 Minuten | Signierter Bestätigungslink verfällt | Schutz vor verspäteter Token-Ausnutzung |
| **Kitchen Board Auto-Archivierung** | 30 Minuten | Bestellung wird automatisch ins Archiv verschoben | Hält die Küchenansicht aufgeräumt und fokussiert |
| **Takeaway Live-Tracker (Gast)** | 10 Minuten | Tracker schaltet auf Abschluss-Screen um | Datenschutz und Vermeidung verwaister Live-Links |
| **Terminal Pairing-Tokens** | Dauerhaft (Widerrufbar) | HttpOnly SameSite=lax Cookie (`order_session_*`) | Sicherer Tablet-Betrieb ohne XSS-Gefährdung |

### 2.6 Dateispeicher & Upload-Limits (Defense-in-Depth)

Für alle visuellen Medien (Restaurant-Logo, Restaurant-Banner, Speisen- und Getränkebilder) gilt ein einheitlicher, serverseitig geschützter Standard:
- **Maximale Dateigröße:** 10 MB pro Datei (`MAX_IMAGE_SIZE_MB = 10`).
- **Unterstützte Formate:** Exklusiv JPG und PNG (`image/jpeg`, `image/png`). Andere Formate werden sowohl im Browser mit einem Fehler-Toast als auch serverseitig strikt abgewiesen.
- **Clientseitige Validierung:** Sofortige Prüfung im Browser (Drag-and-Drop sowie Dateidialog) mit benutzerfreundlichen Hinweisen ("JPG, PNG bis 10 MB").
- **Serverseitige Enforcierung:** Prüfung von Dateigröße und MIME-Type in den Server Actions (`createMenuItemAction`, `updateMenuItemAction`, `updateBusinessAction`) sowie vor Übertragung in den Convex Storage (`uploadFileToConvex`).
- **Anti-IDOR Schutz:** Strikte Überprüfung der Organisationszugehörigkeit vor dem Speichern oder Überschreiben von Bildern.

## TEIL 3: RECHTLICHE & STEUERLICHE COMPLIANCE

Da zakkig Finanztransaktionen abwickelt, ist das System strikt nach deutschen Compliance-Vorgaben modelliert.

### 3.1 Das rechtliche Grundmodell

zakkig fungiert rechtlich als reiner **Bestell- und Zahlungsvermittler**. Der Kaufvertrag über Speisen und Getränke kommt ausschließlich zwischen dem Endkunden und dem Gastronomen zustande.

### 3.2 KassenSichV, Belegausgabe & Nacherfassung

- **TSE-Haftung:** zakkig ist kein elektronisches Kassensystem im Sinne der KassenSichV.
- **Wirt-Pflicht:** Der Gastronom muss jede Bestellung manuell als unbaren Umsatz in seine eigene, zertifizierte Ladenkasse eintippen. Diese Pflicht wird fest in den B2B-AGB der Plattform verankert.
- **Belegfluss:** Der Gast erhält bei Übergabe der Speisen seinen offiziellen TSE-Kassenbon vom Restaurant. Die automatisierte Stripe-E-Mail nach dem Checkout ist lediglich eine "Zahlungsbestätigung" und enthält einen entsprechenden rechtlichen Disclaimer.

### 3.3 Checkout-Pflichtangaben für Gäste

- **Verkäufer-Identität:** Klartext-Hinweis im Checkout: "Du kaufst bei: [Name des Restaurants]. Die technische Bestell- und Zahlungsabwicklung erfolgt über zakkig als Vermittler..."
- **Preise:** Anzeige als Bruttopreise inkl. der jeweiligen Umsatzsteuer (MwSt.).
- **Kauf-Button:** Zwingende Beschriftung mit "Zahlungspflichtig bestellen", direkt darunter die Bestätigung von AGB und Datenschutz.

### 3.4 B2B Abrechnung & DATEV

- **Die B2B-Rechnung:** Wirte erhalten monatlich eine PDF-Rechnung über die einbehaltene zakkig-Plattformgebühr (1 %). Da der Betrag durch Stripe Direct Charges bereits in Echtzeit einbehalten wurde, trägt die Rechnung den Pflicht-Vermerk: "Der Rechnungsbetrag wurde bereits im Rahmen der laufenden Online-Transaktionen einbehalten... Der offene Betrag ist ausgeglichen."
- **Der DATEV CSV-Export:** Die Dashboard-Tabelle exportiert eine Datei für den Steuerberater mit exakten Spalten für Belegdatum, Bestell-ID, Brutto-Umsatz, S_H-Kennzeichen, Währung, zakkig-Gebühr, Stripe-Gebühr und Netto-Geldeingang.

### 3.5 Sicherheit, KYC & Betrugsprävention

- **Onboarding (KYC):** Stripe übernimmt die komplette Geldwäscheprüfung (Handelsregister, Steuernummer, UBO-Identifikation).
- **PStTG-Meldepflicht:** zakkig meldet Gastronomen ab 30 Bestellungen oder 2.000 Euro Jahresumsatz an das Bundeszentralamt für Steuern.
- **Statement Descriptor:** Bankbuchungen der Gäste zeigen `APP* [Name des Restaurants]`, um unberechtigte Rückbuchungen (Chargebacks) zu verhindern.
- **Stripe Radar & 3D-Secure:** 3D-Secure (Zwei-Faktor) ist für Kreditkarten zwingend aktiviert (Haftungsübergang auf die Bank des Karteninhabers). Stripe Radar blockiert hochriskante Transaktionen automatisch.
- **Anti-Spam (QR-Code Fraud):** Limitierung von fehlerhaften Zahlungsversuchen im Checkout pro IP-Adresse, um Manipulationen an abfotografierten Tisch-QR-Codes zu verhindern.

---

## TEIL 4: DESIGN SYSTEM & BRANDING

### 4.1 Die Visuelle Identität

Das Branding von zakkig ist extrem edel, minimalistisch und unauffällig. Es nutzt ein weiches, modernes Designsystem mit starken Rundungen, das vom Feeling her stark an moderne Payment Provider erinnert, dabei jedoch strikt auf bunte Farben verzichtet (monochromes Schwarz/Weiß).

**Wichtig zur Theme-Strategie:** Wir lassen den Dark Mode prinzipiell raus und bieten keine weiteren Theme-Modes an. Die gesamte Plattform wird exklusiv im **Light Theme** betrieben. Dies sorgt dafür, dass sich zakkig mit einem klaren, seriösen und konsistenten Bild unaufdringlich in jede Gaststätte einfügt.

### 4.2 Das UI Theme (shadcn/ui)

Als technisches Fundament für das Interface nutzen wir **shadcn/ui** in Kombination mit Tailwind CSS v4. Wir setzen konsequent auf die Schriftart **Poppins** für perfekte Lesbarkeit.
**Zentrales Theme (`globals.css`):**

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.205 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 1.5rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);

  /* Typography */
  --font-sans: Poppins, ui-sans-serif, sans-serif, system-ui;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}


@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ...weitere Theme Zuweisungen... */
  --font-sans: var(--font-sans);
}
```

---

## TEIL 5: TECHNISCHE IMPLEMENTIERUNG (Zero-Ops Architektur)

Das System setzt auf eine moderne, reaktive Architektur mit **Convex** als All-in-One Backend-Plattform und **GitHub** für das Code- und Repository-Management.

### 5.1 Architektur Übersicht & Repository (GitHub)

Das Projekt besteht aus zwei komplett unabhängigen Next.js-Applikationen in einem gemeinsamen GitHub-Repository (Monorepo-Ansatz):

- **Frontend Marketing (`website/`):** B2B Landingpage für den Vertrieb (`zakkig.de`).
- **Frontend SaaS App (`webapp/`):** Admin Dashboard der Wirte, Bestell-UI der Gäste und das Echtzeit Kitchen Board (`app.zakkig.de`).

### 5.2 Der Technologie Stack

- **Frontend-Framework:** Next.js (React) mit Server-Side Rendering (SSR), Server Actions und Turbopack.
- **Backend-Plattform:** Convex (Reaktive Echtzeit-Datenbank, serverseitige Mutations/Queries/Actions, File Storage, Crons & HTTP Endpoints).
- **UI & Styling:** shadcn/ui kombiniert mit Tailwind CSS.
- **State Management:** Zustand für persistente Client-Side States & reaktive Convex-Hooks (`useQuery`, `useMutation`).
- **Lokalisierung:** i18n für ein dynamisches, mehrsprachiges Setup (Deutsch / Englisch).
- **E-Mail-Infrastruktur:** Hetzner Mailserver (SMTP via `mail.your-server.de`).
- **Payment:** Stripe Connect mit Destination Charges (1% Plattform-Gebühr) und Stripe Payment Element.

### 5.3 Domain, E-Mail & CI/CD

- **Hetzner:** DNS-Management für `zakkig.de` und SMTP-Hosting.
- **GitHub Actions:** Vollautomatisierte CI/CD-Pipelines für Checks und Builds.
- **Security:** Enterprise-Grade DDoS-Protection und globales CDN über Cloudflare / Vercel und Stripe.

---

## TEIL 6: B2B LANDINGPAGE (zakkig.de)

Die Marketingseite wird als SEO-optimierter One-Pager gehostet, ergänzt durch separate rechtliche Unterseiten. Sie wird vollständig zweisprachig umgesetzt.

### 6.1 Routing & Lokalisierung

- **Deutsch (Standard):** `/` (One-Pager), `/impressum`, `/datenschutz`, plus 404-Fallback.
- **Englisch:** `/en/` (One-Pager), `/en/legal`, `/en/privacy`, plus englisches 404-Fallback.
- **Navigation:** Lokalisierte Anchor-Links (z. B. `#loesung` vs. `#solution`).

### 6.2 Globale SEO Meta-Daten

- **Meta Title:** Lass Kunden selbst bestellen und bezahlen
- **Meta Description:** Egal ob zum Mitnehmen oder am Tisch, biete deinen Kunden eine digitale Möglichkeit zum Bestellen und Bezahlen. Sie scannen einfach einen QR-Code mit dem eigenen Handy, während dein Personal sich Wichtigerem widmen kann.

---

## TEIL 7: ENTWICKLER-SETUP & INFRASTRUKTUR

Dieser Abschnitt richtet sich an Entwickler und enthält technische Details zur Initialisierung, Architektur und zum Betrieb.

### 7.1 Umgebungsvariablen & Ports

Jedes Teilprojekt besitzt eine eigene `.env` und `.env.example` Datei im jeweiligen Verzeichnis (`webapp/` und `website/`).
- **Webapp (`webapp/.env`):** Enthält Konfigurationen für Convex (`NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`), Stripe Keys, SMTP Provider Einstellungen und Session-Geheimnisse.
- **Port-Management:**
  - Im **Development-Modus** läuft die Marketingseite auf Port 3000 (`next dev --port 3000`) und die Webapp auf Port 3001 (`next dev --port 3001`).
  - Im **Production-Modus** starten beide Anwendungen über den Standard-Befehl `next start` (Standard-Port 3000).

### 7.2 Datenbank-Schema & Convex Functions

Das gesamte Datenbank-Schema ist typsicher in `webapp/convex/schema.ts` definiert:
- Tabellen: `users`, `sessions`, `organizations`, `categories`, `items`, `orders`, `kitchenTokens`, `availabilityTokens`, `emailTokens`, `counters`.
- Für die lokale Entwicklung läuft `npx convex dev` parallel zum Next.js Dev-Server.

### 7.3 Authentifizierung & Server-Side Rendering (SSR)

Für Next.js Server Components und Server Actions wird der serverseitige Convex-Client verwendet (`webapp/lib/convex/auth.ts`):
- `getUser()` liest das sichere `HttpOnly`-Session-Cookie (`zakkig_session`) aus und validiert die Session in Convex.
- `getAuthenticatedConvexClient()` instanziiert einen serverseitigen Client für Backend-Operationen.

### 7.4 E-Mail & SMTP

Der native SMTP-Service über Hetzner (`mail.your-server.de`) versendet alle ausgehenden transaktionalen Mails (Zwei-Faktor Einmalcodes für Registrierung und Login, Kontolöschungs-Tokens und digitale Quittungen).
