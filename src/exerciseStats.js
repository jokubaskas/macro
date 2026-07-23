// Gyvų treniruočių (live_sessions / live_session_exercises) statistikos
// pagalbinės funkcijos: "praeitą kartą" atskaita pridedant pratimą, viso
// pratimo progreso istorija, ir raumenų grupių balansas per laikotarpį.
// Trenerės vidinis įrankis — niekur nerodoma klientei.
import { pb } from "./pb";

const MAX_SESSIONS_FOR_BULK_FETCH = 200; // apsauga nuo per ilgo filter string'o senų klientų atveju

export function maxWeightOf(ex) {
  if (ex.set_weights) {
    try {
      const arr = JSON.parse(ex.set_weights).map(Number).filter(n => !isNaN(n));
      if (arr.length) return Math.max(...arr);
    } catch { /* naudoti weight_kg žemiau */ }
  }
  return ex.weight_kg || 0;
}

export function volumeOf(ex) {
  const reps = ex.reps || 0;
  if (ex.set_weights) {
    try {
      const arr = JSON.parse(ex.set_weights).map(Number).filter(n => !isNaN(n));
      if (arr.length) return arr.reduce((s,w) => s + w*reps, 0);
    } catch { /* naudoti weight_kg žemiau */ }
  }
  return (ex.weight_kg || 0) * (ex.sets || 0) * reps;
}

// Naujausias to paties pratimo atlikimas (be šiandienos) kiekvienam pratimo
// pavadinimui — rodoma kaip "praeitą kartą" atskaita pridedant naują
// pratimą į gyvą treniruotę, kad būtų aišku, ar didinti svorį.
export async function fetchLastPerformanceMap(clientId, excludeSessionIds = []) {
  const sessions = await pb.collection("live_sessions").getFullList({
    filter: `user_id="${clientId}"`, sort: "-date", requestKey: null,
  }).catch(() => []);
  const past = sessions.filter(s => !excludeSessionIds.includes(s.id)).slice(0, 20);
  if (!past.length) return {};
  const dateById = {}; past.forEach(s => { dateById[s.id] = s.date; });
  const filter = past.map(s => `session_id="${s.id}"`).join(" || ");
  const exs = await pb.collection("live_session_exercises").getFullList({ filter, requestKey: null }).catch(() => []);
  const sorted = [...exs].sort((a,b) => (dateById[b.session_id]||"").localeCompare(dateById[a.session_id]||""));
  const map = {};
  for (const ex of sorted) {
    if (!map[ex.exercise_name]) map[ex.exercise_name] = { ...ex, date: dateById[ex.session_id] };
  }
  return map;
}

// Viso konkretaus pratimo istorija (visos sesijos, chronologine tvarka) —
// naudojama progreso peržiūrai.
export async function fetchExerciseHistory(clientId, exerciseName) {
  const sessions = await pb.collection("live_sessions").getFullList({
    filter: `user_id="${clientId}"`, sort: "date", requestKey: null,
  }).catch(() => []);
  if (!sessions.length) return [];
  const capped = sessions.slice(-MAX_SESSIONS_FOR_BULK_FETCH);
  const dateById = {}; capped.forEach(s => { dateById[s.id] = s.date; });
  const filter = capped.map(s => `session_id="${s.id}"`).join(" || ");
  const exs = await pb.collection("live_session_exercises").getFullList({
    filter: `(${filter}) && exercise_name="${exerciseName.replace(/"/g,'\\"')}"`, requestKey: null,
  }).catch(() => []);
  return exs
    .map(ex => ({ ...ex, date: dateById[ex.session_id] }))
    .filter(ex => ex.date)
    .sort((a,b) => a.date.localeCompare(b.date));
}

// Visi skirtingi pratimų pavadinimai, kuriuos šis klientas kada nors darė
// gyvose treniruotėse — naudojama pasirenkant, kurio pratimo progresą žiūrėti.
export async function fetchDistinctExerciseNames(clientId) {
  const sessions = await pb.collection("live_sessions").getFullList({
    filter: `user_id="${clientId}"`, requestKey: null,
  }).catch(() => []);
  if (!sessions.length) return [];
  const capped = sessions.slice(0, MAX_SESSIONS_FOR_BULK_FETCH);
  const filter = capped.map(s => `session_id="${s.id}"`).join(" || ");
  const exs = await pb.collection("live_session_exercises").getFullList({
    filter, fields: "exercise_name,muscle", requestKey: null,
  }).catch(() => []);
  const seen = new Map();
  for (const ex of exs) if (!seen.has(ex.exercise_name)) seen.set(ex.exercise_name, ex.muscle);
  return [...seen.entries()].map(([name, muscle]) => ({ name, muscle })).sort((a,b) => a.name.localeCompare(b.name));
}

// Kiek kartų (skaičiuojant pratimų įrašus) treniruota kiekviena raumenų
// grupė per pastarąsias N dienų — atskleidžia disbalansą.
export async function fetchMuscleBalance(clientId, sinceDays = 28) {
  const since = new Date(Date.now() - sinceDays*24*60*60*1000).toISOString().split("T")[0];
  const sessions = await pb.collection("live_sessions").getFullList({
    filter: `user_id="${clientId}" && date>="${since}"`, requestKey: null,
  }).catch(() => []);
  if (!sessions.length) return {};
  const filter = sessions.map(s => `session_id="${s.id}"`).join(" || ");
  const exs = await pb.collection("live_session_exercises").getFullList({ filter, requestKey: null }).catch(() => []);
  const counts = {};
  for (const ex of exs) {
    if (ex.category === "cardio") continue;
    const m = ex.muscle || "Kita";
    counts[m] = (counts[m] || 0) + 1;
  }
  return counts;
}
