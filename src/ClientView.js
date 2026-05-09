import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";
import WaterTracker from "./WaterTracker";
import FoodLog from "./FoodLog";

export default function ClientView({ user, onLogout }) {
  const [profile,      setProfile]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState("macros");
  const [todayTotals,  setTodayTotals]  = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [user.id]);

  useEffect(() => {
    async function loadToday() {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("food_log").select("kcal,protein,fat,carbs").eq("user_id", user.id).eq("date", today);
      if (data && data.length > 0) {
        setTodayTotals(data.reduce((a,e) => ({
          kcal:    a.kcal    + (e.kcal    || 0),
          protein: a.protein + (e.protein || 0),
          fat:     a.fat     + (e.fat     || 0),
          carbs:   a.carbs   + (e.carbs   || 0),
        }), { kcal:0, protein:0, fat:0, carbs:0 }));
      } else {
        setTodayTotals({ kcal:0, protein:0, fat:0, carbs:0 });
      }
    }
    loadToday();
  }, [user.id, tab]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,"+PK.pale+",#fff)", fontFamily:"-apple-system,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:40, marginBottom:12 }}>💗</div>
        <p style={{ color:PK.rose, fontSize:14 }}>Kraunama...</p>
      </div>
    </div>
  );

  const hasData = profile?.weight && profile?.height && profile?.age;
  const res = hasData ? calcMacros({
    gender: profile.gender, age: parseInt(profile.age),
    weight: parseFloat(profile.weight), height: parseFloat(profile.height),
    actId: profile.act, goalId: profile.goal,
  }) : null;

  const goalLabel = GOALS.find(g => g.id === profile?.goal)?.label ?? "";
  const actLabel  = ACTIVITY.find(a => a.id === profile?.act)?.label ?? "";

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,"+PK.pale+" 0%,#fff 55%,"+PK.light+" 100%)", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom:48 }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px 20px", position:"relative" }}>
        <button onClick={onLogout} style={{ position:"absolute", right:16, top:16, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, padding:"7px 11px", color:"#fff", fontSize:12, cursor:"pointer" }}>
          Atsijungti
        </button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:26, marginBottom:6 }}>💗</div>
          <h1 style={{ fontSize:19, fontWeight:700, color:"#fff", marginBottom:4 }}>
            Sveika, {profile?.name?.split(" ")[0] ?? ""}!
          </h1>
          <p style={{ color:PK.blush, fontSize:12, margin:0 }}>Tavo mitybos planas</p>
        </div>
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"0 16px" }}>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, margin:"16px 0" }}>
          {[{ id:"macros", l:"📊 Makro planas" }, { id:"food", l:"🍽️ Maisto žurnalas" }].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1, padding:"11px 0", borderRadius:14, fontSize:13, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit",
              border:"2px solid "+(tab===t.id ? PK.mid : PK.blush),
              background:tab===t.id ? PK.light : "#fff",
              color:tab===t.id ? PK.dark : PK.rose,
              transition:"all 0.15s",
            }}>{t.l}</button>
          ))}
        </div>

        {tab === "macros" && (
          <>
            {!hasData ? (
              <div style={{ background:PK.pale, borderRadius:20, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush }}>
                <div style={{ fontSize:40, marginBottom:10 }}>🌸</div>
                <p style={{ color:PK.rose, fontSize:14, fontWeight:600, marginBottom:6 }}>Tavo planas dar ruošiamas</p>
                <p style={{ color:PK.blush, fontSize:12 }}>Trenerė netrukus užpildys tavo duomenis</p>
              </div>
            ) : (
              <>
                {/* Profilio info */}
                <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:12, border:"1px solid "+PK.blush, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ width:42, height:42, borderRadius:"50%", background:PK.light, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                      {profile.gender==="f"?"👩":"👨"}
                    </div>
                    <div>
                      <p style={{ fontSize:14, fontWeight:700, color:PK.dark, marginBottom:2 }}>{profile.name}</p>
                      <p style={{ fontSize:11, color:PK.rose }}>{profile.age}m. · {profile.weight}kg · {profile.height}cm</p>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:11, color:PK.rose, marginBottom:2 }}>{actLabel}</p>
                    <p style={{ fontSize:11, fontWeight:700, color:PK.mid }}>{goalLabel}</p>
                  </div>
                </div>

                {/* Kalorijų kortelė */}
                <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:20, marginBottom:12, boxShadow:"0 6px 24px rgba(173,20,87,0.3)" }}>
                  <p style={{ fontSize:14, fontWeight:700, color:"#fff", textAlign:"center", marginBottom:14 }}>✨ Dienos planas</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                    {[
                      { l:"BMR",     v:res.bmr,    s:"bazinis" },
                      { l:"TDEE",    v:res.tdee,   s:"su aktyvumu" },
                      { l:"TIKSLAS", v:res.target, s:"per dieną" },
                    ].map(item => (
                      <div key={item.l} style={{ background:"rgba(255,255,255,0.13)", borderRadius:14, padding:"12px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{item.v}</div>
                        <div style={{ fontSize:9, color:PK.blush, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 }}>{item.l}</div>
                        <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginTop:1 }}>{item.s}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px" }}>
                    <p style={{ margin:0, fontSize:11, color:PK.blush, lineHeight:1.6, textAlign:"center" }}>💡 {res.tip}</p>
                  </div>
                </div>

                {/* Makronutrientai */}
                {[
                  { label:"💪 Baltymai",        data:res.prot, color:PK.mid,    note:res.protNorm+"g/kg × "+profile.weight+"kg = "+res.prot.g+"g. Saugo raumenis." },
                  { label:"🥑 Riebalai",         data:res.fat,  color:PK.bright, note:"Svarbūs hormonams ir vitaminų įsisavinimui." },
                  { label:"🍚 Angliavandeniai",  data:res.carb, color:PK.rose,   note:"Pagrindinis energijos šaltinis treniruotėms." },
                ].map(macro => (
                  <div key={macro.label} style={{ background:"#fff", borderRadius:20, padding:"16px 14px", marginBottom:10, border:"1px solid "+PK.blush, boxShadow:"0 2px 12px rgba(173,20,87,0.07)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:PK.dark }}>{macro.label}</span>
                      <span style={{ fontSize:12, color:PK.rose }}>{macro.data.pct}%</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:30, fontWeight:700, color:macro.color }}>{macro.data.g}g</span>
                      <span style={{ fontSize:12, color:PK.rose }}>{macro.data.kcal} kcal</span>
                    </div>
                    <div style={{ background:PK.light, borderRadius:99, height:6, marginBottom:8 }}>
                      <div style={{ width:macro.data.pct+"%", height:"100%", borderRadius:99, background:"linear-gradient(90deg,"+macro.color+","+PK.bright+")" }} />
                    </div>
                    <p style={{ margin:0, fontSize:11, color:PK.rose, lineHeight:1.5 }}>{macro.note}</p>
                  </div>
                ))}

                {/* Dienos pažanga */}
                {todayTotals && (
                  <div style={{ background:"#fff", borderRadius:20, padding:"18px 16px", marginBottom:10, border:"1px solid "+PK.blush, boxShadow:"0 2px 12px rgba(173,20,87,0.07)" }}>
                    <p style={{ fontSize:12, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:14 }}>📊 Šiandien surinkta</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
                      {[
                        {l:"Kalorijos", cur:Math.round(todayTotals.kcal),    tgt:res.target,  c:PK.dark},
                        {l:"Baltymai",  cur:Math.round(todayTotals.protein),  tgt:res.prot.g,  c:PK.mid},
                        {l:"Riebalai",  cur:Math.round(todayTotals.fat),      tgt:res.fat.g,   c:PK.bright},
                        {l:"Angliavandeniai", cur:Math.round(todayTotals.carbs), tgt:res.carb.g, c:PK.rose},
                      ].map(item => {
                        const pct = item.tgt ? Math.min(100, Math.round(item.cur/item.tgt*100)) : 0;
                        const over = item.cur > item.tgt;
                        return (
                          <div key={item.l} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:16, fontWeight:700, color:over?"#D97706":item.c }}>{item.cur}</div>
                            <div style={{ fontSize:9, color:PK.rose, marginBottom:6 }}>/ {item.tgt}</div>
                            <div style={{ background:PK.light, borderRadius:99, height:6 }}>
                              <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:over?"#D97706":item.c, transition:"width 0.5s" }} />
                            </div>
                            <div style={{ fontSize:9, color:over?"#D97706":item.c, fontWeight:700, marginTop:4 }}>{pct}%</div>
                            <div style={{ fontSize:9, color:PK.rose, marginTop:2 }}>{item.l}</div>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => setTab("food")} style={{ width:"100%", marginTop:14, padding:"10px 0", background:PK.light, border:"1px solid "+PK.blush, borderRadius:12, fontSize:12, fontWeight:700, color:PK.mid, cursor:"pointer", fontFamily:"inherit" }}>
                      + Pridėti maisto → Žurnalas
                    </button>
                  </div>
                )}

                {/* Vanduo */}
                <WaterTracker goal={Math.round(parseFloat(profile.weight) * 33)} userId={user.id} />
              </>
            )}
          </>
        )}

        {tab === "food" && (
          <FoodLog userId={user.id} targetMacros={res} />
        )}

      </div>
    </div>
  );
}
