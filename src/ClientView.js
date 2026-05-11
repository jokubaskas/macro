import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";
import WaterTracker from "./WaterTracker";
import SleepTracker from "./SleepTracker";
import CheckIn from "./CheckIn";
import MotivationalCard from "./MotivationalCard";
import { calcStepCalories } from "./StepTracker";
import MeasurementReport from "./MeasurementReport";
import FoodSearch from "./FoodSearch";
import BarcodeScanner from "./BarcodeScanner";

const MEALS = [
  { id:"breakfast", label:"🌅 Pusryčiai" },
  { id:"lunch",     label:"☀️ Pietūs" },
  { id:"dinner",    label:"🌙 Vakarienė" },
  { id:"snack",     label:"🍎 Užkandžiai" },
];

// ── Išskleidžiama sekcija ─────────────────────────────────────────────────────
function CollapseSection({ title, subtitle, defaultOpen=false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background:"#fff", borderRadius:16, marginBottom:10, border:"1px solid "+PK.blush, overflow:"hidden" }}>
      <button onClick={()=>setOpen(s=>!s)} style={{
        width:"100%", padding:"12px 16px", background:"none", border:"none",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        cursor:"pointer", fontFamily:"inherit",
      }}>
        <div style={{ textAlign:"left" }}>
          <p style={{ fontSize:13, fontWeight:700, color:PK.dark, margin:0 }}>{title}</p>
          {subtitle && <p style={{ fontSize:11, color:PK.rose, margin:"2px 0 0" }}>{subtitle}</p>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {badge}
          <span style={{ fontSize:16, color:PK.mid, transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s", display:"inline-block" }}>⌄</span>
        </div>
      </button>
      {open && <div style={{ padding:"0 16px 14px" }}>{children}</div>}
    </div>
  );
}

function todayStr() { return new Date().toISOString().split("T")[0]; }
function fmtDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("lt-LT", { year:"numeric", month:"long", day:"numeric" });
}

// ── Rožinis kalendorius ──────────────────────────────────────────────────────
const MONTH_LT = ["Sausis","Vasaris","Kovas","Balandis","Gegužė","Birželis","Liepa","Rugpjūtis","Rugsėjis","Spalis","Lapkritis","Gruodis"];
const DOW_LT   = ["P","A","T","K","P","Š","S"];

function DatePickerModal({ value, minDate, onSelect, onClose }) {
  const today = todayStr();
  const init  = new Date(value + "T12:00:00");
  const [year,  setYear]  = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());

  const minD = new Date((minDate || "2020-01-01") + "T12:00:00");

  function canPrev() {
    const y = month === 0 ? year-1 : year;
    const m = month === 0 ? 11    : month-1;
    return new Date(y, m+1, 0) >= minD;
  }
  function canNext() {
    const y = month === 11 ? year+1 : year;
    const m = month === 11 ? 0      : month+1;
    return new Date(y, m, 1) <= new Date(today + "T12:00:00");
  }
  function prev() { if (!canPrev()) return; month === 0 ? (setMonth(11), setYear(y=>y-1)) : setMonth(m=>m-1); }
  function next() { if (!canNext()) return; month === 11 ? (setMonth(0), setYear(y=>y+1)) : setMonth(m=>m+1); }

  const firstDow   = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d-1; })();
  const daysInMon  = new Date(year, month+1, 0).getDate();
  const cells      = [...Array(firstDow).fill(null), ...Array.from({length:daysInMon},(_,i)=>i+1)];

  return (
    <div
      onClick={onClose}
      style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.55)", fontFamily:"-apple-system,sans-serif" }}
    >
      <div onClick={e=>e.stopPropagation()}
        style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:24, padding:20, width:320, boxShadow:"0 8px 40px rgba(0,0,0,0.4)" }}>

        {/* Antraštė */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <button onClick={prev} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, width:38, height:38, color:"#fff", fontSize:20, cursor:canPrev()?"pointer":"default", opacity:canPrev()?1:0.3, fontFamily:"inherit" }}>‹</button>
          <span style={{ color:"#fff", fontWeight:700, fontSize:15 }}>{MONTH_LT[month]} {year}</span>
          <button onClick={next} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, width:38, height:38, color:"#fff", fontSize:20, cursor:canNext()?"pointer":"default", opacity:canNext()?1:0.3, fontFamily:"inherit" }}>›</button>
        </div>

        {/* Savaitės dienos */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:6 }}>
          {DOW_LT.map((d,i) => (
            <div key={i} style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:700, paddingBottom:6 }}>{d}</div>
          ))}
        </div>

        {/* Dienos */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i}/>;
            const ds = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const isSel  = ds === value;
            const isTod  = ds === today;
            const isOff  = ds < (minDate||"2000-01-01") || ds > today;
            return (
              <button key={i} onClick={() => { if (!isOff) { onSelect(ds); onClose(); } }}
                style={{
                  aspectRatio:"1", border: isTod && !isSel ? "1.5px solid rgba(255,255,255,0.6)" : "none",
                  borderRadius:8, fontSize:13, fontWeight: isSel||isTod ? 700 : 400,
                  cursor: isOff ? "default" : "pointer", fontFamily:"inherit",
                  background: isSel ? "rgba(255,255,255,0.92)" : isTod ? "rgba(255,255,255,0.15)" : "transparent",
                  color: isOff ? "rgba(255,255,255,0.18)" : isSel ? PK.dark : "#fff",
                }}>
                {d}
              </button>
            );
          })}
        </div>

        <button onClick={onClose}
          style={{ width:"100%", marginTop:14, padding:"10px 0", background:"rgba(255,255,255,0.12)", border:"none", borderRadius:12, color:"rgba(255,255,255,0.65)", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
          Uždaryti
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ClientView({ user, onLogout, selectedDate: propDate, onDateChange }) {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [entries,      setEntries]      = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [activeMeal,   setActiveMeal]   = useState(null);
  const [showMeals,    setShowMeals]    = useState(false);
  const [openMeal,     setOpenMeal]     = useState(null);
  const selectedDate = propDate || todayStr();
  const setSelectedDate = (d) => onDateChange ? onDateChange(d) : undefined;
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBarcode,     setShowBarcode]     = useState(false);
  const [hasReport,      setHasReport]      = useState(false);
  const [showReport,     setShowReport]     = useState(false);
  const [openSection,    setOpenSection]    = useState(null); // null|food|health|checkin|targets
  const [todaySleep,     setTodaySleep]     = useState(null);
  const [todayWater,     setTodayWater]     = useState({ ml:0, goal:2000 });
  const [checkinDone,    setCheckinDone]    = useState(null);
  const [todaySteps,     setTodaySteps]     = useState(0);
  const [barcodeFood,  setBarcodeFood]  = useState(null);
  const [minDate,      setMinDate]      = useState(null);

  const isToday = selectedDate === todayStr();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      // Registracijos data kaip minimali data
      if (data?.created_at) setMinDate(data.created_at.split("T")[0]);
      setLoading(false);
    }
    load();

    // Patikrinti ar yra neperskaityta ataskaita
    supabase
      .from("trainer_measurements")
      .select("id")
      .eq("user_id", user.id)
      .is("client_read_at", null)
      .limit(1)
      .then(({ data, error }) => {
        if (error) console.warn("Report check:", error.message);
        if (data?.length) { setHasReport(true); setShowReport(true); }
      });
  }, [user.id]);

  const loadEntries = useCallback(async () => {
    const today = todayStr();
    const weekStart = (() => { const d=new Date(),day=d.getDay(); d.setDate(d.getDate()-day+(day===0?-6:1)); return d.toISOString().split("T")[0]; })();
    const [{ data:food }, { data:sleep }, { data:water }, { data:ci }, { data:stepRow }] = await Promise.all([
      supabase.from("food_log").select("*").eq("user_id",user.id).eq("date",selectedDate).order("created_at"),
      supabase.from("sleep_log").select("hours_slept").eq("user_id",user.id).eq("date",selectedDate).maybeSingle(),
      supabase.from("water_log").select("ml,goal").eq("user_id",user.id).eq("date",selectedDate).maybeSingle(),
      supabase.from("client_checkins").select("is_done").eq("user_id",user.id).eq("week_start",weekStart).maybeSingle(),
      supabase.from("step_log").select("steps").eq("user_id",user.id).eq("date",selectedDate).maybeSingle(),
    ]);
    setEntries(food || []);
    setTodaySleep(sleep?.hours_slept ?? null);
    setTodayWater({ ml: water?.ml || 0, goal: water?.goal || Math.round(parseFloat(profile?.weight||60)*33) });
    setCheckinDone(ci?.is_done ?? false);
    setTodaySteps(stepRow?.steps || 0);
  }, [user.id, selectedDate, profile?.weight]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function addEntry(meal, food) {
    await supabase.from("food_log").insert({
      user_id: user.id, date: selectedDate, meal,
      name: food.name, brand: food.brand || "",
      amount: food.amount, kcal: food.kcal,
      protein: food.protein, fat: food.fat, carbs: food.carbs,
    });
    setSearching(false);
    setActiveMeal(null);
    loadEntries();
  }

  async function removeEntry(id) {
    await supabase.from("food_log").delete().eq("id", id);
    loadEntries();
  }

  function toggleMeal(mealId) { setOpenMeal(prev => prev === mealId ? null : mealId); }
  function closeMeals() { setShowMeals(false); setOpenMeal(null); }
  function handleDateSelect(d) { setSelectedDate(d); setShowMeals(false); setOpenMeal(null); }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,"+PK.pale+",#fff)", fontFamily:"-apple-system,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width:70, height:70, objectFit:"contain", borderRadius:14, marginBottom:12 }} />
        <p style={{ color:PK.rose, fontSize:14 }}>Kraunama...</p>
      </div>
    </div>
  );

  const hasData     = profile?.weight && profile?.height && profile?.age;
  const extraKcal   = calcStepCalories(todaySteps, parseFloat(profile?.weight||60));
  const adjustedTarget = hasData ? (res?.target || 0) + extraKcal : 0;
  const res = hasData ? calcMacros({
    gender: profile.gender, age: parseInt(profile.age),
    weight: parseFloat(profile.weight), height: parseFloat(profile.height),
    actId: profile.act, goalId: profile.goal,
  }) : null;

  const goalLabel = GOALS.find(g => g.id === profile?.goal)?.label ?? "";
  const actLabel  = ACTIVITY.find(a => a.id === profile?.act)?.label ?? "";
  const totals    = entries.reduce((a,e) => ({
    kcal: a.kcal+(e.kcal||0), protein: a.protein+(e.protein||0),
    fat:  a.fat+(e.fat||0),   carbs:   a.carbs+(e.carbs||0),
  }), { kcal:0, protein:0, fat:0, carbs:0 });

  const remaining = res ? {
    kcal:    Math.max(0, res.target  - totals.kcal),
    protein: Math.max(0, res.prot.g  - totals.protein),
    fat:     Math.max(0, res.fat.g   - totals.fat),
    carbs:   Math.max(0, res.carb.g  - totals.carbs),
  } : null;

  function MealButtons() {
    return (
      <>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom: openMeal ? 10 : 0 }}>
          {MEALS.map(meal => {
            const me    = entries.filter(e => e.meal === meal.id);
            const mKcal = me.reduce((a,e) => a+(e.kcal||0), 0);
            const isAct = openMeal === meal.id;
            return (
              <button key={meal.id} onClick={() => toggleMeal(meal.id)}
                style={{
                  padding:"10px 8px",
                  background: isAct ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                  border: isAct ? "1.5px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.15)",
                  borderRadius:12, color:"#fff", fontSize:12, fontWeight:700,
                  cursor:"pointer", fontFamily:"inherit", textAlign:"center", transition:"all 0.15s",
                }}>
                <div>{meal.label}</div>
                {me.length > 0 && <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", marginTop:3 }}>{me.length} įrašai · {Math.round(mKcal)} kcal</div>}
              </button>
            );
          })}
        </div>

        {openMeal && (
          <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:14, overflow:"hidden" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px" }}>
              <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{MEALS.find(m=>m.id===openMeal)?.label}</span>
              {isToday && (
                <div style={{ display:"flex", gap:6 }}>
<button onClick={() => { setActiveMeal(openMeal); setSearching(true); }}
                    style={{ padding:"5px 12px", background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, fontSize:11, fontWeight:700, color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>
                    + Pridėti
                  </button>
                </div>
              )}
            </div>
            {(() => {
              const me = entries.filter(e => e.meal === openMeal);
              if (me.length === 0) return <p style={{ margin:0, padding:"8px 14px 12px", fontSize:11, color:"rgba(255,255,255,0.4)", fontStyle:"italic" }}>Dar nieko nepridėta</p>;
              return me.map(e => (
                <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 14px", borderTop:"1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:"0 0 1px", fontSize:12, color:"#fff", fontWeight:500 }}>{e.name}</p>
                    <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.5)" }}>{e.amount}g · {e.kcal} kcal · B:{e.protein}g R:{e.fat}g A:{e.carbs}g</p>
                  </div>
                  {isToday && <button onClick={() => removeEntry(e.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:16, cursor:"pointer", padding:"0 0 0 8px" }}>✕</button>}
                </div>
              ));
            })()}
          </div>
        )}
      </>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,"+PK.pale+" 0%,#fff 55%,"+PK.light+" 100%)", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom:48 }}>

      {/* Barkodo skenavimas */}
      {showBarcode && (
        <BarcodeScanner
          onResult={food => { setShowBarcode(false); setBarcodeFood(food); setSearching(true); }}
          onClose={() => setShowBarcode(false)}
        />
      )}

      {/* Maisto paieška */}
      {searching && (
        <FoodSearch
          onAdd={food => addEntry(activeMeal, food)}
          onClose={() => { setSearching(false); setActiveMeal(null); }}
          onBarcode={() => { setSearching(false); setShowBarcode(true); }}
          barcodeFood={barcodeFood}
          clearBarcodeFood={() => setBarcodeFood(null)}
        />
      )}

      {/* Rožinis kalendorius */}
      {showCalendar && (
        <DatePickerModal
          value={selectedDate}
          minDate={minDate}
          onSelect={handleDateSelect}
          onClose={() => setShowCalendar(false)}
        />
      )}

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px 20px", position:"relative" }}>
        <button onClick={onLogout} style={{ position:"absolute", right:16, top:16, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, padding:"7px 11px", color:"#fff", fontSize:12, cursor:"pointer" }}>
          Atsijungti
        </button>
        <div style={{ textAlign:"center" }}>
          <img src="/logo.png" alt="Coach Vilma" style={{ width:54, height:54, objectFit:"contain", borderRadius:12, marginBottom:6 }} />
          <h1 style={{ fontSize:19, fontWeight:700, color:"#fff", marginBottom:4 }}>
            Sveika, {profile?.name?.split(" ")[0] ?? ""}!
          </h1>
          {/* Datos pasirinkimas header'yje */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginTop:8 }}>
            <button onClick={()=>setShowCalendar(true)} style={{
              background:"rgba(255,255,255,0.15)",
              border:"1.5px solid rgba(255,255,255,0.3)",
              borderRadius:20, padding:"6px 16px",
              color:"#fff", fontSize:12, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit",
              display:"flex", alignItems:"center", gap:6,
            }}>
              📅 {isToday
                ? new Date().toLocaleDateString("lt-LT",{weekday:"short",month:"short",day:"numeric"})
                : selectedDate}
              <span style={{ fontSize:9, opacity:0.6 }}>▼</span>
            </button>
            {!isToday && (
              <button onClick={()=>setSelectedDate(todayStr())} style={{
                background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)",
                borderRadius:12, padding:"6px 10px", color:PK.blush,
                fontSize:11, cursor:"pointer", fontFamily:"inherit",
              }}>← Šiandien</button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"12px 16px 0" }}>
        {!hasData ? (
          <div style={{ background:PK.pale, borderRadius:20, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush, marginTop:8 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🌸</div>
            <p style={{ color:PK.rose, fontSize:14, fontWeight:600, marginBottom:6 }}>Tavo planas dar ruošiamas</p>
            <p style={{ color:PK.blush, fontSize:12 }}>Trenerė netrukus užpildys tavo duomenis</p>
          </div>
        ) : (
          <>
            {/* Notifikacijos bell */}
          {hasReport && !showReport && (
            <button onClick={()=>setShowReport(true)} style={{
              position:"fixed", bottom:24, right:20, zIndex:500,
              width:52, height:52, borderRadius:"50%",
              background:`linear-gradient(135deg,${PK.dark},${PK.mid})`,
              border:"2px solid rgba(255,255,255,0.3)",
              boxShadow:"0 4px 20px rgba(173,20,87,0.5)",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22,
            }}>
              📊
              <div style={{ position:"absolute", top:0, right:0, width:14, height:14, borderRadius:"50%", background:"#FF4444", border:"2px solid #fff", fontSize:8, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700 }}>1</div>
            </button>
          )}

          {/* Ataskaitos modalas */}
          {showReport && (
            <MeasurementReport
              userId={user.id}
              onClose={()=>{ setShowReport(false); setHasReport(false); }}
            />
          )}

          {/* Motyvacinė žinutė */}
            <MotivationalCard userId={user.id} res={res} goalId={profile?.goal} />

            {/* ── GRID ARBA IŠSKLEISTA SEKCIJA ── */}
            {openSection ? (
              /* ── Išskleista sekcija ── */
              <div>
                {/* Fiksuotas grįžimo mygtukas apačioje */}
                <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:200, padding:"12px 16px 24px", background:"linear-gradient(to top, rgba(109,27,59,0.97) 60%, transparent)", pointerEvents:"none" }}>
                  <button onClick={()=>setOpenSection(null)} style={{
                    pointerEvents:"all",
                    width:"100%", maxWidth:480, display:"block", margin:"0 auto",
                    padding:"14px 0",
                    background:"rgba(255,255,255,0.15)",
                    backdropFilter:"blur(10px)",
                    border:"1.5px solid rgba(255,255,255,0.3)",
                    borderRadius:16, color:"#fff",
                    fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                    letterSpacing:"0.02em",
                  }}>← Grįžti į pagrindinį</button>
                </div>
                {/* Tarpas apačioje kad turinys nesidengtų su mygtuku */}
                <div style={{ height:100 }}/>

                {openSection==="food" && (
                  <div style={{ background:`linear-gradient(135deg,${PK.dark},${PK.mid})`, borderRadius:20, padding:"16px 16px", boxShadow:"0 6px 24px rgba(173,20,87,0.3)", marginBottom:12 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.8)", margin:0 }}>📊 Šiandien surinkta</p>

                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                      {[
                        {l:"Kalorijos",cur:Math.round(totals.kcal),tgt:res.target},
                        {l:"Baltymai",cur:Math.round(totals.protein),tgt:res.prot.g},
                        {l:"Riebalai",cur:Math.round(totals.fat),tgt:res.fat.g},
                        {l:"Angliav.",cur:Math.round(totals.carbs),tgt:res.carb.g},
                      ].map(item=>{ const pct=item.tgt?Math.min(100,Math.round(item.cur/item.tgt*100)):0; const over=item.cur>item.tgt; return (
                        <div key={item.l} style={{ textAlign:"center" }}>
                          <div style={{ fontSize:14, fontWeight:700, color:over?"#FFD700":"#fff" }}>{item.cur}</div>
                          <div style={{ fontSize:8, color:"rgba(255,255,255,0.45)", margin:"2px 0" }}>{item.l}</div>
                          <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:3 }}>
                            <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:over?"#FFD700":"rgba(255,255,255,0.8)" }}/>
                          </div>
                          <div style={{ fontSize:8, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{pct}%</div>
                        </div>
                      );})}
                    </div>
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:14 }}>
                      {isToday ? (
                        !showMeals ? (
                          <button onClick={()=>setShowMeals(true)} style={{ width:"100%", padding:"12px 0", background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:14, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                            🍽️ Pridėti maisto +
                          </button>
                        ) : (
                          <>
                            <MealButtons />
                            <button onClick={closeMeals} style={{ width:"100%", padding:"10px 0", marginTop:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, color:"rgba(255,255,255,0.6)", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                              Uždaryti −
                            </button>
                          </>
                        )
                      ) : <MealButtons />}
                    </div>
                  </div>
                )}

                {openSection==="targets" && (
                  <div style={{ background:`linear-gradient(135deg,${PK.dark},${PK.mid})`, borderRadius:20, padding:"16px", boxShadow:"0 6px 24px rgba(173,20,87,0.3)", marginBottom:12 }}>
                    <p style={{ fontSize:14, fontWeight:700, color:"#fff", textAlign:"center", marginBottom:14 }}>📊 Tavo makro tikslai</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                      {[{l:"BMR",v:res.bmr,s:"bazinis"},{l:"TDEE",v:res.tdee,s:"su aktyvumu"},{l:"Tikslas",v:res.target,s:"per dieną"}].map(item=>(
                        <div key={item.l} style={{ background:"rgba(255,255,255,0.13)", borderRadius:10, padding:"10px 6px", textAlign:"center" }}>
                          <div style={{ fontSize:18, fontWeight:700, color:"#fff" }}>{item.v}</div>
                          <div style={{ fontSize:8, color:PK.blush, fontWeight:700, textTransform:"uppercase" }}>{item.l}</div>
                          <div style={{ fontSize:8, color:"rgba(255,255,255,0.5)" }}>{item.s}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {[
                        {label:"💪 Baltymai",data:res.prot,color:"#FFB3C6"},
                        {label:"🥑 Riebalai",data:res.fat,color:"#FF80AB"},
                        {label:"🍚 Angliavandeniai",data:res.carb,color:"#F48FB1"},
                      ].map(macro=>(
                        <div key={macro.label}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{macro.label}</span>
                            <div style={{ display:"flex", alignItems:"baseline", gap:5 }}>
                              <span style={{ fontSize:15, fontWeight:700, color:macro.color }}>{macro.data.g}g</span>
                              <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{macro.data.kcal} kcal</span>
                            </div>
                          </div>
                          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:99, height:5 }}>
                            <div style={{ width:macro.data.pct+"%", height:"100%", borderRadius:99, background:macro.color }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {openSection==="health" && (
                  <div style={{ paddingBottom:24 }}>
                    <SleepTracker userId={user.id} age={parseInt(profile.age)} date={selectedDate} />
                    <WaterTracker goal={Math.round(parseFloat(profile.weight)*33)} userId={user.id} date={selectedDate} />
                  </div>
                )}

                {openSection==="checkin" && (
                  <CheckIn userId={user.id} targetKcal={res?.target} targetProtein={res?.prot?.g} age={parseInt(profile?.age)} />
                )}
              </div>
            ) : (
              /* ── Kompaktiška grid ── */
              <div>
                {/* 4 kortelės 2x2 */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>

                  {/* Mityba */}
                  {[
                    {
                      key:"food",
                      icon:"🍽️",
                      title:"Mityba šiandien",
                      main: Math.round(totals.kcal)+" kcal",
                      sub: extraKcal>0?`iš ${adjustedTarget} kcal (🚶+${extraKcal})`:`iš ${res.target} kcal tikslo`,
                      pct: adjustedTarget ? Math.min(100,Math.round(totals.kcal/adjustedTarget*100)) : 0,
                      barColor: totals.kcal>res.target?"#FFD700":"#FFB3C6",
                      date: isToday ? null : selectedDate,
                    },
                    {
                      key:"targets",
                      icon:"🎯",
                      title:"Makro tikslai",
                      main: res.target+" kcal",
                      sub: `B:${res.prot.g}g · R:${res.fat.g}g · A:${res.carb.g}g`,
                      pct: null,
                    },
                    {
                      key:"health",
                      icon:"😴",
                      title:"Miegas & Vanduo",
                      main: todaySleep !== null ? todaySleep+"h" : "–",
                      sub: `💧 ${todayWater.ml}/${todayWater.goal} ml`,
                      pct: todayWater.goal ? Math.min(100,Math.round(todayWater.ml/todayWater.goal*100)) : 0,
                      barColor:"#89CFF0",
                    },
                    {
                      key:"checkin",
                      icon: checkinDone ? "✅" : "📋",
                      title:"Savaitinis check-in",
                      main: checkinDone ? "Užpildyta" : "Pildyti →",
                      sub: (() => { const d=new Date(),day=d.getDay(),left=day===0?0:7-day; return checkinDone ? "Kitas: po "+(left===0?7:left)+" d." : left===0?"🔔 Šiandien sekmadienis":"Po "+left+" d. (sekmadienis)"; })(),
                      pct: checkinDone ? 100 : null,
                      barColor:"#7FFFB0",
                    },
                  ].map(card=>(
                    <button key={card.key} onClick={()=>setOpenSection(card.key)} style={{
                      background:`linear-gradient(135deg,${PK.dark},${PK.mid})`,
                      borderRadius:20, border:"none", padding:"18px 16px",
                      cursor:"pointer", fontFamily:"inherit", textAlign:"left",
                      boxShadow:"0 4px 16px rgba(173,20,87,0.28)",
                      display:"flex", flexDirection:"column", justifyContent:"space-between",
                      minHeight:150,
                    }}>
                      <div>
                        <span style={{ fontSize:26 }}>{card.icon}</span>
                        {card.date && <span style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginLeft:6 }}>{card.date}</span>}
                      </div>
                      <div>
                        <p style={{ fontSize:22, fontWeight:800, color:"#fff", margin:"10px 0 2px", lineHeight:1 }}>{card.main}</p>
                        <p style={{ fontSize:10, color:PK.blush, margin:0, lineHeight:1.4 }}>{card.title}</p>
                        <p style={{ fontSize:10, color:"rgba(255,255,255,0.5)", margin:"3px 0 0" }}>{card.sub}</p>
                      </div>
                      {card.pct !== null && (
                        <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:4, marginTop:10 }}>
                          <div style={{ width:card.pct+"%", height:"100%", borderRadius:99, background:card.barColor||"rgba(255,255,255,0.8)", transition:"width 0.5s" }}/>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}
