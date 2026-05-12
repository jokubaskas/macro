import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { PK } from "./constants";

function todayStr() { return new Date().toISOString().split("T")[0]; }

// ── Formulė: papildomos kalorijos iš žingsnių ────────────────────────────────
export function calcStepCalories(steps, weightKg) {
  if (!steps || !weightKg || steps <= 0) return 0;
  // MET metodas: walking MET=3.5, resting MET=1.0, neto=2.5
  // Greitis: ~100 žingsnių/min
  const hours = steps / 6000;
  const net   = 2.5 * weightKg * hours;
  return Math.round(net);
}

const STEP_GOAL = 10000;

// ── Progreso žiedas ───────────────────────────────────────────────────────────
function StepRing({ steps, goal }) {
  const pct  = Math.min(1, steps / goal);
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = pct >= 1 ? "#7FFFB0" : pct >= 0.7 ? "#FFD700" : "#FFB3C6";

  return (
    <svg width="130" height="130" style={{ display:"block", margin:"0 auto" }}>
      <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10"/>
      <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 65 65)" style={{ transition:"stroke-dasharray 0.6s" }}/>
      <text x="65" y="58" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">
        {steps >= 1000 ? (steps/1000).toFixed(1)+"k" : steps}
      </text>
      <text x="65" y="74" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">
        žingsnių
      </text>
      <text x="65" y="88" textAnchor="middle" fill={color} fontSize="10" fontWeight="700">
        {Math.round(pct*100)}%
      </text>
    </svg>
  );
}

export default function StepTracker({ userId, weightKg, date, onStepsChange }) {
  const currentDate = date || todayStr();
  const isToday     = currentDate === todayStr();

  const [steps,   setSteps]   = useState(0);
  const [editing, setEditing] = useState(false);
  const [input,   setInput]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [history, setHistory] = useState([]);

  const extraKcal = calcStepCalories(steps, weightKg);

  useEffect(() => {
    if (!userId) return;
    const weekAgo = new Date(Date.now()-7*24*60*60*1000).toISOString().split("T")[0];
    Promise.all([
      supabase.from("step_log").select("steps").eq("user_id",userId).eq("date",currentDate).maybeSingle(),
      supabase.from("step_log").select("date,steps").eq("user_id",userId).gte("date",weekAgo).order("date"),
    ]).then(([{ data:today }, { data:hist }]) => {
      const s = today?.steps || 0;
      setSteps(s);
      setHistory(hist || []);
      onStepsChange?.(s);
      setLoaded(true);
    });
  }, [userId, currentDate]);

  async function save(newSteps) {
    if (!isToday) return;
    setSaving(true);
    await supabase.rpc("upsert_step_log", { p_user_id:userId, p_date:currentDate, p_steps:newSteps });
    onStepsChange?.(newSteps);
    setSaving(false);
  }

  function applyInput() {
    const v = parseInt(input.replace(/\D/g,"")) || 0;
    const clamped = Math.max(0, Math.min(50000, v));
    setSteps(clamped);
    save(clamped);
    setEditing(false);
    setInput("");
  }

  function quickAdd(n) {
    const next = Math.min(50000, steps + n);
    setSteps(next);
    save(next);
  }

  if (!loaded) return null;

  // Savaitės grafiko duomenys
  const maxH = Math.max(...history.map(d=>d.steps), STEP_GOAL);
  const days  = ["P","A","T","K","Pn","Š","S"];

  return (
    <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:20, padding:"18px 16px", border:"1px solid rgba(255,255,255,0.15)", marginBottom:12 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.85)", margin:"0 0 2px" }}>🚶 Žingsniai šiandien</p>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:0 }}>Tikslas: {STEP_GOAL.toLocaleString()} žingsnių</p>
        </div>
        {saving && <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>●</span>}
        {isToday && (
          <button onClick={()=>{ setEditing(true); setInput(steps>0?String(steps):""); }} style={{
            background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)",
            borderRadius:10, padding:"6px 12px", color:"rgba(255,255,255,0.8)",
            fontSize:11, cursor:"pointer", fontFamily:"inherit",
          }}>✏️ Įvesti</button>
        )}
      </div>

      {/* Žiedas */}
      <StepRing steps={steps} goal={STEP_GOAL} />

      {/* Papildomos kalorijos */}
      {extraKcal > 0 && (
        <div style={{ background:"rgba(127,255,176,0.15)", borderRadius:12, padding:"10px 14px", margin:"14px 0 10px", border:"1px solid rgba(127,255,176,0.3)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ fontSize:12, color:"rgba(127,255,176,0.9)", margin:0, fontWeight:600 }}>
              🔥 Papildomai sudeginta
            </p>
            <p style={{ fontSize:18, fontWeight:800, color:"#7FFFB0", margin:0 }}>+{extraKcal} kcal</p>
          </div>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:"4px 0 0" }}>
            Šiandien gali suvalgyti daugiau — žingsniuoji aktyviai!
          </p>
        </div>
      )}

      {/* Greito pridėjimo mygtukai */}
      {isToday && !editing && (
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {[1000, 2000, 5000, 10000].map(n=>(
            <button key={n} onClick={()=>quickAdd(n)} style={{
              flex:1, padding:"8px 0",
              background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)",
              borderRadius:10, color:"rgba(255,255,255,0.7)",
              fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            }}>+{n>=1000?(n/1000)+"k":n}</button>
          ))}
        </div>
      )}

      {/* Įvedimo laukas */}
      {editing && (
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <input
            autoFocus
            type="number"
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&applyInput()}
            placeholder="pvz. 8500"
            style={{ flex:1, padding:"10px 12px", background:"rgba(255,255,255,0.12)", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:12, color:"#fff", fontSize:16, fontWeight:700, fontFamily:"inherit", outline:"none" }}
          />
          <button onClick={applyInput} style={{ padding:"10px 16px", background:"rgba(127,255,176,0.2)", border:"1.5px solid rgba(127,255,176,0.4)", borderRadius:12, color:"#7FFFB0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✓</button>
          <button onClick={()=>setEditing(false)} style={{ padding:"10px 12px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:12, color:"rgba(255,255,255,0.5)", fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>✕</button>
        </div>
      )}

      {/* 7 dienų grafikas */}
      {history.length > 1 && (
        <div>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:"4px 0 8px", textTransform:"uppercase", letterSpacing:"0.08em" }}>7 dienų istorija</p>
          <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:50 }}>
            {history.slice(-7).map((d,i) => {
              const h = Math.max(4, Math.round((d.steps/maxH)*46));
              const color = d.steps >= STEP_GOAL ? "#7FFFB0" : d.steps >= STEP_GOAL*0.7 ? "#FFD700" : "rgba(255,255,255,0.3)";
              const dow = new Date(d.date+"T12:00:00").getDay();
              return (
                <div key={d.date} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                  <div style={{ width:"100%", height:h, borderRadius:"4px 4px 0 0", background:color, transition:"height 0.5s" }}/>
                  <span style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>{days[dow===0?6:dow-1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
