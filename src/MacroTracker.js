import { useState, useEffect } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { calcMacros } from "./constants";
import { Muscle, Droplet, Salad, Flame, Edit, Save, Lightbulb } from "./ui/icons";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n) { return new Date(Date.now() - n*24*60*60*1000).toISOString().split("T")[0]; }

// Treniruočių dažnio bazinis daugiklis (sesijos/savaitę suapvalinamos iki
// artimiausio sveiko skaičiaus, 5+ traktuojama kaip aukščiausia pakopa).
const TRAINING_MULT = [1.2, 1.35, 1.45, 1.55, 1.65, 1.75]; // 0,1,2,3,4,5+ sesijų/sav.
const MULT_CAP = 1.8;

function trainingMultiplier(sessionsPerWeek) {
  const idx = Math.min(5, Math.max(0, Math.round(sessionsPerWeek)));
  return TRAINING_MULT[idx];
}

// Žingsniai koreguoja treniruočių daugiklį nedideliu ± priedu (ne pakeičia jo
// visiškai ir nesudauginami atskirai) — vidutinis žingsnių skaičius per 14 d.
function stepsAdjustment(avgSteps) {
  if (avgSteps == null)  return 0;
  if (avgSteps < 4000)   return -0.05;
  if (avgSteps < 7000)   return 0;
  if (avgSteps < 10000)  return 0.03;
  if (avgSteps < 12000)  return 0.05;
  if (avgSteps < 15000)  return 0.08;
  return 0.10;
}

// Aktyvumo koeficientas. Treniruočių dažnio komponentas ateina iš vieno iš
// dviejų šaltinių: jei treneris klientės kortelėje rankiniu būdu nustatė
// treniruočių dažnį (manualFreq, profile.manual_training_freq) — naudojamas
// jis; kitaip skaičiuojamas automatiškai iš realiai appe pažymėtų gyvų
// treniruočių (live_sessions) per pastarąsias 4 sav. Žingsnių pakoregavimas
// (iš daily_checkins) pridedamas ant viršaus abiem atvejais. Jei realių
// duomenų (nei rankinio dažnio, nei treniruočių/žingsnių istorijos) dar
// nėra, grąžinamas anketos atsakymas (fallbackAct, naudojamas per ACTIVITY
// lentelę constants.js).
async function computeActivityLevel(userId, fallbackAct, manualFreq) {
  const since14 = daysAgoStr(14);
  const checkins = await pb.collection("daily_checkins").getFullList({
    filter: `user_id="${userId}" && date>="${since14}" && steps>0`, requestKey: null,
  }).catch(() => []);
  const stepDays = checkins.length;
  const avgSteps = stepDays > 0 ? checkins.reduce((s, c) => s + (c.steps || 0), 0) / stepDays : null;

  if (manualFreq) {
    const mult = Math.min(MULT_CAP, trainingMultiplier(manualFreq) + stepsAdjustment(avgSteps));
    return { computed: true, mult, sessionsPerWeek: manualFreq, avgSteps, manual: true };
  }

  const since28 = daysAgoStr(28);
  const liveSessions = await pb.collection("live_sessions").getFullList({
    filter: `user_id="${userId}" && completed=true && date>="${since28}"`, requestKey: null,
  }).catch(() => []);
  const trainingDates = new Set(liveSessions.map(s => (s.date || "").slice(0, 10)));
  const sessionsPerWeek = trainingDates.size / 4;

  const hasData = trainingDates.size > 0 || stepDays >= 5;
  if (!hasData) return { computed: false, level: fallbackAct };

  const mult = Math.min(MULT_CAP, trainingMultiplier(sessionsPerWeek) + stepsAdjustment(avgSteps));
  return { computed: true, mult, sessionsPerWeek, avgSteps };
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
export default function MacroTracker({ userId, date, profile, initialMacros, onSaved }) {
  const isToday = date === todayStr();
  const [weightKg, setWeightKg] = useState(null);
  const [actInfo, setActInfo] = useState(null); // { level, computed }
  const [protein, setProtein] = useState(initialMacros?.protein_g ? String(initialMacros.protein_g) : "");
  const [fat,     setFat]     = useState(initialMacros?.fat_g ? String(initialMacros.fat_g) : "");
  const [carbs,   setCarbs]   = useState(initialMacros?.carbs_g ? String(initialMacros.carbs_g) : "");
  const [saved,   setSaved]   = useState(!!(initialMacros?.protein_g || initialMacros?.fat_g || initialMacros?.carbs_g));
  const [saving,  setSaving]  = useState(false);
  const [loaded,  setLoaded]  = useState(!!initialMacros);

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
    if (!profile?.act && !profile?.manual_training_freq) return;
    computeActivityLevel(userId, profile.act, profile.manual_training_freq).then(setActInfo);
  }, [userId, profile?.act, profile?.manual_training_freq]);

  useEffect(() => {
    pbFirst("daily_checkins", `user_id="${userId}" && date="${date}"`).then(r => {
      setProtein(r?.protein_g ? String(r.protein_g) : "");
      setFat(r?.fat_g ? String(r.fat_g) : "");
      setCarbs(r?.carbs_g ? String(r.carbs_g) : "");
      setSaved(!!(r?.protein_g || r?.fat_g || r?.carbs_g));
      setLoaded(true);
    }).catch(() => setLoaded(true));
    // eslint-disable-next-line
  }, [userId, date]);

  const age = profile?.dob
    ? Math.floor((new Date() - new Date(profile.dob)) / (365.25*24*60*60*1000))
    : null;
  const hasActivityData = actInfo?.computed || profile?.act;
  const canCalc = weightKg && profile?.height && age && profile?.gender && hasActivityData && profile?.goal;
  const targets = canCalc ? calcMacros({
    gender: profile.gender, age, weight: weightKg, height: parseFloat(profile.height),
    actId: profile.act, goalId: profile.goal,
    multOverride: actInfo?.computed ? actInfo.mult : undefined,
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
      onSaved?.();
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
        {actInfo?.computed
          ? `Aktyvumo koeficientas ${actInfo.mult.toFixed(2)} — ${actInfo.manual ? "trenerės nustatytas" : "automatiškai apskaičiuotas"} dažnis (~${Math.round(actInfo.sessionsPerWeek*10)/10}/sav.) + žingsniai`
          : "Aktyvumas pagal anketą (dar nepakanka istorijos perskaičiuoti)"}
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