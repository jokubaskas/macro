import { useState, useEffect, useRef } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { MOOD } from "./constants";
import { Droplet, Glass, CheckCircle } from "./ui/icons";
const PK = {
  dark:"#6D1B3B", mid:"#AD1457",
  blush:"#F8BBD9", light:"#FCE4EC", pale:"#FFF0F5",
  water:"#378ADD",
};

const ML = 250;
function todayStr() { return new Date().toISOString().split("T")[0]; }

// Stiklinės kontūras su suapvalintais apatiniais kampais — modernesnis siluetas.
const GLASS_PATH = "M6,6 L9.4,51.6 Q10,56 14,56 L34,56 Q38,56 38.6,51.6 L42,6 Z";

// Kartotinė sinusoidė vandens paviršiui (naudojama su horizontalia slinktimi).
function waveD(y) {
  const a = 2.2, wl = 16, startX = -16, endX = 64, bottomY = 64;
  let d = `M${startX},${y}`;
  for (let x = startX; x < endX; x += wl) {
    d += ` q${wl / 4},${-a} ${wl / 2},0 q${wl / 4},${a} ${wl / 2},0`;
  }
  d += ` L${endX},${bottomY} L${startX},${bottomY} Z`;
  return d;
}

const KEYFRAMES = `
@keyframes waterDrift { from { transform: translateX(0); } to { transform: translateX(-16px); } }
@keyframes bubbleUp { 0% { transform: translateY(0) scale(1); opacity: .85; } 100% { transform: translateY(-26px) scale(.3); opacity: 0; } }
@keyframes pulseGlow { 0%, 100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.25); } }
@keyframes shimmerMove { from { transform: translateX(-120%); } to { transform: translateX(220%); } }
`;

function GradientBar({ pct, done, height = 6 }) {
  return (
    <div style={{ position:"relative", borderRadius:99, height, background:"rgba(255,255,255,0.15)", overflow:"hidden" }}>
      <div style={{
        position:"absolute", left:0, top:0, height:"100%", width:pct+"%", borderRadius:99,
        background: done ? `linear-gradient(90deg,${MOOD.good.c2},${MOOD.good.c1})` : `linear-gradient(90deg,${MOOD.water.c2},${MOOD.water.c1})`,
        transition:"width 0.5s cubic-bezier(.23,1,.32,1)",
        overflow:"hidden",
      }}>
        <div style={{
          position:"absolute", top:0, left:0, height:"100%", width:"40%",
          background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
          animation:"shimmerMove 2.2s ease-in-out infinite",
        }}/>
      </div>
    </div>
  );
}

export default function WaterTracker({ goal: defaultGoal = 2000, userId, date, compact = false, initialData, onSaved }) {
  const currentDate = date || todayStr();
  const isToday = currentDate === todayStr();

  const [drunk,  setDrunk]  = useState(initialData?.ml || 0);
  const [goal,   setGoal]   = useState(initialData?.goal || defaultGoal);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!!initialData);
  const [splashIndex, setSplashIndex] = useState(-1);
  const scrollRef = useRef(null);
  const splashTimer = useRef(null);

  const filled      = Math.floor(drunk / ML);
  const totalGlasses = Math.max(Math.ceil(goal / ML), filled);
  const pct          = Math.min(100, Math.round(drunk / goal * 100));
  const done         = drunk >= goal;

  useEffect(() => {
  if (!userId) return;
  async function load() {
    const data = await pbFirst("water_log", `user_id="${userId}" && date="${currentDate}"`);
    if (data) { setDrunk(data.ml || 0); setGoal(data.goal || defaultGoal); }
    else       { setDrunk(0); setGoal(defaultGoal); }
    setLoaded(true);
  }
  load();
// eslint-disable-next-line
}, [userId, currentDate]);

  useEffect(() => () => clearTimeout(splashTimer.current), []);

  async function save(newDrunk) {
    if (!userId || !isToday) return;
    setSaving(true);
    await pbUpsert("water_log", `user_id="${userId}" && date="${currentDate}"`, { user_id:userId, date:currentDate, ml:newDrunk, goal });

    setSaving(false);
    onSaved?.();
  }

  function triggerSplash(index) {
    setSplashIndex(index);
    clearTimeout(splashTimer.current);
    splashTimer.current = setTimeout(() => setSplashIndex(-1), 750);
  }

  function clickGlass(index) {
    if (!isToday) return;
    const isFilled     = index < filled;
    const isLastFilled = index === filled - 1;
    if (isFilled && !isLastFilled) return;
    const newDrunk = isFilled ? index * ML : (index + 1) * ML;
    if (!isFilled) triggerSplash(index);
    setDrunk(newDrunk);
    save(newDrunk);
    // auto-scroll pašalintas
  }

  function addGlass() {
    if (!isToday) return;
    triggerSplash(filled);
    const newDrunk = drunk + ML;
    setDrunk(newDrunk);
    save(newDrunk);
    // auto-scroll pašalintas
  }

  if (!loaded) return null;

  // ── Kompaktiškas režimas ──────────────────────────────────────────────────
  if (compact) {
    return (
      <>
        <style>{KEYFRAMES}</style>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Droplet size={16} color={PK.water} />
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:11, color:PK.dark, fontWeight:600 }}>{drunk} / {goal} ml</span>
              <span style={{ fontSize:11, color: done ? "#27ae60" : PK.mid, fontWeight:700 }}>{pct}%</span>
            </div>
            <GradientBar pct={pct} done={done} height={5} />
          </div>
          <span style={{ fontSize:11, color:PK.mid, fontWeight:700, minWidth:30, textAlign:"right", display:"flex", alignItems:"center", justifyContent:"flex-end", gap:3 }}>{filled}<Glass size={13} /></span>
        </div>
      </>
    );
  }

  const GlassSVG = ({ index }) => {
    const isFilled     = index < filled;
    const isLastFilled = index === filled - 1;
    const isNext       = index === filled && !done;
    const clickable    = isToday && (isLastFilled || index >= filled);
    const splashing    = splashIndex === index;

    const waterTopY = 14;
    const cid = "wcp" + index;
    const gid = "wgrad" + index;

    return (
      <div onClick={() => clickable && clickGlass(index)}
        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4,
          cursor: clickable ? "pointer" : "default", flexShrink:0, width:52 }}>
        <svg viewBox="0 0 48 60" width="42" height="52">
          <defs>
            <clipPath id={cid}>
              <path d={GLASS_PATH}/>
            </clipPath>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={MOOD.water.c1}/>
              <stop offset="100%" stopColor={MOOD.water.c2}/>
            </linearGradient>
          </defs>

          <path d={GLASS_PATH} fill={isNext ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"} />

          {/* vanduo — kyla į viršų su „atšokimu" ir banguoja paviršiuje */}
          <g clipPath={`url(#${cid})`}>
            <g style={{
              transform: `translateY(${isFilled ? 0 : 60}px)`,
              transition: "transform 0.7s cubic-bezier(.34,1.56,.64,1)",
            }}>
              <rect x="0" y={waterTopY + 3} width="48" height="60" fill={`url(#${gid})`} />
              <path d={waveD(waterTopY)} fill={`url(#${gid})`}
                style={{ animation: "waterDrift 2.6s linear infinite" }}/>
            </g>
          </g>

          {isNext && (
            <rect x="6" y="46" width="36" height="10" fill="rgba(255,255,255,0.16)"
              clipPath={`url(#${cid})`} style={{ transition:"all 0.3s" }}/>
          )}

          <path d={GLASS_PATH} fill="none"
            stroke={isFilled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)"}
            strokeWidth={isFilled?"2":"1.5"} strokeLinejoin="round"
            style={{ transition:"stroke 0.3s, stroke-width 0.3s" }}/>
          <line x1="6" y1="6" x2="42" y2="6"
            stroke={isFilled?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.35)"}
            strokeWidth={isFilled?"2":"1.5"} strokeLinecap="round"/>

          {/* stiklo blizgesys */}
          <path d="M12,9 L15,9 L11,40 L8,40 Z" fill="rgba(255,255,255,0.14)"/>

          {splashing && Array.from({ length:5 }).map((_, b) => (
            <circle key={b} cx={13 + b * 5.5} cy="48" r={1.3 + (b % 2) * 0.6}
              fill="rgba(255,255,255,0.85)"
              style={{ animation:`bubbleUp ${0.55 + b * 0.08}s ease-out forwards`, animationDelay:`${b * 0.05}s` }}/>
          ))}

          {isLastFilled && isToday && <text x="24" y="27" textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.9)" fontWeight="700">−</text>}
          {!isLastFilled && isFilled && <path d="M19.5,27 L22.5,30 L28.5,23" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>}
          {isNext && <text x="24" y="27" textAnchor="middle" fontSize="18" fill="rgba(255,255,255,0.8)" fontWeight="400">+</text>}
        </svg>
        <span style={{ fontSize:9, color:"rgba(255,255,255,0.6)", fontWeight:isFilled?"700":"400" }}>250ml</span>
      </div>
    );
  };

  return (
    <div style={{
      background:"rgba(0,0,0,0.2)",
      borderRadius:20, padding:"16px 16px",
      boxShadow:"0 6px 24px rgba(173,20,87,0.3)",
    }}>
      <style>{KEYFRAMES}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.8)", display:"inline-flex", alignItems:"center", gap:5 }}><Droplet size={14} />Vanduo</span>
          <span style={{ fontSize:22, fontWeight:700, color:done?"#7FFFB0":"#fff" }}>{drunk}</span>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>/ {goal}ml</span>
          {saving && <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>●</span>}
        </div>
        <span style={{ fontSize:11, color:done?"#7FFFB0":"rgba(255,255,255,0.6)", fontWeight:done?700:400, display:"inline-flex", alignItems:"center", gap:4 }}>
          {done ? <><CheckCircle size={12} />Tikslas pasiektas!</> : "Liko "+(goal-drunk)+"ml"}
        </span>
      </div>

      <div style={{ position:"relative", marginBottom:16 }}>
        <GradientBar pct={pct} done={done} height={8} />
        {pct > 0 && (
          <div style={{
            position:"absolute", top:"50%", left:`${pct}%`, transform:"translate(-50%,-50%)",
            width:14, height:14, borderRadius:"50%",
            background: done ? `radial-gradient(circle at 34% 28%, ${MOOD.good.c1}, ${MOOD.good.c2})` : `radial-gradient(circle at 34% 28%, ${MOOD.water.c1}, ${MOOD.water.c2})`,
            boxShadow: done ? `0 0 8px 2px ${MOOD.good.c1}99` : `0 0 8px 2px ${MOOD.water.c1}99`,
            transition:"left 0.5s cubic-bezier(.23,1,.32,1)",
            animation: done ? "pulseGlow 1.6s ease-in-out infinite" : "none",
          }} />
        )}
      </div>

      <div ref={scrollRef} style={{
        display:"flex", gap:6, overflowX:"auto", paddingBottom:4,
        scrollbarWidth:"none", msOverflowStyle:"none",
        WebkitOverflowScrolling:"touch",
      }}>
        {Array.from({ length: totalGlasses }, (_, i) => <GlassSVG key={i} index={i} />)}
        {isToday && (
          <div onClick={addGlass} style={{
            flexShrink:0, width:52, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer",
          }}>
            <div style={{
              width:42, height:52, borderRadius:10,
              border:"1.5px dashed rgba(255,255,255,0.35)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <span style={{ fontSize:20, color:"rgba(255,255,255,0.5)" }}>+</span>
            </div>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>250ml</span>
          </div>
        )}
      </div>
    </div>
  );
}