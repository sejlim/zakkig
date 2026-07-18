import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'zakkig: Datenschutzerklärung',
  description: 'Datenschutzerklärung von zakkig.',
  robots: 'noindex, follow',
  alternates: {
    canonical: 'https://www.zakkig.de/datenschutz',
  },
  openGraph: {
    locale: 'de_DE',
    title: 'zakkig: Datenschutzerklärung',
    description: 'Datenschutzerklärung von zakkig.',
    images: ['/full.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function Datenschutz() {
  return (
    <div className="bg-black text-white min-h-screen pt-36 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs md:text-sm tracking-widest font-bold uppercase text-zinc-500 hover:text-white transition-colors duration-200"
          >
            Zurück zur Startseite
          </Link>
        </div>
        <article className="prose-sm prose-invert lg:prose-xl lg:prose-invert focus:outline-none">
          <h1>Datenschutzerklärung</h1>
          <p>Stand: 11. Juli 2026</p>

          <h2 id="m3">Verantwortlicher</h2>
          <p>
            Selim Eser
            <br />
            Dannstadter Straße 6-8
            <br />
            68199 Mannheim
            <br />
            Deutschland
          </p>
          <p>Vertretungsberechtigte Personen: Selim Eser</p>
          <p>
            E-Mail:{' '}
            <a
              href="mailto:selim@zakkig.de"
              className="text-white hover:underline"
            >
              selim@zakkig.de
            </a>
          </p>
          <p>
            Impressum:{' '}
            <a
              href="https://www.zakkig.de/impressum"
              className="text-white hover:underline"
            >
              https://www.zakkig.de/impressum
            </a>
          </p>

          <h2 id="m12">
            Allgemeine Informationen zur Datenspeicherung und Löschung
          </h2>
          <p>
            Wir löschen personenbezogene Daten, die wir verarbeiten, gemäß den
            gesetzlichen Bestimmungen, sobald die zugrundeliegenden
            Einwilligungen widerrufen werden oder keine weiteren rechtlichen
            Grundlagen für die Verarbeitung bestehen. Dies betrifft Fälle, in
            denen der ursprüngliche Verarbeitungszweck entfällt oder die Daten
            nicht mehr benötigt werden. Ausnahmen von dieser Regelung bestehen,
            wenn gesetzliche Pflichten oder besondere Interessen eine längere
            Aufbewahrung oder Archivierung der Daten erfordern.
          </p>
          <p>
            Unsere Datenschutzhinweise enthalten zusätzliche Informationen zur
            Aufbewahrung und Löschung von Daten, die speziell für bestimmte
            Verarbeitungsprozesse gelten.
          </p>
          <p>
            Bei mehreren Angaben zur Aufbewahrungsdauer oder Löschungsfristen
            eines Datums, ist stets die längste Frist maßgeblich. Daten, die
            nicht mehr für den ursprünglich vorgesehenen Zweck, sondern aufgrund
            gesetzlicher Vorgaben oder anderer Gründe aufbewahrt werden,
            verarbeiten wir ausschließlich zu den Gründen, die ihre Aufbewahrung
            rechtfertigen.
          </p>

          <h2 id="m27">Sicherheitsmaßnahmen</h2>
          <p>
            Wir treffen nach Maßgabe der gesetzlichen Vorgaben unter
            Berücksichtigung des Stands der Technik, der Implementierungskosten
            und der Art, des Umfangs, der Umstände und der Zwecke der
            Verarbeitung sowie der unterschiedlichen
            Eintrittswahrscheinlichkeiten und des Ausmaßes der Bedrohung der
            Rechte und Freiheiten natürlicher Personen geeignete technische und
            organisatorische Maßnahmen, um ein dem Risiko angemessenes
            Schutzniveau zu gewährleisten.
          </p>
          <p>
            Zu den Maßnahmen gehören insbesondere die Sicherung der
            Vertraulichkeit, Integrität und Verfügbarkeit von Daten durch
            Kontrolle des physischen und elektronischen Zugangs zu den Daten als
            auch des sie betreffenden Zugriffs, der Eingabe, der Weitergabe, der
            Sicherung der Verfügbarkeit und ihrer Trennung. Des Weiteren haben
            wir Verfahren eingerichtet, die eine Wahrnehmung von
            Betroffenenrechten, die Löschung von Daten und Reaktionen auf die
            Gefährdung der Daten gewährleisten. Ferner berücksichtigen wir den
            Schutz personenbezogener Daten bereits bei der Entwicklung bzw.
            Auswahl von Hardware, Software sowie Verfahren entsprechend dem
            Prinzip des Datenschutzes, durch Technikgestaltung und durch
            datenschutzfreundliche Voreinstellungen.
          </p>
          <p>
            Sicherung von Online-Verbindungen durch
            TLS-/SSL-Verschlüsselungstechnologie (HTTPS): Um die Daten der
            Nutzer, die über unsere Online-Dienste übertragen werden, vor
            unerlaubten Zugriffen zu schützen, setzen wir auf die
            TLS-/SSL-Verschlüsselungstechnologie. Secure Sockets Layer (SSL) und
            Transport Layer Security (TLS) are the Eckpfeiler der sicheren
            Datenübertragung im Internet. Diese Technologien verschlüsseln die
            Informationen, die zwischen der Website oder App und dem Browser des
            Nutzers (oder zwischen zwei Servern) übertragen werden, wodurch die
            Daten vor unbefugtem Zugriff geschützt sind. TLS, als die
            weiterentwickelte und sicherere Version von SSL, gewährleistet, dass
            all Datenübertragungen den höchsten Sicherheitsstandards
            entsprechen. Wenn eine Website durch ein SSL-/TLS-Zertifikat
            gesichert ist, wird dies durch die Anzeige von HTTPS in der URL
            signalisiert. Dies dient als ein Indikator für die Nutzer, dass ihre
            Daten sicher und verschlüsselt übertragen werden.
          </p>

          <h2 id="m239">Wartelisten-Formular</h2>
          <p>
            Auf unserer Website bieten wir die Möglichkeit an, sich über ein
            Formular unverbindlich in unsere Warteliste für unser Produkt
            &quot;zakkig&quot; einzutragen. In diesem Rahmen erfassen wir Ihre
            E-Mail-Adresse, um Ihnen Neuigkeiten über das Projekt sowie den
            offiziellen Release zuzusenden.
          </p>
          <ul>
            <li>
              <strong>Verarbeitete Datenarten:</strong> Kontaktdaten
              (E-Mail-Adresse).
            </li>
            <li>
              <strong>Betroffene Personen:</strong> Nutzer unseres
              Wartelisten-Formulars.
            </li>
            <li>
              <strong>Zwecke der Verarbeitung:</strong> Zusendung von
              Neuigkeiten zum Projekt; Informationen zum offiziellen Release und
              Angeboten.
            </li>
            <li>
              <strong>Aufbewahrung und Löschung:</strong> Löschung entsprechend
              den Angaben im Abschnitt "Allgemeine Informationen zur
              Datenspeicherung und Löschung", unmittelbar nach Erhalt einer
              Löschanfrage per E-Mail oder über den Abmeldelink, der am Ende
              jeder unserer E-Mails zur Löschung aus der Datenbank
              bereitgestellt wird.
            </li>
            <li>
              <strong>Rechtsgrundlagen:</strong> Einwilligung (Art. 6 Abs. 1 S.
              1 lit. a) DSGVO) sowie vorvertragliche Maßnahmen (Art. 6 Abs. 1 S.
              1 lit. b) DSGVO).
            </li>
          </ul>

          <h2 id="m225">Bereitstellung des Onlineangebots und Webhosting</h2>
          <p>
            Wir verarbeiten die Daten der Nutzer, um ihnen unsere Online-Dienste
            zur Verfügung stellen zu können. Zu diesem Zweck verarbeiten wir die
            IP-Adresse des Nutzers, die notwendig ist, um die Inhalte und
            Funktionen unserer Online-Dienste an den Browser oder das Endgerät
            der Nutzer zu übermitteln.
          </p>
          <ul>
            <li>
              <strong>Verarbeitete Datenarten:</strong> Nutzungsdaten (z. B.
              Seitenaufrufe und Verweildauer, Klickpfade, Nutzungsintensität und
              -frequenz, verwendete Gerätetypen und Betriebssysteme,
              Interaktionen mit Inhalten und Funktionen); Meta-, Kommunikations-
              und Verfahrensdaten (z. B. IP-Adressen, Zeitangaben,
              Identifikationsnummern, beteiligte Personen); Protokolldaten (z.
              B. Logfiles betreffend Logins oder den Abruf von Daten oder
              Zugriffszeiten). Inhaltsdaten (z. B. textliche oder bildliche
              Nachrichten und Beiträge sowie die sie betreffenden Informationen,
              wie z. B. Angaben zur Autorenschaft oder Zeitpunkt der
              Erstellung).
            </li>
            <li>
              <strong>Betroffene Personen:</strong> Nutzer (z. B.
              Webseitenbesucher, Nutzer von Onlinediensten).
            </li>
            <li>
              <strong>
                Zwecke der Verarbeitung und berechtigte Interessen:
              </strong>{' '}
              Bereitstellung unseres Onlineangebotes und Nutzerfreundlichkeit;
              Informationstechnische Infrastruktur (Betrieb und Bereitstellung
              von Informationssystemen und technischen Geräten (Computer, Server
              etc.)). Sicherheitsmaßnahmen.
            </li>
            <li>
              <strong>Aufbewahrung und Löschung:</strong> Löschung entsprechend
              Angaben im Abschnitt &quot;Allgemeine Informationen zur
              Datenspeicherung und Löschung&quot;.
            </li>
            <li>
              <strong>Rechtsgrundlagen:</strong> Berechtigte Interessen (Art. 6
              Abs. 1 S. 1 lit. f) DSGVO).
            </li>
          </ul>
          <p>
            <strong>
              Weitere Hinweise zu Verarbeitungsprozessen, Verfahren und
              Diensten:
            </strong>
          </p>
          <ul>
            <li>
              <strong>
                Bereitstellung Onlineangebot auf gemietetem Speicherplatz:
              </strong>{' '}
              Für die Bereitstellung unseres Onlineangebotes nutzen wir
              Speicherplatz, Rechenkapazität und Software, die wir von einem
              entsprechenden Serveranbieter (auch &quot;Webhoster&quot; genannt)
              mieten oder anderweitig beziehen;{' '}
              <strong>Rechtsgrundlagen:</strong> Berechtigte Interessen (Art. 6
              Abs. 1 S. 1 lit. f) DSGVO).
            </li>
            <li>
              <strong>Erhebung von Zugriffsdaten und Logfiles:</strong> Der
              Zugriff auf unser Onlineangebot wird in Form von sogenannten
              &quot;Server-Logfiles&quot; protokolliert. Zu den Serverlogfiles
              können die Adresse und der Name der abgerufenen Webseiten und
              Dateien, Datum und Uhrzeit des Abrufs, übertragene Datenmengen,
              Meldung über erfolgreichen Abruf, Browsertyp nebst Version, das
              Betriebssystem des Nutzers, Referrer URL (die zuvor besuchte
              Seite) und im Regelfall IP-Adressen und der anfragende Provider
              gehören. Die Serverlogfiles können zum einen zu Sicherheitszwecken
              eingesetzt werden, z. B. um eine Überlastung der Server zu
              vermeiden (insbesondere im Fall von missbräuchlichen Angriffen,
              sogenannten DDoS-Attacken), und zum anderen, um die Auslastung der
              Server und ihre Stabilität sicherzustellen;{' '}
              <strong>Rechtsgrundlagen:</strong> Berechtigte Interessen (Art. 6
              Abs. 1 S. 1 lit. f) DSGVO). <strong>Löschung von Daten:</strong>{' '}
              Logfile-Informationen werden für die Dauer von maximal 30 Tagen
              gespeichert und danach gelöscht oder anonymisiert. Daten, deren
              weitere Aufbewahrung zu Beweiszwecken erforderlich ist, sind bis
              zur endgültigen Klärung des jeweiligen Vorfalls von der Löschung
              ausgenommen.
            </li>
            <li>
              <strong>E-Mail-Versand und -Hosting:</strong> Die von uns in
              Anspruch genommenen Webhosting-Leistungen umfassen ebenfalls den
              Versand, den Empfang sowie die Speicherung von E-Mails. Zu diesen
              Zwecken werden die Adressen der Empfänger sowie Absender als auch
              weitere Informationen betreffend den E-Mailversand (z. B. die
              beteiligten Provider) sowie die Inhalte der jeweiligen E-Mails
              verarbeitet. Die vorgenannten Daten können ferner zu Zwecken der
              Erkennung von SPAM verarbeitet werden. Wir bitten darum, zu
              beachten, dass E-Mails im Internet grundsätzlich nicht
              verschlüsselt versendet werden. Im Regelfall werden E-Mails zwar
              auf dem Transportweg verschlüsselt, aber (sofern kein sogenanntes
              Ende-zu-Ende-Verschlüsselungsverfahren eingesetzt wird) nicht auf
              den Servern, von denen sie abgesendet und empfangen werden. Wir
              können daher für den Übertragungsweg der E-Mails zwischen dem
              Absender und dem Empfang auf unserem Server keine Verantwortung
              übernehmen; <strong>Rechtsgrundlagen:</strong> Berechtigte
              Interessen (Art. 6 Abs. 1 S. 1 lit. f) DSGVO).
            </li>
            <li>
              <strong>Hetzner:</strong> Leistungen auf dem Gebiet der
              Bereitstellung von informationstechnischer Infrastruktur und
              verbundenen Dienstleistungen (z. B. Speicherplatz und/oder
              Rechenkapazitäten); <strong>Dienstanbieter:</strong> Hetzner
              Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland;{' '}
              <strong>Rechtsgrundlagen:</strong> Berechtigte Interessen (Art. 6
              Abs. 1 S. 1 lit. f) DSGVO); <strong>Website:</strong>{' '}
              <a
                href="https://www.hetzner.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                https://www.hetzner.com
              </a>
              ; <strong>Datenschutzerklärung:</strong>{' '}
              <a
                href="https://www.hetzner.com/de/rechtliches/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                https://www.hetzner.com/de/rechtliches/datenschutz
              </a>
              . <strong>Auftragsverarbeitungsvertrag:</strong>{' '}
              <a
                href="https://docs.hetzner.com/de/general/general-terms-and-conditions/data-privacy-faq/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                https://docs.hetzner.com/de/general/general-terms-and-conditions/data-privacy-faq/
              </a>
              .
            </li>
          </ul>

          <h2 id="m328">Plug-ins und eingebettete Funktionen sowie Inhalte</h2>
          <p>
            Wir binden Funktions- und Inhaltselemente in unser Onlineangebot
            ein, die von den Servern ihrer jeweiligen Anbieter (nachfolgend als
            „Drittanbieter&quot; bezeichnet) bezogen werden. Dabei kann es sich
            zum Beispiel um Grafiken, Videos oder Stadtpläne handeln
            (nachfolgend einheitlich als „Inhalte&quot; bezeichnet).
          </p>
          <p>
            Die Einbindung setzt immer voraus, dass die Drittanbieter dieser
            Inhalte die IP-Adresse der Nutzer verarbeiten, da sie ohne
            IP-Adresse die Inhalte nicht an deren Browser senden könnten. Die
            IP-Adresse ist damit für die Darstellung dieser Inhalte oder
            Funktionen erforderlich. Wir bemühen uns, nur solche Inhalte zu
            verwenden, deren jeweilige Anbieter die IP-Adresse lediglich zur
            Auslieferung der Inhalte anzuwenden. Drittanbieter können ferner
            sogenannte Pixel-Tags (unsichtbare Grafiken, auch als „Web
            Beacons&quot; bezeichnet) für statistische oder Marketingzwecke
            einsetzen. Durch die „Pixel-Tags&quot; können Informationen, wie
            etwa der Besucherverkehr auf den Seiten dieser Website, ausgewertet
            werden. Die pseudonymen Informationen können darüber hinaus in
            Cookies auf dem Gerät der Nutzer gespeichert werden und unter
            anderem technische Auskünfte zum Browser und zum Betriebssystem, zu
            verweisenden Websites, zur Besuchszeit sowie weitere Angaben zur
            Nutzung unseres Onlineangebots enthalten, aber auch mit solchen
            Informationen aus anderen Quellen verbunden werden.
          </p>
          <p>
            <strong>Hinweise zu Rechtsgrundlagen:</strong> Sofern wir die Nutzer
            um ihre Einwilligung in den Einsatz der Drittanbieter bitten, stellt
            die Rechtsgrundlage der Datenverarbeitung die Erlaubnis dar.
            Ansonsten werden die Nutzerdaten auf Grundlage unserer berechtigten
            Interessen (d. h. Interesse an effizienten, wirtschaftlichen und
            empfängerfreundlichen Leistungen) verarbeitet. In diesem
            Zusammenhang möchten wir Sie auch auf die Informationen zur
            Verwendung von Cookies in dieser Datenschutzerklärung hinweisen.
          </p>
          <ul>
            <li>
              <strong>Verarbeitete Datenarten:</strong> Nutzungsdaten (z. B.
              Seitenaufrufe und Verweildauer, Klickpfade, Nutzungsintensität und
              -frequenz, verwendete Gerätetypen und Betriebssysteme,
              Interaktionen mit Inhalten und Funktionen). Meta-, Kommunikations-
              und Verfahrensdaten (z. B. IP-Adressen, Zeitangaben,
              Identifikationsnummern, beteiligte Personen).
            </li>
            <li>
              <strong>Betroffene Personen:</strong> Nutzer (z. B.
              Webseitenbesucher, Nutzer von Onlinediensten).
            </li>
            <li>
              <strong>
                Zwecke der Verarbeitung und berechtigte Interessen:
              </strong>{' '}
              Bereitstellung unseres Onlineangebotes und Nutzerfreundlichkeit.
            </li>
            <li>
              <strong>Aufbewahrung und Löschung:</strong> Deletion in accordance
              with the information in the section &quot;General information on
              data storage and deletion&quot;. Storage of cookies for up to 2
              years (Unless otherwise specified, cookies and similar storage
              methods may be stored on users&#x27; devices for a period of two
              years.).
            </li>
            <li>
              <strong>Rechtsgrundlagen:</strong> Einwilligung (Art. 6 Abs. 1 S.
              1 lit. a) DSGVO). Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit.
              f) DSGVO).
            </li>
          </ul>
          <p>
            <strong>
              Weitere Hinweise zu Verarbeitungsprozessen, Verfahren und
              Diensten:
            </strong>
          </p>
          <ul>
            <li>
              <strong>Google Fonts (Bezug vom Google Server):</strong> Bezug von
              Schriften (und Symbolen) zum Zwecke einer technisch sicheren,
              wartungsfreien und effizienten Nutzung von Schriften und Symbolen
              im Hinblick auf Aktualität und Ladezeiten, deren einheitliche
              Darstellung und Berücksichtigung möglicher lizenzrechtlicher
              Beschränkungen. Dem Anbieter der Schriftarten wird die IP-Adresse
              des Nutzers mitgeteilt, damit die Schriftarten im Browser des
              Nutzers zur Verfügung gestellt werden können. Darüber hinaus
              werden technische Daten (Spracheinstellungen, Bildschirmauflösung,
              Betriebssystem, verwendete Hardware) übermittelt, die für die
              Bereitstellung der Schriften in Abhängigkeit von den verwendeten
              Geräten und der technischen Umgebung notwendig sind. Diese Daten
              können auf einem Server des Anbieters der Schriftarten in den USA
              verarbeitet werden - Beim Besuch unseres Onlineangebotes senden
              die Browser der Nutzer ihre Browser HTTP-Anfragen an die Google
              Fonts Web API (d. h. eine Softwareschnittstelle für den Abruf der
              Schriftarten). Die Google Fonts Web API stellt den Nutzern die
              Cascading Style Sheets (CSS) von Google Fonts und danach die in
              der CCS angegebenen Schriftarten zur Verfügung. Zu diesen
              HTTP-Anfragen gehören (1) die vom jeweiligen Nutzer für den
              Zugriff auf das Internet verwendete IP-Adresse, (2) die
              angeforderte URL auf dem Google-Server und (3) die HTTP-Header,
              einschließlich des User-Agents, der die Browser- und
              Betriebssystemversionen der Websitebesucher beschreibt, sowie die
              Verweis-URL (d. h. die Webseite, auf der die Google-Schriftart
              angezeigt werden soll). IP-Adressen werden weder auf
              Google-Servern protokolliert noch gespeichert und sie werden nicht
              analysiert. Die Google Fonts Web API protokolliert Details der
              HTTP-Anfragen (angeforderte URL, User-Agent und Verweis-URL). Der
              Zugriff auf diese Daten ist eingeschränkt und streng kontrolliert.
              Die angeforderte URL identifiziert die Schriftfamilien, für die
              der Nutzer Schriftarten laden möchte. Diese Daten werden
              protokolliert, damit Google bestimmen kann, wie oft eine bestimmte
              Schriftfamilie angefordert wird. Bei der Google Fonts Web API muss
              der User-Agent die Schriftart anpassen, die für den jeweiligen
              Browsertyp generiert wird. Der User-Agent wird in erster Linie zum
              Debugging protokolliert und verwendet, um aggregierte
              Nutzungsstatistiken zu generieren, mit denen die Beliebtheit von
              Schriftfamilien gemessen wird. Diese zusammengefassten
              Nutzungsstatistiken werden auf der Seite „Analysen&quot; von
              Google Fonts veröffentlicht. Schließlich wird die Verweis-URL
              protokolliert, sodass die Daten für die Wartung der Produktion
              verwendet und ein aggregierter Bericht zu den Top-Integrationen
              basierend auf der Anzahl der Schriftartenanfragen generiert werden
              kann. Google verwendet laut eigener Auskunft keine der von Google
              Fonts erfassten Informationen, um Profile von Endnutzern zu
              erstellen oder zielgerichtete Anzeigen zu schalten;{' '}
              <strong>Dienstanbieter:</strong> Google Ireland Limited, Gordon
              House, Barrow Street, Dublin 4, Irland;{' '}
              <strong>Rechtsgrundlagen:</strong> Berechtigte Interessen (Art. 6
              Abs. 1 S. 1 lit. f) DSGVO); <strong>Website:</strong>{' '}
              <a
                href="https://fonts.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                https://fonts.google.com/
              </a>
              ; <strong>Datenschutzerklärung:</strong>{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                https://policies.google.com/privacy
              </a>
              ; <strong>Grundlage Drittlandtransfers:</strong> Data Privacy
              Framework (DPF). <strong>Weitere Informationen:</strong>{' '}
              <a
                href="https://developers.google.com/fonts/faq/privacy?hl=de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:underline"
              >
                https://developers.google.com/fonts/faq/privacy?hl=de
              </a>
              .
            </li>
          </ul>
        </article>
      </div>
    </div>
  );
}
