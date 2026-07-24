import { useState, useRef } from "react";
import { pb } from "./pb";
import { PK } from "./constants";
import { Eye, EyeOff } from "./ui/icons";

export default function ResetPassword({ token }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const passwordRef  = useRef(null);
  const password2Ref = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const password  = passwordRef.current.value;
    const password2 = password2Ref.current.value;
    if (password.length < 6)    { setError("Slaptažodis min. 6 simboliai."); setLoading(false); return; }
    if (password !== password2) { setError("Slaptažodžiai nesutampa."); setLoading(false); return; }
    try {
      await pb.collection("users").confirmPasswordReset(token, password, password2);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.message || "Nuoroda negalioja arba pasibaigė jos galiojimo laikas. Užsisakykite naują.");
    }
    setLoading(false);
  }

  function goToLogin() {
    window.location.href = window.location.pathname;
  }

  const inp = {
    width:"100%", padding:"13px 14px",
    border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:14,
    fontSize:16, color:"#fff", background:"rgba(255,255,255,0.07)",
    outline:"none", fontFamily:"inherit", WebkitAppearance:"none",
  };
  const lbl = { display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"rgba(255,255,255,0.75)", marginBottom:6 };
  const eyeBtn = { position:"absolute", right:4, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#B47AFF", cursor:"pointer", padding:8, display:"flex" };

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
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>Naujas slaptažodis</p>
      </div>

      <div style={{ width:"100%", maxWidth:400, background:"rgba(255,255,255,0.06)", borderRadius:24, padding:"28px 24px", border:"1px solid rgba(255,255,255,0.12)" }}>
        {success ? (
          <div style={{ textAlign:"center" }}>
            <p style={{ color:"#7FFFB0", fontSize:14, marginBottom:18 }}>Slaptažodis pakeistas! Dabar galite prisijungti.</p>
            <button onClick={goToLogin} style={{ width:"100%", padding:"14px", background:PK.mid, border:"none", borderRadius:14, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              Prisijungti
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={lbl} htmlFor="reset-password">Naujas slaptažodis</label>
              <div style={{ position:"relative" }}>
                <input id="reset-password" ref={passwordRef} style={{...inp, paddingRight:44}} type={showPw ? "text" : "password"} autoComplete="new-password" placeholder="min. 6 simboliai" />
                <button type="button" onClick={()=>setShowPw(v=>!v)} style={eyeBtn} aria-label={showPw ? "Slėpti slaptažodį" : "Rodyti slaptažodį"}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div>
              <label style={lbl} htmlFor="reset-password2">Pakartokite slaptažodį</label>
              <div style={{ position:"relative" }}>
                <input id="reset-password2" ref={password2Ref} style={{...inp, paddingRight:44}} type={showPw2 ? "text" : "password"} autoComplete="new-password" placeholder="pakartokite slaptažodį" />
                <button type="button" onClick={()=>setShowPw2(v=>!v)} style={eyeBtn} aria-label={showPw2 ? "Slėpti slaptažodį" : "Rodyti slaptažodį"}>
                  {showPw2 ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && <p style={{ color:"#FFB3B3", fontSize:13, margin:0 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ padding:"14px", background:PK.mid, border:"none", borderRadius:14, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:loading?0.7:1 }}>
              {loading ? "Keičiama..." : "Nustatyti naują slaptažodį"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}