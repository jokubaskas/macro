// Bendra kcal/makro tikslų skaičiavimo logika — naudojama tiek kliento pusėje
// (MacroTracker.js), tiek trenerės pusėje (ClientInfo.js, TrainerStats.js),
// kad abi vietos rodytų TĄ PATĮ skaičių, o ne dvi atskiras, galinčias išsiskirti
// implementacijas.
import { pb } from "./pb";
import { calcMacros } from "./constants";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n) { return new Date(Date.now() - n*24*60*60*1000).toISOString().split("T")[0]; }

// Treniruočių dažnio bazinis daugiklis (sesijos/savaitę suapvalinamos iki
// artimiausio sveiko skaičiaus, 5+ traktuojama kaip aukščiausia pakopa).
const TRAINING_MULT = [1.2, 1.35, 1.45, 1.55, 1.65, 1.75]; // 0,1,2,3,4,5+ sesijų/sav.
const MULT_CAP = 1.8;

function trainingMultiplier(sessionsPerWeek) {
  const idx = Math.min(5, Math.max(0, Math.round(sessionsPerWeek)));
  return TRAINING_MULT[idx];
}

// Žingsniai koreguoja treniruočių daugiklį nedideliu ± priedu (ne pakeičia jo
// visiškai ir nesudauginami atskirai) — vidutinis žingsnių skaičius per 14 d.
function stepsAdjustment(avgSteps) {
  if (avgSteps == null)  return 0;
  if (avgSteps < 4000)   return -0.05;
  if (avgSteps < 7000)   return 0;
  if (avgSteps < 10000)  return 0.03;
  if (avgSteps < 12000)  return 0.05;
  if (avgSteps < 15000)  return 0.08;
  return 0.10;
}

// Aktyvumo koeficientas. Treniruočių dažnio komponentas ateina iš vieno iš
// dviejų šaltinių: jei treneris klientės kortelėje rankiniu būdu nustatė
// treniruočių dažnį (manualFreq, profile.manual_training_freq) — naudojamas
// jis; kitaip skaičiuojamas automatiškai iš realiai appe pažymėtų gyvų
// treniruočių (live_sessions) per pastarąsias 4 sav. Žingsnių pakoregavimas
// (iš daily_checkins) pridedamas ant viršaus abiem atvejais. Jei realių
// duomenų (nei rankinio dažnio, nei treniruočių/žingsnių istorijos) dar
// nėra, grąžinamas anketos atsakymas (fallbackAct, naudojamas per ACTIVITY
// lentelę constants.js).
export async function computeActivityLevel(userId, fallbackAct, manualFreq) {
  const since14 = daysAgoStr(14);
  const checkins = await pb.collection("daily_checkins").getFullList({
    filter: `user_id="${userId}" && date>="${since14}" && steps>0`, requestKey: null,
  }).catch(() => []);
  const stepDays = checkins.length;
  const avgSteps = stepDays > 0 ? checkins.reduce((s, c) => s + (c.steps || 0), 0) / stepDays : null;

  if (manualFreq) {
    const mult = Math.min(MULT_CAP, trainingMultiplier(manualFreq) + stepsAdjustment(avgSteps));
    return { computed: true, mult, sessionsPerWeek: manualFreq, avgSteps, manual: true };
  }

  const since28 = daysAgoStr(28);
  const liveSessions = await pb.collection("live_sessions").getFullList({
    filter: `user_id="${userId}" && completed=true && date>="${since28}"`, requestKey: null,
  }).catch(() => []);
  const trainingDates = new Set(liveSessions.map(s => (s.date || "").slice(0, 10)));
  const sessionsPerWeek = trainingDates.size / 4;

  const hasData = trainingDates.size > 0 || stepDays >= 5;
  if (!hasData) return { computed: false, level: fallbackAct };

  const mult = Math.min(MULT_CAP, trainingMultiplier(sessionsPerWeek) + stepsAdjustment(avgSteps));
  return { computed: true, mult, sessionsPerWeek, avgSteps };
}

// Naujausias trenerės įrašytas svoris, arba anketos svoris kaip atsarginis variantas.
export async function resolveWeightKg(userId, fallbackWeight) {
  try {
    const res = await pb.collection("trainer_measurements").getList(1, 10, {
      filter: `user_id="${userId}"`, sort: "-measured_at", requestKey: null,
    });
    const withWeight = (res.items || []).find(m => m.weight_measured);
    return parseFloat(withWeight?.weight_measured) || parseFloat(fallbackWeight) || null;
  } catch {
    return parseFloat(fallbackWeight) || null;
  }
}

// Pilnas kliento dienos kcal/makro tikslų apskaičiavimas iš profilio
// (anketos + trenerės nustatytų duomenų). Grąžina null, jei trūksta
// pakankamai duomenų (svoris, ūgis, amžius, lytis, tikslas ar aktyvumas).
export async function resolveMacroTargets(userId, profile) {
  const age = profile?.dob
    ? Math.floor((new Date() - new Date(profile.dob)) / (365.25*24*60*60*1000))
    : null;
  const [weightKg, actInfo] = await Promise.all([
    resolveWeightKg(userId, profile?.weight),
    (profile?.act || profile?.manual_training_freq)
      ? computeActivityLevel(userId, profile.act, profile.manual_training_freq)
      : Promise.resolve(null),
  ]);
  const canCalc = weightKg && profile?.height && age && profile?.gender && (actInfo?.computed || profile?.act) && profile?.goal;
  if (!canCalc) return null;
  const targets = calcMacros({
    gender: profile.gender, age, weight: weightKg, height: parseFloat(profile.height),
    actId: profile.act, goalId: profile.goal,
    multOverride: actInfo?.computed ? actInfo.mult : undefined,
  });
  return { targets, actInfo, weightKg, age };
}

export { todayStr, daysAgoStr };
