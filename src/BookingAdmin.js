import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";

const DAYS = ["Pirmadienis","Antradienis","Trečiadienis","Ketvirtadienis","Penktadienis","Šeštadienis","Sekmadienis"];
const STATUS_LABEL = { pending:"⏳ Laukia", approved:"✅ Patvirtinta", rejected:"❌ Atmesta" };
const STATUS_COLOR = { pending:"rgba(255,200,0,0.2)", approved:"rgba(127,255,176,0.15)", rejected:"rgba(255,100,100,0.15)" };

function timeToMin(t) { const [h,m] = t.split(":").map(Number); return h*60+m; }
function minToTime(m) { return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }

const inp = { padding:"9px 12px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };

// ── Darbo laiko nustatymas ─────────────────────────────────────────────────────
function ScheduleSettings({ onClose }) {
  const [schedule, setSchedule] = useState([]);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    pb.collection("trainer_schedule").getFullList({ sort:"day_of_week", requestKey:null })
      .then(data => {
        if (data.length) { setSchedule(data); return; }
        // Numatytasis grafikas I-V 10:00-19:00
        setSchedule(Array.from({length:7}, (_,i) => ({
          id: null, day_of_week: i+1, start_time:"10:00", end_time:"19:00",
          slot_duration: 60, is_active: i < 5,
        })));
      }).catch(()=>{});
  }, []);

  async function handleSave() {
    setSaving(true);
    for (const day of schedule) {
      const data = { day_of_week:day.day_of_week, start_time:day.start_time, end_time:day.end_time, slot_duration:day.slot_duration, is_active:day.is_active };
      if (day.id) await pb.collection("trainer_schedule").update(day.id, data).catch(()=>{});
      else { const rec = await pb.collection("trainer_schedule").create(data).catch(()=>null); if (rec) day.id = rec.id; }
    }
    setSaving(false);
    onClose();
  }

  function update(i, key, val) {
    setSchedule(prev => prev.map((d,j) => j===i ? {...d,[key]:val} : d));
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:600,background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)",overflowY:"auto",fontFamily:"-apple-system,sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer"}}>← Atgal</button>
        <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>Darbo laikas</h1>
      </div>
      <div style={{maxWidth:480,margin:"0 auto",padding:16}}>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:16}}>Nustatykite kuriomis dienomis ir valandomis priimate klientus. Laiko tarpas — kiek trunka viena treniruotė.</p>
        {schedule.map((day,i) => (
          <div key={i} style={{background:day.is_active?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",borderRadius:14,padding:"12px 14px",marginBottom:10,border:`1px solid ${day.is_active?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:day.is_active?10:0}}>
              <span style={{fontSize:13,fontWeight:700,color:day.is_active?"#fff":"rgba(255,255,255,0.4)"}}>{DAYS[i]}</span>
              <button onClick={()=>update(i,"is_active",!day.is_active)} style={{padding:"5px 14px",borderRadius:20,border:"none",background:day.is_active?"#AD1457":"rgba(255,255,255,0.12)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {day.is_active?"Aktyvi":"Neaktyvi"}
              </button>
            </div>
            {day.is_active && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[{k:"start_time",l:"Nuo"},{k:"end_time",l:"Iki"}].map(f=>(
                  <div key={f.k}>
                    <label style={{fontSize:10,color:"rgba(255,255,255,0.5)",display:"block",marginBottom:4}}>{f.l}</label>
                    <input type="time" value={day[f.k]} onChange={e=>update(i,f.k,e.target.value)} style={{...inp,width:"100%"}}/>
                  </div>
                ))}
                <div>
                  <label style={{fontSize:10,color:"rgba(255,255,255,0.5)",display:"block",marginBottom:4}}>Trukmė (min)</label>
                  <select value={day.slot_duration} onChange={e=>update(i,"slot_duration",parseInt(e.target.value))} style={{...inp,width:"100%"}}>
                    {[30,45,60,90,120].map(m=><option key={m} value={m} style={{background:"#3a0a20"}}>{m} min</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:"14px",borderRadius:14,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:saving?0.7:1,marginTop:8}}>
          {saving?"Saugoma...":"💾 Išsaugoti"}
        </button>
      </div>
    </div>
  );
}

// ── Rezervacijų sąrašas (admin) ───────────────────────────────────────────────
export default function BookingAdmin({ onClose }) {
  const [view, setView]           = useState("list"); // list | schedule
  const [bookings, setBookings]   = useState([]);
  const [clients, setClients]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const [bk, cl] = await Promise.all([
      pb.collection("bookings").getFullList({ sort:"-date,-start_time", requestKey:null }).catch(()=>[]),
      pb.collection("users").getFullList({ filter:'role="client"', requestKey:null }).catch(()=>[]),
    ]);
    const clientMap = {};
    cl.forEach(c => { clientMap[c.id] = c; });
    setBookings(bk);
    setClients(clientMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id, status) {
    await pb.collection("bookings").update(id, { status }).catch(()=>{});
    setBookings(prev => prev.map(b => b.id===id ? {...b,status} : b));
  }

  if (view === "schedule") return <ScheduleSettings onClose={()=>setView("list")} />;

  const filtered = bookings.filter(b => filter==="all" || b.status===filter);

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",overflowY:"auto",fontFamily:"-apple-system,sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"16px 20px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer"}}>← Atgal</button>
        <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0,flex:1}}>📅 Rezervacijos</h1>
        <button onClick={()=>setView("schedule")} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>⚙️ Darbo laikas</button>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:16}}>
        {/* Filtrai */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{k:"pending",l:"Laukia"},{k:"approved",l:"Patvirtintos"},{k:"rejected",l:"Atmestos"},{k:"all",l:"Visos"}].map(f=>(
            <button key={f.k} onClick={()=>setFilter(f.k)} style={{flex:1,padding:"8px 4px",borderRadius:12,border:"none",background:filter===f.k?"#AD1457":"rgba(255,255,255,0.1)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {f.l}{f.k!=="all"&&<span style={{marginLeft:4,opacity:0.7}}>({bookings.filter(b=>b.status===f.k).length})</span>}
            </button>
          ))}
        </div>

        {loading && <p style={{color:"rgba(255,255,255,0.4)",textAlign:"center",padding:"24px 0"}}>Kraunama...</p>}

        {!loading && filtered.length===0 && (
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:16,padding:"28px 16px",textAlign:"center",border:"2px dashed rgba(255,255,255,0.12)"}}>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>Rezervacijų nėra</p>
          </div>
        )}

        {filtered.map(b => {
          const client = clients[b.client_id];
          return (
            <div key={b.id} style={{background:STATUS_COLOR[b.status]||"rgba(255,255,255,0.08)",borderRadius:16,padding:"14px 16px",marginBottom:10,border:"1px solid rgba(255,255,255,0.12)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{client?.name||"Nežinomas"}</p>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",margin:0}}>
                    📅 {b.date} · ⏰ {b.start_time}–{b.end_time}
                  </p>
                  {b.notes && <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"4px 0 0",fontStyle:"italic"}}>"{b.notes}"</p>}
                </div>
                <span style={{fontSize:11,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"3px 10px",whiteSpace:"nowrap"}}>{STATUS_LABEL[b.status]}</span>
              </div>
              {b.status==="pending" && (
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={()=>updateStatus(b.id,"rejected")} style={{flex:1,padding:"9px",borderRadius:10,border:"1px solid rgba(255,100,100,0.4)",background:"rgba(255,100,100,0.1)",color:"#FF8888",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕ Atmesti</button>
                  <button onClick={()=>updateStatus(b.id,"approved")} style={{flex:2,padding:"9px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#1a4731,#276749)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Patvirtinti</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
