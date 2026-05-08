import { useState } from "react";
import { supabase } from "./supabase";
import { PK } from "./constants";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Neteisingas el. paštas arba slaptažodis.");
    setLoading(false);
  }

  const inputStyle = {
    width: "100%", padding: "13px 14px",
    border: `2px solid ${PK.blush}`, borderRadius: 14,
    fontSize: 16, color: PK.dark, background: PK.pale,
    outline: "none", fontFamily: "inherit",
    WebkitAppearance: "none",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${PK.pale} 0%, #fff 55%, ${PK.light} 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "0 20px",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>💗</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: PK.dark, marginBottom: 4 }}>
          Makro skaičiuoklė
        </h1>
        <p style={{ fontSize: 13, color: PK.rose }}>Prisijunk prie savo paskyros</p>
      </div>

      {/* Forma */}
      <div style={{
        width: "100%", maxWidth: 380,
        background: "#fff", borderRadius: 24,
        padding: "28px 24px",
        border: `1px solid ${PK.blush}`,
        boxShadow: `0 4px 24px rgba(173,20,87,0.1)`,
      }}>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: "block", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: PK.mid, marginBottom: 6,
            }}>El. paštas</label>
            <input
              type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              placeholder="vardas@gmail.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: "block", fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: PK.mid, marginBottom: 6,
            }}>Slaptažodis</label>
            <input
              type="password" value={password} required
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              background: "#FFF0F5", border: `1px solid ${PK.coral}`,
              borderRadius: 10, padding: "10px 14px",
              fontSize: 13, color: PK.mid, marginBottom: 16,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "14px 0",
            background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`,
            color: "#fff", border: "none", borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", opacity: loading ? 0.7 : 1,
          }}>
            {loading ? "Jungiamasi..." : "Prisijungti"}
          </button>
        </form>
      </div>
    </div>
  );
}
