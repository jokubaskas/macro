import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { PK, calcMacros } from "./constants";
import StepTracker, { calcStepCalories } from "./StepTracker";
import WorkoutTracker from "./WorkoutTracker";

function todayStr() { return new Date().toISOString().split("T")[0]; }

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function ActivityView({ user, onLogout, selectedDate, onDateChange, stepsToday, onStepsChange }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [steps,   setSteps]   = useState(stepsToday || 0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id",user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user.id]);

  if (loading || !profile) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:`linear-gradient(160deg,#2d0a1a,${PK.dark},${PK.mid})` }}>
      <p style={{ color:PK.blush, fontSize:14 }}>Kraunama...</p>
    </div>
  );

  const profileAge = profile.dob ? Math.floor((new Date()-new Date(profile.dob))/(365.25*24*60*60*1000)) : parseInt(profile.age||30);
  const hasData    = profile.weight && profile.height && profileAge;
  const res     = hasData ? calcMacros({
    gender:profile.gender||"f", age:profileAge,
    weight:parseFloat(profile.weight), height:parseFloat(profile.height),
    actId:profile.act||3, goalId:profile.goal||"lose",
  }) : null;

  const extraKcal = calcStepCalories(steps, parseFloat(profile.weight));
  const isToday   = selectedDate === todayStr();

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,#2d0a1a 0%,${PK.dark} 40%,${PK.mid} 100%)`, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom:80 }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(160deg,#2d0a1a,${PK.dark},${PK.mid})`, padding:"16px 20px 20px" }}>
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
        <WorkoutTracker userId={user.id} date={selectedDate} />

        <StepTracker
          userId={user.id}
          weightKg={parseFloat(profile.weight)}
          date={selectedDate}
          onStepsChange={(s) => { setSteps(s); onStepsChange?.(s); }}
        />



        {/* Jei neaktyvus – bazinė info */}
        {res && extraKcal === 0 && (
          <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:16, padding:"14px 16px", marginBottom:12, border:"1px solid rgba(255,255,255,0.15)" }}>
            <p style={{ fontSize:12, fontWeight:700, color:"#fff", margin:"0 0 6px" }}>📊 Bazinis tikslas</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
              {[
                { l:"Kalorijos", v:res.target, u:"kcal" },
                { l:"Baltymai",  v:res.prot.g, u:"g" },
                { l:"Riebalai",  v:res.fat.g,  u:"g" },
                { l:"Angliav.",  v:res.carb.g, u:"g" },
              ].map(m=>(
                <div key={m.l} style={{ background:"rgba(255,255,255,0.1)", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{m.v}</div>
                  <div style={{ fontSize:8, color:PK.rose }}>{m.u}</div>
                  <div style={{ fontSize:8, color:PK.rose }}>{m.l}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.5)", margin:"8px 0 0", textAlign:"center" }}>
              Suvesk žingsnių skaičių — tikslas koreguosis automatiškai 🚶
            </p>
          </div>
        )}
</div>
    </div>
  );
}
