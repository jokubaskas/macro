import { useState, useEffect } from "react";
import { pb } from "./pb";

const inp = { padding:"10px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box", width:"100%" };

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

function MiniChart({ data, field }) {
  if (data.length < 2) return null;
  const vals = data.map(d => parseFloat(d[field])).filter(v => !isNaN(v));
  if (vals.length < 2) return null;

  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const W = 80, H = 28;

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

export default function ClientMeasurements({ client, onClose }) {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ measured_at: todayStr(), weight_measured:"", body_fat:"", waist_cm:"", hips_cm:"", chest_cm:"", arm_cm:"", thigh_cm:"", trainer_note:"" });
  const [saving, setSaving]     = useState(false);

  async function load() {
    setLoading(true);
    // Krauti matavimus
    const meas = await pb.collection("trainer_measurements").getFullList({
      filter: `user_id="${client.id}"`, sort: "-measured_at", requestKey: null,
    }).catch(() => []);

    // Jei nėra įrašų, patikrinti ar yra pradinis svoris registracijoje
    if (meas.length === 0 && client.weight) {
      const regDate = client.created ? client.created.slice(0,10) : todayStr();
      setHistory([{ id:"reg", measured_at: regDate, weight_measured: client.weight, _isReg: true }]);
    } else if (client.weight) {
      // Pridėti registracijos svorį kaip pirmą įrašą jei jo dar nėra
      const regDate = client.created ? client.created.slice(0,10) : "0000-00-00";
      const hasReg = meas.some(m => m.measured_at?.slice(0,10) === regDate);
      if (!hasReg) {
        setHistory([...meas, { id:"reg", measured_at: regDate, weight_measured: client.weight, _isReg: true }]);
      } else {
        setHistory(meas);
      }
    } else {
      setHistory(meas);
    }
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
    <div style={{ position:"fixed", inset:0, zIndex:650, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer" }}>← Atgal</button>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>📐 Matavimai</h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{client.name}</p>
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
              <button onClick={()=>setShowForm(false)} style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:8, padding:"5px 10px", color:"#fff", cursor:"pointer", fontSize:12 }}>✕</button>
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:5 }}>Data</label>
              <input type="date" value={form.measured_at} onChange={e=>setForm(f=>({...f,measured_at:e.target.value}))} style={inp}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:5 }}>{f.emoji} {f.label} ({f.unit})</label>
                  <input type="text" inputMode="decimal" value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder="–" style={inp}/>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:5 }}>📝 Pastabos</label>
              <textarea value={form.trainer_note} onChange={e=>setForm(f=>({...f,trainer_note:e.target.value}))} placeholder="Pvz. geras progresas, keičiame planą..." rows={2}
                style={{...inp, resize:"none"}}/>
            </div>
            <button onClick={handleSave} disabled={saving} style={{ width:"100%", padding:"12px", borderRadius:12, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:saving?0.7:1 }}>
              {saving ? "Saugoma..." : "💾 Išsaugoti"}
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
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", margin:0 }}>{f.emoji} {f.label}</p>
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

        {history.map((m, idx) => (
          <div key={m.id} style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"12px 14px", marginBottom:8, borderLeft:`3px solid ${idx===0?"#AD1457":"rgba(255,255,255,0.1)"}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:0 }}>
                📅 {m.measured_at?.slice(0,10)}
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
      </div>
    </div>
  );
}
