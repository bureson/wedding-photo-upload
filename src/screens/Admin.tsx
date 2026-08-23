import { createPortal } from "preact/compat";
import { useState } from "preact/hooks";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { useT } from "../i18n";
import type { AppSettings, Photo } from "../types";

/** "so 26. 9. 21:14" on tiles, "26. 9. 2026 21:14" in the sheet. Empty until the server timestamp lands. */
function formatWhen(photo: Photo, lang: "cs" | "en", style: "short" | "long"): string {
  const d = photo.createdAt?.toDate();
  if (!d) return "";
  const locale = lang === "cs" ? "cs-CZ" : "en-GB";
  return style === "short"
    ? d.toLocaleString(locale, { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function EditSheet({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  const { t, lang } = useT();
  const [who, setWho] = useState(photo.who);
  const [caption, setCaption] = useState(photo.caption);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function save(e: Event) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      await updateDoc(doc(db, "photos", photo.id), { who: who.trim(), caption: caption.trim() });
      onClose();
    } catch (err) {
      console.error(err);
      setError(true);
      setBusy(false);
    }
  }

  const when = formatWhen(photo, lang, "long");

  return createPortal(
    <div class="sheet-backdrop" onClick={onClose}>
      <form class="sheet fade-up" onClick={(e) => e.stopPropagation()} onSubmit={save}>
        <div class="sheet-head">
          {photo.thumbUrl ? <div class="sheet-thumb" style={{ backgroundImage: `url(${photo.thumbUrl})` }} /> : <div class="sheet-thumb ph" />}
          <div>
            <h3>{t.editPhoto}</h3>
            {when && <div class="sub">{when}</div>}
          </div>
        </div>
        <label class="field">
          <span>{t.editName}</span>
          <input class="input" type="text" value={who} maxLength={60} onInput={(e) => setWho((e.currentTarget as HTMLInputElement).value)} placeholder={t.anonymous} />
        </label>
        <label class="field">
          <span>{t.editCaption}</span>
          <input class="input" type="text" value={caption} maxLength={200} onInput={(e) => setCaption((e.currentTarget as HTMLInputElement).value)} />
        </label>
        {error && <div class="error">{t.saveFailed}</div>}
        <div class="sheet-actions">
          <button type="button" class="btn-outline" onClick={onClose} disabled={busy}>{t.cancel}</button>
          <button type="submit" class="btn small" disabled={busy}>{busy ? t.saving : t.save}</button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

interface Props {
  photos: Photo[];
  settings: AppSettings;
  onLogout: () => void;
  onBack: () => void;
}

type DownloadState = "idle" | "busy" | "done" | "error";

export function AdminScreen({ photos, settings, onLogout, onBack }: Props) {
  const { t, lang } = useT();
  const [download, setDownload] = useState<DownloadState>("idle");
  const [editing, setEditing] = useState<Photo | null>(null);

  async function toggleUploads() {
    await setDoc(doc(db, "settings", "app"), { uploadsEnabled: !settings.uploadsEnabled }, { merge: true });
  }

  async function remove(p: Photo) {
    if (!confirm(t.confirmDelete(p.who || t.anonymous))) return;
    await deleteDoc(doc(db, "photos", p.id)); // Cloud Function removes the files
  }

  async function downloadAll() {
    if (download === "busy") return;
    setDownload("busy");
    try {
      const fn = httpsCallable<void, { url: string }>(functions, "downloadAll", { timeout: 540_000 });
      const { data } = await fn();
      window.location.href = data.url;
      setDownload("done");
      setTimeout(() => setDownload("idle"), 4000);
    } catch (err) {
      console.error(err);
      setDownload("error");
    }
  }

  const downloadLabel = { idle: t.zipIdle, busy: t.zipBusy, done: t.zipDone, error: t.zipError }[download];

  return (
    <div class="admin fade-up">
      <header class="bar">
        <button class="back" aria-label={t.back} onClick={onBack}>←</button>
        <div class="grow">
          <h2>{t.adminTitle}</h2>
          <div class="sub">{t.fromGuests(t.photos(photos.length))}</div>
        </div>
        <button class="quiet" onClick={onLogout}>{t.signOut}</button>
      </header>

      <div class="rows">
        <div class="row">
          <div>
            <div class="t">{t.uploadsTitle}</div>
            <div class="s">{settings.uploadsEnabled ? t.uploadsOn : t.uploadsOff}</div>
          </div>
          <button class="switch" role="switch" aria-checked={settings.uploadsEnabled} onClick={toggleUploads}>
            <span />
          </button>
        </div>
        <button class="row" onClick={downloadAll} disabled={download === "busy" || photos.length === 0}>
          <span class="t">{t.downloadAll}</span>
          <span class="act">{downloadLabel}</span>
        </button>
      </div>

      <div class="section">{t.guestPhotos}</div>
      {photos.length === 0 ? (
        <div class="empty">{t.noPhotos}</div>
      ) : (
        <div class="grid3">
          {photos.map((g) => (
            <div class="tile" key={g.id}>
              <button type="button" class="tile-edit" aria-label={t.editPhoto} onClick={() => setEditing(g)}>
                {g.thumbUrl ? <div class="img" style={{ backgroundImage: `url(${g.thumbUrl})` }} /> : <div class="ph" />}
                <div class="who">{g.who || t.anonymous}</div>
                <div class="when">{formatWhen(g, lang, "short")}</div>
              </button>
              <button class="x danger" aria-label={t.deletePhoto} onClick={() => remove(g)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {editing && <EditSheet photo={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
