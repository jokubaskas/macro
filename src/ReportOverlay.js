import { useState } from 'react';
import { PK } from './constants';
import { pb } from './pb';
import ProgressPhotoUpload from "./ProgressPhotoUpload";

export default function ReportOverlay({ report, userId, onRead }) {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  if (!report) return null;

  const isLoss = report.weightDiff < 0;

  async function handleRead() {
    await pb.collection("users").update(userId, { last_read_report_id: report.id });
    setShowPhotoUpload(true);
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(45, 20, 31, 0.9)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(8px)", overflowY: "auto", WebkitOverflowScrolling: "touch",
    }}>
      <div style={{
        background: "#fff", borderRadius: 28, width: "100%", maxWidth: 400,
        overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        border: `1px solid ${PK.blush}`
      }}>
        <div style={{ background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`, padding: "30px 20px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
          <h2 style={{ margin: 0, fontSize: 22 }}>8 savaičių apžvalga</h2>
          <p style={{ margin: "5px 0 0", opacity: 0.8, fontSize: 13 }}>Tavo progresas pas trenerį</p>
        </div>

        <div style={{ padding: "24px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: PK.pale, padding: 15, borderRadius: 20, textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: PK.rose, textTransform: "uppercase", margin: 0 }}>Svoris</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: PK.dark, margin: "4px 0" }}>
                {report.weightDiff > 0 ? "+" : ""}{report.weightDiff}kg
              </p>
              <div style={{ fontSize: 10, color: isLoss ? "#276749" : PK.mid }}>
                {isLoss ? "🔥 Puiku!" : "Raumenys?"}
              </div>
            </div>
          </div>

          {!showPhotoUpload ? (
            <button onClick={handleRead} style={{
              width: "100%", padding: "14px", background: PK.mid, border: "none",
              borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Perskaičiau ✓
            </button>
          ) : (
            <ProgressPhotoUpload userId={userId} onComplete={onRead} />
          )}
        </div>
      </div>
    </div>
  );
}