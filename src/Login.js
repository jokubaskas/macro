import { useState } from "react";
import { pb } from "./pb";
import { PK } from "./constants";

export default function Login() {
  const [mode,      setMode]      = useState("login");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [password2, setPassword2] = useState("");
  const [name,      setName]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await pb.collection("users").authWithPassword(email, password);
      // App.js onChange listener picks up the new session automatically
    } catch {
      setError("Neteisingas el. paštas arba slaptažodis.");
    }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    if (!name.trim())          { setError("Įveskite vardą ir pavardę."); setLoading(false); return; }
    if (password.length < 6)   { setError("Slaptažodis min. 6 simboliai."); setLoading(false); return; }
    if (password !== password2) { setError("Slaptažodžiai nesutampa."); setLoading(false); return; }

    try {
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        name,
        role: "client",
        onboarding_done: false,
        emailVisibility: true,
      });
      setSuccess("Paskyra sukurta! Prisijunkite ir užpildykite anketą.");
      setMode("login"); setPassword(""); setPassword2("");
    } catch (err) {
      setError(err.response?.message || err.message || "Klaida kuriant paskyrą.");
    }
    setLoading(false);
  }

  const inp = {
    width:"100%", padding:"13px 14px",
    border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:14,
    fontSize:16, color:"#fff", background:"rgba(255,255,255,0.07)",
    outline:"none", fontFamily:"inherit", WebkitAppearance:"none",
  };
  const lbl = { display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.75)", marginBottom:6 };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding:"0 20px",
    }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width:90, height:90, objectFit:"contain", borderRadius:18, marginBottom:14 }} />
        <h1 style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>Coach Vilma</h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>
          {mode === "login" ? "Prisijunkite prie savo paskyros" : "Sukurkite naują paskyrą"}
        </p>
      </div>

      <div style={{ width:"100%", maxWidth:400, background:"rgba(255,255,255,0.06)", borderRadius:24, padding:"28px 24px", border:"1px solid rgba(255,255,255,0.12)" }}>
        <form onSubmit={mode === "login" ? handleLogin : handleRegister} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {mode === "register" && (
            <div>
              <label style={lbl}>Vardas Pavardė</label>
              <input style={inp} type="text" value={name} placeholder="Vardas Pavardė" onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label style={lbl}>El. paštas</label>
            <input style={inp} type="email" value={email} placeholder="el.pastas@gmail.com" onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Slaptažodis</label>
            <input style={inp} type="password" value={password} placeholder="min. 6 simboliai" onChange={e => setPassword(e.target.value)} />
          </div>
          {mode === "register" && (
            <div>
              <label style={lbl}>Pakartokite slaptažodį</label>
              <input style={inp} type="password" value={password2} placeholder="pakartokite slaptažodį" onChange={e => setPassword2(e.target.value)} />
            </div>
          )}

          {error   && <p style={{ color:"#FFB3B3", fontSize:13, margin:0 }}>{error}</p>}
          {success && <p style={{ color:"#7FFFB0", fontSize:13, margin:0 }}>{success}</p>}

          <button type="submit" disabled={loading} style={{
            padding:"14px", background:PK.mid, border:"none", borderRadius:14,
            color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "..." : mode === "login" ? "Prisijungti" : "Registruotis"}
          </button>
        </form>

        <div style={{ textAlign:"center", marginTop:20 }}>
          <button onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); setSuccess(""); }}
            style={{ background:"none", border:"none", color:"rgba(255,255,255,0.55)", fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>
            {mode === "login" ? "Neturite paskyros? Registruokitės" : "Jau turite paskyrą? Prisijunkite"}
          </button>
        </div>
      </div>
    </div>
  );
}
