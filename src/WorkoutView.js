import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";

const PK = { dark:"#6D1B3B", mid:"#AD1457", blush:"#F8BBD9" };

function todayStr() { return new Date().toISOString().split("T")[0]; }

// Kuris dienos numeris šiandien (1=Pirm ... 7=Sekm)
function todayDayNumber() {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
}

export default function WorkoutView({ user, onClose }) {
  const [plan,       setPlan]       = useState(null);
  const [days,       setDays]       = useState([]);
  const [activeDay,  setActiveDay]  = useState(null);
  const [exercises,  setExercises]  = useState([]);
  const [logs,       setLogs]       = useState({});
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const today = todayStr();
    // Rasti aktyvų planą
    const plans = await pb.collection("workout_plans").getList(1,1,{
      filter: `user_id="${user.id}" && is_active=true && valid_until>="${today}"`,
      sort: "-created", requestKey: null,
    }).then(r=>r.items).catch(()=>[]);

    if (!plans.length) { setLoading(false); return; }
    const p = plans[0];
    setPlan(p);

    // Dienos
    const d = await pb.collection("workout_plan_days").getFullList({
      filter: `plan_id="${p.id}"`, sort: "day_number", requestKey: null,
    }).catch(()=>[]);
    setDays(d);

    // Nustatyti aktyvią dieną (pagal šiandienį savaitės dieną)
    const todayNum = todayDayNumber();
    const match = d.find(day => day.day_number === todayNum) || d[0];
    setActiveDay(match);

    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!activeDay) return;
    // Krauti pratimus šiai dienai
    pb.collection("workout_plan_exercises").getFullList({
      filter: `day_id="${activeDay.id}"`, sort: "order", requestKey: null,
    }).then(setExercises).catch(()=>setExercises([]));

    // Krauti šiandienos logus
    pb.collection("workout_logs_client").getFullList({
      filter: `user_id="${user.id}" && date="${todayStr()}" && day_id="${activeDay.id}"`,
      requestKey: null,
    }).then(items => {
      const map = {};
      items.forEach(l => { map[l.plan_exercise_id] = l; });
      setLogs(map);
    }).catch(()=>{});
  }, [activeDay, user.id]);

  async function toggleDone(ex) {
    const existing = logs[ex.id];
    setSaving(s=>({...s,[ex.id]:true}));

    if (existing?.is_done) {
      // Atžymėti
      await pb.collection("workout_logs_client").update(existing.id, { is_done: false }).catch(()=>{});
      setLogs(l=>({...l,[ex.id]:{...existing,is_done:false}}));
    } else if (existing) {
      // Pažymėti kaip atlikta
      await pb.collection("workout_logs_client").update(existing.id, { is_done: true }).catch(()=>{});
      setLogs(l=>({...l,[ex.id]:{...existing,is_done:true}}));
    } else {
      // Sukurti naują
      const rec = await pb.collection("workout_logs_client").create({
        user_id: user.id,
        plan_exercise_id: ex.id,
        day_id: activeDay.id,
        date: todayStr(),
        sets_done: ex.sets,
        reps_done: ex.reps,
        weight_done: ex.weight_kg,
        duration_done: ex.duration_min,
        is_done: true,
      }).catch(()=>null);
      if (rec) setLogs(l=>({...l,[ex.id]:rec}));
    }
    setSaving(s=>({...s,[ex.id]:false}));
  }

  const doneCount = exercises.filter(ex => logs[ex.id]?.is_done).length;
  const allDone   = exercises.length > 0 && doneCount === exercises.length;

  if (loading) return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:`linear-gradient(160deg,#3a0a20,${PK.dark})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>Kraunama...</p>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:`linear-gradient(160deg,#3a0a20 0%,${PK.dark} 45%,${PK.mid} 100%)`, overflowY:"auto", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", padding:"16px 20px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer" }}>← Atgal</button>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>🏋️ Treniruotė</h1>
          {plan && <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>Galioja iki {plan.valid_until}</p>}
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"16px" }}>

        {/* Nėra plano */}
        {!plan && (
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:18, padding:"32px 20px", textAlign:"center", border:"2px dashed rgba(255,255,255,0.15)", marginTop:20 }}>
            <p style={{ fontSize:32, marginBottom:10 }}>🏋️</p>
            <p style={{ color:"rgba(255,255,255,0.7)", fontSize:15, fontWeight:600, marginBottom:6 }}>Sporto plano dar nėra</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13 }}>Trenerė netrukus sudarys tau individualų planą!</p>
          </div>
        )}

        {plan && (
          <>
            {/* Dienų pasirinkimas */}
            <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:16, paddingBottom:4 }}>
              {days.map(d => {
                const isActive = activeDay?.id === d.id;
                const isToday  = d.day_number === todayDayNumber();
                return (
                  <button key={d.id} onClick={()=>setActiveDay(d)} style={{ padding:"8px 14px", borderRadius:20, border:isToday?"2px solid rgba(255,255,255,0.6)":"none", background:isActive?"#AD1457":"rgba(255,255,255,0.12)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit", flexShrink:0 }}>
                    {d.day_name}
                    {isToday && <span style={{ marginLeft:4, fontSize:9 }}>●</span>}
                  </button>
                );
              })}
            </div>

            {/* Progresas */}
            {exercises.length > 0 && (
              <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>{allDone ? "✅ Treniruotė baigta!" : `${doneCount} / ${exercises.length} atlikta`}</p>
                  <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:99, height:4, width:160, marginTop:6 }}>
                    <div style={{ width:`${exercises.length?doneCount/exercises.length*100:0}%`, height:"100%", borderRadius:99, background:"#7FFFB0", transition:"width 0.3s" }} />
                  </div>
                </div>
                {allDone && <span style={{ fontSize:28 }}>🎉</span>}
              </div>
            )}

            {/* Pratimai */}
            {exercises.length === 0 ? (
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", padding:"20px 0" }}>Šiai dienai pratimų nėra</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {exercises.map(ex => {
                  const log    = logs[ex.id];
                  const isDone = log?.is_done;
                  const isSav  = saving[ex.id];
                  return (
                    <div key={ex.id} style={{ background: isDone ? "rgba(127,255,176,0.1)" : "rgba(255,255,255,0.08)", borderRadius:16, padding:"14px 16px", border:`1px solid ${isDone?"rgba(127,255,176,0.4)":"rgba(255,255,255,0.12)"}`, transition:"all 0.2s" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:14, fontWeight:700, color: isDone?"#7FFFB0":"#fff", margin:"0 0 4px", textDecoration:isDone?"line-through":"none", opacity:isDone?0.8:1 }}>{ex.exercise_name}</p>
                          <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:"0 0 8px" }}>
                            {ex.category==="cardio"
                              ? `⏱ ${ex.duration_min || "–"} min`
                              : `${ex.sets||"–"} serijos × ${ex.reps||"–"} kartojimai${ex.weight_kg ? ` · ${ex.weight_kg} kg` : ""}`}
                          </p>
                        </div>
                        <button onClick={()=>!isSav&&toggleDone(ex)} style={{ width:36, height:36, borderRadius:"50%", border:`2px solid ${isDone?"#7FFFB0":"rgba(255,255,255,0.3)"}`, background:isDone?"rgba(127,255,176,0.2)":"transparent", color:isDone?"#7FFFB0":"rgba(255,255,255,0.5)", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.2s" }}>
                          {isSav ? "⋯" : isDone ? "✓" : "○"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
