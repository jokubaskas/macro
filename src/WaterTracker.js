import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const PK = {
  dark:"#6D1B3B", mid:"#AD1457",
  blush:"#F8BBD9", light:"#FCE4EC", pale:"#FFF0F5",
  water:"#378ADD",
};

const ML = 250;
function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function WaterTracker({ goal: defaultGoal = 2000, userId, date }) {
  const currentDate = date || todayStr();
  const isToday = currentDate === todayStr();

  const [drunk,  setDrunk]  = useState(0);
  const [goal,   setGoal]   = useState(defaultGoal);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const scrollRef = useRef(null);

  const filled      = Math.floor(drunk / ML);
  const totalGlasses = Math.max(Math.ceil(goal / ML), filled); // visada rodome bent tiek stiklinių kiek užpildyta
  const pct          = Math.min(100, Math.round(drunk / goal * 100));
  const done         = drunk >= goal;

  useEffect(() => {
    if (!userId) return;
    setLoaded(false);
    async function load() {
      const { data } = await supabase
        .from("water_log").select("ml, goal")
        .eq("user_id", userId).eq("date", currentDate)
        .maybeSingle();
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
    await supabase.rpc("upsert_water_log", {
      p_user_id: userId, p_date: currentDate, p_ml: newDrunk, p_goal: goal,
    });
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
    if (!isFilled && scrollRef.current) {
      setTimeout(() => scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior:"smooth" }), 100);
    }
  }

  function addGlass() {
    if (!isToday) return;
    const newDrunk = drunk + ML;
    setDrunk(newDrunk);
    save(newDrunk);
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior:"smooth" });
    }, 100);
  }

  if (!loaded) return null;

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
      background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")",
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

      <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:5, marginBottom:14 }}>
        <div style={{
          width:pct+"%", height:"100%", borderRadius:99,
          background:done?"#7FFFB0":"rgba(255,255,255,0.85)",
          transition:"width 0.4s cubic-bezier(.23,1,.32,1)",
        }}/>
      </div>

      <div ref={scrollRef} style={{
        display:"flex", gap:6, overflowX:"auto", paddingBottom:4,
        scrollbarWidth:"none", msOverflowStyle:"none",
        WebkitOverflowScrolling:"touch",
      }}>
        {Array.from({ length: totalGlasses }, (_, i) => <GlassSVG key={i} index={i} />)}
        {/* + mygtukas tik šiandienai */}
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
