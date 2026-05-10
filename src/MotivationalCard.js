import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { PK } from "./constants";

// ── Dienos seed'as – žinutė keičiasi kiekvieną dieną ─────────────────────────
function dayInt() {
  return parseInt(new Date().toISOString().split("T")[0].replace(/-/g, ""));
}
function pick(arr, extra = 0) {
  return arr[(dayInt() + extra) % arr.length];
}

// ── Žinučių šablonai ──────────────────────────────────────────────────────────
const MSG = {
  water: {
    great: (d) => pick([
      `Vanduo šią savaitę – tiesiog šaunuolė! ${d} dienas pasiekei tikslą 💧`,
      `Hidratacija ideali! Kūnas tau tikrai dėkoja 💧`,
      `${d} iš 7 dienų – vanduo einasi kaip iš pypkės! 💧`,
    ]),
    ok: () => pick([
      "Vanduo vidutiniškai – dar šiek tiek ir tikslą pasieksime 💧",
      "Vandeniukas šią savaitę – beveik! Kelios stiklinės papildomai 💧",
    ]),
    bad: (goal) => pick([
      `Nepamirški vandenėlio! Tikslas – ~${goal}ml per dieną 💧`,
      "Kūnas prašo daugiau vandens – pabandyk nešioti gertuvę visur 💧",
      "Rytą pradėk nuo didelio stiklinės vandens – kūnas atsipirks! 💧",
    ]),
  },
  protein: {
    great: (avg) => pick([
      `Baltymai šią savaitę – idealiai! ~${avg}g per dieną 💪`,
      `Raumenys džiaugiasi – ${avg}g baltymų per dieną, puiku! 💪`,
      `Baltymų srityje – tikra profesionalė! ${avg}g per dieną 💪`,
    ]),
    ok: () => pick([
      "Baltymai – gerai, bet dar yra kur augti 🥗",
      "Baltymai – vidutiniškai, pabandyk pridėti porą kiaušinių ar varškės 🥚",
    ]),
    bad: (target) => pick([
      `Baltymai – šiek tiek striuka. Tikslas ~${target}g per dieną 🥚`,
      `Pridėk varškės, kiaušinių ar vištienos – baltymai padeda raumenis išlaikyti! 🥩`,
      `Baltymai – silpnoji vieta šią savaitę. Rytoj pabandyk surinkti ${target}g 🥛`,
    ]),
  },
  calories: {
    great: (avg, target) => pick([
      `Kalorijos šią savaitę – beveik idealiai! Vid. ${avg} kcal (tikslas ${target}) ✅`,
      `Puiku – kalorijos tiksliai ties norma! ${avg} kcal per dieną ✅`,
    ]),
    over: (diff) => pick([
      `Kalorijos šiek tiek per didelės – ~${diff} kcal virš normos. Nieko baisaus! 📊`,
      `Kita savaitė atkreipk dėmesį į porcijų dydžius – kaloriukės truputį per daug 📊`,
    ]),
    under: (diff) => pick([
      `Kalorijos per mažos – ~${diff} kcal mažiau nei tikslas. Nevalgyk per mažai! 🍽️`,
      `Svarbu valgyti pakankamai – kūnas turi gauti energijos! Dar ~${diff} kcal trūksta 🍽️`,
    ]),
  },
  consistency: {
    great: (d) => pick([
      `${d}/7 dienų suvestas maisto žurnalas – nuoseklumas yra raktas! 🔑`,
      `Maisto žurnalas šią savaitę – pavyzdingas! ${d} iš 7 dienų 📊`,
      `Super – ${d} dienas sekei mitybą! Toks nuoseklumas duoda rezultatus 🌟`,
    ]),
    ok: (d) => pick([
      `${d} dienos suvestos – jau gerai, bet dar galime daugiau! 📱`,
      `Maisto žurnalas – vidutiniškai. Kita savaitė pabandyk suvedinėti kasdien 📝`,
    ]),
    bad: () => pick([
      "Kita savaitė pabandyk kasdien suvedinėti ką valgai – net trumpai! 📱",
      "Maisto žurnalas – mažai duomenų. Kuo daugiau suvedi, tuo tikslesnė pagalba 📊",
      "Suvedinėk mitybą kasdien – tai geriausias būdas pamatyti kur yra spraga 📝",
    ]),
  },
  sleep: {
    great: (v) => pick([
      `Miegas šią savaitę – ${v}/5, puiku! Pailsėjęs kūnas dirba geriau 😴`,
      `Puikus miegas – tai vienas iš svarbiausių komponentų! 🌙`,
    ]),
    bad: () => pick([
      "Miegas – šiek tiek striuka šią savaitę. Pabandyk eiti miegoti anksčiau 🌙",
      "Kūnas atsigauna miegant – pasistenk dėl kokybiško miego kitą savaitę 😴",
      "Stresas ar miegas trukdo? Pasirūpink poilsiu – tai investicija į rezultatus 🌙",
    ]),
  },
  workouts: {
    great: (v) => pick([
      `${v} treniruotės šią savaitę – bravo! Judame teisingai! 🏋️`,
      `Super aktyvumas – ${v} kartai sportavai! Kūnas džiaugiasi 🏃`,
      `${v} treniruotės per savaitę – tiesiog žvaigždė! ⭐`,
    ]),
    ok: (v) => pick([
      `${v} treniruotė(-s) – gerai, kitą savaitę pabandykime daugiau! 🏃`,
    ]),
    bad: () => pick([
      "Šią savaitę buvo maža judėjimo – net trumpas pasivaikščiojimas skaičiuojasi! 🚶",
      "Kitą savaitę rask bent 2 kartus judėjimui – kūnas prašo! 🏋️",
    ]),
  },
  stress: {
    great: () => pick([
      "Stresas žemas šią savaitę – tai tiesiogiai veikia rezultatus! 🧘",
      "Gera pusiausvyra – žemas stresas padeda kūnui atsistatyti 🌿",
    ]),
    bad: () => pick([
      "Matosi, kad savaitė buvo sunki – pasirūpink savimi, to irgi reikia! 💆",
      "Stresas kenkia progresui – pabandyk kiekvieną dieną skirti 5 min. sau 🧘",
    ]),
  },
  weight: {
    down: (diff) => pick([
      `Svoris sumažėjo ${diff} kg – judame teisinga kryptimi! 🎉`,
      `Svoris mažėja – ${diff} kg žemyn! Pastangos atsiperka 💚`,
    ]),
    stable: () => pick([
      "Svoris stabilus – puiku, jei tikslas palaikyti formą! ⚖️",
    ]),
    up_lose: (diff) => pick([
      `Svoris ↑ ${diff} kg – nieko baisaus, analizuosime kartu! 📊`,
    ]),
  },
  general: {
    great: () => pick([
      "Tu šią savaitę – tiesiog žvaigždė! Viskas einasi kaip reikia 🌟",
      "Nuostabi savaitė! Tęsk šia kryptimi – rezultatai netrukus matysis ⭐",
      "Viskas idealiai! Toks nuoseklumas – tai jau tikra sistema 🏆",
    ]),
    encourage: () => pick([
      "Kiekviena diena – nauja pradžia. Žingsnis po žingsnio! 💗",
      "Svarbu ne tobulumas, o pastangos. Tu saunuolė kad stengiesi! 💗",
      "Progresas nėra tiesi linija – svarbu tęsti! Tu tuo kelyje 💗",
    ]),
  },
};

// ── Pagrindinis algoritmas ────────────────────────────────────────────────────
async function analyzeAndGenerateMessage(userId, res, goalId) {
  const today   = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split("T")[0];

  // Paraleliniai užklausai
  const [{ data: foods }, { data: waters }, { data: checkins }, { data: weightData }] = await Promise.all([
    supabase.from("food_log").select("date,kcal,protein").eq("user_id",userId).gte("date",weekAgo).lte("date",today),
    supabase.from("water_log").select("date,ml,goal").eq("user_id",userId).gte("date",weekAgo).lte("date",today),
    supabase.from("client_checkins").select("*").eq("user_id",userId).order("week_start",{ascending:false}).limit(2),
    supabase.from("client_checkins").select("weight_self,week_start").eq("user_id",userId).order("week_start",{ascending:false}).limit(4),
  ]);

  const signals = []; // { cat, score -2..+2, msg }

  // ── 1. Vanduo ──────────────────────────────────────────────────────────────
  if (waters?.length > 0) {
    const goalMl   = waters[0]?.goal || 2000;
    const goalDays = waters.filter(w => w.ml >= w.goal).length;
    const rate     = goalDays / 7;
    if (rate >= 0.7)      signals.push({ cat:"water", score:2,  msg:MSG.water.great(goalDays) });
    else if (rate >= 0.4) signals.push({ cat:"water", score:0,  msg:MSG.water.ok() });
    else                  signals.push({ cat:"water", score:-2, msg:MSG.water.bad(goalMl) });
  }

  // ── 2. Maisto žurnalas ────────────────────────────────────────────────────
  const byDate = {};
  foods?.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = { kcal:0, protein:0, n:0 };
    byDate[e.date].kcal    += e.kcal    || 0;
    byDate[e.date].protein += e.protein || 0;
    byDate[e.date].n++;
  });
  const loggedDays = Object.keys(byDate).length;

  // Nuoseklumas
  if (loggedDays >= 5)     signals.push({ cat:"consistency", score:2,  msg:MSG.consistency.great(loggedDays) });
  else if (loggedDays >= 3)signals.push({ cat:"consistency", score:0,  msg:MSG.consistency.ok(loggedDays) });
  else if (loggedDays > 0) signals.push({ cat:"consistency", score:-1, msg:MSG.consistency.bad() });

  // Baltymai
  const targetProtein = res?.prot?.g;
  if (loggedDays > 0 && targetProtein) {
    const avgP = Math.round(Object.values(byDate).reduce((a,d)=>a+d.protein,0) / loggedDays);
    const rate = avgP / targetProtein;
    if (rate >= 0.85)      signals.push({ cat:"protein", score:2,  msg:MSG.protein.great(avgP) });
    else if (rate >= 0.65) signals.push({ cat:"protein", score:0,  msg:MSG.protein.ok() });
    else                   signals.push({ cat:"protein", score:-2, msg:MSG.protein.bad(targetProtein) });
  }

  // Kalorijos
  const targetKcal = res?.target;
  if (loggedDays > 0 && targetKcal) {
    const avgK    = Math.round(Object.values(byDate).reduce((a,d)=>a+d.kcal,0) / loggedDays);
    const diffPct = (avgK - targetKcal) / targetKcal;
    const diffAbs = Math.abs(Math.round(avgK - targetKcal));
    if (Math.abs(diffPct) <= 0.10)        signals.push({ cat:"calories", score:2,  msg:MSG.calories.great(avgK, targetKcal) });
    else if (diffPct > 0.10)              signals.push({ cat:"calories", score:-1, msg:MSG.calories.over(diffAbs) });
    else if (diffPct < -0.15)             signals.push({ cat:"calories", score:-1, msg:MSG.calories.under(diffAbs) });
  }

  // ── 3. Check-in duomenys ──────────────────────────────────────────────────
  const ci = checkins?.[0];
  if (ci?.is_done) {
    if (ci.sleep_quality != null) {
      if (ci.sleep_quality >= 4)      signals.push({ cat:"sleep",    score:2,  msg:MSG.sleep.great(ci.sleep_quality) });
      else if (ci.sleep_quality <= 2) signals.push({ cat:"sleep",    score:-2, msg:MSG.sleep.bad() });
    }
    if (ci.workouts_done != null) {
      if (ci.workouts_done >= 3)      signals.push({ cat:"workouts", score:2,  msg:MSG.workouts.great(ci.workouts_done) });
      else if (ci.workouts_done === 1)signals.push({ cat:"workouts", score:0,  msg:MSG.workouts.ok(ci.workouts_done) });
      else if (ci.workouts_done === 0)signals.push({ cat:"workouts", score:-1, msg:MSG.workouts.bad() });
    }
    if (ci.stress_level != null) {
      if (ci.stress_level <= 2)       signals.push({ cat:"stress",   score:1,  msg:MSG.stress.great() });
      else if (ci.stress_level >= 4)  signals.push({ cat:"stress",   score:-1, msg:MSG.stress.bad() });
    }
  }

  // ── 4. Svorio tendencija ──────────────────────────────────────────────────
  const weights = weightData?.filter(d=>d.weight_self).map(d=>+d.weight_self) || [];
  if (weights.length >= 2) {
    const diff = +(weights[0] - weights[1]).toFixed(1);
    if (goalId === "lose") {
      if (diff < -0.1)       signals.push({ cat:"weight", score:2,  msg:MSG.weight.down(Math.abs(diff)) });
      else if (diff > 0.3)   signals.push({ cat:"weight", score:-1, msg:MSG.weight.up_lose(diff) });
    } else {
      if (Math.abs(diff) < 0.3) signals.push({ cat:"weight", score:1, msg:MSG.weight.stable() });
    }
  }

  // ── Pasirinkti geriausią ir blogiausią ───────────────────────────────────
  const positives = signals.filter(s=>s.score>0).sort((a,b)=>b.score-a.score);
  const negatives = signals.filter(s=>s.score<0).sort((a,b)=>a.score-b.score);
  const hasData   = signals.length > 0;

  if (!hasData) {
    return {
      emoji: "💗",
      main:  "Sveika! Pradėk suvedinėti mitybą ir vandenį – pamatysi išmintingas įžvalgas 🌸",
      tip:   null,
      type:  "neutral",
    };
  }

  // Jei viskas gerai
  if (positives.length >= 3 && negatives.length === 0) {
    return { emoji:"🌟", main:MSG.general.great(), tip:positives[0]?.msg, type:"great" };
  }

  // Jei yra ir sėkmė ir trūkumas
  if (positives.length > 0 && negatives.length > 0) {
    // Seed-based: kai kada rodome sėkmę pirma, kai kada – patarimą
    const showWinFirst = (dayInt() % 3) !== 0;
    return showWinFirst
      ? { emoji:"✨", main:positives[0].msg, tip:"Pasistenk: " + negatives[0].msg, type:"good" }
      : { emoji:"💪", main:"Tu saunuolė! " + negatives[0].msg, tip:"Gerai sekasi: " + positives[0].msg, type:"improve" };
  }

  // Tik trūkumai
  if (negatives.length > 0) {
    return { emoji:"💙", main:MSG.general.encourage(), tip:negatives[0].msg, type:"encourage" };
  }

  // Tik neutralai/teigiami
  return { emoji:"😊", main:positives[0]?.msg || MSG.general.encourage(), tip:null, type:"neutral" };
}

// ── Vizualinis komponentas ────────────────────────────────────────────────────
const TYPE_STYLES = {
  great:    { bg:"linear-gradient(135deg,#1a4731,#276749)", border:"rgba(144,238,144,0.3)", tipBg:"rgba(255,255,255,0.08)" },
  good:     { bg:"linear-gradient(135deg,#4a1c5c,#7b2d8b)", border:"rgba(200,150,255,0.3)", tipBg:"rgba(255,255,255,0.08)" },
  improve:  { bg:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", border:"rgba(255,179,198,0.3)", tipBg:"rgba(255,255,255,0.1)" },
  encourage:{ bg:"linear-gradient(135deg,#1a2a4a,#2d4a7a)", border:"rgba(137,207,240,0.3)", tipBg:"rgba(255,255,255,0.08)" },
  neutral:  { bg:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", border:"rgba(255,255,255,0.15)", tipBg:"rgba(255,255,255,0.08)" },
};

export default function MotivationalCard({ userId, res, goalId }) {
  const [msg,     setMsg]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    analyzeAndGenerateMessage(userId, res, goalId)
      .then(m => { setMsg(m); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId, res?.target]);

  if (loading) return (
    <div style={{
      background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")",
      borderRadius:20, padding:"16px 18px", marginBottom:12,
      boxShadow:"0 4px 18px rgba(173,20,87,0.25)",
      display:"flex", alignItems:"center", gap:12,
    }}>
      <div style={{ fontSize:28 }}>💗</div>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>Analizuojami tavo duomenys...</p>
    </div>
  );

  if (!msg) return null;

  const style = TYPE_STYLES[msg.type] || TYPE_STYLES.neutral;

  const today = new Date().toLocaleDateString("lt-LT", { weekday:"long", month:"long", day:"numeric" });

  return (
    <div style={{
      background:  style.bg,
      borderRadius:20,
      padding:     "16px 18px",
      marginBottom:12,
      boxShadow:   "0 4px 20px rgba(0,0,0,0.25)",
      border:      "1px solid " + style.border,
    }}>
      {/* Data */}
      <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:"0 0 10px", textTransform:"capitalize", letterSpacing:"0.05em" }}>
        {today}
      </p>

      {/* Pagrindinė žinutė */}
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom: msg.tip ? 12 : 0 }}>
        <span style={{ fontSize:32, lineHeight:1, flexShrink:0 }}>{msg.emoji}</span>
        <p style={{
          fontSize:15, fontWeight:600, color:"#fff", margin:0, lineHeight:1.5,
          textShadow:"0 1px 4px rgba(0,0,0,0.3)",
        }}>
          {msg.main}
        </p>
      </div>

      {/* Patarimas / papildoma žinutė */}
      {msg.tip && (
        <div style={{
          background:  style.tipBg,
          borderRadius:12,
          padding:     "9px 12px",
          borderLeft:  "2.5px solid rgba(255,255,255,0.25)",
        }}>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.75)", margin:0, lineHeight:1.5 }}>
            {msg.tip}
          </p>
        </div>
      )}
    </div>
  );
}
