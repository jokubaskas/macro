import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { PK, calcMacros } from "./constants";
import StepTracker, { calcStepCalories } from "./StepTracker";
import CheckIn from "./CheckIn";

function todayStr() { return new Date().toISOString().split("T")[0]; }

// ── Koreguoti makronutrientai su žingsnių bonusu ──────────────────────────────
function AdjustedMacros({ res, extraKcal, weightKg }) {
  if (!res || extraKcal <= 0) return null;

  const adjusted = {
    kcal: res.target + extraKcal,
    prot: Math.round(res.prot.g + extraKcal * 0.30 / 4),  // 30% papildomų kcal → baltymai
    carb: Math.round(res.carb.g + extraKcal * 0.60 / 4),  // 60% → angliavandeniai
    fat:  Math.round(res.fat.g  + extraKcal * 0.10 / 9),  // 10% → riebalai
  };

  return (
    <div style={{ background:`linear-gradient(135deg,${PK.dark},${PK.mid})`, borderRadius:20, padding:"16px", marginBottom:12, boxShadow:"0 4px 16px rgba(173,20,87,0.25)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <p style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.85)", margin:0 }}>
          🎯 Šiandien galima suvalgyti
        </p>
        <div style={{ textAlign:"right" }}>
          <span style={{ fontSize:11, color:"#7FFFB0", fontWeight:700 }}>{res.target} + {extraKcal}</span>
          <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", margin:0 }}>bazė + žingsniai</p>
        </div>
      </div>

      {/* Pagrindinis skaičius */}
      <div style={{ textAlign:"center", marginBottom:14 }}>
        <span style={{ fontSize:36, fontWeight:800, color:"#7FFFB0" }}>{adjusted.kcal}</span>
        <span style={{ fontSize:14, color:"rgba(255,255,255,0.6)", marginLeft:4 }}>kcal</span>
      </div>

      {/* Makrų tinklelis */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {[
          { l:"💪 Baltymai", v:adjusted.prot, base:res.prot.g, color:"#FFB3C6" },
          { l:"🍚 Angliav.",  v:adjusted.carb, base:res.carb.g, color:"#F48FB1" },
          { l:"🥑 Riebalai", v:adjusted.fat,  base:res.fat.g,  color:"#FF80AB" },
        ].map(m=>(
          <div key={m.l} style={{ background:"rgba(255,255,255,0.1)", borderRadius:12, padding:"10px 6px", textAlign:"center" }}>
            <div style={{ fontSize:16, fontWeight:700, color:m.color }}>{m.v}g</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{m.l}</div>
            <div style={{ fontSize:8, color:"rgba(127,255,176,0.7)", marginTop:2 }}>+{m.v-m.base}g</div>
          </div>
        ))}
      </div>

      <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:"10px 0 0", textAlign:"center", lineHeight:1.5 }}>
        Papildomos makros paskirstytos: 60% angliavandeniai · 30% baltymai · 10% riebalai
      </p>
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function ActivityView({ user, onLogout, selectedDate, onDateChange }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [steps,   setSteps]   = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id",user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user.id]);

  if (loading || !profile) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(135deg,${PK.dark},${PK.mid})` }}>
      <p style={{ color:PK.blush, fontSize:14 }}>Kraunama...</p>
    </div>
  );

  const hasData = profile.weight && profile.height && profile.age;
  const res     = hasData ? calcMacros({
    gender:profile.gender||"f", age:parseInt(profile.age),
    weight:parseFloat(profile.weight), height:parseFloat(profile.height),
    actId:profile.act||3, goalId:profile.goal||"lose",
  }) : null;

  const extraKcal = calcStepCalories(steps, parseFloat(profile.weight));
  const isToday   = selectedDate === todayStr();

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,${PK.pale} 0%,#fff 55%,${PK.light} 100%)`, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom:80 }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${PK.dark},${PK.mid})`, padding:"16px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src="/logo.png" alt="Coach Vilma" style={{ width:38, height:38, objectFit:"contain", borderRadius:8 }}/>
            <div>
              <h1 style={{ fontSize:17, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>🏃 Aktyvumas</h1>
              <p style={{ color:PK.blush, fontSize:11, margin:0 }}>{profile.name?.split(" ")[0]}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:10, padding:"7px 12px", color:"rgba(255,255,255,0.7)", fontSize:11, cursor:"pointer" }}>
            Atsijungti
          </button>
        </div>

        {/* Data */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:10 }}>
          <button onClick={()=>onDateChange?.(null)} style={{ background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:20, padding:"6px 16px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
            📅 {isToday ? new Date().toLocaleDateString("lt-LT",{weekday:"short",month:"short",day:"numeric"}) : selectedDate}
            <span style={{ fontSize:9, opacity:0.6 }}>▼</span>
          </button>
          {!isToday && (
            <button onClick={()=>onDateChange?.("today")} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:12, padding:"6px 10px", color:PK.blush, fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>← Šiandien</button>
          )}
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"16px 16px 0" }}>
        {/* Žingsniai */}
        <StepTracker
          userId={user.id}
          weightKg={parseFloat(profile.weight)}
          date={selectedDate}
          onStepsChange={setSteps}
        />

        {/* Koreguoti makronutrientai */}
        {res && (
          <AdjustedMacros res={res} extraKcal={extraKcal} weightKg={parseFloat(profile.weight)} />
        )}

        {/* Jei neaktyvus – bazinė info */}
        {res && extraKcal === 0 && (
          <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:12, border:`1px solid ${PK.blush}` }}>
            <p style={{ fontSize:12, fontWeight:700, color:PK.dark, margin:"0 0 6px" }}>📊 Bazinis tikslas</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
              {[
                { l:"Kalorijos", v:res.target, u:"kcal" },
                { l:"Baltymai",  v:res.prot.g, u:"g" },
                { l:"Riebalai",  v:res.fat.g,  u:"g" },
                { l:"Angliav.",  v:res.carb.g, u:"g" },
              ].map(m=>(
                <div key={m.l} style={{ background:PK.light, borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:PK.dark }}>{m.v}</div>
                  <div style={{ fontSize:8, color:PK.rose }}>{m.u}</div>
                  <div style={{ fontSize:8, color:PK.rose }}>{m.l}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:10, color:PK.rose, margin:"8px 0 0", textAlign:"center" }}>
              Suvesk žingsnių skaičių — tikslas koreguosis automatiškai 🚶
            </p>
          </div>
        )}

        {/* Check-in */}
        <CheckIn
          userId={user.id}
          targetKcal={res?.target}
          targetProtein={res?.prot?.g}
          age={parseInt(profile?.age)}
        />
      </div>
    </div>
  );
}
