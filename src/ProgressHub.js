import { useState } from "react";
import { PK } from "./constants";
import ClientProgressCompare from "./ClientProgressCompare";
import ClientStats from "./ClientStats";
import Achievements from "./Achievements";
import { ChevronLeft, ChevronRight, Camera, TrendingUp, Trophy } from "./ui/icons";

const SECTIONS = [
  { key: "photos",       Icon: Camera,     color: "#FFD700", title: "Progreso nuotraukos", sub: "Palyginti nuotraukas laike" },
  { key: "stats",        Icon: TrendingUp, color: "#6EC6FF", title: "Statistika",           sub: "Matavimai, miegas, vanduo ir kt." },
  { key: "achievements", Icon: Trophy,     color: "#FFB347", title: "Pasiekimai",           sub: "Medaliai už tavo pažangą" },
];

// Bendras "Mano progresas" centras — sujungia tris anksčiau atskirus
// apatinės juostos skirtukus (Progresas/Statistika/Pasiekimai) į vieną, kad
// navigacijos juosta nebūtų perkrauta. Uždarius bet kurį poskyrį, grįžtama
// čia, į centrą — ne tiesiai į pagrindinį ekraną.
export default function ProgressHub({ user, profile, onClose }) {
  const [section, setSection] = useState(null);

  if (section === "photos") return <ClientProgressCompare user={user} onClose={() => setSection(null)} />;
  if (section === "stats") return <ClientStats user={user} onClose={() => setSection(null)} />;
  if (section === "achievements") return <Achievements user={user} profile={profile} onClose={() => setSection(null)} />;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: `linear-gradient(160deg,#3a0a20 0%,${PK.dark} 45%,${PK.mid} 100%)`, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 80, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", animation: "fadeInUp 0.32s cubic-bezier(.23,1,.32,1) both" }}>
      <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingTop: "max(env(safe-area-inset-top), 20px)", paddingLeft: 20, paddingRight: 20, paddingBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><ChevronLeft size={14} />Atgal</button>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 7 }}><TrendingUp size={16} />Mano progresas</h1>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)} style={{
            width: "100%", padding: "16px", borderRadius: 18, background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 14, textAlign: "left",
          }}>
            <span style={{ width: 42, height: 42, borderRadius: "50%", background: `${s.color}2a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <s.Icon size={20} color={s.color} />
            </span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{s.title}</span>
              <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{s.sub}</span>
            </span>
            <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
          </button>
        ))}
      </div>
    </div>
  );
}
