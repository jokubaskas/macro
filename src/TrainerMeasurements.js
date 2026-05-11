import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { PK } from "./constants";

// Admin client su service role – apeinamas RLS
const adminDb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SERVICE_ROLE_KEY
);

function fmt(dateStr) {
  return new Date(dateStr+"T12:00:00").toLocaleDateString("lt-LT", { month:"short", day:"numeric" });
}
function fmtFull(dateStr) {
  return new Date(dateStr+"T12:00:00").toLocaleDateString("lt-LT", { year:"numeric", month:"long", day:"numeric" });
}
function weeksAgo(dateStr) {
  return Math.floor((new Date() - new Date(dateStr+"T12:00:00")) / (7*24*60*60*1000));
}
function weeksUntil(dateStr) {
  return Math.ceil((new Date(dateStr+"T12:00:00") - new Date()) / (7*24*60*60*1000));
}
function addDays(dateStr, days) {
  const d = new Date(dateStr+"T12:00:00");
  d.setDate(d.getDate()+days);
  return d.toISOString().split("T")[0];
}

// ── Progreso grafikas (rodomas trenerei) ─────────────────────────────────────
function DualChart({ clientData, trainerData, cKey, tKey, label, cColor, tColor, unit="" }) {
  const cVals = clientData.map(d=>d[cKey]).filter(Boolean);
  const tVals = trainerData.map(d=>d[tKey]).filter(Boolean);
  const all   = [...cVals, ...tVals];
  if (!all.length) return null;

  const allDates = [...new Set([
    ...clientData.map(d=>d.week_start),
    ...trainerData.map(d=>d.measured_at),
  ])].sort();
  if (allDates.length < 1) return null;

  const W=300, H=110, PAD={t:14,r:12,b:24,l:36};
  const cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;
  const minV=Math.min(...all)*0.985, maxV=Math.max(...all)*1.015, range=maxV-minV||1;

  function x(dateStr) {
    const i=allDates.indexOf(dateStr);
    return PAD.l+(i/Math.max(allDates.length-1,1))*cW;
  }
  function y(v) { return PAD.t+cH-((v-minV)/range)*cH; }

  const cPts=clientData.filter(d=>d[cKey]).map(d=>({x:x(d.week_start),y:y(d[cKey]),v:d[cKey]}));
  const tPts=trainerData.filter(d=>d[tKey]).map(d=>({x:x(d.measured_at),y:y(d[tKey]),v:d[tKey]}));

  const cPath=cPts.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  const tPath=tPts.map((p,i)=>(i===0?"M":"L")+p.x.toFixed(1)+","+p.y.toFixed(1)).join(" ");
  const tFill=tPath+(tPts.length>1?` L${tPts[tPts.length-1].x},${PAD.t+cH} L${tPts[0].x},${PAD.t+cH} Z`:"");

  const ticks=[minV,(minV+maxV)/2,maxV].map(v=>+v.toFixed(1));

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <p style={{ fontSize:10, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.08em", margin:0 }}>{label}</p>
        <div style={{ display:"flex", gap:10 }}>
          {cPts.length>0&&<span style={{ fontSize:9, color:cColor, display:"flex", alignItems:"center", gap:3 }}>
            <svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke={cColor} strokeWidth="1.5" strokeDasharray="3,2"/></svg>Kliento
          </span>}
          {tPts.length>0&&<span style={{ fontSize:9, color:tColor, display:"flex", alignItems:"center", gap:3 }}>
            <svg width="14" height="4"><line x1="0" y1="2" x2="14" y2="2" stroke={tColor} strokeWidth="2"/></svg>Matuota
          </span>}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow:"visible" }}>
        <defs>
          <linearGradient id={"tmc"+tKey} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tColor} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={tColor} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {ticks.map(t=>{
          const yy=y(t);
          return (
            <g key={t}>
              <line x1={PAD.l} y1={yy} x2={PAD.l+cW} y2={yy} stroke={PK.blush} strokeWidth="0.5"/>
              <text x={PAD.l-4} y={yy+3} textAnchor="end" fontSize="8" fill={PK.rose}>{t}{unit}</text>
            </g>
          );
        })}
        {tPts.map((p,i)=>(
          <text key={i} x={p.x} y={H-4} textAnchor="middle" fontSize="7" fill={PK.rose}>{fmt(trainerData.filter(d=>d[tKey])[i]?.measured_at)}</text>
        ))}
        {cPath&&<path d={cPath} fill="none" stroke={cColor} strokeWidth="1.5" strokeDasharray="4,3" strokeLinecap="round"/>}
        {cPts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="2" fill={cColor} fillOpacity="0.5"/>)}
        {tPts.length>1&&<path d={tFill} fill={`url(#tmc${tKey})`}/>}
        {tPath&&<path d={tPath} fill="none" stroke={tColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>}
        {tPts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="5" fill={tColor} stroke="#fff" strokeWidth="1.5"/>
            {i===tPts.length-1&&<text x={p.x} y={p.y-9} textAnchor="middle" fontSize="9" fontWeight="700" fill={tColor}>{p.v}{unit}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function TrainerMeasurements({ clientId, clientName }) {
  const [measures,  setMeasures]  = useState([]);
  const [checkins,  setCheckins]  = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [tab,       setTab]       = useState("overview"); // overview | form | charts | history

  const [form, setForm] = useState({
    weight_measured:"", body_fat:"", waist_cm:"", hips_cm:"",
    chest_cm:"", arms_cm:"", thighs_cm:"", trainer_note:"",
  });
  const set = k => v => setForm(f=>({...f,[k]:v}));

  const load = useCallback(async () => {
    const [{ data:m }, { data:c }] = await Promise.all([
      adminDb.from("trainer_measurements").select("*").eq("user_id",clientId).order("measured_at",{ascending:true}),
      adminDb.from("client_checkins").select("*").eq("user_id",clientId).order("week_start",{ascending:true}).limit(24),
    ]);
    setMeasures(m||[]);

    // Sodinti vandenį ir mitybą iš žurnalų (visada – ne tik null)
    const ciList = c || [];
    if (ciList.length > 0) {
      const oldestWeek = ciList[0].week_start;

      const [{ data: waterRaw }, { data: foodData }] = await Promise.all([
        adminDb.from("water_log").select("date,ml,goal").eq("user_id",clientId).gte("date",oldestWeek).order("date"),
        adminDb.from("food_log").select("date,kcal,protein").eq("user_id",clientId).gte("date",oldestWeek),
      ]);

      // Normalizuoti water datas (pašalinti laiko komponentą jei yra)
      const waterData = waterRaw?.map(w => ({ ...w, date: String(w.date).substring(0,10) }));

      const wkEnd = (ws) => { const d=new Date(ws+"T12:00:00"); d.setDate(d.getDate()+6); return d.toISOString().split("T")[0]; };

      // Kalorių vidurkis iš visų duomenų – kaip "tikslas"
      let globalAvgKcal = null, globalAvgProt = null;
      if (foodData?.length) {
        const allByDate = {};
        foodData.forEach(e => {
          if (!allByDate[e.date]) allByDate[e.date] = { kcal:0, protein:0 };
          allByDate[e.date].kcal    += e.kcal    || 0;
          allByDate[e.date].protein += e.protein || 0;
        });
        const vals = Object.values(allByDate);
        globalAvgKcal = vals.reduce((a,d)=>a+d.kcal,0)/vals.length;
        globalAvgProt = vals.reduce((a,d)=>a+d.protein,0)/vals.length;
      }

      const enriched = ciList.map(ci => {
        const wEnd = wkEnd(ci.week_start);
        let result = { ...ci };

        // Vanduo – visada perskaičiuoti iš water_log
        if (waterData?.length) {
          const ww = waterData.filter(w => w.date >= ci.week_start && w.date <= wEnd);
          if (ww.length) {
            const daysLogged = ww.length;
            const avgMl      = ww.reduce((a,w)=>a+(+w.ml||0),0) / daysLogged;
            const goal       = ww[0]?.goal || 2000;
            const mlRate     = Math.min(1, avgMl / goal);   // 0–1
            const consRate   = daysLogged / 7;              // 0–1
            const combined   = mlRate * 0.6 + consRate * 0.4;
            result.water_score = Math.max(1, Math.min(5, Math.round(combined * 4) + 1));
          }
        }

        // Mityba – perskaičiuoti iš food_log
        if (foodData?.length) {
          const wf = foodData.filter(f => f.date >= ci.week_start && f.date <= wEnd);
          if (wf.length) {
            const byDate = {};
            wf.forEach(e => {
              if (!byDate[e.date]) byDate[e.date] = { kcal:0, protein:0 };
              byDate[e.date].kcal    += e.kcal    || 0;
              byDate[e.date].protein += e.protein || 0;
            });
            const days  = Object.keys(byDate).length;
            const avgK  = Object.values(byDate).reduce((a,d)=>a+d.kcal,0)/days;
            const avgP  = Object.values(byDate).reduce((a,d)=>a+d.protein,0)/days;
            // Lyginame su kliento vidurkiu (konsistencija + nuokrypis nuo savo normos)
            const refK   = globalAvgKcal || avgK;
            const refP   = globalAvgProt || avgP;
            const kcalAcc  = Math.max(0, 1-Math.abs(avgK-refK)/(refK||1));
            const protAcc  = Math.max(0, 1-Math.abs(avgP-refP)/(refP||1));
            const consRate = days/7;
            const combined = kcalAcc*0.35 + protAcc*0.25 + consRate*0.4;
            result.diet_adherence = Math.max(1, Math.min(5, Math.round(combined*4)+1));
          }
        }

        return result;
      });
      setCheckins(enriched);
    } else {
      setCheckins([]);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const last      = measures[measures.length-1];
  const prev      = measures[measures.length-2];
  const nextDate  = last ? addDays(last.measured_at, 56) : null; // +8 savaičių
  const weeksLeft = nextDate ? weeksUntil(nextDate) : null;
  const isOverdue = weeksLeft !== null && weeksLeft <= 0;
  const isDue     = weeksLeft !== null && weeksLeft <= 1;

  function openForm(measurement=null) {
    if (measurement) {
      setForm({
        weight_measured: measurement.weight_measured ?? "",
        body_fat:        measurement.body_fat        ?? "",
        waist_cm:        measurement.waist_cm        ?? "",
        hips_cm:         measurement.hips_cm         ?? "",
        chest_cm:        measurement.chest_cm        ?? "",
        arms_cm:         measurement.arms_cm         ?? "",
        thighs_cm:       measurement.thighs_cm       ?? "",
        trainer_note:    measurement.trainer_note    ?? "",
      });
      setEditId(measurement.id);
    } else {
      setForm({ weight_measured:"", body_fat:"", waist_cm:"", hips_cm:"", chest_cm:"", arms_cm:"", thighs_cm:"", trainer_note:"" });
      setEditId(null);
    }
    setTab("form");
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      user_id:          clientId,
      measured_at:      new Date().toISOString().split("T")[0],
      cycle_number:     (last?.cycle_number||0)+1,
      weight_measured:  parseFloat(form.weight_measured)||null,
      body_fat:         parseFloat(form.body_fat)||null,
      waist_cm:         parseFloat(form.waist_cm)||null,
      hips_cm:          parseFloat(form.hips_cm)||null,
      chest_cm:         parseFloat(form.chest_cm)||null,
      arms_cm:          parseFloat(form.arms_cm)||null,
      thighs_cm:        parseFloat(form.thighs_cm)||null,
      trainer_note:     form.trainer_note||null,
    };
    if (editId) {
      await adminDb.from("trainer_measurements").update(payload).eq("id",editId);
    } else {
      await adminDb.from("trainer_measurements").insert(payload);
    }
    await load();
    setTab("overview");
    setEditId(null);
    setSaving(false);
  }

  // Skirtumas tarp paskutinių dviejų matavimų
  function diff(key) {
    if (!last||!prev||!last[key]||!prev[key]) return null;
    return +(last[key]-prev[key]).toFixed(1);
  }

  function DiffBadge({ d, invertGood=false }) {
    if (d===null) return null;
    const good   = invertGood ? d<0 : d<0;
    const color  = d===0?"rgba(0,0,0,0.3)":good?"#276749":"#9B2335";
    const bg     = d===0?"#f5f5f5":good?"#F0FFF4":"#FFF5F5";
    return (
      <span style={{ fontSize:10, fontWeight:700, color, background:bg, borderRadius:6, padding:"2px 6px", marginLeft:6 }}>
        {d>0?"+":""}{d}
      </span>
    );
  }

  const MEASURES_FIELDS = [
    { k:"weight_measured", l:"Svoris",       u:"kg",  invertGood:true  },
    { k:"body_fat",        l:"Kūno riebalai",u:"%",   invertGood:true  },
    { k:"waist_cm",        l:"Liemuo",       u:"cm",  invertGood:true  },
    { k:"hips_cm",         l:"Klubai",       u:"cm",  invertGood:false },
    { k:"chest_cm",        l:"Krūtinė",      u:"cm",  invertGood:false },
    { k:"arms_cm",         l:"Rankos",       u:"cm",  invertGood:false },
    { k:"thighs_cm",       l:"Šlaunys",      u:"cm",  invertGood:false },
  ];

  // Kliento savaitiniai duomenys (suvestinė)
  const recentCheckins = checkins.slice(-4).reverse();

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto" }}>
        {[
          { id:"overview",  l:"Apžvalga" },
          { id:"checkins",  l:"📋 Check-inai" },
          { id:"form",      l: measures.length===0?"+ Pirmas mat.":isDue||isOverdue?"⚡ Matuoti":"+ Matuoti" },
          { id:"charts",    l:"📈 Grafikai" },
          { id:"history",   l:"Istorija" },
        ].map(t => (
          <button key={t.id} onClick={()=>t.id==="form"?openForm():setTab(t.id)} style={{
            padding:"8px 12px", borderRadius:10, fontSize:12, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", flexShrink:0,
            border:"2px solid "+(tab===t.id?PK.mid:PK.blush),
            background: tab===t.id?PK.light:
              (t.id==="form"&&(isDue||isOverdue))?"#FFF3CD":"#fff",
            color: tab===t.id?PK.dark:
              (t.id==="form"&&isOverdue)?"#9B2335":
              (t.id==="form"&&isDue)?"#856404":PK.rose,
          }}>{t.l}</button>
        ))}
      </div>

      {/* ── APŽVALGA ── */}
      {tab==="overview" && (
        <>
          {/* Kitas matavimas */}
          <div style={{
            background: isOverdue?"#FFF5F5":isDue?"#FFFBEB":"#fff",
            borderRadius:14, padding:"12px 14px", marginBottom:12,
            border:"1px solid "+(isOverdue?"#FEB2B2":isDue?"#FAD389":PK.blush),
          }}>
            <p style={{ fontSize:12, fontWeight:700, color:isOverdue?"#9B2335":isDue?"#744210":PK.dark, margin:"0 0 3px" }}>
              {!last ? "📏 Dar nėra matavimų" :
               isOverdue ? "⚠️ Matavimas vėluoja!" :
               isDue ? "⏰ Matavimo laikas atėjo!" :
               `🗓️ Kitas matavimas po ${weeksLeft} sav.`}
            </p>
            <p style={{ fontSize:11, color:PK.rose, margin:0 }}>
              {!last ? 'Įvesk pirmus matavimus mygtuku "+ Matuoti"' :
               `Paskutinis: ${fmtFull(last.measured_at)} · ${weeksAgo(last.measured_at)} sav. atgal`}
            </p>
          </div>

          {/* Paskutinis matavimas */}
          {last && (
            <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", marginBottom:12, border:"1px solid "+PK.blush }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <p style={{ fontSize:12, fontWeight:700, color:PK.dark, margin:0 }}>
                  📏 Matavimas #{last.cycle_number} · {fmt(last.measured_at)}
                </p>
                <button onClick={()=>openForm(last)} style={{ fontSize:11, color:PK.mid, background:"none", border:"none", cursor:"pointer" }}>✏️</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {MEASURES_FIELDS.filter(f=>last[f.k]!=null).map(f=>(
                  <div key={f.k} style={{ background:PK.pale, borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
                    <div style={{ display:"flex", justifyContent:"center", alignItems:"baseline", gap:2 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:PK.dark }}>{last[f.k]}</span>
                      <span style={{ fontSize:10, color:PK.rose }}>{f.u}</span>
                      <DiffBadge d={diff(f.k)} invertGood={f.invertGood}/>
                    </div>
                    <div style={{ fontSize:9, color:PK.rose, marginTop:2 }}>{f.l}</div>
                  </div>
                ))}
              </div>
              {last.trainer_note && (
                <p style={{ fontSize:12, color:PK.dark, marginTop:10, padding:"8px 10px", background:PK.pale, borderRadius:8, margin:"10px 0 0" }}>
                  💬 {last.trainer_note}
                </p>
              )}
            </div>
          )}

          {/* Kliento paskutiniai check-in'ai */}
          <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", border:"1px solid "+PK.blush }}>
            <p style={{ fontSize:11, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>
              Kliento savaitiniai check-in'ai
            </p>
            {recentCheckins.length===0 ? (
              <p style={{ color:PK.rose, fontSize:12 }}>Dar nėra savaitinių check-in'ų</p>
            ) : recentCheckins.map(ci=>(
              <div key={ci.id} style={{ padding:"8px 0", borderBottom:"1px solid "+PK.light, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:12, color:PK.dark, fontWeight:600 }}>{fmt(ci.week_start)}</span>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  {[
                    { e:"😴", v:ci.sleep_quality },
                    { e:"⚡", v:ci.energy },
                    { e:"🥗", v:ci.diet_adherence },
                  ].filter(x=>x.v).map(x=>(
                    <span key={x.e} style={{ fontSize:11, color:PK.mid }}>{x.e}{x.v}/5</span>
                  ))}
                  {ci.weight_self&&<span style={{ fontSize:11, fontWeight:700, color:PK.dark }}>⚖️{ci.weight_self}kg</span>}
                  {!ci.is_done&&<span style={{ fontSize:9, background:"#FFF3CD", color:"#856404", borderRadius:5, padding:"1px 5px" }}>neatsakyta</span>}
                </div>
              </div>
            ))}
            {recentCheckins.length>0&&checkins.length>4&&(
              <p style={{ fontSize:11, color:PK.rose, margin:"8px 0 0", textAlign:"center" }}>
                Iš viso savaitinių: {checkins.length}
              </p>
            )}
          </div>
        </>
      )}

      {/* ── KLIENTO CHECK-IN'AI ── */}
      {tab==="checkins" && (
        <div>
          {checkins.length===0 ? (
            <div style={{ background:PK.pale, borderRadius:14, padding:"24px 16px", textAlign:"center", border:"2px dashed "+PK.blush }}>
              <p style={{ fontSize:32, marginBottom:8 }}>📋</p>
              <p style={{ color:PK.rose, fontSize:13 }}>Klientė dar neatliko nė vieno check-in'o</p>
            </div>
          ) : [...checkins].reverse().map((ci) => {
            const weekEnd = (ws) => { const d=new Date(ws+"T12:00:00"); d.setDate(d.getDate()+6); return d.toISOString().split("T")[0]; };
            const fmtD = (s) => new Date(s+"T12:00:00").toLocaleDateString("lt-LT",{month:"short",day:"numeric"});
            const isThisWeek = ci.week_start === (()=>{ const d=new Date(),day=d.getDay(); d.setDate(d.getDate()-day+(day===0?-6:1)); return d.toISOString().split("T")[0]; })();

            const METRICS = [
              { e:"😴", l:"Miegas",   k:"sleep_quality",  inv:false },
              { e:"⚡", l:"Energija", k:"energy",          inv:false },
              { e:"🥗", l:"Mityba",   k:"diet_adherence",  inv:false },
              { e:"💧", l:"Vanduo",   k:"water_score",     inv:false },
              { e:"🧘", l:"Stresas",  k:"stress_level",    inv:true  },
              { e:"🏋️", l:"Sport.",   k:"workouts_done",   inv:false, suffix:"k" },
              { e:"⚖️", l:"Svoris",   k:"weight_self",     inv:false, suffix:"kg" },
            ];

            // Spalva pagal vertę (1-5 skalė)
            function scoreColor(v) {
              if (v==null) return PK.blush;
              if (v>=4) return "#27ae60";
              if (v>=3) return "#f39c12";
              return "#e74c3c";
            }

            return (
              <div key={ci.id} style={{
                background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:12,
                border:"2px solid "+(isThisWeek?PK.mid:PK.blush),
                boxShadow: isThisWeek?"0 2px 16px rgba(173,20,87,0.15)":"none",
              }}>
                {/* Savaitės header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, color:PK.dark, margin:"0 0 2px" }}>
                      {isThisWeek ? "🟢 Ši savaitė" : fmtD(ci.week_start)+" – "+fmtD(weekEnd(ci.week_start))}
                    </p>
                    {!isThisWeek && <p style={{ fontSize:10, color:PK.rose, margin:0 }}>{ci.week_start}</p>}
                  </div>
                  {ci.is_done
                    ? <span style={{ fontSize:11, background:"#F0FFF4", color:"#276749", borderRadius:8, padding:"3px 10px", fontWeight:700 }}>✅ Užpildyta</span>
                    : <span style={{ fontSize:11, background:"#FFF3CD", color:"#856404", borderRadius:8, padding:"3px 10px", fontWeight:700 }}>⏳ Laukia</span>}
                </div>

                {ci.is_done ? (
                  <>
                    {/* Metrikos tinklelis */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:10 }}>
                      {METRICS.map(m => {
                        const v = ci[m.k];
                        if (v==null) return null;
                        const isScore = !m.suffix || m.suffix==="";
                        const displayV = m.suffix ? v+m.suffix : v+"/5";
                        const bg = m.k==="workouts_done"||m.k==="weight_self" ? PK.pale : scoreColor(v)+"22";
                        const col = m.k==="workouts_done"||m.k==="weight_self" ? PK.dark : scoreColor(v);
                        return (
                          <div key={m.k} style={{ background:bg, borderRadius:10, padding:"9px 6px", textAlign:"center", border:"1px solid "+(col+"44") }}>
                            <div style={{ fontSize:18 }}>{m.e}</div>
                            <div style={{ fontSize:14, fontWeight:700, color:col }}>{displayV}</div>
                            <div style={{ fontSize:9, color:PK.rose, marginTop:1 }}>{m.l}</div>
                            {/* Progreso juosta (tik 1-5 metrikos) */}
                            {!m.suffix && (
                              <div style={{ width:"100%", height:3, borderRadius:99, background:"rgba(0,0,0,0.08)", marginTop:5 }}>
                                <div style={{ width:(v/5*100)+"%", height:"100%", borderRadius:99, background:scoreColor(v) }}/>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bendra savaitės įvertinimas */}
                    {(() => {
                      const scores = [ci.sleep_quality, ci.energy, ci.diet_adherence].filter(Boolean);
                      const stressInv = ci.stress_level ? 6-ci.stress_level : null;
                      if (stressInv) scores.push(stressInv);
                      if (!scores.length) return null;
                      const avg = scores.reduce((a,b)=>a+b,0)/scores.length;
                      const avgR = +avg.toFixed(1);
                      const color = avgR>=4?"#27ae60":avgR>=3?"#f39c12":"#e74c3c";
                      const label = avgR>=4?"Puiki savaitė 🌟":avgR>=3?"Vidutinė savaitė":"Sunki savaitė 💙";
                      return (
                        <div style={{ background:color+"15", borderRadius:10, padding:"7px 12px", marginBottom:8, border:"1px solid "+color+"44", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:12, fontWeight:700, color }}>{label}</span>
                          <span style={{ fontSize:16, fontWeight:700, color }}>{avgR}/5</span>
                        </div>
                      );
                    })()}

                    {/* Pastaba */}
                    {ci.client_note && (
                      <div style={{ background:PK.pale, borderRadius:10, padding:"8px 12px", border:"1px solid "+PK.blush }}>
                        <p style={{ fontSize:10, fontWeight:700, color:PK.mid, margin:"0 0 3px", textTransform:"uppercase" }}>Klientės pastaba</p>
                        <p style={{ fontSize:12, color:PK.dark, margin:0, lineHeight:1.5, fontStyle:"italic" }}>{ci.client_note}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize:12, color:PK.blush, fontStyle:"italic" }}>Klientė dar neatliko šios savaitės check-in'o</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── MATAVIMO FORMA ── */}}
      {tab==="form" && (
        <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", border:"1px solid "+PK.blush }}>
          <p style={{ fontSize:13, fontWeight:700, color:PK.dark, marginBottom:4 }}>
            {editId ? "✏️ Redaguoti matavimus" : `📏 Matavimas #${(last?.cycle_number||0)+1}`}
          </p>
          <p style={{ fontSize:11, color:PK.rose, marginBottom:14 }}>
            {editId ? `Matavimo data: ${fmtFull(last?.measured_at)}` : `Data: ${fmtFull(new Date().toISOString().split("T")[0])}`}
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[
              { l:"Svoris (kg)",       k:"weight_measured", ph:"68.5" },
              { l:"Kūno riebalai (%)", k:"body_fat",        ph:"22.0" },
              { l:"Liemuo (cm)",       k:"waist_cm",         ph:"72"   },
              { l:"Klubai (cm)",       k:"hips_cm",          ph:"96"   },
              { l:"Krūtinė (cm)",      k:"chest_cm",         ph:"88"   },
              { l:"Rankos (cm)",       k:"arms_cm",          ph:"30"   },
              { l:"Šlaunys (cm)",      k:"thighs_cm",        ph:"55"   },
            ].map(f=>(
              <div key={f.k} style={{ gridColumn: f.k==="thighs_cm"?"1 / -1":undefined }}>
                <label style={{ fontSize:10, fontWeight:700, color:PK.mid, textTransform:"uppercase", display:"block", marginBottom:4 }}>{f.l}</label>
                <input type="number" step="0.1" value={form[f.k]} placeholder={f.ph} onChange={e=>set(f.k)(e.target.value)}
                  style={{ width:"100%", padding:"9px 12px", border:"2px solid "+PK.blush, borderRadius:10, fontSize:14, color:PK.dark, background:PK.pale, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
                {/* Rodyti skirtumą nuo paskutinio matavimo */}
                {last&&last[f.k]&&form[f.k]&&!isNaN(parseFloat(form[f.k]))&&(
                  <p style={{ fontSize:10, color:PK.rose, margin:"3px 0 0" }}>
                    Ankstesnis: {last[f.k]}{f.l.includes("kg")?"kg":f.l.includes("%")?"%":"cm"}
                    {" → "}{+(parseFloat(form[f.k])-last[f.k]).toFixed(1)>0?"+":""}{+(parseFloat(form[f.k])-last[f.k]).toFixed(1)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop:12, marginBottom:14 }}>
            <label style={{ fontSize:10, fontWeight:700, color:PK.mid, textTransform:"uppercase", display:"block", marginBottom:4 }}>Komentaras klientei</label>
            <textarea value={form.trainer_note} onChange={e=>set("trainer_note")(e.target.value)} rows={3}
              placeholder="Progresas, rekomendacijos kitai savaitei, pokyčiai plane..."
              style={{ width:"100%", padding:"9px 12px", border:"2px solid "+PK.blush, borderRadius:10, fontSize:13, color:PK.dark, background:PK.pale, outline:"none", fontFamily:"inherit", resize:"vertical", boxSizing:"border-box" }}/>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{setTab("overview");setEditId(null);}} style={{ flex:1, padding:"11px 0", borderRadius:12, border:"2px solid "+PK.blush, background:"#fff", color:PK.mid, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Atšaukti
            </button>
            <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:"11px 0", borderRadius:12, background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:saving?0.7:1 }}>
              {saving?"Saugoma...":"💾 Išsaugoti"}
            </button>
          </div>
        </div>
      )}

      {/* ── GRAFIKAI ── */}
      {tab==="charts" && (
        <div>
          {measures.length===0&&checkins.length===0 ? (
            <div style={{ background:PK.pale, borderRadius:14, padding:"24px 16px", textAlign:"center", border:"2px dashed "+PK.blush }}>
              <p style={{ color:PK.rose, fontSize:13 }}>Dar nėra duomenų grafikams 📊</p>
            </div>
          ) : (
            <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", border:"1px solid "+PK.blush }}>
              <DualChart clientData={checkins} trainerData={measures}
                cKey="weight_self" tKey="weight_measured"
                label="Svoris (kg)" cColor={PK.blush} tColor={PK.mid} unit="kg"/>
              {measures.some(m=>m.body_fat)&&(
                <DualChart clientData={[]} trainerData={measures}
                  cKey="body_fat" tKey="body_fat"
                  label="Kūno riebalai (%)" cColor={PK.rose} tColor="#E91E8C" unit="%"/>
              )}
              {measures.some(m=>m.waist_cm)&&(
                <DualChart clientData={[]} trainerData={measures}
                  cKey="waist_cm" tKey="waist_cm"
                  label="Liemuo (cm)" cColor={PK.blush} tColor="#5BB8D4" unit="cm"/>
              )}
              {measures.some(m=>m.hips_cm)&&(
                <DualChart clientData={[]} trainerData={measures}
                  cKey="hips_cm" tKey="hips_cm"
                  label="Klubai (cm)" cColor={PK.blush} tColor="#FF80AB" unit="cm"/>
              )}
              {/* Kliento savijauta */}
              {checkins.length>=2&&(
                <>
                  <div style={{ borderTop:"1px solid "+PK.light, paddingTop:14, marginTop:6 }}>
                    <p style={{ fontSize:10, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Kliento savijauta (savaitiniai)</p>
                    {[
                      { k:"sleep_quality",  l:"😴 Miegas",   c:"#89CFF0" },
                      { k:"energy",         l:"⚡ Energija", c:"#FFD700" },
                      { k:"diet_adherence", l:"🥗 Mityba",   c:"#90EE90" },
                    ].map(line => (
                      <DualChart key={line.k} clientData={checkins} trainerData={[]}
                        cKey={line.k} tKey={line.k}
                        label={line.l} cColor={line.c} tColor={line.c} unit="/5"/>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ISTORIJA ── */}
      {tab==="history" && (
        <div>
          {measures.length===0 ? (
            <p style={{ color:PK.rose, fontSize:13, textAlign:"center", padding:"20px 0" }}>Dar nėra matavimų istorijos</p>
          ) : [...measures].reverse().map((m,i)=>(
            <div key={m.id} style={{ background:"#fff", borderRadius:14, padding:"12px 14px", marginBottom:8, border:"1px solid "+PK.blush }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:PK.dark }}>Matavimas #{m.cycle_number}</span>
                  <span style={{ fontSize:11, color:PK.rose, marginLeft:8 }}>{fmtFull(m.measured_at)}</span>
                </div>
                <button onClick={()=>openForm(m)} style={{ fontSize:11, color:PK.mid, background:"none", border:"none", cursor:"pointer" }}>✏️</button>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                {MEASURES_FIELDS.filter(f=>m[f.k]!=null).map(f=>(
                  <span key={f.k} style={{ fontSize:12, color:PK.dark, background:PK.pale, borderRadius:8, padding:"3px 8px" }}>
                    {f.l}: <strong>{m[f.k]}{f.u}</strong>
                  </span>
                ))}
              </div>
              {m.trainer_note&&<p style={{ fontSize:11, color:PK.rose, margin:"8px 0 0", fontStyle:"italic" }}>💬 {m.trainer_note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
