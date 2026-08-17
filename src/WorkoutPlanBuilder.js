import { useState, useEffect } from "react";
import { pb } from "./pb";
import { Close, Muscle, Walk, Save, ChevronLeft, ChevronRight, Check, Sparkle, Clipboard, Timer, PlayCircle, MessageCircle } from "./ui/icons";

const PK = { dark:"#6D1B3B", mid:"#AD1457" };
const inp = { padding:"10px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" };
const sel = { padding:"9px 4px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:12, fontFamily:"inherit", outline:"none", flex:1, minWidth:0, width:0, WebkitAppearance:"none", textAlign:"center", boxSizing:"border-box" };

// Pratimo parametrų santrauka kaip kompaktiški "chip" ženkliukai, o ne viena
// ilga tanki teksto eilutė (pvz. "3 × 12 · S1:20kg S2:22.5kg S3:25kg") —
// naudojama visur, kur rodomas jau pridėtas pratimas (gyva treniruotė,
// sporto planas, šablonai), kad būtų lengviau nuskaityti vienu žvilgsniu.
export function ExerciseSummary({ ex }) {
  if (ex.category === "cardio") {
    return (
      <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, color:"#89CFF0", background:"rgba(137,207,240,0.12)", borderRadius:8, padding:"2px 7px" }}>
        <Timer size={10} />{ex.duration_min || "–"} min
      </span>
    );
  }
  if (ex.duration_sec) {
    return (
      <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, color:"#B39DFF", background:"rgba(179,157,255,0.14)", borderRadius:8, padding:"2px 7px" }}>
        <Timer size={10} />{ex.sets ? `${ex.sets} × ` : ""}{ex.duration_sec}s
      </span>
    );
  }
  let weights = null;
  if (ex.set_weights) {
    try { weights = JSON.parse(ex.set_weights).map(Number); } catch { /* naudoti weight_kg žemiau */ }
  }
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
      <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.55)" }}>{ex.sets || "–"}×{ex.reps || "–"}</span>
      {weights ? weights.map((w,i) => (
        <span key={i} style={{ fontSize:10, fontWeight:700, color:"#FFB3C6", background:"rgba(255,179,198,0.14)", borderRadius:7, padding:"2px 6px" }}>{w}kg</span>
      )) : ex.weight_kg ? (
        <span style={{ fontSize:10, fontWeight:700, color:"#FFB3C6", background:"rgba(255,179,198,0.14)", borderRadius:7, padding:"2px 6px" }}>{ex.weight_kg}kg</span>
      ) : null}
    </div>
  );
}

function DateSelect({ value, onChange, minDate }) {
  const today = new Date();
  const [y, m, d] = value ? value.split("-").map(Number) : [today.getFullYear(), today.getMonth()+1, today.getDate()];
  const years = Array.from({length:3}, (_,i) => today.getFullYear() + i);
  const months = Array.from({length:12}, (_,i) => i+1);
  const days = Array.from({length:new Date(y, m, 0).getDate()}, (_,i) => i+1);

  function update(ny, nm, nd) {
    const maxDay = new Date(ny, nm, 0).getDate();
    const safeDay = Math.min(nd, maxDay);
    const str = `${ny}-${String(nm).padStart(2,"0")}-${String(safeDay).padStart(2,"0")}`;
    onChange(str);
  }

  const MONTHS = ["Sau","Vas","Kov","Bal","Geg","Bir","Lie","Rugp","Rugs","Spa","Lap","Gru"];

  return (
    <div style={{display:"flex",gap:5,width:"100%",overflow:"hidden"}}>
      <select value={d} onChange={e=>update(y,m,parseInt(e.target.value))} style={sel}>
        {days.map(n=><option key={n} value={n} style={{background:"#3a0a20"}}>{n}</option>)}
      </select>
      <select value={m} onChange={e=>update(y,parseInt(e.target.value),d)} style={sel}>
        {months.map(n=><option key={n} value={n} style={{background:"#3a0a20"}}>{MONTHS[n-1]}</option>)}
      </select>
      <select value={y} onChange={e=>update(parseInt(e.target.value),m,d)} style={sel}>
        {years.map(n=><option key={n} value={n} style={{background:"#3a0a20"}}>{n}</option>)}
      </select>
    </div>
  );
}

export function ExercisePicker({ onAdd, onClose, lastPerf = {} }) {
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter]       = useState("Visi");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState({ sets:"3", reps:"12", weight_kg:"", duration_min:"", duration_sec:"" });
  const [perSet, setPerSet]       = useState(false);
  const [setWeights, setSetWeights] = useState(["","",""]);
  const [trainerNote, setTrainerNote] = useState("");
  const [showNew, setShowNew]     = useState(false);
  const [newEx, setNewEx]         = useState({ name:"", category:"strength", muscle:"Krūtinė" });
  const [saving, setSaving]       = useState(false);
  const [videoUrl, setVideoUrl]   = useState("");
  const [timedMode, setTimedMode] = useState(false);

  // Praeitą kartą atliktas šis pratimas (jei yra) — naudojama pasirinkus
  // pratimą, kad iš karto pasiūlytume tuos pačius skaičius kaip atskaitą.
  const lastEx = selected ? lastPerf[selected.name] : null;

  function selectExercise(ex) {
    setSelected(ex);
    setVideoUrl(ex.video_url || "");
    setTrainerNote("");
    const prev = lastPerf[ex.name];
    if (!prev) { setTimedMode(false); return; }
    if (ex.category === "cardio") {
      setForm(f => ({ ...f, duration_min: prev.duration_min ? String(prev.duration_min) : "" }));
      return;
    }
    setTimedMode(!!prev.duration_sec);
    setForm(f => ({ ...f, sets: prev.sets ? String(prev.sets) : f.sets, reps: prev.reps ? String(prev.reps) : f.reps, weight_kg: prev.weight_kg ? String(prev.weight_kg) : "", duration_sec: prev.duration_sec ? String(prev.duration_sec) : "" }));
    if (prev.set_weights) {
      try {
        const arr = JSON.parse(prev.set_weights).map(String);
        setPerSet(true);
        setSetWeights(arr);
      } catch { /* naudoti bendrą svorį */ }
    }
  }

  const MUSCLES = ["Krūtinė","Nugara","Pečiai","Rankos","Kojos","Pilvas","Cardio"];

  useEffect(() => {
    pb.collection("exercises").getFullList({ sort:"muscle,name", requestKey:null })
      .then(setExercises).catch(()=>{});
  }, []);

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

  const filtered = exercises.filter(e =>
    (filter==="Visi" || e.muscle===filter) &&
    (!search || e.name.toLowerCase().includes(search.toLowerCase()))
  );
  const isCardio = selected?.category==="cardio";
  // Bet kuris ne-kardio pratimas gali būti fiksuojamas laiku (ne vien kartojimais) —
  // ne tik pilvo pratimai, nes ir kitos raumenų grupės kartais atliekamos statiškai.
  const isAbs = !isCardio;
  const isTimedAbs = isAbs && timedMode;

  function handleAdd() {
    if (!selected) return;
    if (isTimedAbs && !form.duration_sec) return;
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
    onAdd({
      exercise_name: selected.name, category: selected.category, muscle: selected.muscle,
      sets, reps: (isCardio || isTimedAbs) ? null : (parseInt(form.reps)||null),
      weight_kg, set_weights,
      duration_min: isCardio?(parseInt(form.duration_min)||null):null,
      duration_sec: isTimedAbs?(parseInt(form.duration_sec)||null):null,
      trainer_note: trainerNote.trim() || null,
    });
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)",borderRadius:"24px 24px 0 0",padding:"20px 16px 40px",maxHeight:"90vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>{showNew?"Naujas pratimas":selected?"Parametrai":"Pasirinkti pratimą"}</p>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer"}}><Close size={14} /></button>
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
                {MUSCLES.filter(g=>g!=="Cardio").map(g=>(
                  <button key={g} onClick={()=>setNewEx(p=>({...p,muscle:g}))}
                    style={{padding:"6px 12px",borderRadius:20,border:"none",background:newEx.muscle===g?"#AD1457":"rgba(255,255,255,0.12)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{g}</button>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowNew(false)} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid rgba(255,255,255,0.3)",background:"transparent",color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Atšaukti</button>
              <button onClick={handleAddNew} disabled={saving||!newEx.name.trim()} style={{flex:2,padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                {saving?"Saugoma...":<><Save size={14} />Išsaugoti</>}
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
                <button key={ex.id} onClick={()=>selectExercise(ex)} style={{padding:"11px 14px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,color:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{fontSize:13,fontWeight:600}}>{ex.name}</span><span style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginLeft:8}}>{ex.muscle}</span></div>
                  <span style={{fontSize:11,color:ex.category==="cardio"?"#89CFF0":"#FFB3C6",background:"rgba(255,255,255,0.1)",padding:"2px 8px",borderRadius:6}}>{ex.category==="cardio"?"Cardio":"Svoris"}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {!showNew&&selected&&(
          <div>
            <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{selected.name}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{selected.muscle}</p>
            </div>
            <div style={{marginBottom:lastEx?8:14}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",gap:5,marginBottom:5}}><PlayCircle size={12} />Video nuoroda (nebūtina)</label>
              <input type="url" value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="pvz. YouTube nuoroda" style={inp}/>
              {selected.video_url && (
                <a href={selected.video_url} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:6,fontSize:11,color:"#89CFF0",textDecoration:"underline"}}>
                  <PlayCircle size={11} />Peržiūrėti dabartinį vaizdą
                </a>
              )}
            </div>
            {lastEx && (
              <div style={{background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.25)",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
                <p style={{fontSize:11,color:"#FFD700",margin:"0 0 7px",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
                  <Timer size={12} />Praeitą kartą ({lastEx.date?.slice(0,10)})
                </p>
                <ExerciseSummary ex={lastEx} />
                <p style={{fontSize:10,color:"rgba(255,215,0,0.6)",margin:"7px 0 0"}}>Reikšmės jau įrašytos žemiau, koreguokite jei reikia.</p>
              </div>
            )}
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
                      {perSet && <Check size={10} />}Skirtingi svoriai
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
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Komentaras klientui (nebūtina)</label>
              <textarea value={trainerNote} onChange={e=>setTrainerNote(e.target.value)} placeholder="pvz. Daryti lėtai, kontroliuojant judesį" rows={2} style={{...inp,resize:"none",fontFamily:"inherit"}}/>
            </div>
            {isTimedAbs && !form.duration_sec && (
              <p style={{fontSize:11,color:"#FFD700",margin:"-6px 0 12px"}}>Įrašykite trukmę sekundėmis, kad galėtumėte pridėti.</p>
            )}
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setSelected(null)} style={{flex:1,padding:"12px",borderRadius:12,border:"1.5px solid rgba(255,255,255,0.3)",background:"transparent",color:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><ChevronLeft size={14} />Atgal</button>
              <button onClick={handleAdd} disabled={isTimedAbs && !form.duration_sec} style={{flex:2,padding:"12px",borderRadius:12,background:(isTimedAbs && !form.duration_sec)?"rgba(255,255,255,0.15)":"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:(isTimedAbs && !form.duration_sec)?"default":"pointer",fontFamily:"inherit"}}>+ Pridėti</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Esamo pratimo parametrų redagavimas ───────────────────────────────────────
export function ExerciseEditModal({ exercise, onSave, onClose, lastPerf = {} }) {
  const isCardio = exercise.category === "cardio";
  const lastEx = lastPerf[exercise.exercise_name];

  // Parsiname esamus set_weights jei yra
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
  const [perSet, setPerSet]       = useState(!!exercise.set_weights);
  const [setWeights, setSetWeights] = useState(initSetWeights);
  const [trainerNote, setTrainerNote] = useState(exercise.trainer_note || "");
  // Bet kuris ne-kardio pratimas gali būti fiksuojamas laiku, ne tik pilvo.
  const isAbs = !isCardio;
  const [timedMode, setTimedMode] = useState(!!exercise.duration_sec);
  const isTimedAbs = isAbs && timedMode;

  // Kai keičiasi skaičius serijų — atnaujinti setWeights masyvą
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
    if (isTimedAbs && !form.duration_sec) return;
    const sets = isCardio ? null : (parseInt(form.sets) || null);
    let weight_kg = (isCardio || isTimedAbs) ? null : (parseFloat(String(form.weight_kg).replace(",",".")) || null);
    let set_weights = null;

    if (!isCardio && !isTimedAbs && perSet && sets) {
      const parsed = setWeights.slice(0,sets).map(w => parseFloat(String(w).replace(",",".")) || 0);
      set_weights = JSON.stringify(parsed);
      weight_kg = parsed[0] || weight_kg; // pirmas setas kaip pagrindinis
    }

    onSave({
      ...exercise,
      sets,
      reps: (isCardio || isTimedAbs) ? null : (parseInt(form.reps) || null),
      weight_kg,
      set_weights: (isCardio || isTimedAbs) ? null : set_weights,
      duration_min: isCardio ? (parseInt(form.duration_min) || null) : null,
      duration_sec: isTimedAbs ? (parseInt(form.duration_sec) || null) : null,
      trainer_note: trainerNote.trim() || null,
    });
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:1150,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"flex-end"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)",borderRadius:"24px 24px 0 0",padding:"20px 16px 40px",maxHeight:"85vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <p style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>Redaguoti parametrus</p>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer"}}><Close size={14} /></button>
        </div>
        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 14px",marginBottom:lastEx?8:14}}>
          <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{exercise.exercise_name}</p>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{exercise.muscle}</p>
        </div>
        {lastEx && (
          <div style={{background:"rgba(255,215,0,0.08)",border:"1px solid rgba(255,215,0,0.25)",borderRadius:12,padding:"10px 14px",marginBottom:14}}>
            <p style={{fontSize:11,color:"#FFD700",margin:"0 0 7px",fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
              <Timer size={12} />Praeitą kartą ({lastEx.date?.slice(0,10)})
            </p>
            <ExerciseSummary ex={lastEx} />
          </div>
        )}
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

            {/* Svoriai — bendras arba pagal setą */}
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.7)"}}>Svoris</label>
                <button onClick={()=>setPerSet(p=>!p)} style={{padding:"4px 10px",borderRadius:20,border:"none",background:perSet?"#AD1457":"rgba(255,255,255,0.15)",color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                  {perSet && <Check size={10} />}Skirtingi svoriai
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
        <div style={{marginBottom:16}}>
          <label style={{fontSize:11,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:5}}>Komentaras klientui (nebūtina)</label>
          <textarea value={trainerNote} onChange={e=>setTrainerNote(e.target.value)} placeholder="pvz. Daryti lėtai, kontroliuojant judesį" rows={2} style={{...inp,resize:"none",fontFamily:"inherit"}}/>
        </div>
        {isTimedAbs && !form.duration_sec && (
          <p style={{fontSize:11,color:"#FFD700",margin:"-8px 0 12px"}}>Įrašykite trukmę sekundėmis, kad galėtumėte išsaugoti.</p>
        )}
        <button onClick={handleSave} disabled={isTimedAbs && !form.duration_sec} style={{width:"100%",padding:"12px",borderRadius:12,background:(isTimedAbs && !form.duration_sec)?"rgba(255,255,255,0.15)":"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:(isTimedAbs && !form.duration_sec)?"default":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Save size={14} />Išsaugoti pakeitimus
        </button>
      </div>
    </div>
  );
}

export default function WorkoutPlanBuilder({ client, onClose, onSaved }) {
  const [step, setStep]           = useState(0); // 0=šablono pasirinkimas, 1=parametrai, 2=pratimai
  const [presets, setPresets]     = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [planName, setPlanName]   = useState("");
  const [daysCount, setDaysCount] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate]     = useState("");
  const [days, setDays]           = useState([]);
  const [activeDay, setActiveDay] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null); // {dayIdx, exIdx, exercise}
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    pb.collection("workout_presets").getFullList({ sort:"name", requestKey:null })
      .then(data => { setPresets(data); setPresetsLoading(false); }).catch(()=>setPresetsLoading(false));
  }, []);

  async function loadFromPreset(preset) {
    setPlanName(preset.name);
    setDaysCount(preset.days_count);
    const dbDays = await pb.collection("workout_preset_days").getFullList({ filter:`preset_id="${preset.id}"`, sort:"day_number", requestKey:null });
    const fullDays = await Promise.all(dbDays.map(async d => {
      const exs = await pb.collection("workout_preset_exercises").getFullList({ filter:`day_id="${d.id}"`, sort:"order_num", requestKey:null }).catch(()=>[]);
      return { day_number:d.day_number, day_label:d.day_label, exercises: exs.map(e=>({
        exercise_name:e.exercise_name, category:e.category, muscle:e.muscle,
        sets:e.sets, reps:e.reps, weight_kg:e.weight_kg, duration_min:e.duration_min, duration_sec:e.duration_sec,
        set_weights:e.set_weights||null, trainer_note:e.trainer_note||null
      })) };
    }));
    setDays(fullDays);
    setStep(1); // pirma nustatyti galiojimo datą, tada pratimai jau bus įkelti iš šablono
  }

  function startFromScratch() {
    setStep(1);
  }

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
          await pb.collection("workout_plan_exercises").create({ day_id:dayRec.id, exercise_name:ex.exercise_name, category:ex.category, muscle:ex.muscle, sets:ex.sets, reps:ex.reps, weight_kg:ex.weight_kg, duration_min:ex.duration_min, duration_sec:ex.duration_sec||null, order_num:i, set_weights:ex.set_weights||null, trainer_note:ex.trainer_note||null });
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

      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><ChevronLeft size={14} />Atgal</button>
        <div>
          <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>Sporto planas</h1>
          <p style={{fontSize:10,color:"rgba(255,255,255,0.4)",margin:0}}>{client.name}</p>
        </div>
        {step===2&&<button onClick={()=>setStep(1)} style={{marginLeft:"auto",background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><ChevronLeft size={11} />Parametrai</button>}
        {step===1&&<button onClick={()=>{setStep(0);setDays([]);}} style={{marginLeft:"auto",background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}><ChevronLeft size={11} />Šablonai</button>}
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"16px"}}>
        {step===0&&(
          <div>
            <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 16px"}}>Kaip norite pradėti?</p>

            <button onClick={startFromScratch} style={{width:"100%",padding:"16px",marginBottom:16,borderRadius:16,background:"rgba(255,255,255,0.08)",border:"2px dashed rgba(255,255,255,0.25)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
              <Sparkle size={24} />
              <div>
                <p style={{margin:"0 0 2px"}}>Naujas nuo nulio</p>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:400,margin:0}}>Sudėliok pratimus pačiam klientui</p>
              </div>
            </button>

            <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 10px"}}>Arba pasirink šabloną</p>

            {presetsLoading && <p style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Kraunama...</p>}
            {!presetsLoading && presets.length===0 && (
              <p style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Šablonų dar nesukurta. Sukurkite juos "Šablonai" skiltyje.</p>
            )}
            {presets.map(p => (
              <button key={p.id} onClick={()=>loadFromPreset(p)} style={{width:"100%",padding:"14px 16px",marginBottom:8,borderRadius:14,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <p style={{fontSize:14,fontWeight:700,margin:"0 0 2px",display:"flex",alignItems:"center",gap:6}}><Clipboard size={14} />{p.name}</p>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:0}}>{p.days_count} d./sav.</p>
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
              </button>
            ))}
          </div>
        )}
        {step===1&&(
          <div>
            <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 16px"}}>Plano parametrai</p>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:6}}>Pavadinimas</label>
              <input value={planName} onChange={e=>setPlanName(e.target.value)} placeholder={`${client.name} planas`} style={inp}/>
            </div>
            {days.length===0 && (
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:8}}>Dienų skaičius</label>
                <div style={{display:"flex",gap:8}}>
                  {[1,2,3,4,5].map(n=>(
                    <button key={n} onClick={()=>setDaysCount(n)} style={{flex:1,aspectRatio:"1",borderRadius:12,border:`2px solid ${daysCount===n?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.2)"}`,background:daysCount===n?"rgba(255,255,255,0.2)":"transparent",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{n}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{marginBottom:24}}>
              <div style={{marginBottom:12}}>
                <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:6}}>Pradžia</label>
                <DateSelect value={startDate} onChange={setStartDate} />
              </div>
              <div>
                <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:6}}>Pabaiga</label>
                <DateSelect value={endDate} onChange={setEndDate} minDate={startDate} />
              </div>
            </div>
            <button onClick={()=>{if(!endDate)return; if(days.length===0) initDays(daysCount); setStep(2);}} disabled={!endDate}
              style={{width:"100%",padding:"14px",borderRadius:14,background:endDate?"linear-gradient(135deg,#6D1B3B,#AD1457)":"rgba(255,255,255,0.1)",color:endDate?"#fff":"rgba(255,255,255,0.3)",border:"none",fontSize:15,fontWeight:700,cursor:endDate?"pointer":"default",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              Toliau <ChevronRight size={14} /> Sudėlioti pratimus
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
                  <div key={j} onClick={()=>setEditingExercise({dayIdx:activeDay,exIdx:j,exercise:ex})} style={{background:"rgba(255,255,255,0.08)",borderRadius:12,padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:3,marginRight:10,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                      <button onClick={()=>{ if(j===0)return; setDays(prev=>prev.map((d,i)=>{ if(i!==activeDay)return d; const exs=[...d.exercises]; [exs[j-1],exs[j]]=[exs[j],exs[j-1]]; return {...d,exercises:exs}; })); }} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:5,padding:"2px 6px",color:j===0?"rgba(255,255,255,0.2)":"#fff",cursor:j===0?"default":"pointer",fontSize:10,lineHeight:1}}>▲</button>
                      <button onClick={()=>{ if(j===days[activeDay].exercises.length-1)return; setDays(prev=>prev.map((d,i)=>{ if(i!==activeDay)return d; const exs=[...d.exercises]; [exs[j],exs[j+1]]=[exs[j+1],exs[j]]; return {...d,exercises:exs}; })); }} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:5,padding:"2px 6px",color:j===days[activeDay].exercises.length-1?"rgba(255,255,255,0.2)":"#fff",cursor:j===days[activeDay].exercises.length-1?"default":"pointer",fontSize:10,lineHeight:1}}>▼</button>
                    </div>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}>
                      <p style={{fontSize:13,fontWeight:600,color:"#fff",margin:0}}>{ex.exercise_name}</p>
                      <ExerciseSummary ex={ex} />
                      {ex.trainer_note && <p style={{fontSize:11,color:"#FF6EB4",margin:0,fontStyle:"italic",display:"flex",alignItems:"center",gap:4}}><MessageCircle size={10} />{ex.trainer_note}</p>}
                      <span style={{fontSize:10,color:"rgba(255,255,255,0.3)"}}>paliesk redaguoti</span>
                    </div>
                    <button onClick={(e)=>{e.stopPropagation();removeExercise(activeDay,j);}} style={{background:"rgba(255,100,100,0.15)",border:"1px solid rgba(255,100,100,0.3)",borderRadius:8,padding:"6px 10px",color:"#FF8888",cursor:"pointer",fontSize:12,flexShrink:0}}><Close size={12} /></button>
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

            <button onClick={()=>setShowPicker(true)} style={{width:"100%",padding:"12px",borderRadius:14,background:"rgba(255,255,255,0.1)",border:"2px dashed rgba(255,255,255,0.25)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>
              + Pridėti pratimą
            </button>

            <button onClick={handleSave} disabled={saving||!canSave}
              style={{width:"100%",padding:"14px",borderRadius:14,background:canSave?"linear-gradient(135deg,#6D1B3B,#AD1457)":"rgba(255,255,255,0.1)",color:canSave?"#fff":"rgba(255,255,255,0.3)",border:"none",fontSize:15,fontWeight:700,cursor:canSave?"pointer":"default",fontFamily:"inherit",opacity:saving?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {saving?"Saugoma...":<><Save size={14} />Išsaugoti planą</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}