import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";

const PK = { dark:"#6D1B3B", mid:"#AD1457" };
function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function ProgressPhotos({ user, onClose }) {
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDate, setUploadDate] = useState(todayStr());
  const [photos, setPhotos]     = useState({ photo_front:null, photo_side:null, photo_back:null });
  const [previews, setPreviews] = useState({ photo_front:null, photo_side:null, photo_back:null });
  const [saving, setSaving]     = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  const load = useCallback(async () => {
    setLoading(true);
    const [data, profile] = await Promise.all([
      pb.collection("progress_photos").getFullList({
        filter: `user_id="${user.id}"`, sort: "-date", requestKey: null,
      }).catch(()=>[]),
      pb.collection("users").getOne(user.id, { requestKey: null }).catch(()=>null),
    ]);

    let combined = [...data];
    if (profile?.photo_front) {
      const regDate = profile.created ? profile.created.slice(0,10) : "0000-00-00";
      const alreadyExists = data.some(d => d.date.slice(0,10) === regDate);
      if (!alreadyExists) {
        combined.push({
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
    combined.sort((a,b) => {
      const dateCmp = b.date.slice(0,10).localeCompare(a.date.slice(0,10));
      if (dateCmp !== 0) return dateCmp;
      // Tos pačios dienos įrašai — naujesnis (vėliau sukurtas) viršuje
      const aCreated = a.created || a.date;
      const bCreated = b.created || b.date;
      return bCreated.localeCompare(aCreated);
    });
    setHistory(combined);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  function handleFile(field, e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreviews(p => ({...p, [field]: ev.target.result}));
    reader.readAsDataURL(file);
    setPhotos(p => ({...p, [field]: file}));
  }

  async function handleSave() {
    if (!photos.photo_front) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("date", uploadDate);
      if (photos.photo_front) formData.append("photo_front", photos.photo_front);
      if (photos.photo_side)  formData.append("photo_side", photos.photo_side);
      if (photos.photo_back)  formData.append("photo_back", photos.photo_back);
      await pb.collection("progress_photos").create(formData);
      setShowUpload(false);
      setPhotos({ photo_front:null, photo_side:null, photo_back:null });
      setPreviews({ photo_front:null, photo_side:null, photo_back:null });
      await load();
    } catch(err) {
      console.error("Progress photo save error:", err);
      console.error("Error data:", JSON.stringify(err?.data || err?.response, null, 2));
      alert("Klaida: " + JSON.stringify(err?.data?.data || err?.response?.data || err?.message));
    }
    setSaving(false);
  }

  const fields = [
    { key:"photo_front", label:"Priekis", emoji:"⬆️", required:true },
    { key:"photo_side",  label:"Šonas",   emoji:"➡️", required:false },
    { key:"photo_back",  label:"Nugara",  emoji:"⬇️", required:false },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:`linear-gradient(160deg,#3a0a20 0%,${PK.dark} 45%,${PK.mid} 100%)`, overflowY:"auto", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", padding:"16px 20px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer" }}>← Atgal</button>
        <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>📸 Progreso nuotraukos</h1>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>

        {!showUpload && (
          <button onClick={()=>setShowUpload(true)} style={{ width:"100%", padding:"14px", marginBottom:20, borderRadius:16, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            + Įkelti naujas nuotraukas
          </button>
        )}

        {showUpload && (
          <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:18, padding:16, marginBottom:20 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 12px" }}>Naujos nuotraukos</p>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:"rgba(255,255,255,0.6)", display:"block", marginBottom:5 }}>Data</label>
              <input type="date" value={uploadDate} max={todayStr()} onChange={e=>setUploadDate(e.target.value)}
                style={{ padding:"9px 12px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" }}/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
              {fields.map(f => (
                <label key={f.key} style={{ cursor:"pointer", display:"block" }}>
                  <input type="file" accept="image/*" onChange={e=>handleFile(f.key,e)} style={{ display:"none" }} />
                  <div style={{ aspectRatio:"3/4", borderRadius:12, border:previews[f.key]?"2px solid rgba(255,255,255,0.6)":f.required?"2px dashed rgba(255,180,180,0.5)":"2px dashed rgba(255,255,255,0.25)", background:previews[f.key]?"transparent":"rgba(255,255,255,0.06)", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4 }}>
                    {previews[f.key] ? (
                      <img src={previews[f.key]} alt={f.label} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    ) : (
                      <>
                        <span style={{ fontSize:18 }}>{f.emoji}</span>
                        <span style={{ fontSize:9, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>{f.label}</span>
                        {f.required && <span style={{ fontSize:8, color:"rgba(255,150,150,0.8)" }}>* privaloma</span>}
                      </>
                    )}
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>setShowUpload(false)} style={{ flex:1, padding:"11px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.3)", background:"transparent", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Atšaukti</button>
              <button onClick={handleSave} disabled={!photos.photo_front||saving} style={{ flex:2, padding:"11px", borderRadius:12, background:photos.photo_front?"linear-gradient(135deg,#6D1B3B,#AD1457)":"rgba(255,255,255,0.1)", color:photos.photo_front?"#fff":"rgba(255,255,255,0.3)", border:"none", fontSize:14, fontWeight:700, cursor:photos.photo_front?"pointer":"default", fontFamily:"inherit" }}>
                {saving?"Saugoma...":"💾 Išsaugoti"}
              </button>
            </div>
          </div>
        )}

        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Istorija</p>

        {loading && <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"20px 0" }}>Kraunama...</p>}
        {!loading && history.length===0 && <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"20px 0" }}>Nuotraukų dar nėra</p>}

        {history.slice(0, visibleCount).map(h => (
          <div key={h.id} style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:12, marginBottom:10 }}>
            <p style={{ fontSize:12, fontWeight:700, color:"#fff", margin:"0 0 8px" }}>
              📅 {h.date.slice(0,10)} {h._isProfile && <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:400 }}>(pradinė)</span>}
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
              {["photo_front","photo_side","photo_back"].map(k => h[k] ? (
                <img key={k} src={pb.files.getURL(h._isProfile ? h._record : h, h[k])} alt="" style={{ width:"100%", aspectRatio:"3/4", objectFit:"cover", borderRadius:8 }} />
              ) : <div key={k} style={{ aspectRatio:"3/4", borderRadius:8, background:"rgba(255,255,255,0.05)" }} />)}
            </div>
          </div>
        ))}

        {history.length > visibleCount && (
          <button onClick={()=>setVisibleCount(c=>c+5)} style={{ width:"100%", padding:"11px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", marginTop:4 }}>
            Rodyti daugiau ({history.length - visibleCount} liko)
          </button>
        )}
      </div>
    </div>
  );
}
