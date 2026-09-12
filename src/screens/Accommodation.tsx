import { Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import { APARTMENTS, FLOOR_LABELS, WEDDING_APT, bedCount, firstFloorWithBeds, type Apartment, type Bed } from "../accommodation";
import { GUESTS } from "../guests";
import { useT, type Lang, type Strings } from "../i18n";
import { LangToggle } from "../LangToggle";

interface Props {
  /** Apartment from the route (`#accommodation/<id>`), or null for the overview. */
  aptId: string | null;
  onOpen: (aptId: string) => void;
  onOverview: () => void;
  onBack: () => void;
}

/** Where to land when an apartment opens — set by the search results, read once on mount. */
interface Target {
  aptId: string;
  floorIdx: number;
  bedId: string | null;
}

const names = (bedId: string): string[] => GUESTS[bedId] ?? [];
/** Lower-case, diacritics stripped: "cerny" finds "Černý". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Warm the browser cache with every plan (~25 KB each) so floors switch instantly. Runs once. */
let preloaded = false;
function preloadPlans() {
  if (preloaded) return;
  preloaded = true;
  const start = () => APARTMENTS.forEach((a) => a.floors.forEach((f) => { if (f.img) new Image().src = f.img; }));
  if ("requestIdleCallback" in window) requestIdleCallback(start);
  else setTimeout(start, 500);
}

export function AccommodationScreen({ aptId, onOpen, onOverview, onBack }: Props) {
  const { t, lang } = useT();
  const [target, setTarget] = useState<Target | null>(null);
  const apt = aptId ? APARTMENTS.find((a) => a.id === aptId) : undefined;
  useEffect(preloadPlans, []);

  function open(aptId: string, floorIdx: number, bedId: string | null) {
    setTarget({ aptId, floorIdx, bedId });
    onOpen(aptId);
  }

  const initial = apt && target && target.aptId === apt.id ? target : { floorIdx: apt ? firstFloorWithBeds(apt) : 0, bedId: null };

  return (
    <div class="acc fade-up" key={apt ? apt.id : "overview"}>
      {apt ? (
        <ApartmentView
          apt={apt}
          t={t}
          lang={lang}
          initialFloor={initial.floorIdx}
          initialBed={initial.bedId}
          onBack={onOverview}
        />
      ) : (
        <Overview t={t} lang={lang} onBack={onBack} onOpen={open} />
      )}
      <footer class="foot">
        <div class="foot-row">
          <LangToggle />
        </div>
      </footer>
    </div>
  );
}

/* ---------- Overview: search + site sketch ---------- */

interface ViewProps {
  t: Strings;
  lang: Lang;
}

interface OverviewProps extends ViewProps {
  onBack: () => void;
  onOpen: (aptId: string, floorIdx: number, bedId: string | null) => void;
}

function Overview({ t, lang, onBack, onOpen }: OverviewProps) {
  const [query, setQuery] = useState("");
  const q = fold(query.trim());

  const results = q
    ? APARTMENTS.flatMap((a) =>
        a.floors.flatMap((f, fi) =>
          f.beds.flatMap((b) =>
            names(b.id)
              .filter((n) => fold(n).includes(q))
              .map((n) => ({ name: n, where: `${a.name[lang]} · ${FLOOR_LABELS[f.key][lang]}`, apt: a, floorIdx: fi, bed: b })),
          ),
        ),
      )
    : [];

  return (
    <>
      <header class="bar">
        <button class="back" aria-label={t.back} onClick={onBack}>←</button>
        <div>
          <h2>{t.accTitle}</h2>
          <div class="sub">{t.accSubtitle}</div>
        </div>
      </header>

      <div class="search">
        <input
          class="input"
          type="search"
          value={query}
          onInput={(e) => setQuery((e.currentTarget as HTMLInputElement).value)}
          placeholder={t.accSearch}
          autocomplete="off"
          enterkeyhint="search"
        />
        {query && (
          <button class="round-x" aria-label={t.accClear} onClick={() => setQuery("")}>×</button>
        )}
        {q && (
          <div class="results" role="listbox">
            {results.map((r) => (
              <button key={`${r.bed.id}:${r.name}`} class="result" role="option" onClick={() => onOpen(r.apt.id, r.floorIdx, r.bed.id)}>
                <span class="who">
                  <span class="n">{r.name}</span>
                  <span class="w">{r.where}</span>
                </span>
                <span class="b">{t.accBed(r.bed.num)} →</span>
              </button>
            ))}
            {results.length === 0 && <div class="empty">{t.accNoResults}</div>}
          </div>
        )}
      </div>

      <div class="section">{t.accSiteCaption}</div>
      <div class="site">
        <div class="path h" />
        <div class="path v" />
        {APARTMENTS.map((a) => {
          const [left, top, width, height] = a.site;
          return (
            <button
              key={a.id}
              class="bld"
              style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
              onClick={() => onOpen(a.id, firstFloorWithBeds(a), null)}
            >
              <span class="n">{a.name[lang]}</span>
              <span class="c">{a.id === WEDDING_APT ? "♥" : t.accBeds(bedCount(a))}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------- Schematic room for floors without a plan image ---------- */

/** Draws walls, a door, two windows and the beds (from their % positions) in the style of the real plans. */
function RoomSketch({ beds }: { beds: Bed[] }) {
  const W = 400;
  const H = 300;
  return (
    <svg class="sketch" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <rect x="20" y="20" width="360" height="260" fill="#fffbe9" stroke="#111" stroke-width="8" />
      <rect x="70" y="16" width="50" height="8" fill="#dbe9f5" stroke="#111" stroke-width="2" />
      <rect x="280" y="16" width="50" height="8" fill="#dbe9f5" stroke="#111" stroke-width="2" />
      <rect x="170" y="274" width="60" height="12" fill="#fff" />
      <path d="M170 278 A60 60 0 0 1 230 218" fill="none" stroke="#111" stroke-width="2" />
      <line x1="230" y1="278" x2="230" y2="218" stroke="#111" stroke-width="3" />
      {beds.map((b) => {
        const x = ((b.x - b.w / 2) / 100) * W;
        const y = ((b.y - b.h / 2) / 100) * H;
        const w = (b.w / 100) * W;
        const h = (b.h / 100) * H;
        return (
          <g key={b.id}>
            <rect x={x} y={y} width={w} height={h} fill="#fff" stroke="#111" stroke-width="3" />
            <rect x={x + w * 0.15} y={y + h * 0.07} width={w * 0.7} height={h * 0.17} rx="3" fill="#fff" stroke="#111" stroke-width="2" />
            <line x1={x} y1={y + h * 0.34} x2={x + w} y2={y + h * 0.34} stroke="#111" stroke-width="2" />
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Apartment: floor tabs, plan with beds, name sheet ---------- */

interface ApartmentProps extends ViewProps {
  apt: Apartment;
  initialFloor: number;
  initialBed: string | null;
  onBack: () => void;
}

function ApartmentView({ apt, t, lang, initialFloor, initialBed, onBack }: ApartmentProps) {
  const [floorIdx, setFloorIdx] = useState(Math.min(initialFloor, apt.floors.length - 1));
  const [selBed, setSelBed] = useState<string | null>(initialBed);
  /** Plan images that have finished decoding (by URL), so the plan fades in instead of popping. */
  const [ready, setReady] = useState<Record<string, true>>({});
  const floor = apt.floors[floorIdx];
  const loaded = !floor.img || !!ready[floor.img];
  const markReady = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth > 0 && !ready[el.getAttribute("src") ?? ""]) {
      setReady((r) => ({ ...r, [el.getAttribute("src") ?? ""]: true }));
    }
  };
  const sel = selBed ? floor.beds.find((b) => b.id === selBed) : undefined;
  const selNames = sel ? names(sel.id) : [];
  const total = bedCount(apt);
  const bedType = (b: Bed) => (b.type === "double" ? t.accDouble : t.accSingle);
  const wedding = apt.id === WEDDING_APT;

  return (
    <>
      <header class="bar">
        <button class="back" aria-label={t.accOverview} onClick={onBack}>←</button>
        <div>
          <h2>{apt.name[lang]}</h2>
          <div class="sub">
            {t.accBeds(total)}
            {apt.floors.length > 1 && ` · ${(apt.rooms ? t.accRooms : t.accFloors)(apt.floors.length)}`}
          </div>
        </div>
      </header>

      {apt.floors.length > 1 && (
        <div class="pills" role="tablist">
          {apt.floors.map((f, i) => (
            <button
              key={f.key}
              class={`pill${i === floorIdx ? " active" : ""}`}
              role="tab"
              aria-selected={i === floorIdx}
              onClick={() => { setFloorIdx(i); setSelBed(null); }}
            >
              {FLOOR_LABELS[f.key][lang]}
            </button>
          ))}
        </div>
      )}

      <div class="plan-head">
        <span class="section">{FLOOR_LABELS[floor.key][lang]}</span>
        {floor.beds.length > 0 && <span class="hint">{t.accTapBed}</span>}
      </div>
      <div class={`plan${loaded ? "" : " loading"}`} style={{ aspectRatio: String(floor.ratio) }} aria-busy={!loaded}>
        {floor.img ? (
          <img
            key={floor.img}
            src={floor.img}
            alt=""
            decoding="async"
            ref={markReady}
            onLoad={(e) => markReady(e.currentTarget as HTMLImageElement)}
          />
        ) : (
          <RoomSketch beds={floor.beds} />
        )}
        {floor.beds.map((b) => {
          const on = b.id === selBed;
          const occ = names(b.id).length > 0;
          return (
            <Fragment key={b.id}>
              <div
                class={`bed-box${on ? " on" : ""}`}
                style={{ left: `${b.x - b.w / 2}%`, top: `${b.y - b.h / 2}%`, width: `${b.w}%`, height: `${b.h}%` }}
              />
              <button
                class={`bed-dot${occ ? " occ" : ""}${on ? " on" : ""}`}
                style={{ left: `${b.x}%`, top: `${b.y}%` }}
                title={`${bedType(b)} ${b.num}`}
                aria-pressed={on}
                onClick={() => setSelBed(on ? null : b.id)}
              >
                <span>{wedding ? <i class="heart">♥</i> : b.num}</span>
              </button>
            </Fragment>
          );
        })}
        {wedding && sel && (
          <div class="hearts" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                class={i % 3 === 0 ? "" : "rose"}
                style={{
                  left: `${6 + ((i * 37) % 88)}%`,
                  fontSize: `${14 + ((i * 7) % 16)}px`,
                  animationDuration: `${2.6 + (i % 4) * 0.45}s`,
                  animationDelay: `${i * 0.22}s`,
                }}
              >
                ♥
              </span>
            ))}
          </div>
        )}
      </div>

      {!floor.img && <div class="note">{t.accSketchNote}</div>}

      {sel && (
        <div class="bedsheet-wrap">
          <div class="bedsheet">
            <div class="bedsheet-head">
              <div>
                <div class="kicker">{wedding ? t.accWeddingBed : `${bedType(sel)} · ${t.accBed(sel.num)}`}</div>
                <div class="where">{apt.name[lang]} · {FLOOR_LABELS[floor.key][lang]}</div>
              </div>
              <button class="round-x" aria-label={t.close} onClick={() => setSelBed(null)}>×</button>
            </div>
            {wedding && (
              <div class="dnd">
                <div class="hand">{t.accDoNotDisturb}</div>
                <div class="note">{t.accWeddingNote}</div>
              </div>
            )}
            {selNames.length === 0 ? (
              <div class="none">{t.accEmpty}</div>
            ) : (
              <div class="names">
                {selNames.map((n) => <div class="name" key={n}>{n}</div>)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
