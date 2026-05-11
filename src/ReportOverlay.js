import React from 'react';
import { PK } from './constants';
import { supabase } from './supabase';

export default function ReportOverlay({ report, userId, onRead }) {
  if (!report) return null;

  const handleRead = async () => {
    // Išsaugome DB, kad vartotojas perskaitė
    await supabase
      .from('profiles')
      .update({ last_read_report_id: report.id })
      .eq('id', userId);
    
    onRead(); // Paslepia komponentą UI pusėje
  };

  const isLoss = report.weightDiff < 0;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(45, 20, 31, 0.9)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, backdropFilter: "blur(8px)"
    }}>
      <div style={{
        background: "#fff", borderRadius: 28, width: "100%", maxWidth: 400,
        overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        border: `1px solid ${PK.blush}`
      }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${PK.dark}, ${PK.mid})`, padding: "30px 20px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
          <h2 style={{ margin: 0, fontSize: 22 }}>8 savaičių apžvalga</h2>
          <p style={{ margin: "5px 0 0", opacity: 0.8, fontSize: 13 }}>Tavo progresas pas trenerį</p>
        </div>

        <div style={{ padding: "24px 20px" }}>
          {/* Rezultatai */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: PK.pale, padding: 15, borderRadius: 20, textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: PK.rose, textTransform: "uppercase", margin: 0 }}>Svoris</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: PK.dark, margin: "4px 0" }}>{report.weightDiff > 0 ? "+" : ""}{report.weightDiff}kg</p>
              <div style={{ fontSize: 10, color: isLoss ? "#276749" : PK.mid }}>{isLoss ? "🔥 Puiku!" : "Raumenys? 💪"}</div>
            </div>
            <div style={{ background: PK.pale, padding: 15, borderRadius: 20, textAlign: "center" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: PK.rose, textTransform: "uppercase", margin: 0 }}>Liemuo</p>
              <p style={{ fontSize: 24, fontWeight: 800, color: PK.dark, margin: "4px 0" }}>{report.waistDiff}cm</p>
              <div style={{ fontSize: 10, color: PK.mid }}>Apimčių pokytis</div>
            </div>
          </div>

          {/* Savijauta */}
          <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 25, padding: "0 10px" }}>
            <Stat emoji="😴" label="Miegas" val={report.avgSleep} />
            <Stat emoji="⚡" label="Energija" val={report.avgEnergy} />
            <Stat emoji="🥗" label="Mityba" val={report.avgDiet} />
          </div>

          {/* Trenerio žinutė */}
          <div style={{ background: "#FFFBEB", padding: 16, borderRadius: 20, border: "1px solid #FAD389", marginBottom: 25 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#744210", textTransform: "uppercase", marginBottom: 6 }}>Trenerio įžvalga:</p>
            <p style={{ fontSize: 14, color: PK.dark, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
              "{report.trainerNote || "Super progresas! Judam toliau."}"
            </p>
          </div>

          <button onClick={handleRead} style={{
            width: "100%", padding: "18px", borderRadius: 20, border: "none",
            background: PK.dark, color: "#fff", fontSize: 16, fontWeight: 700,
            cursor: "pointer", boxShadow: `0 10px 20px ${PK.mid}44`
          }}>
            Viskas aišku, tęsiam! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ emoji, label, val }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: PK.dark }}>{val}/5</div>
      <div style={{ fontSize: 9, color: PK.rose, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}