import { useState, useEffect, useCallback } from "react";
import { Medal } from "./ui/Medal";
import { ChevronLeft, Trophy } from "./ui/icons";
import { ConfettiBurst } from "./ui/kit";
import { ACHIEVEMENTS, evaluateAchievements } from "./achievementsData";

function bodyChangeLabel(threshold, goal) {
  if (goal === "gain") return `+${threshold} kg`;
  if (goal === "lose") return `-${threshold} kg`;
  return `${threshold} kg pokytis`;
}

function fmtDate(d) {
  return d ? new Date(d + "T12:00:00").toLocaleDateString("lt-LT", { day: "numeric", month: "long", year: "numeric" }) : "";
}

export default function Achievements({ user, profile, onClose }) {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState(null);
  const [queue, setQueue] = useState([]);
  const [celebrate, setCelebrate] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await evaluateAchievements(user.id, profile).catch(() => null);
    setState(res);
    setLoading(false);
    if (res?.newlyEarned.length) setQueue(res.newlyEarned);
  }, [user.id, profile]);

  useEffect(() => { load(); }, [load]);

  // Naujai pelnytus pasiekimus rodome vieną po kito, ne visus iškart.
  useEffect(() => {
    if (queue.length && !celebrate) {
      setCelebrate(queue[0]);
      setQueue(q => q.slice(1));
    }
  }, [queue, celebrate]);

  const totalEarned = state ? state.earnedSet.size : 0;
  const totalPossible = ACHIEVEMENTS.length * 3;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 40, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingTop: "max(env(safe-area-inset-top), 20px)", paddingLeft: 20, paddingRight: 20, paddingBottom: 16, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(10px)" }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><ChevronLeft size={14} />Atgal</button>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 6 }}><Trophy size={15} />Pasiekimai</h1>
          {!loading && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{totalEarned} / {totalPossible} pelnyta</p>}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        {loading && <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "24px 0" }}>Kraunama...</p>}

        {!loading && state && ACHIEVEMENTS.map(a => {
          const current = state.currentValues[a.key] || 0;
          return (
            <div key={a.key} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 18, padding: 16, marginBottom: 14 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>{a.label}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "0 0 14px" }}>{a.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-around" }}>
                {a.tiers.map(t => {
                  const sig = `${a.key}:${t.tier}`;
                  const earned = state.earnedSet.has(sig);
                  const label = a.key === "body_change" ? bodyChangeLabel(t.threshold, profile?.goal) : t.label;
                  const progress = Math.round((current / t.threshold) * 100);
                  return (
                    <div key={t.tier} style={{ textAlign: "center", flex: 1 }}>
                      <Medal tier={t.tier} Icon={a.Icon} locked={!earned} size={64} progress={!earned ? progress : null} />
                      <p style={{ fontSize: 10, fontWeight: 700, color: earned ? "#fff" : "rgba(255,255,255,0.5)", margin: "4px 0 0" }}>{label}</p>
                      {earned ? (
                        <p style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{fmtDate(state.earnedDates[sig])}</p>
                      ) : (
                        <p style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{current}/{t.threshold}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {celebrate && (
        <div onClick={() => setCelebrate(null)} style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,0.82)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20 }}>
          <div style={{ position: "relative" }}>
            <Medal tier={celebrate.tier} Icon={celebrate.achievement.Icon} size={120} />
            <ConfettiBurst count={16} />
          </div>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: "16px 0 4px" }}>Naujas pasiekimas!</p>
          <p style={{ fontSize: 14, color: "#FFD700", fontWeight: 700, margin: 0 }}>
            {celebrate.achievement.key === "body_change"
              ? bodyChangeLabel(celebrate.achievement.tiers.find(t => t.tier === celebrate.tier)?.threshold, profile?.goal)
              : celebrate.achievement.tiers.find(t => t.tier === celebrate.tier)?.label}
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "10px 0 0" }}>{celebrate.achievement.label}</p>
          <button onClick={() => setCelebrate(null)} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 14, background: "linear-gradient(135deg,#6D1B3B,#AD1457)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Super!</button>
        </div>
      )}
    </div>
  );
}
