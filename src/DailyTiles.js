import { useState, useEffect, useRef } from "react";
import { pb } from "./pb";
import DailyCheckin from "./DailyCheckin";
import StepsTracker from "./StepsTracker";
import SleepTracker from "./SleepTracker";
import WaterTracker from "./WaterTracker";
import MacroTracker from "./MacroTracker";
import { Clipboard, Footprints, Moon, Droplet, Salad, Close, Check, Sparkle, ChevronRight } from "./ui/icons";

const STEPS_GOAL = 7000; // tas pats fiksuotas tikslas, kaip StepsTracker.js

const KEYFRAMES = `
@keyframes tileExpand {
  from { opacity: 0; transform: translateY(-6px) scaleY(0.96); }
  to   { opacity: 1; transform: translateY(0) scaleY(1); }
}
.tile-tap{ transition: transform 0.15s ease; }
.tile-tap:active{ transform: scale(0.97); }
`;

function MiniBar({ pct, color }) {
  return (
    <div style={{ borderRadius: 99, height: 4, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: "100%", borderRadius: 99, background: color, transition: "width 0.5s cubic-bezier(.23,1,.32,1)" }} />
    </div>
  );
}

function Dot({ c1, c2, size = 10 }) {
  return (
    <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 34% 28%, ${c1}, ${c2})` }} />
  );
}

// Vienas kvadratėlis — sutrauktas rodo trumpą apžvalgą, paspaudus išsiskleidžia
// vietoje (su animacija), po juo atsiranda pilnas trackerio turinys.
function Tile({ Icon, color, title, big, sub, barPct, isOpen, onToggle, children }) {
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      wrapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => clearTimeout(t);
  }, [isOpen]);

  return (
    <div ref={wrapRef} style={{ gridColumn: isOpen ? "1 / -1" : "auto" }}>
      <button onClick={onToggle} className="tile-tap" style={{
        background: isOpen ? `linear-gradient(160deg, ${color}30, ${color}12)` : `linear-gradient(160deg, ${color}40, ${color}1c)`,
        border: `2px solid ${isOpen ? color + "88" : color + "5c"}`,
        boxShadow: isOpen ? "none" : `0 5px 18px ${color}30, inset 0 1px 0 rgba(255,255,255,0.12)`,
        borderRadius: isOpen ? "18px 18px 0 0" : 20,
        padding: "14px 14px",
        display: "flex", flexDirection: "column", gap: 8,
        cursor: "pointer", textAlign: "left", fontFamily: "inherit",
        width: "100%", boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: `${color}4a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={16} color={color} />
            </div>
            {isOpen && <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{title}</span>}
          </div>
          {!isOpen && <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</span>}
          {isOpen && (
            <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Close size={12} color="rgba(255,255,255,0.7)" />
            </span>
          )}
        </div>
        {!isOpen && (
          <>
            <p style={{ fontSize: 21, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.15 }}>{big}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>{sub}</p>
              <ChevronRight size={13} color={`${color}cc`} style={{ flexShrink: 0 }} />
            </div>
            {barPct != null && <MiniBar pct={barPct} color={color} />}
          </>
        )}
      </button>
      {isOpen && (
        <div style={{
          background: "rgba(0,0,0,0.18)",
          border: `1.5px solid ${color}3d`, borderTop: "none",
          borderRadius: "0 0 18px 18px",
          padding: 14,
          animation: "tileExpand 0.3s cubic-bezier(.23,1,.32,1) both",
          transformOrigin: "top",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Kvadratėlių tinklelis dienos sekimo įrankiams — kiekvienas rodo trumpą
// apžvalgą (skaičius/juostelė), o paspaudus išsiskleidžia vietoje, pagrindiniame
// ekrane (ne iššokančiame lange), rodydamas pilną trackerio turinį.
export default function DailyTiles({ userId, date, profile, waterGoal, onCheckinSaved }) {
  const [today, setToday] = useState(null);
  const [open, setOpen] = useState(null); // "checkin" | "steps" | "sleep" | "water" | "macro" | null
  const checkinRef = useRef(null);

  useEffect(() => {
    if (open !== "checkin") return;
    const t = setTimeout(() => {
      checkinRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => clearTimeout(t);
  }, [open]);

  function reload() {
    Promise.all([
      pb.collection("daily_checkins").getFirstListItem(`user_id="${userId}" && date="${date}"`, { requestKey: null }).catch(() => null),
      pb.collection("sleep_log").getFirstListItem(`user_id="${userId}" && date="${date}"`, { requestKey: null }).catch(() => null),
      pb.collection("water_log").getFirstListItem(`user_id="${userId}" && date="${date}"`, { requestKey: null }).catch(() => null),
    ]).then(([checkin, sleep, water]) => {
      setToday({ checkin, sleep, water });
    });
  }

  useEffect(() => { setToday(null); setOpen(null); reload(); /* eslint-disable-next-line */ }, [userId, date]);

  function toggle(key) {
    setOpen(o => (o === key ? null : key));
  }

  if (!today) return null;

  const { checkin, sleep, water } = today;
  const isDone = checkin?.is_done === true || checkin?.is_done === "true";
  const steps = checkin?.steps || 0;
  const sleepH = sleep?.hours_slept;
  const waterMl = water?.ml || 0;
  const macroG = (checkin?.protein_g || 0) + (checkin?.fat_g || 0) + (checkin?.carbs_g || 0);

  const TRAFFIC = { 1: ["#FF7A6E", "#E14A45"], 2: ["#FFC15E", "#F2A63D"], 3: ["#5CE3A6", "#2FBE84"] };
  const checkinOpen = open === "checkin";

  return (
    <div style={{ marginBottom: 12 }}>
      <style>{KEYFRAMES}</style>

      {/* Check-in — pilno pločio eilutė */}
      <div ref={checkinRef}>
      <button onClick={() => toggle("checkin")} className="tile-tap" style={{
        width: "100%", boxSizing: "border-box", marginBottom: checkinOpen ? 0 : 10, textAlign: "left", fontFamily: "inherit", cursor: "pointer",
        background: checkinOpen
          ? (isDone ? "linear-gradient(160deg,#7FFFB030,#7FFFB012)" : "linear-gradient(160deg,#FFD70030,#FFD70012)")
          : (isDone ? "linear-gradient(160deg,#7FFFB040,#7FFFB01c)" : "linear-gradient(160deg,#FFD70040,#FFD7001c)"),
        border: `2px solid ${isDone ? "#7FFFB0" : "#FFD700"}${checkinOpen ? "88" : "5c"}`,
        boxShadow: checkinOpen ? "none" : `0 5px 18px ${isDone ? "#7FFFB0" : "#FFD700"}30, inset 0 1px 0 rgba(255,255,255,0.12)`,
        borderRadius: checkinOpen ? "20px 20px 0 0" : 20, padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: isDone ? "#7FFFB02a" : "#FFD7002a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clipboard size={17} color={isDone ? "#7FFFB0" : "#FFD700"} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Dienos check-in</p>
            {!checkinOpen && (isDone ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                {checkin?.nutrition_score && <Dot c1={TRAFFIC[checkin.nutrition_score][0]} c2={TRAFFIC[checkin.nutrition_score][1]} />}
                {checkin?.wellbeing_score && <Dot c1={TRAFFIC[checkin.wellbeing_score][0]} c2={TRAFFIC[checkin.wellbeing_score][1]} />}
                {typeof checkin?.alcohol === "boolean" && <Dot c1={checkin.alcohol ? "#FF7A6E" : "#5CE3A6"} c2={checkin.alcohol ? "#E14A45" : "#2FBE84"} />}
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Užpildyta</span>
              </div>
            ) : (
              <p style={{ fontSize: 11, color: "#FFD700", margin: "2px 0 0" }}>Dar neužpildyta — paspausk</p>
            ))}
          </div>
        </div>
        {checkinOpen ? (
          <span style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Close size={12} color="rgba(255,255,255,0.7)" />
          </span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {isDone ? (
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(127,255,176,0.25)", color: "#7FFFB0", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={13} /></span>
            ) : (
              <Sparkle size={16} color="#FFD700" />
            )}
            <ChevronRight size={14} color={isDone ? "#7FFFB0cc" : "#FFD700cc"} />
          </div>
        )}
      </button>
      {checkinOpen && (
        <div style={{
          background: "rgba(0,0,0,0.18)", border: `1.5px solid ${isDone ? "#7FFFB0" : "#FFD700"}3d`, borderTop: "none",
          borderRadius: "0 0 20px 20px", padding: 14, marginBottom: 10,
          animation: "tileExpand 0.3s cubic-bezier(.23,1,.32,1) both", transformOrigin: "top",
        }}>
          <DailyCheckin userId={userId} date={date} initialCheckin={checkin} onSaved={() => { onCheckinSaved?.(); reload(); }} />
        </div>
      )}
      </div>

      {/* 2×2 tinklelis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Tile Icon={Footprints} color="#FF9F5A" title="Žingsniai" isOpen={open === "steps"} onToggle={() => toggle("steps")}
          big={steps ? steps.toLocaleString() : "–"} sub={`iš ${STEPS_GOAL.toLocaleString()}`}
          barPct={steps ? (steps / STEPS_GOAL) * 100 : 0}>
          <StepsTracker userId={userId} date={date} initialSteps={steps} onSaved={reload} />
        </Tile>

        <Tile Icon={Moon} color="#8FA8FF" title="Miegas" isOpen={open === "sleep"} onToggle={() => toggle("sleep")}
          big={sleepH != null ? `${sleepH}h` : "–"} sub={sleepH != null ? "praeitą naktį" : "dar nepažymėta"}
          barPct={sleepH != null ? (sleepH / 9) * 100 : 0}>
          <SleepTracker userId={userId} age={profile?.dob ? Math.floor((new Date() - new Date(profile.dob)) / (365.25*24*60*60*1000)) : null} date={date} initialHours={sleepH ?? null} onSaved={reload} />
        </Tile>

        <Tile Icon={Droplet} color="#5BB8D4" title="Vanduo" isOpen={open === "water"} onToggle={() => toggle("water")}
          big={waterMl ? `${(waterMl/1000).toFixed(1)}L` : "–"} sub={`iš ${(waterGoal/1000).toFixed(1)}L`}
          barPct={waterGoal ? (waterMl / waterGoal) * 100 : 0}>
          <WaterTracker goal={waterGoal} userId={userId} date={date} initialData={{ ml: waterMl, goal: water?.goal || waterGoal }} onSaved={reload} />
        </Tile>

        <Tile Icon={Salad} color="#FF6EB4" title="Mityba" isOpen={open === "macro"} onToggle={() => toggle("macro")}
          big={macroG ? `${macroG}g` : "–"} sub={macroG ? "surinkta iš viso" : "dar neįvesta"}
          barPct={null}>
          <MacroTracker userId={userId} date={date} profile={profile} initialMacros={{ protein_g: checkin?.protein_g || 0, fat_g: checkin?.fat_g || 0, carbs_g: checkin?.carbs_g || 0 }} onSaved={reload} />
        </Tile>
      </div>
    </div>
  );
}