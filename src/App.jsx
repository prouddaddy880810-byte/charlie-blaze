import { useState, useMemo, useEffect } from "react";

/* ============================================================
   CHARLIE BLAZE — CERTIFICATE OF TASTE ANALYSIS  (LIVE)
   Level B: fetches the Purchases tab live via Apps Script.
   Falls back to a baked snapshot if the endpoint is
   unreachable (e.g. inside the Claude artifact preview).

   SETUP: paste your Apps Script /exec URL below, deploy
   this to Vercel (charlie-blaze repo), done — the page is
   always current with the 6 AM auto-sync.
   ============================================================ */

const APPS_SCRIPT_URL = "PASTE_YOUR_EXEC_URL_HERE";
//                       ^ from Deploy ▸ New deployment ▸ Web app

/* ---------- strain knowledge graph ---------- */
const STRAINS = {
  "Blue Dream":{terps:["myrcene","pinene","caryophyllene"],flavor:["berry","sweet","herbal"],effects:["euphoric","creative","uplifted","relaxed"],lean:"Sativa Hybrid"},
  "Blue Unicorn":{terps:["limonene","caryophyllene","myrcene"],flavor:["berry","citrus","sweet"],effects:["uplifted","euphoric","relaxed"],lean:"Hybrid"},
  "Lemon Sunshine":{terps:["limonene","terpinolene","caryophyllene"],flavor:["citrus","lemon","sweet"],effects:["uplifted","energetic","happy"],lean:"Sativa Hybrid"},
  "Lemon Sportiff":{terps:["limonene","caryophyllene","pinene"],flavor:["citrus","lemon","earthy"],effects:["uplifted","focused","energetic"],lean:"Hybrid"},
  "Super Lemon G":{terps:["limonene","terpinolene","caryophyllene"],flavor:["citrus","lemon","sweet"],effects:["uplifted","energetic","creative"],lean:"Sativa"},
  "Zkittlez":{terps:["caryophyllene","limonene","humulene"],flavor:["candy","tropical","berry"],effects:["calm","happy","relaxed"],lean:"Indica Hybrid"},
  "Sour Diesel":{terps:["caryophyllene","limonene","myrcene"],flavor:["diesel","citrus","pungent"],effects:["energetic","uplifted","creative"],lean:"Sativa"},
  "Blueberry":{terps:["myrcene","caryophyllene","pinene"],flavor:["berry","sweet"],effects:["relaxed","euphoric","happy"],lean:"Indica Hybrid"},
  "Blackberry Larry":{terps:["caryophyllene","limonene","myrcene"],flavor:["berry","diesel","earthy"],effects:["relaxed","happy","euphoric"],lean:"Hybrid"},
  "Cannalope Haze":{terps:["terpinolene","myrcene","ocimene"],flavor:["melon","citrus","sweet"],effects:["energetic","uplifted","creative"],lean:"Sativa"},
  "Lilac Diesel":{terps:["myrcene","limonene","caryophyllene"],flavor:["floral","diesel","citrus"],effects:["uplifted","euphoric","focused"],lean:"Hybrid"},
  "London Pound Cake":{terps:["caryophyllene","limonene","linalool"],flavor:["berry","citrus","sweet"],effects:["relaxed","euphoric","calm"],lean:"Indica Hybrid"},
  "White Gushers":{terps:["caryophyllene","limonene","myrcene"],flavor:["tropical","candy","sweet"],effects:["relaxed","happy","euphoric"],lean:"Indica Hybrid"},
  "Strawberry Cookies OG":{terps:["caryophyllene","limonene","humulene"],flavor:["berry","sweet","earthy"],effects:["relaxed","happy","uplifted"],lean:"Indica Hybrid"},
  "Atomic Pop":{terps:["limonene","caryophyllene","myrcene"],flavor:["candy","citrus","sweet"],effects:["uplifted","happy","euphoric"],lean:"Hybrid"},
  "Blue Cheese":{terps:["myrcene","caryophyllene","pinene"],flavor:["berry","cheese","earthy"],effects:["relaxed","calm","happy"],lean:"Indica"},
  "Gorilla Pie":{terps:["caryophyllene","limonene","myrcene"],flavor:["earthy","gas","sweet"],effects:["relaxed","euphoric","sleepy"],lean:"Indica Hybrid"},
  "Glue Cake":{terps:["myrcene","caryophyllene","limonene"],flavor:["berry","gas","sweet"],effects:["relaxed","euphoric","happy"],lean:"Indica Hybrid"},
  "Alien OG":{terps:["myrcene","limonene","caryophyllene"],flavor:["lemon","pine","earthy"],effects:["relaxed","euphoric","sleepy"],lean:"Indica Hybrid"},
  "Runtz":{terps:["caryophyllene","limonene","linalool"],flavor:["candy","fruit","sweet"],effects:["euphoric","relaxed","happy"],lean:"Hybrid"},
  "Blue Rntz":{terps:["caryophyllene","limonene","myrcene"],flavor:["berry","candy","sweet"],effects:["euphoric","relaxed","happy"],lean:"Hybrid"},
  "Triple Burger":{terps:["caryophyllene","limonene","humulene"],flavor:["gas","cheese","earthy"],effects:["relaxed","euphoric","sleepy"],lean:"Indica"},
  "Ghost OG":{terps:["myrcene","limonene","caryophyllene"],flavor:["earthy","pine","lemon"],effects:["relaxed","euphoric","calm"],lean:"Indica Hybrid"},
  "OG Kush":{terps:["myrcene","limonene","caryophyllene"],flavor:["earthy","pine","lemon"],effects:["relaxed","euphoric","happy"],lean:"Hybrid"},
  "Purple Chem":{terps:["caryophyllene","myrcene","limonene"],flavor:["diesel","grape","earthy"],effects:["relaxed","euphoric","calm"],lean:"Hybrid"},
  "RS-11":{terps:["caryophyllene","limonene","humulene"],flavor:["cherry","gas","floral"],effects:["relaxed","euphoric","happy"],lean:"Hybrid"},
  "Blueberry Moon":{terps:["myrcene","caryophyllene","limonene"],flavor:["berry","sweet","gas"],effects:["relaxed","euphoric","calm"],lean:"Indica Hybrid"},
  "Ricky Bobby":{terps:["caryophyllene","limonene","myrcene"],flavor:["citrus","earthy","spice"],effects:["uplifted","relaxed","happy"],lean:"Hybrid"},
  "Apples & Bananas":{terps:["limonene","caryophyllene","farnesene"],flavor:["fruit","apple","tropical"],effects:["euphoric","relaxed","happy"],lean:"Hybrid"},
  "White Runtz":{terps:["caryophyllene","limonene","linalool"],flavor:["candy","fruit","sweet"],effects:["euphoric","relaxed","happy"],lean:"Hybrid"},
  "Guava Devil":{terps:["limonene","caryophyllene","myrcene"],flavor:["guava","tropical","sweet"],effects:["uplifted","euphoric","happy"],lean:"Hybrid"},
  "Fire Cherry Pie":{terps:["caryophyllene","limonene","myrcene"],flavor:["cherry","sweet","earthy"],effects:["relaxed","euphoric","happy"],lean:"Hybrid"},
  "GMO":{terps:["caryophyllene","limonene","humulene"],flavor:["diesel","garlic","earthy"],effects:["relaxed","euphoric","sleepy"],lean:"Indica"},
  "Melted Strawberries":{terps:["limonene","caryophyllene","myrcene"],flavor:["strawberry","sweet","cream"],effects:["uplifted","relaxed","happy"],lean:"Hybrid"},
  "Sour GMO Cookies":{terps:["caryophyllene","limonene","humulene"],flavor:["diesel","garlic","sweet"],effects:["relaxed","euphoric"],lean:"Indica Hybrid"},
  "Smackin'":{terps:["caryophyllene","limonene","myrcene"],flavor:["fruit","gas","sweet"],effects:["euphoric","relaxed"],lean:"Hybrid"},
  "Sour Indigo OG":{terps:["myrcene","caryophyllene","limonene"],flavor:["berry","sour","earthy"],effects:["relaxed","euphoric"],lean:"Indica Hybrid"},
  "Alaskan Thunder Rise":{terps:["terpinolene","myrcene","pinene"],flavor:["pine","citrus","earthy"],effects:["energetic","uplifted","euphoric"],lean:"Sativa"},
};

/* strain lookup tolerant of case/extra spaces */
const STRAIN_KEYS = Object.keys(STRAINS);
function lookupStrain(name){
  if (!name) return null;
  const n = name.trim().toLowerCase();
  const hit = STRAIN_KEYS.find(k => k.toLowerCase() === n) ||
              STRAIN_KEYS.find(k => n.includes(k.toLowerCase()) || k.toLowerCase().includes(n));
  return hit ? STRAINS[hit] : null;
}

/* ---------- baked fallback (snapshot 2026-07-03) ---------- */
const FALLBACK = [
  {date:"2026-06-11",dispensary:"Vertical",total:71.22,products:[{brand:"Proper Cannabis",strain:"Mix #68 Bangin' OZ",type:"Infused Pre-Roll",weight:"1g",price:20},{brand:"AMAZE",strain:"NF1",type:"Flower",weight:"3.5g",price:40}]},
  {date:"2026-06-03",dispensary:"Vertical",total:23.74,products:[{brand:"VIBE",strain:"Blue Unicorn",type:"Concentrate",weight:"1g",price:20}]},
  {date:"2026-05-31",dispensary:"Vertical",total:17.80,products:[{brand:"",strain:"(unlogged hybrid)",type:"Infused Pre-Roll",weight:"1g",price:17}]},
  {date:"2026-05-30",dispensary:"From The Earth",total:30.00,products:[{brand:"",strain:"Alaskan Thunder Rise",type:"Infused Pre-Roll",weight:"1g",price:30}]},
  {date:"2026-05-29",dispensary:"Vertical",total:23.74,products:[{brand:"VIBE",strain:"Blue Unicorn",type:"Concentrate",weight:"1g",price:20}]},
  {date:"2026-05-14",dispensary:"From The Earth",total:44.00,products:[{brand:"",strain:"OG Kush",type:"Concentrate",weight:"1g",price:44}]},
  {date:"2026-05-07",dispensary:"Vertical",total:83.09,products:[{brand:"VIBE",strain:"Lemon Sunshine",type:"Concentrate",weight:"1g",price:20},{brand:"Sinse Cannabis",strain:"Blue Dream",type:"Vape",weight:"1g",price:50}]},
  {date:"2026-04-11",dispensary:"From The Earth",total:17.00,products:[{brand:"",strain:"Blueberry",type:"Infused Pre-Roll",weight:"1g",price:17}]},
  {date:"2026-03-20",dispensary:"Vertical",total:35.61,products:[{brand:"",strain:"Alien OG",type:"Flower",weight:"3.5g",price:35}]},
  {date:"2026-01-28",dispensary:"Vertical",total:63.50,products:[{brand:"Robust",strain:"Apples & Bananas",type:"Flower",weight:"7g",price:55}]},
  {date:"2025-12-29",dispensary:"Vertical",total:21.96,products:[{brand:"Super J's",strain:"Lemon Sportiff",type:"Pre-Roll",weight:"1g",price:11}]},
  {date:"2025-12-17",dispensary:"From The Earth",total:17.96,products:[{brand:"VIBE",strain:"Melted Strawberries",type:"Pre-Roll",weight:"1g",price:17}]},
  {date:"2025-12-16",dispensary:"Vertical",total:11.87,products:[{brand:"AMAZE",strain:"Triple Burger",type:"Concentrate",weight:".5g",price:11}]},
  {date:"2025-12-15",dispensary:"From The Earth",total:17.96,products:[{brand:"Super J's",strain:"Lemon Sportiff",type:"Pre-Roll",weight:"1g",price:17}]},
  {date:"2025-12-05",dispensary:"From The Earth",total:17.96,products:[{brand:"Super J's",strain:"Super Lemon G",type:"Pre-Roll",weight:"1g",price:17}]},
  {date:"2025-12-03",dispensary:"From The Earth",total:35.91,products:[{brand:"Galactic",strain:"RS-11",type:"Flower",weight:"3.5g",price:35}]},
  {date:"2025-11-30",dispensary:"From The Earth",total:59.85,products:[{brand:"Tumble",strain:"Blue Dream",type:"Infused Pre-Roll",weight:"1.5g",price:50}]},
  {date:"2025-11-29",dispensary:"Vertical",total:23.74,products:[{brand:"",strain:"Fire Cherry Pie",type:"Infused Pre-Roll",weight:"1g",price:23}]},
  {date:"2025-11-22",dispensary:"From The Earth",total:21.55,products:[{brand:"Diamond",strain:"Blueberry Moon",type:"Infused Pre-Roll",weight:"1g",price:21}]},
  {date:"2025-10-26",dispensary:"Vertical",total:64.39,products:[{brand:"Sinse",strain:"Runtz",type:"Flower",weight:"3.5g",price:36},{brand:"Pinchy's",strain:"Blue Rntz",type:"Vape",weight:"1g",price:28}]},
  {date:"2025-09-16",dispensary:"From The Earth",total:33.24,products:[{brand:"Smokos",strain:"Purple Chem",type:"Pre-Roll",weight:"2.5g",price:33}]},
  {date:"2025-09-10",dispensary:"Vertical",total:59.35,products:[{brand:"",strain:"Ricky Bobby",type:"Concentrate",weight:".5g",price:59}]},
  {date:"2025-08-29",dispensary:"Sunny Daze",total:23.74,products:[{brand:"",strain:"White Runtz",type:"Infused Pre-Roll",weight:"1g",price:23}]},
  {date:"2025-06-19",dispensary:"Fresh Karma",total:58.42,products:[{brand:"ILLICIT",strain:"Blackberry Larry",type:"Flower",weight:"3.5g",price:30},{brand:"Rooted",strain:"Cannalope Haze",type:"Pre-Roll",weight:"1g",price:9},{brand:"Elevate Missouri",strain:"Lilac Diesel",type:"Pre-Roll",weight:"1g",price:9}]},
  {date:"2025-06-18",dispensary:"Sunny Daze",total:71.98,products:[{brand:"CLEAR Brands",strain:"Blueberry",type:"Vape",weight:"1g",price:59}]},
  {date:"2025-06-08",dispensary:"Fresh Karma",total:30.42,products:[{brand:"Ostara",strain:"Zkittlez",type:"Vape",weight:".5g",price:25}]},
  {date:"2025-06-06",dispensary:"Fresh Karma",total:127.78,products:[{brand:"Ostara",strain:"Zkittlez",type:"Vape",weight:".5g",price:25},{brand:"The Solid",strain:"Sour Diesel",type:"Vape",weight:"1g",price:45}]},
  {date:"2025-05-31",dispensary:"Fresh Karma",total:48.68,products:[{brand:"ILLICIT",strain:"Gorilla Pie",type:"Flower",weight:"3.5g",price:40}]},
  {date:"2025-05-31",dispensary:"Sunny Daze",total:24.40,products:[{brand:"Fubar",strain:"GMO",type:"Concentrate",weight:"1g",price:20}]},
  {date:"2025-05-24",dispensary:"Fresh Karma",total:30.43,products:[{brand:"The Solid",strain:"Blue Cheese",type:"Pre-Roll",weight:".5g",price:8},{brand:"The Solid",strain:"CAP Junky x Permanent Marker",type:"Pre-Roll",weight:".5g",price:8},{brand:"Rooted",strain:"Sour Indigo OG",type:"Pre-Roll",weight:"1g",price:9}]},
  {date:"2025-05-22",dispensary:"Fresh Karma",total:48.68,products:[{brand:"VIBE",strain:"Atomic Pop",type:"Vape",weight:"1g",price:40}]},
  {date:"2025-05-18",dispensary:"Fresh Karma",total:90.06,products:[{brand:"Vibe",strain:"London Pound Cake",type:"Vape",weight:"1g",price:40},{brand:"Ostara",strain:"White Gushers",type:"Vape",weight:".5g",price:25},{brand:"Rooted",strain:"Strawberry Cookies OG",type:"Pre-Roll",weight:"1g",price:9}]},
  {date:"2025-05-12",dispensary:"Fresh Karma",total:29.21,products:[{brand:"Rooted",strain:"Glue Cake",type:"Pre-Roll",weight:"1g",price:9}]},
  {date:"2025-05-02",dispensary:"Fresh Karma",total:26.77,products:[{brand:"Clovr x Nuthera",strain:"Smackin'",type:"Pre-Roll",weight:"1g",price:26}]},
  {date:"2025-04-18",dispensary:"Fresh Karma",total:18.26,products:[{brand:"Clovr x Nuthera",strain:"Sour GMO Cookies",type:"Pre-Roll",weight:"2.5g",price:18}]},
  {date:"2025-04-16",dispensary:"Vertical",total:34.08,products:[{brand:"ILLICIT",strain:"Ghost OG",type:"Pre-Roll",weight:"1g",price:20},{brand:"Proper Cannabis",strain:"Guava Devil",type:"Vape",weight:".5g",price:8}]},
  {date:"2025-03-08",dispensary:"Fresh Karma",total:48.68,products:[{brand:"Buoyant Bob",strain:"Blue Dream",type:"Vape",weight:"1g",price:40}]},
];

/* ---------- DNA ---------- */
function buildDNA(orders){
  const sC={},tC={},bC={},dC={},terpW={},flavW={},effW={};
  let spend=0,prods=0;const priced=[];
  for(const o of orders){
    dC[o.dispensary]=(dC[o.dispensary]||0)+1;spend+=o.total;
    for(const p of o.products){
      prods++;sC[p.strain]=(sC[p.strain]||0)+1;
      if(p.type)tC[p.type]=(tC[p.type]||0)+1;
      if(p.brand)bC[p.brand]=(bC[p.brand]||0)+1;
      if(p.price)priced.push(p.price);
      const k=lookupStrain(p.strain);if(k){
        k.terps.forEach((t,i)=>terpW[t]=(terpW[t]||0)+(3-i));
        k.flavor.forEach(f=>flavW[f]=(flavW[f]||0)+1);
        k.effects.forEach(e=>effW[e]=(effW[e]||0)+1);}
    }
  }
  const top=(o,n)=>Object.entries(o).filter(([k])=>!k.startsWith("(unlogged")).sort((a,b)=>b[1]-a[1]).slice(0,n);
  return{orders:orders.length,prods,spend,avgOrder:spend/(orders.length||1),
    budgetLo:priced.length?Math.min(...priced):0,budgetHi:priced.length?Math.max(...priced):0,
    strains:top(sC,10),types:top(tC,6),brands:top(bC,6),disp:top(dC,4),
    terps:top(terpW,6),flavors:top(flavW,8),effects:top(effW,6)};
}

const TERP_HUE={limonene:"#E8A33D",caryophyllene:"#E85D2C",myrcene:"#A87FD4",
  terpinolene:"#93C178",pinene:"#5FBFB4",humulene:"#C98A54",linalool:"#B08FD9",
  ocimene:"#A5C167",farnesene:"#D0A45B"};
const T={bg:"#100C06",paper:"#191309",paper2:"#1F1810",rule:"#2E2414",ruleSoft:"#241C0F",
  amber:"#E8A33D",ember:"#E85D2C",cream:"#F2E8D5",body:"#C9B896",
  dim:"#A8977B",smoke:"#6B5C45",faint:"#4A3E2C",sage:"#93C178"};

function Radar({terps,mounted}){
  const W=320,H=280,cx=W/2,cy=H/2+4,R=96;
  const n=terps.length||1,max=terps[0]?.[1]||1;
  const pt=(i,r)=>{const a=(Math.PI*2*i)/n-Math.PI/2;return[cx+Math.cos(a)*r,cy+Math.sin(a)*r];};
  const poly=terps.map(([,w],i)=>pt(i,(w/max)*R*(mounted?1:0.05)).join(",")).join(" ");
  return(
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:340,display:"block",margin:"0 auto"}}>
      {[0.33,0.66,1].map(f=>(
        <polygon key={f} points={terps.map((_,i)=>pt(i,R*f).join(",")).join(" ")}
          fill="none" stroke={T.rule} strokeWidth="1" strokeDasharray={f===1?"none":"3 4"}/>))}
      {terps.map((_,i)=>{const[x,y]=pt(i,R);
        return<line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={T.ruleSoft} strokeWidth="1"/>;})}
      <polygon points={poly} fill="#E8A33D22" stroke={T.amber} strokeWidth="2"
        strokeLinejoin="round" style={{transition:"all 1.2s cubic-bezier(.2,.8,.2,1)"}}/>
      {terps.map(([t,w],i)=>{const[x,y]=pt(i,(w/max)*R*(mounted?1:0.05));
        return<circle key={t} cx={x} cy={y} r="4" fill={TERP_HUE[t]||T.amber} stroke={T.bg} strokeWidth="2"
          style={{transition:"all 1.2s cubic-bezier(.2,.8,.2,1)"}}/>;})}
      {terps.map(([t],i)=>{const[x,y]=pt(i,R+22);
        return<text key={t} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          style={{fontSize:10.5,fontFamily:"'JetBrains Mono',monospace",
          fill:i===0?T.amber:T.dim,fontWeight:i===0?700:400,letterSpacing:"0.06em"}}>{t.toUpperCase()}</text>;})}
      <circle cx={cx} cy={cy} r="2.5" fill={T.smoke}/>
    </svg>);
}

function SpendStrip({orders,mounted}){
  const byMonth={};
  orders.forEach(o=>{const m=(o.date||"").slice(0,7);if(m)byMonth[m]=(byMonth[m]||0)+o.total;});
  const months=Object.entries(byMonth).sort((a,b)=>a[0]<b[0]?-1:1).slice(-12);
  const max=Math.max(...months.map(([,v])=>v),1);
  return(
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:74}}>
      {months.map(([m,v],i)=>(
        <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
          <div style={{width:"100%",borderRadius:"3px 3px 0 0",
            height:mounted?`${Math.max((v/max)*54,3)}px`:"3px",
            background:v===max?T.ember:`${T.amber}66`,
            transition:`height .8s cubic-bezier(.2,.8,.2,1) ${i*0.045}s`}}/>
          <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:T.faint,
            transform:"rotate(-45deg)",whiteSpace:"nowrap",height:16}}>{m.slice(2).replace("-","/")}</div>
        </div>))}
    </div>);
}

export default function App(){
  const[orders,setOrders]=useState(null);   // null = loading
  const[live,setLive]=useState(false);
  const[fetchedAt,setFetchedAt]=useState("");
  const[mounted,setMounted]=useState(false);
  const[openOrder,setOpenOrder]=useState(null);
  const[showAll,setShowAll]=useState(false);

  useEffect(()=>{
    let dead=false;
    async function load(){
      try{
        if(!APPS_SCRIPT_URL.startsWith("https")) throw new Error("no url");
        const r=await fetch(APPS_SCRIPT_URL);
        const j=await r.json();
        if(!j.orders?.length) throw new Error("empty");
        if(!dead){setOrders(j.orders);setLive(true);setFetchedAt(j.generated||"");}
      }catch(e){
        if(!dead){setOrders(FALLBACK);setLive(false);}
      }
    }
    load();
    return()=>{dead=true;};
  },[]);

  useEffect(()=>{
    if(orders){const t=setTimeout(()=>setMounted(true),80);return()=>clearTimeout(t);}
  },[orders]);

  const dna=useMemo(()=>orders?buildDNA(orders):null,[orders]);

  const mono={fontFamily:"'JetBrains Mono',monospace"};
  const stamp={...mono,fontSize:9.5,letterSpacing:"0.18em",color:T.smoke,textTransform:"uppercase"};
  const field={...mono,fontSize:9.5,letterSpacing:"0.14em",color:T.amber,textTransform:"uppercase",fontWeight:700};
  const sect={background:T.paper,border:`1px solid ${T.rule}`,borderRadius:4,padding:"20px 20px",marginBottom:12};
  const rise=(d)=>({opacity:mounted?1:0,transform:mounted?"none":"translateY(10px)",
    transition:`all .65s cubic-bezier(.2,.8,.2,1) ${d}s`});
  const dashRule={borderTop:`1px dashed ${T.rule}`,margin:"16px 0"};

  if(!orders){
    return(<div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",
      justifyContent:"center",color:T.dim,...mono,fontSize:11,letterSpacing:"0.2em"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');`}</style>
      PULLING YOUR PURCHASES…</div>);
  }

  const repeats=dna.strains.filter(([,n])=>n>1);
  const domTerp=dna.terps[0]?.[0]||"—";
  const topStrain=dna.strains[0]||["—",0];
  const span=orders.length?`${orders[orders.length-1].date} — ${orders[0].date}`:"—";
  const visOrders=showAll?orders:orders.slice(0,8);

  return(
    <div style={{background:T.bg,minHeight:"100vh",color:T.cream,paddingBottom:64,
      fontFamily:"'Sora',system-ui,sans-serif",
      backgroundImage:`radial-gradient(700px 380px at 50% -6%, #E85D2C14, transparent 70%)`}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;900&family=Sora:wght@400;600&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{width:0}
        @media (prefers-reduced-motion: reduce){*{transition:none!important;animation:none!important}}
      `}</style>

      <div style={{maxWidth:560,margin:"0 auto",padding:"0 14px"}}>

        <header style={{...rise(0),border:`1px solid ${T.rule}`,borderRadius:4,
          background:T.paper,padding:"22px 20px 18px",marginTop:22,marginBottom:12,position:"relative",overflow:"hidden"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={stamp}>Charlie Blaze Labs · St. Joseph MO</div>
            <div style={{...mono,fontSize:9.5,color:live?T.sage:T.ember,
              border:`1px solid ${live?T.sage:T.ember}55`,
              borderRadius:2,padding:"2px 7px",letterSpacing:"0.14em"}}>
              {live?"● LIVE":"OFFLINE SNAPSHOT"}</div>
          </div>
          <h1 style={{fontFamily:"'Unbounded',sans-serif",fontWeight:900,fontSize:25,
            lineHeight:1.12,letterSpacing:"-0.01em",margin:"14px 0 4px",color:T.cream}}>
            CERTIFICATE OF<br/><span style={{color:T.amber}}>TASTE ANALYSIS</span></h1>
          <div style={{...mono,fontSize:10.5,color:T.dim,marginTop:10,lineHeight:2}}>
            SUBJECT ......... CHARLIE BLAZE<br/>
            SAMPLE .......... {dna.orders} ORDERS · {dna.prods} PRODUCTS<br/>
            PERIOD .......... {span}<br/>
            SOURCE .......... {live?"PURCHASES TAB (LIVE SYNC)":"BAKED SNAPSHOT · CONNECT ENDPOINT"}
          </div>
          <div style={{position:"absolute",right:-26,bottom:-30,fontFamily:"'Unbounded',sans-serif",
            fontSize:110,fontWeight:900,color:"#E85D2C10",lineHeight:1,pointerEvents:"none"}}>🔥</div>
        </header>

        <section style={{...sect,...rise(.06),borderLeft:`3px solid ${T.ember}`}}>
          <div style={field}>Primary Findings</div>
          <p style={{margin:"10px 0 0",fontSize:14.5,lineHeight:1.65,color:T.body}}>
            Subject presents a <b style={{color:T.cream}}>{domTerp}-dominant</b> profile
            across {dna.orders} orders. Top repeat: <b style={{color:T.cream}}>{topStrain[0]}{topStrain[1]>1?` ×${topStrain[1]}`:""}</b>.
            Form factor favors <b style={{color:T.cream}}>{(dna.types[0]||["—"])[0].toLowerCase()}s</b>;
            leading effects: {dna.effects.slice(0,3).map(([e])=>e).join(", ")}.
            Diagnosis: <b style={{color:T.amber}}>daytime-functional citrus chaser.</b>
          </p>
        </section>

        <section style={{...sect,...rise(.12),paddingBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <div style={field}>Terpene Fingerprint</div><div style={stamp}>FIG. 01</div></div>
          <Radar terps={dna.terps} mounted={mounted}/>
          <div style={{...mono,fontSize:9.5,color:T.smoke,textAlign:"center",paddingBottom:10,letterSpacing:"0.1em"}}>
            WEIGHTED BY DOMINANCE ACROSS {dna.prods} PRODUCTS</div>
        </section>

        <section style={{...sect,...rise(.18)}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <div style={field}>Sample Composition</div><div style={stamp}>FIG. 02</div></div>
          <div style={dashRule}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 20px",...mono,fontSize:11.5}}>
            {[["TOTAL TRACKED","$"+Math.round(dna.spend)],["AVG ORDER","$"+Math.round(dna.avgOrder)],
              ["BUDGET BAND",`$${dna.budgetLo}–$${dna.budgetHi}`],["REPEAT STRAINS",repeats.length],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",
                borderBottom:`1px solid ${T.ruleSoft}`}}>
                <span style={{color:T.smoke,fontSize:9.5,letterSpacing:"0.1em"}}>{k}</span>
                <span style={{color:T.cream,fontWeight:700}}>{v}</span></div>))}
          </div>
          <div style={{marginTop:16}}>
            {dna.types.map(([t,n])=>{const max=dna.types[0][1];return(
              <div key={t} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <div style={{...mono,fontSize:10,color:T.dim,width:118,letterSpacing:"0.06em"}}>{t.toUpperCase()}</div>
                <div style={{flex:1,height:7,background:T.paper2,borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:mounted?`${(n/max)*100}%`:"0%",borderRadius:2,
                    background:`linear-gradient(90deg,${T.ember},${T.amber})`,
                    transition:"width .9s cubic-bezier(.2,.8,.2,1) .3s"}}/></div>
                <div style={{...mono,fontSize:10.5,color:T.smoke,width:20,textAlign:"right"}}>{n}</div>
              </div>);})}
          </div>
        </section>

        {repeats.length>0&&<section style={{...sect,...rise(.22),
          background:`linear-gradient(150deg,#E85D2C14,${T.paper} 55%)`,border:`1px solid ${T.ember}44`}}>
          <div style={field}>Confirmed Repeats — the real signal</div>
          <div style={{marginTop:12,display:"grid",gap:8}}>
            {repeats.map(([s,n])=>{const k=lookupStrain(s);return(
              <div key={s} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{...mono,fontSize:12,fontWeight:700,color:T.ember,width:30}}>×{n}</div>
                <div style={{flex:1}}>
                  <span style={{fontSize:14.5,fontWeight:600,color:T.cream}}>{s}</span>
                  {k&&<span style={{...mono,fontSize:9.5,color:T.smoke,marginLeft:8}}>{k.lean.toUpperCase()}</span>}
                </div>
                {k&&<div style={{display:"flex",gap:4}}>{k.terps.slice(0,3).map(t=>(
                  <span key={t} style={{width:8,height:8,borderRadius:"50%",background:TERP_HUE[t]||T.smoke}}/>))}</div>}
              </div>);})}
          </div>
        </section>}

        <section style={{...sect,...rise(.26)}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <div style={field}>Strain Register</div><div style={stamp}>{dna.strains.length} SHOWN</div></div>
          <div style={dashRule}/>
          {dna.strains.map(([s,n],i)=>{const k=lookupStrain(s);return(
            <div key={s} style={{display:"flex",gap:12,alignItems:"center",
              padding:"9px 0",borderBottom:i<dna.strains.length-1?`1px solid ${T.ruleSoft}`:"none"}}>
              <div style={{...mono,fontSize:9.5,color:T.faint,width:22}}>{String(i+1).padStart(2,"0")}</div>
              <div style={{flex:1}}>
                <span style={{fontSize:13.5,fontWeight:600,color:T.cream}}>{s}</span>
                {k?<div style={{fontSize:11,color:T.smoke,marginTop:1}}>{k.flavor.slice(0,3).join(" · ")}</div>
                  :<div style={{...mono,fontSize:9,color:T.faint,marginTop:1}}>NOT IN KNOWLEDGE GRAPH YET</div>}
              </div>
              {n>1&&<span style={{...mono,fontSize:9.5,color:T.amber,fontWeight:700}}>×{n}</span>}
              {k&&<div style={{display:"flex",gap:4}}>{k.terps.slice(0,3).map(t=>(
                <span key={t} style={{width:7,height:7,borderRadius:"50%",background:TERP_HUE[t]||T.smoke}}/>))}</div>}
            </div>);})}
        </section>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12,...rise(.3)}}>
          <section style={{...sect,marginBottom:0}}>
            <div style={field}>Effect Pattern</div>
            <div style={{marginTop:12}}>
              {dna.effects.map(([e,n])=>{const max=dna.effects[0]?.[1]||1;return(
                <div key={e} style={{marginBottom:9}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11.5,marginBottom:3}}>
                    <span style={{textTransform:"capitalize",color:T.body}}>{e}</span>
                    <span style={{...mono,fontSize:9.5,color:T.smoke}}>{n}</span></div>
                  <div style={{height:4,background:T.paper2,borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:mounted?`${(n/max)*100}%`:"0%",
                      background:T.sage,borderRadius:2,transition:"width .9s ease .4s"}}/></div>
                </div>);})}
            </div>
          </section>
          <section style={{...sect,marginBottom:0}}>
            <div style={field}>Flavor Palate</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>
              {dna.flavors.map(([f],i)=>(
                <span key={f} style={{...mono,fontSize:10,padding:"4px 9px",borderRadius:2,
                  background:i===0?`${T.amber}1A`:T.paper2,
                  border:`1px solid ${i===0?T.amber+"66":T.ruleSoft}`,
                  color:i===0?T.amber:T.dim,textTransform:"uppercase",letterSpacing:"0.08em"}}>{f}</span>))}
            </div>
            <div style={{...field,marginTop:18}}>Home Turf</div>
            <div style={{marginTop:10}}>
              {dna.disp.map(([d,n],i)=>(
                <div key={d} style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <span style={{fontSize:11.5,color:i===0?T.cream:T.dim,fontWeight:i===0?600:400}}>{d}</span>
                  <span style={{...mono,fontSize:10,color:T.smoke}}>{n}</span></div>))}
            </div>
          </section>
        </div>

        <section style={{...sect,...rise(.34)}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:14}}>
            <div style={field}>Spend Timeline</div><div style={stamp}>LAST 12 ACTIVE MO.</div></div>
          <SpendStrip orders={orders} mounted={mounted}/>
        </section>

        <section style={{...sect,...rise(.38)}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <div style={field}>Order Ledger</div><div style={stamp}>{orders.length} ENTRIES</div></div>
          <div style={dashRule}/>
          {visOrders.map((o,i)=>{const open=openOrder===i;return(
            <div key={i} onClick={()=>setOpenOrder(open?null:i)}
              style={{padding:"10px 0",borderBottom:`1px solid ${T.ruleSoft}`,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{...mono,fontSize:10,color:T.smoke,width:64}}>{(o.date||"").slice(2)}</div>
                <div style={{flex:1,fontSize:13,fontWeight:600,color:T.cream}}>{o.dispensary}
                  <span style={{...mono,fontSize:9.5,color:T.faint,marginLeft:8}}>{o.products.length} ITEM{o.products.length!==1?"S":""}</span></div>
                <div style={{...mono,fontSize:12,fontWeight:700,color:T.amber}}>${(o.total||0).toFixed(2)}</div>
                <div style={{...mono,fontSize:9,color:T.faint,width:10}}>{open?"−":"+"}</div>
              </div>
              {open&&<div style={{marginTop:8,marginLeft:76}}>
                {o.products.map((p,j)=>(
                  <div key={j} style={{padding:"4px 0"}}>
                    <div style={{fontSize:12.5,color:T.body,fontWeight:600}}>{p.strain||"(unnamed)"}</div>
                    <div style={{...mono,fontSize:9.5,color:T.smoke,marginTop:1}}>
                      {[p.brand,p.type,p.weight,p.price?"$"+p.price:""].filter(Boolean).join(" · ").toUpperCase()}</div>
                  </div>))}
              </div>}
            </div>);})}
          {!showAll&&orders.length>8&&(
            <button onClick={()=>setShowAll(true)} style={{...mono,display:"block",width:"100%",
              marginTop:12,padding:"10px 0",background:T.paper2,border:`1px dashed ${T.rule}`,
              borderRadius:2,color:T.dim,fontSize:10,letterSpacing:"0.16em",cursor:"pointer"}}>
              SHOW ALL {orders.length} ORDERS</button>)}
        </section>

        <div style={{...rise(.42),textAlign:"center",marginTop:22,...mono,fontSize:9.5,
          color:T.faint,letterSpacing:"0.16em",lineHeight:2.1}}>
          {live?`LIVE FROM SHEET${fetchedAt?" · "+fetchedAt.slice(0,10):""}`:"OFFLINE SNAPSHOT · SET APPS_SCRIPT_URL"}<br/>
          CHARLIE BLAZE — FIND YOUR FIRE 🔥
        </div>
      </div>
    </div>
  );
}
