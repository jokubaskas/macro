import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";

const PACKAGES = [
  { type:"1",  total:1,  label:"1 treniruotė",   price:"45€",  desc:"Tobula pirmai pažintinei treniruotei" },
  { type:"8",  total:8,  label:"8 treniruotės",   price:"320€", desc:"Populiariausias pasirinkimas" },
  { type:"16", total:16, label:"16 treniruočių",  price:"600€", desc:"Geriausias kainos ir kokybės santykis" },
];

const STATUS_INFO = {
  pending:  { emoji:"⏳", label:"Laukia patvirtinimo", color:"#FFD700", bg:"rgba(255,200,0,0.1)" },
  approved: { emoji:"✅", label:"Aktyvus",             color:"#7FFFB0", bg:"rgba(127,255,176,0.1)" },
};

export default function TrainingPackages({ user, onClose }) {
  const [packages, setPackages] = useState([]);
  const [loading, setSaving]    = useState(false);
  const [sending, setSending]   = useState(false);

  const load = useCallback(async () => {
    const data = await pb.collection("training_packages").getFullList({
      filter: `client_id="${user.id}"`, sort: "-created", requestKey: null,
    }).catch(() => []);
    setPackages(data);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function handleRequest(pkg) {
    setSending(pkg.type);
    await pb.collection("training_packages").create({
      client_id:     user.id,
      package_type:  pkg.type,
      credits_total: pkg.total,
      credits_used:  0,
      status:        "pending",
    }).catch(() => {});
    await load();
    setSending(false);
  }

  // Aktyvus paketas (approved su likusiais kreditais)
  const active = packages.find(p => p.status === "approved" && p.credits_used < p.credits_total);
  const pending = packages.filter(p => p.status === "pending");

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"linear-gradient(160deg,#3a0a20 0%,#6D1B3B 45%,#AD1457 100%)", overflowY:"auto", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10, backdropFilter:"blur(10px)" }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer" }}>← Atgal</button>
        <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>🎟️ Treniruočių paketai</h1>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>

        {/* Aktyvus paketas */}
        {active && (
          <div style={{ background:"rgba(127,255,176,0.1)", border:"1.5px solid rgba(127,255,176,0.3)", borderRadius:18, padding:"16px", marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:700, color:"#7FFFB0", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 8px" }}>✅ Aktyvus paketas</p>
            <p style={{ fontSize:22, fontWeight:800, color:"#fff", margin:"0 0 4px" }}>
              {active.credits_total - active.credits_used} <span style={{ fontSize:14, fontWeight:400, color:"rgba(255,255,255,0.5)" }}>/ {active.credits_total} treniruočių liko</span>
            </p>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:99, height:6, marginTop:8 }}>
              <div style={{ width:`${((active.credits_total - active.credits_used) / active.credits_total) * 100}%`, height:"100%", borderRadius:99, background:"#7FFFB0", transition:"width 0.3s" }} />
            </div>
          </div>
        )}

        {/* Laukiančios užklausos */}
        {pending.length > 0 && (
          <div style={{ marginBottom:20 }}>
            {pending.map(p => (
              <div key={p.id} style={{ background:"rgba(255,200,0,0.08)", border:"1px solid rgba(255,200,0,0.25)", borderRadius:14, padding:"12px 16px", marginBottom:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>{PACKAGES.find(pk=>pk.type===p.package_type)?.label}</p>
                  <p style={{ fontSize:11, color:"#FFD700", margin:0 }}>⏳ Laukia trenerės patvirtinimo</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paketų pasirinkimas */}
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 12px" }}>Pasirinkti paketą</p>

        {PACKAGES.map(pkg => {
          const isSending = sending === pkg.type;
          const alreadyPending = pending.some(p => p.package_type === pkg.type);
          return (
            <div key={pkg.type} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:"16px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:16, fontWeight:800, color:"#fff", margin:"0 0 2px" }}>{pkg.label}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0 }}>{pkg.desc}</p>
                </div>
                <span style={{ fontSize:18, fontWeight:800, color:"#AD1457" }}>{pkg.price}</span>
              </div>
              <button onClick={()=>!alreadyPending&&!isSending&&handleRequest(pkg)} disabled={alreadyPending||!!sending}
                style={{ width:"100%", padding:"11px", borderRadius:12, border:"none", background: alreadyPending ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#6D1B3B,#AD1457)", color: alreadyPending ? "rgba(255,255,255,0.3)" : "#fff", fontSize:13, fontWeight:700, cursor: alreadyPending||sending ? "default" : "pointer", fontFamily:"inherit" }}>
                {alreadyPending ? "⏳ Užklausa išsiųsta" : isSending ? "Siunčiama..." : "Siųsti užklausą trenerei →"}
              </button>
            </div>
          );
        })}

        <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", textAlign:"center", marginTop:16 }}>
          Trenerė patvirtins užklausą ir galėsite rezervuoti treniruotes
        </p>
      </div>
    </div>
  );
}
