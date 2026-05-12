import { useState } from "react";
import { supabase } from "./supabase";
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Neteisingas el. paštas arba slaptažodis.");
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    if (!name.trim())          { setError("Įveskite vardą ir pavardę."); setLoading(false); return; }
    if (password.length < 6)   { setError("Slaptažodis min. 6 simboliai."); setLoading(false); return; }
    if (password !== password2) { setError("Slaptažodžiai nesutampa."); setLoading(false); return; }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id, email, name, role: "client",
        onboarding_done: false,
      });
    }
    setSuccess("Paskyra sukurta! Prisijunkite ir užpildykite anketą.");
    setMode("login"); setPassword(""); setPassword2("");
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
      background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)"+PK.pale+" 0%,#fff 55%,"+PK.light+" 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding:"0 20px",
    }}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width:90, height:90, objectFit:"contain", borderRadius:18, marginBottom:14 }} />
        <h1 style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>Coach Vilma</h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>
          {mode === "login" ? "Prisijunk prie savo paskyros" : "Sukurk naują paskyrą"}
        </p>
      </div>

      <div style={{ width:"100%", maxWidth:380, background:"rgba(255,255,255,0.08)", borderRadius:24, padding:"28px 24px", border:"1px solid rgba(255,255,255,0.15)", boxShadow:"0 4px 24px rgba(173,20,87,0.1)" }}>
        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          {[{id:"login",l:"Prisijungti"},{id:"register",l:"Registruotis"}].map(t => (
            <button key={t.id} onClick={() => { setMode(t.id); setError(""); setSuccess(""); }}
              style={{ flex:1, padding:"10px 0", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer",
                border:"2px solid "+(mode===t.id?PK.mid:PK.blush),
                background:mode===t.id?PK.light:"#fff", color:mode===t.id?PK.dark:PK.rose, fontFamily:"inherit",
              }}>{t.l}</button>
          ))}
        </div>

        <form onSubmit={mode==="login" ? handleLogin : handleRegister}>
          {mode === "register" && (
            <div style={{ marginBottom:14 }}>
              <label style={lbl}>Vardas Pavardė</label>
              <input type="text" value={name} required onChange={e=>setName(e.target.value)} placeholder="Emilija Šerkšnaitė" style={inp} />
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <label style={lbl}>El. paštas</label>
            <input type="email" value={email} required onChange={e=>setEmail(e.target.value)} placeholder="vardas@gmail.com" style={inp} />
          </div>

          <div style={{ marginBottom: mode==="register" ? 14 : 20 }}>
            <label style={lbl}>Slaptažodis</label>
            <input type="password" value={password} required onChange={e=>setPassword(e.target.value)} placeholder="min. 6 simboliai" style={inp} />
          </div>

          {mode === "register" && (
            <div style={{ marginBottom:20 }}>
              <label style={lbl}>Pakartoti slaptažodį</label>
              <input type="password" value={password2} required onChange={e=>setPassword2(e.target.value)} placeholder="pakartok slaptažodį" style={inp} />
              {password2 && password !== password2 && (
                <p style={{ fontSize:11, color:"#E53E3E", marginTop:5 }}>⚠ Slaptažodžiai nesutampa</p>
              )}
              {password2 && password === password2 && password.length >= 6 && (
                <p style={{ fontSize:11, color:"#38A169", marginTop:5 }}>✓ Slaptažodžiai sutampa</p>
              )}
            </div>
          )}

          {error   && <div style={{ background:"#FFF0F5", border:"1px solid "+PK.coral, borderRadius:10, padding:"10px 14px", fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:16 }}>{error}</div>}
          {success && <div style={{ background:"#F0FFF4", border:"1px solid #9AE6B4", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#276749", marginBottom:16 }}>{success}</div>}

          <button type="submit" disabled={loading} style={{
            width:"100%", padding:"14px 0",
            background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")",
            color:"#fff", border:"none", borderRadius:14,
            fontSize:15, fontWeight:700, cursor:"pointer",
            fontFamily:"inherit", opacity:loading?0.7:1,
          }}>
            {loading ? "Palaukite..." : mode==="login" ? "Prisijungti" : "Sukurti paskyrą →"}
          </button>

          {mode === "register" && (
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.5)", textAlign:"center", marginTop:12, lineHeight:1.5 }}>
              Po registracijos užpildysi trumpą anketą apie save 🌸
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
