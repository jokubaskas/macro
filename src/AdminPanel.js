import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { PK, GOALS, daysUntilBirthday } from "./constants";
import WorkoutPlanBuilder from "./WorkoutPlanBuilder";
import BookingAdmin from "./BookingAdmin";
import TrainerStats from "./TrainerStats";
import ProgressCompare from "./ProgressCompare";
import PushPermissionPrompt from "./PushNotifications";
import StreakBadge from "./StreakBadge";
import WorkoutPresets from "./WorkoutPresets";
import PackageAdmin from "./PackageAdmin";
import ClientMeasurements from "./ClientMeasurements";
import LiveTraining from "./LiveTraining";
import ClientInfo from "./ClientInfo";
import { Clipboard, Footprints, Moon, Droplet, CheckCircle, Heart, AlertTriangle, Ban, Dot, Ruler, Camera, Dumbbell, Timer, ChevronLeft, ChevronRight, Users, Calendar, Ticket, BarChart, Cake } from "./ui/icons";

const BDAY_KEYFRAMES = `
@keyframes bdayCardGlow { 0%, 100% { box-shadow: 0 0 0 1px rgba(255,215,0,0.35), 0 0 14px rgba(255,215,0,0.15); } 50% { box-shadow: 0 0 0 1px rgba(255,215,0,0.6), 0 0 22px rgba(255,215,0,0.35); } }
@keyframes bdayBadgeBounce { 0%, 100% { transform: scale(1) rotate(-4deg); } 50% { transform: scale(1.15) rotate(4deg); } }
@keyframes livePulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: .5; } }
`;

const TRAFFIC_LABEL = { 1: "Blogai", 2: "Vidutiniškai", 3: "Gerai" };
const TRAFFIC_COLOR = { 1: ["#FF7A6E", "#E14A45"], 2: ["#FFC15E", "#F2A63D"], 3: ["#5CE3A6", "#2FBE84"] };

function TrafficOrb({ v, size = 28 }) {
  const c = TRAFFIC_COLOR[v];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", margin: "0 auto",
      background: c ? `radial-gradient(circle at 34% 28%, ${c[0]}, ${c[1]})` : "rgba(255,255,255,0.1)",
      boxShadow: c ? `0 2px 8px ${c[0]}55` : "none",
    }} />
  );
}

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

// ── Dienos duomenų vaizdas (tik check-in / miegas / vanduo) ──────────────────
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
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 8px", fontWeight: 600, display:"flex", alignItems:"center", gap:5 }}><Clipboard size={12} />Check-in</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ marginBottom: 8 }}><TrafficOrb v={checkin.nutrition_score} /></div>
              <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{TRAFFIC_LABEL[checkin.nutrition_score] || "–"}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Mityba</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
              <div style={{ marginBottom: 8 }}><TrafficOrb v={checkin.wellbeing_score} /></div>
              <div style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>{TRAFFIC_LABEL[checkin.wellbeing_score] || "–"}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Savijauta</div>
            </div>
          </div>
        </div>
      )}

      {checkin?.steps > 0 && (
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display:"inline-flex", alignItems:"center", gap:5 }}><Footprints size={13} />Žingsniai</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: checkin.steps >= 7000 ? "#7FFFB0" : "#fff" }}>{checkin.steps.toLocaleString()}</span>
        </div>
      )}

      {sleep && (
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display:"inline-flex", alignItems:"center", gap:5 }}><Moon size={13} />Miegas</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{sleep.hours_slept}h</span>
        </div>
      )}

      {water && (
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", display:"inline-flex", alignItems:"center", gap:5 }}><Droplet size={13} />Vanduo</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{water.ml} / {water.goal} ml</span>
        </div>
      )}

      {/* Trumpa išvada */}
      {hasAny && (
        <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 10, borderLeft: "3px solid rgba(255,255,255,0.3)" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0, display:"flex", flexWrap:"wrap", alignItems:"center", gap:4 }}>
            {(() => {
              const parts = [];
              if (checkin?.nutrition_score === 3) parts.push({ text:"Mityba gerai", Icon:CheckCircle });
              else if (checkin?.nutrition_score === 1) parts.push({ text:"Mityba prasta, reikia aptarti", dot:"#FF7A6E" });
              else if (checkin?.nutrition_score === 2) parts.push({ text:"Mityba vidutiniškai", dot:"#FFC15E" });
              if (checkin?.wellbeing_score === 3) parts.push({ text:"Savijauta puiki", Icon:Heart, color:"#7FFFB0" });
              else if (checkin?.wellbeing_score === 1) parts.push({ text:"Savijauta bloga", dot:"#FF7A6E" });
              else if (checkin?.wellbeing_score === 2) parts.push({ text:"Savijauta vidutinė", dot:"#FFC15E" });
              if (checkin?.steps >= 7000) parts.push({ text:`Žingsnių tikslas pasiektas (${checkin.steps.toLocaleString()})` });
              else if (checkin?.steps > 0) parts.push({ text:`Žingsniai: ${checkin.steps.toLocaleString()}` });
              if (sleep?.hours_slept >= 7) parts.push({ text:`Miegas pakankamas (${sleep.hours_slept}h)` });
              else if (sleep?.hours_slept) parts.push({ text:`Miegas per mažas (${sleep.hours_slept}h)`, Icon:AlertTriangle });
              if (water?.ml >= (water?.goal || 2000)) parts.push({ text:"Vanduo išgertas", Icon:CheckCircle });
              else if (water?.ml) parts.push({ text:`Vanduo: ${(water.ml/1000).toFixed(1)}L iš ${((water.goal||2000)/1000).toFixed(1)}L` });
              if (!parts.length) return "Duomenys surinkti.";
              return parts.map((p, i) => (
                <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                  {i > 0 && <span style={{ opacity:0.5 }}>·</span>}
                  {p.Icon && <p.Icon size={12} color={p.color} />}
                  {p.dot && <Dot color={p.dot} size={7} />}
                  {p.text}
                </span>
              ));
            })()}
          </p>
        </div>
      )}
    </div>
  );
}
function ClientCard({ client, pkgInfo, onOpen }) {
  const badge = !client.onboarding_done
    ? { text: "Anketa nebaigta", color: "#FFC15E", Icon: AlertTriangle }
    : client.track_progress === false
      ? { text: "Nenori rinkti duomenų", color: "rgba(255,255,255,0.45)", Icon: Ban }
      : null;

  const lastOrderLabel = pkgInfo?.lastOrder
    ? new Date(pkgInfo.lastOrder).toLocaleDateString("lt-LT", { year:"numeric", month:"short", day:"numeric" })
    : null;

  const daysToBday  = daysUntilBirthday(client.dob);
  const isBdayToday = daysToBday === 0;
  const isBdaySoon  = daysToBday !== null && daysToBday >= 1 && daysToBday <= 7;

  return (
    <button onClick={onOpen} style={{
      position:"relative", width: "100%", background: "rgba(255,255,255,0.08)",
      border: isBdayToday ? "1px solid rgba(255,215,0,0.5)" : "1px solid rgba(255,255,255,0.15)",
      borderLeft: isBdayToday ? "3px solid #FFD700" : badge ? `3px solid ${badge.color}` : "1px solid rgba(255,255,255,0.15)",
      borderRadius: 16, padding: "14px 16px", cursor: "pointer", fontFamily: "inherit",
      textAlign: "left", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap:10,
      animation: isBdayToday ? "bdayCardGlow 2s ease-in-out infinite" : "none",
    }}>
      <style>{BDAY_KEYFRAMES}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth:0 }}>
        <div style={{ position:"relative", width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#6D1B3B,#AD1457)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink:0 }}>
          {client.name?.charAt(0) || "?"}
          {isBdayToday && (
            <div style={{
              position:"absolute", top:-8, right:-8, width:22, height:22, borderRadius:"50%",
              background:"linear-gradient(135deg,#FFD700,#FF6EB4)", display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 0 8px rgba(255,215,0,0.7)", animation:"bdayBadgeBounce 1.4s ease-in-out infinite",
            }}>
              <Cake size={12} color="#fff" />
            </div>
          )}
        </div>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>{client.name}</p>
          {badge ? (
            <p style={{ fontSize: 11, color: badge.color, fontWeight: 600, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
              <badge.Icon size={11} />{badge.text}
            </p>
          ) : (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>{GOALS.find(g => g.id === client.goal)?.label || "–"}</p>
          )}
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "3px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
            <Ticket size={10} />{lastOrderLabel ? `Paskutinė užklausa: ${lastOrderLabel}` : "Paketų neužsakinėjo"}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink:0 }}>
        {(isBdayToday || isBdaySoon) && (
          <div style={{
            display:"flex", alignItems:"center", gap:4,
            background: isBdayToday ? "linear-gradient(135deg,#FFD700,#FF6EB4)" : "rgba(255,215,0,0.14)",
            border: isBdayToday ? "none" : "1px solid rgba(255,215,0,0.35)",
            borderRadius:20, padding:"4px 9px",
          }}>
            <Cake size={11} color={isBdayToday ? "#fff" : "#FFD700"} />
            <span style={{ fontSize:11, fontWeight:700, color: isBdayToday ? "#fff" : "#FFD700" }}>
              {isBdayToday ? "Šiandien!" : `už ${daysToBday}d.`}
            </span>
          </div>
        )}
        {pkgInfo?.active && (
          <div style={{
            display:"flex", alignItems:"center", gap:4, background:"rgba(127,255,176,0.14)",
            border:"1px solid rgba(127,255,176,0.35)", borderRadius:20, padding:"4px 9px",
          }}>
            <Ticket size={11} color="#7FFFB0" />
            <span style={{ fontSize:11, fontWeight:700, color:"#7FFFB0" }}>{pkgInfo.active.total - pkgInfo.active.used}/{pkgInfo.active.total}</span>
          </div>
        )}
        <StreakBadge userId={client.id} compact />
        <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
      </div>
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
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:0, display:"flex", alignItems:"center", gap:4 }}>
              {ex.category==="cardio" ? <><Timer size={11} />{ex.duration_min||"–"} min</> : ex.set_weights ? (() => { try { const ws=JSON.parse(ex.set_weights); return `${ex.sets||"–"} × ${ex.reps||"–"} · ${ws.map((w,i)=>`S${i+1}:${w}kg`).join(" ")}`; } catch { return `${ex.sets||"–"} × ${ex.reps||"–"}`; } })() : `${ex.sets||"–"} × ${ex.reps||"–"}${ex.weight_kg ? ` · ${ex.weight_kg} kg` : ""}`}
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
  const [showProgressCompare, setShowProgressCompare] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [showLiveTraining, setShowLiveTraining] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [allPlans, setAllPlans]           = useState([]);
  const [planForDate, setPlanForDate]     = useState(null);
  const [planDays, setPlanDays]           = useState([]);
  const [selectedPlanDay, setSelectedPlanDay] = useState(null);
  const [planExercises, setPlanExercises] = useState([]);
  const [workoutLogs, setWorkoutLogs]     = useState({});
  const [planLoading, setPlanLoading]     = useState(false);

  function reloadPlans() {
    pb.collection("workout_plans").getFullList({
      filter: `user_id="${client.id}" && is_active=true`, sort: "created", requestKey: null,
    }).then(setAllPlans).catch(() => {});
  }

  useEffect(() => {
    pb.collection("daily_checkins").getFullList({
      filter: `user_id="${client.id}" && is_done=true`, fields: "date", requestKey: null,
    }).then(items => setCheckinDates(items.map(i => i.date))).catch(() => {});
    reloadPlans();
  }, [client.id]);

  // Kai keičiasi data — rasti planą kuris TUO METU galiojo
  useEffect(() => {
    let cancelled = false;
    async function loadPlanForDate() {
      setPlanForDate(null); setPlanDays([]); setSelectedPlanDay(null); setPlanExercises([]); setWorkoutLogs({});
      if (!allPlans.length) return;

      const validPlans = allPlans.filter(p =>
        (p.start_date || "").slice(0,10) <= selectedDate && (p.end_date || "").slice(0,10) >= selectedDate
      );
      const plan = validPlans[validPlans.length - 1] || null;
      if (cancelled) return;
      setPlanForDate(plan);
      if (!plan) return;

      setPlanLoading(true);
      const days = await pb.collection("workout_plan_days").getFullList({
        filter: `plan_id="${plan.id}"`, sort: "day_number", requestKey: null,
      }).catch(() => []);
      if (cancelled) return;
      setPlanDays(days);

      const firstDay = days[0] || null;
      setSelectedPlanDay(firstDay);
      if (!firstDay) { setPlanLoading(false); return; }

      const exs = await pb.collection("workout_plan_exercises").getFullList({
        filter: `day_id="${firstDay.id}"`, sort: "order_num", requestKey: null,
      }).catch(() => []);
      if (cancelled) return;
      setPlanExercises(exs);

      const logs = await pb.collection("workout_logs_client").getFullList({
        filter: `user_id="${client.id}" && plan_day_id="${firstDay.id}" && calendar_date="${selectedDate}"`,
        requestKey: null,
      }).catch(() => []);
      if (cancelled) return;
      const logsMap = {};
      logs.forEach(l => { logsMap[l.plan_exercise_id] = l; });
      setWorkoutLogs(logsMap);
      setPlanLoading(false);
    }
    loadPlanForDate();
    return () => { cancelled = true; };
  }, [selectedDate, allPlans, client.id]);

  // Kai treneris rankiniu būdu pasirenka kitą plano dieną tab'uose
  async function handleSelectPlanDay(day) {
    setSelectedPlanDay(day);
    setPlanLoading(true);
    setPlanExercises([]); setWorkoutLogs({});
    const exs = await pb.collection("workout_plan_exercises").getFullList({
      filter: `day_id="${day.id}"`, sort: "order_num", requestKey: null,
    }).catch(() => []);
    setPlanExercises(exs);
    const logs = await pb.collection("workout_logs_client").getFullList({
      filter: `user_id="${client.id}" && plan_day_id="${day.id}" && calendar_date="${selectedDate}"`,
      requestKey: null,
    }).catch(() => []);
    const logsMap = {};
    logs.forEach(l => { logsMap[l.plan_exercise_id] = l; });
    setWorkoutLogs(logsMap);
    setPlanLoading(false);
  }

  const doneCount = planExercises.filter(ex => workoutLogs[ex.id]?.is_done).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY: "auto", WebkitOverflowScrolling: "touch", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {showPlanBuilder && (
        <WorkoutPlanBuilder client={client} onClose={()=>setShowPlanBuilder(false)} onSaved={()=>{ setShowPlanBuilder(false); reloadPlans(); }} />
      )}
      {showProgressCompare && (
        <ProgressCompare client={client} onClose={()=>setShowProgressCompare(false)} />
      )}
      {showMeasurements && (
        <ClientMeasurements client={client} onClose={()=>setShowMeasurements(false)} />
      )}
      {showLiveTraining && (
        <LiveTraining client={client} onClose={()=>setShowLiveTraining(false)} />
      )}
      {showClientInfo && (
        <ClientInfo client={client} onClose={()=>setShowClientInfo(false)} />
      )}
      <style>{BDAY_KEYFRAMES}</style>
      <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "max(env(safe-area-inset-top), 16px) 20px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 14, cursor: "pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{client.name}</h1>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{client.email}</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>

        {/* Gyva treniruotė */}
        <button onClick={() => setShowLiveTraining(true)} style={{ width:"100%", padding:"14px", marginBottom:12, borderRadius:16, background:"linear-gradient(135deg,#AD1457,#E91E8C)", border:"none", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <Dot color="#FF6B6B" size={8} style={{ animation:"livePulse 1.2s ease-in-out infinite" }} />
          <Dumbbell size={16} />Gyva treniruotė
        </button>

        {/* Matavimai, progreso nuotraukos ir kliento anketa */}
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          <button onClick={() => setShowClientInfo(true)} style={{ flex:1, padding:"12px", background:"rgba(255,255,255,0.08)", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", borderRadius:14, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <Clipboard size={14} />Anketa
          </button>
          <button onClick={() => setShowMeasurements(true)} style={{ flex:1, padding:"12px", background:"rgba(255,255,255,0.08)", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", borderRadius:14, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <Ruler size={14} />Matavimai
          </button>
          <button onClick={() => setShowProgressCompare(true)} style={{ flex:1, padding:"12px", background:"rgba(255,255,255,0.08)", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", borderRadius:14, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <Camera size={14} />Nuotraukos
          </button>
        </div>

        {/* Sporto plano kortelė */}
        <div style={{ marginBottom: 16, background: "rgba(26,71,49,0.5)", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(127,255,176,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: planForDate ? 10 : 0 }}>
            <div>
              {planForDate ? (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#7FFFB0", margin: "0 0 2px", display:"flex", alignItems:"center", gap:6 }}><Dumbbell size={14} />{planForDate.plan_name}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, display:"flex", alignItems:"center", gap:4 }}>
                    {planForDate.start_date} <ChevronRight size={11} /> {planForDate.end_date}
                    {doneCount > 0 && <span style={{ marginLeft: 6, color: "#7FFFB0" }}>· {doneCount}/{planExercises.length} atlikta</span>}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, display:"flex", alignItems:"center", gap:6 }}>
                  <Dumbbell size={14} />{allPlans.length > 0 ? "Šiai datai planas negaliojo" : "Sporto plano nėra"}
                </p>
              )}
            </div>
            <button onClick={() => setShowPlanBuilder(true)} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "6px 12px", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>+ Naujas</button>
          </div>

          {/* Dienų tab'ai */}
          {planForDate && planDays.length > 0 && (
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 2 }}>
              {planDays.map(d => (
                <button key={d.id} onClick={() => handleSelectPlanDay(d)}
                  style={{ padding: "6px 12px", borderRadius: 20, border: "none", background: selectedPlanDay?.id === d.id ? "#276749" : "rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}>
                  {d.day_label}
                </button>
              ))}
            </div>
          )}

          {/* Pratimai */}
          {planLoading && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>Kraunama...</p>}
          {!planLoading && planForDate && selectedPlanDay && planExercises.length === 0 && (
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>Šiai dienai pratimų nėra</p>
          )}
          {!planLoading && planExercises.map((ex, i) => {
            const done = workoutLogs[ex.id]?.is_done;
            return (
              <div key={ex.id} style={{ background: done ? "rgba(127,255,176,0.08)" : "rgba(0,0,0,0.2)", borderRadius: 10, padding: "9px 12px", marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${done ? "rgba(127,255,176,0.25)" : "transparent"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {done ? <CheckCircle size={16} color="#7FFFB0" /> : <span style={{ display:"inline-block", width:13, height:13, borderRadius:4, border:"1.75px solid rgba(255,255,255,0.35)" }} />}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: done ? "#7FFFB0" : "#fff", margin: "0 0 2px", textDecoration: done ? "line-through" : "none", opacity: done ? 0.8 : 1 }}>
                      {i+1}. {ex.exercise_name}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, display:"flex", alignItems:"center", gap:4 }}>
                      {ex.category === "cardio" ? <><Timer size={11} />{ex.duration_min||"–"} min</> : ex.set_weights ? (() => { try { const ws=JSON.parse(ex.set_weights); return `${ex.sets||"–"} × ${ex.reps||"–"} · ${ws.map((w,i)=>`S${i+1}:${w}kg`).join(" ")}`; } catch { return `${ex.sets||"–"} × ${ex.reps||"–"}`; } })() : `${ex.sets||"–"} × ${ex.reps||"–"}${ex.weight_kg ? ` · ${ex.weight_kg} kg` : ""}`}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 10, color: ex.category==="cardio"?"#89CFF0":"#FFB3C6", background:"rgba(255,255,255,0.08)", padding:"2px 8px", borderRadius:6 }}>{ex.muscle}</span>
              </div>
            );
          })}
        </div>

        {/* Kalendorius */}
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", margin: "0 0 8px" }}>Pasirinkite dieną</p>
        <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} checkinDates={checkinDates} />

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
  const [view,        setView]        = useState("list");
  const [openClient,  setOpenClient]  = useState(null);
  const [showBookings, setShowBookings] = useState(false);
  const [showStats, setShowStats]       = useState(false);
  const [showPresets, setShowPresets]   = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [adminBadges, setAdminBadges]   = useState({ bookings:0, packages:0 });
  const [pkgSummary,  setPkgSummary]    = useState({});

  function openAdminTab(tab) {
    setShowBookings(tab === "bookings");
    setShowStats(tab === "stats");
    setShowPresets(tab === "presets");
    setShowPackages(tab === "packages");
  }

  const activeAdminTab = showBookings ? "bookings"
    : showStats    ? "stats"
    : showPresets  ? "presets"
    : showPackages ? "packages"
    : "clients";

  const loadClients = useCallback(async () => {
    const data = await pb.collection("users").getFullList({ filter: 'role="client"', sort: "-created", requestKey: null });
    setClients(data || []);
    setLoading(false);
    // Badge'ai
    Promise.all([
      pb.collection("bookings").getFullList({ filter:'status="pending"', requestKey:null }).catch(()=>[]),
      pb.collection("training_packages").getFullList({ filter:'status="pending"', requestKey:null }).catch(()=>[]),
    ]).then(([bks, pkgs]) => {
      setAdminBadges({ bookings: bks.length, packages: pkgs.length });
    });
    // Kiekvieno kliento paskutinė paketo užklausa + aktyvus paketas
    pb.collection("training_packages").getFullList({ sort:"-created", requestKey:null }).catch(()=>[]).then(pkgs => {
      const summary = {};
      pkgs.forEach(p => {
        if (!summary[p.client_id]) summary[p.client_id] = { lastOrder: p.created, active: null };
        if (!summary[p.client_id].active && p.status === "approved" && p.credits_used < p.credits_total) {
          summary[p.client_id].active = { total: p.credits_total, used: p.credits_used };
        }
      });
      setPkgSummary(summary);
    });
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  if (openClient) return <ClientDetail client={openClient} onClose={() => setOpenClient(null)} />;

  if (view === "new") return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom: 48 }}>
      <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "max(env(safe-area-inset-top), 16px) 20px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setView("list")} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 14, cursor: "pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>Naujas klientas</h1>
      </div>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
        <NewClientForm onSave={() => { setView("list"); loadClients(); }} onCancel={() => setView("list")} />
      </div>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* Scrollinamas turinys — antraštė + sąrašas vienoje scroll zonoje */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 80 }}>
        {/* Header — paprastas */}
        <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingTop: "max(env(safe-area-inset-top), 16px)", paddingLeft: 20, paddingRight: 20, paddingBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/logo.png" alt="Coach Vilma" style={{ width: 34, height: 34, objectFit: "contain", borderRadius: 8 }} />
              <div>
                <h1 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Vilma · Admin</h1>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>Trenerės panelė</p>
              </div>
            </div>
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "7px 12px", color: "rgba(255,255,255,0.7)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Atsijungti</button>
          </div>
        </div>

        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
          <PushPermissionPrompt userId={user.id} />

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
            <ClientCard key={client.id} client={client} pkgInfo={pkgSummary[client.id]} onOpen={() => setOpenClient(client)} />
          ))}
        </div>
      </div>

      {/* Tab bar apačioje — brolinis elementas scrollinamos zonos, ne jos viduje (iOS PWA fixed-in-scroll klaidai išvengti) */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000, background: "rgba(15,4,12,0.97)", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", paddingTop: 10, paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
        {[
          { id:"clients",  Icon:Users,     label:"Klientai",    badge:0,                    onClick: ()=>openAdminTab("clients") },
          { id:"bookings", Icon:Calendar,  label:"Rezervacijos", badge:adminBadges.bookings, onClick: ()=>openAdminTab("bookings") },
          { id:"packages", Icon:Ticket,    label:"Paketai",      badge:adminBadges.packages, onClick: ()=>openAdminTab("packages") },
          { id:"stats",    Icon:BarChart,  label:"Statistika",   badge:0,                    onClick: ()=>openAdminTab("stats") },
          { id:"presets",  Icon:Clipboard, label:"Šablonai",     badge:0,                    onClick: ()=>openAdminTab("presets") },
        ].map(tab => {
          const isActive = activeAdminTab === tab.id;
          return (
            <button key={tab.id} onClick={tab.onClick}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", opacity:isActive?1:0.5, position:"relative" }}>
              <div style={{ position:"relative" }}>
                <tab.Icon size={24} color="#fff" strokeWidth={isActive ? 2 : 1.6} />
                {tab.badge > 0 && (
                  <div style={{ position:"absolute", top:-4, right:-6, background:"#AD1457", borderRadius:99, minWidth:16, height:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff", padding:"0 4px" }}>
                    {tab.badge}
                  </div>
                )}
              </div>
              <span style={{ fontSize:9, color:isActive?"#AD1457":"rgba(255,255,255,0.5)", fontWeight:isActive?700:500 }}>{tab.label}</span>
              {isActive && <div style={{ width:4, height:4, borderRadius:"50%", background:"#AD1457" }} />}
            </button>
          );
        })}
      </div>

      {/* Overlay langai */}
      {showBookings && <BookingAdmin onClose={() => setShowBookings(false)} />}
      {showStats    && <TrainerStats onClose={() => setShowStats(false)} />}
      {showPresets  && <WorkoutPresets onClose={() => setShowPresets(false)} />}
      {showPackages && <PackageAdmin onClose={() => setShowPackages(false)} />}
    </div>
  );
}
