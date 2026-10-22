// Bendra "toast" pranešimų sistema — pakeičia naršyklės alert() visame appe.
// Paprastas pub-sub (be React Context), kad bet kuris failas galėtų tiesiog
// importuoti toast() ir iškviesti, nepergyvenant dėl props/provider grandinės.

import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Close } from "./icons";

let listeners = [];
let seq = 0;

export function toast(message, type = "info", duration = 3200) {
  const id = ++seq;
  const item = { id, message, type, duration };
  listeners.forEach(fn => fn(item));
  return id;
}

const TYPE_STYLE = {
  success: { Icon: CheckCircle, color: "#7FFFB0", bg: "rgba(127,255,176,0.14)", border: "rgba(127,255,176,0.35)" },
  error:   { Icon: AlertTriangle, color: "#FF8888", bg: "rgba(255,100,100,0.14)", border: "rgba(255,100,100,0.35)" },
  info:    { Icon: AlertTriangle, color: "#FFD700", bg: "rgba(255,255,255,0.1)", border: "rgba(255,255,255,0.18)" },
};

const TOAST_KEYFRAMES = `
@keyframes toastIn { from { opacity:0; transform: translateY(10px) scale(0.98); } to { opacity:1; transform: translateY(0) scale(1); } }
@keyframes toastOut { from { opacity:1; transform: translateY(0); } to { opacity:0; transform: translateY(6px); } }
`;

// Sumontuojamas VIENĄ kartą prie appo šaknies (App.js) — rodo visus toast()
// iškvietimus, nesvarbu, iš kurio ekrano/modalo jie kilę.
export function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function onToast(item) {
      setItems(prev => [...prev, item]);
      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== item.id));
      }, item.duration);
    }
    listeners.push(onToast);
    return () => { listeners = listeners.filter(fn => fn !== onToast); };
  }, []);

  if (items.length === 0) return null;

  return (
    <div style={{
      position: "fixed", left: 0, right: 0,
      bottom: "max(84px, calc(14px + env(safe-area-inset-bottom) + 70px))",
      zIndex: 2000, display: "flex", flexDirection: "column", alignItems: "center",
      gap: 8, padding: "0 16px", pointerEvents: "none",
    }}>
      <style>{TOAST_KEYFRAMES}</style>
      {items.map(item => {
        const s = TYPE_STYLE[item.type] || TYPE_STYLE.info;
        return (
          <div key={item.id} onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} style={{
            pointerEvents: "auto", cursor: "pointer",
            width: "100%", maxWidth: 440,
            display: "flex", alignItems: "center", gap: 10,
            background: `linear-gradient(135deg, rgba(24,7,17,0.95), rgba(45,10,26,0.95))`,
            border: `1.5px solid ${s.border}`, borderRadius: 16, padding: "12px 14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            animation: "toastIn 0.3s cubic-bezier(.23,1,.32,1) both",
          }}>
            <s.Icon size={16} color={s.color} style={{ flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: 13, color: "#fff", margin: 0, lineHeight: 1.4 }}>{item.message}</p>
            <Close size={13} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
          </div>
        );
      })}
    </div>
  );
}
