/* BillSync additional bill categories for test branch. */
(() => {
  "use strict";

  const EXTRA_CATEGORIES = ["Loan", "Credit Card", "Taxes", "Medical", "Education"];

  function isCategorySelect(select) {
    if (!(select instanceof HTMLSelectElement)) return false;
    const values = Array.from(select.options, option => option.value);
    return values.includes("Housing") && values.includes("Utilities") && values.includes("Other");
  }

  function addCategories() {
    document.querySelectorAll("select").forEach((select) => {
      if (!isCategorySelect(select)) return;

      const other = Array.from(select.options).find((option) => option.value === "Other");
      EXTRA_CATEGORIES.forEach((category) => {
        if (Array.from(select.options).some((option) => option.value === category)) return;
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        if (other) select.insertBefore(option, other);
        else select.appendChild(option);
      });
    });
  }

  let queued = false;
  function refresh() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      addCategories();
    });
  }

  const root = document.getElementById("root");
  if (root) new MutationObserver(refresh).observe(root, { childList: true, subtree: true });
  refresh();
})();
