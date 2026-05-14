import React, { useState, useEffect, useRef } from "react";
import Quagga from "@ericblade/quagga2";
import { ALL_FOODS, searchLocalFoods, CATEGORIES } from "./foodDatabase";

const PK = {
  dark:"#6D1B3B", mid:"#AD1457", bright:"#E91E8C",
  rose:"#F48FB1", blush:"#F8BBD9", light:"#FCE4EC",
  pale:"#FFF0F5", coral:"#FFB3C6", water:"#5BB8D4",
};

function getNutrients(food, grams) {
  const r = grams / 100;
  return {
    kcal:    Math.round((food.kcal    || 0) * r),
    protein: Math.round((food.protein || 0) * r * 10) / 10,
    fat:     Math.round((food.fat     || 0) * r * 10) / 10,
    carbs:   Math.round((food.carbs   || 0) * r * 10) / 10,
  };
}

// Vertimas (cache)
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

function FoodSearch({ onAdd, onClose, onBarcode, barcodeFood, clearBarcodeFood }) {
  const [query,      setQuery]    = useState("");
  const [localRes,   setLocalRes] = useState(ALL_FOODS.slice(0, 15));
  const [onlineRes,  setOnlineRes]= useState([]);
  const [usdaRes,    setUsdaRes]  = useState([]);
  const [loading,    setLoading]  = useState(false);
  const [selected,   setSelected] = useState(null);
  const [amount,     setAmount]   = useState("100");
  const [unit,       setUnit]     = useState(null);
  const [category,   setCategory] = useState("Visi");

  useEffect(() => {
    if (!query) {
      setLocalRes(category === "Visi" ? ALL_FOODS.slice(0,15) : ALL_FOODS.filter(f => f.category === category).slice(0,15));
    } else {
      setLocalRes(searchLocalFoods(query));
    }
  }, [query, category]);

  useEffect(() => {
    if (barcodeFood) {
      setSelected({ id:"bc_"+Date.now(), ...barcodeFood, units:[] });
      setUnit(null); setAmount("100");
      clearBarcodeFood();
    }
  }, [barcodeFood]);

  useEffect(() => {
    if (!query || query.length < 2) { setOnlineRes([]); setUsdaRes([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("https://world.openfoodfacts.org/cgi/search.pl?search_terms="+encodeURIComponent(query)+"&search_simple=1&action=process&json=1&page_size=6&fields=product_name,nutriments,brands,code");
        const data = await res.json();
        const offProducts = (data.products||[]).filter(p => p.product_name && p.nutriments?.["energy-kcal_100g"]);
        const offMapped = await Promise.all(offProducts.map(async p => ({
          id:"off_"+p.code,
          name: await translateToLT(p.product_name_lt || p.product_name || p.product_name_en || p.product_name),
          brand:p.brands||"", category:"Supakuoti",
          kcal:p.nutriments["energy-kcal_100g"]||0, protein:p.nutriments["proteins_100g"]||0,
          fat:p.nutriments["fat_100g"]||0, carbs:p.nutriments["carbohydrates_100g"]||0, units:[], source:"off",
        })));
        setOnlineRes(offMapped);
      } catch(e) { setOnlineRes([]); }
      try {
        const KEY = process.env.REACT_APP_USDA_KEY;
        const res = await fetch("https://api.nal.usda.gov/fdc/v1/foods/search?api_key="+KEY+"&query="+encodeURIComponent(query)+"&pageSize=6&dataType=SR%20Legacy,Foundation,Branded");
        const data = await res.json();
        const usdaMapped = await Promise.all((data.foods||[]).map(async f => {
          const get = name => { const n=(f.foodNutrients||[]).find(x=>x.nutrientName===name||x.nutrientName?.startsWith(name)); return Math.round((n?.value||0)*10)/10; };
          return { id:"usda_"+f.fdcId, name: await translateToLT(f.description), brand:f.brandOwner||"", category:"USDA", kcal:get("Energy"), protein:get("Protein"), fat:get("Total lipid"), carbs:get("Carbohydrate"), units:[], source:"usda" };
        }));
        setUsdaRes(usdaMapped);
      } catch(e) { setUsdaRes([]); }
      setLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, [query]);

  function selectFood(food) { setSelected(food); setUnit(food.units?.length ? food.units[0] : null); setAmount("100"); }
  function getGrams() { return unit ? unit.grams : (parseFloat(amount) || 100); }

  // ── BUG FIX: iškart uždaryti modalą, tada išsaugoti ──────────────────────
  function handleAdd() {
    if (!selected) return;
    const g = getGrams();
    const n = getNutrients(selected, g);
    onAdd({ name:selected.name, brand:selected.brand||"", amount:g, ...n });
    onClose(); // ← uždaryti iškarto, nesaugant laukimo
  }

  const inp = { width:"100%", padding:"11px 14px", border:"2px solid "+PK.blush, borderRadius:12, fontSize:15, color:PK.dark, background:PK.pale, outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  function FoodBtn({ food }) {
    return (
      <button onClick={() => selectFood(food)} style={{ padding:"12px 14px", border:"2px solid "+PK.blush, borderRadius:14, background:"#fff", textAlign:"left", cursor:"pointer", fontFamily:"inherit", width:"100%", display:"block", marginBottom:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:PK.dark }}>{food.name}</p>
            {food.brand && <p style={{ margin:"0 0 2px", fontSize:11, color:PK.rose }}>{food.brand}</p>}
            <p style={{ margin:0, fontSize:11, color:PK.mid }}>{Math.round(food.kcal)} kcal · B:{Math.round(food.protein)}g · R:{Math.round(food.fat)}g · A:{Math.round(food.carbs)}g <span style={{ color:PK.rose }}>/100g</span></p>
          </div>
          {food.source==="usda" && <span style={{ fontSize:9, background:"#ECFDF5", color:"#059669", borderRadius:6, padding:"2px 6px", fontWeight:700, marginLeft:8, flexShrink:0 }}>USDA</span>}
          {food.source==="off"  && <span style={{ fontSize:9, background:"#EEF2FF", color:"#4F46E5", borderRadius:6, padding:"2px 6px", fontWeight:700, marginLeft:8, flexShrink:0 }}>OFF</span>}
        </div>
      </button>
    );
  }

  return (
    <>
      <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"flex-end" }}>
        <div style={{ width:"100%", maxHeight:"92vh", background:"#fff", borderRadius:"20px 20px 0 0", display:"flex", flexDirection:"column" }}>
          <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0, borderRadius:"20px 20px 0 0" }}>
            <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>Ieškoti maisto</h3>
            <div style={{ display:"flex", gap:8 }}>
              {onBarcode && <button onClick={onBarcode} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", cursor:"pointer", fontSize:16 }}>📷</button>}
              <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
            </div>
          </div>
          <div style={{ overflowY:"auto", flex:1, padding:"16px" }}>
            <div style={{ position:"relative", marginBottom:12 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:16 }}>🔍</span>
              <input style={{ ...inp, paddingLeft:36 }} value={query} onChange={e => { setQuery(e.target.value); setSelected(null); }} placeholder="Ieškoti produkto..." />
              {loading && <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:12, color:PK.rose }}>⏳</span>}
            </div>
            {!query && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                {["Visi",...CATEGORIES].map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)} style={{ padding:"5px 10px", borderRadius:20, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"1px solid "+(category===cat?PK.mid:PK.blush), background:category===cat?PK.light:"#fff", color:category===cat?PK.dark:PK.rose }}>{cat}</button>
                ))}
              </div>
            )}
            {selected && (
              <div style={{ background:PK.pale, borderRadius:16, padding:16, marginBottom:14, border:"1px solid "+PK.blush }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:"0 0 6px", fontSize:11, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.08em" }}>Pavadinimas (galima redaguoti)</p>
                    <input value={selected.name} onChange={e => setSelected(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width:"100%", padding:"8px 10px", border:"2px solid "+PK.blush, borderRadius:10, fontSize:13, color:PK.dark, background:"#fff", outline:"none", fontFamily:"inherit", boxSizing:"border-box", marginBottom:4 }} />
                    {selected.brand && <p style={{ margin:0, fontSize:11, color:PK.rose }}>{selected.brand}</p>}
                    <p style={{ margin:"4px 0 0", fontSize:11, color:PK.mid }}>{Math.round(selected.kcal)} kcal · B:{Math.round(selected.protein)}g · R:{Math.round(selected.fat)}g · A:{Math.round(selected.carbs)}g / 100g</p>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:PK.rose, fontSize:18, cursor:"pointer", marginLeft:8 }}>✕</button>
                </div>
                {selected.units?.length > 0 && (
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                    {selected.units.map((u,i) => (
                      <button key={i} onClick={() => { setUnit(u); setAmount(""); }}
                        style={{ padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(unit===u?PK.mid:PK.blush), background:unit===u?PK.light:"#fff", color:unit===u?PK.dark:PK.rose }}>
                        {u.label}
                      </button>
                    ))}
                    <button onClick={() => { setUnit(null); setAmount("100"); }}
                      style={{ padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(!unit?PK.mid:PK.blush), background:!unit?PK.light:"#fff", color:!unit?PK.dark:PK.rose }}>
                      Gramai
                    </button>
                  </div>
                )}
                {!unit && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inp, width:100, padding:"8px 12px" }} placeholder="100" />
                    <span style={{ fontSize:13, color:PK.mid, fontWeight:600 }}>gramų</span>
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
                <button onClick={handleAdd}
                  style={{ width:"100%", padding:"13px 0", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                  Pridėti į žurnalą
                </button>
              </div>
            )}
            {!selected && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {localRes.length > 0 && (<>{query && <p style={{ fontSize:10, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.1em", margin:"4px 0" }}>Mūsų duomenų bazė</p>}{localRes.map(f => <FoodBtn key={f.id} food={f} />)}</>)}
                {onlineRes.length > 0 && (<><p style={{ fontSize:10, fontWeight:700, color:"#4F46E5", textTransform:"uppercase", letterSpacing:"0.1em", margin:"8px 0 4px" }}>Open Food Facts</p>{onlineRes.map(f => <FoodBtn key={f.id} food={f} />)}</>)}
                {usdaRes.length > 0 && (<><p style={{ fontSize:10, fontWeight:700, color:"#059669", textTransform:"uppercase", letterSpacing:"0.1em", margin:"8px 0 4px" }}>USDA (400,000+ produktų)</p>{usdaRes.map(f => <FoodBtn key={f.id} food={f} />)}</>)}
                {query && localRes.length===0 && onlineRes.length===0 && usdaRes.length===0 && !loading && (
                  <p style={{ textAlign:"center", color:PK.rose, padding:"20px 0", fontSize:13 }}>Nerasta produktų</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default FoodSearch;