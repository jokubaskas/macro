import { useState, useEffect, useRef, useCallback } from "react";
import Quagga from "@ericblade/quagga2";

const PK = {
  dark:"#6D1B3B", mid:"#AD1457",
  rose:"#F48FB1", blush:"#F8BBD9", coral:"#FFB3C6",
};

async function translateToLT(text) {
  if (!text || text.length < 2) return text;
  if (/[ąčęėįšųūž]/i.test(text)) return text;
  if (/^[0-9\s\-\.,\%\+]+$/.test(text)) return text;
  try {
    const res  = await fetch("https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text.substring(0,200)) + "&langpair=en|lt");
    const data = await res.json();
    const t    = data?.responseData?.translatedText;
    if (t && t !== text && !t.includes("MYMEMORY")) return t;
  } catch(e) {}
  return text;
}

export default function BarcodeScanner({ onResult, onClose }) {
  const scannerRef  = useRef(null);
  const detectedRef = useRef(false);
  const activeRef   = useRef(true);

  const [started,   setStarted]   = useState(false);
  const [msg,       setMsg]       = useState("Paleidžiama kamera...");
  const [msgType,   setMsgType]   = useState("info"); // info | success | error
  const [manual,    setManual]    = useState("");
  const [searching, setSearching] = useState(false);

  const startQuagga = useCallback(() => {
    detectedRef.current = false;
    Quagga.init({
      inputStream: {
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width:  { min:640, ideal:1920 },
          height: { min:480, ideal:1080 },
          facingMode: "environment",
          aspectRatio: { ideal:1.777 },
        },
        area: { top:"25%", right:"5%", left:"5%", bottom:"25%" },
      },
      locator:    { patchSize:"large", halfSample:false },
      numOfWorkers: navigator.hardwareConcurrency ? Math.min(navigator.hardwareConcurrency, 4) : 2,
      frequency:  15,
      decoder: {
        readers: ["ean_reader","ean_8_reader","upc_reader","upc_e_reader","code_128_reader","code_39_reader"],
        multiple: false,
      },
      locate: true,
    }, (err) => {
      if (!activeRef.current) return;
      if (err) {
        setMsg("Nepavyko pasiekti kameros");
        setMsgType("error");
        return;
      }
      Quagga.start();
      setStarted(true);
      setMsg("Nukreipk kamerą į barkodą");
      setMsgType("info");
    });

    Quagga.onDetected((data) => {
      if (!activeRef.current || detectedRef.current) return;
      const code   = data?.codeResult?.code;
      if (!code) return;
      const errors = data?.codeResult?.decodedCodes?.filter(c => c.error !== undefined)?.map(c => c.error) || [];
      const avg    = errors.length ? errors.reduce((a,b)=>a+b,0)/errors.length : 1;
      if (avg > 0.20) return; // griežtesnis slenkstis
      detectedRef.current = true;
      Quagga.stop();
      setStarted(false);
      lookupBarcode(code);
    });
  }, []);

  useEffect(() => {
    activeRef.current = true;
    startQuagga();
    return () => {
      activeRef.current = false;
      try { Quagga.stop(); }    catch(e) {}
      try { Quagga.offDetected(); } catch(e) {}
    };
  }, [startQuagga]);

  async function lookupBarcode(code) {
    setSearching(true);
    setMsg("Rastas barkodas – ieškoma...");
    setMsgType("success");
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
      // Produktas nerastas – leisti skenuoti dar kartą
      setMsg("Produktas nerastas. Bandyk dar kartą.");
      setMsgType("error");
      setSearching(false);
      detectedRef.current = false;
      Quagga.start();
      setStarted(true);
    } catch(e) {
      setMsg("Klaida. Patikrink internetą.");
      setMsgType("error");
      setSearching(false);
      detectedRef.current = false;
    }
  }

  function handleRetry() {
    detectedRef.current = false;
    setMsg("Nukreipk kamerą į barkodą");
    setMsgType("info");
    try { Quagga.start(); setStarted(true); } catch(e) {}
  }

  async function handleManual() {
    const code = manual.trim();
    if (code.length < 6) return;
    try { Quagga.stop(); } catch(e) {}
    setStarted(false);
    await lookupBarcode(code);
  }

  const msgColor = msgType === "error" ? PK.coral : msgType === "success" ? "#7FFFB0" : PK.blush;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#000", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>📷 Barkodo skenavimas</h3>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"8px 12px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
      </div>

      {/* Kamera */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <div ref={scannerRef} style={{ width:"100%", height:"100%", position:"relative" }}>
          <canvas className="drawingBuffer" style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:1 }} />
        </div>

        {/* Taikinys */}
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:2, pointerEvents:"none" }}>
          <div style={{ width:"85%", maxWidth:320, height:110, position:"relative" }}>
            <div style={{ position:"absolute", inset:0, boxShadow:"0 0 0 2000px rgba(0,0,0,0.52)", borderRadius:10 }} />
            <div style={{ position:"absolute", inset:0, border:"2.5px solid "+(started?PK.rose:"rgba(255,255,255,0.25)"), borderRadius:10, transition:"border-color 0.3s" }}>
              {/* Kampų akcentai */}
              {[{t:0,l:0,br:"0"},{t:0,r:0,bl:"0"},{b:0,l:0,tr:"0"},{b:0,r:0,tl:"0"}].map((s,i)=>(
                <div key={i} style={{ position:"absolute", width:22, height:22,
                  borderTop: (s.t===0) ? "3px solid "+PK.mid : "none",
                  borderBottom: (s.b===0) ? "3px solid "+PK.mid : "none",
                  borderLeft: (s.l===0) ? "3px solid "+PK.mid : "none",
                  borderRight: (s.r===0) ? "3px solid "+PK.mid : "none",
                  top:s.t, bottom:s.b, left:s.l, right:s.r,
                }} />
              ))}
            </div>
            {/* Skenavimo linija */}
            {started && !searching && (
              <div style={{
                position:"absolute", left:4, right:4, height:2,
                background:"linear-gradient(90deg,transparent,"+PK.rose+",transparent)",
                animation:"scanLine 1.8s ease-in-out infinite",
                top:"50%",
              }} />
            )}
          </div>
        </div>

        {/* Statusas + retry */}
        <div style={{ position:"absolute", bottom:130, left:0, right:0, zIndex:3, display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"0 20px" }}>
          <div style={{ background:"rgba(0,0,0,0.72)", borderRadius:12, padding:"10px 20px", textAlign:"center" }}>
            <p style={{ color:msgColor, fontSize:13, margin:0 }}>
              {searching ? "⏳ " : started ? "🟢 " : "⚪ "}{msg}
            </p>
          </div>
          {/* Retry mygtukas – visada matomas kol kamera veikia arba po klaidos */}
          {!searching && (
            <button onClick={handleRetry}
              style={{ background:"rgba(173,20,87,0.85)", border:"1.5px solid "+PK.rose, borderRadius:10, padding:"8px 20px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              🔄 Bandyti dar kartą
            </button>
          )}
        </div>
      </div>

      {/* Rankinis įvedimas */}
      <div style={{ background:"rgba(0,0,0,0.9)", padding:"16px 20px", flexShrink:0 }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, textAlign:"center", marginBottom:10 }}>arba įvesk barkodą rankiniu būdu</p>
        <div style={{ display:"flex", gap:8 }}>
          <input
            type="number"
            value={manual}
            onChange={e => setManual(e.target.value)}
            onKeyDown={e => e.key==="Enter" && handleManual()}
            placeholder="pvz. 4008400175478"
            style={{ flex:1, padding:"12px 14px", border:"none", borderRadius:12, fontSize:14, color:PK.dark, background:"rgba(255,255,255,0.92)", outline:"none", fontFamily:"inherit" }}
          />
          <button onClick={handleManual} disabled={searching}
            style={{ padding:"12px 16px", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", opacity:searching?0.6:1 }}>
            Ieškoti
          </button>
        </div>
      </div>

      {/* CSS animacija skenavimo linijai */}
      <style>{`
        @keyframes scanLine {
          0%   { top: 15%; opacity: 0.3; }
          50%  { top: 80%; opacity: 1;   }
          100% { top: 15%; opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
