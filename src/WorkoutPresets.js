import { useState, useEffect } from "react";
import { pb } from "./pb";
import { ExerciseSummary } from "./WorkoutPlanBuilder";
import { Close, Muscle, Walk, Save, ChevronLeft, Timer, Clipboard, Edit, Trash, Check, PlayCircle } from "./ui/icons";

const inp = { padding:"10px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" };
const DAY_NAMES = ["Pirmadienis","Antradienis","Trečiadienis","Ketvirtadienis","Penktadienis","Šeštadienis","Sekmadienis"];
const MUSCLE_GROUPS = ["Krūtinė","Nugara","Pečiai","Rankos","Kojos","Pilvas","Cardio"];

function ExercisePicker({ onAdd, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter]       = useState("Visi");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState({ sets:"3", reps:"12", weight_kg:"", duration_min:"", duration_sec:"" });
  const [perSet, setPerSet]       = useState(false);
  const [setWeights, setSetWeights] = useState(["","",""]);
  const [showNew, setShowNew]     = useState(false);
  const [newEx, setNewEx]         = useState({ name:"", category:"strength", muscle:"Krūtinė" });
  const [saving, setSaving]       = useState(false);
  const [videoUrl, setVideoUrl]   = useState("");
  const [timedMode, setTimedMode] = useState(false);

  useEffect(() => {
    pb.collection("exercises").getFullList({ sort:"muscle,name", requestKey:null }).then(setExercises).catch(()=>{});
  }, []);

  function selectExercise(ex) {
    setSelected(ex);
    setVideoUrl(ex.video_url || "");
    setTimedMode(false);
  }

  function handleSetsChange(val) {
    setForm(f => ({...f, sets: val}));
    const n = parseInt(val) || 0;
    setSetWeights(prev => {
      const arr = [...prev];
      while (arr.length < n) arr.push(arr[arr.length-1] || "");
      return arr.slice(0, n);
    });
  }

  async function handleAddNew() {
    if (!newEx.name.trim()) return;
    setSaving(true);
    const rec = await pb.collection("exercises").create(newEx).catch(()=>null);
    if (rec) { setExercises(prev=>[...prev,rec].sort((a,b)=>a.name.localeCompare(b.name))); setShowNew(false); setNewEx({name:"",category:"strength",muscle:"Krūtinė"}); }
    setSaving(false);
  }

  const filtered = exercises.filter(e => (filter==="Visi"||e.muscle===filter) && (!search||e.name.toLowerCase().includes(search.toLowerCase())));
  const isCardio = selected?.category==="cardio";
  const isAbs = selected?.muscle==="Pilvas" && !isCardio;
  const isTimedAbs = isAbs && timedMode;

  function handleAdd() {
    if (!selected) return;
    const sets = isCardio ? null : (parseInt(form.sets) || null);
    let weight_kg = (isCardio || isTimedAbs) ? null : (parseFloat(String(form.weight_kg).replace(",",".")) || null);
    let set_weights = null;
    if (!isCardio && !isTimedAbs && perSet && sets) {
      const parsed = setWeights.slice(0,sets).map(w => parseFloat(String(w).replace(",",".")) || 0);
      set_weights = JSON.stringify(parsed);
      weight_kg = parsed[0] || weight_kg;
    }
    const trimmedVideo = videoUrl.trim();
    if (trimmedVideo !== (selected.video_url || "")) {
      pb.collection("exercises").update(selected.id, { video_url: trimmedVideo || null }).catch(()=>{});
    }
    onAdd({ exercise_name:selected.name, category:selected.category, muscle:selected.muscle,
      sets, reps:(isCardio || isTimedAbs)?null:(parseInt(form.reps)||null),
      weight_kg, set_weights,
      duration_min:isCardio?(parseInt(form.duration_min)||null):null,
      duration_sec:isTimedAbs?(parseInt(form.duration_sec)||null):null });
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)",borderRadius:"24px 24px 0 0",padding:"20px 16px 40px",maxHeight:"90vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>{showNew?"Naujas pratimas":selected?"Parametrai":"Pasirinkti pratimą"}</p>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center"}}><Close size={14} /></button>
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
                  style={{flex:1,padding:"10px",borderRadius:10,border:`2px solid ${newEx.category===c?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.2)"}`,background:newEx.category===c?"rgba(255,255,255,0.2)":"transparent",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  {c==="strength"?<><Muscle size={14} />Svoris</>:<><Walk size={14} />Cardio</>}
                </button>
              ))}
            </div>
            {newEx.category==="strength"&&(
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                {MUSCLE_GROUPS.filter(g=>g!=="Cardio").map(g=>(
                  <button key={g} onClick={()=>setNewEx(p=>({...p,muscle:g}))}
                    style={{padding:"6px 12px",borderRadius:20,border:"none",background:newEx.muscle===g?"#AD1457":"rgba(255,255,255,0.12)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{g}</button>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowNew(false)} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid rgba(255,255,255,0.3)",background:"transparent",color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Atšaukti</button>
              <button onClick={handleAddNew} disabled={saving||!newEx.name.trim()} style={{flex:2,padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                {saving?"Saugoma...":<><Save size={15} />Išsaugoti</>}
              </button>
            </div>
          </div>
        )}
        {!showNew && !selected && (
          <>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ieškoti..." style={{...inp,marginBottom:10}}/>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:10,paddingBottom:4}}>
              {["Visi",...MUSCLE_GROUPS].map(g=>(
                <button key={g} onClick={()=>setFilter(g)} style={{padding:"6px 12px",borderRadius:20,border:"none",background:filter===g?"#AD1457":"rgba(255,255,255,0.12)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>{g}</button>
              ))}
            </div>
            <button onClick={()=>setShowNew(true)} style={{width:"100%",padding:"10px",marginBottom:10,borderRadius:12,border:"2px dashed rgba(255,255,255,0.3)",background:"transparent",color:"rgba(255,255,255,0.7)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>+ Pridėti naują pratimą į duomenų bazę</button>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {filtered.map(ex=>(
                <button key={ex.id} onClick={()=>selectExercise(ex)} style={{padding:"11px 14px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,color:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{fontSize:13,fontWeight:600}}>{ex.name}</span><span style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginLeft:8}}>{ex.muscle}</span></div>
                  <span style={{fontSize:11,color:ex.category==="cardio"?"#89CFF0":"#FFB3C6",background:"rgba(255,255,255,0.1)",padding:"2px 8px",borderRadius:6}}>{ex.category==="cardio"?"Cardio":"Svoris"}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {!showNew && selected && (
          <div>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{selected.name}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{selected.muscle}</p>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",gap:5,marginBottom:5}}><PlayCircle size={12} />Video nuoroda (nebūtina)</label>
              <input type="url" value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="pvz. YouTube nuoroda" style={inp}/>
              {selected.video_url && (
                <a href={selected.video_url} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:6,fontSize:11,color:"#89CFF0",textDecoration:"underline"}}>
                  <PlayCircle size={11} />Peržiūrėti dabartinį vaizdą
                </a>
              )}
            </div>
            {isAbs && (
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <button onClick={()=>setTimedMode(false)} style={{flex:1,padding:"9px 0",borderRadius:10,border:`1.5px solid ${!timedMode?"#AD1457":"rgba(255,255,255,0.2)"}`,background:!timedMode?"rgba(173,20,87,0.2)":"rgba(255,255,255,0.06)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Kartojimai</button>
                <button onClick={()=>setTimedMode(true)} style={{flex:1,padding:"9px 0",borderRadius:10,border:`1.5px solid ${timedMode?"#AD1457":"rgba(255,255,255,0.2)"}`,background:timedMode?"rgba(173,20,87,0.2)":"rgba(255,255,255,0.06)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Sekundėmis</button>
              </div>
            )}
            {isCardio?(
              <div style={{marginBottom:14}}>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Trukmė (minutės)</label>
                <input type="number" value={form.duration_min} onChange={e=>setForm(f=>({...f,duration_min:e.target.value}))} placeholder="30" style={inp}/>
              </div>
            ):isTimedAbs?(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div>
                  <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Serijos</label>
                  <input type="number" value={form.sets} onChange={e=>setForm(f=>({...f,sets:e.target.value}))} placeholder="3" style={inp}/>
                </div>
                <div>
                  <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Trukmė (sekundės)</label>
                  <input type="number" value={form.duration_sec} onChange={e=>setForm(f=>({...f,duration_sec:e.target.value}))} placeholder="30" style={inp}/>
                </div>
              </div>
            ):(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                  <div>
                    <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Serijos</label>
                    <input type="number" value={form.sets} onChange={e=>handleSetsChange(e.target.value)} placeholder="3" style={inp}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Kartojimai</label>
                    <input type="number" value={form.reps} onChange={e=>setForm(p=>({...p,reps:e.target.value}))} placeholder="12" style={inp}/>
                  </div>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <label style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>Svoris</label>
                    <button onClick={()=>setPerSet(p=>!p)} style={{padding:"4px 10px",borderRadius:20,border:"none",background:perSet?"#AD1457":"rgba(255,255,255,0.15)",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                      {perSet?<><Check size={10} />Skirtingi svoriai</>:"Skirtingi svoriai"}
                    </button>
                  </div>
                  {!perSet ? (
                    <input type="text" inputMode="decimal" value={form.weight_kg} onChange={e=>setForm(p=>({...p,weight_kg:e.target.value}))} placeholder="kg" style={inp}/>
                  ) : (
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {setWeights.slice(0, parseInt(form.sets)||3).map((w,i) => (
                        <div key={i} style={{flex:"1 1 60px",minWidth:60}}>
                          <label style={{fontSize:10,color:"rgba(255,255,255,0.5)",display:"block",marginBottom:4}}>S{i+1}</label>
                          <input type="text" inputMode="decimal" value={w} onChange={e=>{const arr=[...setWeights]; arr[i]=e.target.value; setSetWeights(arr);}} placeholder="kg" style={{...inp,textAlign:"center",padding:"8px 6px"}}/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setSelected(null)} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid rgba(255,255,255,0.3)",background:"transparent",color:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><ChevronLeft size={14} />Atgal</button>
              <button onClick={handleAdd} style={{flex:2,padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Pridėti</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Esamo pratimo parametrų redagavimas ───────────────────────────────────────
function ExerciseEditModal({ exercise, onSave, onClose }) {
  const isCardio = exercise.category === "cardio";

  const initSetWeights = () => {
    if (exercise.set_weights) {
      try { return JSON.parse(exercise.set_weights).map(String); } catch {}
    }
    const n = parseInt(exercise.sets) || 3;
    const w = exercise.weight_kg ? String(exercise.weight_kg) : "";
    return Array(n).fill(w);
  };

  const [form, setForm] = useState({
    sets: exercise.sets ?? "",
    reps: exercise.reps ?? "",
    weight_kg: exercise.weight_kg ?? "",
    duration_min: exercise.duration_min ?? "",
    duration_sec: exercise.duration_sec ?? "",
  });
  const [perSet, setPerSet]         = useState(!!exercise.set_weights);
  const [setWeights, setSetWeights] = useState(initSetWeights);
  const isAbs = exercise.muscle==="Pilvas" && !isCardio;
  const [timedMode, setTimedMode] = useState(!!exercise.duration_sec);
  const isTimedAbs = isAbs && timedMode;

  function handleSetsChange(val) {
    setForm(f => ({...f, sets: val}));
    const n = parseInt(val) || 0;
    setSetWeights(prev => {
      const arr = [...prev];
      while (arr.length < n) arr.push(arr[arr.length-1] || "");
      return arr.slice(0, n);
    });
  }

  function handleSave() {
    const sets = isCardio ? null : (parseInt(form.sets) || null);
    let weight_kg = (isCardio || isTimedAbs) ? null : (parseFloat(String(form.weight_kg).replace(",",".")) || null);
    let set_weights = null;
    if (!isCardio && !isTimedAbs && perSet && sets) {
      const parsed = setWeights.slice(0,sets).map(w => parseFloat(String(w).replace(",",".")) || 0);
      set_weights = JSON.stringify(parsed);
      weight_kg = parsed[0] || weight_kg;
    }
    onSave({ ...exercise, sets, reps: (isCardio || isTimedAbs)?null:(parseInt(form.reps)||null), weight_kg, set_weights: (isCardio || isTimedAbs)?null:set_weights, duration_min: isCardio?(parseInt(form.duration_min)||null):null, duration_sec: isTimedAbs?(parseInt(form.duration_sec)||null):null });
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:1150,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)",borderRadius:"24px 24px 0 0",padding:"20px 16px 40px",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>Redaguoti parametrus</p>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center"}}><Close size={14} /></button>
        </div>
        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
          <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{exercise.exercise_name}</p>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{exercise.muscle}</p>
        </div>
        {isAbs && (
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            <button onClick={()=>setTimedMode(false)} style={{flex:1,padding:"9px 0",borderRadius:10,border:`1.5px solid ${!timedMode?"#AD1457":"rgba(255,255,255,0.2)"}`,background:!timedMode?"rgba(173,20,87,0.2)":"rgba(255,255,255,0.06)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Kartojimai</button>
            <button onClick={()=>setTimedMode(true)} style={{flex:1,padding:"9px 0",borderRadius:10,border:`1.5px solid ${timedMode?"#AD1457":"rgba(255,255,255,0.2)"}`,background:timedMode?"rgba(173,20,87,0.2)":"rgba(255,255,255,0.06)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Sekundėmis</button>
          </div>
        )}
        {isCardio ? (
          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Trukmė (minutės)</label>
            <input type="number" value={form.duration_min} onChange={e=>setForm(f=>({...f,duration_min:e.target.value}))} placeholder="30" style={inp}/>
          </div>
        ) : isTimedAbs ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Serijos</label>
              <input type="number" value={form.sets} onChange={e=>setForm(f=>({...f,sets:e.target.value}))} placeholder="3" style={inp}/>
            </div>
            <div>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Trukmė (sekundės)</label>
              <input type="number" value={form.duration_sec} onChange={e=>setForm(f=>({...f,duration_sec:e.target.value}))} placeholder="30" style={inp}/>
            </div>
          </div>
        ) : (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Serijos</label>
                <input type="number" value={form.sets} onChange={e=>handleSetsChange(e.target.value)} placeholder="3" style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Kartojimai</label>
                <input type="number" value={form.reps} onChange={e=>setForm(p=>({...p,reps:e.target.value}))} placeholder="12" style={inp}/>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>Svoris</label>
                <button onClick={()=>setPerSet(p=>!p)} style={{padding:"4px 10px",borderRadius:20,border:"none",background:perSet?"#AD1457":"rgba(255,255,255,0.15)",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                  {perSet ? <><Check size={10} />Skirtingi svoriai</> : "Skirtingi svoriai"}
                </button>
              </div>
              {!perSet ? (
                <input type="text" inputMode="decimal" value={form.weight_kg} onChange={e=>setForm(p=>({...p,weight_kg:e.target.value}))} placeholder="kg" style={inp}/>
              ) : (
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {setWeights.slice(0, parseInt(form.sets)||3).map((w,i) => (
                    <div key={i} style={{flex:"1 1 60px",minWidth:60}}>
                      <label style={{fontSize:10,color:"rgba(255,255,255,0.5)",display:"block",marginBottom:4}}>S{i+1}</label>
                      <input type="text" inputMode="decimal" value={w} onChange={e=>{const arr=[...setWeights]; arr[i]=e.target.value; setSetWeights(arr);}} placeholder="kg" style={{...inp,textAlign:"center",padding:"8px 6px"}}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        <button onClick={handleSave} style={{width:"100%",padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Save size={15} />Išsaugoti pakeitimus
        </button>
      </div>
    </div>
  );
}

// ── Šablono kūrimo/redagavimo forma ───────────────────────────────────────────
function PresetEditor({ preset, onClose, onSaved }) {
  const isNew = !preset;
  const [name, setName]           = useState(preset?.name || "");
  const [daysCount, setDaysCount] = useState(preset?.days_count || 3);
  const [days, setDays]           = useState([]);
  const [activeDay, setActiveDay] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      setDays(Array.from({length:daysCount},(_,i)=>({ day_number:i+1, day_label:`${i+1} diena`, exercises:[] })));
      return;
    }
    // Krauti esamą šabloną
    pb.collection("workout_preset_days").getFullList({ filter:`preset_id="${preset.id}"`, sort:"day_number", requestKey:null })
      .then(async dbDays => {
        const fullDays = await Promise.all(dbDays.map(async d => {
          const exs = await pb.collection("workout_preset_exercises").getFullList({ filter:`day_id="${d.id}"`, sort:"order_num", requestKey:null }).catch(()=>[]);
          return { day_number:d.day_number, day_label:d.day_label, exercises: exs.map(e=>({ exercise_name:e.exercise_name, category:e.category, muscle:e.muscle, sets:e.sets, reps:e.reps, weight_kg:e.weight_kg, duration_min:e.duration_min, duration_sec:e.duration_sec, set_weights:e.set_weights||null })) };
        }));
        setDays(fullDays);
        setLoading(false);
      }).catch(()=>setLoading(false));
  }, [preset?.id]);

  function removeExercise(dayIdx, exIdx) {
    setDays(prev=>prev.map((d,i)=>i===dayIdx?{...d,exercises:d.exercises.filter((_,j)=>j!==exIdx)}:d));
  }

  async function handleSave() {
    if (!name.trim() || days.every(d=>d.exercises.length===0)) return;
    setSaving(true);
    try {
      let presetId;
      if (isNew) {
        const rec = await pb.collection("workout_presets").create({ name: name.trim(), days_count: days.length, created_by: pb.authStore.model?.id });
        presetId = rec.id;
      } else {
        await pb.collection("workout_presets").update(preset.id, { name: name.trim(), days_count: days.length });
        presetId = preset.id;
        // Ištrinti senas dienas/pratimus (perkuriame iš naujo)
        const oldDays = await pb.collection("workout_preset_days").getFullList({ filter:`preset_id="${presetId}"`, requestKey:null });
        for (const od of oldDays) {
          const oldExs = await pb.collection("workout_preset_exercises").getFullList({ filter:`day_id="${od.id}"`, requestKey:null });
          for (const oe of oldExs) await pb.collection("workout_preset_exercises").delete(oe.id).catch(()=>{});
          await pb.collection("workout_preset_days").delete(od.id).catch(()=>{});
        }
      }
      for (const day of days) {
        const dayRec = await pb.collection("workout_preset_days").create({ preset_id:presetId, day_number:day.day_number, day_label:day.day_label });
        for (let i=0;i<day.exercises.length;i++) {
          const ex = day.exercises[i];
          await pb.collection("workout_preset_exercises").create({ day_id:dayRec.id, exercise_name:ex.exercise_name, category:ex.category, muscle:ex.muscle, sets:ex.sets, reps:ex.reps, weight_kg:ex.weight_kg, duration_min:ex.duration_min, duration_sec:ex.duration_sec||null, order_num:i, set_weights:ex.set_weights||null });
        }
      }
      onSaved?.(); onClose();
    } catch(e) { console.error(e); alert("Klaida išsaugant šabloną"); }
    setSaving(false);
  }

  if (loading) return (
    <div style={{position:"fixed",inset:0,zIndex:1050,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#fff"}}>Kraunama...</p>
    </div>
  );

  if (!days[activeDay]) return (
    <div style={{position:"fixed",inset:0,zIndex:1050,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <p style={{color:"#fff"}}>Kraunama...</p>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:1050,background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",overflowY:"auto",paddingBottom:80,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {showPicker && <ExercisePicker onAdd={ex=>{setDays(prev=>prev.map((d,i)=>i===activeDay?{...d,exercises:[...d.exercises,ex]}:d));setShowPicker(false);}} onClose={()=>setShowPicker(false)}/>}

      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>{isNew?"Naujas šablonas":"Redaguoti šabloną"}</h1>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:16}}>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:6}}>Šablono pavadinimas</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="pvz. 3 dienų jėgos planas" style={inp}/>
        </div>

        {isNew && (
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:8}}>Dienų skaičius</label>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4,5].map(n=>(
                <button key={n} onClick={()=>{ setDaysCount(n); setDays(Array.from({length:n},(_,i)=>({ day_number:i+1, day_label:`${i+1} diena`, exercises:[] }))); }} style={{flex:1,aspectRatio:"1",borderRadius:12,border:`2px solid ${daysCount===n?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.2)"}`,background:daysCount===n?"rgba(255,255,255,0.2)":"transparent",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{n}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
          {days.map((d,i)=>(
            <button key={i} onClick={()=>setActiveDay(i)} style={{padding:"8px 14px",borderRadius:20,border:"none",background:activeDay===i?"#AD1457":"rgba(255,255,255,0.12)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
              {d.day_label}{d.exercises.length>0&&<span style={{marginLeft:4,fontSize:10,opacity:0.7}}>({d.exercises.length})</span>}
            </button>
          ))}
        </div>

        <input value={days[activeDay]?.day_label||""} onChange={e=>setDays(prev=>prev.map((d,i)=>i===activeDay?{...d,day_label:e.target.value}:d))} style={{...inp,marginBottom:12,fontWeight:700}} placeholder="Dienos pavadinimas"/>

        {days[activeDay]?.exercises.length===0?(
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:"20px",textAlign:"center",border:"2px dashed rgba(255,255,255,0.15)",marginBottom:12}}>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:13,margin:0}}>Dar nėra pratimų</p>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
            {days[activeDay].exercises.map((ex,j)=>(
              <div key={j} onClick={()=>setEditingExercise({dayIdx:activeDay,exIdx:j,exercise:ex})} style={{background:"linear-gradient(160deg, rgba(255,110,180,0.1), rgba(255,255,255,0.05))",border:"1px solid rgba(255,110,180,0.18)",borderRadius:14,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                <div style={{display:"flex",flexDirection:"column",gap:3,marginRight:10,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>{ if(j===0)return; setDays(prev=>prev.map((d,i)=>{ if(i!==activeDay)return d; const exs=[...d.exercises]; [exs[j-1],exs[j]]=[exs[j],exs[j-1]]; return {...d,exercises:exs}; })); }} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:5,padding:"2px 6px",color:j===0?"rgba(255,255,255,0.2)":"#fff",cursor:j===0?"default":"pointer",fontSize:10,lineHeight:1}}>▲</button>
                  <button onClick={()=>{ if(j===days[activeDay].exercises.length-1)return; setDays(prev=>prev.map((d,i)=>{ if(i!==activeDay)return d; const exs=[...d.exercises]; [exs[j],exs[j+1]]=[exs[j+1],exs[j]]; return {...d,exercises:exs}; })); }} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:5,padding:"2px 6px",color:j===days[activeDay].exercises.length-1?"rgba(255,255,255,0.2)":"#fff",cursor:j===days[activeDay].exercises.length-1?"default":"pointer",fontSize:10,lineHeight:1}}>▼</button>
                </div>
                <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,marginRight:10,background:ex.category==="cardio"?"rgba(137,207,240,0.16)":"rgba(255,179,198,0.16)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {ex.category==="cardio" ? <Walk size={14} color="#89CFF0" /> : <Muscle size={14} color="#FFB3C6" />}
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:"0 0 4px"}}>{ex.exercise_name}</p>
                  <ExerciseSummary ex={ex} />
                </div>
                <button onClick={(e)=>{e.stopPropagation();removeExercise(activeDay,j);}} style={{background:"rgba(255,100,100,0.15)",border:"1px solid rgba(255,100,100,0.3)",borderRadius:8,padding:"6px 10px",color:"#FF8888",cursor:"pointer",fontSize:12,flexShrink:0,display:"flex",alignItems:"center",marginLeft:8}}><Close size={12} /></button>
              </div>
            ))}
          </div>
        )}

        {editingExercise && (
          <ExerciseEditModal
            exercise={editingExercise.exercise}
            onClose={()=>setEditingExercise(null)}
            onSave={(updated)=>{
              setDays(prev=>prev.map((d,i)=>i!==editingExercise.dayIdx?d:{...d,exercises:d.exercises.map((e,j)=>j===editingExercise.exIdx?updated:e)}));
              setEditingExercise(null);
            }}
          />
        )}

        <button onClick={()=>setShowPicker(true)} style={{width:"100%",padding:"12px",borderRadius:14,background:"rgba(255,255,255,0.1)",border:"2px dashed rgba(255,255,255,0.25)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>+ Pridėti pratimą</button>

        <button onClick={handleSave} disabled={saving||!name.trim()||days.every(d=>d.exercises.length===0)}
          style={{width:"100%",padding:"14px",borderRadius:14,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:saving?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {saving?"Saugoma...":<><Save size={15} />Išsaugoti šabloną</>}
        </button>
      </div>
    </div>
  );
}

// ── Šablonų sąrašas ────────────────────────────────────────────────────────────
export default function WorkoutPresets({ onClose }) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null=uždaryta, false=naujas, objektas=redaguoti

  function load() {
    setLoading(true);
    pb.collection("workout_presets").getFullList({ sort:"-created", requestKey:null })
      .then(data => { setPresets(data); setLoading(false); }).catch(()=>setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!window.confirm("Ištrinti šį šabloną?")) return;
    const days = await pb.collection("workout_preset_days").getFullList({ filter:`preset_id="${id}"`, requestKey:null });
    for (const d of days) {
      const exs = await pb.collection("workout_preset_exercises").getFullList({ filter:`day_id="${d.id}"`, requestKey:null });
      for (const e of exs) await pb.collection("workout_preset_exercises").delete(e.id).catch(()=>{});
      await pb.collection("workout_preset_days").delete(d.id).catch(()=>{});
    }
    await pb.collection("workout_presets").delete(id).catch(()=>{});
    load();
  }

  if (editing !== null) {
    return <PresetEditor preset={editing||null} onClose={()=>setEditing(null)} onSaved={load} />;
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:80,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0,display:"flex",alignItems:"center",gap:6}}><Clipboard size={15} />Treniruočių šablonai</h1>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:16}}>
        <button onClick={()=>setEditing(false)} style={{width:"100%",padding:"14px",marginBottom:16,borderRadius:16,background:"linear-gradient(135deg,#1a4731,#276749)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
          + Naujas šablonas
        </button>

        {loading && <p style={{color:"rgba(255,255,255,0.4)",textAlign:"center",padding:"24px 0"}}>Kraunama...</p>}
        {!loading && presets.length===0 && (
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:16,padding:"28px 16px",textAlign:"center",border:"2px dashed rgba(255,255,255,0.12)"}}>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>Šablonų dar nėra</p>
          </div>
        )}

        {presets.map(p => (
          <div key={p.id} style={{background:"rgba(255,255,255,0.08)",borderRadius:16,padding:"14px 16px",marginBottom:10,border:"1px solid rgba(255,255,255,0.15)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{p.name}</p>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:0}}>{p.days_count} d./sav.</p>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setEditing(p)} style={{flex:1,padding:"9px",borderRadius:10,border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Edit size={12} />Redaguoti</button>
              <button onClick={()=>handleDelete(p.id)} style={{padding:"9px 14px",borderRadius:10,border:"1px solid rgba(255,100,100,0.3)",background:"rgba(255,100,100,0.1)",color:"#FF8888",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center"}}><Trash size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}