import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { Clipboard, Salad, Heart, Moon, Droplet, Footprints, ChevronLeft, BarChart, Users } from "./ui/icons";
import { SearchInput, ShowMoreButton } from "./ui/kit";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n) { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split("T")[0]; }

const PERIOD_OPTIONS = [
  { k:7,  l:"7 d." },
  { k:14, l:"14 d." },
  { k:30, l:"30 d." },
];

// Trijų pakopų spalvinimas pagal rezultatą: gerai/vidutiniškai/prastai.
function tierColor(val, greenMin, yellowMin) {
  if (val == null) return "rgba(255,255,255,0.5)";
  return val >= greenMin ? "#7FFFB0" : val >= yellowMin ? "#FFD700" : "#FF8888";
}

function ProgressRing({ pct, c1, c2, hit, size = 46 }) {
  const r = (size - 6) / 2, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * C;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="4.5" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={c1} strokeWidth="4.5" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C - dash}
          style={{ transition:"stroke-dashoffset 0.7s cubic-bezier(.23,1,.32,1)", filter: hit ? `drop-shadow(0 0 4px ${c1}99)` : "none" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color:c1 }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, value, label, sub, c1, c2, pct }) {
  const hit = pct != null && pct >= 100;
  return (
    <div style={{
      position:"relative", overflow:"hidden", borderRadius:16, padding:"10px 12px",
      background:`linear-gradient(145deg, ${c1}26, ${c2}12)`,
      border:`1px solid ${c1}3d`,
      display:"flex", alignItems:"center", gap:10,
    }}>
      <div style={{
        position:"absolute", top:-26, right:-26, width:70, height:70, borderRadius:"50%",
        background:`radial-gradient(circle, ${c1}3d, transparent 70%)`,
      }} />
      <div style={{
        position:"relative", width:30, height:30, borderRadius:"50%", flexShrink:0,
        background:`linear-gradient(135deg, ${c1}33, ${c2}22)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow: hit ? `0 0 0 3px ${c1}33` : "none",
      }}>
        <Icon size={15} color={c1} />
      </div>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:800, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{value}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</div>
        {sub && <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)" }}>{sub}</div>}
      </div>
      {pct != null && <ProgressRing pct={pct} c1={c1} c2={c2} hit={hit} />}
    </div>
  );
}

function ClientRow({ client, stats }) {
  const pct = stats.checkinDays ? Math.round((stats.checkinDays / stats.totalDays) * 100) : 0;
  const barColor = pct >= 70 ? "#7FFFB0" : pct >= 40 ? "#FFD700" : "#FF8888";
  const sleepColor = stats.avgSleep == null ? "rgba(255,255,255,0.5)"
    : (stats.avgSleep >= 7 && stats.avgSleep <= 9) ? "#7FFFB0"
    : (stats.avgSleep >= 6 && stats.avgSleep < 10) ? "#FFD700" : "#FF8888";
  const waterColor = tierColor(stats.avgWaterL, 2.0, 1.3);
  const nutritionColor = tierColor(stats.avgNutrition, 2.2, 1.3);
  const wellbeingColor = tierColor(stats.avgWellbeing, 2.2, 1.3);
  const stepsColor = stats.stepsGoalRate == null ? "rgba(255,255,255,0.5)"
    : stats.stepsGoalRate >= 80 ? "#7FFFB0" : stats.stepsGoalRate >= 50 ? "#FFD700" : "#FF8888";

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
        <span style={{ fontSize:10, color:barColor, fontWeight:600, display:"inline-flex", alignItems:"center", gap:3 }}><Clipboard size={11} />{stats.checkinDays}/{stats.totalDays} check-in</span>
        {stats.avgNutrition != null && <span style={{ fontSize:10, color:nutritionColor, fontWeight:600, display:"inline-flex", alignItems:"center", gap:3 }}><Salad size={11} />{stats.avgNutrition.toFixed(1)}/3</span>}
        {stats.avgWellbeing != null && <span style={{ fontSize:10, color:wellbeingColor, fontWeight:600, display:"inline-flex", alignItems:"center", gap:3 }}><Heart size={11} />{stats.avgWellbeing.toFixed(1)}/3</span>}
        {stats.avgSleep != null && <span style={{ fontSize:10, color:sleepColor, fontWeight:600, display:"inline-flex", alignItems:"center", gap:3 }}><Moon size={11} />{stats.avgSleep.toFixed(1)}h</span>}
        {stats.avgWaterL != null && <span style={{ fontSize:10, color:waterColor, fontWeight:600, display:"inline-flex", alignItems:"center", gap:3 }}><Droplet size={11} />{stats.avgWaterL.toFixed(1)}L</span>}
        {stats.avgSteps != null && (
          <span style={{ fontSize:10, color:stepsColor, fontWeight:600, display:"inline-flex", alignItems:"center", gap:3 }}>
            <Footprints size={11} />{stats.avgSteps.toLocaleString()} ({stats.stepsGoalRate}% tikslo)
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
  const [clientSearch, setClientSearch] = useState("");
  const [visibleClients, setVisibleClients] = useState(8);

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
        avgWaterL: myWaters.length ? myWaters.reduce((a,w)=>a+(w.ml||0),0)/myWaters.length/1000 : null,
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
  const q = clientSearch.trim().toLowerCase();
  const filteredClients = q ? sortedClients.filter(c => c.name?.toLowerCase().includes(q)) : sortedClients;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, paddingBottom:80, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
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
              <StatCard icon={Users} c1="#6EC6FF" c2="#2F8FE0"
                value={overview.activeClients} label="Aktyvūs klientai" sub={`iš ${overview.totalClients} viso`}
                pct={overview.totalClients ? overview.activeClients / overview.totalClients * 100 : null} />
              <StatCard icon={Clipboard} c1="#FF9FC7" c2="#E91E8C"
                value={overview.totalCheckins} label="Check-in'ų" sub={`per ${period} d.`} />
              <StatCard icon={Salad} c1="#7FE3A6" c2="#2FBE84"
                value={overview.avgNutritionAll ? overview.avgNutritionAll.toFixed(1) : "–"} label="Vid. mityba" sub="iš 3.0"
                pct={overview.avgNutritionAll ? overview.avgNutritionAll / 3 * 100 : null} />
              <StatCard icon={Heart} c1="#FF9E9E" c2="#FF6E6E"
                value={overview.avgWellbeingAll ? overview.avgWellbeingAll.toFixed(1) : "–"} label="Vid. savijauta" sub="iš 3.0"
                pct={overview.avgWellbeingAll ? overview.avgWellbeingAll / 3 * 100 : null} />
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
            {sortedClients.length === 0 ? (
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", padding:"20px 0" }}>Klientų nėra</p>
            ) : (
              <>
                {sortedClients.length > 8 && (
                  <SearchInput value={clientSearch} onChange={v => { setClientSearch(v); setVisibleClients(8); }} placeholder="Ieškoti kliento pagal vardą..." />
                )}
                {filteredClients.length === 0 ? (
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", padding:"16px 0" }}>Klientų pagal paiešką nerasta</p>
                ) : (
                  <>
                    {filteredClients.slice(0, visibleClients).map(c => (
                      <ClientRow key={c.id} client={c} stats={clientStats[c.id] || { totalDays:period, checkinDays:0 }} />
                    ))}
                    <ShowMoreButton remaining={filteredClients.length - visibleClients} onClick={() => setVisibleClients(v => v + 8)} />
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
