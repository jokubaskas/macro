// Vieno pratimo serijų vykdymas gyvos treniruotės metu: kiekviena serija
// atliekama atskirai, po pažymėjimo "Atlikta" įsijungia poilsio laikmatis iki
// kitos tos pačios pratimo serijos. Trenerė gali bet kada koreguoti ir
// planuojamas (target_*), ir realiai atliktas (actual_*) reikšmes.
import { useState, useEffect } from "react";
import { pb } from "./pb";
import { ChevronLeft, Check, Timer, Edit, Dumbbell, Close } from "./ui/icons";
import { useIsDesktop } from "./ui/responsive";
import { toast } from "./ui/toast";
import { haptic } from "./ui/pullToRefresh";

export const DEFAULT_REST_SECONDS = 90;

const sinp = { padding: "7px 8px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box", textAlign: "center" };

function fmtTime(totalSec) {
  const t = Math.max(0, Math.round(totalSec));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SetExecution({ exercise, onClose, onExerciseDoneChange }) {
  const isDesktop = useIsDesktop();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [editingDoneId, setEditingDoneId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [addingSet, setAddingSet] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  const isTimed = !!exercise.duration_sec;

  useEffect(() => {
    pb.collection("live_session_sets").getFullList({
      filter: `exercise_id="${exercise.id}"`, sort: "set_number", requestKey: null,
    }).then(setSets).catch(() => []).finally(() => setLoading(false));
  }, [exercise.id]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  function draftKey(id, field) { return `${id}_${field}`; }
  function getDraft(set, field, numericField, fallbackToTarget) {
    const k = draftKey(set.id, field);
    if (k in drafts) return drafts[k];
    let v = set[numericField];
    // PocketBase tušt(ą) Number lauką grąžina kaip 0, ne null — todėl čia
    // tikriname "tuščia" reikšmė (0 arba null/undefined), o ne tik null,
    // kitaip pasiūlymas iš plano niekada nesuveikdavo naujoms serijoms.
    if (!v && fallbackToTarget) v = set[numericField.replace("actual_", "target_")];
    return v != null ? String(v) : "";
  }
  function setDraft(set, field, value) {
    setDrafts(d => ({ ...d, [draftKey(set.id, field)]: value }));
  }
  function clearDraft(set, field) {
    setDrafts(d => { const n = { ...d }; delete n[draftKey(set.id, field)]; return n; });
  }

  async function saveField(set, numericField, rawValue, isDecimal) {
    const parsed = rawValue === "" ? null : (isDecimal ? (parseFloat(String(rawValue).replace(",", ".")) || null) : (parseInt(rawValue) || null));
    setSets(prev => prev.map(s => s.id === set.id ? { ...s, [numericField]: parsed } : s));
    await pb.collection("live_session_sets").update(set.id, { [numericField]: parsed }).catch(() => {});
  }

  // Po kiekvieno "Atlikta"/redagavimo/atšaukimo pratimo bendri laukai
  // (live_session_exercises.sets/reps/weight_kg/set_weights/duration_sec)
  // perrašomi pagal REALIAI atliktas reikšmes — kitaip jie liktų tokie,
  // kokie buvo planuoti kuriant pratimą, ir "Praeitą kartą" palyginimas,
  // Pratimų progreso ekranas bei savaitės statistika (visi skaito šiuos
  // bendrus laukus, ne atskiras serijas) rodytų planą, ne realybę.
  async function syncExerciseAggregate(allSets) {
    const doneSets = allSets.filter(s => s.done).sort((a, b) => a.set_number - b.set_number);
    if (doneSets.length === 0) return;
    const last = doneSets[doneSets.length - 1];
    const payload = { sets: doneSets.length };
    if (isTimed) {
      payload.duration_sec = last.actual_duration_sec || null;
      payload.weight_kg = last.actual_weight_kg || null;
    } else {
      const weights = doneSets.map(s => s.actual_weight_kg || 0);
      const hasWeight = weights.some(w => w > 0);
      payload.set_weights = hasWeight ? JSON.stringify(weights) : null;
      payload.weight_kg = hasWeight ? Math.max(...weights) : null;
      payload.reps = last.actual_reps || null;
    }
    await pb.collection("live_session_exercises").update(exercise.id, payload).catch(() => {});
  }

  const sorted = [...sets].sort((a, b) => a.set_number - b.set_number);
  const activeIdx = sorted.findIndex(s => !s.done);
  const allDone = activeIdx === -1 && sorted.length > 0;

  const prevSet = activeIdx > 0 ? sorted[activeIdx - 1] : null;
  const restSeconds = prevSet?.rest_seconds ?? DEFAULT_REST_SECONDS;
  const restUntil = prevSet?.done_at ? new Date(prevSet.done_at).getTime() + restSeconds * 1000 : 0;
  const isResting = !!prevSet && nowTick < restUntil;
  const remainingRest = isResting ? Math.ceil((restUntil - nowTick) / 1000) : 0;

  // Poilsio praleidimas tiesiog nunulina TOS serijos poilsio trukmę
  // duombazėje (ne tik lokaliai) — taip, uždarius ir vėl atsidarius šį
  // pratimą prieš pasibaigiant realiam laikui, laikmatis nebeatsistato.
  async function skipRest() {
    if (!prevSet) return;
    setSets(prev => prev.map(s => s.id === prevSet.id ? { ...s, rest_seconds: 0 } : s));
    await pb.collection("live_session_sets").update(prevSet.id, { rest_seconds: 0 }).catch(() => {});
  }

  async function markDone(set) {
    setSavingId(set.id);
    const payload = isTimed
      ? {
          actual_duration_sec: parseInt(getDraft(set, "a_dur", "actual_duration_sec", true)) || null,
          actual_weight_kg: parseFloat(String(getDraft(set, "a_w", "actual_weight_kg", true)).replace(",", ".")) || null,
        }
      : {
          actual_reps: parseInt(getDraft(set, "a_reps", "actual_reps", true)) || null,
          actual_weight_kg: parseFloat(String(getDraft(set, "a_w", "actual_weight_kg", true)).replace(",", ".")) || null,
        };
    payload.done = true;
    payload.done_at = new Date().toISOString();
    const rec = await pb.collection("live_session_sets").update(set.id, payload).catch(() => null);
    setSavingId(null);
    if (!rec) { toast("Nepavyko išsaugoti serijos.", "error"); return; }
    haptic(15);
    setSets(prev => {
      const next = prev.map(s => s.id === rec.id ? rec : s);
      const done = next.length > 0 && next.every(s => s.done);
      onExerciseDoneChange?.(exercise.id, done);
      syncExerciseAggregate(next);
      return next;
    });
  }

  async function saveEditedDone(set) {
    setSavingId(set.id);
    const payload = isTimed
      ? {
          actual_duration_sec: parseInt(getDraft(set, "a_dur_edit", "actual_duration_sec")) || null,
          actual_weight_kg: parseFloat(String(getDraft(set, "a_w_edit", "actual_weight_kg")).replace(",", ".")) || null,
        }
      : {
          actual_reps: parseInt(getDraft(set, "a_reps_edit", "actual_reps")) || null,
          actual_weight_kg: parseFloat(String(getDraft(set, "a_w_edit", "actual_weight_kg")).replace(",", ".")) || null,
        };
    const rec = await pb.collection("live_session_sets").update(set.id, payload).catch(() => null);
    setSavingId(null);
    if (rec) setSets(prev => {
      const next = prev.map(s => s.id === rec.id ? rec : s);
      syncExerciseAggregate(next);
      return next;
    });
    setEditingDoneId(null);
  }

  // Leidžia grąžinti klaidingai pažymėtą seriją atgal į "neatlikta" (pvz.
  // paspausta per klaidą arba su neteisingomis reikšmėmis) — kitaip vienintelis
  // būdas pataisyti būtų ištrinti visą pratimą ir pridėti iš naujo.
  async function resetSet(set) {
    setSavingId(set.id);
    const rec = await pb.collection("live_session_sets").update(set.id, { done: false, done_at: null }).catch(() => null);
    setSavingId(null);
    if (!rec) return;
    setSets(prev => {
      const next = prev.map(s => s.id === rec.id ? rec : s);
      const done = next.length > 0 && next.every(s => s.done);
      onExerciseDoneChange?.(exercise.id, done);
      syncExerciseAggregate(next);
      return next;
    });
  }

  async function addExtraSet() {
    setAddingSet(true);
    const last = sorted[sorted.length - 1];
    const rec = await pb.collection("live_session_sets").create({
      exercise_id: exercise.id, set_number: (last?.set_number || 0) + 1,
      target_reps: last?.target_reps ?? null, target_weight_kg: last?.target_weight_kg ?? null,
      target_duration_sec: last?.target_duration_sec ?? null, rest_seconds: last?.rest_seconds ?? DEFAULT_REST_SECONDS,
    }).catch(() => null);
    setAddingSet(false);
    if (rec) setSets(prev => [...prev, rec]);
  }

  return (
    <div style={{ position: isDesktop ? "absolute" : "fixed", inset: 0, zIndex: 900, background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingTop: isDesktop ? "20px" : "max(env(safe-area-inset-top), 20px)", paddingLeft: 20, paddingRight: 20, paddingBottom: 16, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "8px 14px", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><ChevronLeft size={14} />Atgal</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{exercise.exercise_name}</h1>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{exercise.muscle}</p>
        </div>
        {sorted.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: allDone ? "#7FFFB0" : "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 11px", flexShrink: 0, display: "flex", alignItems: "center", gap: 5 }}>
            <Dumbbell size={11} />{sorted.filter(s => s.done).length}/{sorted.length}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "24px 0" }}>Kraunama...</p>
        ) : sorted.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "24px 0" }}>Šiam pratimui serijų nėra.</p>
        ) : (
          <>
            {allDone && (
              <div style={{ background: "rgba(127,255,176,0.08)", border: "1px solid rgba(127,255,176,0.3)", borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={16} color="#7FFFB0" />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#7FFFB0", margin: 0 }}>Visos serijos atliktos</p>
              </div>
            )}

            {activeIdx !== -1 && isResting && (
              <div style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.3)", borderRadius: 16, padding: "18px 16px", marginBottom: 14, textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#FFD700", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Poilsis</p>
                <p style={{ fontSize: 34, fontWeight: 800, color: "#fff", margin: "0 0 12px", fontVariantNumeric: "tabular-nums" }}>{fmtTime(remainingRest)}</p>
                <button onClick={skipRest} style={{ padding: "9px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Praleisti poilsį
                </button>
              </div>
            )}

            {sorted.map((set, idx) => {
              const isActive = idx === activeIdx && !isResting;
              const isLocked = idx > activeIdx || (idx === activeIdx && isResting);
              const isEditingDone = set.done && editingDoneId === set.id;
              const showInputs = isActive || isEditingDone;

              return (
                <div key={set.id} style={{
                  background: set.done ? "rgba(127,255,176,0.06)" : isLocked ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${set.done ? "rgba(127,255,176,0.25)" : isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 14, padding: "12px 14px", marginBottom: 8, opacity: isLocked && !set.done ? 0.5 : 1,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Serija {set.set_number}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {set.done && !isEditingDone && (
                        <>
                          <button onClick={() => setEditingDoneId(set.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                            <Edit size={10} />redaguoti
                          </button>
                          <button onClick={() => resetSet(set)} disabled={savingId === set.id} style={{ background: "none", border: "none", color: "rgba(255,136,136,0.6)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                            <Close size={10} />žymėti neatlikta
                          </button>
                        </>
                      )}
                      {set.done && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#7FFFB0", display: "flex", alignItems: "center", gap: 3 }}><Check size={11} />Atlikta</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: showInputs ? 10 : 8 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", flexShrink: 0, width: 44 }}>Planas</span>
                    {isTimed ? (
                      <>
                        <input type="number" value={getDraft(set, "t_dur", "target_duration_sec")} onChange={e => setDraft(set, "t_dur", e.target.value)} onBlur={e => { saveField(set, "target_duration_sec", e.target.value, false); clearDraft(set, "t_dur"); }} style={{ ...sinp, maxWidth: 70 }} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>s</span>
                      </>
                    ) : (
                      <>
                        <input type="number" value={getDraft(set, "t_reps", "target_reps")} onChange={e => setDraft(set, "t_reps", e.target.value)} onBlur={e => { saveField(set, "target_reps", e.target.value, false); clearDraft(set, "t_reps"); }} style={{ ...sinp, maxWidth: 60 }} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>×</span>
                      </>
                    )}
                    <input type="text" inputMode="decimal" value={getDraft(set, "t_w", "target_weight_kg")} onChange={e => setDraft(set, "t_w", e.target.value)} onBlur={e => { saveField(set, "target_weight_kg", e.target.value, true); clearDraft(set, "t_w"); }} placeholder="kg" style={{ ...sinp, maxWidth: 70 }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>kg</span>
                  </div>

                  {showInputs && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 10, color: "rgba(127,255,176,0.8)", flexShrink: 0, width: 44, fontWeight: 700 }}>Atlikta</span>
                      {isTimed ? (
                        <>
                          <input type="number" value={getDraft(set, isEditingDone ? "a_dur_edit" : "a_dur", "actual_duration_sec", !isEditingDone)} onChange={e => setDraft(set, isEditingDone ? "a_dur_edit" : "a_dur", e.target.value)} style={{ ...sinp, maxWidth: 70 }} />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>s</span>
                        </>
                      ) : (
                        <>
                          <input type="number" value={getDraft(set, isEditingDone ? "a_reps_edit" : "a_reps", "actual_reps", !isEditingDone)} onChange={e => setDraft(set, isEditingDone ? "a_reps_edit" : "a_reps", e.target.value)} style={{ ...sinp, maxWidth: 60 }} />
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>×</span>
                        </>
                      )}
                      <input type="text" inputMode="decimal" value={getDraft(set, isEditingDone ? "a_w_edit" : "a_w", "actual_weight_kg", !isEditingDone)} onChange={e => setDraft(set, isEditingDone ? "a_w_edit" : "a_w", e.target.value)} placeholder="kg" style={{ ...sinp, maxWidth: 70 }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>kg</span>
                    </div>
                  )}

                  {set.done && !isEditingDone && (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "0 0 8px" }}>
                      {isTimed ? `${set.actual_duration_sec ?? "–"}s` : `${set.actual_reps ?? "–"} kart.`}{set.actual_weight_kg ? ` · ${set.actual_weight_kg}kg` : ""}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 5 }}>
                      <Timer size={10} />Poilsis po:
                      <input type="number" value={getDraft(set, "rest", "rest_seconds")} onChange={e => setDraft(set, "rest", e.target.value)} onBlur={e => { saveField(set, "rest_seconds", e.target.value, false); clearDraft(set, "rest"); }} style={{ ...sinp, width: 50, padding: "4px 6px" }} />
                      s
                    </label>
                    {isActive && (
                      <button onClick={() => markDone(set)} disabled={savingId === set.id} style={{ padding: "9px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#1a4731,#276749)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                        <Check size={13} />{savingId === set.id ? "Saugoma..." : "Atlikta"}
                      </button>
                    )}
                    {isEditingDone && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => setEditingDoneId(null)} style={{ padding: "7px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Atšaukti</button>
                        <button onClick={() => saveEditedDone(set)} disabled={savingId === set.id} style={{ padding: "7px 14px", borderRadius: 10, border: "none", background: "#AD1457", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Išsaugoti</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <button onClick={addExtraSet} disabled={addingSet} style={{ width: "100%", padding: 11, borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "2px dashed rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Dumbbell size={12} />{addingSet ? "Pridedama..." : "+ Pridėti papildomą seriją"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
