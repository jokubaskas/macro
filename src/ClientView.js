import { useState, useEffect, useCallback } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";
import { ALL_FOODS } from "./foodDatabase";
import WaterTracker from "./WaterTracker";
import SleepTracker from "./SleepTracker";
import CheckIn from "./CheckIn";
import MotivationalCard from "./MotivationalCard";
import { calcStepCalories, calcWorkoutCalories } from "./StepTracker";
import MeasurementReport from "./MeasurementReport";
import FoodSearch from "./FoodSearch";
import BarcodeScanner from "./BarcodeScanner";

const MEALS = [
  { id:"breakfast", label:"🌅 Pusryčiai" },
  { id:"lunch",     label:"☀️ Pietūs" },
  { id:"dinner",    label:"🌙 Vakarienė" },
  { id:"snack",     label:"🍎 Užkandžiai" },
];

function todayStr() { return new Date().toISOString().split("T")[0]; }

function getPer100(entry) {
  if (!entry.amount || entry.amount <= 0) return { kcal:0, protein:0, fat:0, carbs:0 };
  const r = entry.amount / 100;
  return {
    kcal:    (entry.kcal    || 0) / r,
    protein: (entry.protein || 0) / r,
    fat:     (entry.fat     || 0) / r,
    carbs:   (entry.carbs   || 0) / r,
  };
}

// ── Redagavimo panelis (dark stilius) ────────────────────────────────────────
function EntryEditor({ entry, onSave, onClose }) {
  const per100   = getPer100(entry);
  const foodInDb = ALL_FOODS.find(f => f.name === entry.name);
  const hasUnits = foodInDb?.units?.length > 0;

  const [inputMode,    setInputMode]    = useState(hasUnits ? "unit" : "grams");
  const [selectedUnit, setSelectedUnit] = useState(hasUnits ? foodInDb.units[0] : null);
  const [unitCount,    setUnitCount]    = useState("1");
  const [grams,        setGrams]        = useState(String(entry.amount));

  useEffect(() => {
    if (hasUnits && selectedUnit) {
      const cnt = entry.amount / selectedUnit.grams;
      const rounded = Math.round(cnt * 2) / 2;
      setUnitCount(String(rounded > 0 ? rounded : 1));
    }
  }, []);

  function getNewAmount() {
    if (inputMode === "unit" && selectedUnit)
      return Math.round(selectedUnit.grams * (parseFloat(unitCount) || 1));
    return parseFloat(grams) || entry.amount;
  }

  const newAmount = getNewAmount();
  const r = newAmount / 100;
  const preview = {
    kcal:    Math.round(per100.kcal    * r),
    protein: Math.round(per100.protein * r * 10) / 10,
    fat:     Math.round(per100.fat     * r * 10) / 10,
    carbs:   Math.round(per100.carbs   * r * 10) / 10,
  };

  const btnMode  = (a) => ({ padding:"6px 12px", borderRadius:10, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:`1.5px solid ${a?"rgba(127,255,176,0.8)":"rgba(255,255,255,0.2)"}`, background:a?"rgba(127,255,176,0.15)":"rgba(255,255,255,0.07)", color:a?"#7FFFB0":"rgba(255,255,255,0.7)" });
  const btnQuick = (a) => ({ flex:1, padding:"5px 0", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"1px solid rgba(255,255,255,0.15)", background:a?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)", color:"#fff" });

  return (
    <div style={{ background:"rgba(0,0,0,0.3)", borderRadius:12, padding:"12px", margin:"4px 0 8px", border:"1px solid rgba(255,255,255,0.15)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <p style={{ margin:0, fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.8)" }}>✏️ {entry.name}</p>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:16, cursor:"pointer" }}>✕</button>
      </div>

      {hasUnits && (
        <div style={{ display:"flex", gap:6, marginBottom:10 }}>
          <button onClick={() => setInputMode("unit")} style={btnMode(inputMode==="unit")}>📦 Vienetai</button>
          <button onClick={() => setInputMode("grams")} style={btnMode(inputMode==="grams")}>⚖️ Gramai</button>
        </div>
      )}

      {inputMode === "unit" && hasUnits && (
        <div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
            {foodInDb.units.map((u,i) => (
              <button key={i} onClick={() => { setSelectedUnit(u); setUnitCount("1"); }}
                style={{ padding:"5px 10px", borderRadius:10, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:`1.5px solid ${selectedUnit===u?"rgba(127,255,176,0.8)":"rgba(255,255,255,0.2)"}`, background:selectedUnit===u?"rgba(127,255,176,0.15)":"rgba(255,255,255,0.07)", color:selectedUnit===u?"#7FFFB0":"rgba(255,255,255,0.7)" }}>
                {u.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <input type="number" value={unitCount} step="0.5" min="0.5"
              onChange={e => setUnitCount(e.target.value)}
              style={{ width:60, padding:"8px 10px", background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:10, color:"#fff", fontSize:14, fontWeight:700, fontFamily:"inherit", outline:"none", textAlign:"center" }} />
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
              vnt. = <span style={{ color:"#7FFFB0", fontWeight:700 }}>{Math.round((selectedUnit?.grams||0)*(parseFloat(unitCount)||1))}g</span>
            </span>
          </div>
          <div style={{ display:"flex", gap:5, marginBottom:10 }}>
            {[0.5,1,1.5,2,3,4].map(n => (
              <button key={n} onClick={() => setUnitCount(String(n))} style={btnQuick(unitCount===String(n))}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {inputMode === "grams" && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
              style={{ width:80, padding:"8px 12px", background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.25)", borderRadius:10, color:"#fff", fontSize:14, fontWeight:700, fontFamily:"inherit", outline:"none", textAlign:"center" }} />
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>g</span>
          </div>
          <div style={{ display:"flex", gap:5, marginBottom:10 }}>
            {[50,100,150,200,300].map(g => (
              <button key={g} onClick={() => setGrams(String(g))} style={btnQuick(grams===String(g))}>{g}g</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:4, marginBottom:12 }}>
        {[{l:"kcal",v:preview.kcal,c:"#fff"},{l:"B",v:preview.protein+"g",c:"#FFB3C6"},{l:"R",v:preview.fat+"g",c:"#FF80AB"},{l:"A",v:preview.carbs+"g",c:"#F48FB1"}].map(item => (
          <div key={item.l} style={{ flex:1, background:"rgba(255,255,255,0.08)", borderRadius:8, padding:"6px 4px", textAlign:"center" }}>
            <div style={{ fontSize:13, fontWeight:700, color:item.c }}>{item.v}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{item.l}</div>
          </div>
        ))}
      </div>

      <button onClick={() => onSave(newAmount)}
        style={{ width:"100%", padding:"10px 0", background:"rgba(127,255,176,0.2)", border:"1.5px solid rgba(127,255,176,0.4)", borderRadius:12, color:"#7FFFB0", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
        💾 Išsaugoti pakeitimus
      </button>
    </div>
  );
}

// ── DatePickerModal ───────────────────────────────────────────────────────────
function DatePickerModal({ value, minDate, onSelect, onClose }) {
  const today = todayStr();
  const init  = new Date(value+"T12:00:00");
  const [year, setYear]   = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const minD = new Date((minDate||"2020-01-01")+"T12:00:00");
  const days = [];
  const first = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const offset = first===0?6:first-1;
  for (let i=0;i<offset;i++) days.push(null);
  for (let i=1;i<=daysInMonth;i++) days.push(i);

  function pick(d) {
    const s=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (s>today||new Date(s+"T12:00:00")<minD) return;
    onSelect(s); onClose();
  }
  function prevMonth() { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
  function nextMonth() {
    const next=month===11?new Date(year+1,0,1):new Date(year,month+1,1);
    if(next<=new Date(today+"T12:00:00")){ if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }
  }
  const months=["Sausis","Vasaris","Kovas","Balandis","Gegužė","Birželis","Liepa","Rugpjūtis","Rugsėjis","Spalis","Lapkritis","Gruodis"];

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"flex-end"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:"100%",maxWidth:480,margin:"0 auto",background:`linear-gradient(160deg,#3a0a20,${PK.dark})`,borderRadius:"20px 20px 0 0",padding:"20px 16px 32px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <button onClick={prevMonth} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:18,cursor:"pointer"}}>‹</button>
          <span style={{fontSize:15,fontWeight:700,color:"#fff"}}>{months[month]} {year}</span>
          <button onClick={nextMonth} style={{background:"rgba(255,255,255,0.1)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",fontSize:18,cursor:"pointer"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
          {["P","A","T","K","Pn","Š","S"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.4)",padding:"4px 0"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
          {days.map((d,i)=>{
            if(!d) return <div key={i}/>;
            const s=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const isToday=s===today,isSel=s===value,isFut=s>today,isPast=new Date(s+"T12:00:00")<minD;
            return <button key={i} onClick={()=>pick(d)} disabled={isFut||isPast} style={{padding:"8px 4px",border:"none",borderRadius:10,cursor:isFut||isPast?"default":"pointer",background:isSel?"rgba(255,255,255,0.3)":isToday?"rgba(255,255,255,0.15)":"transparent",color:isFut||isPast?"rgba(255,255,255,0.2)":"#fff",fontSize:13,fontWeight:isSel||isToday?700:400,fontFamily:"inherit"}}>{d}</button>;
          })}
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:16,padding:"12px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:14,color:"rgba(255,255,255,0.7)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Uždaryti</button>
      </div>
    </div>
  );
}

function Sep() { return <div style={{borderBottom:"1px solid rgba(255,255,255,0.1)",margin:"2px 0"}}/>; }

export default function ClientView({ user, onLogout, selectedDate: propDate, onDateChange, stepsToday: propSteps, workoutsToday: propWorkouts }) {
  const [profile,       setProfile]      = useState(null);
  const [loading,       setLoading]      = useState(true);
  const [entries,       setEntries]      = useState([]);
  const [searching,     setSearching]    = useState(false);
  const [activeMeal,    setActiveMeal]   = useState(null);
  const [openMeal,      setOpenMeal]     = useState(null);
  const [showCalendar,  setShowCalendar] = useState(false);
  const [showBarcode,   setShowBarcode]  = useState(false);
  const [hasReport,     setHasReport]    = useState(false);
  const [showReport,    setShowReport]   = useState(false);
  const [openSection,   setOpenSection]  = useState(null);
  const [todaySleep,    setTodaySleep]   = useState(null);
  const [todayWater,    setTodayWater]   = useState({ ml:0, goal:2000 });
  const [checkinDone,   setCheckinDone]  = useState(null);
  const [todaySteps,    setTodaySteps]   = useState(0);
  const [todayWorkouts, setTodayWorkouts]= useState([]);
  const [barcodeFood,   setBarcodeFood]  = useState(null);
  const [minDate,       setMinDate]      = useState(null);
  const [editingId,     setEditingId]    = useState(null);
  const [replacingEntry,setReplacingEntry]=useState(null);

  const selectedDate    = propDate || todayStr();
  const setSelectedDate = (d) => onDateChange ? onDateChange(d) : undefined;
  const isToday         = selectedDate === todayStr();

  useEffect(() => {
  async function load() {
    const data = await pb.collection("users").getOne(user.id);
    setProfile(data);
    setLoading(false);
    if (data) {
      const min = new Date(); min.setDate(min.getDate()-90);
      setMinDate(min.toISOString().split("T")[0]);
    }
  }
  load();
  pbFirst("trainer_measurements", `user_id="${user.id}" && client_read_at=""`)
    .then(data => { if (data) { setHasReport(true); setShowReport(true); } });
  pbFirst("step_log", `user_id="${user.id}" && date="${todayStr()}"`)
    .then(data => { if (data?.steps > 0) setTodaySteps(data.steps); });
}, [user.id]);

  const loadEntries = useCallback(async () => {
  const weekStart = (() => { const d=new Date(),day=d.getDay(); d.setDate(d.getDate()-day+(day===0?-6:1)); return d.toISOString().split("T")[0]; })();
  const [food, sleep, water, ci, stepRow] = await Promise.all([
    pb.collection("food_log").getFullList({ filter: `user_id="${user.id}" && date="${selectedDate}"`, sort: "created", requestKey: null }),
    pbFirst("sleep_log", `user_id="${user.id}" && date="${selectedDate}"`),
    pbFirst("water_log", `user_id="${user.id}" && date="${selectedDate}"`),
    pbFirst("client_checkins", `user_id="${user.id}" && week_start="${weekStart}"`),
    pbFirst("step_log", `user_id="${user.id}" && date="${selectedDate}"`),
  ]);
  setEntries(food||[]);
  setTodaySleep(sleep?.hours_slept ?? null);
  setTodayWater({ ml:water?.ml||0, goal:water?.goal||Math.round(parseFloat(profile?.weight||60)*33) });
  setCheckinDone(ci?.is_done ?? false);
  setTodaySteps(Math.max(propSteps||0, stepRow?.steps||0));
}, [user.id, selectedDate, profile?.weight, propSteps]);

useEffect(() => { loadEntries(); }, [loadEntries]);
useEffect(() => { if (openSection === null) loadEntries(); }, [openSection, loadEntries]);

  async function addEntry(meal, food) {
    setSearching(false); setActiveMeal(null);
    try {
      await pb.collection("food_log").create({
        user_id:user.id, date:selectedDate, meal,
        name:food.name, brand:food.brand||"",
        amount:food.amount||food.grams||100,
        kcal:food.kcal||0, protein:food.protein||0, fat:food.fat||0, carbs:food.carbs||0,
      });
      loadEntries();
    } catch(e) { console.error("addEntry:", e); }
  }

  async function updateEntry(id, newAmount, per100) {
    const r = newAmount / 100;
    try {
      await pb.collection("food_log").update(id, {
  amount:  newAmount,
  kcal:    Math.round(per100.kcal    * r),
  protein: Math.round(per100.protein * r * 10) / 10,
  fat:     Math.round(per100.fat     * r * 10) / 10,
  carbs:   Math.round(per100.carbs   * r * 10) / 10,
});
setEditingId(null);
loadEntries();
    } catch(e) { console.error("updateEntry:", e); }
  }

  async function replaceEntry(id, meal, food) {
    try {
await pb.collection("food_log").delete(id);
      await pb.collection("food_log").create({
        user_id:user.id, date:selectedDate, meal,
        name:food.name, brand:food.brand||"",
        amount:food.amount||food.grams||100,
        kcal:food.kcal||0, protein:food.protein||0, fat:food.fat||0, carbs:food.carbs||0,
      });
      loadEntries();
    } catch(e) { console.error("replaceEntry:", e); }
  }

async function removeEntry(id) { await pb.collection("food_log").delete(id); loadEntries(); }
  function toggleMeal(id) { setOpenMeal(p=>p===id?null:id); setEditingId(null); }
  function handleDateSelect(d) { setSelectedDate(d); setOpenMeal(null); }

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg,#3a0a20,${PK.dark})`}}>
      <div style={{textAlign:"center"}}>
        <img src="/logo.png" alt="" style={{width:70,height:70,objectFit:"contain",borderRadius:12,marginBottom:12}}/>
        <p style={{color:PK.blush,fontSize:14}}>Kraunama...</p>
      </div>
    </div>
  );

  const profileAge = profile?.dob ? Math.floor((new Date()-new Date(profile.dob))/(365.25*24*60*60*1000)) : parseInt(profile?.age||30);
  const hasData    = profile?.weight && profile?.height && profileAge;
  const res        = hasData ? calcMacros({ gender:profile.gender||"f", age:profileAge, weight:parseFloat(profile.weight), height:parseFloat(profile.height), actId:Number(profile.act||profile.activity||2), goalId:profile.goal||"lose" }) : null;
  const _wt              = parseFloat(profile?.weight||60);
  const extraKcalSteps   = calcStepCalories(Math.max(todaySteps,propSteps||0), _wt);
  const extraKcalWorkout = calcWorkoutCalories(propWorkouts?.length?propWorkouts:todayWorkouts, _wt);
  const extraKcal        = extraKcalSteps + extraKcalWorkout;
  const adjTarget  = hasData ? (res?.target||0)+extraKcal : 0;
  const goalLabel  = GOALS.find(g=>g.id===profile?.goal)?.label ?? "";
  const totals     = entries.reduce((a,e)=>({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }),{ kcal:0,protein:0,fat:0,carbs:0 });

  function MealSection() {
    return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
          {[
            {l:"kcal",     cur:Math.round(totals.kcal),    tgt:adjTarget},
            {l:"baltym.",  cur:Math.round(totals.protein), tgt:res?.prot?.g||0},
            {l:"riebalai", cur:Math.round(totals.fat),     tgt:res?.fat?.g||0},
            {l:"angliv.",  cur:Math.round(totals.carbs),   tgt:res?.carb?.g||0},
          ].map(m=>{
            const pct=m.tgt?Math.min(100,Math.round(m.cur/m.tgt*100)):0;
            const over=m.cur>m.tgt;
            return (
              <div key={m.l} style={{textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:800,color:over?"#FFD700":"#fff"}}>
  {m.cur}
  {m.tgt>0&&<span style={{fontSize:9,fontWeight:400,color:"rgba(255,255,255,0.35)"}}>/{m.tgt}</span>}
</div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.45)",margin:"2px 0"}}>{m.l}</div>
                <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,height:3}}>
                  <div style={{width:pct+"%",height:"100%",borderRadius:99,background:over?"#FFD700":"rgba(255,255,255,0.7)",transition:"width 0.4s"}}/>
                </div>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",marginTop:2}}>{pct}%</div>
              </div>
            );
          })}
        </div>
        <Sep/>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
          {MEALS.map(meal=>{
            const me=entries.filter(e=>e.meal===meal.id);
            const mKcal=me.reduce((a,e)=>a+(e.kcal||0),0);
            const isAct=openMeal===meal.id;
            return (
              <div key={meal.id}>
                <button onClick={()=>toggleMeal(meal.id)} style={{
                  width:"100%",padding:"12px 10px",
                  background:isAct?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.08)",
                  border:`1px solid ${isAct?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.12)"}`,
                  borderRadius:14,color:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"left",
                }}>
                  <div style={{fontSize:12,fontWeight:700}}>{meal.label}</div>
                  {me.length>0&&<div style={{fontSize:10,color:"rgba(255,255,255,0.55)",marginTop:2}}>{mKcal} kcal · {me.length} įr.</div>}
                </button>

                {isAct && (
                  <div style={{marginTop:6,background:"rgba(0,0,0,0.2)",borderRadius:12,padding:"10px 12px"}}>
                    <div style={{maxHeight:me.length>3?"220px":"none",overflowY:me.length>3?"auto":"visible",WebkitOverflowScrolling:"touch"}}>
                    {me.map(e=>(
                      <div key={e.id}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <span style={{fontSize:12,color:"#fff",fontWeight:600}}>{e.name}</span>
                            {e.brand&&<span style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginLeft:4}}>{e.brand}</span>}
                            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:1}}>{e.amount}g · {e.kcal} kcal</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                            <button
                              onClick={()=>setEditingId(editingId===e.id?null:e.id)}
                              style={{background:editingId===e.id?"rgba(127,255,176,0.15)":"none",border:editingId===e.id?"1px solid rgba(127,255,176,0.4)":"none",borderRadius:8,color:editingId===e.id?"#7FFFB0":"rgba(255,255,255,0.5)",fontSize:13,cursor:"pointer",padding:"4px 7px"}}>
                              ✏️
                            </button>
                            <button onClick={()=>removeEntry(e.id)} style={{background:"none",border:"none",color:"rgba(255,100,100,0.7)",fontSize:14,cursor:"pointer",padding:"0 4px"}}>×</button>
                          </div>
                        </div>

                        {editingId === e.id && (
                          <div>
                            <EntryEditor
                              entry={e}
                              onSave={(newAmount) => updateEntry(e.id, newAmount, getPer100(e))}
                              onClose={() => setEditingId(null)}
                            />
                            {isToday && (
                              <button
                                onClick={() => { setReplacingEntry(e); setActiveMeal(e.meal); setSearching(true); setEditingId(null); }}
                                style={{width:"100%",padding:"8px 0",marginBottom:8,background:"rgba(255,255,255,0.05)",border:"1.5px dashed rgba(255,255,255,0.2)",borderRadius:12,color:"rgba(255,255,255,0.6)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                                🔄 Pakeisti produktą
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    </div>

                    {isToday && (
                      <div style={{display:"flex",gap:6,marginTop:8}}>
                        <button onClick={()=>{setActiveMeal(meal.id);setReplacingEntry(null);setSearching(true);}} style={{flex:1,padding:"8px 0",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,color:"rgba(255,255,255,0.8)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Pridėti</button>
                        <button onClick={()=>{setActiveMeal(meal.id);setShowBarcode(true);}} style={{padding:"8px 12px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,color:"rgba(255,255,255,0.6)",fontSize:13,cursor:"pointer"}}>📷</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,#3a0a20 0%,${PK.dark} 45%,${PK.mid} 100%)`,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",paddingBottom:80}}>

      {showCalendar&&<DatePickerModal value={selectedDate} minDate={minDate} onSelect={handleDateSelect} onClose={()=>setShowCalendar(false)}/>}
      {showReport&&<MeasurementReport userId={user.id} onClose={()=>{setShowReport(false);setHasReport(false);}}/>}
      {hasReport&&!showReport&&(
        <button onClick={()=>setShowReport(true)} style={{position:"fixed",bottom:90,right:20,zIndex:500,width:50,height:50,borderRadius:"50%",background:`linear-gradient(135deg,${PK.dark},${PK.mid})`,border:"2px solid rgba(255,255,255,0.3)",boxShadow:"0 4px 20px rgba(173,20,87,0.5)",cursor:"pointer",fontSize:20}}>
          📊
          <div style={{position:"absolute",top:0,right:0,width:14,height:14,borderRadius:"50%",background:"#FF4444",border:"2px solid #fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700}}>1</div>
        </button>
      )}

      {searching && (
        <FoodSearch
          meal={activeMeal}
          onAdd={food => {
            if (replacingEntry) {
              replaceEntry(replacingEntry.id, replacingEntry.meal, food);
              setReplacingEntry(null);
            } else {
              addEntry(activeMeal, food);
            }
          }}
          onClose={() => { setSearching(false); setActiveMeal(null); setReplacingEntry(null); }}
          onBarcode={() => { setSearching(false); setShowBarcode(true); }}
          initialFood={barcodeFood}
        />
      )}
      {showBarcode&&<BarcodeScanner onFound={food=>{setBarcodeFood(food);setShowBarcode(false);setSearching(true);}} onClose={()=>setShowBarcode(false)}/>}

      {/* Header */}
      <div style={{padding:"16px 20px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <img src="/logo.png" alt="" style={{width:34,height:34,objectFit:"contain",borderRadius:8}}/>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:0}}>{profile?.name?.split(" ")[0]}</p>
              <p style={{fontSize:9,color:"rgba(255,255,255,0.5)",margin:0}}>{goalLabel}</p>
            </div>
          </div>
          <button onClick={()=>setShowCalendar(true)} style={{background:"rgba(255,255,255,0.12)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:20,padding:"6px 14px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
            📅 {isToday?new Date().toLocaleDateString("lt-LT",{month:"short",day:"numeric"}):selectedDate}
            <span style={{fontSize:9,opacity:0.6}}>▼</span>
          </button>
          <button onClick={onLogout} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"7px 12px",color:"rgba(255,255,255,0.7)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Išeiti</button>
        </div>
        <div style={{borderBottom:"1px solid rgba(255,255,255,0.1)"}}/>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"0 16px"}}>
        {openSection ? (
          <div>
            {openSection==="food" && (
              <div style={{paddingBottom:20}}>
                <p style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 14px"}}>🍽️ Mityba · {selectedDate}</p>
                <MealSection/>
              </div>
            )}
            {openSection==="health" && (
              <div style={{paddingBottom:20}}>
                <p style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 14px"}}>😴 Miegas · 💧 Vanduo</p>
                <SleepTracker userId={user.id} age={parseInt(profile?.age)} date={selectedDate}/>
                <WaterTracker goal={Math.round(parseFloat(profile?.weight||60)*33)} userId={user.id} date={selectedDate}/>
              </div>
            )}
            {openSection==="checkin" && (
              <div style={{paddingBottom:20}}>
                <CheckIn userId={user.id} targetKcal={res?.target} targetProtein={res?.prot?.g} age={parseInt(profile?.age)}/>
              </div>
            )}
            <div style={{position:"fixed",bottom:70,left:0,right:0,zIndex:200,padding:"8px 16px",background:"rgba(58,10,32,0.95)",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
              <button onClick={()=>setOpenSection(null)} style={{width:"100%",maxWidth:448,display:"block",margin:"0 auto",padding:"13px 0",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(10px)",border:"1.5px solid rgba(255,255,255,0.25)",borderRadius:14,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ← Grįžti
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{marginBottom:16}}>
              <MotivationalCard userId={user.id} res={res} goalId={profile?.goal}/>
            </div>
            <Sep/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                  {profile?.gender==="f"?"👩":"👨"}
                </div>
                <div>
                  <p style={{fontSize:12,fontWeight:700,color:"#fff",margin:0}}>{profile?.name}</p>
                  <p style={{fontSize:9,color:"rgba(255,255,255,0.45)",margin:0}}>{profileAge}m. · {profile?.weight}kg · {goalLabel}</p>
                </div>
              </div>
              {res&&(
                <div style={{textAlign:"right"}}>
                  <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.8)",margin:"0 0 2px"}}>{res.target} kcal</p>
                  <p style={{fontSize:9,color:"rgba(255,255,255,0.4)",margin:0}}>{res.prot.g}g B · {res.fat.g}g R · {res.carb.g}g A</p>
                </div>
              )}
            </div>
            <Sep/>
            <div style={{height:12}}/>

            {/* Mitybos widget */}
            <button onClick={()=>setOpenSection("food")} style={{width:"100%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,padding:"16px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",marginBottom:10,backdropFilter:"blur(10px)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:600}}>🍽️ MITYBA ŠIANDIEN</span>
                  <p style={{fontSize:26,fontWeight:800,color:"#fff",margin:"4px 0 0",lineHeight:1}}>{Math.round(totals.kcal)} kcal</p>
                  <p style={{fontSize:10,color:extraKcal>0?"#7FFFB0":"rgba(255,255,255,0.4)",margin:"3px 0 0"}}>{extraKcal>0?`Tikslas: ${adjTarget} kcal (+${extraKcal} aktyvumas)`:`Tikslas: ${res?.target||0} kcal`}</p>
                </div>
                <span style={{fontSize:22,opacity:0.7}}>→</span>
              </div>
              {res&&(
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {[
                    {l:"🍗 Baltymai",  got:Math.round(totals.protein), need:res.prot.g, adj:extraKcal>0?Math.round(res.prot.g+extraKcalWorkout*0.3/4+extraKcalSteps*0.2/4):null, color:"#FFB3C6"},
                    {l:"🍚 Angliavandeniai",got:Math.round(totals.carbs),need:res.carb.g,adj:extraKcal>0?Math.round(res.carb.g+extraKcalWorkout*0.5/4+extraKcalSteps*0.6/4):null, color:"#F48FB1"},
                    {l:"🥑 Riebalai",  got:Math.round(totals.fat),     need:res.fat.g,  adj:extraKcal>0?Math.round(res.fat.g+extraKcalWorkout*0.2/9+extraKcalSteps*0.2/9):null,  color:"#FF80AB"},
                  ].map(m=>{
                    const target=m.adj||m.need;
                    const pct=target>0?Math.min(100,Math.round(m.got/target*100)):0;
                    return (
                      <div key={m.l}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{fontSize:10,color:"rgba(255,255,255,0.7)"}}>{m.l}</span>
                          <span style={{fontSize:10,fontWeight:700,color:m.color}}>{m.got}g <span style={{color:"rgba(255,255,255,0.35)",fontWeight:400}}>/ {target}g</span></span>
                        </div>
                        <div style={{background:"rgba(255,255,255,0.12)",borderRadius:99,height:5}}>
                          <div style={{width:pct+"%",height:"100%",borderRadius:99,background:m.color,transition:"width 0.4s"}}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </button>

            {/* 2 kortelės */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {key:"health",icon:"😴",title:"Miegas & Vanduo",main:todaySleep!=null?todaySleep+"h":"–",sub:`💧 ${todayWater.ml}/${todayWater.goal} ml`,pct:todayWater.goal?Math.min(100,Math.round(todayWater.ml/todayWater.goal*100)):0,barColor:"#89CFF0"},
                {key:"checkin",icon:checkinDone?"✅":"📋",title:"Savaitinis check-in",main:checkinDone?"Užpildyta":"Pildyti →",sub:(()=>{const d=new Date(),day=d.getDay(),left=day===0?0:7-day;return checkinDone?"Iki kito: "+left+"d.":"Sekmadieniais";})(),pct:checkinDone?100:null,barColor:"#7FFFB0"},
              ].map(card=>(
                <button key={card.key} onClick={()=>setOpenSection(card.key)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:20,padding:"18px 14px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",minHeight:140,display:"flex",flexDirection:"column",justifyContent:"space-between",backdropFilter:"blur(10px)"}}>
                  <span style={{fontSize:26}}>{card.icon}</span>
                  <div>
                    <p style={{fontSize:20,fontWeight:800,color:"#fff",margin:"8px 0 2px",lineHeight:1}}>{card.main}</p>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.6)",margin:0}}>{card.title}</p>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.4)",margin:"3px 0 0"}}>{card.sub}</p>
                  </div>
                  {card.pct!=null&&(
                    <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,height:4,marginTop:10}}>
                      <div style={{width:card.pct+"%",height:"100%",borderRadius:99,background:card.barColor}}/>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}