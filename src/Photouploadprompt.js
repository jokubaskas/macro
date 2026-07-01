import { useState } from "react";
import { pb } from "./pb";

export default function PhotoUploadPrompt({ user, onComplete }) {
  const [photos,   setPhotos]   = useState({ photo_front: null, photo_side: null, photo_back: null });
  const [previews, setPreviews] = useState({ photo_front: null, photo_side: null, photo_back: null });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  async function handleFile(field, e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreviews(p => ({ ...p, [field]: ev.target.result }));
    reader.readAsDataURL(file);
    setPhotos(p => ({ ...p, [field]: file }));
    setError("");
  }

  async function handleSave() {
    if (!photos.photo_front) {
      setError("Priekinė nuotrauka privaloma.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      if (photos.photo_front) formData.append("photo_front", photos.photo_front);
      if (photos.photo_side)  formData.append("photo_side",  photos.photo_side);
      if (photos.photo_back)  formData.append("photo_back",  photos.photo_back);
      await pb.collection("users").update(user.id, formData);
      onComplete();
      window.location.reload();
    } catch(e) {
      console.error("Photo upload:", e);
      setError("Klaida įkeliant nuotraukas. Bandykite dar kartą.");
    }
    setSaving(false);
  }

  const fields = [
    { key: "photo_front", label: "Priekis", emoji: "⬆️", required: true },
    { key: "photo_side",  label: "Šonas",   emoji: "➡️", required: false },
    { key: "photo_back",  label: "Nugara",  emoji: "⬇️", required: false },
  ];

  const canSave = !!photos.photo_front;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            Pradinės nuotraukos
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>
            Trenerė matys tavo pradinę būklę ir galės sekti progresą. Nuotraukos privačios.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {fields.map(f => (
            <label key={f.key} style={{ cursor: "pointer", display: "block" }}>
              <input type="file" accept="image/*"
                onChange={e => handleFile(f.key, e)} style={{ display: "none" }} />
              <div style={{
                aspectRatio: "3/4", borderRadius: 14,
                border: previews[f.key]
                  ? "2px solid rgba(255,255,255,0.6)"
                  : f.required
                    ? "2px dashed rgba(255,180,180,0.5)"
                    : "2px dashed rgba(255,255,255,0.25)",
                background: previews[f.key] ? "transparent" : "rgba(255,255,255,0.06)",
                overflow: "hidden",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                {previews[f.key] ? (
                  <img src={previews[f.key]} alt={f.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <>
                    <span style={{ fontSize: 22 }}>{f.emoji}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{f.label}</span>
                    {f.required && <span style={{ fontSize: 9, color: "rgba(255,150,150,0.8)" }}>* privaloma</span>}
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>+ Pridėti</span>
                  </>
                )}
              </div>
            </label>
          ))}
        </div>

        {error && (
          <p style={{ color: "#FF8888", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>
        )}

        <button onClick={handleSave} disabled={saving || !canSave} style={{
          width: "100%", padding: "14px 0",
          background: canSave ? "linear-gradient(135deg,#6D1B3B,#AD1457)" : "rgba(255,255,255,0.1)",
          border: "none", borderRadius: 16,
          color: canSave ? "#fff" : "rgba(255,255,255,0.3)",
          fontSize: 15, fontWeight: 700,
          cursor: canSave ? "pointer" : "default",
          fontFamily: "inherit",
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? "Saugoma..." : "💾 Išsaugoti nuotraukas"}
        </button>
      </div>
    </div>
  );
}
