import { useState, useEffect, useCallback } from "react";
import { pb } from "./pb";
import { PK, GOALS, daysUntilBirthday } from "./constants";
import { effectiveDeadline, fetchAllDayVacations, daysUntil as pkgDaysUntil } from "./packageDeadline";
import WorkoutPlanBuilder, { ExerciseSummary } from "./WorkoutPlanBuilder";
import BookingAdmin, { downloadIcal } from "./BookingAdmin";
import TrainerStats from "./TrainerStats";
import ProgressCompare from "./ProgressCompare";
import PushPermissionPrompt from "./PushNotifications";
import StreakBadge from "./StreakBadge";
import WorkoutPresets from "./WorkoutPresets";
import PackageAdmin from "./PackageAdmin";
import ClientMeasurements from "./ClientMeasurements";
import LiveTraining from "./LiveTraining";
import ClientInfo from "./ClientInfo";
import ClientReport from "./ClientReport";
import { SearchInput, ShowMoreButton } from "./ui/kit";
import { Clipboard, Footprints, Moon, Droplet, CheckCircle, Heart, AlertTriangle, Ban, Dot, Ruler, Camera, Dumbbell, ChevronLeft, ChevronRight, Users, Calendar, Ticket, BarChart, Cake, Refresh, Glass, Flame, Muscle, Salad, Timer } from "./ui/icons";
import { resolveMacroTargets } from "./macroCalc";

const BDAY_KEYFRAMES = `
@keyframes bdayCardGlow { 0%, 100% { box-shadow: 0 0 0 1px rgba(255,215,0,0.35), 0 0 14px rgba(255,215,0,0.15); } 50% { box-shadow: 0 0 0 1px rgba(255,215,0,0.6), 0 0 22px rgba(255,215,0,0.35); } }
@keyframes bdayBadgeBounce { 0%, 100% { transform: scale(1) rotate(-4deg); } 50% { transform: scale(1.15) rotate(4deg); } }
@keyframes livePulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: .5; } }
`;

const TRAFFIC_LABEL = { 1: "Blogai", 2: "Vidutiniškai", 3: "Gerai" };
const TRAFFIC_COLOR = { 1: ["#FF7A6E", "#E14A45"], 2: ["#FFC15E", "#F2A63D"], 3: ["#5CE3A6", "#2FBE84"] };

function ProgressRing({ pct, c1, c2, hit, size = 40 }) {
  const r = (size - 6) / 2, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * C;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="4" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={c1} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C - dash}
          style={{ transition:"stroke-dashoffset 0.7s cubic-bezier(.23,1,.32,1)", filter: hit ? `drop-shadow(0 0 4px ${c1}99)` : "none" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:c1 }}>
        {Math.round(pct)}%
      </div>
    </div>
  );
}

function DashStatCard({ icon: Icon, value, label, c1, c2, pct }) {
  const hit = pct != null && pct >= 100;
  return (
    <div style={{
      position:"relative", overflow:"hidden", borderRadius:16, padding:"14px 12px",
      background:`linear-gradient(145deg, ${c1}26, ${c2}12)`,
      border:`1px solid ${c1}3d`,
      display:"flex", alignItems:"center", gap:10,
    }}>
      <div style={{
        position:"absolute", top:-26, right:-26, width:70, height:70, borderRadius:"50%",
        background:`radial-gradient(circle, ${c1}3d, transparent 70%)`,
      }} />
      <div style={{
        position:"relative", width:32, height:32, borderRadius:"50%", flexShrink:0,
        background:`linear-gradient(135deg, ${c1}33, ${c2}22)`,
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow: hit ? `0 0 0 3px ${c1}33` : "none",
      }}>
        <Icon size={16} color={c1} />
      </div>
      <div style={{ position:"relative", flex:1, minWidth:0 }}>
        <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{value}</div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)", lineHeight:1.25 }}>{label}</div>
      </div>
      {pct != null && <ProgressRing pct={pct} c1={c1} c2={c2} hit={hit} />}
    </div>
  );
}

function TrafficOrb({ v, size = 28 }) {
  const c = TRAFFIC_COLOR[v];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", margin: "0 auto",
      background: c ? `radial-gradient(circle at 34% 28%, ${c[0]}, ${c[1]})` : "rgba(255,255,255,0.1)",
      boxShadow: c ? `0 2px 8px ${c[0]}55` : "none",
    }} />
  );
}

function todayStr() { return new Date().toISOString().split("T")[0]; }
function daysAgoStr(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; }

async function adminCreateUser(email, password) {
  const data = await pb.collection("users").create({
    email, password, passwordConfirm: password,
    role: "client", onboarding_done: false, emailVisibility: true,
  });
  if (!data?.id) throw new Error("Klaida kuriant vartotoją");
  return data;
}
