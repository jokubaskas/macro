import { useState, useEffect } from "react";
import { pb } from "./pb";

const VIEWS = [
  { key:"photo_front", label:"Priekis", emoji:"⬆️" },
  { key:"photo_side",  label:"Šonas",   emoji:"➡️" },
  { key:"photo_back",  label:"Nugara",  emoji:"⬇️" },
];

export default function ProgressCompare({ client, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idxA, setIdxA]       = useState(null); // senesnė (kairė)
  const [idxB, setIdxB]       = useState(null); // naujesnė (dešinė)
  const [view, setView]       = useState("photo_front");

  useEffect(() => {
    pb.collection("progress_photos").getFullList({
      filter: `user_id="${client.id}"`, sort: "date", requestKey: null,
    }).then(data => {
      setHistory(data);
      if (data.length >= 2) { setIdxA(0); setIdxB(data.length-1); }
      else if (data.length === 1) { setIdxA(0); setIdxB(0); }
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [client.id]);

  const photoA = idxA != null ? history[idxA] : null;
  const photoB = idxB != null ? history[idxB] : null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", padding:"16px 20px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer" }}>← Atgal</button>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>📸 Progreso palyginimas</h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{client.name}</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>

        {loading && <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Kraunama...</p>}

        {!loading && history.length === 0 && (
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:16, padding:"28px 16px", textAlign:"center", border:"2px dashed rgba(255,255,255,0.12)" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14 }}>Klientas dar neįkėlė progreso nuotraukų</p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <>
            {/* Rakursas */}
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {VIEWS.map(v => (
                <button key={v.key} onClick={()=>setView(v.key)} style={{ flex:1, padding:"9px 4px", borderRadius:12, border:"none", background:view===v.key?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>

            {/* Palyginimas šalia */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[{label:"Anksčiau", photo:photoA},{label:"Dabar", photo:photoB}].map((col,i) => (
                <div key={i}>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", textAlign:"center", marginBottom:6, fontWeight:700 }}>{col.label}</p>
                  <div style={{ aspectRatio:"3/4", borderRadius:14, overflow:"hidden", background:"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {col.photo && col.photo[view] ? (
                      <img src={pb.files.getURL(col.photo, col.photo[view])} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    ) : (
                      <span style={{ color:"rgba(255,255,255,0.2)", fontSize:12 }}>Nėra</span>
                    )}
                  </div>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textAlign:"center", marginTop:6 }}>{col.photo?.date || "–"}</p>
                </div>
              ))}
            </div>

            {/* Datos slankikliai */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:6 }}>Anksčiau (kairė)</label>
              <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
                {history.map((h,i) => (
                  <button key={h.id} onClick={()=>setIdxA(i)} style={{ padding:"7px 12px", borderRadius:10, border:"none", background:idxA===i?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", flexShrink:0 }}>
                    {h.date}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:6 }}>Dabar (dešinė)</label>
              <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
                {history.map((h,i) => (
                  <button key={h.id} onClick={()=>setIdxB(i)} style={{ padding:"7px 12px", borderRadius:10, border:"none", background:idxB===i?"#276749":"rgba(255,255,255,0.1)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", flexShrink:0 }}>
                    {h.date}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
