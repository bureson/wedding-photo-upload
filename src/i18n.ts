import { useEffect, useState } from "preact/hooks";

export type Lang = "cs" | "en";

const dict = {
  cs: {
    // header
    tagline: "byli jste u toho ♡",
    date: "26. ZÁŘÍ 2026",
    coupleAlt: "Nevěsta a ženich",
    // upload card
    addPhotos: "Přidat fotky",
    addHint: "Klepněte a vyberte z galerie",
    addScribble: "sem s vašimi úlovky!",
    pausedTitle: "Foťáky si daly pauzu",
    pausedHint: "Nahrávání je teď pozastavené",
    pausedScribble: "hned jsme zpátky ♡",
    loading: "Načítám",
    loadingScribble: "chvilku…",
    removePhoto: "Odebrat fotku",
    // form
    captionPlaceholder: "Krátký vzkaz nebo popisek (nepovinné)",
    namePlaceholder: "Vaše jméno (nepovinné)",
    send: (n: string) => `Poslat ${n}`,
    sending: (done: number, total: number) => `Odesílám… ${done}/${total}`,
    uploadFailed: "Nahrávání se nepovedlo. Zkuste to prosím znovu.",
    // thank you
    thanksScribble: "jste hvězdy!",
    thanksHeadline: (n: string) => `Odesláno — ${n} máme!`,
    thanksBody: "Fotky letí rovnou k novomanželům — a do společné galerie.",
    addMore: "Přidat další fotky",
    // footer
    galleryLink: "mrkněte, co nafotili ostatní →",
    footerNote: "Fotky uvidí novomanželé a hosté ve společné galerii.",
    forCouple: "pro novomanžele",
    // gallery
    galleryTitle: "Společná galerie",
    fromGuests: (n: string) => `${n} od hostů`,
    noPhotos: "Žádné fotky. Zatím.",
    processing: "zpracovává se…",
    anonymous: "Anonym",
    back: "Zpět",
    openPhoto: "Otevřít fotku",
    // login
    loginTitle: "Pro novomanžele",
    loginBody: "Přihlaste se Google účtem, který je na seznamu novomanželů.",
    loginButton: "Přihlásit se přes Google",
    loggingIn: "Přihlašuji…",
    notAdmin: "Tenhle Google účet není na seznamu novomanželů.",
    loginError: "Přihlášení se nepovedlo. Zkuste to prosím znovu.",
    // admin
    adminTitle: "Správa",
    signOut: "Odhlásit",
    uploadsTitle: "Nahrávání fotek",
    uploadsOn: "Hosté můžou nahrávat",
    uploadsOff: "Pozastaveno — hosté nenahrají nic",
    downloadAll: "Stáhnout všechny fotky",
    zipIdle: "ZIP ↓",
    zipBusy: "Připravuji…",
    zipDone: "Staženo ✓",
    zipError: "Chyba — zkusit znovu",
    guestPhotos: "Fotky hostů",
    deletePhoto: "Smazat fotku",
    confirmDelete: (who: string) => `Smazat fotku od „${who}“?`,
    // plural
    photos: (n: number) => (n === 1 ? "1 fotku" : n >= 2 && n <= 4 ? `${n} fotky` : `${n} fotek`),
  },
  en: {
    tagline: "you were there ♡",
    date: "26 SEPTEMBER 2026",
    coupleAlt: "Bride and groom",
    addPhotos: "Add photos",
    addHint: "Tap to pick from your gallery",
    addScribble: "show us what you got!",
    pausedTitle: "Cameras are taking a break",
    pausedHint: "Uploads are paused right now",
    pausedScribble: "back in a moment ♡",
    loading: "Loading",
    loadingScribble: "one sec…",
    removePhoto: "Remove photo",
    captionPlaceholder: "A short message or caption (optional)",
    namePlaceholder: "Your name (optional)",
    send: (n: string) => `Send ${n}`,
    sending: (done: number, total: number) => `Sending… ${done}/${total}`,
    uploadFailed: "Upload failed. Please try again.",
    thanksScribble: "you're stars!",
    thanksHeadline: (n: string) => `Sent — we've got ${n}!`,
    thanksBody: "Your photos are on their way to the newlyweds — and into the shared gallery.",
    addMore: "Add more photos",
    galleryLink: "see what others snapped →",
    footerNote: "Photos are visible to the newlyweds and guests in the shared gallery.",
    forCouple: "for the newlyweds",
    galleryTitle: "Shared gallery",
    fromGuests: (n: string) => `${n} from guests`,
    noPhotos: "No photos. Yet.",
    processing: "processing…",
    anonymous: "Anonymous",
    back: "Back",
    openPhoto: "Open photo",
    loginTitle: "For the newlyweds",
    loginBody: "Sign in with a Google account that's on the newlyweds' list.",
    loginButton: "Sign in with Google",
    loggingIn: "Signing in…",
    notAdmin: "This Google account isn't on the newlyweds' list.",
    loginError: "Sign-in failed. Please try again.",
    adminTitle: "Admin",
    signOut: "Sign out",
    uploadsTitle: "Photo uploads",
    uploadsOn: "Guests can upload",
    uploadsOff: "Paused — guests can't upload",
    downloadAll: "Download all photos",
    zipIdle: "ZIP ↓",
    zipBusy: "Preparing…",
    zipDone: "Downloaded ✓",
    zipError: "Error — try again",
    guestPhotos: "Guest photos",
    deletePhoto: "Delete photo",
    confirmDelete: (who: string) => `Delete the photo from “${who}”?`,
    photos: (n: number) => (n === 1 ? "1 photo" : `${n} photos`),
  },
} satisfies Record<Lang, unknown>;

export type Strings = (typeof dict)["cs"];

const STORAGE_KEY = "lang";

function detect(): Lang {
  try {
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (fromUrl === "cs" || fromUrl === "en") {
      localStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "cs" || saved === "en") return saved;
  } catch {
    /* storage unavailable */
  }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  // Czech and Slovak speakers get Czech; everyone else English.
  return langs.some((l) => /^(cs|sk)\b/i.test(l)) ? "cs" : "en";
}

let current: Lang = detect();
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang) {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang;
  listeners.forEach((fn) => fn());
}

document.documentElement.lang = current;

/** Returns the active dictionary and re-renders the component when the language changes. */
export function useT(): { t: Strings; lang: Lang } {
  const [, rerender] = useState(0);
  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return { t: dict[current], lang: current };
}
