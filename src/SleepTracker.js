import { useState, useEffect, useRef } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { MOOD } from "./constants";
import { Moon, CheckCircle, AlertTriangle, Heart, Lock, Timer, Save } from "./ui/icons";

function getRecommended(age) {
  if (!age) return [7, 9];
  if (age <= 17) return [8, 10];
  if (age <= 64) return [7, 9];
  return [7, 8];
}

function todayStr() { return new Date().toISOString().split("T")[0]; }
const MAX_H = 12;

// ── Laiko formatavimas ────────────────────────────────────────────────────────
function fmtHours(val) {
  if (val == null) return "–";
  const h = Math.floor(val);
  const m = Math.round((val % 1) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

// ── Slankiklis ────────────────────────────────────────────────────────────────
function SleepSlider({ value, onChange, recMin, recMax, readOnly }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);

  function calcHours(clientX) {
    const rect = trackRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(pct * MAX_H * 2) / 2;
  }
  function onStart(e) {
    if (readOnly) return;
    dragging.current = true;
    onChange(calcHours(e.touches ? e.touches[0].clientX : e.clientX));
  }
  useEffect(() => {
    function onMove(e) {
      if (!dragging.current) return;
      onChange(calcHours(e.touches ? e.touches[0].clientX : e.clientX));
    }
    function onEnd() { dragging.current = false; }
    window.addEventListener("mousemove",  onMove);
    window.addEventListener("mouseup",    onEnd);
    window.addEventListener("touchmove",  onMove, { passive:true });
    window.addEventListener("touchend",   onEnd);
    return () => {
      window.removeEventListener("mousemove",  onMove);
      window.removeEventListener("mouseup",    onEnd);
      window.removeEventListener("touchmove",  onMove);
      window.removeEventListener("touchend",   onEnd);
    };
  }, []);

  const pct         = v => (v / MAX_H) * 100;
  const handlePct   = pct(value ?? 0);
  const recMinPct   = pct(recMin);
  const recMaxPct   = pct(recMax);
  const inRange = value >= recMin && value <= recMax;
  const mood = inRange ? MOOD.good : value < recMin ? MOOD.mid : MOOD.water;
  const handleColor = mood.c1;

  return (
    <div style={{ padding:"8px 4px 28px" }}>
      <div ref={trackRef} onMouseDown={onStart} onTouchStart={onStart}
        style={{ position:"relative", height:8, borderRadius:99, background:"rgba(255,255,255,0.15)", cursor:readOnly?"default":"pointer", margin:"0 10px" }}>
        <div style={{ position:"absolute", top:0, left:0, width:handlePct+"%", height:"100%", borderRadius:99, background:`linear-gradient(90deg,${mood.c2},${mood.c1})`, transition:"width 0.05s" }} />
        <div style={{ position:"absolute", top:-3, left:recMinPct+"%", width:(recMaxPct-recMinPct)+"%", height:14, borderRadius:7, background:"rgba(127,255,176,0.18)", border:"1.5px solid rgba(127,255,176,0.5)", pointerEvents:"none" }} />
        {value !== null && (
          <div style={{ position:"absolute", top:"50%", left:handlePct+"%", transform:"translate(-50%,-50%)", zIndex:3 }}>
            <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:"50%", transform:"translateX(-50%)", background:handleColor, color:"#1a0a12", borderRadius:10, padding:"4px 9px", fontSize:13, fontWeight:800, whiteSpace:"nowrap", boxShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>
              {fmtHours(value)}
              <div style={{ position:"absolute", top:"100%", left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:"5px solid "+handleColor }} />
            </div>
            <div style={{ width:26, height:26, borderRadius:"50%", background:`radial-gradient(circle at 34% 28%, ${mood.c1}, ${mood.c2})`, boxShadow:`0 0 0 3px rgba(0,0,0,0.2), 0 2px 10px ${mood.c1}88`, cursor:readOnly?"default":"grab" }} />
          </div>
        )}
        <div style={{ position:"absolute", top:14, left:recMinPct+"%", transform:"translateX(-50%)", fontSize:8, color:"rgba(127,255,176,0.7)", whiteSpace:"nowrap" }}>{recMin}h</div>
        <div style={{ position:"absolute", top:14, left:recMaxPct+"%", transform:"translateX(-50%)", fontSize:8, color:"rgba(127,255,176,0.7)", whiteSpace:"nowrap" }}>{recMax}h</div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:22, padding:"0 10px", fontSize:9, color:"rgba(255,255,255,0.3)" }}>
        {[0,2,4,6,8,10,12].map(h => <span key={h}>{h}h</span>)}
      </div>
    </div>
  );
}

// ── Laiko selekctorius ────────────────────────────────────────────────────────
function TimePicker({ value, onChange, readOnly }) {
  const h = Math.floor(value ?? 7);
  const m = Math.round(((value ?? 7) % 1) * 60);

  function set(newH, newM) {
    if (readOnly) return;
    onChange(Math.round((Math.max(0, Math.min(12, newH)) + Math.max(0, Math.min(55, newM)) / 60) * 100) / 100);
  }

  const arrowStyle = {
    background: readOnly ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius:10, width:46, height:38, cursor:readOnly?"default":"pointer",
    color: readOnly ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.8)",
    fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"inherit",
  };
  const minBtnStyle = (active) => ({
    flex:1, padding:"8px 0", borderRadius:10, fontSize:13, fontWeight:700,
    cursor: readOnly ? "default" : "pointer", fontFamily:"inherit",
    border: `1.5px solid ${active ? "rgba(127,255,176,0.8)" : "rgba(255,255,255,0.15)"}`,
    background: active ? "rgba(127,255,176,0.15)" : "rgba(255,255,255,0.05)",
    color: active ? "#7FFFB0" : readOnly ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)",
  });

  return (
    <div style={{ padding:"4px 8px 12px" }}>
      {/* Dideli skaičiai */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:16 }}>
        {/* Valandos */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <button style={arrowStyle} onClick={() => set(h+1, m)}>▲</button>
          <div style={{ fontSize:52, fontWeight:800, color:"#fff", lineHeight:1, minWidth:64, textAlign:"center", fontVariantNumeric:"tabular-nums" }}>
            {String(h).padStart(2,"0")}
          </div>
          <button style={arrowStyle} onClick={() => set(h-1, m)}>▼</button>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>val.</span>
        </div>

        <div style={{ fontSize:46, fontWeight:800, color:"rgba(255,255,255,0.3)", paddingBottom:24 }}>:</div>

        {/* Minutės */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <button style={arrowStyle} onClick={() => set(h, m+5)}>▲</button>
          <div style={{ fontSize:52, fontWeight:800, color:"#fff", lineHeight:1, minWidth:64, textAlign:"center", fontVariantNumeric:"tabular-nums" }}>
            {String(m).padStart(2,"0")}
          </div>
          <button style={arrowStyle} onClick={() => set(h, m-5)}>▼</button>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>min.</span>
        </div>
      </div>

      {/* Greiti minutių mygtukai */}
      <div style={{ display:"flex", gap:6 }}>
        {[0, 15, 30, 45].map(min => (
          <button key={min} style={minBtnStyle(m === min)} onClick={() => set(h, min)}>
            :{String(min).padStart(2,"0")}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function SleepTracker({ userId, age, date, compact = false }) {
  const currentDate = date || todayStr();
  const isToday     = currentDate === todayStr();

  const [savedHours, setSavedHours] = useState(null);
  const [localHours, setLocalHours] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [loaded,     setLoaded]     = useState(false);
  const [weekAvg,    setWeekAvg]    = useState(null);
  const [inputMode,  setInputMode]  = useState("slider"); // "slider" | "time"

  const [recMin, recMax] = getRecommended(age);
  const isLocked     = savedHours !== null;
  const displayHours = isLocked ? savedHours : (localHours ?? 7);

  useEffect(() => {
    if (!userId) return;
    setLoaded(false);
    const weekAgo = new Date(Date.now()-7*24*60*60*1000).toISOString().split("T")[0];
    Promise.all([
  pbFirst("sleep_log", `user_id="${userId}" && date="${currentDate}"`),
  pb.collection("sleep_log").getFullList({ filter: `user_id="${userId}" && date>="${weekAgo}" && date<="${todayStr()}"`, requestKey: null }),
]).then(([todayData, week]) => {
  setSavedHours(todayData?.hours_slept ?? null);
      setLocalHours(null);
      if (week?.length) {
        const avg = week.reduce((a,d)=>a+(+d.hours_slept),0)/week.length;
        setWeekAvg(+avg.toFixed(1));
      }
      setLoaded(true);
    });
  }, [userId, currentDate]);

  async function handleSave() {
    if (!userId || localHours === null) return;
    setSaving(true);
await pbUpsert("sleep_log", `user_id="${userId}" && date="${currentDate}"`, { user_id:userId, date:currentDate, hours_slept:localHours });
    setSavedHours(localHours);
    setLocalHours(null);
    setSaving(false);
  }

  if (!loaded) return null;

  // ── Kompaktiškas ──────────────────────────────────────────────────────────
  if (compact) {
    const statusColor = savedHours === null ? "rgba(0,0,0,0.35)"
      : savedHours >= recMin && savedHours <= recMax ? "#27ae60" : "#f39c12";
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <Moon size={14} color="#333" />
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
            <span style={{ fontSize:11, color:"#333", fontWeight:600 }}>
              {savedHours !== null ? fmtHours(savedHours) : "Nesuvedė"}
            </span>
            <span style={{ fontSize:10, color:statusColor, fontWeight:700 }}>Rek. {recMin}–{recMax}h</span>
          </div>
          <div style={{ background:"#f0f0f0", borderRadius:99, height:5 }}>
            <div style={{ width:savedHours?Math.min(100,(savedHours/12)*100)+"%":"0%", height:"100%", borderRadius:99, background:statusColor, transition:"width 0.3s" }}/>
          </div>
        </div>
      </div>
    );
  }

  const inRange   = displayHours >= recMin && displayHours <= recMax;
  const tooLittle = displayHours < recMin;
  const hasUnsaved = !isLocked && localHours !== null && isToday;

  const statusText = isLocked
    ? inRange ? "Puiku – miegas rekomenduojamoje zonoje!"
      : tooLittle ? `Per mažai – rekomenduojama ${recMin}–${recMax}h`
      : `Per daug – rekomenduojama ${recMin}–${recMax}h`
    : isToday ? "Pažymėk šios nakties miegą"
    : "Šiai dienai miegas nebuvo suvestas";

  const StatusIcon = isLocked
    ? inRange ? CheckCircle : tooLittle ? AlertTriangle : Heart
    : null;

  const statusColor = !isLocked ? "rgba(255,255,255,0.45)"
    : inRange ? MOOD.good.c1 : tooLittle ? MOOD.mid.c1 : MOOD.water.c1;

  const canEdit = isToday && !isLocked;

  const tabBtn = (active) => ({
    flex:1, padding:"7px 0", border:"none", borderRadius:10, fontSize:11, fontWeight:700,
    cursor:"pointer", fontFamily:"inherit",
    background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
    color: active ? "#fff" : "rgba(255,255,255,0.4)",
  });

  return (
    <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:20, padding:"16px 16px 10px", boxShadow:"0 6px 24px rgba(173,20,87,0.3)", marginBottom:12 }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.8)", display:"flex", alignItems:"center", gap:5 }}><Moon size={14} />Miegas</span>
          {(isLocked || hasUnsaved) && (
            <span style={{ fontSize:22, fontWeight:700, color:statusColor }}>
              {fmtHours(isLocked ? savedHours : localHours)}
            </span>
          )}
          {isLocked && <Lock size={11} color="rgba(255,255,255,0.4)" />}
        </div>
        <div style={{ textAlign:"right" }}>
          {weekAvg && <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:0 }}>7 d. vid.: {fmtHours(weekAvg)}</p>}
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:0 }}>Rek.: {recMin}–{recMax}h</p>
        </div>
      </div>

      {/* Statusas */}
      <p style={{ fontSize:11, color:statusColor, margin:"0 0 10px", fontWeight:isLocked?600:400, display:"flex", alignItems:"center", gap:5 }}>
        {StatusIcon && <StatusIcon size={12} />}{statusText}
      </p>

      {/* Tabai — VISADA matomi (ne tik kai !isLocked) */}
      <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.07)", borderRadius:12, padding:3, marginBottom:12 }}>
        <button style={tabBtn(inputMode==="slider")} onClick={() => setInputMode("slider")}>≈ Slankiklis</button>
        <button style={{...tabBtn(inputMode==="time"), display:"flex", alignItems:"center", justifyContent:"center", gap:4}} onClick={() => setInputMode("time")}><Timer size={11} />Tiksliai</button>
      </div>

      {/* Slankiklio režimas */}
      {inputMode === "slider" && (
        <SleepSlider
          value={displayHours}
          onChange={canEdit ? setLocalHours : ()=>{}}
          recMin={recMin} recMax={recMax}
          readOnly={!canEdit}
        />
      )}

      {/* Laiko selekctorius */}
      {inputMode === "time" && (
        <TimePicker
          value={displayHours}
          onChange={canEdit ? setLocalHours : ()=>{}}
          readOnly={!canEdit}
        />
      )}

      {/* Išsaugoti — tik jei šiandien ir neišsaugota */}
      {canEdit && (
        <button onClick={handleSave} disabled={saving || localHours === null}
          style={{
            width:"100%", padding:"11px 0", marginTop:8, marginBottom:8,
            border:`1.5px solid rgba(255,255,255,${hasUnsaved?"0.5":"0.2"})`,
            borderRadius:12,
            background: hasUnsaved ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
            color: hasUnsaved ? "#fff" : "rgba(255,255,255,0.3)",
            fontSize:14, fontWeight:700,
            cursor: hasUnsaved ? "pointer" : "default",
            fontFamily:"inherit", transition:"all 0.2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>
          {saving ? "Saugoma..." : hasUnsaved ? <><Save size={14} />{`Išsaugoti (${fmtHours(localHours)})`}</> : "Pajudink slankiklį arba įvesk laiką..."}
        </button>
      )}

      {/* Legenda */}
      <div style={{ display:"flex", gap:14, padding:"0 10px 4px", justifyContent:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <div style={{ width:12, height:4, borderRadius:2, background:"rgba(127,255,176,0.5)", border:"1px solid rgba(127,255,176,0.6)" }}/>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.35)" }}>Rekomenduojama zona</span>
        </div>
      </div>
    </div>
  );
}