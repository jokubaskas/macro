import { useState, useEffect } from "react";
import { pb } from "./pb";
import Login from "./Login";
import AdminPanel from "./AdminPanel";
import ClientView from "./ClientView";
import Onboarding from "./Onboarding";
import PhotoUploadPrompt from "./Photouploadprompt";

export default function App() {
  const [user,         setUser]    = useState(null);
  const [profile,      setProfile] = useState(null);
  const [loading,      setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (pb.authStore.isValid) {
      loadProfile(pb.authStore.model);
    } else {
      setLoading(false);
    }
    const unsub = pb.authStore.onChange(async (token, model) => {
      if (model) await loadProfile(model);
      else { setUser(null); setProfile(null); setLoading(false); }
    });
    return () => unsub();
  }, []);

  async function loadProfile(authModel) {
    setUser(authModel);
    setProfile(null);
    const freshProfile = await pb.collection("users").getOne(authModel.id, { requestKey: null }).catch(() => authModel);
    setProfile(freshProfile);
    setLoading(false);
  }

  function handleLogout() { pb.authStore.clear(); }

  function handleDateChange(v) {
    setSelectedDate(v === "today" || !v ? new Date().toISOString().split("T")[0] : v);
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

  if (profile?.role === "admin") return <AdminPanel user={user} onLogout={handleLogout} />;

  if (!profile) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#6D1B3B,#AD1457)" }}>
      <div style={{ textAlign:"center" }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width:80, height:80, objectFit:"contain", marginBottom:12 }}/>
        <p style={{ color:"#F8BBD9", fontSize:14 }}>Kraunama...</p>
      </div>
    </div>
  );

  if (!profile.onboarding_done) return <Onboarding user={user} onComplete={() => loadProfile(user)} />;

  if (!profile.photo_front && profile.track_progress !== false) return <PhotoUploadPrompt user={user} onComplete={() => { loadProfile(user); }} />;

  return (
    <ClientView
      user={user}
      onLogout={handleLogout}
      selectedDate={selectedDate}
      onDateChange={handleDateChange}
    />
  );
}
