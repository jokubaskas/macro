import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { ExercisePicker, ExerciseEditModal } from "./WorkoutPlanBuilder";
import { ChevronLeft, ChevronRight, Dumbbell, Timer, Close, Edit, Save, Clipboard, Dot } from "./ui/icons";
import { ShowMoreButton } from "./ui/kit";

const KEYFRAMES = `@keyframes livePulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: .5; } }`;

function todayStr() { return new Date().toISOString().split("T")[0]; }

function formatDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("lt-LT", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
}

function exerciseSummary(ex) {
  if (ex.category === "cardio") return `${ex.duration_min || "–"} min`;
  if (ex.set_weights) {
    try {
      const ws = JSON.parse(ex.set_weights);
      return `${ex.sets || "–"} × ${ex.reps || "–"} · ${ws.map((w,i)=>`S${i+1}:${w}kg`).join(" ")}`;
    } catch { /* naudoti paprastą suvestinę žemiau */ }
  }
  return `${ex.sets || "–"} × ${ex.reps || "–"}${ex.weight_kg ? ` · ${ex.weight_kg}kg` : ""}`;
}

function ExerciseRow({ ex, onClick, onRemove }) {
  return (
    <div onClick={onClick} style={{
      background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"11px 14px", marginBottom:8,
      display:"flex", justifyContent:"space-between", alignItems:"center", cursor: onClick ? "pointer" : "default",
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:13, fontWeight:600, color:"#fff", margin:"0 0 2px" }}>{ex.exercise_name}</p>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0, display:"flex", alignItems:"center", gap:4 }}>
          {ex.category === "cardio" ? <Timer size={11} /> : null}{exerciseSummary(ex)}
          {onClick && <span style={{ color:"rgba(255,255,255,0.3)" }}> · paliesk redaguoti</span>}
        </p>
      </div>
      {onRemove && (
        <button onClick={(e)=>{ e.stopPropagation(); onRemove(); }} style={{ background:"rgba(255,100,100,0.15)", border:"1px solid rgba(255,100,100,0.3)", borderRadius:8, padding:"6px 10px", color:"#FF8888", cursor:"pointer", flexShrink:0 }}>
          <Close size={12} />
        </button>
      )}
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
  const [editingExercise, setEditingExercise] = useState(null);
  const [note, setNote] = useState("");
  const [visiblePast, setVisiblePast] = useState(8);
  const [savingNote, setSavingNote] = useState(false);

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
      sets: ex.sets, reps: ex.reps, weight_kg: ex.weight_kg, set_weights: ex.set_weights, duration_min: ex.duration_min,
      order_num: todayExercises.length,
    }).catch(() => null);
    if (rec) setTodayExercises(prev => [...prev, rec]);
    setShowPicker(false);
  }

  async function handleUpdateExercise(updated) {
    const { id, exercise_name, category, muscle, sets, reps, weight_kg, set_weights, duration_min } = updated;
    const rec = await pb.collection("live_session_exercises").update(id, {
      exercise_name, category, muscle, sets, reps, weight_kg, set_weights, duration_min,
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

      {showPicker && <ExercisePicker onAdd={handleAddExercise} onClose={() => setShowPicker(false)} />}
      {editingExercise && (
        <ExerciseEditModal exercise={editingExercise} onClose={() => setEditingExercise(null)} onSave={handleUpdateExercise} />
      )}

      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:20, paddingRight:20, paddingBottom:16, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:7 }}>
            <Dot color="#FF4444" size={8} style={{ animation:"livePulse 1.2s ease-in-out infinite" }} />Gyva treniruotė
          </h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{client.name}</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>
        {loading ? (
          <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Kraunama...</p>
        ) : (
          <>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 10px" }}>
              Šiandien · {formatDate(today)}
            </p>

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

            <button onClick={() => setShowPicker(true)} style={{ width:"100%", padding:12, borderRadius:14, background:"rgba(255,255,255,0.1)", border:"2px dashed rgba(255,255,255,0.25)", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginBottom:16 }}>
              + Pridėti pratimą
            </button>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", gap:5, marginBottom:6 }}><Edit size={11} />Pastabos apie treniruotę</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} onBlur={saveNote} rows={2} placeholder="Pvz. gera technika, kitą kartą didinti svorį..."
                style={{ width:"100%", padding:"10px 12px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", resize:"none", boxSizing:"border-box" }} />
              {savingNote && <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:"4px 0 0", display:"flex", alignItems:"center", gap:4 }}><Save size={10} />Saugoma...</p>}
            </div>

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
