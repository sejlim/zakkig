"use client";

export type Locale = "de" | "en";

const translations = {
  de: {
    // Auth
    sales: "Verkäufe",
    statistics: "Statistik",
    signIn: "Anmelden",
    signUp: "Registrieren",
    signOut: "Abmelden",
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    name: "Vertretername",
    forgotPassword: "Passwort vergessen?",
    resetPassword: "Passwort zurücksetzen",
    resetPasswordDescription:
      "Gib deine E-Mail-Adresse ein und wir schicken dir einen Link zum Zurücksetzen deines Passworts.",
    resetPasswordSent:
      "Wir haben dir eine E-Mail zum Zurücksetzen deines Passworts gesendet, folge den Anweisungen.",
    resetPasswordLinkSent: "Link erfolgreich gesendet",
    noAccount: "Noch kein Konto?",
    alreadyAccount: "Bereits ein Konto?",
    emailRequired: "E-Mail ist erforderlich.",
    emailInvalid: "Bitte gib eine gültige E-Mail-Adresse ein.",
    passwordRequired: "Passwort ist erforderlich.",
    passwordShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
    passwordReqLength: "Mindestens 8 Zeichen",
    passwordReqUppercase: "Mindestens 1 Großbuchstabe",
    passwordReqLowercase: "Mindestens 1 Kleinbuchstabe",
    passwordReqNumberOrSpecial: "Mindestens 1 Zahl oder 1 Sonderzeichen",
    passwordInvalid: "Das Passwort erfüllt nicht alle Anforderungen.",
    restaurantNameRequired: "Betriebsname ist erforderlich.",
    passwordMismatch: "Die Passwörter stimmen nicht überein.",
    hasAccount: "Bereits ein Konto?",
    rememberedAccount: "Wieder eingefallen?",
    createAccount: "Konto erstellen",
    emailNotFound: "Kein Konto mit dieser E-Mail-Adresse gefunden.",
    signInDescription:
      "Melde dich an, um auf dein Dashboard zu gelangen. Dort hast du dein Menü und Live-Bestellungen immer im Blick.",
    signUpDescription:
      "Erstelle einen Account für deinen Gastronomie-Betrieb, um digitale Live-Bestellungen vor Ort entgegenzunehmen.",
    restaurantName: "Betriebsname",
    invalidOtp: "Der eingegebene Code ist falsch.",
    authError: "Die Anmeldung ist fehlgeschlagen. Bitte überprüfe deine Daten.",
    authErrorUserExists: "Ein Konto mit dieser E-Mail existiert bereits.",
    signingIn: "Wird angemeldet…",
    signingUp: "Wird registriert…",
    verifying: "Wird bestätigt…",
    sendingResetLink: "Wird gesendet…",
    sendLink: "Link senden",
    agreeToTermsDesc:
      "Durch die Registrierung erklärst du dich mit unseren AGB und unserer Datenschutzerklärung einverstanden.",
    missingFields: "Bitte fülle alle Pflichtfelder aus.",
    disposableEmail: "Bitte verwende eine echte E-Mail-Adresse.",
    sessionFailed: "Konto erstellt, aber Sitzung fehlgeschlagen.",
    signUpFailed: "Registrierung fehlgeschlagen.",
    resetFailed: "Zurücksetzen fehlgeschlagen.",
    databaseError:
      "Ein Datenbankfehler ist aufgetreten. Bitte versuche es später erneut.",
    termsRequired: "Du musst den Bedingungen zustimmen.",
    namePlaceholder: "Max Mustermann",
    businessPlaceholder: "Mein Betrieb",
    emailPlaceholder: "name@beispiel.de",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort verbergen",
    backToSignIn: "Zurück zur Anmeldung",
    resendCode: "Code erneut senden",
    resendIn: "Erneut senden in {time}s",

    // Dashboard
    dashboard: "Dashboard",
    overview: "Übersicht",
    orders: "Live-Bestellungen",
    archive: "Archiv",
    menu: "Menü",
    settings: "Einstellungen",
    language: "Sprache",
    changeLanguage: "Sprache ändern",
    german: "Deutsch",
    english: "Englisch",

    // Overview
    totalOrders: "Bestellungen",
    netRevenue: "Netto-Umsatz",
    last24h: "Letzte 24 Stunden",
    last30d: "Letzte 30 Tage",
    last90d: "Letzte 90 Tage",
    quickLinks: "Schnellzugriffe",
    kitchenSessions: "Bestellübersicht Sitzungen",
    kitchenSessionsDesc:
      "Erstelle eine Sitzung und öffne den Link auf einem Tablet, zugänglich zur Bedienung und ggf. Küche. Eingehende Live-Bestellungen erscheinen dort mit allen Details in Echtzeit und können verwaltet werden.",
    createSession: "Neue Session erstellen",
    copyLink: "Link kopieren",
    linkCopied: "Link kopiert!",
    qrCodeGenerator: "QR-Code Verwaltung",
    generateQR: "QR-Code erstellen",
    toGo: "Abholung",
    pickup: "Abholung",
    toStay: "Tisch",
    tableNumber: "Tischnummer",
    downloadPDF: "Als PDF herunterladen",
    printQrCode: "Drucken",
    qrCodeDesc1: "Menü &\nBestellsystem",
    qrCodeDesc2: "Bestellsystem",
    qrCodeTitleLine1: "Menü &",
    qrCodeTitleLine2: "Bestellung",
    qrCodeSublineBase:
      "Bestelle entweder wie gewohnt beim Personal oder füge gewünschte Artikel deinem Warenkorb hinzu und bezahle direkt über das Handy.",
    qrCodeSublineToStay:
      "Nach Abschluss der Bezahlung wird dir deine Bestellung direkt an deinen Tisch gebracht.",
    qrCodeSublineToGo:
      "Nach Abschluss der Bezahlung wirst du auf eine Warteseite weitergeleitet, auf der du sehen kannst ob deine Bestellung abholbereit ist.",
    qrCodeAdminDescToGo:
      "Drucke diesen QR-Code aus und platziere ihn gut sichtbar für deine Kunden.",
    qrCodeAdminDescToStay:
      "Trage die gewünschten Tischnummern ein, drucke die QR-Codes aus und platziere sie auf den entsprechenden Tischen.",

    // Orders
    liveView: "Live-Ansicht",
    history: "Verlauf",
    orderNumber: "Bestellnr.",
    date: "Datum",
    type: "Typ",
    total: "Summe",
    status: "Status",
    items: "Artikel",
    pending: "Ausstehend",
    preparing: "In Bearbeitung",
    ready: "Abholbereit",
    completed: "Abgeschlossen",
    exportCSV: "DATEV CSV-Export",
    search: "Suchen...",
    noOrders: "Noch keine Live-Bestellungen vorhanden.",
    noArchiveOrders: "Keine Bestellungen im Archiv.",
    dineIn: "Vor Ort",
    takeaway: "Zum Mitnehmen",
    table: "Tisch",
    tableNr: "Tisch Nr.",

    manageTables: "Tischnummern verwalten",
    selectAll: "Alle auswählen",
    addTable: "Hinzufügen",
    noTablesCreated: "Noch keine Tische angelegt.",
    tableExists: "Tischnummer existiert bereits",
    tablesDeleted: "Tische gelöscht",
    featureEnabled: "Funktion aktiviert",
    featureDisabled: "Funktion deaktiviert",
    confirmAction: "Aktion bestätigen",
    confirmDeactivate: "Möchten Sie diese Funktion wirklich deaktivieren?",
    confirmDeleteTables: "Möchten Sie die ausgewählten Tische wirklich löschen?",
    activate: "Aktivieren",
    deactivate: "Deaktivieren",
    printMultipleCodes: "{{count}} QR-Codes drucken",


    // Menu
    categories: "Kategorien",
    addCategory: "Kategorie hinzufügen",
    editCategory: "Kategorie bearbeiten",
    deleteCategory: "Kategorie löschen",
    categoryName: "Kategoriename",
    addItem: "Artikel hinzufügen",
    editItem: "Artikel bearbeiten",
    deleteItem: "Artikel löschen",
    itemName: "Artikelname",
    description: "Beschreibung",
    price: "Preis",
    image: "Bild",
    available: "Verfügbar",
    unavailable: "Nicht verfügbar",
    noCategories: "Noch keine Kategorien angelegt.",
    noItems: "Noch keine Artikel in dieser Kategorie.",
    confirmDelete: "Wirklich löschen?",
    confirmDeleteDescription:
      "Diese Aktion kann nicht rückgängig gemacht werden.",

    // Settings
    accountSettings: "Kontoeinstellungen",
    businessSettings: "Betriebsdaten",
    stripeSettings: "Zahlungsanbieter",
    address: "Adresse",
    logo: "Logo",
    uploadLogo: "Logo hochladen",
    stripeConnected: "Stripe verbunden",
    stripeNotConnected: "Stripe nicht verbunden",
    connectStripe: "Stripe verbinden",
    comingSoon: "Kommt bald",
    deleteAccount: "Konto löschen",
    deleteAccountDescription: "Eine Anfrage zur Löschung deines Kontos senden.",
    requestDeletion: "Löschanfrage senden",
    save: "Speichern",
    saved: "Gespeichert!",
    cancel: "Abbrechen",
    delete: "Löschen",

    // Kitchen Board
    inProgress: "In Bearbeitung",
    done: "Abgeschlossen",
    markDone: "Als fertig markieren",
    clearOrder: "Bestellung entfernen",
    noActiveOrders: "Keine aktiven Live-Bestellungen.",
    newOrder: "Neue Bestellung",

    // Guest
    menuTab: "Menü",
    cartTab: "Warenkorb",
    addToCart: "Hinzufügen",
    removeFromCart: "Entfernen",
    cart: "Warenkorb",
    emptyCart: "Dein Warenkorb ist leer.",
    checkout: "Zur Kasse",
    orderTotal: "Gesamtsumme (inkl. MwSt.)",
    paymentMethod: "Zahlungsmethode",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    card: "Kartenzahlung",
    emailForReceipt: "E-Mail für den digitalen Beleg",
    placeOrder: "Zahlungspflichtig bestellen",
    buyingFrom: "Du kaufst bei:",
    paymentDisclaimer:
      "Die technische Bestell- und Zahlungsabwicklung erfolgt über zakkig als Vermittler.",
    agreeToTerms: "Ich stimme den AGB und der Datenschutzerklärung zu.",
    orderPlaced: "Bestellung aufgegeben!",
    yourOrderNumber: "Deine Bestellnummer",
    waitAtTable:
      "Bitte warte an deinem Tisch. Die Bestellung wird dir gebracht.",
    orderStatus: "Bestellstatus",
    trackingExpired: "Dieser Tracking-Link ist abgelaufen.",
    quantity: "Menge",
    priceWithTax: "(inkl. MwSt.)",

    // Common
    loading: "Laden...",
    error: "Ein Fehler ist aufgetreten.",
    retry: "Erneut versuchen",
    back: "Zurück",
    close: "Schließen",
    confirm: "Bestätigen",
    priceFormat: "€",
    notFoundTitle: "Seite nicht gefunden",
    notFoundText:
      "Die von dir gesuchte Seite existiert nicht oder wurde verschoben.",
    backHome: "Zurück zur Startseite",
  },
  en: {
    // Auth
    sales: "Sales",
    statistics: "Statistics",
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    name: "Representative Name",
    forgotPassword: "Forgot password?",
    resetPassword: "Reset Password",
    resetPasswordDescription:
      "Enter your email address and we will send you a link to reset your password.",
    resetPasswordSent:
      "We sent you an email to reset your password, please follow the instructions.",
    resetPasswordLinkSent: "Link successfully sent",
    noAccount: "No account yet?",
    alreadyAccount: "Already have an account?",
    emailRequired: "Email is required.",
    emailInvalid: "Please enter a valid email address.",
    passwordRequired: "Password is required.",
    passwordShort: "Password must be at least 8 characters long.",
    passwordReqLength: "At least 8 characters",
    passwordReqUppercase: "At least 1 uppercase letter",
    passwordReqLowercase: "At least 1 lowercase letter",
    passwordReqNumberOrSpecial: "At least 1 number or 1 special character",
    passwordInvalid: "Password does not meet all requirements.",
    restaurantNameRequired: "Business name is required.",
    passwordMismatch: "Passwords do not match.",
    hasAccount: "Already have an account?",
    rememberedAccount: "Remembered it?",
    createAccount: "Create Account",
    emailNotFound: "No account found with this email address.",
    signInDescription:
      "Sign in to access your dashboard. Keep track of your menu and live orders.",
    signUpDescription:
      "Create an account for your hospitality business to receive digital live orders on-site.",
    restaurantName: "Business name",
    invalidOtp: "The entered code is invalid.",
    authError: "Sign in failed. Please check your credentials.",
    authErrorUserExists: "An account with this email already exists.",
    signingIn: "Signing in…",
    signingUp: "Signing up…",
    verifying: "Verifying…",
    sendingResetLink: "Sending…",
    sendLink: "Send link",
    agreeToTermsDesc:
      "By registering, you agree to our Terms of Service and Privacy Policy.",
    missingFields: "Please fill out all required fields.",
    disposableEmail: "Please use a real email address.",
    sessionFailed: "Account created, but session failed.",
    signUpFailed: "Sign up failed.",
    resetFailed: "Password reset failed.",
    databaseError: "A database error occurred. Please try again later.",
    termsRequired: "You must agree to the terms and conditions.",
    namePlaceholder: "Jane Doe",
    businessPlaceholder: "My Business",
    emailPlaceholder: "name@example.com",
    showPassword: "Show password",
    hidePassword: "Hide password",
    backToSignIn: "Back to Sign In",
    resendCode: "Resend code",
    resendIn: "Resend in {time}s",

    // Dashboard
    dashboard: "Dashboard",
    overview: "Overview",
    orders: "Live Orders",
    archive: "Archive",
    menu: "Menu",
    settings: "Settings",
    language: "Language",
    changeLanguage: "Change language",
    german: "German",
    english: "English",

    // Overview
    totalOrders: "Orders",
    netRevenue: "Net Revenue",
    last24h: "Last 24 hours",
    last30d: "Last 30 days",
    last90d: "Last 90 days",
    quickLinks: "Quick Links",
    kitchenSessions: "Order Overview Sessions",
    kitchenSessionsDesc:
      "Create a session and open the link on a tablet, accessible to service staff and kitchen if needed. Incoming live orders will appear there in real-time with all details and can be managed.",
    createSession: "Create new session",
    copyLink: "Copy link",
    linkCopied: "Link copied!",
    qrCodeGenerator: "QR Code Management",
    generateQR: "Generate QR Code",
    toGo: "Pickup",
    pickup: "Pickup",
    toStay: "Table",
    tableNumber: "Table number",
    downloadPDF: "Download as PDF",
    printQrCode: "Print",
    qrCodeDesc1: "Menu &\nOrdering system",
    qrCodeDesc2: "Ordering system",
    qrCodeTitleLine1: "Menu &",
    qrCodeTitleLine2: "Order",
    qrCodeSublineBase:
      "Order as usual with our staff or add your desired items to the cart and pay directly via your phone.",
    qrCodeSublineToStay:
      "After payment, your order will be brought directly to your table.",
    qrCodeSublineToGo:
      "After payment, you will be redirected to a waiting page where you can see whether your order is ready for pickup.",
    qrCodeAdminDescToGo:
      "Print out this QR code and place it in a clearly visible spot for your customers.",
    qrCodeAdminDescToStay:
      "Enter the desired table numbers, print out the QR codes and place them on the corresponding tables.",

    // Orders
    liveView: "Live View",
    history: "History",
    orderNumber: "Order No.",
    date: "Date",
    type: "Type",
    total: "Total",
    status: "Status",
    items: "Items",
    pending: "Pending",
    preparing: "Preparing",
    ready: "Ready",
    completed: "Completed",
    exportCSV: "DATEV CSV Export",
    search: "Search...",
    noOrders: "No live orders yet.",
    noArchiveOrders: "No orders in archive.",
    dineIn: "Dine-in",
    takeaway: "Takeaway",
    table: "Table",
    tableNr: "Table No.",

    manageTables: "Manage table numbers",
    selectAll: "Select all",
    addTable: "Add",
    noTablesCreated: "No tables created yet.",
    tableExists: "Table number already exists",
    tablesDeleted: "Tables deleted",
    featureEnabled: "Feature enabled",
    featureDisabled: "Feature disabled",
    confirmAction: "Confirm action",
    confirmDeactivate: "Do you really want to deactivate this feature?",
    confirmDeleteTables: "Do you really want to delete the selected tables?",
    activate: "Activate",
    deactivate: "Deactivate",
    printMultipleCodes: "Print {{count}} QR codes",


    // Menu
    categories: "Categories",
    addCategory: "Add Category",
    editCategory: "Edit Category",
    deleteCategory: "Delete Category",
    categoryName: "Category name",
    addItem: "Add Item",
    editItem: "Edit Item",
    deleteItem: "Delete Item",
    itemName: "Item name",
    description: "Description",
    price: "Price",
    image: "Image",
    available: "Available",
    unavailable: "Unavailable",
    noCategories: "No categories yet.",
    noItems: "No items in this category yet.",
    confirmDelete: "Really delete?",
    confirmDeleteDescription: "This action cannot be undone.",

    // Settings
    accountSettings: "Account Settings",
    businessSettings: "Business Details",
    stripeSettings: "Payment Provider",
    address: "Address",
    logo: "Logo",
    uploadLogo: "Upload Logo",
    stripeConnected: "Stripe connected",
    stripeNotConnected: "Stripe not connected",
    connectStripe: "Connect Stripe",
    comingSoon: "Coming soon",
    deleteAccount: "Delete Account",
    deleteAccountDescription: "Send a request to delete your account.",
    requestDeletion: "Send deletion request",
    save: "Save",
    saved: "Saved!",
    cancel: "Cancel",
    delete: "Delete",

    // Kitchen Board
    inProgress: "In Progress",
    done: "Done",
    markDone: "Mark as done",
    clearOrder: "Clear order",
    noActiveOrders: "No active live orders.",
    newOrder: "New order",

    // Guest
    menuTab: "Menu",
    cartTab: "Cart",
    addToCart: "Add",
    removeFromCart: "Remove",
    cart: "Cart",
    emptyCart: "Your cart is empty.",
    checkout: "Checkout",
    orderTotal: "Order Total (incl. VAT)",
    paymentMethod: "Payment Method",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
    card: "Card Payment",
    emailForReceipt: "Email for digital receipt",
    placeOrder: "Place binding order",
    buyingFrom: "You are buying from:",
    paymentDisclaimer:
      "The technical order and payment processing is handled by zakkig as an intermediary.",
    agreeToTerms: "I agree to the Terms and Privacy Policy.",
    orderPlaced: "Order placed!",
    yourOrderNumber: "Your order number",
    waitAtTable:
      "Please wait at your table. Your order will be brought to you.",
    orderStatus: "Order Status",
    trackingExpired: "This tracking link has expired.",
    quantity: "Quantity",
    priceWithTax: "(incl. VAT)",

    // Common
    loading: "Loading...",
    error: "An error occurred.",
    retry: "Try again",
    back: "Back",
    close: "Close",
    confirm: "Confirm",
    priceFormat: "€",
    notFoundTitle: "Page not found",
    notFoundText:
      "The page you are looking for does not exist or has been moved.",
    backHome: "Back to home",
  },
} as const;

import { useState, useEffect, useCallback } from "react";
import { useLanguageStore } from "@/store/language-store";

type TranslationKey = keyof typeof translations.de;

export function useTranslation() {
  const storeLocale = useLanguageStore((state) => state.locale);
  const [locale, setLocale] = useState<Locale>("de");

  useEffect(() => {
    setLocale(storeLocale);
  }, [storeLocale]);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key];
    },
    [locale],
  );

  return { t, locale };
}

/**
 * Format price from cents to display string.
 */
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}
