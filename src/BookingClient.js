import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { RECURRING_DEADLINE_DOW, RECURRING_DEADLINE_TIME, isRecurringHoldActive } from "./constants";

const PK = { dark:"#6D1B3B", mid:"#AD1457" };
const DOW_LABEL = ["Pirmadienį","Antradienį","Trečiadienį","Ketvirtadienį","Penktadienį","Šeštadienį","Sekmadienį"];
const MONTHS = ["Sausis","Vasaris","Kovas","Balandis","Gegužė","Birželis","Liepa","Rugpjūtis","Rugsėjis","Spalis","Lapkritis","Gruodis"];
const STATUS_INFO = {
  pending:   { emoji:"⏳", label:"Laukia patvirtinimo",   bg:"rgba(255,200,0,0.15)",   color:"#FFD700" },
  approved:  { emoji:"✅", label:"Patvirtinta",            bg:"rgba(127,255,176,0.15)", color:"#7FFFB0" },
  rejected:  { emoji:"❌", label:"Atmesta",                bg:"rgba(255,100,100,0.15)", color:"#FF8888" },
  cancelled: { emoji:"🚫", label:"Atšaukta",               bg:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)" },
};

function todayStr() { return new Date().toISOString().split("T")[0]; }
function timeToMin(t) { const [h,m] = t.split(":").map(Number); return h*60+m; }
function minToTime(m) { return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }
function dowOf(dateStr) { const d = new Date(dateStr + "T12:00:00"); return d.getDay() === 0 ? 7 : d.getDay(); }

// Generuoti laikų tarpus — visada prasideda lygia valanda, žingsnis 60 min
function generateSlots(start, end, duration) {
  const slots = [];
  // Suapvalinti pradžią iki artimiausios pilnos valandos į viršų
  let cur = Math.ceil(timeToMin(start) / 60) * 60;
  const last = timeToMin(end) - duration;
  while (cur <= last) {
    slots.push({ start: minToTime(cur), end: minToTime(cur + duration) });
    cur += 60; // visada kitas slotas po valandos
  }
  return slots;
}

// iCal eksportas
function downloadIcal(booking, clientName) {
  const dt = booking.date.replace(/-/g,"");
  const startDt = dt + "T" + booking.start_time.replace(":","") + "00";
  const endDt   = dt + "T" + booking.end_time.replace(":","") + "00";
  const ical = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CoachVilma//LT",
    "BEGIN:VEVENT",
    `DTSTART:${startDt}`,`DTEND:${endDt}`,
    `SUMMARY:Treniruotė su Coach Vilma`,
    `LOCATION:Gym+ Dariaus ir Girėno g. 2\\, Vilnius\\, 02158 Vilniaus m. sav.`,
    `GEO:54.668750;25.279780`,
    `DESCRIPTION:Treniruotė patvirtinta!\\nVieta: Gym+ Dariaus ir Girėno g. 2\\, Vilnius\\nGoogle Maps: https://maps.google.com/?q=Gym%2B+Dariaus+ir+Gir%C4%97no+g.+2+Vilnius`,
    `STATUS:CONFIRMED`,
    "END:VEVENT","END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ical], { type:"text/calendar" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href=url; a.download="treniruote.ics"; a.click();
  URL.revokeObjectURL(url);
}

function CancelButton({ booking, userId, onCancelled }) {
  const [open,   setOpen]   = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const isLate = booking.date <= todayStr(); // šiandien arba praeitis
  const warning = isLate ? "⚠️ Atsaukiant likus mažiau nei 1 dienai, pinigai negrąžinami!" : null;

  async function handleCancel() {
    if (!reason.trim()) return;
    setSaving(true);
    await pb.collection("bookings").update(booking.id, {
      status:       "cancelled",
      cancel_reason: reason.trim(),
      cancelled_by: "client",
    }).catch(()=>{});
    setSaving(false);
    setOpen(false);
    onCancelled();
  }

  if (!open) return (
    <button onClick={()=>setOpen(true)} style={{width:"100%",padding:"8px",borderRadius:10,border:"1px solid rgba(255,100,100,0.3)",background:"rgba(255,100,100,0.08)",color:"rgba(255,130,130,0.8)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginTop:6}}>
      Atšaukti rezervaciją
    </button>
  );

  return (
    <div style={{marginTop:8,background:"rgba(255,50,50,0.1)",borderRadius:12,padding:12,border:"1px solid rgba(255,100,100,0.3)"}}>
      {warning && <p style={{fontSize:12,color:"#FF8888",fontWeight:700,margin:"0 0 8px"}}>{warning}</p>}
      <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Nurodykite atšaukimo priežastį..." rows={2}
        style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,100,100,0.3)",background:"rgba(0,0,0,0.2)",color:"#fff",fontSize:12,fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box",marginBottom:8}}/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setOpen(false)} style={{flex:1,padding:"8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.2)",background:"transparent",color:"rgba(255,255,255,0.6)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Atgal</button>
        <button onClick={handleCancel} disabled={!reason.trim()||saving} style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:reason.trim()?"rgba(200,50,50,0.6)":"rgba(255,255,255,0.1)",color:"#fff",fontSize:12,fontWeight:700,cursor:reason.trim()?"pointer":"default",fontFamily:"inherit"}}>
          {saving?"Atšaukiama...":"Patvirtinti atšaukimą"}
        </button>
      </div>
    </div>
  );
}

export default function BookingClient({ user, onClose }) {
  const [schedule, setSchedule]     = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [takenSlots, setTakenSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes]           = useState("");
  const [saving, setSaving]         = useState(false);
  const [view, setView]             = useState("calendar"); // calendar | book | mybookings
  const [calMonth, setCalMonth]     = useState({ y: new Date().getFullYear(), m: new Date().getMonth() });
  const [activePackage, setActivePackage] = useState(null);
  const [recurringSlots, setRecurringSlots] = useState([]);
  const [confirmingRecurring, setConfirmingRecurring] = useState(false);

  const load = useCallback(async () => {
    const [sched, bk, exc, pkgs, rec] = await Promise.all([
      pb.collection("trainer_schedule").getFullList({ sort:"day_of_week", requestKey:null }).catch(()=>[]),
      pb.collection("bookings").getFullList({ filter:`client_id="${user.id}"`, sort:"-date", requestKey:null }).catch(()=>[]),
      pb.collection("schedule_exceptions").getFullList({ requestKey:null }).catch(()=>[]),
      pb.collection("training_packages").getFullList({ filter:`client_id="${user.id}" && status="approved"`, requestKey:null }).catch(()=>[]),
      pb.collection("recurring_slots").getFullList({ filter:`is_active=true`, requestKey:null }).catch(()=>[]),
    ]);
    setSchedule(sched);
    setMyBookings(bk);
    setExceptions(exc);
    const active = pkgs.find(p => (p.credits_total - p.credits_used) > 0) || null;
    setActivePackage(active);
    setRecurringSlots(rec);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  // Kai pasirenkama data — krauti užimtus laikus
  useEffect(() => {
    if (!selectedDate) return;
    pb.collection("bookings").getFullList({
      filter: `date="${selectedDate}" && (status="approved" || status="pending")`,
      requestKey: null,
    }).then(bk => setTakenSlots(bk.map(b => b.start_time))).catch(()=>{});
  }, [selectedDate]);

  function getScheduleForDate(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    const dow = d.getDay() === 0 ? 7 : d.getDay();
    return schedule.find(s => s.day_of_week === dow && s.is_active) || null;
  }

  function isDayAvailable(dateStr) {
    if (dateStr < todayStr()) return false;
    return !!getScheduleForDate(dateStr);
  }

  function isSlotBlocked(dateStr, slotStart, slotEnd) {
    const slotS = timeToMin(slotStart), slotE = timeToMin(slotEnd);
    return exceptions.some(ex => {
      if (ex.date !== dateStr) return false;
      const exS = timeToMin(ex.start_time), exE = timeToMin(ex.end_time);
      return slotS < exE && slotE > exS; // persidengia
    });
  }

  // Ar šiai datai/laikui yra priskirtas kažkieno įprastas (recurring) laikas,
  // kuris dar nepasibaigus terminui laikomas rezervuotas jam vienam.
  function reservedRecurringAt(dateStr, slotStart) {
    if (!isRecurringHoldActive(dateStr)) return null;
    const dow = dowOf(dateStr);
    return recurringSlots.find(r => r.day_of_week === dow && r.start_time === slotStart) || null;
  }

  function hasBookingFor(dateStr, slotStart) {
    return myBookings.some(b => b.date === dateStr && b.start_time === slotStart && b.status !== "cancelled" && b.status !== "rejected");
  }

  function hasMyPendingRecurringOn(dateStr) {
    return recurringSlots.some(r => r.client_id === user.id && r.day_of_week === dowOf(dateStr) && isRecurringHoldActive(dateStr) && !hasBookingFor(dateStr, r.start_time));
  }

  async function handleBook() {
    if (!selectedSlot || !selectedDate) return;
    if (!activePackage) { alert("Neturite aktyvaus treniruočių paketo. Pirmiausia įsigykite paketą."); return; }
    setSaving(true);
    await pb.collection("bookings").create({
      client_id:  user.id,
      date:       selectedDate,
      start_time: selectedSlot.start,
      end_time:   selectedSlot.end,
      status:     "pending",
      notes:      notes.trim(),
      package_id: activePackage.id,
    }).catch(()=>{});
    // Nuskaičiuoti kreditą
    await pb.collection("training_packages").update(activePackage.id, {
      credits_used: (activePackage.credits_used || 0) + 1,
    }).catch(()=>{});
    await load();
    setSaving(false);
    setView("mybookings");
    setSelectedDate(null); setSelectedSlot(null); setNotes("");
  }

  async function handleConfirmRecurring() {
    if (!myReservedSlot || !selectedDate) return;
    if (!activePackage) { alert("Neturite aktyvaus treniruočių paketo. Pirmiausia įsigykite paketą."); return; }
    setConfirmingRecurring(true);
    await pb.collection("bookings").create({
      client_id:  user.id,
      date:       selectedDate,
      start_time: myReservedSlot.start_time,
      end_time:   myReservedSlot.end_time,
      status:     "approved",
      notes:      "",
      package_id: activePackage.id,
      recurring_slot_id: myReservedSlot.id,
    }).catch(()=>{});
    await pb.collection("training_packages").update(activePackage.id, {
      credits_used: (activePackage.credits_used || 0) + 1,
    }).catch(()=>{});
    await load();
    setConfirmingRecurring(false);
    setView("mybookings");
    setSelectedDate(null); setSelectedSlot(null);
  }

  const today = todayStr();
  const daysInMonth = new Date(calMonth.y, calMonth.m+1, 0).getDate();
  const firstDay = new Date(calMonth.y, calMonth.m, 1).getDay();
  const offset = firstDay===0 ? 6 : firstDay-1;

  const sched = selectedDate ? getScheduleForDate(selectedDate) : null;
  const slots = sched ? generateSlots(sched.start_time, sched.end_time, sched.slot_duration) : [];

  // Mano įprastas laikas šiai pasirinktai datai (jei terminas dar nepraėjęs ir dar nepatvirtintas)
  const myReservedSlot = selectedDate
    ? recurringSlots.find(r => r.client_id === user.id && r.day_of_week === dowOf(selectedDate) && isRecurringHoldActive(selectedDate) && !hasBookingFor(selectedDate, r.start_time)) || null
    : null;

  const availableSlots = slots.filter(s => {
    if (takenSlots.includes(s.start)) return false;
    if (selectedDate && isSlotBlocked(selectedDate, s.start, s.end)) return false;
    const reserved = selectedDate ? reservedRecurringAt(selectedDate, s.start) : null;
    if (reserved) return false; // arba mano (rodoma atskirai), arba kito kliento (dar nepasibaigęs terminas)
    return true;
  });

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:`linear-gradient(160deg,#3a0a20 0%,${PK.dark} 45%,${PK.mid} 100%)`,overflowY:"auto",WebkitOverflowScrolling:"touch",paddingBottom:80,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* Header */}
      <div style={{background:"rgba(0,0,0,0.2)",borderBottom:"1px solid rgba(255,255,255,0.1)",paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0,zIndex:10,backdropFilter:"blur(10px)"}}>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:14,cursor:"pointer"}}>← Atgal</button>
        <div style={{flex:1}}>
          <h1 style={{fontSize:15,fontWeight:700,color:"#fff",margin:0}}>📅 Rezervuoti laiką</h1>
          {activePackage && (
            <p style={{fontSize:10,color:"#7FFFB0",margin:0}}>
              🎟️ {activePackage.credits_total - activePackage.credits_used} treniruočių liko
            </p>
          )}
        </div>
        <button onClick={()=>setView(v=>v==="mybookings"?"calendar":"mybookings")} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"inherit",position:"relative"}}>
          Mano
          {myBookings.filter(b=>b.status==="pending").length>0 && (
            <span style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#FF4444",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700}}>
              {myBookings.filter(b=>b.status==="pending").length}
            </span>
          )}
        </button>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:16}}>

        {/* ── Mano rezervacijos ── */}
        {view==="mybookings" && (
          <div>
            <button onClick={()=>setView("calendar")} style={{width:"100%",padding:"13px",borderRadius:14,background:"linear-gradient(135deg,#6D1B3B,#AD1457)",color:"#fff",border:"none",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:16}}>
              + Rezervuoti naują laiką
            </button>
            <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 12px"}}>Mano rezervacijos</p>
            {myBookings.length===0 && <p style={{color:"rgba(255,255,255,0.4)",textAlign:"center",padding:"24px 0"}}>Dar nėra rezervacijų</p>}
            {myBookings.map(b => {
              const si = STATUS_INFO[b.status];
              return (
                <div key={b.id} style={{background:si.bg,borderRadius:16,padding:"14px 16px",marginBottom:10,border:"1px solid rgba(255,255,255,0.1)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 2px"}}>📅 {b.date}</p>
                      <p style={{fontSize:12,color:"rgba(255,255,255,0.6)",margin:0}}>⏰ {b.start_time} – {b.end_time}</p>
                      {b.notes && <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",margin:"3px 0 0",fontStyle:"italic"}}>"{b.notes}"</p>}
                      {b.cancel_reason && <p style={{fontSize:11,color:"rgba(255,130,130,0.7)",margin:"3px 0 0"}}>🚫 {b.cancel_reason}</p>}
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:si.color,background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"3px 10px",whiteSpace:"nowrap"}}>{si.emoji} {si.label}</span>
                  </div>
                  {b.status==="approved" && (
                    <button onClick={()=>downloadIcal(b,user.name||user.email)} style={{width:"100%",padding:"9px",borderRadius:10,border:"1px solid rgba(127,255,176,0.4)",background:"rgba(127,255,176,0.1)",color:"#7FFFB0",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:6}}>
                      📲 Įtraukti į kalendorių (.ics)
                    </button>
                  )}
                  {(b.status==="pending" || b.status==="approved") && (
                    <CancelButton booking={b} userId={user.id} onCancelled={load} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Kalendorius ── */}
        {view==="calendar" && (
          <div>
            {/* Nėra paketo perspėjimas */}
            {!activePackage && (
              <div style={{background:"rgba(255,200,0,0.08)",border:"1px solid rgba(255,200,0,0.25)",borderRadius:14,padding:"12px 16px",marginBottom:16,textAlign:"center"}}>
                <p style={{fontSize:13,fontWeight:700,color:"#FFD700",margin:"0 0 4px"}}>🎟️ Treniruočių paketo nėra</p>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0}}>Įsigykite paketą paspausdami 🎟️ apačioje</p>
              </div>
            )}
            {/* Mėnesio navigacija */}
            <div style={{background:"rgba(0,0,0,0.2)",borderRadius:16,padding:16,marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <button onClick={()=>setCalMonth(p=>{ const d=new Date(p.y,p.m-1,1); return{y:d.getFullYear(),m:d.getMonth()}; })}
                  style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:14}}>◀</button>
                <span style={{color:"#fff",fontWeight:700,fontSize:14}}>{MONTHS[calMonth.m]} {calMonth.y}</span>
                <button onClick={()=>setCalMonth(p=>{ const d=new Date(p.y,p.m+1,1); return{y:d.getFullYear(),m:d.getMonth()}; })}
                  style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"6px 12px",color:"#fff",cursor:"pointer",fontSize:14}}>▶</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
                {["P","A","T","K","P","Š","S"].map(d=><div key={d} style={{textAlign:"center",fontSize:9,color:"rgba(255,255,255,0.35)"}}>{d}</div>)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                {Array(offset).fill(null).map((_,i)=><div key={"e"+i}/>)}
                {Array(daysInMonth).fill(null).map((_,i)=>{
                  const d=i+1;
                  const ds=`${calMonth.y}-${String(calMonth.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  const avail=isDayAvailable(ds);
                  const isSel=selectedDate===ds;
                  const isPast=ds<today;
                  const isMyRecurring = avail && !isPast && hasMyPendingRecurringOn(ds);
                  return (
                    <button key={d} onClick={()=>{ if(!avail)return; setSelectedDate(ds); setSelectedSlot(null); setView("book"); }}
                      style={{aspectRatio:"1",borderRadius:8,border:isSel?"2px solid rgba(255,255,255,0.9)":isMyRecurring?"1.5px solid #FFD700":"none",
                        background:isSel?"rgba(255,255,255,0.25)":avail?"rgba(173,20,87,0.3)":"transparent",
                        cursor:avail?"pointer":"default",color:isPast?"rgba(255,255,255,0.15)":avail?"#fff":"rgba(255,255,255,0.3)",
                        fontSize:12,fontWeight:avail?700:400,fontFamily:"inherit",position:"relative"}}>
                      {d}
                      {isMyRecurring && <span style={{position:"absolute",top:-2,right:0,fontSize:9}}>🌟</span>}
                      {avail&&!isPast&&<div style={{position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:isMyRecurring?"#FFD700":"#AD1457"}}/>}
                    </button>
                  );
                })}
              </div>
            </div>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.4)",textAlign:"center"}}>Rožiniai langeliai — laisvi laikai · 🌟 — tavo įprastas laikas laukia patvirtinimo. Pasirinkite dieną.</p>
          </div>
        )}

        {/* ── Laiko pasirinkimas ── */}
        {view==="book" && selectedDate && (
          <div>
            <div style={{background:"rgba(0,0,0,0.2)",borderRadius:14,padding:"12px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:0}}>📅 {selectedDate}</p>
              <button onClick={()=>{ setView("calendar"); setSelectedSlot(null); }} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"5px 12px",color:"#fff",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Keisti datą</button>
            </div>

            {myReservedSlot && (
              <div style={{background:"rgba(255,215,0,0.1)",border:"1.5px solid rgba(255,215,0,0.4)",borderRadius:16,padding:"14px 16px",marginBottom:16}}>
                <p style={{fontSize:13,fontWeight:700,color:"#FFD700",margin:"0 0 4px"}}>🌟 Tavo įprastas laikas</p>
                <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:"0 0 6px"}}>⏰ {myReservedSlot.start_time}–{myReservedSlot.end_time}</p>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.6)",margin:"0 0 10px"}}>
                  Patvirtink iki {DOW_LABEL[RECURRING_DEADLINE_DOW-1]} {RECURRING_DEADLINE_TIME}, kitaip laikas atsilaisvins kitiems klientams.
                </p>
                <button onClick={handleConfirmRecurring} disabled={confirmingRecurring} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#B8860B,#FFD700)",color:"#2d0a1a",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:confirmingRecurring?0.7:1}}>
                  {confirmingRecurring ? "Tvirtinama..." : "✅ Patvirtinti savo laiką"}
                </button>
              </div>
            )}

            {availableSlots.length===0 ? (
              <div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:"24px",textAlign:"center",border:"2px dashed rgba(255,255,255,0.12)"}}>
                <p style={{color:"rgba(255,255,255,0.5)",fontSize:14}}>Šią dieną laisvų laikų nėra</p>
              </div>
            ) : (
              <>
                <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.1em",margin:"0 0 10px"}}>Pasirinkite laiką</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
                  {availableSlots.map(slot=>(
                    <button key={slot.start} onClick={()=>setSelectedSlot(slot)} style={{padding:"10px 6px",borderRadius:12,border:`2px solid ${selectedSlot?.start===slot.start?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.2)"}`,background:selectedSlot?.start===slot.start?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)",color:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                      <div style={{fontSize:13,fontWeight:700}}>{slot.start}</div>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>–{slot.end}</div>
                    </button>
                  ))}
                </div>

                {selectedSlot && (
                  <div style={{marginBottom:16}}>
                    <label style={{fontSize:12,color:"rgba(255,255,255,0.7)",display:"block",marginBottom:6}}>Pastabos (nebūtina)</label>
                    <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Pvz. pirmą kartą, turiu traumą..." rows={3}
                      style={{width:"100%",padding:"10px 14px",borderRadius:12,border:"1.5px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.07)",color:"#fff",fontSize:13,fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box"}}/>
                  </div>
                )}

                <button onClick={handleBook} disabled={!selectedSlot||saving} style={{width:"100%",padding:"14px",borderRadius:14,background:selectedSlot?"linear-gradient(135deg,#6D1B3B,#AD1457)":"rgba(255,255,255,0.1)",color:selectedSlot?"#fff":"rgba(255,255,255,0.3)",border:"none",fontSize:15,fontWeight:700,cursor:selectedSlot?"pointer":"default",fontFamily:"inherit",opacity:saving?0.7:1}}>
                  {saving?"Siunčiama...":"📅 Siųsti užklausą"}
                </button>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.35)",textAlign:"center",marginTop:8}}>Trenerė patvirtins arba atmes užklausą</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
