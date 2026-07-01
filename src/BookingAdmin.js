import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";

const DAYS = ["Pirmadienis","Antradienis","Trečiadienis","Ketvirtadienis","Penktadienis","Šeštadienis","Sekmadienis"];
const STATUS_LABEL = { pending:"⏳ Laukia", approved:"✅ Patvirtinta", rejected:"❌ Atmesta", cancelled:"🚫 Atšaukta" };
const STATUS_COLOR = { pending:"rgba(255,200,0,0.2)", approved:"rgba(127,255,176,0.15)", rejected:"rgba(255,100,100,0.15)", cancelled:"rgba(255,255,255,0.05)" };

function AdminCancelButton({ booking, clientName, onCancelled }) {
  const [open,   setOpen]   = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCancel() {
    if (!reason.trim()) return;
    setSaving(true);
    await pb.collection("bookings").update(booking.id, {
      status:        "cancelled",
      cancel_reason: reason.trim(),
      cancelled_by:  "trainer",
    }).catch(()=>{});
    setSaving(false);
    setOpen(false);
    onCancelled();
  }

  if (!open) return (
    <button onClick={()=>setOpen(true)} style={{flex:1,padding:"9px",borderRadius:10,border:"1px solid rgba(255,150,100,0.4)",background:"rgba(255,100,50,0.1)",color:"#FF9966",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
      🚫 Atšaukti
    </button>
  );

  return (
    <div style={{marginTop:8,background:"rgba(255,50,50,0.08)",borderRadius:10,padding:10,border:"1px solid rgba(255,100,100,0.25)"}}>
      <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Atšaukimo priežastis klientui..." rows={2}
        style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,100,100,0.25)",background:"rgba(0,0,0,0.2)",color:"#fff",fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box",marginBottom:8}}/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setOpen(false)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Atgal</button>
        <button onClick={handleCancel} disabled={!reason.trim()||saving} style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:reason.trim()?"rgba(200,50,50,0.6)":"rgba(255,255,255,0.1)",color:"#fff",fontSize:12,fontWeight:700,cursor:reason.trim()?"pointer":"default",fontFamily:"inherit"}}>
          {saving?"Atšaukiama...":"Patvirtinti"}
        </button>
      </div>
    </div>
  );
}

function downloadIcal(booking, clientName) {
  const dt = booking.date.replace(/-/g,"");
  const startDt = dt + "T" + booking.start_time.replace(":","") + "00";
  const endDt   = dt + "T" + booking.end_time.replace(":","") + "00";
  const ical = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CoachVilma//LT",
    "BEGIN:VEVENT",
    `DTSTART:${startDt}`,`DTEND:${endDt}`,
    `SUMMARY:Treniruotė – ${clientName} (${booking.start_time}–${booking.end_time})`,
    `LOCATION:Gym+ Dariaus ir Girėno g. 2\\, Vilnius\\, 02158 Vilniaus m. sav.`,
    `GEO:54.668750;25.279780`,
    `DESCRIPTION:Klientas: ${clientName}\\nLaikas: ${booking.start_time}–${booking.end_time}${booking.notes ? "\\nKomentaras: " + booking.notes : ""}\\nVieta: Gym+ Dariaus ir Girėno g. 2\\, Vilnius`,
    `STATUS:CONFIRMED`,
    "END:VEVENT","END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ical], { type:"text/calendar" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href=url; a.download=`treniruote-${clientName.replace(/\s/g,"-")}.ics`; a.click();
  URL.revokeObjectURL(url);
}

function timeToMin(t) { const [h,m] = t.split(":").map(Number); return h*60+m; }
function minToTime(m) { return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }
function todayStr() { return new Date().toISOString().split("T")[0]; }

const inp = { padding:"9px 8px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", WebkitAppearance:"none" };

const HOURS = Array.from({length:24}, (_,i)=>String(i).padStart(2,"0"));
const MINUTES = ["00","05","10","15","20","25","30","35","40","45","50","55"];

function TimeSelect({ value, onChange }) {
  const [h,m] = (value || "10:00").split(":");
  return (
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      <select value={h} onChange={e=>onChange(`${e.target.value}:${m}`)} style={{...inp,flex:1,minWidth:0,textAlign:"center"}}>
        {HOURS.map(hh=><option key={hh} value={hh} style={{background:"#3a0a20"}}>{hh}</option>)}
      </select>
      <span style={{color:"rgba(255,255,255,0.5)",fontSize:13}}>:</span>
      <select value={m} onChange={e=>onChange(`${h}:${e.target.value}`)} style={{...inp,flex:1,minWidth:0,textAlign:"center"}}>
        {MINUTES.map(mm=><option key={mm} value={mm} style={{background:"#3a0a20"}}>{mm}</option>)}
      </select>
    </div>
  );
}

// ── Konkrečių laikų blokavimas ──────────────────────────────────────────────
function ScheduleExceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [form, setForm]             = useState({ date: todayStr(), start_time:"10:00", end_time:"11:00", reason:"" });
  const [saving, setSaving]         = useState(false);

  function load() {
    setLoading(true);
    pb.collection("schedule_exceptions").getFullList({ sort:"date,start_time", requestKey:null })
      .then(data => { setExceptions(data.filter(e => e.date >= todayStr())); setLoading(false); })
      .catch(()=>setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!form.date || !form.start_time || !form.end_time) return;
    setSaving(true);
    await pb.collection("schedule_exceptions").create(form).catch(()=>{});
    setSaving(false);
    setShowAdd(false);
    setForm({ date: todayStr(), start_time:"10:00", end_time:"11:00", reason:"" });
    load();
  }

  async function handleDelete(id) {
    await pb.collection("schedule_exceptions").delete(id).catch(()=>{});
    load();
  }

  return (
    <div style={{marginTop:24}}>
      <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Konkrečių laikų blokavimas</p>
      <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:12}}>Pvz. atostogos, asmeniniai reikalai, konkreti valanda kažkurią dieną kai esate užimta.</p>

      {loading && <p style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>Kraunama...</p>}

      {!loading && exceptions.length === 0 && !showAdd && (
        <p style={{color:"rgba(255,255,255,0.35)",fontSize:12,marginBottom:12}}>Blokuotų laikų nėra</p>
      )}

      {exceptions.map(ex => (
        <div key={ex.id} style={{background:"rgba(255,100,100,0.08)",border:"1px solid rgba(255,100,100,0.2)",borderRadius:12,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>📅 {ex.date} · {ex.start_time}–{ex.end_time}</p>
            {ex.reason && <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{ex.reason}</p>}
          </div>
          <button onClick={()=>handleDelete(ex.id)} style={{background:"rgba(255,100,100,0.15)",border:"1px solid rgba(255,100,100,0.3)",borderRadius:8,padding:"6px 10px",color:"#FF8888",cursor:"pointer",fontSize:12}}>✕</button>
        </div>
      ))}

      {!showAdd ? (
        <button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:"11px",borderRadius:12,border:"2px dashed rgba(255,255,255,0.25)",background:"transparent",color:"rgba(255,255,255,0.7)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
          + Blokuoti laiką
        </button>
      ) : (
        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:14,marginTop:4}}>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Data</label>
            <input type="date" value={form.date} min={todayStr()} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{...inp,width:"100%"}}/>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1,minWidth:0}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Nuo</label>
              <TimeSelect value={form.start_time} onChange={v=>setForm(f=>({...f,start_time:v}))} />
            </div>
            <div style={{flex:1,minWidth:0}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Iki</label>
              <TimeSelect value={form.end_time} onChange={v=>setForm(f=>({...f,end_time:v}))} />
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Priežastis (nebūtina)</label>
            <input type="text" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} placeholder="pvz. Asmeninis reikalas" style={{...inp,width:"100%"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Atšaukti</button>
            <button onClick={handleAdd} disabled={saving} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {saving?"Saugoma...":"Blokuoti"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
          slot_duration: 55, is_active: i < 5,
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
    <div style={{position:"fixed",inset:0,zIndex:600,background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)",overflowY:"auto",paddingBottom:80,fontFamily:"-apple-system,sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"max(env(safe-area-inset-top),16px) 20px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
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
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div style={{display:"flex",gap:8}}>
                  {[{k:"start_time",l:"Nuo"},{k:"end_time",l:"Iki"}].map(f=>(
                    <div key={f.k} style={{flex:1,minWidth:0}}>
                      <label style={{fontSize:10,color:"rgba(255,255,255,0.5)",display:"block",marginBottom:4}}>{f.l}</label>
                      <TimeSelect value={day[f.k]} onChange={v=>update(i,f.k,v)} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{fontSize:10,color:"rgba(255,255,255,0.5)",display:"block",marginBottom:4}}>Trukmė (min)</label>
                  <select value={day.slot_duration} onChange={e=>update(i,"slot_duration",parseInt(e.target.value))} style={{...inp,width:"100%"}}>
                    {[30,45,50,55,60,90,120].map(m=><option key={m} value={m} style={{background:"#3a0a20"}}>{m} min</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:"14px",borderRadius:14,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:saving?0.7:1,marginTop:8}}>
          {saving?"Saugoma...":"💾 Išsaugoti"}
        </button>

        <ScheduleExceptions />
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
    <div style={{position:"fixed",inset:0,zIndex:500,background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",overflowY:"auto",paddingBottom:80,fontFamily:"-apple-system,sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"max(env(safe-area-inset-top),16px) 20px 16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer"}}>← Atgal</button>
        <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0,flex:1}}>📅 Rezervacijos</h1>
        <button onClick={()=>setView("schedule")} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>⚙️ Darbo laikas</button>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:16}}>
        {/* Filtrai */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{k:"pending",l:"Laukia"},{k:"approved",l:"Patvirtintos"},{k:"rejected",l:"Atmestos"},{k:"cancelled",l:"Atšauktos"},{k:"all",l:"Visos"}].map(f=>(
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
                  {b.cancel_reason && <p style={{fontSize:11,color:"rgba(255,130,130,0.7)",margin:"4px 0 0"}}>🚫 {b.cancelled_by==="client"?"Klientas":"Trenerė"}: {b.cancel_reason}</p>}
                </div>
                <span style={{fontSize:11,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"3px 10px",whiteSpace:"nowrap"}}>{STATUS_LABEL[b.status]}</span>
              </div>
              {b.status==="pending" && (
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={()=>updateStatus(b.id,"rejected")} style={{flex:1,padding:"9px",borderRadius:10,border:"1px solid rgba(255,100,100,0.4)",background:"rgba(255,100,100,0.1)",color:"#FF8888",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✕ Atmesti</button>
                  <button onClick={()=>updateStatus(b.id,"approved")} style={{flex:2,padding:"9px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#1a4731,#276749)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✓ Patvirtinti</button>
                </div>
              )}
              {b.status==="approved" && (
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={()=>downloadIcal(b, client?.name||"Klientas")} style={{flex:2,padding:"9px",borderRadius:10,border:"1px solid rgba(127,255,176,0.4)",background:"rgba(127,255,176,0.1)",color:"#7FFFB0",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    📲 Įtraukti į kalendorių
                  </button>
                  <AdminCancelButton booking={b} clientName={client?.name||"Klientas"} onCancelled={load} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
