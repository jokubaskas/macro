import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

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

function today() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("lt-LT", { weekday:"short", month:"short", day:"numeric" });
}

function isWithinWeek(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / (1000 * 60 * 60 * 24);
  return diff <= 7;
}

// ── MAISTO PAIEŠKA ─────────────────────────────────────────────────────────
function FoodSearch({ onAdd, onClose }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [amount,  setAmount]  = useState("100");

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(
        "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" +
        encodeURIComponent(query) +
        "&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments,serving_size,brands"
      );
      const data = await res.json();
      const filtered = (data.products || []).filter(p =>
        p.product_name &&
        p.nutriments?.["energy-kcal_100g"]
      );
      setResults(filtered);
    } catch(e) { setResults([]); }
    setLoading(false);
  }

  function getNutrients(product, grams) {
    const n = product.nutriments;
    const ratio = grams / 100;
    return {
      kcal:    Math.round((n["energy-kcal_100g"] || 0) * ratio),
      protein: Math.round((n["proteins_100g"]    || 0) * ratio * 10) / 10,
      fat:     Math.round((n["fat_100g"]         || 0) * ratio * 10) / 10,
      carbs:   Math.round((n["carbohydrates_100g"]|| 0) * ratio * 10) / 10,
    };
  }

  function handleAdd() {
    if (!selected) return;
    const g = parseFloat(amount) || 100;
    const n = getNutrients(selected, g);
    onAdd({
      name:    selected.product_name,
      brand:   selected.brands || "",
      amount:  g,
      ...n,
    });
  }

  const inp = { width:"100%", padding:"11px 14px", border:"2px solid "+PK.blush, borderRadius:12, fontSize:15, color:PK.dark, background:PK.pale, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", maxHeight:"90vh", background:"#fff", borderRadius:"20px 20px 0 0", overflow:"hidden", display:"flex", flexDirection:"column" }}>
        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>Ieškoti maisto</h3>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:"16px", overflowY:"auto", flex:1 }}>
          {/* Paieška */}
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input style={{ ...inp, flex:1 }} value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="pvz. vištienos krūtinėlė..." onKeyDown={e=>e.key==="Enter"&&search()} />
            <button onClick={search} style={{ padding:"11px 16px", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>
              {loading ? "..." : "Ieškoti"}
            </button>
          </div>

          {/* Rezultatai */}
          {results.length > 0 && !selected && (
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
              {results.map((p, i) => {
                const n = p.nutriments;
                return (
                  <button key={i} onClick={()=>setSelected(p)} style={{
                    padding:"12px 14px", border:"2px solid "+PK.blush, borderRadius:14,
                    background:"#fff", textAlign:"left", cursor:"pointer", fontFamily:"inherit",
                  }}>
                    <p style={{ margin:"0 0 4px", fontSize:13, fontWeight:700, color:PK.dark }}>{p.product_name}</p>
                    {p.brands && <p style={{ margin:"0 0 4px", fontSize:11, color:PK.rose }}>{p.brands}</p>}
                    <p style={{ margin:0, fontSize:11, color:PK.mid }}>
                      {Math.round(n["energy-kcal_100g"]||0)} kcal · B: {Math.round(n["proteins_100g"]||0)}g · R: {Math.round(n["fat_100g"]||0)}g · A: {Math.round(n["carbohydrates_100g"]||0)}g (per 100g)
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Pasirinktas produktas */}
          {selected && (
            <div style={{ background:PK.pale, borderRadius:16, padding:16, marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div>
                  <p style={{ margin:"0 0 4px", fontSize:14, fontWeight:700, color:PK.dark }}>{selected.product_name}</p>
                  {selected.brands && <p style={{ margin:0, fontSize:11, color:PK.rose }}>{selected.brands}</p>}
                </div>
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:PK.rose, fontSize:18, cursor:"pointer" }}>✕</button>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:PK.mid, whiteSpace:"nowrap" }}>Kiekis (g):</label>
                <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                  style={{ ...inp, width:100, padding:"8px 12px" }} />
              </div>

              {(() => {
                const g = parseFloat(amount) || 100;
                const n = getNutrients(selected, g);
                return (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:16 }}>
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
                Pridėti į žurnalą
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PAGRINDINIS KOMPONENTAS ────────────────────────────────────────────────
export default function FoodLog({ userId, targetMacros }) {
  const [date,      setDate]      = useState(today());
  const [entries,   setEntries]   = useState([]);
  const [history,   setHistory]   = useState([]);
  const [activeMeal,setActiveMeal]= useState(null);
  const [searching, setSearching] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("today"); // today | history

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("food_log")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at");
    setEntries(data || []);
    setLoading(false);
  }, [userId, date]);

  const loadHistory = useCallback(async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data } = await supabase
      .from("food_log")
      .select("*")
      .eq("user_id", userId)
      .gte("date", weekAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });
    setHistory(data || []);
  }, [userId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { if (tab === "history") loadHistory(); }, [tab, loadHistory]);

  async function addEntry(meal, food) {
    await supabase.from("food_log").insert({
      user_id: userId, date, meal,
      name: food.name, brand: food.brand,
      amount: food.amount,
      kcal: food.kcal, protein: food.protein,
      fat: food.fat, carbs: food.carbs,
    });
    setSearching(false);
    setActiveMeal(null);
    loadEntries();
  }

  async function removeEntry(id) {
    await supabase.from("food_log").delete().eq("id", id);
    loadEntries();
  }

  // Dienos sumos
  const totals = entries.reduce((acc, e) => ({
    kcal:    acc.kcal    + (e.kcal    || 0),
    protein: acc.protein + (e.protein || 0),
    fat:     acc.fat     + (e.fat     || 0),
    carbs:   acc.carbs   + (e.carbs   || 0),
  }), { kcal:0, protein:0, fat:0, carbs:0 });

  // Istorija grupuota pagal datą
  const historyByDate = history.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});

  const oldHistory = Object.entries(historyByDate).filter(([d]) => !isWithinWeek(d));
  const weekHistory = Object.entries(historyByDate).filter(([d]) => isWithinWeek(d) && d !== today());

  function DaySummary({ dateStr, dayEntries }) {
    const t = dayEntries.reduce((acc, e) => ({
      kcal: acc.kcal + (e.kcal||0), protein: acc.protein + (e.protein||0),
      fat: acc.fat + (e.fat||0), carbs: acc.carbs + (e.carbs||0),
    }), { kcal:0, protein:0, fat:0, carbs:0 });
    return (
      <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid "+PK.blush }}>
        <p style={{ fontSize:13, fontWeight:700, color:PK.dark, marginBottom:10 }}>{formatDate(dateStr)}</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
          {[
            { l:"Kalorijos", v:Math.round(t.kcal),    u:"kcal", c:PK.dark   },
            { l:"Baltymai",  v:Math.round(t.protein),  u:"g",    c:PK.mid    },
            { l:"Riebalai",  v:Math.round(t.fat),      u:"g",    c:PK.bright },
            { l:"Angliavandeniai", v:Math.round(t.carbs), u:"g", c:PK.rose   },
          ].map(item => (
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
      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{ id:"today", l:"📅 Šiandien" }, { id:"history", l:"📊 Istorija" }].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, padding:"10px 0", borderRadius:12, fontSize:13, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
            border:"2px solid "+(tab===t.id ? PK.mid : PK.blush),
            background:tab===t.id ? PK.light : "#fff",
            color:tab===t.id ? PK.dark : PK.rose,
          }}>{t.l}</button>
        ))}
      </div>

      {tab === "today" && (
        <>
          {/* Datos pasirinkimas */}
          <div style={{ background:"#fff", borderRadius:16, padding:"12px 16px", marginBottom:12, border:"1px solid "+PK.blush, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:PK.mid }}>Data:</span>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{ border:"none", background:"none", fontSize:14, color:PK.dark, fontFamily:"inherit", outline:"none", flex:1 }} />
          </div>

          {/* Dienos suvestinė */}
          {targetMacros && (
            <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:16, marginBottom:12 }}>
              <p style={{ color:"#fff", fontSize:13, fontWeight:700, marginBottom:12, textAlign:"center" }}>Dienos pažanga</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                {[
                  { l:"Kalorijos", cur:Math.round(totals.kcal),    tgt:targetMacros.target, c:"#fff"    },
                  { l:"Baltymai",  cur:Math.round(totals.protein),  tgt:targetMacros.prot.g, c:PK.blush  },
                  { l:"Riebalai",  cur:Math.round(totals.fat),      tgt:targetMacros.fat.g,  c:PK.coral  },
                  { l:"Angliavandeniai", cur:Math.round(totals.carbs), tgt:targetMacros.carb.g, c:PK.rose },
                ].map(item => {
                  const pct = item.tgt ? Math.min(100, Math.round(item.cur/item.tgt*100)) : 0;
                  return (
                    <div key={item.l} style={{ background:"rgba(255,255,255,0.13)", borderRadius:12, padding:"10px 6px", textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:item.c }}>{item.cur}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)" }}>/ {item.tgt}</div>
                      <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:4, margin:"6px 0 4px" }}>
                        <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:item.c, transition:"width 0.5s" }} />
                      </div>
                      <div style={{ fontSize:9, color:item.c, fontWeight:700 }}>{pct}%</div>
                      <div style={{ fontSize:8, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{item.l}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Valgymai */}
          {MEALS.map(meal => {
            const mealEntries = entries.filter(e => e.meal === meal.id);
            const mealTotals = mealEntries.reduce((acc,e) => ({ kcal: acc.kcal+(e.kcal||0), protein: acc.protein+(e.protein||0) }), { kcal:0, protein:0 });
            return (
              <div key={meal.id} style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid "+PK.blush }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: mealEntries.length ? 10 : 0 }}>
                  <div>
                    <span style={{ fontSize:14, fontWeight:700, color:PK.dark }}>{meal.label}</span>
                    {mealEntries.length > 0 && (
                      <span style={{ fontSize:11, color:PK.rose, marginLeft:8 }}>
                        {Math.round(mealTotals.kcal)} kcal · {Math.round(mealTotals.protein)}g baltymų
                      </span>
                    )}
                  </div>
                  <button onClick={()=>{ setActiveMeal(meal.id); setSearching(true); }}
                    style={{ padding:"6px 12px", background:PK.light, border:"1px solid "+PK.blush, borderRadius:10, fontSize:12, fontWeight:700, color:PK.mid, cursor:"pointer" }}>
                    + Pridėti
                  </button>
                </div>
                {mealEntries.map(e => (
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

      {tab === "history" && (
        <>
          {weekHistory.length === 0 && oldHistory.length === 0 ? (
            <div style={{ background:PK.pale, borderRadius:16, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🌸</div>
              <p style={{ color:PK.rose, fontSize:14 }}>Dar nėra istorijos</p>
            </div>
          ) : (
            <>
              {weekHistory.length > 0 && (
                <>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:PK.mid, marginBottom:10 }}>Ši savaitė</p>
                  {weekHistory.map(([d, entries]) => (
                    <div key={d}>
                      <DaySummary dateStr={d} dayEntries={entries} />
                      {entries.map(e => (
                        <div key={e.id} style={{ padding:"6px 16px 6px 24px", borderLeft:"2px solid "+PK.blush, marginBottom:4 }}>
                          <p style={{ margin:0, fontSize:12, color:PK.dark }}>{e.name} <span style={{ color:PK.rose }}>{e.amount}g · {e.kcal} kcal</span></p>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
              {oldHistory.length > 0 && (
                <>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:PK.mid, margin:"16px 0 10px" }}>Senesnė istorija</p>
                  {oldHistory.map(([d, entries]) => (
                    <DaySummary key={d} dateStr={d} dayEntries={entries} />
                  ))}
                </>
              )}
            </>
          )}
        </>
      )}

      {searching && (
        <FoodSearch
          onAdd={(food) => addEntry(activeMeal, food)}
          onClose={() => { setSearching(false); setActiveMeal(null); }}
        />
      )}
    </div>
  );
}
