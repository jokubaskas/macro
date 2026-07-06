import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";

const PACKAGES = [
  { type:"1",  total:1,  label:"1 treniruotė",  price:"45€",  duration:"1 mėn.", emoji:"🏃", features:["Sporto pradžiamokslis – susipažinsime su pratimais ir technika"] },
  { type:"8",  total:8,  label:"8 treniruotės", price:"320€", duration:"3 mėn.", emoji:"🎯", features:["Asmeninės konsultacijos žinutėmis","Patarimai apie mitybą ir sveiką gyvenseną","Rezultatų siekimas ir progreso palyginimas"], popular:true },
  { type:"16", total:16, label:"16 treniruočių",price:"600€", duration:"4 mėn.", emoji:"💪", features:["Asmeninės konsultacijos žinutėmis","Sportinių pasiekimų įvertinimas","Ilgalaikių rezultatų siekimas ir nuolatinė trenerės priežiūra – ne tik sporto salėje"] },
];

const NUTRITION = {
  price:"79€",
  title:"🥗 Mitybos planas",
  features:[
    "8 savaičių mitybos patarimai",
    "3 rotuojamos dienos po 4 patiekalus",
    "Paprasti ir patogūs receptai – be paveikslėlių",
    "Asmeninės rekomendacijos pagal Jūsų tikslus",
  ],
  note:"Mitybos planą gausite per 7 dienas po apmokėjimo – trenerė atsiųs asmeniškai.",
};

const ONLINE = {
  price:"69€/mėn.",
  title:"💻 Online treniruotės",
  subtitle:"Sportuok savarankiškai, tačiau turėk trenerės priežiūrą ir reguliarias plano korekcijas.",
  features:[
    "Individuali treniruočių programa programėlėje",
    "Progreso sekimas: svoris, riebalai %, nuotraukos, statistika",
    "Savaitinė trenerės progreso analizė ir plano korekcija",
    "Asmeninis grįžtamasis ryšys kiekvieną savaitę",
    "Klausimai ir technikos analizė el. paštu bet kada",
  ],
};

const RULES = [
  "Rezervacija patvirtinama tik po apmokėjimo",
  "Atšaukus likus <24 val. – pinigai negrąžinami, treniruotė laikoma įvykusia",
  "Pavėlavus – treniruotė trumpinama",
  "Visi planai galioja nurodytą laiką nuo apmokėjimo",
  "Po atostogų vieta saugoma tik jei treniruotės rezervuotos ir apmokėtos iš anksto",
];

const INFO_SECTIONS = [
  { title:"📍 Vieta ir reikalavimai", content:"Gym+, Dariaus ir Girėno g. 2 (Pelėsos g., TAXIPARKAS). Reikalinga galiojanti Gym+ narystė." },
  { title:"⏱️ Įvadinė treniruotė", content:"Pirmoji treniruotė visuomet bus įvadinė (iki 45 min.) – nepriklausomai nuo perkamo plano. Apima kūno laikysenos įvertinimą, tikslų aptarimą ir gairių nustatymą." },
  { title:"👥 Sportuoti su draugu pigiau", content:"Perkant bet kurį paketą, abu gausite po 5€ nuolaidą kiekvienai treniruotei." },
  { title:"📋 Kitos paslaugos", content:"Sporto planas – 150€ (3 dienų, pritaikytas tik Jums). Konsultacija – 35€ (iki 50 min., nuotoliniu būdu)." },
];

export default function TrainingPackages({ user, onClose }) {
  const [packages, setPackages]   = useState([]);
  const [sending, setSending]     = useState(false);
  const [openInfo, setOpenInfo]   = useState(null);
  const [rulesFor, setRulesFor]   = useState(null); // paketas kurio taisykles rodomos
  const [agreed, setAgreed]       = useState(false);

  const load = useCallback(async () => {
    const data = await pb.collection("training_packages").getFullList({
      filter: `client_id="${user.id}"`, sort: "-created", requestKey: null,
    }).catch(() => []);
    setPackages(data);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  async function handleConfirm() {
    if (!agreed || !rulesFor) return;
    setSending(rulesFor.type);
    await pb.collection("training_packages").create({
      client_id: user.id, package_type: rulesFor.type,
      credits_total: rulesFor.total, credits_used: 0, status: "pending",
    }).catch(() => {});
    await load();
    setSending(false);
    setRulesFor(null);
    setAgreed(false);
  }

  const active = packages.find(p => p.status === "approved" && p.credits_used < p.credits_total);
  const pending = packages.filter(p => p.status === "pending");

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"linear-gradient(160deg,#3a0a20 0%,#6D1B3B 45%,#AD1457 100%)", overflowY:"auto", paddingBottom:80, WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Taisyklių popup */}
      {rulesFor && (
        <div style={{ position:"fixed", inset:0, zIndex:1100, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"flex-end" }} onClick={e=>e.target===e.currentTarget&&setRulesFor(null)}>
          <div style={{ width:"100%", maxWidth:480, margin:"0 auto", background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)", borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", maxHeight:"80vh", overflowY:"auto" }}>
            <p style={{ fontSize:16, fontWeight:700, color:"#fff", margin:"0 0 16px" }}>📋 Taisyklės — {rulesFor.label}</p>
            {RULES.map((r,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                <span style={{ fontSize:13, color:"#FFD700", flexShrink:0 }}>⚠️</span>
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.85)", margin:0, lineHeight:1.5 }}>{r}</p>
              </div>
            ))}
            <div onClick={()=>setAgreed(a=>!a)} style={{ display:"flex", alignItems:"center", gap:12, marginTop:20, padding:"14px", background:"rgba(255,255,255,0.08)", borderRadius:14, cursor:"pointer", border:`1.5px solid ${agreed?"#7FFFB0":"rgba(255,255,255,0.2)"}` }}>
              <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${agreed?"#7FFFB0":"rgba(255,255,255,0.4)"}`, background:agreed?"#7FFFB0":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {agreed && <span style={{ fontSize:14, color:"#1a0a14" }}>✓</span>}
              </div>
              <p style={{ fontSize:13, color:"#fff", margin:0 }}>Susipažinau su taisyklėmis ir sutinku</p>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={()=>{setRulesFor(null);setAgreed(false);}} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.3)", background:"transparent", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Atšaukti</button>
              <button onClick={handleConfirm} disabled={!agreed||!!sending} style={{ flex:2, padding:"12px", borderRadius:12, border:"none", background:agreed?"linear-gradient(135deg,#1a4731,#276749)":"rgba(255,255,255,0.1)", color:agreed?"#fff":"rgba(255,255,255,0.3)", fontSize:14, fontWeight:700, cursor:agreed?"pointer":"default", fontFamily:"inherit" }}>
                {sending?"Siunčiama...":"✓ Siųsti užklausą"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", position:"sticky", top:0, zIndex:10, backdropFilter:"blur(10px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer" }}>← Atgal</button>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0 }}>🎟️ Treniruočių paketai</h1>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>

        {/* Aktyvus paketas */}
        {active && (
          <div style={{ background:"rgba(127,255,176,0.1)", border:"1.5px solid rgba(127,255,176,0.3)", borderRadius:18, padding:"16px", marginBottom:16 }}>
            <p style={{ fontSize:10, fontWeight:700, color:"#7FFFB0", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 6px" }}>✅ Aktyvus paketas</p>
            <p style={{ fontSize:22, fontWeight:800, color:"#fff", margin:"0 0 6px" }}>{active.credits_total - active.credits_used} <span style={{ fontSize:13, fontWeight:400, color:"rgba(255,255,255,0.5)" }}>/ {active.credits_total} treniruočių liko</span></p>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:99, height:5 }}>
              <div style={{ width:`${((active.credits_total-active.credits_used)/active.credits_total)*100}%`, height:"100%", borderRadius:99, background:"#7FFFB0" }} />
            </div>
          </div>
        )}

        {/* Laukiančios */}
        {pending.map(p => (
          <div key={p.id} style={{ background:"rgba(255,200,0,0.08)", border:"1px solid rgba(255,200,0,0.25)", borderRadius:14, padding:"12px 16px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>{PACKAGES.find(pk=>pk.type===p.package_type)?.label}</p>
              <p style={{ fontSize:11, color:"#FFD700", margin:0 }}>⏳ Laukia patvirtinimo</p>
            </div>
          </div>
        ))}

        {/* Paketai */}
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px" }}>🏋️ Sporto treniruotės</p>
        {PACKAGES.map(pkg => {
          const isPending = pending.some(p => p.package_type === pkg.type);
          return (
            <div key={pkg.type} style={{ background:pkg.popular?"rgba(173,20,87,0.15)":"rgba(255,255,255,0.08)", border:`1.5px solid ${pkg.popular?"rgba(173,20,87,0.4)":"rgba(255,255,255,0.12)"}`, borderRadius:18, padding:"16px", marginBottom:12, position:"relative" }}>
              {pkg.popular && <div style={{ position:"absolute", top:-10, right:16, background:"#AD1457", borderRadius:99, padding:"3px 12px", fontSize:10, fontWeight:700, color:"#fff" }}>Populiariausias</div>}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <p style={{ fontSize:16, fontWeight:800, color:"#fff", margin:"0 0 2px" }}>{pkg.emoji} {pkg.label}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Galioja {pkg.duration} nuo apmokėjimo</p>
                </div>
                <span style={{ fontSize:20, fontWeight:800, color:"#AD1457" }}>{pkg.price}</span>
              </div>
              {pkg.features.map((f,i) => <p key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", margin:"0 0 4px" }}>✅ {f}</p>)}
              <button onClick={()=>!isPending&&!sending&&setRulesFor(pkg)} disabled={isPending||!!sending}
                style={{ width:"100%", marginTop:12, padding:"11px", borderRadius:12, border:"none", background:isPending?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#6D1B3B,#AD1457)", color:isPending?"rgba(255,255,255,0.3)":"#fff", fontSize:13, fontWeight:700, cursor:isPending||sending?"default":"pointer", fontFamily:"inherit" }}>
                {isPending?"⏳ Užklausa išsiųsta":"Rinktis paketą →"}
              </button>
            </div>
          );
        })}

        {/* Mitybos planas */}
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"20px 0 10px" }}>🥗 Mitybos planas</p>
        <div style={{ background:"rgba(255,255,255,0.08)", border:"1.5px solid rgba(255,255,255,0.12)", borderRadius:18, padding:"16px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <p style={{ fontSize:15, fontWeight:800, color:"#fff", margin:0 }}>{NUTRITION.title}</p>
            <span style={{ fontSize:18, fontWeight:800, color:"#AD1457" }}>{NUTRITION.price}</span>
          </div>
          {NUTRITION.features.map((f,i) => <p key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", margin:"0 0 4px" }}>✅ {f}</p>)}
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:"10px 0 0", lineHeight:1.5, fontStyle:"italic" }}>ℹ️ {NUTRITION.note}</p>
        </div>

        {/* Online treniruotės */}
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"20px 0 10px" }}>💻 Online treniruotės</p>
        <div style={{ background:"rgba(255,255,255,0.08)", border:"1.5px solid rgba(255,255,255,0.12)", borderRadius:18, padding:"16px", marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
            <p style={{ fontSize:15, fontWeight:800, color:"#fff", margin:0 }}>{ONLINE.title}</p>
            <span style={{ fontSize:18, fontWeight:800, color:"#AD1457" }}>{ONLINE.price}</span>
          </div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:"0 0 10px", lineHeight:1.5 }}>{ONLINE.subtitle}</p>
          {ONLINE.features.map((f,i) => <p key={i} style={{ fontSize:12, color:"rgba(255,255,255,0.6)", margin:"0 0 4px" }}>✅ {f}</p>)}
          <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:"10px 0 0", lineHeight:1.5 }}>📩 Norėdamos užsisakyti – susisiekite: <a href="https://instagram.com/Vilma_Str" target="_blank" rel="noreferrer" style={{ color:"#FF6EB4", fontWeight:700, textDecoration:"underline" }}>@Vilma_Str</a></p>
        </div>
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"16px 0 10px" }}>ℹ️ Papildoma informacija</p>
        {INFO_SECTIONS.map((s,i) => (
          <div key={i} style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, marginBottom:8, overflow:"hidden" }}>
            <button onClick={()=>setOpenInfo(openInfo===i?null:i)} style={{ width:"100%", padding:"13px 16px", background:"transparent", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", justifyContent:"space-between", alignItems:"center", textAlign:"left" }}>
              {s.title}
              <span style={{ fontSize:12, opacity:0.5 }}>{openInfo===i?"▲":"▼"}</span>
            </button>
            {openInfo===i && <p style={{ fontSize:12, color:"rgba(255,255,255,0.7)", margin:0, padding:"0 16px 14px", lineHeight:1.6 }}>{s.content}</p>}
          </div>
        ))}

        {/* Apmokejimo info */}
        <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"14px 16px", marginTop:8 }}>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.7)", margin:"0 0 8px", lineHeight:1.5 }}>💳 Išsiuntus užklausą, atlikite apmokėjimą ir trenerė patvirtins jūsų paketą.</p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.7)", margin:0, lineHeight:1.5 }}>📩 Negavote patvirtinimo? <a href="https://instagram.com/Vilma_Str" target="_blank" rel="noreferrer" style={{ color:"#FF6EB4", fontWeight:700, textDecoration:"underline" }}>@Vilma_Str</a></p>
        </div>
      </div>
    </div>
  );
}
