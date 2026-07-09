import { useState, useEffect, useRef } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { MOOD } from "./constants";
const PK = {
  dark:"#6D1B3B", mid:"#AD1457",
  blush:"#F8BBD9", light:"#FCE4EC", pale:"#FFF0F5",
  water:"#378ADD",
};

const ML = 250;
function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function WaterTracker({ goal: defaultGoal = 2000, userId, date, compact = false }) {
  const currentDate = date || todayStr();
  const isToday = currentDate === todayStr();

  const [drunk,  setDrunk]  = useState(0);
  const [goal,   setGoal]   = useState(defaultGoal);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);

  const filled      = Math.floor(drunk / ML);
  const totalGlasses = Math.max(Math.ceil(goal / ML), filled);
  const pct          = Math.min(100, Math.round(drunk / goal * 100));
  const done         = drunk >= goal;

  useEffect(() => {
  if (!userId) return;
  setLoaded(false);
  async function load() {
    const data = await pbFirst("water_log", `user_id="${userId}" && date="${currentDate}"`);
    if (data) { setDrunk(data.ml || 0); setGoal(data.goal || defaultGoal); }
    else       { setDrunk(0); setGoal(defaultGoal); }
    setLoaded(true);
  }
  load();
// eslint-disable-next-line
}, [userId, currentDate]);

  async function save(newDrunk) {
    if (!userId || !isToday) return;
    setSaving(true);
    await pbUpsert("water_log", `user_id="${userId}" && date="${currentDate}"`, { user_id:userId, date:currentDate, ml:newDrunk, goal });

    setSaving(false);
  }

  function clickGlass(index) {
    if (!isToday) return;
    const isFilled     = index < filled;
    const isLastFilled = index === filled - 1;
    if (isFilled && !isLastFilled) return;
    const newDrunk = isFilled ? index * ML : (index + 1) * ML;
    setDrunk(newDrunk);
    save(newDrunk);
    // auto-scroll pašalintas
  }

  function addGlass() {
    if (!isToday) return;
    const newDrunk = drunk + ML;
    setDrunk(newDrunk);
    save(newDrunk);
    // auto-scroll pašalintas
  }

  if (!loaded) return null;

  // ── Kompaktiškas režimas ──────────────────────────────────────────────────
  if (compact) {
    const { PK: PKc } = { PK: { dark:"#6D1B3B", mid:"#AD1457", blush:"#F8BBD9", light:"#FCE4EC", pale:"#FFF0F5" } };
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:14 }}>💧</span>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:PK.dark, fontWeight:600 }}>{drunk} / {goal} ml</span>
            <span style={{ fontSize:11, color: done ? "#27ae60" : PK.mid, fontWeight:700 }}>{pct}%</span>
          </div>
          <div style={{ background:PK.blush, borderRadius:99, height:5 }}>
            <div style={{ width:pct+"%", height:"100%", borderRadius:99, background: done ? `linear-gradient(90deg,${MOOD.good.c2},${MOOD.good.c1})` : `linear-gradient(90deg,${MOOD.water.c2},${MOOD.water.c1})`, transition:"width 0.3s" }}/>
          </div>
        </div>
        <span style={{ fontSize:11, color:PK.mid, fontWeight:700, minWidth:30, textAlign:"right" }}>{filled}🥛</span>
      </div>
    );
  }

  const GlassSVG = ({ index }) => {
    const isFilled     = index < filled;
    const isLastFilled = index === filled - 1;
    const isNext       = index === filled && !done;
    const clickable    = isToday && (isLastFilled || index >= filled);

    return (
      <div onClick={() => clickable && clickGlass(index)}
        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4,
          cursor: clickable ? "pointer" : "default", flexShrink:0, width:52 }}>
        <svg viewBox="0 0 48 60" width="42" height="52">
          <defs>
            <clipPath id={"wcp"+index}>
              <path d="M6,6 L10,56 L38,56 L42,6 Z"/>
            </clipPath>
          </defs>
          <rect x="6" y="34" width="36" height="22"
            fill={isFilled ? "rgba(255,255,255,0.6)" : isNext ? "rgba(255,255,255,0.2)" : "transparent"}
            clipPath={"url(#wcp"+index+")"}
            style={{ transition:"all 0.3s" }} />
          <path d="M6,6 L10,56 L38,56 L42,6 Z" fill="none"
            stroke={isFilled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)"}
            strokeWidth={isFilled?"2":"1.5"} strokeLinejoin="round"/>
          <line x1="6" y1="6" x2="42" y2="6"
            stroke={isFilled?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.35)"}
            strokeWidth={isFilled?"2":"1.5"} strokeLinecap="round"/>
          {isLastFilled && isToday && <text x="24" y="27" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.9)" fontWeight="700">−</text>}
          {!isLastFilled && isFilled && <text x="24" y="27" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.7)" fontWeight="700">✓</text>}
          {isNext && <text x="24" y="27" textAnchor="middle" fontSize="18" fill="rgba(255,255,255,0.8)" fontWeight="400">+</text>}
        </svg>
        <span style={{ fontSize:9, color:"rgba(255,255,255,0.6)", fontWeight:isFilled?"700":"400" }}>250ml</span>
      </div>
    );
  };

  return (
    <div style={{
      background:"rgba(0,0,0,0.2)",
      borderRadius:20, padding:"16px 16px",
      boxShadow:"0 6px 24px rgba(173,20,87,0.3)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>💧 Vanduo</span>
          <span style={{ fontSize:22, fontWeight:700, color:done?"#7FFFB0":"#fff" }}>{drunk}</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>/ {goal}ml</span>
          {saving && <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>●</span>}
        </div>
        <span style={{ fontSize:11, color:done?"#7FFFB0":"rgba(255,255,255,0.6)", fontWeight:done?700:400 }}>
          {done ? "✅ Tikslas pasiektas!" : "Liko "+(goal-drunk)+"ml"}
        </span>
      </div>

      <div style={{ position:"relative", borderRadius:99, height:6, marginBottom:16, background:"rgba(255,255,255,0.15)" }}>
        <div style={{
          position:"absolute", left:0, top:0, height:"100%", width:pct+"%", borderRadius:99,
          background: done ? `linear-gradient(90deg,${MOOD.good.c2},${MOOD.good.c1})` : `linear-gradient(90deg,${MOOD.water.c2},${MOOD.water.c1})`,
          transition:"width 0.4s cubic-bezier(.23,1,.32,1)",
        }}/>
        {pct > 0 && (
          <div style={{
            position:"absolute", top:"50%", left:`${pct}%`, transform:"translate(-50%,-50%)",
            width:14, height:14, borderRadius:"50%",
            background: done ? `radial-gradient(circle at 34% 28%, ${MOOD.good.c1}, ${MOOD.good.c2})` : `radial-gradient(circle at 34% 28%, ${MOOD.water.c1}, ${MOOD.water.c2})`,
            boxShadow: done ? `0 0 8px 2px ${MOOD.good.c1}99` : `0 0 8px 2px ${MOOD.water.c1}99`,
            transition:"left 0.4s cubic-bezier(.23,1,.32,1)",
          }} />
        )}
      </div>

      <div ref={scrollRef} style={{
        display:"flex", gap:6, overflowX:"auto", paddingBottom:4,
        scrollbarWidth:"none", msOverflowStyle:"none",
        WebkitOverflowScrolling:"touch",
      }}>
        {Array.from({ length: totalGlasses }, (_, i) => <GlassSVG key={i} index={i} />)}
        {isToday && (
          <div onClick={addGlass} style={{
            flexShrink:0, width:52, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer",
          }}>
            <div style={{
              width:42, height:52, borderRadius:10,
              border:"1.5px dashed rgba(255,255,255,0.35)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <span style={{ fontSize:20, color:"rgba(255,255,255,0.5)" }}>+</span>
            </div>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>250ml</span>
          </div>
        )}
      </div>
    </div>
  );
}