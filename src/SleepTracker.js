import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";
import { PK } from "./constants";

// ── Rekomenduojamas miegas pagal amžių ───────────────────────────────────────
function getRecommended(age) {
  if (!age) return [7, 9];
  if (age <= 17) return [8, 10];
  if (age <= 25) return [7, 9];
  if (age <= 64) return [7, 9];
  return [7, 8]; // 65+
}

function todayStr() { return new Date().toISOString().split("T")[0]; }
const MAX_H = 12;

// ── Pasirinktinis slankiklis ──────────────────────────────────────────────────
function SleepSlider({ value, onChange, recMin, recMax, readOnly }) {
  const trackRef  = useRef(null);
  const dragging  = useRef(false);

  function calcHours(clientX) {
    const rect = trackRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(pct * MAX_H * 2) / 2; // žingsnis 0.5h
  }

  function onStart(e) {
    if (readOnly) return;
    dragging.current = true;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    onChange(calcHours(x));
  }

  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      onChange(calcHours(x));
    }
    function onEnd() { dragging.current = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",  onEnd);
    window.addEventListener("touchmove", onMove, { passive:true });
    window.addEventListener("touchend",  onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",  onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onEnd);
    };
  }, []);

  const pct       = (v) => (v / MAX_H) * 100;
  const handlePct = pct(value ?? 0);
  const recMinPct = pct(recMin);
  const recMaxPct = pct(recMax);
  const inRange   = value >= recMin && value <= recMax;
  const tooLittle = value < recMin;
  const handleColor = inRange ? "#7FFFB0" : tooLittle ? "#FFD700" : "#89CFF0";

  return (
    <div style={{ padding:"8px 4px 28px" }}>
      {/* Slankiklio takelis */}
      <div
        ref={trackRef}
        onMouseDown={onStart}
        onTouchStart={onStart}
        style={{
          position:"relative", height:8, borderRadius:99,
          background:"rgba(255,255,255,0.15)",
          cursor: readOnly ? "default" : "pointer",
          margin:"0 10px",
        }}
      >
        {/* Užpildyta juosta iki rankenos */}
        <div style={{
          position:"absolute", top:0, left:0,
          width: handlePct + "%", height:"100%", borderRadius:99,
          background: handleColor, transition:"width 0.05s",
        }} />

        {/* Rekomenduojama zona */}
        <div style={{
          position:"absolute", top:-3,
          left: recMinPct + "%",
          width: (recMaxPct - recMinPct) + "%",
          height:14, borderRadius:7,
          background:"rgba(127,255,176,0.18)",
          border:"1.5px solid rgba(127,255,176,0.5)",
          pointerEvents:"none",
        }} />

        {/* Rankenėlė su burbulu */}
        {value !== null && (
          <div style={{
            position:"absolute", top:"50%",
            left: handlePct + "%",
            transform:"translate(-50%,-50%)",
            zIndex:3,
          }}>
            {/* Burbulas viršuje */}
            <div style={{
              position:"absolute", bottom:"calc(100% + 6px)",
              left:"50%", transform:"translateX(-50%)",
              background:handleColor, color:"#1a0a12",
              borderRadius:10, padding:"4px 9px",
              fontSize:13, fontWeight:800, whiteSpace:"nowrap",
              boxShadow:"0 2px 8px rgba(0,0,0,0.3)",
            }}>
              {value}h
              {/* Mažas trikampis */}
              <div style={{ position:"absolute", top:"100%", left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:"5px solid "+handleColor }} />
            </div>
            {/* Apskritimas */}
            <div style={{
              width:26, height:26, borderRadius:"50%",
              background:handleColor,
              border:"3px solid rgba(0,0,0,0.25)",
              boxShadow:"0 2px 10px rgba(0,0,0,0.35)",
              cursor: readOnly ? "default" : "grab",
            }} />
          </div>
        )}

        {/* Rekomenduojamo zonos žymės */}
        <div style={{ position:"absolute", top:14, left:recMinPct+"%", transform:"translateX(-50%)", fontSize:8, color:"rgba(127,255,176,0.7)", whiteSpace:"nowrap" }}>{recMin}h</div>
        <div style={{ position:"absolute", top:14, left:recMaxPct+"%", transform:"translateX(-50%)", fontSize:8, color:"rgba(127,255,176,0.7)", whiteSpace:"nowrap" }}>{recMax}h</div>
      </div>

      {/* Skalė */}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:22, padding:"0 10px", fontSize:9, color:"rgba(255,255,255,0.3)" }}>
        {[0,2,4,6,8,10,12].map(h => <span key={h}>{h}h</span>)}
      </div>
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function SleepTracker({ userId, age, date }) {
  const currentDate = date || todayStr();
  const isToday     = currentDate === todayStr();

  const [hours,   setHours]   = useState(null);   // šios dienos valandos
  const [saving,  setSaving]  = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [weekAvg, setWeekAvg] = useState(null);   // savaitės vidurkis

  const [recMin, recMax] = getRecommended(age);
  const inRange   = hours !== null && hours >= recMin && hours <= recMax;
  const tooLittle = hours !== null && hours < recMin;

  // Įkelti šios dienos ir savaitės duomenis
  useEffect(() => {
    if (!userId) return;
    setLoaded(false);
    const weekAgo = new Date(Date.now()-7*24*60*60*1000).toISOString().split("T")[0];

    Promise.all([
      supabase.from("sleep_log").select("hours_slept").eq("user_id",userId).eq("date",currentDate).maybeSingle(),
      supabase.from("sleep_log").select("hours_slept").eq("user_id",userId).gte("date",weekAgo).lte("date",todayStr()),
    ]).then(([{ data:today }, { data:week }]) => {
      setHours(today?.hours_slept ?? null);
      if (week?.length) {
        const avg = week.reduce((a,d)=>a+(+d.hours_slept),0)/week.length;
        setWeekAvg(+avg.toFixed(1));
      }
      setLoaded(true);
    });
  }, [userId, currentDate]);

  async function save(h) {
    if (!isToday || !userId) return;
    setHours(h);
    setSaving(true);
    await supabase.rpc("upsert_sleep_log", { p_user_id:userId, p_date:currentDate, p_hours:h });
    setSaving(false);
  }

  if (!loaded) return null;

  const statusText = hours === null
    ? "Pažymėk šios nakties miegą"
    : inRange
      ? "✅ Puiku – miegas rekomenduojamoje zonoje!"
      : tooLittle
        ? `⚠️ Per mažai – rekomenduojama ${recMin}–${recMax}h`
        : `💙 Per daug – rekomenduojama ${recMin}–${recMax}h`;

  const statusColor = hours === null
    ? "rgba(255,255,255,0.4)"
    : inRange ? "#7FFFB0" : "#FFD700";

  return (
    <div style={{
      background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")",
      borderRadius:20, padding:"16px 16px 10px",
      boxShadow:"0 6px 24px rgba(173,20,87,0.3)",
      marginBottom:12,
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>😴 Miegas</span>
          {hours !== null && (
            <span style={{ fontSize:22, fontWeight:700, color:statusColor }}>{hours}h</span>
          )}
          {saving && <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>●</span>}
        </div>
        <div style={{ textAlign:"right" }}>
          {weekAvg && (
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:0 }}>
              7 d. vid.: {weekAvg}h
            </p>
          )}
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:0 }}>
            Rekomenduojama: {recMin}–{recMax}h
          </p>
        </div>
      </div>

      {/* Statusas */}
      <p style={{ fontSize:11, color:statusColor, margin:"0 0 6px", fontWeight:hours!==null?600:400 }}>
        {statusText}
      </p>

      {/* Slankiklis */}
      <SleepSlider
        value={hours ?? 7}
        onChange={isToday ? save : ()=>{}}
        recMin={recMin}
        recMax={recMax}
        readOnly={!isToday}
      />

      {/* Legenda */}
      <div style={{ display:"flex", gap:16, padding:"0 10px 4px", justifyContent:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:12, height:4, borderRadius:2, background:"rgba(127,255,176,0.5)", border:"1px solid rgba(127,255,176,0.6)" }}/>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>Rekomenduojama zona</span>
        </div>
        {hours !== null && (
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:12, height:4, borderRadius:2, background:statusColor }}/>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>Tavo miegas</span>
          </div>
        )}
      </div>
    </div>
  );
}
