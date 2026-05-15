import { useState } from "react";
import { pb } from "./pb";

export default function ProgressPhotoUpload({ userId, onComplete }) {
  const [photos,   setPhotos]   = useState({ photo_front: null, photo_side: null, photo_back: null });
  const [previews, setPreviews] = useState({ photo_front: null, photo_side: null, photo_back: null });
  const [saving,   setSaving]   = useState(false);

  async function handleFile(field, e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreviews(p => ({ ...p, [field]: ev.target.result }));
    reader.readAsDataURL(file);
    setPhotos(p => ({ ...p, [field]: file }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Sukurti naują progress_photos įrašą
      const formData = new FormData();
      formData.append("user_id", userId);
      if (photos.photo_front) formData.append("photo_front", photos.photo_front);
      if (photos.photo_side)  formData.append("photo_side",  photos.photo_side);
      if (photos.photo_back)  formData.append("photo_back",  photos.photo_back);
      await pb.collection("progress_photos").create(formData);

      // Ištrinti seniausius jei >2
      const all = await pb.collection("progress_photos").getFullList({
        filter: `user_id="${userId}"`, sort: "created", requestKey: null,
      });
      if (all.length > 2) {
        const toDelete = all.slice(0, all.length - 2);
        await Promise.all(toDelete.map(r => pb.collection("progress_photos").delete(r.id)));
      }
    } catch(e) { console.error("Progress photo upload:", e); }
    setSaving(false);
    onComplete();
  }

  const fields = [
    { key: "photo_front", label: "Priekis", emoji: "⬆️" },
    { key: "photo_side",  label: "Šonas",   emoji: "➡️" },
    { key: "photo_back",  label: "Nugara",  emoji: "⬇️" },
  ];

  const hasAny = photos.photo_front || photos.photo_side || photos.photo_back;

  return (
    <div style={{
      background: "rgba(0,0,0,0.3)", borderRadius: 20, padding: "20px 16px",
      border: "1px solid rgba(255,255,255,0.15)", marginTop: 16,
    }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 6px" }}>
          📸 Progresas nuotraukose
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>
          Įkelk naujausias nuotraukas trenerės palyginimui
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {fields.map(f => (
          <label key={f.key} style={{ cursor: "pointer" }}>
            <input type="file" accept="image/*"
              onChange={e => handleFile(f.key, e)} style={{ display: "none" }} />
            <div style={{
              aspectRatio: "3/4", borderRadius: 12,
              border: previews[f.key] ? "2px solid rgba(255,255,255,0.5)" : "2px dashed rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.05)", overflow: "hidden",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4,
            }}>
              {previews[f.key] ? (
                <img src={previews[f.key]} alt={f.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <>
                  <span style={{ fontSize: 20 }}>{f.emoji}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{f.label}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>+ Pridėti</span>
                </>
              )}
            </div>
          </label>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        width: "100%", padding: "13px 0", marginBottom: 8,
        background: hasAny ? "linear-gradient(135deg,#6D1B3B,#AD1457)" : "rgba(255,255,255,0.08)",
        border: "none", borderRadius: 14,
        color: hasAny ? "#fff" : "rgba(255,255,255,0.3)",
        fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
        opacity: saving ? 0.7 : 1,
      }}>
        {saving ? "Saugoma..." : hasAny ? "💾 Išsaugoti nuotraukas" : "Praleisti"}
      </button>

      {hasAny && (
        <button onClick={onComplete} style={{
          width: "100%", padding: "10px 0",
          background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 14, color: "rgba(255,255,255,0.35)",
          fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>
          Praleisti
        </button>
      )}
    </div>
  );
}