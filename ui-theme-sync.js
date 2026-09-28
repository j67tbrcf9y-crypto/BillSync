/* Keep the UI preview overview synchronized with BillSync's active theme. */
(() => {
  "use strict";

  const THEME_VARS = [
    "--bg", "--card", "--nav-bg", "--input-bg", "--border", "--border-dashed",
    "--ink", "--ink-soft", "--muted", "--accent", "--on-accent", "--pending",
    "--due", "--due-ink", "--danger", "--disabled", "--track", "--rule-line", "--selection"
  ];

  function syncTheme() {
    const shell = document.querySelector(".bs-shell");
    if (!shell) return;
    const computed = getComputedStyle(shell);
    const targets = [
      document.documentElement,
      document.body,
      document.getElementById("bs-ui-overview"),
      document.querySelector(".bs-preview-banner")
    ].filter(Boolean);

    for (const name of THEME_VARS) {
      const value = computed.getPropertyValue(name).trim();
      if (!value) continue;
      targets.forEach((target) => target.style.setProperty(name, value));
    }

    const bg = computed.getPropertyValue("--bg").trim();
    const ink = computed.getPropertyValue("--ink").trim();
    if (bg) {
      document.documentElement.style.background = bg;
      document.body.style.background = bg;
    }
    if (ink) document.body.style.color = ink;
  }

  let shellObserver = null;
  function attachShellObserver() {
    const shell = document.querySelector(".bs-shell");
    if (!shell || shell.dataset.bsThemeObserved === "1") return;
    shell.dataset.bsThemeObserved = "1";
    shellObserver?.disconnect();
    shellObserver = new MutationObserver(syncTheme);
    shellObserver.observe(shell, { attributes: true, attributeFilter: ["style", "class"] });
    syncTheme();
  }

  const pageObserver = new MutationObserver(() => {
    attachShellObserver();
    syncTheme();
  });
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("click", () => {
    setTimeout(syncTheme, 0);
    setTimeout(syncTheme, 50);
    setTimeout(syncTheme, 150);
  }, true);

  attachShellObserver();
  syncTheme();
})();
