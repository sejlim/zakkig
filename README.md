# zakkig: Vision, Produkt & Systemarchitektur

Dieses Dokument ist die zentrale Source of Truth für die B2B Gastro Plattform **zakkig** (konsequent kleingeschrieben). Es vereint die fachliche Vision, das Geschäftsmodell, den detaillierten Anforderungskatalog, die rechtlichen und steuerlichen Vorgaben sowie die vollständige technische Implementierung als hochskalierbares, serverloses SaaS-System auf Basis von Appwrite Cloud.

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

**Dashboard (Geschützt durch Appwrite Auth)**
Erfordert eine gültige Session (E-Mail, Passwort, HttpOnly Cookie).

- `app.zakkig.de/dashboard/{organizationId}/overview`
- `app.zakkig.de/dashboard/{organizationId}/orders`
- `app.zakkig.de/dashboard/{organizationId}/menu`
- `app.zakkig.de/dashboard/{organizationId}/settings`

**Kitchen Board (Geschützt)**
Einmaliges Pairing über das Dashboard erzeugt eine dauerhafte Session. Keine Passwort-Eingabe im Küchenalltag.

- `app.zakkig.de/orders/{organizationId}`

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
- **Orders (`/orders`):** Tab-Menü mit zwei Ansichten. Einerseits die Live-Küchenansicht. Andererseits eine detaillierte Historien-Tabelle aller vergangenen Bestellungen mit Filter-/Suchfunktionen und dem DATEV CSV-Export für den Steuerberater.
- **Menu (`/menu`):** Zentrale Verwaltung der Speisekarte, Getränke, Kategorien, Preise und Bilder.
- **Settings (`/settings`):** Verwaltung von Account- und Betriebsdaten, Stripe-Details sowie die Möglichkeit, eine Löschanfrage für das Konto zu senden.

### 2.3 Core Features: Kitchen Board View

- **Aufbau:** Zweiteilige Ansicht ("In Bearbeitung" und "Abgeschlossen"). Aktualisiert sich via Appwrite WebSockets in Echtzeit.
- **Ablauf:** Eingehende Bestellungen erscheinen als Kacheln in historischer Reihenfolge. Ein Klick markiert die Bestellung als abgeschlossen und verschiebt sie.
- **Cleanup:** Abgeschlossene Kacheln können bei Ausgabe an den Kunden manuell gelöscht werden, ansonsten verschwinden sie nach 10 Minuten automatisch.

### 2.4 Core Features: Gast-Frontend (To-Stay & To-Go)

- **Layout:** Bottom-Navigation mit zwei Tabs (links: Menü, rechts: Warenkorb).
- **Warenkorb (Client State):** Wird lokal via `Zustand` verwaltet. Mengenänderungen sind hier möglich. Bei einem Page-Reload wird der Warenkorb resettet.
- **Checkout:** Abfrage der E-Mail-Adresse (Pflicht für digitalen Beleg), Auswahl der Zahlungsmethode (Apple Pay, Google Pay, Karte) und sofortige Bezahlung. Der Bon wird per E-Mail gesendet.
- **Nach der Bestellung:**
  - **To-Stay:** Anzeige der Bestellnummer auf dem Screen. Gast wartet am Tisch. (Page-Reload resettet den State für eine potenzielle neue Bestellung).
  - **To-Go:** Automatische Weiterleitung auf den Order-Tracker. Der Link bleibt 10 Minuten nach Bestellabschluss (Abholbereit) aktiv, danach wird er ungültig.

---

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

### 4.2 Das UI Theme (HeroUI)

Als technisches Fundament für das Interface nutzen wir **HeroUI** in Kombination mit Tailwind CSS v4. Wir setzen konsequent auf die Schriftart **Poppins** für perfekte Lesbarkeit.
**Zentrales Theme (`globals.css`):**

```css
/*
 * HeroUI Theme Customization
 * Add this to your global.css after importing @heroui/styles
 * Only includes variables users need to customize
 * @see https://heroui.com/docs/react/getting-started/theming
 */

:root,
.light,
.default,
[data-theme="light"],
[data-theme="default"] {
  /* Theme Colors (Light Mode) */
  --accent: oklch(29.22% 0.0156 264.30);
  --accent-foreground: oklch(99.11% 0 0);
  --background: oklch(97.02% 0.0000 264.30);
  --border: oklch(90.00% 0.0000 264.30);
  --danger: oklch(65.32% 0.2328 27.00);
  --danger-foreground: oklch(99.11% 0 0);
  --default: oklch(94.00% 0.0000 264.30);
  --default-foreground: oklch(21.03% 0.0059 264.30);
  --field-background: oklch(100.00% 0.0000 264.30);
  --field-border: transparent;
  --field-foreground: oklch(21.03% 0.0000 264.30);
  --field-placeholder: oklch(55.17% 0.0000 264.30);
  --focus: oklch(29.22% 0.0156 264.30);
  --foreground: oklch(21.03% 0.0000 264.30);
  --muted: oklch(55.17% 0.0000 264.30);
  --overlay: oklch(100.00% 0.0000 264.30);
  --overlay-foreground: oklch(21.03% 0.0000 264.30);
  --scrollbar: oklch(87.10% 0.0000 264.30);
  --segment: oklch(100.00% 0.0000 264.30);
  --segment-foreground: oklch(21.03% 0.0000 264.30);
  --separator: oklch(92.00% 0.0000 264.30);
  --success: oklch(73.29% 0.1935 152.07);
  --success-foreground: oklch(21.03% 0.0059 152.07);
  --surface: oklch(100.00% 0.0000 264.30);
  --surface-foreground: oklch(21.03% 0.0000 264.30);
  --surface-secondary: oklch(95.24% 0.0000 264.30);
  --surface-secondary-foreground: oklch(21.03% 0.0000 264.30);
  --surface-tertiary: oklch(93.73% 0.0000 264.30);
  --surface-tertiary-foreground: oklch(21.03% 0.0000 264.30);
  --warning: oklch(78.19% 0.1585 73.59);
  --warning-foreground: oklch(21.03% 0.0059 73.59);

  /* Border Radius */
  --radius: 0.5rem;
  --field-radius: 1rem;

  /* Font Family */
  /* Make sure to load Poppins font in your app */
  --font-sans: "Poppins", sans-serif;
}

/* 
  Der Dark Mode Block ist für Fallback-Zwecke im Code hinterlegt, 
  wird aber aufgrund der "Light Mode Only"-Philosophie im Frontend nicht aktiv angeboten.
*/

.dark,
[data-theme="dark"] {
  color-scheme: dark;
  /* Theme Colors (Dark Mode) */
  --accent: oklch(29.22% 0.0156 264.30);
  --accent-foreground: oklch(99.11% 0 0);
  --background: oklch(12.00% 0.0000 264.30);
  --border: oklch(28.00% 0.0000 264.30);
  --danger: oklch(59.40% 0.1967 25.89);
  --danger-foreground: oklch(99.11% 0 0);
  --default: oklch(27.40% 0.0000 264.30);
  --default-foreground: oklch(99.11% 0 0);
  --field-background: oklch(21.03% 0.0000 264.30);
  --field-border: transparent;
  --field-foreground: oklch(99.11% 0.0000 264.30);
  --field-placeholder: oklch(70.50% 0.0000 264.30);
  --focus: oklch(29.22% 0.0156 264.30);
  --foreground: oklch(99.11% 0.0000 264.30);
  --muted: oklch(70.50% 0.0000 264.30);
  --overlay: oklch(21.03% 0.0000 264.30);
  --overlay-foreground: oklch(99.11% 0.0000 264.30);
  --scrollbar: oklch(70.50% 0.0000 264.30);
  --segment: oklch(39.64% 0.0000 264.30);
  --segment-foreground: oklch(99.11% 0.0000 264.30);
  --separator: oklch(25.00% 0.0000 264.30);
  --success: oklch(73.29% 0.1935 152.07);
  --success-foreground: oklch(21.03% 0.0059 152.07);
  --surface: oklch(21.03% 0.0000 264.30);
  --surface-foreground: oklch(99.11% 0.0000 264.30);
  --surface-secondary: oklch(25.70% 0.0000 264.30);
  --surface-secondary-foreground: oklch(99.11% 0.0000 264.30);
  --surface-tertiary: oklch(27.21% 0.0000 264.30);
  --surface-tertiary-foreground: oklch(99.11% 0.0000 264.30);
  --warning: oklch(82.03% 0.1388 77.60);
  --warning-foreground: oklch(21.03% 0.0059 77.60);
}
```

---

## TEIL 5: TECHNISCHE IMPLEMENTIERUNG (Zero-Ops Architektur)

Das System setzt auf eine hochskalierbare, serverlose Architektur mit **Appwrite Cloud** als Backend und **GitHub** für das Code- und Repository-Management.

### 5.1 Architektur Übersicht & Repository (GitHub)

Das Projekt besteht aus zwei komplett unabhängigen Next.js-Applikationen in einem gemeinsamen GitHub-Repository.

- **Frontend Marketing (`website/`):** B2B Landingpage für den Vertrieb (deployed auf `zakkig.de`).
- **Frontend SaaS App (`webapp/`):** Admin Dashboard der Wirte, Bestell-UI der Gäste und das Echtzeit Kitchen Board (deployed auf `app.zakkig.de`).

### 5.2 Der Technologie Stack

- **Frontend-Framework:** Next.js (React) mit Server-Side Rendering (SSR) und Server Actions.
- **UI & Styling:** HeroUI kombiniert mit Tailwind CSS v4.
- **State Management:** Zustand für persistente Client-Side States.
- **Lokalisierung:** i18n für ein dynamisches, mehrsprachiges Setup (Deutsch / Englisch).
- **Backend as a Service:** Appwrite Cloud.

### 5.3 Appwrite Services (Das Backend)

1. **Database:** NoSQL für Gastronomen, Speisekarten, Bestellungen und Logs.
2. **Realtime:** WebSockets für das Kitchen Board und den Takeaway-Tracker.
3. **Storage:** S3-kompatibel für Speisekarten-Bilder (WebP-Kompression).
4. **Auth:** Onboarding und Session-Management.
5. **Functions:** Node.js-basierte Endpunkte für Stripe Webhooks und Geschäftslogik.
6. **Sites:** Globales CDN-Hosting der Next.js Frontends.
7. **Messaging:** Native Anbindung unseres externen Hetzner SMTP-Mailservers für transaktionale Mails.

### 5.4 Domain, E-Mail & CI/CD

- **Hetzner:** DNS-Management für `zakkig.de` und SMTP-Hosting (angebunden an Appwrite).
- **GitHub Actions:** Vollautomatisierte CI/CD-Pipelines für Checks, Builds und das Rolling-Deployment via Appwrite CLI.
- **Security:** Enterprise-Grade DDoS-Protection und globales CDN durch Appwrite und Stripe.

---

## TEIL 6: B2B LANDINGPAGE (zakkig.de)

Die Marketingseite wird als SEO-optimierter One-Pager über **Appwrite Sites** gehostet, ergänzt durch separate rechtliche Unterseiten. Sie wird vollständig zweisprachig umgesetzt.

### 6.1 Routing & Lokalisierung

- **Deutsch (Standard):** `/` (One-Pager), `/impressum`, `/datenschutz`, plus 404-Fallback.
- **Englisch:** `/en/` (One-Pager), `/en/legal`, `/en/privacy`, plus englisches 404-Fallback.
- **Navigation:** Lokalisierte Anchor-Links (z. B. `#loesung` vs. `#solution`).

### 6.2 Globale SEO Meta-Daten

- **Meta Title:** Lass Kunden selbst bestellen und bezahlen
- **Meta Description:** Egal ob zum Mitnehmen oder am Tisch, biete deinen Kunden eine digitale Möglichkeit zum Bestellen und Bezahlen. Sie scannen einfach einen QR-Code mit dem eigenen Handy, während dein Personal sich Wichtigerem widmen kann.
