import { GOALS, ACTIVITY } from "./constants";
import { STEPS_OPTS, WELLBEING_OPTS } from "./Onboarding";
import { ChevronLeft, User, Calendar, Ruler, Scale, Target, Edit, Moon, Footprints, Salad, Heart, Clipboard, AlertTriangle } from "./ui/icons";

function InfoRow({ label, value, Icon }) {
  if (value == null || value === "") return null;
  return (
    <div style={{ marginBottom:14 }}>
      <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px", display:"flex", alignItems:"center", gap:5 }}>
        {Icon && <Icon size={11} />}{label}
      </p>
      <p style={{ fontSize:14, color:"#fff", margin:0, lineHeight:1.5 }}>{value}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 10px" }}>{title}</p>
      <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:16, padding:"14px 16px" }}>{children}</div>
    </div>
  );
}

export default function ClientInfo({ client, onClose }) {
  const genderLabel = client.gender === "f" ? "Moteris" : client.gender === "m" ? "Vyras" : null;
  const dobLabel = client.dob ? new Date(client.dob).toLocaleDateString("lt-LT", { year:"numeric", month:"long", day:"numeric" }) : null;
  const goalLabel = GOALS.find(g => g.id === client.goal)?.label || null;
  const actOpt = ACTIVITY.find(a => a.id === client.act);
  const stepsOpt = STEPS_OPTS.find(s => s.id === client.steps_per_day);
  const wellbeingOpt = WELLBEING_OPTS[client.wellbeing] || null;

  const hasLifestyle = client.sleep_stress || actOpt || stepsOpt;
  const hasNutrition = client.diet_desc || client.hardest_part || client.expectations || wellbeingOpt;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:650, background:"linear-gradient(160deg,#2d0a1a 0%,#6D1B3B 40%,#AD1457 100%)", overflowY:"auto", WebkitOverflowScrolling:"touch", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"rgba(0,0,0,0.2)", borderBottom:"1px solid rgba(255,255,255,0.1)", paddingTop:"max(env(safe-area-inset-top), 20px)", paddingLeft:20, paddingRight:20, paddingBottom:16, display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10 }}>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"8px 14px", color:"#fff", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}><ChevronLeft size={14} />Atgal</button>
        <div>
          <h1 style={{ fontSize:15, fontWeight:700, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}><Clipboard size={15} />Kliento anketa</h1>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{client.name}</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:16 }}>
        {!client.onboarding_done && (
          <div style={{ background:"rgba(255,193,94,0.1)", border:"1px solid rgba(255,193,94,0.3)", borderRadius:14, padding:"12px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <AlertTriangle size={14} color="#FFC15E" />
            <p style={{ fontSize:12, color:"#FFC15E", margin:0 }}>Klientas dar nebaigė registracijos anketos.</p>
          </div>
        )}
        {client.onboarding_done && client.track_progress === false && (
          <div style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:14, padding:"12px 14px", marginBottom:16 }}>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.6)", margin:0 }}>Klientas pasirinko trumpąją registraciją — pildė tik gimimo datą, be tikslo/mitybos/gyvensenos klausimų.</p>
          </div>
        )}

        <Section title="Asmeniniai duomenys">
          <InfoRow label="Gimimo data" value={dobLabel} Icon={Calendar} />
          <InfoRow label="Lytis" value={genderLabel} Icon={User} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr" }}>
            <InfoRow label="Ūgis" value={client.height ? `${client.height} cm` : null} Icon={Ruler} />
            <InfoRow label="Svoris" value={client.weight ? `${client.weight} kg` : null} Icon={Scale} />
          </div>
        </Section>

        {(goalLabel || client.motivation) && (
          <Section title="Tikslas ir motyvacija">
            <InfoRow label="Tikslas" value={goalLabel} Icon={Target} />
            <InfoRow label="Kodėl tai svarbu" value={client.motivation} Icon={Edit} />
          </Section>
        )}

        {hasLifestyle && (
          <Section title="Gyvensena">
            <InfoRow label="Miegas / stresas" value={client.sleep_stress} Icon={Moon} />
            <InfoRow label="Aktyvumo lygis" value={actOpt ? `${actOpt.label}${actOpt.desc ? ` — ${actOpt.desc}` : ""}` : null} Icon={Footprints} />
            <InfoRow label="Žingsnių tikslas" value={stepsOpt?.label} Icon={Footprints} />
          </Section>
        )}

        {hasNutrition && (
          <Section title="Mityba ir iššūkiai">
            <InfoRow label="Mitybos aprašymas" value={client.diet_desc} Icon={Salad} />
            <InfoRow label="Sunkiausia dalis" value={client.hardest_part} Icon={Edit} />
            <InfoRow label="Lūkesčiai treneriui" value={client.expectations} Icon={Edit} />
            {wellbeingOpt && (
              <div style={{ marginBottom:0 }}>
                <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 3px", display:"flex", alignItems:"center", gap:5 }}>
                  <Heart size={11} />Savijauta registruojantis
                </p>
                <p style={{ fontSize:14, color:"#fff", margin:0, display:"flex", alignItems:"center", gap:6 }}>
                  <wellbeingOpt.Icon size={14} />{wellbeingOpt.label}
                </p>
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
}
