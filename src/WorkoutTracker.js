import { useState, useEffect } from "react";
import { pb } from "./pb";

function todayStr() { return new Date().toISOString().split("T")[0]; }

const TYPES = {
  strength: { emoji:"🏋️", label:"Jėgos", color:"#FFB3C6" },
  cardio:   { emoji:"🏃", label:"Kardio",  color:"#89CFF0" },
};

export default function WorkoutTracker({ userId, date }) {
  const currentDate = date || todayStr();
  const isToday     = currentDate === todayStr();

  const [workouts, setWorkouts] = useState([]);  // [{type,duration_min,id}]
  const [adding,   setAdding]   = useState(null); // "strength"|"cardio"|null
  const [duration, setDuration] = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!userId) return;
pb.collection("workout_log").getFullList({ filter: `user_id="${userId}" && date="${currentDate}"`, sort: "created" })      .eq("user_id", userId).eq("date", currentDate)
      .order("created_at")
.then(data => setWorkouts(data || []));
  }, [userId, currentDate]);

  async function handleSave() {
    const dur = parseInt(duration);
    if (!dur || dur <= 0 || !adding) return;
    setSaving(true);
    const data = await pb.collection("workout_log").create({ user_id: userId, date: currentDate, type: adding, duration_min: dur });
    if (data) setWorkouts(w => [...w, data]);
    setAdding(null);
    setDuration("");
    setSaving(false);
  }

  async function handleDelete(id) {
    await pb.collection("workout_log").delete(id);
    setWorkouts(w => w.filter(x => x.id !== id));
  }

  const strengthTotal = workouts.filter(w=>w.type==="strength").reduce((a,w)=>a+w.duration_min,0);
  const cardioTotal   = workouts.filter(w=>w.type==="cardio")  .reduce((a,w)=>a+w.duration_min,0);

  return (
    <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:20, padding:"16px", border:"1px solid rgba(255,255,255,0.15)", marginBottom:12 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <p style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.85)", margin:0 }}>
          💪 Treniruotės šiandien
        </p>
        <div style={{ display:"flex", gap:6 }}>
          {strengthTotal > 0 && <span style={{ fontSize:10, color:TYPES.strength.color, background:"rgba(255,255,255,0.08)", borderRadius:8, padding:"2px 8px" }}>🏋️ {strengthTotal}min</span>}
          {cardioTotal   > 0 && <span style={{ fontSize:10, color:TYPES.cardio.color,   background:"rgba(255,255,255,0.08)", borderRadius:8, padding:"2px 8px" }}>🏃 {cardioTotal}min</span>}
        </div>
      </div>

      {/* Pridėti mygtukai */}
      {isToday && adding === null && (
        <div style={{ display:"flex", gap:8, marginBottom:workouts.length>0?12:0 }}>
          {Object.entries(TYPES).map(([type, info]) => (
            <button key={type} onClick={()=>setAdding(type)} style={{
              flex:1, padding:"12px 8px", borderRadius:14,
              background:"rgba(255,255,255,0.08)", border:"1.5px solid rgba(255,255,255,0.2)",
              color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
            }}>
              <span style={{ fontSize:22 }}>{info.emoji}</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.7)" }}>+ {info.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trukmės įvedimas */}
      {isToday && adding !== null && (
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"14px", marginBottom:12 }}>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.7)", margin:"0 0 10px", fontWeight:700 }}>
            {TYPES[adding].emoji} {TYPES[adding].label} treniruotė — trukmė (min.)
          </p>
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            {[20,30,45,60,90].map(n=>(
              <button key={n} onClick={()=>setDuration(String(n))} style={{
                flex:1, padding:"8px 0", borderRadius:10,
                background:duration===String(n)?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.08)",
                border:"1px solid rgba(255,255,255,"+(duration===String(n)?".5":".15")+")",
                color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              }}>{n}'</button>
            ))}
          </div>
          <input
            type="number" value={duration} onChange={e=>setDuration(e.target.value)}
            placeholder="arba įvesk min. rankiniu būdu"
            style={{ width:"100%", padding:"9px 12px", background:"rgba(255,255,255,0.08)", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:10 }}
          />
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={handleSave} disabled={saving||!duration} style={{ flex:2, padding:"12px 0", borderRadius:12, background:duration?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,"+(duration?".4":".15")+")", color:duration?"#fff":"rgba(255,255,255,0.3)", fontSize:13, fontWeight:700, cursor:duration?"pointer":"default", fontFamily:"inherit" }}>
              {saving?"Saugoma...":"✓ Išsaugoti"}
            </button>
            <button onClick={()=>{setAdding(null);setDuration("");}} style={{ flex:1, padding:"12px 0", borderRadius:12, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.5)", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
              Atšaukti
            </button>
          </div>
        </div>
      )}

      {/* Treniruočių sąrašas */}
      {workouts.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {workouts.map(w => (
            <div key={w.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.06)", borderRadius:10, padding:"8px 12px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:18 }}>{TYPES[w.type]?.emoji}</span>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:TYPES[w.type]?.color }}>{TYPES[w.type]?.label}</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginLeft:6 }}>{w.duration_min} min.</span>
                </div>
              </div>
              {isToday && (
                <button onClick={()=>handleDelete(w.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:14, cursor:"pointer" }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {!isToday && workouts.length === 0 && (
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.35)", margin:0, textAlign:"center" }}>Šią dieną treniruočių nebuvo suvesta</p>
      )}
    </div>
  );
}
