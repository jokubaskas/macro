import { useState, useEffect } from "react";
import { pb } from "./pb";
import { Flame, Sparkle } from "./ui/icons";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split("T")[0]; }

function calcStreak(checkinDates) {
  // checkinDates: Set of "YYYY-MM-DD" strings (is_done=true dienos)
  const today = todayStr();
  const yesterday = daysAgo(1);

  // Jei šiandien dar nepildyta IR vakar irgi nepildyta - streak = 0
  // Jei šiandien pildyta arba vakar pildyta (dar gali pildyti šiandien) - skaičiuojam
  let streak = 0;
  let checkDate = checkinDates.has(today) ? today : (checkinDates.has(yesterday) ? yesterday : null);

  if (!checkDate) return 0;

  let cursor = new Date(checkDate + "T12:00:00");
  while (true) {
    const ds = cursor.toISOString().split("T")[0];
    if (checkinDates.has(ds)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getStreakStyle(streak) {
  if (streak >= 14) return { Icon: Flame,   color: "#FF4500", label: "Nesustabdoma!", glow: true };
  if (streak >= 7)  return { Icon: Flame,   color: "#FF6B00", label: "Puikus tempas!", glow: true };
  if (streak >= 3)  return { Icon: Flame,   color: "#FFA500", label: "Įsibėgėji!", glow: false };
  if (streak >= 1)  return { Icon: Sparkle, color: "#FFD700", label: "Pradžia!", glow: false };
  return null;
}

export default function StreakBadge({ userId, compact }) {
  const [streak, setStreak] = useState(0);
  const [best, setBest]     = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pb.collection("daily_checkins").getFullList({
      filter: `user_id="${userId}" && is_done=true`,
      fields: "date",
      sort: "-date",
      requestKey: null,
    }).then(items => {
      const dates = new Set(items.map(i => i.date.slice(0,10)));
      const current = calcStreak(dates);
      setStreak(current);

      // Apskaičiuoti geriausią streak istoriškai (paprastas algoritmas)
      const sorted = [...dates].sort();
      let maxStreak = 0, run = 0, prev = null;
      for (const d of sorted) {
        if (prev) {
          const prevDate = new Date(prev + "T12:00:00");
          const curDate = new Date(d + "T12:00:00");
          const diff = (curDate - prevDate) / 86400000;
          run = diff === 1 ? run + 1 : 1;
        } else {
          run = 1;
        }
        maxStreak = Math.max(maxStreak, run);
        prev = d;
      }
      setBest(Math.max(maxStreak, current));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  if (loading) return null;
  const style = getStreakStyle(streak);
  if (!style) return null;

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${style.color}22`, border: `1px solid ${style.color}55`, borderRadius: 20, padding: "4px 10px" }}>
        <style.Icon size={14} color={style.color} />
        <span style={{ fontSize: 12, fontWeight: 700, color: style.color }}>{streak}</span>
      </div>
    );
  }

  return (
    <div style={{
      background: `linear-gradient(135deg, ${style.color}22, ${style.color}11)`,
      border: `1.5px solid ${style.color}44`,
      borderRadius: 18,
      padding: "14px 16px",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 14,
      boxShadow: style.glow ? `0 0 20px ${style.color}33` : "none",
    }}>
      <div style={{ filter: style.glow ? `drop-shadow(0 0 8px ${style.color})` : "none" }}>
        <style.Icon size={36} color={style.color} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.1 }}>
          {streak} {streak === 1 ? "diena" : streak < 10 ? "dienos" : "dienų"} iš eilės!
        </p>
        <p style={{ fontSize: 12, color: style.color, fontWeight: 700, margin: "2px 0 0" }}>{style.label}</p>
      </div>
      {best > streak && (
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>Rekordas</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: 0 }}>{best}</p>
        </div>
      )}
    </div>
  );
}
