// Įprastų (pastovių) treniruočių laikų patvirtinimo terminas.
// Kiekvieną savaitę klientas turi patvirtinti savo įprastą laiką iki šio
// termino, kitaip nuo kitos dienos jis atsilaisvina visiems klientams.
export const RECURRING_DEADLINE_DOW  = 4;      // 1=Pr..7=Sk (4 = ketvirtadienis)
export const RECURRING_DEADLINE_TIME = "23:59";

// Konkrečiam treniruotės datos terminui (pvz. kito pirmadienio) apskaičiuoja
// artimiausią praeityje esantį terminą (pvz. praėjusio ketvirtadienio 23:59).
export function recurringDeadline(sessionDateStr) {
  const d = new Date(sessionDateStr + "T00:00:00");
  const sessionDow = d.getDay() === 0 ? 7 : d.getDay();
  let diff = sessionDow - RECURRING_DEADLINE_DOW;
  if (diff <= 0) diff += 7;
  const deadline = new Date(d);
  deadline.setDate(d.getDate() - diff);
  const [hh, mm] = RECURRING_DEADLINE_TIME.split(":").map(Number);
  deadline.setHours(hh, mm, 0, 0);
  return deadline;
}

export function isRecurringHoldActive(sessionDateStr) {
  return new Date() < recurringDeadline(sessionDateStr);
}

// Kiek dienų liko iki artimiausio gimtadienio (0 = šiandien). null, jei dob nežinomas/blogas.
export function daysUntilBirthday(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const next = new Date(today.getFullYear(), d.getMonth(), d.getDate());
  next.setHours(0, 0, 0, 0);
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next - today) / 86400000);
}

export function isBirthdayToday(dob) {
  return daysUntilBirthday(dob) === 0;
}

// Bendra gradientinė paletė progreso indikatoriams (žingsniai, vanduo, miegas,
// šviesoforo įvertinimai) — vieninga vizualinė kalba visame appe.
export const MOOD = {
  bad:   { c1: "#FF7A6E", c2: "#E14A45" },
  mid:   { c1: "#FFC15E", c2: "#F2A63D" },
  good:  { c1: "#5CE3A6", c2: "#2FBE84" },
  water: { c1: "#6EC6FF", c2: "#2F8FE0" },
};

export const PK = {
  dark:   "#6D1B3B",
  mid:    "#AD1457",
  bright: "#E91E8C",
  rose:   "#F48FB1",
  blush:  "#F8BBD9",
  light:  "#FCE4EC",
  pale:   "#FFF0F5",
  coral:  "#FFB3C6",
  water:  "#5BB8D4",
};

export const ACTIVITY = [
  { id: 1, label: "Sėdimas",       desc: "Biuras, mažai judama",     mult: 1.2   },
  { id: 2, label: "Lengvas",       desc: "1–2 treniruotės / sav.",   mult: 1.375 },
  { id: 3, label: "Vidutinis",     desc: "3–4 treniruotės / sav.",   mult: 1.55  },
  { id: 4, label: "Aktyvus",       desc: "5–6 treniruotės / sav.",   mult: 1.725 },
  { id: 5, label: "Labai aktyvus", desc: "Kasdien + fizinis darbas", mult: 1.9   },
];

export const GOALS = [
  { id: "lose",     label: "Lieknėti",         adj: -400, protPerKg: 2.0, fatPct: 0.25,
    tip: "400 kcal deficitas ≈ 0.4 kg/sav. Aukštesnė baltymų norma saugo raumenis." },
  { id: "maintain", label: "Palaikyti svorį",  adj: 0,    protPerKg: 1.6, fatPct: 0.30,
    tip: "Subalansuotas planas svorio palaikymui be streso." },
  { id: "gain",     label: "Auginti raumenis", adj: 300,  protPerKg: 2.2, fatPct: 0.25,
    tip: "300 kcal perteklius – lėtas švarus raumenų augimas." },
];

export function calcMacros({ gender, age, weight, height, actId, goalId, multOverride }) {
  const G    = GOALS.find(g => g.id === goalId);
  const mult = multOverride ?? (ACTIVITY.find(x => x.id === actId)?.mult ?? 1.55);
  const base = 10 * weight + 6.25 * height - 5 * age + (gender === "f" ? -161 : 5);
  const tdee = base * mult;
  const tgt  = Math.max(1200, Math.round(tdee + G.adj));
  const pG   = Math.round(weight * G.protPerKg);
  const pK   = pG * 4;
  const fK   = Math.round(tgt * G.fatPct);
  const fG   = Math.round(fK / 9);
  const cK   = Math.max(0, tgt - pK - fK);
  const cG   = Math.round(cK / 4);
  return {
    bmr: Math.round(base), tdee: Math.round(tdee), target: tgt,
    prot: { g: pG, kcal: Math.round(pK), pct: Math.round(pK / tgt * 100) },
    fat:  { g: fG, kcal: Math.round(fK), pct: Math.round(fK / tgt * 100) },
    carb: { g: cG, kcal: Math.round(cK), pct: Math.round(cK / tgt * 100) },
    water: (weight * 0.033).toFixed(1),
    protNorm: G.protPerKg,
    tip: G.tip,
  };
}