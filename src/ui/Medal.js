import { Lock } from "./icons";

// Medalio spalvų paletė per lygį — tikra metalinė medalio išvaizda
// (diskas + juostelės + monetos kraštas + blizgesys), ne plokščia ikona.
const TIERS = {
  bronze: { ring: "#8B5A2B", from: "#E3A66B", to: "#9C6530", ribbon: "#A85C2A", ribbonDark: "#6E3A17", shine: "#FFE8C9" },
  silver: { ring: "#8C8C8C", from: "#F6F6F6", to: "#B7B7B7", ribbon: "#B0B0B0", ribbonDark: "#787878", shine: "#FFFFFF" },
  gold:   { ring: "#A6790A", from: "#FFEB99", to: "#E0A91A", ribbon: "#E8B923", ribbonDark: "#A8780C", shine: "#FFF6D8" },
  locked: { ring: "#3a3a3a", from: "#6b6b6b", to: "#3f3f3f", ribbon: "#4a4a4a", ribbonDark: "#2a2a2a", shine: "#8a8a8a" },
};

export function Medal({ tier = "bronze", Icon, locked = false, size = 64, progress = null, progressColor = "#FFD700" }) {
  const c = locked ? TIERS.locked : TIERS[tier];
  const gid = `medalGrad_${tier}_${locked ? "l" : "u"}`;
  const h = Math.round(size * 1.25);
  const R = 37;
  const C = 2 * Math.PI * R;
  const pct = progress != null ? Math.min(100, Math.max(0, progress)) : 0;
  const dash = (pct / 100) * C;

  return (
    <div style={{ position: "relative", width: size, height: h, flexShrink: 0 }}>
      <svg viewBox="0 0 100 125" width={size} height={h} style={{ display: "block", filter: locked ? "saturate(0.25)" : "drop-shadow(0 4px 7px rgba(0,0,0,0.4))" }}>
        <defs>
          <radialGradient id={gid} cx="36%" cy="30%" r="75%">
            <stop offset="0%" stopColor={c.from} />
            <stop offset="100%" stopColor={c.to} />
          </radialGradient>
        </defs>

        {/* Juostelės už disko */}
        <path d="M40 48 L22 104 L35 97 L42 112 L50 78 Z" fill={c.ribbon} />
        <path d="M60 48 L78 104 L65 97 L58 112 L50 78 Z" fill={c.ribbon} />
        <path d="M40 48 L29 90 L36 87 Z" fill={c.ribbonDark} opacity="0.55" />
        <path d="M60 48 L71 90 L64 87 Z" fill={c.ribbonDark} opacity="0.55" />

        {/* Progreso žiedas (tik kai neatrakinta ir turi progresą) */}
        {progress != null && (
          <circle cx="50" cy="43" r={R} fill="none" stroke={progressColor} strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C - dash}
            style={{ transformOrigin: "50px 43px", transform: "rotate(-90deg)", transition: "stroke-dashoffset 0.6s ease" }} />
        )}

        {/* Disko šešėlis + pats diskas + monetos kraštas + blizgesys */}
        <circle cx="50" cy="46" r="33" fill="rgba(0,0,0,0.3)" />
        <circle cx="50" cy="43" r="33" fill={`url(#${gid})`} stroke={c.ring} strokeWidth="3" />
        <circle cx="50" cy="43" r="26.5" fill="none" stroke={c.ring} strokeWidth="1" opacity="0.4" />
        <ellipse cx="38" cy="29" rx="13" ry="7" fill={c.shine} opacity="0.55" transform="rotate(-24 38 29)" />
      </svg>

      <div style={{ position: "absolute", top: "32%", left: "50%", transform: "translate(-50%,-50%)" }}>
        {Icon && <Icon size={Math.round(size * 0.32)} color={locked ? "rgba(255,255,255,0.5)" : "#fff"} />}
      </div>

      {locked && (
        <div style={{
          position: "absolute", bottom: "30%", right: "4%", width: Math.round(size * 0.3), height: Math.round(size * 0.3),
          borderRadius: "50%", background: "rgba(15,15,15,0.88)", display: "flex", alignItems: "center", justifyContent: "center",
          border: "1.5px solid rgba(255,255,255,0.18)",
        }}>
          <Lock size={Math.round(size * 0.15)} color="rgba(255,255,255,0.85)" />
        </div>
      )}
    </div>
  );
}
