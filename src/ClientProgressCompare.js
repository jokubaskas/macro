import { useState, useEffect, useCallback } from "react";
import { pb, pbFileToken } from "./pb";
import { ArrowUp, ChevronRight, ArrowDown, Close, ChevronLeft, Camera, MessageCircle } from "./ui/icons";

const VIEWS = [
  { key:"photo_front", label:"Priekis", Icon:ArrowUp },
  { key:"photo_side",  label:"Šonas",   Icon:ChevronRight },
  { key:"photo_back",  label:"Nugara",  Icon:ArrowDown },
];

// Kliento progreso nuotraukų palyginimas — visada rodo pirmą ir naujausią
// nuotrauką (be datų pasirinkimo, be įkėlimo galimybės — nuotraukas kelia
// tik trenerė). Prie naujausios nuotraukos rodomas treneres komentaras.
export default function ClientProgressCompare({ user, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState("photo_front");
  const [preview, setPreview] = useState(null);
  const [fileToken, setFileToken] = useState(null);

  useEffect(() => { pbFileToken().then(setFileToken); }, []);

  function photoUrl(record, filename) {
    return pb.files.getURL(record, filename, fileToken ? { token: fileToken } : {});
  }

  const load = useCallback(() => {
    setLoading(true);
    return Promise.all([
      pb.collection("progress_photos").getFullList({
        filter: `user_id="${user.id}"`, sort: "date", requestKey: null,
      }).catch(()=>[]),
      pb.collection("users").getOne(user.id, { requestKey: null }).catch(()=>null),
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
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const photoA = history[0] || null;
  const photoB = history[history.length-1] || null;
  const single = history.length === 1;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:600, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", WebkitOverflowScrolling:"touch", paddingBottom:80, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {preview && (
        <div onClick={()=>setPreview(null)} style={{ position:"fixed", inset:0, zIndex:1100, background:"rgba(0,0,0,0.95)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <button onClick={(e)=>{e.stopPropagation();setPreview(null);}} style={{ position:"absolute", top:"max(env(safe-area-inset-top), 16px)", right:20, background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"50%", width:40, height:40, color:"#fff", fontSize:18, cursor:"pointer", zIndex:1, display:"flex", alignItems:"center", justifyContent:"center" }}><Close size={18} /></button>
          <img src={preview} alt="" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain" }} />
        </div>
      )}
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10, backdropFilter:"blur(10px)" }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}><Camera size={15} />Progresas</h1>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>

        {loading && <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Kraunama...</p>}

        {!loading && history.length === 0 && (
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:16, padding:"28px 16px", textAlign:"center", border:"2px dashed rgba(255,255,255,0.12)" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14, margin:0 }}>Trenerė dar neįkėlė progreso nuotraukų</p>
          </div>
        )}

        {!loading && history.length > 0 && (
          <>
            <div style={{ display:"flex", gap:6, marginBottom:16 }}>
              {VIEWS.map(v => (
                <button key={v.key} onClick={()=>setView(v.key)} style={{ flex:1, padding:"9px 4px", borderRadius:12, border:"none", background:view===v.key?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                  <v.Icon size={12} />{v.label}
                </button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
              {[{label:"Pirma", photo:photoA},{label:"Naujausia", photo:photoB}].map((col,i) => (
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

            {single && (
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", textAlign:"center", marginBottom:16 }}>Kol kas įkelta tik viena nuotrauka — palyginimas atsiras, kai trenerė įkels naują.</p>
            )}

            {photoB?.trainer_comment && (
              <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"14px 16px" }}>
                <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px", display:"flex", alignItems:"center", gap:6 }}><MessageCircle size={12} />Trenerės komentaras</p>
                <p style={{ fontSize:13, color:"#fff", margin:0, lineHeight:1.5, whiteSpace:"pre-wrap" }}>{photoB.trainer_comment}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}