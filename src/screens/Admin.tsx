import { useState } from "preact/hooks";
import { deleteDoc, doc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { useT } from "../i18n";
import type { AppSettings, Photo } from "../types";

interface Props {
  photos: Photo[];
  settings: AppSettings;
  onLogout: () => void;
  onBack: () => void;
}

type DownloadState = "idle" | "busy" | "done" | "error";

export function AdminScreen({ photos, settings, onLogout, onBack }: Props) {
  const { t } = useT();
  const [download, setDownload] = useState<DownloadState>("idle");

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
              {g.thumbUrl ? <div class="img" style={{ backgroundImage: `url(${g.thumbUrl})` }} /> : <div class="ph" />}
              <div class="who">{g.who || t.anonymous}</div>
              <button class="x danger" aria-label={t.deletePhoto} onClick={() => remove(g)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
