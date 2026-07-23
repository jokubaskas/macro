import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { RECURRING_DEADLINE_DOW, RECURRING_DEADLINE_TIME } from "./constants";
import { Timer, CheckCircle, Close, Ban, Calendar, ChevronLeft, Save, Repeat, Settings, Phone, Check, Sun, MessageCircle, Laptop, AlertTriangle, Trash } from "./ui/icons";
import { SearchInput, ShowMoreButton } from "./ui/kit";

const DAYS = ["Pirmadienis","Antradienis","Trečiadienis","Ketvirtadienis","Penktadienis","Šeštadienis","Sekmadienis"];
const MONTHS = ["Sausis","Vasaris","Kovas","Balandis","Gegužė","Birželis","Liepa","Rugpjūtis","Rugsėjis","Spalis","Lapkritis","Gruodis"];
const STATUS_LABEL = { pending:{Icon:Timer,label:"Laukia"}, approved:{Icon:CheckCircle,label:"Patvirtinta"}, rejected:{Icon:Close,label:"Atmesta"}, cancelled:{Icon:Ban,label:"Atšaukta"} };
const STATUS_COLOR = { pending:"rgba(255,200,0,0.2)", approved:"rgba(127,255,176,0.15)", rejected:"rgba(255,100,100,0.15)", cancelled:"rgba(255,255,255,0.05)" };

// Laukiančios rezervacijos atmetimas/patvirtinimas — atmetimas leidžia
// įrašyti priežastį, kurią klientas pamatys laiške/pranešime (analogiškai
// AdminCancelButton žemiau, skirtam jau patvirtintoms rezervacijoms).
function PendingBookingActions({ booking, clientName, onApprove, onDone }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason,    setReason]    = useState("");
  const [saving,    setSaving]    = useState(false);

  async function handleReject() {
    if (!reason.trim()) return;
    setSaving(true);
    await pb.collection("bookings").update(booking.id, {
      status:        "rejected",
      cancel_reason: reason.trim(),
      cancelled_by:  "trainer",
    }).catch(()=>{});
    setSaving(false);
    setRejecting(false);
    onDone();
  }

  if (rejecting) return (
    <div style={{marginTop:8,background:"rgba(255,50,50,0.08)",borderRadius:10,padding:10,border:"1px solid rgba(255,100,100,0.25)"}}>
      <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Atmetimo priežastis klientui..." rows={2}
        style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,100,100,0.25)",background:"rgba(0,0,0,0.2)",color:"#fff",fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box",marginBottom:8}}/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setRejecting(false)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Atgal</button>
        <button onClick={handleReject} disabled={!reason.trim()||saving} style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:reason.trim()?"rgba(200,50,50,0.6)":"rgba(255,255,255,0.1)",color:"#fff",fontSize:12,fontWeight:700,cursor:reason.trim()?"pointer":"default",fontFamily:"inherit"}}>
          {saving?"Atmetama...":"Patvirtinti atmetimą"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",gap:8,marginTop:8}}>
      <button onClick={()=>setRejecting(true)} style={{flex:1,padding:"9px",borderRadius:10,border:"1px solid rgba(255,100,100,0.4)",background:"rgba(255,100,100,0.1)",color:"#FF8888",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Close size={12} />Atmesti</button>
      <button onClick={onApprove} style={{flex:2,padding:"9px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#1a4731,#276749)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}><Check size={12} />Patvirtinti ir įtraukti į kalendorių</button>
    </div>
  );
}

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
    // Kredito grąžinimą atlieka serverio hook (bookings.pb.js) — čia
    // nebedubliuojame, kad kreditas nebūtų grąžintas du kartus.
    setSaving(false);
    setOpen(false);
    onCancelled();
  }

  if (!open) return (
    <button onClick={()=>setOpen(true)} style={{flex:1,padding:"9px",borderRadius:10,border:"1px solid rgba(255,150,100,0.4)",background:"rgba(255,100,50,0.1)",color:"#FF9966",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
      <Ban size={13} />Atšaukti
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

// ── Konkrečių laikų / laikotarpių (atostogų) blokavimas ─────────────────────
const ONLINE_COACHING_TEMPLATE = "Šiuo metu atostogauju ir gyvai treniruočių nevedu, bet galite kreiptis dėl online coaching — parašykite man.";

function ScheduleExceptions() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [form, setForm]             = useState({ date: todayStr(), end_date:"", all_day:false, start_time:"10:00", end_time:"11:00", reason:"", client_message:"" });
  const [saving, setSaving]         = useState(false);

  function load() {
    setLoading(true);
    pb.collection("schedule_exceptions").getFullList({ sort:"date,start_time", requestKey:null })
      .then(data => { setExceptions(data.filter(e => (e.end_date || e.date) >= todayStr())); setLoading(false); })
      .catch(()=>setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleAdd() {
    if (!form.date) return;
    setSaving(true);
    const data = {
      date: form.date,
      end_date: form.end_date || form.date,
      all_day: form.all_day,
      start_time: form.all_day ? "00:00" : form.start_time,
      end_time: form.all_day ? "23:59" : form.end_time,
      reason: form.reason,
      client_message: form.client_message.trim(),
    };
    await pb.collection("schedule_exceptions").create(data).catch(()=>{});
    setSaving(false);
    setShowAdd(false);
    setForm({ date: todayStr(), end_date:"", all_day:false, start_time:"10:00", end_time:"11:00", reason:"", client_message:"" });
    load();
  }

  async function handleDelete(id) {
    await pb.collection("schedule_exceptions").delete(id).catch(()=>{});
    load();
  }

  return (
    <div style={{marginTop:24}}>
      <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Laikų / atostogų blokavimas</p>
      <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:12}}>Pažymėkite konkrečią valandą arba visą laikotarpį (pvz. atostogas) — klientai tada tų dienų negalės rezervuoti ir pamatys jūsų žinutę.</p>

      {loading && <p style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>Kraunama...</p>}

      {!loading && exceptions.length === 0 && !showAdd && (
        <p style={{color:"rgba(255,255,255,0.35)",fontSize:12,marginBottom:12}}>Blokuotų laikų nėra</p>
      )}

      {exceptions.map(ex => {
        const isRange = ex.end_date && ex.end_date !== ex.date;
        return (
          <div key={ex.id} style={{background:"linear-gradient(135deg,rgba(255,100,100,0.14),rgba(255,100,100,0.04))",border:"1px solid rgba(255,100,100,0.25)",borderRadius:16,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"flex-start",gap:10}}>
            <span style={{width:34,height:34,borderRadius:"50%",background:"rgba(255,100,100,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {ex.all_day ? <Sun size={15} color="#FF8888" /> : <Timer size={15} color="#FF8888" />}
            </span>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:"0 0 3px",display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                <Calendar size={11} />{ex.date}{isRange && <>–{ex.end_date}</>}
                {ex.all_day
                  ? <span style={{fontSize:9,fontWeight:700,color:"#FF8888",background:"rgba(255,100,100,0.18)",borderRadius:6,padding:"2px 6px",display:"inline-flex",alignItems:"center",gap:3}}><Ban size={9} />Visa diena</span>
                  : <span style={{fontSize:11,fontWeight:400,color:"rgba(255,255,255,0.6)"}}>{ex.start_time}–{ex.end_time}</span>}
              </p>
              {ex.reason && <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:"0 0 2px"}}>{ex.reason}</p>}
              {ex.client_message && <p style={{fontSize:11,color:"#7FC9FF",margin:0,display:"flex",alignItems:"flex-start",gap:4}}><MessageCircle size={11} style={{marginTop:1,flexShrink:0}} />{ex.client_message}</p>}
            </div>
            <button onClick={()=>handleDelete(ex.id)} style={{background:"rgba(255,100,100,0.15)",border:"1px solid rgba(255,100,100,0.3)",borderRadius:8,padding:"6px 10px",color:"#FF8888",cursor:"pointer",fontSize:12,flexShrink:0}}><Close size={12} /></button>
          </div>
        );
      })}

      {!showAdd ? (
        <button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:"11px",borderRadius:12,border:"2px dashed rgba(255,255,255,0.25)",background:"transparent",color:"rgba(255,255,255,0.7)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
          + Blokuoti laiką arba laikotarpį
        </button>
      ) : (
        <div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:14,marginTop:4}}>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1,minWidth:0}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Nuo</label>
              <input type="date" value={form.date} min={todayStr()} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{...inp,width:"100%"}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Iki (nebūtina)</label>
              <input type="date" value={form.end_date} min={form.date} onChange={e=>setForm(f=>({...f,end_date:e.target.value}))} style={{...inp,width:"100%"}}/>
            </div>
          </div>

          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <button onClick={()=>setForm(f=>({...f,all_day:false}))} style={{flex:1,padding:"12px 8px",borderRadius:12,border:`1.5px solid ${!form.all_day?"#AD1457":"rgba(255,255,255,0.15)"}`,background:!form.all_day?"rgba(173,20,87,0.22)":"rgba(255,255,255,0.06)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <Timer size={16} color={!form.all_day?"#FF6EB4":"rgba(255,255,255,0.4)"} />
              Konkreti valanda
            </button>
            <button onClick={()=>setForm(f=>({...f,all_day:true}))} style={{flex:1,padding:"12px 8px",borderRadius:12,border:`1.5px solid ${form.all_day?"#AD1457":"rgba(255,255,255,0.15)"}`,background:form.all_day?"rgba(173,20,87,0.22)":"rgba(255,255,255,0.06)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <Sun size={16} color={form.all_day?"#FFD700":"rgba(255,255,255,0.4)"} />
              Visa diena (atostogos)
            </button>
          </div>

          {!form.all_day && (
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1,minWidth:0}}>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Nuo valandos</label>
                <TimeSelect value={form.start_time} onChange={v=>setForm(f=>({...f,start_time:v}))} />
              </div>
              <div style={{flex:1,minWidth:0}}>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Iki valandos</label>
                <TimeSelect value={form.end_time} onChange={v=>setForm(f=>({...f,end_time:v}))} />
              </div>
            </div>
          )}

          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Priežastis (matote tik jūs)</label>
            <input type="text" value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} placeholder="pvz. Atostogos" style={{...inp,width:"100%"}}/>
          </div>

          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>Žinutė klientams (nebūtina, matys jie)</label>
              <button onClick={()=>setForm(f=>({...f,client_message:ONLINE_COACHING_TEMPLATE}))} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:7,padding:"3px 8px",color:"rgba(255,255,255,0.7)",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                <Laptop size={10} />+ online coaching
              </button>
            </div>
            <textarea value={form.client_message} onChange={e=>setForm(f=>({...f,client_message:e.target.value}))} placeholder="pvz. Atostogauju, bet galite kreiptis dėl online coaching..." rows={3}
              style={{...inp,width:"100%",resize:"none"}}/>
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
  const [error, setError]       = useState("");

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
    setError("");
    const failed = [];
    const updated = [...schedule];
    for (let i = 0; i < updated.length; i++) {
      const day = updated[i];
      const data = { day_of_week:day.day_of_week, start_time:day.start_time, end_time:day.end_time, slot_duration:day.slot_duration, is_active:day.is_active };
      if (day.id) {
        await pb.collection("trainer_schedule").update(day.id, data).catch(err => failed.push({ day: DAYS[i], err }));
      } else {
        const rec = await pb.collection("trainer_schedule").create(data).catch(err => { failed.push({ day: DAYS[i], err }); return null; });
        if (rec) updated[i] = { ...day, id: rec.id };
      }
    }
    setSchedule(updated);
    setSaving(false);
    if (failed.length) {
      const status = failed[0].err?.status;
      setError(status === 403
        ? `Nepavyko išsaugoti (${failed.map(f=>f.day).join(", ")}) — PocketBase blokuoja įrašymą (403). Reikia patikrinti "trainer_schedule" kolekcijos Create/Update taisykles admin panelėje.`
        : `Nepavyko išsaugoti (${failed.map(f=>f.day).join(", ")}): ${failed[0].err?.message || "nežinoma klaida"}`);
      return;
    }
    onClose();
  }

  function update(i, key, val) {
    setSchedule(prev => prev.map((d,j) => j===i ? {...d,[key]:val} : d));
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:600,background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)",overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:80,fontFamily:"-apple-system,sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><ChevronLeft size={14} />Atgal</button>
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

        {error && (
          <div style={{background:"rgba(255,100,100,0.12)",border:"1px solid rgba(255,100,100,0.3)",borderRadius:12,padding:"10px 12px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:8}}>
            <AlertTriangle size={14} color="#FF8888" style={{flexShrink:0,marginTop:1}} />
            <p style={{fontSize:12,color:"#FFB3B3",margin:0}}>{error}</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:"14px",borderRadius:14,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:saving?0.7:1,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {saving?"Saugoma...":<><Save size={14} />Išsaugoti</>}
        </button>

        <ScheduleExceptions />
      </div>
    </div>
  );
}

// ── Klientų įprasti (pastovūs) laikai ─────────────────────────────────────────
function RecurringSlotsSettings({ onClose }) {
  const [slots, setSlots]     = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ client_id:"", day_of_week:1, start_time:"18:00", end_time:"19:00" });
  const [saving, setSaving]   = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      pb.collection("recurring_slots").getFullList({ sort:"day_of_week,start_time", requestKey:null }).catch(()=>[]),
      pb.collection("users").getFullList({ filter:'role="client"', sort:"name", requestKey:null }).catch(()=>[]),
    ]).then(([sl, cl]) => { setSlots(sl); setClients(cl); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  const clientMap = {};
  clients.forEach(c => { clientMap[c.id] = c; });

  async function handleAdd() {
    if (!form.client_id) return;
    setSaving(true);
    await pb.collection("recurring_slots").create({ ...form, is_active: true }).catch(()=>{});
    setSaving(false);
    setShowAdd(false);
    setForm({ client_id:"", day_of_week:1, start_time:"18:00", end_time:"19:00" });
    load();
  }

  async function toggleActive(slot) {
    await pb.collection("recurring_slots").update(slot.id, { is_active: !slot.is_active }).catch(()=>{});
    load();
  }

  async function handleDelete(id) {
    await pb.collection("recurring_slots").delete(id).catch(()=>{});
    load();
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:600,background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)",overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:80,fontFamily:"-apple-system,sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0,display:"flex",alignItems:"center",gap:6}}><Repeat size={15} />Įprasti laikai</h1>
      </div>
      <div style={{maxWidth:480,margin:"0 auto",padding:16}}>
        <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:16}}>
          Priskirkite klientui pastovų savaitės laiką — jis automatiškai laikomas rezervuotas jam kiekvieną savaitę.
          Jei klientas nepatvirtina (paketo kreditu) iki {DAYS[RECURRING_DEADLINE_DOW-1].toLowerCase()}os {RECURRING_DEADLINE_TIME},
          laikas nuo kitos dienos atsilaisvina ir tampa matomas visiems klientams tai savaitei.
        </p>

        {loading && <p style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>Kraunama...</p>}
        {!loading && slots.length===0 && !showAdd && (
          <p style={{color:"rgba(255,255,255,0.35)",fontSize:12,marginBottom:12}}>Įprastų laikų nėra</p>
        )}

        {slots.map(s => (
          <div key={s.id} style={{background:s.is_active?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${s.is_active?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}`,borderRadius:14,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <p style={{fontSize:13,fontWeight:700,color:s.is_active?"#fff":"rgba(255,255,255,0.4)",margin:"0 0 2px"}}>{clientMap[s.client_id]?.name || "Nežinomas klientas"}</p>
              <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>{DAYS[s.day_of_week-1]} · {s.start_time}–{s.end_time}</p>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>toggleActive(s)} style={{padding:"5px 10px",borderRadius:8,border:"none",background:s.is_active?"#AD1457":"rgba(255,255,255,0.12)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {s.is_active?"Aktyvus":"Pristabdyta"}
              </button>
              <button onClick={()=>handleDelete(s.id)} style={{background:"rgba(255,100,100,0.15)",border:"1px solid rgba(255,100,100,0.3)",borderRadius:8,padding:"6px 10px",color:"#FF8888",cursor:"pointer",fontSize:12}}><Close size={12} /></button>
            </div>
          </div>
        ))}

        {!showAdd ? (
          <button onClick={()=>setShowAdd(true)} style={{width:"100%",padding:"11px",borderRadius:12,border:"2px dashed rgba(255,255,255,0.25)",background:"transparent",color:"rgba(255,255,255,0.7)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
            + Priskirti įprastą laiką
          </button>
        ) : (
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:14,marginTop:4}}>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Klientas</label>
              <select value={form.client_id} onChange={e=>setForm(f=>({...f,client_id:e.target.value}))} style={{...inp,width:"100%"}}>
                <option value="" style={{background:"#3a0a20"}}>— Pasirinkite —</option>
                {clients.map(c => <option key={c.id} value={c.id} style={{background:"#3a0a20"}}>{c.name}</option>)}
              </select>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Savaitės diena</label>
              <select value={form.day_of_week} onChange={e=>setForm(f=>({...f,day_of_week:parseInt(e.target.value)}))} style={{...inp,width:"100%"}}>
                {DAYS.map((d,i) => <option key={i} value={i+1} style={{background:"#3a0a20"}}>{d}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{flex:1,minWidth:0}}>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Nuo</label>
                <TimeSelect value={form.start_time} onChange={v=>setForm(f=>({...f,start_time:v}))} />
              </div>
              <div style={{flex:1,minWidth:0}}>
                <label style={{fontSize:11,color:"rgba(255,255,255,0.6)",display:"block",marginBottom:5}}>Iki</label>
                <TimeSelect value={form.end_time} onChange={v=>setForm(f=>({...f,end_time:v}))} />
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowAdd(false)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Atšaukti</button>
              <button onClick={handleAdd} disabled={saving||!form.client_id} style={{flex:2,padding:"10px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {saving?"Saugoma...":"Priskirti"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Treniruočių kalendorius (admin) ───────────────────────────────────────────
// Rodo mėnesio tinklelį — dienos su patvirtintomis treniruotėmis pažymėtos,
// paspaudus dieną matoma visų tos dienos treniruočių (klientų) apžvalga.
function TrainerCalendar({ bookings, clients, onClose }) {
  const [calMonth, setCalMonth] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);
  const today = todayStr();

  const daysInMonth = new Date(calMonth.y, calMonth.m+1, 0).getDate();
  const firstDay = new Date(calMonth.y, calMonth.m, 1).getDay();
  const offset = firstDay===0 ? 6 : firstDay-1;

  const approvedByDate = {};
  bookings.forEach(b => {
    if (b.status !== "approved") return;
    (approvedByDate[b.date] ||= []).push(b);
  });

  const dayBookings = selectedDate
    ? (approvedByDate[selectedDate]||[]).slice().sort((a,b)=>timeToMin(a.start_time)-timeToMin(b.start_time))
    : [];

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:80,fontFamily:"-apple-system,sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0,display:"flex",alignItems:"center",gap:6}}><Calendar size={15} />Treniruočių kalendorius</h1>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:16}}>
        <div style={{background:"rgba(0,0,0,0.2)",borderRadius:16,padding:16,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <button onClick={()=>setCalMonth(p=>{ const d=new Date(p.y,p.m-1,1); return{y:d.getFullYear(),m:d.getMonth()}; })}
              style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:14}}>◀</button>
            <span style={{color:"#fff",fontWeight:700,fontSize:14}}>{MONTHS[calMonth.m]} {calMonth.y}</span>
            <button onClick={()=>setCalMonth(p=>{ const d=new Date(p.y,p.m+1,1); return{y:d.getFullYear(),m:d.getMonth()}; })}
              style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:14}}>▶</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
            {["P","A","T","K","P","Š","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:9,color:"rgba(255,255,255,0.35)"}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {Array(offset).fill(null).map((_,i)=><div key={"e"+i}/>)}
            {Array(daysInMonth).fill(null).map((_,i)=>{
              const d=i+1;
              const ds=`${calMonth.y}-${String(calMonth.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
              const dayBk = approvedByDate[ds] || [];
              const count = dayBk.length;
              const isSel = selectedDate===ds;
              const isToday = ds===today;
              const isPast = ds<today;
              return (
                <button key={d} onClick={()=>setSelectedDate(ds)} style={{
                  aspectRatio:"1", borderRadius:8,
                  border: isSel ? "2px solid rgba(255,255,255,0.9)" : isToday ? "1.5px solid rgba(255,255,255,0.5)" : "none",
                  background: isSel ? "rgba(255,255,255,0.25)" : count>0 ? "rgba(46,204,113,0.3)" : "transparent",
                  color: count>0 ? "#fff" : isPast ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
                  fontWeight: count>0?700:400, fontSize:12, cursor:"pointer", fontFamily:"inherit", position:"relative",
                }}>
                  {d}
                  {count>0 && <span style={{position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)",fontSize:8,fontWeight:800,color:"#2ECC71",background:"rgba(0,0,0,0.4)",borderRadius:6,padding:"0 3px",lineHeight:1.4}}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div style={{background:"rgba(0,0,0,0.2)",borderRadius:16,padding:16}}>
            <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:"0 0 12px",display:"flex",alignItems:"center",gap:6}}><Calendar size={13} />{selectedDate}</p>
            {dayBookings.length===0 ? (
              <p style={{color:"rgba(255,255,255,0.35)",fontSize:13,textAlign:"center",padding:"16px 0"}}>Šią dieną treniruočių nėra</p>
            ) : (
              dayBookings.map(b => (
                <div key={b.id} style={{background:"rgba(255,255,255,0.08)",borderRadius:12,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{clients[b.client_id]?.name||"Nežinomas"}</p>
                    {b.notes && <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:0,fontStyle:"italic"}}>"{b.notes}"</p>}
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:"#7FFFB0",display:"flex",alignItems:"center",gap:4,flexShrink:0}}><Timer size={12} />{b.start_time}–{b.end_time}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Rezervacijų sąrašas (admin) ───────────────────────────────────────────────
export default function BookingAdmin({ onClose }) {
  const [view, setView]           = useState("list"); // list | schedule | recurring | calendar
  const [bookings, setBookings]   = useState([]);
  const [clients, setClients]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("pending");
  const [search, setSearch]       = useState("");
  const [visibleCount, setVisibleCount] = useState(8);
  const [showPast, setShowPast]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [bk, cl] = await Promise.all([
      pb.collection("bookings").getFullList({ sort:"-created", requestKey:null }).catch(()=>[]),
      pb.collection("users").getFullList({ filter:'role="client"', requestKey:null }).catch(()=>[]),
    ]);
    const clientMap = {};
    cl.forEach(c => { clientMap[c.id] = c; });
    setBookings(bk);
    setClients(clientMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);


  // Patvirtinant iškart parsiunčiamas .ics ir pažymima, kad jau įtraukta į
  // kalendorių — nebereikia atskiro veiksmo ir vėliau nebeaišku, ar jau pridėta.
  async function handleApprove(booking, clientName) {
    await pb.collection("bookings").update(booking.id, { status:"approved", added_to_calendar:true }).catch(()=>{});
    setBookings(prev => prev.map(b => b.id===booking.id ? {...b,status:"approved",added_to_calendar:true} : b));
    downloadIcal(booking, clientName);
  }

  async function handleAddToCalendar(booking, clientName) {
    downloadIcal(booking, clientName);
    await pb.collection("bookings").update(booking.id, { added_to_calendar:true }).catch(()=>{});
    setBookings(prev => prev.map(b => b.id===booking.id ? {...b,added_to_calendar:true} : b));
  }

  // Vienkartinis sutvarkymas senoms rezervacijoms, kurios jau realiai buvo
  // rankiniu būdu įtrauktos į kalendorių prieš atsirandant šiam žymėjimui —
  // pažymi visas kaip pridėtas, be pakartotinio atsisiuntimo.
  async function handleMarkAllAdded() {
    const toMark = bookings.filter(b => b.status==="approved" && !b.added_to_calendar);
    await Promise.all(toMark.map(b => pb.collection("bookings").update(b.id, { added_to_calendar:true }).catch(()=>{})));
    setBookings(prev => prev.map(b => (b.status==="approved" && !b.added_to_calendar) ? {...b,added_to_calendar:true} : b));
  }

  async function handleDelete(id) {
    if (!window.confirm("Ištrinti šį rezervacijos įrašą visam laikui?")) return;
    await pb.collection("bookings").delete(id).catch(()=>{});
    setBookings(prev => prev.filter(b => b.id !== id));
  }

  if (view === "schedule") return <ScheduleSettings onClose={()=>setView("list")} />;
  if (view === "recurring") return <RecurringSlotsSettings onClose={()=>setView("list")} />;
  if (view === "calendar") return <TrainerCalendar bookings={bookings} clients={clients} onClose={()=>setView("list")} />;

  const today = todayStr();
  const statusFiltered = bookings.filter(b => filter==="all" || b.status===filter);
  const pastHidden = showPast ? statusFiltered : statusFiltered.filter(b => b.date >= today);
  const hiddenPastCount = statusFiltered.length - pastHidden.length;
  const q = search.trim().toLowerCase();
  const filtered = q ? pastHidden.filter(b => clients[b.client_id]?.name?.toLowerCase().includes(q)) : pastHidden;

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:80,fontFamily:"-apple-system,sans-serif"}}>
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",position:"sticky",top:0,zIndex:10}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0,flex:1,display:"flex",alignItems:"center",gap:6}}><Calendar size={15} />Rezervacijos</h1>
        <button onClick={()=>setView("calendar")} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 12px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}><Calendar size={12} />Kalendorius</button>
        <button onClick={()=>setView("recurring")} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 12px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}><Repeat size={12} />Įprasti</button>
        <button onClick={()=>setView("schedule")} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 12px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}><Settings size={12} />Darbo laikas</button>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:16}}>
        {/* Filtrai */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{k:"pending",l:"Laukia"},{k:"approved",l:"Patvirtintos"},{k:"rejected",l:"Atmestos"},{k:"cancelled",l:"Atšauktos"},{k:"all",l:"Visos"}].map(f=>(
            <button key={f.k} onClick={()=>{setFilter(f.k);setVisibleCount(8);}} style={{flex:1,padding:"8px 4px",borderRadius:12,border:"none",background:filter===f.k?"#AD1457":"rgba(255,255,255,0.1)",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              {f.l}{f.k!=="all"&&<span style={{marginLeft:4,opacity:0.7}}>({bookings.filter(b=>b.status===f.k).length})</span>}
            </button>
          ))}
        </div>

        {filter==="approved" && bookings.some(b => b.status==="approved" && !b.added_to_calendar) && (
          <button onClick={handleMarkAllAdded} style={{width:"100%",padding:"10px",marginBottom:12,borderRadius:12,border:"1.5px dashed rgba(127,255,176,0.35)",background:"rgba(127,255,176,0.06)",color:"#7FFFB0",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <CheckCircle size={13} />Jau anksčiau pridėjau visas rankiniu būdu — pažymėti visas kaip pridėtas
          </button>
        )}

        {statusFiltered.length > 8 && (
          <SearchInput value={search} onChange={v=>{setSearch(v);setVisibleCount(8);}} placeholder="Ieškoti kliento pagal vardą..." />
        )}

        {(hiddenPastCount > 0 || showPast) && (
          <button onClick={()=>{setShowPast(s=>!s);setVisibleCount(8);}} style={{width:"100%",padding:"9px",marginBottom:12,borderRadius:12,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
            {showPast ? "Slėpti praeities įrašus" : `Rodyti praeities įrašus (${hiddenPastCount})`}
          </button>
        )}

        {loading && <p style={{color:"rgba(255,255,255,0.4)",textAlign:"center",padding:"24px 0"}}>Kraunama...</p>}

        {!loading && filtered.length===0 && (
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:16,padding:"28px 16px",textAlign:"center",border:"2px dashed rgba(255,255,255,0.12)"}}>
            <p style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>Rezervacijų nerasta</p>
          </div>
        )}

        {filtered.slice(0, visibleCount).map(b => {
          const client = clients[b.client_id];
          return (
            <div key={b.id} style={{background:STATUS_COLOR[b.status]||"rgba(255,255,255,0.08)",borderRadius:16,padding:"14px 16px",marginBottom:10,border:"1px solid rgba(255,255,255,0.12)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>{client?.name||"Nežinomas"}</p>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.5)",margin:0,display:"flex",alignItems:"center",gap:5}}>
                    <Calendar size={11} />{b.date} · <Timer size={11} />{b.start_time}–{b.end_time}
                  </p>
                  {b.notes && <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"4px 0 0",fontStyle:"italic"}}>"{b.notes}"</p>}
                  {b.cancel_reason && <p style={{fontSize:11,color:"rgba(255,130,130,0.7)",margin:"4px 0 0",display:"flex",alignItems:"center",gap:5}}><Ban size={11} />{b.cancelled_by==="client"?"Klientas":"Trenerė"}: {b.cancel_reason}</p>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                  <span style={{fontSize:11,fontWeight:700,color:"#fff",background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"3px 10px",whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:4}}>
                    {(() => { const st = STATUS_LABEL[b.status]; return st ? <><st.Icon size={11} />{st.label}</> : null; })()}
                  </span>
                  {b.status==="approved" && (
                    b.added_to_calendar ? (
                      <span style={{fontSize:9,fontWeight:700,color:"#7FFFB0",display:"inline-flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}><CheckCircle size={9} />Kalendoriuje</span>
                    ) : (
                      <span style={{fontSize:9,fontWeight:700,color:"#FFD700",display:"inline-flex",alignItems:"center",gap:3,whiteSpace:"nowrap"}}><AlertTriangle size={9} />Nepridėta</span>
                    )
                  )}
                </div>
              </div>
              {b.status==="pending" && (
                <PendingBookingActions booking={b} clientName={client?.name||"Klientas"}
                  onApprove={()=>handleApprove(b, client?.name||"Klientas")} onDone={load} />
              )}
              {b.status==="approved" && (
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  {b.added_to_calendar ? (
                    <div style={{flex:2,padding:"9px",borderRadius:10,border:"1px solid rgba(127,255,176,0.25)",background:"rgba(127,255,176,0.05)",color:"rgba(127,255,176,0.7)",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <CheckCircle size={13} />Kalendoriuje
                    </div>
                  ) : (
                    <button onClick={()=>handleAddToCalendar(b, client?.name||"Klientas")} style={{flex:2,padding:"9px",borderRadius:10,border:"1px solid rgba(127,255,176,0.4)",background:"rgba(127,255,176,0.1)",color:"#7FFFB0",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <Phone size={13} />Įtraukti į kalendorių
                    </button>
                  )}
                  <AdminCancelButton booking={b} clientName={client?.name||"Klientas"} onCancelled={load} />
                </div>
              )}
              {b.date < today && (
                <button onClick={()=>handleDelete(b.id)} style={{width:"100%",marginTop:8,padding:"8px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.04)",color:"rgba(255,255,255,0.45)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                  <Trash size={11} />Ištrinti įrašą
                </button>
              )}
            </div>
          );
        })}
        <ShowMoreButton remaining={filtered.length - visibleCount} onClick={() => setVisibleCount(v => v + 8)} />
      </div>
    </div>
  );
}