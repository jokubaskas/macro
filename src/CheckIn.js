import { useState, useEffect, useCallback } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { PK } from "./constants";

// ── Pagalbinės ────────────────────────────────────────────────────────────────
function getWeekStart(d = new Date()) {
  const date = new Date(d);
  const day  = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return date.toISOString().split("T")[0];
}
function getWeekEnd(ws) {
  const d = new Date(ws + "T12:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}
function fmt(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("lt-LT", { month:"short", day:"numeric" });
}

// Sekmadienio info
function getSundayInfo() {
  const today = new Date();
  const day   = today.getDay();
  const isSunday     = day === 0;
  const daysUntilSun = isSunday ? 0 : 7 - day;
  // Kito sekmadienio data
  const nextSun = new Date(today);
  nextSun.setDate(today.getDate() + (isSunday ? 7 : 7 - day));
  const nextSunStr = nextSun.toLocaleDateString("lt-LT", { month:"long", day:"numeric" });
  return { isSunday, daysUntilSun, nextSunStr };
}

// ── Auto-skaičiavimai iš food_log ir sleep_log ───────────────────────────────
async function calcAutoMetrics(userId, weekStart, targetKcal, targetProtein, age) {
  const weekEnd = getWeekEnd(weekStart);

  const [foods, sleeps] = await Promise.all([
  pb.collection("food_log").getFullList({ filter: `user_id="${userId}" && date>="${weekStart}" && date<="${weekEnd}"`, requestKey: null }),
  pb.collection("sleep_log").getFullList({ filter: `user_id="${userId}" && date>="${weekStart}" && date<="${weekEnd}"`, requestKey: null }),
]);

  // Mityba
  let dietScore = null, dietDetail = null;
  if (foods?.length && targetKcal) {
    const byDate = {};
    foods.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = { kcal:0, protein:0 };
      byDate[e.date].kcal    += e.kcal    || 0;
      byDate[e.date].protein += e.protein || 0;
    });
    const days      = Object.keys(byDate).length;
    const avgP      = Math.round(Object.values(byDate).reduce((a,d)=>a+d.protein,0)/days);
    const avgK      = Math.round(Object.values(byDate).reduce((a,d)=>a+d.kcal,0)/days);
    const protRate  = targetProtein ? avgP/targetProtein : 1;
    const consRate  = days/7;
    const kcalDiff  = Math.abs(avgK-targetKcal)/targetKcal;
    const kcalAcc   = Math.max(0, 1-kcalDiff);
    const combined  = (protRate*0.4 + kcalAcc*0.3 + consRate*0.3);
    dietScore  = Math.max(1, Math.min(5, Math.round(combined*4)+1));
    dietDetail = `${days}/7 d. · vid. ${avgK} kcal · B:${avgP}g`;
  }

  // Miegas
  let sleepScore = null, sleepDetail = null, sleepAvg = null;
  if (sleeps?.length) {
    const hrs  = sleeps.map(d=>+d.hours_slept);
    const avg  = +(hrs.reduce((a,b)=>a+b,0)/hrs.length).toFixed(1);
    const recMin = (!age||age<=64) ? 7 : 7;
    const recMax = (!age||age<=64) ? 9 : 8;
    const dev  = avg<recMin ? recMin-avg : avg>recMax ? avg-recMax : 0;
    const acc  = Math.max(0, 1-dev/3);
    const cons = hrs.length/7;
    sleepScore  = Math.max(1, Math.min(5, Math.round((acc*0.6+cons*0.4)*4)+1));
    sleepDetail = `${hrs.length}/7 d. · vid. ${avg}h`;
    sleepAvg    = avg;
  }

  // Vanduo
  let waterScore = null;
  const waters = await pb.collection("water_log").getFullList({ filter: `user_id="${userId}" && date>="${weekStart}" && date<="${weekEnd}"`, requestKey: null });

  if (waters?.length) {
    const goalDays = waters.filter(w=>w.ml>=(w.goal||2000)).length;
    const rate     = goalDays/7;
    waterScore = Math.max(1, Math.min(5, Math.round(rate*4)+1));
  }

  return { dietScore, dietDetail, sleepScore, sleepDetail, sleepAvg, waterScore };
}

// ── Metrikos palyginimo komponentas ──────────────────────────────────────────
function MetricRow({ emoji, label, prev, cur, invertGood=false }) {
  if (cur == null) return null;
  const diff      = prev != null ? cur - prev : null;
  const improved  = diff != null ? (invertGood ? diff < 0 : diff > 0) : null;
  const arrowColor = improved === true ? "#7FFFB0" : improved === false ? "#FFD700" : "rgba(255,255,255,0.4)";
  const arrow      = diff == null ? "" : diff > 0 ? " ↑" : diff < 0 ? " ↓" : " =";

  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
      <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>{emoji} {label}</span>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {prev != null && <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>{prev}{typeof prev==="number"&&prev<=5?"/5":""}</span>}
        {prev != null && <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>→</span>}
        <span style={{ fontSize:13, fontWeight:700, color:arrowColor }}>
          {cur}{typeof cur==="number"&&cur<=5?"/5":""}{arrow}
        </span>
      </div>
    </div>
  );
}

// ── Emoji reitingai ───────────────────────────────────────────────────────────
const EMOJIS = { 1:"😞", 2:"😕", 3:"😐", 4:"😊", 5:"🌟" };
function EmojiRating({ label, value, onChange }) {
  return (
    <div style={{ marginBottom:12 }}>
      <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:6, fontWeight:600 }}>{label}</p>
      <div style={{ display:"flex", gap:5 }}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} onClick={()=>onChange(value===n?null:n)} style={{
            flex:1, padding:"7px 0",
            border:"1.5px solid "+(value===n?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.12)"),
            borderRadius:10, background:value===n?"rgba(255,255,255,0.18)":"transparent",
            fontSize:16, cursor:"pointer", fontFamily:"inherit",
          }}>{EMOJIS[n]}</button>
        ))}
      </div>
    </div>
  );
}

function AutoBlock({ label, emoji, score, detail, color="#90EE90" }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 12px", marginBottom:12, border:"1px solid rgba(255,255,255,0.15)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600, margin:0 }}>{emoji} {label}</p>
        <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.08)", borderRadius:6, padding:"2px 6px" }}>⚙️ automatiškai</span>
      </div>
      {score ? (
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", gap:3 }}>
            {[1,2,3,4,5].map(n=>(
              <div key={n} style={{ width:18, height:18, borderRadius:5, background:n<=score?color:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)" }}/>
            ))}
          </div>
          <div>
            <span style={{ fontSize:14, fontWeight:700, color }}>{score}/5</span>
            {detail && <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:"2px 0 0" }}>{detail}</p>}
          </div>
        </div>
      ) : (
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Reikia duomenų šios savaitės žurnaluose</p>
      )}
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function CheckIn({ userId, targetKcal, targetProtein, age }) {
  const [checkins,    setCheckins]    = useState([]);
  const [collapsed,   setCollapsed]   = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);

  // Auto metrikos
  const [dietScore,  setDietScore]  = useState(null);
  const [dietDetail, setDietDetail] = useState(null);
  const [sleepScore, setSleepScore] = useState(null);
  const [sleepDetail,setSleepDetail]= useState(null);
  const [waterScore, setWaterScore]  = useState(null);

  // Rankiniai laukai
  const [form, setForm] = useState({
    weight_self:   "",
    energy:        null,
    workouts_done: null,
    stress_level:  null,
    client_note:   "",
  });
  const set = k => v => setForm(f=>({...f,[k]:v}));

  const weekStart = getWeekStart();
  const { isSunday, daysUntilSun, nextSunStr } = getSundayInfo();

  const load = useCallback(async () => {
    const data = await pb.collection("client_checkins").getList(1, 8, {
  filter: `user_id="${userId}"`, sort: "-week_start", requestKey: null,
}).then(r => r.items);
setCheckins(data||[])
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Pasikrovus - krauti auto metrikas šiai savaitei
  useEffect(() => {
    if (!userId) return;
    setAutoLoading(true);
    calcAutoMetrics(userId, weekStart, targetKcal, targetProtein, age).then(r => {
      setDietScore(r.dietScore);   setDietDetail(r.dietDetail);
      setSleepScore(r.sleepScore); setSleepDetail(r.sleepDetail);
      setWaterScore(r.waterScore);
      setAutoLoading(false);
    });
  }, [userId, weekStart, targetKcal]);

  async function handleSave() {
    setSaving(true);
    await pbUpsert("client_checkins", `user_id="${userId}" && week_start="${weekStart}"`, {
  user_id:userId, week_start:weekStart,
  weight_self:    parseFloat(form.weight_self)||null,
  energy:         form.energy,
  diet_adherence: dietScore,
  sleep_quality:  sleepScore,
  water_score:    waterScore,
  workouts_done:  form.workouts_done,
  stress_level:   form.stress_level,
  client_note:    form.client_note||null,
  is_done:        true,
  done_at:        new Date().toISOString(),
});
    await load();
    setShowForm(false);
    setSaving(false);
  }

  const current  = checkins.find(c=>c.week_start===weekStart);
  const previous = checkins.find(c=>c.week_start!==weekStart && c.is_done);
  const isDone   = current?.is_done;

  return (
    <div style={{
      background:"rgba(0,0,0,0.2)",
      borderRadius:20, marginBottom:12,
      boxShadow:"0 6px 24px rgba(173,20,87,0.3)",
      overflow:"hidden",
    }}>
      {/* Antraštė – paspaudžiama */}
      <div
        onClick={()=>setCollapsed(s=>!s)}
        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", cursor:"pointer" }}
      >
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>📋 Savaitinis check-in</p>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.5)", margin:0 }}>
            {isDone
              ? `✅ Savaitė užpildyta · Kitas: ${nextSunStr}`
              : isSunday
                ? "🔔 Šiandien sekmadienis – laikas pildyti!"
                : `⏳ Kitas check-in: ${nextSunStr} (po ${daysUntilSun} d.)`}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {isDone && <span style={{ fontSize:10, background:"rgba(127,255,176,0.2)", color:"#7FFFB0", borderRadius:8, padding:"3px 8px" }}>✓ atlikta</span>}
          {isSunday && !isDone && <span style={{ fontSize:10, background:"rgba(255,200,0,0.2)", color:"#FFD700", borderRadius:8, padding:"3px 8px" }}>🔔 šiandien</span>}
          <span style={{ fontSize:16, color:"rgba(255,255,255,0.5)", transform: collapsed?"rotate(0deg)":"rotate(180deg)", transition:"transform 0.2s" }}>⌄</span>
        </div>
      </div>

      {/* Turinys – išskleidžiamas */}
      {!collapsed && (
      <div style={{ padding:"0 18px 18px" }}>
      {/* Formos mygtukas */}
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
        {!isDone && (
          <button onClick={e=>{e.stopPropagation();setShowForm(s=>!s);}} style={{
            background: showForm?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.2)",
            border:"1.5px solid rgba(255,255,255,"+(isSunday?"0.5":"0.25")+")",
            borderRadius:10, padding:"6px 14px", color:"#fff",
            fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>
            {showForm ? "✕ Uždaryti" : isSunday ? "✍️ Pildyti dabar" : "Pildyti anksčiau"}
          </button>
        )}
        {isDone && (
          <button onClick={e=>{e.stopPropagation();setShowForm(s=>!s);}} style={{
            background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)",
            borderRadius:10, padding:"6px 12px", color:"rgba(255,255,255,0.5)",
            fontSize:11, cursor:"pointer", fontFamily:"inherit",
          }}>
            {showForm ? "✕" : "✏️ Redaguoti"}
          </button>
        )}
      </div>

      {/* Užpildyta – rodyti santrauką + palyginimą */}
      {isDone && !showForm && (
        <div>
          {/* Šios savaitės rezultatai */}
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:14, padding:"12px 14px", marginBottom:10 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 8px" }}>
              Savaitės {fmt(weekStart)} – {fmt(getWeekEnd(weekStart))} rezultatai
            </p>
            <MetricRow emoji="😴" label="Miegas"   cur={current.sleep_quality??sleepScore}  prev={previous?.sleep_quality} />
            <MetricRow emoji="⚡" label="Energija" cur={current.energy}                      prev={previous?.energy} />
            <MetricRow emoji="🥗" label="Mityba"   cur={current.diet_adherence??dietScore}   prev={previous?.diet_adherence} />
            <MetricRow emoji="💧" label="Vanduo"   cur={current.water_score??waterScore}     prev={previous?.water_score} />
            <MetricRow emoji="🧘" label="Stresas"  cur={current.stress_level}                prev={previous?.stress_level} invertGood />
            <MetricRow emoji="🏋️" label="Treniruotės" cur={current.workouts_done!=null?current.workouts_done+"k":null} prev={previous?.workouts_done!=null?previous.workouts_done+"k":null} />
            <MetricRow emoji="⚖️" label="Svoris"   cur={current.weight_self?current.weight_self+"kg":null} prev={previous?.weight_self?previous.weight_self+"kg":null} />
            {previous && (
              <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", margin:"8px 0 0", textAlign:"center" }}>
                ↑ tobulėjimas · ↓ smukimas · = tas pats (lyginant su {fmt(previous.week_start)})
              </p>
            )}
          </div>
          {current.client_note && (
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:10, padding:"8px 12px" }}>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0 }}>💬 {current.client_note}</p>
            </div>
          )}
        </div>
      )}

      {/* Forma */}
      {showForm && (
        <div style={{ background:"rgba(0,0,0,0.18)", borderRadius:16, padding:14 }}>
          <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.8)", margin:"0 0 14px" }}>
            Savaitė {fmt(weekStart)} – {fmt(getWeekEnd(weekStart))}
          </p>

          {/* Svoris */}
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:6, fontWeight:600 }}>⚖️ Svoris šią savaitę (kg)</p>
            <input type="number" step="0.1" value={form.weight_self}
              onChange={e=>set("weight_self")(e.target.value)} placeholder="pvz. 68.5"
              style={{ width:"100%", padding:"10px 12px", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, fontSize:14, color:"#fff", background:"rgba(255,255,255,0.08)", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
          </div>

          {/* Auto metrikos */}
          <AutoBlock label="Miego kokybė"           emoji="😴" score={sleepScore} detail={sleepDetail} color="#89CFF0" />
          <AutoBlock label="Mitybos plano laikymasis" emoji="🥗" score={dietScore}  detail={dietDetail}  color="#90EE90" />
          <AutoBlock label="Vandens norma"               emoji="💧" score={waterScore} detail={null}        color="#89CFF0" />

          {/* Rankinis */}
          <EmojiRating label="⚡ Energija / Nuotaika savaitę"  value={form.energy}       onChange={set("energy")} />
          <EmojiRating label="🧘 Streso lygis savaitę"         value={form.stress_level} onChange={set("stress_level")} />

          {/* Treniruotės */}
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:6, fontWeight:600 }}>🏋️ Treniruotės šią savaitę</p>
            <div style={{ display:"flex", gap:5 }}>
              {[0,1,2,3,4,5,6,7].map(n=>(
                <button key={n} onClick={()=>set("workouts_done")(form.workouts_done===n?null:n)} style={{
                  flex:1, padding:"8px 0",
                  border:"1.5px solid "+(form.workouts_done===n?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.12)"),
                  borderRadius:8, background:form.workouts_done===n?"rgba(255,255,255,0.18)":"transparent",
                  color:form.workouts_done===n?"#fff":"rgba(255,255,255,0.4)",
                  fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                }}>{n}</button>
              ))}
            </div>
          </div>

          {/* Pastaba */}
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:6, fontWeight:600 }}>💬 Pastaba trenesei (neprivaloma)</p>
            <textarea value={form.client_note} onChange={e=>set("client_note")(e.target.value)} rows={2}
              placeholder="Kaip sekėsi savaitė..."
              style={{ width:"100%", padding:"9px 12px", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, fontSize:13, color:"#fff", background:"rgba(255,255,255,0.08)", outline:"none", fontFamily:"inherit", resize:"none", boxSizing:"border-box" }}/>
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width:"100%", padding:"12px 0",
            border:"1.5px solid rgba(255,255,255,0.4)", borderRadius:12,
            background:"rgba(255,255,255,0.18)", color:"#fff",
            fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>
            {saving ? "Saugoma..." : "✓ Išsaugoti savaitės check-in"}
          </button>
        </div>
      )}

      {/* Priminti jei ne sekmadienis */}
      {!isDone && !showForm && !isSunday && (
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:12, padding:"10px 14px" }}>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", margin:0, textAlign:"center" }}>
            🗓️ Pildyk kiekvieną sekmadienį · Kitas: {nextSunStr}
          </p>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
