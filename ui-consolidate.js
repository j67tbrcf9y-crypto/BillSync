/* Consolidate duplicated financial summary UI in BillSync. */
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

    // Keep the React-owned header inside #root so its theme button continues to work.
    if (overview.parentElement !== shell || topBar.nextElementSibling !== overview) {
      shell.insertBefore(overview, topBar.nextSibling);
    }
  }

  function consolidateSummary() {
    const grid = document.querySelector("#bs-ui-overview .bs-summary-grid");
    if (grid) {
      grid.dataset.bsConsolidated = "1";
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "1fr";
      grid.style.gap = "10px";
      grid.style.background = "transparent";
      grid.style.border = "0";
      grid.style.borderRadius = "0";
      grid.style.boxShadow = "none";
      grid.style.overflow = "visible";

      Array.from(grid.children).forEach((card, index) => {
        card.style.background = index === 0
          ? "linear-gradient(145deg, color-mix(in srgb, var(--accent) 11%, var(--card)), var(--card))"
          : "var(--card)";
        card.style.border = index === 0
          ? "1px solid color-mix(in srgb, var(--accent) 28%, var(--border))"
          : "1px solid var(--border)";
        card.style.borderRadius = "16px";
        card.style.boxShadow = "0 3px 14px rgba(31,41,51,.055)";
        card.style.padding = "14px 16px";
        card.style.display = "grid";
        card.style.gridTemplateColumns = "minmax(0, 1fr) auto";
        card.style.gridTemplateRows = "auto auto";
        card.style.columnGap = "16px";
        card.style.alignItems = "center";
        card.style.minWidth = "0";

        const label = card.querySelector(".bs-summary-label");
        const value = card.querySelector(".bs-summary-value");
        const sub = card.querySelector(".bs-summary-sub");

        if (label) {
          label.style.gridColumn = "1";
          label.style.gridRow = "1";
          label.style.minWidth = "0";
        }
        if (sub) {
          sub.style.gridColumn = "1";
          sub.style.gridRow = "2";
          sub.style.marginTop = "3px";
          sub.style.minWidth = "0";
        }
        if (value) {
          value.style.gridColumn = "2";
          value.style.gridRow = "1 / span 2";
          value.style.marginTop = "0";
          value.style.textAlign = "right";
          value.style.whiteSpace = "nowrap";
          value.style.overflow = "visible";
          value.style.textOverflow = "clip";
          value.style.maxWidth = "none";
          value.style.fontSize = "20px";
        }
      });
    }

    // Hide the older dashboard block if it repeats both Money In and Money Out.
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

  let queued = false;
  const refresh = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      placeOverviewBelowHeader();
      consolidateSummary();
    });
  };

  new MutationObserver(refresh).observe(document.documentElement, { childList: true, subtree: true });
  refresh();
})();
