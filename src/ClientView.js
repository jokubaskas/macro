import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";
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
function fmtDate(d) {
  return new Date(d+"T12:00:00").toLocaleDateString("lt-LT",{weekday:"short",month:"short",day:"numeric"});
}

// ── DatePickerModal ───────────────────────────────────────────────────────────
function DatePickerModal({ value, minDate, onSelect, onClose }) {
  const today = todayStr();
  const init  = new Date(value+"T12:00:00");
  const [year,  setYear]  = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const minD = new Date((minDate||"2020-01-01")+"T12:00:00");
  const days = [];
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const offset = first===0?6:first-1;
  for (let i=0;i<offset;i++) days.push(null);
  for (let i=1;i<=daysInMonth;i++) days.push(i);

  function pick(d) {
    const s = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    if (s>today||new Date(s+"T12:00:00")<minD) return;
    onSelect(s); onClose();
  }
  function prevMonth() { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
  function nextMonth() {
    const next = month===11?new Date(year+1,0,1):new Date(year,month+1,1);
    if(next<=new Date(today+"T12:00:00")) { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }
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
            return (
              <button key={i} onClick={()=>pick(d)} disabled={isFut||isPast} style={{
                padding:"8px 4px",border:"none",borderRadius:10,cursor:isFut||isPast?"default":"pointer",
                background:isSel?"rgba(255,255,255,0.3)":isToday?"rgba(255,255,255,0.15)":"transparent",
                color:isFut||isPast?"rgba(255,255,255,0.2)":"#fff",
                fontSize:13,fontWeight:isSel||isToday?700:400,fontFamily:"inherit",
              }}>{d}</button>
            );
          })}
        </div>
        <button onClick={onClose} style={{width:"100%",marginTop:16,padding:"12px",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:14,color:"rgba(255,255,255,0.7)",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
          Uždaryti
        </button>
      </div>
    </div>
  );
}

// ── Separator linija ──────────────────────────────────────────────────────────
function Sep() {
  return <div style={{borderBottom:"1px solid rgba(255,255,255,0.1)",margin:"2px 0"}}/>;
}

// ── Macro progress bar ────────────────────────────────────────────────────────
function MacroBar({label,cur,tgt,color}) {
  const pct = tgt ? Math.min(100,Math.round(cur/tgt*100)) : 0;
  const over = cur > tgt;
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,color:"rgba(255,255,255,0.7)"}}>{label}</span>
        <span style={{fontSize:12,fontWeight:700,color:over?"#FFD700":"#fff"}}>{cur} / {tgt}</span>
      </div>
      <div style={{background:"rgba(255,255,255,0.12)",borderRadius:99,height:5}}>
        <div style={{width:pct+"%",height:"100%",borderRadius:99,background:over?"#FFD700":color,transition:"width 0.4s"}}/>
      </div>
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function ClientView({ user, onLogout, selectedDate: propDate, onDateChange, stepsToday: propSteps, workoutsToday: propWorkouts }) {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [entries,      setEntries]      = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [activeMeal,   setActiveMeal]   = useState(null);
  const [showMeals,    setShowMeals]    = useState(false);
  const [openMeal,     setOpenMeal]     = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBarcode,  setShowBarcode]  = useState(false);
  const [hasReport,    setHasReport]    = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [openSection,  setOpenSection]  = useState(null);
  const [todaySleep,   setTodaySleep]   = useState(null);
  const [todayWater,   setTodayWater]   = useState({ ml:0, goal:2000 });
  const [checkinDone,  setCheckinDone]  = useState(null);
  const [todaySteps,   setTodaySteps]   = useState(0);
  const [todayWorkouts, setTodayWorkouts] = useState([]);
  const [barcodeFood,  setBarcodeFood]  = useState(null);
  const [minDate,      setMinDate]      = useState(null);

  const selectedDate   = propDate || todayStr();
  const setSelectedDate = (d) => onDateChange ? onDateChange(d) : undefined;
  const isToday        = selectedDate === todayStr();

  // Profilis
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").eq("id",user.id).single();
      setProfile(data);
      setLoading(false);
      if (data) {
        const min = new Date();
        min.setDate(min.getDate()-90);
        setMinDate(min.toISOString().split("T")[0]);
      }
    }
    load();
    // Neperskaityta ataskaita
    supabase.from("trainer_measurements").select("id").eq("user_id",user.id).is("client_read_at",null).limit(1)
      .then(({ data }) => { if (data?.length) { setHasReport(true); setShowReport(true); } });
    // Žingsniai
    supabase.from("step_log").select("steps").eq("user_id",user.id).eq("date",todayStr()).maybeSingle()
      .then(({ data }) => { if (data?.steps > 0) setTodaySteps(data.steps); });
  }, [user.id]);

  // Maisto įrašai + kiti šios dienos duomenys
  const loadEntries = useCallback(async () => {
    const weekStart = (() => { const d=new Date(),day=d.getDay(); d.setDate(d.getDate()-day+(day===0?-6:1)); return d.toISOString().split("T")[0]; })();
    const [{ data:food },{ data:sleep },{ data:water },{ data:ci },{ data:stepRow }] = await Promise.all([
      supabase.from("food_log").select("*").eq("user_id",user.id).eq("date",selectedDate).order("created_at"),
      supabase.from("sleep_log").select("hours_slept").eq("user_id",user.id).eq("date",selectedDate).maybeSingle(),
      supabase.from("water_log").select("ml,goal").eq("user_id",user.id).eq("date",selectedDate).maybeSingle(),
      supabase.from("client_checkins").select("is_done").eq("user_id",user.id).eq("week_start",weekStart).maybeSingle(),
      supabase.from("step_log").select("steps").eq("user_id",user.id).eq("date",selectedDate).maybeSingle(),
      supabase.from("workout_log").select("type,duration_min").eq("user_id",user.id).eq("date",selectedDate),
    ]);
    setEntries(food||[]);
    setTodaySleep(sleep?.hours_slept ?? null);
    setTodayWater({ ml:water?.ml||0, goal:water?.goal||Math.round(parseFloat(profile?.weight||60)*33) });
    setCheckinDone(ci?.is_done ?? false);
    const dbSteps = stepRow?.steps || 0;
    setTodaySteps(Math.max(propSteps||0, dbSteps));
  }, [user.id, selectedDate, profile?.weight, propSteps]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function addEntry(meal, food) {
    await supabase.from("food_log").insert({ user_id:user.id, date:selectedDate, meal, name:food.name, brand:food.brand||"", kcal:food.kcal||0, protein:food.protein||0, fat:food.fat||0, carbs:food.carbs||0 });
    loadEntries();
  }
  async function removeEntry(id) { await supabase.from("food_log").delete().eq("id",id); loadEntries(); }
  function toggleMeal(id) { setOpenMeal(p=>p===id?null:id); }
  function closeMeals() { setShowMeals(false); setOpenMeal(null); }
  function handleDateSelect(d) { setSelectedDate(d); setShowMeals(false); setOpenMeal(null); }

  if (loading) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(160deg,#3a0a20,${PK.dark})`}}>
      <div style={{textAlign:"center"}}>
        <img src="/logo.png" alt="" style={{width:70,height:70,objectFit:"contain",borderRadius:12,marginBottom:12}}/>
        <p style={{color:PK.blush,fontSize:14}}>Kraunama...</p>
      </div>
    </div>
  );

  const profileAge    = profile?.dob ? Math.floor((new Date()-new Date(profile.dob))/(365.25*24*60*60*1000)) : parseInt(profile?.age||30);
  const hasData       = profile?.weight && profile?.height && profileAge;
  const res           = hasData ? calcMacros({ gender:profile.gender||"f", age:profileAge, weight:parseFloat(profile.weight), height:parseFloat(profile.height), actId:Number(profile.act||profile.activity||2), goalId:profile.goal||"lose" }) : null;
  const _wt            = parseFloat(profile?.weight||60);
  const extraKcalSteps   = calcStepCalories(Math.max(todaySteps, propSteps||0), _wt);
  const extraKcalWorkout = calcWorkoutCalories(propWorkouts?.length ? propWorkouts : todayWorkouts, _wt);
  const extraKcal        = extraKcalSteps + extraKcalWorkout;
  const adjTarget     = hasData ? (res?.target||0) + extraKcal : 0;
  const goalLabel     = GOALS.find(g=>g.id===profile?.goal)?.label ?? "";
  const totals        = entries.reduce((a,e)=>({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }),{ kcal:0,protein:0,fat:0,carbs:0 });
  const remaining     = res ? { kcal:Math.max(0,adjTarget-totals.kcal), protein:Math.max(0,res.prot.g-totals.protein), fat:Math.max(0,res.fat.g-totals.fat), carbs:Math.max(0,res.carb.g-totals.carbs) } : null;

  // Meal section render
  function MealSection() {
    return (
      <div>
        {/* Macro summary */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
          {[
            {l:"kcal",cur:Math.round(totals.kcal),tgt:adjTarget},
            {l:"baltym.",cur:Math.round(totals.protein),tgt:res?.prot?.g||0},
            {l:"riebalai",cur:Math.round(totals.fat),tgt:res?.fat?.g||0},
            {l:"angliv.",cur:Math.round(totals.carbs),tgt:res?.carb?.g||0},
          ].map(m=>{
            const pct=m.tgt?Math.min(100,Math.round(m.cur/m.tgt*100)):0;
            const over=m.cur>m.tgt;
            return (
              <div key={m.l} style={{textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:800,color:over?"#FFD700":"#fff"}}>{m.cur}</div>
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

        {/* Meals grid */}
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
                  {me.length>0 && <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",marginTop:2}}>{mKcal} kcal · {me.length} įr.</div>}
                </button>

                {isAct && (
                  <div style={{marginTop:6,background:"rgba(0,0,0,0.2)",borderRadius:12,padding:"10px 12px"}}>
                    {me.map(e=>(
                      <div key={e.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
                        <div>
                          <span style={{fontSize:12,color:"#fff",fontWeight:600}}>{e.name}</span>
                          {e.brand && <span style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginLeft:4}}>{e.brand}</span>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontSize:11,color:"rgba(255,255,255,0.6)"}}>{e.kcal} kcal</span>
                          <button onClick={()=>removeEntry(e.id)} style={{background:"none",border:"none",color:"rgba(255,100,100,0.7)",fontSize:14,cursor:"pointer",padding:"0 2px"}}>×</button>
                        </div>
                      </div>
                    ))}
                    {isToday && (
                      <div style={{display:"flex",gap:6,marginTop:8}}>
                        <button onClick={()=>{setActiveMeal(meal.id);setSearching(true);}} style={{flex:1,padding:"8px 0",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:10,color:"rgba(255,255,255,0.8)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Pridėti</button>
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

      {/* Modals */}
      {showCalendar && <DatePickerModal value={selectedDate} minDate={minDate} onSelect={handleDateSelect} onClose={()=>setShowCalendar(false)}/>}
      {showReport && <MeasurementReport userId={user.id} onClose={()=>{ setShowReport(false); setHasReport(false); }}/>}
      {hasReport && !showReport && (
        <button onClick={()=>setShowReport(true)} style={{position:"fixed",bottom:90,right:20,zIndex:500,width:50,height:50,borderRadius:"50%",background:`linear-gradient(135deg,${PK.dark},${PK.mid})`,border:"2px solid rgba(255,255,255,0.3)",boxShadow:"0 4px 20px rgba(173,20,87,0.5)",cursor:"pointer",fontSize:20}}>
          📊
          <div style={{position:"absolute",top:0,right:0,width:14,height:14,borderRadius:"50%",background:"#FF4444",border:"2px solid #fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700}}>1</div>
        </button>
      )}
      {searching && <FoodSearch meal={activeMeal} onAdd={food=>{addEntry(activeMeal,food);setSearching(false);}} onClose={()=>setSearching(false)} onBarcode={()=>{setSearching(false);setShowBarcode(true);}} initialFood={barcodeFood}/>}
      {showBarcode && <BarcodeScanner onFound={food=>{setBarcodeFood(food);setShowBarcode(false);setSearching(true);}} onClose={()=>setShowBarcode(false)}/>}

      {/* Header */}
      <div style={{padding:"16px 20px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          {/* Logo + vardas */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <img src="/logo.png" alt="" style={{width:34,height:34,objectFit:"contain",borderRadius:8}}/>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:"#fff",margin:0}}>{profile?.name?.split(" ")[0]}</p>
              <p style={{fontSize:9,color:"rgba(255,255,255,0.5)",margin:0}}>{goalLabel}</p>
            </div>
          </div>
          {/* Kalendorius centre */}
          <button onClick={()=>setShowCalendar(true)} style={{background:"rgba(255,255,255,0.12)",border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:20,padding:"6px 14px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
            📅 {isToday?new Date().toLocaleDateString("lt-LT",{month:"short",day:"numeric"}):selectedDate}
            <span style={{fontSize:9,opacity:0.6}}>▼</span>
          </button>
          {/* Atsijungti */}
          <button onClick={onLogout} style={{background:"rgba(255,255,255,0.12)",border:"none",borderRadius:10,padding:"7px 12px",color:"rgba(255,255,255,0.7)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Išeiti</button>
        </div>
        <div style={{borderBottom:"1px solid rgba(255,255,255,0.1)"}}/>
      </div>

      <div style={{maxWidth:480,margin:"0 auto",padding:"0 16px"}}>

        {openSection ? (
          /* ── Išskleista sekcija ── */
          <div>
            {!openSection.startsWith("__") && !openSection && <MotivationalCard userId={user.id} res={res} goalId={profile?.goal}/>}

            {openSection==="food" && (
              <div style={{paddingBottom:20}}>
                <p style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 14px"}}>🍽️ Mityba · {selectedDate}</p>
                <MealSection/>
              </div>
            )}

            {openSection==="targets" && (
              <div style={{paddingBottom:20}}>
                <p style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"0.08em",margin:"0 0 14px"}}>🎯 Makro tikslai</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
                  {[{l:"BMR",v:res?.bmr,s:"bazinis"},{l:"TDEE",v:res?.tdee,s:"su aktyvumu"},{l:"Tikslas",v:adjTarget,s:"šiandien"}].map(m=>(
                    <div key={m.l} style={{background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"12px 8px",textAlign:"center",border:"1px solid rgba(255,255,255,0.12)"}}>
                      <div style={{fontSize:18,fontWeight:800,color:"#fff"}}>{m.v}</div>
                      <div style={{fontSize:8,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",marginTop:2}}>{m.l}</div>
                      <div style={{fontSize:8,color:"rgba(255,255,255,0.35)"}}>{m.s}</div>
                    </div>
                  ))}
                </div>
                {extraKcal>0 && <div style={{background:"rgba(127,255,176,0.12)",borderRadius:12,padding:"8px 14px",marginBottom:14,border:"1px solid rgba(127,255,176,0.2)"}}>
                  <p style={{fontSize:12,color:"#7FFFB0",margin:0,fontWeight:600}}>🚶 +{extraKcal} kcal iš žingsnių</p>
                </div>}
                <MacroBar label="💪 Baltymai" cur={Math.round(totals.protein)} tgt={res?.prot?.g||0} color="#FFB3C6"/>
                <MacroBar label="🥑 Riebalai" cur={Math.round(totals.fat)} tgt={res?.fat?.g||0} color="#FF80AB"/>
                <MacroBar label="🍚 Angliavandeniai" cur={Math.round(totals.carbs)} tgt={res?.carb?.g||0} color="#F48FB1"/>
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

            {/* Fiksuotas grįžti mygtukas */}
            <div style={{position:"fixed",bottom:70,left:0,right:0,zIndex:200,padding:"8px 16px",background:"rgba(58,10,32,0.95)",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
              <button onClick={()=>setOpenSection(null)} style={{width:"100%",maxWidth:448,display:"block",margin:"0 auto",padding:"13px 0",background:"rgba(255,255,255,0.12)",backdropFilter:"blur(10px)",border:"1.5px solid rgba(255,255,255,0.25)",borderRadius:14,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ← Grįžti
              </button>
            </div>
          </div>

        ) : (
          /* ── Grid rodinys ── */
          <div>
            {/* Motyvacinė žinutė */}
            <div style={{marginBottom:16}}>
              <MotivationalCard userId={user.id} res={res} goalId={profile?.goal}/>
            </div>

            <Sep/>

            {/* Profilio eilutė */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                  {profile?.gender==="f"?"👩":"👨"}
                </div>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:"#fff",margin:0}}>{profile?.name}</p>
                  <p style={{fontSize:10,color:"rgba(255,255,255,0.5)",margin:0}}>{profile?.age}m. · {profile?.weight}kg</p>
                </div>
              </div>
              <p style={{fontSize:10,color:"rgba(255,255,255,0.5)",margin:0,textAlign:"right"}}>{res?.target} kcal / d.</p>
            </div>

            <Sep/>
            <div style={{height:12}}/>

            {/* 2x2 Grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {
                  key:"food", icon:"🍽️", title:"Mityba šiandien",
                  main:Math.round(totals.kcal)+" kcal",
                  sub:extraKcal>0?`iš ${adjTarget} kcal (🚶+${extraKcal})`:`iš ${res?.target||0} kcal`,
                  pct:adjTarget?Math.min(100,Math.round(totals.kcal/adjTarget*100)):0,
                  barColor:totals.kcal>(adjTarget||0)?"#FFD700":"rgba(255,255,255,0.7)",
                },
                {
                  key:"targets", icon:"🎯", title:"Makro tikslai",
                  main:(adjTarget||res?.target||0)+" kcal",
                  sub:`B:${res?.prot?.g||0}g · R:${res?.fat?.g||0}g · A:${res?.carb?.g||0}g`,
                  pct:null,
                },
                {
                  key:"health", icon:"😴", title:"Miegas & Vanduo",
                  main:todaySleep!=null?todaySleep+"h":"–",
                  sub:`💧 ${todayWater.ml}/${todayWater.goal} ml`,
                  pct:todayWater.goal?Math.min(100,Math.round(todayWater.ml/todayWater.goal*100)):0,
                  barColor:"#89CFF0",
                },
                {
                  key:"checkin", icon:checkinDone?"✅":"📋", title:"Savaitinis check-in",
                  main:checkinDone?"Užpildyta":"Pildyti →",
                  sub:(()=>{const d=new Date(),day=d.getDay(),left=day===0?0:7-day;return checkinDone?`Kitas po ${left===0?7:left} d.`:left===0?"🔔 Šiandien sekmadienis":`Po ${left} d.`;})(),
                  pct:checkinDone?100:null, barColor:"#7FFFB0",
                },
              ].map(card=>(
                <button key={card.key} onClick={()=>setOpenSection(card.key)} style={{
                  background:"rgba(255,255,255,0.1)",
                  border:"1px solid rgba(255,255,255,0.15)",
                  borderRadius:20,padding:"18px 14px",cursor:"pointer",
                  fontFamily:"inherit",textAlign:"left",minHeight:150,
                  display:"flex",flexDirection:"column",justifyContent:"space-between",
                  backdropFilter:"blur(10px)",
                }}>
                  <span style={{fontSize:26}}>{card.icon}</span>
                  <div>
                    <p style={{fontSize:20,fontWeight:800,color:"#fff",margin:"8px 0 2px",lineHeight:1}}>{card.main}</p>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.6)",margin:0}}>{card.title}</p>
                    <p style={{fontSize:10,color:"rgba(255,255,255,0.4)",margin:"3px 0 0",lineHeight:1.3}}>{card.sub}</p>
                  </div>
                  {card.pct!=null && (
                    <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,height:4,marginTop:8}}>
                      <div style={{width:card.pct+"%",height:"100%",borderRadius:99,background:card.barColor,transition:"width 0.5s"}}/>
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