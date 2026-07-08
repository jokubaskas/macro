import { useState } from "react";
import { PK } from "./constants";

const MEAL_NAMES = {
  breakfast: "pusryčius",
  lunch:     "pietus",
  dinner:    "vakarienę",
  snack:     "užkandį",
};

const MEAL_CONTEXT = {
  breakfast: "Pusryčiai – rytinis valgymas. Tinka: kiaušiniai, avižos, varškė, vaisiai.",
  lunch:     "Pietūs – pagrindinis dienos valgymas. Tinka: mėsa/žuvis su garnyru ir daržovėmis.",
  dinner:    "Vakarienė – lengvesnis vakaro valgymas. Tinka: baltyminiai patiekalai, salotos.",
  snack:     "Užkandis – greitas tarpinis valgymas. Tinka: riešutai, vaisiai, varškė, jogurtas.",
};

async function fetchRecipe(mealId, remaining) {
  const isEmpty = remaining.kcal < 50;
  const isLow   = remaining.kcal < 300;

  const prompt = isEmpty
    ? `Dienos kalorijos jau surinktos. Pasiūlyk labai lengvą užkandį iki 100 kcal ${MEAL_NAMES[mealId]}.`
    : `Esi mitybos ekspertas ir virėjas. Pasiūlyk VIENĄ konkretų receptą ${MEAL_NAMES[mealId]}.

Likusios dienos makros:
• Kalorijos: ~${Math.round(remaining.kcal)} kcal
• Baltymai: ~${Math.round(remaining.protein)} g
• Riebalai: ~${Math.round(remaining.fat)} g  
• Angliavandeniai: ~${Math.round(remaining.carbs)} g

${isLow ? "SVARBU: liko mažai kalorijų – pasiūlyk lengvą, mažą porciją." : ""}
Kontekstas: ${MEAL_CONTEXT[mealId]}

Receptas PRIVALO:
• Tiksliai atitikti likusias makras (±20%)
• Būti pagaminamas per 30 min.
• Naudoti ingredientus iš Lietuvos parduotuvių
• Porcija – 1 asmeniui

Atsakyk TIK JSON, be jokio papildomo teksto:
{
  "name": "Recepto pavadinimas lietuviškai",
  "emoji": "vienas emoji",
  "time": "X min.",
  "difficulty": "Lengva / Vidutinė",
  "ingredients": [
    { "name": "Ingredientas", "amount": "150 g" }
  ],
  "steps": [
    "1 žingsnis.",
    "2 žingsnis."
  ],
  "macros": { "kcal": 0, "protein": 0, "fat": 0, "carbs": 0 },
  "tip": "Trumpas patarimas arba variacija"
}`;

  // Kviesti per Netlify Function (apeina CORS)
  const res = await fetch("/api/recipe", {
    method:  "POST",
    headers: { "Content-Type":"application/json" },
    body:    JSON.stringify({ prompt }),
  });

  const raw = await res.text();
  if (!raw || raw.trim() === "") {
    throw new Error("HTTP " + res.status + ": tuščias atsakymas. Patikrink Netlify → Functions logs.");
  }

  let data;
  try { data = JSON.parse(raw); }
  catch(e) { throw new Error("HTTP " + res.status + " – ne JSON: " + raw.substring(0, 100)); }

  if (!res.ok) throw new Error(data?.error || "Klaida " + res.status);

  const text = data.content?.[0]?.text || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Neteisingas atsakymo formatas");
  return JSON.parse(match[0]);
}

// ── Makro juosta ──────────────────────────────────────────────────────────────
function MacroBar({ label, value, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round(value / target * 100)) : 0;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
        <span style={{ fontSize:10, color:PK.rose }}>{label}</span>
        <span style={{ fontSize:10, color:PK.dark, fontWeight:700 }}>{value}g / {target}g</span>
      </div>
      <div style={{ background:PK.light, borderRadius:99, height:4 }}>
        <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:color, transition:"width 0.5s" }} />
      </div>
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function RecipeSuggestion({ mealId, remaining, res, onClose }) {
  const [loading,  setLoading]  = useState(false);
  const [recipe,   setRecipe]   = useState(null);
  const [error,    setError]    = useState(null);
  const [step,     setStep]     = useState("intro"); // intro | loading | result | error

  async function handleGenerate() {
    setStep("loading");
    setLoading(true);
    setError(null);
    try {
      const r = await fetchRecipe(mealId, remaining);
      setRecipe(r);
      setStep("result");
    } catch(e) {
      setError(e.message);
      setStep("error");
    }
    setLoading(false);
  }

  const mealLabel = { breakfast:"Pusryčiai 🌅", lunch:"Pietūs ☀️", dinner:"Vakarienė 🌙", snack:"Užkandis 🍎" }[mealId];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"flex-end", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width:"100%", maxHeight:"90vh", background:"#fff", borderRadius:"22px 22px 0 0", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div>
            <h3 style={{ color:"#fff", margin:"0 0 2px", fontSize:16, fontWeight:700 }}>💡 Recepto pasiūlymas</h3>
            <p style={{ color:PK.blush, margin:0, fontSize:11 }}>{mealLabel}</p>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 12px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"20px 20px 32px", WebkitOverflowScrolling:"touch" }}>

          {/* ── Likusios makros ── */}
          <div style={{ background:PK.pale, borderRadius:16, padding:"14px 16px", marginBottom:16, border:"1px solid "+PK.blush }}>
            <p style={{ fontSize:11, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 12px" }}>
              Liko surinkti šiandien
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:12 }}>
              {[
                { l:"Kalorijos", v:Math.round(remaining.kcal),    u:"kcal", c:PK.dark   },
                { l:"Baltymai",  v:Math.round(remaining.protein),  u:"g",    c:PK.mid    },
                { l:"Riebalai",  v:Math.round(remaining.fat),      u:"g",    c:"#E91E8C" },
                { l:"Angliavandeniai", v:Math.round(remaining.carbs), u:"g", c:PK.rose  },
              ].map(m => (
                <div key={m.l} style={{ background:"#fff", borderRadius:10, padding:"8px 4px", textAlign:"center", border:"1px solid "+PK.blush }}>
                  <div style={{ fontSize:14, fontWeight:700, color: m.v<=0?"#ccc":m.c }}>{Math.max(0,m.v)}<span style={{ fontSize:9 }}>{m.u}</span></div>
                  <div style={{ fontSize:8, color:PK.rose, marginTop:1 }}>{m.l}</div>
                </div>
              ))}
            </div>
            {remaining.kcal <= 0 && (
              <p style={{ fontSize:11, color:PK.mid, margin:0, textAlign:"center", fontWeight:600 }}>
                ✅ Dienos kalorijos jau surinktos – pasiūlysime lengvą užkandį
              </p>
            )}
          </div>

          {/* ── Intro ── */}
          {step === "intro" && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:64, marginBottom:16 }}>🍳</div>
              <h3 style={{ fontSize:18, fontWeight:700, color:PK.dark, marginBottom:8 }}>
                Ką gaminti {mealLabel.toLowerCase()}?
              </h3>
              <p style={{ fontSize:13, color:PK.rose, marginBottom:24, lineHeight:1.6 }}>
                Dirbtinis intelektas peržiūrės, kiek makronutrientų liko surinkti, ir pasiūlys konkretų receptą su ingredientais ir žingsniais.
              </p>
              <button onClick={handleGenerate} style={{
                padding:"14px 32px", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")",
                color:"#fff", border:"none", borderRadius:16, fontSize:15, fontWeight:700,
                cursor:"pointer", fontFamily:"inherit", width:"100%",
              }}>
                ✨ Gauti pasiūlymą
              </button>
            </div>
          )}

          {/* ── Kraunama ── */}
          {step === "loading" && (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ fontSize:48, marginBottom:16, animation:"spin 2s linear infinite", display:"inline-block" }}>🍳</div>
              <h3 style={{ fontSize:16, fontWeight:700, color:PK.dark, marginBottom:8 }}>
                Galvoja, ką pasiūlyti...
              </h3>
              <p style={{ fontSize:12, color:PK.rose, lineHeight:1.6 }}>
                Analizuojamos likusios makros ir ieškomas tinkamiausias receptas
              </p>
              <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
            </div>
          )}

          {/* ── Klaida ── */}
          {step === "error" && (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>😕</div>
              <p style={{ color:PK.mid, fontSize:14, marginBottom:8, fontWeight:600 }}>Nepavyko gauti pasiūlymo</p>
              <p style={{ color:PK.rose, fontSize:12, marginBottom:20 }}>{error}</p>

              <button onClick={handleGenerate} style={{ padding:"12px 24px", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                🔄 Bandyti dar kartą
              </button>
            </div>
          )}

          {/* ── Rezultatas ── */}
          {step === "result" && recipe && (
            <div>
              {/* Recepto antraštė */}
              <div style={{ textAlign:"center", marginBottom:18 }}>
                <div style={{ fontSize:56, marginBottom:8 }}>{recipe.emoji || "🍽️"}</div>
                <h2 style={{ fontSize:20, fontWeight:700, color:PK.dark, margin:"0 0 6px" }}>{recipe.name}</h2>
                <div style={{ display:"flex", justifyContent:"center", gap:12 }}>
                  <span style={{ fontSize:12, color:PK.rose }}>⏱ {recipe.time}</span>
                  <span style={{ fontSize:12, color:PK.rose }}>👩‍🍳 {recipe.difficulty}</span>
                </div>
              </div>

              {/* Makro palyginimas */}
              <div style={{ background:PK.pale, borderRadius:14, padding:"14px 16px", marginBottom:16, border:"1px solid "+PK.blush }}>
                <p style={{ fontSize:11, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px" }}>
                  Recepto makronutrientai
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                  {[
                    { l:"Kalorijos", v:recipe.macros?.kcal,    t:Math.round(remaining.kcal),    u:"kcal", c:PK.dark   },
                    { l:"Baltymai",  v:recipe.macros?.protein,  t:Math.round(remaining.protein),  u:"g",    c:PK.mid    },
                    { l:"Riebalai",  v:recipe.macros?.fat,      t:Math.round(remaining.fat),      u:"g",    c:"#E91E8C" },
                    { l:"Angliavandeniai", v:recipe.macros?.carbs, t:Math.round(remaining.carbs), u:"g",   c:PK.rose  },
                  ].map(m => {
                    const match = m.t > 0 ? Math.abs(m.v - m.t) / m.t < 0.25 : true;
                    return (
                      <div key={m.l} style={{ background:"#fff", borderRadius:10, padding:"8px 4px", textAlign:"center", border:"1px solid "+(match?PK.blush:"#FED7D7") }}>
                        <div style={{ fontSize:14, fontWeight:700, color:m.c }}>{m.v}<span style={{ fontSize:9 }}>{m.u}</span></div>
                        <div style={{ fontSize:8, color:PK.rose, marginTop:1 }}>{m.l}</div>
                        <div style={{ fontSize:9, marginTop:2 }}>{match?"✅":"⚠️"}</div>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize:10, color:PK.rose, margin:0, textAlign:"center" }}>
                  ✅ = atitinka likusias makros ±25%
                </p>
              </div>

              {/* Ingredientai */}
              <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", marginBottom:12, border:"1px solid "+PK.blush }}>
                <p style={{ fontSize:12, fontWeight:700, color:PK.dark, margin:"0 0 12px" }}>🛒 Ingredientai</p>
                {recipe.ingredients?.map((ing, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom: i < recipe.ingredients.length-1 ? "1px solid "+PK.light : "none" }}>
                    <span style={{ fontSize:13, color:PK.dark }}>{ing.name}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:PK.mid, background:PK.pale, borderRadius:8, padding:"2px 8px" }}>{ing.amount}</span>
                  </div>
                ))}
              </div>

              {/* Žingsniai */}
              <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", marginBottom:12, border:"1px solid "+PK.blush }}>
                <p style={{ fontSize:12, fontWeight:700, color:PK.dark, margin:"0 0 12px" }}>👩‍🍳 Gaminimo žingsniai</p>
                {recipe.steps?.map((step, i) => (
                  <div key={i} style={{ display:"flex", gap:12, marginBottom: i < recipe.steps.length-1 ? 12 : 0, alignItems:"flex-start" }}>
                    <div style={{ width:24, height:24, borderRadius:"50%", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{i+1}</span>
                    </div>
                    <p style={{ fontSize:13, color:PK.dark, margin:0, lineHeight:1.55, flex:1 }}>{step.replace(/^\d+\.\s*/, "")}</p>
                  </div>
                ))}
              </div>

              {/* Patarimas */}
              {recipe.tip && (
                <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:14, padding:"12px 14px", marginBottom:16 }}>
                  <p style={{ fontSize:12, color:PK.blush, margin:0, lineHeight:1.5 }}>
                    💡 {recipe.tip}
                  </p>
                </div>
              )}

              {/* Mygtukai */}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleGenerate} style={{ flex:1, padding:"12px 0", border:"2px solid "+PK.blush, borderRadius:14, background:"#fff", color:PK.mid, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  🔄 Kitas pasiūlymas
                </button>
                <button onClick={onClose} style={{ flex:1, padding:"12px 0", border:"none", borderRadius:14, background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  ✓ Gerai, ačiū!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
