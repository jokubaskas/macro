import { useState, useEffect } from "react";
import { pb } from "./pb";

const PK = { dark:"#6D1B3B", mid:"#AD1457" };
function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function WorkoutView({ user, onClose }) {
  const [plan,        setPlan]        = useState(null);
  const [planDays,    setPlanDays]    = useState([]);
  const [activeDay,   setActiveDay]   = useState(null);
  const [exercises,   setExercises]   = useState([]);
  const [logs,        setLogs]        = useState({});
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState({});
  const today = todayStr();

  // Krauti aktyvų planą
  useEffect(() => {
    async function load() {
      setLoading(true);
      const plans = await pb.collection("workout_plans").getFullList({
        filter: `user_id="${user.id}" && is_active=true`,
        sort: "-created", requestKey: null,
      }).then(r => r.filter(p => p.start_date <= today && p.end_date >= today)).catch(() => []);

      if (!plans.length) { setLoading(false); return; }
      const p = plans[0];      setPlan(p);

      const days = await pb.collection("workout_plan_days").getFullList({
        filter: `plan_id="${p.id}"`, sort: "day_number", requestKey: null,
      }).catch(() => []);
      setPlanDays(days);
      if (days.length) setActiveDay(days[0]);
      setLoading(false);
    }
    load();
  }, [user.id]);

  // Krauti pratimus ir šiandienos logus kai keičiasi diena
  useEffect(() => {
    if (!activeDay) return;
    setExercises([]); setLogs({});

    pb.collection("workout_plan_exercises").getFullList({
      filter: `day_id="${activeDay.id}"`, sort: "order_num", requestKey: null,
    }).then(setExercises).catch(() => {});

    // Logai: ar ŠIANDIEN klientas jau atliko šios plano dienos pratimus
    pb.collection("workout_logs_client").getFullList({
      filter: `user_id="${user.id}" && plan_day_id="${activeDay.id}" && calendar_date="${today}"`,
      requestKey: null,
    }).then(items => {
      const map = {};
      items.forEach(l => { map[l.plan_exercise_id] = l; });
      setLogs(map);
    }).catch(() => {});
  }, [activeDay, user.id]);

  async function markDone(ex) {
    if (logs[ex.id]?.is_done) return;
    setSaving(s => ({...s, [ex.id]: true}));
    const rec = await pb.collection("workout_logs_client").create({
      user_id: user.id,
      plan_id: plan.id,
      plan_day_id: activeDay.id,
      plan_exercise_id: ex.id,
      calendar_date: today,
      is_done: true,
    }).catch(() => null);
    if (rec) setLogs(l => ({...l, [ex.id]: rec}));
    setSaving(s => ({...s, [ex.id]: false}));
  }

  const doneCount = exercises.filter(ex => logs[ex.id]?.is_done).length;
  const allDone   = exercises.length > 0 && doneCount === exercises.length;

  if (loading) return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:`linear-gradient(160deg,#3a0a20,${PK.dark})`,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"rgba(255,255,255,0.5)",fontSize:14}}>Kraunama...</p>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:`linear-gradient(160deg,#3a0a20 0%,${PK.dark} 45%,${PK.mid} 100%)`,overflowY:"auto",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer"}}>← Atgal</button>
        <div>
          <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>🏋️ Treniruotė</h1>
          {plan&&<p style={{fontSize:10,color:"rgba(255,255,255,0.4)",margin:0}}>{plan.plan_name} · iki {plan.end_date}</p>}
        </div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"16px"}}>
        {!plan ? (
          <div style={{background:"rgba(255,255,255,0.08)",borderRadius:18,padding:"32px 20px",textAlign:"center",border:"2px dashed rgba(255,255,255,0.15)",marginTop:20}}>
            <p style={{fontSize:32,marginBottom:10}}>🏋️</p>
            <p style={{color:"rgba(255,255,255,0.7)",fontSize:15,fontWeight:600,marginBottom:6}}>Sporto plano dar nėra</p>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Trenerė netrukus sudarys tau individualų planą!</p>
          </div>
        ) : (
          <>
            {/* Dienų pasirinkimas */}
            <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 8px",fontWeight:600}}>Pasirinkite šiandienos treniruotę:</p>
            <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
              {planDays.map(d => (
                <button key={d.id} onClick={()=>setActiveDay(d)}
                  style={{padding:"10px 16px",borderRadius:14,border:`2px solid ${activeDay?.id===d.id?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.2)"}`,background:activeDay?.id===d.id?"rgba(255,255,255,0.2)":"transparent",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
                  {d.day_label}
                </button>
              ))}
            </div>

            {/* Progresas */}
            {exercises.length > 0 && (
              <div style={{background:"rgba(0,0,0,0.2)",borderRadius:14,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:"0 0 4px"}}>{allDone?"✅ Treniruotė baigta!":`${doneCount} / ${exercises.length} atlikta`}</p>
                  <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,height:4,width:160}}>
                    <div style={{width:`${exercises.length?doneCount/exercises.length*100:0}%`,height:"100%",borderRadius:99,background:"#7FFFB0",transition:"width 0.3s"}}/>
                  </div>
                </div>
                {allDone&&<span style={{fontSize:28}}>🎉</span>}
              </div>
            )}

            {/* Pratimai */}
            {exercises.length === 0 ? (
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,textAlign:"center",padding:"20px 0"}}>Šiai dienai pratimų nėra</p>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {exercises.map(ex => {
                  const isDone = logs[ex.id]?.is_done;
                  const isSav  = saving[ex.id];
                  return (
                    <div key={ex.id} style={{background:isDone?"rgba(127,255,176,0.1)":"rgba(255,255,255,0.08)",borderRadius:16,padding:"14px 16px",border:`1px solid ${isDone?"rgba(127,255,176,0.4)":"rgba(255,255,255,0.12)"}`,transition:"all 0.2s"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{flex:1}}>
                          <p style={{fontSize:14,fontWeight:700,color:isDone?"#7FFFB0":"#fff",margin:"0 0 4px",textDecoration:isDone?"line-through":"none",opacity:isDone?0.8:1}}>{ex.exercise_name}</p>
                          <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",margin:0}}>
                            {ex.category==="cardio"
                              ? `⏱ ${ex.duration_min||"–"} min`
                              : ex.set_weights
                                ? (() => { try { const ws=JSON.parse(ex.set_weights); return `${ex.sets||"–"} ser. × ${ex.reps||"–"} · ${ws.map((w,i)=>`S${i+1}:${w}kg`).join(" ")}`; } catch { return `${ex.sets||"–"} × ${ex.reps||"–"}`; } })()
                                : `${ex.sets||"–"} serijos × ${ex.reps||"–"} kartojimai${ex.weight_kg?` · ${ex.weight_kg} kg`:""}`
                            }
                          </p>
                        </div>
                        <button onClick={()=>!isSav&&!isDone&&markDone(ex)}
                          style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${isDone?"#7FFFB0":"rgba(255,255,255,0.3)"}`,background:isDone?"rgba(127,255,176,0.2)":"transparent",color:isDone?"#7FFFB0":"rgba(255,255,255,0.5)",fontSize:18,cursor:isDone?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                          {isSav?"⋯":isDone?"✓":"○"}
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
