'use client';
import { useEffect, useMemo, useState, useRef } from "react";
import {calculateQuote,defaultForm,type Mode,type QuoteStatus,type SavedQuote,type Rate,type QuoteRecord} from "@/lib/quote-calculator";
import {flushSync} from "react-dom";
async function quoteRequest(method:string,body?:unknown,id?:string){const response=await fetch("/api/quotes"+(id?"?id="+encodeURIComponent(id):""),{method,headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw Error(data.error||"Unable to save quote.");return data;}

const money=(v:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number.isFinite(v)?v:0);
const n=(v:string|number)=>Number(v)||0;
const base=(name:string,days=0):Rate=>({name,amount:0,fsc:0,chassis:0,days,accessorial:0});
const initialRates:Record<Mode,Rate[]>={
  Truckload:[base("DAT RateView"),base("Posted truck"),base("Carrier feedback")],
  LTL:[base("Carrier 1"),base("Carrier 2"),base("Carrier 3")],
  Drayage:[base("Dray carrier 1",2),base("Dray carrier 2",2),base("Dray carrier 3",2)]
};
const equipment:Record<Mode,string[]>={
  Truckload:["Dry Van","Reefer","Flatbed"],
  LTL:["Palletized LTL","Volume LTL"],
  Drayage:["20 ft Container","40 ft Container","40 ft High Cube"]
};

export function QuoteWorkspace(){
 const[view,setView]=useState<"calculator"|"tracker">("calculator");
 const[mode,setMode]=useState<Mode>("Truckload");
 const[rates,setRates]=useState(initialRates);
 const[markup,setMarkup]=useState(15);
 const[custom,setCustom]=useState("");
 const[quotes,setQuotes]=useState<SavedQuote[]>([]);
 const[logo,setLogo]=useState("");
 const[message,setMessage]=useState("");
 const[scriptOpen,setScriptOpen]=useState<"call"|"email"|null>(null);
 const[form,setForm]=useState({...defaultForm});
 const[busy,setBusy]=useState(false);
 const[loaded,setLoaded]=useState(false);
 const[autoReference,setAutoReference]=useState("");
 const saving=useRef(false);
 useEffect(()=>{setAutoReference("FSQ-"+new Date().getFullYear()+"-"+crypto.randomUUID().slice(0,8).toUpperCase());quoteRequest("GET").then(data=>{setQuotes(data.quotes);setLogo(data.logo);setLoaded(true)}).catch(error=>setMessage(error.message))},[]);
 const update=(key:string,value:string|boolean)=>setForm(f=>({...f,[key]:value}));
 const modeRates=rates[mode];
 const activeMarkup=custom===""?markup:n(custom);
 let calculationError="";
 let calculation={totals:[0,0,0],entered:[] as number[],buy:0,sell:0,profit:0,margin:0};
 try{calculation=calculateQuote(mode,modeRates,activeMarkup)}catch{calculationError="Use non-negative rates and a markup between 0% and 1,000%."}
 const {totals,entered,buy,sell,profit,margin}=calculation;
 const reference=form.reference||autoReference;
 const equipmentLabel=form.hazmat?`${form.equipment} / Hazmat`:form.equipment;
 const shipmentLine=`${form.origin||"[origin]"} to ${form.destination||"[destination]"}`;
 const callScript=useMemo(()=>`Hi, this is ${form.contact||"[your name]"} with ${form.company||"[company]"}. I am calling about an available ${equipmentLabel} truck.

I have a load from ${form.origin||"[origin]"} to ${form.destination||"[destination]"}, picking up ${form.pickup||"[pickup date]"} and delivering ${form.delivery||"[delivery date]"}. It is ${form.commodity||"[commodity]"}, ${form.weight||"[weight]"} lbs${form.temperature?`, at ${form.temperature}`:""}.

Are you interested and available? What all-in rate would you need? Please confirm your MC number, equipment, driver location, and any special requirements.${form.notes?`

Load notes: ${form.notes}`:""}`,[form,equipmentLabel]);
 const emailDraft=useMemo(()=>mode==="Drayage"?`Subject: Drayage quote request | ${shipmentLine}

Hello,

Please quote this drayage move:
Port or rail: ${form.port||"[port or rail]"}
Delivery: ${form.destination||"[delivery location]"}
Container: ${equipmentLabel}
Pickup: ${form.pickup||"[date]"}
Weight: ${form.weight||"[weight]"} lbs
Commodity: ${form.commodity||"[commodity]"}

Please break out linehaul, fuel surcharge, chassis per day and minimum days, pre-pull, detention, storage, hazmat, overweight, and other accessorials. Confirm free time and equipment availability.

Thank you,
${form.contact||"[your name]"}
${form.company||"[company]"}`:`Subject: ${mode} quote request | ${shipmentLine}

Hello,

Please provide an all-in quote for:
Lane: ${shipmentLine}
Pickup: ${form.pickup||"[pickup date]"}
Delivery: ${form.delivery||"[delivery date]"}
Equipment: ${equipmentLabel}
Commodity: ${form.commodity||"[commodity]"}
Weight: ${form.weight||"[weight]"} lbs
Pieces / pallets: ${form.pieces||"[quantity]"}
${form.dimensions?`Dimensions: ${form.dimensions}`:""}
${form.freightClass?`Freight class: ${form.freightClass}`:""}
${form.notes?`Notes: ${form.notes}`:""}

Please confirm the rate, transit time, availability, and accessorials.

Thank you,
${form.contact||"[your name]"}
${form.company||"[company]"}`,[mode,form,equipmentLabel,shipmentLine]);
 function changeMode(next:Mode){setMode(next);setForm(f=>({...f,equipment:equipment[next][0]}))}
 function updateRate(i:number,key:keyof Rate,value:string){setRates(all=>({...all,[mode]:all[mode].map((r,x)=>x===i?{...r,[key]:key==="name"?value:n(value)}:r)}))}
 async function saveQuote(){
  if(saving.current||!loaded)return;
  if(!form.origin.trim()||!form.destination.trim()||!buy||calculationError){setMessage("Add the lane and at least one valid carrier rate before saving.");return}
  saving.current=true;setBusy(true);
  try{
   const data=await quoteRequest("POST",{action:"save",snapshot:{mode,rates,markup:activeMarkup,logo,form:{...form,reference}}});
   flushSync(()=>{setQuotes(previous=>[data.quote,...previous]);setForm(current=>({...current,reference:data.quote.reference}))});
   setMessage(data.quote.reference+" saved to Quote Tracker.");
   return data.quote as SavedQuote;
  }catch(error){setMessage((error as Error).message)}finally{saving.current=false;setBusy(false)}
 }
 async function setStatus(id:string,status:QuoteStatus){
  setBusy(true);try{await quoteRequest("POST",{action:"status",id,status});setQuotes(previous=>previous.map(q=>q.id===id?{...q,status}:q))}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}
 }
 async function openQuote(id:string){
  setBusy(true);try{const data=await quoteRequest("GET",undefined,id);const quote=data.quote as QuoteRecord;setForm(quote.snapshot.form);setMode(quote.mode);setRates(quote.snapshot.rates);setLogo(quote.snapshot.logo);setMarkup(quote.markup);setCustom("");setView("calculator");setMessage("Opened "+quote.reference+". Saving changes creates another saved copy.");}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}
 }
 function newQuote(){setForm({...defaultForm,company:form.company,contact:form.contact});setMode("Truckload");setRates(structuredClone(initialRates));setMarkup(15);setCustom("");setAutoReference("FSQ-"+new Date().getFullYear()+"-"+crypto.randomUUID().slice(0,8).toUpperCase());setView("calculator");setScriptOpen(null);setMessage("")}
 function uploadLogo(file?:File){
  if(!file)return;
  if(file.size>2_000_000||!["image/png","image/jpeg","image/webp"].includes(file.type)){setMessage("Use a PNG, JPEG, or WebP logo under 2 MB.");return}
  setBusy(true);
  const reader=new FileReader();
  reader.onerror=()=>{setMessage("Unable to read logo.");setBusy(false)};
  reader.onload=async()=>{try{const value=String(reader.result||"");await quoteRequest("POST",{action:"logo",logo:value});setLogo(value);setMessage("Logo saved to your account.")}catch(error){setMessage((error as Error).message)}finally{setBusy(false)}};
  reader.readAsDataURL(file)
 }
 async function copy(text:string){try{await navigator.clipboard.writeText(text);setMessage("Copied to clipboard.")}catch{setMessage("Select and copy the draft text below.")}}
 async function printQuote(){if(await saveQuote())window.print()}

 return <div className="fq">
  {message&&<div className="quote-message" role="status">{message}<button aria-label="Dismiss" onClick={()=>setMessage("")}>×</button></div>}
  <section className="intro"><p className="eyebrow">Freightskills field tool</p><h1>Freight Quote Calculator</h1><p>Research the buy rate, apply a markup, and turn it into a customer-ready quote.</p></section>
  <nav className="tabs" aria-label="Quote tools"><button className={view==="calculator"?"active":""} onClick={()=>setView("calculator")}>Calculator</button><button className={view==="tracker"?"active":""} onClick={()=>setView("tracker")}>Quote Tracker <span>{quotes.length}</span></button><button onClick={newQuote} disabled={busy}>New quote</button></nav>
  {view==="tracker"?<section className="panel tracker">
   <div className="section-head"><div><p className="step">Saved work</p><h2>Quote Tracker</h2></div><p>Record the result when a customer decides.</p></div>
   {!loaded?<p>Loading your saved quotes…</p>:quotes.length===0?<div className="empty"><strong>No saved quotes yet.</strong><p>Save a quote from the calculator and it will appear here.</p><button onClick={()=>setView("calculator")}>Build a quote</button></div>:<div className="table-wrap"><table><thead><tr><th>Reference</th><th>Date</th><th>Mode</th><th>Lane</th><th>Customer</th><th>Sell</th><th>Result</th></tr></thead><tbody>{quotes.map(q=><tr key={q.id}><td><button className="open-quote" onClick={()=>openQuote(q.id)} disabled={busy}>{q.reference}</button></td><td>{new Date(q.createdAt).toLocaleDateString()}</td><td>{q.mode}</td><td>{q.lane}</td><td>{q.customer}</td><td>{money(q.sell)}</td><td><select aria-label={"Result for "+q.reference} disabled={busy} value={q.status} onChange={e=>setStatus(q.id,e.target.value as QuoteStatus)}><option>Open</option><option>Won</option><option>Lost</option></select></td></tr>)}</tbody></table></div>}
  </section>:<>
   <div className="progress" aria-label="Quote workflow">{["Shipment","Research","Carrier outreach","Markup","Customer quote"].map((label,i)=><div key={label}><span>{i+1}</span>{label}</div>)}</div>
   <section className="panel">
    <div className="section-head"><div><p className="step">Step 1</p><h2>Shipment details</h2></div><p>Enter what the carrier needs to price the load.</p></div>
    <div className="mode-tabs">{(["Truckload","LTL","Drayage"] as Mode[]).map(m=><button key={m} className={mode===m?"active":""} onClick={()=>changeMode(m)}>{m}<small>{m==="Truckload"?"Van, reefer, flatbed, hazmat":m==="LTL"?"Palletized and volume":"Port and rail containers"}</small></button>)}</div>
    <div className="form-grid">
     <label>Origin<input value={form.origin} onChange={e=>update("origin",e.target.value)} placeholder={mode==="Drayage"?"Port, rail or city":"City, ST, ZIP"}/></label>
     <label>Destination<input value={form.destination} onChange={e=>update("destination",e.target.value)} placeholder="City, ST, ZIP"/></label>
     <label>Pickup date<input type="date" value={form.pickup} onChange={e=>update("pickup",e.target.value)}/></label>
     <label>Delivery date<input type="date" value={form.delivery} onChange={e=>update("delivery",e.target.value)}/></label>
     <label>Equipment<select value={form.equipment} onChange={e=>update("equipment",e.target.value)}>{equipment[mode].map(x=><option key={x}>{x}</option>)}</select></label>
     <label>Weight, lbs<input type="number" value={form.weight} onChange={e=>update("weight",e.target.value)} placeholder="42,000"/></label>
     <label>Commodity<input value={form.commodity} onChange={e=>update("commodity",e.target.value)} placeholder="What is shipping?"/></label>
     <label>Pieces / pallets<input value={form.pieces} onChange={e=>update("pieces",e.target.value)} placeholder="Quantity"/></label>
     {mode==="LTL"&&<><label>Dimensions<input value={form.dimensions} onChange={e=>update("dimensions",e.target.value)} placeholder="L × W × H"/></label><label>Freight class<input value={form.freightClass} onChange={e=>update("freightClass",e.target.value)} placeholder="Class or NMFC"/></label></>}
     {mode==="Drayage"&&<label>Port / rail<input value={form.port} onChange={e=>update("port",e.target.value)} placeholder="Facility and terminal"/></label>}
     {mode==="Truckload"&&<><label>Miles<input type="number" value={form.miles} onChange={e=>update("miles",e.target.value)} placeholder="Loaded miles"/></label>{form.equipment==="Reefer"&&<label>Temperature<input value={form.temperature} onChange={e=>update("temperature",e.target.value)} placeholder="34°F continuous"/></label>}</>}
     <label className="wide">Special instructions<textarea value={form.notes} onChange={e=>update("notes",e.target.value)} placeholder="Appointments, handling, accessorials, or other requirements"/></label>
     {mode==="Truckload"&&<label className="check"><input type="checkbox" checked={form.hazmat} onChange={e=>update("hazmat",e.target.checked)}/> Hazmat shipment</label>}
    </div>
   </section>
   <section className="panel">
    <div className="section-head"><div><p className="step">Step 2</p><h2>Research the buy rate</h2></div><p>{mode==="Drayage"?"Ask local dray carriers for a complete cost breakdown.":"Use three real market checks before pricing the customer."}</p></div>
    <div className="rate-grid">{modeRates.map((rate,i)=><article className="rate-card" key={i}>
     <input className="source-name" value={rate.name} onChange={e=>updateRate(i,"name",e.target.value)} aria-label={`Source ${i+1}`}/>
     {mode==="Drayage"?<div className="mini-grid">
      <label>Linehaul<input type="number" value={rate.amount||""} min="0" step="0.01" onChange={e=>updateRate(i,"amount",e.target.value)}/></label>
      <label>FSC %<input type="number" value={rate.fsc||""} onChange={e=>updateRate(i,"fsc",e.target.value)}/></label>
      <label>Chassis / day<input type="number" value={rate.chassis||""} onChange={e=>updateRate(i,"chassis",e.target.value)}/></label>
      <label>Min. days<input type="number" value={rate.days||""} onChange={e=>updateRate(i,"days",e.target.value)}/></label>
      <label className="wide">Known accessorials<input type="number" value={rate.accessorial||""} onChange={e=>updateRate(i,"accessorial",e.target.value)}/></label>
     </div>:<label>All-in carrier cost<input type="number" value={rate.amount||""} onChange={e=>updateRate(i,"amount",e.target.value)} placeholder="0.00"/></label>}
     <div className="rate-total"><span>Calculated cost</span><strong>{money(totals[i])}</strong></div>
    </article>)}</div>
    {calculationError&&<p role="alert">{calculationError}</p>}<div className="buy-summary"><span>Estimated buy rate<small>Average of {entered.length} entered carrier {entered.length===1?"rate":"rates"}</small></span><strong>{money(buy)}</strong></div>
   </section>

   <section className="panel">
    <div className="section-head"><div><p className="step">Step 3</p><h2>Carrier outreach</h2></div><p>Keep the load details beside you while calling or emailing.</p></div>
    {mode==="Drayage"&&<div className="coach"><strong>Finding drayage carriers</strong><p>Search by the exact port or rail ramp, confirm the carrier serves the delivery radius, then ask about port credentials, TWIC access, overweight capability, chassis, free time, and every accessorial.</p></div>}
    <div className="action-row"><button onClick={()=>setScriptOpen(scriptOpen==="call"?null:"call")}>Produce call script</button><button onClick={()=>setScriptOpen(scriptOpen==="email"?null:"email")}>Draft carrier email</button></div>
    {scriptOpen&&<div className="script"><div><strong>{scriptOpen==="call"?"Carrier call script":"Carrier email draft"}</strong><button onClick={()=>copy(scriptOpen==="call"?callScript:emailDraft)}>Copy</button></div><pre>{scriptOpen==="call"?callScript:emailDraft}</pre></div>}
   </section>

   <section className="pricing">
    <section className="panel">
     <div className="section-head"><div><p className="step">Step 4</p><h2>Set your markup</h2></div></div>
     <div className="markups">{[10,15,20].map(x=><button key={x} className={custom===""&&markup===x?"active":""} onClick={()=>{setMarkup(x);setCustom("")}}>{x}%</button>)}<label>Custom %<input type="number" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="25"/></label></div>
     <div className="math"><div><span>Buy rate</span><strong>{money(buy)}</strong></div><div><span>Markup</span><strong>{activeMarkup}%</strong></div><div><span>Expected profit</span><strong>{money(profit)}</strong></div><div><span>Gross margin</span><strong>{margin.toFixed(1)}%</strong></div></div>
    </section>
    <section className="panel quote-panel">
     <div className="section-head"><div><p className="step">Step 5</p><h2>Customer quote</h2></div></div>
     <div className="customer-fields">
      <label>Make quote out to<input value={form.customer} onChange={e=>update("customer",e.target.value)} placeholder="Customer or company"/></label>
      <label>Your company<input value={form.company} onChange={e=>update("company",e.target.value)} placeholder="Brokerage name"/></label>
      <label>Your name<input value={form.contact} onChange={e=>update("contact",e.target.value)} placeholder="Prepared by"/></label>
      <label>Valid for, days<input type="number" value={form.validDays} onChange={e=>update("validDays",e.target.value)}/></label>
      <label>Reference<input value={form.reference} onChange={e=>update("reference",e.target.value)} placeholder={reference}/></label>
      <label>Logo for PDF<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>uploadLogo(e.target.files?.[0])}/></label>
     </div>
     <div className="quote-total"><span>Customer quote</span><strong>{money(sell)}</strong></div>
     <label>Quote disclaimer<textarea value={form.disclaimer} onChange={e=>update("disclaimer",e.target.value)}/></label>
     <div className="action-row"><button className="primary" disabled={busy||!loaded} onClick={saveQuote}>{busy?"Saving…":"Save quote"}</button><button disabled={busy||!loaded} onClick={printQuote}>Save &amp; print / PDF</button></div>
    </section>
   </section>

   <article className="print-quote">
    <header>{logo?<img src={logo} alt=""/>:<strong>{form.company||"Freight Quote"}</strong>}<div><b>QUOTE</b><span>{reference}</span></div></header>
    <section><p>Prepared for</p><h2>{form.customer||"Customer"}</h2><small>Prepared by {form.contact||"Freight professional"}{form.company?` · ${form.company}`:""}</small></section>
    <div className="print-lane"><div><span>Origin</span><strong>{form.origin||"Not entered"}</strong></div><div><span>Destination</span><strong>{form.destination||"Not entered"}</strong></div></div>
    <dl><div><dt>Mode</dt><dd>{mode}</dd></div><div><dt>Equipment</dt><dd>{equipmentLabel}</dd></div><div><dt>Pickup</dt><dd>{form.pickup||"TBD"}</dd></div><div><dt>Delivery</dt><dd>{form.delivery||"TBD"}</dd></div><div><dt>Commodity</dt><dd>{form.commodity||"General freight"}</dd></div><div><dt>Weight</dt><dd>{form.weight?`${form.weight} lbs`:"TBD"}</dd></div></dl>
    <div className="print-total"><span>Total quoted rate</span><strong>{money(sell)}</strong></div>
    {form.notes&&<p className="print-notes">{form.notes}</p>}<footer>This quote is valid for {form.validDays||7} days. {form.disclaimer}</footer>
   </article>
  </>}</div>
}
