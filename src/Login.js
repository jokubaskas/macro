import { useState } from "react";
import { supabase } from "./supabase";
import { PK } from "./constants";

export default function Login() {
  const [mode,     setMode]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Neteisingas el. pastas arba slaptazodis.");
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    if (!name) { setError("Iveskite varda."); setLoading(false); return; }
    if (password.length < 6) { setError("Slaptazodis min. 6 simboliai."); setLoading(false); return; }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, email, name, role: "client" });
    }
    setSuccess("Paskyra sukurta! Dabar prisijunkite.");
    setMode("login"); setPassword("");
    setLoading(false);
  }

  const inputStyle = {
    width: "100%", padding: "13px 14px",
    border: "2px solid " + PK.blush, borderRadius: 14,
    fontSize: 16, color: PK.dark, background: PK.pale,
    outline: "none", fontFamily: "inherit", WebkitAppearance: "none",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, " + PK.pale + " 0%, #fff 55%, " + PK.light + " 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "0 20px",
    }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>&#128151;</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: PK.dark, marginBottom: 4 }}>
          Makro skaiciuokle
        </h1>
        <p style={{ fontSize: 13, color: PK.rose }}>
          {mode === "login" ? "Prisijunk prie savo paskyros" : "Sukurk nauja paskyra"}
        </p>
      </div>

      <div style={{
        width: "100%", maxWidth: 380,
        background: "#fff", borderRadius: 24, padding: "28px 24px",
        border: "1px solid " + PK.blush,
        boxShadow: "0 4px 24px rgba(173,20,87,0.1)",
      }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[{ id: "login", l: "Prisijungti" }, { id: "register", l: "Registruotis" }].map(t => (
            <button key={t.id} onClick={() => { setMode(t.id); setError(""); setSuccess(""); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: "2px solid " + (mode === t.id ? PK.mid : PK.blush),
                background: mode === t.id ? PK.light : "#fff",
                color: mode === t.id ? PK.dark : PK.rose,
                fontFamily: "inherit",
              }}>{t.l}</button>
          ))}
        </div>

        <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
          {mode === "register" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: PK.mid, marginBottom: 6 }}>Vardas Pavarde</label>
              <input type="text" value={name} required onChange={e => setName(e.target.value)} placeholder="Emilija Serksnaite" style={inputStyle} />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: PK.mid, marginBottom: 6 }}>El. pastas</label>
            <input type="email" value={email} required onChange={e => setEmail(e.target.value)} placeholder="vardas@gmail.com" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: PK.mid, marginBottom: 6 }}>Slaptazodis</label>
            <input type="password" value={password} required onChange={e => setPassword(e.target.value)} placeholder="min. 6 simboliai" style={inputStyle} />
          </div>

          {error && <div style={{ background: "#FFF0F5", border: "1px solid " + PK.coral, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: PK.mid, marginBottom: 16 }}>{error}</div>}
          {success && <div style={{ background: "#F0FFF4", border: "1px solid #9AE6B4", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#276749", marginBottom: 16 }}>{success}</div>}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "14px 0",
            background: "linear-gradient(135deg, " + PK.dark + ", " + PK.mid + ")",
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "Palaukite..." : mode === "login" ? "Prisijungti" : "Sukurti paskyra"}
          </button>
        </form>
      </div>
    </div>
  );
}
