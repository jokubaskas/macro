import { useState, useEffect } from "react";
import { pb } from "./pb";
import Login from "./Login";
import ResetPassword from "./ResetPassword";
import AdminPanel from "./AdminPanel";
import ClientView from "./ClientView";
import Onboarding from "./Onboarding";
import PhotoUploadPrompt from "./Photouploadprompt";
import HealthUpdatePrompt from "./HealthUpdatePrompt";
import { LoadingScreen } from "./ui/kit";

export default function App() {
  const [user,         setUser]    = useState(null);
  const [profile,      setProfile] = useState(null);
  const [loading,      setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const resetToken = new URLSearchParams(window.location.search).get("token");

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

  if (resetToken) return <ResetPassword token={resetToken} />;

  if (loading) return <LoadingScreen background="#FFF0F5" textColor="#F48FB1" />;

  if (!user) return <Login />;

  if (profile?.role === "admin") return <AdminPanel user={user} onLogout={handleLogout} />;

  if (!profile) return <LoadingScreen background="linear-gradient(135deg,#6D1B3B,#AD1457)" textColor="#F8BBD9" />;

  if (!profile.onboarding_done) return <Onboarding user={user} onComplete={() => loadProfile(user)} />;

  if (!profile.health_survey_done && profile.track_progress !== false) return <HealthUpdatePrompt user={user} profile={profile} onComplete={() => loadProfile(user)} />;

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