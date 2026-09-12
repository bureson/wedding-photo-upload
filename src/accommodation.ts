import type { Lang } from "./i18n";

/**
 * Accommodation data for the "where we sleep" screen.
 *
 * Floor plans live in public/plans/. Bed positions are percentages of the
 * plan image (x, y = centre; w, h = size), so they scale with the image.
 * Bed ids are the keys of the guest list in guests.ts.
 * Building positions on the site sketch are [left, top, width, height] in %.
 */

export type Localized = Record<Lang, string>;
export type FloorKey = "main" | "spodni" | "horni" | "podkrovi" | "pokoj1" | "pokoj2";
export type BedType = "double" | "single";

export interface Bed {
  id: string;
  type: BedType;
  x: number;
  y: number;
  w: number;
  h: number;
  /** 1-based number within the apartment (assigned below). */
  num: number;
}

export interface Floor {
  key: FloorKey;
  /** Plan image; when missing, the app draws a schematic room from the bed positions. */
  img?: string;
  /** width / height of the plan (image or schematic) */
  ratio: number;
  beds: Bed[];
}

export interface Apartment {
  id: string;
  name: Localized;
  site: [left: number, top: number, width: number, height: number];
  floors: Floor[];
  /** The "floors" are actually separate rooms (affects the summary line). */
  rooms?: boolean;
}

export const FLOOR_LABELS: Record<FloorKey, Localized> = {
  main: { cs: "Přízemí", en: "Ground floor" },
  spodni: { cs: "Spodní patro", en: "Lower floor" },
  horni: { cs: "Horní patro", en: "Upper floor" },
  podkrovi: { cs: "Podkroví · po schodech", en: "Attic · via stairs" },
  pokoj1: { cs: "Pokoj 1", en: "Room 1" },
  pokoj2: { cs: "Pokoj 2", en: "Room 2" },
};

type BedSpec = Omit<Bed, "num">;
const D = "double", S = "single";
const bed = (id: string, type: BedType, x: number, y: number, w: number, h: number): BedSpec => ({ id, type, x, y, w, h });
const floor = (key: FloorKey, img: string, ratio: number, beds: BedSpec[]) => ({ key, img: `/plans/${img}.png`, ratio, beds });
/** A room without a plan: three single beds side by side in a schematic 4:3 room. */
const sketchRoom = (key: FloorKey, ids: [string, string, string]) => ({
  key,
  ratio: 4 / 3,
  beds: ids.map((id, i) => bed(id, S, 20 + i * 30, 45, 20, 40)),
});

const SPEC = [
  {
    id: "svatebni",
    name: { cs: "Svatební apartmán", en: "Wedding suite" },
    site: [36, 4, 28, 13],
    floors: [floor("main", "svatebni", 1061 / 1151, [bed("svatebni-1", D, 22.6, 31.7, 24.5, 22.6)])],
  },
  {
    id: "krbovy",
    name: { cs: "Krbový apartmán", en: "Fireplace apartment" },
    site: [6, 25, 34, 13],
    floors: [
      floor("main", "krbovy", 1561 / 1021, [
        bed("krbovy-1", D, 15.2, 25.7, 13, 23),
        bed("krbovy-2", D, 89.5, 28.6, 14, 18),
      ]),
    ],
  },
  {
    id: "terasovy",
    name: { cs: "Terasový apartmán", en: "Terrace apartment" },
    site: [62, 25, 32, 13],
    floors: [floor("main", "terasovy", 901 / 1221, [bed("terasovy-1", D, 28, 23.9, 27, 21)])],
  },
  {
    id: "spolecensky",
    name: { cs: "Společenský apartmán", en: "Social apartment" },
    site: [4, 48, 30, 18],
    floors: [
      floor("spodni", "spolecensky_spodni", 1211 / 1241, [bed("spolecensky-1", D, 88.4, 31, 12.4, 13.7)]),
      floor("horni", "spolecensky_horni", 1621 / 1121, [
        bed("spolecensky-2", D, 12.3, 25.9, 13.6, 18.7),
        bed("spolecensky-3", D, 51.6, 40.1, 9.6, 18.7),
        bed("spolecensky-4", D, 39, 84, 13.3, 20),
      ]),
      floor("podkrovi", "spolecensky_podkrovi", 1451 / 1081, [
        bed("spolecensky-5", S, 25.6, 34.9, 32.7, 20.8),
        bed("spolecensky-6", S, 25.6, 55.7, 32.7, 20.8),
        bed("spolecensky-7", S, 25.6, 76.5, 32.7, 20.8),
      ]),
    ],
  },
  {
    id: "mezonet",
    name: { cs: "Mezonetový apartmán", en: "Maisonette apartment" },
    site: [37, 46, 27, 20],
    floors: [
      floor("spodni", "mezonet_spodni", 801 / 1231, []),
      floor("horni", "mezonet_horni", 1491 / 1101, [
        bed("mezonet-1", D, 19.6, 25.4, 13, 19),
        bed("mezonet-2", D, 83.6, 27.2, 13, 23),
        bed("mezonet-3", S, 74.2, 84.2, 6.4, 18.6),
        bed("mezonet-4", S, 92.2, 84.2, 6.7, 18.6),
      ]),
      floor("podkrovi", "mezonet_podkrovi", 1811 / 771, [
        bed("mezonet-5", S, 12.4, 50.8, 15.5, 17.5),
        bed("mezonet-6", S, 12.4, 68.4, 15.5, 17.5),
        bed("mezonet-7", S, 87.9, 41.6, 15.7, 17.3),
        bed("mezonet-8", S, 87.9, 59, 15.7, 17.3),
        bed("mezonet-9", S, 87.9, 76.3, 15.7, 17.3),
      ]),
    ],
  },
  {
    id: "vyhlidkovy",
    name: { cs: "Vyhlídkový apartmán", en: "Lookout apartment" },
    site: [67, 48, 29, 18],
    floors: [
      floor("main", "vyhlidkovy", 1761 / 1101, [
        bed("vyhlidkovy-1", D, 90.1, 25.2, 12.8, 16.8),
        bed("vyhlidkovy-2", S, 77, 83.6, 6.2, 20),
        bed("vyhlidkovy-3", S, 93.4, 83.6, 6.2, 20),
      ]),
      floor("podkrovi", "vyhlidkovy_podkrovi", 1671 / 751, [
        bed("vyhlidkovy-4", S, 14.5, 40.6, 16.5, 17.3),
        bed("vyhlidkovy-5", S, 14.5, 57.9, 16.5, 17.3),
        bed("vyhlidkovy-6", S, 14.5, 75.2, 16.5, 17.3),
        bed("vyhlidkovy-7", S, 85.7, 40.6, 16.5, 17.3),
        bed("vyhlidkovy-8", S, 85.7, 57.9, 16.5, 17.3),
        bed("vyhlidkovy-9", S, 85.7, 75.2, 16.5, 17.3),
      ]),
    ],
  },
  {
    id: "hajenka",
    name: { cs: "Hájenka", en: "Gamekeeper's lodge" },
    site: [37, 82, 27, 11],
    rooms: true,
    floors: [
      sketchRoom("pokoj1", ["hajenka-1", "hajenka-2", "hajenka-3"]),
      sketchRoom("pokoj2", ["hajenka-4", "hajenka-5", "hajenka-6"]),
    ],
  },
] satisfies Array<Omit<Apartment, "floors"> & { floors: Array<Omit<Floor, "beds"> & { beds: BedSpec[] }> }>;

/** Apartments with beds numbered 1..n across all floors. */
export const APARTMENTS: Apartment[] = SPEC.map((a) => {
  let n = 0;
  return { ...a, floors: a.floors.map((f) => ({ ...f, beds: f.beds.map((b) => ({ ...b, num: ++n })) })) };
});

/** The newlyweds' apartment — gets hearts instead of bed numbers. */
export const WEDDING_APT = "svatebni";

export const bedCount = (a: Apartment) => a.floors.reduce((n, f) => n + f.beds.length, 0);

/** Index of the first floor that has beds (the sensible default tab). */
export const firstFloorWithBeds = (a: Apartment) => Math.max(0, a.floors.findIndex((f) => f.beds.length > 0));
