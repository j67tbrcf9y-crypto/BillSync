/* Consolidate duplicated financial summary UI in the redesign preview. */
(() => {
  "use strict";

  function consolidatePreviewSummary() {
    const grid = document.querySelector("#bs-ui-overview .bs-summary-grid");
    if (grid && !grid.dataset.bsConsolidated) {
      grid.dataset.bsConsolidated = "1";
      grid.style.display = "block";
      grid.style.background = "var(--card)";
      grid.style.border = "1px solid var(--border)";
      grid.style.borderRadius = "14px";
      grid.style.boxShadow = "0 3px 14px rgba(31,41,51,.055)";
      grid.style.overflow = "hidden";

      Array.from(grid.children).forEach((card, index, cards) => {
        card.style.background = "transparent";
        card.style.border = "0";
        card.style.borderRadius = "0";
        card.style.boxShadow = "none";
        card.style.padding = "13px 14px";
        card.style.display = "grid";
        card.style.gridTemplateColumns = "1fr auto";
        card.style.alignItems = "center";
        card.style.columnGap = "14px";
        if (index < cards.length - 1) card.style.borderBottom = "1px solid var(--border)";

        const label = card.querySelector(".bs-summary-label");
        const value = card.querySelector(".bs-summary-value");
        const sub = card.querySelector(".bs-summary-sub");
        if (label) label.style.gridColumn = "1";
        if (value) {
          value.style.gridColumn = "2";
          value.style.gridRow = "1 / span 2";
          value.style.marginTop = "0";
          value.style.textAlign = "right";
        }
        if (sub) {
          sub.style.gridColumn = "1";
          sub.style.marginTop = "3px";
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

    if (duplicate && !duplicate.dataset.bsFinancialSummaryHidden) {
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
      consolidatePreviewSummary();
    });
  };

  const observer = new MutationObserver(refresh);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  refresh();
})();
