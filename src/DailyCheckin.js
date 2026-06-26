import { useState, useEffect, useCallback } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";

function todayStr() { return new Date().toISOString().split("T")[0]; }

const TRAFFIC = [
  { v: 1, emoji: "🔴", label: "Blogai",       bg: "rgba(220,50,50,0.25)",  border: "rgba(220,50,50,0.7)" },
  { v: 2, emoji: "🟡", label: "Vidutiniškai", bg: "rgba(220,180,0,0.25)",  border: "rgba(220,180,0,0.7)" },
  { v: 3, emoji: "🟢", label: "Gerai",        bg: "rgba(50,200,100,0.25)", border: "rgba(50,200,100,0.7)" },
];

function TrafficLight({ value, onChange, disabled }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {TRAFFIC.map(t => (
        <button key={t.v} onClick={() => !disabled && onChange(t.v)} style={{
          flex: 1, padding: "14px 8px", borderRadius: 14,
          border: `2px solid ${value === t.v ? t.border : "rgba(255,255,255,0.15)"}`,
          background: value === t.v ? t.bg : "rgba(255,255,255,0.05)",
          cursor: disabled ? "default" : "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          transition: "all 0.15s",
          opacity: disabled && value !== t.v ? 0.4 : 1,
        }}>
          <span style={{ fontSize: 28 }}>{t.emoji}</span>
          <span style={{ fontSize: 11, color: "#fff", fontWeight: value === t.v ? 700 : 400 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

const E = { 1: "🔴", 2: "🟡", 3: "🟢" };

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
          <span style={{ fontSize: 18 }}>{E[checkin.nutrition_score]}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Mityba</span>
          <span style={{ fontSize: 18 }}>{E[checkin.wellbeing_score]}</span>
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
