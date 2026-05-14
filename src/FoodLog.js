import React, { useState, useEffect, useCallback, useRef } from "react";
import Quagga from "@ericblade/quagga2";
import { supabase } from "./supabase";
import { ALL_FOODS, searchLocalFoods, CATEGORIES } from "./foodDatabase";
import FoodSearch from "./FoodSearch";

const translateCache = {};
async function translateToLT(text) {
  if (!text || text.length < 2) return text;
  if (translateCache[text]) return translateCache[text];
  const ltPattern = /[ąčęėįšųūž]/i;
  if (ltPattern.test(text)) return text;
  if (/^[0-9\s\-\.,\%\+]+$/.test(text)) return text;
  try {
    const res = await fetch("https://api.mymemory.translated.net/get?q="+encodeURIComponent(text.substring(0,200))+"&langpair=en|lt");
    const data = await res.json();
    const t = data?.responseData?.translatedText;
    if (t && t !== text && !t.includes("MYMEMORY")) { translateCache[text] = t; return t; }
  } catch(e) {}
  return text;
}

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

function todayStr() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) { return new Date(d).toLocaleDateString("lt-LT", { weekday:"short", month:"short", day:"numeric" }); }
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

function BarcodeScanner({ onResult, onClose }) {
  const scannerRef = useRef(null);
  const [started,   setStarted]  = useState(false);
  const [msg,       setMsg]      = useState("Paleidžiama kamera...");
  const [manual,    setManual]   = useState("");
  const [searching, setSearching]= useState(false);
  const detectedRef = useRef(false);

  useEffect(() => {
    let active = true;
    Quagga.init({
      inputStream: {
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width:  { min:640, ideal:1280 },
          height: { min:480, ideal:720 },
          facingMode: "environment",
          aspectRatio: { ideal:1.5 },
        },
        area: { top:"20%", right:"10%", left:"10%", bottom:"20%" },
      },
      locator: { patchSize:"medium", halfSample:true },
      numOfWorkers: 2,
      frequency: 10,
      decoder: {
        readers: ["ean_reader","ean_8_reader","upc_reader","upc_e_reader","code_128_reader","code_39_reader"],
      },
      locate: true,
    }, (err) => {
      if (!active) return;
      if (err) { setMsg("Nepavyko pasiekti kameros: " + err); return; }
      Quagga.start();
      setStarted(true);
      setMsg("Nukreipk kamerą į barkodą");
    });

    Quagga.onDetected((data) => {
      if (!active || detectedRef.current) return;
      const code = data?.codeResult?.code;
      if (!code) return;
      const errors = data?.codeResult?.decodedCodes?.filter(c => c.error !== undefined)?.map(c => c.error) || [];
      const avgError = errors.length ? errors.reduce((a,b) => a+b, 0) / errors.length : 1;
      if (avgError > 0.25) return;
      detectedRef.current = true;
      Quagga.stop();
      setStarted(false);
      lookupBarcode(code);
    });

    return () => {
      active = false;
      try { Quagga.stop(); } catch(e) {}
      try { Quagga.offDetected(); } catch(e) {}
    };
  }, []);

  async function lookupBarcode(code) {
    setSearching(true);
    setMsg("Rastas: " + code + " – ieškoma...");
    try {
      const res  = await fetch("https://world.openfoodfacts.org/api/v0/product/" + code.trim() + ".json");
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const n = p.nutriments || {};
        let name = p.product_name_lt || p.product_name || p.product_name_en || "Nežinomas produktas";
        name = await translateToLT(name);
        onResult({
          name, brand: p.brands || "", amount: 100,
          kcal:    Math.round(n["energy-kcal_100g"] || 0),
          protein: Math.round((n["proteins_100g"]      || 0) * 10) / 10,
          fat:     Math.round((n["fat_100g"]           || 0) * 10) / 10,
          carbs:   Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
        });
        return;
      }
      detectedRef.current = false;
      setMsg("Produktas nerastas (" + code + "). Bandyk dar kartą.");
      setSearching(false);
      Quagga.start();
      setStarted(true);
    } catch(e) {
      setMsg("Klaida. Patikrink internetą.");
      setSearching(false);
      detectedRef.current = false;
    }
  }

  async function handleManual() {
    if (!manual || manual.trim().length < 6) return;
    try { Quagga.stop(); } catch(e) {}
    setStarted(false);
    await lookupBarcode(manual.trim());
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#000", display:"flex", flexDirection:"column" }}>
      <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>📷 Barkodo skenavimas</h3>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"8px 12px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
      </div>
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <div ref={scannerRef} style={{ width:"100%", height:"100%", position:"relative" }}>
          <canvas className="drawingBuffer" style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:1 }} />
        </div>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:2, pointerEvents:"none" }}>
          <div style={{ width:"80%", maxWidth:300, height:100, position:"relative" }}>
            <div style={{ position:"absolute", inset:0, boxShadow:"0 0 0 2000px rgba(0,0,0,0.5)", borderRadius:8 }} />
            <div style={{ position:"absolute", inset:0, border:"3px solid "+(started?PK.rose:"rgba(255,255,255,0.3)"), borderRadius:8, transition:"border-color 0.3s" }}>
              {[{top:0,left:0,bt:"3px 0 0 3px"},{top:0,right:0,bt:"3px 3px 0 0"},{bottom:0,left:0,bt:"0 0 3px 3px"},{bottom:0,right:0,bt:"0 3px 3px 0"}].map((s,i) => (
                <div key={i} style={{ position:"absolute", width:20, height:20, borderStyle:"solid", borderColor:PK.mid, borderWidth:s.bt, ...s }} />
              ))}
            </div>
          </div>
        </div>
        <div style={{ position:"absolute", bottom:120, left:0, right:0, display:"flex", justifyContent:"center", zIndex:3, padding:"0 20px" }}>
          <div style={{ background:"rgba(0,0,0,0.75)", borderRadius:12, padding:"10px 20px", textAlign:"center" }}>
            <p style={{ color:searching?PK.coral:started?PK.blush:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>
              {searching ? "⏳ " : started ? "🟢 " : "⚪ "}{msg}
            </p>
          </div>
        </div>
      </div>
      <div style={{ background:"rgba(0,0,0,0.9)", padding:"16px 20px", flexShrink:0 }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, textAlign:"center", marginBottom:10 }}>arba įvesk barkodą rankiniu būdu</p>
        <div style={{ display:"flex", gap:8 }}>
          <input type="number" value={manual} onChange={e => setManual(e.target.value)} onKeyDown={e => e.key==="Enter" && handleManual()}
            placeholder="pvz. 4008400175478"
            style={{ flex:1, padding:"12px 14px", border:"none", borderRadius:12, fontSize:14, color:PK.dark, background:"rgba(255,255,255,0.92)", outline:"none", fontFamily:"inherit" }} />
          <button onClick={handleManual} disabled={searching}
            style={{ padding:"12px 16px", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Ieškoti
          </button>
        </div>
      </div>
    </div>
  );
}

function MealSection({ entries, onAdd, onRemove }) {
  const [collapsed, setCollapsed] = useState({});
  function toggle(id) { setCollapsed(prev => ({ ...prev, [id]: !prev[id] })); }
  return (
    <>
      {MEALS.map(meal => {
        const me = entries.filter(e => e.meal === meal.id);
        const mT = me.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }), { kcal:0,protein:0,fat:0,carbs:0 });
        const isOpen = !collapsed[meal.id];
        return (
          <div key={meal.id} style={{ background:"#fff", borderRadius:16, marginBottom:10, border:"1px solid "+PK.blush, overflow:"hidden" }}>
            <div style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <button onClick={() => toggle(meal.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:0, flex:1, textAlign:"left", fontFamily:"inherit" }}>
                <span style={{ fontSize:12, color:PK.rose }}>{isOpen?"▼":"▶"}</span>
                <span style={{ fontSize:14, fontWeight:700, color:PK.dark }}>{meal.label}</span>
                {me.length > 0 && <span style={{ fontSize:11, color:PK.rose }}>{Math.round(mT.kcal)} kcal · B:{Math.round(mT.protein)}g · R:{Math.round(mT.fat)}g · A:{Math.round(mT.carbs)}g</span>}
              </button>
              <button onClick={() => onAdd(meal.id)} style={{ padding:"6px 12px", background:PK.light, border:"1px solid "+PK.blush, borderRadius:10, fontSize:12, fontWeight:700, color:PK.mid, cursor:"pointer", flexShrink:0, fontFamily:"inherit" }}>+ Pridėti</button>
            </div>
            {isOpen && (
              <div style={{ borderTop:"1px solid "+PK.light }}>
                {me.length === 0 ? (
                  <p style={{ margin:0, padding:"10px 16px", fontSize:12, color:PK.blush, fontStyle:"italic" }}>Dar nieko nėra</p>
                ) : me.map(e => (
                  <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid "+PK.light }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:"0 0 2px", fontSize:13, color:PK.dark, fontWeight:500 }}>{e.name}</p>
                      <p style={{ margin:0, fontSize:11, color:PK.rose }}>{e.amount}g · {e.kcal} kcal · B:{e.protein}g R:{e.fat}g A:{e.carbs}g</p>
                    </div>
                    <button onClick={() => onRemove(e.id)} style={{ background:"none", border:"none", color:PK.rose, fontSize:20, cursor:"pointer", padding:"0 0 0 8px", lineHeight:1 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function DaySummary({ dateStr, dayEntries }) {
  const t = dayEntries.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }), { kcal:0,protein:0,fat:0,carbs:0 });
  return (
    <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid "+PK.blush }}>
      <p style={{ fontSize:13, fontWeight:700, color:PK.dark, marginBottom:10 }}>{formatDate(dateStr)}</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
        {[{l:"Kalorijos",v:Math.round(t.kcal),u:"kcal",c:PK.dark},{l:"Baltymai",v:Math.round(t.protein),u:"g",c:PK.mid},{l:"Riebalai",v:Math.round(t.fat),u:"g",c:PK.bright},{l:"Angliavandeniai",v:Math.round(t.carbs),u:"g",c:PK.rose}].map(item => (
          <div key={item.l} style={{ background:PK.pale, borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:700, color:item.c }}>{item.v}<span style={{ fontSize:9 }}>{item.u}</span></div>
            <div style={{ fontSize:9, color:PK.rose, marginTop:1 }}>{item.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FoodLog({ userId, targetMacros }) {
  const [date,       setDate]       = useState(todayStr());
  const [entries,    setEntries]    = useState([]);
  const [history,    setHistory]    = useState([]);
  const [activeMeal, setActiveMeal] = useState(null);
  const [searching,  setSearching]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("today");
  const [showBarcode,setShowBarcode]= useState(false);
  const [barcodeFood,setBarcodeFood]= useState(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("food_log").select("*").eq("user_id", userId).eq("date", date).order("created_at");
    setEntries(data || []);
    setLoading(false);
  }, [userId, date]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from("food_log").select("*").eq("user_id", userId).order("date", { ascending:false }).order("created_at");
    setHistory(data || []);
  }, [userId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { if (tab === "history") loadHistory(); }, [tab, loadHistory]);

  // ── BUG FIX: uždaryti modalą PRIEŠ await, try/catch ──────────────────────
  async function addEntry(meal, food) {
    setSearching(false);
    setActiveMeal(null);
    try {
      await supabase.from("food_log").insert({
        user_id:userId, date, meal,
        name:food.name, brand:food.brand||"", amount:food.amount,
        kcal:food.kcal, protein:food.protein, fat:food.fat, carbs:food.carbs,
      });
      loadEntries();
    } catch(e) { console.error("addEntry:", e); }
  }

  async function removeEntry(id) {
    await supabase.from("food_log").delete().eq("id", id);
    loadEntries();
  }

  const totals = entries.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }), { kcal:0,protein:0,fat:0,carbs:0 });
  const historyByDate = history.reduce((acc,e) => { if(!acc[e.date]) acc[e.date]=[]; acc[e.date].push(e); return acc; }, {});
  const weekHistory = Object.entries(historyByDate).filter(([d]) => isWithinWeek(d) && d !== todayStr());
  const oldHistory  = Object.entries(historyByDate).filter(([d]) => !isWithinWeek(d));

  return (
    <div style={{ paddingBottom:24 }}>
      {showBarcode && (
        <BarcodeScanner
          onResult={food => { setShowBarcode(false); setBarcodeFood(food); }}
          onClose={() => setShowBarcode(false)}
        />
      )}
      {searching && (
        <FoodSearch
          onAdd={food => addEntry(activeMeal, food)}
          onClose={() => { setSearching(false); setActiveMeal(null); }}
          onBarcode={() => setShowBarcode(true)}
          barcodeFood={barcodeFood}
          clearBarcodeFood={() => setBarcodeFood(null)}
        />
      )}

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{id:"today",l:"Šiandien"},{id:"history",l:"Istorija"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:"10px 0", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(tab===t.id?PK.mid:PK.blush), background:tab===t.id?PK.light:"#fff", color:tab===t.id?PK.dark:PK.rose }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <>
          <div style={{ background:"#fff", borderRadius:16, padding:"12px 16px", marginBottom:12, border:"1px solid "+PK.blush, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:PK.mid }}>Data:</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ border:"none", background:"none", fontSize:14, color:PK.dark, fontFamily:"inherit", outline:"none", flex:1 }} />
          </div>

          {targetMacros && (
            <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:16, marginBottom:12 }}>
              <p style={{ color:"#fff", fontSize:13, fontWeight:700, marginBottom:12, textAlign:"center" }}>Dienos pažanga</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                {[{l:"Kalorijos",cur:Math.round(totals.kcal),tgt:targetMacros.target,c:"#fff"},{l:"Baltymai",cur:Math.round(totals.protein),tgt:targetMacros.prot.g,c:PK.blush},{l:"Riebalai",cur:Math.round(totals.fat),tgt:targetMacros.fat.g,c:PK.coral},{l:"Angliavandeniai",cur:Math.round(totals.carbs),tgt:targetMacros.carb.g,c:PK.rose}].map(item => {
                  const pct = item.tgt ? Math.min(100, Math.round(item.cur/item.tgt*100)) : 0;
                  const over = item.tgt && item.cur > item.tgt;
                  return (
                    <div key={item.l} style={{ background:"rgba(255,255,255,0.13)", borderRadius:12, padding:"10px 6px", textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:over?"#FFD700":item.c }}>{item.cur}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)" }}>/ {item.tgt}</div>
                      <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:4, margin:"6px 0 4px" }}>
                        <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:over?"#FFD700":item.c }} />
                      </div>
                      <div style={{ fontSize:9, color:over?"#FFD700":item.c, fontWeight:700 }}>{pct}%</div>
                      <div style={{ fontSize:8, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{item.l}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? <p style={{ textAlign:"center", color:PK.rose, padding:"20px 0" }}>Kraunama...</p> : (
            <MealSection entries={entries} onAdd={mealId => { setActiveMeal(mealId); setSearching(true); }} onRemove={removeEntry} />
          )}
        </>
      )}

      {tab === "history" && (
        <>
          {weekHistory.length===0 && oldHistory.length===0 ? (
            <div style={{ background:PK.pale, borderRadius:16, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🌸</div>
              <p style={{ color:PK.rose, fontSize:14 }}>Dar nėra istorijos</p>
            </div>
          ) : (
            <>
              {weekHistory.length > 0 && (
                <>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:PK.mid, marginBottom:10 }}>Ši savaitė</p>
                  {weekHistory.map(([d,ents]) => (
                    <div key={d}>
                      <DaySummary dateStr={d} dayEntries={ents} />
                      {ents.map(e => (
                        <div key={e.id} style={{ padding:"5px 16px 5px 24px", borderLeft:"2px solid "+PK.blush, marginBottom:3 }}>
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
                  {oldHistory.map(([d,ents]) => <DaySummary key={d} dateStr={d} dayEntries={ents} />)}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}