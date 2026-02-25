(() => {
  const meta = Object.freeze({
    BLOOD_COIN_STAGE_CLEAR_BASE: 3,
    BLOOD_COIN_STAGE_CLEAR_STEP: 1,
    BLOOD_COIN_HIGH_HAND_BONUS: Object.freeze({
      7: 3,
      8: 4
    }),
    META_UPGRADE_TREE: Object.freeze({
      bankroll: Object.freeze({
        id: "bankroll",
        label: "Starter Bankroll",
        values: Object.freeze([0, 150, 300, 500]),
        costs: Object.freeze([4, 8, 13]),
        maxLevel: 3
      }),
      reroll: Object.freeze({
        id: "reroll",
        label: "Shop Reroll +1",
        values: Object.freeze([0, 1, 2]),
        costs: Object.freeze([5, 10]),
        maxLevel: 2
      }),
      slots: Object.freeze({
        id: "slots",
        label: "Item Slot +1",
        values: Object.freeze([0, 1, 2, 3]),
        costs: Object.freeze([6, 12, 18]),
        maxLevel: 3
      })
    }),
    FEATURE_PHASE5_ECONOMY: true
  });

  window.HoldemMetaConfig = meta;
})();
