import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import AdminPanel from "./AdminPanel";
import ClientView from "./ClientView";
import Onboarding from "./Onboarding";

const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || "").split(",").map(e => e.trim());

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
  if (!profile?.onboarding_done) {
    return <Onboarding user={session.user} onComplete={() => loadProfile(session.user.id)} />;
  }

  return <ClientView user={session.user} onLogout={handleLogout} />;
}
