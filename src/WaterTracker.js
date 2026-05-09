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

  // Krauname iš Supabase
  useEffect(() => {
    if (!userId) return;
    async function load() {
      const today = todayStr();
      const { data } = await supabase
        .from("water_log")
        .select("ml, goal")
        .eq("user_id", userId)
        .eq("date", today)
        .single();
      if (data) {
        setDrunk(data.ml || 0);
        setGoal(data.goal || defaultGoal);
      } else {
        setDrunk(0);
        setGoal(defaultGoal);
      }
    }
    load();
  }, [userId, defaultGoal]);

  async function save(newDrunk, newGoal) {
    if (!userId) return;
    setSaving(true);
    const today = todayStr();
    await supabase.from("water_log").upsert({
      user_id: userId, date: today, ml: newDrunk, goal: newGoal,
    }, { onConflict: "user_id,date" });
    setSaving(false);
  }

  function clickGlass(i, isFilled) {
    const newDrunk = isFilled ? Math.max(0, i * ML) : Math.min(goal, (i + 1) * ML);
    setDrunk(newDrunk);
    save(newDrunk, goal);
  }

  function addGlass() {
    if (drunk >= goal) return;
    const newDrunk = Math.min(goal, drunk + ML);
    setDrunk(newDrunk);
    save(newDrunk, goal);
  }

  function reset() {
    setDrunk(0);
    save(0, goal);
  }

  const totalGlasses = Math.ceil(goal / ML);
  const filled = Math.min(Math.floor(drunk / ML), totalGlasses);
  const pct = Math.min(100, Math.round(drunk / goal * 100));
  const done = drunk >= goal;

  const Glass = ({ index }) => {
    const isFilled = index < filled;
    const isNext   = index === filled && drunk < goal;

    return (
      <div
        onClick={() => clickGlass(index, isFilled)}
        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer" }}
        title={isFilled ? "Paspausti norint atimti" : "Paspausti norint pridėti"}
      >
        <svg viewBox="0 0 48 64" width="44" height="58" style={{ display:"block" }}>
          <defs>
            <clipPath id={"cp"+index}>
              <path d="M6,8 L10,60 L38,60 L42,8 Z" />
            </clipPath>
          </defs>
          {/* Vanduo */}
          <rect
            x="6" y="38" width="36" height="22"
            fill={isFilled ? PK.water : isNext ? PK.waterLight : "transparent"}
            clipPath={"url(#cp"+index+")"}
            style={{ transition:"all 0.3s" }}
          />
          {isFilled && (
            <rect x="6" y="36" width="36" height="5"
              fill={PK.water} opacity="0.4"
              clipPath={"url(#cp"+index+")"} />
          )}
          {/* Stiklinės kontūras */}
          <path
            d="M6,8 L10,60 L38,60 L42,8 Z"
            fill="none"
            stroke={isFilled ? PK.mid : PK.blush}
            strokeWidth={isFilled ? "2" : "1.5"}
            strokeLinejoin="round"
          />
          <line x1="6" y1="8" x2="42" y2="8"
            stroke={isFilled ? PK.mid : PK.blush}
            strokeWidth={isFilled ? "2" : "1.5"}
            strokeLinecap="round" />
          {/* + ženklas kitai stiklinei */}
          {isNext && (
            <text x="24" y="30" textAnchor="middle" fontSize="20"
              fill={PK.water} fontWeight="500">+</text>
          )}
        </svg>
        <span style={{ fontSize:10, color:PK.rose }}>
          {(index + 1) * ML}ml
        </span>
      </div>
    );
  };

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
            <span style={{ fontSize:28, fontWeight:700, color:done ? "#1D9E75" : PK.water }}>
              {drunk}
            </span>
            <span style={{ fontSize:13, color:PK.rose }}>/ {goal} ml</span>
            {saving && <span style={{ fontSize:10, color:PK.blush }}>●</span>}
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
      <div style={{
        background:PK.light, borderRadius:99, height:8, marginBottom:16, overflow:"hidden",
      }}>
        <div style={{
          width:pct+"%", height:"100%", borderRadius:99,
          background:done ? "#1D9E75" : "linear-gradient(90deg,"+PK.water+",#5BB8D4)",
          transition:"width 0.4s cubic-bezier(.23,1,.32,1)",
        }} />
      </div>

      {/* Stiklinės */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat("+Math.min(totalGlasses, 4)+", 1fr)",
        gap:8,
        marginBottom:14,
        justifyItems:"center",
      }}>
        {Array.from({ length: totalGlasses }, (_, i) => (
          <Glass key={i} index={i} />
        ))}
      </div>

      {/* Mygtukai */}
      <div style={{ display:"flex", gap:8 }}>
        <button
          onClick={addGlass}
          disabled={done}
          style={{
            flex:1, padding:"11px 0",
            background: done ? PK.pale : PK.light,
            border:"1px solid "+PK.blush,
            borderRadius:12, fontSize:13, fontWeight:700,
            color: done ? PK.blush : PK.mid,
            cursor: done ? "default" : "pointer",
            fontFamily:"inherit",
          }}>
          + Pridėti stiklinę (250ml)
        </button>
        <button onClick={reset} style={{
          padding:"11px 14px", background:"#fff",
          border:"1px solid "+PK.blush, borderRadius:12,
          fontSize:13, color:PK.rose, cursor:"pointer",
          fontFamily:"inherit",
        }}>↺</button>
      </div>

      {/* Žinutė */}
      <p style={{
        margin:"10px 0 0", fontSize:12, textAlign:"center",
        color: done ? "#1D9E75" : PK.rose,
        fontWeight: done ? 700 : 400,
      }}>
        {drunk === 0
          ? "Spausk ant stiklinės norėdamas pradėti"
          : done
          ? "✅ Tikslas pasiektas! Puiku!"
          : "Liko " + (goal - drunk) + "ml (" + Math.ceil((goal - drunk) / ML) + " stiklinės)"}
      </p>
    </div>
  );
}
