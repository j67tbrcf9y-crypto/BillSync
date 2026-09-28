/* BillSync automatic monthly history rollover
 * Runs before the React app reads ledger-data-v1.
 * Archives the prior cycle exactly once, then starts the current cycle.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "ledger-data-v1";
  const HISTORY_LIMIT = 24;
  const baseStorage = window.storage;
  if (!baseStorage || baseStorage.__autoHistoryWrapped) return;

  const now = new Date();
  const currentCycleKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayISO = `${currentCycleKey}-${String(now.getDate()).padStart(2, "0")}`;

  function validCycleKey(value) {
    return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
  }

  function cycleLabel(cycleKey) {
    if (!validCycleKey(cycleKey)) return cycleKey || "Previous month";
    const [year, month] = cycleKey.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleString(void 0, { month: "long", year: "numeric" });
  }

  function inferStoredCycle(raw) {
    if (validCycleKey(raw?.cycleKey)) return raw.cycleKey;
    const candidates = [...(raw?.bills || []), ...(raw?.income || [])]
      .map((item) => item?.lastCycleKey)
      .filter(validCycleKey)
      .sort();
    return candidates.length ? candidates[candidates.length - 1] : currentCycleKey;
  }

  function billPctPaid(bills) {
    const total = (bills || []).reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    const paid = (bills || []).filter((bill) => bill.status === "paid")
      .reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    return total > 0 ? paid / total * 100 : 0;
  }

  function rollover(raw) {
    const data = raw && typeof raw === "object" ? raw : {};
    const storedCycleKey = inferStoredCycle(data);

    if (storedCycleKey === currentCycleKey) {
      if (data.cycleKey === currentCycleKey) return { data, changed: false };
      return { data: { ...data, cycleKey: currentCycleKey }, changed: true };
    }

    // A future cycle generally means the device clock moved backwards. Do not
    // archive or reset anything automatically in that situation.
    if (storedCycleKey > currentCycleKey) return { data, changed: false };

    const history = Array.isArray(data.history) ? [...data.history] : [];
    const alreadyArchived = history.some((entry) => entry?.cycleKey === storedCycleKey);

    if (!alreadyArchived) {
      history.unshift({
        id: `month-${storedCycleKey}`,
        cycleKey: storedCycleKey,
        monthLabel: cycleLabel(storedCycleKey),
        archivedAt: now.toISOString(),
        bills: (data.bills || []).map((bill) => ({ ...bill })),
        income: (data.income || []).map((item) => ({ ...item })),
        dailyLog: (data.dailyLog || []).map((entry) => ({ ...entry })),
        summary: { pctPaid: billPctPaid(data.bills || []) }
      });
    }

    const bills = (data.bills || []).map((bill) => ({
      ...bill,
      status: bill.recurring ? "due" : (bill.status || "due"),
      lastCycleKey: currentCycleKey
    }));
    const income = (data.income || []).map((item) => ({
      ...item,
      status: item.recurring ? "na" : (item.status || "na"),
      lastCycleKey: currentCycleKey
    }));

    return {
      changed: true,
      data: {
        ...data,
        cycleKey: currentCycleKey,
        bills,
        income,
        dailyLog: [{ day: now.getDate(), date: todayISO, pct: Math.round(billPctPaid(bills) * 10) / 10 }],
        history: history.slice(0, HISTORY_LIMIT),
        goals: Array.isArray(data.goals) ? data.goals : []
      }
    };
  }

  window.storage = {
    ...baseStorage,
    __autoHistoryWrapped: true,
    async get(key, ...args) {
      const result = await baseStorage.get(key, ...args);
      if (key !== STORAGE_KEY || !result?.value) return result;

      let parsed;
      try {
        parsed = JSON.parse(result.value);
      } catch (_) {
        return result;
      }

      const prepared = rollover(parsed);
      if (!prepared.changed) return result;

      const value = JSON.stringify(prepared.data);
      await baseStorage.set(key, value, ...args);
      return { ...result, value };
    }
  };
})();
