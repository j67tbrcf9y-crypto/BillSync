/* BillSync responsive summary layout. */
(() => {
  "use strict";

  const DESKTOP_BREAKPOINT = 768;

  function placeOverviewBelowHeader() {
    const root = document.getElementById("root");
    const shell = root?.querySelector(".bs-shell");
    const overview = document.getElementById("bs-ui-overview");
    if (!shell || !overview) return;

    const topBar = Array.from(shell.children).find((el) => {
      const text = (el.textContent || "").trim();
      return text.includes("BillSync") && el.querySelector("button[aria-label='Change theme']");
    });
    if (!topBar) return;

    if (overview.parentElement !== shell || topBar.nextElementSibling !== overview) {
      shell.insertBefore(overview, topBar.nextSibling);
    }
  }

  function styleCard(card, index, desktop) {
    card.style.background = index === 0
      ? "linear-gradient(145deg, color-mix(in srgb, var(--accent) 11%, var(--card)), var(--card))"
      : "var(--card)";
    card.style.border = index === 0
      ? "1px solid color-mix(in srgb, var(--accent) 28%, var(--border))"
      : "1px solid var(--border)";
    card.style.borderRadius = "16px";
    card.style.boxShadow = "0 3px 14px rgba(31,41,51,.055)";
    card.style.padding = desktop ? "14px" : "14px 16px";
    card.style.minWidth = "0";

    const label = card.querySelector(".bs-summary-label");
    const value = card.querySelector(".bs-summary-value");
    const sub = card.querySelector(".bs-summary-sub");

    if (desktop) {
      card.style.display = "block";
      card.style.gridTemplateColumns = "";
      card.style.gridTemplateRows = "";
      card.style.columnGap = "";
      card.style.alignItems = "";
      if (label) { label.style.gridColumn = ""; label.style.gridRow = ""; }
      if (value) {
        value.style.gridColumn = "";
        value.style.gridRow = "";
        value.style.marginTop = "6px";
        value.style.textAlign = "left";
        value.style.whiteSpace = "nowrap";
        value.style.overflow = "visible";
        value.style.fontSize = "19px";
      }
      if (sub) { sub.style.gridColumn = ""; sub.style.gridRow = ""; sub.style.marginTop = "4px"; }
      return;
    }

    card.style.display = "grid";
    card.style.gridTemplateColumns = "minmax(0, 1fr) auto";
    card.style.gridTemplateRows = "auto auto";
    card.style.columnGap = "16px";
    card.style.alignItems = "center";
    if (label) { label.style.gridColumn = "1"; label.style.gridRow = "1"; }
    if (sub) { sub.style.gridColumn = "1"; sub.style.gridRow = "2"; sub.style.marginTop = "3px"; }
    if (value) {
      value.style.gridColumn = "2";
      value.style.gridRow = "1 / span 2";
      value.style.marginTop = "0";
      value.style.textAlign = "right";
      value.style.whiteSpace = "nowrap";
      value.style.overflow = "visible";
      value.style.fontSize = "20px";
    }
  }

  function applySummaryLayout() {
    const grid = document.querySelector("#bs-ui-overview .bs-summary-grid");
    if (!grid) return;

    const desktop = window.innerWidth >= DESKTOP_BREAKPOINT;
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = desktop ? "1.35fr 1fr 1fr" : "1fr";
    grid.style.gap = "10px";
    grid.style.background = "transparent";
    grid.style.border = "0";
    grid.style.borderRadius = "0";
    grid.style.boxShadow = "none";
    grid.style.overflow = "visible";
    Array.from(grid.children).forEach((card, index) => styleCard(card, index, desktop));
  }

  function hideLegacySummary() {
    const root = document.getElementById("root");
    if (!root) return;

    const duplicate = Array.from(root.querySelectorAll("div"))
      .filter((el) => {
        if (el.closest("#bs-ui-overview")) return false;
        const text = (el.textContent || "").replace(/\s+/g, " ").trim();
        return text.includes("Money In") && text.includes("Money Out") && text.includes("$")
          && el.querySelectorAll("button").length <= 3
          && text.length < 1200;
      })
      .sort((a, b) => (a.textContent || "").length - (b.textContent || "").length)[0];

    if (duplicate) duplicate.style.display = "none";
  }

  let queued = false;
  function refresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      placeOverviewBelowHeader();
      applySummaryLayout();
      hideLegacySummary();
    });
  }

  const root = document.getElementById("root");
  if (root) new MutationObserver(refresh).observe(root, { childList: true, subtree: true });
  window.addEventListener("resize", refresh, { passive: true });
  refresh();
})();
