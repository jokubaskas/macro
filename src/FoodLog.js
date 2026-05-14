import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { LOCAL_FOODS, searchLocalFoods, CATEGORIES } from "./foodDatabase";

const PK = {
  dark:"#6D1B3B", mid:"#AD1457", bright:"#E91E8C",
  rose:"#F48FB1", blush:"#F8BBD9", light:"#FCE4EC",
  pale:"#FFF0F5", coral:"#FFB3C6", water:"#5BB8D4",
};

const MEALS = [
  { id:"breakfast", label:"🌅 Pusryčiai" },
  { id:"lunch",     label:"☀️ Pietūs" },
  { id:"dinner",    label:"🌙 Vakarienė" },
  { id:"snack",     label:"🍎 Užkandžiai" },
];

function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) {
  return new Date(d).toLocaleDateString("lt-LT", { weekday:"short", month:"short", day:"numeric" });
}
function isWithinWeek(dateStr) {
  return (new Date() - new Date(dateStr)) / 864e5 <= 7;
}

function getNutrients(food, grams) {
  const r = grams / 100;
  return {
    kcal:    Math.round(food.kcal    * r),
    protein: Math.round(food.protein * r * 10) / 10,
    fat:     Math.round(food.fat     * r * 10) / 10,
    carbs:   Math.round(food.carbs   * r * 10) / 10,
  };
}

// ── MAISTO PAIEŠKA ─────────────────────────────────────────────────────────
function FoodSearch({ onAdd, onClose }) {
  const [query,      setQuery]      = useState("");
  const [localRes,   setLocalRes]   = useState([]);
  const [onlineRes,  setOnlineRes]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [selected,   setSelected]   = useState(null);
  const [isLocal,    setIsLocal]    = useState(true);
  const [amount,     setAmount]     = useState("");
  const [unit,       setUnit]       = useState(null);
  const [category,   setCategory]   = useState("Visi");

  useEffect(() => {
    if (!query) {
      setLocalRes(category === "Visi" ? LOCAL_FOODS.slice(0, 12) : LOCAL_FOODS.filter(f => f.category === category).slice(0, 12));
    } else {
      setLocalRes(searchLocalFoods(query));
    }
  }, [query, category]);

  async function searchOnline() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" +
        encodeURIComponent(query) +
        "&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments,brands"
      );
      const data = await res.json();
      const filtered = (data.products || []).filter(p =>
        p.product_name && p.nutriments?.["energy-kcal_100g"]
      ).map(p => ({
        id: "online_" + p.product_name,
        name: p.product_name,
        brand: p.brands || "",
        category: "Supakuoti produktai",
        kcal:    p.nutriments["energy-kcal_100g"]    || 0,
        protein: p.nutriments["proteins_100g"]        || 0,
        fat:     p.nutriments["fat_100g"]             || 0,
        carbs:   p.nutriments["carbohydrates_100g"]   || 0,
        units: [],
      }));
      setOnlineRes(filtered);
    } catch(e) { setOnlineRes([]); }
    setLoading(false);
  }

  function selectFood(food, local) {
    setSelected(food);
    setIsLocal(local);
    setUnit(food.units?.length ? food.units[0] : null);
    setAmount(food.units?.length ? "" : "100");
  }

  function getGrams() {
    if (unit) return unit.grams;
    return parseFloat(amount) || 100;
  }

  // FIX: uždaryti modalą iškart + amount laukas
  function handleAdd() {
    if (!selected) return;
    const g = getGrams();
    const n = getNutrients(selected, g);
    onAdd({ name: selected.name, brand: selected.brand || "", amount: g, ...n });
    onClose(); // FIX: uždaryti iškart, nesaugant laukimo
  }

  const inp = {
    width:"100%", padding:"11px 14px",
    border:"2px solid "+PK.blush, borderRadius:12,
    fontSize:15, color:PK.dark, background:PK.pale,
    outline:"none", fontFamily:"inherit", boxSizing:"border-box",
  };

  const currentList = isLocal ? localRes : onlineRes;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", maxHeight:"92vh", background:"#fff", borderRadius:"20px 20px 0 0", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>Ieškoti maisto</h3>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"16px" }}>

          {/* Paieška */}
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <input style={{ ...inp, flex:1 }} value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Ieškoti produkto..."
              onKeyDown={e => { if(e.key==="Enter" && !isLocal) searchOnline(); }}
            />
          </div>

          {/* Šaltinio pasirinkimas */}
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <button onClick={()=>{ setIsLocal(true); setOnlineRes([]); }}
              style={{ flex:1, padding:"9px 0", borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(isLocal?PK.mid:PK.blush), background:isLocal?PK.light:"#fff", color:isLocal?PK.dark:PK.rose }}>
              🇱🇹 Mūsų duomenų bazė
            </button>
            <button onClick={()=>{ setIsLocal(false); if(query) searchOnline(); }}
              style={{ flex:1, padding:"9px 0", borderRadius:12, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(!isLocal?PK.mid:PK.blush), background:!isLocal?PK.light:"#fff", color:!isLocal?PK.dark:PK.rose }}>
              🌍 Pasaulinė DB
            </button>
          </div>

          {/* Kategorijos */}
          {isLocal && !query && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {["Visi", ...CATEGORIES].map(cat => (
                <button key={cat} onClick={()=>setCategory(cat)}
                  style={{ padding:"5px 10px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"1px solid "+(category===cat?PK.mid:PK.blush), background:category===cat?PK.light:"#fff", color:category===cat?PK.dark:PK.rose }}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Pasaulinė paieška */}
          {!isLocal && (
            <button onClick={searchOnline} style={{ width:"100%", padding:"11px 0", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:12 }}>
              {loading ? "Ieškoma..." : "🔍 Ieškoti internete"}
            </button>
          )}

          {/* Pasirinktas produktas */}
          {selected && (
            <div style={{ background:PK.pale, borderRadius:16, padding:16, marginBottom:14, border:"1px solid "+PK.blush }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:PK.dark }}>{selected.name}</p>
                  {selected.brand && <p style={{ margin:0, fontSize:11, color:PK.rose }}>{selected.brand}</p>}
                  <p style={{ margin:"4px 0 0", fontSize:11, color:PK.mid }}>{Math.round(selected.kcal)} kcal · B:{Math.round(selected.protein)}g · R:{Math.round(selected.fat)}g · A:{Math.round(selected.carbs)}g (per 100g)</p>
                </div>
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:PK.rose, fontSize:18, cursor:"pointer", marginLeft:8 }}>✕</button>
              </div>

              <p style={{ fontSize:11, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Kiekis</p>

              {selected.units?.length > 0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                  {selected.units.map((u, i) => (
                    <button key={i} onClick={()=>{ setUnit(u); setAmount(""); }}
                      style={{ padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(unit===u?PK.mid:PK.blush), background:unit===u?PK.light:"#fff", color:unit===u?PK.dark:PK.rose }}>
                      {u.label}
                    </button>
                  ))}
                  <button onClick={()=>{ setUnit(null); setAmount("100"); }}
                    style={{ padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(!unit?PK.mid:PK.blush), background:!unit?PK.light:"#fff", color:!unit?PK.dark:PK.rose }}>
                    Gramai
                  </button>
                </div>
              )}

              {!unit && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                    style={{ ...inp, width:100, padding:"8px 12px" }} placeholder="100" />
                  <span style={{ fontSize:13, color:PK.mid, fontWeight:600 }}>gramų</span>
                </div>
              )}

              {(() => {
                const g = getGrams();
                const n = getNutrients(selected, g);
                return (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                    {[
                      { l:"Kalorijos", v:n.kcal,    u:"kcal", c:PK.dark   },
                      { l:"Baltymai",  v:n.protein,  u:"g",    c:PK.mid    },
                      { l:"Riebalai",  v:n.fat,      u:"g",    c:PK.bright },
                      { l:"Angliavandeniai", v:n.carbs, u:"g", c:PK.rose   },
                    ].map(item => (
                      <div key={item.l} style={{ background:"#fff", borderRadius:10, padding:"8px 4px", textAlign:"center", border:"1px solid "+PK.blush }}>
                        <div style={{ fontSize:16, fontWeight:700, color:item.c }}>{item.v}<span style={{ fontSize:9 }}>{item.u}</span></div>
                        <div style={{ fontSize:9, color:PK.rose, marginTop:1 }}>{item.l}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <button onClick={handleAdd} style={{ width:"100%", padding:"13px 0", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer" }}>
                ✓ Pridėti į žurnalą
              </button>
            </div>
          )}

          {/* Produktų sąrašas */}
          {!selected && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {currentList.length === 0 && !loading && (
                <p style={{ textAlign:"center", color:PK.rose, padding:"20px 0", fontSize:13 }}>
                  {isLocal ? "Nerasta vietinėje duomenų bazėje" : "Spausk 'Ieškoti internete'"}
                </p>
              )}
              {currentList.map((food, i) => (
                <button key={food.id || i} onClick={()=>selectFood(food, isLocal)}
                  style={{ padding:"12px 14px", border:"2px solid "+PK.blush, borderRadius:14, background:"#fff", textAlign:"left", cursor:"pointer", fontFamily:"inherit" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:700, color:PK.dark }}>{food.name}</p>
                      {food.brand && <p style={{ margin:"0 0 3px", fontSize:11, color:PK.rose }}>{food.brand}</p>}
                      <p style={{ margin:0, fontSize:11, color:PK.mid }}>
                        {Math.round(food.kcal)} kcal · B:{Math.round(food.protein)}g · R:{Math.round(food.fat)}g · A:{Math.round(food.carbs)}g
                      </p>
                    </div>
                    {food.units?.length > 0 && (
                      <span style={{ fontSize:10, background:PK.light, color:PK.mid, borderRadius:8, padding:"3px 8px", fontWeight:700, whiteSpace:"nowrap", marginLeft:8 }}>
                        {food.units.length} dydžiai
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PAGRINDINIS KOMPONENTAS ────────────────────────────────────────────────
export default function FoodLog({ userId, targetMacros }) {
  const [date,       setDate]       = useState(today());
  const [entries,    setEntries]    = useState([]);
  const [history,    setHistory]    = useState([]);
  const [activeMeal, setActiveMeal] = useState(null);
  const [searching,  setSearching]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("today");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("food_log").select("*").eq("user_id", userId).eq("date", date).order("created_at");
    setEntries(data || []);
    setLoading(false);
  }, [userId, date]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from("food_log").select("*").eq("user_id", userId)
      .order("date", { ascending:false }).order("created_at");
    setHistory(data || []);
  }, [userId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { if (tab==="history") loadHistory(); }, [tab, loadHistory]);

  // FIX: uždaryti iškart + try/catch
  async function addEntry(meal, food) {
    setSearching(false);
    setActiveMeal(null);
    try {
      await supabase.from("food_log").insert({
        user_id:userId, date, meal,
        name:    food.name,
        brand:   food.brand    || "",
        amount:  food.amount   || 100,
        kcal:    food.kcal     || 0,
        protein: food.protein  || 0,
        fat:     food.fat      || 0,
        carbs:   food.carbs    || 0,
      });
      loadEntries();
    } catch(e) { console.error("addEntry:", e); }
  }

  async function removeEntry(id) {
    await supabase.from("food_log").delete().eq("id", id);
    loadEntries();
  }

  const totals = entries.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }), { kcal:0, protein:0, fat:0, carbs:0 });

  const historyByDate = history.reduce((acc, e) => { if(!acc[e.date]) acc[e.date]=[]; acc[e.date].push(e); return acc; }, {});
  const weekHistory   = Object.entries(historyByDate).filter(([d]) => isWithinWeek(d) && d!==today());
  const oldHistory    = Object.entries(historyByDate).filter(([d]) => !isWithinWeek(d));

  function DaySummary({ dateStr, dayEntries }) {
    const t = dayEntries.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }), { kcal:0,protein:0,fat:0,carbs:0 });
    return (
      <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid "+PK.blush }}>
        <p style={{ fontSize:13, fontWeight:700, color:PK.dark, marginBottom:10 }}>{formatDate(dateStr)}</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
          {[{l:"Kalorijos",v:Math.round(t.kcal),u:"kcal",c:PK.dark},{l:"Baltymai",v:Math.round(t.protein),u:"g",c:PK.mid},{l:"Riebalai",v:Math.round(t.fat),u:"g",c:PK.bright},{l:"Angliavandeniai",v:Math.round(t.carbs),u:"g",c:PK.rose}].map(item=>(
            <div key={item.l} style={{ background:PK.pale, borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
              <div style={{ fontSize:15, fontWeight:700, color:item.c }}>{item.v}<span style={{ fontSize:9 }}>{item.u}</span></div>
              <div style={{ fontSize:9, color:PK.rose, marginTop:1 }}>{item.l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom:24 }}>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{id:"today",l:"📅 Šiandien"},{id:"history",l:"📊 Istorija"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"10px 0", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(tab===t.id?PK.mid:PK.blush), background:tab===t.id?PK.light:"#fff", color:tab===t.id?PK.dark:PK.rose }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab==="today" && (
        <>
          <div style={{ background:"#fff", borderRadius:16, padding:"12px 16px", marginBottom:12, border:"1px solid "+PK.blush, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:PK.mid }}>Data:</span>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{ border:"none", background:"none", fontSize:14, color:PK.dark, fontFamily:"inherit", outline:"none", flex:1 }} />
          </div>

          {targetMacros && (
            <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:16, marginBottom:12 }}>
              <p style={{ color:"#fff", fontSize:13, fontWeight:700, marginBottom:12, textAlign:"center" }}>Dienos pažanga</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                {[
                  {l:"Kalorijos",cur:Math.round(totals.kcal),   tgt:targetMacros.target,   c:"#fff"},
                  {l:"Baltymai", cur:Math.round(totals.protein), tgt:targetMacros.prot.g,   c:PK.blush},
                  {l:"Riebalai", cur:Math.round(totals.fat),     tgt:targetMacros.fat.g,    c:PK.coral},
                  {l:"Angliavandeniai",cur:Math.round(totals.carbs),tgt:targetMacros.carb.g,c:PK.rose},
                ].map(item=>{
                  const pct = item.tgt ? Math.min(100,Math.round(item.cur/item.tgt*100)) : 0;
                  const over = item.tgt && item.cur > item.tgt;
                  return (
                    <div key={item.l} style={{ background:"rgba(255,255,255,0.13)", borderRadius:12, padding:"10px 6px", textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:over?"#FFD700":item.c }}>{item.cur}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)" }}>/ {item.tgt}</div>
                      <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:4, margin:"6px 0 4px" }}>
                        <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:over?"#FFD700":item.c, transition:"width 0.5s" }} />
                      </div>
                      <div style={{ fontSize:9, color:over?"#FFD700":item.c, fontWeight:700 }}>{pct}%</div>
                      <div style={{ fontSize:8, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{item.l}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {MEALS.map(meal=>{
            const mealEntries = entries.filter(e=>e.meal===meal.id);
            const mealTotals  = mealEntries.reduce((a,e)=>({kcal:a.kcal+(e.kcal||0),protein:a.protein+(e.protein||0)}),{kcal:0,protein:0});
            return (
              <div key={meal.id} style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid "+PK.blush }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:mealEntries.length?10:0 }}>
                  <div>
                    <span style={{ fontSize:14, fontWeight:700, color:PK.dark }}>{meal.label}</span>
                    {mealEntries.length>0 && <span style={{ fontSize:11, color:PK.rose, marginLeft:8 }}>{Math.round(mealTotals.kcal)} kcal · {Math.round(mealTotals.protein)}g B</span>}
                  </div>
                  <button onClick={()=>{setActiveMeal(meal.id);setSearching(true);}}
                    style={{ padding:"6px 12px", background:PK.light, border:"1px solid "+PK.blush, borderRadius:10, fontSize:12, fontWeight:700, color:PK.mid, cursor:"pointer" }}>
                    + Pridėti
                  </button>
                </div>
                {mealEntries.map(e=>(
                  <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderTop:"1px solid "+PK.light }}>
                    <div>
                      <p style={{ margin:"0 0 2px", fontSize:13, color:PK.dark, fontWeight:500 }}>{e.name}</p>
                      <p style={{ margin:0, fontSize:11, color:PK.rose }}>{e.amount}g · {e.kcal} kcal · B:{e.protein}g R:{e.fat}g A:{e.carbs}g</p>
                    </div>
                    <button onClick={()=>removeEntry(e.id)} style={{ background:"none", border:"none", color:PK.rose, fontSize:16, cursor:"pointer", padding:"0 4px" }}>✕</button>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {tab==="history" && (
        <>
          {weekHistory.length===0 && oldHistory.length===0 ? (
            <div style={{ background:PK.pale, borderRadius:16, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🌸</div>
              <p style={{ color:PK.rose, fontSize:14 }}>Dar nėra istorijos</p>
            </div>
          ) : (
            <>
              {weekHistory.length>0 && (
                <>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:PK.mid, marginBottom:10 }}>Ši savaitė</p>
                  {weekHistory.map(([d,ents])=>(
                    <div key={d}>
                      <DaySummary dateStr={d} dayEntries={ents} />
                      {ents.map(e=>(
                        <div key={e.id} style={{ padding:"5px 16px 5px 24px", borderLeft:"2px solid "+PK.blush, marginBottom:3 }}>
                          <p style={{ margin:0, fontSize:12, color:PK.dark }}>{e.name} <span style={{ color:PK.rose }}>{e.amount}g · {e.kcal} kcal</span></p>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
              {oldHistory.length>0 && (
                <>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:PK.mid, margin:"16px 0 10px" }}>Senesnė istorija</p>
                  {oldHistory.map(([d,ents])=>( <DaySummary key={d} dateStr={d} dayEntries={ents} /> ))}
                </>
              )}
            </>
          )}
        </>
      )}

      {searching && (
        <FoodSearch onAdd={food=>addEntry(activeMeal,food)} onClose={()=>{setSearching(false);setActiveMeal(null);}} />
      )}
    </div>
  );
}