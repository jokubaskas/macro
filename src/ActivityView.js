import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { PK, calcMacros } from "./constants";
import ActivityWidget from "./ActivityWidget";

function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function ActivityView({ user, onLogout, selectedDate, onDateChange, onActivityChange }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isToday = (selectedDate||todayStr()) === todayStr();

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id",user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user.id]);

  if (loading || !profile) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg,#2d0a1a,${PK.dark},${PK.mid})`}}>
      <p style={{color:"rgba(255,255,255,0.6)",fontSize:14}}>Kraunama...</p>
    </div>
  );

  const wt = parseFloat(profile.weight) || 60;

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,#2d0a1a 0%,${PK.dark} 40%,${PK.mid} 100%)`,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",paddingBottom:80}}>

      {/* Header */}
      <div style={{background:"rgba(0,0,0,0.15)",backdropFilter:"blur(10px)",padding:"16px 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <img src="/logo.png" alt="" style={{width:34,height:34,objectFit:"contain",borderRadius:8}}/>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:0}}>🏃 Aktyvumas</p>
              <p style={{fontSize:9,color:"rgba(255,255,255,0.5)",margin:0}}>{profile.name?.split(" ")[0]}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"7px 12px",color:"rgba(255,255,255,0.7)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Išeiti</button>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:8}}>
          <button onClick={()=>onDateChange?.(null)} style={{background:"rgba(255,255,255,0.12)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:20,padding:"6px 14px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
            📅 {isToday?new Date().toLocaleDateString("lt-LT",{month:"short",day:"numeric"}):selectedDate}
            <span style={{fontSize:9,opacity:0.6}}>▼</span>
          </button>
          {!isToday&&<button onClick={()=>onDateChange?.("today")} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:12,padding:"6px 10px",color:"rgba(255,255,255,0.6)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>← Šiandien</button>}
        </div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"16px 16px 0"}}>
        <ActivityWidget
          userId={user.id}
          weightKg={wt}
          date={selectedDate}
          onActivityChange={(st, wt2) => onActivityChange?.(st, wt2)}
        />
      </div>
    </div>
  );
}