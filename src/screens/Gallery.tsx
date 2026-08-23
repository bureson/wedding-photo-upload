import { useState } from "preact/hooks";
import { auth } from "../firebase";
import { useT } from "../i18n";
import { Lightbox } from "../Lightbox";
import { rot, type Photo } from "../types";

interface Props {
  photos: Photo[];
  onBack: () => void;
}

export function GalleryScreen({ photos: all, onBack }: Props) {
  const { t } = useT();
  const [open, setOpen] = useState<number | null>(null);

  // Your own photos first (the anonymous uid persists on this device).
  const me = auth.currentUser?.uid;
  const isMine = (p: Photo) => !!me && p.uid === me;
  const photos = me ? [...all.filter(isMine), ...all.filter((p) => !isMine(p))] : all;

  // Keep the lightbox index valid if photos arrive/disappear while it's open.
  const index = open === null ? null : Math.min(open, photos.length - 1);

  return (
    <div class="fade-up">
      <header class="bar">
        <button class="back" aria-label={t.back} onClick={onBack}>←</button>
        <div>
          <h2>{t.galleryTitle}</h2>
          <div class="sub">{t.fromGuests(t.photos(photos.length))}</div>
        </div>
      </header>

      {photos.length === 0 ? (
        <div class="empty">{t.noPhotos}</div>
      ) : (
        <div class="grid2">
          {photos.map((g, i) => (
            <figure class="card fade-in" key={g.id} style={{ transform: `rotate(${rot(i)}deg)` }}>
              {g.thumbUrl ? (
                <button type="button" class="img" style={{ backgroundImage: `url(${g.thumbUrl})` }} aria-label={t.openPhoto} onClick={() => setOpen(i)} />
              ) : (
                <div class="ph"><span>{t.processing}</span></div>
              )}
              <figcaption>
                <span class="who">{isMine(g) ? t.you : g.who || t.anonymous}</span>
                {g.caption && <span class="cap">{g.caption}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {index !== null && index >= 0 && (
        <Lightbox photos={photos} index={index} isMine={isMine} onChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
