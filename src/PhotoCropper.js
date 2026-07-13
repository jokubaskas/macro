import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Close, Check } from "./ui/icons";

// Fiksuotas 3:4 kadras — atitinka visur appe naudojamą nuotraukų aspektą.
const FRAME_W = 280, FRAME_H = Math.round(FRAME_W * 4 / 3);
const OUTPUT_W = 720, OUTPUT_H = Math.round(OUTPUT_W * 4 / 3);

// Dvi lygiavimo linijos — smakras (viršuje) ir čiurna (apačioje) — kad
// senos ir naujos progreso nuotraukos liktų vienodo dydžio kadre.
function Silhouette() {
  return (
    <>
      <div style={{ position:"absolute", left:0, right:0, top:"9%", borderTop:"2px dashed rgba(255,159,199,0.85)", pointerEvents:"none" }}>
        <span style={{ position:"absolute", left:4, top:-16, fontSize:9, color:"#FF9FC7", fontWeight:700, background:"rgba(0,0,0,0.55)", padding:"1px 5px", borderRadius:4 }}>Smakras</span>
      </div>
      <div style={{ position:"absolute", left:0, right:0, top:"90%", borderTop:"2px dashed rgba(173,20,87,0.85)", pointerEvents:"none" }}>
        <span style={{ position:"absolute", left:4, top:4, fontSize:9, color:"#FF6EB4", fontWeight:700, background:"rgba(0,0,0,0.55)", padding:"1px 5px", borderRadius:4 }}>Čiurna</span>
      </div>
    </>
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
      <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Sutaikyk su gairelėmis</p>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "0 0 16px", textAlign: "center", maxWidth: FRAME_W }}>
        Pastumk ir priartink, kad smakras ir čiurna atitiktų linijas — taip senos ir naujos nuotraukos bus vienodo dydžio.
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