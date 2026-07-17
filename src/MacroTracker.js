import { useState, useEffect } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { calcMacros } from "./constants";
import { Muscle, Droplet, Salad, Flame, Edit, Save, Lightbulb } from "./ui/icons";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n) { return new Date(Date.now() - n*24*60*60*1000).toISOString().split("T")[0]; }

// Aktyvumo lygis (1–5) apskaičiuojamas iš realių duomenų vietoj vienkartinio
// anketos atsakymo: treniruočių dažnis per pastarąsias 4 sav. (live_sessions
// + patvirtintos praėjusios bookings) nustato bazinį lygį, o vidutiniai
// žingsniai per pastarąsias 2 sav. jį koreguoja ±1. Jei realių duomenų dar
// nėra (naujas klientas), grąžinamas anketos atsakymas (fallbackAct).
async function computeActivityLevel(userId, fallbackAct) {
  const since28 = daysAgoStr(28);
  const since14 = daysAgoStr(14);
  const today = todayStr();

  const [liveSessions, approvedBookings, checkins] = await Promise.all([
    pb.collection("live_sessions").getFullList({
      filter: `user_id="${userId}" && completed=true && date>="${since28}"`, requestKey: null,
    }).catch(() => []),
    pb.collection("bookings").getFullList({
      filter: `client_id="${userId}" && status="approved" && date>="${since28}" && date<="${today}"`, requestKey: null,
    }).catch(() => []),
    pb.collection("daily_checkins").getFullList({
      filter: `user_id="${userId}" && date>="${since14}" && steps>0`, requestKey: null,
    }).catch(() => []),
  ]);

  const trainingDates = new Set([
    ...liveSessions.map(s => (s.date || "").slice(0, 10)),
    ...approvedBookings.map(b => b.date),
  ]);
  const sessionsPerWeek = trainingDates.size / 4;

  const stepDays = checkins.length;
  const avgSteps = stepDays > 0 ? checkins.reduce((s, c) => s + (c.steps || 0), 0) / stepDays : null;

  const hasData = trainingDates.size > 0 || stepDays >= 5;
  if (!hasData) return { level: fallbackAct, computed: false };

  let level = sessionsPerWeek >= 5 ? 5 : sessionsPerWeek >= 3 ? 4 : sessionsPerWeek >= 1.5 ? 3 : sessionsPerWeek >= 0.5 ? 2 : 1;
  if (avgSteps != null) {
    if (avgSteps >= 12000) level = Math.min(5, level + 1);
    else if (avgSteps < 3000) level = Math.max(1, level - 1);
  }
  return { level, computed: true };
}

function MacroRow({ Icon, label, unit, color, target, input, onChange, disabled }) {
  const value = parseInt(input) || 0;
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:6 }}><Icon size={13} color={color} />{label}</span>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{target ? `tikslas ${target}${unit}` : "–"}</span>
      </div>
      <div style={{ position:"relative", borderRadius:99, height:6, marginBottom:8, background:"rgba(255,255,255,0.1)" }}>
        <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${pct}%`, borderRadius:99, background:color, transition:"width 0.5s cubic-bezier(.23,1,.32,1)" }} />
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <input type="number" value={input} placeholder="0" disabled={disabled}
          onChange={e=>onChange(e.target.value)}
          style={{ width:72, padding:"6px 8px", borderRadius:8, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", textAlign:"center" }}
        />
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{unit} surinkta</span>
      </div>
    </div>
  );
}

// Reikalingi PocketBase "daily_checkins" kolekcijos laukai (Number tipo),
// jei jų dar nėra: protein_g, fat_g, carbs_g.
export default function MacroTracker({ userId, date, profile }) {
  const isToday = date === todayStr();
  const [weightKg, setWeightKg] = useState(null);
  const [actInfo, setActInfo] = useState(null); // { level, computed }
  const [protein, setProtein] = useState("");
  const [fat,     setFat]     = useState("");
  const [carbs,   setCarbs]   = useState("");
  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  // Naujausias trenerės įrašytas svoris (trainer_measurements), kad tikslai
  // atsinaujintų realiai, o ne liktų prie registracijos metu įvesto svorio.
  useEffect(() => {
    pb.collection("trainer_measurements").getList(1, 10, {
      filter: `user_id="${userId}"`, sort: "-measured_at", requestKey: null,
    }).then(res => {
      const withWeight = (res.items || []).find(m => m.weight_measured);
      setWeightKg(parseFloat(withWeight?.weight_measured) || parseFloat(profile?.weight) || null);
    }).catch(() => setWeightKg(parseFloat(profile?.weight) || null));
  }, [userId, profile?.weight]);

  useEffect(() => {
    if (!profile?.act) return;
    computeActivityLevel(userId, profile.act).then(setActInfo);
  }, [userId, profile?.act]);

  useEffect(() => {
    setSaved(false); setLoaded(false);
    pbFirst("daily_checkins", `user_id="${userId}" && date="${date}"`).then(r => {
      setProtein(r?.protein_g ? String(r.protein_g) : "");
      setFat(r?.fat_g ? String(r.fat_g) : "");
      setCarbs(r?.carbs_g ? String(r.carbs_g) : "");
      setSaved(!!(r?.protein_g || r?.fat_g || r?.carbs_g));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [userId, date]);

  const age = profile?.dob
    ? Math.floor((new Date() - new Date(profile.dob)) / (365.25*24*60*60*1000))
    : null;
  const effectiveAct = actInfo?.level || profile?.act;
  const canCalc = weightKg && profile?.height && age && profile?.gender && effectiveAct && profile?.goal;
  const targets = canCalc ? calcMacros({
    gender: profile.gender, age, weight: weightKg, height: parseFloat(profile.height),
    actId: effectiveAct, goalId: profile.goal,
  }) : null;

  async function handleSave() {
    if (!isToday) return;
    setSaving(true);
    try {
      // Šviežiai ieškoma/atnaujinama per pbUpsert — kad nesukurtume dubliuoto
      // daily_checkins įrašo, jei tarpe jau atsirado įrašas per kitą sekiklį.
      await pbUpsert("daily_checkins", `user_id="${userId}" && date="${date}"`, {
        user_id: userId, date,
        protein_g: parseInt(protein) || 0,
        fat_g:     parseInt(fat) || 0,
        carbs_g:   parseInt(carbs) || 0,
      });
      setSaved(true);
    } catch(e) { console.error(e); }
    setSaving(false);
  }

  if (!loaded) return null;

  if (!targets) {
    return (
      <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", margin:0, lineHeight:1.5 }}>
        Kad apskaičiuotume tikslus, trūksta duomenų (svoris, ūgis, gimimo data, lytis ar tikslas) — papildykite profilį anketoje.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", display:"flex", alignItems:"center", gap:5 }}><Flame size={12} color="#FFA500" />Dienos tikslas</span>
        <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{targets.target} kcal</span>
      </div>
      <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:"0 0 14px" }}>
        {actInfo?.computed ? "Aktyvumas apskaičiuotas pagal pastarųjų 4 sav. treniruočių dažnį ir žingsnius" : "Aktyvumas pagal anketą (dar nepakanka istorijos perskaičiuoti)"}
      </p>

      <MacroRow Icon={Muscle} label="Baltymai" unit="g" color="#FF6EB4"
        target={targets.prot.g} input={protein}
        onChange={v=>{ setProtein(v); setSaved(false); }} disabled={!isToday || saved} />
      <MacroRow Icon={Droplet} label="Riebalai" unit="g" color="#FFD700"
        target={targets.fat.g} input={fat}
        onChange={v=>{ setFat(v); setSaved(false); }} disabled={!isToday || saved} />
      <MacroRow Icon={Salad} label="Angliavandeniai" unit="g" color="#7FFFB0"
        target={targets.carb.g} input={carbs}
        onChange={v=>{ setCarbs(v); setSaved(false); }} disabled={!isToday || saved} />

      {isToday && (
        saved ? (
          <button onClick={()=>setSaved(false)} style={{ width:"100%", padding:"9px", borderRadius:10, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", fontSize:12, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
            <Edit size={11} />Keisti
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving} style={{ width:"100%", padding:"10px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {saving ? "Saugoma..." : <><Save size={14} />Išsaugoti</>}
          </button>
        )
      )}

      {targets.tip && (
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:"12px 0 0", lineHeight:1.5, display:"flex", alignItems:"flex-start", gap:5 }}>
          <Lightbulb size={12} style={{ marginTop:2, flexShrink:0 }} />{targets.tip}
        </p>
      )}
    </div>
  );
}