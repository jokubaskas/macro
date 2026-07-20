import { useState, useEffect, useCallback, useMemo } from "react";
import { pb } from "./pb";
import { computeBaseValidUntil, effectiveDeadline, fetchAllDayVacations, daysUntil } from "./packageDeadline";
import { ChevronLeft, Ticket, Close, Check, Calendar, AlertTriangle } from "./ui/icons";
import { SearchInput, ShowMoreButton } from "./ui/kit";

const PACKAGES = {
  "1":  { label:"1 treniruotė",  total:1  },
  "8":  { label:"8 treniruotės", total:8  },
  "16": { label:"16 treniruočių", total:16 },
};

export default function PackageAdmin({ onClose }) {
  const [pending,  setPending]  = useState([]);
  const [approved, setApproved] = useState([]);
  const [clients,  setClients]  = useState({});
  const [vacations, setVacations] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("pending");
  const [search,   setSearch]   = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  const load = useCallback(async () => {
    setLoading(true);
    const [pkgs, cls, vac] = await Promise.all([
      pb.collection("training_packages").getFullList({ sort:"-created", requestKey:null }).catch(()=>[]),
      pb.collection("users").getFullList({ filter:'role="client"', requestKey:null }).catch(()=>[]),
      fetchAllDayVacations(),
    ]);
    const clientMap = {};
    cls.forEach(c => { clientMap[c.id] = c; });
    setClients(clientMap);
    setVacations(vac);
    setPending(pkgs.filter(p=>p.status==="pending"));
    // Išnaudoti (0 liko) arba pasibaigusio galiojimo (su atostogų pratęsimu
    // įskaičiuotu) paketai nebelaikomi "aktyviais" — jų čia nerodome.
    setApproved(pkgs.filter(p => {
      if (p.status !== "approved" || (p.credits_total||0) <= (p.credits_used||0)) return false;
      const dl = effectiveDeadline(p, vac);
      return !dl || daysUntil(dl) >= 0;
    }));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(pkg) {
    await pb.collection("training_packages").update(pkg.id, {
      status: "approved",
      valid_until: computeBaseValidUntil(pkg.package_type),
    }).catch(()=>{});
    load();
  }

  async function handleReject(pkg) {
    await pb.collection("training_packages").update(pkg.id, { status:"rejected" }).catch(()=>{});
    load();
  }

  // "Aktyvūs" rodomi sugrupuoti pagal klientą (bendra visų jo patvirtintų
  // paketų kreditų suma), o ne kiekvienas paketas atskirai — kad sutaptų su
  // tuo, ką klientas mato savo pusėje. Terminas — artimiausias (anksčiausias)
  // iš to kliento aktyvių paketų, jau su atostogų pratęsimu įskaičiuotu.
  const approvedByClient = useMemo(() => {
    const map = {};
    approved.forEach(p => {
      if (!map[p.client_id]) map[p.client_id] = { client_id:p.client_id, credits_total:0, credits_used:0, count:0, nearestDeadline:null };
      map[p.client_id].credits_total += (p.credits_total||0);
      map[p.client_id].credits_used  += (p.credits_used||0);
      map[p.client_id].count += 1;
      const deadline = effectiveDeadline(p, vacations);
      if (deadline && (!map[p.client_id].nearestDeadline || deadline < map[p.client_id].nearestDeadline)) {
        map[p.client_id].nearestDeadline = deadline;
      }
    });
    return Object.values(map);
  }, [approved, vacations]);

  const tabList = tab === "pending" ? pending : approvedByClient;
  const q = search.trim().toLowerCase();
  const list = q ? tabList.filter(p => clients[p.client_id]?.name?.toLowerCase().includes(q)) : tabList;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, paddingBottom:80, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}><Ticket size={15} />Paketų valdymas</h1>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>
        {/* Tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {[{k:"pending",l:"Laukia",count:pending.length},{k:"approved",l:"Aktyvūs",count:approved.length}].map(t=>(
            <button key={t.k} onClick={()=>{setTab(t.k);setVisibleCount(8);}} style={{ flex:1, padding:"10px", borderRadius:12, border:"none", background:tab===t.k?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {t.l} {t.count>0&&<span style={{ fontSize:10, opacity:0.7 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        {tabList.length > 8 && (
          <SearchInput value={search} onChange={v=>{setSearch(v);setVisibleCount(8);}} placeholder="Ieškoti kliento pagal vardą..." />
        )}

        {loading && <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Kraunama...</p>}

        {!loading && list.length===0 && (
          <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 0" }}>Nėra įrašų</p>
        )}

        {tab === "pending" && list.slice(0, visibleCount).map(pkg => {
          const client = clients[pkg.client_id];
          const pkgInfo = PACKAGES[pkg.package_type];
          return (
            <div key={pkg.id} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>{client?.name || "–"}</p>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:0 }}>{pkgInfo?.label}</p>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>handleReject(pkg)} style={{ flex:1, padding:"9px", borderRadius:10, border:"1px solid rgba(255,100,100,0.4)", background:"rgba(255,100,100,0.1)", color:"#FF8888", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><Close size={12} />Atmesti</button>
                <button onClick={()=>handleApprove(pkg)} style={{ flex:2, padding:"9px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#1a4731,#276749)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><Check size={12} />Patvirtinti</button>
              </div>
            </div>
          );
        })}

        {tab === "approved" && list.slice(0, visibleCount).map(item => {
          const client = clients[item.client_id];
          const left = item.credits_total - item.credits_used;
          const days = item.nearestDeadline != null ? daysUntil(item.nearestDeadline) : null;
          const soon = days != null && days <= 7;
          return (
            <div key={item.client_id} style={{
              background: soon ? "rgba(255,200,0,0.1)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${soon ? "rgba(255,200,0,0.35)" : "rgba(255,255,255,0.15)"}`,
              borderRadius:16, padding:"14px 16px", marginBottom:10,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>{client?.name || "–"}</p>
                  <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:0 }}>{item.count} {item.count===1?"paketas":"paketai"}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ fontSize:18, fontWeight:800, color:left>0?"#7FFFB0":"rgba(255,255,255,0.3)", margin:0 }}>{left}/{item.credits_total}</p>
                  <p style={{ fontSize:9, color:"rgba(255,255,255,0.4)", margin:0 }}>liko treniruočių</p>
                </div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:99, height:5, marginBottom: item.nearestDeadline ? 8 : 0 }}>
                <div style={{ width:`${item.credits_total ? left/item.credits_total*100 : 0}%`, height:"100%", borderRadius:99, background:"#7FFFB0" }} />
              </div>
              {item.nearestDeadline && (
                <p style={{ fontSize:11, color: soon ? "#FFD700" : "rgba(255,255,255,0.5)", fontWeight: soon ? 700 : 400, margin:0, display:"flex", alignItems:"center", gap:5 }}>
                  {soon ? <AlertTriangle size={11} /> : <Calendar size={11} />}
                  {days === 0
                    ? "Terminas baigiasi šiandien"
                    : `Galioja iki ${item.nearestDeadline} (liko ${days} d.)`}
                </p>
              )}
            </div>
          );
        })}
        <ShowMoreButton remaining={list.length - visibleCount} onClick={() => setVisibleCount(v => v + 8)} />
      </div>
    </div>
  );
}