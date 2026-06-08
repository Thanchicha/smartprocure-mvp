/**
 * db-manager.js — SmartProcure Database Gateway
 * Loaded AFTER db-items.js, db-config.js, db-history.js
 * Re-exports all functions globally for backward-compatibility with dashboard.js
 * Also exposes a structured DB object for future use.
 */

/* ── Structured DB namespace ── */
var DB = {
  items: {
    getAll:    function() { return getAllItems(); },
    saveAll:   function(items) { return saveAll(items); },
    add:       function(item) { return addItemToDB(item); },
    remove:    function(id) { return removeItemFromDB(id); },
    updateGrams: function(id, meal, val) { return updateItemGrams(id, meal, val); },
    getGrams:  function(item, meal) { return getGrams(item, meal); },
    badges:    CAT_BADGE,
    colors:    CAT_COLOR,
  },
  config: {
    get:  function() { return getConfig(); },
    save: function(obj) { return saveConfig(obj); },
  },
  history: {
    getAll: function() { return getAllHistory(); },
    add:    function(record) { return addHistoryRecord(record); },
    clear:  function() { return clearHistory(); },
  },
};

/*
 * All individual functions (getAllItems, addItemToDB, etc.) are already
 * in global scope from db-items.js, db-config.js, db-history.js.
 * No re-export needed — dashboard.js calls them directly and remains unchanged.
 */
