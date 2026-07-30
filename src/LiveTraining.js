import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { ExercisePicker, ExerciseEditModal, ExerciseSummary } from "./WorkoutPlanBuilder";
import { fetchLastPerformanceMap } from "./exerciseStats";
import ExerciseProgress from "./ExerciseProgress";
import { ChevronLeft, ChevronRight, Dumbbell, Close, Edit, Save, Clipboard, Dot, CheckCircle, TrendingUp } from "./ui/icons";
import { ShowMoreButton } from "./ui/kit";

const KEYFRAMES = `@keyframes livePulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: .5; } }`;

function todayStr() { return new Date().toISOString().split("T")[0]; }

function formatDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("lt-LT", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

function ExerciseRow({ ex, onClick, onRemove }) {
  return (
    <div onClick={onClick} style={{
      background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"11px 14px", marginBottom:8,
      display:"flex", justifyContent:"space-between", alignItems:"center", cursor: onClick ? "pointer" : "default", gap:10,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#fff", margin:"0 0 5px" }}>{ex.exercise_name}</p>
        <ExerciseSummary ex={ex} />
        {onClick && <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>paliesk redaguoti</span>}
      </div>
      {onRemove && (
        <button onClick={(e)=>{ e.stopPropagation(); onRemove(); }} style={{ background:"rgba(255,100,100,0.15)", border:"1px solid rgba(255,100,100,0.3)", borderRadius:8, padding:"6px 10px", color:"#FF8888", cursor:"pointer", flexShrink:0 }}>
          <Close size={12} />
        </button>
      )}
    </div>
  );
}

// ── Šablono pasirinkimas (gyvai treniruotei pradėti) ─────────────────────────
function TemplatePickerModal({ onConfirm, onClose }) {
  const [presets, setPresets]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [days, setDays]                 = useState([]);
  const [loadingDays, setLoadingDays]   = useState(false);
  const [selectedDay, setSelectedDay]   = useState(null);
  const [starting, setStarting]         = useState(false);

  useEffect(() => {
    pb.collection("workout_presets").getFullList({ sort:"name", requestKey:null })
      .then(setPresets).catch(()=>[]).finally(()=>setLoading(false));
  }, []);

  async function openPreset(preset) {
    setSelectedPreset(preset);
    setLoadingDays(true);
    const d = await pb.collection("workout_preset_days").getFullList({
      filter: `preset_id="${preset.id}"`, sort: "day_number", requestKey: null,
    }).catch(() => []);
    setDays(d);
    setSelectedDay(d.length === 1 ? d[0] : null);
    setLoadingDays(false);
  }

  async function handleStart() {
    if (!selectedDay) return;
    setStarting(true);
    const exs = await pb.collection("workout_preset_exercises").getFullList({
      filter: `day_id="${selectedDay.id}"`, sort: "order_num", requestKey: null,
    }).catch(() => []);
    setStarting(false);
    onConfirm(exs);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1100, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"flex-end" }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ width:"100%", maxWidth:480, margin:"0 auto", background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)", borderRadius:"24px 24px 0 0", padding:"20px 16px 40px", maxHeight:"90vh", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <p style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>{selectedPreset ? selectedPreset.name : "Pasirinkti šabloną"}</p>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"6px 12px", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center" }}><Close size={14} /></button>
        </div>

        {!selectedPreset ? (
          loading ? (
            <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"20px 0" }}>Kraunama...</p>
          ) : presets.length === 0 ? (
            <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"20px 0" }}>Šablonų dar nėra — sukurk juos "Šablonai" skiltyje.</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {presets.map(p => (
                <button key={p.id} onClick={()=>openPreset(p)} style={{ padding:"13px 14px", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, color:"#fff", cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:13, fontWeight:600 }}>{p.name}</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{p.days_count} d.</span>
                </button>
              ))}
            </div>
          )
        ) : (
          <div>
            {loadingDays ? (
              <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"20px 0" }}>Kraunama...</p>
            ) : (
              <>
                {days.length > 1 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
                    {days.map(d => (
                      <button key={d.id} onClick={()=>setSelectedDay(d)} style={{ padding:"8px 14px", borderRadius:20, border:"none", background:selectedDay?.id===d.id?"#AD1457":"rgba(255,255,255,0.12)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                        {d.day_label || `${d.day_number} diena`}
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{ setSelectedPreset(null); setSelectedDay(null); setDays([]); }} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.3)", background:"transparent", color:"#fff", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
                  <button onClick={handleStart} disabled={!selectedDay || starting} style={{ flex:2, padding:"12px", borderRadius:12, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:selectedDay?"pointer":"default", fontFamily:"inherit", opacity:selectedDay?1:0.5 }}>
                    {starting ? "Įkeliama..." : "Pradėti su šiuo šablonu"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PastSession({ session, expanded, exercises, onToggle }) {
  return (
    <div style={{ marginBottom:8 }}>
      <button onClick={onToggle} style={{
        width:"100%", padding:"12px 14px", borderRadius:12, background:"rgba(255,255,255,0.06)",
        border:"1px solid rgba(255,255,255,0.12)", color:"#fff", cursor:"pointer", fontFamily:"inherit",
        display:"flex", justifyContent:"space-between", alignItems:"center", textAlign:"left",
      }}>
        <span style={{ fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
          <Clipboard size={13} />{formatDate(session.date.slice(0,10))}
          {session.completed ? (
            <CheckCircle size={12} color="#7FFFB0" />
          ) : (
            <span style={{ fontSize:9, fontWeight:700, color:"#FFD700", background:"rgba(255,215,0,0.12)", borderRadius:20, padding:"2px 7px" }}>Nebaigta</span>
          )}
        </span>
        <ChevronRight size={13} color="rgba(255,255,255,0.4)" style={{ transform: expanded ? "rotate(90deg)" : "none", transition:"transform 0.2s" }} />
      </button>
      {expanded && (
        <div style={{ padding:"10px 4px 0" }}>
          {exercises === undefined ? (
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"8px 0" }}>Kraunama...</p>
          ) : exercises.length === 0 ? (
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"8px 0" }}>Pratimų neįrašyta</p>
          ) : (
            exercises.map(ex => <ExerciseRow key={ex.id} ex={ex} />)
          )}
          {session.note && <p style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontStyle:"italic", margin:"4px 0 0" }}>"{session.note}"</p>}
        </div>
      )}
    </div>
  );
}

export default function LiveTraining({ client, onClose }) {
  const today = todayStr();
  const [loading, setLoading] = useState(true);
  const [todaySession, setTodaySession] = useState(null);
  const [todayExercises, setTodayExercises] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [pastExercises, setPastExercises] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [note, setNote] = useState("");
  const [visiblePast, setVisiblePast] = useState(8);
  const [savingNote, setSavingNote] = useState(false);
  const [lastPerf, setLastPerf] = useState({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const sessions = await pb.collection("live_sessions").getFullList({
      filter: `user_id="${client.id}"`, sort: "-date", requestKey: null,
    }).catch(() => []);
    const todayRec = sessions.find(s => (s.date || "").slice(0,10) === today) || null;
    setTodaySession(todayRec);
    setNote(todayRec?.note || "");
    setPastSessions(sessions.filter(s => (s.date || "").slice(0,10) !== today));
    if (todayRec) {
      const exs = await pb.collection("live_session_exercises").getFullList({
        filter: `session_id="${todayRec.id}"`, sort: "order_num", requestKey: null,
      }).catch(() => []);
      setTodayExercises(exs);
    } else {
      setTodayExercises([]);
    }
    fetchLastPerformanceMap(client.id, todayRec ? [todayRec.id] : []).then(setLastPerf);
    setLoading(false);
  }, [client.id, today]);

  useEffect(() => { load(); }, [load]);

  async function ensureSession() {
    if (todaySession) return todaySession;
    const rec = await pb.collection("live_sessions").create({ user_id: client.id, date: today }).catch(() => null);
    if (rec) setTodaySession(rec);
    return rec;
  }

  async function handleAddExercise(ex) {
    const session = await ensureSession();
    if (!session) { setShowPicker(false); return; }
    const rec = await pb.collection("live_session_exercises").create({
      session_id: session.id, exercise_name: ex.exercise_name, category: ex.category, muscle: ex.muscle,
      sets: ex.sets, reps: ex.reps, weight_kg: ex.weight_kg, set_weights: ex.set_weights, duration_min: ex.duration_min, duration_sec: ex.duration_sec,
      order_num: todayExercises.length,
    }).catch(() => null);
    if (rec) setTodayExercises(prev => [...prev, rec]);
    setShowPicker(false);
  }

  // Perkelia visą pasirinkto šablono dienos pratimų sąrašą į šiandienos gyvą
  // treniruotę — vėliau kiekvieną galima koreguoti pagal realiai atliktą.
  async function handleUseTemplate(presetExercises) {
    const session = await ensureSession();
    if (!session) { setShowTemplatePicker(false); return; }
    let order = todayExercises.length;
    const created = [];
    for (const ex of presetExercises) {
      const rec = await pb.collection("live_session_exercises").create({
        session_id: session.id, exercise_name: ex.exercise_name, category: ex.category, muscle: ex.muscle,
        sets: ex.sets, reps: ex.reps, weight_kg: ex.weight_kg, set_weights: ex.set_weights, duration_min: ex.duration_min, duration_sec: ex.duration_sec,
        order_num: order++,
      }).catch(() => null);
      if (rec) created.push(rec);
    }
    setTodayExercises(prev => [...prev, ...created]);
    setShowTemplatePicker(false);
  }

  async function handleUpdateExercise(updated) {
    const { id, exercise_name, category, muscle, sets, reps, weight_kg, set_weights, duration_min, duration_sec } = updated;
    const rec = await pb.collection("live_session_exercises").update(id, {
      exercise_name, category, muscle, sets, reps, weight_kg, set_weights, duration_min, duration_sec,
    }).catch(() => null);
    if (rec) setTodayExercises(prev => prev.map(e => e.id === rec.id ? rec : e));
    setEditingExercise(null);
  }

  async function handleRemoveExercise(id) {
    await pb.collection("live_session_exercises").delete(id).catch(() => {});
    setTodayExercises(prev => prev.filter(e => e.id !== id));
  }

  async function saveNote() {
    const session = await ensureSession();
    if (!session) return;
    setSavingNote(true);
    await pb.collection("live_sessions").update(session.id, { note }).catch(() => {});
    setSavingNote(false);
  }

  async function toggleCompleted() {
    const session = await ensureSession();
    if (!session) return;
    const completed = !session.completed;
    const rec = await pb.collection("live_sessions").update(session.id, { completed }).catch(() => null);
    if (rec) setTodaySession(rec);
  }

  // Visiškai atšaukia (ištrina) šiandienos treniruotę — jei pradėta klaidingai
  // arba klientas neatvyko — kartu su visais jos pratimais. Grąžina ekraną į
  // pradinę būseną, tarsi treniruotė dar nebūtų pradėta.
  async function handleDeleteSession() {
    if (!todaySession) return;
    setDeletingSession(true);
    await Promise.all(todayExercises.map(ex => pb.collection("live_session_exercises").delete(ex.id).catch(() => {})));
    await pb.collection("live_sessions").delete(todaySession.id).catch(() => {});
    setTodaySession(null);
    setTodayExercises([]);
    setNote("");
    setConfirmingDelete(false);
    setDeletingSession(false);
  }

  async function togglePast(session) {
    if (expandedId === session.id) { setExpandedId(null); return; }
    setExpandedId(session.id);
    if (!pastExercises[session.id]) {
      const exs = await pb.collection("live_session_exercises").getFullList({
        filter: `session_id="${session.id}"`, sort: "order_num", requestKey: null,
      }).catch(() => []);
      setPastExercises(prev => ({ ...prev, [session.id]: exs }));
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <style>{KEYFRAMES}</style>

      {showPicker && <ExercisePicker onAdd={handleAddExercise} onClose={() => setShowPicker(false)} lastPerf={lastPerf} />}
      {showTemplatePicker && <TemplatePickerModal onConfirm={handleUseTemplate} onClose={() => setShowTemplatePicker(false)} />}
      {editingExercise && (
        <ExerciseEditModal exercise={editingExercise} onClose={() => setEditingExercise(null)} onSave={handleUpdateExercise} lastPerf={lastPerf} />
      )}
      {showProgress && <ExerciseProgress client={client} onClose={() => setShowProgress(false)} />}

      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:20, paddingRight:20, paddingBottom:16, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <div style={{ flex:1, minWidth:0 }}>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:7 }}>
            <Dot color="#FF4444" size={8} style={{ animation:"livePulse 1.2s ease-in-out infinite" }} />Gyva treniruotė
          </h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{client.name}</p>
        </div>
        <button onClick={() => setShowProgress(true)} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
          <TrendingUp size={14} />Progresas
        </button>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>
        {loading ? (
          <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Kraunama...</p>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexWrap:"wrap", gap:6 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>
                Šiandien · {formatDate(today)}
              </p>
              {todaySession && (
                todaySession.completed ? (
                  <span style={{ fontSize:10, fontWeight:700, color:"#7FFFB0", background:"rgba(127,255,176,0.12)", borderRadius:20, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <CheckCircle size={11} />Baigta
                  </span>
                ) : (
                  <span style={{ fontSize:10, fontWeight:700, color:"#FFD700", background:"rgba(255,215,0,0.12)", borderRadius:20, padding:"3px 10px", display:"inline-flex", alignItems:"center", gap:4 }}>
                    <Dot color="#FFD700" size={7} />Vykdoma
                  </span>
                )
              )}
            </div>

            {todayExercises.length === 0 ? (
              <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:20, textAlign:"center", border:"2px dashed rgba(255,255,255,0.15)", marginBottom:12 }}>
                <Dumbbell size={26} color="rgba(255,255,255,0.5)" style={{ marginBottom:8 }} />
                <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, margin:0 }}>Dar nė vieno pratimo neįrašyta</p>
              </div>
            ) : (
              <div style={{ marginBottom:12 }}>
                {todayExercises.map(ex => (
                  <ExerciseRow key={ex.id} ex={ex}
                    onClick={() => setEditingExercise(ex)}
                    onRemove={() => handleRemoveExercise(ex.id)} />
                ))}
              </div>
            )}

            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <button onClick={() => setShowTemplatePicker(true)} style={{ flex:1, padding:12, borderRadius:14, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <Clipboard size={14} />Naudoti šabloną
              </button>
              <button onClick={() => setShowPicker(true)} style={{ flex:1, padding:12, borderRadius:14, background:"rgba(255,255,255,0.1)", border:"2px dashed rgba(255,255,255,0.25)", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                + Pridėti pratimą
              </button>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", gap:5, marginBottom:6 }}><Edit size={11} />Pastabos apie treniruotę</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={saveNote} rows={2} placeholder="Pvz. gera technika, kitą kartą didinti svorį..."
                style={{ width:"100%", padding:"10px 12px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", resize:"none", boxSizing:"border-box" }} />
              {savingNote && <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:"4px 0 0", display:"flex", alignItems:"center", gap:4 }}><Save size={10} />Saugoma...</p>}
            </div>

            {todaySession && (
              todaySession.completed ? (
                <button onClick={toggleCompleted} style={{ width:"100%", padding:12, borderRadius:14, background:"rgba(127,255,176,0.08)", border:"1.5px solid rgba(127,255,176,0.3)", color:"#7FFFB0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <CheckCircle size={14} />Treniruotė baigta · atidaryti iš naujo
                </button>
              ) : (
                <button onClick={toggleCompleted} disabled={todayExercises.length===0} style={{ width:"100%", padding:13, borderRadius:14, background: todayExercises.length===0 ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#1a4731,#276749)", border:"none", color: todayExercises.length===0 ? "rgba(255,255,255,0.35)" : "#fff", fontSize:14, fontWeight:700, cursor: todayExercises.length===0 ? "default" : "pointer", fontFamily:"inherit", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <CheckCircle size={15} />Baigti treniruotę
                </button>
              )
            )}

            {todaySession && !confirmingDelete && (
              <button onClick={() => setConfirmingDelete(true)} style={{ width:"100%", padding:10, borderRadius:14, background:"transparent", border:"none", color:"rgba(255,136,136,0.7)", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginBottom:20, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Close size={12} />Atšaukti šiandienos treniruotę
              </button>
            )}
            {todaySession && confirmingDelete && (
              <div style={{ background:"rgba(255,100,100,0.08)", border:"1px solid rgba(255,100,100,0.25)", borderRadius:14, padding:"12px 14px", marginBottom:20 }}>
                <p style={{ fontSize:12, color:"#FF8888", margin:"0 0 10px", lineHeight:1.4 }}>Tikrai atšaukti šiandienos treniruotę? Visi {todayExercises.length} įrašyti pratimai bus ištrinti negrįžtamai.</p>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => setConfirmingDelete(false)} disabled={deletingSession} style={{ flex:1, padding:"9px", borderRadius:10, border:"1px solid rgba(255,255,255,0.2)", background:"transparent", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Ne, palikti</button>
                  <button onClick={handleDeleteSession} disabled={deletingSession} style={{ flex:1, padding:"9px", borderRadius:10, border:"none", background:"rgba(255,100,100,0.2)", color:"#FF8888", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    {deletingSession ? "Trinama..." : "Taip, atšaukti"}
                  </button>
                </div>
              </div>
            )}

            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 10px" }}>
              Ankstesnės gyvos treniruotės
            </p>
            {pastSessions.length === 0 ? (
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", padding:"12px 0" }}>Istorijos dar nėra</p>
            ) : (
              <>
                {pastSessions.slice(0, visiblePast).map(s => (
                  <PastSession key={s.id} session={s} expanded={expandedId === s.id}
                    exercises={pastExercises[s.id]} onToggle={() => togglePast(s)} />
                ))}
                <ShowMoreButton remaining={pastSessions.length - visiblePast} onClick={() => setVisiblePast(v => v + 8)} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}