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
  const [profile,    setProfile]   = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [entries,    setEntries]   = useState([]);
  const [searching,  setSearching] = useState(false);
  const [activeMeal, setActiveMeal]= useState(null);
  const [openMeal,   setOpenMeal]  = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, [user.id]);

  const loadEntries = useCallback(async () => {
    const { data } = await supabase.from("food_log").select("*").eq("user_id", user.id).eq("date", todayStr()).order("created_at");
    setEntries(data || []);
  }, [user.id]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  // ── BUG FIX: uždaryti modalą PRIEŠ await, try/catch ──────────────────────
  async function addEntry(meal, food) {
    setSearching(false);
    setActiveMeal(null);
    try {
      await supabase.from("food_log").insert({
        user_id: user.id, date: todayStr(), meal,
        name: food.name, brand: food.brand || "",
        amount: food.amount, kcal: food.kcal,
        protein: food.protein, fat: food.fat, carbs: food.carbs,
      });
      loadEntries();
    } catch(e) { console.error("addEntry:", e); }
  }

  async function removeEntry(id) {
    await supabase.from("food_log").delete().eq("id", id);
    loadEntries();
  }

  function toggleMeal(mealId) {
    setOpenMeal(prev => prev === mealId ? null : mealId);
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

  const totals = entries.reduce((a,e) => ({
    kcal:    a.kcal    + (e.kcal    || 0),
    protein: a.protein + (e.protein || 0),
    fat:     a.fat     + (e.fat     || 0),
    carbs:   a.carbs   + (e.carbs   || 0),
  }), { kcal:0, protein:0, fat:0, carbs:0 });

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,"+PK.pale+" 0%,#fff 55%,"+PK.light+" 100%)", fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom:48 }}>

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
                  {profile.gender==="f" ? "👩" : "👨"}
                </div>
                <div>
                  <p style={{ margin:0, fontSize:14, fontWeight:700, color:PK.dark }}>{profile.name}</p>
                  <p style={{ margin:0, fontSize:11, color:PK.rose }}>{profile.weight} kg · {profile.height} cm · {profile.age} m.</p>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ margin:0, fontSize:11, color:PK.mid, fontWeight:700 }}>{goalLabel}</p>
                <p style={{ margin:0, fontSize:10, color:PK.rose }}>{actLabel}</p>
              </div>
            </div>

            {/* Makro plano rodoma + valgymai */}
            {res && (
              <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:16, marginBottom:12 }}>

                {/* Tiksliniai makro */}
                <p style={{ color:"rgba(255,255,255,0.6)", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, textAlign:"center" }}>Dienos tikslas</p>
                <div style={{ display:"flex", justifyContent:"space-around", marginBottom:14 }}>
                  {[
                    { l:"KCAL", v:res.target,    s:"tikslas",    c:"#fff"     },
                    { l:"B",    v:res.prot.g+"g", s:"baltymai",  c:PK.blush   },
                    { l:"R",    v:res.fat.g+"g",  s:"riebalai",  c:PK.coral   },
                    { l:"A",    v:res.carb.g+"g", s:"angliavandeniai", c:PK.rose },
                  ].map(item => (
                    <div key={item.l} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:700, color:item.c }}>{item.v}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.08em", marginTop:2 }}>{item.l}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginTop:1 }}>{item.s}</div>
                    </div>
                  ))}
                </div>

                {/* Makro progreso juostos */}
                <div style={{ height:1, background:"rgba(255,255,255,0.15)", marginBottom:14 }} />
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {[
                    { label:"💪 Baltymai",       data:res.prot, cur:totals.protein, color:"#FFB3C6" },
                    { label:"🥑 Riebalai",        data:res.fat,  cur:totals.fat,     color:"#FF80AB" },
                    { label:"🍚 Angliavandeniai", data:res.carb, cur:totals.carbs,   color:"#F48FB1" },
                  ].map(macro => (
                    <div key={macro.label}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{macro.label}</span>
                        <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                          <span style={{ fontSize:16, fontWeight:700, color:macro.color }}>{Math.round(macro.cur)}g</span>
                          <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>/ {macro.data.g}g</span>
                        </div>
                      </div>
                      <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:99, height:5 }}>
                        <div style={{ width:Math.min(100, Math.round(macro.cur/macro.data.g*100))+"%", height:"100%", borderRadius:99, background:macro.color, transition:"width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Valgymai */}
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.15)", paddingTop:14, marginTop:14 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom: openMeal ? 12 : 0 }}>
                    {MEALS.map(meal => {
                      const me = entries.filter(e => e.meal === meal.id);
                      const mT = me.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0) }), { kcal:0 });
                      const isActive = openMeal === meal.id;
                      return (
                        <button key={meal.id} onClick={() => toggleMeal(meal.id)}
                          style={{ padding:"10px 8px", background: isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)", border: isActive ? "1.5px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.15)", borderRadius:12, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textAlign:"center", transition:"all 0.15s" }}>
                          <div>{meal.label}</div>
                          {me.length > 0 && <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", marginTop:3 }}>{me.length} įrašai · {Math.round(mT.kcal)} kcal</div>}
                        </button>
                      );
                    })}
                  </div>

                  {openMeal && (
                    <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:14, overflow:"hidden" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px" }}>
                        <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{MEALS.find(m => m.id === openMeal)?.label}</span>
                        <button onClick={() => { setActiveMeal(openMeal); setSearching(true); }}
                          style={{ padding:"5px 12px", background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:8, fontSize:11, fontWeight:700, color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>
                          + Pridėti
                        </button>
                      </div>
                      {(() => {
                        const me = entries.filter(e => e.meal === openMeal);
                        if (me.length === 0) return <p style={{ margin:0, padding:"8px 14px 12px", fontSize:11, color:"rgba(255,255,255,0.4)", fontStyle:"italic" }}>Dar nieko nepridėta</p>;
                        return me.map(e => (
                          <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 14px", borderTop:"1px solid rgba(255,255,255,0.1)" }}>
                            <div style={{ flex:1 }}>
                              <p style={{ margin:"0 0 1px", fontSize:12, color:"#fff", fontWeight:500 }}>{e.name}</p>
                              <p style={{ margin:0, fontSize:10, color:"rgba(255,255,255,0.5)" }}>{e.amount}g · {e.kcal} kcal · B:{e.protein}g R:{e.fat}g A:{e.carbs}g</p>
                            </div>
                            <button onClick={() => removeEntry(e.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:16, cursor:"pointer", padding:"0 0 0 8px" }}>✕</button>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vanduo */}
            <WaterTracker goal={Math.round(parseFloat(profile.weight) * 33)} userId={user.id} />
          </>
        )}
      </div>
    </div>
  );
}