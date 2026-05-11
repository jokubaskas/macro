import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";
import WaterTracker from "./WaterTracker";
import CheckIn from "./CheckIn";
import MotivationalCard from "./MotivationalCard";
import FoodSearch from "./FoodSearch";
import BarcodeScanner from "./BarcodeScanner";

const MEALS = [
  { id:"breakfast", label:"🌅 Pusryčiai" },
  { id:"lunch",     label:"☀️ Pietūs" },
  { id:"dinner",    label:"🌙 Vakarienė" },
  { id:"snack",     label:"🍎 Užkandžiai" },
];

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

export default function ClientView({ user, onLogout }) {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [entries,      setEntries]      = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [activeMeal,   setActiveMeal]   = useState(null);
  const [showMeals,    setShowMeals]    = useState(false);
  const [openMeal,     setOpenMeal]     = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBarcode,     setShowBarcode]     = useState(false);
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
  }, [user.id]);

  const loadEntries = useCallback(async () => {
    const { data } = await supabase
      .from("food_log").select("*")
      .eq("user_id", user.id)
      .eq("date", selectedDate)
      .order("created_at");
    setEntries(data || []);
  }, [user.id, selectedDate]);

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

  const hasData = profile?.weight && profile?.height && profile?.age;
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
          <p style={{ color:PK.blush, fontSize:12, margin:0 }}>Tavo mitybos planas</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"16px 16px 0" }}>
        {!hasData ? (
          <div style={{ background:PK.pale, borderRadius:20, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush, marginTop:8 }}>
            <div style={{ fontSize:40, marginBottom:10 }}>🌸</div>
            <p style={{ color:PK.rose, fontSize:14, fontWeight:600, marginBottom:6 }}>Tavo planas dar ruošiamas</p>
            <p style={{ color:PK.blush, fontSize:12 }}>Trenerė netrukus užpildys tavo duomenis</p>
          </div>
        ) : (
          <>
            {/* Motyvacinė žinutė */}
            <MotivationalCard userId={user.id} res={res} goalId={profile?.goal} />

            {/* Profilis */}
            <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:12, border:"1px solid "+PK.blush, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:42, height:42, borderRadius:"50%", background:PK.light, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                  {profile.gender==="f"?"👩":"👨"}
                </div>
                <div>
                  <p style={{ fontSize:14, fontWeight:700, color:PK.dark, marginBottom:2 }}>{profile.name}</p>
                  <p style={{ fontSize:11, color:PK.rose }}>{profile.age}m. · {profile.weight}kg · {profile.height}cm</p>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:11, color:PK.rose, marginBottom:2 }}>{actLabel}</p>
                <p style={{ fontSize:11, fontWeight:700, color:PK.mid }}>{goalLabel}</p>
              </div>
            </div>

            {/* Dienos planas */}
            <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:20, marginBottom:12, boxShadow:"0 6px 24px rgba(173,20,87,0.3)" }}>
              <p style={{ fontSize:14, fontWeight:700, color:"#fff", textAlign:"center", marginBottom:14 }}>✨ Dienos planas</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                {[{l:"BMR",v:res.bmr,s:"bazinis"},{l:"TDEE",v:res.tdee,s:"su aktyvumu"},{l:"TIKSLAS",v:res.target,s:"per dieną"}].map(item=>(
                  <div key={item.l} style={{ background:"rgba(255,255,255,0.13)", borderRadius:12, padding:"10px 6px", textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{item.v}</div>
                    <div style={{ fontSize:9, color:PK.blush, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 }}>{item.l}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginTop:1 }}>{item.s}</div>
                  </div>
                ))}
              </div>
              <div style={{ height:1, background:"rgba(255,255,255,0.15)", marginBottom:14 }} />
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  {label:"💪 Baltymai",data:res.prot,color:"#FFB3C6"},
                  {label:"🥑 Riebalai",data:res.fat,color:"#FF80AB"},
                  {label:"🍚 Angliavandeniai",data:res.carb,color:"#F48FB1"},
                ].map(macro=>(
                  <div key={macro.label}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{macro.label}</span>
                      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                        <span style={{ fontSize:16, fontWeight:700, color:macro.color }}>{macro.data.g}g</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{macro.data.kcal} kcal</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{macro.data.pct}%</span>
                      </div>
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:99, height:5 }}>
                      <div style={{ width:macro.data.pct+"%", height:"100%", borderRadius:99, background:macro.color, transition:"width 0.6s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", marginTop:14 }}>
                <p style={{ margin:0, fontSize:11, color:PK.blush, lineHeight:1.6, textAlign:"center" }}>💡 {res.tip}</p>
              </div>
            </div>

            {/* Surinkta */}
            <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:18, marginBottom:12, boxShadow:"0 6px 24px rgba(173,20,87,0.3)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <p style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.8)", textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>
                  📊 {isToday ? "Šiandien surinkta" : fmtDate(selectedDate)}
                </p>
                <button
                  onClick={() => setShowCalendar(true)}
                  style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, padding:"5px 9px", cursor:"pointer", fontSize:15, lineHeight:1 }}
                >📅</button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:16 }}>
                {[
                  {l:"Kalorijos",cur:Math.round(totals.kcal),tgt:res.target},
                  {l:"Baltymai",cur:Math.round(totals.protein),tgt:res.prot.g},
                  {l:"Riebalai",cur:Math.round(totals.fat),tgt:res.fat.g},
                  {l:"Angliavandeniai",cur:Math.round(totals.carbs),tgt:res.carb.g},
                ].map(item=>{
                  const pct=item.tgt?Math.min(100,Math.round(item.cur/item.tgt*100)):0;
                  const over=item.cur>item.tgt;
                  return (
                    <div key={item.l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:15, fontWeight:700, color:over?"#FFD700":"#fff" }}>{item.cur}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginBottom:5 }}>/ {item.tgt}</div>
                      <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:5 }}>
                        <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:over?"#FFD700":"rgba(255,255,255,0.85)", transition:"width 0.5s" }} />
                      </div>
                      <div style={{ fontSize:9, color:over?"#FFD700":"rgba(255,255,255,0.8)", fontWeight:700, marginTop:3 }}>{pct}%</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{item.l}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:14 }}>
                {isToday ? (
                  !showMeals ? (
                    <button onClick={() => setShowMeals(true)}
                      style={{ width:"100%", padding:"12px 0", background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:14, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                      🍽️ Pridėti maisto +
                    </button>
                  ) : (
                    <>
                      <MealButtons />
                      <button onClick={closeMeals}
                        style={{ width:"100%", padding:"10px 0", marginTop:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:12, color:"rgba(255,255,255,0.7)", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                        Uždaryti −
                      </button>
                    </>
                  )
                ) : (
                  <MealButtons />
                )}
              </div>
            </div>

            <CheckIn userId={user.id} targetKcal={res?.target} targetProtein={res?.prot?.g} />

            <WaterTracker goal={Math.round(parseFloat(profile.weight)*33)} userId={user.id} date={selectedDate} />
          </>
        )}
      </div>
    </div>
  );
}
