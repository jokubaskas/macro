import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";
import WaterTracker from "./WaterTracker";
import SleepTracker from "./SleepTracker";
import CheckIn from "./CheckIn";
import MotivationalCard from "./MotivationalCard";
import FoodSearch from "./FoodSearch";
import BarcodeScanner from "./BarcodeScanner";

// --- 1. ATASKAITOS KOMPONENTAS (Dabar jis čia, tad importuoti nebereikia) ---
function ReportOverlay({ report, userId, onRead }) {
  if (!report) return null;
  const handleRead = async () => {
    await supabase.from('profiles').update({ last_read_report_id: report.id }).eq('id', userId);
    onRead();
  };
  const isLoss = report.weightDiff < 0;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(45, 20, 31, 0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(8px)" }}>
      <div style={{ background: "#fff", borderRadius: 28, width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", border: `1px solid ${PK.blush}` }}>
        <div style={{ background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`, padding: "30px 20px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Apžvalga</h2>
          <p style={{ margin: "5px 0 0", opacity: 0.8, fontSize: 13 }}>Tavo progresas</p>
        </div>
        <div style={{ padding: "24px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: PK.pale, padding: 15, borderRadius: 20, textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: PK.rose, textTransform: "uppercase", margin: 0 }}>Svoris</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: PK.dark, margin: "4px 0" }}>{report.weightDiff > 0 ? "+" : ""}{report.weightDiff}kg</p>
            </div>
            <div style={{ background: PK.pale, padding: 15, borderRadius: 20, textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: PK.rose, textTransform: "uppercase", margin: 0 }}>Liemuo</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: PK.dark, margin: "4px 0" }}>{report.waistDiff}cm</p>
            </div>
          </div>
          <div style={{ background: "#FFFBEB", padding: 16, borderRadius: 20, border: "1px solid #FAD389", marginBottom: 25 }}>
             <p style={{ fontSize: 14, color: PK.dark, margin: 0, lineHeight: 1.5 }}>{report.trainerNote || "Šaunuolė, judam toliau!"}</p>
          </div>
          <button onClick={handleRead} style={{ width: "100%", padding: "18px", borderRadius: 20, border: "none", background: PK.dark, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Tęsti 🚀</button>
        </div>
      </div>
    </div>
  );
}

// --- Likęs kodas (konstantos ir pagalbinės funkcijos) ---
const MEALS = [
  { id: "breakfast", label: "🌅 Pusryčiai" },
  { id: "lunch", label: "☀️ Pietūs" },
  { id: "dinner", label: "🌙 Vakarienė" },
  { id: "snack", label: "🍎 Užkandžiai" },
];
function todayStr() { return new Date().toISOString().split("T")[0]; }
function fmtDate(d) { return new Date(d + "T12:00:00").toLocaleDateString("lt-LT", { year: "numeric", month: "long", day: "numeric" }); }
const MONTH_LT = ["Sausis", "Vasaris", "Kovas", "Balandis", "Gegužė", "Birželis", "Liepa", "Rugpjūtis", "Rugsėjis", "Spalis", "Lapkritis", "Gruodis"];
const DOW_LT = ["P", "A", "T", "K", "P", "Š", "S"];

// --- Kalendoriaus komponentas ---
function DatePickerModal({ value, minDate, onSelect, onClose }) {
  const today = todayStr();
  const init = new Date(value + "T12:00:00");
  const [year, setYear] = useState(init.getFullYear());
  const [month, setMonth] = useState(init.getMonth());
  const minD = new Date((minDate || "2020-01-01") + "T12:00:00");
  function canPrev() { const y = month === 0 ? year-1 : year; const m = month === 0 ? 11 : month-1; return new Date(y, m+1, 0) >= minD; }
  function canNext() { const y = month === 11 ? year+1 : year; const m = month === 11 ? 0 : month+1; return new Date(y, m, 1) <= new Date(today + "T12:00:00"); }
  const firstDow = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d-1; })();
  const daysInMon = new Date(year, month+1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({length:daysInMon},(_,i)=>i+1)];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(135deg," + PK.dark + "," + PK.mid + ")", borderRadius: 24, padding: 20, width: 320 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => { if(canPrev()) month === 0 ? (setMonth(11), setYear(y=>y-1)) : setMonth(m=>m-1) }} style={{ color: "#fff", background: "none", border: "none", fontSize: 20 }}>‹</button>
          <span style={{ color: "#fff", fontWeight: 700 }}>{MONTH_LT[month]} {year}</span>
          <button onClick={() => { if(canNext()) month === 11 ? (setMonth(0), setYear(y=>y+1)) : setMonth(m=>m+1) }} style={{ color: "#fff", background: "none", border: "none", fontSize: 20 }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const ds = `${year}-${String(month+1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isSel = ds === value;
            return <button key={i} onClick={() => { if (ds <= today) { onSelect(ds); onClose(); } }} style={{ aspectRatio: "1", borderRadius: 8, border: "none", background: isSel ? "#fff" : "transparent", color: isSel ? PK.dark : "#fff" }}>{d}</button>
          })}
        </div>
      </div>
    </div>
  );
}

// --- PAGRINDINIS KOMPONENTAS ---
export default function ClientView({ user, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeMeal, setActiveMeal] = useState(null);
  const [showMeals, setShowMeals] = useState(false);
  const [openMeal, setOpenMeal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [barcodeFood, setBarcodeFood] = useState(null);
  const [minDate, setMinDate] = useState(null);
  const [report, setReport] = useState(null);

  const isToday = selectedDate === todayStr();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      if (data?.created_at) setMinDate(data.created_at.split("T")[0]);
      setLoading(false);
    }
    load();
  }, [user.id]);

  useEffect(() => {
    async function checkReport() {
      if (!profile) return;
      const { data: measures } = await supabase.from("trainer_measurements").select("*").eq("user_id", user.id).order("measured_at", { ascending: false }).limit(2);
      if (measures?.length === 2 && measures[0].id !== profile.last_read_report_id) {
        setReport({
          id: measures[0].id,
          weightDiff: (measures[0].weight_measured - measures[1].weight_measured).toFixed(1),
          waistDiff: (measures[0].waist_cm - measures[1].waist_cm).toFixed(1),
          trainerNote: measures[0].trainer_note
        });
      }
    }
    if (!loading) checkReport();
  }, [user.id, profile, loading]);

  const loadEntries = useCallback(async () => {
    const { data } = await supabase.from("food_log").select("*").eq("user_id", user.id).eq("date", selectedDate).order("created_at");
    setEntries(data || []);
  }, [user.id, selectedDate]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function addEntry(meal, food) {
    await supabase.from("food_log").insert({ user_id: user.id, date: selectedDate, meal, name: food.name, amount: food.amount, kcal: food.kcal, protein: food.protein, fat: food.fat, carbs: food.carbs });
    setSearching(false); setActiveMeal(null); loadEntries();
  }

  async function removeEntry(id) {
    await supabase.from("food_log").delete().eq("id", id);
    loadEntries();
  }

  if (loading) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Kraunama...</div>;

  const hasData = profile?.weight && profile?.height && profile?.age;
  const res = hasData ? calcMacros({ gender: profile.gender, age: parseInt(profile.age), weight: parseFloat(profile.weight), height: parseFloat(profile.height), actId: profile.act, goalId: profile.goal }) : null;
  const totals = entries.reduce((a, e) => ({ kcal: a.kcal + (e.kcal || 0), protein: a.protein + (e.protein || 0), fat: a.fat + (e.fat || 0), carbs: a.carbs + (e.carbs || 0) }), { kcal: 0, protein: 0, fat: 0, carbs: 0 });

  return (
    <div style={{ minHeight: "100vh", background: "#fff", paddingBottom: 48 }}>
      {report && <ReportOverlay report={report} userId={user.id} onRead={() => setReport(null)} />}
      
      {showBarcode && <BarcodeScanner onResult={food => { setShowBarcode(false); setBarcodeFood(food); setSearching(true); }} onClose={() => setShowBarcode(false)} />}
      {searching && <FoodSearch onAdd={food => addEntry(activeMeal, food)} onClose={() => { setSearching(false); setActiveMeal(null); }} onBarcode={() => { setSearching(false); setShowBarcode(true); }} barcodeFood={barcodeFood} clearBarcodeFood={() => setBarcodeFood(null)} />}
      {showCalendar && <DatePickerModal value={selectedDate} minDate={minDate} onSelect={d => setSelectedDate(d)} onClose={() => setShowCalendar(false)} />}

      <div style={{ background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`, padding: 20, textAlign: "center", color: "#fff" }}>
        <h1 style={{ fontSize: 19 }}>Sveika, {profile?.name?.split(" ")[0]}!</h1>
        <button onClick={onLogout} style={{ marginTop: 10, background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "5px 10px", borderRadius: 8 }}>Atsijungti</button>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
        {!hasData ? <p>Planas ruošiamas...</p> : (
          <>
            <MotivationalCard userId={user.id} res={res} goalId={profile?.goal} />
            
            <div style={{ background: "linear-gradient(135deg," + PK.dark + "," + PK.mid + ")", borderRadius: 20, padding: 20, color: "#fff", marginBottom: 12 }}>
               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{res.target}</div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>TIKSLAS</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{Math.round(totals.kcal)}</div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>SUVALGYTA</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{Math.max(0, res.target - Math.round(totals.kcal))}</div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>LIKUTIS</div>
                  </div>
               </div>
            </div>

            <div style={{ background: PK.pale, borderRadius: 20, padding: 20, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <span style={{ fontWeight: 700 }}>{isToday ? "Šiandienos maistas" : fmtDate(selectedDate)}</span>
                <button onClick={() => setShowCalendar(true)}>📅</button>
              </div>
              
              {MEALS.map(meal => (
                <div key={meal.id} style={{ marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{meal.label}</span>
                    {isToday && <button onClick={() => { setActiveMeal(meal.id); setSearching(true); }}>+</button>}
                  </div>
                  {entries.filter(e => e.meal === meal.id).map(e => (
                    <div key={e.id} style={{ fontSize: 12, color: "#666", display: "flex", justifyContent: "space-between" }}>
                      <span>{e.name} ({e.amount}g)</span>
                      <span>{e.kcal} kcal <button onClick={() => removeEntry(e.id)}>✕</button></span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <CheckIn userId={user.id} targetKcal={res?.target} targetProtein={res?.prot?.g} age={parseInt(profile?.age)} />
            <SleepTracker userId={user.id} age={parseInt(profile.age)} date={selectedDate} />
            <WaterTracker goal={Math.round(parseFloat(profile.weight)*33)} userId={user.id} date={selectedDate} />
          </>
        )}
      </div>
    </div>
  );
}
