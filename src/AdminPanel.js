import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { PK, GOALS } from "./constants";
import WorkoutPlanBuilder from "./WorkoutPlanBuilder";

const TRAFFIC_EMOJI = { 1: "🔴", 2: "🟡", 3: "🟢" };
const TRAFFIC_LABEL = { 1: "Blogai", 2: "Vidutiniškai", 3: "Gerai" };

function todayStr() { return new Date().toISOString().split("T")[0]; }

async function adminCreateUser(email, password) {
  const data = await pb.collection("users").create({
    email, password, passwordConfirm: password,
    role: "client", onboarding_done: false, emailVisibility: true,
  });
  if (!data?.id) throw new Error("Klaida kuriant vartotoją");
  return data;
}

// ── Mini kalendorius ──────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, checkinDates }) {
  const [month, setMonth] = useState(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const today = todayStr();
  const firstDay = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: "16px", marginBottom: 16, border: "1px solid rgba(255,255,255,0.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 14 }}>◀</button>
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
          {new Date(month.y, month.m, 1).toLocaleDateString("lt-LT", { month: "long", year: "numeric" })}
        </span>
        <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 12px", color: "#fff", cursor: "pointer", fontSize: 14 }}>▶</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 6 }}>
        {["P","A","T","K","P","Š","S"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.35)", padding: "2px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
        {Array(offset).fill(null).map((_,i) => <div key={"e"+i} />)}
        {Array(daysInMonth).fill(null).map((_,i) => {
          const d = i + 1;
          const dateStr = `${month.y}-${String(month.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const hasCheckin = checkinDates?.includes(dateStr);
          const isFuture = dateStr > today;
          return (
            <button key={d} onClick={() => !isFuture && onSelect(dateStr)}
              style={{
                aspectRatio: "1", borderRadius: 8, border: isSelected ? "2px solid rgba(255,255,255,0.9)" : "1px solid transparent",
                background: isSelected ? "rgba(255,255,255,0.25)" : isToday ? "rgba(255,255,255,0.12)" : "transparent",
                cursor: isFuture ? "default" : "pointer",
                color: isFuture ? "rgba(255,255,255,0.15)" : "#fff",
                fontSize: 12, fontWeight: isSelected || isToday ? 700 : 400, fontFamily: "inherit",
                position: "relative",
              }}>
              {d}
              {hasCheckin && !isSelected && (
                <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#7FFFB0" }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Dienos duomenų vaizdas ─────────────────────────────────────────────────────
function DayView({ clientId, date }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [checkin, sleep, water] = await Promise.all([
        pb.collection("daily_checkins").getList(1, 1, { filter: `user_id="${clientId}" && date="${date}"`, requestKey: null })
          .then(r => r.items[0] || null).catch(() => null),
        pb.collection("sleep_log").getList(1, 1, { filter: `user_id="${clientId}" && date="${date}"`, requestKey: null })
          .then(r => r.items[0] || null).catch(() => null),
        pb.collection("water_log").getList(1, 1, { filter: `user_id="${clientId}" && date="${date}"`, requestKey: null })
          .then(r => r.items[0] || null).catch(() => null),
      ]);
      setData({ checkin, sleep, water });
      setLoading(false);
    }
    load();
  }, [clientId, date]);

  const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("lt-LT", { weekday: "long", month: "long", day: "numeric" });

  if (loading) return <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Kraunama...</p>;

  const { checkin, sleep, water } = data;
  const hasAny = checkin || sleep || water;

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 16, padding: "16px" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", margin: "0 0 12px" }}>
        {fmtDate(date)}
      </p>

      {!hasAny && (
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "12px 0" }}>Šiai dienai duomenų nėra</p>
      )}

      {checkin && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 8px", fontWeight: 600 }}>📋 Check-in</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{TRAFFIC_EMOJI[checkin.nutrition_score] || "–"}</div>
              <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{TRAFFIC_LABEL[checkin.nutrition_score] || "–"}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Mityba</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{TRAFFIC_EMOJI[checkin.wellbeing_score] || "–"}</div>
              <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{TRAFFIC_LABEL[checkin.wellbeing_score] || "–"}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Savijauta</div>
            </div>
          </div>
        </div>
      )}

      {sleep && (
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>😴 Miegas</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{sleep.hours_slept}h</span>
        </div>
      )}

      {water && (
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>💧 Vanduo</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{water.ml} / {water.goal} ml</span>
        </div>
      )}

      {/* Trumpa išvada */}
      {hasAny && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 10, borderLeft: "3px solid rgba(255,255,255,0.3)" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>
            {(() => {
              const parts = [];
              if (checkin?.nutrition_score === 3) parts.push("Mityba gerai ✅");
              else if (checkin?.nutrition_score === 1) parts.push("Mityba prasta, reikia aptarti 🔴");
              else if (checkin?.nutrition_score === 2) parts.push("Mityba vidutiniškai 🟡");
              if (checkin?.wellbeing_score === 3) parts.push("Savijauta puiki 💚");
              else if (checkin?.wellbeing_score === 1) parts.push("Savijauta bloga 🔴");
              else if (checkin?.wellbeing_score === 2) parts.push("Savijauta vidutinė 🟡");
              if (sleep?.hours_slept >= 7) parts.push(`Miegas pakankamas (${sleep.hours_slept}h)`);
              else if (sleep?.hours_slept) parts.push(`Miegas per mažas (${sleep.hours_slept}h) ⚠️`);
              if (water?.ml >= (water?.goal || 2000)) parts.push("Vanduo išgertas ✅");
              else if (water?.ml) parts.push(`Vanduo: ${Math.round(water.ml / (water.goal || 2000) * 100)}% normos`);
              return parts.length ? parts.join(" · ") : "Duomenys surinkti.";
            })()}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Kliento kortelė (sąraše) ──────────────────────────────────────────────────
function ClientCard({ client, onOpen }) {
  return (
    <button onClick={onOpen} style={{
      width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 16, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit",
      textAlign: "left", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6D1B3B,#AD1457)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {client.name?.charAt(0) || "?"}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>{client.name}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>{GOALS.find(g => g.id === client.goal)?.label || "–"}</p>
        </div>
      </div>
      <span style={{ fontSize: 18, color: "rgba(255,255,255,0.4)" }}>→</span>
    </button>
  );
}

// ── Plano dienos pratimai (admin peržiūra) ────────────────────────────────────
function PlanDayExercises({ dayId }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    pb.collection("workout_plan_exercises").getFullList({ filter: `day_id="${dayId}"`, sort: "order", requestKey: null })
      .then(data => { setExercises(data); setLoading(false); }).catch(() => setLoading(false));
  }, [dayId]);

  if (loading) return <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:"8px 0 0" }}>Kraunama...</p>;
  if (!exercises.length) return <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:"8px 0 0" }}>Pratimų nėra</p>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:4 }}>
      {exercises.map((ex, i) => (
        <div key={ex.id} style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"10px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ fontSize:12, fontWeight:700, color:"#fff", margin:"0 0 2px" }}>{i+1}. {ex.exercise_name}</p>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0 }}>
              {ex.category==="cardio" ? `⏱ ${ex.duration_min||"–"} min` : `${ex.sets||"–"} × ${ex.reps||"–"}${ex.weight_kg ? ` · ${ex.weight_kg} kg` : ""}`}
            </p>
          </div>
          <span style={{ fontSize:10, color:ex.category==="cardio"?"#89CFF0":"#FFB3C6", background:"rgba(255,255,255,0.08)", padding:"2px 8px", borderRadius:6 }}>{ex.muscle}</span>
        </div>
      ))}
    </div>
  );
}

// ── Kliento profilis su kalendoriumi ─────────────────────────────────────────
function ClientDetail({ client, onClose }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [checkinDates, setCheckinDates] = useState([]);
  const [showPlanBuilder, setShowPlanBuilder] = useState(false);
  const [activePlan, setActivePlan]     = useState(null);
  const [planDays, setPlanDays]         = useState([]);
  const [activePlanDay, setActivePlanDay] = useState(null);

  useEffect(() => {
    pb.collection("daily_checkins").getFullList({
      filter: `user_id="${client.id}" && is_done=true`, fields: "date", requestKey: null,
    }).then(items => setCheckinDates(items.map(i => i.date))).catch(() => {});

    // Krauti aktyvų planą
    pb.collection("workout_plans").getList(1, 1, {
      filter: `user_id="${client.id}" && is_active=true`, sort: "-created", requestKey: null,
    }).then(r => {
      const p = r.items[0] || null;
      setActivePlan(p);
      if (p) {
        pb.collection("workout_plan_days").getFullList({ filter: `plan_id="${p.id}"`, sort: "day_number", requestKey: null })
          .then(setPlanDays).catch(()=>{});
      }
    }).catch(() => {});
  }, [client.id]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY: "auto", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {showPlanBuilder && (
        <WorkoutPlanBuilder client={client} onClose={()=>setShowPlanBuilder(false)} onSaved={()=>setShowPlanBuilder(false)} />
      )}
      {/* Header */}
      <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 14, cursor: "pointer" }}>← Atgal</button>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{client.name}</h1>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{client.email}</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
        {/* Sporto planas */}
        {activePlan ? (
          <div style={{ marginBottom: 16, background: "rgba(26,71,49,0.5)", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(127,255,176,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#7FFFB0", margin: "0 0 2px" }}>🏋️ {activePlan.plan_name}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Galioja iki {activePlan.valid_until} · {activePlan.days_count} d./sav.</p>
              </div>
              <button onClick={() => setShowPlanBuilder(true)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>+ Naujas</button>
            </div>
            {/* Dienų tab'ai */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 2 }}>
              {planDays.map(d => (
                <button key={d.id} onClick={() => setActivePlanDay(p => p?.id === d.id ? null : d)}
                  style={{ padding: "6px 12px", borderRadius: 20, border: "none", background: activePlanDay?.id === d.id ? "#276749" : "rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>
                  {d.day_name}
                </button>
              ))}
            </div>
            {/* Pratimai pasirinktai dienai */}
            {activePlanDay && <PlanDayExercises dayId={activePlanDay.id} />}
          </div>
        ) : (
          <button onClick={() => setShowPlanBuilder(true)} style={{ width: "100%", padding: "14px", marginBottom: 16, background: "linear-gradient(135deg,#1a4731,#276749)", color: "#fff", border: "none", borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            🏋️ Sudaryti sporto planą
          </button>
        )}

        {/* Kalendorius */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>Pasirinkite dieną</p>
        <MiniCalendar
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          checkinDates={checkinDates}
        />

        {/* Dienos duomenys */}
        <DayView clientId={client.id} date={selectedDate} />
      </div>
    </div>
  );
}

// ── Naujas klientas forma ──────────────────────────────────────────────────────
function NewClientForm({ onSave, onCancel }) {
  const [form,   setForm]   = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = k => v => setForm(f => ({...f, [k]: v}));

  async function handleSave() {
    if (!form.name || !form.email || !form.password) { setError("Visi laukai privalomi."); return; }
    if (form.password.length < 6) { setError("Slaptažodis min. 6 simboliai."); return; }
    setSaving(true);
    try {
      const newUser = await adminCreateUser(form.email, form.password);
      await pb.collection("users").update(newUser.id, { name: form.name });
      onSave();
    } catch(e) {
      setError(e?.response?.data?.email?.message || e.message || "Klaida");
    }
    setSaving(false);
  }

  const inp = { width: "100%", padding: "12px 14px", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 12, fontSize: 14, color: "#fff", background: "rgba(255,255,255,0.07)", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div>
      {["name","email","password"].map(k => (
        <div key={k} style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", display: "block", marginBottom: 5 }}>
            {k === "name" ? "Vardas Pavardė" : k === "email" ? "El. paštas" : "Slaptažodis"}
          </label>
          <input type={k === "password" ? "password" : "text"} value={form[k]}
            onChange={e => set(k)(e.target.value)}
            style={inp} />
        </div>
      ))}
      {error && <p style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 10 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Atšaukti</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: 12, background: "linear-gradient(135deg,#6D1B3B,#AD1457)", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Kuriama..." : "Sukurti klientą"}
        </button>
      </div>
    </div>
  );
}

// ── Pagrindinis Admin komponentas ─────────────────────────────────────────────
export default function AdminPanel({ user, onLogout }) {
  const [clients,     setClients]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [view,        setView]        = useState("list"); // list | new
  const [openClient,  setOpenClient]  = useState(null);

  const loadClients = useCallback(async () => {
    const data = await pb.collection("users").getFullList({ filter: 'role="client"', sort: "-created", requestKey: null });
    setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  if (openClient) return <ClientDetail client={openClient} onClose={() => setOpenClient(null)} />;

  if (view === "new") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom: 48 }}>
      <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setView("list")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 14, cursor: "pointer" }}>← Atgal</button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>Naujas klientas</h1>
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
        <NewClientForm onSave={() => { setView("list"); loadClients(); }} onCancel={() => setView("list")} />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom: 48 }}>
      <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "16px 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="Coach Vilma" style={{ width: 38, height: 38, objectFit: "contain", borderRadius: 8 }} />
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>Admin panelė</h1>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Atsijungti</button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { v: clients.length, l: "Klientai iš viso", bg: "linear-gradient(135deg,#6D1B3B,#AD1457)", c: "#fff" },
            { v: clients.filter(c => c.onboarding_done).length, l: "Anketa baigta", bg: "rgba(255,255,255,0.08)", c: "#fff" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 14, padding: "14px 10px", textAlign: "center", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setView("new")} style={{ width: "100%", padding: "14px 0", marginBottom: 16, background: "linear-gradient(135deg,#6D1B3B,#AD1457)", color: "#fff", border: "none", borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          + Naujas klientas
        </button>

        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)", marginBottom: 10 }}>Klientai</p>

        {loading ? (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", padding: "24px 0" }}>Kraunama...</p>
        ) : clients.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: "32px 20px", textAlign: "center", border: "2px dashed rgba(255,255,255,0.2)" }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Dar nėra klientų</p>
          </div>
        ) : clients.map(client => (
          <ClientCard key={client.id} client={client} onOpen={() => setOpenClient(client)} />
        ))}
      </div>
    </div>
  );
}
