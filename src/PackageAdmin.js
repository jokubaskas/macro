import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";

const PACKAGES = {
  "1":  { label:"1 treniruotė",  total:1  },
  "8":  { label:"8 treniruotės", total:8  },
  "16": { label:"16 treniruočių", total:16 },
};

export default function PackageAdmin({ onClose }) {
  const [pending,  setPending]  = useState([]);
  const [approved, setApproved] = useState([]);
  const [clients,  setClients]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const [pkgs, cls] = await Promise.all([
      pb.collection("training_packages").getFullList({ sort:"-created", requestKey:null }).catch(()=>[]),
      pb.collection("users").getFullList({ filter:'role="client"', requestKey:null }).catch(()=>[]),
    ]);
    const clientMap = {};
    cls.forEach(c => { clientMap[c.id] = c; });
    setClients(clientMap);
    setPending(pkgs.filter(p=>p.status==="pending"));
    setApproved(pkgs.filter(p=>p.status==="approved"));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(pkg) {
    await pb.collection("training_packages").update(pkg.id, { status:"approved" }).catch(()=>{});
    load();
  }

  async function handleReject(pkg) {
    await pb.collection("training_packages").update(pkg.id, { status:"rejected" }).catch(()=>{});
    load();
  }

  const list = tab === "pending" ? pending : approved;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, paddingBottom:80, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer" }}>← Atgal</button>
        <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>🎟️ Paketų valdymas</h1>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>
        {/* Tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {[{k:"pending",l:"Laukia",count:pending.length},{k:"approved",l:"Aktyvūs",count:approved.length}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} style={{ flex:1, padding:"10px", borderRadius:12, border:"none", background:tab===t.k?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {t.l} {t.count>0&&<span style={{ fontSize:10, opacity:0.7 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        {loading && <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Kraunama...</p>}

        {!loading && list.length===0 && (
          <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Nėra įrašų</p>
        )}

        {list.map(pkg => {
          const client = clients[pkg.client_id];
          const pkgInfo = PACKAGES[pkg.package_type];
          const left = (pkg.credits_total||0) - (pkg.credits_used||0);
          return (
            <div key={pkg.id} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>{client?.name || "–"}</p>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:0 }}>{pkgInfo?.label}</p>
                </div>
                {pkg.status==="approved" && (
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:18, fontWeight:800, color:left>0?"#7FFFB0":"rgba(255,255,255,0.3)", margin:0 }}>{left}/{pkg.credits_total}</p>
                    <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", margin:0 }}>liko treniruočių</p>
                  </div>
                )}
              </div>
              {pkg.status==="approved" && (
                <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:99, height:5, marginBottom:10 }}>
                  <div style={{ width:`${left/pkg.credits_total*100}%`, height:"100%", borderRadius:99, background:"#7FFFB0" }} />
                </div>
              )}
              {pkg.status==="pending" && (
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>handleReject(pkg)} style={{ flex:1, padding:"9px", borderRadius:10, border:"1px solid rgba(255,100,100,0.4)", background:"rgba(255,100,100,0.1)", color:"#FF8888", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✕ Atmesti</button>
                  <button onClick={()=>handleApprove(pkg)} style={{ flex:2, padding:"9px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#1a4731,#276749)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>✓ Patvirtinti</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
