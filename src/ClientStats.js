import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";

const PK = { dark:"#6D1B3B", mid:"#AD1457" };

const PERIOD_OPTIONS = [
  { k:7,  l:"7 d." },
  { k:14, l:"14 d." },
  { k:30, l:"30 d." },
];

const FIELDS = [
  { key:"weight_measured", label:"Svoris",    unit:"kg",  emoji:"⚖️" },
  { key:"body_fat",        label:"Riebalai",  unit:"%",   emoji:"📊" },
  { key:"waist_cm",        label:"Liemuo",    unit:"cm",  emoji:"📏" },
  { key:"hips_cm",         label:"Klubai",    unit:"cm",  emoji:"📏" },
  { key:"chest_cm",        label:"Krūtinė",   unit:"cm",  emoji:"📏" },
  { key:"arm_cm",          label:"Ranka",     unit:"cm",  emoji:"💪" },
  { key:"thigh_cm",        label:"Šlaunis",   unit:"cm",  emoji:"📏" },
];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n) { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split("T")[0]; }

function MiniChart({ data, field }) {
  if (data.length < 2) return null;
  const vals = data.map(d => parseFloat(d[field])).filter(v => !isNaN(v));
  if (vals.length < 2) return null;

  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const W = 90, H = 30;

  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");

  const first = vals[0], last = vals[vals.length - 1];
  const diff = last - first;
  const color = field === "weight_measured" || field === "body_fat" || field === "waist_cm" || field === "hips_cm"
    ? (diff < 0 ? "#7FFFB0" : diff > 0 ? "#FF8888" : "rgba(255,255,255,0.4)")
    : (diff > 0 ? "#7FFFB0" : diff < 0 ? "#FF8888" : "rgba(255,255,255,0.4)");

  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <svg width={W} height={H} style={{ overflow:"visible" }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={points.split(" ").pop().split(",")[0]} cy={points.split(" ").pop().split(",")[1]} r="2.5" fill={color} />
      </svg>
      <span style={{ fontSize:11, fontWeight:700, color }}>
        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
      </span>
    </div>
  );
}

function StatCard({ icon, value, label, sub, color }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"14px 12px", border:`1px solid ${color||"rgba(255,255,255,0.12)"}` }}>
      <div style={{ fontSize:20, marginBottom:5 }}>{icon}</div>
      <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{value}</div>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginTop:3 }}>{sub}</div>}
    </div>
  );
}

export default function ClientStats({ user, onClose }) {
  const [period, setPeriod]   = useState(7);
  const [loading, setLoading] = useState(true);
  const [avgs, setAvgs]       = useState(null);
  const [measurements, setMeasurements] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    const from = daysAgoStr(period - 1);
    const today = todayStr();

    const [checkins, sleeps, waters, meas] = await Promise.all([
      pb.collection("daily_checkins").getFullList({ filter:`user_id="${user.id}" && date>="${from}" && date<="${today}" && is_done=true`, requestKey:null }).catch(()=>[]),
      pb.collection("sleep_log").getFullList({ filter:`user_id="${user.id}" && date>="${from}" && date<="${today}"`, requestKey:null }).catch(()=>[]),
      pb.collection("water_log").getFullList({ filter:`user_id="${user.id}" && date>="${from}" && date<="${today}"`, requestKey:null }).catch(()=>[]),
      pb.collection("trainer_measurements").getFullList({ filter:`user_id="${user.id}"`, sort:"measured_at", requestKey:null }).catch(()=>[]),
    ]);

    const stepsWithData = checkins.filter(c => c.steps > 0);

    setAvgs({
      checkinDays:  checkins.length,
      avgSteps:     stepsWithData.length ? Math.round(stepsWithData.reduce((a,c)=>a+(c.steps||0),0)/stepsWithData.length) : null,
      avgSleep:     sleeps.length ? sleeps.reduce((a,s)=>a+(s.hours_slept||0),0)/sleeps.length : null,
      waterRate:    waters.length ? Math.round(waters.filter(w=>w.ml >= (w.goal||2000)).length/waters.length*100) : null,
      avgNutrition: checkins.length ? checkins.reduce((a,c)=>a+(c.nutrition_score||0),0)/checkins.length : null,
      avgWellbeing: checkins.length ? checkins.reduce((a,c)=>a+(c.wellbeing_score||0),0)/checkins.length : null,
    });
    setMeasurements(meas);
    setLoading(false);
  }, [user.id, period]);

  useEffect(() => { load(); }, [load]);

  const latest = measurements[measurements.length-1];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:`linear-gradient(160deg,#3a0a20 0%,${PK.dark} 45%,${PK.mid} 100%)`, overflowY:"auto", WebkitOverflowScrolling:"touch", paddingBottom:80, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer" }}>← Atgal</button>
        <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>📈 Mano statistika</h1>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>

        {/* Periodo pasirinkimas */}
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {PERIOD_OPTIONS.map(p => (
            <button key={p.k} onClick={()=>setPeriod(p.k)} style={{ flex:1, padding:"9px", borderRadius:12, border:"none", background:period===p.k?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {p.l}
            </button>
          ))}
        </div>

        {loading && <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Kraunama...</p>}

        {!loading && avgs && (
          <>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Vidurkiai ({period} d.)</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              <StatCard icon="🚶‍♀️" value={avgs.avgSteps ? avgs.avgSteps.toLocaleString() : "–"} label="Vid. žingsniai" />
              <StatCard icon="💧" value={avgs.waterRate!=null ? avgs.waterRate+"%" : "–"} label="Vandens tikslas" />
              <StatCard icon="😴" value={avgs.avgSleep ? avgs.avgSleep.toFixed(1)+"h" : "–"} label="Vid. miegas" />
              <StatCard icon="📋" value={avgs.checkinDays} label="Check-in'ų" sub={`iš ${period} d.`} />
              <StatCard icon="🥗" value={avgs.avgNutrition ? avgs.avgNutrition.toFixed(1) : "–"} label="Vid. mityba" sub="iš 3.0" />
              <StatCard icon="💚" value={avgs.avgWellbeing ? avgs.avgWellbeing.toFixed(1) : "–"} label="Vid. savijauta" sub="iš 3.0" />
            </div>

            {/* Kūno matavimų kreivės */}
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Kūno matavimai</p>
            {!latest ? (
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", padding:"20px 0" }}>Matavimų dar nėra — trenerė juos įves po kito matavimo.</p>
            ) : (
              <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"14px 16px" }}>
                <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:"0 0 12px" }}>Paskutinis matavimas · {latest.measured_at?.slice(0,10)}</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  {FIELDS.filter(f => latest[f.key]).map(f => (
                    <div key={f.key} style={{ textAlign:"center" }}>
                      <p style={{ fontSize:16, fontWeight:800, color:"#fff", margin:"0 0 2px" }}>{latest[f.key]}</p>
                      <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", margin:0 }}>{f.emoji} {f.label}</p>
                      <MiniChart data={measurements} field={f.key} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
