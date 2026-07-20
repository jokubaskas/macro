// Treniruočių paketo galiojimo termino skaičiavimas + "įšaldymas" trenerės
// atostogų metu. Bazinis terminas (valid_until) nustatomas VIENĄ KARTĄ paketo
// patvirtinimo metu (žr. PackageAdmin.js) ir daugiau nebekeičiamas duomenų
// bazėje — vietoj to, kiek jis pratęstas dėl atostogų, visada perskaičiuojama
// rodymo metu iš schedule_exceptions (all_day=true) įrašų. Tai leidžia
// trenerei laisvai pridėti/redaguoti/trinti atostogas ateityje be poreikio
// perrašinėti jau esančius paketus.
import { pb } from "./pb";

export const DURATION_MONTHS = { "1": 1, "8": 3, "16": 4 };

function toDate(s) { return new Date((s || "").slice(0, 10) + "T00:00:00"); }
function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
function addMonths(date, months) { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; }
function fmtDate(d) { return d.toISOString().split("T")[0]; }

// Naudojama paketo patvirtinimo metu — bazinis terminas nuo dabar.
export function computeBaseValidUntil(packageType, fromDate = new Date()) {
  const months = DURATION_MONTHS[packageType] || 1;
  return fmtDate(addMonths(fromDate, months));
}

// Kiek dienų iš [from, to] (imtinai) sutampa su visos dienos atostogomis.
function vacationDaysInRange(vacations, from, to) {
  let days = 0;
  for (const v of vacations) {
    const vStart = toDate(v.date);
    const vEnd = toDate(v.end_date || v.date);
    const start = vStart > from ? vStart : from;
    const end = vEnd < to ? vEnd : to;
    if (start <= end) days += daysBetween(start, end) + 1;
  }
  return days;
}

// Realus (pratęstas) paketo terminas = bazinis valid_until + trenerės visos
// dienos atostogų dienos, patekusios į paketo aktyvumo langą. Paketo pradžia
// atkuriama atimant paketo trukmę iš bazinio valid_until (kad nereikėtų
// atskiro "approved_at" lauko). Iteratyvu, nes pats pratęsimas gali įtraukti
// dar daugiau atostogų dienų.
export function effectiveDeadline(pkg, vacations) {
  if (!pkg?.valid_until) return null;
  const months = DURATION_MONTHS[pkg.package_type] || 1;
  const base = toDate(pkg.valid_until);
  const start = addMonths(base, -months);
  let deadline = base;
  for (let i = 0; i < 10; i++) {
    const extraDays = vacationDaysInRange(vacations, start, deadline);
    const next = new Date(start);
    next.setDate(start.getDate() + daysBetween(start, base) + extraDays);
    if (next.getTime() === deadline.getTime()) break;
    deadline = next;
  }
  return fmtDate(deadline);
}

export async function fetchAllDayVacations() {
  return pb.collection("schedule_exceptions").getFullList({
    filter: "all_day=true", requestKey: null,
  }).catch(() => []);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = toDate(fmtDate(new Date()));
  return daysBetween(today, toDate(dateStr));
}
