import { useState } from "react";
import { pb } from "./pb";
import { PK } from "./constants";
import { HealthQuestions } from "./Onboarding";
import { Heart, Check } from "./ui/icons";

// Vienkartinis papildomas ekranas jau užsiregistravusiems klientams, kurie
// registravosi anksčiau, nei registracijos anketoje atsirado sveikatos
// klausimynas — kad ir jų duomenys pasipildytų sistemoje. Naujiems klientams
// šito nereikia, nes jie sveikatos klausimus jau pildo per Onboarding.js.
export default function HealthUpdatePrompt({ user, profile, onComplete }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    gender: profile?.gender || "f",
    health_pain_yn: null,
    health_recent_pain: "",
    health_injury_yn: null,
    health_recent_injury: "",
    health_bp_yn: null,
    health_high_bp: "",
    health_migraine: null,
    health_allergies: null,
    health_allergies_detail: "",
    health_varicose: null,
    health_hernia: null,
    health_autoimmune: null,
    health_autoimmune_detail: "",
    health_torn_ligaments: null,
    health_pregnant: null,
  });

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  async function handleSave() {
    setSaving(true); setError("");
    try {
      await pb.collection("users").update(user.id, {
        health_pain_yn:          form.health_pain_yn,
        health_recent_pain:      form.health_pain_yn ? form.health_recent_pain : "",
        health_injury_yn:        form.health_injury_yn,
        health_recent_injury:    form.health_injury_yn ? form.health_recent_injury : "",
        health_bp_yn:            form.health_bp_yn,
        health_high_bp:          form.health_bp_yn ? form.health_high_bp : "",
        health_migraine:         form.health_migraine,
        health_allergies:        form.health_allergies,
        health_allergies_detail: form.health_allergies ? form.health_allergies_detail : "",
        health_varicose:         form.health_varicose,
        health_hernia:           form.health_hernia,
        health_autoimmune:          form.health_autoimmune,
        health_autoimmune_detail:   form.health_autoimmune ? form.health_autoimmune_detail : "",
        health_torn_ligaments:   form.health_torn_ligaments,
        health_pregnant:         form.health_pregnant,
        health_survey_done: true,
      });
      onComplete();
    } catch(e) {
      setError("Klaida išsaugant: " + (e.message || JSON.stringify(e)));
    }
    setSaving(false);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ background:"linear-gradient(135deg,#6D1B3B,#AD1457)", padding:"20px 20px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <img src="/logo.png" alt="Coach Vilma" style={{ width:40, height:40, objectFit:"contain", borderRadius:10 }} />
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:17, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}><Heart size={16} />Sveikatos anketa</h1>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>Papildomi klausimai — užtruks ~1 min.</p>
          </div>
          <button onClick={()=>pb.authStore.clear()&&window.location.reload()} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:8, padding:"6px 12px", color:"rgba(255,255,255,0.7)", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>Išeiti</button>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"20px 20px 100px" }}>
        <p style={{ fontSize:12, color:"rgba(255,255,255,0.55)", margin:"0 0 20px", lineHeight:1.5 }}>
          Pridėjome kelis naujus sveikatos klausimus, kad trenerė galėtų saugiau planuoti tavo treniruotes. Užpildyk vieną kartą — kitą kartą šito ekrano nebematysi.
        </p>

        <HealthQuestions form={form} set={set} />

        {error && (
          <div style={{ background:"#FFF0F5", border:"1px solid "+PK.coral, borderRadius:12, padding:"12px 14px", fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:16 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(255,255,255,0.07)", borderTop:"1px solid rgba(255,255,255,0.1)", padding:"12px 20px", paddingBottom:"max(12px, env(safe-area-inset-bottom))", maxWidth:480, margin:"0 auto" }}>
        <button onClick={handleSave} disabled={saving} style={{
          width:"100%", padding:"14px 0", border:"none", borderRadius:14,
          background:"linear-gradient(135deg,#6D1B3B,#AD1457)", color:"#fff",
          fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          opacity:saving?0.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}>{saving ? "Saugoma..." : <><Check size={14} />Baigti</>}</button>
      </div>
    </div>
  );
}
