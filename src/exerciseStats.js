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

// Apskaičiuotas 1RM (Epley formulė) nuo sunkiausio to atlikimo seto — leidžia
// lyginti skirtingus svorio/pakartojimų derinius vienu skaičiumi ("jėgos
// indeksu"), o ne vien žaliavine sunkiausio svorio verte.
export function e1rmOf(ex) {
  const w = maxWeightOf(ex);
  const reps = ex.reps || 0;
  if (!w) return 0;
  if (!reps) return w;
  return w * (1 + reps / 30);
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
  const dateById = {}; past.forEach(s => { dateById[s.id] = (s.date || "").slice(0, 10); });
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
  const dateById = {}; capped.forEach(s => { dateById[s.id] = (s.date || "").slice(0, 10); });
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

// Pirmadienis-sekmadienis savaitės ribos (offsetWeeks=-1 → praėjusi savaitė).
function weekBounds(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diffToMonday + offsetWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return { start: monday.toISOString().split("T")[0], end: sunday.toISOString().split("T")[0] };
}

// Šios savaitės (Pr–Sk) treniruočių krūvio santrauka: kiek treniruočių
// atlikta (ir kiek planuota, jei yra aktyvus planas), darbinių setų skaičius,
// bendra darbo apimtis bei jos pokytis nuo praėjusios savaitės, ir kiek
// naujų asmeninių rekordų (e1RM) pasiekta per šią savaitę.
export async function fetchWeeklyWorkSummary(clientId) {
  const thisWeek = weekBounds(0);
  const prevWeek = weekBounds(-1);

  const sessions = await pb.collection("live_sessions").getFullList({
    filter: `user_id="${clientId}" && date>="${prevWeek.start}" && date<="${thisWeek.end}"`,
    sort: "date", requestKey: null,
  }).catch(() => []);

  const thisSessions = sessions.filter(s => s.date >= thisWeek.start && s.date <= thisWeek.end);
  const prevSessions = sessions.filter(s => s.date >= prevWeek.start && s.date <= prevWeek.end);

  async function exercisesFor(sess) {
    if (!sess.length) return [];
    const filter = sess.map(s => `session_id="${s.id}"`).join(" || ");
    return pb.collection("live_session_exercises").getFullList({ filter, requestKey: null }).catch(() => []);
  }
  const [thisExs, prevExs] = await Promise.all([exercisesFor(thisSessions), exercisesFor(prevSessions)]);

  function summarize(exs) {
    const workingSets = exs.reduce((s, e) => s + (e.sets || 0), 0);
    const volume = exs.reduce((s, e) => s + volumeOf(e), 0);
    return { workingSets, volume };
  }
  const thisSum = summarize(thisExs);
  const prevSum = summarize(prevExs);

  let volumeChangePct = null;
  if (prevSum.volume > 0) volumeChangePct = Math.round(((thisSum.volume - prevSum.volume) / prevSum.volume) * 100);

  // Planuota treniruočių per savaitę — iš aktyvaus plano dienų skaičiaus (apytikslis rodiklis).
  let plannedSessions = null;
  const activePlans = await pb.collection("workout_plans").getFullList({
    filter: `user_id="${clientId}" && is_active=true`, requestKey: null,
  }).then(list => list.filter(p => p.start_date <= thisWeek.end && p.end_date >= thisWeek.start)).catch(() => []);
  if (activePlans.length) {
    const days = await pb.collection("workout_plan_days").getFullList({
      filter: `plan_id="${activePlans[0].id}"`, requestKey: null,
    }).catch(() => []);
    plannedSessions = days.length || null;
  }

  // Nauji asmeniniai rekordai (e1RM) per šią savaitę, lyginant su visa ankstesne istorija.
  const namesThisWeek = [...new Set(
    thisExs.filter(e => e.category !== "cardio" && (e.weight_kg || e.set_weights)).map(e => e.exercise_name)
  )];
  let prCount = 0;
  for (const name of namesThisWeek) {
    const full = await fetchExerciseHistory(clientId, name);
    const before = full.filter(e => e.date < thisWeek.start && maxWeightOf(e) > 0);
    const during = full.filter(e => e.date >= thisWeek.start && e.date <= thisWeek.end && maxWeightOf(e) > 0);
    if (!before.length || !during.length) continue;
    const priorBest = Math.max(...before.map(e1rmOf));
    const weekBest = Math.max(...during.map(e1rmOf));
    if (weekBest > priorBest) prCount++;
  }

  return {
    weekStart: thisWeek.start, weekEnd: thisWeek.end,
    sessionsCompleted: thisSessions.length,
    prevSessionsCompleted: prevSessions.length,
    plannedSessions,
    workingSets: thisSum.workingSets,
    volume: Math.round(thisSum.volume),
    prevVolume: Math.round(prevSum.volume),
    volumeChangePct,
    sessionCountDiffers: thisSessions.length !== prevSessions.length,
    prCount,
  };
}