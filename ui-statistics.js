(() => {
  "use strict";
  const STORAGE_KEY = "ledger-data-v1";
  const COLORS = ["#1B5E4F","#2E6E8E","#C97B2E","#8A6D3B","#6B4E9E","#3FA08C","#B0673F","#4E5BA6","#8E5A7E","#6B7A3F","#C4568A","#5A6570"];
  const money = (v) => "$" + (Number(v)||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const monthlyIncome = (i) => { const v=Number(i?.amount)||0; if(i?.frequency==="weekly") return v*52/12; if(i?.frequency==="biweekly") return v*26/12; if(i?.frequency==="yearly") return v/12; return v; };

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

  function ensurePanel(){
    let panel=document.getElementById("bs-statistics-panel");
    if(panel) return panel;
    const shell=getShell(); if(!shell) return null;
    panel=document.createElement("section");
    panel.id="bs-statistics-panel";
    panel.style.cssText="display:none;padding:18px 16px 100px;max-width:480px;margin:0 auto;color:var(--ink);";
    panel.innerHTML=`<div style="font-family:'Fraunces',serif;font-size:23px;font-weight:600;margin-bottom:4px">Statistics</div><div style="font-size:12px;color:var(--ink-soft);margin-bottom:18px">How monthly income is being used</div><div style="background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;box-shadow:0 3px 14px rgba(31,41,51,.055)"><div id="bs-stats-totals" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px"></div><div id="bs-pie" style="display:flex;justify-content:center;margin:8px 0 20px"></div><div id="bs-legend" style="display:flex;flex-direction:column;gap:10px"></div></div>`;
    const fixed=getFixedNav();
    if(fixed && fixed.parentElement===shell) shell.insertBefore(panel,fixed);
    else shell.appendChild(panel);
    return panel;
  }

  async function render(){
    const panel=ensurePanel(); if(!panel || !window.storage?.get) return;
    let data={}; try{ const r=await window.storage.get(STORAGE_KEY); data=JSON.parse(r.value||"{}"); }catch(_){ }
    const income=Array.isArray(data.income)?data.income:[];
    const bills=Array.isArray(data.bills)?data.bills:[];
    const incomeTotal=income.reduce((s,i)=>s+monthlyIncome(i),0);
    const byCat=new Map();
    bills.forEach(b=>{ const a=Number(b.amount)||0; if(a>0){ const c=b.category||"Other"; byCat.set(c,(byCat.get(c)||0)+a); }});
    let rows=Array.from(byCat,([category,amount])=>({category,amount})).sort((a,b)=>b.amount-a.amount);
    const used=rows.reduce((s,r)=>s+r.amount,0);
    const remaining=Math.max(0,incomeTotal-used);
    if(remaining>0) rows.push({category:"Unallocated",amount:remaining,unallocated:true});
    const total=rows.reduce((s,r)=>s+r.amount,0)||1;
    let cum=0;
    const stops=rows.map((r,i)=>{ const a=cum/total*360; cum+=r.amount; const b=cum/total*360; r.color=r.unallocated?"var(--border-dashed)":COLORS[i%COLORS.length]; r.pct=incomeTotal>0?r.amount/incomeTotal*100:0; return `${r.color} ${a}deg ${b}deg`; });
    document.getElementById("bs-stats-totals").innerHTML=`<div style="padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--input-bg)"><div style="font-size:10px;color:var(--muted);text-transform:uppercase">Monthly income</div><div style="font-size:18px;font-weight:700;margin-top:4px">${money(incomeTotal)}</div></div><div style="padding:12px;border:1px solid var(--border);border-radius:12px;background:var(--input-bg)"><div style="font-size:10px;color:var(--muted);text-transform:uppercase">Allocated</div><div style="font-size:18px;font-weight:700;margin-top:4px">${money(used)}</div></div>`;
    document.getElementById("bs-pie").innerHTML=`<div style="width:220px;height:220px;border-radius:50%;background:conic-gradient(${stops.join(",")});position:relative"><div style="position:absolute;inset:52px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center;text-align:center;padding:10px"><div><div style="font-size:10px;color:var(--muted);text-transform:uppercase">Income used</div><div style="font-size:22px;font-weight:700">${incomeTotal>0?Math.min(999,used/incomeTotal*100).toFixed(0):0}%</div></div></div></div>`;
    document.getElementById("bs-legend").innerHTML=rows.map(r=>`<div style="display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center"><span style="width:10px;height:10px;border-radius:50%;background:${r.color};display:inline-block"></span><span style="font-size:12px;color:var(--ink)">${r.category}</span><span style="font-size:12px;color:var(--ink-soft)">${r.pct.toFixed(1)}% · ${money(r.amount)}</span></div>`).join("");
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

  let q=false; const refresh=()=>{ if(q)return; q=true; requestAnimationFrame(()=>{q=false; ensureTab(); ensurePanel();}); };
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  refresh();
})();
