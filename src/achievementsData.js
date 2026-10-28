import { pb } from "./pb";
import { Flame, Dumbbell, Scale, Heart } from "./ui/icons";

// Pasiekimų linijos — kiekviena turi bronzos/sidabro/aukso lygį.
// "label" nenurodytas body_change lygiams, nes kryptis (−/+) priklauso nuo
// kliento tikslo (goal) ir skaičiuojama render'inant (žr. Achievements.js).
export const ACHIEVEMENTS = [
  {
    key: "streak", label: "Nuoseklumas", desc: "Ilgiausia check-in serija iš eilės", Icon: Flame,
    tiers: [
      { tier: "bronze", threshold: 7,   label: "7 dienos" },
      { tier: "silver", threshold: 30,  label: "30 dienų" },
      { tier: "gold",   threshold: 100, label: "100 dienų" },
    ],
  },
  {
    key: "workouts", label: "Treniruotės", desc: "Atliktos treniruotės su trenere", Icon: Dumbbell,
    tiers: [
      { tier: "bronze", threshold: 10,  label: "10 treniruočių" },
      { tier: "silver", threshold: 50,  label: "50 treniruočių" },
      { tier: "gold",   threshold: 100, label: "100 treniruočių" },
    ],
  },
  {
    key: "body_change", label: "Kūno pokytis", desc: "Pokytis nuo registracijos svorio", Icon: Scale,
    tiers: [
      { tier: "bronze", threshold: 2 },
      { tier: "silver", threshold: 5 },
      { tier: "gold",   threshold: 10 },
    ],
  },
  {
    key: "loyalty", label: "Kartu su Coach Vilma", desc: "Laikas nuo registracijos dienos", Icon: Heart,
    tiers: [
      { tier: "bronze", threshold: 30,  label: "1 mėnuo" },
      { tier: "silver", threshold: 90,  label: "3 mėnesiai" },
      { tier: "gold",   threshold: 365, label: "Metai" },
    ],
  },
];

function todayStr() { return new Date().toISOString().split("T")[0]; }

// Apskaičiuoja dabartines reikšmes kiekvienai pasiekimų linijai, palygina su
// jau PocketBase'e įrašytais pasiekimais ir naujai pasiektus lygius IŠKART
// įrašo (visam laikui — net jei reikšmė vėliau nukris žemiau slenksčio,
// pvz. klientas vėl priauga svorio, medalis nebedingsta).
export async function evaluateAchievements(userId, profile) {
  const [checkins, liveSessions, measurements, existing] = await Promise.all([
    pb.collection("daily_checkins").getFullList({ filter: `user_id="${userId}" && is_done=true`, fields: "date", requestKey: null }).catch(() => []),
    pb.collection("live_sessions").getFullList({ filter: `user_id="${userId}" && completed=true`, fields: "date", requestKey: null }).catch(() => []),
    pb.collection("trainer_measurements").getFullList({ filter: `user_id="${userId}"`, sort: "measured_at", requestKey: null }).catch(() => []),
    pb.collection("achievements").getFullList({ filter: `user_id="${userId}"`, requestKey: null }).catch(() => []),
  ]);

  // Ilgiausia check-in serija istorijoje (ne tik dabartinė — tas pats principas
  // kaip StreakBadge.js "best" skaičiavimas).
  const dates = [...new Set(checkins.map(c => c.date.slice(0, 10)))].sort();
  let bestStreak = 0, run = 0, prev = null;
  for (const d of dates) {
    if (prev) {
      const diff = (new Date(d + "T12:00:00") - new Date(prev + "T12:00:00")) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else run = 1;
    bestStreak = Math.max(bestStreak, run);
    prev = d;
  }

  const workoutsCount = new Set(liveSessions.map(s => s.date)).size;

  const weighted = measurements.filter(m => m.weight_measured);
  const firstW = weighted.length ? parseFloat(weighted[0].weight_measured) : (profile?.weight ? parseFloat(profile.weight) : null);
  const lastW  = weighted.length ? parseFloat(weighted[weighted.length - 1].weight_measured) : firstW;
  let bodyChange = 0;
  if (firstW != null && lastW != null) {
    const diff = lastW - firstW;
    if (profile?.goal === "gain") bodyChange = Math.max(0, diff);
    else if (profile?.goal === "lose") bodyChange = Math.max(0, -diff);
    else bodyChange = Math.abs(diff);
  }

  const loyaltyDays = profile?.created ? Math.floor((Date.now() - new Date(profile.created)) / 86400000) : 0;

  const currentValues = {
    streak: bestStreak,
    workouts: workoutsCount,
    body_change: Math.round(bodyChange * 10) / 10,
    loyalty: loyaltyDays,
  };

  const existingSet = new Set(existing.map(e => `${e.badge_key}:${e.tier}`));
  const toCreate = [];
  const newlyEarned = [];

  ACHIEVEMENTS.forEach(a => {
    a.tiers.forEach(t => {
      const sig = `${a.key}:${t.tier}`;
      if (currentValues[a.key] >= t.threshold && !existingSet.has(sig)) {
        toCreate.push({ user_id: userId, badge_key: a.key, tier: t.tier, earned_at: todayStr() });
        newlyEarned.push({ achievement: a, tier: t.tier });
      }
    });
  });

  if (toCreate.length) {
    // Skirtingas requestKey kiekvienam — kitaip PocketBase SDK vienu metu
    // siunčiamus create() į tą pačią kolekciją laiko dublikatais ir
    // automatiškai atšaukia ankstesnius (jei vienu metu pelnomi keli
    // medaliai, išliktų įrašytas tik paskutinis).
    await Promise.all(toCreate.map(rec => pb.collection("achievements").create(rec, { requestKey: `achv-${rec.badge_key}-${rec.tier}` }).catch(() => {})));
  }

  const earnedSet = new Set([...existingSet, ...toCreate.map(c => `${c.badge_key}:${c.tier}`)]);
  const earnedDates = {};
  existing.forEach(e => { earnedDates[`${e.badge_key}:${e.tier}`] = e.earned_at; });
  toCreate.forEach(c => { earnedDates[`${c.badge_key}:${c.tier}`] = c.earned_at; });

  return { currentValues, earnedSet, earnedDates, newlyEarned };
}
