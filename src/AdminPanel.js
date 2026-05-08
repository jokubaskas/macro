import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";

function Card({ children, style }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 20, padding: "18px 16px",
      border: "1px solid " + PK.blush,
      boxShadow: "0 2px 12px rgba(173,20,87,0.07)",
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
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: PK.mid, marginBottom: 4 }}>{label}</label>
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          width: "100%", padding: "10px 12px",
          border: "2px solid " + (f ? PK.mid : PK.blush),
          borderRadius: 12, fontSize: 15, color: PK.dark,
          background: PK.pale, outline: "none",
          fontFamily: "inherit", WebkitAppearance: "none",
        }}
      />
    </div>
  );
}

function ClientForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:   client?.name   ?? "",
    gender: client?.gender ?? "f",
    age:    client?.age    ?? "",
    weight: client?.weight ?? "",
    height: client?.height ?? "",
    act:    client?.act    ?? 3,
    goal:   client?.goal   ?? "lose",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const btnBase = { border: "2px solid " + PK.blush, borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" };
  const active   = { borderColor: PK.mid, background: PK.light, color: PK.dark };
  const inactive = { background: "#fff", color: PK.rose };

  async function handleSave() {
    if (!form.name) { setError("Vardas butinas."); return; }
    setSaving(true); setError("");
    try {
      const { error } = await supabase.from("profiles").update({
        name: form.name, gender: form.gender,
        age: parseInt(form.age), weight: parseFloat(form.weight),
        height: parseFloat(form.height), act: form.act, goal: form.goal,
      }).eq("id", client.id);
      if (error) throw error;
      onSave();
    } catch(e) { setError(e.message); }
    setSaving(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <SectionLabel>Kliento duomenys</SectionLabel>
        <Field label="Vardas Pavarde" value={form.name} onChange={set("name")} type="text" placeholder="Emilija Serksnaite" />
      </Card>
      <Card>
        <SectionLabel>Lytis</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ id: "f", l: "Moteris" }, { id: "m", l: "Vyras" }].map(g => (
            <button key={g.id} onClick={() => set("gender")(g.id)}
              style={{ ...btnBase, flex: 1, padding: "10px 0", ...(form.gender === g.id ? active : inactive) }}>
              {g.l}
            </button>
          ))}
        </div>
      </Card>
      <Card>
        <SectionLabel>Kuno duomenys</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 10px" }}>
          <Field label="Amzius" value={form.age}    onChange={set("age")}    placeholder="28" />
          <Field label="Svoris (kg)" value={form.weight} onChange={set("weight")} placeholder="70" />
          <Field label="Ugis (cm)"   value={form.height} onChange={set("height")} placeholder="168" />
        </div>
      </Card>
      <Card>
        <SectionLabel>Aktyvumo lygis</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {ACTIVITY.map(a => (
            <button key={a.id} onClick={() => set("act")(a.id)}
              style={{ ...btnBase, padding: "9px 12px", textAlign: "left", display: "flex", justifyContent: "space-between", ...(form.act === a.id ? active : inactive) }}>
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
              style={{ ...btnBase, padding: "11px 6px", textAlign: "center", lineHeight: 1.4, ...(form.goal === g.id ? active : inactive) }}>
              {g.label}
            </button>
          ))}
        </div>
      </Card>
      {error && <div style={{ background: "#FFF0F5", border: "1px solid " + PK.coral, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: PK.mid }}>{error}</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: "2px solid " + PK.blush, background: "#fff", color: PK.rose, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Atsaukti</button>
        <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "13px 0", borderRadius: 14, background: "linear-gradient(135deg," + PK.dark + "," + PK.mid + ")", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saugoma..." : "Issaugoti"}
        </button>
      </div>
    </div>
  );
}

function MacroResult({ profile }) {
  const w = parseFloat(profile.weight), h = parseFloat(profile.height), a = parseInt(profile.age);
  if (!w || !h || !a) return <p style={{ color: PK.rose, fontSize: 12, textAlign: "center", padding: "12px 0" }}>Nepilni duomenys</p>;
  const res = calcMacros({ gender: profile.gender, age: a, weight: w, height: h, actId: profile.act, goalId: profile.goal });
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        {[
          { l: "Kalorijos", v: res.target, u: "kcal", c: PK.dark },
          { l: "Baltymai",  v: res.prot.g, u: "g",    c: PK.mid  },
          { l: "Riebalai",  v: res.fat.g,  u: "g",    c: PK.bright },
          { l: "Angliavandeniai", v: res.carb.g, u: "g", c: PK.rose },
        ].map(item => (
          <div key={item.l} style={{ background: PK.pale, borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: item.c }}>{item.v}<span style={{ fontSize: 9 }}>{item.u}</span></div>
            <div style={{ fontSize: 9, color: PK.rose, marginTop: 1 }}>{item.l}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: PK.rose, textAlign: "center" }}>Vanduo: {res.water}l · BMR: {res.bmr} · TDEE: {res.tdee}</p>
    </div>
  );
}

function ClientCard({ client, onEdit, onDelete, onConfirm, expanded, onToggle }) {
  const isConfirmed = !!client.email_confirmed_at;
  return (
    <Card style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: PK.light, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            {client.gender === "f" ? "👩" : "👨"}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: PK.dark, marginBottom: 2 }}>{client.name || client.email}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <p style={{ fontSize: 11, color: PK.rose }}>{client.email}</p>
              {!isConfirmed && (
                <span style={{ fontSize: 9, background: "#FFF3CD", color: "#856404", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>
                  Nepatvirtintas
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {!isConfirmed && (
            <button onClick={onConfirm} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid #9AE6B4", background: "#F0FFF4", color: "#276749", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Patvirtinti
            </button>
          )}
          <button onClick={onToggle} style={{ padding: "6px 10px", borderRadius: 10, border: "1px solid " + PK.blush, background: expanded ? PK.light : "#fff", color: PK.mid, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            {expanded ? "Uzdaryti" : "Makro"}
          </button>
          <button onClick={onEdit} style={{ padding: "6px 8px", borderRadius: 10, border: "1px solid " + PK.blush, background: "#fff", color: PK.mid, fontSize: 12, cursor: "pointer" }}>✏️</button>
          <button onClick={onDelete} style={{ padding: "6px 8px", borderRadius: 10, border: "1px solid " + PK.blush, background: "#fff", color: PK.rose, fontSize: 12, cursor: "pointer" }}>🗑️</button>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid " + PK.blush }}>
          <p style={{ fontSize: 11, color: PK.rose, marginBottom: 8 }}>
            {client.age}m. · {client.weight}kg · {client.height}cm · {ACTIVITY.find(a => a.id === client.act)?.label} · {GOALS.find(g => g.id === client.goal)?.label}
          </p>
          <MacroResult profile={client} />
        </div>
      )}
    </Card>
  );
}

export default function AdminPanel({ user, onLogout }) {
  const [clients,    setClients]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [view,       setView]       = useState("list");
  const [editClient, setEditClient] = useState(null);
  const [expanded,   setExpanded]   = useState(null);
  const [msg,        setMsg]        = useState("");

  useEffect(() => { loadClients(); }, []);

  async function loadClients() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("role", "client").order("name");
    if (!data) { setClients([]); setLoading(false); return; }

    // Gauk email_confirmed_at iš auth.users per RPC arba tiesiog rodykim profiles
    setClients(data);
    setLoading(false);
  }

  async function handleConfirm(client) {
    setMsg("");
    const { error } = await supabase.rpc("confirm_user_email", { user_id: client.id });
    if (error) {
      // Jei RPC nera, bandome tiesiogiai
      setMsg("Vykdyk SQL: update auth.users set email_confirmed_at = now() where id = '" + client.id + "';");
    } else {
      setMsg(client.name + " patvirtintas!");
      setTimeout(() => setMsg(""), 3000);
    }
    loadClients();
  }

  async function handleDelete(client) {
    if (!window.confirm("Istrinti " + client.name + "?")) return;
    await supabase.from("profiles").delete().eq("id", client.id);
    loadClients();
  }

  if (view === "edit") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg," + PK.pale + " 0%,#fff 55%," + PK.light + " 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom: 48 }}>
        <div style={{ background: "linear-gradient(135deg," + PK.dark + "," + PK.mid + ")", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => { setView("list"); setEditClient(null); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 14, cursor: "pointer" }}>
            Atgal
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>Redaguoti: {editClient?.name}</h1>
        </div>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px" }}>
          <ClientForm client={editClient} onSave={() => { setView("list"); setEditClient(null); loadClients(); }} onCancel={() => { setView("list"); setEditClient(null); }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg," + PK.pale + " 0%,#fff 55%," + PK.light + " 100%)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom: 48 }}>
      <div style={{ background: "linear-gradient(135deg," + PK.dark + "," + PK.mid + ")", padding: "16px 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>💗</span>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: "#fff", margin: 0 }}>Admin panele</h1>
              <p style={{ fontSize: 11, color: PK.blush, margin: 0 }}>{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Atsijungti
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px" }}>

        {msg && (
          <div style={{ background: msg.includes("SQL") ? "#FFF3CD" : "#F0FFF4", border: "1px solid " + (msg.includes("SQL") ? "#FFC107" : "#9AE6B4"), borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 12, color: msg.includes("SQL") ? "#856404" : "#276749" }}>
            {msg}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ background: "linear-gradient(135deg," + PK.dark + "," + PK.mid + ")", borderRadius: 16, padding: "16px 14px" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{clients.length}</div>
            <div style={{ fontSize: 11, color: PK.blush }}>Klientu isviso</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 16, padding: "16px 14px", border: "1px solid " + PK.blush }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: PK.mid }}>{clients.filter(c => c.weight && c.height && c.age).length}</div>
            <div style={{ fontSize: 11, color: PK.rose }}>Su pilnais duomenimis</div>
          </div>
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: PK.mid, marginBottom: 10 }}>Klientai</p>

        {loading ? (
          <p style={{ textAlign: "center", color: PK.rose, padding: "24px 0" }}>Kraunama...</p>
        ) : clients.length === 0 ? (
          <div style={{ background: PK.pale, borderRadius: 16, padding: "32px 20px", textAlign: "center", border: "2px dashed " + PK.blush }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🌸</div>
            <p style={{ color: PK.rose, fontSize: 14 }}>Dar nera klientu</p>
            <p style={{ color: PK.blush, fontSize: 12 }}>Klientai atsiras kai registruosis</p>
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
              onConfirm={() => handleConfirm(client)}
            />
          ))
        )}
      </div>
    </div>
  );
}
