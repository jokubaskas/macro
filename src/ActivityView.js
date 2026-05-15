import { useState, useEffect } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { PK, calcMacros } from "./constants";
import ActivityWidget from "./ActivityWidget";

function todayStr() { return new Date().toISOString().split("T")[0]; }

function DatePickerModal({ value, minDate, onSelect, onClose }) {
  const today = todayStr();
  const init  = new Date(value+"T12:00:00");
  const [year,  setYear]  = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const minD = new Date((minDate||"2020-01-01")+"T12:00:00");
  const days = [];
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const offset = first===0?6:first-1;
  for (let i=0;i<offset;i++) days.push(null);
  for (let i=1;i<=daysInMonth;i++) days.push(i);

  function pick(d) {
    const s = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (s>today||new Date(s+"T12:00:00")<minD) return;
    onSelect(s); onClose();
  }
  function prevMonth() { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
  function nextMonth() {
    const next = month===11?new Date(year+1,0,1):new Date(year,month+1,1);
    if(next<=new Date(today+"T12:00:00")) { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }
  }
  const months=["Sausis","Vasaris","Kovas","Balandis","Gegužė","Birželis","Liepa","Rugpjūtis","Rugsėjis","Spalis","Lapkritis","Gruodis"];

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:`linear-gradient(160deg,#3a0a20,${PK.dark})`,borderRadius:"20px 20px 0 0",padding:"20px 16px 32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <button onClick={prevMonth} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:18,cursor:"pointer"}}>‹</button>
          <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>{months[month]} {year}</span>
          <button onClick={nextMonth} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:18,cursor:"pointer"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
          {["P","A","T","K","Pn","Š","S"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.4)",padding:"4px 0"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
          {days.map((d,i)=>{
            if(!d) return <div key={i}/>;
            const s=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const isToday=s===today,isSel=s===value,isFut=s>today,isPast=new Date(s+"T12:00:00")<minD;
            return (
              <button key={i} onClick={()=>pick(d)} disabled={isFut||isPast} style={{
                padding:"8px 4px",border:"none",borderRadius:10,cursor:isFut||isPast?"default":"pointer",
                background:isSel?"rgba(255,255,255,0.3)":isToday?"rgba(255,255,255,0.15)":"transparent",
                color:isFut||isPast?"rgba(255,255,255,0.2)":"#fff",
                fontSize:13,fontWeight:isSel||isToday?700:400,fontFamily:"inherit",
              }}>{d}</button>
            );
          })}
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:16,padding:"12px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:14,color:"rgba(255,255,255,0.7)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          Uždaryti
        </button>
      </div>
    </div>
  );
}

// ── Separator linija ──────────────────────────────────────────────────────────

export default function ActivityView({ user, onLogout, selectedDate, onDateChange, onActivityChange }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const isToday = (selectedDate||todayStr()) === todayStr();

  useEffect(() => {
  if (!user) return;
  console.log("ActivityView: loading user", user.id);
  pb.collection("users").getOne(user.id)
    .then(data => { 
      console.log("ActivityView: got data", data);
      setProfile(data); 
      setLoading(false); 
    })
    .catch(e => { 
      console.error("ActivityView load:", e); 
      setLoading(false); 
    });
}, [user.id]);

  if (loading || !profile) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg,#2d0a1a,${PK.dark},${PK.mid})`}}>
      <p style={{color:"rgba(255,255,255,0.6)",fontSize:14}}>Kraunama...</p>
    </div>
  );

  const wt = parseFloat(profile.weight) || 60;
  const minDate = new Date(Date.now()-90*24*60*60*1000).toISOString().split("T")[0];

  function handleDateSelect(d) {
    onDateChange?.(d);
    setShowCalendar(false);
  }

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,#2d0a1a 0%,${PK.dark} 40%,${PK.mid} 100%)`,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",paddingBottom:80}}>

      {showCalendar && (
        <DatePickerModal
          value={selectedDate||todayStr()}
          minDate={minDate}
          onSelect={handleDateSelect}
          onClose={()=>setShowCalendar(false)}
        />
      )}

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
          <button onClick={()=>setShowCalendar(true)} style={{background:"rgba(255,255,255,0.12)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:20,padding:"6px 14px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
            📅 {isToday?new Date().toLocaleDateString("lt-LT",{month:"short",day:"numeric"}):selectedDate}
            <span style={{fontSize:9,opacity:0.6}}>▼</span>
          </button>
          {!isToday&&<button onClick={()=>handleDateSelect(todayStr())} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:12,padding:"6px 10px",color:"rgba(255,255,255,0.6)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>← Šiandien</button>}
        </div>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"16px 16px 0"}}>
        <ActivityWidget
          userId={user.id}
          weightKg={wt}
          date={selectedDate||todayStr()}
          onActivityChange={(st, wt2) => onActivityChange?.(st, wt2)}
        />
      </div>
    </div>
  );
}