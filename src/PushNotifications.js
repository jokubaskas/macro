import { useState, useEffect } from "react";
import { pb } from "./pb";
import { Bell } from "./ui/icons";

const VAPID_PUBLIC_KEY = "BDgTfVU4FAYADwAodf4BDUspAz7THr4RmrSO6H6rbkX8yesLVuP8g27a9BaFG_TJ75MSPqYzQh3AYuNU2EdK6HE";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function getPushPermissionStatus() {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function subscribeToPush(userId) {
  if (!isPushSupported()) { alert("Push nepalaikomas šiame įrenginyje"); return false; }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") { alert("Leidimas neduotas: " + permission); return false; }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const subJson = subscription.toJSON();

    const existing = await pb.collection("push_subscriptions").getFullList({
      filter: `user_id="${userId}" && endpoint="${subJson.endpoint}"`,
      requestKey: null,
    }).catch((e) => { alert("PB filter klaida: " + e.message); return []; });

    if (existing.length === 0) {
      await pb.collection("push_subscriptions").create({
        user_id: userId,
        endpoint: subJson.endpoint,
        keys_p256dh: subJson.keys.p256dh,
        keys_auth: subJson.keys.auth,
      }).catch((e) => { alert("PB create klaida: " + e.message); });
    } else {
      alert("Subscription jau egzistuoja PB");
    }

    alert("Sėkmingai užregistruota: " + userId);
    return true;
  } catch (err) {
    alert("Bendra klaida: " + err.message);
    return false;
  }
}

export async function unsubscribeFromPush(userId) {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const subJson = subscription.toJSON();
    const existing = await pb.collection("push_subscriptions").getFullList({
      filter: `user_id="${userId}" && endpoint="${subJson.endpoint}"`,
      requestKey: null,
    }).catch(() => []);
    for (const rec of existing) {
      await pb.collection("push_subscriptions").delete(rec.id).catch(() => {});
    }
    await subscription.unsubscribe();
  }
}

// ── UI komponentas: prašymas įjungti pranešimus ─────────────────────────────
export default function PushPermissionPrompt({ userId }) {
  const [status, setStatus] = useState("checking");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function check() {
      const s = await getPushPermissionStatus();
      setStatus(s);

      // Jei leidimas jau suteiktas naršyklei, bet šiam userId dar nėra subscription PB - užregistruoti tyliai
      if (s === "granted" && isPushSupported()) {
        const registration = await navigator.serviceWorker.getRegistration().catch(()=>null);
        if (registration) {
          const sub = await registration.pushManager.getSubscription().catch(()=>null);
          if (sub) {
            const subJson = sub.toJSON();
            const existing = await pb.collection("push_subscriptions").getFullList({
              filter: `user_id="${userId}" && endpoint="${subJson.endpoint}"`,
              requestKey: null,
            }).catch(()=>[]);
            if (existing.length === 0) {
              await pb.collection("push_subscriptions").create({
                user_id: userId,
                endpoint: subJson.endpoint,
                keys_p256dh: subJson.keys.p256dh,
                keys_auth: subJson.keys.auth,
              }).catch(()=>{});
            }
          } else {
            // Leidimas yra, bet subscription objekto dar nėra - sukurti
            await subscribeToPush(userId);
          }
        }
      }
    }
    check();
  }, [userId]);

  async function handleEnable() {
    setLoading(true);
    const ok = await subscribeToPush(userId);
    setStatus(ok ? "granted" : "denied");
    setLoading(false);
  }

  if (status === "unsupported" || status === "granted" || status === "checking") return null;
  if (status === "denied") return null; // vartotojas atmetė per naršyklę - nerodyti pakartotinai

  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
      <Bell size={24} color="#fff" />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>Įjungti pranešimus?</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>Gausi pranešimą apie rezervacijų statusą</p>
      </div>
      <button onClick={handleEnable} disabled={loading} style={{ background: "linear-gradient(135deg,#6D1B3B,#AD1457)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
        {loading ? "..." : "Įjungti"}
      </button>
    </div>
  );
}
