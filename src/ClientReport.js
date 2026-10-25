import { useState, useEffect, useRef, useCallback } from "react";
import { pb, pbFileToken } from "./pb";
import {
  ChevronLeft, Calendar, Dumbbell, Footprints, Droplet, Moon,
  Salad, Heart, Glass, Download, Share, Ruler, Scale, Muscle, BarChart,
} from "./ui/icons";
import { useIsDesktop } from "./ui/responsive";

const PERIODS = [
  { k: 7,  l: "7 d." },
  { k: 14, l: "14 d." },
  { k: 30, l: "Mėnuo" },
  { k: 90, l: "3 mėn." },
];

// Matavimų laukai ataskaitai — tas pats modelis kaip ClientMeasurements.js /
// ClientStats.js, bet su savo spalvų palete ir žymėjimu, kuria kryptimi
// pokytis yra geras (reikalinga rodyklių spalvai delta kortelėse).
const MFIELDS = [
  { key: "weight_measured", label: "Svoris",     unit: "kg", Icon: Scale,    color: "#FF6EB4", lowerBetter: true },
  { key: "body_fat",        label: "Riebalai",   unit: "%",  Icon: BarChart, color: "#FFD700", lowerBetter: true },
  { key: "waist_cm",        label: "Juosmuo",    unit: "cm", Icon: Ruler,    color: "#89CFF0", lowerBetter: true },
  { key: "hips_cm",         label: "Klubai",     unit: "cm", Icon: Ruler,    color: "#C9A0FF", lowerBetter: true },
  { key: "chest_cm",        label: "Krūtinė",    unit: "cm", Icon: Ruler,    color: "#7FFFB0", lowerBetter: false },
  { key: "arm_cm",          label: "Ranka",      unit: "cm", Icon: Muscle,   color: "#FF8888", lowerBetter: false },
  { key: "thigh_cm",        label: "Šlaunis",    unit: "cm", Icon: Ruler,    color: "#FFB347", lowerBetter: false },
  { key: "muscle_mass_kg",  label: "Raum. masė", unit: "kg", Icon: Dumbbell, color: "#4FD1C5", lowerBetter: false },
  { key: "biological_age",  label: "Biolog. amž.", unit: "m.", Icon: Heart,  color: "#FF9E9E", lowerBetter: true },
];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }
function fmtShort(d) { return d ? new Date(d + "T12:00:00").toLocaleDateString("lt-LT", { day: "numeric", month: "short" }) : "–"; }

function StatTile({ Icon, color, value, label }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 4px",
    }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: `${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={11} color={color} />
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{value}</span>
      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.55)", fontWeight: 600, textAlign: "center" }}>{label}</span>
    </div>
  );
}

function MeasureChip({ f }) {
  const goodDir = f.delta != null && (f.lowerBetter ? f.delta < 0 : f.delta > 0);
  const badDir  = f.delta != null && (f.lowerBetter ? f.delta > 0 : f.delta < 0);
  const chipColor = f.delta == null ? f.color : goodDir ? "#7FFFB0" : badDir ? "#FF8888" : "rgba(255,255,255,0.6)";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700,
      color: chipColor, background: `${chipColor}1f`, borderRadius: 8, padding: "4px 8px",
    }}>
      <f.Icon size={10} />
      {f.label} {f.value}{f.unit}
      {f.delta != null && (
        <span>({f.delta > 0 ? "+" : ""}{f.delta.toFixed(1)})</span>
      )}
    </div>
  );
}

export default function ClientReport({ client, onClose }) {
  const isDesktop = useIsDesktop();
  const [periodKey, setPeriodKey] = useState(30);
  const [useCustom, setUseCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(daysAgoStr(29));
  const [customTo, setCustomTo]   = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [fileToken, setFileToken] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const cardRef = useRef(null);

  useEffect(() => { pbFileToken().then(setFileToken); }, []);

  const from = useCustom ? customFrom : daysAgoStr(periodKey - 1);
  const to   = useCustom ? customTo   : todayStr();

  const load = useCallback(async () => {
    setLoading(true);
    const [checkins, sleeps, waters, liveSessions, allMeasurements, allPhotos, profile] = await Promise.all([
      pb.collection("daily_checkins").getFullList({ filter: `user_id="${client.id}" && date>="${from}" && date<="${to}" && is_done=true`, requestKey: null }).catch(() => []),
      pb.collection("sleep_log").getFullList({ filter: `user_id="${client.id}" && date>="${from}" && date<="${to}"`, requestKey: null }).catch(() => []),
      pb.collection("water_log").getFullList({ filter: `user_id="${client.id}" && date>="${from}" && date<="${to}"`, requestKey: null }).catch(() => []),
      pb.collection("live_sessions").getFullList({ filter: `user_id="${client.id}" && completed=true && date>="${from}" && date<="${to}"`, requestKey: null }).catch(() => []),
      pb.collection("trainer_measurements").getFullList({ filter: `user_id="${client.id}"`, sort: "measured_at", requestKey: null }).catch(() => []),
      pb.collection("progress_photos").getFullList({ filter: `user_id="${client.id}"`, sort: "date", requestKey: null }).catch(() => []),
      pb.collection("users").getOne(client.id, { requestKey: null }).catch(() => null),
    ]);

    // Nuotraukos periode — registracijos nuotrauka pridedama, jei jos data patenka į periodą.
    let photos = [...allPhotos];
    if (profile?.photo_front) {
      const regDate = profile.created ? profile.created.slice(0, 10) : null;
      if (regDate && !photos.some(p => p.date === regDate)) {
        photos.push({ id: "reg", date: regDate, photo_front: profile.photo_front, photo_side: profile.photo_side, photo_back: profile.photo_back, _isReg: true, _record: profile });
      }
    }
    photos.sort((a, b) => a.date.localeCompare(b.date));
    const photosInRange = photos.filter(p => p.date >= from && p.date <= to);

    // Matavimai: bazinė reikšmė = paskutinis matavimas PRIEŠ periodą (arba
    // pirmasis periode, jei ankstesnio nėra), naujausia = paskutinis periode.
    const inRangeM = allMeasurements.filter(m => m.measured_at && m.measured_at.slice(0, 10) >= from && m.measured_at.slice(0, 10) <= to);
    const beforeRangeM = allMeasurements.filter(m => m.measured_at && m.measured_at.slice(0, 10) < from);
    const latestM  = inRangeM[inRangeM.length - 1] || null;
    const baseline = beforeRangeM[beforeRangeM.length - 1] || (inRangeM.length > 1 ? inRangeM[0] : null);

    // PocketBase tuščią (nepildytą) skaičiaus lauką saugo kaip 0, ne kaip tuščią
    // reikšmę — todėl čia (kaip ir ClientMeasurements.js/ClientStats.js) naudojamas
    // paprastas "ar reikšmė yra" patikrinimas, ne == null, kitaip neįvestas rodiklis
    // ataskaitoje atsirastų kaip klaidinantis "0".
    const measureDeltas = MFIELDS.map(f => {
      if (!latestM || !latestM[f.key]) return null;
      const lv = parseFloat(latestM[f.key]);
      const bv = (baseline && baseline !== latestM && baseline[f.key]) ? parseFloat(baseline[f.key]) : null;
      return { ...f, value: lv, delta: bv != null ? lv - bv : null };
    }).filter(Boolean);

    const stepsData = checkins.filter(c => c.steps > 0);
    const avgSteps     = stepsData.length ? Math.round(stepsData.reduce((a, c) => a + (c.steps || 0), 0) / stepsData.length) : null;
    const avgSleep     = sleeps.length ? sleeps.reduce((a, s) => a + (s.hours_slept || 0), 0) / sleeps.length : null;
    const avgWaterL    = waters.length ? waters.reduce((a, w) => a + (w.ml || 0), 0) / waters.length / 1000 : null;
    const avgNutrition = checkins.length ? checkins.reduce((a, c) => a + (c.nutrition_score || 0), 0) / checkins.length : null;
    const avgWellbeing = checkins.length ? checkins.reduce((a, c) => a + (c.wellbeing_score || 0), 0) / checkins.length : null;
    const alcoholFreeDays = checkins.length ? checkins.filter(c => !c.alcohol).length : null;
    const workoutsCount = new Set(liveSessions.map(s => s.date)).size;

    setData({ photosInRange, measureDeltas, avgSteps, avgSleep, avgWaterL, avgNutrition, avgWellbeing, alcoholFreeDays, checkinDays: checkins.length, workoutsCount });
    setLoading(false);
  }, [client.id, from, to]);

  useEffect(() => { load(); }, [load]);

  function photoUrl(record, filename) {
    return pb.files.getURL(record, filename, fileToken ? { token: fileToken } : {});
  }

  async function handleExport(share) {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    setExportError("");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null });
      const dataUrl = canvas.toDataURL("image/png");
      const filename = `ataskaita-${(client.name || "klientas").replace(/\s+/g, "_")}-${to}.png`;

      if (share && navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], filename, { type: "image/png" });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "Progreso ataskaita" });
            setExporting(false);
            return;
          }
        } catch { /* atsisakyta arba nepalaikoma — tęsiame su parsisiuntimu */ }
      }
      const a = document.createElement("a");
      a.href = dataUrl; a.download = filename; a.click();
    } catch {
      setExportError("Nepavyko sugeneruoti paveikslėlio. Patikrinkite interneto ryšį ir bandykite dar kartą.");
    }
    setExporting(false);
  }

  const rangeDays = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);
  const firstName = (client.name || "").split(" ")[0];

  return (
    <div style={{ position: isDesktop?"absolute":"fixed", inset: 0, zIndex: 650, background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY: "auto", WebkitOverflowScrolling: "touch", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingTop: "max(env(safe-area-inset-top), 20px)", paddingLeft: 20, paddingRight: 20, paddingBottom: 16, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(10px)" }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><ChevronLeft size={14} />Atgal</button>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 6 }}><BarChart size={15} />Ataskaita</h1>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{client.name}</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>

        {/* Periodo pasirinkimas */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {PERIODS.map(p => (
            <button key={p.k} onClick={() => { setUseCustom(false); setPeriodKey(p.k); }}
              style={{ flex: 1, padding: "9px 4px", borderRadius: 12, border: "none", background: (!useCustom && periodKey === p.k) ? "#AD1457" : "rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {p.l}
            </button>
          ))}
          <button onClick={() => setUseCustom(true)}
            style={{ flex: 1, padding: "9px 4px", borderRadius: 12, border: "none", background: useCustom ? "#AD1457" : "rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Kitas
          </button>
        </div>

        {useCustom && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="date" value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)}
              style={{ flex: 1, padding: "9px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 13, fontFamily: "inherit" }} />
            <input type="date" value={customTo} min={customFrom} max={todayStr()} onChange={e => setCustomTo(e.target.value)}
              style={{ flex: 1, padding: "9px 10px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 13, fontFamily: "inherit" }} />
          </div>
        )}

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center", margin: "0 0 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <Calendar size={11} />{fmtShort(from)} – {fmtShort(to)} · {rangeDays} d.
        </p>

        {loading && <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "24px 0" }}>Kraunama...</p>}

        {!loading && data && (
          <>
            {/* Peržiūra — ta pati kortelė, kuri eksportuojama į nuotrauką */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div ref={cardRef} style={{
                position: "relative", width: 320, minHeight: 568, borderRadius: 24, overflow: "hidden",
                background: "linear-gradient(160deg,#3a0a20 0%,#6D1B3B 45%,#AD1457 100%)",
                padding: "22px 18px", display: "flex", flexDirection: "column", gap: 14,
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              }}>
                {/* Dekoratyviniai švytėjimai */}
                <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,110,180,0.35), transparent 70%)" }} />
                <div style={{ position: "absolute", bottom: -30, left: -40, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(127,255,176,0.2), transparent 70%)" }} />

                {/* Antraštė */}
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                  <img src="/logo.png" alt="" style={{ width: 26, height: 26, objectFit: "contain", borderRadius: 6 }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Coach Vilma</span>
                </div>

                <div style={{ position: "relative" }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>{firstName || "Kliento"} progresas</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 10px" }}>
                    <Calendar size={10} />{fmtShort(from)} – {fmtShort(to)}
                  </span>
                </div>

                {/* Nuotraukos */}
                {data.photosInRange.length > 0 && (
                  data.photosInRange.length === 1 ? (
                    <div style={{ position: "relative" }}>
                      <div style={{ width: "100%", aspectRatio: "3/4", maxHeight: 220, borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img crossOrigin="anonymous" src={photoUrl(data.photosInRange[0]._isReg ? data.photosInRange[0]._record : data.photosInRange[0], data.photosInRange[0].photo_front)} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: "6px 0 0" }}>{fmtShort(data.photosInRange[0].date)}</p>
                    </div>
                  ) : (
                    <div style={{ position: "relative", display: "flex", gap: 8 }}>
                      {[data.photosInRange[0], data.photosInRange[data.photosInRange.length - 1]].map((p, i) => (
                        <div key={i} style={{ flex: 1 }}>
                          <div style={{ width: "100%", aspectRatio: "3/4", maxHeight: 170, borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <img crossOrigin="anonymous" src={photoUrl(p._isReg ? p._record : p, p.photo_front)} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          </div>
                          <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.6)", textAlign: "center", margin: "5px 0 0" }}>{i === 0 ? "Prieš" : "Dabar"} · {fmtShort(p.date)}</p>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Treniruotės — pagrindinis akcentas (rodoma tik jei bent viena atlikta,
                    kad 0 nebūtų supainiotas su realiu rezultatu, kai tiesiog nebuvo žymėta) */}
                {data.workoutsCount > 0 && (
                  <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: "10px 14px" }}>
                    <span style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(127,255,176,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Dumbbell size={16} color="#7FFFB0" />
                    </span>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>{data.workoutsCount} treniruotės</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: 0 }}>atlikta per šį periodą</p>
                    </div>
                  </div>
                )}

                {/* Matavimų pokyčiai */}
                {data.measureDeltas.length > 0 && (
                  <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {data.measureDeltas.map(f => <MeasureChip key={f.key} f={f} />)}
                  </div>
                )}

                {/* Kiti rodikliai */}
                <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  <StatTile Icon={Footprints} color="#FFC15E" value={data.avgSteps != null ? data.avgSteps.toLocaleString() : "–"} label="Žingsniai" />
                  <StatTile Icon={Droplet}    color="#6EC6FF" value={data.avgWaterL != null ? data.avgWaterL.toFixed(1) + "L" : "–"} label="Vanduo" />
                  <StatTile Icon={Moon}       color="#B39DFF" value={data.avgSleep != null ? data.avgSleep.toFixed(1) + "h" : "–"} label="Miegas" />
                  <StatTile Icon={Salad}      color="#7FE3A6" value={data.avgNutrition != null ? data.avgNutrition.toFixed(1) : "–"} label="Mityba" />
                  <StatTile Icon={Heart}      color="#FF9E9E" value={data.avgWellbeing != null ? data.avgWellbeing.toFixed(1) : "–"} label="Savijauta" />
                  <StatTile Icon={Glass}      color="#FF9E7A" value={data.alcoholFreeDays != null ? data.alcoholFreeDays : "–"} label="Be alk. d." />
                </div>

                {/* Poraštė */}
                <p style={{ position: "relative", fontSize: 9, color: "rgba(255,255,255,0.35)", textAlign: "center", margin: 0 }}>sukurta su Coach Vilma</p>
              </div>
            </div>

            {exportError && <p style={{ color: "#FF8888", fontSize: 12, textAlign: "center", marginBottom: 10 }}>{exportError}</p>}

            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              <button onClick={() => handleExport(true)} disabled={exporting} style={{ flex: 1, padding: "13px", borderRadius: 14, background: "linear-gradient(135deg,#6D1B3B,#AD1457)", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: exporting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {exporting ? "Generuojama..." : <><Share size={15} />Pasidalinti</>}
              </button>
              <button onClick={() => handleExport(false)} disabled={exporting} style={{ padding: "13px 16px", borderRadius: 14, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: exporting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Download size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}