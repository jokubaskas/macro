import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { PK, ACTIVITY, GOALS, calcMacros } from "./constants";
import WaterTracker from "./WaterTracker";
import FoodSearch from "./FoodSearch";

const MEALS = [
  { id:"breakfast", label:"🌅 Pusryčiai" },
  { id:"lunch",     label:"☀️ Pietūs" },
  { id:"dinner",    label:"🌙 Vakarienė" },
  { id:"snack",     label:"🍎 Užkandžiai" },
];

function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function ClientView({ user, onLogout }) {
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [entries,     setEntries]     = useState([]);
  const [collapsed,   setCollapsed]   = useState({});
  const [searching,   setSearching]   = useState(false);
  const [activeMeal,  setActiveMeal]  = useState(null);
  const [showMeals,   setShowMeals]   = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [user.id]);

  const loadEntries = useCallback(async () => {
    const { data } = await supabase
      .from("food_log").select("*")
      .eq("user_id", user.id)
      .eq("date", todayStr())
      .order("created_at");
    setEntries(data || []);
  }, [user.id]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function addEntry(meal, food) {
    await supabase.from("food_log").insert({
      user_id: user.id, date: todayStr(), meal,
      name: food.name, brand: food.brand || "",
      amount: food.amount, kcal: food.kcal,
      protein: food.protein, fat: food.fat, carbs: food.carbs,
    });
    setSearching(false);
    setActiveMeal(null);
    setShowMeals(false);
    loadEntries();
  }

  async function removeEntry(id) {
    await supabase.from("food_log").delete().eq("id", id);
    loadEntries();
  }

  function toggleMeal(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

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

  // Dienos sumos
  const totals = entries.reduce((a,e) => ({
    kcal:    a.kcal    + (e.kcal    || 0),
    protein: a.protein + (e.protein || 0),
    fat:     a.fat     + (e.fat     || 0),
    carbs:   a.carbs   + (e.carbs   || 0),
  }), { kcal:0, protein:0, fat:0, carbs:0 });

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,"+PK.pale+" 0%,#fff 55%,"+PK.light+" 100%)", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom:48 }}>

      {/* FoodSearch modal */}
      {searching && (
        <FoodSearch
          onAdd={food => addEntry(activeMeal, food)}
          onClose={() => { setSearching(false); setActiveMeal(null); }}
        />
      )}

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

      <div style={{ maxWidth:480, margin:"0 auto", padding:"16px 16px 0" }}>

        {!hasData ? (
          <div style={{ background:PK.pale, borderRadius:20, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush, marginTop:8 }}>
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

            {/* Dienos planas + Makronutrientai */}
            <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:20, marginBottom:12, boxShadow:"0 6px 24px rgba(173,20,87,0.3)" }}>
              <p style={{ fontSize:14, fontWeight:700, color:"#fff", textAlign:"center", marginBottom:14 }}>✨ Dienos planas</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                {[
                  { l:"BMR",     v:res.bmr,    s:"bazinis" },
                  { l:"TDEE",    v:res.tdee,   s:"su aktyvumu" },
                  { l:"TIKSLAS", v:res.target, s:"per dieną" },
                ].map(item => (
                  <div key={item.l} style={{ background:"rgba(255,255,255,0.13)", borderRadius:12, padding:"10px 6px", textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{item.v}</div>
                    <div style={{ fontSize:9, color:PK.blush, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 }}>{item.l}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", marginTop:1 }}>{item.s}</div>
                  </div>
                ))}
              </div>
              <div style={{ height:1, background:"rgba(255,255,255,0.15)", marginBottom:14 }} />
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { label:"💪 Baltymai",       data:res.prot, color:"#FFB3C6" },
                  { label:"🥑 Riebalai",        data:res.fat,  color:"#FF80AB" },
                  { label:"🍚 Angliavandeniai", data:res.carb, color:"#F48FB1" },
                ].map(macro => (
                  <div key={macro.label}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{macro.label}</span>
                      <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                        <span style={{ fontSize:16, fontWeight:700, color:macro.color }}>{macro.data.g}g</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{macro.data.kcal} kcal</span>
                        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{macro.data.pct}%</span>
                      </div>
                    </div>
                    <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:99, height:5 }}>
                      <div style={{ width:macro.data.pct+"%", height:"100%", borderRadius:99, background:macro.color, transition:"width 0.6s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", marginTop:14 }}>
                <p style={{ margin:0, fontSize:11, color:PK.blush, lineHeight:1.6, textAlign:"center" }}>💡 {res.tip}</p>
              </div>
            </div>

            {/* Šiandien surinkta */}
            <div style={{ background:"#fff", borderRadius:20, padding:"18px 16px", marginBottom:12, border:"1px solid "+PK.blush, boxShadow:"0 2px 12px rgba(173,20,87,0.07)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <p style={{ fontSize:12, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>📊 Šiandien surinkta</p>
                <span style={{ fontSize:11, color:PK.rose }}>{todayStr()}</span>
              </div>

              {/* Progreso juostos */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  { l:"Kalorijos", cur:Math.round(totals.kcal),    tgt:res.target,  c:PK.dark   },
                  { l:"Baltymai",  cur:Math.round(totals.protein),  tgt:res.prot.g,  c:PK.mid    },
                  { l:"Riebalai",  cur:Math.round(totals.fat),      tgt:res.fat.g,   c:PK.bright },
                  { l:"Angliavandeniai", cur:Math.round(totals.carbs), tgt:res.carb.g, c:PK.rose },
                ].map(item => {
                  const pct  = item.tgt ? Math.min(100, Math.round(item.cur/item.tgt*100)) : 0;
                  const over = item.cur > item.tgt;
                  return (
                    <div key={item.l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:15, fontWeight:700, color:over?"#D97706":item.c }}>{item.cur}</div>
                      <div style={{ fontSize:9, color:PK.rose, marginBottom:5 }}>/ {item.tgt}</div>
                      <div style={{ background:PK.light, borderRadius:99, height:5 }}>
                        <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:over?"#D97706":item.c, transition:"width 0.5s" }} />
                      </div>
                      <div style={{ fontSize:9, color:over?"#D97706":item.c, fontWeight:700, marginTop:3 }}>{pct}%</div>
                      <div style={{ fontSize:9, color:PK.rose, marginTop:2 }}>{item.l}</div>
                    </div>
                  );
                })}
              </div>

              {/* Valgymai */}
              <div style={{ borderTop:"1px solid "+PK.light, paddingTop:12 }}>

                {/* Pridėti mygtukas */}
                {!showMeals ? (
                  <button onClick={() => setShowMeals(true)} style={{
                    width:"100%", padding:"11px 0",
                    background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")",
                    color:"#fff", border:"none", borderRadius:12,
                    fontSize:13, fontWeight:700, cursor:"pointer",
                    fontFamily:"inherit", marginBottom:8,
                  }}>
                    + Pridėti maisto
                  </button>
                ) : (
                  <div style={{ marginBottom:8 }}>
                    {/* Valgymų pasirinkimas */}
                    <div style={{
                      background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")",
                      borderRadius:14, padding:12,
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                        <span style={{ color:"#fff", fontSize:13, fontWeight:700 }}>Pasirink valgymą:</span>
                        <button onClick={() => setShowMeals(false)} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"4px 8px", color:"#fff", fontSize:12, cursor:"pointer" }}>✕</button>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {MEALS.map(meal => (
                          <button key={meal.id}
                            onClick={() => { setActiveMeal(meal.id); setSearching(true); setShowMeals(false); }}
                            style={{
                              padding:"10px 8px", background:"rgba(255,255,255,0.15)",
                              border:"1px solid rgba(255,255,255,0.2)", borderRadius:10,
                              color:"#fff", fontSize:13, fontWeight:700,
                              cursor:"pointer", fontFamily:"inherit",
                            }}>
                            {meal.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Kiekvienas valgymų blokas */}
                {MEALS.map(meal => {
                  const me = entries.filter(e => e.meal === meal.id);
                  if (me.length === 0) return null;
                  const mT = me.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0) }), { kcal:0, protein:0 });
                  const isOpen = !collapsed[meal.id];
                  return (
                    <div key={meal.id} style={{ marginBottom:8, border:"1px solid "+PK.blush, borderRadius:12, overflow:"hidden" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px" }}>
                        <button onClick={() => toggleMeal(meal.id)}
                          style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, padding:0, flex:1, fontFamily:"inherit" }}>
                          <span style={{ fontSize:10, color:PK.rose }}>{isOpen?"▼":"▶"}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:PK.dark }}>{meal.label}</span>
                          <span style={{ fontSize:10, color:PK.rose }}>{Math.round(mT.kcal)} kcal · B:{Math.round(mT.protein)}g</span>
                        </button>
                        <button onClick={() => { setActiveMeal(meal.id); setSearching(true); }}
                          style={{ padding:"4px 8px", background:PK.light, border:"1px solid "+PK.blush, borderRadius:7, fontSize:10, fontWeight:700, color:PK.mid, cursor:"pointer", fontFamily:"inherit" }}>
                          + Pridėti
                        </button>
                      </div>
                      {isOpen && (
                        <div style={{ borderTop:"1px solid "+PK.light }}>
                          {me.map(e => (
                            <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 12px", borderBottom:"1px solid "+PK.light }}>
                              <div style={{ flex:1 }}>
                                <p style={{ margin:"0 0 1px", fontSize:12, color:PK.dark, fontWeight:500 }}>{e.name}</p>
                                <p style={{ margin:0, fontSize:10, color:PK.rose }}>{e.amount}g · {e.kcal} kcal · B:{e.protein}g R:{e.fat}g A:{e.carbs}g</p>
                              </div>
                              <button onClick={() => removeEntry(e.id)} style={{ background:"none", border:"none", color:PK.rose, fontSize:16, cursor:"pointer", padding:"0 0 0 8px" }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vanduo */}
            <WaterTracker goal={Math.round(parseFloat(profile.weight) * 33)} userId={user.id} />
          </>
        )}
      </div>
    </div>
  );
}
