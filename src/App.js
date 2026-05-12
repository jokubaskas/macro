import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import AdminPanel from "./AdminPanel";
import ClientView from "./ClientView";
import ActivityView from "./ActivityView";
import Onboarding from "./Onboarding";

const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || "").split(",").map(e => e.trim());

export default function App() {
  const [session,      setSession]      = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("food");
  const [foodKey,      setFoodKey]      = useState(0);
  const [stepsToday,   setStepsToday]   = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return; // getSession() jau tvarko
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(userId) {
    const today = new Date().toISOString().split("T")[0];
    const [{ data: prof }, { data: steps }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("step_log").select("steps").eq("user_id", userId).eq("date", today).maybeSingle(),
    ]);
    setProfile(prof);
    if (steps?.steps) setStepsToday(steps.steps);
    setLoading(false);
  }

  async function handleLogout() { await supabase.auth.signOut(); }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#FFF0F5", fontFamily:"-apple-system, sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width:80, height:80, objectFit:"contain", borderRadius:16, marginBottom:16 }} />
        <p style={{ color:"#F48FB1", fontSize:14 }}>Kraunama...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  const isAdmin = ADMIN_EMAILS.includes(session.user.email);
  if (isAdmin) return <AdminPanel user={session.user} onLogout={handleLogout} />;

  // Klientas – ar baigta registracija?
  // Jei profilis dar kraunamas – nerodyti anketos (apsauga nuo mirksnio)
  if (!profile) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#6D1B3B,#AD1457)" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width:80, height:80, objectFit:"contain", marginBottom:12 }}/>
        <p style={{ color:"#F8BBD9", fontSize:14 }}>Kraunama...</p>
      </div>
    </div>
  );

  if (!profile.onboarding_done) {
    return <Onboarding user={session.user} onComplete={() => loadProfile(session.user.id)} />;
  }

  // Kliento navigacija
  function handleDateChange(v) {
    if (v === "today" || !v) setSelectedDate(new Date().toISOString().split("T")[0]);
    else setSelectedDate(v);
  }

  return (
    <div style={{ position:"relative" }}>
      {tab==="food"
        ? <ClientView key={foodKey} user={session.user} onLogout={handleLogout} stepsToday={stepsToday} selectedDate={selectedDate} onDateChange={handleDateChange} />
        : <ActivityView user={session.user} onLogout={handleLogout} stepsToday={stepsToday} onStepsChange={setStepsToday} selectedDate={selectedDate} onDateChange={handleDateChange} />
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
        ].map(t=>(
          <button key={t.id} onClick={()=>{ if(t.id==="food") setFoodKey(k=>k+1); setTab(t.id); }} style={{
            flex:1, padding:"10px 0 18px",
            background:"none", border:"none", cursor:"pointer",
            fontFamily:"inherit", display:"flex", flexDirection:"column",
            alignItems:"center", gap:4,
            borderTop: tab===t.id ? "2px solid rgba(255,255,255,0.8)" : "2px solid transparent",
            transition:"all 0.15s",
          }}>
            <span style={{ fontSize:22, opacity: tab===t.id?1:0.4 }}>{t.emoji}</span>
            <span style={{ fontSize:10, fontWeight:700, color:tab===t.id?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)", letterSpacing:"0.03em" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
