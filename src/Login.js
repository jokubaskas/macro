import { useState, useRef } from "react";
import { pb } from "./pb";
import { PK } from "./constants";

export default function Login() {
  const [mode,      setMode]      = useState("login");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  // Laukai laikomi "nekontroliuojami" (native DOM, ne React value/onChange),
  // kad kiekvienas simbolis nekeltų React re-render — tai galėjo trukdyti
  // iOS/Chrome slaptažodžių tvarkyklės plėtiniui teisingai užpildyti laukus
  // (pastebėta, kad pasirinkus išsaugotą paskyrą per raktelio piktogramą,
  // slaptažodis būdavo įrašomas į el. pašto lauką).
  const nameRef      = useRef(null);
  const emailRef      = useRef(null);
  const passwordRef   = useRef(null);
  const password2Ref  = useRef(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await pb.collection("users").authWithPassword(emailRef.current.value, passwordRef.current.value);
      // App.js onChange listener picks up the new session automatically
    } catch {
      setError("Neteisingas el. paštas arba slaptažodis.");
    }
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    const name = nameRef.current.value;
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    const password2 = password2Ref.current.value;
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
      setMode("login");
      if (passwordRef.current) passwordRef.current.value = "";
      if (password2Ref.current) password2Ref.current.value = "";
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
    transition:"border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
  };
  const lbl = { display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.75)", marginBottom:6 };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding:"0 20px",
    }}>
      <style>{`
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        .login-field { animation: fadeInUp 0.4s ease-out both; }
        .login-inp:focus { border-color: rgba(255,255,255,0.55) !important; background: rgba(255,255,255,0.12) !important; box-shadow: 0 0 0 3px rgba(255,255,255,0.08); }
      `}</style>

      <div style={{ textAlign:"center", marginBottom:28, animation:"popIn 0.6s cubic-bezier(.23,1,.32,1) both" }}>
        <img src="/logo.png" alt="Coach Vilma" style={{ width:90, height:90, objectFit:"contain", borderRadius:18, marginBottom:14 }} />
        <h1 style={{ fontSize:22, fontWeight:700, color:"#fff", marginBottom:4 }}>Coach Vilma</h1>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", transition:"opacity 0.2s ease" }} key={mode + "-sub"}>
          {mode === "login" ? "Prisijunkite prie savo paskyros" : "Sukurkite naują paskyrą"}
        </p>
      </div>

      <div style={{ width:"100%", maxWidth:400, background:"rgba(255,255,255,0.06)", borderRadius:24, padding:"28px 24px", border:"1px solid rgba(255,255,255,0.12)", animation:"fadeInUp 0.5s ease-out 0.1s both" }}>
        <form onSubmit={mode === "login" ? handleLogin : handleRegister} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {mode === "register" && (
            <div className="login-field" style={{ animationDelay:"0.03s" }}>
              <label style={lbl} htmlFor="login-name">Vardas Pavardė</label>
              <input id="login-name" ref={nameRef} className="login-inp" style={inp} type="text" name="name" autoComplete="name" defaultValue="" placeholder="Vardas Pavardė" />
            </div>
          )}
          <div className="login-field" style={{ animationDelay:"0.06s" }}>
            <label style={lbl} htmlFor="login-email">El. paštas</label>
            <input id="login-email" ref={emailRef} className="login-inp" style={inp} type="text" inputMode="email" name="username" autoComplete="username" defaultValue="" placeholder="el.pastas@gmail.com" />
          </div>
          <div className="login-field" style={{ animationDelay:"0.1s" }}>
            <label style={lbl} htmlFor="login-password">Slaptažodis</label>
            <input id="login-password" ref={passwordRef} className="login-inp" style={inp} type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} defaultValue="" placeholder="min. 6 simboliai" />
          </div>
          {mode === "register" && (
            <div className="login-field" style={{ animationDelay:"0.13s" }}>
              <label style={lbl} htmlFor="login-password2">Pakartokite slaptažodį</label>
              <input id="login-password2" ref={password2Ref} className="login-inp" style={inp} type="password" name="password2" autoComplete="new-password" defaultValue="" placeholder="pakartokite slaptažodį" />
            </div>
          )}

          {error   && <p style={{ color:"#FFB3B3", fontSize:13, margin:0, animation:"fadeInUp 0.3s ease-out both" }}>{error}</p>}
          {success && <p style={{ color:"#7FFFB0", fontSize:13, margin:0, animation:"fadeInUp 0.3s ease-out both" }}>{success}</p>}

          <button type="submit" disabled={loading} style={{
            padding:"14px", background:PK.mid, border:"none", borderRadius:14,
            color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
            opacity: loading ? 0.7 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            transition:"opacity 0.2s ease",
          }}>
            {loading && <span style={{ width:16, height:16, borderRadius:"50%", border:"2.5px solid rgba(255,255,255,0.35)", borderTopColor:"#fff", animation:"loginSpin 0.7s linear infinite" }} />}
            {loading ? "" : mode === "login" ? "Prisijungti" : "Registruotis"}
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