import { useState, useEffect } from "react";
import { pbFirst, pbUpsert } from "./pb";
import { MOOD } from "./constants";
import { Footprints, Edit, Save, Sparkle } from "./ui/icons";

const GOAL = 7000;
function todayStr() { return new Date().toISOString().split("T")[0]; }

function getMotivation(steps) {
  if (!steps || steps === 0) return null;
  const pct = steps / GOAL;
  if (pct < 0.5)  return { text: `Dar ${(GOAL - steps).toLocaleString()} žingsnių iki tikslo — judėk!`, color: "#FFD700", Icon: Footprints };
  if (pct < 0.85) return { text: `Beveik! Liko tik ${(GOAL - steps).toLocaleString()} žingsnių`, color: "#FFA500", Icon: Footprints };
  if (pct < 1.0)  return { text: `Tikslą pasieksi šiandien! Vos ${(GOAL - steps).toLocaleString()} žingsnių!`, color: "#7FFFB0", Icon: Sparkle };
  if (pct < 1.3)  return { text: "Tikslas pasiektas! Puiku, tęsk šį ritmą!", color: "#7FFFB0", Icon: Sparkle };
  return { text: "Nuostabi diena! Tu judėjai daugiau nei planavai", color: "#FF6EB4", Icon: Sparkle };
}

export default function StepsTracker({ userId, date }) {
  const isToday = date === todayStr();
  const [steps, setSteps]   = useState(0);
  const [input, setInput]   = useState("");
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSaved(false);
    pbFirst("daily_checkins", `user_id="${userId}" && date="${date}"`).then(r => {
      if (r && r.steps) { setSteps(r.steps); setInput(String(r.steps)); setSaved(true); }
      else { setSteps(0); setInput(""); setSaved(false); }
    }).catch(() => {});
  }, [userId, date]);

  async function handleSave() {
    if (!isToday) return;
    const n = parseInt(input) || 0;
    setSteps(n);
    setSaving(true);
    try {
      // Ieškoma/atnaujinama šviežiai per pbUpsert (ne pasikliaujama anksčiau
      // įsimintu įrašo ID) — kitaip, jei tarpe DailyCheckin.js jau sukūrė
      // šios dienos įrašą, čia atsirasdavo ANTRAS, atskiras įrašas tai
      // pačiai user_id+date porai (steps likdavo nematomi kalendoriuje).
      await pbUpsert("daily_checkins", `user_id="${userId}" && date="${date}"`, { user_id: userId, date, steps: n });
      setSaved(true);
    } catch(e) { console.error(e); }
    setSaving(false);
  }

  const pct = Math.min((steps / GOAL) * 100, 100);
  const stage = pct >= 100 ? MOOD.good : pct >= 50 ? MOOD.mid : MOOD.bad;
  const mot = getMotivation(steps);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:6 }}><Footprints size={14} />Žingsniai</span>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Tikslas: {GOAL.toLocaleString()}</span>
      </div>

      <div style={{ position:"relative", borderRadius:99, height:6, marginBottom:16, background:`linear-gradient(90deg,${MOOD.bad.c1}33,${MOOD.mid.c1}33,${MOOD.good.c1}33)` }}>
        <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${pct}%`, borderRadius:99, background:`linear-gradient(90deg,${MOOD.bad.c1},${stage.c1})`, transition:"width 0.5s cubic-bezier(.23,1,.32,1)" }} />
        {pct > 0 && (
          <div style={{
            position:"absolute", top:"50%", left:`${pct}%`, transform:"translate(-50%,-50%)",
            width:14, height:14, borderRadius:"50%",
            background:`radial-gradient(circle at 34% 28%, ${stage.c1}, ${stage.c2})`,
            boxShadow:`0 0 8px 2px ${stage.c1}99`,
            transition:"left 0.5s cubic-bezier(.23,1,.32,1)",
          }} />
        )}
      </div>

      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:10, opacity:isToday?1:0.5 }}>
        <input type="range" min={0} max={15000} step={100} value={parseInt(input)||0} disabled={!isToday}
          onChange={e=>{ setInput(e.target.value); setSaved(false); }}
          style={{ flex:1, accentColor:"#AD1457", cursor:isToday?"pointer":"default" }}
        />
        <input type="number" value={input} placeholder="0" disabled={!isToday}
          onChange={e=>{ setInput(e.target.value); setSaved(false); }}
          style={{ width:72, padding:"6px 8px", borderRadius:8, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", textAlign:"center" }}
        />
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", flexShrink:0 }}>žgn.</span>
      </div>

      {!isToday ? (
        mot && <p style={{ fontSize:12, color:mot.color, margin:0, lineHeight:1.4, display:"flex", alignItems:"center", gap:5 }}><mot.Icon size={13} />{mot.text}</p>
      ) : saved ? (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          {mot && <p style={{ fontSize:12, color:mot.color, margin:0, lineHeight:1.4, flex:1, display:"flex", alignItems:"center", gap:5 }}><mot.Icon size={13} />{mot.text}</p>}
          <button onClick={()=>setSaved(false)} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"5px 12px", color:"rgba(255,255,255,0.6)", fontSize:11, cursor:"pointer", fontFamily:"inherit", flexShrink:0, marginLeft:8, display:"flex", alignItems:"center", gap:4 }}><Edit size={11} />Keisti</button>
        </div>
      ) : (
        <button onClick={handleSave} disabled={saving||!input}
          style={{ width:"100%", padding:"10px", borderRadius:12, border:"none", background:input?"linear-gradient(135deg,#6D1B3B,#AD1457)":"rgba(255,255,255,0.08)", color:input?"#fff":"rgba(255,255,255,0.3)", fontSize:13, fontWeight:700, cursor:input?"pointer":"default", fontFamily:"inherit", transition:"background 0.25s, color 0.25s", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          {saving ? "Saugoma..." : <><Save size={14} />Išsaugoti žingsnius</>}
        </button>
      )}
    </div>
  );
}