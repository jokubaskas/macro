import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { Clipboard, Salad, Heart, Moon, Droplet, Walk, ChevronLeft, BarChart, Users } from "./ui/icons";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n) { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split("T")[0]; }

const PERIOD_OPTIONS = [
  { k:7,  l:"7 d." },
  { k:14, l:"14 d." },
  { k:30, l:"30 d." },
];

function StatCard({ icon, value, label, sub, color }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"16px 14px", border:`1px solid ${color||"rgba(255,255,255,0.12)"}` }}>
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ fontSize:26, fontWeight:700, color:"#fff" }}>{value}</div>
      <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function ClientRow({ client, stats }) {
  const pct = stats.checkinDays ? Math.round((stats.checkinDays / stats.totalDays) * 100) : 0;
  const barColor = pct >= 70 ? "#7FFFB0" : pct >= 40 ? "#FFD700" : "#FF8888";

  return (
    <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"12px 14px", marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{client.name}</span>
        <span style={{ fontSize:11, fontWeight:700, color:barColor }}>{pct}%</span>
      </div>
      <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:99, height:5, marginBottom:8 }}>
        <div style={{ width:`${pct}%`, height:"100%", borderRadius:99, background:barColor, transition:"width 0.3s" }} />
      </div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", display:"inline-flex", alignItems:"center", gap:3 }}><Clipboard size={11} />{stats.checkinDays}/{stats.totalDays} check-in</span>
        {stats.avgNutrition != null && <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", display:"inline-flex", alignItems:"center", gap:3 }}><Salad size={11} />{stats.avgNutrition.toFixed(1)}/3</span>}
        {stats.avgWellbeing != null && <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", display:"inline-flex", alignItems:"center", gap:3 }}><Heart size={11} color="#7FFFB0" />{stats.avgWellbeing.toFixed(1)}/3</span>}
        {stats.avgSleep != null && <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", display:"inline-flex", alignItems:"center", gap:3 }}><Moon size={11} />{stats.avgSleep.toFixed(1)}h</span>}
        {stats.waterRate != null && <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", display:"inline-flex", alignItems:"center", gap:3 }}><Droplet size={11} />{stats.waterRate}%</span>}
        {stats.avgSteps != null && (
          <span style={{ fontSize:10, color: stats.stepsGoalRate >= 80 ? "#7FFFB0" : stats.stepsGoalRate >= 50 ? "#FFD700" : "rgba(255,255,255,0.5)", display:"inline-flex", alignItems:"center", gap:3 }}>
            <Walk size={11} />{stats.avgSteps.toLocaleString()} ({stats.stepsGoalRate}% tikslo)
          </span>
        )}
      </div>
    </div>
  );
}

export default function TrainerStats({ onClose }) {
  const [period, setPeriod]     = useState(7);
  const [loading, setLoading]   = useState(true);
  const [clients, setClients]   = useState([]);
  const [clientStats, setClientStats] = useState({});
  const [overview, setOverview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const from = daysAgoStr(period - 1);
    const today = todayStr();

    const [cl, checkins, sleeps, waters, bookings] = await Promise.all([
      pb.collection("users").getFullList({ filter:'role="client"', requestKey:null }).catch(()=>[]),
      pb.collection("daily_checkins").getFullList({ filter:`date>="${from}" && date<="${today}" && is_done=true`, requestKey:null }).catch(()=>[]),
      pb.collection("sleep_log").getFullList({ filter:`date>="${from}" && date<="${today}"`, requestKey:null }).catch(()=>[]),
      pb.collection("water_log").getFullList({ filter:`date>="${from}" && date<="${today}"`, requestKey:null }).catch(()=>[]),
      pb.collection("bookings").getFullList({ filter:`date>="${from}" && date<="${today}"`, requestKey:null }).catch(()=>[]),
    ]);

    setClients(cl);

    // Per-client statistika
    const stats = {};
    cl.forEach(c => {
      const myCheckins = checkins.filter(x => x.user_id === c.id);
      const mySleeps    = sleeps.filter(x => x.user_id === c.id);
      const myWaters    = waters.filter(x => x.user_id === c.id);

      stats[c.id] = {
        totalDays: period,
        checkinDays: myCheckins.length,
        avgNutrition: myCheckins.length ? myCheckins.reduce((a,x)=>a+(x.nutrition_score||0),0)/myCheckins.length : null,
        avgWellbeing: myCheckins.length ? myCheckins.reduce((a,x)=>a+(x.wellbeing_score||0),0)/myCheckins.length : null,
        avgSleep: mySleeps.length ? mySleeps.reduce((a,x)=>a+(x.hours_slept||0),0)/mySleeps.length : null,
        waterRate: myWaters.length ? Math.round(myWaters.filter(w=>w.ml >= (w.goal||2000)).length / myWaters.length * 100) : null,
        avgSteps: myCheckins.filter(x=>x.steps>0).length ? Math.round(myCheckins.filter(x=>x.steps>0).reduce((a,x)=>a+(x.steps||0),0)/myCheckins.filter(x=>x.steps>0).length) : null,
        stepsGoalRate: myCheckins.filter(x=>x.steps>0).length ? Math.round(myCheckins.filter(x=>x.steps>0).filter(x=>x.steps>=7000).length/myCheckins.filter(x=>x.steps>0).length*100) : null,
      };
    });
    setClientStats(stats);

    // Bendra apžvalga
    const activeClients = cl.filter(c => stats[c.id]?.checkinDays > 0).length;
    const totalCheckins = checkins.length;
    const avgNutritionAll = checkins.length ? checkins.reduce((a,x)=>a+(x.nutrition_score||0),0)/checkins.length : null;
    const avgWellbeingAll = checkins.length ? checkins.reduce((a,x)=>a+(x.wellbeing_score||0),0)/checkins.length : null;
    const pendingBookings = bookings.filter(b=>b.status==="pending").length;
    const approvedBookings = bookings.filter(b=>b.status==="approved").length;
    const cancelledBookings = bookings.filter(b=>b.status==="cancelled").length;

    setOverview({
      totalClients: cl.length,
      activeClients,
      totalCheckins,
      avgNutritionAll,
      avgWellbeingAll,
      pendingBookings,
      approvedBookings,
      cancelledBookings,
    });

    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const sortedClients = [...clients].sort((a,b) => (clientStats[b.id]?.checkinDays||0) - (clientStats[a.id]?.checkinDays||0));

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, paddingBottom:80, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}><BarChart size={15} />Statistika</h1>
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

        {!loading && overview && (
          <>
            {/* Bendra apžvalga */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              <StatCard icon={<Users size={22} />} value={overview.activeClients} label="Aktyvūs klientai" sub={`iš ${overview.totalClients} viso`} />
              <StatCard icon={<Clipboard size={22} />} value={overview.totalCheckins} label="Check-in'ų" sub={`per ${period} d.`} />
              <StatCard icon={<Salad size={22} />} value={overview.avgNutritionAll ? overview.avgNutritionAll.toFixed(1) : "–"} label="Vid. mityba" sub="iš 3.0" />
              <StatCard icon={<Heart size={22} color="#7FFFB0" />} value={overview.avgWellbeingAll ? overview.avgWellbeingAll.toFixed(1) : "–"} label="Vid. savijauta" sub="iš 3.0" />
            </div>

            {/* Rezervacijos */}
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Rezervacijos ({period} d.)</p>
            <div style={{ display:"flex", gap:8, marginBottom:20 }}>
              <div style={{ flex:1, background:"rgba(255,200,0,0.1)", borderRadius:12, padding:"10px", textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:700, color:"#FFD700" }}>{overview.pendingBookings}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)" }}>Laukia</div>
              </div>
              <div style={{ flex:1, background:"rgba(127,255,176,0.1)", borderRadius:12, padding:"10px", textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:700, color:"#7FFFB0" }}>{overview.approvedBookings}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)" }}>Patvirtinta</div>
              </div>
              <div style={{ flex:1, background:"rgba(255,100,100,0.1)", borderRadius:12, padding:"10px", textAlign:"center" }}>
                <div style={{ fontSize:18, fontWeight:700, color:"#FF8888" }}>{overview.cancelledBookings}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)" }}>Atšaukta</div>
              </div>
            </div>

            {/* Klientų sąrašas */}
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>Klientų aktyvumas</p>
            {sortedClients.length === 0 && (
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", padding:"20px 0" }}>Klientų nėra</p>
            )}
            {sortedClients.map(c => (
              <ClientRow key={c.id} client={c} stats={clientStats[c.id] || { totalDays:period, checkinDays:0 }} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
