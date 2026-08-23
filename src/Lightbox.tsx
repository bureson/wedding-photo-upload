import { createPortal } from "preact/compat";
import { useEffect, useRef, useState } from "preact/hooks";
import { useT } from "./i18n";
import { rot, type Photo } from "./types";

interface Props {
  photos: Photo[];
  index: number;
  /** Label to show instead of `who` for the viewer's own photos. */
  isMine?: (p: Photo) => boolean;
  onChange: (index: number) => void;
  onClose: () => void;
}

const SWIPE = 50; // px

export function Lightbox({ photos, index, isMine, onChange, onClose }: Props) {
  const { t } = useT();
  const photo = photos[index];
  const [loaded, setLoaded] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const prev = () => index > 0 && onChange(index - 1);
  const next = () => index < photos.length - 1 && onChange(index + 1);

  // Keyboard, body scroll lock.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  });

  // Reset loading state and scroll the filmstrip when the photo changes.
  useEffect(() => {
    setLoaded(false);
    stripRef.current?.children[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [index]);

  function onTouchStart(e: TouchEvent) {
    const p = e.touches[0];
    touch.current = { x: p.clientX, y: p.clientY };
  }
  function onTouchEnd(e: TouchEvent) {
    if (!touch.current) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - touch.current.x;
    const dy = p.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > SWIPE) prev();
      else if (dx < -SWIPE) next();
    } else if (dy > SWIPE * 1.5) {
      onClose();
    }
  }

  if (!photo) return null;
  const who = isMine?.(photo) ? t.you : photo.who || t.anonymous;

  // Portal to <body>: ancestors with transforms/animations would otherwise trap position:fixed.
  return createPortal(
    <div class="lb" role="dialog" aria-modal="true" aria-label={t.galleryTitle} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div class="lb-bar">
        <button class="lb-btn" aria-label={t.close} onClick={onClose}>✕</button>
        <div class="lb-count">{index + 1} / {photos.length}</div>
        <div class="lb-btn-spacer" aria-hidden="true" />
      </div>

      <div class="lb-stage" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <button class="lb-nav" aria-label={t.previous} onClick={prev} disabled={index === 0}>‹</button>
        <figure class="lb-card" key={photo.id} style={{ transform: `rotate(${rot(index) / 2}deg)` }}>
          <div class="lb-img">
            {/* Thumbnail and original are rendered identically (object-fit: contain), so the
                framing never jumps — the sharper image simply fades in over the blurry one. */}
            {photo.thumbUrl && <img class="lb-thumb-img" src={photo.thumbUrl} alt="" />}
            <img
              src={photo.url}
              alt=""
              ref={(el) => { if (el?.complete && el.naturalWidth > 0 && !loaded) setLoaded(true); }}
              onLoad={() => setLoaded(true)}
              style={{ opacity: loaded ? 1 : 0 }}
            />
          </div>
          <figcaption>
            <span class="who">{who}</span>
            {photo.caption && <span class="cap">{photo.caption}</span>}
          </figcaption>
        </figure>
        <button class="lb-nav" aria-label={t.next} onClick={next} disabled={index === photos.length - 1}>›</button>
      </div>

      <div class="lb-strip" ref={stripRef}>
        {photos.map((p, i) => (
          <button
            key={p.id}
            class={`lb-thumb${i === index ? " active" : ""}`}
            style={{ backgroundImage: p.thumbUrl ? `url(${p.thumbUrl})` : undefined }}
            aria-label={`${i + 1} / ${photos.length}`}
            aria-current={i === index}
            onClick={() => onChange(i)}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}
