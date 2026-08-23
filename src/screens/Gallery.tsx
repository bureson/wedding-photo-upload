import { useT } from "../i18n";
import { rot, type Photo } from "../types";

interface Props {
  photos: Photo[];
  onBack: () => void;
}

export function GalleryScreen({ photos, onBack }: Props) {
  const { t } = useT();
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
                <a class="img" href={g.url} target="_blank" rel="noopener" style={{ backgroundImage: `url(${g.thumbUrl})` }} aria-label={t.openPhoto} />
              ) : (
                <div class="ph"><span>{t.processing}</span></div>
              )}
              <figcaption>
                <span class="who">{g.who || t.anonymous}</span>
                {g.caption && <span class="cap">{g.caption}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
