import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { PK, GOALS, calcMacros, isBirthdayToday } from "./constants";
import WaterTracker from "./WaterTracker";
import SleepTracker from "./SleepTracker";
import DailyCheckin from "./DailyCheckin";
import MotivationalCard from "./MotivationalCard";
import WorkoutView from "./WorkoutView";
import BookingClient from "./BookingClient";
import ProgressPhotos from "./ProgressPhotos";
import PushPermissionPrompt from "./PushNotifications";
import StreakBadge from "./StreakBadge";
import StepsTracker from "./StepsTracker";
import TrainingPackages from "./TrainingPackages";
import Onboarding from "./Onboarding";
import ClientStats from "./ClientStats";
import { LoadingScreen, ConfettiBurst } from "./ui/kit";
import { WaveHand, Calendar, ChevronRight, Ticket, Dumbbell, BarChart, Moon, Droplet, Camera, TrendingUp, Cake, Sparkle, Check, Refresh } from "./ui/icons";

const BDAY_KEYFRAMES = `@keyframes bdayBannerGlow { 0%, 100% { box-shadow: 0 0 16px rgba(255,215,0,0.35); } 50% { box-shadow: 0 0 28px rgba(255,215,0,0.6); } }`;

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }
function Sep() { return <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", margin: "2px 0" }} />; }

// ── Savaitės apžvalgos juosta ─────────────────────────────────────────────────
function WeeklyRecap({ userId }) {
  const [data, setData] = useState(null); // null = kraunama/nėra ką rodyti, false = nėra duomenų

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const today = todayStr();
      const from = daysAgoStr(13);
      const weekStart = daysAgoStr(6), prevStart = from, prevEnd = daysAgoStr(7);
      const inRange = (d, a, b) => d >= a && d <= b;

      const [checkins, waters, sleeps] = await Promise.all([
        pb.collection("daily_checkins").getFullList({ filter:`user_id="${userId}" && date>="${from}" && date<="${today}" && is_done=true`, requestKey:null }).catch(()=>[]),
        pb.collection("water_log").getFullList({ filter:`user_id="${userId}" && date>="${from}" && date<="${today}"`, requestKey:null }).catch(()=>[]),
        pb.collection("sleep_log").getFullList({ filter:`user_id="${userId}" && date>="${from}" && date<="${today}"`, requestKey:null }).catch(()=>[]),
      ]);
      if (cancelled) return;

      const thisWeekCheckins = checkins.filter(c => inRange(c.date, weekStart, today)).length;
      const thisWeekWater = waters.filter(w => inRange(w.date, weekStart, today));
      const prevWeekWater = waters.filter(w => inRange(w.date, prevStart, prevEnd));
      const thisWeekSleep = sleeps.filter(s => inRange(s.date, weekStart, today) && s.hours_slept).map(s => s.hours_slept);
      const prevWeekSleep = sleeps.filter(s => inRange(s.date, prevStart, prevEnd) && s.hours_slept).map(s => s.hours_slept);

      const avgWaterThis = thisWeekWater.length ? thisWeekWater.reduce((a,w)=>a+(w.ml||0),0)/thisWeekWater.length : null;
      const avgWaterPrev = prevWeekWater.length ? prevWeekWater.reduce((a,w)=>a+(w.ml||0),0)/prevWeekWater.length : null;
      const waterChangePct = (avgWaterThis != null && avgWaterPrev) ? Math.round((avgWaterThis - avgWaterPrev) / avgWaterPrev * 100) : null;

      const avgSleepThis = thisWeekSleep.length ? thisWeekSleep.reduce((a,v)=>a+v,0)/thisWeekSleep.length : null;
      const avgSleepPrev = prevWeekSleep.length ? prevWeekSleep.reduce((a,v)=>a+v,0)/prevWeekSleep.length : null;
      let sleepTrend = null;
      if (avgSleepThis != null) {
        if (avgSleepPrev == null) sleepTrend = "new";
        else { const diff = avgSleepThis - avgSleepPrev; sleepTrend = Math.abs(diff) < 0.4 ? "stable" : diff > 0 ? "up" : "down"; }
      }

      const hasData = thisWeekCheckins > 0 || thisWeekWater.length > 0 || thisWeekSleep.length > 0;
      setData(hasData ? { checkins: thisWeekCheckins, waterChangePct, avgWaterThis, sleepTrend } : false);
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (!data) return null;

  const parts = [];
  if (data.waterChangePct != null) {
    parts.push({ Icon:Droplet, text:`vanduo ${data.waterChangePct>0?"+":""}${data.waterChangePct}%`, color: data.waterChangePct>=0?"#7FFFB0":"#FF8888" });
  } else if (data.avgWaterThis != null) {
    parts.push({ Icon:Droplet, text:`vanduo ${(data.avgWaterThis/1000).toFixed(1)}L/d.`, color:"#6EC6FF" });
  }
  if (data.sleepTrend) {
    const label = data.sleepTrend==="stable" ? "miegas stabilus" : data.sleepTrend==="up" ? "miegas gerėja" : data.sleepTrend==="down" ? "miegas prastėja" : "miegas sekamas";
    parts.push({ Icon:Moon, text:label, color: data.sleepTrend==="up"?"#7FFFB0":data.sleepTrend==="down"?"#FF8888":"#B39DFF" });
  }
  parts.push({ Icon:Check, text:`${data.checkins}/7 check-in`, color: data.checkins>=5?"#7FFFB0":"rgba(255,255,255,0.75)" });

  return (
    <div style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:16, padding:"14px 16px", marginBottom:12 }}>
      <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 10px", display:"flex", alignItems:"center", gap:6 }}>
        <Sparkle size={12} />Savaitės apžvalga
      </p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {parts.map((p, i) => (
          <span key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:700, color:p.color, background:"rgba(255,255,255,0.06)", borderRadius:99, padding:"6px 12px" }}>
            <p.Icon size={12} />{p.text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Kalendoriaus modalas ──────────────────────────────────────────────────────
function DatePickerModal({ value, minDate, onSelect, onClose }) {
  const today = todayStr();
  const [month, setMonth] = useState(() => {
    const d = new Date(value + "T12:00:00");
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const firstDay = new Date(month.y, month.m, 1).getDay();
  const daysInMonth = new Date(month.y, month.m + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "linear-gradient(160deg,#3a0a20,#6D1B3B)", borderRadius: "24px 24px 0 0", padding: "20px 16px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m - 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", cursor: "pointer" }}>◀</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
            {new Date(month.y, month.m, 1).toLocaleDateString("lt-LT", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => setMonth(p => { const d = new Date(p.y, p.m + 1, 1); return { y: d.getFullYear(), m: d.getMonth() }; })}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", cursor: "pointer" }}>▶</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 8 }}>
          {["P","A","T","K","P","Š","S"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.4)", padding: "4px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {Array(offset).fill(null).map((_,i) => <div key={"e"+i} />)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const d = i + 1;
            const dateStr = `${month.y}-${String(month.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const isSelected = dateStr === value;
            const isToday = dateStr === today;
            const disabled = minDate && dateStr < minDate;
            return (
              <button key={d} onClick={() => { if (!disabled) { onSelect(dateStr); onClose(); } }}
                style={{ aspectRatio: "1", border: isSelected ? "2px solid rgba(255,255,255,0.8)" : "none", borderRadius: 10,
                  background: isSelected ? "rgba(255,255,255,0.25)" : isToday ? "rgba(255,255,255,0.1)" : "transparent",
                  cursor: disabled ? "default" : "pointer", color: disabled ? "rgba(255,255,255,0.2)" : "#fff",
                  fontSize: 13, fontWeight: isSelected || isToday ? 700 : 400, fontFamily: "inherit" }}>{d}</button>
            );
          })}
        </div>
        <button onClick={onClose} style={{ width: "100%", marginTop: 16, padding: "12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 14, color: "rgba(255,255,255,0.7)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Uždaryti</button>
      </div>
    </div>
  );
}

export default function ClientView({ user, onLogout, selectedDate: propDate, onDateChange }) {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [minDate,      setMinDate]      = useState(null);
  const [checkinKey,   setCheckinKey]   = useState(0);
  const [showWorkout,  setShowWorkout]  = useState(false);
  const [showBooking,  setShowBooking]  = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [showStats,    setShowStats]    = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Aktyvus tab (null = pagrindinis)
  const activeTab = showPackages ? "packages"
    : showWorkout ? "workout"
    : showBooking ? "booking"
    : showProgress ? "progress"
    : showStats ? "stats"
    : null;

  function openTab(tab) {
    setShowPackages(tab === "packages");
    setShowWorkout(tab === "workout");
    setShowBooking(tab === "booking");
    setShowProgress(tab === "progress");
    setShowStats(tab === "stats");
  }
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [nextBooking,   setNextBooking]   = useState(null);
  const [badges,        setBadges]        = useState({ packages:0, booking:0 });
  const [refreshing,    setRefreshing]    = useState(false);
  const [refreshKey,    setRefreshKey]    = useState(0);

  const selectedDate    = propDate || todayStr();
  const setSelectedDate = (d) => onDateChange ? onDateChange(d) : null;
  const isToday         = selectedDate === todayStr();

  const loadProfile = useCallback(async () => {
    const data = await pb.collection("users").getOne(user.id);
    setProfile(data);
    setLoading(false);
    if (data) {
      const min = new Date(); min.setDate(min.getDate() - 90);
      setMinDate(min.toISOString().split("T")[0]);
    }
    // Tikrinti ar yra aktyvus planas
    const today = new Date().toISOString().split("T")[0];
    pb.collection("workout_plans").getFullList({
      filter: `user_id="${user.id}" && is_active=true`, requestKey: null,
    }).then(plans => {
      setHasActivePlan(plans.some(p => p.start_date <= today && p.end_date >= today));
    }).catch(() => {});

    // Kita artimiausia patvirtinta rezervacija
    pb.collection("bookings").getFullList({
      filter: `client_id="${user.id}" && status="approved" && date>="${today}"`,
      sort: "date,start_time", requestKey: null,
    }).then(bks => { setNextBooking(bks[0] || null); }).catch(() => {});

    // Badge'ai
    Promise.all([
      pb.collection("training_packages").getFullList({ filter:`client_id="${user.id}" && status="pending"`, requestKey:null }).catch(()=>[]),
      pb.collection("bookings").getFullList({ filter:`client_id="${user.id}" && status="pending"`, requestKey:null }).catch(()=>[]),
    ]).then(([pkgs, bks]) => {
      setBadges({ packages: pkgs.length, booking: bks.length });
    });
  }, [user.id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadProfile();
    setRefreshKey(k => k + 1);
    setRefreshing(false);
  }

  if (loading) return <LoadingScreen background={`linear-gradient(160deg,#3a0a20,${PK.dark})`} textColor={PK.blush} />;

  const profileAge = profile?.dob
    ? Math.floor((new Date() - new Date(profile.dob)) / (365.25 * 24 * 60 * 60 * 1000))
    : parseInt(profile?.age || 30);
  const goalLabel = GOALS.find(g => g.id === profile?.goal)?.label ?? "";
  const waterGoal = Math.round(parseFloat(profile?.weight || 60) * 33);
  const isBirthday = isBirthdayToday(profile?.dob);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: `linear-gradient(160deg,#3a0a20 0%,${PK.dark} 45%,${PK.mid} 100%)`, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* Scrollinamas turinys — antraštė + content vienoje scroll zonoje */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 200 }}>

      {/* Header — paprastas */}
      <div style={{ padding: "env(safe-area-inset-top, 16px) 20px 14px", paddingTop: "max(env(safe-area-inset-top), 16px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo.png" alt="" style={{ width: 34, height: 34, objectFit: "contain", borderRadius: 8 }} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                Sveika, {profile?.name?.split(" ")[0]} <WaveHand size={15} color="#FFD37A" />
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {isToday ? new Date().toLocaleDateString("lt-LT", { weekday:"long", month:"long", day:"numeric" }) : selectedDate}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {profile?.track_progress && (
              <button onClick={() => setShowCalendar(true)} style={{ background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                <Calendar size={12} /> {isToday ? new Date().toLocaleDateString("lt-LT", { month: "short", day: "numeric" }) : selectedDate}
                <span style={{ fontSize: 9, opacity: 0.6 }}>▼</span>
              </button>
            )}
            <button onClick={handleRefresh} disabled={refreshing} aria-label="Atnaujinti" style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.85)", cursor: refreshing ? "default" : "pointer" }}>
              <Refresh size={15} style={{ animation: refreshing ? "spin 0.7s linear infinite" : "none", transformOrigin: "center" }} />
            </button>
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, padding: "7px 12px", color: "rgba(255,255,255,0.7)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Išeiti</button>
          </div>
        </div>
        <Sep />
      </div>

      {/* Content */}
      <div key={refreshKey} style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px" }}>

        {/* Gimtadienio pasveikinimas */}
        {isToday && isBirthday && (
          <div style={{
            position:"relative", overflow:"hidden", textAlign:"center",
            background:"linear-gradient(135deg,#FFD700,#FF6EB4)", borderRadius:18,
            padding:"20px 20px 18px", marginBottom:16,
            animation:"bdayBannerGlow 2.4s ease-in-out infinite",
          }}>
            <style>{BDAY_KEYFRAMES}</style>
            <Cake size={30} color="#fff" style={{ marginBottom:8 }} />
            <p style={{ fontSize:17, fontWeight:800, color:"#fff", margin:"0 0 3px" }}>
              Su gimtadieniu, {profile?.name?.split(" ")[0]}!
            </p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.9)", margin:0, lineHeight:1.5 }}>
              Linkime sveikatos, jėgų ir puikios nuotaikos šiandien ir visus metus!
            </p>
            <ConfettiBurst count={12} />
          </div>
        )}

        {/* Kita treniruotė */}
        {isToday && nextBooking && (
          <div onClick={() => openTab("booking")} className="tap" style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:16, padding:"12px 16px", marginBottom:12, cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <Calendar size={26} color="rgba(255,255,255,0.85)" />
            <div style={{ flex:1 }}>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:"0 0 2px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>Kita treniruotė</p>
              <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:0 }}>
                {new Date(nextBooking.date + "T12:00:00").toLocaleDateString("lt-LT", { weekday:"long", month:"short", day:"numeric" })} · {nextBooking.start_time}
              </p>
            </div>
            <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
          </div>
        )}

        {!isToday && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(255,255,255,0.07)", borderRadius: 14, display:"flex", alignItems:"center", gap:8 }}>
            <Calendar size={13} color="rgba(255,255,255,0.6)" />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("lt-LT", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        )}

        {/* Nesekančių progreso centriniai mygtukai */}
        {isToday && !profile?.track_progress && (
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
            <button onClick={()=>setShowPackages(true)} style={{ width:"100%", padding:"18px 20px", borderRadius:18, background:"linear-gradient(135deg,rgba(109,27,59,0.6),rgba(173,20,87,0.6))", border:"1.5px solid rgba(255,255,255,0.2)", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:14, textAlign:"left" }}>
              <Ticket size={26} />
              <div>
                <p style={{ margin:"0 0 2px", fontSize:14 }}>Treniruočių paketai</p>
                <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:400 }}>Peržiūrėti ir įsigyti paketą</p>
              </div>
            </button>
            {hasActivePlan && (
              <button onClick={()=>setShowWorkout(true)} style={{ width:"100%", padding:"18px 20px", borderRadius:18, background:"linear-gradient(135deg,rgba(26,71,49,0.7),rgba(39,103,73,0.7))", border:"1.5px solid rgba(255,255,255,0.15)", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:14, textAlign:"left" }}>
                <Dumbbell size={26} />
                <div>
                  <p style={{ margin:"0 0 2px", fontSize:14 }}>Šiandienos treniruotė</p>
                  <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:400 }}>Atlikti priskirtus pratimus</p>
                </div>
              </button>
            )}
            <button onClick={()=>setShowBooking(true)} style={{ width:"100%", padding:"18px 20px", borderRadius:18, background:"rgba(255,255,255,0.08)", border:"1.5px solid rgba(255,255,255,0.15)", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:14, textAlign:"left" }}>
              <Calendar size={26} />
              <div>
                <p style={{ margin:"0 0 2px", fontSize:14 }}>Rezervuoti treniruotę</p>
                <p style={{ margin:0, fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:400 }}>Pasirinkti laiką pas trenerę</p>
              </div>
            </button>
          </div>
        )}

        {/* Streak */}
        {isToday && profile?.track_progress && <StreakBadge userId={user.id} />}

        {/* Savaitės apžvalga */}
        {isToday && profile?.track_progress && <WeeklyRecap userId={user.id} />}

        {/* Push pranešimai */}
        <PushPermissionPrompt userId={user.id} />

        {/* Noriu sekti progresą */}
        {isToday && !profile?.track_progress && (
          <div style={{ background:"rgba(255,255,255,0.07)", border:"1.5px dashed rgba(255,255,255,0.2)", borderRadius:16, padding:"14px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"#fff", margin:"0 0 2px", display:"flex", alignItems:"center", gap:6 }}><BarChart size={14} />Progreso sekimas</p>
              <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", margin:0 }}>Svoris, miegas, vanduo ir daugiau</p>
            </div>
            <button onClick={()=>setShowOnboarding(true)}
              style={{ background:"linear-gradient(135deg,#6D1B3B,#AD1457)", border:"none", borderRadius:10, padding:"8px 14px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", flexShrink:0, marginLeft:10 }}>
              Įjungti
            </button>
          </div>
        )}

        {/* Motyvacija — tik sekiantiems */}
        {isToday && profile?.track_progress && (
          <MotivationalCard userId={user.id} res={null} goalId={profile?.goal} />
        )}

        {/* Daily Check-in — tik sekiantiems */}
        {profile?.track_progress && (
          <DailyCheckin
            key={checkinKey}
            userId={user.id}
            date={selectedDate}
            onSaved={() => setCheckinKey(k => k + 1)}
          />
        )}

        {/* Miegas — tik sekiantiems */}
        {profile?.track_progress && (
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "16px 18px", marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 12px", display:"flex", alignItems:"center", gap:6 }}><Moon size={14} />Miegas</p>
            <SleepTracker userId={user.id} age={profileAge} date={selectedDate} />
          </div>
        )}

        {/* Žingsniai — tik sekiantiems */}
        {profile?.track_progress && (
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "16px 18px", marginBottom: 12 }}>
            <StepsTracker userId={user.id} date={selectedDate} goal={profile?.steps_per_day} />
          </div>
        )}

        {/* Vanduo — tik sekiantiems */}
        {profile?.track_progress && (
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 20, padding: "16px 18px", marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 12px", display:"flex", alignItems:"center", gap:6 }}><Droplet size={14} />Vanduo</p>
            <WaterTracker goal={waterGoal} userId={user.id} date={selectedDate} />
          </div>
        )}

      </div>
      </div>

      {/* Tab bar apačioje — tik track_progress vartotojams, paslėpta kai atidarytas kuris nors poekranis
          (kitaip ji uždengia to ekrano apatinius mygtukus, lygiai ta pati problema kaip admin panelėje) */}
      {profile?.track_progress && !activeTab && (
        <div style={{
          position:"fixed", left:14, right:14, bottom:"max(14px, env(safe-area-inset-bottom))", zIndex:1000,
          maxWidth:452, margin:"0 auto",
          background:"rgba(24,7,17,0.82)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
          border:"1px solid rgba(255,255,255,0.1)", borderRadius:26,
          display:"flex", alignItems:"center", justifyContent:"space-between", gap:3, padding:7,
          boxShadow:"0 10px 30px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
        }}>
          {[
            { id:"packages", Icon:Ticket,     label:"Paketai",     badge: badges.packages },
            ...(hasActivePlan ? [{ id:"workout", Icon:Dumbbell, label:"Treniruotė", badge:0 }] : []),
            { id:"booking",  Icon:Calendar,   label:"Rezervacija", badge: badges.booking },
            { id:"progress", Icon:Camera,     label:"Progresas",   badge:0 },
            { id:"stats",    Icon:TrendingUp, label:"Statistika",  badge:0 },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => openTab(isActive ? null : tab.id)}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:isActive?6:0,
                  background: isActive ? "linear-gradient(135deg,#AD1457,#6D1B3B)" : "transparent",
                  border:"none", borderRadius:18, padding:isActive?"9px 13px":"9px 11px",
                  cursor:"pointer", position:"relative", flexShrink:0,
                  boxShadow: isActive ? "0 4px 14px rgba(173,20,87,0.45)" : "none",
                  transition:"background 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.28s ease, padding 0.28s cubic-bezier(.34,1.56,.64,1)",
                }}>
                <div style={{ position:"relative", flexShrink:0 }}>
                  <tab.Icon size={19} color={isActive ? "#fff" : "rgba(255,255,255,0.5)"} strokeWidth={isActive ? 2 : 1.6} style={{ transition:"color 0.2s ease" }} />
                  {tab.badge > 0 && (
                    <div style={{ position:"absolute", top:-6, right:-7, background:"#FF4444", borderRadius:99, minWidth:14, height:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, fontWeight:800, color:"#fff", padding:"0 3px", boxShadow:"0 0 0 2px rgba(24,7,17,0.9)" }}>
                      {tab.badge}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize:12, fontWeight:700, color:"#fff", whiteSpace:"nowrap", overflow:"hidden",
                  maxWidth: isActive ? 90 : 0, opacity: isActive ? 1 : 0,
                  transition:"max-width 0.28s cubic-bezier(.34,1.56,.64,1), opacity 0.18s ease",
                }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {showWorkout && <WorkoutView user={user} onClose={()=>openTab(null)} />}
      {showBooking && <BookingClient user={user} onClose={()=>openTab(null)} />}
      {showProgress && <ProgressPhotos user={user} onClose={()=>openTab(null)} />}
      {showPackages && <TrainingPackages user={user} onClose={()=>openTab(null)} />}
      {showStats && <ClientStats user={user} onClose={()=>openTab(null)} />}
      {showOnboarding && (
        <Onboarding user={user} startStep={1} onComplete={async()=>{ await loadProfile(); setShowOnboarding(false); }} />
      )}
      {showCalendar && (
        <DatePickerModal value={selectedDate} minDate={minDate}
          onSelect={d => setSelectedDate(d)} onClose={() => setShowCalendar(false)} />
      )}
    </div>
  );
}
