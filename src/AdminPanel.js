import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";
import TrainerMeasurements from "./TrainerMeasurements";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SERVICE_KEY  = process.env.REACT_APP_SERVICE_ROLE_KEY;
const adminDb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SERVICE_ROLE_KEY
);

const STEPS_LABELS = {
  "under5k":"Iki 5 000 žingsnių","5k-8k":"5 000–8 000",
  "8k-12k":"8 000–12 000","over12k":"Daugiau nei 12 000",
};

async function adminCreateUser(email, password) {
  const res = await fetch(SUPABASE_URL + "/auth/v1/admin/users", {
    method:"POST",
    headers:{ "Content-Type":"application/json", "apikey":SERVICE_KEY, "Authorization":"Bearer "+SERVICE_KEY },
    body: JSON.stringify({ email, password, email_confirm:true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Klaida kuriant vartotoją");
  return data;
}

function Card({ children, style }) {
  return <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:18, padding:"16px", border:"1px solid rgba(255,255,255,0.15)", boxShadow:"0 2px 10px rgba(173,20,87,0.06)", ...style }}>{children}</div>;
}

function SectionLabel({ children }) {
  return <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,0.75)", marginBottom:10 }}>{children}</p>;
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
      <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)", minWidth:120 }}>{label}</span>
      <span style={{ fontSize:12, color:"#fff", fontWeight:500, textAlign:"right", flex:1, marginLeft:10 }}>{value}</span>
    </div>
  );
}

// ── Pilnas kliento profilis (admin rodinys) ───────────────────────────────────
function ClientProfile({ client, onClose, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({
    weight:    client.weight ?? "",
    height:    client.height ?? "",
    act:       client.act    ?? 3,
    goal:      client.goal   ?? "lose",
    wellbeing: client.wellbeing ?? "",
  });
  const [saving, setSaving] = useState(false);
  const set = k => v => setForm(f => ({...f,[k]:v}));

  async function handleSave() {
    setSaving(true);
    const age = client.dob ? Math.floor((new Date()-new Date(client.dob))/(365.25*24*60*60*1000)) : client.age;
    await supabase.from("profiles").update({
      weight:    parseFloat(form.weight)||null,
      height:    parseFloat(form.height)||null,
      age:       age||null,
      act:       form.act,
      goal:      form.goal,
      wellbeing: form.wellbeing||null,
    }).eq("id", client.id);
    setSaving(false);
    setEditing(false);
    onSaved();
  }

  const btnBase = { border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit" };
  const active  = { borderColor:PK.mid, background:"rgba(255,255,255,0.1)", color:"#fff" };
  const inactive= { background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)" };
  const age = client.dob ? Math.floor((new Date()-new Date(client.dob))/(365.25*24*60*60*1000)) : client.age;

  const hasData = client.weight && client.height && (age||client.age);
  const res = hasData ? calcMacros({
    gender:client.gender||"f", age:parseInt(age||client.age),
    weight:parseFloat(client.weight), height:parseFloat(client.height),
    actId:client.act||3, goalId:client.goal||"lose",
  }) : null;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", maxHeight:"92vh", background:"rgba(255,255,255,0.08)", borderRadius:"20px 20px 0 0", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", padding:"16px 20px", borderRadius:"20px 20px 0 0", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>
              {client.gender==="f"?"👩":"👨"}
            </div>
            <div>
              <p style={{ color:"#fff", fontWeight:700, fontSize:15, margin:0 }}>{client.name}</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, margin:0 }}>{client.email}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:"7px 12px",color:"#fff",cursor:"pointer",fontSize:14 }}>✕</button>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"16px" }}>

          {/* Redaguojami laukai */}
          <Card style={{ marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <SectionLabel>Kintami duomenys</SectionLabel>
              {!editing
                ? <button onClick={() => setEditing(true)} style={{ ...btnBase, ...inactive, padding:"6px 12px" }}>✏️ Redaguoti</button>
                : <div style={{ display:"flex",gap:8 }}>
                    <button onClick={() => setEditing(false)} style={{ ...btnBase, ...inactive, padding:"6px 10px" }}>Atšaukti</button>
                    <button onClick={handleSave} disabled={saving} style={{ ...btnBase, ...active, padding:"6px 12px" }}>{saving?"...":"💾 Išsaugoti"}</button>
                  </div>
              }
            </div>

            {editing ? (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[{l:"Svoris (kg)",k:"weight",ph:"70"},{l:"Ūgis (cm)",k:"height",ph:"168"}].map(f => (
                    <div key={f.k}>
                      <label style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", display:"block", marginBottom:4 }}>{f.l}</label>
                      <input type="number" value={form[f.k]} onChange={e=>set(f.k)(e.target.value)} placeholder={f.ph}
                        style={{ width:"100%", padding:"9px 12px", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:10, fontSize:14, color:"#fff", background:"rgba(255,255,255,0.07)", outline:"none", fontFamily:"inherit" }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", display:"block", marginBottom:6 }}>Tikslas</label>
                  <div style={{ display:"flex", gap:6 }}>
                    {GOALS.map(g => (
                      <button key={g.id} onClick={() => set("goal")(g.id)}
                        style={{ ...btnBase, flex:1, padding:"8px 4px", textAlign:"center", ...(form.goal===g.id?active:inactive), fontSize:11 }}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", display:"block", marginBottom:6 }}>Aktyvumas</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {ACTIVITY.map(a => (
                      <button key={a.id} onClick={() => set("act")(a.id)}
                        style={{ ...btnBase, padding:"8px 12px", textAlign:"left", display:"flex", justifyContent:"space-between", ...(form.act===a.id?active:inactive) }}>
                        <span>{a.label}</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:400 }}>{a.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", display:"block", marginBottom:6 }}>Savijauta (1–5)</label>
                  <div style={{ display:"flex", gap:6 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => set("wellbeing")(n)} style={{
                        flex:1, aspectRatio:"1", border:"2px solid "+(form.wellbeing===n?PK.mid:PK.blush),
                        borderRadius:10, background:form.wellbeing===n?PK.mid:"#fff",
                        color:form.wellbeing===n?"#fff":PK.mid, fontSize:16, fontWeight:700,
                        cursor:"pointer", fontFamily:"inherit",
                      }}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <InfoRow label="Svoris" value={client.weight ? client.weight+" kg" : null} />
                <InfoRow label="Ūgis"   value={client.height ? client.height+" cm" : null} />
                <InfoRow label="Amžius" value={age ? age+" m." : null} />
                <InfoRow label="Gimimo data" value={client.dob} />
                <InfoRow label="Tikslas" value={GOALS.find(g=>g.id===client.goal)?.label} />
                <InfoRow label="Aktyvumas" value={ACTIVITY.find(a=>a.id===client.act)?.label} />
                <InfoRow label="Savijauta" value={client.wellbeing ? client.wellbeing+"/5" : null} />
              </div>
            )}
          </Card>

          {/* Makro rezultatai */}
          {res && (
            <Card style={{ marginBottom:12, background:"linear-gradient(135deg,#6D1B3B,#AD1457)" }}>
              <SectionLabel><span style={{ color:"rgba(255,255,255,0.7)" }}>Apskaičiuoti makro</span></SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                {[{l:"Kalorijos",v:res.target,u:"kcal"},{l:"Baltymai",v:res.prot.g,u:"g"},{l:"Riebalai",v:res.fat.g,u:"g"},{l:"Angliavandeniai",v:res.carb.g,u:"g"}].map(m => (
                  <div key={m.l} style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
                    <div style={{ fontSize:16, fontWeight:700, color:"#fff" }}>{m.v}<span style={{ fontSize:9 }}>{m.u}</span></div>
                    <div style={{ fontSize:8, color:"rgba(255,255,255,0.6)", marginTop:1 }}>{m.l}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.6)", textAlign:"center", marginTop:10, marginBottom:0 }}>
                💧 Vanduo: {res.water}l · BMR: {res.bmr} · TDEE: {res.tdee}
              </p>
            </Card>
          )}

          {/* Anketos atsakymai */}
          <Card style={{ marginBottom:12 }}>
            <SectionLabel>Anketos atsakymai</SectionLabel>
            <InfoRow label="Tikslas"           value={GOALS.find(g=>g.id===client.goal)?.label} />
            <InfoRow label="Motyvacija"        value={client.motivation} />
            <InfoRow label="Miegas / stresas"  value={client.sleep_stress} />
            <InfoRow label="Žingsniai/dieną"   value={STEPS_LABELS[client.steps_per_day]} />
            <InfoRow label="Mityba šiuo metu"  value={client.diet_desc} />
            <InfoRow label="Sunkiausia"        value={client.hardest_part} />
            <InfoRow label="Lūkesčiai"         value={client.expectations} />
          </Card>

          {/* Nuotraukos */}
          {(client.photo_front || client.photo_side || client.photo_back) && (
            <Card style={{ marginBottom:12 }}>
              <SectionLabel>Pirminės nuotraukos</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[{label:"Priekis",url:client.photo_front},{label:"Šonas",url:client.photo_side},{label:"Nugara",url:client.photo_back}].map(p => p.url && (
                  <div key={p.label}>
                    <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", textAlign:"center", marginBottom:5 }}>{p.label}</p>
                    <img src={p.url} alt={p.label} style={{ width:"100%", aspectRatio:"3/4", objectFit:"cover", borderRadius:10, border:"1px solid rgba(255,255,255,0.15)" }} />
                  </div>
                ))}
              </div>
            </Card>
          )}
          {/* Check-in sekcija */}
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Check-in & Progresas</p>
            <TrainerMeasurements clientId={client.id} clientName={client.name} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Naujo kliento forma (supaprastinta, anketa užpildoma pačių) ───────────────
function NewClientForm({ onSave, onCancel }) {
  const [form,   setForm]   = useState({ name:"", email:"", password:"" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = k => v => setForm(f=>({...f,[k]:v}));

  async function handleSave() {
    if (!form.name || !form.email || !form.password) { setError("Visi laukai privalomi."); return; }
    if (form.password.length < 6) { setError("Slaptažodis min. 6 simboliai."); return; }
    setSaving(true); setError("");
    try {
      const user = await adminCreateUser(form.email, form.password);
      await supabase.from("profiles").upsert({
        id:user.id, email:form.email, name:form.name, role:"client", onboarding_done:false,
      });
      onSave();
    } catch(e) { setError(e.message); }
    setSaving(false);
  }

  const inp = (v,fn,t="text",ph="") => {
    const [f,setF] = useState(false);
    return <input type={t} value={v} placeholder={ph} onChange={e=>fn(e.target.value)}
      onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{ width:"100%", padding:"10px 12px", border:"2px solid "+(f?PK.mid:PK.blush), borderRadius:12, fontSize:15, color:"#fff", background:"rgba(255,255,255,0.07)", outline:"none", fontFamily:"inherit" }} />;
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:18, padding:"16px", border:"1px solid rgba(255,255,255,0.15)" }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,0.75)", marginBottom:12 }}>Prisijungimo duomenys</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { l:"Vardas Pavardė", k:"name",     t:"text",     ph:"Emilija Šerkšnaitė" },
            { l:"El. paštas",     k:"email",    t:"email",    ph:"emilija@gmail.com" },
            { l:"Slaptažodis",    k:"password", t:"password", ph:"min. 6 simboliai" },
          ].map(f => (
            <div key={f.k}>
              <label style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.75)", textTransform:"uppercase", display:"block", marginBottom:4 }}>{f.l}</label>
              <input type={f.t} value={form[f.k]} placeholder={f.ph} onChange={e=>set(f.k)(e.target.value)}
                style={{ width:"100%", padding:"10px 12px", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:12, fontSize:15, color:"#fff", background:"rgba(255,255,255,0.07)", outline:"none", fontFamily:"inherit" }} />
            </div>
          ))}
        </div>
        <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 12px", marginTop:12 }}>
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0, lineHeight:1.5 }}>
            💡 Klientas pirmą kartą prisijungęs užpildys išsamią anketą (tikslai, gyvensena, nuotraukos ir t.t.)
          </p>
        </div>
      </div>

      {error && <div style={{ background:"#FFF0F5", border:"1px solid "+PK.coral, borderRadius:10, padding:"10px 14px", fontSize:13, color:PK.mid }}>{error}</div>}

      <div style={{ display:"flex", gap:10 }}>
        <button onClick={onCancel} style={{ flex:1, padding:"13px 0", borderRadius:14, border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Atšaukti</button>
        <button onClick={handleSave} disabled={saving} style={{ flex:2, padding:"13px 0", borderRadius:14, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:saving?0.7:1 }}>
          {saving?"Kuriama...":"Sukurti klientą"}
        </button>
      </div>
    </div>
  );
}

// ── Kliento kortelė sąraše ────────────────────────────────────────────────────
function ClientCard({ client, onDelete, onOpen }) {
  const age  = client.dob ? Math.floor((new Date()-new Date(client.dob))/(365.25*24*60*60*1000)) : client.age;
  const done = client.onboarding_done;
  const today = new Date();

  // ── Perspėjimai ──────────────────────────────────────────────────────────
  const alerts = [];

  // 🎂 Gimtadienis (likus ≤ 7 dienoms)
  if (client.dob) {
    const bday = new Date(client.dob);
    const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    const d = Math.ceil((next - today) / (1000*60*60*24));
    if (d === 0) alerts.push({ e:"🎂", t:"Šiandien gimtadienis!", c:"#E91E8C" });
    else if (d === 1) alerts.push({ e:"🎂", t:"Gimtadienis rytoj!", c:"#E91E8C" });
    else if (d <= 7) alerts.push({ e:"🎂", t:"Gimtadienis po "+d+" d.", c:"#E91E8C" });
  }

  // 📏 Matavimai (kas 56 d.)
  if (client._lastMeasure) {
    const nextM = new Date(new Date(client._lastMeasure).getTime() + 56*24*60*60*1000);
    const d = Math.ceil((nextM - today) / (1000*60*60*24));
    if (d < 0)      alerts.push({ e:"📏", t:"Matavimai pradelsti "+Math.abs(d)+" d.", c:"#e74c3c" });
    else if (d <= 7) alerts.push({ e:"📏", t:"Matavimai po "+d+" d.", c:"#f39c12" });
  } else if (done) {
    alerts.push({ e:"📏", t:"Pirmi matavimai neatlikti", c:"#e74c3c" });
  }

  // (Check-in rodomas atskirame tab'e)
  // c:"#856404" });

  // 🍽️ Mityba
  if (done && !client._lastFood) alerts.push({ e:"🍽️", t:"3+ d. nesuvedė mitybos", c:"#c0392b" });

  // ⚠️ Anketa
  if (!done) alerts.push({ e:"⚠️", t:"Anketa nebaigta", c:"#856404" });

  // 📊 Savaitiniai duomenys
  const stepAvg  = client._weekStepAvg  || 0;
  const workouts = client._weekWorkouts || { strength:0, cardio:0 };
  const totalWorkouts = workouts.strength + workouts.cardio;

  return (
    <div style={{
      background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"12px 16px", marginBottom:10,
      border:"1px solid "+(alerts.length?PK.mid:PK.blush),
      boxShadow: alerts.length?"0 2px 12px rgba(173,20,87,0.12)":"0 2px 8px rgba(173,20,87,0.06)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:done?PK.light:"#f5f5f5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
            {client.gender==="f"?"👩":"👨"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:0 }}>{client.name||client.email}</p>
              {alerts.length > 0 && <span style={{ width:7, height:7, borderRadius:"50%", background:"#e74c3c", flexShrink:0 }}/>}
            </div>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:"2px 0 0" }}>
              {age?age+"m.":""}{client.weight?" · "+client.weight+"kg":""}
              {client._lastMeasure?" · mat. "+new Date(client._lastMeasure).toLocaleDateString("lt-LT",{month:"short",day:"numeric"}):""}
            </p>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <button onClick={onOpen} style={{ padding:"6px 10px", borderRadius:10, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.75)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Profilis</button>
          <button onClick={onDelete} style={{ padding:"6px 8px", borderRadius:10, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.5)", fontSize:12, cursor:"pointer" }}>🗑️</button>
        </div>
      </div>
      {/* Savaitinės treniruotės */}
      {(workouts.strength > 0 || workouts.cardio > 0 || stepAvg > 0) && (
        <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.1)", display:"flex", gap:8, flexWrap:"wrap" }}>
          {stepAvg > 0 && <span style={{ fontSize:10, color:"rgba(255,255,255,0.6)", background:"rgba(255,255,255,0.08)", borderRadius:8, padding:"3px 8px" }}>🚶 {stepAvg.toLocaleString()} žingsnių/d.</span>}
          {workouts.strength > 0 && <span style={{ fontSize:10, color:"#FFB3C6", background:"rgba(255,179,198,0.12)", borderRadius:8, padding:"3px 8px" }}>🏋️ {workouts.strength}× jėgos</span>}
          {workouts.cardio > 0 && <span style={{ fontSize:10, color:"#89CFF0", background:"rgba(137,207,240,0.12)", borderRadius:8, padding:"3px 8px" }}>🏃 {workouts.cardio}× kardio</span>}
        </div>
      )}
      {alerts.length > 0 && (
        <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:5 }}>
          {alerts.map((a,i) => (
            <span key={i} style={{ fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:8, background:a.c+"18", color:a.c, border:"1px solid "+a.c+"33" }}>
              {a.e} {a.t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}


export default function AdminPanel({ user, onLogout }) {
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState("list"); // list | new
  const [openClient, setOpenClient] = useState(null);

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const weekStart = (() => {
      const d=new Date(),day=d.getDay();
      d.setDate(d.getDate()-day+(day===0?-6:1));
      return d.toISOString().split("T")[0];
    })();

    const [{ data: profiles }, { data: measures }, { data: checkins }, { data: foodLogs }] = await Promise.all([
      supabase.from("profiles").select("*").eq("role","client").order("name"),
      supabase.from("trainer_measurements").select("user_id,measured_at").order("measured_at",{ascending:false}),
      supabase.from("client_checkins").select("user_id,is_done").eq("week_start",weekStart),
      supabase.from("food_log").select("user_id,date").gte("date", new Date(Date.now()-3*24*60*60*1000).toISOString().split("T")[0]),
    ]);

    // Paskutinis matavimas kiekvienam klientui
    const lastMeasure = {};
    (measures||[]).forEach(m => { if (!lastMeasure[m.user_id]) lastMeasure[m.user_id] = m.measured_at; });

    // Šios savaitės check-in statusas
    const checkinDone = {};
    (checkins||[]).forEach(c => { checkinDone[c.user_id] = c.is_done; });

    // Paskutinė mitybos suvedimo data
    const lastFood = {};
    (foodLogs||[]).forEach(f => {
      if (!lastFood[f.user_id] || f.date > lastFood[f.user_id]) lastFood[f.user_id] = f.date;
    });

    // Savaitiniai žingsniai ir treniruotės
    const weekAgo7 = new Date(Date.now()-7*24*60*60*1000).toISOString().split("T")[0];
    const srRes = await adminDb.from("step_log").select("user_id,steps,date").gte("date",weekAgo7);
    const wrRes = await adminDb.from("workout_log").select("user_id,type,duration_min,date").gte("date",weekAgo7);
    const stepData    = srRes.error ? [] : (srRes.data || []);
    const workoutData = wrRes.error ? [] : (wrRes.data || []);

    const weekStepAvg = {};
    (stepData||[]).forEach(s => {
      if (!weekStepAvg[s.user_id]) weekStepAvg[s.user_id] = [];
      weekStepAvg[s.user_id].push(s.steps);
    });
    Object.keys(weekStepAvg).forEach(uid => {
      const arr = weekStepAvg[uid];
      weekStepAvg[uid] = Math.round(arr.reduce((a,b)=>a+b,0)/arr.length);
    });

    const weekWorkouts = {};
    (workoutData||[]).forEach(w => {
      if (!weekWorkouts[w.user_id]) weekWorkouts[w.user_id] = { strength:0, cardio:0 };
      if (w.type==="strength") weekWorkouts[w.user_id].strength++;
      else weekWorkouts[w.user_id].cardio++;
    });

    const enriched = (profiles||[]).map(p => ({
      ...p,
      _lastMeasure:    lastMeasure[p.id]    || null,
      _checkinDone:    checkinDone[p.id]    ?? null,
      _lastFood:       lastFood[p.id]       || null,
      _weekStepAvg:    weekStepAvg[p.id]    || 0,
      _weekWorkouts:   weekWorkouts[p.id]   || { strength:0, cardio:0 },
    }));

    setClients(enriched);
    setLoading(false);
  }

  async function handleDelete(client) {
    if (!window.confirm("Ištrinti " + (client.name||client.email) + "?")) return;
    await supabase.from("profiles").delete().eq("id", client.id);
    await fetch(SUPABASE_URL+"/auth/v1/admin/users/"+client.id, {
      method:"DELETE", headers:{ "apikey":SERVICE_KEY, "Authorization":"Bearer "+SERVICE_KEY },
    });
    loadClients();
  }

  if (view === "new") return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom:48 }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={()=>setView("list")} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:14,cursor:"pointer" }}>← Atgal</button>
        <h1 style={{ fontSize:17, fontWeight:700, color:"#fff", margin:0 }}>Naujas klientas</h1>
      </div>
      <div style={{ maxWidth:480, margin:"0 auto", padding:"16px" }}>
        <NewClientForm onSave={()=>{ setView("list"); loadClients(); }} onCancel={()=>setView("list")} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom:48 }}>

      {openClient && (
        <ClientProfile
          client={openClient}
          onClose={() => setOpenClient(null)}
          onSaved={() => { loadClients(); setOpenClient(null); }}
        />
      )}

      {/* Header */}
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", padding:"16px 20px 20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src="/logo.png" alt="Coach Vilma" style={{ width:38, height:38, objectFit:"contain", borderRadius:8 }} />
            <div>
              <h1 style={{ fontSize:17, fontWeight:700, color:"#fff", margin:0 }}>Admin panelė</h1>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ background:"rgba(255,255,255,0.15)",border:"none",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer" }}>
            Atsijungti
          </button>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"16px" }}>
        {/* Statistika */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          {[
            { v:clients.length,                                       l:"Klientai iš viso",   bg:"linear-gradient(135deg,#6D1B3B,#AD1457)", c:"#fff", sc:PK.blush },
            { v:clients.filter(c=>c.onboarding_done).length,         l:"Anketa baigta",      bg:"#fff", c:PK.mid, sc:PK.rose },
            { v:clients.filter(c=>!c.onboarding_done).length,        l:"Anketa nebaigta",    bg:"#fff", c:"#856404", sc:"#B7791F" },
          ].map((s,i) => (
            <div key={i} style={{ background:s.bg, borderRadius:14, padding:"14px 10px", textAlign:"center", border:s.bg==="#fff"?"1px solid "+PK.blush:"none" }}>
              <div style={{ fontSize:26, fontWeight:700, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:10, color:s.sc, marginTop:2, lineHeight:1.3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setView("new")} style={{ width:"100%", padding:"14px 0", marginBottom:16, background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff", border:"none", borderRadius:16, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          + Naujas klientas
        </button>

        <p style={{ fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", color:"rgba(255,255,255,0.75)", marginBottom:10 }}>Klientai</p>

        {loading ? (
          <p style={{ textAlign:"center", color:"rgba(255,255,255,0.5)", padding:"24px 0" }}>Kraunama...</p>
        ) : clients.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush }}>
            <div style={{ fontSize:36, marginBottom:10 }}>🌸</div>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14 }}>Dar nėra klientų</p>
          </div>
        ) : clients.map(client => (
          <ClientCard key={client.id} client={client}
            onOpen={() => setOpenClient(client)}
            onDelete={() => handleDelete(client)}
          />
        ))}
      </div>
    </div>
  );
}