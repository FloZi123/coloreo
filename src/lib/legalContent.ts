import type { Locale } from "@/i18n/config";

type LegalKey = "impressum" | "datenschutz" | "agb" | "widerruf" | "kontakt";

const PH = "【 PLATZHALTER – vor Go-Live durch echte Angaben ersetzen 】";

const content: Record<LegalKey, Partial<Record<Locale, { title: string; html: string }>>> = {
  impressum: {
    de: {
      title: "Impressum",
      html: `<p>Angaben gemäß § 5 TMG:</p>
<p>${PH}<br/>Firmenname / Inhaber<br/>Straße &amp; Hausnummer<br/>PLZ Ort, Deutschland</p>
<p><strong>Vertreten durch:</strong> ${PH}</p>
<p><strong>Kontakt:</strong><br/>E-Mail: ${PH}<br/>Telefon: ${PH}</p>
<p><strong>Umsatzsteuer-ID:</strong> ${PH}</p>
<p><strong>Verantwortlich i.S.d. § 18 Abs. 2 MStV:</strong> ${PH}</p>
<p>Plattform der EU-Kommission zur Online-Streitbeilegung: https://ec.europa.eu/consumers/odr</p>`,
    },
    en: {
      title: "Imprint",
      html: `<p>Information pursuant to § 5 TMG (German Telemedia Act):</p>
<p>${PH}<br/>Company / Owner<br/>Street &amp; No.<br/>Postal code, City, Germany</p>
<p><strong>Contact:</strong> Email: ${PH} · Phone: ${PH}</p>
<p><strong>VAT ID:</strong> ${PH}</p>`,
    },
  },
  datenschutz: {
    de: {
      title: "Datenschutzerklärung",
      html: `<p>Diese Datenschutzerklärung klärt über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten beim Besuch und bei der Nutzung von coloreo.shop gemäß der Datenschutz-Grundverordnung (DSGVO) auf.</p>

<h3>1. Verantwortlicher</h3>
<p>FZ-Capital GmbH<br/>${PH}<br/>Geschäftsführer: ${PH}<br/>E-Mail: hallo@coloreo.shop</p>

<h3>2. Verarbeitete Daten, Zwecke und Rechtsgrundlagen</h3>
<p><strong>a) Kauf &amp; Bereitstellung der Malbücher.</strong> Beim Kauf verarbeiten wir Ihre E-Mail-Adresse, Bestelldaten (gekaufte Produkte, Bestellnummer, Betrag) sowie die über unseren Zahlungsdienstleister abgewickelten Zahlungsdaten. Zweck: Vertragsabwicklung, Bereitstellung des Download-Links und Versand der Kaufbestätigung. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), für die steuerliche Aufbewahrung Art. 6 Abs. 1 lit. c DSGVO.</p>
<p><strong>b) Personalisiertes Wasserzeichen.</strong> Jede ausgelieferte PDF-Datei wird mit Ihrer E-Mail-Adresse und Bestellnummer als sichtbarem Wasserzeichen versehen, um unautorisierte Weitergabe zu verhindern. Rechtsgrundlage: Art. 6 Abs. 1 lit. b und lit. f DSGVO (berechtigtes Interesse am Schutz unserer digitalen Produkte).</p>
<p><strong>c) Kundenkonto / „Meine Bibliothek".</strong> Optional können Sie ein Konto per Magic-Link (passwortlose Anmeldung) anlegen, um auf Ihre gekauften Bücher zuzugreifen. Verarbeitet werden E-Mail-Adresse und Zuordnung Ihrer Bestellungen. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</p>
<p><strong>d) Newsletter &amp; Gratis-Probeseiten.</strong> Wenn Sie den Newsletter abonnieren oder Gratis-Probeseiten anfordern, verarbeiten wir Ihre E-Mail-Adresse im Double-Opt-in-Verfahren (Bestätigungs-E-Mail). Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Sie können sich jederzeit über den Abmeldelink oder per E-Mail an hallo@coloreo.shop abmelden; der Widerruf berührt die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung nicht.</p>
<p><strong>e) Server-Logfiles.</strong> Beim Aufruf der Website werden technisch erforderliche Daten (IP-Adresse, Datum/Uhrzeit, abgerufene Ressource, Browser-/Geräteinformationen) durch unseren Hoster verarbeitet. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sicherer und stabiler Betrieb).</p>
<p><strong>f) Support-Chatbot.</strong> Für unseren KI-Support-Assistenten werden Ihre Chat-Eingaben verarbeitet, um Ihre Anfrage zu beantworten. Geben Sie dort bitte keine sensiblen Daten ein. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Bestell-/Downloadhilfe) bzw. Art. 6 Abs. 1 lit. f DSGVO (effizienter Kundensupport).</p>

<h3>3. Eingesetzte Dienstleister (Auftragsverarbeiter)</h3>
<p>Wir setzen sorgfältig ausgewählte Dienstleister ein, mit denen Auftragsverarbeitungsverträge nach Art. 28 DSGVO bestehen:</p>
<p><strong>Hosting:</strong> Vercel Inc., USA – Auslieferung der Website.<br/>
<strong>Datenbank, Authentifizierung &amp; Datei-Speicher:</strong> Supabase (EU-Region) – Speicherung von Bestell-, Konto- und Download-Daten.<br/>
<strong>Zahlungsabwicklung:</strong> Stripe Payments Europe, Limited, Irland – Karten- und PayPal-Zahlung. Die Zahlungsdaten werden direkt an Stripe übermittelt; wir speichern keine vollständigen Kartendaten.<br/>
<strong>E-Mail-Versand:</strong> ALL-INKL.COM – Neue Medien Münnich, Deutschland – Versand von Bestätigungs-, Download- und Newsletter-E-Mails.<br/>
<strong>KI-Support-Chatbot:</strong> Anthropic PBC, USA – Verarbeitung der Chat-Eingaben zur Beantwortung von Anfragen.<br/>
<strong>Reichweitenmessung:</strong> PostHog (EU-Hosting) – nur mit Einwilligung, siehe Ziffer 5.</p>

<h3>4. Drittlandübermittlung</h3>
<p>Bei einzelnen Diensten (z. B. Vercel, Anthropic, Stripe-Konzern) kann eine Verarbeitung in den USA stattfinden. Soweit kein Angemessenheitsbeschluss vorliegt, erfolgt die Übermittlung auf Grundlage der EU-Standardvertragsklauseln (Art. 46 DSGVO) sowie ergänzender Schutzmaßnahmen.</p>

<h3>5. Cookies &amp; Reichweitenmessung</h3>
<p>Technisch notwendige Cookies (z. B. Warenkorb, Anmeldung) setzen wir auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO bzw. § 25 Abs. 2 TDDDG ein. Eine Reichweitenmessung mit PostHog (EU-Hosting) erfolgt ausschließlich nach Ihrer Einwilligung über das Cookie-Banner (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Es werden keine Session-Recordings erstellt. Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.</p>

<h3>6. Speicherdauer</h3>
<p>Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke erforderlich ist. Bestell- und Rechnungsdaten unterliegen den gesetzlichen Aufbewahrungsfristen (i. d. R. 6–10 Jahre). Newsletter-Daten speichern wir bis zum Widerruf der Einwilligung.</p>

<h3>7. Ihre Rechte</h3>
<p>Sie haben das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) sowie auf Widerspruch (Art. 21 DSGVO). Erteilte Einwilligungen können Sie jederzeit widerrufen. Zur Ausübung genügt eine E-Mail an hallo@coloreo.shop. Zudem haben Sie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.</p>`,
    },
    en: {
      title: "Privacy Policy",
      html: `<p>This privacy policy explains the nature, scope and purpose of the processing of personal data when visiting and using coloreo.shop in accordance with the General Data Protection Regulation (GDPR).</p>

<h3>1. Controller</h3>
<p>FZ-Capital GmbH<br/>${PH}<br/>Managing Director: ${PH}<br/>Email: hallo@coloreo.shop</p>

<h3>2. Data processed, purposes and legal bases</h3>
<p><strong>a) Purchase &amp; delivery.</strong> On purchase we process your email address, order data (products, order number, amount) and payment data handled by our payment provider. Purpose: contract performance, provision of the download link, order confirmation. Legal basis: Art. 6(1)(b) GDPR; for tax retention Art. 6(1)(c) GDPR.</p>
<p><strong>b) Personalized watermark.</strong> Each delivered PDF is marked with your email address and order number as a visible watermark to prevent unauthorized sharing. Legal basis: Art. 6(1)(b) and (f) GDPR (legitimate interest in protecting our digital products).</p>
<p><strong>c) Customer account / "My Library".</strong> Optionally you can create an account via magic link (passwordless login). We process your email address and the link to your orders. Legal basis: Art. 6(1)(b) GDPR.</p>
<p><strong>d) Newsletter &amp; free sample pages.</strong> If you subscribe or request free samples, we process your email via double opt-in. Legal basis: Art. 6(1)(a) GDPR (consent). You can unsubscribe at any time via the link or by emailing hallo@coloreo.shop.</p>
<p><strong>e) Server log files.</strong> Technically required data (IP address, date/time, requested resource, browser/device data) is processed by our host. Legal basis: Art. 6(1)(f) GDPR.</p>
<p><strong>f) Support chatbot.</strong> For our AI support assistant your chat inputs are processed to answer your request. Please do not enter sensitive data. Legal basis: Art. 6(1)(b)/(f) GDPR.</p>

<h3>3. Processors</h3>
<p><strong>Hosting:</strong> Vercel Inc., USA.<br/>
<strong>Database, authentication &amp; file storage:</strong> Supabase (EU region).<br/>
<strong>Payments:</strong> Stripe Payments Europe, Limited, Ireland (card &amp; PayPal). We do not store full card data.<br/>
<strong>Email delivery:</strong> ALL-INKL.COM – Neue Medien Münnich, Germany.<br/>
<strong>AI support chatbot:</strong> Anthropic PBC, USA.<br/>
<strong>Analytics:</strong> PostHog (EU hosting) – consent only, see section 5.</p>

<h3>4. Transfers to third countries</h3>
<p>Some services (e.g. Vercel, Anthropic, Stripe group) may process data in the USA. Where no adequacy decision applies, transfers are based on the EU Standard Contractual Clauses (Art. 46 GDPR) and additional safeguards.</p>

<h3>5. Cookies &amp; analytics</h3>
<p>Technically necessary cookies (cart, login) are used under Art. 6(1)(f) GDPR / § 25(2) TDDDG. Analytics via PostHog (EU hosting) only takes place with your consent via the cookie banner (Art. 6(1)(a) GDPR). No session recordings. You can withdraw consent at any time.</p>

<h3>6. Retention</h3>
<p>We keep personal data only as long as necessary. Order and invoice data are subject to statutory retention periods (typically 6–10 years). Newsletter data is kept until consent is withdrawn.</p>

<h3>7. Your rights</h3>
<p>You have the right to access, rectification, erasure, restriction, data portability and objection, and to withdraw consent at any time. Contact: hallo@coloreo.shop. You also have the right to lodge a complaint with a supervisory authority.</p>`,
    },
  },
  agb: {
    de: {
      title: "Allgemeine Geschäftsbedingungen",
      html: `<h3>§ 1 Geltungsbereich &amp; Anbieter</h3>
<p>Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über den Kauf digitaler Malbücher (PDF-Dateien) über coloreo.shop zwischen der FZ-Capital GmbH (nachfolgend „Anbieter") und Ihnen als Kunde. Anschrift und Vertretung siehe Impressum.</p>

<h3>§ 2 Vertragsschluss</h3>
<p>Die Darstellung der Produkte im Shop stellt kein bindendes Angebot dar. Durch Anklicken des Bezahl-Buttons im Bestellabschluss geben Sie ein verbindliches Angebot zum Kauf der im Warenkorb enthaltenen digitalen Produkte ab. Der Vertrag kommt mit der Bestätigung der Bestellung bzw. der Bereitstellung des Downloads zustande. Der Kauf ist als Gast oder mit Kundenkonto möglich.</p>

<h3>§ 3 Preise &amp; Zahlung</h3>
<p>Es gelten die zum Zeitpunkt der Bestellung im Shop angegebenen Preise. Alle Preise verstehen sich in Euro inklusive der gesetzlichen Umsatzsteuer. Mengenrabatte und Bundle-Preise werden vor Abschluss transparent im Warenkorb angezeigt. Die Zahlung erfolgt über den Dienstleister Stripe per Kreditkarte oder PayPal. Mit Abschluss der Zahlung wird der Kaufbetrag fällig.</p>

<h3>§ 4 Lieferung digitaler Inhalte</h3>
<p>Die Lieferung erfolgt ausschließlich digital. Unmittelbar nach erfolgreichem Zahlungseingang erhalten Sie einen Download-Link – angezeigt im Shop und per E-Mail – sowie, bei bestehendem Konto, Zugriff über „Meine Bibliothek". Download-Links sind aus Sicherheitsgründen signiert und zeitlich befristet; bei Bedarf kann ein neuer Link angefordert werden. Es entstehen keine Versandkosten.</p>

<h3>§ 5 Nutzungsrechte &amp; Wasserzeichen</h3>
<p>Mit vollständiger Zahlung erhalten Sie ein einfaches, nicht übertragbares Nutzungsrecht an den erworbenen Dateien zum privaten, nicht-kommerziellen Gebrauch (Ausdruck und Ausmalen für eigene Zwecke). Die Weitergabe, Vervielfältigung zur Verbreitung, der Weiterverkauf sowie die öffentliche Zugänglichmachung der Dateien sind nicht gestattet. Jede Datei enthält ein personalisiertes Wasserzeichen (E-Mail-Adresse und Bestellnummer) zur Kennzeichnung.</p>

<h3>§ 6 Widerrufsrecht bei digitalen Inhalten</h3>
<p>Verbrauchern steht grundsätzlich ein Widerrufsrecht zu. Bei der Lieferung digitaler Inhalte, die nicht auf einem körperlichen Datenträger geliefert werden, erlischt das Widerrufsrecht jedoch, wenn Sie vor Beginn der Ausführung ausdrücklich zugestimmt und Ihre Kenntnis vom Verlust des Widerrufsrechts bestätigt haben. Diese Zustimmung holen wir im Bestellprozess ein. Einzelheiten regelt die <a href="/widerruf">Widerrufsbelehrung</a>.</p>

<h3>§ 7 Gewährleistung &amp; Mängel</h3>
<p>Es gelten die gesetzlichen Bestimmungen zur Mängelhaftung für digitale Produkte (§§ 327 ff. BGB). Sollte eine Datei fehlerhaft oder nicht abrufbar sein, kontaktieren Sie uns unter hallo@coloreo.shop – wir stellen die Datei umgehend erneut bereit oder beheben den Mangel.</p>

<h3>§ 8 Haftung</h3>
<p>Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Bei einfacher Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) und begrenzt auf den vertragstypisch vorhersehbaren Schaden. Im Übrigen ist die Haftung ausgeschlossen.</p>

<h3>§ 9 Vertragssprache &amp; Vertragstext</h3>
<p>Die Vertragssprachen sind Deutsch und Englisch. Den Vertragstext (Bestelldaten und AGB) erhalten Sie mit der Bestätigung per E-Mail.</p>

<h3>§ 10 Streitbeilegung</h3>
<p>Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: https://ec.europa.eu/consumers/odr. Wir sind nicht verpflichtet und grundsätzlich nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>

<h3>§ 11 Schlussbestimmungen</h3>
<p>Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts; zwingende Verbraucherschutzvorschriften des Wohnsitzstaates des Kunden bleiben unberührt. Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>`,
    },
    en: {
      title: "Terms & Conditions",
      html: `<h3>§ 1 Scope &amp; provider</h3>
<p>These terms apply to all contracts for the purchase of digital coloring books (PDF files) via coloreo.shop between FZ-Capital GmbH ("provider") and you as the customer. Address and representation: see Imprint.</p>

<h3>§ 2 Conclusion of contract</h3>
<p>The presentation of products is not a binding offer. By clicking the payment button at checkout you submit a binding offer to purchase the digital products in your cart. The contract is concluded upon order confirmation or provision of the download. Purchase is possible as a guest or with an account.</p>

<h3>§ 3 Prices &amp; payment</h3>
<p>The prices stated in the shop at the time of order apply, in Euro including statutory VAT. Quantity discounts and bundle prices are shown transparently in the cart before checkout. Payment is processed via Stripe by credit card or PayPal.</p>

<h3>§ 4 Delivery of digital content</h3>
<p>Delivery is exclusively digital. Immediately after successful payment you receive a download link – shown in the shop and by email – and, with an account, access via "My Library". Download links are signed and time-limited for security; a new link can be requested. No shipping costs apply.</p>

<h3>§ 5 License &amp; watermark</h3>
<p>Upon full payment you receive a simple, non-transferable license for private, non-commercial use (printing and coloring for your own purposes). Sharing, reproduction for distribution, resale and making the files publicly available are not permitted. Each file carries a personalized watermark (email address and order number).</p>

<h3>§ 6 Right of withdrawal for digital content</h3>
<p>Consumers generally have a right of withdrawal. However, for digital content not supplied on a physical medium, the right of withdrawal expires if you have expressly consented to the start of performance and confirmed your knowledge of the loss of the withdrawal right. We obtain this consent during checkout. See the <a href="/widerruf">withdrawal policy</a> for details.</p>

<h3>§ 7 Warranty &amp; defects</h3>
<p>Statutory provisions on liability for defects in digital products apply. If a file is faulty or not retrievable, contact us at hallo@coloreo.shop – we will re-provide the file or remedy the defect promptly.</p>

<h3>§ 8 Liability</h3>
<p>The provider is liable without limitation for intent and gross negligence and for injury to life, body or health. For simple negligence the provider is liable only for breach of essential contractual obligations and limited to foreseeable, contract-typical damage. Otherwise liability is excluded.</p>

<h3>§ 9 Contract language</h3>
<p>The contract languages are German and English. You receive the contract text (order data and terms) with the confirmation email.</p>

<h3>§ 10 Dispute resolution</h3>
<p>The EU Commission provides an online dispute resolution platform: https://ec.europa.eu/consumers/odr. We are not obliged and generally not willing to participate in dispute resolution proceedings before a consumer arbitration board.</p>

<h3>§ 11 Final provisions</h3>
<p>German law applies, excluding the UN Convention on Contracts for the International Sale of Goods; mandatory consumer protection rules of the customer's country of residence remain unaffected. Should any provision be invalid, the remaining provisions remain effective.</p>`,
    },
  },
  widerruf: {
    de: {
      title: "Widerrufsbelehrung",
      html: `<h3>Widerrufsrecht</h3>
<p>Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.</p>
<p>Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (FZ-Capital GmbH, Anschrift siehe Impressum, E-Mail: hallo@coloreo.shop) mittels einer eindeutigen Erklärung (z. B. per E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das unten stehende Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung vor Ablauf der Frist absenden.</p>

<h3>Folgen des Widerrufs</h3>
<p>Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab Eingang Ihrer Widerrufsmitteilung zurückzuzahlen. Für die Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben; Entgelte entstehen Ihnen dadurch nicht.</p>

<h3>Vorzeitiges Erlöschen des Widerrufsrechts</h3>
<p>Das Widerrufsrecht erlischt bei einem Vertrag über die Lieferung von nicht auf einem körperlichen Datenträger befindlichen digitalen Inhalten, wenn wir mit der Ausführung des Vertrags begonnen haben, nachdem Sie</p>
<p>(1) ausdrücklich zugestimmt haben, dass wir mit der Ausführung vor Ablauf der Widerrufsfrist beginnen, und<br/>
(2) Ihre Kenntnis davon bestätigt haben, dass Sie durch Ihre Zustimmung mit Beginn der Ausführung Ihr Widerrufsrecht verlieren.</p>
<p>Diese Zustimmung holen wir im Bestellprozess durch folgende Bestätigung ein: <em>„Ich stimme ausdrücklich zu, dass die Ausführung sofort beginnt, und mir ist bekannt, dass ich mein Widerrufsrecht mit Beginn des Downloads verliere."</em></p>

<h3>Muster-Widerrufsformular</h3>
<p>(Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden es zurück.)</p>
<p>— An: FZ-Capital GmbH, ${PH}, E-Mail: hallo@coloreo.shop<br/>
— Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden digitalen Inhalte:<br/>
— Bestellt am (*) / Bestellnummer:<br/>
— Name des/der Verbraucher(s):<br/>
— Anschrift des/der Verbraucher(s):<br/>
— Datum:<br/>
(*) Unzutreffendes streichen.</p>`,
    },
    en: {
      title: "Right of Withdrawal",
      html: `<h3>Right of withdrawal</h3>
<p>You have the right to withdraw from this contract within fourteen days without giving any reason. The withdrawal period is fourteen days from the day of conclusion of the contract.</p>
<p>To exercise your right of withdrawal, you must inform us (FZ-Capital GmbH, address see Imprint, email: hallo@coloreo.shop) of your decision to withdraw by a clear statement (e.g. by email). You may use the model withdrawal form below, but it is not mandatory. To meet the deadline it is sufficient to send your notification before the period expires.</p>

<h3>Consequences of withdrawal</h3>
<p>If you withdraw from this contract, we will reimburse all payments received from you without undue delay and at the latest within fourteen days of receiving your notification. We will use the same means of payment you used for the original transaction; you will not incur any fees.</p>

<h3>Early expiry of the right of withdrawal</h3>
<p>For a contract on the supply of digital content not on a physical medium, the right of withdrawal expires once we have begun performance after you have (1) expressly consented to us beginning performance before the end of the withdrawal period, and (2) acknowledged that you thereby lose your right of withdrawal. We obtain this consent at checkout via the confirmation: <em>"I expressly agree that performance begins immediately and I am aware that I lose my right of withdrawal once the download starts."</em></p>

<h3>Model withdrawal form</h3>
<p>(Complete and return this form only if you wish to withdraw from the contract.)</p>
<p>— To: FZ-Capital GmbH, ${PH}, email: hallo@coloreo.shop<br/>
— I/we (*) hereby withdraw from the contract for the purchase of the following digital content:<br/>
— Ordered on (*) / order number:<br/>
— Name of consumer(s):<br/>
— Address of consumer(s):<br/>
— Date:<br/>
(*) Delete as appropriate.</p>`,
    },
  },
  kontakt: {
    de: {
      title: "Kontakt",
      html: `<p>Du erreichst uns jederzeit per E-Mail unter <a href="mailto:hallo@coloreo.shop">hallo@coloreo.shop</a>. Wir kümmern uns schnellstmöglich um dein Anliegen – egal ob Bestellung, Download oder Produktfrage.</p>
<p>Für sofortige Hilfe nutze gern den Chat-Assistenten unten rechts: Er unterstützt dich rund um die Uhr bei Fragen zu Bestellungen, Downloads, Formaten, Drucken, Zahlung und Widerruf.</p>
<p>Anbieter: FZ-Capital GmbH – vollständige Anbieterkennzeichnung siehe <a href="/impressum">Impressum</a>.</p>`,
    },
    en: {
      title: "Contact",
      html: `<p>Reach us anytime by email at <a href="mailto:hallo@coloreo.shop">hallo@coloreo.shop</a>. We will take care of your request as quickly as possible – whether it concerns an order, a download or a product question.</p>
<p>For instant help, use the chat assistant in the bottom right: available around the clock for orders, downloads, formats, printing, payment and withdrawal.</p>
<p>Provider: FZ-Capital GmbH – full provider details in the <a href="/impressum">Imprint</a>.</p>`,
    },
  },
};

export function getLegal(key: LegalKey, locale: Locale) {
  // Rechtstexte gibt es vorerst nur DE/EN → Fallback auf EN, dann DE.
  return content[key][locale] ?? content[key].en ?? content[key].de!;
}
export type { LegalKey };
