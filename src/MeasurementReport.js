import { useState, useEffect } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { PK } from "./constants";

function fmt(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("lt-LT", { month:"long", day:"numeric" });
}
function diff(a, b, unit="", invert=false) {
  if (a==null||b==null) return null;
  const d = +(b-a).toFixed(1);
  if (d===0) return { text:"nepasikeitė", color:"rgba(255,255,255,0.5)", d:0 };
  const good = invert ? d<0 : d>0;
  return {
    text: (d>0?"+":"")+d+unit,
    color: good?"#7FFFB0":"#FFB3B3",
    d,
  };
}

// ── Rodiklio kortelė ──────────────────────────────────────────────────────────
function StatCard({ emoji, label, from, to, unit="", invert=false, big=false }) {
  if (to==null) return null;
  const d = diff(from, to, unit, invert);
  return (
    <div style={{
      background:"rgba(255,255,255,0.1)", borderRadius:16, padding:"14px 12px",
      textAlign:"center", border:"1px solid rgba(255,255,255,0.15)",
    }}>
      <div style={{ fontSize: big?28:22, marginBottom:4 }}>{emoji}</div>
      <div style={{ fontSize: big?26:20, fontWeight:800, color:"#fff" }}>{to}{unit}</div>
      {from!=null && from!==to && (
        <div style={{ fontSize:11, color: d?.color||"rgba(255,255,255,0.5)", marginTop:2 }}>
          {from}{unit} → {d?.text}
        </div>
      )}
      {from==null && <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>pirmas matavimas</div>}
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:4 }}>{label}</div>
    </div>
  );
}

// ── Vidurkio blokas ───────────────────────────────────────────────────────────
function AvgBlock({ emoji, label, value, max=5, color="#7FFFB0" }) {
  if (value==null) return null;
  const pct = Math.round((value/max)*100);
  const display = max===5 ? value.toFixed(1)+"/5" : value.toFixed(1);
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>{emoji} {label}</span>
        <span style={{ fontSize:13, fontWeight:700, color }}>{display}</span>
      </div>
      <div style={{ background:"rgba(255,255,255,0.12)", borderRadius:99, height:6 }}>
        <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:color, transition:"width 1s" }}/>
      </div>
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function MeasurementReport({ userId, onClose }) {
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadReport();
  }, [userId]);

  async function loadReport() {
  const measures = await pb.collection("trainer_measurements").getList(1, 1, {
    filter: `user_id="${userId}" && client_read_at=""`,
    sort: "-measured_at", requestKey: null,
  }).then(r => r.items).catch(() => []);

  if (!measures?.length) { setLoading(false); return; }
  const current = measures[0];

  const prevList = await pb.collection("trainer_measurements").getList(1, 1, {
    filter: `user_id="${userId}" && id!="${current.id}" && client_read_at!=""`,
    sort: "-measured_at", requestKey: null,
  }).then(r => r.items).catch(() => []);
  const prev = prevList[0] || null;

  const cycleStart = new Date(current.measured_at);
  cycleStart.setDate(cycleStart.getDate() - 56);
  const cycleStartStr = cycleStart.toISOString().split("T")[0];
  const cycleEndStr   = current.measured_at.split("T")[0];

  const checkins = await pb.collection("client_checkins").getFullList({
    filter: `user_id="${userId}" && is_done=true && week_start>="${cycleStartStr}" && week_start<="${cycleEndStr}"`,
    requestKey: null,
  }).catch(() => []);

    // Vidurkiai
    const avg = (key) => {
      const vals = checkins?.map(c=>c[key]).filter(v=>v!=null);
      if (!vals?.length) return null;
      return +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
    };

    setReport({
      current,
      prev: prev?.[0] || null,
      cycleStart: cycleStartStr,
      avgs: {
        sleep:    avg("sleep_quality"),
        energy:   avg("energy"),
        diet:     avg("diet_adherence"),
        water:    avg("water_score"),
        stress:   avg("stress_level"),
        workouts: avg("workouts_done"),
      },
    });
    setLoading(false);
  }

  async function handleRead() {
    if (!report) return;
    setMarking(true);
    await adminDb
      .from("trainer_measurements")
      .update({ client_read_at: new Date().toISOString() })
      .eq("id", report.current.id);
    setMarking(false);
    onClose();
  }

  if (loading) return null;
  if (!report)  return null;

  const { current, prev, avgs } = report;
  const cycle = current.cycle_number || "–";

  // Motyvacinis tekstas pagal svorio pokytį
  const weightDiff = prev?.weight_measured != null
    ? +(current.weight_measured - prev.weight_measured).toFixed(1)
    : null;
  const motivText = weightDiff == null
    ? "Pirmasis tavo matavimas – pradžia visų pradžia! 💪"
    : weightDiff < -0.5
      ? `Svoriui sumažėjus ${Math.abs(weightDiff)} kg – fantastiškas darbas! 🌟`
      : weightDiff > 0.5
        ? "Kartais svoris kyla – tai dar nereiškia blogo rezultato! Žiūrime į visą vaizdą 💙"
        : "Svoris stabilus – puiku jei tikslas palaikyti! ⚖️";

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.75)",
      display:"flex", alignItems:"flex-end", justifyContent:"center",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{
        width:"100%", maxWidth:480,
        maxHeight:"92vh",
        background:`linear-gradient(160deg, ${PK.dark} 0%, #3a0a20 40%, #1a0010 100%)`,
        borderRadius:"24px 24px 0 0",
        display:"flex", flexDirection:"column",
        overflow:"hidden",
        boxShadow:"0 -8px 40px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ padding:"20px 20px 0", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4 }}>
            <div>
              <p style={{ fontSize:11, color:PK.blush, margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>
                📊 Trenerės ataskaita · {cycle} ciklas
              </p>
              <h2 style={{ fontSize:22, fontWeight:800, color:"#fff", margin:"0 0 4px", lineHeight:1.2 }}>
                8 savaičių rezultatai
              </h2>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>
                {fmt(report.cycleStart)} – {fmt(current.measured_at)}
              </p>
            </div>
            <div style={{ fontSize:40 }}>🏆</div>
          </div>

          {/* Motyvacinis tekstas */}
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 14px", margin:"12px 0" }}>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.85)", margin:0, lineHeight:1.5, fontStyle:"italic" }}>
              {motivText}
            </p>
          </div>
        </div>

        {/* Turinys */}
        <div style={{ overflowY:"auto", flex:1, padding:"0 20px", WebkitOverflowScrolling:"touch" }}>

          {/* Pagrindiniai matavimai */}
          <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"4px 0 10px" }}>
            Kūno matavimai
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            <StatCard emoji="⚖️" label="Svoris"       from={prev?.weight_measured}  to={current.weight_measured}  unit=" kg" big />
            <StatCard emoji="📉" label="Riebalai"      from={prev?.body_fat}          to={current.body_fat}          unit="%"  invert />
            <StatCard emoji="📏" label="Liemuo"        from={prev?.waist_cm}          to={current.waist_cm}          unit=" cm" invert />
            <StatCard emoji="📐" label="Klubai"        from={prev?.hips_cm}           to={current.hips_cm}           unit=" cm" invert />
            <StatCard emoji="💪" label="Rankos"        from={prev?.arms_cm}           to={current.arms_cm}           unit=" cm" />
            <StatCard emoji="🦵" label="Šlaunys"       from={prev?.thighs_cm}         to={current.thighs_cm}         unit=" cm" />
          </div>

          {/* Check-in'ų vidurkiai */}
          {Object.values(avgs).some(v=>v!=null) && (
            <>
              <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"4px 0 12px" }}>
                Savaitinių check-in'ų vidurkiai
              </p>
              <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:16, padding:"14px 16px", marginBottom:16 }}>
                <AvgBlock emoji="😴" label="Miego kokybė"   value={avgs.sleep}   color="#89CFF0" />
                <AvgBlock emoji="⚡" label="Energija"        value={avgs.energy}  color="#FFD700" />
                <AvgBlock emoji="🥗" label="Mityba"          value={avgs.diet}    color="#90EE90" />
                <AvgBlock emoji="💧" label="Vanduo"          value={avgs.water}   color="#89CFF0" />
                <AvgBlock emoji="🧘" label="Stresas (mažiau = geriau)" value={avgs.stress!=null?6-avgs.stress:null} color="#FFB3C6" />
                {avgs.workouts!=null && (
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                    <span style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>🏋️ Vid. treniruotės per savaitę</span>
                    <span style={{ fontSize:13, fontWeight:700, color:"#FFD700" }}>{avgs.workouts.toFixed(1)}k</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Trenerės pastaba */}
          {current.trainer_note && (
            <>
              <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.1em", margin:"4px 0 10px" }}>
                Trenerės pastaba
              </p>
              <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:14, padding:"14px 16px", marginBottom:16, borderLeft:"3px solid "+PK.mid }}>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.85)", margin:0, lineHeight:1.6 }}>
                  {current.trainer_note}
                </p>
              </div>
            </>
          )}

          <div style={{ height:10 }} />
        </div>

        {/* Mygtukas */}
        <div style={{ padding:"16px 20px", flexShrink:0, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={handleRead} disabled={marking} style={{
            width:"100%", padding:"16px 0",
            background:`linear-gradient(135deg, ${PK.mid}, ${PK.bright})`,
            border:"none", borderRadius:16, color:"#fff",
            fontSize:16, fontWeight:800, cursor:"pointer", fontFamily:"inherit",
            boxShadow:"0 4px 20px rgba(173,20,87,0.4)",
          }}>
            {marking ? "Saugoma..." : "✓ Perskaičiau, ačiū!"}
          </button>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textAlign:"center", margin:"8px 0 0" }}>
            Po patvirtinimo pranešimas dingsta
          </p>
        </div>
      </div>
    </div>
  );
}
