import { useState, useEffect } from "react";
import { pb } from "./pb";

const PK = { dark:"#6D1B3B", mid:"#AD1457", blush:"#F8BBD9" };
const DAY_NAMES = ["Pirmadienis","Antradienis","Trečiadienis","Ketvirtadienis","Penktadienis","Šeštadienis","Sekmadienis"];
const MUSCLE_GROUPS = ["Krūtinė","Nugara","Pečiai","Rankos","Kojos","Pilvas","Cardio"];
const inp = { padding:"9px 12px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" };

function ExercisePicker({ onAdd, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter]       = useState("Visi");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState({ sets:"3", reps:"12", weight_kg:"", duration_min:"" });
  const [showNew, setShowNew]     = useState(false);
  const [newEx, setNewEx]         = useState({ name:"", category:"strength", muscle:"Krūtinė" });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    pb.collection("exercises").getFullList({ sort: "muscle,name", requestKey: null })
      .then(setExercises).catch(()=>{});
  }, []);

  async function handleAddNew() {
    if (!newEx.name.trim()) return;
    setSaving(true);
    const rec = await pb.collection("exercises").create(newEx).catch(()=>null);
    if (rec) {
      setExercises(prev => [...prev, rec].sort((a,b)=>a.name.localeCompare(b.name)));
      setShowNew(false);
      setNewEx({ name:"", category:"strength", muscle:"Krūtinė" });
    }
    setSaving(false);
  }

  const filtered = exercises.filter(e =>
    (filter === "Visi" || e.muscle === filter) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  );
  const isCardio = selected?.category === "cardio";

  function handleAdd() {
    if (!selected) return;
    onAdd({
      exercise_name: selected.name,
      category:      selected.category,
      muscle:        selected.muscle,
      sets:          isCardio ? null : parseInt(form.sets)||null,
      reps:          isCardio ? null : parseInt(form.reps)||null,
      weight_kg:     isCardio ? null : parseFloat(form.weight_kg)||null,
      duration_min:  isCardio ? parseInt(form.duration_min)||null : null,
    });
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:480, margin:"0 auto", background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)", borderRadius:"24px 24px 0 0", padding:"20px 16px 40px", maxHeight:"90vh", overflowY:"auto" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <p style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>
            {showNew ? "Naujas pratimas" : selected ? "Parametrai" : "Pasirinkti pratimą"}
          </p>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"6px 12px", color:"#fff", cursor:"pointer" }}>✕</button>
        </div>

        {/* Naujo pratimo forma */}
        {showNew && (
          <div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:5 }}>Pavadinimas</label>
              <input value={newEx.name} onChange={e=>setNewEx(p=>({...p,name:e.target.value}))} placeholder="pvz. Sumo pritūpimai" style={inp} />
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:5 }}>Kategorija</label>
              <div style={{ display:"flex", gap:8 }}>
                {["strength","cardio"].map(c => (
                  <button key={c} onClick={()=>setNewEx(p=>({...p,category:c,muscle:c==="cardio"?"Cardio":p.muscle==="Cardio"?"Krūtinė":p.muscle}))}
                    style={{ flex:1, padding:"10px", borderRadius:10, border:`2px solid ${newEx.category===c?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.2)"}`, background:newEx.category===c?"rgba(255,255,255,0.2)":"transparent", color:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:700 }}>
                    {c==="strength"?"💪 Svoris":"🏃 Cardio"}
                  </button>
                ))}
              </div>
            </div>
            {newEx.category==="strength" && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:5 }}>Raumenų grupė</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {MUSCLE_GROUPS.filter(g=>g!=="Cardio").map(g => (
                    <button key={g} onClick={()=>setNewEx(p=>({...p,muscle:g}))}
                      style={{ padding:"6px 12px", borderRadius:20, border:"none", background:newEx.muscle===g?"#AD1457":"rgba(255,255,255,0.12)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{g}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowNew(false)} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.3)", background:"transparent", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Atšaukti</button>
              <button onClick={handleAddNew} disabled={saving||!newEx.name.trim()} style={{ flex:2, padding:"12px", borderRadius:12, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                {saving?"Saugoma...":"💾 Išsaugoti"}
              </button>
            </div>
          </div>
        )}

        {/* Pratimų sąrašas */}
        {!showNew && !selected && (
          <>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ieškoti pratimo..." style={{ ...inp, marginBottom:10 }} />
            <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:10, paddingBottom:4 }}>
              {["Visi",...MUSCLE_GROUPS].map(g => (
                <button key={g} onClick={()=>setFilter(g)} style={{ padding:"6px 12px", borderRadius:20, border:"none", background:filter===g?"#AD1457":"rgba(255,255,255,0.12)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" }}>{g}</button>
              ))}
            </div>
            <button onClick={()=>setShowNew(true)} style={{ width:"100%", padding:"10px", marginBottom:10, borderRadius:12, border:"2px dashed rgba(255,255,255,0.3)", background:"transparent", color:"rgba(255,255,255,0.7)", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              + Pridėti naują pratimą į duomenų bazę
            </button>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {filtered.map(ex => (
                <button key={ex.id} onClick={()=>setSelected(ex)} style={{ padding:"11px 14px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, color:"#fff", cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:600 }}>{ex.name}</span>
                    <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginLeft:8 }}>{ex.muscle}</span>
                  </div>
                  <span style={{ fontSize:11, color:ex.category==="cardio"?"#89CFF0":"#FFB3C6", background:"rgba(255,255,255,0.1)", padding:"2px 8px", borderRadius:6 }}>{ex.category==="cardio"?"Cardio":"Svoris"}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Parametrų forma */}
        {!showNew && selected && (
          <div>
            <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 14px", marginBottom:14 }}>
              <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>{selected.name}</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0 }}>{selected.muscle}</p>
            </div>
            {isCardio ? (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:5 }}>Trukmė (minutės)</label>
                <input type="number" value={form.duration_min} onChange={e=>setForm(f=>({...f,duration_min:e.target.value}))} placeholder="pvz. 30" style={inp} />
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                {[{k:"sets",l:"Serijos"},{k:"reps",l:"Kartojimai"},{k:"weight_kg",l:"Svoris (kg)"}].map(f => (
                  <div key={f.k}>
                    <label style={{ fontSize:11, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:5 }}>{f.l}</label>
                    <input type="number" value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder="–" style={inp} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setSelected(null)} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.3)", background:"transparent", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>← Atgal</button>
              <button onClick={handleAdd} style={{ flex:2, padding:"12px", borderRadius:12, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>+ Pridėti</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkoutPlanBuilder({ client, onClose, onSaved }) {
  const [step, setStep]             = useState(1);
  const [daysCount, setDaysCount]   = useState(3);
  const [validUntil, setValidUntil] = useState("");
  const [planName, setPlanName]     = useState("");
  const [days, setDays]             = useState([]);
  const [activeDay, setActiveDay]   = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving]         = useState(false);

  function initDays(count) {
    setDays(Array.from({length:count}, (_,i) => ({ day_number:i+1, day_name:DAY_NAMES[i]||`${i+1} diena`, exercises:[] })));
    setActiveDay(0);
  }

  function handleStep1() {
    if (!validUntil) return;
    initDays(daysCount);
    setStep(2);
  }

  function addExercise(ex) {
    setDays(prev => prev.map((d,i) => i===activeDay ? {...d, exercises:[...d.exercises, {...ex, order:d.exercises.length}]} : d));
    setShowPicker(false);
  }

  function removeExercise(dayIdx, exIdx) {
    setDays(prev => prev.map((d,i) => i===dayIdx ? {...d, exercises:d.exercises.filter((_,j)=>j!==exIdx)} : d));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const plan = await pb.collection("workout_plans").create({
        user_id: client.id, plan_name: planName||`${client.name} planas`,
        days_count: daysCount, valid_until: validUntil,
        created_by: pb.authStore.model?.id, is_active: true,
      });
      for (const day of days) {
        const dayRec = await pb.collection("workout_plan_days").create({ plan_id:plan.id, day_number:day.day_number, day_name:day.day_name });
        for (const ex of day.exercises) {
          await pb.collection("workout_plan_exercises").create({ day_id:dayRec.id, exercise_name:ex.exercise_name, category:ex.category, muscle:ex.muscle, sets:ex.sets, reps:ex.reps, weight_kg:ex.weight_kg, duration_min:ex.duration_min, order:ex.order });
        }
      }
      onSaved?.(); onClose();
    } catch(e) { console.error(e); alert("Klaida išsaugant planą"); }
    setSaving(false);
  }

  const inp2 = { padding:"11px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {showPicker && <ExercisePicker onAdd={addExercise} onClose={()=>setShowPicker(false)} />}
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", padding:"16px 20px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer" }}>← Atgal</button>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>Sporto planas</h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{client.name}</p>
        </div>
      </div>
      <div style={{ maxWidth:480, margin:"0 auto", padding:"16px" }}>
        {step===1 && (
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 16px" }}>Plano parametrai</p>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:6 }}>Plano pavadinimas (nebūtina)</label>
              <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder={`${client.name} planas`} style={inp2} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:8 }}>Dienų skaičius per savaitę</label>
              <div style={{ display:"flex", gap:8 }}>
                {[2,3,4,5,6].map(n => (
                  <button key={n} onClick={()=>setDaysCount(n)} style={{ flex:1, aspectRatio:"1", borderRadius:12, border:`2px solid ${daysCount===n?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.2)"}`, background:daysCount===n?"rgba(255,255,255,0.2)":"transparent", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ fontSize:12, color:"rgba(255,255,255,0.7)", display:"block", marginBottom:6 }}>Galioja iki</label>
              <input type="date" value={validUntil} onChange={e=>setValidUntil(e.target.value)} style={inp2} />
            </div>
            <button onClick={handleStep1} disabled={!validUntil} style={{ width:"100%", padding:"14px", borderRadius:14, background:validUntil?"linear-gradient(135deg,#6D1B3B,#AD1457)":"rgba(255,255,255,0.1)", color:validUntil?"#fff":"rgba(255,255,255,0.3)", border:"none", fontSize:15, fontWeight:700, cursor:validUntil?"pointer":"default", fontFamily:"inherit" }}>
              Toliau → Sudėlioti pratimus
            </button>
          </div>
        )}
        {step===2 && (
          <div>
            <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:16, paddingBottom:4 }}>
              {days.map((d,i) => (
                <button key={i} onClick={()=>setActiveDay(i)} style={{ padding:"8px 14px", borderRadius:20, border:"none", background:activeDay===i?"#AD1457":"rgba(255,255,255,0.12)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit", flexShrink:0 }}>
                  {d.day_name}{d.exercises.length>0&&<span style={{ marginLeft:5, fontSize:10, opacity:0.7 }}>({d.exercises.length})</span>}
                </button>
              ))}
            </div>
            <input value={days[activeDay]?.day_name||""} onChange={e=>setDays(prev=>prev.map((d,i)=>i===activeDay?{...d,day_name:e.target.value}:d))} style={{ ...inp2, marginBottom:14, fontSize:13, fontWeight:700 }} />
            {days[activeDay]?.exercises.length===0 ? (
              <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"24px 16px", textAlign:"center", border:"2px dashed rgba(255,255,255,0.15)", marginBottom:12 }}>
                <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, margin:0 }}>Dar nėra pratimų šiai dienai</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                {days[activeDay].exercises.map((ex,j) => (
                  <div key={j} style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"12px 14px", border:"1px solid rgba(255,255,255,0.12)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:600, color:"#fff", margin:"0 0 3px" }}>{ex.exercise_name}</p>
                      <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0 }}>{ex.category==="cardio"?`⏱ ${ex.duration_min||"–"} min`:`${ex.sets||"–"} × ${ex.reps||"–"}${ex.weight_kg?` · ${ex.weight_kg} kg`:""}`}</p>
                    </div>
                    <button onClick={()=>removeExercise(activeDay,j)} style={{ background:"rgba(255,100,100,0.15)", border:"1px solid rgba(255,100,100,0.3)", borderRadius:8, padding:"6px 10px", color:"#FF8888", cursor:"pointer", fontSize:12 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={()=>setShowPicker(true)} style={{ width:"100%", padding:"13px", borderRadius:14, background:"rgba(255,255,255,0.1)", border:"2px dashed rgba(255,255,255,0.25)", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginBottom:16 }}>+ Pridėti pratimą</button>
            <button onClick={handleSave} disabled={saving||days.every(d=>d.exercises.length===0)} style={{ width:"100%", padding:"14px", borderRadius:14, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:saving?0.7:1 }}>
              {saving?"Saugoma...":"💾 Išsaugoti planą"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
