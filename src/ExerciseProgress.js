import { useState, useEffect } from "react";
import { fetchProgressOverview, fetchExerciseHistory, fetchMuscleBalance, fetchWeeklyWorkSummary, maxWeightOf, volumeOf, e1rmOf, formatLastResult } from "./exerciseStats";
import { SearchInput } from "./ui/kit";
import { ChevronLeft, Close, TrendingUp, Flame, Dumbbell, Walk, AlertTriangle, Calendar, BarChart } from "./ui/icons";

const PK = { dark:"#6D1B3B", mid:"#AD1457" };
const KEYFRAMES = `
.tile-tap{ transition: transform 0.15s ease; } .tile-tap:active{ transform: scale(0.96); }
@keyframes chartFadeIn { from { opacity:0; transform:scaleY(0.9); } to { opacity:1; transform:scaleY(1); } }
`;

function fmtDate(d) { return d ? new Date(d + "T12:00:00").toLocaleDateString("lt-LT", { month:"short", day:"numeric" }) : "–"; }

// Mažas tendencijos ženkliukas (▲/▼ + %) — naudojamas plytelėse, naujausio
// srauto eilutėse ir "verta atkreipti dėmesį" sąraše.
function TrendBadge({ pct }) {
  if (pct === null || pct === undefined) return null;
  const up = pct >= 0;
  return (
    <span style={{ fontSize:10, fontWeight:800, color: up?"#7FFFB0":"#FF8888", background: up?"rgba(127,255,176,0.14)":"rgba(255,136,136,0.14)", borderRadius:20, padding:"3px 8px", display:"inline-flex", alignItems:"center", gap:2, flexShrink:0 }}>
      {up?"▲":"▼"}{Math.abs(pct)}%
    </span>
  );
}

// Kompaktiška plytelė sąrašams (verta dėmesio / sustojęs progresas / naujausiai
// atlikta) — dvi kolonos vietoj per visą plotį ištęstų eilučių, kad tilptų
// daugiau informacijos be scrollinimo.
function MiniTile({ onClick, title, subtitle, badge, bg = "rgba(255,255,255,0.05)", border = "rgba(255,255,255,0.1)" }) {
  return (
    <button onClick={onClick} style={{
      background: bg, border: `1px solid ${border}`, borderRadius:12, padding:"9px 10px", color:"#fff",
      cursor:"pointer", fontFamily:"inherit", textAlign:"left", display:"flex", flexDirection:"column", gap:5, minWidth:0,
    }}>
      <p style={{ fontSize:12, fontWeight:700, margin:0, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{title}</p>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6 }}>
        <span style={{ fontSize:9, color:"rgba(255,255,255,0.45)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{subtitle}</span>
        {badge}
      </div>
    </button>
  );
}

// Catmull-Rom → kubinė Bezier — glotni linija vietoj laužtės (tas pats modelis kaip ClientStats.js).
function smoothPath(pts) {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2;
    const c1x = p1[0] + (p2[0]-p0[0])/6, c1y = p1[1] + (p2[1]-p0[1])/6;
    const c2x = p2[0] - (p3[0]-p1[0])/6, c2y = p2[1] - (p3[1]-p1[1])/6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// Animuotas svorio progreso grafikas — linija + gradientinė sritis SVG'e
// (viewBox 0-100 x, non-scaling-stroke), taškai kaip HTML overlay (kad
// neiškraipytų viewBox tempimas), paliečiamas taškas rodo mini tooltip.
function WeightChart({ entries, prId }) {
  const [active, setActive] = useState(entries.length - 1);
  const H = 150, PAD_X = 3, PAD_Y = 20;
  const n = entries.length;
  // Linija piešiama pagal jėgos indeksą (e1RM), o ne žalią svorį — kad grafiko
  // kryptis visada sutaptų su "Jėgos indeksas ±X%" ženkliuku virš jo (žalias
  // svoris vienas gali klaidingai atrodyti kaip kritimas, jei kartojimai augo).
  const vals = entries.map(e1rmOf);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = (max - min) || 1;
  const pts = vals.map((v,i) => [
    PAD_X + (n > 1 ? (i/(n-1)) * (100 - PAD_X*2) : 50),
    PAD_Y + (H - PAD_Y*2) - ((v-min)/range) * (H - PAD_Y*2),
  ]);
  const linePath = smoothPath(pts);
  const areaPath = n > 1 ? `${linePath} L${pts[n-1][0]},${H-PAD_Y} L${pts[0][0]},${H-PAD_Y} Z` : "";

  const activeEntry = entries[active];
  const [ax, ay] = pts[active] || [50, H/2];

  return (
    <div style={{ position:"relative", height:H }}>
      <svg viewBox={`0 0 100 ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display:"block", position:"absolute", inset:0 }}>
        <defs>
          <linearGradient id="wc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6EB4" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#FF6EB4" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {n > 1 && <path d={areaPath} fill="url(#wc-area)" stroke="none" style={{ animation:"chartFadeIn 0.5s ease both", transformOrigin:"bottom" }} />}
        {n > 1 && <path d={linePath} fill="none" stroke="#FF6EB4" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"chartFadeIn 0.5s ease both", transformOrigin:"bottom" }} />}
      </svg>
      {pts.map(([x,y], i) => {
        const isPr = entries[i].id === prId;
        const isActive = i === active;
        const size = isPr ? 13 : 9;
        return (
          <button key={i} onClick={() => setActive(i)} style={{
            position:"absolute", left:`${x}%`, top:y, width:30, height:30, transform:"translate(-50%,-50%)",
            background:"transparent", border:"none", padding:0, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <span style={{
              width:size, height:size, borderRadius:"50%",
              background: isPr ? "#FFD700" : "#fff",
              border: `2px solid ${isPr ? "#FFD700" : "#AD1457"}`,
              boxShadow: isActive ? `0 0 0 5px ${isPr?"rgba(255,215,0,0.28)":"rgba(255,110,180,0.28)"}` : isPr ? "0 0 8px rgba(255,215,0,0.6)" : "none",
              transition:"box-shadow 0.2s",
            }} />
          </button>
        );
      })}
      {activeEntry && (() => {
        // Taškui esant arti krašto, pats žymeklis lieka tikslioje vietoje, bet
        // tooltip'o pozicija apribojama, kad neišlįstų už ekrano ribų ir
        // nepriverstų slinkti viso puslapio horizontaliai.
        const tooltipX = Math.min(80, Math.max(20, ax));
        return (
          <div style={{
            position:"absolute", left:`${tooltipX}%`, top: Math.max(0, ay-54), transform:"translateX(-50%)",
            background:"#1a0a14", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"6px 10px",
            whiteSpace:"nowrap", pointerEvents:"none", boxShadow:"0 4px 14px rgba(0,0,0,0.45)", zIndex:2,
          }}>
            <p style={{ fontSize:12, fontWeight:800, color:"#fff", margin:0 }}>{Math.round(e1rmOf(activeEntry))}kg indeksas</p>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.6)", margin:"1px 0 0" }}>{maxWeightOf(activeEntry)}kg{activeEntry.reps ? ` × ${activeEntry.reps}` : ""}</p>
            <p style={{ fontSize:9, color:"rgba(255,255,255,0.5)", margin:"1px 0 0" }}>{fmtDate(activeEntry.date)}</p>
          </div>
        );
      })()}
    </div>
  );
}

// ── Vieno pratimo istorija — hero skaičius, PR ženkliukas, grafikas ──────────
function ExerciseHistoryView({ clientId }) {
  const [overview, setOverview]     = useState({ tiles:[], feed:[], notable:[], plateaued:[] });
  const [loadingNames, setLoadingN] = useState(true);
  const [search, setSearch]         = useState("");
  const [muscleFilter, setMuscleFilter] = useState(null);
  const [selectedName, setSelName]  = useState(null);
  const [selectedMuscle, setSelMuscle] = useState(null);
  const [history, setHistory]       = useState(null);
  const [loadingHist, setLoadingH]  = useState(false);

  useEffect(() => {
    fetchProgressOverview(clientId).then(o => { setOverview(o); setLoadingN(false); });
  }, [clientId]);
  const { tiles: names, feed, notable, plateaued } = overview;

  useEffect(() => {
    if (!selectedName) return;
    setLoadingH(true);
    fetchExerciseHistory(clientId, selectedName).then(h => { setHistory(h); setLoadingH(false); });
  }, [clientId, selectedName]);

  if (selectedName) {
    const entries = history || [];
    const withWeight = entries.filter(e => maxWeightOf(e) > 0);
    const pr = withWeight.length ? withWeight.reduce((best,e) => maxWeightOf(e) > maxWeightOf(best) ? e : best) : null;
    const first = withWeight[0];
    const last = withWeight[withWeight.length-1];
    const prev = withWeight.length > 1 ? withWeight[withWeight.length-2] : null;

    // Jėgos indeksas (e1RM) ir darbo apimtis lyginami su PRAĖJUSIU kartu (ne pirmu
    // įrašu) — parodo ar žmogus progresuoja dabar, ne vien nuo pat pradžių.
    const lastE1rm = last ? e1rmOf(last) : 0;
    const prevE1rm = prev ? e1rmOf(prev) : 0;
    const strengthDiffPct = prev && prevE1rm > 0 ? Math.round(((lastE1rm - prevE1rm) / prevE1rm) * 100) : null;

    const lastVolume = last ? volumeOf(last) : 0;
    const prevVolume = prev ? volumeOf(prev) : 0;
    const volumeDiffPct = prev && prevVolume > 0 ? Math.round(((lastVolume - prevVolume) / prevVolume) * 100) : null;

    return (
      <div>
        <button onClick={()=>{setSelName(null); setHistory(null);}} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"7px 12px", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5, marginBottom:14 }}>
          <ChevronLeft size={12} />Visi pratimai
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
          {selectedMuscle === "Cardio" ? <Walk size={14} color="#89CFF0" /> : <Dumbbell size={14} color="#FF6EB4" />}
          <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>{selectedName}</span>
        </div>

        {loadingHist ? (
          <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"30px 0" }}>Kraunama...</p>
        ) : withWeight.length === 0 ? (
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", padding:"30px 0" }}>Istorijos dar nėra</p>
        ) : (
          <>
            <div style={{ display:"flex", alignItems:"flex-end", gap:8, flexWrap:"wrap", margin:"6px 0 8px" }}>
              <span style={{ fontSize:42, fontWeight:800, color:"#fff", lineHeight:1 }}>
                {maxWeightOf(last)}<span style={{ fontSize:17, fontWeight:600, color:"rgba(255,255,255,0.4)" }}>kg</span>
              </span>
              {last.reps ? <span style={{ fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>× {last.reps}</span> : null}
              {pr && (
                <span style={{ fontSize:12, fontWeight:800, color:"#FFD700", background:"rgba(255,215,0,0.12)", border:"1px solid rgba(255,215,0,0.3)", borderRadius:20, padding:"5px 11px", marginBottom:8, display:"flex", alignItems:"center", gap:4 }}>
                  <Flame size={12} />PR {maxWeightOf(pr)}kg
                </span>
              )}
            </div>

            {(strengthDiffPct !== null || volumeDiffPct !== null) && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:6 }}>
                {strengthDiffPct !== null && (
                  <span style={{ fontSize:12, fontWeight:800, color: strengthDiffPct>=0?"#7FFFB0":"#FF8888", background: strengthDiffPct>=0?"rgba(127,255,176,0.14)":"rgba(255,136,136,0.14)", borderRadius:20, padding:"6px 12px", display:"flex", alignItems:"center", gap:4 }}>
                    {strengthDiffPct>=0?"▲":"▼"} Jėgos indeksas {strengthDiffPct>=0?"+":""}{strengthDiffPct}%
                  </span>
                )}
                {volumeDiffPct !== null && (
                  <span style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.75)", background:"rgba(255,255,255,0.08)", borderRadius:20, padding:"6px 12px", display:"flex", alignItems:"center", gap:4 }}>
                    Apimtis {volumeDiffPct>=0?"+":""}{volumeDiffPct}%
                  </span>
                )}
              </div>
            )}

            {prev && (
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.4)", margin:"0 0 10px" }}>
                Praeitą kartą {maxWeightOf(prev)}kg×{prev.reps||"–"} → dabar {maxWeightOf(last)}kg×{last.reps||"–"}
              </p>
            )}

            <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", margin:"0 0 4px", textTransform:"uppercase", letterSpacing:0.4 }}>Jėgos indeksas laikui bėgant</p>
            <WeightChart entries={withWeight} prId={pr?.id} />
            <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textAlign:"center", margin:"8px 0 0" }}>
              {withWeight.length} įrašų · {fmtDate(first.date)} – {fmtDate(last.date)}
            </p>
          </>
        )}
      </div>
    );
  }

  const muscles = [...new Set(names.map(n => n.muscle).filter(Boolean))].sort((a,b) => a.localeCompare(b));
  const filtered = names.filter(n =>
    (!search || n.name.toLowerCase().includes(search.toLowerCase())) &&
    (!muscleFilter || n.muscle === muscleFilter)
  );
  function openExercise(name, muscle) { setSelName(name); setSelMuscle(muscle); }
  function daysSinceOf(dateStr) { return Math.floor((Date.now() - new Date(dateStr + "T00:00:00")) / 86400000); }

  return (
    <div>
      {loadingNames ? (
        <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"30px 0" }}>Kraunama...</p>
      ) : names.length === 0 ? (
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", padding:"30px 0" }}>Gyvų treniruočių istorijos dar nėra</p>
      ) : (
        <>
          {notable.length > 0 && (
            <div style={{ marginBottom:18 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", margin:"0 0 8px", textTransform:"uppercase", letterSpacing:0.4 }}>Verta atkreipti dėmesį</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {notable.map(n => (
                  <MiniTile key={n.name} onClick={()=>openExercise(n.name, n.muscle)}
                    title={n.name} subtitle={formatLastResult(n.last)} badge={<TrendBadge pct={n.trendPct} />}
                    bg={n.trendPct>=0 ? "rgba(127,255,176,0.08)" : "rgba(255,136,136,0.08)"}
                    border={n.trendPct>=0 ? "rgba(127,255,176,0.25)" : "rgba(255,136,136,0.25)"} />
                ))}
              </div>
            </div>
          )}

          {plateaued.length > 0 && (
            <div style={{ marginBottom:18 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", margin:"0 0 8px", textTransform:"uppercase", letterSpacing:0.4 }}>Sustojęs progresas — verta keisti krūvį</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {plateaued.map(n => (
                  <MiniTile key={n.name} onClick={()=>openExercise(n.name, n.muscle)}
                    title={n.name} subtitle={formatLastResult(n.last)} badge={<AlertTriangle size={13} color="#FFD700" style={{ flexShrink:0 }} />}
                    bg="rgba(255,200,0,0.06)" border="rgba(255,200,0,0.2)" />
                ))}
              </div>
            </div>
          )}

          {feed.length > 0 && (
            <div style={{ marginBottom:18 }}>
              <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", margin:"0 0 8px", textTransform:"uppercase", letterSpacing:0.4 }}>Naujausiai atlikta</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {feed.map((e,i) => (
                  <MiniTile key={i} onClick={()=>openExercise(e.exercise_name, e.muscle)}
                    title={e.exercise_name} subtitle={`${fmtDate(e.date)} · ${formatLastResult(e)}`} badge={<TrendBadge pct={e.trendPct} />} />
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", margin:"0 0 8px", textTransform:"uppercase", letterSpacing:0.4 }}>Visi pratimai</p>

          {muscles.length > 1 && (
            <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:10, paddingBottom:2 }}>
              <button onClick={()=>setMuscleFilter(null)} style={{ flexShrink:0, padding:"7px 13px", borderRadius:20, border:"none", background: muscleFilter===null ? "#AD1457" : "rgba(255,255,255,0.1)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                Visi
              </button>
              {muscles.map(m => (
                <button key={m} onClick={()=>setMuscleFilter(m)} style={{ flexShrink:0, padding:"7px 13px", borderRadius:20, border:"none", background: muscleFilter===m ? "#AD1457" : "rgba(255,255,255,0.1)", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                  {m}
                </button>
              ))}
            </div>
          )}

          {names.length > 8 && <SearchInput value={search} onChange={setSearch} placeholder="Ieškoti pratimo..." />}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop: names.length > 8 ? 10 : 0 }}>
            {filtered.map(n => {
              const days = daysSinceOf(n.last.date);
              const stale = days >= 21;
              return (
                <button key={n.name} onClick={()=>openExercise(n.name, n.muscle)} className="tile-tap" style={{
                  background:"linear-gradient(160deg, rgba(255,110,180,0.16), rgba(255,110,180,0.05))", border:"1px solid rgba(255,110,180,0.25)",
                  borderRadius:16, padding:"14px 12px", color:"#fff", cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                  display:"flex", flexDirection:"column", gap:10,
                }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background: n.muscle==="Cardio" ? "rgba(137,207,240,0.18)" : "rgba(255,110,180,0.18)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {n.muscle === "Cardio" ? <Walk size={15} color="#89CFF0" /> : <Dumbbell size={15} color="#FF6EB4" />}
                  </div>
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, margin:"0 0 2px", lineHeight:1.25 }}>{n.name}</p>
                    <p style={{ fontSize:10, color:"rgba(255,255,255,0.45)", margin:0 }}>{n.muscle}</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:6, marginTop:-2 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.65)" }}>{formatLastResult(n.last)}</span>
                    {stale ? (
                      <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.45)", background:"rgba(255,255,255,0.08)", borderRadius:20, padding:"3px 8px", flexShrink:0 }}>
                        Seniai · {days}d.
                      </span>
                    ) : (
                      <TrendBadge pct={n.trendPct} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Raumenų grupių balansas — radaro diagrama, lyginanti su tuo, kas ────────
// šiam klientui ĮPRASTA/PLANUOTA (ne tarpusparpiais tarp grupių) ─────────────
const BALANCE_PERIODS = [{ k:14, l:"14 d." }, { k:28, l:"28 d." }, { k:56, l:"56 d." }];

// N-kampio radaro diagrama: kiekviena ašis — raumenų grupė, spindulys —
// kiek % nuo įprastos/planuotos šios grupės dalies realiai atlikta per
// pasirinktą laikotarpį (100% = pilnai atitinka arba viršija normą).
function MuscleRadar({ groups, hasBaseline }) {
  const n = groups.length;
  const size = 300, cx = size/2, cy = size/2 - 6, R = 92;
  const angleFor = i => -Math.PI/2 + i * (2*Math.PI/n);
  const ringPoint = (i, frac) => {
    const a = angleFor(i), r = R * frac;
    return [cx + r*Math.cos(a), cy + r*Math.sin(a)];
  };

  const valueFrac = g => hasBaseline
    ? Math.max(0.04, Math.min(g.compliance, 1))
    : (groups.length ? Math.max(0.04, g.count / Math.max(...groups.map(x=>x.count), 1)) : 0.04);

  const dataPts = groups.map((g,i) => ringPoint(i, valueFrac(g)));
  const dataPath = dataPts.map((p,i) => `${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ") + " Z";
  const rings = [0.33, 0.66, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ display:"block", maxWidth:340, margin:"0 auto" }}>
      <defs>
        <radialGradient id="mr-fill" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="#FF6EB4" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#AD1457" stopOpacity="0.25"/>
        </radialGradient>
      </defs>

      {rings.map(f => (
        <polygon key={f} points={groups.map((_,i)=>ringPoint(i,f).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      ))}
      {groups.map((g,i) => {
        const [ex,ey] = ringPoint(i,1);
        return <line key={g.muscle} x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(255,255,255,0.14)" strokeWidth="1" />;
      })}

      <path d={dataPath} fill="url(#mr-fill)" stroke="#FF6EB4" strokeWidth="2" strokeLinejoin="round" />
      {dataPts.map((p,i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#fff" stroke="#FF6EB4" strokeWidth="1.5" />)}

      {groups.map((g,i) => {
        const [lx,ly] = ringPoint(i, 1.32);
        const anchor = Math.abs(lx-cx) < 8 ? "middle" : lx > cx ? "start" : "end";
        return (
          <text key={g.muscle} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle">
            <tspan x={lx} dy="-6" fontSize="11" fontWeight="700" fill="rgba(255,255,255,0.75)">{g.muscle}</tspan>
            <tspan x={lx} dy="15" fontSize="13" fontWeight="800" fill="#fff">{hasBaseline ? `${Math.round(g.compliance*100)}%` : g.count}</tspan>
          </text>
        );
      })}
    </svg>
  );
}

function MuscleBalanceView({ clientId }) {
  const [period, setPeriod] = useState(28);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ groups:[], behind:[], hasBaseline:false });

  useEffect(() => {
    setLoading(true);
    fetchMuscleBalance(clientId, period).then(d => { setData(d); setLoading(false); });
  }, [clientId, period]);

  const { groups, behind, hasBaseline } = data;
  const total = groups.reduce((s,g) => s + g.count, 0);

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {BALANCE_PERIODS.map(p => (
          <button key={p.k} onClick={()=>setPeriod(p.k)} style={{ flex:1, padding:"9px", borderRadius:12, border:"none", background:period===p.k?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            {p.l}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"30px 0" }}>Kraunama...</p>
      ) : total === 0 ? (
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, textAlign:"center", padding:"30px 0" }}>Šiuo laikotarpiu pratimų neįrašyta</p>
      ) : groups.length < 3 ? (
        <div>
          {groups.map(g => (
            <div key={g.muscle} style={{ position:"relative", height:40, borderRadius:12, background:"rgba(255,255,255,0.08)", overflow:"hidden", marginBottom:8 }}>
              <div style={{ position:"absolute", inset:0, width:`${Math.min(g.compliance,1)*100}%`, background:"linear-gradient(90deg,#AD1457,#FF6EB4)" }} />
              <div style={{ position:"relative", height:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 14px" }}>
                <span style={{ fontSize:13, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:6 }}><Dumbbell size={13} />{g.muscle}</span>
                <span style={{ fontSize:15, fontWeight:800, color:"#fff" }}>{g.count}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <MuscleRadar groups={groups} hasBaseline={hasBaseline} />
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", textAlign:"center", margin:"4px 0 16px" }}>
            {hasBaseline ? "% — kiek atlikta nuo įprastos/planuotos šios grupės dalies" : "Dar nėra su kuo palyginti — rodomas santykinis pasiskirstymas"}
          </p>

          {behind.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {behind.map(g => (
                <div key={g.muscle} style={{ background:"rgba(255,200,0,0.08)", border:"1px solid rgba(255,200,0,0.25)", borderRadius:12, padding:"9px 10px", display:"flex", flexDirection:"column", gap:5, minWidth:0 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#fff", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}><AlertTriangle size={12} color="#FFD700" style={{ flexShrink:0 }} />{g.muscle}</span>
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.45)" }}>atsilieka nuo plano · <span style={{ color:"#FFD700", fontWeight:800 }}>{Math.round(g.compliance*100)}%</span></span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Šios savaitės krūvio santrauka (matoma virš abiejų skirtukų) ────────────
// Kompaktiška plytelė — ta pati vizualinė kalba kaip Kliento anketos
// "Amžius/Ūgis/Svoris" plytelės viršuje, kad santrauka užimtų mažiau vietos.
function StatTile({ Icon, value, label }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:14, padding:"10px 8px", textAlign:"center" }}>
      <Icon size={15} color="rgba(255,255,255,0.6)" style={{ marginBottom:4 }} />
      <p style={{ fontSize:14, fontWeight:800, color:"#fff", margin:"0 0 1px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
      <p style={{ fontSize:9, color:"rgba(255,255,255,0.45)", margin:0, textTransform:"uppercase", letterSpacing:"0.04em" }}>{label}</p>
    </div>
  );
}

function WeeklySummaryCard({ clientId }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    setSummary(null);
    fetchWeeklyWorkSummary(clientId).then(setSummary);
  }, [clientId]);

  if (!summary) return null;
  const { sessionsCompleted, plannedSessions, workingSets, volume, volumeChangePct, sessionCountDiffers, prCount, prNames } = summary;
  if (sessionsCompleted === 0 && volume === 0) return null;

  return (
    <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, padding:"14px 16px", marginBottom:16 }}>
      <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", margin:"0 0 10px", textTransform:"uppercase", letterSpacing:0.4 }}>Šios savaitės krūvis</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
        <StatTile Icon={Calendar} label="Treniruotės" value={plannedSessions ? `${sessionsCompleted}/${plannedSessions}` : sessionsCompleted} />
        <StatTile Icon={Dumbbell} label="Serijos" value={workingSets} />
        <StatTile Icon={BarChart} label="Apimtis" value={`${volume.toLocaleString("lt-LT")}kg`} />
        <StatTile Icon={Flame} label="Rekordai" value={prCount} />
      </div>
      {prNames && prNames.length > 0 && (
        <p style={{ fontSize:11, color:"rgba(255,215,0,0.85)", margin:"10px 0 0" }}>
          <Flame size={11} color="#FFD700" /> {prNames.join(", ")}
        </p>
      )}
      {volumeChangePct !== null && (
        <p style={{ fontSize:12, fontWeight:700, color: volumeChangePct>=0?"#7FFFB0":"#FF8888", margin:"12px 0 0" }}>
          {volumeChangePct>=0?"▲":"▼"} {Math.abs(volumeChangePct)}% viso savaitės krūvio pokytis (visi pratimai kartu) nuo praėjusios savaitės
          {sessionCountDiffers && <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:600 }}> (skirtingas treniruočių skaičius, lyginti reikia atsargiai)</span>}
        </p>
      )}
    </div>
  );
}

export default function ExerciseProgress({ client, onClose }) {
  const [tab, setTab] = useState("progress"); // "progress" | "balance"

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1200, background:`linear-gradient(160deg,#2d0a1a 0%,${PK.dark} 40%,${PK.mid} 100%)`, overflowY:"auto", overflowX:"hidden", WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <style>{KEYFRAMES}</style>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:20, paddingRight:20, paddingBottom:16, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><Close size={14} />Uždaryti</button>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:7 }}><TrendingUp size={15} />Progresas</h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{client.name} · matote tik jūs</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>
        <WeeklySummaryCard clientId={client.id} />

        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {[{k:"progress",l:"Pratimų progresas"},{k:"balance",l:"Raumenų balansas"}].map(t => (
            <button key={t.k} onClick={()=>setTab(t.k)} style={{ flex:1, padding:"10px", borderRadius:12, border:"none", background:tab===t.k?"#AD1457":"rgba(255,255,255,0.1)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === "progress" ? <ExerciseHistoryView clientId={client.id} /> : <MuscleBalanceView clientId={client.id} />}
      </div>
    </div>
  );
}