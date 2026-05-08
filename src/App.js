import { useState, useEffect } from "react";

const PK = {
  dark:   "#6D1B3B",
  mid:    "#AD1457",
  bright: "#E91E8C",
  rose:   "#F48FB1",
  blush:  "#F8BBD9",
  light:  "#FCE4EC",
  pale:   "#FFF0F5",
  coral:  "#FFB3C6",
  water:  "#5BB8D4",
};

const ACTIVITY = [
  { id: 1, label: "Sėdimas",       desc: "Biuras, mažai judama",      mult: 1.2   },
  { id: 2, label: "Lengvas",       desc: "1–2 treniruotės / sav.",     mult: 1.375 },
  { id: 3, label: "Vidutinis",     desc: "3–4 treniruotės / sav.",     mult: 1.55  },
  { id: 4, label: "Aktyvus",       desc: "5–6 treniruotės / sav.",     mult: 1.725 },
  { id: 5, label: "Labai aktyvus", desc: "Kasdien + fizinis darbas",   mult: 1.9   },
];

const GOALS = [
  {
    id: "lose",
    label: "Lieknėti",
    adj: -400,
    protPerKg: 2.0,
    fatPct: 0.25,
    tip: "400 kcal deficitas ≈ 0.4 kg per savaitę. Aukštesnė baltymų norma saugo raumenis.",
  },
  {
    id: "maintain",
    label: "Palaikyti svorį",
    adj: 0,
    protPerKg: 1.6,
    fatPct: 0.30,
    tip: "Subalansuotas planas svorio palaikymui. Riebalai padidinti iki 30%.",
  },
  {
    id: "gain",
    label: "Auginti raumenis",
    adj: 300,
    protPerKg: 2.2,
    fatPct: 0.25,
    tip: "300 kcal perteklius – lėtas švarus raumenų augimas be per daug riebalų.",
  },
];

function calcBMR(gender, w, h, a) {
  const base = 10 * w + 6.25 * h - 5 * a;
  return gender === "f" ? base - 161 : base + 5;
}

// ── KOMPONENTAI ────────────────────────────────────────────────────────────

function NumberInput({ label, value, onChange, unit, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: PK.mid, marginBottom: 5,
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            padding: "12px 36px 12px 14px",
            border: `2px solid ${focused ? PK.mid : PK.blush}`,
            borderRadius: 14,
            fontSize: 16,
            color: PK.dark,
            background: PK.pale,
            outline: "none",
            WebkitAppearance: "none",
            transition: "border-color 0.15s",
          }}
        />
        {unit && (
          <span style={{
            position: "absolute", right: 12,
            top: "50%", transform: "translateY(-50%)",
            fontSize: 11, color: PK.rose, fontWeight: 700,
          }}>{unit}</span>
        )}
      </div>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 20,
      padding: "18px 16px",
      border: `1px solid ${PK.blush}`,
      boxShadow: `0 2px 12px rgba(173,20,87,0.07)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: PK.mid, marginBottom: 12,
    }}>{children}</p>
  );
}

function MacroRow({ label, g, kcal, pct, barColor, note }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: PK.dark }}>{label}</span>
        <span style={{ fontSize: 12, color: PK.rose }}>{pct}%</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: barColor }}>{g}g</span>
        <span style={{ fontSize: 12, color: PK.rose }}>{kcal} kcal</span>
      </div>
      <div style={{ background: PK.light, borderRadius: 99, height: 6 }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 99,
          background: `linear-gradient(90deg, ${barColor}, ${PK.bright})`,
          transition: "width 0.6s cubic-bezier(.23,1,.32,1)",
        }} />
      </div>
      {note && <p style={{ margin: "5px 0 0", fontSize: 11, color: PK.rose, lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}

// ── PAGRINDINIS KOMPONENTAS ────────────────────────────────────────────────
export default function App() {
  const [gender, setGender] = useState("f");
  const [age,    setAge]    = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [act,    setAct]    = useState(3);
  const [goal,   setGoal]   = useState("lose");
  const [res,    setRes]    = useState(null);

  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    if (!w || !h || !a || w < 30 || h < 100 || a < 10) {
      setRes(null); return;
    }
    const G    = GOALS.find(g => g.id === goal);
    const mult = ACTIVITY.find(x => x.id === act)?.mult ?? 1.55;
    const bmr  = calcBMR(gender, w, h, a);
    const tdee = bmr * mult;
    const tgt  = Math.max(1200, Math.round(tdee + G.adj));
    const pG   = Math.round(w * G.protPerKg);
    const pK   = pG * 4;
    const fK   = Math.round(tgt * G.fatPct);
    const fG   = Math.round(fK / 9);
    const cK   = Math.max(0, tgt - pK - fK);
    const cG   = Math.round(cK / 4);
    setRes({
      bmr: Math.round(bmr), tdee: Math.round(tdee), tgt,
      prot: { g: pG, kcal: Math.round(pK), pct: Math.round(pK / tgt * 100) },
      fat:  { g: fG, kcal: Math.round(fK), pct: Math.round(fK / tgt * 100) },
      carb: { g: cG, kcal: Math.round(cK), pct: Math.round(cK / tgt * 100) },
      water: (w * 0.033).toFixed(1),
      protNorm: G.protPerKg,
      tip: G.tip, w,
    });
  }, [gender, age, weight, height, act, goal]);

  const btnBase = {
    border: `2px solid ${PK.blush}`,
    borderRadius: 12, cursor: "pointer",
    transition: "all 0.15s", fontSize: 13,
    fontWeight: 700, fontFamily: "inherit",
  };
  const btnActive = { borderColor: PK.mid, background: PK.light, color: PK.dark };
  const btnInactive = { background: "#fff", color: PK.rose };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${PK.pale} 0%, #fff 55%, ${PK.light} 100%)`,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      paddingBottom: 48,
    }}>

      {/* HEADER */}
      <div style={{
        background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`,
        padding: "env(safe-area-inset-top, 16px) 20px 24px",
        paddingTop: `max(env(safe-area-inset-top, 16px), 16px)`,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>💗</div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: "#fff",
          margin: "0 0 4px", letterSpacing: "-0.02em",
        }}>Mitybos skaičiuoklė</h1>
        <p style={{ color: PK.blush, fontSize: 12, margin: 0 }}>
          BMR · TDEE · Makronutrientai
        </p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* LYTIS */}
        <Card style={{ marginTop: 16 }}>
          <SectionTitle>Lytis</SectionTitle>
          <div style={{ display: "flex", gap: 10 }}>
            {[{ id: "f", label: "♀ Moteris" }, { id: "m", label: "♂ Vyras" }].map(g => (
              <button key={g.id} onClick={() => setGender(g.id)}
                style={{ ...btnBase, flex: 1, padding: "11px 0", ...(gender === g.id ? btnActive : btnInactive) }}>
                {g.label}
              </button>
            ))}
          </div>
        </Card>

        {/* DUOMENYS */}
        <Card style={{ marginTop: 12 }}>
          <SectionTitle>Kūno duomenys</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
            <NumberInput label="Amžius" value={age}    onChange={setAge}    unit="m."  placeholder="28" />
            <NumberInput label="Svoris" value={weight} onChange={setWeight} unit="kg"  placeholder="70" />
            <NumberInput label="Ūgis"   value={height} onChange={setHeight} unit="cm"  placeholder="168" />
          </div>
        </Card>

        {/* AKTYVUMAS */}
        <Card style={{ marginTop: 12 }}>
          <SectionTitle>Aktyvumo lygis</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {ACTIVITY.map(a => (
              <button key={a.id} onClick={() => setAct(a.id)}
                style={{
                  ...btnBase,
                  padding: "11px 14px", textAlign: "left",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  ...(act === a.id ? btnActive : btnInactive),
                }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{a.label}</span>
                  <span style={{ fontSize: 11, color: PK.rose, fontWeight: 400 }}>{a.desc}</span>
                </div>
                {act === a.id && (
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: PK.mid,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ color: "#fff", fontSize: 10 }}>✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>

        {/* TIKSLAS */}
        <Card style={{ marginTop: 12 }}>
          <SectionTitle>Tikslas</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)}
                style={{
                  ...btnBase,
                  padding: "13px 8px", textAlign: "center", lineHeight: 1.4,
                  ...(goal === g.id ? btnActive : btnInactive),
                }}>
                {g.label}
              </button>
            ))}
          </div>
        </Card>

        {/* REZULTATAI */}
        {res ? (
          <>
            {/* Kalorijų suvestinė */}
            <div style={{
              background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`,
              borderRadius: 20, padding: 20, marginTop: 14,
              boxShadow: `0 6px 24px rgba(173,20,87,0.3)`,
            }}>
              <p style={{
                fontSize: 14, fontWeight: 700, color: "#fff",
                textAlign: "center", marginBottom: 14,
              }}>✨ Dienos planas</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { l: "BMR",     v: res.bmr,  s: "bazinis" },
                  { l: "TDEE",    v: res.tdee, s: "su aktyvumu" },
                  { l: "TIKSLAS", v: res.tgt,  s: "per dieną" },
                ].map(item => (
                  <div key={item.l} style={{
                    background: "rgba(255,255,255,0.13)",
                    borderRadius: 14, padding: "12px 8px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{item.v}</div>
                    <div style={{ fontSize: 9, color: PK.blush, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{item.l}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{item.s}</div>
                  </div>
                ))}
              </div>

              <div style={{
                background: "rgba(255,255,255,0.1)", borderRadius: 10,
                padding: "10px 12px",
              }}>
                <p style={{ margin: 0, fontSize: 11, color: PK.blush, lineHeight: 1.6, textAlign: "center" }}>
                  💡 {res.tip}
                </p>
              </div>
            </div>

            {/* Makronutrientai */}
            <Card style={{ marginTop: 10 }}>
              <MacroRow
                label="💪 Baltymai"
                g={res.prot.g} kcal={res.prot.kcal} pct={res.prot.pct}
                barColor={PK.mid}
                note={`${res.protNorm}g/kg × ${res.w}kg = ${res.prot.g}g. Saugo raumenis, didina sotumo jausmą.`}
              />
              <MacroRow
                label="🥑 Riebalai"
                g={res.fat.g} kcal={res.fat.kcal} pct={res.fat.pct}
                barColor={PK.bright}
                note="25% kalorijų – minimalus sveikas kiekis hormonams ir vitaminų įsisavinimui."
              />
              <MacroRow
                label="🍚 Angliavandeniai"
                g={res.carb.g} kcal={res.carb.kcal} pct={res.carb.pct}
                barColor={PK.rose}
                note="Likusios kalorijos. Pagrindinis energijos šaltinis treniruotėms."
              />
            </Card>

            {/* Vanduo */}
            <Card style={{
              marginTop: 10,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: PK.dark, marginBottom: 3 }}>
                  💧 Vanduo per dieną
                </p>
                <p style={{ fontSize: 11, color: PK.rose }}>
                  0.033 l × {res.w} kg
                </p>
              </div>
              <span style={{ fontSize: 32, fontWeight: 700, color: PK.water }}>
                {res.water}l
              </span>
            </Card>

            {/* Santrauka */}
            <Card style={{ marginTop: 10 }}>
              <SectionTitle>Santrauka</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
                {[
                  { l: "Kalorijos",       v: res.tgt,      u: "kcal", c: PK.dark   },
                  { l: "Baltymai",        v: res.prot.g,   u: "g",    c: PK.mid    },
                  { l: "Riebalai",        v: res.fat.g,    u: "g",    c: PK.bright },
                  { l: "Angliavandeniai", v: res.carb.g,   u: "g",    c: PK.rose   },
                ].map(item => (
                  <div key={item.l}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: item.c }}>
                      {item.v}<span style={{ fontSize: 11 }}>{item.u}</span>
                    </div>
                    <div style={{ fontSize: 9, color: PK.rose, marginTop: 2 }}>{item.l}</div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <div style={{
            background: PK.pale, borderRadius: 20, padding: "32px 20px",
            marginTop: 16, textAlign: "center",
            border: `2px dashed ${PK.blush}`,
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🌸</div>
            <p style={{ color: PK.rose, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
              Įvesk amžių, svorį ir ūgį
            </p>
            <p style={{ color: PK.blush, fontSize: 12 }}>
              Rezultatai atsiras automatiškai
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
