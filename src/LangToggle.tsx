import { setLang, useT } from "./i18n";

/** Footer button that flips between Czech and English. */
export function LangToggle() {
  const { lang } = useT();
  return (
    <button
      class="lang"
      onClick={() => setLang(lang === "cs" ? "en" : "cs")}
      aria-label={lang === "cs" ? "Switch to English" : "Přepnout do češtiny"}
    >
      {lang === "cs" ? "English" : "Česky"}
    </button>
  );
}
