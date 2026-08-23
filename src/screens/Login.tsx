import { useState } from "preact/hooks";
import type { LoginResult } from "../hooks";

interface Props {
  onLogin: () => Promise<LoginResult>;
  onSuccess: () => void;
  onBack: () => void;
}

const MESSAGES: Record<Exclude<LoginResult, "ok" | "cancelled">, string> = {
  "not-admin": "Tenhle Google účet není na seznamu novomanželů.",
  error: "Přihlášení se nepovedlo. Zkuste to prosím znovu.",
};

export function LoginScreen({ onLogin, onSuccess, onBack }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await onLogin();
    setBusy(false);
    if (result === "ok") onSuccess();
    else if (result !== "cancelled") setError(MESSAGES[result]);
  }

  return (
    <div class="login fade-up">
      <header class="bar">
        <button class="back" aria-label="Zpět" onClick={onBack}>←</button>
        <h2>Pro novomanžele</h2>
      </header>
      <p>Přihlaste se Google účtem, který je na seznamu novomanželů.</p>
      <div class="form">
        <button class="btn small google" onClick={submit} disabled={busy}>
          <GoogleMark />
          {busy ? "Přihlašuji…" : "Přihlásit se přes Google"}
        </button>
        {error && <div class="error">{error}</div>}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
