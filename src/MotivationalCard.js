import { useState, useEffect } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { PK } from "./constants";

// ── Dienos seed – žinutė stabili per dieną, keičiasi kitą dieną ──────────────
function dayInt() {
  return parseInt(new Date().toISOString().split("T")[0].replace(/-/g, ""));
}
function pick(arr, offset = 0) {
  return arr[(dayInt() + offset) % arr.length];
}

// ── Motyvacinės žinutės (taisyta lietuvių kalba) ─────────────────────────────
const MSG = {
  water: {
    great: (d) => pick([
      `Vanduo šią savaitę – puikiai! Net ${d} dieną(-as) pasiekei tikslą 💧`,
      `Hidratacija idealiai! Kūnas tau dėkoja kiekvienu gurkšniu 💧`,
      `${d} iš 7 dienų – tikra vandens čempionė! 💧`,
    ]),
    ok: () => pick([
      "Vandens šią savaitę – šiek tiek maža, bet beveik! Dar kelios stiklinės 💧",
      "Vanduo – vidutiniškai. Pabandyk rytoj pradėti dieną didelę stikline vandens 💧",
    ]),
    bad: (goal) => pick([
      `Vandens šią savaitę labai trūko – tikslas yra apie ${goal} ml per dieną 💧`,
      "Kūnas prašo daugiau skysčių! Gertuvė prie savęs – paprasčiausias sprendimas 💧",
      "Pamiršti gerti – dažna klaida. Rytoj pabandyk: stiklinė vandens kas dvi valandas 💧",
    ]),
  },

  protein: {
    great: (avg) => pick([
      `Baltymai šią savaitę – tiesiog idealiai! Vidutiniškai ${avg} g per dieną 💪`,
      `${avg} g baltymų per dieną – raumenys tikrai džiaugiasi! 💪`,
      `Baltymų tikslas pasiektas! ${avg} g per dieną – puikus rezultatas 💪`,
    ]),
    ok: () => pick([
      "Baltymai – neblogai, bet dar yra kur augti. Pridėk kiaušinį ar varškės 🥚",
      "Baltymų truputį trūksta – paprastas sprendimas: daugiau varškės, kiaušinių, vištienos 🥗",
    ]),
    bad: (target) => pick([
      `Baltymų šią savaitę per mažai – tikslas yra apie ${target} g per dieną 🥚`,
      `Baltymai – silpnoji vieta šią savaitę. Kitą dieną pridėk varškės ar kiaušinių 🥩`,
      `Trūksta baltymų! Tikslas – ${target} g per dieną. Kiaušinis, varškė, vištiena – tavo draugai 🍳`,
    ]),
  },

  calories: {
    great: (avg, target) => pick([
      `Kalorijos šią savaitę – beveik tobulai! Vidutiniškai ${avg} kcal (tikslas – ${target}) ✅`,
      `Puiku – kalorijos tiksliai ties norma! ${avg} kcal per dieną ✅`,
    ]),
    over: (diff) => pick([
      `Kalorijos šiek tiek per didelės – apie ${diff} kcal virš normos per dieną. Nieko baisaus! 📊`,
      `Kita savaitė atkreipk dėmesį į porcijų dydžius – kalorijos truputį per daug 📊`,
    ]),
    under: (diff) => pick([
      `Kalorijos per mažos – apie ${diff} kcal mažiau nei tikslas. Nevalgyk per mažai! 🍽️`,
      `Svarbu valgyti pakankamai – kūnas turi gauti energijos! Dar apie ${diff} kcal trūksta per dieną 🍽️`,
    ]),
  },

  consistency: {
    great: (d) => pick([
      `${d} iš 7 dienų suvestas maisto žurnalas – nuoseklumas yra raktas į rezultatus! 🔑`,
      `Maisto žurnalas šią savaitę – pavyzdingas! ${d} iš 7 dienų 📊`,
      `Nuostabiai! ${d} dienas sekei mitybą – toks nuoseklumas duoda rezultatus 🌟`,
    ]),
    ok: (d) => pick([
      `${d} dienos suvestos – jau gerai, bet kita savaitė pabandykime kasdien! 📱`,
      `Maisto žurnalas – vidutiniškai. Kita savaitė pabandyk suvedinėti kasdien 📝`,
    ]),
    bad: () => pick([
      "Kita savaitė pabandyk kasdien suvedinėti, ką valgai – net trumpai 📱",
      "Maisto žurnalo mažai – kuo daugiau suvedi, tuo tikslesnė pagalba iš manęs 📊",
      "Suvedinėk mitybą kasdien – tai geriausias būdas pamatyti, kur slypi spraga 📝",
    ]),
  },

  sleep: {
    great: (v) => pick([
      `Miegas šią savaitę – ${v} iš 5, puikiai! Pailsėjęs organizmas dirba efektyviau 😴`,
      `Puikus miegas – vienas iš svarbiausių progreso komponentų! 🌙`,
      `Miegas ${v}/5 – tikrai gerai! Tai tiesiogiai veikia energiją ir rezultatus 🌙`,
    ]),
    bad: () => pick([
      "Miegas šią savaitę – striuka. Pabandyk eiti miegoti bent 30 min. anksčiau 🌙",
      "Matosi, kad miegas buvo prastas – tai veikia ir energiją, ir apetitą 😴",
      "Kokybiškas miegas – ne prabanga, o būtinybė. Kitą savaitę padėk sau pailsėti 🌙",
    ]),
  },

  workouts: {
    great: (v) => pick([
      `${v} treniruotės šią savaitę – šaunuolė! Judam teisingai! 🏋️`,
      `Nuostabu – ${v} kartus sportavai! Kūnas tikrai džiaugiasi 🏃`,
      `${v} treniruotės per savaitę – tai jau tikra sistema! ⭐`,
    ]),
    ok: (v) => pick([
      `${v} treniruotė(-s) šią savaitę – gerai pradžiai! Kitą savaitę pamėginkime daugiau 🏃`,
    ]),
    bad: () => pick([
      "Šią savaitę judėjimo buvo mažai – net greitas pasivaikščiojimas skaičiuojasi! 🚶",
      "Kitą savaitę rask bent 2 kartus laiko judėjimui – kūnas prašo! 🏋️",
    ]),
  },

  stress: {
    great: () => pick([
      "Stresas šią savaitę žemas – tai tiesiogiai veikia rezultatus teigiamai! 🧘",
      "Puiki pusiausvyra – žemas stresas leidžia kūnui efektyviai atsistatyti 🌿",
    ]),
    bad: () => pick([
      "Matosi, kad savaitė buvo sunki – pasirūpink savimi, to taip pat reikia! 💆",
      "Aukštas stresas kenkia progresui – pabandyk kiekvieną dieną skirti 5 minutes sau 🧘",
      "Stresas didėja – prisimink: poilsis ir atsipalaidavimas yra treniruotės dalis 🌿",
    ]),
  },

  weight: {
    down: (diff) => pick([
      `Svoris sumažėjo ${diff} kg – judame tinkama kryptimi! 🎉`,
      `Svoris mažėja: ${diff} kg žemyn! Pastangos atsiperka 💚`,
    ]),
    stable: () => pick([
      "Svoris stabilus – puiku, jei tikslas – palaikyti formą! ⚖️",
    ]),
    up_lose: (diff) => pick([
      `Svoris šiek tiek pakilo (${diff} kg) – nepanikuok, analizuosime kartu! 📊`,
    ]),
  },

  general: {
    great: () => pick([
      "Šią savaitę esi tikra žvaigždė! Viskas einasi kaip reikia 🌟",
      "Nuostabi savaitė! Tęsk šia kryptimi – rezultatai matosi 🏆",
      "Viskas idealiai! Toks nuoseklumas – jau tikra sistema ⭐",
    ]),
    encourage: () => pick([
      "Kiekviena diena – nauja pradžia. Žingsnis po žingsnio! 💗",
      "Svarbu ne tobulumas, o pastangos. Saunuolė esi, kad stengiesi! 💗",
      "Progresas – ne tiesi linija. Svarbu tęsti – esi teisingame kelyje 💗",
    ]),
  },
};

// ── Moksliniai patarimai pagal kategoriją ────────────────────────────────────
const SCIENCE = {
  water: {
    great: "💡 Žinai? Gerai hidratuotas kūnas degina riebalus ~3% efektyviau – vanduo veikia ir kaip metaboolizmo skatintojas.",
    bad:   "💡 Tyrimai rodo: vos 1–2 % dehidratacija mažina susikaupimą ir energiją. Laikyk gertuvę matomoje vietoje – regėjimo zona = vartojimas.",
  },
  protein: {
    great: "💡 Baltymai sočina ilgiausiai iš visų maisto medžiagų. Pakankamas jų kiekis ryte sumažina dienos kalorinis apetitas iki 25 %.",
    bad:   "💡 Moksliniai tyrimai rodo: pakankamas baltymų kiekis saugo raumenis net esant kalorijų deficitui. Tikslas – bent 1,6 g/kg kūno svorio.",
  },
  calories: {
    great: "💡 Reguliarus valgymas tinkamo kalorijų kiekio stabilizuoja insulino lygį – tai tiesiogiai veikia riebalų deginimą ir nuotaiką.",
    over:  "💡 Tyrimai rodo: lėtas valgymas (bent 20 min. per valgį) padeda suvalgyti vidutiniškai 10 % mažiau – sočiuomos signalas vėluoja.",
    under: "💡 Per mažas kalorijų kiekis lėtina medžiagų apykaitą – kūnas pereina į 'taupymo režimą'. Reguliarus valgymas ją palaiko aktyvią.",
  },
  consistency: {
    great: "💡 Nuoseklus maisto žurnalas didina tikimybę pasiekti tikslą net 2 kartus, rodo tyrimai. Sąmoningumas – vienas stipriausių įrankių.",
    bad:   "💡 Tyrimai rodo: žmonės, vedantys maisto žurnalą, vidutiniškai suvalgo 15 % mažiau – vien sąmoningumas keičia pasirinkimus.",
  },
  sleep: {
    great: "💡 Kokybiško miego metu (7–9 val.) organizmas išskiria augimo hormoną – jis tiesiogiai skatina riebalų deginimą ir raumenų augimą.",
    bad:   "💡 Miegant mažiau nei 7 val., kortizolis kyla – kūnas intensyviau kaupia riebalus pilvo srityje. Miegas = nemokamas riebalų deginimas.",
  },
  workouts: {
    great: "💡 Reguliarus jėgos krūvis didina bazinę medžiagų apykaitą iki 72 val. po treniruotės – kūnas dega kalorijas ir poilsio metu.",
    bad:   "💡 Net 20 min. vidutinio intensyvumo judėjimas per dieną mažina streso hormonus ir pagerina nuotaiką per 2 valandas – pradėk nuo mažo!",
  },
  stress: {
    great: "💡 Žemas kortizolis = efektyvesnis riebalų metabolizmas. Ramybė – ne tik psichologiškai, bet ir fiziologiškai svarbi.",
    bad:   "💡 Lėtas kvėpavimas (4 s įkvėpk – 4 s sulaikyk – 6 s iškvėpk) per 2 minutes sumažina kortizolio lygį. Paprasčiausias streso slopintuvas.",
  },
  weight: {
    down:   "💡 Svorio mažėjimas 0,5–1 kg per savaitę – optimalus tempas, leidžiantis išsaugoti raumenis ir metabolizmą aktyvų.",
    up:     "💡 Svorio svyravimai 1–2 kg – normali fiziologija (vanduo, maisto likučiai). Tikras progresas matomas ilgesnėje perspektyvoje.",
    stable: "💡 Stabilus svoris palaiko tikslą – kūno sudėtis (riebalai vs. raumenys) keičiasi net kai svoris stovi.",
  },
  general: "💡 Nuoseklumas svarbiau nei intensyvumas. Tyrimai rodo: žmonės, laikantys 80 % plano, pasiekia daugiau nei perfekcionistai, kurie greitai meta.",
};

// ── Pagrindinis algoritmas ────────────────────────────────────────────────────
async function analyzeAndGenerateMessage(userId, res, goalId) {
  const today   = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split("T")[0];

  const [{ data: foods }, { data: waters }, { data: checkins }, { data: weightData }] = await Promise.all([
    pb.collection("food_log").select("date,kcal,protein").eq("user_id",userId).gte("date",weekAgo).lte("date",today),
    pb.collection("water_log").select("date,ml,goal").eq("user_id",userId).gte("date",weekAgo).lte("date",today),
    pb.collection("client_checkins").select("*").eq("user_id",userId).order("week_start",{ascending:false}).limit(2),
    pb.collection("client_checkins").select("weight_self,week_start").eq("user_id",userId).order("week_start",{ascending:false}).limit(4),
  ]);

  const signals = [];

  // ── Vanduo ─────────────────────────────────────────────────────────────────
  if (waters?.length > 0) {
    const goalMl   = waters[0]?.goal || 2000;
    const goalDays = waters.filter(w => w.ml >= w.goal).length;
    const rate     = goalDays / 7;
    if (rate >= 0.7)       signals.push({ cat:"water",       score:2,  msg:MSG.water.great(goalDays),    science:SCIENCE.water.great });
    else if (rate >= 0.4)  signals.push({ cat:"water",       score:0,  msg:MSG.water.ok(),               science:SCIENCE.water.bad });
    else                   signals.push({ cat:"water",       score:-2, msg:MSG.water.bad(goalMl),        science:SCIENCE.water.bad });
  }

  // ── Maisto žurnalas ─────────────────────────────────────────────────────────
  const byDate = {};
  foods?.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = { kcal:0, protein:0 };
    byDate[e.date].kcal    += e.kcal    || 0;
    byDate[e.date].protein += e.protein || 0;
  });
  const loggedDays = Object.keys(byDate).length;

  if (loggedDays >= 5)      signals.push({ cat:"consistency", score:2,  msg:MSG.consistency.great(loggedDays), science:SCIENCE.consistency.great });
  else if (loggedDays >= 3) signals.push({ cat:"consistency", score:0,  msg:MSG.consistency.ok(loggedDays),    science:SCIENCE.consistency.bad });
  else if (loggedDays > 0)  signals.push({ cat:"consistency", score:-1, msg:MSG.consistency.bad(),             science:SCIENCE.consistency.bad });

  // ── Baltymai ────────────────────────────────────────────────────────────────
  const targetP = res?.prot?.g;
  if (loggedDays > 0 && targetP) {
    const avgP = Math.round(Object.values(byDate).reduce((a,d)=>a+d.protein,0) / loggedDays);
    const rate = avgP / targetP;
    if (rate >= 0.85)      signals.push({ cat:"protein", score:2,  msg:MSG.protein.great(avgP),   science:SCIENCE.protein.great });
    else if (rate >= 0.65) signals.push({ cat:"protein", score:0,  msg:MSG.protein.ok(),           science:SCIENCE.protein.bad });
    else                   signals.push({ cat:"protein", score:-2, msg:MSG.protein.bad(targetP),   science:SCIENCE.protein.bad });
  }

  // ── Kalorijos ────────────────────────────────────────────────────────────────
  const targetK = res?.target;
  if (loggedDays > 0 && targetK) {
    const avgK    = Math.round(Object.values(byDate).reduce((a,d)=>a+d.kcal,0) / loggedDays);
    const diffPct = (avgK - targetK) / targetK;
    const diffAbs = Math.abs(Math.round(avgK - targetK));
    if (Math.abs(diffPct) <= 0.10)       signals.push({ cat:"calories", score:2,  msg:MSG.calories.great(avgK,targetK), science:SCIENCE.calories.great });
    else if (diffPct > 0.10)             signals.push({ cat:"calories", score:-1, msg:MSG.calories.over(diffAbs),        science:SCIENCE.calories.over });
    else if (diffPct < -0.15)            signals.push({ cat:"calories", score:-1, msg:MSG.calories.under(diffAbs),       science:SCIENCE.calories.under });
  }

  // ── Check-in ────────────────────────────────────────────────────────────────
  const ci = checkins?.[0];
  if (ci?.is_done) {
    if (ci.sleep_quality != null) {
      if (ci.sleep_quality >= 4)       signals.push({ cat:"sleep",    score:2,  msg:MSG.sleep.great(ci.sleep_quality), science:SCIENCE.sleep.great });
      else if (ci.sleep_quality <= 2)  signals.push({ cat:"sleep",    score:-2, msg:MSG.sleep.bad(),                   science:SCIENCE.sleep.bad });
    }
    if (ci.workouts_done != null) {
      if (ci.workouts_done >= 3)       signals.push({ cat:"workouts", score:2,  msg:MSG.workouts.great(ci.workouts_done), science:SCIENCE.workouts.great });
      else if (ci.workouts_done === 1) signals.push({ cat:"workouts", score:0,  msg:MSG.workouts.ok(1),                   science:SCIENCE.workouts.bad });
      else if (ci.workouts_done === 0) signals.push({ cat:"workouts", score:-1, msg:MSG.workouts.bad(),                   science:SCIENCE.workouts.bad });
    }
    if (ci.stress_level != null) {
      if (ci.stress_level <= 2)        signals.push({ cat:"stress",   score:1,  msg:MSG.stress.great(), science:SCIENCE.stress.great });
      else if (ci.stress_level >= 4)   signals.push({ cat:"stress",   score:-1, msg:MSG.stress.bad(),   science:SCIENCE.stress.bad });
    }
  }

  // ── Svorio tendencija ────────────────────────────────────────────────────────
  const weights = weightData?.filter(d=>d.weight_self).map(d=>+d.weight_self) || [];
  if (weights.length >= 2) {
    const diff = +(weights[0]-weights[1]).toFixed(1);
    if (goalId==="lose") {
      if (diff < -0.1)     signals.push({ cat:"weight", score:2,  msg:MSG.weight.down(Math.abs(diff)),  science:SCIENCE.weight.down });
      else if (diff > 0.3) signals.push({ cat:"weight", score:-1, msg:MSG.weight.up_lose(diff),         science:SCIENCE.weight.up });
    } else {
      if (Math.abs(diff)<0.3) signals.push({ cat:"weight", score:1, msg:MSG.weight.stable(), science:SCIENCE.weight.stable });
    }
  }

  // ── Pasirinkti geriausią + mokslinį patarimą ────────────────────────────────
  if (!signals.length) {
    return { emoji:"💗", main:"Pradėk suvedinėti mitybą ir vandenį – pamatysi įžvalgas čia! 🌸", tip:null, science:SCIENCE.general, type:"neutral" };
  }

  const positives = signals.filter(s=>s.score>0).sort((a,b)=>b.score-a.score);
  const negatives = signals.filter(s=>s.score<0).sort((a,b)=>a.score-b.score);

  if (positives.length >= 3 && negatives.length === 0) {
    return { emoji:"🌟", main:MSG.general.great(), tip:positives[0]?.msg, science:positives[0]?.science || SCIENCE.general, type:"great" };
  }

  if (positives.length > 0 && negatives.length > 0) {
    const showWinFirst = (dayInt() % 3) !== 0;
    return showWinFirst
      ? { emoji:"✨", main:positives[0].msg, tip:"Pasistenk: " + negatives[0].msg, science:negatives[0].science, type:"good" }
      : { emoji:"💪", main:negatives[0].msg, tip:"Gerai sekasi: " + positives[0].msg, science:negatives[0].science, type:"improve" };
  }

  if (negatives.length > 0) {
    return { emoji:"💙", main:MSG.general.encourage(), tip:negatives[0].msg, science:negatives[0].science, type:"encourage" };
  }

  return { emoji:"😊", main:positives[0]?.msg || MSG.general.encourage(), tip:null, science:positives[0]?.science || SCIENCE.general, type:"neutral" };
}

// ── Vizualinis komponentas ────────────────────────────────────────────────────
const TYPE_STYLES = {
  great:    { bg:"linear-gradient(135deg,#1a4731,#276749)", border:"rgba(144,238,144,0.3)" },
  good:     { bg:"linear-gradient(135deg,#4a1c5c,#7b2d8b)", border:"rgba(200,150,255,0.3)" },
  improve:  { bg:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", border:"rgba(255,179,198,0.3)" },
  encourage:{ bg:"linear-gradient(135deg,#1a2a4a,#2d4a7a)", border:"rgba(137,207,240,0.3)" },
  neutral:  { bg:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", border:"rgba(255,255,255,0.15)" },
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
    <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:"16px 18px", marginBottom:12, boxShadow:"0 4px 18px rgba(173,20,87,0.25)", display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ fontSize:28 }}>💗</div>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>Analizuojami tavo duomenys...</p>
    </div>
  );
  if (!msg) return null;

  const style = TYPE_STYLES[msg.type] || TYPE_STYLES.neutral;
  const today = new Date().toLocaleDateString("lt-LT", { weekday:"long", month:"long", day:"numeric" });

  return (
    <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:20, padding:"16px 18px", marginBottom:12, boxShadow:"0 4px 20px rgba(0,0,0,0.25)", border:"1px solid rgba(255,255,255,0.15)" }}>

      {/* Data */}
      <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:"0 0 10px", textTransform:"capitalize", letterSpacing:"0.05em" }}>
        {today}
      </p>

      {/* Pagrindinė žinutė */}
      <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:10 }}>
        <span style={{ fontSize:32, lineHeight:1, flexShrink:0 }}>{msg.emoji}</span>
        <p style={{ fontSize:15, fontWeight:600, color:"#fff", margin:0, lineHeight:1.5, textShadow:"0 1px 4px rgba(0,0,0,0.3)" }}>
          {msg.main}
        </p>
      </div>

      {/* Patarimas */}
      {msg.tip && (
        <div style={{ background:"rgba(255,255,255,0.09)", borderRadius:12, padding:"9px 12px", marginBottom:10, borderLeft:"2.5px solid rgba(255,255,255,0.25)" }}>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.75)", margin:0, lineHeight:1.5 }}>
            {msg.tip}
          </p>
        </div>
      )}

      {/* Mokslinis patarimas */}
      {msg.science && (
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"9px 12px", borderLeft:"2.5px solid rgba(255,255,200,0.3)" }}>
          <p style={{ fontSize:11, color:"rgba(255,255,180,0.85)", margin:0, lineHeight:1.55, fontStyle:"italic" }}>
            {msg.science}
          </p>
        </div>
      )}
    </div>
  );
}
