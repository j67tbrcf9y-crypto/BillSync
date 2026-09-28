/* BillSync UI redesign preview
 * Visual-only enhancement layer for the billsync-ui-redesign branch.
 * Does not change the ledger schema or financial data.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "ledger-data-v1";
  const STATUS_WORDS = new Set(["due", "pending", "paid", "n/a", "cleared"]);
  const THEME_VARS = [
    "--bg", "--card", "--nav-bg", "--input-bg", "--border", "--border-dashed",
    "--ink", "--ink-soft", "--muted", "--accent", "--on-accent", "--pending",
    "--due", "--due-ink", "--danger", "--disabled"
  ];

  const css = `
    :root {
      --bs-radius-lg: 18px;
      --bs-radius-md: 14px;
      --bs-shadow: 0 8px 28px rgba(31,41,51,.08);
      --bs-soft-shadow: 0 3px 14px rgba(31,41,51,.055);
    }
    html { scroll-behavior:smooth; }
    body {
      margin:0 !important;
      background:var(--bg, #EDEFEA) !important;
      color:var(--ink, #1F2933);
      transition:background .15s ease, color .15s ease;
    }
    #root { max-width:620px !important; margin:0 auto !important; padding-bottom:104px !important; }
    button, input, select { -webkit-tap-highlight-color:transparent; }
    button { cursor:pointer; }
    input, select { min-height:46px; border-radius:12px !important; }

    .bs-preview-banner {
      max-width:620px; margin:0 auto; padding:10px 16px 0; box-sizing:border-box;
      font:600 10px/1.2 'IBM Plex Mono', monospace; text-transform:uppercase; letter-spacing:.7px;
      color:var(--muted); text-align:center;
    }
    .bs-overview {
      max-width:620px; margin:0 auto; padding:12px 16px 4px; box-sizing:border-box;
      color:var(--ink);
    }
    .bs-overview-title {
      font:650 10px/1.2 'IBM Plex Mono', monospace; color:var(--muted);
      text-transform:uppercase; letter-spacing:.75px; margin:0 0 9px 2px;
    }
    .bs-summary-grid { display:grid; grid-template-columns:1.35fr 1fr 1fr; gap:10px; }
    .bs-summary-card {
      background:var(--card); border:1px solid var(--border); border-radius:var(--bs-radius-md);
      padding:14px; box-shadow:var(--bs-soft-shadow); min-width:0;
    }
    .bs-summary-card.primary {
      background:linear-gradient(145deg, color-mix(in srgb, var(--accent) 11%, var(--card)), var(--card));
      border-color:color-mix(in srgb, var(--accent) 28%, var(--border));
    }
    .bs-summary-label { font:600 9.5px/1.3 'IBM Plex Mono', monospace; text-transform:uppercase; letter-spacing:.55px; color:var(--muted); }
    .bs-summary-value { margin-top:6px; font-size:19px; font-weight:720; color:var(--ink); letter-spacing:-.4px; overflow:hidden; text-overflow:ellipsis; }
    .bs-summary-sub { margin-top:4px; font-size:10.5px; color:var(--ink-soft); }
    .bs-progress-wrap { margin-top:12px; }
    .bs-progress-track { height:7px; border-radius:999px; background:color-mix(in srgb, var(--border) 70%, transparent); overflow:hidden; }
    .bs-progress-fill { height:100%; width:0%; border-radius:inherit; background:var(--accent); transition:width .25s ease; }
    .bs-progress-label { display:flex; justify-content:space-between; margin-top:6px; color:var(--muted); font-size:10.5px; }

    .bs-section-heading { letter-spacing:-.15px; }
    .bs-list-row { border-radius:var(--bs-radius-md) !important; box-shadow:var(--bs-soft-shadow); }
    .bs-status-pill {
      min-height:34px !important; border-radius:999px !important; padding:7px 10px !important;
      font-size:11px !important; font-weight:650 !important; transition:transform .12s ease, opacity .12s ease;
    }
    .bs-status-pill:active { transform:scale(.96); }
    .bs-status-paid, .bs-status-cleared { box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent); }
    .bs-status-pending { box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--pending) 45%, transparent); }
    .bs-status-due { box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--danger) 30%, transparent); }

    .bs-add-action {
      min-height:48px !important; border-radius:13px !important; margin-top:16px !important;
      background:color-mix(in srgb, var(--accent) 6%, transparent) !important;
      border:1px dashed color-mix(in srgb, var(--accent) 42%, var(--border)) !important;
    }
    .bs-bottom-nav {
      border-top:1px solid color-mix(in srgb, var(--border) 78%, transparent) !important;
      box-shadow:0 -10px 30px rgba(31,41,51,.08) !important;
      backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
      background:color-mix(in srgb, var(--nav-bg) 88%, transparent) !important;
    }
    .bs-bottom-nav button { min-height:48px !important; border-radius:13px !important; }

    .bs-urgency-badge {
      display:inline-flex; align-items:center; border-radius:999px; padding:3px 7px; margin-left:6px;
      font:600 9px/1.2 'IBM Plex Mono', monospace; vertical-align:middle; white-space:nowrap;
    }
    .bs-urgency-overdue { color:var(--danger); background:color-mix(in srgb, var(--danger) 10%, transparent); }
    .bs-urgency-soon { color:var(--pending); background:color-mix(in srgb, var(--pending) 12%, transparent); }
    .bs-urgency-later { color:var(--muted); background:color-mix(in srgb, var(--border) 50%, transparent); }
    .bs-urgency-paid { color:var(--accent); background:color-mix(in srgb, var(--accent) 9%, transparent); }

    .bs-group-first::before {
      display:block; padding:12px 2px 6px; color:var(--muted);
      font:650 10px/1.2 'IBM Plex Mono', monospace; text-transform:uppercase; letter-spacing:.65px;
    }
    .bs-group-overdue::before { content:'Overdue'; color:var(--danger); }
    .bs-group-soon::before { content:'Due soon'; }
    .bs-group-later::before { content:'Later this month'; }
    .bs-group-paid::before { content:'Paid'; color:var(--accent); }

    .bs-goal-card, .bs-history-card { border-radius:var(--bs-radius-md) !important; box-shadow:var(--bs-soft-shadow) !important; }
    .bs-modal-sheet { border-radius:22px 22px 0 0 !important; }
    .bs-modal-sheet button { min-height:44px; }

    @media (max-width:430px) {
      .bs-summary-grid { grid-template-columns:1fr 1fr; }
      .bs-summary-card.primary { grid-column:1 / -1; }
      .bs-summary-value { font-size:18px; }
    }
  `;

  const style = document.createElement("style");
  style.id = "billsync-ui-redesign-style";
  style.textContent = css;
  document.head.appendChild(style);

  function money(value) {
    const n = Number(value) || 0;
    return (n < 0 ? "-$" : "$") + Math.abs(n).toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function monthlyAmount(item) {
    const value = Number(item?.amount) || 0;
    if (item?.frequency === "weekly") return value * 52 / 12;
    if (item?.frequency === "biweekly") return value * 26 / 12;
    if (item?.frequency === "yearly") return value / 12;
    return value;
  }

  function findThemeSource() {
    const root = document.getElementById("root");
    if (!root) return null;
    const candidates = [root, ...root.querySelectorAll("*")];
    for (const node of candidates) {
      const bg = getComputedStyle(node).getPropertyValue("--bg").trim();
      if (bg) return node;
    }
    return null;
  }

  function syncTheme() {
    const source = findThemeSource();
    if (!source) return;
    const computed = getComputedStyle(source);
    THEME_VARS.forEach((name) => {
      const value = computed.getPropertyValue(name).trim();
      if (value) document.documentElement.style.setProperty(name, value);
    });
    const bg = computed.getPropertyValue("--bg").trim();
    const ink = computed.getPropertyValue("--ink").trim();
    if (bg) document.body.style.background = bg;
    if (ink) document.body.style.color = ink;
  }

  function createOverview() {
    if (document.getElementById("bs-ui-overview")) return;
    const root = document.getElementById("root");
    if (!root || !root.parentNode) return;

    const banner = document.createElement("div");
    banner.className = "bs-preview-banner";
    banner.textContent = "UI redesign preview";

    const box = document.createElement("section");
    box.id = "bs-ui-overview";
    box.className = "bs-overview";
    box.innerHTML = `
      <div class="bs-overview-title">Overview</div>
      <div class="bs-summary-grid">
        <div class="bs-summary-card primary"><div class="bs-summary-label">Available</div><div class="bs-summary-value" id="bs-available">—</div><div class="bs-summary-sub">planned income minus bills</div></div>
        <div class="bs-summary-card"><div class="bs-summary-label">Money In</div><div class="bs-summary-value" id="bs-income">—</div><div class="bs-summary-sub">monthly expected</div></div>
        <div class="bs-summary-card"><div class="bs-summary-label">Money Out</div><div class="bs-summary-value" id="bs-bills">—</div><div class="bs-summary-sub">monthly bills</div></div>
      </div>
      <div class="bs-progress-wrap">
        <div class="bs-progress-track"><div class="bs-progress-fill" id="bs-progress-fill"></div></div>
        <div class="bs-progress-label"><span id="bs-paid-count">Loading…</span><span id="bs-progress-text">0%</span></div>
      </div>`;

    root.parentNode.insertBefore(banner, root);
    root.parentNode.insertBefore(box, root);
  }

  async function updateOverview() {
    createOverview();
    syncTheme();
    if (!window.storage?.get) return;
    try {
      const res = await window.storage.get(STORAGE_KEY);
      const data = JSON.parse(res.value || "{}");
      const bills = Array.isArray(data.bills) ? data.bills : [];
      const income = Array.isArray(data.income) ? data.income : [];
      const billTotal = bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
      const incomeTotal = income.reduce((s, i) => s + monthlyAmount(i), 0);
      const paidCount = bills.filter((b) => b.status === "paid").length;
      const pct = bills.length ? Math.round(paidCount / bills.length * 100) : 0;

      const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
      set("bs-available", money(incomeTotal - billTotal));
      set("bs-income", money(incomeTotal));
      set("bs-bills", money(billTotal));
      set("bs-paid-count", `${paidCount} of ${bills.length} bills paid`);
      set("bs-progress-text", `${pct}%`);
      const fill = document.getElementById("bs-progress-fill");
      if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    } catch (_) {
      const count = document.getElementById("bs-paid-count");
      if (count) count.textContent = "No monthly data yet";
    }
  }

  function decorateButtons() {
    document.querySelectorAll("button").forEach((button) => {
      const text = (button.textContent || "").trim().replace(/\s+/g, " ");
      const lower = text.toLowerCase();
      if (STATUS_WORDS.has(lower)) button.classList.add("bs-status-pill", `bs-status-${lower.replace("/", "")}`);
      if (/^add (money out|money in|goal|savings)/i.test(text)) button.classList.add("bs-add-action");
    });
  }

  function decorateSections() {
    document.querySelectorAll("div").forEach((el) => {
      const text = (el.textContent || "").trim();
      if (["Money Out", "Money In", "Savings Goals", "History"].includes(text) && el.children.length === 0) el.classList.add("bs-section-heading");
    });

    document.querySelectorAll("div").forEach((el) => {
      if (el.style?.position === "fixed" && (el.style?.bottom === "0px" || el.style?.bottom === "0" || el.style?.inset)) {
        if (el.querySelectorAll("button").length >= 3) el.classList.add("bs-bottom-nav");
      }
    });
  }

  function addUrgencyBadge(row, bucket, label) {
    row.querySelectorAll(".bs-urgency-badge").forEach((n) => n.remove());
    const name = row.querySelector("div[style*='font-weight: 600']") || row.querySelector("div");
    if (!name) return;
    const badge = document.createElement("span");
    badge.className = `bs-urgency-badge bs-urgency-${bucket}`;
    badge.textContent = label;
    name.appendChild(badge);
  }

  function groupBills() {
    const title = Array.from(document.querySelectorAll("div")).find((el) => el.children.length === 0 && (el.textContent || "").trim() === "Money Out");
    if (!title) return;
    const section = title.parentElement?.parentElement;
    if (!section) return;
    const list = Array.from(section.children).find((el) => el.style?.display === "flex" && el.style?.flexDirection === "column" && el.style?.gap === "8px");
    if (!list) return;

    const today = new Date().getDate();
    const buckets = { overdue: [], soon: [], later: [], paid: [] };
    Array.from(list.children).forEach((row) => {
      const text = (row.textContent || "").replace(/\s+/g, " ");
      const dueMatch = text.match(/due the\s+(\d{1,2})/i);
      if (!dueMatch) return;
      const dueDay = Number(dueMatch[1]);
      const paid = /\bpaid\b/i.test(text);
      let bucket = "later";
      let label = "Later";
      if (paid) { bucket = "paid"; label = "Paid"; }
      else if (dueDay < today) { bucket = "overdue"; label = "Overdue"; }
      else if (dueDay <= today + 7) { bucket = "soon"; label = "Due soon"; }

      buckets[bucket].push({ row, dueDay });
      const base = { overdue: 100, soon: 200, later: 300, paid: 400 }[bucket];
      row.style.order = String(base + dueDay);
      row.classList.add("bs-list-row");
      row.classList.remove("bs-group-first", "bs-group-overdue", "bs-group-soon", "bs-group-later", "bs-group-paid");
      addUrgencyBadge(row, bucket, label);
    });

    Object.entries(buckets).forEach(([bucket, entries]) => {
      entries.sort((a, b) => a.dueDay - b.dueDay);
      if (entries[0]) entries[0].row.classList.add("bs-group-first", `bs-group-${bucket}`);
    });
  }

  function decorateCards() {
    document.querySelectorAll("div").forEach((el) => {
      const txt = (el.textContent || "").trim();
      if (/saved|goal|target/i.test(txt) && el.style?.border === "1px solid var(--border)") el.classList.add("bs-goal-card");
      if (/\b20\d{2}\b/.test(txt) && el.style?.border === "1px solid var(--border)") el.classList.add("bs-history-card");
    });
  }

  let queued = false;
  function refreshVisuals() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      createOverview();
      syncTheme();
      decorateButtons();
      decorateSections();
      groupBills();
      decorateCards();
    });
  }

  const start = () => {
    createOverview();
    updateOverview();
    refreshVisuals();
    new MutationObserver(refreshVisuals).observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener("click", () => {
      setTimeout(syncTheme, 0);
      setTimeout(syncTheme, 80);
    }, true);

    if (window.storage?.set && !window.storage.__uiRedesignWrapped) {
      const base = window.storage;
      window.storage = {
        ...base,
        __uiRedesignWrapped: true,
        async set(...args) {
          const result = await base.set(...args);
          if (args[0] === STORAGE_KEY) setTimeout(updateOverview, 0);
          return result;
        }
      };
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
