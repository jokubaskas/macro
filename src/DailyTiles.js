import { useState, useEffect } from "react";
import { pb } from "./pb";
import DailyCheckin from "./DailyCheckin";
import StepsTracker from "./StepsTracker";
import SleepTracker from "./SleepTracker";
import WaterTracker from "./WaterTracker";
import MacroTracker from "./MacroTracker";
import { Clipboard, Footprints, Moon, Droplet, Salad, Close, Check, Sparkle } from "./ui/icons";

const STEPS_GOAL = 7000; // tas pats fiksuotas tikslas, kaip StepsTracker.js

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

// Vienas paspaudžiamas kvadratėlis — sutrauktas apžvalgos vaizdas, paspaudus
// atsidaro pilnas trackeris modaliniame lange.
function Tile({ Icon, color, title, big, sub, barPct, onClick, children }) {
  return (
    <button onClick={onClick} className="tile-tap" style={{
      background: `linear-gradient(160deg, ${color}22, ${color}0a)`,
      border: `1.5px solid ${color}3d`,
      borderRadius: 20, padding: "16px 14px",
      display: "flex", flexDirection: "column", gap: 8,
      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
      width: "100%", boxSizing: "border-box",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: `${color}2a`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</span>
      </div>
      {children ? children : (
        <>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.15 }}>{big}</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0 }}>{sub}</p>
          {barPct != null && <MiniBar pct={barPct} color={color} />}
        </>
      )}
    </button>
  );
}

function TrackerModal({ title, Icon, color, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: "linear-gradient(160deg,#3a0a20,#6D1B3B)",
        borderRadius: "24px 24px 0 0", padding: "18px 16px 32px",
        maxHeight: "88vh", overflowY: "auto", WebkitOverflowScrolling: "touch",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
            <Icon size={16} color={color} />{title}
          </span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Close size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Kvadratėlių tinklelis dienos sekimo įrankiams — kiekvienas rodo trumpą
// apžvalgą (skaičius/juostelė), o paspaudus atsidaro pilnas vaizdas
// modaliniame lange. Vietoj penkių atskirų visą plotį užimančių kortelių,
// kaip buvo anksčiau, dabar viena eilutė (check-in) + 2×2 tinklelis.
export default function DailyTiles({ userId, date, profile, waterGoal, onCheckinSaved }) {
  const [today, setToday] = useState(null);
  const [open, setOpen] = useState(null); // "checkin" | "steps" | "sleep" | "water" | "macro" | null

  useEffect(() => {
    setToday(null);
    Promise.all([
      pb.collection("daily_checkins").getFirstListItem(`user_id="${userId}" && date="${date}"`, { requestKey: null }).catch(() => null),
      pb.collection("sleep_log").getFirstListItem(`user_id="${userId}" && date="${date}"`, { requestKey: null }).catch(() => null),
      pb.collection("water_log").getFirstListItem(`user_id="${userId}" && date="${date}"`, { requestKey: null }).catch(() => null),
    ]).then(([checkin, sleep, water]) => {
      setToday({ checkin, sleep, water });
    });
  }, [userId, date]);

  if (!today) return null;

  const { checkin, sleep, water } = today;
  const isDone = checkin?.is_done === true || checkin?.is_done === "true";
  const steps = checkin?.steps || 0;
  const sleepH = sleep?.hours_slept;
  const waterMl = water?.ml || 0;
  const macroG = (checkin?.protein_g || 0) + (checkin?.fat_g || 0) + (checkin?.carbs_g || 0);

  const TRAFFIC = { 1: ["#FF7A6E", "#E14A45"], 2: ["#FFC15E", "#F2A63D"], 3: ["#5CE3A6", "#2FBE84"] };

  return (
    <div style={{ marginBottom: 12 }}>
      <style>{`.tile-tap{transition:transform 0.15s ease;} .tile-tap:active{transform:scale(0.96);}`}</style>

      {/* Check-in — pilno pločio eilutė */}
      <button onClick={() => setOpen("checkin")} className="tile-tap" style={{
        width: "100%", boxSizing: "border-box", marginBottom: 10, textAlign: "left", fontFamily: "inherit", cursor: "pointer",
        background: isDone ? "linear-gradient(160deg,#7FFFB022,#7FFFB00a)" : "linear-gradient(160deg,#FFD70022,#FFD7000a)",
        border: `1.5px solid ${isDone ? "#7FFFB03d" : "#FFD7003d"}`,
        borderRadius: 20, padding: "14px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: isDone ? "#7FFFB02a" : "#FFD7002a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clipboard size={17} color={isDone ? "#7FFFB0" : "#FFD700"} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Dienos check-in</p>
            {isDone ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                {checkin?.nutrition_score && <Dot c1={TRAFFIC[checkin.nutrition_score][0]} c2={TRAFFIC[checkin.nutrition_score][1]} />}
                {checkin?.wellbeing_score && <Dot c1={TRAFFIC[checkin.wellbeing_score][0]} c2={TRAFFIC[checkin.wellbeing_score][1]} />}
                {typeof checkin?.alcohol === "boolean" && <Dot c1={checkin.alcohol ? "#FF7A6E" : "#5CE3A6"} c2={checkin.alcohol ? "#E14A45" : "#2FBE84"} />}
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Užpildyta</span>
              </div>
            ) : (
              <p style={{ fontSize: 11, color: "#FFD700", margin: "2px 0 0" }}>Dar neužpildyta — paspausk</p>
            )}
          </div>
        </div>
        {isDone
          ? <span style={{ flexShrink:0, width:26, height:26, borderRadius:"50%", background:"rgba(127,255,176,0.2)", color:"#7FFFB0", display:"flex", alignItems:"center", justifyContent:"center" }}><Check size={13} /></span>
          : <Sparkle size={16} color="#FFD700" style={{ flexShrink:0 }} />}
      </button>

      {/* 2×2 tinklelis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Tile Icon={Footprints} color="#FF9F5A" title="Žingsniai" onClick={() => setOpen("steps")}
          big={steps ? steps.toLocaleString() : "–"} sub={`iš ${STEPS_GOAL.toLocaleString()}`}
          barPct={steps ? (steps / STEPS_GOAL) * 100 : 0} />

        <Tile Icon={Moon} color="#8FA8FF" title="Miegas" onClick={() => setOpen("sleep")}
          big={sleepH != null ? `${sleepH}h` : "–"} sub={sleepH != null ? "praeitą naktį" : "dar nepažymėta"}
          barPct={sleepH != null ? (sleepH / 9) * 100 : 0} />

        <Tile Icon={Droplet} color="#5BB8D4" title="Vanduo" onClick={() => setOpen("water")}
          big={waterMl ? `${(waterMl/1000).toFixed(1)}L` : "–"} sub={`iš ${(waterGoal/1000).toFixed(1)}L`}
          barPct={waterGoal ? (waterMl / waterGoal) * 100 : 0} />

        <Tile Icon={Salad} color="#FF6EB4" title="Mityba" onClick={() => setOpen("macro")}
          big={macroG ? `${macroG}g` : "–"} sub={macroG ? "surinkta iš viso" : "dar neįvesta"}
          barPct={null} />
      </div>

      {open === "checkin" && (
        <TrackerModal title="Dienos check-in" Icon={Clipboard} color="#FFD700" onClose={() => { setOpen(null); onCheckinSaved?.(); setToday(null); }}>
          <DailyCheckin userId={userId} date={date} onSaved={() => { onCheckinSaved?.(); setToday(null); }} />
        </TrackerModal>
      )}
      {open === "steps" && (
        <TrackerModal title="Žingsniai" Icon={Footprints} color="#FF9F5A" onClose={() => { setOpen(null); setToday(null); }}>
          <StepsTracker userId={userId} date={date} />
        </TrackerModal>
      )}
      {open === "sleep" && (
        <TrackerModal title="Miegas" Icon={Moon} color="#8FA8FF" onClose={() => { setOpen(null); setToday(null); }}>
          <SleepTracker userId={userId} age={profile?.dob ? Math.floor((new Date() - new Date(profile.dob)) / (365.25*24*60*60*1000)) : null} date={date} />
        </TrackerModal>
      )}
      {open === "water" && (
        <TrackerModal title="Vanduo" Icon={Droplet} color="#5BB8D4" onClose={() => { setOpen(null); setToday(null); }}>
          <WaterTracker goal={waterGoal} userId={userId} date={date} />
        </TrackerModal>
      )}
      {open === "macro" && (
        <TrackerModal title="Mityba" Icon={Salad} color="#FF6EB4" onClose={() => { setOpen(null); setToday(null); }}>
          <MacroTracker userId={userId} date={date} profile={profile} />
        </TrackerModal>
      )}
    </div>
  );
}
