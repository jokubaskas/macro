import { useState, useEffect } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { calcStepCalories, calcWorkoutCalories } from "./StepTracker";

function todayStr() { return new Date().toISOString().split("T")[0]; }

const STEP_GOAL = 10000;
const WT = {
  strength: { emoji:"🏋️", label:"Jėgos",  color:"#FFB3C6", met:5.5 },
  cardio:   { emoji:"🏃", label:"Kardio", color:"#89CFF0", met:8.0 },
};

function StepRing({ steps }) {
  const pct = Math.min(1, steps / STEP_GOAL);
  const r = 42, circ = 2 * Math.PI * r;
  const color = pct >= 1 ? "#7FFFB0" : pct >= 0.7 ? "#FFD700" : "#FFB3C6";
  return (
    <svg width="100" height="100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${pct*circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{transition:"stroke-dasharray 0.5s"}}/>
      <text x="50" y="46" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800">
        {steps>=1000?(steps/1000).toFixed(1)+"k":steps}
      </text>
      <text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9">žingsnių</text>
      <text x="50" y="72" textAnchor="middle" fill={color} fontSize="9" fontWeight="700">{Math.round(pct*100)}%</text>
    </svg>
  );
}

export default function ActivityWidget({ userId, weightKg, date, onActivityChange }) {
  const currentDate = date || todayStr();
  const isToday = currentDate === todayStr();

  const [steps,     setSteps]     = useState(0);
  const [workouts,  setWorkouts]  = useState([]);
  const [stepEdit,  setStepEdit]  = useState(false);
  const [stepInput, setStepInput] = useState("");
  const [adding,    setAdding]    = useState(null);
  const [duration,  setDuration]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [loaded,    setLoaded]    = useState(false);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      pbFirst("step_log", `user_id="${userId}" && date="${currentDate}"`),
pb.collection("workout_log").getFullList({ filter: `user_id="${userId}" && date="${currentDate}"`, sort: "created", requestKey: null }),
    ]).then(([s, w]) => {
  const st = s?.steps || 0;
  const wt = w || [];
      setSteps(st); setWorkouts(wt); setLoaded(true);
      onActivityChange?.(st, wt);
    });
  }, [userId, currentDate]);

  async function saveSteps(val) {
    if (!isToday) return;
    const n = Math.min(50000, Math.max(0, val));
    setSteps(n);
    onActivityChange?.(n, workouts);
await pbUpsert("step_log", `user_id="${userId}" && date="${currentDate}"`, { user_id:userId, date:currentDate, steps:n });
  }

  function applyStep() {
    saveSteps(parseInt(stepInput.replace(/\D/g,""))||0);
    setStepEdit(false); setStepInput("");
  }

  async function saveWorkout() {
  const dur = parseInt(duration);
  if (!dur || !adding) return;
  setSaving(true);
  const data = await pb.collection("workout_log")
    .create({ user_id:userId, date:currentDate, type:adding, duration_min:dur });
  const next = data ? [...workouts, data] : workouts;
  setWorkouts(next);
  onActivityChange?.(steps, next);
  setAdding(null); setDuration(""); setSaving(false);
}

  async function deleteWorkout(id) {
await pb.collection("workout_log").delete(id);
    const next = workouts.filter(w => w.id !== id);
    setWorkouts(next);
    onActivityChange?.(steps, next);
  }

  if (!loaded) return null;

  const xSteps   = calcStepCalories(steps, weightKg);
  const xWorkout = calcWorkoutCalories(workouts, weightKg);
  const xTotal   = xSteps + xWorkout;
  const strMin   = workouts.filter(w=>w.type==="strength").reduce((a,w)=>a+w.duration_min,0);
  const carMin   = workouts.filter(w=>w.type==="cardio").reduce((a,w)=>a+w.duration_min,0);

  return (
    <div style={{background:"rgba(0,0,0,0.2)",borderRadius:22,border:"1px solid rgba(255,255,255,0.15)",marginBottom:14,overflow:"hidden"}}>

      {/* ŽINGSNIAI */}
      <div style={{padding:"16px 16px 12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <StepRing steps={steps}/>
          <div style={{flex:1}}>
            <p style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.85)",margin:"0 0 8px"}}>🚶 Žingsniai</p>
            {isToday && !stepEdit && (
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[1000,2000,5000,10000].map(n=>(
                  <button key={n} onClick={()=>saveSteps(steps+n)} style={{padding:"5px 8px",borderRadius:8,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"rgba(255,255,255,0.8)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    +{n>=1000?(n/1000)+"k":n}
                  </button>
                ))}
                <button onClick={()=>{setStepEdit(true);setStepInput(steps>0?String(steps):"");}} style={{padding:"5px 8px",borderRadius:8,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.45)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✏️</button>
              </div>
            )}
            {!isToday && <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:0}}>{steps>0?steps.toLocaleString()+" žingsnių":"—"}</p>}
          </div>
        </div>
        {stepEdit && (
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <input autoFocus type="number" value={stepInput} onChange={e=>setStepInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&applyStep()} placeholder="pvz. 8500"
              style={{flex:1,padding:"9px 12px",background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.25)",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"inherit",outline:"none"}}/>
            <button onClick={applyStep} style={{padding:"9px 14px",borderRadius:10,background:"rgba(127,255,176,0.2)",border:"1.5px solid rgba(127,255,176,0.4)",color:"#7FFFB0",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓</button>
            <button onClick={()=>setStepEdit(false)} style={{padding:"9px 12px",borderRadius:10,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.4)",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        )}
      </div>

      {/* SKYRIKLIS */}
      <div style={{height:1,background:"rgba(255,255,255,0.1)",margin:"0 16px"}}/>

      {/* TRENIRUOTĖS */}
      <div style={{padding:"12px 16px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <p style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.85)",margin:0}}>💪 Treniruotės</p>
          <div style={{display:"flex",gap:6}}>
            {strMin>0&&<span style={{fontSize:10,background:"rgba(255,179,198,0.15)",color:"#FFB3C6",borderRadius:8,padding:"2px 8px"}}>🏋️ {strMin}min</span>}
            {carMin>0&&<span style={{fontSize:10,background:"rgba(137,207,240,0.15)",color:"#89CFF0",borderRadius:8,padding:"2px 8px"}}>🏃 {carMin}min</span>}
          </div>
        </div>

        {workouts.length>0&&(
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
            {workouts.map(w=>(
              <div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"7px 12px"}}>
                <span style={{fontSize:18}}>{WT[w.type]?.emoji}</span>
                <span style={{flex:1,marginLeft:8,fontSize:12,fontWeight:600,color:WT[w.type]?.color}}>{WT[w.type]?.label} · {w.duration_min} min</span>
                <span style={{fontSize:11,color:"rgba(127,255,176,0.7)"}}>+{Math.round((WT[w.type]?.met-1)*weightKg*(w.duration_min/60))} kcal</span>
                {isToday&&<button onClick={()=>deleteWorkout(w.id)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.25)",fontSize:14,cursor:"pointer",marginLeft:8}}>✕</button>}
              </div>
            ))}
          </div>
        )}

        {isToday&&adding===null&&(
          <div style={{display:"flex",gap:8}}>
            {Object.entries(WT).map(([type,info])=>(
              <button key={type} onClick={()=>setAdding(type)} style={{flex:1,padding:"10px 8px",borderRadius:14,background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.18)",color:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <span style={{fontSize:18}}>{info.emoji}</span>
                <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.7)"}}>+ {info.label}</span>
              </button>
            ))}
          </div>
        )}

        {isToday&&adding&&(
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:"12px"}}>
            <p style={{fontSize:12,color:"rgba(255,255,255,0.7)",margin:"0 0 10px",fontWeight:700}}>{WT[adding].emoji} {WT[adding].label} — trukmė</p>
            <div style={{display:"flex",gap:6,marginBottom:10}}>
              {[20,30,45,60,90].map(n=>(
                <button key={n} onClick={()=>setDuration(String(n))} style={{flex:1,padding:"8px 0",borderRadius:10,background:duration===String(n)?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.08)",border:`1px solid rgba(255,255,255,${duration===String(n)?".5":".15"})`,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{n}'</button>
              ))}
            </div>
            <input type="number" value={duration} onChange={e=>setDuration(e.target.value)}
              placeholder="arba įvesk min." style={{width:"100%",padding:"8px 12px",background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:10,color:"#fff",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:10}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={saveWorkout} disabled={saving||!duration} style={{flex:2,padding:"11px 0",borderRadius:12,background:duration?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.05)",border:`1.5px solid rgba(255,255,255,${duration?".35":".1"})`,color:duration?"#fff":"rgba(255,255,255,0.3)",fontSize:13,fontWeight:700,cursor:duration?"pointer":"default",fontFamily:"inherit"}}>
                {saving?"...":"✓ Išsaugoti"}
              </button>
              <button onClick={()=>{setAdding(null);setDuration("");}} style={{flex:1,padding:"11px 0",borderRadius:12,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.4)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Atšaukti</button>
            </div>
          </div>
        )}
      </div>

      {/* SUVESTINĖ */}
      {xTotal>0&&(
        <div style={{background:"rgba(127,255,176,0.12)",borderTop:"1px solid rgba(127,255,176,0.2)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"rgba(127,255,176,0.8)"}}>
            🔥 Papildomai sudeginta
            {xSteps>0&&<span style={{color:"rgba(255,255,255,0.4)",marginLeft:6}}>🚶+{xSteps}</span>}
            {xWorkout>0&&<span style={{color:"rgba(255,255,255,0.4)",marginLeft:4}}>💪+{xWorkout}</span>}
          </span>
          <span style={{fontSize:18,fontWeight:800,color:"#7FFFB0"}}>+{xTotal} kcal</span>
        </div>
      )}
    </div>
  );
}
