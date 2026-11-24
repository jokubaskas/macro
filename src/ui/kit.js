// Bendri, pakartotinai naudojami UI mikro-animacijų elementai — vieninga
// vizualinė kalba visame appe (be jokios išorinės animacijos bibliotekos).

import { createPortal } from "react-dom";
import { Search } from "./icons";

export const GLOBAL_KEYFRAMES = `
@keyframes shimmerMove { from { transform: translateX(-120%); } to { transform: translateX(220%); } }
@keyframes fadeInUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
@keyframes breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes popIn { 0% { transform: scale(0.6); opacity:0; } 60% { transform: scale(1.18); opacity:1; } 100% { transform: scale(1); } }
@keyframes confettiBurst { 0% { transform: translate(0,0) rotate(0deg); opacity:1; } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity:0; } }
@keyframes skeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
button, .tap { transition: transform .12s ease-out, filter .12s ease-out; }
button:active, .tap:active { transform: scale(0.96); filter: brightness(0.95); }
`;

// Gradientinė / vientisos spalvos progreso juosta su švelniu švytėjimu ir
// slenkančiu blizgesiu — naudojama visur, kur reikia rodyti % progresą.
export function ProgressBar({ pct, fill, height = 6, glow, shimmer = true, track = "rgba(255,255,255,0.15)", style }) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ position:"relative", borderRadius:99, height, background:track, overflow:"hidden", ...style }}>
      <div style={{
        position:"absolute", left:0, top:0, height:"100%", width:width+"%", borderRadius:99,
        background:fill, transition:"width 0.5s cubic-bezier(.23,1,.32,1)", overflow:"hidden",
        boxShadow: glow ? `0 0 6px 1px ${glow}` : "none",
      }}>
        {shimmer && (
          <div style={{
            position:"absolute", top:0, left:0, height:"100%", width:"40%",
            background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
            animation:"shimmerMove 2.2s ease-in-out infinite",
          }}/>
        )}
      </div>
    </div>
  );
}

// Šviesos „šešėlio" placeholder juostelė kraunamiems duomenims.
export function Skeleton({ width = "100%", height = 14, radius = 8, style }) {
  return (
    <div style={{
      width, height, borderRadius:radius,
      background:"linear-gradient(90deg, rgba(255,255,255,0.07) 25%, rgba(255,255,255,0.16) 37%, rgba(255,255,255,0.07) 63%)",
      backgroundSize:"400% 100%", animation:"skeletonShimmer 1.4s ease-in-out infinite",
      ...style,
    }} />
  );
}

// Kelių vienodo pavidalo "kortelių" skeleton eilučių sąrašas — pakeičia
// statinį "Kraunama..." tekstą sąrašo ekranuose vieninga, judančia placeholder
// vizualizacija. `lines` nurodo kiekvienos kortelės eilučių (width,height) porų
// sąrašą — pagal nutylėjimą imituoja "pavadinimas + antraštė" kortelę.
export function SkeletonList({ rows = 3, lines = [["55%", 14], ["30%", 11]], gap = 10 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:"14px 16px" }}>
          {lines.map(([w, h], j) => (
            <Skeleton key={j} width={w} height={h} style={{ marginBottom: j < lines.length - 1 ? 8 : 0 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Vieningas kraunamo ekrano vaizdas — kvėpuojantis logotipas vietoj statinio teksto.
export function LoadingScreen({ background, textColor, minHeight = "100vh" }) {
  return (
    <div style={{ minHeight, display:"flex", alignItems:"center", justifyContent:"center", background, fontFamily:"-apple-system, sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/logo.png" alt="Coach Vilma" style={{
          width:80, height:80, objectFit:"contain", borderRadius:16, marginBottom:16,
          animation:"breathe 1.8s ease-in-out infinite",
        }} />
        <p style={{ color:textColor, fontSize:14, fontWeight:600, letterSpacing:"0.02em" }}>Kraunama...</p>
      </div>
    </div>
  );
}

// Mygtukas ilgiems sąrašams — rodo tik dalį įrašų, kol paspaudžiamas.
export function ShowMoreButton({ remaining, onClick, label = "Rodyti daugiau" }) {
  if (remaining <= 0) return null;
  return (
    <button onClick={onClick} style={{
      width:"100%", padding:"11px", marginTop:2, marginBottom:8, borderRadius:12,
      border:"1.5px dashed rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.05)",
      color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
    }}>
      {label} ({remaining})
    </button>
  );
}

// Vieningas paieškos laukelis su lupa — filtruoja ilgus sąrašus.
export function SearchInput({ value, onChange, placeholder = "Ieškoti..." }) {
  return (
    <div style={{ position:"relative", marginBottom:12 }}>
      <Search size={14} color="rgba(255,255,255,0.4)" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width:"100%", padding:"10px 12px 10px 34px", borderRadius:12,
          border:"1.5px solid rgba(255,255,255,0.2)", background:"rgba(255,255,255,0.07)",
          color:"#fff", fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box",
        }} />
    </div>
  );
}

// Vieningas patvirtinimo modalas vietoj naršyklės standartinio window.confirm()
// langelio (kuris "išlenda" iš appo stiliaus) — naudojamas visiems
// destruktyviems veiksmams (trynimui ir pan.).
export function ConfirmModal({ title = "Ar tikrai?", message, confirmLabel = "Ištrinti", cancelLabel = "Atšaukti", danger = true, confirming = false, onConfirm, onClose }) {
  return createPortal(
    <div onClick={(e) => { if (e.target === e.currentTarget && !confirming) onClose(); }} style={{ position:"fixed", inset:0, zIndex:1300, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ maxWidth:360, width:"100%", background:"linear-gradient(160deg,#2d0a1a,#6D1B3B)", borderRadius:20, padding:"22px 20px", border:"1px solid rgba(255,255,255,0.15)" }}>
        <p style={{ fontSize:15, fontWeight:700, color:"#fff", margin:"0 0 8px" }}>{title}</p>
        {message && <p style={{ fontSize:13, color:"rgba(255,255,255,0.6)", margin:"0 0 18px", lineHeight:1.4, whiteSpace:"pre-line" }}>{message}</p>}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} disabled={confirming} style={{ flex:1, padding:"11px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.25)", background:"transparent", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{cancelLabel}</button>
          <button onClick={onConfirm} disabled={confirming} style={{ flex:1, padding:"11px", borderRadius:12, border:"none", background: danger ? "linear-gradient(135deg,#8B1A1A,#C0392B)" : "linear-gradient(135deg,#1a4731,#276749)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:confirming?0.7:1 }}>
            {confirming ? "Vykdoma..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Trumpas dalelių „taškšt" efektas (naudojamas švenčiant užbaigimą).
const CONFETTI_COLORS = ["#FFD37A", "#7FFFB0", "#6EC6FF", "#FF6EB4"];

export function ConfettiBurst({ count = 8 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 26 + (i % 3) * 8;
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist - 10;
        const rot = (i % 2 === 0 ? 1 : -1) * (120 + i * 20);
        return (
          <svg key={i} width="8" height="8" viewBox="0 0 24 24" style={{
            position:"absolute", left:"50%", top:"50%", pointerEvents:"none",
            "--dx": `${dx}px`, "--dy": `${dy}px`, "--rot": `${rot}deg`,
            animation:`confettiBurst ${0.7 + (i % 3) * 0.15}s ease-out forwards`,
            animationDelay:`${i * 0.02}s`,
          }}>
            <path d="M12 2.5c.6 3.6 2 6.4 5.7 7.5-3.7 1.1-5.1 3.9-5.7 7.5-.6-3.6-2-6.4-5.7-7.5 3.7-1.1 5.1-3.9 5.7-7.5Z"
              fill={CONFETTI_COLORS[i % CONFETTI_COLORS.length]} />
          </svg>
        );
      })}
    </>
  );
}
