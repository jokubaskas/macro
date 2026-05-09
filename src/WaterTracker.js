import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const PK = {
  dark:"#6D1B3B", mid:"#AD1457", bright:"#E91E8C",
  rose:"#F48FB1", blush:"#F8BBD9", light:"#FCE4EC",
  pale:"#FFF0F5", water:"#378ADD", waterLight:"#B5D4F4",
};

const ML = 250;

function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function WaterTracker({ goal: defaultGoal = 2000, userId }) {
  const [drunk,  setDrunk]  = useState(0);
  const [goal,   setGoal]   = useState(defaultGoal);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const totalGlasses = Math.ceil(goal / ML);
  const filled = Math.floor(drunk / ML);
  const pct    = Math.min(100, Math.round(drunk / goal * 100));
  const done   = drunk >= goal;

  useEffect(() => {
    if (!userId) return;
    async function load() {
      console.log("WATER LOAD:", { userId, date: todayStr() });
      const { data, error } = await supabase
        .from("water_log")
        .select("ml, goal")
        .eq("user_id", userId)
        .eq("date", todayStr())
        .single();
      console.log("WATER LOAD result:", { data, error });
      if (data) {
        setDrunk(data.ml || 0);
        setGoal(data.goal || defaultGoal);
      } else {
        setDrunk(0);
        setGoal(defaultGoal);
      }
      setLoaded(true);
    }
    load();
  }, [userId, defaultGoal]);

  async function save(newDrunk) {
    console.log("WATER SAVE:", { userId, newDrunk, goal, date: todayStr() });
    if (!userId) { console.error("userId tuscias!"); return; }
    setSaving(true);
    const today = todayStr();
    const { error } = await supabase.rpc("upsert_water_log", {
      p_user_id: userId,
      p_date:    today,
      p_ml:      newDrunk,
      p_goal:    goal,
    });
    if (error) console.error("Water save error:", error);
    setSaving(false);
  }

  function clickGlass(index) {
    const isLastFilled = index === filled - 1; // paskutinė užpildyta
    const isEmpty      = index >= filled;       // tuščia

    if (isEmpty) {
      // Pilti – galima bet kurią tuščią (pildo iš eilės)
      const newDrunk = (index + 1) * ML;
      setDrunk(newDrunk);
      save(newDrunk);
    } else if (isLastFilled) {
      // Nuimti – tik paskutinę užpildytą
      const newDrunk = index * ML;
      setDrunk(newDrunk);
      save(newDrunk);
    }
    // Kitų pilnų stiklinių spaudinėjimas – nieko nedaro
  }

  function addGlass() {
    const newDrunk = drunk + ML;
    setDrunk(newDrunk);
    save(newDrunk);
  }

  if (!loaded) return (
    <div style={{ background:"#fff", borderRadius:20, padding:"18px 16px", border:"1px solid "+PK.blush, textAlign:"center" }}>
      <p style={{ color:PK.rose, fontSize:13, margin:0 }}>Kraunama...</p>
    </div>
  );

  return (
    <div style={{
      background:"#fff", borderRadius:20, padding:"18px 16px",
      border:"1px solid "+PK.blush,
      boxShadow:"0 2px 12px rgba(173,20,87,0.07)",
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <p style={{ margin:"0 0 2px", fontSize:12, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.1em" }}>
            💧 Vanduo šiandien
          </p>
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ fontSize:28, fontWeight:700, color:done?"#1D9E75":PK.water }}>
              {drunk}
            </span>
            <span style={{ fontSize:13, color:PK.rose }}>ml</span>
            {saving && <span style={{ fontSize:10, color:PK.blush, marginLeft:4 }}>●</span>}
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <span style={{ fontSize:10, color:PK.rose }}>Dienos tikslas</span>
          <p style={{ margin:"2px 0 0", fontSize:13, fontWeight:700, color:PK.dark }}>
            {(goal/1000).toFixed(1)}l
          </p>
        </div>
      </div>

      {/* Progreso juosta */}
      <div style={{ background:PK.light, borderRadius:99, height:8, marginBottom:16, overflow:"hidden" }}>
        <div style={{
          width: pct+"%", height:"100%", borderRadius:99,
          background: done ? "#1D9E75" : "linear-gradient(90deg,"+PK.water+",#5BB8D4)",
          transition:"width 0.4s cubic-bezier(.23,1,.32,1)",
        }} />
      </div>

      {/* Stiklinės */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat("+Math.min(totalGlasses,4)+", 1fr)",
        gap:10, marginBottom:14, justifyItems:"center",
      }}>
        {Array.from({ length: totalGlasses }, (_, i) => {
          const isFilled     = i < filled;
          const isLastFilled = i === filled - 1;
          const isNext       = i === filled && !done;
          // Kursorą keičiame tik veikiančioms stiklinėms
          const clickable    = isLastFilled || i >= filled;

          return (
            <div
              key={i}
              onClick={() => clickGlass(i)}
              style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                cursor: clickable ? "pointer" : "default",
                opacity: isFilled && !isLastFilled ? 0.85 : 1,
              }}
              title={
                isLastFilled ? "Paspausti norint nuimti šią stiklinę" :
                i >= filled   ? "Paspausti norint pridėti" : ""
              }
            >
              <svg viewBox="0 0 48 64" width="44" height="58" style={{ display:"block" }}>
                <defs>
                  <clipPath id={"cp"+i}>
                    <path d="M6,8 L10,60 L38,60 L42,8 Z" />
                  </clipPath>
                </defs>

                {/* Vandens užpildas */}
                <rect x="6" y="38" width="36" height="22"
                  fill={isFilled ? PK.water : isNext ? PK.waterLight : "transparent"}
                  clipPath={"url(#cp"+i+")"}
                  style={{ transition:"all 0.3s" }} />
                {isFilled && (
                  <rect x="6" y="36" width="36" height="5"
                    fill={PK.water} opacity="0.3"
                    clipPath={"url(#cp"+i+")"} />
                )}

                {/* Stiklinės kontūras */}
                <path d="M6,8 L10,60 L38,60 L42,8 Z" fill="none"
                  stroke={isFilled ? PK.mid : PK.blush}
                  strokeWidth={isFilled ? "2" : "1.5"}
                  strokeLinejoin="round" />
                <line x1="6" y1="8" x2="42" y2="8"
                  stroke={isFilled ? PK.mid : PK.blush}
                  strokeWidth={isFilled ? "2" : "1.5"}
                  strokeLinecap="round" />

                {/* Ikonos viduje */}
                {isLastFilled && (
                  <text x="24" y="30" textAnchor="middle" fontSize="13"
                    fill="#fff" fontWeight="700">−</text>
                )}
                {!isLastFilled && isFilled && (
                  <text x="24" y="30" textAnchor="middle" fontSize="13"
                    fill="#fff" fontWeight="700" opacity="0.7">✓</text>
                )}
                {isNext && (
                  <text x="24" y="30" textAnchor="middle" fontSize="20"
                    fill={PK.water} fontWeight="500">+</text>
                )}
              </svg>

              {/* Etiketė – visada 250ml */}
              <span style={{
                fontSize:10,
                color: isLastFilled ? PK.mid : isFilled ? PK.rose : PK.rose,
                fontWeight: isFilled ? "700" : "400",
              }}>
                250ml
              </span>
            </div>
          );
        })}
      </div>

      {/* Pridėti mygtukas */}
      <button onClick={addGlass} style={{
        width:"100%", padding:"11px 0", background:PK.light,
        border:"1px solid "+PK.blush, borderRadius:12,
        fontSize:13, fontWeight:700, color:PK.mid,
        cursor:"pointer", fontFamily:"inherit",
      }}>
        + Pridėti stiklinę (250ml)
      </button>

      {/* Žinutė */}
      <p style={{
        margin:"10px 0 0", fontSize:12, textAlign:"center",
        color: done ? "#1D9E75" : PK.rose,
        fontWeight: done ? 700 : 400,
      }}>
        {drunk === 0
          ? "Spausk ant stiklinės norėdamas pradėti 💧"
          : done
          ? "✅ Tikslas pasiektas! Puiku!"
          : "Liko "+(goal-drunk)+"ml ("+Math.ceil((goal-drunk)/ML)+" stiklinės)"}
      </p>
    </div>
  );
}
