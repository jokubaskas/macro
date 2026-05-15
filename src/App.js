import { useState, useEffect } from "react";
import { pb } from "./pb";
import Login from "./Login";
import AdminPanel from "./AdminPanel";
import ClientView from "./ClientView";
import ActivityView from "./ActivityView";
import Onboarding from "./Onboarding";
import PhotoUploadPrompt from "./Photouploadprompt";


export default function App() {
  const [user,         setUser]         = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("food");
  const [foodKey,      setFoodKey]      = useState(0);
  const [stepsToday,   setStepsToday]   = useState(0);
  const [workoutsToday, setWorkoutsToday] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    // Check initial auth state
    if (pb.authStore.isValid) {
      loadProfile(pb.authStore.model);
    } else {
      setLoading(false);
    }

    // Listen for auth changes
    const unsub = pb.authStore.onChange(async (token, model) => {
      if (model) {
        await loadProfile(model);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function loadProfile(authModel) {
    const today = new Date().toISOString().split("T")[0];
    setUser(authModel);

    // Fetch fresh profile + today's activity in parallel
    const [freshProfile, steps, wrkts] = await Promise.all([
      pb.collection("users").getOne(authModel.id).catch(() => authModel),
      pb.collection("step_log")
        .getFirstListItem(`user_id="${authModel.id}" && date="${today}"`)
        .catch(() => null),
      pb.collection("workout_log")
        .getFullList({ filter: `user_id="${authModel.id}" && date="${today}"` })
        .catch(() => []),
    ]);

    setProfile(freshProfile);
    if (steps?.steps) setStepsToday(steps.steps);
    if (wrkts?.length) setWorkoutsToday(wrkts);
    setLoading(false);
  }

  function handleLogout() {
    pb.authStore.clear(); // triggers onChange → clears state
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#FFF0F5", fontFamily:"-apple-system, sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width:80, height:80, objectFit:"contain", borderRadius:16, marginBottom:16 }} />
        <p style={{ color:"#F48FB1", fontSize:14 }}>Kraunama...</p>
      </div>
    </div>
  );

  if (!user) return <Login />;

  const isAdmin = profile?.role === "admin";
  if (isAdmin) return <AdminPanel user={user} onLogout={handleLogout} />;

  // Jei profilis dar kraunamas – nerodyti anketos
  if (!profile) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#6D1B3B,#AD1457)" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width:80, height:80, objectFit:"contain", marginBottom:12 }}/>
        <p style={{ color:"#F8BBD9", fontSize:14 }}>Kraunama...</p>
      </div>
    </div>
  );

  if (!profile.onboarding_done) {
    return <Onboarding user={user} onComplete={() => loadProfile(user)} />;
  }

  if (!profile.photo_front) {
  return <PhotoUploadPrompt user={user} onComplete={() => loadProfile(user)} />;
}

  if (!profile.onboarding_done) {
  return <Onboarding user={user} onComplete={() => loadProfile(user)} />;
}

  function handleDateChange(v) {
    if (v === "today" || !v) setSelectedDate(new Date().toISOString().split("T")[0]);
    else setSelectedDate(v);
  }

  return (
    <div style={{ position:"relative" }}>
      {tab === "food"
        ? <ClientView key={foodKey} user={user} onLogout={handleLogout} stepsToday={stepsToday} workoutsToday={workoutsToday} selectedDate={selectedDate} onDateChange={handleDateChange}
            onActivityChange={(st, wt) => { setStepsToday(st); setWorkoutsToday(wt); }} />
        : <ActivityView user={user} onLogout={handleLogout} selectedDate={selectedDate} onDateChange={handleDateChange}
            onActivityChange={(st, wt) => { setStepsToday(st); setWorkoutsToday(wt); }} />
      }

      {/* Apačios navigacija */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:300,
        background:"rgba(20,4,12,0.92)",
        backdropFilter:"blur(16px)",
        borderTop:"1px solid rgba(255,255,255,0.12)",
        display:"flex",
      }}>
        {[
          { id:"food",     emoji:"🍽️", label:"Mityba" },
          { id:"activity", emoji:"🏃", label:"Aktyvumas" },
        ].map(t => (
          <button key={t.id} onClick={() => { if (t.id === "food") setFoodKey(k => k+1); setTab(t.id); }} style={{
            flex:1, padding:"10px 0 18px",
            background:"none", border:"none", cursor:"pointer",
            fontFamily:"inherit", display:"flex", flexDirection:"column",
            alignItems:"center", gap:4,
            borderTop: tab === t.id ? "2px solid rgba(255,255,255,0.8)" : "2px solid transparent",
            transition:"all 0.15s",
          }}>
            <span style={{ fontSize:22, opacity: tab === t.id ? 1 : 0.4 }}>{t.emoji}</span>
            <span style={{ fontSize:10, fontWeight:700, color: tab === t.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)", letterSpacing:"0.03em" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}