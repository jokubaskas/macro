import { useState, useEffect } from "react";
import { pb } from "./pb";
import { PK } from "./constants";
import { Heart, Sparkle, Smile, Lightbulb } from "./ui/icons";

function dayInt() {
  return parseInt(new Date().toISOString().split("T")[0].replace(/-/g, ""));
}
function pick(arr, offset = 0) {
  return arr[(dayInt() + offset) % arr.length];
}

const SCIENCE = {
  water:    { great: "Gera hidratacija gerina koncentraciją, energiją ir medžiagų apykaitą.", bad: "Net 2% dehidratacija mažina darbingumą ir koncentraciją. Gertuvė prie savęs – paprasčiausias sprendimas." },
  sleep:    { great: "Pakankamas miegas – vienas svarbiausių veiksnių svoriui ir energijai.", bad: "Miego trūkumas padidina alkio hormonus ir apsunkina svorio kontrolę." },
  wellbeing:{ great: "Gera savijauta signalizuoja, kad kūnas ir protas yra balanse.", bad: "Prasta savijauta gali reikšti per didelį krūvį – svarbiausia ilgalaikis nuoseklumas, ne intensyvumas." },
  nutrition:{ great: "Nuoseklus mitybos laikymasis – pagrindinis sėkmės veiksnys.", bad: "Tobulumas nereikalingas. Net 80% plano laikymasis duoda puikių rezultatų." },
  general:  "Nuoseklumas svarbiau nei intensyvumas. Kiekvieną dieną po mažą žingsnį – tai ir yra rezultatai.",
};

async function analyzeAndGenerateMessage(userId, goalId) {
  const today   = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7*24*60*60*1000).toISOString().split("T")[0];

  const [checkins, waters, sleeps] = await Promise.all([
    pb.collection("daily_checkins").getFullList({ filter: `user_id="${userId}" && date>="${weekAgo}" && date<="${today}" && is_done=true`, sort: "-date", requestKey: null }).catch(() => []),
    pb.collection("water_log").getFullList({ filter: `user_id="${userId}" && date>="${weekAgo}" && date<="${today}"`, requestKey: null }).catch(() => []),
    pb.collection("sleep_log").getFullList({ filter: `user_id="${userId}" && date>="${weekAgo}" && date<="${today}"`, requestKey: null }).catch(() => []),
  ]);

  const signals = [];

  // Vanduo
  if (waters.length > 0) {
    const hitDays = waters.filter(w => w.ml >= (w.goal || 2000)).length;
    const rate = hitDays / Math.max(waters.length, 1);
    if (rate >= 0.7)     signals.push({ score: 2,  msg: `Vanduo šią savaitę – puikiai! Net ${hitDays} dieną(-as) pasiekei tikslą`, science: SCIENCE.water.great });
    else if (rate >= 0.4) signals.push({ score: 0,  msg: "Vandens šiek tiek maža, bet beveik! Dar kelios stiklinės", science: SCIENCE.water.bad });
    else                  signals.push({ score: -1, msg: "Kūnas prašo daugiau skysčių! Gertuvė prie savęs – paprasčiausias sprendimas", science: SCIENCE.water.bad });
  }

  // Miegas
  if (sleeps.length > 0) {
    const avg = sleeps.reduce((a, s) => a + s.hours_slept, 0) / sleeps.length;
    if (avg >= 7)       signals.push({ score: 2,  msg: `Vidutiniškai ${avg.toFixed(1)}h miego – puiku! Kūnas atsistato ir stiprėja`, science: SCIENCE.sleep.great });
    else if (avg >= 6)  signals.push({ score: 0,  msg: `Miegas – apie ${avg.toFixed(1)}h. Pabandyk eiti miegoti 30 min. anksčiau`, science: SCIENCE.sleep.bad });
    else                signals.push({ score: -1, msg: `Miegas per mažas – vidutiniškai ${avg.toFixed(1)}h. Kūnui reikia 7-9h atsistato!`, science: SCIENCE.sleep.bad });
  }

  // Daily check-in duomenys
  if (checkins.length > 0) {
    // Mityba
    const nutritionAvg = checkins.reduce((a, c) => a + (c.nutrition_score || 2), 0) / checkins.length;
    if (nutritionAvg >= 2.5)      signals.push({ score: 2,  msg: `Mityba šią savaitę – gerai! ${checkins.length} dienų check-in'as rodo teigiamą tendenciją`, science: SCIENCE.nutrition.great });
    else if (nutritionAvg >= 1.5) signals.push({ score: 0,  msg: "Mityba – vidutiniškai. Šiek tiek pastangų ir kitą savaitę bus geriau!", science: SCIENCE.nutrition.bad });
    else                          signals.push({ score: -1, msg: "Mityba šią savaitę sudėtinga – nekaltink savęs, tiesiog rytoj pradėk iš naujo", science: SCIENCE.nutrition.bad });

    // Savijauta
    const wellbeingAvg = checkins.reduce((a, c) => a + (c.wellbeing_score || 2), 0) / checkins.length;
    if (wellbeingAvg >= 2.5)      signals.push({ score: 2,  msg: "Savijauta puiki! Tai rodo, kad kūnas ir protas balanse", science: SCIENCE.wellbeing.great });
    else if (wellbeingAvg < 1.5)  signals.push({ score: -1, msg: "Savijauta šią savaitę prasta – gal per daug krūvio? Pailsėk ir nesibark!", science: SCIENCE.wellbeing.bad });
  }

  // Jei nėra duomenų
  if (!signals.length) {
    return {
      icon: Heart, iconColor: "#FF6EB4",
      main: pick([
        "Sveika! Užpildyk šiandienos check-in'ą – ir čia pasirodys įžvalgos apie tavo savaitę",
        "Pradėk žymėtis kiekvieną dieną – po savaitės čia matysi aiškų vaizdą kaip sekasi!",
        "Kiekviena užpildyta diena – tai žingsnis į priekį. Pradėk šiandien!",
      ]),
      tip: null,
      science: SCIENCE.general,
      type: "neutral",
    };
  }

  const positives = signals.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
  const negatives = signals.filter(s => s.score < 0).sort((a, b) => a.score - b.score);

  if (positives.length >= 2 && negatives.length === 0) {
    return { icon: Sparkle, main: pick(["Fantastiška savaitė! Vanduo, miegas, mityba – viskas top!", "Puiki savaitė! Matosi pastangos – ir jos tikrai vertos!"]), tip: positives[0]?.msg, science: positives[0]?.science || SCIENCE.general, type: "great" };
  }
  if (positives.length > 0 && negatives.length > 0) {
    return { icon: Sparkle, main: positives[0].msg, tip: "Atkreipk dėmesį: " + negatives[0].msg, science: negatives[0].science, type: "good" };
  }
  if (negatives.length > 0) {
    return { icon: Heart, iconColor: "#6EC6FF", main: pick(["Sunkesnė savaitė – bet tai tik informacija, ne nesėkmė. Rytoj nauja proga!", "Kiekviena diena – nauja pradžia. Nesibark, tiesiog žerk kitą žingsnį!"]), tip: negatives[0].msg, science: negatives[0].science, type: "encourage" };
  }
  return { icon: Smile, main: positives[0]?.msg || "Taip laikykis!", tip: null, science: positives[0]?.science || SCIENCE.general, type: "neutral" };
}

export default function MotivationalCard({ userId, goalId }) {
  const [msg,     setMsg]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    analyzeAndGenerateMessage(userId, goalId)
      .then(m => { setMsg(m); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "16px 18px", marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
      <Heart size={28} color="#FF6EB4" />
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0 }}>Analizuojami duomenys...</p>
    </div>
  );
  if (!msg) return null;

  const today = new Date().toLocaleDateString("lt-LT", { weekday: "long", month: "long", day: "numeric" });
  const MsgIcon = msg.icon;

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "16px 18px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.15)" }}>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 10px", textTransform: "capitalize", letterSpacing: "0.05em" }}>{today}</p>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: msg.tip ? 10 : 0 }}>
        <MsgIcon size={32} color={msg.iconColor || "currentColor"} style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, lineHeight: 1.5 }}>{msg.main}</p>
      </div>
      {msg.tip && (
        <div style={{ background: "rgba(255,255,255,0.09)", borderRadius: 12, padding: "9px 12px", marginTop: 10, marginBottom: msg.science ? 8 : 0, borderLeft: "2.5px solid rgba(255,255,255,0.25)" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.5 }}>{msg.tip}</p>
        </div>
      )}
      {msg.science && (
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "9px 12px", borderLeft: "2.5px solid rgba(255,255,200,0.3)", marginTop: 4, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <Lightbulb size={13} color="rgba(255,255,180,0.85)" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 11, color: "rgba(255,255,180,0.85)", margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>{msg.science}</p>
        </div>
      )}
    </div>
  );
}