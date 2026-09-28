(() => {
  "use strict";

  const STORAGE_KEY = "ledger-data-v1";
  const COLORS = ["#1B5E4F","#2E6E8E","#C97B2E","#8A6D3B","#6B4E9E","#3FA08C","#B0673F","#4E5BA6","#8E5A7E","#6B7A3F","#C4568A","#5A6570"];
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentCycleKey = `${currentYear}-${String(now.getMonth()+1).padStart(2,"0")}`;

  const state = { period: "monthly", view: "overview", year: currentYear };

  const money = (v) => {
    const n = Number(v) || 0;
    return (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const monthlyIncome = (i) => {
    const v=Number(i?.amount)||0;
    if(i?.frequency==="weekly") return v*52/12;
    if(i?.frequency==="biweekly") return v*26/12;
    if(i?.frequency==="yearly") return v/12;
    return v;
  };
  const incomeLabel = (i) => i?.name || i?.source || i?.label || i?.category || "Income";

  function getShell(){ return document.querySelector("#root .bs-shell"); }
  function getFixedNav(){
    const shell=getShell(); if(!shell) return null;
    return Array.from(shell.children).find(el=>{
      const s=el.getAttribute("style")||"";
      return s.includes("position: fixed") && s.includes("bottom: 0") && el.querySelectorAll("button").length>=4;
    }) || null;
  }
  function getNav(){
    const fixed=getFixedNav(); if(!fixed) return null;
    return Array.from(fixed.children).find(el=>el.querySelectorAll(":scope > button").length>=4) || fixed;
  }
  function getContent(){
    const shell=getShell(); if(!shell) return null;
    return Array.from(shell.children).find(el=>{
      const s=el.getAttribute("style")||"";
      return s.includes("padding: 0px 16px 96px") || (s.includes("96px") && s.includes("16px") && !s.includes("position: fixed"));
    }) || null;
  }

  function icon(){ return `<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/></svg>`; }

  function ensureTab(){
    const nav=getNav(); if(!nav || document.getElementById("bs-stats-tab")) return;
    const btn=document.createElement("button");
    btn.id="bs-stats-tab";
    btn.type="button";
    btn.innerHTML=`${icon()}<span style="font-size:10.5px;font-weight:500;letter-spacing:.2px">Statistics</span>`;
    btn.style.cssText="flex:1;background:none;border:none;padding:12px 4px 10px;display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--muted);min-width:0;";
    btn.addEventListener("click",(e)=>{ e.preventDefault(); e.stopPropagation(); showStats(); });
    nav.appendChild(btn);

    Array.from(nav.children).forEach(other=>{
      if(other===btn || other.dataset.bsStatsBound) return;
      other.dataset.bsStatsBound="1";
      other.addEventListener("click",()=>hideStats(),true);
    });
  }

  function buttonStyle(active){
    return `flex:1;border:1px solid ${active?"var(--accent)":"var(--border)"};background:${active?"var(--accent)":"var(--input-bg)"};color:${active?"var(--on-accent)":"var(--ink)"};border-radius:10px;padding:9px 8px;font-size:11px;font-weight:${active?700:600};`;
  }

  function ensurePanel(){
    let panel=document.getElementById("bs-statistics-panel");
    if(panel) return panel;
    const shell=getShell(); if(!shell) return null;
    panel=document.createElement("section");
    panel.id="bs-statistics-panel";
    panel.style.cssText="display:none;padding:18px 16px 100px;max-width:480px;margin:0 auto;color:var(--ink);";
    panel.innerHTML=`
      <div style="font-family:'Fraunces',serif;font-size:23px;font-weight:600;margin-bottom:4px">Statistics</div>
      <div id="bs-stats-subtitle" style="font-size:12px;color:var(--ink-soft);margin-bottom:14px">Current month</div>
      <div id="bs-period-controls" style="display:flex;gap:8px;margin-bottom:10px"></div>
      <div id="bs-view-controls" style="display:flex;gap:8px;margin-bottom:10px"></div>
      <div id="bs-year-wrap" style="display:none;margin-bottom:14px">
        <select id="bs-year-select" aria-label="Statistics year" style="width:100%;min-height:42px;border:1px solid var(--border);border-radius:10px;background:var(--input-bg);color:var(--ink);padding:0 10px"></select>
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;box-shadow:0 3px 14px rgba(31,41,51,.055)">
        <div id="bs-stats-totals" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:18px"></div>
        <div id="bs-pie" style="display:flex;justify-content:center;margin:8px 0 20px"></div>
        <div id="bs-legend" style="display:flex;flex-direction:column;gap:10px"></div>
      </div>`;
    const fixed=getFixedNav();
    if(fixed && fixed.parentElement===shell) shell.insertBefore(panel,fixed);
    else shell.appendChild(panel);
    bindControls(panel);
    return panel;
  }

  function bindControls(panel){
    const periods=panel.querySelector("#bs-period-controls");
    const views=panel.querySelector("#bs-view-controls");
    periods.addEventListener("click",(e)=>{
      const b=e.target.closest("button[data-period]"); if(!b) return;
      state.period=b.dataset.period; render();
    });
    views.addEventListener("click",(e)=>{
      const b=e.target.closest("button[data-view]"); if(!b) return;
      state.view=b.dataset.view; render();
    });
    panel.querySelector("#bs-year-select").addEventListener("change",(e)=>{ state.year=e.target.value; render(); });
  }

  function monthSnapshot(data){
    return { cycleKey:data.cycleKey||currentCycleKey, income:Array.isArray(data.income)?data.income:[], bills:Array.isArray(data.bills)?data.bills:[] };
  }

  function availableYears(data){
    const years=new Set([currentYear]);
    if(typeof data.cycleKey==="string") years.add(data.cycleKey.slice(0,4));
    (Array.isArray(data.history)?data.history:[]).forEach(h=>{
      if(typeof h?.cycleKey==="string" && /^\d{4}-\d{2}$/.test(h.cycleKey)) years.add(h.cycleKey.slice(0,4));
    });
    return Array.from(years).filter(y=>/^\d{4}$/.test(y)).sort((a,b)=>b.localeCompare(a));
  }

  function snapshotsForYear(data,year){
    const history=(Array.isArray(data.history)?data.history:[])
      .filter(h=>typeof h?.cycleKey==="string" && h.cycleKey.startsWith(`${year}-`))
      .map(h=>({ cycleKey:h.cycleKey, income:Array.isArray(h.income)?h.income:[], bills:Array.isArray(h.bills)?h.bills:[] }));
    const current=monthSnapshot(data);
    if(current.cycleKey.startsWith(`${year}-`) && !history.some(h=>h.cycleKey===current.cycleKey)) history.push(current);
    return history.sort((a,b)=>a.cycleKey.localeCompare(b.cycleKey));
  }

  function aggregateSnapshots(snaps){
    const income=[]; const bills=[];
    snaps.forEach(s=>{ income.push(...s.income); bills.push(...s.bills); });
    return { income, bills, months:snaps.length };
  }

  function mapRows(items,labelFn,amountFn){
    const map=new Map();
    items.forEach(item=>{
      const amount=amountFn(item);
      if(amount<=0) return;
      const label=labelFn(item) || "Other";
      map.set(label,(map.get(label)||0)+amount);
    });
    return Array.from(map,([label,amount])=>({label,amount})).sort((a,b)=>b.amount-a.amount);
  }

  function buildRows(income,bills){
    const incomeTotal=income.reduce((s,i)=>s+monthlyIncome(i),0);
    const outTotal=bills.reduce((s,b)=>s+(Number(b.amount)||0),0);
    let rows=[];
    let centerLabel="";
    let centerValue="";

    if(state.view==="in"){
      rows=mapRows(income,incomeLabel,monthlyIncome);
      centerLabel="Money In";
      centerValue=money(incomeTotal);
    } else if(state.view==="out"){
      rows=mapRows(bills,b=>b?.category||"Other",b=>Number(b?.amount)||0);
      centerLabel="Money Out";
      centerValue=money(outTotal);
    } else {
      rows=mapRows(bills,b=>b?.category||"Other",b=>Number(b?.amount)||0);
      const remaining=Math.max(0,incomeTotal-outTotal);
      if(remaining>0) rows.push({label:"Unallocated",amount:remaining,unallocated:true});
      centerLabel="Income used";
      centerValue=`${incomeTotal>0?Math.min(999,outTotal/incomeTotal*100).toFixed(0):0}%`;
    }
    return { rows, incomeTotal, outTotal, net:incomeTotal-outTotal, centerLabel, centerValue };
  }

  function renderControls(years){
    const p=document.getElementById("bs-period-controls");
    const v=document.getElementById("bs-view-controls");
    if(p) p.innerHTML=["monthly","annual"].map(x=>`<button type="button" data-period="${x}" style="${buttonStyle(state.period===x)}">${x==="monthly"?"Monthly":"Annual"}</button>`).join("");
    if(v) v.innerHTML=[
      ["overview","Overview"],["in","Money In"],["out","Money Out"]
    ].map(([key,label])=>`<button type="button" data-view="${key}" style="${buttonStyle(state.view===key)}">${label}</button>`).join("");

    const wrap=document.getElementById("bs-year-wrap");
    const select=document.getElementById("bs-year-select");
    if(wrap) wrap.style.display=state.period==="annual"?"block":"none";
    if(select){
      if(!years.includes(state.year)) state.year=years[0]||currentYear;
      select.innerHTML=years.map(y=>`<option value="${esc(y)}" ${y===state.year?"selected":""}>${esc(y)}</option>`).join("");
    }
  }

  function renderPie(result){
    const rows=result.rows;
    const pie=document.getElementById("bs-pie");
    const legend=document.getElementById("bs-legend");
    if(!pie || !legend) return;
    if(!rows.length){
      pie.innerHTML=`<div style="padding:36px 12px;text-align:center;color:var(--muted);font-size:12px">No data available for this view.</div>`;
      legend.innerHTML="";
      return;
    }

    const total=rows.reduce((s,r)=>s+r.amount,0)||1;
    let cum=0;
    const stops=rows.map((r,i)=>{
      const start=cum/total*360; cum+=r.amount; const end=cum/total*360;
      r.color=r.unallocated?"var(--border)":COLORS[i%COLORS.length];
      r.pct=r.amount/total*100;
      return `${r.color} ${start}deg ${end}deg`;
    });

    pie.innerHTML=`<div style="width:220px;height:220px;border-radius:50%;background:conic-gradient(${stops.join(",")});position:relative"><div style="position:absolute;inset:52px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center;text-align:center;padding:10px"><div><div style="font-size:10px;color:var(--muted);text-transform:uppercase">${esc(result.centerLabel)}</div><div style="font-size:21px;font-weight:700;margin-top:3px">${esc(result.centerValue)}</div></div></div></div>`;
    legend.innerHTML=rows.map(r=>`<div style="display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:center"><span style="width:10px;height:10px;border-radius:50%;background:${r.color};display:inline-block"></span><span style="font-size:12px;color:var(--ink);overflow:hidden;text-overflow:ellipsis">${esc(r.label)}</span><span style="font-size:12px;color:var(--ink-soft);white-space:nowrap">${r.pct.toFixed(1)}% · ${money(r.amount)}</span></div>`).join("");
  }

  async function render(){
    const panel=ensurePanel(); if(!panel || !window.storage?.get) return;
    let data={};
    try{ const r=await window.storage.get(STORAGE_KEY); data=JSON.parse(r.value||"{}"); }catch(_){ }

    const years=availableYears(data);
    renderControls(years);

    let income=[]; let bills=[]; let months=1;
    if(state.period==="annual"){
      const aggregated=aggregateSnapshots(snapshotsForYear(data,state.year));
      income=aggregated.income; bills=aggregated.bills; months=aggregated.months;
    } else {
      const current=monthSnapshot(data); income=current.income; bills=current.bills;
    }

    const result=buildRows(income,bills);
    const subtitle=document.getElementById("bs-stats-subtitle");
    if(subtitle) subtitle.textContent=state.period==="annual"?`${state.year} · ${months} month${months===1?"":"s"} of stored data`:"Current month";

    const totals=document.getElementById("bs-stats-totals");
    if(totals) totals.innerHTML=`
      <div style="padding:10px;border:1px solid var(--border);border-radius:12px;background:var(--input-bg);min-width:0"><div style="font-size:9px;color:var(--muted);text-transform:uppercase">Money In</div><div style="font-size:14px;font-weight:700;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${money(result.incomeTotal)}</div></div>
      <div style="padding:10px;border:1px solid var(--border);border-radius:12px;background:var(--input-bg);min-width:0"><div style="font-size:9px;color:var(--muted);text-transform:uppercase">Money Out</div><div style="font-size:14px;font-weight:700;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${money(result.outTotal)}</div></div>
      <div style="padding:10px;border:1px solid var(--border);border-radius:12px;background:var(--input-bg);min-width:0"><div style="font-size:9px;color:var(--muted);text-transform:uppercase">Net</div><div style="font-size:14px;font-weight:700;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${money(result.net)}</div></div>`;

    renderPie(result);
  }

  function showStats(){
    const panel=ensurePanel(), content=getContent(); if(!panel) return;
    if(content) content.style.display="none";
    const overview=document.getElementById("bs-ui-overview"); if(overview) overview.style.display="none";
    panel.style.display="block";
    const nav=getNav(); if(nav) Array.from(nav.children).forEach(b=>b.style.color="var(--muted)");
    const btn=document.getElementById("bs-stats-tab"); if(btn){ btn.style.color="var(--accent)"; const label=btn.querySelector("span"); if(label) label.style.fontWeight="600"; }
    render();
  }

  function hideStats(){
    const panel=document.getElementById("bs-statistics-panel"), content=getContent();
    if(panel) panel.style.display="none";
    if(content) content.style.display="block";
    const overview=document.getElementById("bs-ui-overview"); if(overview) overview.style.display="block";
    const btn=document.getElementById("bs-stats-tab"); if(btn){ btn.style.color="var(--muted)"; const label=btn.querySelector("span"); if(label) label.style.fontWeight="500"; }
  }

  let q=false;
  const refresh=()=>{
    if(q)return; q=true;
    requestAnimationFrame(()=>{ q=false; ensureTab(); ensurePanel(); });
  };
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  refresh();
})();
