// Pratimai suskirstyti pagal kategorijas
export const EXERCISES = [
  // ── Krūtinė ──────────────────────────────────────────────────────────────
  { name: "Gultyni spiaudymas (štanga)", category: "strength", muscle: "Krūtinė" },
  { name: "Gultyni spiaudymas (hanteliai)", category: "strength", muscle: "Krūtinė" },
  { name: "Įstrižas spiaudymas", category: "strength", muscle: "Krūtinė" },
  { name: "Kabinimas (crossover)", category: "strength", muscle: "Krūtinė" },
  { name: "Atsispaudimai", category: "strength", muscle: "Krūtinė" },
  { name: "Atsispaudimai ant lygiagrečių stovų (dips)", category: "strength", muscle: "Krūtinė" },

  // ── Nugara ────────────────────────────────────────────────────────────────
  { name: "Traukimas prie krūtinės (lat pulldown)", category: "strength", muscle: "Nugara" },
  { name: "Irklavimas sėdint (cable row)", category: "strength", muscle: "Nugara" },
  { name: "Irklavimas su štanga", category: "strength", muscle: "Nugara" },
  { name: "Irklavimas su hanteliu", category: "strength", muscle: "Nugara" },
  { name: "Patraukimai (pull-ups)", category: "strength", muscle: "Nugara" },
  { name: "Hiperekstenzija", category: "strength", muscle: "Nugara" },
  { name: "Deadlift", category: "strength", muscle: "Nugara" },

  // ── Pečiai ────────────────────────────────────────────────────────────────
  { name: "Spaudimas virš galvos (štanga)", category: "strength", muscle: "Pečiai" },
  { name: "Spaudimas virš galvos (hanteliai)", category: "strength", muscle: "Pečiai" },
  { name: "Šoninis kėlimas (hanteliai)", category: "strength", muscle: "Pečiai" },
  { name: "Priekinis kėlimas", category: "strength", muscle: "Pečiai" },
  { name: "Reverse fly", category: "strength", muscle: "Pečiai" },
  { name: "Trapecijų kėlimas (shrugs)", category: "strength", muscle: "Pečiai" },

  // ── Rankos ────────────────────────────────────────────────────────────────
  { name: "Bicepso lenkimas (štanga)", category: "strength", muscle: "Rankos" },
  { name: "Bicepso lenkimas (hanteliai)", category: "strength", muscle: "Rankos" },
  { name: "Hammer curl", category: "strength", muscle: "Rankos" },
  { name: "Tricepso tiesimas (blokui)", category: "strength", muscle: "Rankos" },
  { name: "Skull crushers", category: "strength", muscle: "Rankos" },
  { name: "Tricepso tiesimas virš galvos", category: "strength", muscle: "Rankos" },

  // ── Kojos ────────────────────────────────────────────────────────────────
  { name: "Pritūpimai (štanga)", category: "strength", muscle: "Kojos" },
  { name: "Pritūpimai (Smith mašina)", category: "strength", muscle: "Kojos" },
  { name: "Kojų spaudimas (leg press)", category: "strength", muscle: "Kojos" },
  { name: "Išpuoliai su hanteliais", category: "strength", muscle: "Kojos" },
  { name: "Rumuniškas deadlift", category: "strength", muscle: "Kojos" },
  { name: "Kojų lenkimas (leg curl)", category: "strength", muscle: "Kojos" },
  { name: "Kojų tiesimas (leg extension)", category: "strength", muscle: "Kojos" },
  { name: "Blauzdų kėlimas", category: "strength", muscle: "Kojos" },
  { name: "Hip thrust", category: "strength", muscle: "Kojos" },
  { name: "Sumo pritūpimai", category: "strength", muscle: "Kojos" },

  // ── Pilvas ────────────────────────────────────────────────────────────────
  { name: "Sukubimai (crunches)", category: "strength", muscle: "Pilvas" },
  { name: "Kojų kėlimas gulint", category: "strength", muscle: "Pilvas" },
  { name: "Planka", category: "strength", muscle: "Pilvas" },
  { name: "Šoninė planka", category: "strength", muscle: "Pilvas" },
  { name: "Russian twist", category: "strength", muscle: "Pilvas" },
  { name: "Kabelio sukubimai", category: "strength", muscle: "Pilvas" },
  { name: "Ab rollout", category: "strength", muscle: "Pilvas" },

  // ── Cardio ────────────────────────────────────────────────────────────────
  { name: "Bėgimas (bėgtakis)", category: "cardio", muscle: "Cardio" },
  { name: "Elipsinis treniruoklis", category: "cardio", muscle: "Cardio" },
  { name: "Dviratis (spinning)", category: "cardio", muscle: "Cardio" },
  { name: "Irklavimo treniruoklis", category: "cardio", muscle: "Cardio" },
  { name: "Laiptaklis (stairmaster)", category: "cardio", muscle: "Cardio" },
  { name: "Šokinėjimas per virvutę", category: "cardio", muscle: "Cardio" },
  { name: "HIIT", category: "cardio", muscle: "Cardio" },
];

export const MUSCLE_GROUPS = [...new Set(EXERCISES.map(e => e.muscle))];
