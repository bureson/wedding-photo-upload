import { useEffect, useRef, useState } from "preact/hooks";
import { Couple } from "../Couple";
import { setLang, useT } from "../i18n";
import { rot } from "../types";
import { uploadPhotos, type PendingPhoto, type UploadProgress } from "../upload";

interface Props {
  /** `null` while the setting is still loading. */
  uploadsEnabled: boolean | null;
  showNameField?: boolean;
  onGallery: () => void;
  onAdmin: () => void;
}

export function UploadScreen({ uploadsEnabled, showNameField = true, onGallery, onAdmin }: Props) {
  const { t, lang } = useT();
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [name, setName] = useState(() => localStorage.getItem("who") ?? "");
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState<UploadProgress | null>(null);
  const [sent, setSent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  // Revoke preview URLs on unmount.
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.src)), []);

  function pick(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const files = Array.from(input.files ?? []).filter((f) => f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name));
    setPhotos((prev) => [...prev, ...files.map((file) => ({ file, src: URL.createObjectURL(file) }))]);
    input.value = "";
  }

  function remove(i: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[i].src);
      return prev.filter((_, j) => j !== i);
    });
  }

  async function send() {
    if (!photos.length || sending) return;
    setError(null);
    localStorage.setItem("who", name);
    try {
      await uploadPhotos(photos, { who: name.trim(), caption: caption.trim() }, setSending);
      photos.forEach((p) => URL.revokeObjectURL(p.src));
      setSent(photos.length);
      setPhotos([]);
      setCaption("");
    } catch (err) {
      console.error(err);
      setError(t.uploadFailed);
    } finally {
      setSending(null);
    }
  }

  return (
    <>
      <header class="hero">
        <div class="hand">{t.tagline}</div>
        <h1>Irča &amp; Ondra</h1>
        <div class="date">{t.date}</div>
        <Couple label={t.coupleAlt} />
      </header>

      {sent === null ? (
        <>
          {uploadsEnabled === null ? (
            <div class="drop loading" aria-busy="true" aria-label={t.loading}>
              <div class="tape" />
              <div class="face">
                <div class="dot pulse" />
                <div class="title skeleton" />
                <div class="hint skeleton" />
              </div>
              <div class="scribble">{t.loadingScribble}</div>
            </div>
          ) : uploadsEnabled ? (
            <label class="drop is-button">
              <div class="tape" />
              <div class="face">
                <div class="dot">+</div>
                <div class="title">{t.addPhotos}</div>
                <div class="hint">{t.addHint}</div>
              </div>
              <div class="scribble">{t.addScribble}</div>
              <input type="file" accept="image/*" multiple onChange={pick} disabled={!!sending} />
            </label>
          ) : (
            <div class="drop">
              <div class="tape" />
              <div class="face">
                <div class="dot sleep">💤</div>
                <div class="title">{t.pausedTitle}</div>
                <div class="hint">{t.pausedHint}</div>
              </div>
              <div class="scribble">{t.pausedScribble}</div>
            </div>
          )}

          {uploadsEnabled && photos.length > 0 && (
            <>
              <div class="pending">
                {photos.map((p, i) => (
                  <div class="mini fade-in" key={p.src} style={{ transform: `rotate(${rot(i)}deg)` }}>
                    <div class="img" style={{ backgroundImage: `url(${p.src})` }} />
                    <button class="x" aria-label={t.removePhoto} onClick={() => remove(i)} disabled={!!sending}>×</button>
                  </div>
                ))}
              </div>

              <div class="form">
                <input
                  class="input"
                  type="text"
                  value={caption}
                  onInput={(e) => setCaption((e.currentTarget as HTMLInputElement).value)}
                  placeholder={t.captionPlaceholder}
                  maxLength={200}
                />
                {showNameField && (
                  <input
                    class="input"
                    type="text"
                    value={name}
                    onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
                    placeholder={t.namePlaceholder}
                    maxLength={60}
                    autocomplete="name"
                  />
                )}
                {sending && (
                  <div class="progress"><div style={{ width: `${(sending.done / sending.total) * 100}%` }} /></div>
                )}
                {error && <div class="error">{error}</div>}
                <button class="btn" onClick={send} disabled={!!sending}>
                  {sending ? t.sending(sending.done, sending.total) : t.send(t.photos(photos.length))}
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <div class="thanks fade-up">
          <div class="hand">{t.thanksScribble}</div>
          <h2>{t.thanksHeadline(t.photos(sent))}</h2>
          <p>{t.thanksBody}</p>
          <button class="btn-outline" onClick={() => setSent(null)}>{t.addMore}</button>
        </div>
      )}

      <button class="link-hand" onClick={onGallery}>{t.galleryLink}</button>

      <footer class="foot">
        <span>{t.footerNote}</span>
        <div class="foot-row">
          <button onClick={onAdmin}>{t.forCouple}</button>
          <span aria-hidden="true">·</span>
          <button
            class="lang"
            onClick={() => setLang(lang === "cs" ? "en" : "cs")}
            aria-label={lang === "cs" ? "Switch to English" : "Přepnout do češtiny"}
          >
            {lang === "cs" ? "English" : "Česky"}
          </button>
        </div>
      </footer>
    </>
  );
}
