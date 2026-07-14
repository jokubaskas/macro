import { useState, useEffect, useCallback } from "react";
import { pb, pbFileToken } from "./pb";
import { ArrowUp, ChevronRight, ArrowDown, Close, ChevronLeft, Camera } from "./ui/icons";
import ProgressPhotos from "./ProgressPhotos";

const VIEWS = [
  { key:"photo_front", label:"Priekis", Icon:ArrowUp },
  { key:"photo_side",  label:"Šonas",   Icon:ChevronRight },
  { key:"photo_back",  label:"Nugara",  Icon:ArrowDown },
];

export default function ProgressCompare({ client, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idxA, setIdxA]       = useState(null); // senesnė (kairė)
  const [idxB, setIdxB]       = useState(null); // naujesnė (dešinė)
  const [view, setView]       = useState("photo_front");
  const [showAllA, setShowAllA] = useState(false);
  const [showAllB, setShowAllB] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [fileToken, setFileToken] = useState(null);

  useEffect(() => { pbFileToken().then(setFileToken); }, []);

  function photoUrl(record, filename) {
    return pb.files.getURL(record, filename, fileToken ? { token: fileToken } : {});
  }
  const VISIBLE_DATES = 6;

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      pb.collection("progress_photos").getFullList({
        filter: `user_id="${client.id}"`, sort: "date", requestKey: null,
      }).catch(()=>[]),
      pb.collection("users").getOne(client.id, { requestKey: null }).catch(()=>null),
    ]).then(([data, profile]) => {
      let combined = [...data];
      if (profile?.photo_front) {
        const regDate = profile.created ? profile.created.slice(0,10) : "0000-00-00";
        const alreadyExists = data.some(d => d.date === regDate);
        if (!alreadyExists) {
          combined.unshift({
            id: "registration",
            date: regDate,
            photo_front: profile.photo_front,
            photo_side: profile.photo_side,
            photo_back: profile.photo_back,
            _isProfile: true,
            _record: profile,
          });
        }
      }
      combined.sort((a,b) => a.date.localeCompare(b.date));
      setHistory(combined);
      if (combined.length >= 2) { setIdxA(0); setIdxB(combined.length-1); }
      else if (combined.length === 1) { setIdxA(0); setIdxB(0); }
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [client.id]);

  useEffect(() => { load(); }, [load]);

  const photoA = idxA != null ? history[idxA] : null;
  const photoB = idxB != null ? history[idxB] : null;

  const [preview, setPreview] = useState(null);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {showUpload && (
        <ProgressPhotos user={client} onClose={() => { setShowUpload(false); load(); }} canEdit />
      )}
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:"fixed", inset:0, zIndex:1100, background:"rgba(0,0,0,0.95)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <button onClick={(e)=>{e.stopPropagation();setPreview(null);}} style={{ position:"absolute", top:"max(env(safe-area-inset-top), 16px)", right:20, background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"50%", width:40, height:40, color:"#fff", fontSize:18, cursor:"pointer", zIndex:1, display:"flex", alignItems:"center", justifyContent:"center" }}><Close size={18} /></button>
          <img src={preview} alt="" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
        </div>
      )}
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10, backdropFilter:"blur(10px)" }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}><Camera size={15} />Progreso palyginimas</h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{client.name}</p>
        </div>
        <button onClick={() => setShowUpload(true)} style={{ background:"linear-gradient(135deg,#6D1B3B,#AD1457)", border:"none", borderRadius:10, padding:"8px 12px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
          + Įkelti
        </button>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>

        {loading && <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Kraunama...</p>}

        {!loading && history.length === 0 && (
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:16, padding:"28px 16px", textAlign:"center", border:"2px dashed rgba(255,255,255,0.12)" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14, margin:"0 0 14px" }}>Klientas dar neįkėlė progreso nuotraukų</p>
            <button onClick={() => setShowUpload(true)} style={{ padding:"11px 18px", borderRadius:12, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", border:"none", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              + Įkelti nuotraukas
            </button>
          </div>
        )}

        {!loading && history.length > 0 && (
          <>
            {/* Rakursas */}
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {VIEWS.map(v => (
                <button key={v.key} onClick={()=>setView(v.key)} style={{ flex:1, padding:"9px 4px", borderRadius:12, border:"none", background:view===v.key?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                  <v.Icon size={12} />{v.label}
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
                      <img onClick={()=>setPreview(photoUrl(col.photo._isProfile ? col.photo._record : col.photo, col.photo[view]))} src={photoUrl(col.photo._isProfile ? col.photo._record : col.photo, col.photo[view])} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", cursor:"pointer" }} />
                    ) : (
                      <span style={{ color:"rgba(255,255,255,0.2)", fontSize:12 }}>Nėra</span>
                    )}
                  </div>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textAlign:"center", marginTop:6 }}>{col.photo?.date?.slice(0,10) || "–"}{col.photo?._isProfile && " (pradinė)"}</p>
                </div>
              ))}
            </div>

            {/* Datos slankikliai */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:6 }}>Anksčiau (kairė)</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {(showAllA ? history : history.slice(-VISIBLE_DATES)).map((h) => {
                  const i = history.indexOf(h);
                  return (
                    <button key={h.id} onClick={()=>setIdxA(i)} style={{ padding:"7px 12px", borderRadius:10, border:"none", background:idxA===i?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      {h.date.slice(0,10)}
                    </button>
                  );
                })}
              </div>
              {!showAllA && history.length > VISIBLE_DATES && (
                <button onClick={()=>setShowAllA(true)} style={{ marginTop:8, padding:"7px 14px", borderRadius:10, border:"1px dashed rgba(255,255,255,0.3)", background:"transparent", color:"rgba(255,255,255,0.6)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  Rodyti daugiau (+{history.length - VISIBLE_DATES})
                </button>
              )}
            </div>

            <div>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:6 }}>Dabar (dešinė)</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {(showAllB ? history : history.slice(-VISIBLE_DATES)).map((h) => {
                  const i = history.indexOf(h);
                  return (
                    <button key={h.id} onClick={()=>setIdxB(i)} style={{ padding:"7px 12px", borderRadius:10, border:"none", background:idxB===i?"#276749":"rgba(255,255,255,0.1)", color:"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                      {h.date.slice(0,10)}
                    </button>
                  );
                })}
              </div>
              {!showAllB && history.length > VISIBLE_DATES && (
                <button onClick={()=>setShowAllB(true)} style={{ marginTop:8, padding:"7px 14px", borderRadius:10, border:"1px dashed rgba(255,255,255,0.3)", background:"transparent", color:"rgba(255,255,255,0.6)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                  Rodyti daugiau (+{history.length - VISIBLE_DATES})
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}