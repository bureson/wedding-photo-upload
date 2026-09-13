// Jména hostů na postelích / Guest names per bed.
// Klíč = id postele, hodnota = seznam jmen. Prázdný seznam [] = zatím neobsazeno.
// Key = bed id, value = list of names. Empty list [] = not assigned yet.
//
// Postele / Beds (ids and positions are defined in accommodation.ts):
//   svatebni-1                       Svatební apartmán – dvoulůžko
//   krbovy-1, krbovy-2               Krbový apartmán – 2× dvoulůžko
//   terasovy-1                       Terasový apartmán – dvoulůžko
//   spolecensky-1                    Společenský – spodní patro, dvoulůžko
//   spolecensky-2 .. -4              Společenský – horní patro, 3× dvoulůžko
//   spolecensky-5 .. -7              Společenský – podkroví, 3× jednolůžko
//   mezonet-1, mezonet-2             Mezonetový – horní patro, 2× dvoulůžko
//   mezonet-3, mezonet-4             Mezonetový – horní patro, 2× jednolůžko
//   mezonet-5 .. -9                  Mezonetový – podkroví, 5× jednolůžko
//   vyhlidkovy-1                     Vyhlídkový – přízemí, dvoulůžko
//   vyhlidkovy-2, vyhlidkovy-3       Vyhlídkový – přízemí, 2× jednolůžko
//   vyhlidkovy-4 .. -9               Vyhlídkový – podkroví, 6× jednolůžko
//   hajenka-1 .. -3                  Hájenka – pokoj 1, 3× jednolůžko
//   hajenka-4 .. -6                  Hájenka – pokoj 2, 3× jednolůžko

export const GUESTS: Record<string, string[]> = {
  "svatebni-1": ["Nevěsta", "Ženich"],
  "krbovy-1": ["Markéta Kalitová", "Jakub Kalita", "Kubíček Kalita"],
  "krbovy-2": ["Jaroslav Mohila", "Monika Ruleová", "Sebík Mohila"],
  "terasovy-1": ["Hanka Nguyen", "Dominik Nguyen", "Ríša Nguyen"],
  "spolecensky-1": ["Stanislav Moule", "Irena Mouleová"],
  "spolecensky-2": ["Irena Burešová", "Josef Bureš"],
  "spolecensky-3": ["Lars Thorup"],
  "spolecensky-4": ["Jana Boháčová", "Jiří Boháč"],
  "spolecensky-5": ["Vojtěch Boháč"],
  "spolecensky-6": ["Adam Boháč"],
  "spolecensky-7": ["Nikola Kotyková"],
  "mezonet-1": ["Petra Absolonová", "Viktorka Absolonová"],
  "mezonet-2": ["Lenka Forgáčová", "Michal Forgáč"],
  "mezonet-3": ["Filípek Forgáč"],
  "mezonet-4": ["Honzík Forgáč"],
  "mezonet-5": ["Hanka Šinkorová"],
  "mezonet-6": ["Jakub Sokol"],
  "mezonet-7": ["Eliška Palmová"],
  "mezonet-8": ["Dominik Piskač"],
  "mezonet-9": ["Týnka Horáková"],
  "vyhlidkovy-1": ["Kateřina Honzejková", "Denis Honzejk"],
  "vyhlidkovy-2": ["Tomáš Tůma"],
  "vyhlidkovy-3": ["Gabriela Havlanová"],
  "vyhlidkovy-4": ["Jakub Kraus"],
  "vyhlidkovy-5": ["Ondřej Nekvinda"],
  "vyhlidkovy-6": ["David Kalenda"],
  "vyhlidkovy-7": ["Pavel Exner"],
  "vyhlidkovy-8": ["Bohumil Vybíralík"],
  "vyhlidkovy-9": ["Alena Čechová"],
  "hajenka-1": [],
  "hajenka-2": [],
  "hajenka-3": [],
  "hajenka-4": [],
  "hajenka-5": [],
  "hajenka-6": [],
};
