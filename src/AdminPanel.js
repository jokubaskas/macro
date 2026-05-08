import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";

const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

// ── UI KOMPONENTAI ─────────────────────────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 20, padding: "18px 16px",
      border: `1px solid ${PK.blush}`,
      boxShadow: `0 2px 12px rgba(173,20,87,0.07)`,
      ...style,
    }}>{children}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color: PK.mid, marginBottom: 10,
    }}>{children}</p>
  );
}

function Field({ label, value, onChange, type = "number", placeholder }) {
  const [f, setF] = useState(false);
  return (
    <div>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: PK.mid, marginBottom: 4,
      }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: "100%", padding: "10px 12px",
          border: `2px solid ${f ? PK.mid : PK.blush}`,
          borderRadius: 12, fontSize: 15, color: PK.dark,
          background: PK.pale, outline: "none",
          fontFamily: "inherit", WebkitAppearance: "none",
          transition: "border-color 0.15s",
        }}
      />
    </div>
  );
}

// ── KLIENTO FORMA ─────────────────────────────────────────────────────────
function ClientForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:     client?.name     ?? "",
    email:    client?.email    ?? "",
    password: "",
    gender:   client?.gender   ?? "f",
    age:      client?.age      ?? "",
    weight:   client?.weight   ?? "",
    height:   client?.height   ?? "",
    act:      client?.act      ?? 3,
    goal:     client?.goal     ?? "lose",
  });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState("");

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const btnBase = {
    border: `2px solid ${PK.blush}`, borderRadius: 10,
    cursor: "pointer", transition: "all 0.15s",
    fontSize: 12, fontWeight: 700, fontFamily: "inherit",
  };
  const active   = { borderColor: PK.mid, background: PK.light, color: PK.dark };
  const inactive = { background: "#fff", color: PK.rose };

  async function handleSave() {
    if (!form.name || !form.email) { setError("Vardas ir el. paštas būtini."); return; }
    setSaving(true); setError("");
    try {
      if (client) {
        // Atnaujinti esamą klientą
        const { error } = await supabase
          .from("profiles")
          .update({ name: form.name, gender: form.gender, age: parseInt(form.age),
                    weight: parseFloat(form.weight), height: parseFloat(form.height),
                    act: form.act, goal: form.goal })
          .eq("id", client.id);
        if (error) throw error;
      } else {
        // Sukurti naują klientą
        if (!form.password) { setError("Slaptažodis būtinas naujam klientui."); setSaving(false); return; }
        const { data, error: authError } = await supabase.auth.admin.createUser({
          email: form.email, password: form.password, email_confirm: true,
        });
        if (authError) throw authError;
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id, name: form.name, email: form.email, role: "client",
          gender: form.gender, age: parseInt(form.age),
          weight: parseFloat(form.weight), height: parseFloat(form.height),
          act: form.act, goal: form.goal,
        });
        if (profileError) throw profileError;
      }
      onSave();
    } catch (e) {
      setError(e.message || "Klaida išsaugant.");
    }
    setSaving(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <SectionLabel>Kliento duomenys</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field label="Vardas Pavardė" value={form.name} onChange={set("name")} type="text" placeholder="Emilija Šerkšnaitė" />
          {!client && <>
            <Field label="El. paštas" value={form.email} onChange={set("email")} type="email" placeholder="emilija@gmail.com" />
            <Field label="Slaptažodis" value={form.password} onChange={set("password")} type="password" placeholder="min. 6 simboliai" />
          </>}
        </div>
      </Card>

      <Card>
        <SectionLabel>Lytis</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "f", l: "♀ Moteris" }, { id: "m", l: "♂ Vyras" }].map(g => (
            <button key={g.id} onClick={() => set("gender")(g.id)}
              style={{ ...btnBase, flex: 1, padding: "10px 0", ...(form.gender === g.id ? active : inactive) }}>
              {g.l}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Kūno duomenys</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 10px" }}>
          <Field label="Amžius" value={form.age}    onChange={set("age")}    placeholder="28" />
          <Field label="Svoris (kg)" value={form.weight} onChange={set("weight")} placeholder="70" />
          <Field label="Ūgis (cm)"   value={form.height} onChange={set("height")} placeholder="168" />
        </div>
      </Card>

      <Card>
        <SectionLabel>Aktyvumo lygis</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ACTIVITY.map(a => (
            <button key={a.id} onClick={() => set("act")(a.id)}
              style={{
                ...btnBase, padding: "9px 12px", textAlign: "left",
                display: "flex", justifyContent: "space-between",
                ...(form.act === a.id ? active : inactive),
              }}>
              <span>{a.label}</span>
              <span style={{ fontSize: 11, fontWeight: 400, color: PK.rose }}>{a.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel>Tikslas</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {GOALS.map(g => (
            <button key={g.id} onClick={() => set("goal")(g.id)}
              style={{ ...btnBase, padding: "11px 6px", textAlign: "center", lineHeight: 1.4,
                ...(form.goal === g.id ? active : inactive) }}>
              {g.label}
            </button>
          ))}
        </div>
      </Card>

      {error && (
        <div style={{
          background: "#FFF0F5", border: `1px solid ${PK.coral}`,
          borderRadius: 10, padding: "10px 14px", fontSize: 13, color: PK.mid,
        }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: "13px 0", borderRadius: 14,
          border: `2px solid ${PK.blush}`, background: "#fff",
          color: PK.rose, fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
        }}>Atšaukti</button>
        <button onClick={handleSave} disabled={saving} style={{
          flex: 2, padding: "13px 0", borderRadius: 14,
          background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`,
          color: "#fff", border: "none", fontSize: 14,
          fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          opacity: saving ? 0.7 : 1,
        }}>{saving ? "Saugoma..." : client ? "Išsaugoti" : "Sukurti klientą"}</button>
      </div>
    </div>
  );
}

// ── MAKRO REZULTATŲ KORTELĖ ────────────────────────────────────────────────
function MacroResult({ profile }) {
  const w = parseFloat(profile.weight);
  const h = parseFloat(profile.height);
  const a = parseInt(profile.age);
  if (!w || !h || !a) return (
    <p style={{ color: PK.rose, fontSize: 12, textAlign: "center", padding: "12px 0" }}>
      Nepilni duomenys – makro neskaičiuojamas
    </p>
  );
  const res = calcMacros({ gender: profile.gender, age: a, weight: w, height: h,
                           actId: profile.act, goalId: profile.goal });
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          { l: "Kalorijos",  v: res.target,   u: "kcal", c: PK.dark   },
          { l: "Baltymai",   v: res.prot.g,   u: "g",    c: PK.mid    },
          { l: "Riebalai",   v: res.fat.g,    u: "g",    c: PK.bright },
          { l: "Angliavandeniai", v: res.carb.g, u: "g", c: PK.rose   },
        ].map(item => (
          <div key={item.l} style={{
            background: PK.pale, borderRadius: 12,
            padding: "10px 6px", textAlign: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: item.c }}>
              {item.v}<span style={{ fontSize: 10 }}>{item.u}</span>
            </div>
            <div style={{ fontSize: 9, color: PK.rose, marginTop: 2 }}>{item.l}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: PK.rose, textAlign: "center" }}>
        💧 Vanduo: {res.water}l/d. &nbsp;·&nbsp; BMR: {res.bmr} kcal &nbsp;·&nbsp; TDEE: {res.tdee} kcal
      </p>
    </div>
  );
}

// ── KLIENTO KORTELĖ SĄRAŠE ────────────────────────────────────────────────
function ClientCard({ client, onEdit, onDelete, expanded, onToggle }) {
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: PK.light, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>
            {client.gender === "f" ? "👩" : "👨"}
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: PK.dark, marginBottom: 2 }}>
              {client.name}
            </p>
            <p style={{ fontSize: 11, color: PK.rose }}>{client.email}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onToggle} style={{
            padding: "7px 12px", borderRadius: 10, border: `1px solid ${PK.blush}`,
            background: expanded ? PK.light : "#fff", color: PK.mid,
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>{expanded ? "Uždaryti" : "Makro"}</button>
          <button onClick={onEdit} style={{
            padding: "7px 10px", borderRadius: 10, border: `1px solid ${PK.blush}`,
            background: "#fff", color: PK.mid, fontSize: 12,
            cursor: "pointer", fontFamily: "inherit",
          }}>✏️</button>
          <button onClick={onDelete} style={{
            padding: "7px 10px", borderRadius: 10, border: `1px solid ${PK.blush}`,
            background: "#fff", color: PK.rose, fontSize: 12,
            cursor: "pointer", fontFamily: "inherit",
          }}>🗑️</button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${PK.blush}` }}>
          <p style={{
            fontSize: 11, color: PK.rose, marginBottom: 10,
          }}>
            {client.age}m. · {client.weight}kg · {client.height}cm ·{" "}
            {ACTIVITY.find(a => a.id === client.act)?.label} ·{" "}
            {GOALS.find(g => g.id === client.goal)?.label}
          </p>
          <MacroResult profile={client} />
        </div>
      )}
    </Card>
  );
}

// ── ADMIN PUSLAPIS ─────────────────────────────────────────────────────────
export default function AdminPanel({ user, onLogout }) {
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState("list"); // list | new | edit
  const [editClient, setEditClient] = useState(null);
  const [expanded,   setExpanded]   = useState(null);

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "client")
      .order("name");
    setClients(data || []);
    setLoading(false);
  }

  async function handleDelete(client) {
    if (!window.confirm(`Ištrinti ${client.name}?`)) return;
    await supabase.from("profiles").delete().eq("id", client.id);
    await supabase.auth.admin.deleteUser(client.id);
    loadClients();
  }

  if (view === "new" || view === "edit") {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${PK.pale} 0%, #fff 55%, ${PK.light} 100%)`,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        paddingBottom: 48,
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`,
          padding: "16px 20px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={() => { setView("list"); setEditClient(null); }} style={{
            background: "rgba(255,255,255,0.2)", border: "none",
            borderRadius: 10, padding: "8px 12px",
            color: "#fff", fontSize: 14, cursor: "pointer",
          }}>← Atgal</button>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
            {view === "new" ? "Naujas klientas" : `Redaguoti: ${editClient?.name}`}
          </h1>
        </div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px" }}>
          <ClientForm
            client={editClient}
            onSave={() => { setView("list"); setEditClient(null); loadClients(); }}
            onCancel={() => { setView("list"); setEditClient(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg, ${PK.pale} 0%, #fff 55%, ${PK.light} 100%)`,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      paddingBottom: 48,
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`,
        padding: "env(safe-area-inset-top, 16px) 20px 20px",
        paddingTop: "max(env(safe-area-inset-top, 16px), 16px)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>💗</span>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>
                Admin panelė
              </h1>
              <p style={{ fontSize: 11, color: PK.blush, margin: 0 }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{
            background: "rgba(255,255,255,0.15)", border: "none",
            borderRadius: 10, padding: "8px 12px",
            color: "#fff", fontSize: 12, fontWeight: 600,
            cursor: "pointer",
          }}>Atsijungti</button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px" }}>

        {/* Statistika */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{
            background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`,
            borderRadius: 16, padding: "16px 14px",
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{clients.length}</div>
            <div style={{ fontSize: 11, color: PK.blush }}>Klientų iš viso</div>
          </div>
          <div style={{
            background: "#fff", borderRadius: 16, padding: "16px 14px",
            border: `1px solid ${PK.blush}`,
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: PK.mid }}>
              {clients.filter(c => c.weight && c.height && c.age).length}
            </div>
            <div style={{ fontSize: 11, color: PK.rose }}>Su pilnais duomenimis</div>
          </div>
        </div>

        {/* Naujas klientas mygtukas */}
        <button onClick={() => setView("new")} style={{
          width: "100%", padding: "14px 0", marginBottom: 16,
          background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`,
          color: "#fff", border: "none", borderRadius: 16,
          fontSize: 15, fontWeight: 700, cursor: "pointer",
          fontFamily: "inherit",
        }}>+ Naujas klientas</button>

        {/* Klientų sąrašas */}
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: PK.mid, marginBottom: 10,
        }}>Klientai</p>

        {loading ? (
          <p style={{ textAlign: "center", color: PK.rose, padding: "24px 0" }}>Kraunama...</p>
        ) : clients.length === 0 ? (
          <div style={{
            background: PK.pale, borderRadius: 16, padding: "32px 20px",
            textAlign: "center", border: `2px dashed ${PK.blush}`,
          }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🌸</div>
            <p style={{ color: PK.rose, fontSize: 14 }}>Dar nėra klientų</p>
            <p style={{ color: PK.blush, fontSize: 12 }}>Spausk "+ Naujas klientas"</p>
          </div>
        ) : (
          clients.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              expanded={expanded === client.id}
              onToggle={() => setExpanded(expanded === client.id ? null : client.id)}
              onEdit={() => { setEditClient(client); setView("edit"); }}
              onDelete={() => handleDelete(client)}
            />
          ))
        )}
      </div>
    </div>
  );
}
