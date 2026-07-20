import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { ProgressBar } from "./ui/kit";
import { effectiveDeadline, fetchAllDayVacations, daysUntil } from "./packageDeadline";
import {
  ChevronLeft, ChevronRight, Ticket, Dumbbell, Flame, Muscle, Salad, Laptop, MapPin, Timer,
  Users, Clipboard, Calendar, Close, CheckCircle, Check, AlertTriangle,
  HelpCircle, CreditCard, Mail, Coins, Heart,
} from "./ui/icons";

const PAYMENT = {
  name: "Vilma Strumilaitė",
  iban: "LT367300010131256704",
};

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API neprieinama šioje naršyklėje — reikšmę reikės nukopijuoti rankiniu būdu
    }
  }

  return (
    <div onClick={handleCopy} className="tap" style={{
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
      background:"rgba(255,255,255,0.07)", border:`1px solid ${copied?"rgba(127,255,176,0.4)":"rgba(255,255,255,0.15)"}`,
      borderRadius:12, padding:"10px 12px", cursor:"pointer", transition:"border-color 0.2s",
    }}>
      <div style={{ minWidth:0 }}>
        <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
        <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{value}</p>
      </div>
      <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:700, color: copied ? "#7FFFB0" : "rgba(255,255,255,0.6)" }}>
        {copied ? <><Check size={13} />Nukopijuota</> : <><Clipboard size={13} />Kopijuoti</>}
      </div>
    </div>
  );
}

function PaymentInfo() {
  return (
    <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:"14px 16px" }}>
      <p style={{ fontSize:12, fontWeight:700, color:"#fff", margin:"0 0 10px", display:"flex", alignItems:"center", gap:6 }}>
        <CreditCard size={14} />Apmokėjimo duomenys
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <CopyField label="Gavėjas" value={PAYMENT.name} />
        <CopyField label="Sąskaitos numeris (IBAN)" value={PAYMENT.iban} />
        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:12, padding:"10px 12px" }}>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Mokėjimo paskirtis</p>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.85)", margin:0, lineHeight:1.4 }}>Nurodykite užsakomo paketo pavadinimą</p>
        </div>
      </div>
    </div>
  );
}

const PACKAGES = [
  { type:"1",  total:1,  label:"1 treniruotė",  price:"45€",  duration:"1 mėn.", Icon:Dumbbell, tagline:"Susipažinti su sporto sale ir išmokti saugiai pradėti." },
  { type:"8",  total:8,  label:"8 treniruotės", price:"320€", duration:"3 mėn.", Icon:Flame,    tagline:"Įgyti tvirtus sportavimo pagrindus ir pasitikėjimo savimi.", popular:true, popularLabel:"Perkamiausias" },
  { type:"16", total:16, label:"16 treniruočių",price:"600€", duration:"4 mėn.", Icon:Muscle,   tagline:"Kryptingai siekti ryškių ir ilgalaikių rezultatų.", savings:"Sutaupai 120€ lyginant su paviene treniruote" },
];

const NUTRITION = { price:"79€", Icon:Salad, label:"Mitybos planas", tagline:"Nebereikės kasdien sukti galvos, ką valgyti siekiant savo tikslo." };
const ONLINE   = { price:"69€/mėn.", Icon:Laptop, label:"Online coaching", tagline:"Turėti trenerę šalia, net sportuojant savarankiškai." };

const FAQ = [
  { Icon:MapPin, q:"Kur vyksta treniruotės?", a:"Gym+ Dariaus ir Girėno g. 2 (Pelėsos g., TAXIPARKAS), Vilniuje. Būtina galiojanti Gym+ narystė." },
  { Icon:Timer, q:"Kas vyksta pirmosios treniruotės metu?", a:"Pirmoji treniruotė visada įvadinė (iki 45 min.) – aptarsime tikslus, įvertinsime laikyseną, išmoksime techniką ir sudarysime veiksmų planą." },
  { Icon:Users, q:"Ar galima sportuoti dviese?", a:"Taip! Perkant tą patį paketą kartu su draugu ar šeimos nariu, abu gaunate po 5€ nuolaidą kiekvienai treniruotei." },
  { Icon:Clipboard, q:"Kokios papildomos paslaugos?", a:"Individualus sporto planas – 150€. Individuali konsultacija (iki 50 min., nuotoliu) – 35€." },
  { Icon:Salad, q:"Kas įeina į mitybos planą?", a:"12 subalansuotų receptų (3 dienos × 4 patiekalai), aiškios porcijos, paprasti ingredientai, individualios rekomendacijos. Gausite per 7 darbo dienas po apmokėjimo." },
  { Icon:Laptop, q:"Kaip vyksta online coaching?", a:"Sportuojate savarankiškai su individualia programa programėlėje. Kas savaitę – progreso analizė, plano korekcija ir asmeninis grįžtamasis ryšys. Klausimai – Instagram'e." },
  { Icon:Calendar, q:"Kaip užsiregistruoti?", a:"Išsiųskite užklausą programėlėje ir atlikite apmokėjimą. Patvirtinus – galėsite rezervuoti treniruočių laikus." },
  { Icon:Close, q:"Ar galima atšaukti treniruotę?", a:"Taip, bet ne vėliau kaip prieš 24 val. Vėliau atšauktos treniruotės laikomos įvykusiomis." },
  { Icon:Calendar, q:"Kiek galioja paketai?", a:"1 treniruotė – 1 mėn. · 8 treniruotės – 3 mėn. · 16 treniruočių – 4 mėn." },
];

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
  const [vacations, setVacations] = useState([]);
  const [sending, setSending]     = useState(false);
  const [openInfo, setOpenInfo]   = useState(null);
  const [rulesFor, setRulesFor]   = useState(null); // paketas kurio taisykles rodomos
  const [agreed, setAgreed]       = useState(false);

  const load = useCallback(async () => {
    const [data, vac] = await Promise.all([
      pb.collection("training_packages").getFullList({
        filter: `client_id="${user.id}"`, sort: "-created", requestKey: null,
      }).catch(() => []),
      fetchAllDayVacations(),
    ]);
    setPackages(data);
    setVacations(vac);
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

  // Rodoma bendra visų patvirtintų paketų kreditų suma, nepriklausomai kiek
  // atskirų paketų buvo pirkta — nurašymo/grąžinimo logika toliau veikia
  // su konkrečiu paketu (žr. BookingClient.js/BookingAdmin.js), bet čia
  // klientui rodomas vienas bendras skaičius.
  // Pasibaigusio galiojimo paketai (senų, be valid_until, dar neliečiame —
  // jie lieka matomi kaip anksčiau) čia nebeskaičiuojami aktyviais.
  const approvedPackages = packages.filter(p => {
    if (p.status !== "approved") return false;
    const dl = effectiveDeadline(p, vacations);
    return !dl || daysUntil(dl) >= 0;
  });
  const totalCredits   = approvedPackages.reduce((s,p) => s + (p.credits_total||0), 0);
  const totalUsed      = approvedPackages.reduce((s,p) => s + (p.credits_used||0), 0);
  const totalRemaining = totalCredits - totalUsed;
  const hasActive      = approvedPackages.length > 0 && totalRemaining > 0;
  const pending = packages.filter(p => p.status === "pending");

  // Artimiausias (anksčiausias) terminas iš dar neišnaudotų paketų — su
  // trenerės atostogų pratęsimu jau įskaičiuotu (žr. packageDeadline.js).
  const nearestDeadline = approvedPackages
    .filter(p => (p.credits_total||0) > (p.credits_used||0))
    .map(p => effectiveDeadline(p, vacations))
    .filter(Boolean)
    .sort()[0] || null;
  const nearestDays = nearestDeadline != null ? daysUntil(nearestDeadline) : null;
  const expiringSoon = nearestDays != null && nearestDays <= 7;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, background:"linear-gradient(160deg,#3a0a20 0%,#6D1B3B 45%,#AD1457 100%)", overflowY:"auto", paddingBottom:80, WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", animation:"fadeInUp 0.32s cubic-bezier(.23,1,.32,1) both" }}>

      {/* Taisyklių popup */}
      {rulesFor && (
        <div style={{ position:"fixed", inset:0, zIndex:1100, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"flex-end" }} onClick={e=>e.target===e.currentTarget&&setRulesFor(null)}>
          <div style={{ width:"100%", maxWidth:480, margin:"0 auto", background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)", borderRadius:"24px 24px 0 0", padding:"24px 20px 100px", maxHeight:"85vh", overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
            <p style={{ fontSize:16, fontWeight:700, color:"#fff", margin:"0 0 16px", display:"flex", alignItems:"center", gap:8 }}><Clipboard size={16} />Taisyklės — {rulesFor.label}</p>
            {RULES.map((r,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:10, alignItems:"flex-start" }}>
                <AlertTriangle size={14} color="#FFD700" style={{ flexShrink:0, marginTop:1 }} />
                <p style={{ fontSize:13, color:"rgba(255,255,255,0.85)", margin:0, lineHeight:1.5 }}>{r}</p>
              </div>
            ))}
            <div onClick={()=>setAgreed(a=>!a)} style={{ display:"flex", alignItems:"center", gap:12, marginTop:20, padding:"14px", background:"rgba(255,255,255,0.08)", borderRadius:14, cursor:"pointer", border:`1.5px solid ${agreed?"#7FFFB0":"rgba(255,255,255,0.2)"}` }}>
              <div style={{ width:22, height:22, borderRadius:6, border:`2px solid ${agreed?"#7FFFB0":"rgba(255,255,255,0.4)"}`, background:agreed?"#7FFFB0":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                {agreed && <Check size={14} color="#1a0a14" />}
              </div>
              <p style={{ fontSize:13, color:"#fff", margin:0 }}>Susipažinau su taisyklėmis ir sutinku</p>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <button onClick={()=>{setRulesFor(null);setAgreed(false);}} style={{ flex:1, padding:"12px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.3)", background:"transparent", color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Atšaukti</button>
              <button onClick={handleConfirm} disabled={!agreed||!!sending} style={{ flex:2, padding:"12px", borderRadius:12, border:"none", background:agreed?"linear-gradient(135deg,#1a4731,#276749)":"rgba(255,255,255,0.1)", color:agreed?"#fff":"rgba(255,255,255,0.3)", fontSize:14, fontWeight:700, cursor:agreed?"pointer":"default", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {sending?"Siunčiama...":<><Check size={14} />Siųsti užklausą</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:"20px", paddingRight:"20px", paddingBottom:"16px", position:"sticky", top:0, zIndex:10, backdropFilter:"blur(10px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:7 }}><Ticket size={16} />Treniruočių paketai</h1>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>

        {/* Įspėjimas apie besibaigiantį terminą */}
        {expiringSoon && (
          <div style={{ background:"rgba(255,200,0,0.12)", border:"1.5px solid rgba(255,200,0,0.35)", borderRadius:16, padding:"12px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:10 }}>
            <AlertTriangle size={18} color="#FFD700" style={{ flexShrink:0 }} />
            <p style={{ fontSize:12, color:"#FFD700", margin:0, lineHeight:1.4 }}>
              {nearestDays === 0
                ? "Jūsų paketo galiojimas baigiasi šiandien — nepamirškite rezervuoti likusių treniruočių!"
                : `Jūsų paketo galiojimas baigiasi po ${nearestDays} ${nearestDays===1?"dienos":"dienų"} — nepamirškite rezervuoti likusių treniruočių!`}
            </p>
          </div>
        )}

        {/* Aktyvus paketas */}
        {hasActive && (
          <div style={{ background:"rgba(127,255,176,0.1)", border:"1.5px solid rgba(127,255,176,0.3)", borderRadius:18, padding:"16px", marginBottom:16 }}>
            <p style={{ fontSize:10, fontWeight:700, color:"#7FFFB0", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 6px", display:"flex", alignItems:"center", gap:5 }}><CheckCircle size={11} />Aktyvus paketas</p>
            <p style={{ fontSize:22, fontWeight:800, color:"#fff", margin:"0 0 6px" }}>{totalRemaining} <span style={{ fontSize:13, fontWeight:400, color:"rgba(255,255,255,0.5)" }}>/ {totalCredits} treniruočių liko</span></p>
            <ProgressBar pct={(totalRemaining/totalCredits)*100} height={6}
              fill="linear-gradient(90deg,#2FBE84,#7FFFB0)" glow="#7FFFB099" />
            {nearestDeadline && (() => {
              const d = daysUntil(nearestDeadline);
              return (
                <p style={{ fontSize:11, color: d <= 7 ? "#FFD700" : "rgba(255,255,255,0.6)", margin:"10px 0 0", display:"flex", alignItems:"center", gap:5 }}>
                  <Timer size={11} />Galioja iki {nearestDeadline} (liko {d} d.)
                </p>
              );
            })()}
          </div>
        )}

        {/* Laukiančios */}
        {pending.map(p => (
          <div key={p.id} style={{ background:"rgba(255,200,0,0.08)", border:"1px solid rgba(255,200,0,0.25)", borderRadius:14, padding:"12px 16px", marginBottom:10 }}>
            <div style={{ marginBottom:12 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>{PACKAGES.find(pk=>pk.type===p.package_type)?.label}</p>
              <p style={{ fontSize:11, color:"#FFD700", margin:0, display:"flex", alignItems:"center", gap:4 }}><Timer size={11} />Laukia patvirtinimo — atlikite apmokėjimą</p>
            </div>
            <PaymentInfo />
          </div>
        ))}

        {/* Paketai */}
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px", display:"flex", alignItems:"center", gap:5 }}><Dumbbell size={12} />Sporto treniruotės</p>
        {PACKAGES.map(pkg => {
          const isPending = pending.some(p => p.package_type === pkg.type);
          return (
            <div key={pkg.type} style={{ background:pkg.popular?"rgba(173,20,87,0.15)":"rgba(255,255,255,0.08)", border:`1.5px solid ${pkg.popular?"rgba(173,20,87,0.4)":"rgba(255,255,255,0.12)"}`, borderRadius:18, padding:"16px", marginBottom:12, position:"relative" }}>
              {pkg.popular && <div style={{ position:"absolute", top:-10, right:16, background:"#AD1457", borderRadius:99, padding:"3px 12px", fontSize:10, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:4 }}><Flame size={11} />{pkg.popularLabel}</div>}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <p style={{ fontSize:16, fontWeight:800, color:"#fff", margin:"0 0 2px", display:"flex", alignItems:"center", gap:6 }}><pkg.Icon size={15} />{pkg.label}</p>
                  <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Galioja {pkg.duration} nuo apmokėjimo</p>
                </div>
                <span style={{ fontSize:20, fontWeight:800, color:"#FF6EB4" }}>{pkg.price}</span>
              </div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.75)", margin:"0 0 8px", lineHeight:1.5, display:"flex", alignItems:"center", gap:6 }}><ChevronRight size={13} />{pkg.tagline}</p>
              {pkg.savings && <p style={{ fontSize:11, color:"#7FFFB0", margin:"0 0 8px", display:"flex", alignItems:"center", gap:5 }}><Coins size={12} />{pkg.savings}</p>}
              <button onClick={()=>!isPending&&!sending&&setRulesFor(pkg)} disabled={isPending||!!sending}
                style={{ width:"100%", marginTop:8, padding:"11px", borderRadius:12, border:"none", background:isPending?"rgba(255,255,255,0.05)":"linear-gradient(135deg,#6D1B3B,#AD1457)", color:isPending?"rgba(255,255,255,0.3)":"#fff", fontSize:13, fontWeight:700, cursor:isPending||sending?"default":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {isPending?<><Timer size={13} />Užklausa išsiųsta</>:<>Rinktis paketą<ChevronRight size={13} /></>}
              </button>
            </div>
          );
        })}

        {/* Mitybos ir Online */}
        {[NUTRITION, ONLINE].map((s,i) => (
          <div key={i} style={{ background:"rgba(255,255,255,0.08)", border:"1.5px solid rgba(255,255,255,0.12)", borderRadius:18, padding:"16px", marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <p style={{ fontSize:15, fontWeight:800, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}><s.Icon size={15} />{s.label}</p>
              <span style={{ fontSize:18, fontWeight:800, color:"#FF6EB4" }}>{s.price}</span>
            </div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.7)", margin:"0 0 8px", lineHeight:1.5, display:"flex", alignItems:"center", gap:6 }}><ChevronRight size={13} />{s.tagline}</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Daugiau info – žiūrėk DUK žemiau</p>
          </div>
        ))}

        {/* Pirmą kartą */}
        <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, padding:"14px 16px", margin:"20px 0 16px", textAlign:"center" }}>
          <Heart size={18} color="rgba(255,255,255,0.85)" style={{ marginBottom:6 }} />
          <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 4px" }}>Pirmą kartą sporto salėje? Nesijaudinkite.</p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.55)", margin:0, lineHeight:1.6 }}>Daugelis mano klienčių pradėjo visiškai be patirties. Visus pratimus išmoksite palaipsniui – nereikia būti pasiruošus ar „geros formos".</p>
        </div>

        {/* DUK */}
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px", display:"flex", alignItems:"center", gap:5 }}><HelpCircle size={12} />Dažnai užduodami klausimai</p>
        {FAQ.map((f,i) => (
          <div key={i} style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, marginBottom:8, overflow:"hidden" }}>
            <button onClick={()=>setOpenInfo(openInfo===i?null:i)} style={{ width:"100%", padding:"13px 16px", background:"transparent", border:"none", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", justifyContent:"space-between", alignItems:"center", textAlign:"left" }}>
              <span style={{ display:"flex", alignItems:"center", gap:8 }}><f.Icon size={14} />{f.q}</span>
              <span style={{ fontSize:12, opacity:0.5, flexShrink:0, marginLeft:8 }}>{openInfo===i?"▲":"▼"}</span>
            </button>
            {openInfo===i && <p style={{ fontSize:12, color:"rgba(255,255,255,0.7)", margin:0, padding:"0 16px 14px", lineHeight:1.7 }}>{f.a}</p>}
          </div>
        ))}

        {/* Apmokejimo info */}
        <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"20px 0 10px", display:"flex", alignItems:"center", gap:5 }}><CreditCard size={12} />Kaip apmokėti</p>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.6)", margin:"0 0 10px", lineHeight:1.5 }}>Išsiuntus užklausą, pervedite sumą į žemiau nurodytą sąskaitą — trenerė patvirtins paketą, gavusi mokėjimą.</p>
        <PaymentInfo />
        <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:"14px 16px", marginTop:10 }}>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.7)", margin:0, lineHeight:1.5, display:"flex", alignItems:"center", gap:6 }}><Mail size={13} />Negavote patvirtinimo? <a href="https://instagram.com/Vilma_Str" target="_blank" rel="noreferrer" style={{ color:"#FF6EB4", fontWeight:700, textDecoration:"underline" }}>@Vilma_Str</a></p>
        </div>
      </div>
    </div>
  );
}