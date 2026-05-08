import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import AdminPanel from "./AdminPanel";
import ClientView from "./ClientView";

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gauk esamą sesiją
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user);
      else setLoading(false);
    });

    // Klausyk sesijos pakeitimų
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(data);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return (
    <div style={{
      minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center",
      background: "#FFF0F5",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>💗</div>
        <p style={{ color: "#F48FB1", fontSize: 14 }}>Kraunama...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  // Admin patikrinimas – pagal el. paštą
  const isAdmin = session.user.email === ADMIN_EMAIL;

  if (isAdmin) return <AdminPanel user={session.user} onLogout={handleLogout} />;

  return <ClientView user={session.user} onLogout={handleLogout} />;
}
