/* Consolidate duplicated financial summary UI in the redesign preview. */
(() => {
  "use strict";

  function placeOverviewBelowHeader() {
    const overview = document.getElementById("bs-ui-overview");
    const root = document.getElementById("root");
    const shell = root?.querySelector(".bs-shell");
    if (!overview || !root || !shell) return;

    const topBar = Array.from(shell.children).find((el) => {
      const text = (el.textContent || "").trim();
      return text.includes("BillSync") && el.querySelector("button[aria-label='Change theme']");
    });
    if (!topBar) return;

    // Keep the React-owned header inside #root so its theme button keeps working.
    if (overview.parentElement !== shell || topBar.nextElementSibling !== overview) {
      shell.insertBefore(overview, topBar.nextSibling);
    }
  }

  function consolidatePreviewSummary() {
    const grid = document.querySelector("#bs-ui-overview .bs-summary-grid");
    if (grid) {
      grid.dataset.bsConsolidated = "1";
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "1.35fr 1fr 1fr";
      grid.style.gap = "10px";
      grid.style.background = "transparent";
      grid.style.border = "0";
      grid.style.borderRadius = "0";
      grid.style.boxShadow = "none";
      grid.style.overflow = "visible";

      Array.from(grid.children).forEach((card) => {
        card.style.background = "var(--card)";
        card.style.border = "1px solid var(--border)";
        card.style.borderRadius = "14px";
        card.style.boxShadow = "0 3px 14px rgba(31,41,51,.055)";
        card.style.padding = "14px";
        card.style.display = "block";
        card.style.borderBottom = "1px solid var(--border)";

        const value = card.querySelector(".bs-summary-value");
        const sub = card.querySelector(".bs-summary-sub");
        if (value) {
          value.style.marginTop = "6px";
          value.style.textAlign = "left";
        }
        if (sub) sub.style.marginTop = "4px";
      });
    }

    const root = document.getElementById("root");
    if (!root) return;
    const candidates = Array.from(root.querySelectorAll("div"))
      .filter((el) => {
        const text = (el.textContent || "").replace(/\s+/g, " ").trim();
        return text.includes("Money In") && text.includes("Money Out") && text.includes("$");
      })
      .sort((a, b) => (a.textContent || "").length - (b.textContent || "").length);

    const duplicate = candidates.find((el) => {
      if (el.closest("#bs-ui-overview")) return false;
      if (el.querySelectorAll("button").length > 3) return false;
      return (el.textContent || "").length < 1200;
    });

    if (duplicate) {
      duplicate.dataset.bsFinancialSummaryHidden = "1";
      duplicate.style.display = "none";
    }
  }

  function applyResponsiveLayout() {
    const grid = document.querySelector("#bs-ui-overview .bs-summary-grid");
    if (!grid) return;
    if (window.innerWidth <= 430) {
      grid.style.gridTemplateColumns = "1fr 1fr";
      const first = grid.children[0];
      if (first) first.style.gridColumn = "1 / -1";
    } else {
      grid.style.gridTemplateColumns = "1.35fr 1fr 1fr";
      const first = grid.children[0];
      if (first) first.style.gridColumn = "auto";
    }
  }

  let queued = false;
  const refresh = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      placeOverviewBelowHeader();
      consolidatePreviewSummary();
      applyResponsiveLayout();
    });
  };

  new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", refresh);
  refresh();
})();
