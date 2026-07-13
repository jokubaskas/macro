import { useState, useEffect, useRef } from "react";
import { pb } from "./pb";
import { Scale, BarChart, Ruler, Muscle, Save, ChevronLeft, Close, Edit, Calendar } from "./ui/icons";
import { ShowMoreButton } from "./ui/kit";

const inp = { padding:"10px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", width:"100%" };

const FIELDS = [
  { key:"weight_measured", label:"Svoris",    unit:"kg",  Icon:Scale },
  { key:"body_fat",        label:"Riebalai",  unit:"%",   Icon:BarChart },
  { key:"waist_cm",        label:"Liemuo",    unit:"cm",  Icon:Ruler },
  { key:"hips_cm",         label:"Klubai",    unit:"cm",  Icon:Ruler },
  { key:"chest_cm",        label:"Krūtinė",   unit:"cm",  Icon:Ruler },
  { key:"arm_cm",          label:"Ranka",     unit:"cm",  Icon:Muscle },
  { key:"thigh_cm",        label:"Šlaunis",   unit:"cm",  Icon:Ruler },
];

function todayStr() { return new Date().toISOString().split("T")[0]; }

function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
}

// Catmull-Rom → kubinės Bezier kreivės konversija: glotnesnė linija nei laužtė.
function smoothPath(pts) {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function MiniChart({ data, field }) {
  const pathRef = useRef(null);
  const vals = data.map(d => parseFloat(d[field])).filter(v => !isNaN(v));

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.transition = "none";
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 0.9s cubic-bezier(.23,1,.32,1)";
      el.style.strokeDashoffset = 0;
    });
  }, [vals.length, field]);

  if (vals.length < 2) return null;

  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const W = 84, H = 30;
  const PAD = 4;

  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * W,
    PAD + (H - PAD * 2) - ((v - min) / range) * (H - PAD * 2),
  ]);
  const linePath = smoothPath(pts);
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
  const [lastX, lastY] = pts[pts.length - 1];

  const first = vals[0], last = vals[vals.length - 1];
  const diff = last - first;
  const isLowerBetter = field === "weight_measured" || field === "body_fat" || field === "waist_cm" || field === "hips_cm";
  const trend = diff === 0 ? "flat" : (isLowerBetter ? diff < 0 : diff > 0) ? "up" : "down";
  const color = trend === "up" ? "#7FFFB0" : trend === "down" ? "#FF8888" : "rgba(255,255,255,0.4)";
  const gid = "mcm-" + field;

  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <svg width={W} height={H} style={{ overflow:"visible", flexShrink:0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="1"/>
          </linearGradient>
          <linearGradient id={gid+"-area"} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gid}-area)`} stroke="none" />
        <path ref={pathRef} d={linePath} fill="none" stroke={`url(#${gid})`}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r="5" fill={color} opacity="0.16" />
        <circle cx={lastX} cy={lastY} r="2.5" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      </svg>
      <span style={{ fontSize:11, fontWeight:700, color }}>
        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
      </span>
    </div>
  );
}

export default function ClientMeasurements({ client, onClose }) {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [form, setForm]         = useState({ measured_at: todayStr(), weight_measured:"", body_fat:"", waist_cm:"", hips_cm:"", chest_cm:"", arm_cm:"", thigh_cm:"", trainer_note:"" });
  const [saving, setSaving]     = useState(false);

  async function load() {
    setLoading(true);
    // Krauti matavimus
    const meas = await pb.collection("trainer_measurements").getFullList({
      filter: `user_id="${client.id}"`, sort: "-measured_at", requestKey: null,
    }).catch(() => []);

    // Pridėti registracijos svorį kaip papildomą tašką, jei tos dienos matavimo dar nėra
    let combined = meas;
    if (client.weight) {
      const regDate = client.created ? client.created.slice(0,10) : todayStr();
      const hasReg = meas.some(m => m.measured_at?.slice(0,10) === regDate);
      if (!hasReg) {
        combined = [...meas, { id:"reg", measured_at: regDate, weight_measured: client.weight, _isReg: true }];
      }
    }
    // Rikiuoti pagal realią datą (naujausias pirmas) — registracijos taškas gali
    // atsidurti bet kur, jei trenerė vėliau įveda atgalinės datos matavimą
    combined = [...combined].sort((a, b) => (b.measured_at || "").localeCompare(a.measured_at || ""));
    setHistory(combined);
    setLoading(false);
  }

  useEffect(() => { load(); }, [client.id]);

  async function handleSave() {
    setSaving(true);
    const data = { user_id: client.id, measured_at: form.measured_at };
    FIELDS.forEach(f => { if (form[f.key]) data[f.key] = parseFloat(String(form[f.key]).replace(",", ".")); });
    if (form.trainer_note.trim()) data.trainer_note = form.trainer_note.trim();
    await pb.collection("trainer_measurements").create(data).catch(()=>{});
    setSaving(false);
    setShowForm(false);
    setForm({ measured_at: todayStr(), weight_measured:"", body_fat:"", waist_cm:"", hips_cm:"", chest_cm:"", arm_cm:"", thigh_cm:"", trainer_note:"" });
    load();
  }

  // Paskutinis matavimas
  const latest = history.find(h => !h._isReg) || history[0];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:650, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}><Ruler size={15} />Matavimai</h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>
            {client.name}
            {(() => { const age = calcAge(client.dob); const parts = []; if (age != null) parts.push(`${age} m.`); if (client.height) parts.push(`${client.height} cm`); return parts.length ? ` · ${parts.join(" · ")}` : ""; })()}
          </p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>

        {/* Naujas matavimas */}
        {!showForm ? (
          <button onClick={()=>setShowForm(true)} style={{ width:"100%", padding:"13px", marginBottom:16, borderRadius:14, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            + Įvesti naują matavimą
          </button>
        ) : (
          <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:18, padding:16, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:0 }}>Naujas matavimas</p>
              <button onClick={()=>setShowForm(false)} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"5px 10px", color:"#fff", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center" }}><Close size={12} /></button>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:5 }}>Data</label>
              <input type="date" value={form.measured_at} onChange={e=>setForm(f=>({...f,measured_at:e.target.value}))} style={inp}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", gap:4, marginBottom:5 }}><f.Icon size={11} />{f.label} ({f.unit})</label>
                  <input type="text" inputMode="decimal" value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder="–" style={inp}/>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", gap:4, marginBottom:5 }}><Edit size={11} />Pastabos</label>
              <textarea value={form.trainer_note} onChange={e=>setForm(f=>({...f,trainer_note:e.target.value}))} placeholder="Pvz. geras progresas, keičiame planą..." rows={2}
                style={{...inp, resize:"none"}}/>
            </div>
            <button onClick={handleSave} disabled={saving} style={{ width:"100%", padding:"12px", borderRadius:12, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:saving?0.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {saving ? "Saugoma..." : <><Save size={15} />Išsaugoti</>}
            </button>
          </div>
        )}

        {/* Paskutiniai rodikliai */}
        {latest && !loading && (
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"14px 16px", marginBottom:16 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 12px" }}>
              Paskutiniai rodikliai · {latest.measured_at?.slice(0,10)} {latest._isReg && "(registracija)"}
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              {FIELDS.filter(f => latest[f.key]).map(f => (
                <div key={f.key} style={{ textAlign:"center" }}>
                  <p style={{ fontSize:18, fontWeight:800, color:"#fff", margin:"0 0 2px" }}>{latest[f.key]}</p>
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", margin:0, display:"flex", alignItems:"center", justifyContent:"center", gap:3 }}><f.Icon size={9} />{f.label}</p>
                  <MiniChart data={[...history].reverse()} field={f.key} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Istorija */}
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px" }}>Istorija</p>

        {loading && <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center" }}>Kraunama...</p>}

        {!loading && history.length === 0 && (
          <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"16px 0" }}>Matavimų dar nėra</p>
        )}

        {history.slice(0, visibleCount).map((m, idx) => (
          <div key={m.id} style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"12px 14px", marginBottom:8, borderLeft:`3px solid ${idx===0?"#AD1457":"rgba(255,255,255,0.1)"}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:5 }}>
                <Calendar size={13} />{m.measured_at?.slice(0,10)}
                {m._isReg && <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:400, marginLeft:6 }}>(registracija)</span>}
                {idx===0 && !m._isReg && <span style={{ fontSize:10, color:"#FF6EB4", fontWeight:600, marginLeft:6 }}>· naujausias</span>}
              </p>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px 14px" }}>
              {FIELDS.filter(f => m[f.key]).map(f => (
                <span key={f.key} style={{ fontSize:12, color:"rgba(255,255,255,0.7)" }}>
                  <span style={{ color:"rgba(255,255,255,0.4)", fontSize:10 }}>{f.label} </span>
                  <b style={{ color:"#fff" }}>{m[f.key]} {f.unit}</b>
                </span>
              ))}
            </div>
            {m.trainer_note && (
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:"8px 0 0", fontStyle:"italic" }}>"{m.trainer_note}"</p>
            )}
          </div>
        ))}
        <ShowMoreButton remaining={history.length - visibleCount} onClick={() => setVisibleCount(v => v + 8)} />
      </div>
    </div>
  );
}
