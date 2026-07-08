import { useState, useEffect, useCallback } from "react";
import { pb, pbFirst, pbUpsert } from "./pb";
import { ALL_FOODS, LOCAL_FOODS, searchLocalFoods, CATEGORIES } from "./foodDatabase";

const PK = {
  dark:"#6D1B3B", mid:"#AD1457", bright:"#E91E8C",
  rose:"#F48FB1", blush:"#F8BBD9", light:"#FCE4EC",
  pale:"#FFF0F5", coral:"#FFB3C6",
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
function isWithinWeek(dateStr) { return (new Date() - new Date(dateStr)) / 864e5 <= 7; }

function getNutrients(food, grams) {
  const r = grams / 100;
  return {
    kcal:    Math.round((food.kcal    || 0) * r),
    protein: Math.round((food.protein || 0) * r * 10) / 10,
    fat:     Math.round((food.fat     || 0) * r * 10) / 10,
    carbs:   Math.round((food.carbs   || 0) * r * 10) / 10,
  };
}

function getPer100(entry) {
  if (!entry.amount || entry.amount <= 0) return { kcal:0, protein:0, fat:0, carbs:0 };
  const r = entry.amount / 100;
  return {
    kcal:    (entry.kcal    || 0) / r,
    protein: (entry.protein || 0) / r,
    fat:     (entry.fat     || 0) / r,
    carbs:   (entry.carbs   || 0) / r,
  };
}

// ── Redagavimo panelis ─────────────────────────────────────────────────────
function EntryEditor({ entry, onSave, onClose }) {
  const per100     = getPer100(entry);
  const foodInDb   = ALL_FOODS.find(f => f.name === entry.name);
  const hasUnits   = foodInDb?.units?.length > 0;

  const [inputMode,    setInputMode]    = useState(hasUnits ? "unit" : "grams");
  const [selectedUnit, setSelectedUnit] = useState(hasUnits ? foodInDb.units[0] : null);
  const [unitCount,    setUnitCount]    = useState("1");
  const [grams,        setGrams]        = useState(String(entry.amount));

  // Iš esamo kiekio apskaičiuoti pradinį vienetų skaičių
  useEffect(() => {
    if (hasUnits && selectedUnit) {
      const cnt = entry.amount / selectedUnit.grams;
      const rounded = Math.round(cnt * 2) / 2;
      setUnitCount(String(rounded > 0 ? rounded : 1));
    }
  }, []);

  function getNewAmount() {
    if (inputMode === "unit" && selectedUnit) {
      return Math.round(selectedUnit.grams * (parseFloat(unitCount) || 1));
    }
    return parseFloat(grams) || entry.amount;
  }

  const newAmount = getNewAmount();
  const r = newAmount / 100;
  const preview = {
    kcal:    Math.round(per100.kcal    * r),
    protein: Math.round(per100.protein * r * 10) / 10,
    fat:     Math.round(per100.fat     * r * 10) / 10,
    carbs:   Math.round(per100.carbs   * r * 10) / 10,
  };

  const inp = { padding:"8px 10px", border:"2px solid "+PK.blush, borderRadius:10, fontSize:14, fontWeight:700, color:PK.dark, background:"#fff", outline:"none", fontFamily:"inherit", textAlign:"center" };
  const btnMode = (active) => ({ padding:"6px 12px", borderRadius:10, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(active?PK.mid:PK.blush), background:active?PK.light:"#fff", color:active?PK.dark:PK.rose });
  const btnQuick = (active) => ({ flex:1, padding:"5px 0", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"1px solid "+PK.blush, background:active?PK.light:"#fff", color:active?PK.dark:PK.rose });

  return (
    <div style={{ background:PK.pale, borderRadius:12, padding:"12px 14px", margin:"4px 0 8px", border:"1.5px solid "+PK.blush }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <p style={{ margin:0, fontSize:12, fontWeight:700, color:PK.dark }}>✏️ Redaguoti: {entry.name}</p>
        <button onClick={onClose} style={{ background:"none", border:"none", color:PK.rose, fontSize:16, cursor:"pointer" }}>✕</button>
      </div>

      {hasUnits && (
        <div style={{ display:"flex", gap:6, marginBottom:10 }}>
          <button onClick={() => setInputMode("unit")} style={btnMode(inputMode==="unit")}>📦 Vienetai</button>
          <button onClick={() => setInputMode("grams")} style={btnMode(inputMode==="grams")}>⚖️ Gramai</button>
        </div>
      )}

      {inputMode === "unit" && hasUnits && (
        <div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
            {foodInDb.units.map((u, i) => (
              <button key={i} onClick={() => { setSelectedUnit(u); setUnitCount("1"); }}
                style={{ padding:"5px 10px", borderRadius:10, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(selectedUnit===u?PK.mid:PK.blush), background:selectedUnit===u?PK.light:"#fff", color:selectedUnit===u?PK.dark:PK.rose }}>
                {u.label}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <input type="number" value={unitCount} step="0.5" min="0.5"
              onChange={e => setUnitCount(e.target.value)}
              style={{ ...inp, width:60 }} />
            <span style={{ fontSize:12, color:PK.rose }}>
              vnt. = <b style={{ color:PK.dark }}>{Math.round((selectedUnit?.grams||0)*(parseFloat(unitCount)||1))}g</b>
            </span>
          </div>
          <div style={{ display:"flex", gap:5, marginBottom:10 }}>
            {[0.5,1,1.5,2,3,4].map(n => (
              <button key={n} onClick={() => setUnitCount(String(n))} style={btnQuick(unitCount===String(n))}>{n}</button>
            ))}
          </div>
        </div>
      )}

      {inputMode === "grams" && (
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <input type="number" value={grams} onChange={e => setGrams(e.target.value)}
              style={{ ...inp, width:80 }} />
            <span style={{ fontSize:12, color:PK.rose }}>gramų</span>
          </div>
          <div style={{ display:"flex", gap:5, marginBottom:10 }}>
            {[50,100,150,200,300].map(g => (
              <button key={g} onClick={() => setGrams(String(g))} style={btnQuick(grams===String(g))}>{g}g</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:12 }}>
        {[{l:"kcal",v:preview.kcal,c:PK.dark},{l:"B",v:preview.protein+"g",c:PK.mid},{l:"R",v:preview.fat+"g",c:PK.bright},{l:"A",v:preview.carbs+"g",c:PK.rose}].map(item => (
          <div key={item.l} style={{ background:"#fff", borderRadius:8, padding:"6px 4px", textAlign:"center", border:"1px solid "+PK.blush }}>
            <div style={{ fontSize:13, fontWeight:700, color:item.c }}>{item.v}</div>
            <div style={{ fontSize:9, color:PK.rose }}>{item.l}</div>
          </div>
        ))}
      </div>

      <button onClick={() => onSave(newAmount)} style={{ width:"100%", padding:"10px 0", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
        💾 Išsaugoti pakeitimus
      </button>
    </div>
  );
}

// ── MAISTO PAIEŠKA (inline, su vienetų palaikymu) ──────────────────────────
function FoodSearch({ onAdd, onClose }) {
  const [query,         setQuery]        = useState("");
  const [localRes,      setLocalRes]     = useState([]);
  const [onlineRes,     setOnlineRes]    = useState([]);
  const [loading,       setLoading]      = useState(false);
  const [selected,      setSelected]     = useState(null);
  const [isLocal,       setIsLocal]      = useState(true);
  const [inputMode,     setInputMode]    = useState("grams");
  const [selectedUnit,  setSelectedUnit] = useState(null);
  const [unitCount,     setUnitCount]    = useState("1");
  const [amount,        setAmount]       = useState("100");
  const [category,      setCategory]     = useState("Visi");

  useEffect(() => {
    if (!query) {
      setLocalRes(category === "Visi" ? LOCAL_FOODS.slice(0,12) : LOCAL_FOODS.filter(f => f.category === category).slice(0,12));
    } else {
      setLocalRes(searchLocalFoods(query));
    }
  }, [query, category]);

  async function searchOnline() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("https://world.openfoodfacts.org/cgi/search.pl?search_terms="+encodeURIComponent(query)+"&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments,brands");
      const data = await res.json();
      setOnlineRes((data.products||[]).filter(p => p.product_name && p.nutriments?.["energy-kcal_100g"]).map(p => ({
        id:"online_"+p.product_name, name:p.product_name, brand:p.brands||"",
        category:"Supakuoti produktai",
        kcal:p.nutriments["energy-kcal_100g"]||0, protein:p.nutriments["proteins_100g"]||0,
        fat:p.nutriments["fat_100g"]||0, carbs:p.nutriments["carbohydrates_100g"]||0, units:[],
      })));
    } catch(e) { setOnlineRes([]); }
    setLoading(false);
  }

  function selectFood(food, local) {
    setSelected(food); setIsLocal(local);
    if (food.units?.length) {
      setInputMode("unit"); setSelectedUnit(food.units[0]); setUnitCount("1");
    } else {
      setInputMode("grams"); setSelectedUnit(null); setAmount("100");
    }
  }

  function getGrams() {
    if (inputMode === "unit" && selectedUnit) return Math.round(selectedUnit.grams * (parseFloat(unitCount)||1));
    return parseFloat(amount) || 100;
  }

  function handleAdd() {
    if (!selected) return;
    const g = getGrams();
    const n = getNutrients(selected, g);
    onAdd({ name:selected.name, brand:selected.brand||"", amount:g, ...n });
    onClose();
  }

  const inp = { width:"100%", padding:"11px 14px", border:"2px solid "+PK.blush, borderRadius:12, fontSize:15, color:PK.dark, background:PK.pale, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };
  const btnMode = (active) => ({ padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(active?PK.mid:PK.blush), background:active?PK.light:"#fff", color:active?PK.dark:PK.rose });
  const btnQuick = (active) => ({ flex:1, padding:"5px 0", borderRadius:8, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"1px solid "+PK.blush, background:active?PK.light:"#fff", color:active?PK.dark:PK.rose });
  const currentList = isLocal ? localRes : onlineRes;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", maxHeight:"92vh", background:"#fff", borderRadius:"20px 20px 0 0", display:"flex", flexDirection:"column" }}>

        <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>Ieškoti maisto</h3>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"16px", WebkitOverflowScrolling:"touch" }}>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <input style={{ ...inp, flex:1 }} value={query} onChange={e=>setQuery(e.target.value)}
              placeholder="Ieškoti produkto..." onKeyDown={e => { if(e.key==="Enter"&&!isLocal) searchOnline(); }} />
          </div>

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

          {isLocal && !query && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {["Visi",...CATEGORIES].map(cat => (
                <button key={cat} onClick={()=>setCategory(cat)}
                  style={{ padding:"5px 10px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"1px solid "+(category===cat?PK.mid:PK.blush), background:category===cat?PK.light:"#fff", color:category===cat?PK.dark:PK.rose }}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {!isLocal && (
            <button onClick={searchOnline} style={{ width:"100%", padding:"11px 0", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:12 }}>
              {loading ? "Ieškoma..." : "🔍 Ieškoti internete"}
            </button>
          )}

          {selected && (
            <div style={{ background:PK.pale, borderRadius:16, padding:16, marginBottom:14, border:"1px solid "+PK.blush }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:PK.dark }}>{selected.name}</p>
                  {selected.brand && <p style={{ margin:0, fontSize:11, color:PK.rose }}>{selected.brand}</p>}
                </div>
                <button onClick={()=>setSelected(null)} style={{ background:"none", border:"none", color:PK.rose, fontSize:18, cursor:"pointer", marginLeft:8 }}>✕</button>
              </div>

              {selected.units?.length > 0 && (
                <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                  <button onClick={()=>setInputMode("unit")} style={btnMode(inputMode==="unit")}>📦 Vienetai</button>
                  <button onClick={()=>setInputMode("grams")} style={btnMode(inputMode==="grams")}>⚖️ Gramai</button>
                </div>
              )}

              {inputMode === "unit" && selected.units?.length > 0 && (
                <div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                    {selected.units.map((u,i) => (
                      <button key={i} onClick={()=>{ setSelectedUnit(u); setUnitCount("1"); }}
                        style={{ padding:"5px 10px", borderRadius:10, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(selectedUnit===u?PK.mid:PK.blush), background:selectedUnit===u?PK.light:"#fff", color:selectedUnit===u?PK.dark:PK.rose }}>
                        {u.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <input type="number" value={unitCount} step="0.5" min="0.5"
                      onChange={e=>setUnitCount(e.target.value)}
                      style={{ width:70, padding:"8px 10px", border:"2px solid "+PK.blush, borderRadius:10, fontSize:14, fontWeight:700, color:PK.dark, background:"#fff", outline:"none", fontFamily:"inherit", textAlign:"center" }} />
                    <span style={{ fontSize:12, color:PK.rose }}>
                      vnt. = <b style={{ color:PK.dark }}>{Math.round((selectedUnit?.grams||0)*(parseFloat(unitCount)||1))}g</b>
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:5, marginBottom:10 }}>
                    {[0.5,1,1.5,2,3,4].map(n => (
                      <button key={n} onClick={()=>setUnitCount(String(n))} style={btnQuick(unitCount===String(n))}>{n}</button>
                    ))}
                  </div>
                </div>
              )}

              {inputMode === "grams" && (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                      style={{ width:100, padding:"8px 12px", border:"2px solid "+PK.blush, borderRadius:10, fontSize:14, fontWeight:700, color:PK.dark, background:"#fff", outline:"none", fontFamily:"inherit", textAlign:"center" }} />
                    <span style={{ fontSize:13, color:PK.mid, fontWeight:600 }}>gramų</span>
                  </div>
                  <div style={{ display:"flex", gap:5, marginBottom:10 }}>
                    {[50,100,150,200,300].map(g => (
                      <button key={g} onClick={()=>setAmount(String(g))} style={btnQuick(amount===String(g))}>{g}g</button>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const g = getGrams();
                const n = getNutrients(selected, g);
                return (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                    {[{l:"Kalorijos",v:n.kcal,u:"kcal",c:PK.dark},{l:"Baltymai",v:n.protein,u:"g",c:PK.mid},{l:"Riebalai",v:n.fat,u:"g",c:PK.bright},{l:"Angliavandeniai",v:n.carbs,u:"g",c:PK.rose}].map(item => (
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

          {!selected && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {currentList.length === 0 && !loading && (
                <p style={{ textAlign:"center", color:PK.rose, padding:"20px 0", fontSize:13 }}>
                  {isLocal ? "Nerasta vietinėje duomenų bazėje" : "Spausk 'Ieškoti internete'"}
                </p>
              )}
              {currentList.map((food, i) => (
                <button key={food.id||i} onClick={()=>selectFood(food,isLocal)}
                  style={{ padding:"12px 14px", border:"2px solid "+PK.blush, borderRadius:14, background:"#fff", textAlign:"left", cursor:"pointer", fontFamily:"inherit" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:"0 0 3px", fontSize:13, fontWeight:700, color:PK.dark }}>{food.name}</p>
                      {food.brand && <p style={{ margin:"0 0 3px", fontSize:11, color:PK.rose }}>{food.brand}</p>}
                      <p style={{ margin:0, fontSize:11, color:PK.mid }}>{Math.round(food.kcal)} kcal · B:{Math.round(food.protein)}g · R:{Math.round(food.fat)}g · A:{Math.round(food.carbs)}g</p>
                    </div>
                    {food.units?.length > 0 && (
                      <span style={{ fontSize:10, background:PK.light, color:PK.mid, borderRadius:8, padding:"3px 8px", fontWeight:700, whiteSpace:"nowrap", marginLeft:8 }}>
                        {food.units[0].label}
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
  const [date,           setDate]          = useState(today());
  const [entries,        setEntries]       = useState([]);
  const [history,        setHistory]       = useState([]);
  const [activeMeal,     setActiveMeal]    = useState(null);
  const [searching,      setSearching]     = useState(false);
  const [loading,        setLoading]       = useState(true);
  const [tab,            setTab]           = useState("today");
  const [editingId,      setEditingId]     = useState(null);
  const [replacingEntry, setReplacingEntry]= useState(null);

  const loadEntries = useCallback(async () => {
  setLoading(true);
  const data = await pb.collection("food_log").getFullList({ filter: `user_id="${userId}" && date="${date}"`, sort: "created", requestKey: null });
  setEntries(data||[]);
  setLoading(false);
}, [userId, date]);

const loadHistory = useCallback(async () => {
  const data = await pb.collection("food_log").getFullList({ filter: `user_id="${userId}"`, sort: "-date,created", requestKey: null });
  setHistory(data||[]);
}, [userId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { if (tab==="history") loadHistory(); }, [tab, loadHistory]);

  async function addEntry(meal, food) {
    setSearching(false); setActiveMeal(null);
    try {
      await pb.collection("food_log").create({ user_id:userId, date, meal, name:food.name, brand:food.brand||"", amount:food.amount||100, kcal:food.kcal||0, protein:food.protein||0, fat:food.fat||0, carbs:food.carbs||0 });
      loadEntries();
    } catch(e) { console.error("addEntry:", e); }
  }

  async function updateEntry(id, newAmount, per100) {
  const r = newAmount / 100;
  try {
    await pb.collection("food_log").update(id, {
      amount:  newAmount,
      kcal:    Math.round(per100.kcal    * r),
      protein: Math.round(per100.protein * r * 10) / 10,
      fat:     Math.round(per100.fat     * r * 10) / 10,
      carbs:   Math.round(per100.carbs   * r * 10) / 10,
    });
    setEditingId(null);
    loadEntries();
  } catch(e) { console.error("updateEntry:", e); }
}

  async function replaceEntry(id, meal, food) {
  try {
    await pb.collection("food_log").delete(id);
    await pb.collection("food_log").create({ user_id:userId, date, meal, name:food.name, brand:food.brand||"", amount:food.amount||100, kcal:food.kcal||0, protein:food.protein||0, fat:food.fat||0, carbs:food.carbs||0 });
    loadEntries();
  } catch(e) { console.error("replaceEntry:", e); }
}

  async function removeEntry(id) {
  await pb.collection("food_log").delete(id);
  loadEntries();
}

  const totals = entries.reduce((a,e)=>({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }),{ kcal:0,protein:0,fat:0,carbs:0 });
  const historyByDate = history.reduce((acc,e)=>{ if(!acc[e.date]) acc[e.date]=[]; acc[e.date].push(e); return acc; },{});
  const weekHistory = Object.entries(historyByDate).filter(([d])=>isWithinWeek(d)&&d!==today());
  const oldHistory  = Object.entries(historyByDate).filter(([d])=>!isWithinWeek(d));

  function DaySummary({ dateStr, dayEntries }) {
    const t = dayEntries.reduce((a,e)=>({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }),{ kcal:0,protein:0,fat:0,carbs:0 });
    return (
      <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid "+PK.blush }}>
        <p style={{ fontSize:13, fontWeight:700, color:PK.dark, marginBottom:10 }}>{formatDate(dateStr)}</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
          {[{l:"Kalorijos",v:Math.round(t.kcal),u:"kcal",c:PK.dark},{l:"Baltymai",v:Math.round(t.protein),u:"g",c:PK.mid},{l:"Riebalai",v:Math.round(t.fat),u:"g",c:PK.bright},{l:"Angliavandeniai",v:Math.round(t.carbs),u:"g",c:PK.rose}].map(item=>(
            <div key={item.l} style={{ background:"#F9F0F5", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
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
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:"10px 0", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(tab===t.id?PK.mid:PK.blush), background:tab===t.id?"#FCE4EC":"#fff", color:tab===t.id?PK.dark:PK.rose }}>
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
                  {l:"Baltymai", cur:Math.round(totals.protein), tgt:targetMacros.prot.g,   c:"#F8BBD9"},
                  {l:"Riebalai", cur:Math.round(totals.fat),     tgt:targetMacros.fat.g,    c:"#FFB3C6"},
                  {l:"Angliavandeniai",cur:Math.round(totals.carbs),tgt:targetMacros.carb.g,c:"#F48FB1"},
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

          {MEALS.map(meal => {
            const mealEntries = entries.filter(e=>e.meal===meal.id);
            const mealTotals  = mealEntries.reduce((a,e)=>({kcal:a.kcal+(e.kcal||0),protein:a.protein+(e.protein||0)}),{kcal:0,protein:0});
            return (
              <div key={meal.id} style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid "+PK.blush }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:mealEntries.length?10:0 }}>
                  <div>
                    <span style={{ fontSize:14, fontWeight:700, color:PK.dark }}>{meal.label}</span>
                    {mealEntries.length>0 && <span style={{ fontSize:11, color:PK.rose, marginLeft:8 }}>{Math.round(mealTotals.kcal)} kcal · {Math.round(mealTotals.protein)}g B</span>}
                  </div>
                  <button onClick={()=>{setActiveMeal(meal.id);setReplacingEntry(null);setSearching(true);}}
                    style={{ padding:"6px 12px", background:"#FCE4EC", border:"1px solid "+PK.blush, borderRadius:10, fontSize:12, fontWeight:700, color:PK.mid, cursor:"pointer" }}>
                    + Pridėti
                  </button>
                </div>

                <div style={{maxHeight:mealEntries.length>3?"230px":"none",overflowY:mealEntries.length>3?"auto":"visible",WebkitOverflowScrolling:"touch"}}>
                {mealEntries.map(e => (
                  <div key={e.id}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderTop:"1px solid #FFF0F5" }}>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:"0 0 2px", fontSize:13, color:PK.dark, fontWeight:500 }}>{e.name}</p>
                        <p style={{ margin:0, fontSize:11, color:PK.rose }}>{e.amount}g · {e.kcal} kcal · B:{e.protein}g R:{e.fat}g A:{e.carbs}g</p>
                      </div>
                      <div style={{ display:"flex", gap:4 }}>
                        <button
                          onClick={() => setEditingId(editingId === e.id ? null : e.id)}
                          style={{ background:editingId===e.id?"#FCE4EC":"none", border:editingId===e.id?"1px solid "+PK.blush:"none", borderRadius:8, color:PK.mid, fontSize:14, cursor:"pointer", padding:"4px 7px" }}>
                          ✏️
                        </button>
                        <button onClick={() => removeEntry(e.id)}
                          style={{ background:"none", border:"none", color:PK.rose, fontSize:16, cursor:"pointer", padding:"4px 6px" }}>✕</button>
                      </div>
                    </div>

                    {editingId === e.id && (
                      <div>
                        <EntryEditor
                          entry={e}
                          onSave={(newAmount) => updateEntry(e.id, newAmount, getPer100(e))}
                          onClose={() => setEditingId(null)}
                        />
                        <button
                          onClick={() => { setReplacingEntry(e); setActiveMeal(e.meal); setSearching(true); setEditingId(null); }}
                          style={{ width:"100%", padding:"9px 0", marginBottom:8, background:"#fff", border:"2px dashed "+PK.blush, borderRadius:12, fontSize:12, fontWeight:700, color:PK.mid, cursor:"pointer", fontFamily:"inherit" }}>
                          🔄 Pakeisti produktą
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab==="history" && (
        <>
          {weekHistory.length===0 && oldHistory.length===0 ? (
            <div style={{ background:"#FFF0F5", borderRadius:16, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush }}>
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
                      <DaySummary dateStr={d} dayEntries={ents}/>
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
                  {oldHistory.map(([d,ents])=>( <DaySummary key={d} dateStr={d} dayEntries={ents}/> ))}
                </>
              )}
            </>
          )}
        </>
      )}

      {searching && (
        <FoodSearch
          onAdd={food => {
            if (replacingEntry) {
              replaceEntry(replacingEntry.id, replacingEntry.meal, food);
              setReplacingEntry(null);
            } else {
              addEntry(activeMeal, food);
            }
          }}
          onClose={() => { setSearching(false); setActiveMeal(null); setReplacingEntry(null); }}
        />
      )}
    </div>
  );
}