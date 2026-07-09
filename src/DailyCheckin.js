import { useState, useEffect, useCallback } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";

function todayStr() { return new Date().toISOString().split("T")[0]; }

const TRAFFIC = [
  { v: 1, label: "Blogai",       c1: "#FF7A6E", c2: "#E14A45" },
  { v: 2, label: "Vidutiniškai", c1: "#FFC15E", c2: "#F2A63D" },
  { v: 3, label: "Gerai",        c1: "#5CE3A6", c2: "#2FBE84" },
];

function Orb({ c1, c2, size, glow }) {
  return (
    <span style={{
      display: "block", width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 34% 28%, ${c1}, ${c2})`,
      boxShadow: glow ? `0 0 0 4px ${c1}22, 0 2px 10px ${c1}77` : `0 1px 4px ${c1}44`,
    }} />
  );
}

function TrafficLight({ value, onChange, disabled }) {
  const idx = TRAFFIC.findIndex(t => t.v === value);
  return (
    <div>
      <div style={{ position: "relative", height: 3, borderRadius: 99, margin: "0 15px 14px", background: "linear-gradient(90deg,#FF7A6E,#FFC15E,#5CE3A6)", opacity: 0.3 }}>
        {idx >= 0 && (
          <div style={{
            position: "absolute", top: "50%", left: `${idx * 50}%`, transform: "translate(-50%,-50%)",
            width: 9, height: 9, borderRadius: "50%", background: TRAFFIC[idx].c1,
            boxShadow: `0 0 8px 2px ${TRAFFIC[idx].c1}aa`, transition: "left 0.25s ease",
          }} />
        )}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {TRAFFIC.map(t => {
          const active = value === t.v;
          return (
            <button key={t.v} onClick={() => !disabled && onChange(t.v)} style={{
              flex: 1, padding: "13px 8px", borderRadius: 16,
              border: `1.5px solid ${active ? t.c1 : "rgba(255,255,255,0.12)"}`,
              background: active ? `linear-gradient(160deg, ${t.c1}29, ${t.c1}0d)` : "rgba(255,255,255,0.05)",
              cursor: disabled ? "default" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              transition: "all 0.18s ease",
              opacity: disabled && !active ? 0.4 : 1,
              transform: active ? "translateY(-1px)" : "none",
            }}>
              <Orb c1={t.c1} c2={t.c2} size={22} glow={active} />
              <span style={{ fontSize: 11, color: active ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: active ? 700 : 500 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DailyCheckin({ userId, date, onSaved }) {
  const currentDate = date || todayStr();
  const isToday = currentDate === todayStr();

  const [checkin,   setCheckin]   = useState(null);
  const [loaded,    setLoaded]    = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [nutrition, setNutrition] = useState(null);
  const [wellbeing, setWellbeing] = useState(null);

  const load = useCallback(async () => {
    const data = await pbFirst("daily_checkins", `user_id="${userId}" && date="${currentDate}"`);
    setCheckin(data || null);
    if (data) {
      setNutrition(data.nutrition_score);
      setWellbeing(data.wellbeing_score);
    } else {
      setNutrition(null);
      setWellbeing(null);
    }
    setLoaded(true);
  }, [userId, currentDate]);

  useEffect(() => { load(); }, [load]);

  const isDone = checkin?.is_done === true || checkin?.is_done === "true";
  const canSave = isToday && !isDone && nutrition && wellbeing;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    await pbUpsert("daily_checkins", `user_id="${userId}" && date="${currentDate}"`, {
      user_id:         userId,
      date:            currentDate,
      nutrition_score: nutrition,
      wellbeing_score: wellbeing,
      is_done:         true,
      done_at:         new Date().toISOString(),
    });
    await load();
    setSaving(false);
    onSaved?.();
  }

  if (!loaded) return null;

  // Sutrauktas vaizdas kai užpildyta
  if (isDone) {
    return (
      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>📋 Check-in</span>
          {(() => { const t = TRAFFIC.find(x => x.v === checkin.nutrition_score); return t ? <Orb c1={t.c1} c2={t.c2} size={13} /> : null; })()}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Mityba</span>
          {(() => { const t = TRAFFIC.find(x => x.v === checkin.wellbeing_score); return t ? <Orb c1={t.c1} c2={t.c2} size={13} /> : null; })()}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Savijauta</span>
        </div>
        <span style={{ fontSize: 11, background: "rgba(127,255,176,0.2)", color: "#7FFFB0", borderRadius: 8, padding: "3px 10px" }}>✓</span>
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: 18, marginBottom: 12 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>📋 Dienos check-in</p>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600, margin: "0 0 8px" }}>🥗 Kaip sekėsi su mityba šiandien?</p>
        <TrafficLight value={nutrition} onChange={setNutrition} disabled={!isToday} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 600, margin: "0 0 8px" }}>💚 Kokia šiandien savijauta?</p>
        <TrafficLight value={wellbeing} onChange={setWellbeing} disabled={!isToday} />
      </div>

      {isToday && (
        <button onClick={handleSave} disabled={!canSave || saving} style={{
          width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
          background: canSave ? "linear-gradient(135deg,#6D1B3B,#AD1457)" : "rgba(255,255,255,0.1)",
          color: canSave ? "#fff" : "rgba(255,255,255,0.3)",
          fontSize: 15, fontWeight: 700, cursor: canSave ? "pointer" : "default",
          fontFamily: "inherit", transition: "all 0.2s",
        }}>
          {saving ? "Saugoma..." : "💾 Išsaugoti"}
        </button>
      )}

      {!isToday && (
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textAlign: "center", margin: 0 }}>Ši diena jau praėjo</p>
      )}
    </div>
  );
}
