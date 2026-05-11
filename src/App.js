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
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data);
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
        background:"#fff", borderTop:"1px solid #FCE4EC",
        display:"flex", maxWidth:480, margin:"0 auto",
        boxShadow:"0 -2px 20px rgba(173,20,87,0.12)",
      }}>
        {[
          { id:"food",     emoji:"🍽️", label:"Mityba" },
          { id:"activity", emoji:"🏃", label:"Aktyvumas" },
        ].map(t=>(
          <button key={t.id} onClick={()=>{ if(t.id==="food") setFoodKey(k=>k+1); setTab(t.id); }} style={{
            flex:1, padding:"10px 0 14px",
            background:"none", border:"none", cursor:"pointer",
            fontFamily:"inherit", display:"flex", flexDirection:"column",
            alignItems:"center", gap:3,
            borderTop: tab===t.id ? "2.5px solid #AD1457" : "2.5px solid transparent",
          }}>
            <span style={{ fontSize:22 }}>{t.emoji}</span>
            <span style={{ fontSize:10, fontWeight:700, color:tab===t.id?"#AD1457":"#B0B0B0" }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
