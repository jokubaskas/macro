import { useState, useEffect } from "react";
import { pb } from "./pb";

const PK = { dark:"#6D1B3B", mid:"#AD1457" };
const inp = { padding:"10px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" };

function ExercisePicker({ onAdd, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter]       = useState("Visi");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState({ sets:"3", reps:"12", weight_kg:"", duration_min:"" });
  const [showNew, setShowNew]     = useState(false);
  const [newEx, setNewEx]         = useState({ name:"", category:"strength", muscle:"Krūtinė" });
  const [saving, setSaving]       = useState(false);

  const MUSCLES = ["Krūtinė","Nugara","Pečiai","Rankos","Kojos","Pilvas","Cardio"];

  useEffect(() => {
    pb.collection("exercises").getFullList({ sort:"muscle,name", requestKey:null })
      .then(setExercises).catch(()=>{});
  }, []);

  async function handleAddNew() {
    if (!newEx.name.trim()) return;
    setSaving(true);
    const rec = await pb.collection("exercises").create(newEx).catch(()=>null);
    if (rec) { setExercises(prev=>[...prev,rec].sort((a,b)=>a.name.localeCompare(b.name))); setShowNew(false); setNewEx({name:"",category:"strength",muscle:"Krūtinė"}); }
    setSaving(false);
  }

  const filtered = exercises.filter(e =>
    (filter==="Visi" || e.muscle===filter) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  );
  const isCardio = selected?.category==="cardio";

  function handleAdd() {
    if (!selected) return;
    onAdd({ exercise_name:selected.name, category:selected.category, muscle:selected.muscle,
      sets: isCardio?null:parseInt(form.sets)||null, reps:isCardio?null:parseInt(form.reps)||null,
      weight_kg:isCardio?null:parseFloat(form.weight_kg)||null, duration_min:isCardio?parseInt(form.duration_min)||null:null });
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:700,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)",borderRadius:"24px 24px 0 0",padding:"20px 16px 40px",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>{showNew?"Naujas pratimas":selected?"Parametrai":"Pasirinkti pratimą"}</p>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer"}}>✕</button>
        </div>

        {showNew && (
          <div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Pavadinimas</label>
              <input value={newEx.name} onChange={e=>setNewEx(p=>({...p,name:e.target.value}))} placeholder="pvz. Sumo pritūpimai" style={inp}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {["strength","cardio"].map(c=>(
                <button key={c} onClick={()=>setNewEx(p=>({...p,category:c,muscle:c==="cardio"?"Cardio":p.muscle==="Cardio"?"Krūtinė":p.muscle}))}
                  style={{flex:1,padding:"10px",borderRadius:10,border:`2px solid ${newEx.category===c?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.2)"}`,background:newEx.category===c?"rgba(255,255,255,0.2)":"transparent",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>
                  {c==="strength"?"💪 Svoris":"🏃 Cardio"}
                </button>
              ))}
            </div>
            {newEx.category==="strength"&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                {MUSCLES.filter(g=>g!=="Cardio").map(g=>(
                  <button key={g} onClick={()=>setNewEx(p=>({...p,muscle:g}))}
                    style={{padding:"6px 12px",borderRadius:20,border:"none",background:newEx.muscle===g?"#AD1457":"rgba(255,255,255,0.12)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{g}</button>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowNew(false)} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid rgba(255,255,255,0.3)",background:"transparent",color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Atšaukti</button>
              <button onClick={handleAddNew} disabled={saving||!newEx.name.trim()} style={{flex:2,padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {saving?"Saugoma...":"💾 Išsaugoti"}
              </button>
            </div>
          </div>
        )}

        {!showNew&&!selected&&(
          <>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ieškoti..." style={{...inp,marginBottom:10}}/>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:10,paddingBottom:4}}>
              {["Visi",...MUSCLES].map(g=>(
                <button key={g} onClick={()=>setFilter(g)} style={{padding:"6px 12px",borderRadius:20,border:"none",background:filter===g?"#AD1457":"rgba(255,255,255,0.12)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>{g}</button>
              ))}
            </div>
            <button onClick={()=>setShowNew(true)} style={{width:"100%",padding:"10px",marginBottom:10,borderRadius:12,border:"2px dashed rgba(255,255,255,0.3)",background:"transparent",color:"rgba(255,255,255,0.7)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>+ Pridėti naują pratimą į duomenų bazę</button>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {filtered.map(ex=>(
                <button key={ex.id} onClick={()=>setSelected(ex)} style={{padding:"11px 14px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,color:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{fontSize:13,fontWeight:600}}>{ex.name}</span><span style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginLeft:8}}>{ex.muscle}</span></div>
                  <span style={{fontSize:11,color:ex.category==="cardio"?"#89CFF0":"#FFB3C6",background:"rgba(255,255,255,0.1)",padding:"2px 8px",borderRadius:6}}>{ex.category==="cardio"?"Cardio":"Svoris"}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {!showNew&&selected&&(
          <div>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
              <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{selected.name}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{selected.muscle}</p>
            </div>
            {isCardio?(
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Trukmė (minutės)</label>
                <input type="number" value={form.duration_min} onChange={e=>setForm(f=>({...f,duration_min:e.target.value}))} placeholder="30" style={inp}/>
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                {[{k:"sets",l:"Serijos"},{k:"reps",l:"Kartojimai"},{k:"weight_kg",l:"Svoris (kg)"}].map(f=>(
                  <div key={f.k}>
                    <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>{f.l}</label>
                    <input type="number" value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder="–" style={inp}/>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setSelected(null)} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid rgba(255,255,255,0.3)",background:"transparent",color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>← Atgal</button>
              <button onClick={handleAdd} style={{flex:2,padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Pridėti</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkoutPlanBuilder({ client, onClose, onSaved }) {
  const [step, setStep]           = useState(1);
  const [planName, setPlanName]   = useState("");
  const [daysCount, setDaysCount] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate]     = useState("");
  const [days, setDays]           = useState([]);
  const [activeDay, setActiveDay] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving]       = useState(false);

  function initDays(count) {
    setDays(Array.from({length:count},(_,i)=>({ day_number:i+1, day_label:`${i+1} diena`, exercises:[] })));
    setActiveDay(0);
  }

  function removeExercise(dayIdx, exIdx) {
    setDays(prev=>prev.map((d,i)=>i===dayIdx?{...d,exercises:d.exercises.filter((_,j)=>j!==exIdx)}:d));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const plan = await pb.collection("workout_plans").create({
        user_id: client.id, plan_name: planName||`${client.name} planas`,
        days_count: daysCount, start_date: startDate, end_date: endDate,
        created_by: pb.authStore.model?.id, is_active: true,
      });
      for (const day of days) {
        const dayRec = await pb.collection("workout_plan_days").create({ plan_id:plan.id, day_number:day.day_number, day_label:day.day_label });
        for (let i=0; i<day.exercises.length; i++) {
          const ex = day.exercises[i];
          await pb.collection("workout_plan_exercises").create({ day_id:dayRec.id, exercise_name:ex.exercise_name, category:ex.category, muscle:ex.muscle, sets:ex.sets, reps:ex.reps, weight_kg:ex.weight_kg, duration_min:ex.duration_min, order_num:i });
        }
      }
      onSaved?.(); onClose();
    } catch(e) { console.error(e); alert("Klaida išsaugant"); }
    setSaving(false);
  }

  const canSave = endDate && days.some(d=>d.exercises.length>0);

  return (
    <div style={{position:"fixed",inset:0,zIndex:600,background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",overflowY:"auto",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {showPicker&&<ExercisePicker onAdd={ex=>{setDays(prev=>prev.map((d,i)=>i===activeDay?{...d,exercises:[...d.exercises,ex]}:d));setShowPicker(false);}} onClose={()=>setShowPicker(false)}/>}

      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer"}}>← Atgal</button>
        <div>
          <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>Sporto planas</h1>
          <p style={{fontSize:10,color:"rgba(255,255,255,0.4)",margin:0}}>{client.name}</p>
        </div>
        {step===2&&<button onClick={()=>setStep(1)} style={{marginLeft:"auto",background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:11,cursor:"pointer"}}>← Parametrai</button>}
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"16px"}}>
        {step===1&&(
          <div>
            <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 16px"}}>1. Plano parametrai</p>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:6}}>Pavadinimas</label>
              <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder={`${client.name} planas`} style={inp}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:8}}>Dienų skaičius</label>
              <div style={{display:"flex",gap:8}}>
                {[1,2,3,4,5].map(n=>(
                  <button key={n} onClick={()=>setDaysCount(n)} style={{flex:1,aspectRatio:"1",borderRadius:12,border:`2px solid ${daysCount===n?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.2)"}`,background:daysCount===n?"rgba(255,255,255,0.2)":"transparent",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24}}>
              <div>
                <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:6}}>Pradžia (MMMM-MM-DD)</label>
                <input type="text" value={startDate} onChange={e=>setStartDate(e.target.value)} placeholder="2026-06-26" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:6}}>Pabaiga (MMMM-MM-DD)</label>
                <input type="text" value={endDate} onChange={e=>setEndDate(e.target.value)} placeholder="2026-07-26" style={inp}/>
              </div>
            </div>
            <button onClick={()=>{if(!endDate)return;initDays(daysCount);setStep(2);}} disabled={!endDate}
              style={{width:"100%",padding:"14px",borderRadius:14,background:endDate?"linear-gradient(135deg,#6D1B3B,#AD1457)":"rgba(255,255,255,0.1)",color:endDate?"#fff":"rgba(255,255,255,0.3)",border:"none",fontSize:15,fontWeight:700,cursor:endDate?"pointer":"default",fontFamily:"inherit"}}>
              Toliau → Sudėlioti pratimus
            </button>
          </div>
        )}

        {step===2&&(
          <div>
            <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 12px"}}>2. Pratimai kiekvienai dienai</p>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:4}}>
              {days.map((d,i)=>(
                <button key={i} onClick={()=>setActiveDay(i)} style={{padding:"8px 14px",borderRadius:20,border:"none",background:activeDay===i?"#AD1457":"rgba(255,255,255,0.12)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
                  {d.day_label}{d.exercises.length>0&&<span style={{marginLeft:4,fontSize:10,opacity:0.7}}>({d.exercises.length})</span>}
                </button>
              ))}
            </div>

            <input value={days[activeDay]?.day_label||""} onChange={e=>setDays(prev=>prev.map((d,i)=>i===activeDay?{...d,day_label:e.target.value}:d))}
              style={{...inp,marginBottom:12,fontWeight:700}} placeholder="Dienos pavadinimas"/>

            {days[activeDay]?.exercises.length===0?(
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:"20px",textAlign:"center",border:"2px dashed rgba(255,255,255,0.15)",marginBottom:12}}>
                <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,margin:0}}>Dar nėra pratimų</p>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {days[activeDay].exercises.map((ex,j)=>(
                  <div key={j} style={{background:"rgba(255,255,255,0.08)",borderRadius:12,padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <p style={{fontSize:13,fontWeight:600,color:"#fff",margin:"0 0 2px"}}>{ex.exercise_name}</p>
                      <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{ex.category==="cardio"?`⏱ ${ex.duration_min||"–"} min`:`${ex.sets||"–"} × ${ex.reps||"–"}${ex.weight_kg?` · ${ex.weight_kg} kg`:""}`}</p>
                    </div>
                    <button onClick={()=>removeExercise(activeDay,j)} style={{background:"rgba(255,100,100,0.15)",border:"1px solid rgba(255,100,100,0.3)",borderRadius:8,padding:"6px 10px",color:"#FF8888",cursor:"pointer",fontSize:12}}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={()=>setShowPicker(true)} style={{width:"100%",padding:"12px",borderRadius:14,background:"rgba(255,255,255,0.1)",border:"2px dashed rgba(255,255,255,0.25)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>
              + Pridėti pratimą
            </button>

            <button onClick={handleSave} disabled={saving||!canSave}
              style={{width:"100%",padding:"14px",borderRadius:14,background:canSave?"linear-gradient(135deg,#6D1B3B,#AD1457)":"rgba(255,255,255,0.1)",color:canSave?"#fff":"rgba(255,255,255,0.3)",border:"none",fontSize:15,fontWeight:700,cursor:canSave?"pointer":"default",fontFamily:"inherit",opacity:saving?0.7:1}}>
              {saving?"Saugoma...":"💾 Išsaugoti planą"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
