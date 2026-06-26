import { useState, useEffect, useCallback } from "react";
import { pb, pbFirst } from "./pb";
import { PK, GOALS, calcMacros } from "./constants";
import WaterTracker from "./WaterTracker";
import SleepTracker from "./SleepTracker";
import DailyCheckin from "./DailyCheckin";
import MeasurementReport from "./MeasurementReport";
import MotivationalCard from "./MotivationalCard";
import WorkoutView from "./WorkoutView";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function Sep() { return <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", margin: "2px 0" }} />; }

// ── Kalendoriaus modalas ──────────────────────────────────────────────────────
function DatePickerModal({ value, minDate, onSelect, onClose }) {
  const today = todayStr();
  const [month, setMonth] = useState(() => {
    const d = new Date(value + "T12:00:00");
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const firstDay = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "linear-gradient(160deg,#3a0a20,#6D1B3B)", borderRadius: "24px 24px 0 0", padding: "20px 16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", cursor: "pointer" }}>◀</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
            {new Date(month.y, month.m, 1).toLocaleDateString("lt-LT", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", cursor: "pointer" }}>▶</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {["P","A","T","K","P","Š","S"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.4)", padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array(offset).fill(null).map((_,i) => <div key={"e"+i} />)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const d = i + 1;
            const dateStr = `${month.y}-${String(month.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const isSelected = dateStr === value;
            const isToday = dateStr === today;
            const disabled = minDate && dateStr < minDate;
            return (
              <button key={d} onClick={() => { if (!disabled) { onSelect(dateStr); onClose(); } }}
                style={{ aspectRatio: "1", border: isSelected ? "2px solid rgba(255,255,255,0.8)" : "none", borderRadius: 10,
                  background: isSelected ? "rgba(255,255,255,0.25)" : isToday ? "rgba(255,255,255,0.1)" : "transparent",
                  cursor: disabled ? "default" : "pointer", color: disabled ? "rgba(255,255,255,0.2)" : "#fff",
                  fontSize: 13, fontWeight: isSelected || isToday ? 700 : 400, fontFamily: "inherit" }}>{d}</button>
            );
          })}
        </div>
        <button onClick={onClose} style={{ width: "100%", marginTop: 16, padding: "12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Uždaryti</button>
      </div>
    </div>
  );
}

export default function ClientView({ user, onLogout, selectedDate: propDate, onDateChange }) {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [hasReport,    setHasReport]    = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [minDate,      setMinDate]      = useState(null);
  const [checkinKey,   setCheckinKey]   = useState(0);
  const [showWorkout,  setShowWorkout]  = useState(false);

  const selectedDate    = propDate || todayStr();
  const setSelectedDate = (d) => onDateChange ? onDateChange(d) : null;
  const isToday         = selectedDate === todayStr();

  useEffect(() => {
    async function load() {
      const data = await pb.collection("users").getOne(user.id);
      setProfile(data);
      setLoading(false);
      if (data) {
        const min = new Date(); min.setDate(min.getDate() - 90);
        setMinDate(min.toISOString().split("T")[0]);
      }
    }
    load();
    pbFirst("trainer_measurements", `user_id="${user.id}" && client_read_at=""`)
      .then(data => { if (data) { setHasReport(true); setShowReport(true); } });
  }, [user.id]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg,#3a0a20,${PK.dark})` }}>
      <div style={{ textAlign: "center" }}>
        <img src="/logo.png" alt="" style={{ width: 70, height: 70, objectFit: "contain", borderRadius: 12, marginBottom: 12 }} />
        <p style={{ color: PK.blush, fontSize: 14 }}>Kraunama...</p>
      </div>
    </div>
  );

  const profileAge = profile?.dob
    ? Math.floor((new Date() - new Date(profile.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : parseInt(profile?.age || 30);
  const goalLabel = GOALS.find(g => g.id === profile?.goal)?.label ?? "";
  const waterGoal = Math.round(parseFloat(profile?.weight || 60) * 33);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,#3a0a20 0%,${PK.dark} 45%,${PK.mid} 100%)`, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom: 80 }}>

      {showWorkout && <WorkoutView user={user} onClose={()=>setShowWorkout(false)} />}
      {showCalendar && (
        <DatePickerModal value={selectedDate} minDate={minDate}
          onSelect={d => setSelectedDate(d)} onClose={() => setShowCalendar(false)} />
      )}
      {showReport && (
        <MeasurementReport userId={user.id} onClose={() => { setShowReport(false); setHasReport(false); }} />
      )}
      {hasReport && !showReport && (
        <button onClick={() => setShowReport(true)} style={{ position: "fixed", bottom: 90, right: 20, zIndex: 500, width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg,${PK.dark},${PK.mid})`, border: "2px solid rgba(255,255,255,0.3)", boxShadow: "0 4px 20px rgba(173,20,87,0.5)", cursor: "pointer", fontSize: 20 }}>
          📊
          <div style={{ position: "absolute", top: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: "#FF4444", border: "2px solid #fff", fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>1</div>
        </button>
      )}

      {/* Header */}
      <div style={{ padding: "16px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo.png" alt="" style={{ width: 34, height: 34, objectFit: "contain", borderRadius: 8 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Daily Check-in</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", margin: 0 }}>{profile?.name?.split(" ")[0]}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowCalendar(true)} style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              📅 {isToday ? new Date().toLocaleDateString("lt-LT", { month: "short", day: "numeric" }) : selectedDate}
              <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
            </button>
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "7px 12px", color: "rgba(255,255,255,0.7)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Išeiti</button>
          </div>
        </div>
        <Sep />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* Greeting */}
        {isToday && (
          <div style={{ marginBottom: 16, padding: "14px 16px", background: "rgba(255,255,255,0.07)", borderRadius: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>
              Sveika, {profile?.name?.split(" ")[0]} 👋
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>
              Užpildyk šiandienos check-in'ą
            </p>
          </div>
        )}

        {!isToday && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(255,255,255,0.07)", borderRadius: 14 }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>
              📅 {new Date(selectedDate + "T12:00:00").toLocaleDateString("lt-LT", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        )}

        {/* Motyvacija */}
        {isToday && (
          <MotivationalCard userId={user.id} res={null} goalId={profile?.goal} />
        )}

        {/* Daily Check-in */}
        <DailyCheckin
          key={checkinKey}
          userId={user.id}
          date={selectedDate}
          onSaved={() => setCheckinKey(k => k + 1)}
        />

        {/* Treniruotė */}
        <button onClick={() => setShowWorkout(true)} style={{ width: "100%", padding: "14px", marginBottom: 12, background: "linear-gradient(135deg,#1a4731,#276749)", color: "#fff", border: "none", borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          🏋️ Treniruotė
        </button>

        {/* Miegas */}
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "16px 18px", marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>😴 Miegas</p>
          <SleepTracker userId={user.id} age={profileAge} date={selectedDate} />
        </div>

        {/* Vanduo */}
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "16px 18px", marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>💧 Vanduo</p>
          <WaterTracker goal={waterGoal} userId={user.id} date={selectedDate} />
        </div>

      </div>
    </div>
  );
}
