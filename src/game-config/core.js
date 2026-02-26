(() => {
  const core = Object.freeze({
    STARTING_CHIPS: 1500,
    SMALL_BLIND: 10,
    BIG_BLIND: 20,
    TURN_TIME_MS: 30000,
    NEXT_HAND_IDLE_TIMEOUT_MS: 10000,
    NPC_MIN_THINK_MS: 2000,
    NPC_MAX_THINK_MS: 4000,
    HANDS_PER_LEVEL: 4,
    BLIND_LEVELS: Object.freeze([
      { small: 10, big: 20 },
      { small: 15, big: 30 },
      { small: 25, big: 50 },
      { small: 40, big: 80 },
      { small: 60, big: 120 },
      { small: 100, big: 200 }
    ]),
    TOURNAMENT_STAGES: Object.freeze([
      { name: "Back Room", npcChips: 1500, bonus: 0, botAggro: 0.68, npcItemCount: [0, 0], maxRarity: "normal" },
      { name: "Main Floor", npcChips: 2200, bonus: 220, botAggro: 0.94, npcItemCount: [1, 2], maxRarity: "rare" },
      { name: "VIP Lounge", npcChips: 3200, bonus: 340, botAggro: 1.16, npcItemCount: [3, 4], maxRarity: "epic" },
      { name: "Boss Table", npcChips: 4600, bonus: 520, botAggro: 1.38, npcItemCount: [3, 4], maxRarity: "epic" }
    ]),
    HISTORY_MAX: 180,
    HISTORY_PREVIEW: 22,
    SHOP_OFFER_COUNT: 3,
    SHOP_BASE_REROLL_COST: 120,
    SHOP_STAGE_REROLL_STEP: 35,
    SHOP_DEFAULT_REROLLS: 1,
    LOOT_SELL_MULTIPLIER: 0.68,
    LOOT_SELL_MIN: 60,
    SKIN_STORAGE_KEY: "underground-holdem-skin",
    TUTORIAL_STORAGE_KEY: "underground-holdem-tutorial-dismissed",
    SOUND_STORAGE_KEY: "underground-holdem-sound-enabled",
    PERFORMANCE_STORAGE_KEY: "underground-holdem-performance-mode",
    META_STORAGE_KEY: "underground-holdem-meta-v1",
    HOME_MUSIC_PLAYLIST: Object.freeze([
      "assets/audio/main.mp3",
      "assets/audio/main2.mp3",
      "assets/audio/main3.mp3",
      "assets/audio/main4.mp3"
    ]),
    GAME_MUSIC_PLAYLIST: Object.freeze([
      "assets/audio/game-jazz1.mp3",
      "assets/audio/game-jazz2.mp3",
      "assets/audio/game-mafia.mp3",
      "assets/audio/game-funk.mp3"
    ]),
    HOME_ART_CANDIDATES: Object.freeze([
      "assets/home/home-screen.png",
      "assets/home/home-screen.jpg",
      "assets/home/home-screen.webp"
    ]),
    RANKS: Object.freeze([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
    SUITS: Object.freeze(["S", "H", "D", "C"]),
    SUIT_SYMBOL: Object.freeze({
      S: "\u2660",
      H: "\u2665",
      D: "\u2666",
      C: "\u2663"
    }),
    HAND_NAME: Object.freeze({
      8: "Straight Flush",
      7: "Four of a Kind",
      6: "Full House",
      5: "Flush",
      4: "Straight",
      3: "Three of a Kind",
      2: "Two Pair",
      1: "One Pair",
      0: "High Card"
    })
  });

  window.HoldemCoreConfig = core;
})();
