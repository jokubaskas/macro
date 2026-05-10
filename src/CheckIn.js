import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { PK } from "./constants";

// ── Pagalbinės ────────────────────────────────────────────────────────────────
function getWeekStart(d = new Date()) {
  const date = new Date(d);
  const day  = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  return date.toISOString().split("T")[0];
}
function getWeekEnd(weekStart) {
  const d = new Date(weekStart + "T12:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}
function fmt(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("lt-LT", { month:"short", day:"numeric" });
}
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

// ── Automatinis mitybos laikymosi skaičiavimas ────────────────────────────────
async function calcDietAdherence(userId, weekStart, targetKcal, targetProtein) {
  if (!targetKcal) return { score: null, detail: null };

  const weekEnd = getWeekEnd(weekStart);
  const { data } = await supabase
    .from("food_log")
    .select("date, kcal, protein")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", weekEnd);

  if (!data || data.length === 0) {
    return { score: null, detail: "Savaitę nesuvedė maisto žurnalo" };
  }

  // Grupuoti pagal dieną
  const byDate = {};
  data.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = { kcal: 0, protein: 0 };
    byDate[e.date].kcal    += e.kcal    || 0;
    byDate[e.date].protein += e.protein || 0;
  });

  const daysLogged  = Object.keys(byDate).length;
  const daysInWeek  = 7;
  const consistency = daysLogged / daysInWeek; // 0–1

  // Kalorinis tikslumas kiekvieną dieną
  const dailyAccuracies = Object.values(byDate).map(day => {
    const kcalAccuracy = 1 - clamp(Math.abs(day.kcal - targetKcal) / targetKcal, 0, 1);
    if (targetProtein) {
      const protAccuracy = 1 - clamp(Math.abs(day.protein - targetProtein) / targetProtein, 0, 1);
      return kcalAccuracy * 0.7 + protAccuracy * 0.3;
    }
    return kcalAccuracy;
  });

  const avgAccuracy = dailyAccuracies.reduce((a, b) => a + b, 0) / dailyAccuracies.length;
  const avgKcal     = Math.round(Object.values(byDate).reduce((a, d) => a + d.kcal, 0) / daysLogged);

  // Galutinis balas: 50% nuoseklumas + 50% tikslumas
  const combined = consistency * 0.5 + avgAccuracy * 0.5;
  const score    = clamp(Math.round(combined * 4) + 1, 1, 5);

  // Paaiškinimas
  const accuracyPct = Math.round(avgAccuracy * 100);
  const detail = `${daysLogged}/7 d. suvedė · vid. ${avgKcal} kcal · ${accuracyPct}% tikslumas`;

  return { score, detail, daysLogged, avgKcal, accuracyPct };
}

// ── Progreso grafikai ─────────────────────────────────────────────────────────
function ProgressChart({ clientData, trainerData, valueKey, trainerKey, label, color, unit="" }) {
  const cVals = clientData.map(d => d[valueKey]).filter(Boolean);
  const tVals = trainerData.map(d => d[trainerKey]).filter(Boolean);
  const allVals = [...cVals, ...tVals];
  if (!allVals.length) return (
    <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.35)", padding:"10px 0" }}>Dar nėra duomenų</p>
  );

  const allDates = [...new Set([
    ...clientData.map(d => d.week_start),
    ...trainerData.map(d => d.measured_at),
  ])].filter(Boolean).sort();
  if (!allDates.length) return null;

  const W=320, H=120, PAD={t:16,r:14,b:26,l:36};
  const cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;
  const minV=Math.min(...allVals)*0.98, maxV=Math.max(...allVals)*1.02, range=maxV-minV||1;

  function x(dateStr) { const i=allDates.indexOf(dateStr); return PAD.l+(i/Math.max(allDates.length-1,1))*cW; }
  function y(v) { return PAD.t+cH-((v-minV)/range)*cH; }

  const cPts=clientData.filter(d=>d[valueKey]).map(d=>({x:x(d.week_start),y:y(d[valueKey]),v:d[valueKey]}));
  const tPts=trainerData.filter(d=>d[trainerKey]).map(d=>({x:x(d.measured_at),y:y(d[trainerKey]),v:d[trainerKey]}));
  const cPath=cPts.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  const tPath=tPts.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  const tFill=tPath+(tPts.length>0?` L${tPts[tPts.length-1].x},${PAD.t+cH} L${tPts[0].x},${PAD.t+cH} Z`:"");
  const ticks=[minV,(minV+maxV)/2,maxV].map(v=>+v.toFixed(1));
  const showLabels=allDates.length<=8;

  return (
    <div style={{ marginBottom:4 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>{label}</p>
        <div style={{ display:"flex", gap:10 }}>
          {cPts.length>0&&<span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", gap:3 }}>
            <svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3,2"/></svg>Pati
          </span>}
          {tPts.length>0&&<span style={{ fontSize:9, color, display:"flex", alignItems:"center", gap:3 }}>
            <svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke={color} strokeWidth="2"/></svg>Trenerė
          </span>}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow:"visible" }}>
        <defs>
          <linearGradient id={"pg"+valueKey} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {ticks.map(t=>{const yy=y(t);return(
          <g key={t}>
            <line x1={PAD.l} y1={yy} x2={PAD.l+cW} y2={yy} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <text x={PAD.l-4} y={yy+3} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.35)">{t}{unit}</text>
          </g>
        );})}
        {showLabels&&allDates.filter((_,i,a)=>i===0||i===a.length-1||i%Math.ceil(a.length/4)===0).map(d=>(
          <text key={d} x={x(d)} y={H-4} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.3)">{fmt(d)}</text>
        ))}
        {cPath&&<path d={cPath} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round"/>}
        {cPts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2.5" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>)}
        {tFill&&tPts.length>1&&<path d={tFill} fill={`url(#pg${valueKey})`}/>}
        {tPath&&tPts.length>0&&<path d={tPath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
        {tPts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5"/>
            {i===tPts.length-1&&<text x={p.x} y={p.y-9} textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>{p.v}{unit}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

function WellbeingChart({ clientData }) {
  if (!clientData||clientData.length<2) return (
    <p style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.35)", padding:"8px 0" }}>Reikia bent 2 savaitinių check-in'ų</p>
  );
  const W=320, H=110, PAD={t:12,r:14,b:24,l:20};
  const cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;
  const lines=[
    { key:"sleep_quality",  label:"Miegas",   color:"#89CFF0" },
    { key:"energy",         label:"Energija", color:"#FFD700" },
    { key:"diet_adherence", label:"Mityba",   color:"#90EE90" },
    { key:"stress_level",   label:"Stresas",  color:"#FF8C69", dash:"4,3" },
  ];
  function xi(i) { return PAD.l+(i/Math.max(clientData.length-1,1))*cW; }
  function y(v)  { return PAD.t+cH-((v-1)/4)*cH; }
  return (
    <div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:6 }}>
        {lines.map(l=>(
          <span key={l.key} style={{ fontSize:9, color:l.color, display:"flex", alignItems:"center", gap:3 }}>
            <svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke={l.color} strokeWidth="2" strokeDasharray={l.dash||"none"}/></svg>
            {l.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%">
        {[1,2,3,4,5].map(t=><line key={t} x1={PAD.l} y1={y(t)} x2={PAD.l+cW} y2={y(t)} stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>)}
        {clientData.filter((_,i,a)=>i===0||i===a.length-1).map((d,i)=>(
          <text key={i} x={xi(clientData.indexOf(d))} y={H-4} textAnchor="middle" fontSize="7.5" fill="rgba(255,255,255,0.3)">{fmt(d.week_start)}</text>
        ))}
        {lines.map(l=>{
          const pts=clientData.map((d,i)=>({x:xi(i),y:y(d[l.key]??0),v:d[l.key]})).filter(p=>p.v);
          if(!pts.length) return null;
          const path=pts.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
          return(
            <g key={l.key}>
              <path d={path} fill="none" stroke={l.color} strokeWidth="2" strokeLinecap="round" strokeDasharray={l.dash||"none"}/>
              {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2.5" fill={l.color} stroke="rgba(0,0,0,0.2)" strokeWidth="1"/>)}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Emoji reitingai (tik rankiniai laukai) ────────────────────────────────────
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
            fontSize:16, cursor:"pointer", fontFamily:"inherit", transition:"all 0.12s",
          }}>{EMOJIS[n]}</button>
        ))}
      </div>
    </div>
  );
}

// ── Mitybos laikymosi blokiukas ───────────────────────────────────────────────
function DietAdherenceBlock({ score, detail, loading }) {
  const scoreColor = !score ? "rgba(255,255,255,0.4)"
    : score >= 4 ? "#7FFFB0"
    : score >= 3 ? "#FFD700"
    : "#FF8C69";

  return (
    <div style={{
      background:"rgba(255,255,255,0.08)", borderRadius:12,
      padding:"10px 12px", marginBottom:12,
      border:"1px solid rgba(255,255,255,0.15)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", fontWeight:600, margin:0 }}>
          🥗 Mitybos laikymasis
        </p>
        <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.08)", borderRadius:6, padding:"2px 6px" }}>
          ⚙️ automatiškai
        </span>
      </div>

      {loading ? (
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Skaičiuojama...</p>
      ) : score ? (
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* Balo indikatorius */}
          <div style={{ display:"flex", gap:3 }}>
            {[1,2,3,4,5].map(n=>(
              <div key={n} style={{
                width:18, height:18, borderRadius:5,
                background: n<=score ? scoreColor : "rgba(255,255,255,0.1)",
                border:"1px solid rgba(255,255,255,0.15)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10,
              }}>
                {n<=score ? "" : ""}
              </div>
            ))}
          </div>
          <div>
            <span style={{ fontSize:14, fontWeight:700, color:scoreColor }}>{score}/5</span>
            {detail && <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:"2px 0 0" }}>{detail}</p>}
          </div>
        </div>
      ) : (
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>
          {detail || "Suvesk mitybą žurnale — balas apskaičiuos automatiškai"}
        </p>
      )}
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function CheckIn({ userId, targetKcal, targetProtein }) {
  const [checkins,    setCheckins]    = useState([]);
  const [measures,    setMeasures]    = useState([]);
  const [current,     setCurrent]     = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [showChart,   setShowChart]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [dietScore,   setDietScore]   = useState(null);   // auto-calculated
  const [dietDetail,  setDietDetail]  = useState(null);
  const [dietLoading, setDietLoading] = useState(false);

  const weekStart = getWeekStart();

  const [form, setForm] = useState({
    weight_self:   "",
    sleep_quality: null,
    energy:        null,
    workouts_done: null,
    stress_level:  null,
    client_note:   "",
  });
  const set = k => v => setForm(f => ({...f,[k]:v}));

  const load = useCallback(async () => {
    const [{ data: ci }, { data: tm }] = await Promise.all([
      supabase.from("client_checkins").select("*").eq("user_id",userId).order("week_start",{ascending:false}).limit(16),
      supabase.from("trainer_measurements").select("*").eq("user_id",userId).order("measured_at",{ascending:true}),
    ]);
    const list = ci || [];
    setCheckins(list);
    setMeasures(tm || []);
    const cur = list.find(c => c.week_start === weekStart);
    setCurrent(cur || null);
    if (cur?.is_done) {
      setForm({
        weight_self:   cur.weight_self   ?? "",
        sleep_quality: cur.sleep_quality ?? null,
        energy:        cur.energy        ?? null,
        workouts_done: cur.workouts_done ?? null,
        stress_level:  cur.stress_level  ?? null,
        client_note:   cur.client_note   ?? "",
      });
    }
  }, [userId, weekStart]);

  // Skaičiuoti mitybos laikymąsi iš food_log
  const loadDietScore = useCallback(async () => {
    if (!targetKcal) return;
    setDietLoading(true);
    const result = await calcDietAdherence(userId, weekStart, targetKcal, targetProtein);
    setDietScore(result.score);
    setDietDetail(result.detail);
    setDietLoading(false);
  }, [userId, weekStart, targetKcal, targetProtein]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadDietScore(); }, [loadDietScore]);

  async function handleSave() {
    setSaving(true);
    await supabase.from("client_checkins").upsert({
      user_id:        userId,
      week_start:     weekStart,
      weight_self:    parseFloat(form.weight_self) || null,
      sleep_quality:  form.sleep_quality,
      energy:         form.energy,
      diet_adherence: dietScore,          // automatiškai apskaičiuotas
      workouts_done:  form.workouts_done,
      stress_level:   form.stress_level,
      client_note:    form.client_note || null,
      is_done:        true,
      done_at:        new Date().toISOString(),
    }, { onConflict:"user_id,week_start" });
    await load();
    setShowForm(false);
    setSaving(false);
  }

  const chartData   = [...checkins].reverse();
  const isDone      = current?.is_done;
  const lastMeasure = measures[measures.length - 1];

  function renderInsight() {
    const prev = checkins[1];
    const lines = [];
    if (current?.weight_self && prev?.weight_self) {
      const d = +(current.weight_self - prev.weight_self).toFixed(1);
      if (d < -0.1)      lines.push({ c:"#7FFFB0", t:`⚖️ Svoris ↓ ${Math.abs(d)} kg` });
      else if (d > 0.3)  lines.push({ c:"#FFD700", t:`⚖️ Svoris ↑ ${d} kg` });
    }
    if (lastMeasure?.weight_measured && current?.weight_self) {
      const d = +(current.weight_self - lastMeasure.weight_measured).toFixed(1);
      if (Math.abs(d) < 0.5) lines.push({ c:"rgba(255,255,255,0.7)", t:"📏 Svoris sutampa su trenerės matavimu" });
    }
    if (dietScore) {
      const color = dietScore>=4?"#7FFFB0":dietScore>=3?"rgba(255,255,255,0.8)":"#FFD700";
      lines.push({ c:color, t:`🥗 Mityba: ${dietScore}/5 — ${dietDetail||""}` });
    }
    const wb = [current?.sleep_quality, current?.energy].filter(Boolean);
    if (wb.length) {
      const s = (wb.reduce((a,b)=>a+b,0)/wb.length).toFixed(1);
      lines.push({ c:+s>=4?"#7FFFB0":+s>=3?"rgba(255,255,255,0.8)":"#FFD700", t:`✨ Savijauta: ${s}/5` });
    }
    return lines;
  }

  return (
    <div style={{
      background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")",
      borderRadius:20, padding:18, marginBottom:12,
      boxShadow:"0 6px 24px rgba(173,20,87,0.3)",
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>📋 Savaitinis check-in</p>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:0 }}>
            {isDone ? "✅ Savaitė užpildyta" : "⏳ Laukia tavo atsakymų"}
          </p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {checkins.length >= 2 && (
            <button onClick={()=>setShowChart(s=>!s)} style={{
              background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)",
              borderRadius:8, padding:"5px 8px", color:"rgba(255,255,255,0.75)", fontSize:11,
              cursor:"pointer", fontFamily:"inherit",
            }}>📈</button>
          )}
          <button onClick={()=>setShowForm(s=>!s)} style={{
            background: isDone?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.18)",
            border:"1.5px solid rgba(255,255,255,"+(isDone?"0.2":"0.35")+")",
            borderRadius:8, padding:"5px 10px", color:"#fff", fontSize:11, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
          }}>
            {showForm ? "✕" : isDone ? "✏️" : "Pildyti"}
          </button>
        </div>
      </div>

      {/* Užpildyta – suvestinė */}
      {isDone && !showForm && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:10 }}>
            {[
              { l:"Miegas",   v:current.sleep_quality,                              e:"😴" },
              { l:"Energija", v:current.energy,                                     e:"⚡" },
              { l:"Mityba",   v:current.diet_adherence,                             e:"🥗" },
              { l:"Stresas",  v:current.stress_level,                               e:"🧘" },
              { l:"Sport.",   v:current.workouts_done!=null?current.workouts_done+"k":null, e:"🏋️" },
              { l:"Svoris",   v:current.weight_self?current.weight_self+"kg":null,  e:"⚖️" },
            ].map(i => i.v!=null && (
              <div key={i.l} style={{ background:"rgba(255,255,255,0.1)", borderRadius:10, padding:"7px 4px", textAlign:"center" }}>
                <div style={{ fontSize:13 }}>{i.e}</div>
                <div style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{typeof i.v==="number"?i.v+"/5":i.v}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{i.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {renderInsight().map((ins,i)=>(
              <p key={i} style={{ fontSize:12, color:ins.c, margin:0, fontWeight:500 }}>{ins.t}</p>
            ))}
          </div>
        </div>
      )}

      {/* Forma */}
      {showForm && (
        <div style={{ background:"rgba(0,0,0,0.18)", borderRadius:16, padding:14, marginBottom:10 }}>

          {/* Svoris */}
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:6, fontWeight:600 }}>⚖️ Svoris šiandien (kg)</p>
            <input type="number" step="0.1" value={form.weight_self}
              onChange={e=>set("weight_self")(e.target.value)} placeholder="pvz. 68.5"
              style={{ width:"100%", padding:"10px 12px", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, fontSize:14, color:"#fff", background:"rgba(255,255,255,0.08)", outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
          </div>

          {/* Mitybos laikymasis – automatinis */}
          <DietAdherenceBlock
            score={dietScore}
            detail={dietDetail}
            loading={dietLoading}
          />

          <EmojiRating label="😴 Miego kokybė"         value={form.sleep_quality} onChange={set("sleep_quality")} />
          <EmojiRating label="⚡ Energija / Nuotaika"  value={form.energy}         onChange={set("energy")} />
          <EmojiRating label="🧘 Streso lygis"          value={form.stress_level}  onChange={set("stress_level")} />

          {/* Treniruotės */}
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:6, fontWeight:600 }}>🏋️ Treniruotės šią savaitę</p>
            <div style={{ display:"flex", gap:5 }}>
              {[0,1,2,3,4,5,6,7].map(n=>(
                <button key={n} onClick={()=>set("workouts_done")(form.workouts_done===n?null:n)} style={{
                  flex:1, padding:"8px 0",
                  border:"1.5px solid "+(form.workouts_done===n?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.12)"),
                  borderRadius:8, background:form.workouts_done===n?"rgba(255,255,255,0.18)":"transparent",
                  color:form.workouts_done===n?"#fff":"rgba(255,255,255,0.4)", fontSize:12, fontWeight:700,
                  cursor:"pointer", fontFamily:"inherit",
                }}>{n}</button>
              ))}
            </div>
          </div>

          {/* Pastaba */}
          <div style={{ marginBottom:14 }}>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginBottom:6, fontWeight:600 }}>💬 Pastaba trenesei (neprivaloma)</p>
            <textarea value={form.client_note} onChange={e=>set("client_note")(e.target.value)} rows={2}
              placeholder="Kas sekėsi, kas buvo sunku..."
              style={{ width:"100%", padding:"9px 12px", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, fontSize:13, color:"#fff", background:"rgba(255,255,255,0.08)", outline:"none", fontFamily:"inherit", resize:"none", boxSizing:"border-box" }}/>
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width:"100%", padding:"12px 0",
            border:"1.5px solid rgba(255,255,255,0.35)", borderRadius:12,
            background:"rgba(255,255,255,0.15)", color:"#fff",
            fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>
            {saving ? "Saugoma..." : "✓ Siųsti check-in"}
          </button>
        </div>
      )}

      {/* Grafikai */}
      {showChart && checkins.length >= 2 && (
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.12)", paddingTop:16, marginTop:10 }}>
          <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.09em", margin:"0 0 12px" }}>
            Progreso grafikai
          </p>
          <div style={{ marginBottom:16 }}>
            <ProgressChart clientData={chartData} trainerData={measures}
              valueKey="weight_self" trainerKey="weight_measured"
              label="Svoris (kg)" color="#7FFFB0" unit="kg"/>
          </div>
          {measures.some(m=>m.body_fat) && (
            <div style={{ marginBottom:16 }}>
              <ProgressChart clientData={[]} trainerData={measures}
                valueKey="body_fat" trainerKey="body_fat"
                label="Kūno riebalai (%)" color="#FFB3C6" unit="%"/>
            </div>
          )}
          <WellbeingChart clientData={chartData}/>
        </div>
      )}
    </div>
  );
}
