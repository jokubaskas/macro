import { useState } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { PK } from "./constants";
import { Flame, Scale, Muscle, User, Target, Leaf, Salad, Check, Camera, Walk, ChevronLeft, ChevronRight, Frown, Meh, Smile, Sparkle } from "./ui/icons";

// ── Veiklos lygiai (sutampa su constants.js ACTIVITY) ────────────────────────
const ACTIVITY_OPTS = [
  { id:1, label:"Nesportuoju",             desc:"Sėdimas darbas, mažai judėjimo" },
  { id:2, label:"Sportuoju mažai",         desc:"1–2 kartai per savaitę" },
  { id:3, label:"Sportuoju reguliariai",   desc:"3–4 kartai per savaitę" },
  { id:4, label:"Sportuoju intensyviai",   desc:"5–6 kartai per savaitę" },
  { id:5, label:"Sportuoju kasdien",       desc:"Intensyviai arba fizinis darbas" },
];

export const STEPS_OPTS = [
  { id:"under5k", label:"Iki 5 000",         desc:"Daugiausia sėdžiu" },
  { id:"5k-8k",   label:"5 000 – 8 000",     desc:"Vidutinis aktyvumas" },
  { id:"8k-12k",  label:"8 000 – 12 000",    desc:"Gana aktyvus" },
  { id:"over12k", label:"Daugiau nei 12 000", desc:"Labai aktyvus" },
];

const GOALS = [
  { id:"lose",     label:"Lieknėti",          Icon:Flame,  desc:"Mažinti kūno riebalus" },
  { id:"maintain", label:"Palaikyti svorį",   Icon:Scale,  desc:"Išlaikyti dabartinę formą" },
  { id:"gain",     label:"Auginti raumeninę masę", Icon:Muscle, desc:"Stiprėti ir augti" },
];

export const WELLBEING_OPTS = [
  null,
  { Icon:Frown,   label:"Labai blogai" },
  { Icon:Frown,   label:"Blogai" },
  { Icon:Meh,     label:"Vidutiniškai" },
  { Icon:Smile,   label:"Gerai" },
  { Icon:Sparkle, label:"Puikiai" },
];

function calcAge(dob) {
  if (!dob) return null;
  return Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000));
}

// ── Bendri stiliai ───────────────────────────────────────────────────────────
const inp = (focused) => ({
  width:"100%", padding:"13px 14px",
  border:"2px solid " + (focused ? PK.mid : PK.blush),
  borderRadius:14, fontSize:15, color:"#fff",
  background:"rgba(255,255,255,0.07)", outline:"none", fontFamily:"inherit",
  WebkitAppearance:"none", transition:"border-color 0.2s",
});

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.75)", marginBottom:6 }}>{label}</label>
      {hint && <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginBottom:8, lineHeight:1.4 }}>{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type="text" }) {
  const [f, setF] = useState(false);
  return <input type={type} value={value} placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    onFocus={() => setF(true)} onBlur={() => setF(false)}
    style={inp(f)} />;
}

function TextArea({ value, onChange, placeholder, rows=3 }) {
  const [f, setF] = useState(false);
  return <textarea value={value} placeholder={placeholder} rows={rows}
    onChange={e => onChange(e.target.value)}
    onFocus={() => setF(true)} onBlur={() => setF(false)}
    style={{ ...inp(f), resize:"vertical", lineHeight:1.5 }} />;
}

function ChoiceBtn({ selected, onClick, label, desc }) {
  return (
    <button onClick={onClick} style={{
      width:"100%", padding:"12px 14px", textAlign:"left",
      border:"2px solid " + (selected ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)"),
      borderRadius:14, background: selected ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
      cursor:"pointer", fontFamily:"inherit", marginBottom:8,
      display:"flex", justifyContent:"space-between", alignItems:"center",
      transition:"all 0.15s",
    }}>
      <span style={{ fontSize:14, fontWeight:700, color:selected?PK.dark:PK.mid, display:"inline-flex", alignItems:"center", gap:6 }}>{label}</span>
      {desc && <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginLeft:10, textAlign:"right", maxWidth:140 }}>{desc}</span>}
    </button>
  );
}

function PhotoUpload({ label, Icon, value, onChange, userId, field }) {
  const [loading, setLoading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      // Lokali peržiūra iš karto
      const reader = new FileReader();
      reader.onload = ev => onChange(ev.target.result);
      reader.readAsDataURL(file);

      // Įkelti į PocketBase
      const formData = new FormData();
      formData.append(field, file);
      const updated = await pb.collection("users").update(userId, formData);
      const url = pb.getFileUrl(updated, updated[field]);
      onChange(url);
    } catch(e) { console.warn("Photo upload:", e); }
    setLoading(false);
  }

  return (
    <label style={{ display:"block", cursor:"pointer" }}>
      <input type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display:"none" }} />
      <div style={{
        border:"2px dashed " + (value ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"),
        borderRadius:16, overflow:"hidden", position:"relative",
        background: value ? "transparent" : "rgba(255,255,255,0.07)",
        aspectRatio:"3/4", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:8,
      }}>
        {value ? (
          <img src={value} alt={label} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <>
            <Icon size={32} color="rgba(255,255,255,0.6)" />
            <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.75)", textAlign:"center", padding:"0 8px" }}>{label}</span>
          </>
        )}
        {loading && (
          <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:11, color:PK.mid }}>Įkeliama...</span>
          </div>
        )}
        <div style={{
          position:"absolute", bottom:8, right:8,
          background:PK.mid, borderRadius:"50%", width:28, height:28,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:14, color:"#fff",
        }}>+</div>
      </div>
    </label>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function Onboarding({ user, onComplete, startStep = 0 }) {
  const [step, setStep] = useState(startStep);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // 1 žingsnis
    gender: "f",
    dob: "",
    height: "",
    weight: "",
    // 2 žingsnis
    goal: "",
    motivation: "",
    // 3 žingsnis
    sleep_stress: "",
    act: null,
    steps_per_day: "",
    // 4 žingsnis
    diet_desc: "",
    hardest_part: "",
    expectations: "",
    wellbeing: null,
    // 5 žingsnis
    photo_front: "",
    photo_side: "",
    photo_back: "",
  });

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const steps = [
  { title:"Asmeniniai duomenys", Icon:User },
  { title:"Tikslas ir motyvacija", Icon:Target },
  { title:"Gyvensena",            Icon:Leaf },
  { title:"Mityba ir iššūkiai",   Icon:Salad },
];

  function canNext() {
    if (step === 0) return (form.dob && form.height && form.weight) || startStep > 0;
    if (step === 1) return form.goal && form.motivation.trim().length > 2;
    if (step === 2) return form.sleep_stress.trim().length > 1 && form.act && form.steps_per_day;
    if (step === 3) return form.diet_desc.trim().length > 2 && form.wellbeing;
    return true;
  }

  async function handleFinish() {
  setSaving(true); setError("");
  const age = calcAge(form.dob);
  try {
    await pb.collection("users").update(user.id, {
      gender:        form.gender,
      dob:           form.dob,
      age:           age,
      height:        parseFloat(form.height) || null,
      weight:        parseFloat(form.weight) || null,
      act:           form.act,
      goal:          form.goal,
      motivation:    form.motivation,
      sleep_stress:  form.sleep_stress,
      steps_per_day: form.steps_per_day,
      diet_desc:     form.diet_desc,
      hardest_part:  form.hardest_part,
      expectations:  form.expectations,
      wellbeing:     form.wellbeing,
      onboarding_done: true,
      track_progress:  true,
    });
    onComplete();
  } catch(e) {
  console.log("Onboarding klaida:", e);
  setError("Klaida išsaugant: " + (e.message || JSON.stringify(e)));
}
  setSaving(false);
}

  async function handleFinishMinimal() {
    setSaving(true); setError("");
    const age = calcAge(form.dob);
    try {
      await pb.collection("users").update(user.id, {
        dob:             form.dob,
        age:             age,
        onboarding_done: true,
        track_progress:  false,
      });
      onComplete();
    } catch(e) {
      setError("Klaida išsaugant: " + (e.message || JSON.stringify(e)));
    }
    setSaving(false);
  }

  const age = calcAge(form.dob);

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#6D1B3B,#AD1457)", padding:"20px 20px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <img src="/logo.png" alt="Coach Vilma" style={{ width:40, height:40, objectFit:"contain", borderRadius:10 }} />
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:17, fontWeight:700, color:"#fff", margin:0 }}>Sveiki atvykę!</h1>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Užpildykite anketą – tai užtruks ~3 min.</p>
          </div>
          <button onClick={()=>pb.authStore.clear()&&window.location.reload()} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"6px 12px", color:"rgba(255,255,255,0.7)", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Išeiti</button>
        </div>

        {/* Progreso juosta */}
        <div style={{ display:"flex", gap:6 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <div style={{
                width:"100%", height:4, borderRadius:99,
                background: i <= step ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)",
                transition:"background 0.3s",
              }} />
              <s.Icon size={14} color={i === step ? "#fff" : "rgba(255,255,255,0.45)"} />
            </div>
          ))}
        </div>
        <p style={{ color:"rgba(255,255,255,0.7)", fontSize:12, textAlign:"center", marginTop:8, margin:0 }}>
          {step+1} / {steps.length} — {steps[step].title}
        </p>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"20px 20px 100px" }}>

        {/* ── 1 žingsnis: Asmeniniai duomenys ── */}
        {step === 0 && (
          <div>
            <Field label="Lytis">
              <div style={{ display:"flex", gap:8 }}>
                {[{id:"f",l:"Moteris"},{id:"m",l:"Vyras"}].map(g => (
                  <button key={g.id} onClick={() => set("gender")(g.id)} style={{
                    flex:1, padding:"11px 0", border:"2px solid "+(form.gender===g.id?PK.mid:PK.blush),
                    borderRadius:12, background:form.gender===g.id?PK.light:"#fff",
                    color:form.gender===g.id?PK.dark:PK.mid, fontSize:13, fontWeight:700,
                    cursor:"pointer", fontFamily:"inherit",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  }}><User size={14} />{g.l}</button>
                ))}
              </div>
            </Field>

            <Field label="Gimimo data">
              <div style={{ position:"relative" }}>
                <TextInput type="date" value={form.dob} onChange={set("dob")}
                  placeholder="1990-01-15" />
                {age && (
                  <div style={{ marginTop:6, fontSize:12, color:"rgba(255,255,255,0.75)", fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
                    <Check size={12} />Amžius: {age} metai
                  </div>
                )}
              </div>
            </Field>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="Ūgis (cm)">
                <TextInput type="number" value={form.height} onChange={set("height")} placeholder="168" />
              </Field>
              <Field label="Svoris (kg)">
                <TextInput type="number" value={form.weight} onChange={set("weight")} placeholder="70" />
              </Field>
            </div>

            {/* Minimalus variantas */}
            <div style={{ marginTop:20, padding:"14px 16px", background:"rgba(255,255,255,0.05)", borderRadius:14, border:"1.5px dashed rgba(255,255,255,0.2)" }}>
              <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.7)", margin:"0 0 4px" }}>Norite pereiti greičiau?</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:"0 0 10px" }}>Galite registruotis tik su gimimo data ir baigti — progreso sekimą galėsite įjungti vėliau.</p>
              <button onClick={handleFinishMinimal} disabled={!form.dob || saving} style={{ width:"100%", padding:"11px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.25)", background:"transparent", color:form.dob?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.3)", fontSize:13, fontWeight:600, cursor:form.dob?"pointer":"default", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {saving ? "Saugoma..." : <>Progreso nesekti <ChevronRight size={13} /> Baigti registraciją</>}
              </button>
            </div>
          </div>
        )}

        {/* ── 2 žingsnis: Tikslas ── */}
        {step === 1 && (
          <div>
            <Field label="Koks tavo pagrindinis tikslas?">
              {GOALS.map(g => (
                <ChoiceBtn key={g.id} selected={form.goal===g.id}
                  onClick={() => set("goal")(g.id)}
                  label={<><g.Icon size={14} />{g.label}</>} desc={g.desc} />
              ))}
            </Field>

            <Field label="Kodėl tau tai svarbu?" hint="Parašyk vieną sakinį – tai padės man geriau suprasti tavo motivaciją.">
              <TextArea value={form.motivation} onChange={set("motivation")}
                placeholder="Pvz. Noriu jaustis energingiau ir pasitikėti savimi..." rows={3} />
            </Field>
          </div>
        )}

        {/* ── 3 žingsnis: Gyvensena ── */}
        {step === 2 && (
          <div>
            <Field label="Kaip su miegu ir stresu šiuo metu?" hint="Keletas žodžių – nesijaudink, nėra teisingų atsakymų.">
              <TextInput value={form.sleep_stress} onChange={set("sleep_stress")}
                placeholder="Pvz. Miegu gerai, bet stresas darbe didelis..." />
            </Field>

            <Field label="Kiek šiuo metu judi / sportuoji?">
              {ACTIVITY_OPTS.map(a => (
                <ChoiceBtn key={a.id} selected={form.act===a.id}
                  onClick={() => set("act")(a.id)}
                  label={a.label} desc={a.desc} />
              ))}
            </Field>

            <Field label="Kiek žingsnių surinksi per dieną?">
              {STEPS_OPTS.map(s => (
                <ChoiceBtn key={s.id} selected={form.steps_per_day===s.id}
                  onClick={() => set("steps_per_day")(s.id)}
                  label={s.label} desc={s.desc} />
              ))}
            </Field>
          </div>
        )}

        {/* ── 4 žingsnis: Mityba ── */}
        {step === 3 && (
          <div>
            <Field label="Kaip apibūdintum savo mitybą dabar?">
              <TextArea value={form.diet_desc} onChange={set("diet_desc")}
                placeholder="Pvz. Valgo gana chaotiškai, dažnai praleidžiu pusryčius..." rows={3} />
            </Field>

            <Field label="Kas tau sunkiausia laikantis režimo?">
              <TextArea value={form.hardest_part} onChange={set("hardest_part")}
                placeholder="Pvz. Vakaro užkandžiai, savaitgaliai, stresas darbe..." rows={3} />
            </Field>

            <Field label="Ko tikiesi iš manęs kaip trenerės?">
              <TextArea value={form.expectations} onChange={set("expectations")}
                placeholder="Pvz. Aiškaus plano, motyvacijos, atskaitomybės..." rows={3} />
            </Field>

            <Field label="Kaip vertini savo savijautą dabar? (1–5)" hint="1 = labai blogai, 5 = puikiai">
              <div style={{ display:"flex", gap:8 }}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => set("wellbeing")(n)} style={{
                    flex:1, aspectRatio:"1", border:"2px solid "+(form.wellbeing===n?PK.mid:PK.blush),
                    borderRadius:12, background:form.wellbeing===n?PK.mid:"#fff",
                    color:form.wellbeing===n?"#fff":PK.mid, fontSize:18, fontWeight:700,
                    cursor:"pointer", fontFamily:"inherit",
                  }}>{n}</button>
                ))}
              </div>
              {form.wellbeing && (() => {
                const w = WELLBEING_OPTS[form.wellbeing];
                return (
                  <p style={{ textAlign:"center", marginTop:8, fontSize:12, color:"rgba(255,255,255,0.75)", fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <w.Icon size={14} />{w.label}
                  </p>
                );
              })()}
            </Field>
          </div>
        )}

        {/* ── 5 žingsnis: Nuotraukos ── */}
        {step === 4 && (
          <div>
            <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"14px 16px", marginBottom:20, border:"1px solid rgba(255,255,255,0.15)" }}>
              <p style={{ fontSize:13, color:"#fff", fontWeight:600, marginBottom:4, display:"flex", alignItems:"center", gap:6 }}><Camera size={14} />Pirminės nuotraukos</p>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:0, lineHeight:1.5 }}>
                Nuotraukos reikalingos progresui stebėti. Jos matomos tik man kaip treneriai. Galima įkelti vėliau.
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, textAlign:"center" }}>Priekis</p>
                <PhotoUpload label="Priekio nuotrauka" Icon={User} field="front"
                  value={form.photo_front} onChange={set("photo_front")} userId={user.id} />
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, textAlign:"center" }}>Šonas</p>
                <PhotoUpload label="Šono nuotrauka" Icon={Walk} field="side"
                  value={form.photo_side} onChange={set("photo_side")} userId={user.id} />
              </div>
              <div>
                <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, textAlign:"center" }}>Nugara</p>
                <PhotoUpload label="Nugaros nuotrauka" Icon={ChevronLeft} field="back"
                  value={form.photo_back} onChange={set("photo_back")} userId={user.id} />
              </div>
            </div>

            {error && (
              <div style={{ background:"#FFF0F5", border:"1px solid "+PK.coral, borderRadius:12, padding:"12px 14px", fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:16 }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mygtukai apačioje */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(255,255,255,0.07)", borderTop:"1px solid rgba(255,255,255,0.1)", padding:"12px 20px", paddingBottom:"max(12px, env(safe-area-inset-bottom))", display:"flex", gap:10, maxWidth:480, margin:"0 auto" }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s-1)} style={{
            flex:1, padding:"14px 0", border:"1.5px solid rgba(255,255,255,0.2)",
            borderRadius:14, background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.75)",
            fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}><ChevronLeft size={14} />Atgal</button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(s => s+1)} disabled={!canNext()} style={{
            flex:2, padding:"14px 0", border:"none",
            borderRadius:14, background: canNext() ? "linear-gradient(135deg,#6D1B3B,#AD1457)" : "rgba(255,255,255,0.2)",
            color:"#fff", fontSize:14, fontWeight:700,
            cursor: canNext() ? "pointer" : "default", fontFamily:"inherit",
            transition:"background 0.2s",
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>Toliau <ChevronRight size={14} /></button>
        ) : (
          <button onClick={handleFinish} disabled={saving} style={{
            flex:2, padding:"14px 0", border:"none",
            borderRadius:14, background:"linear-gradient(135deg,#6D1B3B,#AD1457)",
            color:"#fff", fontSize:14, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit", opacity:saving?0.7:1,
            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
          }}>{saving ? "Saugoma..." : <><Check size={14} />Baigti registraciją</>}</button>
        )}
      </div>
    </div>
  );
}
