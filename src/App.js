import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import Login from "./Login";
import AdminPanel from "./AdminPanel";
import ClientView from "./ClientView";

const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || "").split(",").map(e => e.trim());

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF0F5", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width: 80, height: 80, objectFit: "contain", borderRadius: 16, marginBottom: 16 }} />
        <p style={{ color: "#F48FB1", fontSize: 14 }}>Kraunama...</p>
      </div>
    </div>
  );

  if (!session) return <Login />;

  const isAdmin = ADMIN_EMAILS.includes(session.user.email);
  if (isAdmin) return <AdminPanel user={session.user} onLogout={handleLogout} />;
  return <ClientView user={session.user} onLogout={handleLogout} />;
}
