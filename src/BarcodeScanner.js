import { useState, useEffect, useRef } from "react";
import Quagga from "@ericblade/quagga2";

const PK = {
  dark:"#6D1B3B", mid:"#AD1457",
  rose:"#F48FB1", blush:"#F8BBD9", coral:"#FFB3C6",
};

const FORMATS = ["ean_13","ean_8","upc_a","upc_e","code_128","code_39"];

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

// ── Natyvinis BarcodeDetector (greitas) ──────────────────────────────────────
function NativeScanner({ onDetected, onError }) {
  const videoRef = useRef(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    let stream = null;
    let animId = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width:  { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (!activeRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new window.BarcodeDetector({ formats: FORMATS });

        async function scan() {
          if (!activeRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) {
              onDetected(results[0].rawValue);
              return; // sustabdome ciklą
            }
          } catch(e) {}
          animId = requestAnimationFrame(scan);
        }
        scan();
      } catch(e) {
        onError("Nepavyko pasiekti kameros: " + e.message);
      }
    }

    start();

    return () => {
      activeRef.current = false;
      cancelAnimationFrame(animId);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
    />
  );
}

// ── Quagga atsarginis variantas ───────────────────────────────────────────────
function QuaggaScanner({ onDetected, onError }) {
  const containerRef = useRef(null);
  const detectedRef  = useRef(false);

  useEffect(() => {
    let active = true;
    Quagga.init({
      inputStream: {
        type: "LiveStream",
        target: containerRef.current,
        constraints: {
          facingMode: "environment",
          width:  { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      locator:    { patchSize:"medium", halfSample:true },
      numOfWorkers: 2,
      frequency:  10,
      decoder:    { readers:["ean_reader","ean_8_reader","upc_reader","upc_e_reader","code_128_reader"] },
      locate:     true,
    }, err => {
      if (!active) return;
      if (err) { onError("Klaida: " + err); return; }
      Quagga.start();
    });

    Quagga.onDetected(data => {
      if (!active || detectedRef.current) return;
      const code   = data?.codeResult?.code;
      if (!code) return;
      const errors = data?.codeResult?.decodedCodes?.filter(c=>c.error!==undefined)?.map(c=>c.error)||[];
      const avg    = errors.length ? errors.reduce((a,b)=>a+b,0)/errors.length : 1;
      if (avg > 0.22) return;
      detectedRef.current = true;
      onDetected(code);
    });

    return () => {
      active = false;
      try { Quagga.stop(); }       catch(e) {}
      try { Quagga.offDetected(); } catch(e) {}
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width:"100%", height:"100%", position:"relative" }}>
      <canvas className="drawingBuffer" style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:1 }} />
    </div>
  );
}

// ── Pagrindinis komponentas ───────────────────────────────────────────────────
export default function BarcodeScanner({ onResult, onClose }) {
  const [msg,       setMsg]       = useState("Paleidžiama kamera...");
  const [msgType,   setMsgType]   = useState("info");
  const [searching, setSearching] = useState(false);
  const [manual,    setManual]    = useState("");
  const [ready,     setReady]     = useState(false);
  const [key,       setKey]       = useState(0); // perkrauti skenerį

  const useNative = typeof window !== "undefined" && "BarcodeDetector" in window;

  useEffect(() => {
    // Trumpa pauzė kad DOM susimontruotų
    const t = setTimeout(() => {
      setReady(true);
      setMsg(useNative ? "Nukreipk kamerą į barkodą" : "Nukreipk kamerą į barkodą (Quagga)");
    }, 300);
    return () => clearTimeout(t);
  }, [key]);

  async function handleDetected(code) {
    setSearching(true);
    setMsg("Rastas! Ieškoma...");
    setMsgType("success");
    await lookupBarcode(code);
  }

  function handleError(err) {
    setMsg(err);
    setMsgType("error");
  }

  async function lookupBarcode(code) {
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
      setMsg("Produktas nerastas. Bandyk dar kartą.");
      setMsgType("error");
      setSearching(false);
      setReady(false);
      setKey(k => k + 1); // restart scanner
    } catch(e) {
      setMsg("Klaida. Patikrink internetą.");
      setMsgType("error");
      setSearching(false);
    }
  }

  async function handleManual() {
    const code = manual.trim();
    if (code.length < 6) return;
    setReady(false);
    setSearching(true);
    await lookupBarcode(code);
  }

  function handleRetry() {
    setSearching(false);
    setMsg("Nukreipk kamerą į barkodą");
    setMsgType("info");
    setReady(false);
    setKey(k => k + 1);
  }

  const msgColor = msgType === "error" ? PK.coral : msgType === "success" ? "#7FFFB0" : PK.blush;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#000", display:"flex", flexDirection:"column" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          <h3 style={{ color:"#fff", margin:"0 0 2px", fontSize:16, fontWeight:700 }}>📷 Barkodo skenavimas</h3>
          <p style={{ color:"rgba(255,255,255,0.5)", margin:0, fontSize:10 }}>
            {useNative ? "⚡ Greitas natyvinis skeneris" : "Quagga skeneris"}
          </p>
        </div>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"8px 12px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
      </div>

      {/* Kameros sritis */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        {ready && !searching && (
          <div key={key} style={{ position:"absolute", inset:0 }}>
            {useNative
              ? <NativeScanner onDetected={handleDetected} onError={handleError} />
              : <QuaggaScanner onDetected={handleDetected} onError={handleError} />
            }
          </div>
        )}

        {/* Taikinys */}
        <div style={{ position:"absolute", inset:0, zIndex:2, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ width:"85%", maxWidth:320, height:110, position:"relative" }}>
            <div style={{ position:"absolute", inset:0, boxShadow:"0 0 0 2000px rgba(0,0,0,0.5)", borderRadius:10 }} />
            <div style={{ position:"absolute", inset:0, border:"2px solid "+(ready&&!searching?PK.rose:"rgba(255,255,255,0.2)"), borderRadius:10, transition:"border-color 0.3s" }} />
            {/* Kampai */}
            {[[{top:0,left:0},{borderTop:"3px solid "+PK.mid,borderLeft:"3px solid "+PK.mid}],
              [{top:0,right:0},{borderTop:"3px solid "+PK.mid,borderRight:"3px solid "+PK.mid}],
              [{bottom:0,left:0},{borderBottom:"3px solid "+PK.mid,borderLeft:"3px solid "+PK.mid}],
              [{bottom:0,right:0},{borderBottom:"3px solid "+PK.mid,borderRight:"3px solid "+PK.mid}],
            ].map(([pos,border],i) => (
              <div key={i} style={{ position:"absolute", width:22, height:22, ...pos, ...border }} />
            ))}
            {/* Skenavimo linija */}
            {ready && !searching && (
              <div style={{
                position:"absolute", left:4, right:4, height:2,
                background:"linear-gradient(90deg,transparent,"+PK.rose+",transparent)",
                animation:"scanLine 1.6s ease-in-out infinite",
              }} />
            )}
          </div>
        </div>

        {/* Statusas */}
        <div style={{ position:"absolute", bottom:130, left:0, right:0, zIndex:3, display:"flex", flexDirection:"column", alignItems:"center", gap:10, padding:"0 20px" }}>
          <div style={{ background:"rgba(0,0,0,0.72)", borderRadius:12, padding:"9px 18px" }}>
            <p style={{ color:msgColor, fontSize:13, margin:0, textAlign:"center" }}>
              {searching ? "⏳ " : ready ? "🟢 " : "⚪ "}{msg}
            </p>
          </div>
          {!searching && ready && (
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

      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; }
          50%  { top: 82%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}
