import { czechPhotos, rot, type Photo } from "../types";

interface Props {
  photos: Photo[];
  onBack: () => void;
}

export function GalleryScreen({ photos, onBack }: Props) {
  return (
    <div class="fade-up">
      <header class="bar">
        <button class="back" aria-label="Zpět" onClick={onBack}>←</button>
        <div>
          <h2>Společná galerie</h2>
          <div class="sub">{czechPhotos(photos.length)} od hostů</div>
        </div>
      </header>

      {photos.length === 0 ? (
        <div class="empty">Žádné fotky. Zatím.</div>
      ) : (
        <div class="grid2">
          {photos.map((g, i) => (
            <figure class="card fade-in" key={g.id} style={{ transform: `rotate(${rot(i)}deg)` }}>
              {g.thumbUrl ? (
                <a class="img" href={g.url} target="_blank" rel="noopener" style={{ backgroundImage: `url(${g.thumbUrl})` }} aria-label="Otevřít fotku" />
              ) : (
                <div class="ph"><span>zpracovává se…</span></div>
              )}
              <figcaption>
                <span class="who">{g.who || "Anonym"}</span>
                {g.caption && <span class="cap">{g.caption}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
