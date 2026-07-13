import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Close, Check } from "./ui/icons";

// Fiksuotas 3:4 kadras — atitinka visur appe naudojamą nuotraukų aspektą.
const FRAME_W = 280, FRAME_H = Math.round(FRAME_W * 4 / 3);
const OUTPUT_W = 720, OUTPUT_H = Math.round(OUTPUT_W * 4 / 3);

// Žmogaus siluetas (be galvos, nuo pečių iki pėdų) — vaizdinė gairelė
// kadruojant, kad kūnas visada atsidurtų tame pačiame dydyje kadre.
// "Priekis" ir "nugara" naudoja tą patį kontūrą (iš išorės neatskiriami).
function Silhouette({ field }) {
  const isSide = field === "photo_side";
  const gid = "silhouette-grad";
  return (
    <svg viewBox="0 0 100 150" preserveAspectRatio="none" style={{ position:"absolute", left:0, top:0, width:"100%", height:"98%", pointerEvents:"none" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF9FC7" />
          <stop offset="100%" stopColor="#AD1457" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gid})`} fillOpacity="0.16" stroke={`url(#${gid})`} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 6px rgba(255,110,180,0.55))" }}>
        {isSide ? (
          <path d="M 58,0 C 40,30 45,80 42,140 L 38,145 L 62,145 C 64,100 60,40 58,0 Z" />
        ) : (
          <path d="M 24,0 L 18,26 L 30,46 L 28,58 L 26,95 L 24,128 L 18,140 L 32,142 L 40,128 L 50,66 L 60,128 L 68,142 L 82,140 L 76,128 L 74,95 L 72,58 L 70,46 L 82,25 L 76,0 Z" />
        )}
      </g>
    </svg>
  );
}

// Kadravimo įrankis su siluetu — leidžia pastumti/priartinti nuotrauką
// prieš išsaugant, kad žmogus visada atsidurtų tokio pat dydžio kadre
// (nesvarbu, iš kokio atstumo buvo fotografuota), tad senos ir naujos
// progreso nuotraukos liktų palyginamos. Portalas į document.body — kad
// niekada nepakliūtų į tėvinių ekranų izoliuotus z-index kontekstus.
export default function PhotoCropper({ src, field, onConfirm, onCancel }) {
  const [imgSize, setImgSize] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const baseScale = Math.max(FRAME_W / img.naturalWidth, FRAME_H / img.naturalHeight);
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setOffset({
        x: (FRAME_W - img.naturalWidth * baseScale) / 2,
        y: (FRAME_H - img.naturalHeight * baseScale) / 2,
      });
    };
    img.src = src;
    imgRef.current = img;
  }, [src]);

  if (!imgSize) {
    return createPortal(
      <div style={overlayStyle}><p style={{ color: "#fff" }}>Kraunama...</p></div>,
      document.body
    );
  }

  const baseScale = Math.max(FRAME_W / imgSize.w, FRAME_H / imgSize.h);
  const scale = baseScale * zoom;
  const dispW = imgSize.w * scale, dispH = imgSize.h * scale;
  const clampedX = Math.min(0, Math.max(FRAME_W - dispW, offset.x));
  const clampedY = Math.min(0, Math.max(FRAME_H - dispH, offset.y));

  function handlePointerDown(e) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: clampedX, origY: clampedY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  }
  function handlePointerUp() { dragRef.current = null; }

  function handleConfirm() {
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_W; canvas.height = OUTPUT_H;
    const ctx = canvas.getContext("2d");
    const ratio = OUTPUT_W / FRAME_W;
    ctx.drawImage(imgRef.current, clampedX * ratio, clampedY * ratio, dispW * ratio, dispH * ratio);
    canvas.toBlob(blob => { if (blob) onConfirm(blob); }, "image/jpeg", 0.9);
  }

  return createPortal(
    <div style={overlayStyle}>
      <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Sutaikyk su siluetu</p>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "0 0 16px", textAlign: "center", maxWidth: FRAME_W }}>
        Pastumk ir priartink, kad kūnas nuo pečių iki pėdų atitiktų kontūrą — taip senos ir naujos nuotraukos bus vienodo dydžio.
      </p>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ width: FRAME_W, height: FRAME_H, borderRadius: 16, overflow: "hidden", position: "relative", background: "#111", touchAction: "none", cursor: "grab", border: "2px solid rgba(255,255,255,0.3)" }}>
        <img src={src} draggable={false} alt="" style={{
          position: "absolute", left: clampedX, top: clampedY, width: dispW, height: dispH,
          userSelect: "none", pointerEvents: "none", maxWidth: "none",
        }} />
        <Silhouette field={field} />
      </div>
      <div style={{ width: FRAME_W, marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>−</span>
        <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>+</span>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 18, width: FRAME_W }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Close size={14} />Atšaukti</button>
        <button onClick={handleConfirm} style={{ flex: 2, padding: "11px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6D1B3B,#AD1457)", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Check size={14} />Naudoti</button>
      </div>
    </div>,
    document.body
  );
}

const overlayStyle = {
  position: "fixed", inset: 0, zIndex: 5000, background: "rgba(0,0,0,0.92)",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  padding: 20, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};