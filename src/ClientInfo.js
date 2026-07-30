import { useState, useEffect } from "react";
import { pb } from "./pb";
import { GOALS, ACTIVITY } from "./constants";
import { resolveMacroTargets, daysAgoStr } from "./macroCalc";
import { STEPS_OPTS, WELLBEING_OPTS } from "./Onboarding";
import { ChevronLeft, User, Calendar, Ruler, Scale, Target, Edit, Moon, Footprints, Salad, Heart, Clipboard, AlertTriangle, Flame, Muscle, Droplet, Check } from "./ui/icons";

const GOAL_ICON = { lose: Flame, maintain: Scale, gain: Muscle };

const TRAINING_FREQ_OPTS = [
  { v: 1, label: "1" },
  { v: 2, label: "2" },
  { v: 3, label: "3" },
  { v: 4, label: "4" },
  { v: 5, label: "5+" },
];

// Treniruočių dažnio pasirinkimas kalorijų/makro skaičiuoklei — treneris
// nustato rankiniu būdu, o ne pasikliaujama automatiniu live_sessions
// skaičiavimu (kuris reikalauja, kad treneris nuosekliai žymėtų kiekvieną
// gyvą treniruotę appe). "Automatinis" grąžina prie senos logikos.
function TrainingFreqPicker({ client }) {
  const [value, setValue] = useState(client.manual_training_freq || null);
  const [saving, setSaving] = useState(false);

  async function pick(v) {
    const next = value === v ? null : v;
    setValue(next);
    setSaving(true);
    await pb.collection("users").update(client.id, { manual_training_freq: next }).catch(() => {});
    setSaving(false);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px", display:"flex", alignItems:"center", gap:5 }}>
        <Footprints size={11} />Treniruočių dažnis / sav. (kalorijų skaičiuoklei)
      </p>
      <div style={{ display:"flex", gap:6 }}>
        {TRAINING_FREQ_OPTS.map(o => {
          const active = value === o.v;
          return (
            <button key={o.v} onClick={() => pick(o.v)} disabled={saving} style={{
              flex:1, padding:"9px 0", borderRadius:10, fontSize:13, fontWeight:700,
              border: `1.5px solid ${active ? "#7FFFB0" : "rgba(255,255,255,0.15)"}`,
              background: active ? "rgba(127,255,176,0.18)" : "rgba(255,255,255,0.05)",
              color: active ? "#7FFFB0" : "rgba(255,255,255,0.6)",
              cursor: saving ? "default" : "pointer", fontFamily:"inherit",
            }}>{o.label}</button>
          );
        })}
      </div>
      <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:"6px 0 0" }}>
        {value ? "Naudojamas šis rankinis dažnis — automatinis treniruočių skaičiavimas išjungtas." : "Nepasirinkta — aktyvumas skaičiuojamas automatiškai pagal appe pažymėtas gyvas treniruotes."}
      </p>
    </div>
  );
}

function AdherenceRow({ Icon, label, unit, color, target, actual }) {
  const pct = target && actual != null ? Math.round((actual / target) * 100) : null;
  const barColor = pct == null ? "rgba(255,255,255,0.25)"
    : (pct >= 85 && pct <= 115) ? "#7FFFB0" : (pct >= 60) ? "#FFD700" : "#FF8888";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.7)", display:"flex", alignItems:"center", gap:5 }}><Icon size={12} color={color} />{label}</span>
        <span style={{ fontSize:12, fontWeight:700 }}>
          <span style={{ color: pct != null ? barColor : "rgba(255,255,255,0.4)" }}>{actual != null ? Math.round(actual) : "–"}{unit}</span>
          <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}> / {target}{unit}</span>
        </span>
      </div>
      <div style={{ borderRadius:99, height:6, background:"rgba(255,255,255,0.1)" }}>
        <div style={{ width:`${Math.min(100, pct || 0)}%`, height:"100%", borderRadius:99, background:barColor, transition:"width 0.4s cubic-bezier(.23,1,.32,1)" }} />
      </div>
    </div>
  );
}

// Kliento dienos kcal/makro tikslai (ta pati logika, kuri naudojama kliento
// pusėje, žr. macroCalc.js) + kiek realiai klientas per pastarąją savaitę
// suvedė daily_checkins.protein_g/fat_g/carbs_g laukuose — kad treneris matytų
// ne tik tikslą, bet ir kaip sekasi jį pasiekti.
function MacroGoalsCard({ client }) {
  const [resolved, setResolved]     = useState(null); // { targets, actInfo } | null
  const [adherence, setAdherence]   = useState(null); // { avgProtein, avgFat, avgCarbs, days } | null
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      resolveMacroTargets(client.id, client),
      pb.collection("daily_checkins").getFullList({
        filter: `user_id="${client.id}" && date>="${daysAgoStr(6)}"`, requestKey: null,
      }).catch(() => []),
    ]).then(([res, checkins]) => {
      if (cancelled) return;
      setResolved(res);
      const withMacros = checkins.filter(c => c.protein_g || c.fat_g || c.carbs_g);
      setAdherence(withMacros.length ? {
        avgProtein: withMacros.reduce((s,c)=>s+(c.protein_g||0),0) / withMacros.length,
        avgFat:     withMacros.reduce((s,c)=>s+(c.fat_g||0),0)     / withMacros.length,
        avgCarbs:   withMacros.reduce((s,c)=>s+(c.carbs_g||0),0)   / withMacros.length,
        days: withMacros.length,
      } : null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [client.id]);

  if (loading) return <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", margin:0 }}>Kraunama...</p>;

  if (!resolved) {
    return (
      <p style={{ fontSize:12, color:"rgba(255,255,255,0.4)", margin:0, lineHeight:1.5 }}>
        Trūksta duomenų tikslams apskaičiuoti (svoris, ūgis, gimimo data, lytis ar tikslas) — papildykite anketoje arba matavimuose.
      </p>
    );
  }

  const { targets, actInfo } = resolved;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", gap:5 }}><Flame size={13} color="#FFA500" />Dienos tikslas</span>
        <span style={{ fontSize:17, fontWeight:800, color:"#fff" }}>{targets.target} kcal</span>
      </div>
      <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:"0 0 12px" }}>
        {actInfo?.computed
          ? `Koeficientas ${actInfo.mult.toFixed(2)} — ${actInfo.manual ? "trenerės nustatytas" : "automatiškai apskaičiuotas"} dažnis (~${Math.round(actInfo.sessionsPerWeek*10)/10}/sav.) + žingsniai`
          : "Aktyvumas pagal anketą"}
      </p>

      <AdherenceRow Icon={Muscle} label="Baltymai" unit="g" color="#FF6EB4" target={targets.prot.g} actual={adherence?.avgProtein} />
      <AdherenceRow Icon={Droplet} label="Riebalai" unit="g" color="#FFD700" target={targets.fat.g} actual={adherence?.avgFat} />
      <AdherenceRow Icon={Salad} label="Angliavandeniai" unit="g" color="#7FFFB0" target={targets.carb.g} actual={adherence?.avgCarbs} />

      <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:"8px 0 0" }}>
        {adherence
          ? `Vidurkis iš pastarųjų ${adherence.days} d., kai klientas suvedė makro duomenis (7 d. langas)`
          : "Klientas per pastarąją savaitę makro duomenų dar neįvedė"}
      </p>
    </div>
  );
}

// Kompaktiška statistikos kortelė (skaičius/trumpas žodis + ikona) — naudojama
// pagrindiniams asmens duomenims vietoj sukrautų label:value eilučių.
function StatTile({ Icon, value, label }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"10px 8px", textAlign:"center" }}>
      <Icon size={15} color="rgba(255,255,255,0.6)" style={{ marginBottom:4 }} />
      <p style={{ fontSize:14, fontWeight:800, color:"#fff", margin:"0 0 1px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
      <p style={{ fontSize:9, color:"rgba(255,255,255,0.45)", margin:0, textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</p>
    </div>
  );
}

// Maža spalvota pilulė vienai kategoriškai reikšmei (tikslas, aktyvumo lygis ir pan.).
function Chip({ Icon, label, color = "#89CFF0" }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700, color, background:`${color}1f`, borderRadius:20, padding:"6px 12px" }}>
      {Icon && <Icon size={12} />}{label}
    </span>
  );
}

// Laisvo teksto atsakymas (motyvacija, mitybos aprašymas ir pan.) kaip citatos
// stiliaus kortelė — lengviau atskirti nuo struktūrizuotų laukų nei plain tekstas.
function QuoteBlock({ label, value, Icon }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom:10 }}>
      <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 5px", display:"flex", alignItems:"center", gap:5 }}>
        {Icon && <Icon size={11} />}{label}
      </p>
      <p style={{ fontSize:13, color:"rgba(255,255,255,0.85)", margin:0, lineHeight:1.55, fontStyle:"italic", background:"rgba(255,255,255,0.05)", borderLeft:"3px solid rgba(255,255,255,0.2)", borderRadius:"0 10px 10px 0", padding:"8px 12px" }}>
        „{value}"
      </p>
    </div>
  );
}

function Section({ title, children, accent }) {
  return (
    <div style={{ marginBottom:16 }}>
      <p style={{ fontSize:11, fontWeight:700, color: accent || "rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px" }}>{title}</p>
      <div style={{ background: accent ? `${accent}14` : "rgba(255,255,255,0.08)", border: accent ? `1px solid ${accent}4d` : "none", borderRadius:16, padding:"14px 16px" }}>{children}</div>
    </div>
  );
}

export default function ClientInfo({ client, onClose }) {
  const genderLabel = client.gender === "f" ? "Moteris" : client.gender === "m" ? "Vyras" : null;
  const age = client.dob ? Math.floor((new Date() - new Date(client.dob)) / (365.25*24*60*60*1000)) : null;
  const dobLabel = client.dob ? new Date(client.dob).toLocaleDateString("lt-LT", { year:"numeric", month:"long", day:"numeric" }) : null;
  const goalLabel = GOALS.find(g => g.id === client.goal)?.label || null;
  const GoalIcon = GOAL_ICON[client.goal] || Target;
  const actOpt = ACTIVITY.find(a => a.id === client.act);
  const stepsOpt = STEPS_OPTS.find(s => s.id === client.steps_per_day);
  const wellbeingOpt = WELLBEING_OPTS[client.wellbeing] || null;

  const hasLifestyle = client.sleep_stress || actOpt || stepsOpt;
  const hasNutrition = client.diet_desc || client.hardest_part || client.expectations || wellbeingOpt;

  const healthItems = [
    { key:"pain",       label:"Skausmai (6 mėn.)",         status:client.health_pain_yn,       detail:client.health_recent_pain },
    { key:"injury",     label:"Šviežios traumos",           status:client.health_injury_yn,     detail:client.health_recent_injury },
    { key:"bp",         label:"Aukštas kraujospūdis",       status:client.health_bp_yn,         detail:client.health_high_bp },
    { key:"migraine",   label:"Migrena",                    status:client.health_migraine },
    { key:"allergies",  label:"Alergijos",                  status:client.health_allergies,     detail:client.health_allergies_detail },
    { key:"varicose",   label:"Varikozė",                   status:client.health_varicose },
    { key:"hernia",     label:"Išvarža",                     status:client.health_hernia },
    { key:"autoimmune", label:"Autoimuninės ligos",         status:client.health_autoimmune,    detail:client.health_autoimmune_detail },
    { key:"ligaments",  label:"Plyšę / patempti raiščiai",  status:client.health_torn_ligaments },
    { key:"pregnant",   label:"Nėštumas",                    status:client.health_pregnant },
  ];
  const answeredHealth = healthItems.filter(h => h.status != null);
  const healthConcerns = answeredHealth.filter(h => h.status === true);

  return (
    <div style={{ position:"fixed", inset:0, zIndex:650, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:20, paddingRight:20, paddingBottom:16, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}><Clipboard size={15} />Kliento anketa</h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{client.name}</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>
        {!client.onboarding_done && (
          <div style={{ background:"rgba(255,193,94,0.1)", border:"1px solid rgba(255,193,94,0.3)", borderRadius:14, padding:"12px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <AlertTriangle size={14} color="#FFC15E" />
            <p style={{ fontSize:12, color:"#FFC15E", margin:0 }}>Klientas dar nebaigė registracijos anketos.</p>
          </div>
        )}
        {client.onboarding_done && client.track_progress === false && (
          <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:14, padding:"12px 14px", marginBottom:16 }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.6)", margin:0 }}>Klientas pasirinko trumpąją registraciją — pildė tik gimimo datą, be tikslo/mitybos/gyvensenos klausimų.</p>
          </div>
        )}

        <Section title="Asmeniniai duomenys">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom: dobLabel ? 8 : 0 }}>
            <StatTile Icon={Calendar} value={age != null ? `${age} m.` : "–"} label="Amžius" />
            <StatTile Icon={User} value={genderLabel || "–"} label="Lytis" />
            <StatTile Icon={Ruler} value={client.height ? `${client.height} cm` : "–"} label="Ūgis" />
            <StatTile Icon={Scale} value={client.weight ? `${client.weight} kg` : "–"} label="Svoris" />
          </div>
          {dobLabel && <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:0 }}>Gimimo data: {dobLabel}</p>}
        </Section>

        {(goalLabel || client.motivation) && (
          <Section title="Tikslas ir motyvacija">
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom: client.motivation ? 12 : 0 }}>
              {goalLabel && <Chip Icon={GoalIcon} label={goalLabel} color="#FF6EB4" />}
              {client.goal_weight && <Chip Icon={Scale} label={`Tikslas: ${client.goal_weight} kg`} color="#89CFF0" />}
            </div>
            <QuoteBlock label="Kodėl tai svarbu" value={client.motivation} Icon={Edit} />
          </Section>
        )}

        {hasLifestyle && (
          <Section title="Gyvensena">
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom: client.sleep_stress ? 12 : 0 }}>
              {actOpt && <Chip Icon={Footprints} label={actOpt.label} color="#7FFFB0" />}
              {stepsOpt && <Chip Icon={Footprints} label={stepsOpt.label} color="#FFD700" />}
            </div>
            <QuoteBlock label="Miegas / stresas" value={client.sleep_stress} Icon={Moon} />
          </Section>
        )}

        <Section title="Kalorijų skaičiuoklė">
          <TrainingFreqPicker client={client} />
          <div style={{ height:1, background:"rgba(255,255,255,0.1)", margin:"4px 0 14px" }} />
          <MacroGoalsCard client={client} />
        </Section>

        {answeredHealth.length > 0 && (
          <Section title={healthConcerns.length ? "Sveikata — atkreipti dėmesį" : "Sveikata"} accent={healthConcerns.length ? "#FF8888" : "#7FFFB0"}>
            {healthConcerns.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom: answeredHealth.length > healthConcerns.length ? 10 : 0 }}>
                {healthConcerns.map(h => (
                  <div key={h.key} style={{ display:"flex", alignItems:"flex-start", gap:8, background:"rgba(255,136,136,0.1)", border:"1px solid rgba(255,136,136,0.3)", borderRadius:12, padding:"9px 12px" }}>
                    <AlertTriangle size={13} color="#FF8888" style={{ flexShrink:0, marginTop:1 }} />
                    <div style={{ minWidth:0, flex:1 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:"#fff", margin:0 }}>{h.label}</p>
                      {h.detail && <p style={{ fontSize:11, color:"rgba(255,255,255,0.6)", margin:"2px 0 0", lineHeight:1.4 }}>{h.detail}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize:12, color:"#7FFFB0", margin:0, display:"flex", alignItems:"center", gap:6 }}><Check size={13} />Visi sveikatos klausimai — be pastabų.</p>
            )}
            {healthConcerns.length > 0 && answeredHealth.length > healthConcerns.length && (
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Likusiais {answeredHealth.length - healthConcerns.length} klausimais pastabų nėra.</p>
            )}
          </Section>
        )}

        {hasNutrition && (
          <Section title="Mityba ir iššūkiai">
            <QuoteBlock label="Mitybos aprašymas" value={client.diet_desc} Icon={Salad} />
            <QuoteBlock label="Sunkiausia dalis" value={client.hardest_part} Icon={Edit} />
            <QuoteBlock label="Lūkesčiai treneriui" value={client.expectations} Icon={Edit} />
            {wellbeingOpt && (
              <div style={{ marginBottom:0 }}>
                <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px", display:"flex", alignItems:"center", gap:5 }}>
                  <Heart size={11} />Savijauta registruojantis
                </p>
                <p style={{ fontSize:14, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}>
                  <wellbeingOpt.Icon size={14} />{wellbeingOpt.label}
                </p>
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}