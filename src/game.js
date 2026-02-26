(() => {
  const coreConfig = window.HoldemCoreConfig;
  const itemConfig = window.HoldemItemConfig;
  const metaConfig = window.HoldemMetaConfig;

  if (!coreConfig || !itemConfig || !metaConfig) {
    throw new Error("Missing config script. Load game-config/core.js, game-config/items.js, and game-config/meta.js before game.js.");
  }

  const {
    STARTING_CHIPS,
    SMALL_BLIND,
    BIG_BLIND,
    TURN_TIME_MS,
    NEXT_HAND_IDLE_TIMEOUT_MS,
    NPC_MIN_THINK_MS,
    NPC_MAX_THINK_MS,
    HANDS_PER_LEVEL,
    BLIND_LEVELS,
    TOURNAMENT_STAGES,
    HISTORY_MAX,
    HISTORY_PREVIEW,
    SHOP_OFFER_COUNT,
    SHOP_BASE_REROLL_COST,
    SHOP_STAGE_REROLL_STEP,
    SHOP_DEFAULT_REROLLS,
    LOOT_SELL_MULTIPLIER,
    LOOT_SELL_MIN,
    SKIN_STORAGE_KEY,
    TUTORIAL_STORAGE_KEY,
    SOUND_STORAGE_KEY,
    PERFORMANCE_STORAGE_KEY,
    META_STORAGE_KEY,
    HOME_MUSIC_PLAYLIST,
    GAME_MUSIC_PLAYLIST,
    HOME_ART_CANDIDATES,
    RANKS,
    SUITS,
    SUIT_SYMBOL,
    HAND_NAME
  } = coreConfig;

  const {
    ITEM_DB,
    HERO_STARTER_ITEMS,
    ITEM_RARITY_ORDER,
    BOT_ARCHETYPE_PROFILE,
    NPC_ARCHETYPE_BY_NAME,
    HERO_STARTER_DECK_MODS
  } = itemConfig;

  const {
    BLOOD_COIN_STAGE_CLEAR_BASE,
    BLOOD_COIN_STAGE_CLEAR_STEP,
    BLOOD_COIN_HIGH_HAND_BONUS,
    META_UPGRADE_TREE,
    FEATURE_PHASE5_ECONOMY
  } = metaConfig;

  const createDomRefs = window.HoldemCreateDomRefs;
  if (typeof createDomRefs !== "function") {
    throw new Error("Missing DOM module. Load game-modules/dom-refs.js before game.js.");
  }

  const state = {
    players: [],
    dealerIndex: -1,
    smallBlindIndex: -1,
    bigBlindIndex: -1,
    smallBlind: SMALL_BLIND,
    bigBlind: BIG_BLIND,
    deck: [],
    communityCards: [],
    pot: 0,
    stage: "idle",
    currentBet: 0,
    minRaise: BIG_BLIND,
    activePlayerIndex: -1,
    handOver: true,
    handId: 0,
    tournamentStage: 0,
    pendingStageAdvance: false,
    blindLevel: 0,
    waitingForHuman: false,
    actionLock: false,
    holePeek: false,
    animatingDeal: false,
    roundTransitioning: false,
    autoRunoutInProgress: false,
    replayInProgress: false,
    replayEntryId: null,
    turnTimerIntervalId: null,
    turnTimerDeadlineAt: 0,
    turnTimerRemainingMs: 0,
    turnTimerSeatIndex: -1,
    pendingBotThinkTimeoutId: null,
    dealtHoleCounts: [],
    communityVisible: 0,
    currentHandLog: [],
    lastHandLog: [],
    historySeq: 0,
    skin: "classic",
    tutorialHidden: false,
    stageBannerTimer: null,
    autoNextHandTimeoutId: null,
    homeVisible: true,
    homeGuideVisible: false,
    performanceMode: "high",
    gameOver: false,
    lootQueue: [],
    currentLoot: null,
    shopVisible: false,
    shopOffers: [],
    shopRerollsLeft: 0,
    markedLensUsedThisHand: false,
    markedLensReveal: null,
    riverForesightReveal: null,
    handWinnerIndices: [],
    handBloodCoinAwarded: false,
    runBloodCoins: 0,
    meta: {
      bloodCoins: 0,
      upgrades: {
        bankroll: 0,
        reroll: 0,
        slots: 0
      }
    },
    lastSettledBloodCoins: 0,
    balanceStats: {
      handsPlayed: 0,
      lastSummaryHand: 0,
      lastWinRecordedHand: -1,
      lastBannerHand: 0,
      items: {}
    },
    balanceTuning: {
      effectPctByItem: {},
      procPctByItem: {},
      lastAppliedStatsHand: 0
    },
    multiplayer: {
      enabled: false,
      connected: false,
      role: "solo",
      roomCode: "",
      clientId: "",
      authToken: "",
      stateSeq: 0,
      ackSeq: 0,
      outSeq: 0,
      displayName: "Player",
      yourSeatIndex: 2,
      hostClientId: "",
      roomMembers: [],
      seatAssignments: {},
      pendingRemoteActions: [],
      ws: null,
      snapshotRevision: 0,
      pendingSnapshotTimerId: null,
      queueing: false,
      queueTicket: "",
      queuePollTimerId: null,
      applyingRemoteSnapshot: false,
      joining: false,
      snapshotInitialized: false,
      serverMode: "authoritative"
    }
  };

  const el = createDomRefs(document);

  const audio = {
    context: null,
    master: null,
    ambientGain: null,
    ambientLfoGain: null,
    ambientOscA: null,
    ambientOscB: null,
    ambientLfo: null,
    enabled: true,
    unlocked: false,
    musicEl: null,
    musicContext: "",
    musicPlaylist: [],
    musicIndex: 0,
    musicTrackSrc: "",
    musicFailCount: 0,
    mutedAutoplay: false
  };

  const BASE_PLAYER_NAMES = ["Viper", "Rook", "You", "Jade"];
  const HOST_SEAT_INDEX = 2;
  const REMOTE_CONTROLLABLE_SEATS = [0, 1, 3];
  const MULTIPLAYER_SESSION_STORAGE_KEY = "holdem_multiplayer_session_v1";
  const MULTIPLAYER_SYNC_STATE_KEYS = [
    "players",
    "dealerIndex",
    "smallBlindIndex",
    "bigBlindIndex",
    "smallBlind",
    "bigBlind",
    "communityCards",
    "pot",
    "stage",
    "currentBet",
    "minRaise",
    "activePlayerIndex",
    "handOver",
    "handId",
    "tournamentStage",
    "pendingStageAdvance",
    "blindLevel",
    "waitingForHuman",
    "actionLock",
    "animatingDeal",
    "roundTransitioning",
    "autoRunoutInProgress",
    "replayInProgress",
    "replayEntryId",
    "turnTimerRemainingMs",
    "turnTimerSeatIndex",
    "dealtHoleCounts",
    "communityVisible",
    "currentHandLog",
    "lastHandLog",
    "historySeq",
    "gameOver",
    "lootQueue",
    "currentLoot",
    "shopVisible",
    "shopOffers",
    "shopRerollsLeft",
    "markedLensUsedThisHand",
    "markedLensReveal",
    "riverForesightReveal",
    "handWinnerIndices",
    "handBloodCoinAwarded",
    "runBloodCoins",
    "lastSettledBloodCoins"
  ];

  function defaultMetaState() {
    return {
      bloodCoins: 0,
      upgrades: {
        bankroll: 0,
        reroll: 0,
        slots: 0
      }
    };
  }

  function normalizeMetaState(raw) {
    const fallback = defaultMetaState();
    const source = raw && typeof raw === "object" ? raw : {};
    const upgrades = source.upgrades && typeof source.upgrades === "object" ? source.upgrades : {};

    const normalized = {
      bloodCoins: Math.max(0, Math.floor(Number(source.bloodCoins) || 0)),
      upgrades: {
        bankroll: 0,
        reroll: 0,
        slots: 0
      }
    };

    Object.keys(META_UPGRADE_TREE).forEach((key) => {
      const config = META_UPGRADE_TREE[key];
      const level = Math.max(0, Math.floor(Number(upgrades[key]) || 0));
      normalized.upgrades[key] = Math.min(config.maxLevel, level);
    });

    return {
      bloodCoins: normalized.bloodCoins,
      upgrades: {
        bankroll: normalized.upgrades.bankroll ?? fallback.upgrades.bankroll,
        reroll: normalized.upgrades.reroll ?? fallback.upgrades.reroll,
        slots: normalized.upgrades.slots ?? fallback.upgrades.slots
      }
    };
  }

  function metaLevel(key) {
    const config = META_UPGRADE_TREE[key];
    if (!config) return 0;
    const level = Number(state.meta && state.meta.upgrades && state.meta.upgrades[key]);
    if (!Number.isFinite(level)) return 0;
    return Math.max(0, Math.min(config.maxLevel, Math.floor(level)));
  }

  function metaValue(key) {
    const config = META_UPGRADE_TREE[key];
    if (!config) return 0;
    const level = metaLevel(key);
    const values = Array.isArray(config.values) ? config.values : [];
    if (level < 0 || level >= values.length) return 0;
    return Math.max(0, Number(values[level]) || 0);
  }

  function nextMetaUpgradeCost(key) {
    const config = META_UPGRADE_TREE[key];
    if (!config) return null;
    const level = metaLevel(key);
    if (level >= config.maxLevel) return null;
    const costs = Array.isArray(config.costs) ? config.costs : [];
    return Math.max(0, Math.floor(Number(costs[level]) || 0));
  }

  function heroStartingChips() {
    return STARTING_CHIPS + metaValue("bankroll");
  }

  function heroExtraShopRerolls() {
    return metaValue("reroll");
  }

  function heroItemSlotCount() {
    return Math.max(4, Math.min(7, 4 + metaValue("slots")));
  }

  function saveMetaState() {
    try {
      window.localStorage.setItem(META_STORAGE_KEY, JSON.stringify(state.meta));
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function loadMetaState() {
    let raw = null;
    try {
      const stored = window.localStorage.getItem(META_STORAGE_KEY);
      raw = stored ? JSON.parse(stored) : null;
    } catch (error) {
      raw = null;
    }
    state.meta = normalizeMetaState(raw);
  }

  function applyMetaToPlayers({ refillHeroChips = false } = {}) {
    const hero = humanPlayer();
    if (!hero) return;

    hero.maxItemSlots = defaultItemSlotsForPlayer(true);
    compactPlayerItems(hero);

    const untouchedRun = state.handId === 0 && state.handOver && state.stage === "idle";
    if (refillHeroChips || untouchedRun) {
      hero.chips = heroStartingChips();
      hero.wasAliveAtHandStart = hero.chips > 0;
    }
  }

  function addRunBloodCoins(amount, reason = "") {
    const gained = Math.max(0, Math.floor(Number(amount) || 0));
    if (gained <= 0) return;
    state.runBloodCoins += gained;
    if (reason) {
      logHistory(`Blood Coin +${gained} (${reason}).`, "meta");
    }
  }

  function settleRunBloodCoins() {
    const payout = Math.max(0, Math.floor(Number(state.runBloodCoins) || 0));
    state.lastSettledBloodCoins = payout;
    if (payout > 0) {
      state.meta.bloodCoins = Math.max(0, Math.floor(Number(state.meta.bloodCoins) || 0)) + payout;
      saveMetaState();
    }
    state.runBloodCoins = 0;
    return payout;
  }

  function tryBuyMetaUpgrade(key) {
    const config = META_UPGRADE_TREE[key];
    if (!config) return;

    const cost = nextMetaUpgradeCost(key);
    if (cost === null) {
      setStatus(`${config.label} maxed.`, "This upgrade is already max level.");
      render();
      return;
    }

    if (state.meta.bloodCoins < cost) {
      setStatus("Not enough Blood Coins.", `${config.label} requires ${cost}.`);
      render();
      return;
    }

    state.meta.bloodCoins -= cost;
    state.meta.upgrades[key] = metaLevel(key) + 1;
    saveMetaState();
    applyMetaToPlayers({ refillHeroChips: state.homeVisible && state.handId === 0 && state.handOver });
    setStatus(`${config.label} upgraded.`, `Blood Coin -${cost}`);
    render();
  }

  function defaultItemSlotsForPlayer(isHuman) {
    return isHuman ? heroItemSlotCount() : 2;
  }

  function archetypeIdFor(name, isHuman) {
    if (isHuman) return "hero";
    return NPC_ARCHETYPE_BY_NAME[name] || "trickster";
  }

  function archetypeProfileFor(player) {
    if (!player || player.isHuman) return null;
    return BOT_ARCHETYPE_PROFILE[player.botArchetype] || BOT_ARCHETYPE_PROFILE.trickster;
  }

  function createPlayers() {
    state.players = [
      makePlayer(BASE_PLAYER_NAMES[0], false),
      makePlayer(BASE_PLAYER_NAMES[1], false),
      makePlayer(BASE_PLAYER_NAMES[2], true),
      makePlayer(BASE_PLAYER_NAMES[3], false)
    ];
    state.players.forEach((player) => {
      seedStarterLoadout(player);
    });
    assignNpcLoadoutsForStage(state.tournamentStage);
    applyRoomRosterToPlayers();
  }

  function makePlayer(name, isHuman) {
    const botArchetype = archetypeIdFor(name, isHuman);
    const botProfile = BOT_ARCHETYPE_PROFILE[botArchetype] || BOT_ARCHETYPE_PROFILE.trickster;

    return {
      name,
      isHuman,
      chips: isHuman ? heroStartingChips() : STARTING_CHIPS,
      hand: [],
      folded: false,
      allIn: false,
      currentBet: 0,
      acted: false,
      lastAction: "",
      actionTone: "",
      showdown: null,
      invested: 0,
      items: [],
      deck_mods: [],
      maxItemSlots: defaultItemSlotsForPlayer(isHuman),
      botArchetype,
      botAggroBase: isHuman ? 1 : botProfile.aggroBase,
      wasAliveAtHandStart: true,
      handStartChips: isHuman ? heroStartingChips() : STARTING_CHIPS,
      aggressiveActionsThisHand: 0,
      reachedRiverThisHand: false,
      sleightUsedRun: false,
      riverForesightUsedThisHand: false,
      wentAllInThisHand: false,
      insuranceRefundedThisHand: false
    };
  }

  function cloneDeckMods(mods) {
    if (!Array.isArray(mods)) return [];
    return mods.map((mod) => ({ ...mod }));
  }

  function seedStarterLoadout(player) {
    if (!player) return;
    const starterIds = player.isHuman ? HERO_STARTER_ITEMS : [];
    const maxSlots = Math.max(0, Number(player.maxItemSlots) || 0);
    player.items = starterIds.slice(0, maxSlots).map((id) => ({ id }));
    player.deck_mods = player.isHuman ? cloneDeckMods(HERO_STARTER_DECK_MODS) : [];
  }

  function resetTable() {
    state.players.forEach((player) => {
      player.chips = player.isHuman ? heroStartingChips() : STARTING_CHIPS;
      player.hand = [];
      player.folded = false;
      player.allIn = false;
      player.currentBet = 0;
      player.acted = false;
      player.lastAction = "";
      player.actionTone = "";
      player.showdown = null;
      player.invested = 0;
      player.wasAliveAtHandStart = player.chips > 0;
      player.handStartChips = player.chips;
      player.aggressiveActionsThisHand = 0;
      player.reachedRiverThisHand = false;
      player.sleightUsedRun = false;
      player.riverForesightUsedThisHand = false;
      player.wentAllInThisHand = false;
      player.insuranceRefundedThisHand = false;
      player.maxItemSlots = defaultItemSlotsForPlayer(player.isHuman);
      seedStarterLoadout(player);
    });
    state.dealerIndex = -1;
    state.smallBlindIndex = -1;
    state.bigBlindIndex = -1;
    state.blindLevel = 0;
    state.smallBlind = SMALL_BLIND;
    state.bigBlind = BIG_BLIND;
    state.tournamentStage = 0;
    state.pendingStageAdvance = false;
    state.runBloodCoins = 0;
    state.dealtHoleCounts = state.players.map(() => 0);
    state.communityVisible = 0;
    state.multiplayer.pendingRemoteActions = [];
    state.markedLensUsedThisHand = false;
    state.markedLensReveal = null;
    state.riverForesightReveal = null;
    state.handWinnerIndices = [];
    clearEconomyState();
    assignNpcLoadoutsForStage(state.tournamentStage);
  }

  function initSeats() {
    el.seats.forEach((seat) => {
      const clone = el.seatTemplate.content.cloneNode(true);
      seat.innerHTML = "";
      seat.appendChild(clone);
    });
  }

  function buildDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit });
      }
    }
    return deck;
  }

  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function hasItem(player, itemId) {
    if (!player || !Array.isArray(player.items)) return false;
    return player.items.some((entry) => {
      const id = typeof entry === "string" ? entry : entry && entry.id;
      return id === itemId;
    });
  }

  function isClickableUseItemId(itemId) {
    return itemId === "sleight_of_hand" || itemId === "marked_lenses" || itemId === "river_foresight";
  }

  function ensureBalanceStats() {
    if (!state.balanceStats || typeof state.balanceStats !== "object") {
      state.balanceStats = {
        handsPlayed: 0,
        lastSummaryHand: 0,
        lastWinRecordedHand: -1,
        lastBannerHand: 0,
        items: {}
      };
    }
    if (!Number.isFinite(state.balanceStats.lastBannerHand)) {
      state.balanceStats.lastBannerHand = 0;
    }
    if (!state.balanceStats.items || typeof state.balanceStats.items !== "object") {
      state.balanceStats.items = {};
    }
    Object.keys(ITEM_DB).forEach((itemId) => {
      if (!state.balanceStats.items[itemId]) {
        state.balanceStats.items[itemId] = { hands: 0, procs: 0, wins: 0 };
      }
    });
    return state.balanceStats;
  }

  function ensureBalanceTuning() {
    if (!state.balanceTuning || typeof state.balanceTuning !== "object") {
      state.balanceTuning = {
        effectPctByItem: {},
        procPctByItem: {},
        lastAppliedStatsHand: 0
      };
    }
    if (!state.balanceTuning.effectPctByItem || typeof state.balanceTuning.effectPctByItem !== "object") {
      state.balanceTuning.effectPctByItem = {};
    }
    if (!state.balanceTuning.procPctByItem || typeof state.balanceTuning.procPctByItem !== "object") {
      state.balanceTuning.procPctByItem = {};
    }
    if (!Number.isFinite(state.balanceTuning.lastAppliedStatsHand)) {
      state.balanceTuning.lastAppliedStatsHand = 0;
    }
    return state.balanceTuning;
  }

  function itemEffectScale(itemId) {
    const tuning = ensureBalanceTuning();
    const pct = Number(tuning.effectPctByItem[itemId]) || 0;
    return clamp(1 + pct / 100, 0.4, 1.8);
  }

  function itemProcScale(itemId) {
    const tuning = ensureBalanceTuning();
    const pct = Number(tuning.procPctByItem[itemId]) || 0;
    return clamp(1 + pct / 100, 0.55, 1.55);
  }

  function itemCombinedScale(itemId, min = 0.3, max = 2.2) {
    return clamp(itemEffectScale(itemId) * itemProcScale(itemId), min, max);
  }

  const BALANCE_TARGET_WINRATE_MIN = 0.46;
  const BALANCE_TARGET_WINRATE_MAX = 0.58;
  const BALANCE_SAMPLE_MIN_HANDS = 8;
  const BALANCE_EFFECT_ADJUST_MAX = 20;
  const BALANCE_PROC_ADJUST_MAX = 12;

  function balanceBandForWinRate(winRate) {
    if (!Number.isFinite(winRate)) return "unknown";
    if (winRate < BALANCE_TARGET_WINRATE_MIN) return "cold";
    if (winRate > BALANCE_TARGET_WINRATE_MAX) return "hot";
    return "ok";
  }

  function balanceBandEmoji(band) {
    if (band === "hot") return "🔴";
    if (band === "cold") return "🔵";
    if (band === "ok") return "🟢";
    return "⚪";
  }

  function balanceBandLabel(band) {
    if (band === "hot") return "HOT";
    if (band === "cold") return "COLD";
    if (band === "ok") return "OK";
    return "N/A";
  }

  function pctText(ratio) {
    if (!Number.isFinite(ratio)) return "0%";
    return `${Math.round(ratio * 100)}%`;
  }

  function clampPct(value, limit) {
    const safe = Number(value);
    if (!Number.isFinite(safe)) return 0;
    const bounded = Math.max(-limit, Math.min(limit, safe));
    return Math.round(bounded);
  }

  function tuningSuggestionForEntry(entry) {
    if (!entry || entry.hands < BALANCE_SAMPLE_MIN_HANDS) {
      return { kind: "none", deltaPct: 0, label: "유지", confidence: 0 };
    }

    const center = (BALANCE_TARGET_WINRATE_MIN + BALANCE_TARGET_WINRATE_MAX) / 2;
    const winGap = entry.winRate - center;
    const absGap = Math.abs(winGap);
    const confidence = Math.min(1, entry.hands / 30);

    if (absGap < 0.015) {
      if (entry.procRate < 0.14) {
        const delta = clampPct((0.14 - entry.procRate) * 120, BALANCE_PROC_ADJUST_MAX);
        if (delta > 0) {
          return { kind: "proc", deltaPct: delta, label: `발동률 +${delta}%`, confidence };
        }
      }
      if (entry.procRate > 0.72) {
        const delta = clampPct((entry.procRate - 0.72) * 120, BALANCE_PROC_ADJUST_MAX);
        if (delta > 0) {
          return { kind: "proc", deltaPct: -delta, label: `발동률 -${delta}%`, confidence };
        }
      }
      return { kind: "none", deltaPct: 0, label: "유지", confidence };
    }

    const effectShift = clampPct((winGap / 0.06) * 10, BALANCE_EFFECT_ADJUST_MAX);
    if (effectShift > 0) {
      const nerf = Math.max(4, Math.abs(effectShift));
      return { kind: "effect", deltaPct: -nerf, label: `효과 -${nerf}%`, confidence };
    }
    const buff = Math.max(4, Math.abs(effectShift));
    return { kind: "effect", deltaPct: buff, label: `효과 +${buff}%`, confidence };
  }

  function balanceStatEntry(itemId) {
    if (!itemId || !ITEM_DB[itemId]) return null;
    const stats = ensureBalanceStats();
    if (!stats.items[itemId]) {
      stats.items[itemId] = { hands: 0, procs: 0, wins: 0 };
    }
    return stats.items[itemId];
  }

  function trackHandItemExposure() {
    const stats = ensureBalanceStats();
    stats.handsPlayed += 1;
    state.players.forEach((player) => {
      if (!player || player.chips <= 0 || player.folded) return;
      normalizePlayerItemEntries(player).forEach((entry) => {
        const stat = balanceStatEntry(entry.id);
        if (!stat) return;
        stat.hands += 1;
      });
    });
  }

  function trackItemProc(itemId) {
    const stat = balanceStatEntry(itemId);
    if (!stat) return;
    stat.procs += 1;
  }

  function trackWinningItems(winnerIndices) {
    const stats = ensureBalanceStats();
    if (stats.lastWinRecordedHand === state.handId) return;
    if (!Array.isArray(winnerIndices) || winnerIndices.length <= 0) return;
    stats.lastWinRecordedHand = state.handId;
    winnerIndices.forEach((winnerIndex) => {
      const player = state.players[winnerIndex];
      if (!player) return;
      normalizePlayerItemEntries(player).forEach((entry) => {
        const stat = balanceStatEntry(entry.id);
        if (!stat) return;
        stat.wins += 1;
      });
    });
  }

  function collectBalanceSampledEntries() {
    const stats = ensureBalanceStats();
    return Object.entries(stats.items)
      .filter(([itemId, stat]) => ITEM_DB[itemId] && stat.hands >= BALANCE_SAMPLE_MIN_HANDS)
      .map(([itemId, stat]) => {
        const hands = Math.max(0, Number(stat.hands) || 0);
        const procs = Math.max(0, Number(stat.procs) || 0);
        const wins = Math.max(0, Number(stat.wins) || 0);
        const winRate = wins / Math.max(1, hands);
        const procRate = procs / Math.max(1, hands);
        const band = balanceBandForWinRate(winRate);
        const center = (BALANCE_TARGET_WINRATE_MIN + BALANCE_TARGET_WINRATE_MAX) / 2;
        const dev = Math.abs(winRate - center);
        const entry = { itemId, stat, hands, procs, wins, winRate, procRate, band, dev };
        const suggestion = tuningSuggestionForEntry(entry);
        const severity =
          (band === "hot" || band === "cold" ? dev * 100 : 0) +
          Math.abs(suggestion.deltaPct || 0) * (0.45 + suggestion.confidence * 0.55);
        return { ...entry, suggestion, severity };
      });
  }

  function getPendingAutoTuneEntries(limit = 4) {
    const safeLimit = Math.max(1, Math.floor(Number(limit) || 4));
    return collectBalanceSampledEntries()
      .filter((entry) => entry.suggestion && entry.suggestion.kind !== "none")
      .sort((a, b) => b.severity - a.severity)
      .slice(0, safeLimit);
  }

  function maybeLogBalanceSummary(force = false) {
    const stats = ensureBalanceStats();
    const handsPlayed = Math.max(0, Number(stats.handsPlayed) || 0);
    if (handsPlayed <= 0) return;
    if (!force) {
      if (handsPlayed < 5) return;
      if (handsPlayed === stats.lastSummaryHand) return;
      if (handsPlayed % 5 !== 0) return;
    }
    stats.lastSummaryHand = handsPlayed;
    const sampled = collectBalanceSampledEntries();
    if (sampled.length <= 0) return;

    const rows = sampled
      .sort((a, b) => {
        const procDiff = b.procs - a.procs;
        if (procDiff !== 0) return procDiff;
        return b.winRate - a.winRate;
      })
      .slice(0, 6)
      .map((entry) => {
        const itemName = ITEM_DB[entry.itemId].name;
        const tag = `${balanceBandEmoji(entry.band)}${balanceBandLabel(entry.band)}`;
        const suggestText = entry.suggestion && entry.suggestion.kind !== "none" ? ` · 권장 ${entry.suggestion.label}` : "";
        return `${tag} ${itemName} H${entry.hands}/P${entry.procs}(${pctText(entry.procRate)})/W${pctText(entry.winRate)}${suggestText}`;
      });

    if (rows.length > 0) {
      const hasHot = sampled.some((entry) => entry.band === "hot");
      const hasCold = sampled.some((entry) => entry.band === "cold");
      const summaryType = hasHot ? "balance-hot" : hasCold ? "balance-cold" : "balance-ok";
      logHistory(`아이템 밸런스 리포트 (${handsPlayed}핸드): ${rows.join(" | ")}`, summaryType);

      const suggestions = getPendingAutoTuneEntries(4).map((entry) => `${ITEM_DB[entry.itemId].name} ${entry.suggestion.label}`);
      if (suggestions.length > 0) {
        logHistory(`자동 밸런스 제안: ${suggestions.join(" | ")}`, summaryType);
      }

      if (stats.lastBannerHand !== handsPlayed) {
        if (hasHot || hasCold) {
          const offenders = sampled
            .filter((entry) => entry.band === "hot" || entry.band === "cold")
            .sort((a, b) => b.severity - a.severity)
            .slice(0, 3)
            .map((entry) => {
              const suggestionText = entry.suggestion && entry.suggestion.kind !== "none" ? ` ${entry.suggestion.label}` : "";
              return `${ITEM_DB[entry.itemId].name} ${pctText(entry.winRate)}${suggestionText}`;
            })
            .join(" · ");
          const tone = hasHot ? "balance-hot" : "balance-cold";
          const title = hasHot ? "BALANCE WARNING · HOT" : "BALANCE WARNING · COLD";
          const sub = offenders || "아이템 승률이 목표 구간을 벗어났습니다.";
          showStageBanner(title, sub, tone, 2200);
          stats.lastBannerHand = handsPlayed;
        } else if (suggestions.length > 0) {
          const tip = suggestions.slice(0, 2).join(" · ");
          showStageBanner("BALANCE TIP", tip, "balance-ok", 1700);
          stats.lastBannerHand = handsPlayed;
        }
      }
    }
  }

  function applyAutoBalanceTune(limit = 4) {
    const stats = ensureBalanceStats();
    const tuning = ensureBalanceTuning();
    const handsPlayed = Math.max(0, Number(stats.handsPlayed) || 0);
    if (handsPlayed < BALANCE_SAMPLE_MIN_HANDS) {
      setStatus("오토 튠 대기중.", `${BALANCE_SAMPLE_MIN_HANDS}핸드 이상 데이터가 필요합니다.`);
      return;
    }
    if (tuning.lastAppliedStatsHand === handsPlayed) {
      setStatus("이미 적용됨.", "새 핸드 데이터가 쌓인 뒤 다시 적용할 수 있습니다.");
      return;
    }

    const entries = getPendingAutoTuneEntries(limit);
    if (entries.length <= 0) {
      setStatus("조정 필요 없음.", "현재 샘플에서 자동 조정 제안이 없습니다.");
      return;
    }

    const applied = [];
    entries.forEach((entry) => {
      const itemId = entry.itemId;
      const suggestion = entry.suggestion;
      if (!itemId || !suggestion || suggestion.kind === "none") return;
      if (suggestion.kind === "effect") {
        const current = Number(tuning.effectPctByItem[itemId]) || 0;
        tuning.effectPctByItem[itemId] = clamp(current + suggestion.deltaPct, -50, 50);
      } else if (suggestion.kind === "proc") {
        const current = Number(tuning.procPctByItem[itemId]) || 0;
        tuning.procPctByItem[itemId] = clamp(current + suggestion.deltaPct, -35, 35);
      }
      applied.push(`${ITEM_DB[itemId].name} ${suggestion.label}`);
    });

    if (applied.length <= 0) {
      setStatus("조정 실패.", "적용 가능한 제안이 없습니다.");
      return;
    }

    tuning.lastAppliedStatsHand = handsPlayed;
    const summary = applied.slice(0, 4).join(" · ");
    logHistory(`오토 튠 적용 (${handsPlayed}핸드 데이터): ${summary}`, "balance-ok");
    showStageBanner("AUTO TUNE APPLIED", summary, "balance-ok", 2100);
    setStatus("오토 튠 적용 완료.", `${applied.length}개 아이템 조정 반영`);
    render();
  }

  function itemIdFromEntry(entry) {
    if (typeof entry === "string") return entry;
    if (entry && typeof entry === "object") return entry.id;
    return null;
  }

  function normalizePlayerItemEntries(player) {
    if (!player || !Array.isArray(player.items)) return [];
    return player.items
      .map((entry) => {
        const id = itemIdFromEntry(entry);
        if (!id || !ITEM_DB[id]) return null;
        return { id };
      })
      .filter(Boolean);
  }

  function itemSlotCount(player) {
    return Math.max(0, Number(player && player.maxItemSlots) || 0);
  }

  function compactPlayerItems(player) {
    if (!player) return [];
    const maxSlots = itemSlotCount(player);
    const entries = normalizePlayerItemEntries(player);
    if (maxSlots <= 0) {
      player.items = [];
      return [];
    }

    const trimmed = entries.slice(-maxSlots);
    player.items = trimmed.map((entry) => ({ id: entry.id }));
    return player.items;
  }

  function removeOneItemFromPlayer(player, itemId) {
    if (!player || !itemId || !Array.isArray(player.items)) return false;
    const index = player.items.findIndex((entry) => itemIdFromEntry(entry) === itemId);
    if (index < 0) return false;
    player.items.splice(index, 1);
    compactPlayerItems(player);
    return true;
  }

  function consumeItemOnUse(player, itemId) {
    if (!player || !itemId) return false;
    const removed = removeOneItemFromPlayer(player, itemId);
    if (!removed) return false;
    const item = ITEM_DB[itemId];
    if (item) {
      logHistory(`${player.name} ${item.name} 소모.`, "info");
    }
    return true;
  }

  function sellOwnedItem(player, itemId) {
    if (!player || !itemId || !ITEM_DB[itemId]) return false;
    const item = ITEM_DB[itemId];
    if (!removeOneItemFromPlayer(player, itemId)) return false;
    const amount = lootSellValue(itemId);
    player.chips += amount;
    setPlayerAction(player, `판매 +${toCurrency(amount)}`, "strong");
    logHistory(`${player.name} 아이템 판매: ${item.name} +${toCurrency(amount)}.`, "loot");
    playSfx("chip", { amount });
    if (player.isHuman) {
      setStatus(`${item.name} 판매.`, `+${toCurrency(amount)} Chips`);
    }
    render();
    return true;
  }

  function pullRandomItemFromPlayer(player) {
    if (!player || !Array.isArray(player.items) || player.items.length === 0) return null;
    const indexed = player.items
      .map((entry, index) => {
        const id = itemIdFromEntry(entry);
        if (!id || !ITEM_DB[id]) return null;
        return { index, id };
      })
      .filter(Boolean);
    if (indexed.length === 0) {
      player.items = [];
      return null;
    }

    const picked = indexed[Math.floor(Math.random() * indexed.length)];
    player.items.splice(picked.index, 1);
    compactPlayerItems(player);
    return { id: picked.id };
  }

  function equipItemToPlayer(player, itemId, { allowReplace = true } = {}) {
    if (!player || !itemId || !ITEM_DB[itemId]) {
      return { ok: false, reason: "invalid_item", replacedId: null };
    }

    const maxSlots = itemSlotCount(player);
    if (maxSlots <= 0) {
      return { ok: false, reason: "no_slot", replacedId: null };
    }

    const entries = compactPlayerItems(player).map((entry) => ({ id: itemIdFromEntry(entry) })).filter((entry) => !!entry.id);
    if (entries.some((entry) => entry.id === itemId)) {
      return { ok: false, reason: "duplicate", replacedId: null };
    }

    let replacedId = null;
    if (entries.length >= maxSlots) {
      if (!allowReplace) {
        return { ok: false, reason: "full", replacedId: null };
      }
      const replaced = entries.shift();
      replacedId = replaced ? replaced.id : null;
    }

    entries.push({ id: itemId });
    player.items = entries;
    return { ok: true, reason: "", replacedId };
  }

  function lootSellValue(itemId) {
    const item = ITEM_DB[itemId];
    if (!item) return LOOT_SELL_MIN;
    return Math.max(LOOT_SELL_MIN, Math.round((Number(item.price) || 0) * LOOT_SELL_MULTIPLIER));
  }

  function shopRerollCost() {
    return SHOP_BASE_REROLL_COST + state.tournamentStage * SHOP_STAGE_REROLL_STEP;
  }

  function isEconomyModalOpen() {
    return !!(state.currentLoot || state.shopVisible);
  }

  function clearEconomyState() {
    state.lootQueue = [];
    state.currentLoot = null;
    state.shopVisible = false;
    state.shopOffers = [];
    state.shopRerollsLeft = 0;
  }

  function normalizedDeckMods(player) {
    if (!player || !Array.isArray(player.deck_mods)) return [];
    return player.deck_mods.filter((mod) => mod && typeof mod === "object");
  }

  function countJokerDeckMods(players) {
    let count = 0;
    players.forEach((player) => {
      const mods = normalizedDeckMods(player);
      mods.forEach((mod) => {
        if (mod.type !== "joker_wild") return;
        const add = Math.max(1, Math.floor(Number(mod.count) || 1));
        count += add;
      });
    });
    return count;
  }

  function applyDeckModifiersToDeck(deck) {
    const activePlayers = state.players.filter((player) => player && player.chips > 0);
    const jokerCount = Math.min(1, countJokerDeckMods(activePlayers));
    if (jokerCount <= 0) return deck;

    for (let i = 0; i < jokerCount; i += 1) {
      deck.push({ isJoker: true, rank: 0, suit: "J" });
    }
    return deck;
  }

  function summarizeBoardIntervention() {
    const context = normalizeDrawContext({ drawKind: "community", street: state.stage });
    const effects = buildDrawEffects(context);
    const pieces = [];
    if (effects.suitMagnetCount > 0) {
      pieces.push(`수트 자석 x${effects.suitMagnetCount}`);
    }
    if (effects.heavyDiceCount > 0) {
      pieces.push(`무게 주사위 x${effects.heavyDiceCount}`);
    }
    if (effects.turnHunterCount > 0) {
      pieces.push(`턴 헌터 x${effects.turnHunterCount}`);
    }
    return pieces.join(", ");
  }

  function summarizeDeckMods(player) {
    const mods = normalizedDeckMods(player);
    if (!mods.length) return "없음";
    return mods
      .map((mod) => {
        if (typeof mod.label === "string" && mod.label) return mod.label;
        if (mod.type === "hand_multiplier") return `족보 x${Number(mod.multiplier) || 1}`;
        if (mod.type === "gold_card") {
          const rank = Number(mod.rank) || 0;
          const suit = String(mod.suit || "");
          if (rank === 0 || suit === "J") return "골드 조커";
          return `골드 ${rankLabel(rank)}${suit}`;
        }
        if (mod.type === "joker_wild") return "조커 와일드";
        return String(mod.type || "mod");
      })
      .join(", ");
  }

  function normalizeDrawContext(drawContext = null) {
    if (!drawContext || typeof drawContext !== "object") {
      return {
        drawKind: "generic",
        street: state.stage,
        targetIndex: -1
      };
    }

    return {
      drawKind: drawContext.drawKind || drawContext.kind || "generic",
      street: drawContext.street || state.stage,
      targetIndex: Number.isInteger(drawContext.targetIndex) ? drawContext.targetIndex : -1
    };
  }

  function playersAffectingDraw(context) {
    if (context.drawKind === "hole" && context.targetIndex >= 0) {
      const target = state.players[context.targetIndex];
      return target ? [target] : [];
    }

    if (context.drawKind === "community") {
      const inHand = playersInHand();
      if (inHand.length > 0) return inHand;
      return state.players.filter((player) => player && player.chips > 0);
    }

    return state.players.filter((player) => player && player.chips > 0);
  }

  function buildDrawEffects(context) {
    const affectedPlayers = playersAffectingDraw(context);
    const effects = {
      suitMagnetCount: 0,
      heavyDiceCount: 0,
      turnHunterCount: 0,
      royalTasteActive: false,
      pairHunterActive: false,
      suitTailorActive: false
    };

    affectedPlayers.forEach((player) => {
      if (hasItem(player, "suit_magnet")) {
        effects.suitMagnetCount += 1;
      }
      if (hasItem(player, "heavy_dice")) {
        effects.heavyDiceCount += 1;
      }
      if (hasItem(player, "turn_hunter")) {
        effects.turnHunterCount += 1;
      }
    });

    if (context.drawKind === "hole" && context.targetIndex >= 0) {
      const target = state.players[context.targetIndex];
      effects.royalTasteActive = hasItem(target, "royal_taste");
      effects.pairHunterActive = hasItem(target, "pair_hunter");
      effects.suitTailorActive = hasItem(target, "suit_tailor");
    }

    return effects;
  }

  function drawWeightForCard(card, context, effects) {
    let weight = 1;
    const street = String(context.street || "");
    const onBoardStreet = street === "flop" || street === "turn" || street === "river";

    if (context.drawKind === "community" && onBoardStreet) {
      if (effects.suitMagnetCount > 0 && card.suit === "S") {
        weight *= 1 + 0.3 * effects.suitMagnetCount * itemEffectScale("suit_magnet") * itemProcScale("suit_magnet");
      }

      if ((street === "turn" || street === "river") && effects.heavyDiceCount > 0) {
        if (card.rank >= 2 && card.rank <= 5) {
          const damp = itemEffectScale("heavy_dice") * itemProcScale("heavy_dice");
          weight *= Math.max(0, 1 - damp);
        }
      }

      if ((street === "turn" || street === "river") && effects.turnHunterCount > 0 && card.rank >= 10) {
        weight *= 1 + 0.12 * effects.turnHunterCount * itemEffectScale("turn_hunter") * itemProcScale("turn_hunter");
      }
    }

    if (context.drawKind === "hole" && street === "preflop" && effects.royalTasteActive) {
      if (card.rank >= 11 || card.rank === 14) {
        weight *= 1 + (1.55 - 1) * itemEffectScale("royal_taste") * itemProcScale("royal_taste");
      }
    }

    if (context.drawKind === "hole" && street === "preflop" && context.targetIndex >= 0) {
      const target = state.players[context.targetIndex];
      const holeCount = target && Array.isArray(target.hand) ? target.hand.length : 0;
      const anchor = target && holeCount > 0 ? target.hand[0] : null;
      if (anchor && holeCount === 1) {
        if (effects.pairHunterActive && card.rank === anchor.rank) {
          weight *= 1 + (1.55 - 1) * itemEffectScale("pair_hunter") * itemProcScale("pair_hunter");
        }
        if (effects.suitTailorActive && card.suit === anchor.suit) {
          weight *= 1 + (1.45 - 1) * itemEffectScale("suit_tailor") * itemProcScale("suit_tailor");
        }
      }
    }

    return weight;
  }

  function drawCard(drawContext = null) {
    if (!state.deck.length) return null;

    const context = normalizeDrawContext(drawContext);
    const effects = buildDrawEffects(context);
    const weighted = [];
    let totalWeight = 0;

    for (let i = 0; i < state.deck.length; i += 1) {
      const card = state.deck[i];
      const weight = drawWeightForCard(card, context, effects);
      if (weight > 0) {
        weighted.push({ index: i, weight });
        totalWeight += weight;
      }
    }

    if (weighted.length === 0 || totalWeight <= 0) {
      return state.deck.pop();
    }

    let roll = Math.random() * totalWeight;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) {
        return state.deck.splice(entry.index, 1)[0];
      }
    }

    const last = weighted[weighted.length - 1];
    return state.deck.splice(last.index, 1)[0];
  }

  function findCardIndexInDeck(deck, rank, suit) {
    for (let i = deck.length - 1; i >= 0; i -= 1) {
      const card = deck[i];
      if (card.rank === rank && card.suit === suit) {
        return i;
      }
    }
    return -1;
  }

  function takeSpecificDeckCards(deck, firstSpec, secondSpec) {
    const firstIndex = findCardIndexInDeck(deck, firstSpec.rank, firstSpec.suit);
    const secondIndex = findCardIndexInDeck(deck, secondSpec.rank, secondSpec.suit);
    if (firstIndex < 0 || secondIndex < 0 || firstIndex === secondIndex) return null;

    let firstCard;
    let secondCard;
    if (firstIndex > secondIndex) {
      firstCard = deck.splice(firstIndex, 1)[0];
      secondCard = deck.splice(secondIndex, 1)[0];
    } else {
      secondCard = deck.splice(secondIndex, 1)[0];
      firstCard = deck.splice(firstIndex, 1)[0];
    }
    return [firstCard, secondCard];
  }

  function buildHighPairAssist(deck) {
    const ranks = shuffle([14, 13, 12, 11, 10, 9]);
    for (const rank of ranks) {
      const suits = shuffle(SUITS.slice());
      const picked = takeSpecificDeckCards(
        deck,
        { rank, suit: suits[0] },
        { rank, suit: suits[1] }
      );
      if (picked) return picked;
    }
    return null;
  }

  function buildSuitedBroadwayAssist(deck) {
    const combos = shuffle([
      [14, 13],
      [14, 12],
      [14, 11],
      [14, 10],
      [13, 12],
      [13, 11]
    ]);
    for (const [high, low] of combos) {
      const suits = shuffle(SUITS.slice());
      for (const suit of suits) {
        const picked = takeSpecificDeckCards(
          deck,
          { rank: high, suit },
          { rank: low, suit }
        );
        if (picked) return picked;
      }
    }
    return null;
  }

  function buildOffsuitBroadwayAssist(deck) {
    const combos = shuffle([
      [14, 13],
      [14, 12],
      [13, 12],
      [14, 11],
      [13, 11]
    ]);
    for (const [high, low] of combos) {
      const suitsA = shuffle(SUITS.slice());
      const suitsB = shuffle(SUITS.slice());
      for (const suitA of suitsA) {
        for (const suitB of suitsB) {
          if (suitA === suitB) continue;
          const picked = takeSpecificDeckCards(
            deck,
            { rank: high, suit: suitA },
            { rank: low, suit: suitB }
          );
          if (picked) return picked;
        }
      }
    }
    return null;
  }

  function buildAceXSuitedAssist(deck) {
    const kickers = shuffle([10, 9, 8, 7]);
    for (const kicker of kickers) {
      const suits = shuffle(SUITS.slice());
      for (const suit of suits) {
        const picked = takeSpecificDeckCards(
          deck,
          { rank: 14, suit },
          { rank: kicker, suit }
        );
        if (picked) return picked;
      }
    }
    return null;
  }

  function buildConnectorAssist(deck) {
    const combos = shuffle([
      [11, 10],
      [10, 9],
      [9, 8],
      [8, 7]
    ]);
    for (const [high, low] of combos) {
      if (Math.random() < 0.45) {
        const suits = shuffle(SUITS.slice());
        for (const suit of suits) {
          const suitedPicked = takeSpecificDeckCards(
            deck,
            { rank: high, suit },
            { rank: low, suit }
          );
          if (suitedPicked) return suitedPicked;
        }
      }

      const suitsA = shuffle(SUITS.slice());
      const suitsB = shuffle(SUITS.slice());
      for (const suitA of suitsA) {
        for (const suitB of suitsB) {
          if (suitA === suitB) continue;
          const picked = takeSpecificDeckCards(
            deck,
            { rank: high, suit: suitA },
            { rank: low, suit: suitB }
          );
          if (picked) return picked;
        }
      }
    }
    return null;
  }

  function pickStageOneHeroAssistCards(deck) {
    if (state.tournamentStage !== 0) return null;

    // Stage 1 only: mostly favorable, but not guaranteed every hand.
    if (Math.random() > 0.78) return null;

    const roll = Math.random();
    let builders = [];
    if (roll < 0.34) {
      builders = [
        buildHighPairAssist,
        buildSuitedBroadwayAssist,
        buildOffsuitBroadwayAssist,
        buildAceXSuitedAssist,
        buildConnectorAssist
      ];
    } else if (roll < 0.72) {
      builders = [
        buildSuitedBroadwayAssist,
        buildOffsuitBroadwayAssist,
        buildHighPairAssist,
        buildAceXSuitedAssist,
        buildConnectorAssist
      ];
    } else {
      builders = [
        buildOffsuitBroadwayAssist,
        buildAceXSuitedAssist,
        buildSuitedBroadwayAssist,
        buildConnectorAssist,
        buildHighPairAssist
      ];
    }

    for (const builder of builders) {
      const picked = builder(deck);
      if (picked) return picked;
    }

    return null;
  }

  function nextIndex(from, predicate) {
    const n = state.players.length;
    for (let i = 1; i <= n; i += 1) {
      const idx = (from + i + n) % n;
      if (predicate(state.players[idx], idx)) {
        return idx;
      }
    }
    return -1;
  }

  function playersStillAlive() {
    return state.players.filter((player) => player.chips > 0);
  }

  function playersInHand() {
    return state.players.filter((player) => !player.folded && (player.chips > 0 || player.allIn));
  }

  function canAct(player) {
    return !player.folded && !player.allIn && player.chips > 0;
  }

  const INSURANCE_REFUND_RATE = 0.35;
  const INSURANCE_MIN_ALLIN_INVEST = 200;
  const BOUNTY_CHIP_BONUS = 220;
  const BLIND_REFUND_RATE = 0.2;
  const RIVER_SURFER_BONUS = 140;
  const SPLIT_GUARD_BONUS = 90;
  const UNDERDOG_EMBLEM_MULTIPLIER = 1.25;
  const TRIPLE_BARREL_STEP = 0.08;

  function allInWinMultiplierFor(player) {
    if (!player) return 1;
    if (!hasItem(player, "allin_multiplier")) return 1;
    if (!player.wentAllInThisHand) return 1;
    const scale = itemCombinedScale("allin_multiplier", 0.45, 1.9);
    const bonus = (2 - 1) * scale;
    return clamp(1 + bonus, 1, 3);
  }

  function nextCommunityStreetFromStage(stage = state.stage) {
    if (stage === "preflop") return "flop";
    if (stage === "flop") return "turn";
    if (stage === "turn") return "river";
    return null;
  }

  function canUseRiverForesight(player) {
    if (!player || !hasItem(player, "river_foresight")) return false;
    if (state.handOver || state.stage === "idle") return false;
    if (state.roundTransitioning || state.animatingDeal) return false;
    if (player.riverForesightUsedThisHand) return false;
    if (player.folded || player.allIn) return false;
    if (!nextCommunityStreetFromStage(state.stage)) return false;
    if (state.riverForesightReveal && state.riverForesightReveal.handId === state.handId) return true;
    return state.deck.length > 0;
  }

  function consumeReservedCommunityCardForStreet(street) {
    if (!state.riverForesightReveal) return null;
    if (state.riverForesightReveal.street !== street) return null;
    const card = state.riverForesightReveal.card || null;
    state.riverForesightReveal = null;
    return card;
  }

  function drawCommunityCardForStreet(street) {
    const reserved = consumeReservedCommunityCardForStreet(street);
    if (reserved) return reserved;
    return drawCard({ drawKind: "community", street });
  }

  function useRiverForesight(player, { bot = false } = {}) {
    if (!canUseRiverForesight(player)) return false;
    const playerIndex = state.players.indexOf(player);
    if (playerIndex < 0) return false;

    const street = nextCommunityStreetFromStage(state.stage);
    if (!street) return false;

    let revealed = null;
    if (state.riverForesightReveal && state.riverForesightReveal.handId === state.handId && state.riverForesightReveal.street === street) {
      revealed = state.riverForesightReveal.card || null;
    } else {
      revealed = drawCard({ drawKind: "community", street });
      if (!revealed) return false;
      state.riverForesightReveal = {
        handId: state.handId,
        street,
        card: revealed
      };
    }

    player.riverForesightUsedThisHand = true;

    setPlayerAction(player, "예지 사용", "strong");
    if (bot) {
      setStatus(`${player.name} 리버 예지 사용.`, "다음 보드를 읽었습니다.");
      logHistory(`리버 예지: ${player.name} 가 다음 보드를 읽었습니다.`, "info");
      triggerItemProcEffect(playerIndex, "foresight", "예지 발동", "river_foresight");
    } else {
      setStatus("리버 예지 발동.", `${street.toUpperCase()} 예정 카드: ${cardText(revealed)} (사용 후 소모)`);
      logHistory(`리버 예지: ${player.name} -> ${street.toUpperCase()} ${cardText(revealed)} 고정.`, "info");
      triggerItemProcEffect(playerIndex, "foresight", `${street.toUpperCase()} ${cardText(revealed)}`, "river_foresight");
    }
    consumeItemOnUse(player, "river_foresight");
    playSfx("card");
    render();
    return true;
  }

  function setHandWinnerIndices(indices) {
    const unique = Array.isArray(indices)
      ? [...new Set(indices.filter((index) => Number.isInteger(index) && index >= 0 && index < state.players.length))]
      : [];
    state.handWinnerIndices = unique;
    trackWinningItems(unique);
  }

  function applyInsuranceRefunds() {
    state.players.forEach((player, index) => {
      if (!player || !hasItem(player, "insurance_contract")) return;
      if (!player.wentAllInThisHand || player.folded || player.chips > 0) return;
      if (player.insuranceRefundedThisHand) return;

      const invested = Math.max(0, Math.floor(Number(player.invested) || 0));
      if (invested <= 0) return;
      if (invested < INSURANCE_MIN_ALLIN_INVEST) return;

      const scale = itemCombinedScale("insurance_contract", 0.45, 1.8);
      const refundRate = clamp(INSURANCE_REFUND_RATE * scale, 0.08, 0.85);
      const refund = Math.max(1, Math.floor(invested * refundRate));
      player.chips += refund;
      player.insuranceRefundedThisHand = true;
      setPlayerAction(player, `보험 +${toCurrency(refund)}`, "strong");
      logHistory(`${player.name} 보험 계약 발동: +${toCurrency(refund)} 환급.`, "showdown");
      triggerItemProcEffect(index, "shield", `보험 +${toCurrency(refund)}`, "insurance_contract");
      playSfx("chip", { amount: refund });
    });
  }

  function applyBountyHunterRewardsForBust(bustedIndex) {
    const busted = state.players[bustedIndex];
    if (!busted) return;

    const winners = Array.isArray(state.handWinnerIndices) ? state.handWinnerIndices : [];
    winners.forEach((winnerIndex) => {
      if (winnerIndex === bustedIndex) return;
      const hunter = state.players[winnerIndex];
      if (!hunter || hunter.chips <= 0) return;
      if (!hasItem(hunter, "bounty_hunter")) return;

      const rewardScale = itemCombinedScale("bounty_hunter", 0.45, 1.9);
      const reward = Math.max(1, Math.floor(BOUNTY_CHIP_BONUS * rewardScale));
      hunter.chips += reward;
      setPlayerAction(hunter, `Bounty +${toCurrency(reward)}`, "strong");
      logHistory(`${hunter.name} 현상금 사냥 성공: ${busted.name} 파산 보너스 +${toCurrency(reward)}.`, "loot");
      triggerItemProcEffect(winnerIndex, "bounty", `현상금 +${toCurrency(reward)}`, "bounty_hunter");
      playSfx("chip", { amount: reward });
      if (hunter.isHuman) {
        addRunBloodCoins(1, `${busted.name} 바운티`);
      }
    });
  }

  function canUseSleightOfHand(player) {
    if (!player || !hasItem(player, "sleight_of_hand")) return false;
    if (state.handOver || state.stage !== "preflop") return false;
    if (player.folded || player.allIn) return false;
    const playerIndex = state.players.indexOf(player);
    if (playerIndex < 0) return false;
    const dealt = state.dealtHoleCounts[playerIndex] || 0;
    return dealt >= 2 && player.hand.length >= 2;
  }

  function pickSleightReplaceIndex(player) {
    if (!player || !Array.isArray(player.hand) || player.hand.length < 2) return 0;
    const a = player.hand[0];
    const b = player.hand[1];
    if (!a || !b) return 0;
    if (a.rank === b.rank) return Math.random() < 0.5 ? 0 : 1;
    return a.rank < b.rank ? 0 : 1;
  }

  function sleightRankValue(card) {
    if (!card) return 0;
    if (isJokerCard(card)) return 18;
    const rank = Number(card.rank) || 0;
    return rank === 1 ? 14 : rank;
  }

  function sleightHoleComboScore(cardA, cardB) {
    if (!cardA || !cardB) return -999;
    const ra = sleightRankValue(cardA);
    const rb = sleightRankValue(cardB);
    const high = Math.max(ra, rb);
    const low = Math.min(ra, rb);
    const gap = Math.max(0, high - low - 1);
    let score = high * 2.05 + low * 1.12;

    if (ra === rb) {
      score += 44 + high * 1.45;
    } else {
      if ((cardA.suit || "") === (cardB.suit || "")) score += 6.3;
      if (gap === 0) score += 8.4;
      else if (gap === 1) score += 5.2;
      else if (gap === 2) score += 2.4;
      else score -= Math.min(7, gap * 0.75);
    }

    if (high >= 11 && low >= 10) score += 3.8;
    if (high === 14 && low >= 10) score += 4.8;
    if (high >= 13) score += 1.5;
    return score;
  }

  function drawImprovedSleightCard(playerIndex, replaceIndex) {
    const player = state.players[playerIndex];
    if (!player || !Array.isArray(player.hand) || player.hand.length < 2) return null;
    const keepIndex = replaceIndex === 0 ? 1 : 0;
    const keepCard = player.hand[keepIndex];
    const oldCard = player.hand[replaceIndex];
    if (!keepCard || !oldCard) return null;

    const baseScore = sleightHoleComboScore(keepCard, oldCard);
    let bestScore = baseScore;
    const improved = [];

    for (let i = 0; i < state.deck.length; i += 1) {
      const candidate = state.deck[i];
      const score = sleightHoleComboScore(keepCard, candidate);
      if (score <= baseScore + 0.01) continue;
      if (score > bestScore + 0.01) {
        bestScore = score;
      }
      improved.push({ index: i, score });
    }

    if (improved.length <= 0) return null;
    const bestBand = improved.filter((entry) => entry.score >= bestScore - 2.2);
    const pool = bestBand.length > 0 ? bestBand : improved;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) return null;
    return state.deck.splice(pick.index, 1)[0];
  }

  function useSleightOfHand(player, { bot = false } = {}) {
    if (!canUseSleightOfHand(player)) return false;

    const playerIndex = state.players.indexOf(player);
    const replaceIndex = pickSleightReplaceIndex(player);
    const discarded = player.hand[replaceIndex];
    if (!discarded) return false;
    const keepIndex = replaceIndex === 0 ? 1 : 0;
    const keepCard = player.hand[keepIndex];
    const beforeScore = sleightHoleComboScore(keepCard, discarded);

    state.deck.push(discarded);
    shuffle(state.deck);

    const upgradedCard = drawImprovedSleightCard(playerIndex, replaceIndex);
    const nextCard = upgradedCard || drawCard({ drawKind: "hole", street: "preflop", targetIndex: playerIndex });
    if (!nextCard) return false;

    player.hand[replaceIndex] = nextCard;
    const afterScore = sleightHoleComboScore(keepCard, nextCard);
    const improved = afterScore > beforeScore + 0.01;
    setPlayerAction(player, "밑장빼기", "strong");
    const improveTag = improved ? "↑강화" : "↔유지";
    logHistory(`${player.name} 밑장빼기 사용 (${cardText(discarded)} -> ${cardText(nextCard)} · ${improveTag}).`, "info");

    if (player.isHuman && !bot) {
      setStatus("밑장빼기 사용.", `${cardText(discarded)} -> ${cardText(nextCard)} (${improveTag}, 사용 후 소모)`);
    }
    triggerItemProcEffect(playerIndex, "mult", "밑장빼기!", "sleight_of_hand");
    consumeItemOnUse(player, "sleight_of_hand");
    playSfx("card");
    render();
    return true;
  }

  function markedLensTargets(playerIndex) {
    const targets = [];
    for (let i = 0; i < state.players.length; i += 1) {
      if (i === playerIndex) continue;
      const player = state.players[i];
      if (!player || player.folded) continue;
      const dealt = state.dealtHoleCounts[i] || 0;
      if (dealt <= 0 || player.hand.length <= 0) continue;
      targets.push(i);
    }
    return targets;
  }

  function canUseMarkedLenses(player) {
    if (!player || !player.isHuman || !hasItem(player, "marked_lenses")) return false;
    if (state.handOver || state.stage === "idle") return false;
    if (state.markedLensUsedThisHand) return false;
    if (state.handId <= 0 || state.handId % 3 !== 0) return false;
    if (player.folded) return false;
    const playerIndex = state.players.indexOf(player);
    if (playerIndex < 0) return false;
    return markedLensTargets(playerIndex).length > 0;
  }

  function useMarkedLenses(player) {
    if (!canUseMarkedLenses(player)) return false;
    const playerIndex = state.players.indexOf(player);
    const targets = markedLensTargets(playerIndex);
    if (targets.length === 0) return false;

    const targetIndex = targets[Math.floor(Math.random() * targets.length)];
    const target = state.players[targetIndex];
    const dealt = Math.max(1, Math.min(2, state.dealtHoleCounts[targetIndex] || target.hand.length));
    const cardIndex = Math.floor(Math.random() * dealt);
    const revealed = target.hand[cardIndex];
    if (!revealed) return false;

    state.markedLensUsedThisHand = true;
    state.markedLensReveal = {
      handId: state.handId,
      targetIndex,
      cardIndex
    };

    setPlayerAction(player, "렌즈 확인", "strong");
    setStatus("마킹 렌즈 사용.", `${target.name} 카드 공개: ${cardText(revealed)} (사용 후 소모)`);
    logHistory(`마킹 렌즈: ${target.name} 카드 공개 ${cardText(revealed)}.`, "info");
    triggerItemProcEffect(playerIndex, "mult", "렌즈 발동", "marked_lenses");
    consumeItemOnUse(player, "marked_lenses");
    playSfx("call");
    render();
    return true;
  }

  function toCurrency(value) {
    return value.toLocaleString("en-US");
  }

  function formatMultiplier(value) {
    const safe = Number(value);
    if (!Number.isFinite(safe) || safe <= 0) return "1";
    const rounded = Math.round(safe * 100) / 100;
    if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
      return String(Math.round(rounded));
    }
    return String(rounded.toFixed(2)).replace(/0+$/, "").replace(/\.$/, "");
  }

  function rankLabel(rank) {
    if (rank === 0) return "🃏";
    if (rank === 14) return "A";
    if (rank === 13) return "K";
    if (rank === 12) return "Q";
    if (rank === 11) return "J";
    return String(rank);
  }

  function isJokerCard(card) {
    if (!card) return false;
    return !!card.isJoker || card.rank === 0 || card.suit === "J";
  }

  function cardText(card) {
    if (!card) return "--";
    if (isJokerCard(card)) return "🃏";
    return `${rankLabel(card.rank)}${SUIT_SYMBOL[card.suit]}`;
  }

  function setStatus(main, sub = "") {
    el.statusMain.textContent = main;
    el.statusSub.textContent = sub;
  }

  function deepClone(value) {
    if (value === null || value === undefined) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function normalizePlayerNameInput(raw) {
    const cleaned = String(raw || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 16);
    return cleaned || "Player";
  }

  function normalizeRoomCodeInput(raw) {
    const cleaned = String(raw || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
    if (cleaned.length < 4) return "";
    return cleaned;
  }

  function saveMultiplayerSessionCache() {
    try {
      const payload = {
        roomCode: normalizeRoomCodeInput(state.multiplayer.roomCode),
        displayName: normalizePlayerNameInput(state.multiplayer.displayName),
        authToken: String(state.multiplayer.authToken || ""),
        ackSeq: Math.max(0, Math.floor(Number(state.multiplayer.ackSeq) || 0))
      };
      window.sessionStorage.setItem(MULTIPLAYER_SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function clearMultiplayerSessionCache() {
    try {
      window.sessionStorage.removeItem(MULTIPLAYER_SESSION_STORAGE_KEY);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function loadMultiplayerSessionCache() {
    try {
      const raw = window.sessionStorage.getItem(MULTIPLAYER_SESSION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const roomCode = normalizeRoomCodeInput(parsed.roomCode);
      const displayName = normalizePlayerNameInput(parsed.displayName);
      const token = String(parsed.authToken || "");
      const ackSeq = Math.max(0, Math.floor(Number(parsed.ackSeq) || 0));
      if (!roomCode || !token) return;
      state.multiplayer.roomCode = roomCode;
      state.multiplayer.displayName = displayName;
      state.multiplayer.authToken = token;
      state.multiplayer.ackSeq = ackSeq;
    } catch (error) {
      // Ignore parse/storage errors.
    }
  }

  function toSafeCount(value, max = 52) {
    const num = Math.max(0, Math.floor(Number(value) || 0));
    return Math.min(max, num);
  }

  function buildMotionStateFromGame(game) {
    const source = game && typeof game === "object" ? game : {};
    const players = Array.isArray(source.players) ? source.players : [];
    const dealt = Array.isArray(source.dealtHoleCounts) ? source.dealtHoleCounts : [];
    return {
      handId: toSafeCount(source.handId, 99999),
      stage: String(source.stage || ""),
      communityVisible: toSafeCount(source.communityVisible, 5),
      dealtHoleCounts: dealt.map((value) => toSafeCount(value, 2)),
      players: players.map((player) => ({
        currentBet: Math.max(0, Number(player && player.currentBet) || 0),
        lastAction: String((player && player.lastAction) || "")
      }))
    };
  }

  function actionCueFromLabel(label) {
    const text = String(label || "").toLowerCase();
    if (!text) return "";
    if (text.includes("fold")) return "fold";
    if (text.includes("all-in") || text.includes("all in") || text.includes("shove")) return "allin";
    if (text.includes("raise")) return "raise";
    if (text.includes("bet") || text.startsWith("sb ") || text.startsWith("bb ")) return "bet";
    if (text.includes("call")) return "call";
    if (text.includes("check")) return "check";
    return "";
  }

  function animateClientSnapshotDelta(prevMotion, nextMotion) {
    if (!multiplayerEnabled()) return;
    if (!window.Poker3D) return;

    const prevPlayers = Array.isArray(prevMotion && prevMotion.players) ? prevMotion.players : [];
    const nextPlayers = Array.isArray(nextMotion && nextMotion.players) ? nextMotion.players : [];

    nextPlayers.forEach((nextPlayer, seatIndex) => {
      const prevPlayer = prevPlayers[seatIndex] || { currentBet: 0, lastAction: "" };
      const prevBet = Math.max(0, Number(prevPlayer.currentBet) || 0);
      const nextBet = Math.max(0, Number(nextPlayer.currentBet) || 0);
      if (nextBet > prevBet) {
        throw3DBetChips(seatIndex, Math.round(nextBet - prevBet));
      }

      const prevAction = String(prevPlayer.lastAction || "");
      const nextAction = String(nextPlayer.lastAction || "");
      if (nextAction && nextAction !== prevAction) {
        const cue = actionCueFromLabel(nextAction);
        if (cue) {
          play3DAction(seatIndex, cue);
        }
      }
    });

    const prevDeal = Array.isArray(prevMotion && prevMotion.dealtHoleCounts) ? prevMotion.dealtHoleCounts : [];
    const nextDeal = Array.isArray(nextMotion && nextMotion.dealtHoleCounts) ? nextMotion.dealtHoleCounts : [];
    for (let seatIndex = 0; seatIndex < nextDeal.length; seatIndex += 1) {
      const from = toSafeCount(prevDeal[seatIndex], 2);
      const to = toSafeCount(nextDeal[seatIndex], 2);
      if (to > from) {
        for (let cardIndex = from; cardIndex < to; cardIndex += 1) {
          if (window.Poker3D && typeof window.Poker3D.throwCard === "function") {
            window.Poker3D.throwCard({ target: "seat", seatIndex: toViewSeatIndex(seatIndex), cardIndex, duration: 340 });
          }
        }
      }
    }

    const prevCommunity = toSafeCount(prevMotion && prevMotion.communityVisible, 5);
    const nextCommunity = toSafeCount(nextMotion && nextMotion.communityVisible, 5);
    if (nextCommunity > prevCommunity) {
      for (let cardIndex = prevCommunity; cardIndex < nextCommunity; cardIndex += 1) {
        if (window.Poker3D && typeof window.Poker3D.throwCard === "function") {
          window.Poker3D.throwCard({ target: "community", cardIndex, duration: 340 });
        }
      }
    }
  }

  function randomRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i += 1) {
      const pick = Math.floor(Math.random() * chars.length);
      code += chars[pick];
    }
    return code;
  }

  function multiplayerEnabled() {
    return !!state.multiplayer.enabled;
  }

  function isMultiplayerHost() {
    return multiplayerEnabled() && state.multiplayer.connected && state.multiplayer.role === "host";
  }

  function isMultiplayerClient() {
    return multiplayerEnabled() && state.multiplayer.connected && state.multiplayer.role === "client";
  }

  function hasAuthoritativeControl() {
    return !multiplayerEnabled();
  }

  function canIssueRoomControlCommand() {
    return hasAuthoritativeControl() || (multiplayerEnabled() && isMultiplayerHost());
  }

  function seatAssignmentClientId(seatIndex) {
    if (!state.multiplayer.seatAssignments || typeof state.multiplayer.seatAssignments !== "object") return "";
    return String(state.multiplayer.seatAssignments[String(seatIndex)] || "");
  }

  function memberByClientId(clientId) {
    if (!clientId) return null;
    return (state.multiplayer.roomMembers || []).find((member) => member && member.id === clientId) || null;
  }

  function localControlledSeatIndex() {
    if (multiplayerEnabled() && Number.isInteger(state.multiplayer.yourSeatIndex)) {
      return state.multiplayer.yourSeatIndex;
    }
    return state.players.findIndex((player) => player && player.isHuman);
  }

  function canLocalControlSeat(seatIndex) {
    return seatIndex >= 0 && seatIndex === localControlledSeatIndex();
  }

  function normalizeSeatIndex(index, seatCount = state.players.length) {
    if (!Number.isInteger(index) || seatCount <= 0) return -1;
    return ((index % seatCount) + seatCount) % seatCount;
  }

  function localViewAnchorSeat() {
    const local = localControlledSeatIndex();
    const normalized = normalizeSeatIndex(local);
    if (normalized >= 0) return normalized;
    return HOST_SEAT_INDEX;
  }

  function toViewSeatIndex(gameSeatIndex) {
    const seatCount = Math.max(1, state.players.length || 0);
    const game = normalizeSeatIndex(gameSeatIndex, seatCount);
    if (game < 0) return gameSeatIndex;
    const anchor = normalizeSeatIndex(localViewAnchorSeat(), seatCount);
    const shift = ((HOST_SEAT_INDEX - anchor) % seatCount + seatCount) % seatCount;
    return normalizeSeatIndex(game + shift, seatCount);
  }

  function toGameSeatIndex(viewSeatIndex) {
    const seatCount = Math.max(1, state.players.length || 0);
    const view = normalizeSeatIndex(viewSeatIndex, seatCount);
    if (view < 0) return viewSeatIndex;
    const anchor = normalizeSeatIndex(localViewAnchorSeat(), seatCount);
    const shift = ((HOST_SEAT_INDEX - anchor) % seatCount + seatCount) % seatCount;
    return normalizeSeatIndex(view - shift, seatCount);
  }

  function isSeatRemoteControlled(seatIndex) {
    if (!multiplayerEnabled()) return false;
    if (!REMOTE_CONTROLLABLE_SEATS.includes(seatIndex)) return false;
    const clientId = seatAssignmentClientId(seatIndex);
    if (!clientId) return false;
    const member = memberByClientId(clientId);
    return !!member;
  }

  function isSeatHumanControlled(seatIndex) {
    const player = state.players[seatIndex];
    if (!player) return false;
    if (multiplayerEnabled()) {
      return !!seatAssignmentClientId(seatIndex);
    }
    if (player.isHuman) return true;
    return false;
  }

  function playerDisplayName(player, index) {
    if (!player) return "";
    const baseName = String(player.name || "").trim() || `Seat ${index + 1}`;
    if (canLocalControlSeat(index)) return `${baseName} (YOU)`;
    return baseName;
  }

  function applyRoomRosterToPlayers() {
    if (!Array.isArray(state.players) || state.players.length === 0) return;
    state.players.forEach((player, index) => {
      if (!player) return;
      let nextName = BASE_PLAYER_NAMES[index] || player.name || `Seat ${index + 1}`;
      if (multiplayerEnabled()) {
        const assignedClientId = seatAssignmentClientId(index);
        const assignedMember = memberByClientId(assignedClientId);
        if (assignedMember && assignedMember.name) {
          nextName = assignedMember.name;
        }
      }
      player.name = normalizePlayerNameInput(nextName);
    });
  }

  function activeMemberCount() {
    return Array.isArray(state.multiplayer.roomMembers) ? state.multiplayer.roomMembers.length : 0;
  }

  function multiplayerModeLabel() {
    if (state.multiplayer.joining) return "Connecting";
    if (!multiplayerEnabled()) return "Solo";
    if (isMultiplayerHost()) return "Host";
    if (isMultiplayerClient()) return "Joined";
    return "Lobby";
  }

  function renderMultiplayerPanel() {
    if (!el.mpStatusBadge) return;

    if (el.mpNameInput && document.activeElement !== el.mpNameInput) {
      el.mpNameInput.value = state.multiplayer.displayName || "Player";
    }
    if (el.mpRoomInput && document.activeElement !== el.mpRoomInput) {
      el.mpRoomInput.value = state.multiplayer.roomCode || "";
    }

    const badge = state.multiplayer.queueing ? "Queue" : multiplayerModeLabel();
    el.mpStatusBadge.textContent = badge;
    el.mpStatusBadge.classList.toggle("host", badge === "Host");
    el.mpStatusBadge.classList.toggle("client", badge === "Joined");
    el.mpStatusBadge.classList.toggle("solo", badge === "Solo");
    el.mpStatusBadge.classList.toggle("queue", badge === "Queue");

    const seatIndex = localControlledSeatIndex();
    if (state.multiplayer.queueing) {
      el.mpSeatInfo.textContent = "Matchmaking";
      el.mpRoomInfo.textContent = "Auto Queue";
      el.mpMemberInfo.textContent = "Searching opponent...";
    } else if (multiplayerEnabled()) {
      el.mpSeatInfo.textContent = seatIndex >= 0 ? `Seat ${seatIndex + 1}` : "Seat Spectator";
      el.mpRoomInfo.textContent = state.multiplayer.roomCode ? `Room ${state.multiplayer.roomCode}` : "Room -";
      el.mpMemberInfo.textContent = `Players ${activeMemberCount()}/4`;
    } else {
      el.mpSeatInfo.textContent = "Seat 3";
      el.mpRoomInfo.textContent = "Room -";
      el.mpMemberInfo.textContent = "Players 1/4";
    }

    const busy = state.multiplayer.joining || state.multiplayer.connected || state.multiplayer.queueing;
    if (el.mpCreateBtn) {
      el.mpCreateBtn.disabled = busy;
    }
    if (el.mpJoinBtn) {
      el.mpJoinBtn.disabled = busy;
    }
    if (el.mpQuickBtn) {
      el.mpQuickBtn.textContent = state.multiplayer.queueing ? "Cancel Queue" : "Quick Match";
      el.mpQuickBtn.disabled = state.multiplayer.joining || state.multiplayer.connected;
    }
    if (el.mpLeaveBtn) {
      el.mpLeaveBtn.disabled = !state.multiplayer.queueing && !state.multiplayer.joining && !state.multiplayer.connected;
    }
  }

  function clearPendingMultiplayerSnapshot() {
    if (!state.multiplayer.pendingSnapshotTimerId) return;
    window.clearTimeout(state.multiplayer.pendingSnapshotTimerId);
    state.multiplayer.pendingSnapshotTimerId = null;
  }

  function clearQuickMatchPoll() {
    if (!state.multiplayer.queuePollTimerId) return;
    window.clearTimeout(state.multiplayer.queuePollTimerId);
    state.multiplayer.queuePollTimerId = null;
  }

  function resetMultiplayerSessionState({ preserveName = true, preserveRoom = true, preserveToken = false } = {}) {
    clearPendingMultiplayerSnapshot();
    clearQuickMatchPoll();
    state.actionLock = false;
    state.multiplayer.enabled = false;
    state.multiplayer.connected = false;
    state.multiplayer.queueing = false;
    state.multiplayer.queueTicket = "";
    state.multiplayer.queuePollTimerId = null;
    state.multiplayer.joining = false;
    state.multiplayer.role = "solo";
    state.multiplayer.clientId = "";
    if (!preserveToken) {
      state.multiplayer.authToken = "";
    }
    state.multiplayer.stateSeq = 0;
    state.multiplayer.ackSeq = 0;
    state.multiplayer.outSeq = 0;
    state.multiplayer.hostClientId = "";
    state.multiplayer.yourSeatIndex = HOST_SEAT_INDEX;
    state.multiplayer.roomMembers = [];
    state.multiplayer.seatAssignments = {};
    state.multiplayer.pendingRemoteActions = [];
    state.multiplayer.snapshotRevision = 0;
    state.multiplayer.applyingRemoteSnapshot = false;
    state.multiplayer.snapshotInitialized = false;
    state.multiplayer.ws = null;
    if (!preserveName) {
      state.multiplayer.displayName = "Player";
    }
    if (!preserveRoom) {
      state.multiplayer.roomCode = "";
    }
    if (preserveToken) {
      saveMultiplayerSessionCache();
    } else {
      clearMultiplayerSessionCache();
    }
  }

  function closeMultiplayerSocket() {
    if (!state.multiplayer.ws) return;
    try {
      state.multiplayer.ws.close(1000, "leave");
    } catch (error) {
      // Ignore close errors.
    }
    state.multiplayer.ws = null;
  }

  function makeMultiplayerSocketUrl(roomCode, playerName, mode, token = "", lastAck = 0) {
    const url = new URL(window.location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/api/multiplayer/ws";
    url.search = "";
    url.searchParams.set("room", roomCode);
    url.searchParams.set("name", playerName);
    url.searchParams.set("mode", mode);
    if (token) {
      url.searchParams.set("token", token);
    }
    if (Number.isFinite(lastAck) && lastAck > 0) {
      url.searchParams.set("last_ack", String(Math.floor(lastAck)));
    }
    return url.toString();
  }

  function sendMultiplayerMessage(payload) {
    const ws = state.multiplayer.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      return false;
    }
  }

  function sendMultiplayerAck(seq) {
    const safeSeq = Math.max(0, Math.floor(Number(seq) || 0));
    if (!safeSeq) return;
    if (safeSeq <= state.multiplayer.ackSeq) return;
    const sent = sendMultiplayerMessage({ type: "ack", seq: safeSeq });
    if (sent) {
      state.multiplayer.ackSeq = safeSeq;
      saveMultiplayerSessionCache();
    }
  }

  function buildMultiplayerSnapshot() {
    const game = {};
    MULTIPLAYER_SYNC_STATE_KEYS.forEach((key) => {
      game[key] = deepClone(state[key]);
    });
    return {
      type: "host_state",
      revision: state.multiplayer.snapshotRevision + 1,
      game,
      statusMain: el.statusMain ? el.statusMain.textContent : "",
      statusSub: el.statusSub ? el.statusSub.textContent : ""
    };
  }

  function flushMultiplayerSnapshot() {
    clearPendingMultiplayerSnapshot();
    if (multiplayerEnabled()) return;
    if (!isMultiplayerHost()) return;
    const payload = buildMultiplayerSnapshot();
    if (sendMultiplayerMessage(payload)) {
      state.multiplayer.snapshotRevision = payload.revision;
    }
  }

  function queueMultiplayerSnapshot() {
    if (multiplayerEnabled()) return;
    if (!isMultiplayerHost()) return;
    if (state.multiplayer.applyingRemoteSnapshot) return;
    if (state.multiplayer.pendingSnapshotTimerId) return;
    state.multiplayer.pendingSnapshotTimerId = window.setTimeout(() => {
      state.multiplayer.pendingSnapshotTimerId = null;
      flushMultiplayerSnapshot();
    }, 80);
  }

  function applySnapshotFromHost(payload) {
    if (!payload || typeof payload !== "object") return;
    const game = payload.game && typeof payload.game === "object" ? payload.game : null;
    const patch = payload.patch && typeof payload.patch === "object" ? payload.patch : null;
    if (!game && !patch) return;

    const prevMotion = buildMotionStateFromGame(state);
    const shouldAnimate = !!state.multiplayer.snapshotInitialized;

    state.multiplayer.applyingRemoteSnapshot = true;
    // In multiplayer, timer values are authoritative from server snapshots.
    // Only clear local interval bookkeeping; do not overwrite timer state fields.
    if (state.turnTimerIntervalId) {
      window.clearInterval(state.turnTimerIntervalId);
      state.turnTimerIntervalId = null;
    }
    state.turnTimerDeadlineAt = 0;
    clearPendingBotThink();
    try {
      if (game) {
        MULTIPLAYER_SYNC_STATE_KEYS.forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(game, key)) {
            state[key] = deepClone(game[key]);
          }
        });
      } else if (patch) {
        Object.keys(patch).forEach((key) => {
          if (!MULTIPLAYER_SYNC_STATE_KEYS.includes(key)) return;
          state[key] = deepClone(patch[key]);
        });
      }
      applyRoomRosterToPlayers();
      if (typeof payload.statusMain === "string") {
        setStatus(payload.statusMain, typeof payload.statusSub === "string" ? payload.statusSub : "");
      }
      state.actionLock = false;
      state.multiplayer.pendingRemoteActions = [];
    } finally {
      state.multiplayer.applyingRemoteSnapshot = false;
    }

    const nextMotion = buildMotionStateFromGame(state);
    if (shouldAnimate) {
      animateClientSnapshotDelta(prevMotion, nextMotion);
    }
    state.multiplayer.snapshotInitialized = true;

    if (Number.isFinite(Number(payload.seq))) {
      const seq = Math.max(0, Math.floor(Number(payload.seq)));
      state.multiplayer.stateSeq = Math.max(state.multiplayer.stateSeq, seq);
      sendMultiplayerAck(seq);
    }

    render();
  }

  function consumePendingRemoteActionForSeat(seatIndex) {
    const queue = Array.isArray(state.multiplayer.pendingRemoteActions) ? state.multiplayer.pendingRemoteActions : [];
    const found = queue.findIndex(
      (entry) =>
        entry &&
        entry.seatIndex === seatIndex &&
        entry.handId === state.handId &&
        entry.stage === state.stage
    );
    if (found < 0) return null;
    const [entry] = queue.splice(found, 1);
    return entry || null;
  }

  function applyRemoteSeatAction(entry) {
    if (!entry || !isMultiplayerHost()) return false;
    const seatIndex = Number(entry.seatIndex);
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= state.players.length) return false;
    if (state.handOver || state.activePlayerIndex !== seatIndex || !state.waitingForHuman) return false;
    if (!isSeatHumanControlled(seatIndex)) return false;

    const player = state.players[seatIndex];
    if (!player || !canAct(player)) return false;

    state.actionLock = true;
    const ok = applyAction(player, entry.action, entry.raiseTo);
    state.actionLock = false;
    if (!ok) {
      setStatus("Remote action rejected.", `${player.name} submitted an invalid move.`);
      render();
    }
    return ok;
  }

  function tryApplyPendingRemoteActionForSeat(seatIndex) {
    const pending = consumePendingRemoteActionForSeat(seatIndex);
    if (!pending) return false;
    return applyRemoteSeatAction(pending);
  }

  function handleMultiplayerSessionMessage(payload) {
    if (!payload || typeof payload !== "object") return;
    state.multiplayer.enabled = true;
    state.multiplayer.connected = true;
    state.multiplayer.joining = false;
    state.multiplayer.clientId = String(payload.clientId || "");
    state.multiplayer.authToken = String(payload.token || state.multiplayer.authToken || "");
    state.multiplayer.roomCode = normalizeRoomCodeInput(payload.roomCode || state.multiplayer.roomCode);
    state.multiplayer.role = payload.role === "host" ? "host" : "client";
    state.multiplayer.hostClientId = String(payload.hostClientId || "");
    state.multiplayer.yourSeatIndex = Number.isInteger(payload.yourSeatIndex) ? payload.yourSeatIndex : HOST_SEAT_INDEX;
    state.multiplayer.roomMembers = Array.isArray(payload.members) ? payload.members : [];
    state.multiplayer.seatAssignments = payload.seatAssignments && typeof payload.seatAssignments === "object" ? payload.seatAssignments : {};
    state.multiplayer.pendingRemoteActions = [];
    state.multiplayer.snapshotInitialized = false;
    state.multiplayer.stateSeq = 0;
    state.multiplayer.ackSeq = 0;
    state.multiplayer.outSeq = 0;

    applyRoomRosterToPlayers();
    saveMultiplayerSessionCache();
    if (state.multiplayer.role === "client") {
      setHomeGuideVisible(false);
      setHomeVisibility(false);
      setStatus("Multiplayer joined.", state.multiplayer.yourSeatIndex >= 0 ? `Assigned seat ${state.multiplayer.yourSeatIndex + 1}.` : "Joined as spectator.");
    } else {
      setHomeGuideVisible(false);
      setHomeVisibility(false);
      setStatus("Room opened.", `Code ${state.multiplayer.roomCode} · Share this code to invite players.`);
    }
    render();
  }

  function handleMultiplayerRoomUpdateMessage(payload) {
    if (!payload || typeof payload !== "object") return;
    const previousRole = state.multiplayer.role;
    if (payload.yourRole === "host" || payload.yourRole === "client") {
      state.multiplayer.role = payload.yourRole;
    }
    state.multiplayer.hostClientId = String(payload.hostClientId || "");
    if (Number.isInteger(payload.yourSeatIndex)) {
      state.multiplayer.yourSeatIndex = payload.yourSeatIndex;
    }
    state.multiplayer.roomMembers = Array.isArray(payload.members) ? payload.members : [];
    state.multiplayer.seatAssignments = payload.seatAssignments && typeof payload.seatAssignments === "object" ? payload.seatAssignments : {};
    applyRoomRosterToPlayers();
    saveMultiplayerSessionCache();

    if (previousRole !== "host" && state.multiplayer.role === "host") {
      setStatus("Host reassigned.", "Previous host left. You can now control hand flow.");
    }

    render();
  }

  function handleMultiplayerStateMessage(payload) {
    if (!multiplayerEnabled()) return;
    const seq = Number(payload && payload.seq);
    if (Number.isFinite(seq) && Math.floor(seq) <= state.multiplayer.stateSeq) return;
    applySnapshotFromHost(payload);
  }

  function handleMultiplayerActionMessage(payload) {
    if (!isMultiplayerHost()) return;
    if (!payload || typeof payload !== "object") return;

    const seatIndex = Number(payload.seatIndex);
    const allowed = payload.action === "fold" || payload.action === "checkcall" || payload.action === "raise";
    if (!allowed || !Number.isInteger(seatIndex)) return;
    if (seatIndex < 0 || seatIndex >= state.players.length) return;
    if (!seatAssignmentClientId(seatIndex)) return;
    if (Number(payload.handId) !== state.handId) return;
    if (typeof payload.stage !== "string" || payload.stage !== state.stage) return;

    const raiseTo = Number.isFinite(Number(payload.raiseTo)) ? Math.round(Number(payload.raiseTo)) : null;
    const actionEntry = {
      seatIndex,
      action: payload.action,
      raiseTo,
      handId: state.handId,
      stage: state.stage
    };

    const immediate =
      !state.handOver &&
      state.waitingForHuman &&
      state.activePlayerIndex === seatIndex &&
      isSeatHumanControlled(seatIndex);

    if (immediate) {
      applyRemoteSeatAction(actionEntry);
      return;
    }

    state.multiplayer.pendingRemoteActions.push(actionEntry);
    if (state.multiplayer.pendingRemoteActions.length > 24) {
      state.multiplayer.pendingRemoteActions.splice(0, state.multiplayer.pendingRemoteActions.length - 24);
    }
  }

  function handleMultiplayerSocketMessage(event) {
    if (!event || typeof event.data !== "string") return;
    let payload = null;
    try {
      payload = JSON.parse(event.data);
    } catch (error) {
      return;
    }
    if (!payload || typeof payload !== "object") return;

    if (payload.type === "session") {
      handleMultiplayerSessionMessage(payload);
      return;
    }
    if (payload.type === "room_update") {
      handleMultiplayerRoomUpdateMessage(payload);
      return;
    }
    if (payload.type === "state" || payload.type === "snapshot" || payload.type === "delta") {
      handleMultiplayerStateMessage(payload);
      return;
    }
    if (payload.type === "error") {
      const message = String(payload.message || "Unknown room error.");
      setStatus("Multiplayer error.", message);
      return;
    }
    if (payload.type === "pong") {
      return;
    }
    if (payload.type === "room_closed") {
      setStatus("Room closed.", "Host ended the multiplayer session.");
      leaveMultiplayerSession({ silent: true });
      render();
    }
  }

  function leaveMultiplayerSession({ silent = false } = {}) {
    if (state.multiplayer.queueing) {
      void cancelQuickMatch({ silent: true });
    }
    closeMultiplayerSocket();
    resetMultiplayerSessionState({ preserveName: true, preserveRoom: true });
    applyRoomRosterToPlayers();

    if (!silent) {
      setStatus("Multiplayer disconnected.", "Returned to single-player mode.");
    }

    render();
  }

  function makeQuickMatchUrl(ticket = "") {
    const url = new URL(window.location.href);
    url.pathname = "/api/multiplayer/queue";
    url.search = "";
    if (ticket) {
      url.searchParams.set("ticket", ticket);
    }
    return url.toString();
  }

  async function requestQuickMatchApi(method, { ticket = "", body = null } = {}) {
    const url = makeQuickMatchUrl(ticket);
    let response = null;
    try {
      response = await window.fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
    } catch (error) {
      return { ok: false, message: "Network error." };
    }

    let payload = {};
    try {
      const text = await response.text();
      payload = text ? JSON.parse(text) : {};
    } catch (error) {
      payload = {};
    }

    if (!response.ok) {
      return {
        ok: false,
        statusCode: response.status,
        message: String(payload && payload.message ? payload.message : "Request failed.")
      };
    }
    return payload && typeof payload === "object" ? payload : { ok: false, message: "Invalid response." };
  }

  function clearQuickMatchState() {
    clearQuickMatchPoll();
    state.multiplayer.queueing = false;
    state.multiplayer.queueTicket = "";
  }

  function scheduleQuickMatchPoll(delayMs = 1200) {
    clearQuickMatchPoll();
    if (!state.multiplayer.queueing || !state.multiplayer.queueTicket) return;
    state.multiplayer.queuePollTimerId = window.setTimeout(() => {
      state.multiplayer.queuePollTimerId = null;
      void pollQuickMatch();
    }, Math.max(400, Math.floor(delayMs)));
  }

  async function pollQuickMatch() {
    if (!state.multiplayer.queueing) return;
    const ticket = String(state.multiplayer.queueTicket || "");
    if (!ticket) return;

    const payload = await requestQuickMatchApi("GET", { ticket });
    if (!state.multiplayer.queueing || state.multiplayer.queueTicket !== ticket) return;

    if (!payload || !payload.ok) {
      clearQuickMatchState();
      setStatus("Quick Match ended.", "Queue expired or unavailable. Try again.");
      render();
      return;
    }

    if (payload.status === "matched" && payload.roomCode) {
      clearQuickMatchState();
      state.multiplayer.roomCode = normalizeRoomCodeInput(payload.roomCode);
      if (el.mpRoomInput) {
        el.mpRoomInput.value = state.multiplayer.roomCode;
      }
      setStatus("Match found.", `Room ${state.multiplayer.roomCode}`);
      render();
      connectMultiplayer(payload.role === "host" ? "create" : "join");
      return;
    }

    scheduleQuickMatchPoll(1200);
  }

  async function cancelQuickMatch({ silent = false } = {}) {
    const ticket = String(state.multiplayer.queueTicket || "");
    clearQuickMatchState();
    render();

    if (ticket) {
      await requestQuickMatchApi("DELETE", { ticket });
    }

    if (!silent) {
      setStatus("Quick Match cancelled.", "You can create/join a room directly.");
      render();
    }
  }

  async function startQuickMatch() {
    if (state.multiplayer.queueing) {
      await cancelQuickMatch();
      return;
    }
    if (state.multiplayer.joining || state.multiplayer.connected) return;
    if (!window.location || !window.location.host) {
      setStatus("Quick Match unavailable.", "Serve this project from a web host.");
      render();
      return;
    }

    const nextName = normalizePlayerNameInput(el.mpNameInput ? el.mpNameInput.value : state.multiplayer.displayName);
    state.multiplayer.displayName = nextName;
    state.multiplayer.queueing = true;
    state.multiplayer.queueTicket = "";
    clearQuickMatchPoll();
    applyRoomRosterToPlayers();
    setStatus("Quick Match queue.", "Searching for another player...");
    render();

    const payload = await requestQuickMatchApi("POST", {
      body: {
        name: nextName
      }
    });

    if (!state.multiplayer.queueing) return;

    if (!payload || !payload.ok) {
      clearQuickMatchState();
      setStatus("Quick Match failed.", String(payload && payload.message ? payload.message : "Queue request failed."));
      render();
      return;
    }

    state.multiplayer.queueTicket = String(payload.ticket || "");
    if (payload.status === "matched" && payload.roomCode) {
      clearQuickMatchState();
      state.multiplayer.roomCode = normalizeRoomCodeInput(payload.roomCode);
      if (el.mpRoomInput) {
        el.mpRoomInput.value = state.multiplayer.roomCode;
      }
      setStatus("Match found.", `Room ${state.multiplayer.roomCode}`);
      render();
      connectMultiplayer(payload.role === "host" ? "create" : "join");
      return;
    }

    setStatus("Quick Match queue.", "Waiting for opponent...");
    scheduleQuickMatchPoll(1200);
    render();
  }

  function connectMultiplayer(mode) {
    const joinMode = mode === "create" ? "create" : "join";
    if (state.multiplayer.joining) return;
    if (state.multiplayer.queueing) {
      void cancelQuickMatch({ silent: true });
    }
    if (typeof WebSocket === "undefined") {
      setStatus("Multiplayer unavailable.", "WebSocket is not supported in this browser.");
      render();
      return;
    }
    if (!window.location || !window.location.host) {
      setStatus("Multiplayer unavailable.", "Serve this project from a web host to use rooms.");
      render();
      return;
    }

    const nextName = normalizePlayerNameInput(el.mpNameInput ? el.mpNameInput.value : state.multiplayer.displayName);
    let nextRoom = normalizeRoomCodeInput(el.mpRoomInput ? el.mpRoomInput.value : state.multiplayer.roomCode);
    const cachedRoom = normalizeRoomCodeInput(state.multiplayer.roomCode);
    const cachedToken = String(state.multiplayer.authToken || "");
    const cachedAck = Math.max(0, Math.floor(Number(state.multiplayer.ackSeq) || 0));
    if (joinMode === "create" && !nextRoom) {
      nextRoom = randomRoomCode();
    }
    if (!nextRoom) {
      setStatus("Room code required.", "Use 4-8 letters/numbers.");
      render();
      return;
    }

    if (multiplayerEnabled()) {
      leaveMultiplayerSession({ silent: true });
    }

    state.multiplayer.enabled = true;
    state.multiplayer.connected = false;
    state.multiplayer.joining = true;
    state.multiplayer.role = joinMode === "create" ? "host" : "client";
    state.multiplayer.roomCode = nextRoom;
    state.multiplayer.displayName = nextName;
    state.multiplayer.yourSeatIndex = joinMode === "create" ? HOST_SEAT_INDEX : -1;
    state.multiplayer.pendingRemoteActions = [];
    state.multiplayer.seatAssignments = {};
    state.multiplayer.roomMembers = [];
    applyRoomRosterToPlayers();

    const reconnectEligible = joinMode === "join" && !!cachedToken && cachedRoom === nextRoom;
    if (!reconnectEligible) {
      state.multiplayer.authToken = "";
      state.multiplayer.ackSeq = 0;
    }
    saveMultiplayerSessionCache();

    const wsUrl = makeMultiplayerSocketUrl(
      nextRoom,
      nextName,
      joinMode,
      reconnectEligible ? cachedToken : "",
      reconnectEligible ? cachedAck : 0
    );
    let ws = null;
    try {
      ws = new WebSocket(wsUrl);
    } catch (error) {
      resetMultiplayerSessionState({ preserveName: true, preserveRoom: true, preserveToken: true });
      setStatus("Connection error.", "Unable to open multiplayer socket.");
      render();
      return;
    }
    state.multiplayer.ws = ws;

    ws.addEventListener("open", () => {
      if (state.multiplayer.ws !== ws) return;
      setStatus("Connecting room...", `Room ${nextRoom}`);
      render();
    });

    ws.addEventListener("message", (event) => {
      if (state.multiplayer.ws !== ws) return;
      handleMultiplayerSocketMessage(event);
    });

    ws.addEventListener("error", () => {
      if (state.multiplayer.ws !== ws) return;
      setStatus("Connection error.", "Unable to connect multiplayer room.");
      render();
    });

    ws.addEventListener("close", () => {
      if (state.multiplayer.ws !== ws) return;
      const wasJoined = state.multiplayer.connected || state.multiplayer.joining;
      resetMultiplayerSessionState({ preserveName: true, preserveRoom: true, preserveToken: true });
      applyRoomRosterToPlayers();
      if (wasJoined) {
        setStatus("Multiplayer disconnected.", "Socket closed. Back to single-player.");
      }
      render();
    });

    if (el.mpNameInput) {
      el.mpNameInput.value = nextName;
    }
    if (el.mpRoomInput) {
      el.mpRoomInput.value = nextRoom;
    }
    render();
  }

  function attemptMultiplayerAutoReconnect() {
    if (state.multiplayer.connected || state.multiplayer.joining) return;
    const roomCode = normalizeRoomCodeInput(state.multiplayer.roomCode);
    const token = String(state.multiplayer.authToken || "");
    if (!roomCode || !token) return;
    connectMultiplayer("join");
  }

  function sendMultiplayerCommand(command, extra = null) {
    if (!multiplayerEnabled() || !state.multiplayer.connected) return false;
    const hostOnlyCommands = new Set(["start_game", "next_hand", "restart_run"]);
    if (hostOnlyCommands.has(command) && !isMultiplayerHost()) {
      setStatus("Host only command.", "Only the room host can control room flow.");
      render();
      return false;
    }
    state.multiplayer.outSeq += 1;
    const payload = {
      type: "command",
      command,
      client_seq: state.multiplayer.outSeq
    };
    if (extra && typeof extra === "object") {
      if (typeof extra.itemId === "string" && extra.itemId) {
        payload.itemId = extra.itemId;
      }
    }
    const sent = sendMultiplayerMessage(payload);
    if (!sent) {
      setStatus("Command send failed.", "Connection is unavailable.");
      render();
      return false;
    }
    return true;
  }

  function sendLocalActionToHost(action, raiseTo = null) {
    if (!multiplayerEnabled()) return false;
    if (!state.multiplayer.connected) return false;

    const seatIndex = localControlledSeatIndex();
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= state.players.length) return false;

    state.multiplayer.outSeq += 1;
    const payload = {
      type: "action",
      action,
      seatIndex,
      client_seq: state.multiplayer.outSeq,
      raiseTo: Number.isFinite(Number(raiseTo)) ? Math.round(Number(raiseTo)) : null
    };

    const sent = sendMultiplayerMessage(payload);
    if (!sent) {
      setStatus("Action send failed.", "Connection to host is unavailable.");
      render();
      return false;
    }

    state.actionLock = true;
    setStatus("Action sent.", "Waiting for server confirmation.");
    render();
    return true;
  }

  function setupHomeScreenArt() {
    if (!el.homeScreen) return;

    const tryCandidate = (index) => {
      if (index >= HOME_ART_CANDIDATES.length) return;
      const assetPath = HOME_ART_CANDIDATES[index];
      const probe = new Image();
      probe.onload = () => {
        el.homeScreen.classList.add("home-art-ready");
        el.homeScreen.style.setProperty("--home-art-url", `url("${assetPath}")`);
      };
      probe.onerror = () => {
        tryCandidate(index + 1);
      };
      probe.src = assetPath;
    };

    tryCandidate(0);
  }

  function setHomeVisibility(visible) {
    const prevVisible = state.homeVisible;
    state.homeVisible = !!visible;
    if (el.homeScreen) {
      el.homeScreen.classList.toggle("hidden", !state.homeVisible);
    }
    if (!state.homeVisible) {
      setHomeGuideVisible(false);
    }
    document.body.classList.toggle("home-open", state.homeVisible);
    applyMusicForUiContext({ restart: prevVisible !== state.homeVisible });
  }

  function setHomeGuideVisible(visible) {
    state.homeGuideVisible = !!visible;
    if (el.homeGuidePanel) {
      el.homeGuidePanel.classList.toggle("hidden", !state.homeGuideVisible);
    }
    if (el.homeGuideBtn) {
      el.homeGuideBtn.setAttribute("aria-expanded", String(state.homeGuideVisible));
    }
  }

  function startGameFromHome() {
    unlockAudio();
    setHomeGuideVisible(false);
    if (multiplayerEnabled()) {
      setHomeVisibility(false);
      if (!isMultiplayerHost()) {
        setStatus("Waiting for host.", "Host starts the multiplayer hand.");
        render();
        return;
      }
      sendMultiplayerCommand("start_game");
      setStatus("Start requested.", "Waiting for server confirmation.");
      render();
      return;
    }
    setHomeVisibility(false);
    if (!hasAuthoritativeControl()) {
      setStatus("Host controls game flow.", "Wait for the host to start the hand.");
      render();
      return;
    }
    if (state.handId === 0 && state.handOver) {
      state.lastSettledBloodCoins = 0;
      clearAutoNextHand();
      el.nextHandBtn.disabled = true;
      startHand();
      return;
    }
    render();
  }

  function setGameOverVisibility(visible, title = null, sub = null) {
    if (!el.gameOverModal) return;
    el.gameOverModal.classList.toggle("hidden", !visible);
    if (visible) {
      if (typeof title === "string" && el.gameOverTitle) {
        el.gameOverTitle.textContent = title;
      }
      if (typeof sub === "string" && el.gameOverSub) {
        el.gameOverSub.textContent = sub;
      }
    }
  }

  function setPlayerAction(player, text, tone = "") {
    player.lastAction = text;
    player.actionTone = tone;
  }

  function currentBlindLevelForHand(handId) {
    const index = Math.floor(Math.max(0, handId - 1) / HANDS_PER_LEVEL);
    return Math.max(0, index);
  }

  function extrapolatedBlindLevel(levelIndex) {
    const safeIndex = Math.max(0, Math.floor(Number(levelIndex) || 0));
    const maxIndex = BLIND_LEVELS.length - 1;
    const base = BLIND_LEVELS[maxIndex];
    if (!base) {
      return { small: SMALL_BLIND, big: BIG_BLIND };
    }
    if (safeIndex <= maxIndex) {
      return BLIND_LEVELS[safeIndex];
    }

    const extra = safeIndex - maxIndex;
    const growth = 1.25 ** extra;
    const stepped = (value) => Math.max(5, Math.round((value * growth) / 5) * 5);
    const small = stepped(base.small);
    const big = small * 2;
    return { small, big };
  }

  function applyBlindLevel(levelIndex) {
    const safeIndex = Math.max(0, Math.floor(Number(levelIndex) || 0));
    const level = extrapolatedBlindLevel(safeIndex);
    state.blindLevel = safeIndex;
    state.smallBlind = level.small;
    state.bigBlind = level.big;
  }

  function stageProfileFor(levelIndex) {
    const clamped = Math.max(0, levelIndex);
    const lastIndex = TOURNAMENT_STAGES.length - 1;
    if (clamped <= lastIndex) {
      return TOURNAMENT_STAGES[clamped];
    }

    const base = TOURNAMENT_STAGES[lastIndex];
    const extra = clamped - lastIndex;
    return {
      name: `Legend Pit ${extra}`,
      npcChips: Math.round(base.npcChips * (1 + extra * 0.45)),
      bonus: Math.round(base.bonus * (1 + extra * 0.28)),
      botAggro: Math.min(2.1, base.botAggro + extra * 0.12),
      npcItemCount: [Math.min(4, 2 + extra), Math.min(4, 3 + extra)],
      maxRarity: extra >= 2 ? "legendary" : "epic"
    };
  }

  function currentStageProfile() {
    return stageProfileFor(state.tournamentStage);
  }

  function rarityRank(rarity) {
    const rank = ITEM_RARITY_ORDER.indexOf(String(rarity || "normal").toLowerCase());
    return rank >= 0 ? rank : 0;
  }

  function normalizeItemCountRange(range) {
    if (Array.isArray(range) && range.length >= 2) {
      const a = Math.max(0, Math.floor(Number(range[0]) || 0));
      const b = Math.max(0, Math.floor(Number(range[1]) || 0));
      return a <= b ? [a, b] : [b, a];
    }

    const scalar = Math.max(0, Math.floor(Number(range) || 0));
    return [scalar, scalar];
  }

  function randomIntInclusive(min, max) {
    const low = Math.floor(min);
    const high = Math.floor(max);
    if (high <= low) return low;
    return low + Math.floor(Math.random() * (high - low + 1));
  }

  function effectiveBotAggro(player, stageProfile = currentStageProfile()) {
    const stageAggro = clamp(stageProfile && stageProfile.botAggro ? stageProfile.botAggro : 1, 0.55, 2.1);
    if (!player || player.isHuman) return stageAggro;
    const baseAggro = Number(player.botAggroBase) || 1;
    return clamp(stageAggro * baseAggro, 0.45, 2.35);
  }

  function buildItemsByRarityCap(maxRarity) {
    const capRank = rarityRank(maxRarity);
    return Object.values(ITEM_DB).filter((item) => rarityRank(item.rarity) <= capRank);
  }

  function weightedItemPick(pool, weightMap, usedIds) {
    const candidates = pool
      .filter((item) => !usedIds.has(item.id))
      .map((item) => ({
        item,
        weight: Math.max(0.05, Number(weightMap[item.id]) || 1)
      }));

    if (candidates.length === 0) return null;

    const total = candidates.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * total;

    for (const entry of candidates) {
      roll -= entry.weight;
      if (roll <= 0) return entry.item;
    }

    return candidates[candidates.length - 1].item;
  }

  function pickNpcItemCount(player, stageProfile) {
    const [minCount, maxCount] = normalizeItemCountRange(stageProfile.npcItemCount);
    if (maxCount <= 0) return 0;

    let target = randomIntInclusive(minCount, maxCount);
    const aggro = effectiveBotAggro(player, stageProfile);

    if (maxCount > minCount) {
      if (aggro >= 1.25 && Math.random() < 0.42) target += 1;
      if (aggro <= 0.82 && Math.random() < 0.42) target -= 1;
    }

    return clamp(target, minCount, maxCount);
  }

  function buildNpcLoadout(player, itemCount, stageProfile) {
    const maxRarity = stageProfile.maxRarity || "normal";
    const pool = buildItemsByRarityCap(maxRarity);
    if (!pool.length || itemCount <= 0) return [];

    const archetype = archetypeProfileFor(player);
    const weightMap = archetype && archetype.weights ? archetype.weights : {};
    const usedIds = new Set();
    const picked = [];

    while (picked.length < itemCount && usedIds.size < pool.length) {
      const nextItem = weightedItemPick(pool, weightMap, usedIds);
      if (!nextItem) break;
      usedIds.add(nextItem.id);
      picked.push({ id: nextItem.id });
    }

    return picked;
  }

  function assignNpcLoadoutsForStage(stageIndex = state.tournamentStage) {
    const profile = stageProfileFor(stageIndex);
    const [_, maxCount] = normalizeItemCountRange(profile.npcItemCount);

    state.players.forEach((player) => {
      if (!player || player.isHuman) return;

      const fallbackSlots = defaultItemSlotsForPlayer(false);
      player.maxItemSlots = Math.max(fallbackSlots, maxCount);
      const targetCount = Math.min(player.maxItemSlots, pickNpcItemCount(player, profile));
      player.items = buildNpcLoadout(player, targetCount, profile);
      player.deck_mods = Array.isArray(player.deck_mods) ? player.deck_mods : [];
    });
  }

  function npcLoadoutSummary() {
    return state.players
      .filter((player) => player && !player.isHuman)
      .map((player) => {
        const names = (Array.isArray(player.items) ? player.items : [])
          .map((entry) => {
            const id = typeof entry === "string" ? entry : entry && entry.id;
            return id && ITEM_DB[id] ? ITEM_DB[id].name : null;
          })
          .filter(Boolean);

        if (names.length === 0) return `${player.name}: 없음`;
        return `${player.name}: ${names.join(", ")}`;
      })
      .join(" | ");
  }

  function humanPlayer() {
    const localSeat = localControlledSeatIndex();
    if (Number.isInteger(localSeat) && localSeat >= 0 && localSeat < state.players.length) {
      return state.players[localSeat] || null;
    }
    return state.players.find((player) => player.isHuman) || null;
  }

  function isHeroBusted() {
    const hero = humanPlayer();
    return !!hero && hero.chips <= 0;
  }

  function triggerGameOver() {
    if (state.gameOver) return;

    const stageProfile = currentStageProfile();
    const stageText = `Stage ${state.tournamentStage + 1} · ${stageProfile.name}`;
    const handText = state.handId > 0 ? `Hand #${state.handId}` : "Hand #0";
    const settledCoins = settleRunBloodCoins();
    const settlementText = settledCoins > 0 ? ` · Blood Coin +${toCurrency(settledCoins)}` : "";
    const sub = `${stageText} / ${handText} 종료 · 칩을 모두 잃었습니다${settlementText}.`;

    state.gameOver = true;
    clearAutoNextHand();
    stopTurnTimer();
    state.waitingForHuman = false;
    state.actionLock = false;
    state.handOver = true;
    setPeek(false);
    clearEconomyState();
    setDealerThrowing(false);
    clearDealLayer();
    setStatus("Game Over.", "Lobby에서 Blood Coin 업그레이드 후 새 런을 시작하세요.");
    setGameOverVisibility(true, "GAME OVER", sub);
  }

  function restartRunFromGameOver() {
    clearAutoNextHand();
    stopTurnTimer();
    state.gameOver = false;
    setGameOverVisibility(false);

    resetTable();
    state.handId = 0;
    state.handOver = true;
    state.waitingForHuman = false;
    state.actionLock = false;
    state.holePeek = false;
    state.animatingDeal = false;
    state.roundTransitioning = false;
    state.autoRunoutInProgress = false;
    state.replayInProgress = false;
    state.replayEntryId = null;
    state.pendingStageAdvance = false;
    state.communityCards = [];
    state.communityVisible = 0;
    clearEconomyState();
    state.pot = 0;
    state.stage = "idle";
    state.currentBet = 0;
    state.minRaise = BIG_BLIND;
    state.activePlayerIndex = -1;
    state.dealtHoleCounts = state.players.map(() => 0);
    state.lastHandLog = [];
    clearCurrentHandHistory();
    setDealerThrowing(false);
    clearDealLayer();

    if (window.Poker3D && typeof window.Poker3D.resetForNewHand === "function") {
      window.Poker3D.resetForNewHand();
    }

    render();
    if (el.replayBtn) {
      el.replayBtn.disabled = true;
    }
    el.nextHandBtn.disabled = true;
    setHomeGuideVisible(false);
    setHomeVisibility(true);
    setStatus("Run reset.", "Start Game으로 새 런을 시작하세요.");
  }

  function npcPlayers() {
    return state.players.filter((player) => !player.isHuman);
  }

  function shouldAdvanceTournamentStage() {
    const hero = humanPlayer();
    if (!hero || hero.chips <= 0) return false;
    return npcPlayers().every((player) => player.chips <= 0);
  }

  function queueTournamentAdvanceIfCleared() {
    if (state.pendingStageAdvance) return;
    if (!shouldAdvanceTournamentStage()) return;
    const nextProfile = stageProfileFor(state.tournamentStage + 1);
    const clearReward = BLOOD_COIN_STAGE_CLEAR_BASE + state.tournamentStage * BLOOD_COIN_STAGE_CLEAR_STEP;
    addRunBloodCoins(clearReward, `Stage ${state.tournamentStage + 1} clear`);
    state.pendingStageAdvance = true;
    logHistory(`Stage ${state.tournamentStage + 1} clear. Next: Stage ${state.tournamentStage + 2} ${nextProfile.name}.`, "stage");
    setStatus(
      `Stage ${state.tournamentStage + 1} clear!`,
      `Blood Coin +${clearReward} · Press Next Hand, or auto-advance in ${Math.round(NEXT_HAND_IDLE_TIMEOUT_MS / 1000)}s.`
    );
    showStageBanner(
      `Stage ${state.tournamentStage + 1} Clear`,
      `Blood Coin +${clearReward} · Next: Stage ${state.tournamentStage + 2} · ${nextProfile.name}`,
      "stage-clear",
      2400
    );
    cue3D("stageClear");
    playSfx("stage");
  }

  function applyPendingStageAdvance() {
    if (!state.pendingStageAdvance) return "";

    state.pendingStageAdvance = false;
    state.tournamentStage += 1;
    const profile = currentStageProfile();
    const hero = humanPlayer();

    if (hero && hero.chips > 0 && profile.bonus > 0) {
      hero.chips += profile.bonus;
    }
    if (hero) {
      hero.wasAliveAtHandStart = hero.chips > 0;
    }

    npcPlayers().forEach((player) => {
      player.chips = profile.npcChips;
      player.hand = [];
      player.folded = false;
      player.allIn = false;
      player.currentBet = 0;
      player.acted = false;
      player.lastAction = "";
      player.actionTone = "";
      player.showdown = null;
      player.invested = 0;
      player.wasAliveAtHandStart = true;
      player.handStartChips = player.chips;
      player.aggressiveActionsThisHand = 0;
      player.reachedRiverThisHand = false;
      player.riverForesightUsedThisHand = false;
      player.wentAllInThisHand = false;
      player.insuranceRefundedThisHand = false;
    });

    state.dealerIndex = -1;
    state.smallBlindIndex = -1;
    state.bigBlindIndex = -1;
    assignNpcLoadoutsForStage(state.tournamentStage);

    const bonusText = profile.bonus > 0 ? ` | Bonus +${toCurrency(profile.bonus)}` : "";
    return `Stage ${state.tournamentStage + 1} - ${profile.name}: NPC stacks ${toCurrency(profile.npcChips)}${bonusText}`;
  }

  function shopPriceForItem(item) {
    if (!item) return 0;
    const base = Math.max(80, Number(item.price) || 0);
    return Math.round(base * (1 + state.tournamentStage * 0.12));
  }

  function rollShopOffers() {
    const profile = currentStageProfile();
    const pool = buildItemsByRarityCap(profile.maxRarity || "normal");
    if (pool.length === 0) return [];

    const used = new Set();
    const offers = [];
    let attempts = 0;
    const maxAttempts = Math.max(pool.length * 4, SHOP_OFFER_COUNT * 3);

    while (offers.length < SHOP_OFFER_COUNT && attempts < maxAttempts) {
      attempts += 1;
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (!candidate || used.has(candidate.id)) continue;
      used.add(candidate.id);
      offers.push({
        id: candidate.id,
        price: shopPriceForItem(candidate)
      });
    }

    return offers;
  }

  function collectBustLootEvents() {
    const events = [];

    state.players.forEach((player, index) => {
      if (!player || player.isHuman) return;

      const bustedThisHand = !!player.wasAliveAtHandStart && player.chips <= 0;
      player.wasAliveAtHandStart = player.chips > 0;
      if (!bustedThisHand) return;

      applyBountyHunterRewardsForBust(index);

      const pulled = pullRandomItemFromPlayer(player);
      if (!pulled || !ITEM_DB[pulled.id]) {
        logHistory(`${player.name} busted with no relic to loot.`, "loot");
        return;
      }

      const item = ITEM_DB[pulled.id];
      events.push({
        sourceIndex: index,
        sourceName: player.name,
        itemId: item.id,
        sellValue: lootSellValue(item.id)
      });
      logHistory(`${player.name} busted. Loot available: ${item.name}.`, "loot");
    });

    return events;
  }

  function openNextLootModalFromQueue() {
    const next = state.lootQueue.shift();
    if (!next) {
      state.currentLoot = null;
      return false;
    }

    const item = ITEM_DB[next.itemId];
    state.currentLoot = next;
    state.shopVisible = false;
    if (item) {
      setStatus(`${next.sourceName} busted.`, `Loot: ${item.name}`);
    } else {
      setStatus(`${next.sourceName} busted.`, "Loot available.");
    }
    return true;
  }

  function openShopModal() {
    if (!FEATURE_PHASE5_ECONOMY || state.gameOver) return false;
    const hero = humanPlayer();
    if (!hero || hero.chips <= 0) return false;

    const offers = rollShopOffers();
    if (offers.length === 0) return false;

    state.currentLoot = null;
    state.shopVisible = true;
    state.shopOffers = offers;
    state.shopRerollsLeft = SHOP_DEFAULT_REROLLS + heroExtraShopRerolls();
    logHistory(`Black market opens with ${offers.length} offers.`, "shop");
    setStatus("Black market open.", "Buy relics or continue.");
    return true;
  }

  function finishPostHandEconomyFlow() {
    clearEconomyState();
    if (el.nextHandBtn) {
      el.nextHandBtn.disabled = false;
    }
    if (el.replayBtn) {
      el.replayBtn.disabled = state.lastHandLog.length === 0;
    }
    render();
    scheduleAutoNextHand();
  }

  function continuePostHandEconomyFlow() {
    if (openNextLootModalFromQueue()) {
      render();
      return;
    }
    if (openShopModal()) {
      render();
      return;
    }
    finishPostHandEconomyFlow();
  }

  function beginPostHandEconomyFlow() {
    if (!FEATURE_PHASE5_ECONOMY || state.gameOver) return false;

    clearEconomyState();
    const lootEvents = collectBustLootEvents();
    if (lootEvents.length > 0) {
      state.lootQueue = lootEvents.slice();
      if (openNextLootModalFromQueue()) {
        return true;
      }
    }

    return openShopModal();
  }

  function resolveLootDecision(mode) {
    if (!state.currentLoot) return;
    const hero = humanPlayer();
    const loot = state.currentLoot;
    const item = ITEM_DB[loot.itemId];
    const sellAmount = Math.max(0, Number(loot.sellValue) || 0);

    state.currentLoot = null;
    if (!hero || !item) {
      continuePostHandEconomyFlow();
      return;
    }

    if (mode === "equip") {
      const equipResult = equipItemToPlayer(hero, item.id, { allowReplace: true });
      if (equipResult.ok) {
        const replaced = equipResult.replacedId && ITEM_DB[equipResult.replacedId] ? ITEM_DB[equipResult.replacedId].name : "";
        const sub = replaced ? `${replaced} replaced.` : "Inventory updated.";
        setStatus(`Equipped ${item.name}.`, sub);
        logHistory(
          replaced
            ? `Loot equipped: ${item.name} (replaced ${replaced}).`
            : `Loot equipped: ${item.name}.`,
          "loot"
        );
      } else {
        hero.chips += sellAmount;
        setStatus(`Duplicate ${item.name}.`, `Auto-sold for +${toCurrency(sellAmount)}.`);
        logHistory(`Duplicate loot ${item.name} auto-sold for ${toCurrency(sellAmount)}.`, "loot");
        playSfx("chip", { amount: sellAmount });
      }
    } else {
      hero.chips += sellAmount;
      setStatus(`Sold ${item.name}.`, `+${toCurrency(sellAmount)} chips.`);
      logHistory(`Loot sold: ${item.name} for ${toCurrency(sellAmount)}.`, "loot");
      playSfx("chip", { amount: sellAmount });
    }

    continuePostHandEconomyFlow();
  }

  function buyShopOffer(itemId) {
    if (!state.shopVisible || !itemId) return;
    const hero = humanPlayer();
    if (!hero) return;

    const offerIndex = state.shopOffers.findIndex((offer) => offer.id === itemId);
    if (offerIndex < 0) return;

    const offer = state.shopOffers[offerIndex];
    const item = ITEM_DB[itemId];
    if (!item) return;

    if (hero.chips < offer.price) {
      setStatus("Not enough chips.", `Need ${toCurrency(offer.price)} for ${item.name}.`);
      render();
      return;
    }

    const equipResult = equipItemToPlayer(hero, item.id, { allowReplace: true });
    if (!equipResult.ok) {
      const reason = equipResult.reason === "duplicate" ? "Already owned." : "No item slot available.";
      setStatus(`Cannot buy ${item.name}.`, reason);
      render();
      return;
    }

    hero.chips -= offer.price;
    state.shopOffers.splice(offerIndex, 1);
    const replaced = equipResult.replacedId && ITEM_DB[equipResult.replacedId] ? ITEM_DB[equipResult.replacedId].name : "";
    setStatus(`Purchased ${item.name}.`, replaced ? `${replaced} replaced.` : `-${toCurrency(offer.price)} chips.`);
    logHistory(
      replaced
        ? `Shop buy: ${item.name} for ${toCurrency(offer.price)} (replaced ${replaced}).`
        : `Shop buy: ${item.name} for ${toCurrency(offer.price)}.`,
      "shop"
    );
    playSfx("chip", { amount: offer.price });
    render();
  }

  function rerollShopOffers() {
    if (!state.shopVisible) return;
    const hero = humanPlayer();
    if (!hero) return;

    const cost = shopRerollCost();
    if (state.shopRerollsLeft <= 0) {
      setStatus("No rerolls left.", "Continue to next hand.");
      render();
      return;
    }
    if (hero.chips < cost) {
      setStatus("Not enough chips.", `Reroll costs ${toCurrency(cost)}.`);
      render();
      return;
    }

    hero.chips -= cost;
    state.shopRerollsLeft -= 1;
    state.shopOffers = rollShopOffers();
    setStatus("Shop rerolled.", `Spent ${toCurrency(cost)} chips.`);
    logHistory(`Shop reroll: -${toCurrency(cost)} chips.`, "shop");
    playSfx("chip", { amount: cost });
    render();
  }

  function closeShopModal() {
    if (!state.shopVisible) return;
    logHistory("Black market closed.", "shop");
    finishPostHandEconomyFlow();
  }

  function clearCurrentHandHistory() {
    state.currentHandLog = [];
    state.historySeq = 0;
    state.replayEntryId = null;
  }

  function logHistory(text, type = "info") {
    if (!text) return;
    state.historySeq += 1;
    state.currentHandLog.push({
      id: state.historySeq,
      text,
      type
    });
    if (state.currentHandLog.length > HISTORY_MAX) {
      state.currentHandLog.splice(0, state.currentHandLog.length - HISTORY_MAX);
    }
  }

  function applySkin(skinName) {
    const valid = ["classic", "neon", "velvet"];
    const nextSkin = valid.includes(skinName) ? skinName : "classic";
    state.skin = nextSkin;
    document.documentElement.setAttribute("data-skin", nextSkin);
    if (el.skinSelect) {
      el.skinSelect.value = nextSkin;
    }
    if (window.Poker3D && typeof window.Poker3D.setSkin === "function") {
      window.Poker3D.setSkin(nextSkin);
    }
    try {
      window.localStorage.setItem(SKIN_STORAGE_KEY, nextSkin);
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function setTutorialVisibility(hidden) {
    state.tutorialHidden = !!hidden;
    if (el.tutorialPanel) {
      el.tutorialPanel.classList.toggle("hidden", state.tutorialHidden);
    }
    if (el.tutorialToggleBtn) {
      el.tutorialToggleBtn.classList.toggle("hidden", !state.tutorialHidden);
      el.tutorialToggleBtn.setAttribute("aria-expanded", String(!state.tutorialHidden));
    }
    try {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, state.tutorialHidden ? "1" : "0");
    } catch (error) {
      // Ignore storage restrictions.
    }
  }

  function applyPerformanceMode(mode, { persist = true } = {}) {
    const nextMode = mode === "low" ? "low" : "high";
    state.performanceMode = nextMode;
    if (window.Poker3D && typeof window.Poker3D.setPerformance === "function") {
      window.Poker3D.setPerformance(nextMode);
    }
    if (persist) {
      try {
        window.localStorage.setItem(PERFORMANCE_STORAGE_KEY, nextMode);
      } catch (error) {
        // Ignore storage restrictions.
      }
    }
    setPerformanceToggleUi();
  }

  function loadPreferences() {
    loadMetaState();

    let storedSkin = "classic";
    let tutorialHidden = false;
    let soundEnabled = true;
    let storedPerformance = "high";
    try {
      storedSkin = window.localStorage.getItem(SKIN_STORAGE_KEY) || "classic";
      tutorialHidden = window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
      soundEnabled = window.localStorage.getItem(SOUND_STORAGE_KEY) !== "0";
      storedPerformance = window.localStorage.getItem(PERFORMANCE_STORAGE_KEY) || "high";
    } catch (error) {
      // Ignore storage restrictions.
    }
    applySkin(storedSkin);
    applyPerformanceMode(storedPerformance, { persist: false });
    setTutorialVisibility(tutorialHidden);
    audio.enabled = soundEnabled;
    applyMetaToPlayers({ refillHeroChips: true });
    setSoundToggleUi();
  }

  function setPerformanceToggleUi() {
    const isLow = state.performanceMode === "low";
    if (el.performanceToggle) {
      el.performanceToggle.textContent = isLow ? "Performance Low" : "Performance High";
      el.performanceToggle.classList.toggle("off", isLow);
    }
  }

  function setSoundToggleUi() {
    if (el.soundToggle) {
      el.soundToggle.textContent = audio.enabled ? "Sound On" : "Sound Off";
      el.soundToggle.classList.toggle("off", !audio.enabled);
    }

    if (el.homeSoundBtn) {
      el.homeSoundBtn.textContent = audio.enabled ? "Sound On" : "Sound Off";
      el.homeSoundBtn.classList.toggle("off", !audio.enabled);
    }
  }

  function renderMetaLobby() {
    const canEditMeta = hasAuthoritativeControl();
    if (el.metaBloodCoins) {
      el.metaBloodCoins.textContent = toCurrency(Math.max(0, Number(state.meta.bloodCoins) || 0));
    }
    if (el.metaRunCoins) {
      const runCoins = Math.max(0, Number(state.runBloodCoins) || 0);
      const settled = Math.max(0, Number(state.lastSettledBloodCoins) || 0);
      if (state.gameOver && settled > 0) {
        el.metaRunCoins.textContent = `이번 런 정산 +${toCurrency(settled)}`;
      } else {
        el.metaRunCoins.textContent = `현재 런 +${toCurrency(runCoins)}`;
      }
    }

    const bankrollLevel = metaLevel("bankroll");
    const rerollLevel = metaLevel("reroll");
    const slotLevel = metaLevel("slots");

    if (el.metaBankrollValue) {
      el.metaBankrollValue.textContent = `${toCurrency(heroStartingChips())} Chips`;
    }
    if (el.metaBankrollLevel) {
      el.metaBankrollLevel.textContent = `Lv ${bankrollLevel} / ${META_UPGRADE_TREE.bankroll.maxLevel}`;
    }
    if (el.metaRerollValue) {
      el.metaRerollValue.textContent = `+${toCurrency(heroExtraShopRerolls())} Rerolls`;
    }
    if (el.metaRerollLevel) {
      el.metaRerollLevel.textContent = `Lv ${rerollLevel} / ${META_UPGRADE_TREE.reroll.maxLevel}`;
    }
    if (el.metaSlotsValue) {
      el.metaSlotsValue.textContent = `${heroItemSlotCount()} Slots`;
    }
    if (el.metaSlotsLevel) {
      el.metaSlotsLevel.textContent = `Lv ${slotLevel} / ${META_UPGRADE_TREE.slots.maxLevel}`;
    }

    const bankrollCost = nextMetaUpgradeCost("bankroll");
    if (el.upgradeBankrollBtn) {
      if (bankrollCost === null) {
        el.upgradeBankrollBtn.textContent = "MAX";
        el.upgradeBankrollBtn.disabled = true;
      } else {
        el.upgradeBankrollBtn.textContent = `Upgrade ${toCurrency(bankrollCost)}`;
        el.upgradeBankrollBtn.disabled = !canEditMeta || state.meta.bloodCoins < bankrollCost;
      }
    }

    const rerollCost = nextMetaUpgradeCost("reroll");
    if (el.upgradeRerollBtn) {
      if (rerollCost === null) {
        el.upgradeRerollBtn.textContent = "MAX";
        el.upgradeRerollBtn.disabled = true;
      } else {
        el.upgradeRerollBtn.textContent = `Upgrade ${toCurrency(rerollCost)}`;
        el.upgradeRerollBtn.disabled = !canEditMeta || state.meta.bloodCoins < rerollCost;
      }
    }

    const slotCost = nextMetaUpgradeCost("slots");
    if (el.upgradeSlotsBtn) {
      if (slotCost === null) {
        el.upgradeSlotsBtn.textContent = "MAX";
        el.upgradeSlotsBtn.disabled = true;
      } else {
        el.upgradeSlotsBtn.textContent = `Upgrade ${toCurrency(slotCost)}`;
        el.upgradeSlotsBtn.disabled = !canEditMeta || state.meta.bloodCoins < slotCost;
      }
    }
  }

  function musicContextForUi() {
    return state.homeVisible ? "home" : "game";
  }

  function playlistForMusicContext(context) {
    if (context === "home") return HOME_MUSIC_PLAYLIST;
    return GAME_MUSIC_PLAYLIST;
  }

  function ensureMusicElement() {
    if (audio.musicEl) return audio.musicEl;

    const elAudio = new Audio();
    elAudio.preload = "auto";
    elAudio.loop = false;
    elAudio.volume = 0.42;

    elAudio.addEventListener("ended", () => {
      if (!audio.enabled) return;
      if (!audio.musicPlaylist.length) return;
      audio.musicFailCount = 0;
      audio.musicIndex = (audio.musicIndex + 1) % audio.musicPlaylist.length;
      audio.musicTrackSrc = "";
      playCurrentMusicTrack({ restartTrack: true });
    });

    elAudio.addEventListener("error", () => {
      if (!audio.enabled) return;
      if (!audio.musicPlaylist.length) return;
      audio.musicFailCount += 1;
      if (audio.musicFailCount >= audio.musicPlaylist.length) return;
      audio.musicIndex = (audio.musicIndex + 1) % audio.musicPlaylist.length;
      audio.musicTrackSrc = "";
      playCurrentMusicTrack({ restartTrack: true });
    });

    audio.musicEl = elAudio;
    return elAudio;
  }

  function stopMusicPlayback() {
    if (!audio.musicEl) return;
    audio.musicEl.pause();
    if (audio.musicEl.muted) {
      audio.musicEl.muted = false;
    }
    audio.mutedAutoplay = false;
  }

  function playCurrentMusicTrack({ restartTrack = false } = {}) {
    if (!audio.enabled) return;
    if (!audio.musicPlaylist.length) return;
    const musicEl = ensureMusicElement();
    const targetSrc = audio.musicPlaylist[audio.musicIndex];
    if (!targetSrc) return;

    if (audio.musicTrackSrc !== targetSrc) {
      musicEl.src = targetSrc;
      audio.musicTrackSrc = targetSrc;
    } else if (restartTrack) {
      try {
        musicEl.currentTime = 0;
      } catch (error) {
        // Ignore seek restrictions while media is loading.
      }
    }

    const playPromise = musicEl.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          audio.musicFailCount = 0;
          if (audio.mutedAutoplay) {
            window.setTimeout(() => {
              if (!audio.enabled || !audio.musicEl) return;
              audio.musicEl.muted = false;
              audio.mutedAutoplay = false;
            }, 220);
          }
        })
        .catch(() => {
          if (audio.mutedAutoplay) return;
          // Fallback: try muted autoplay for stricter autoplay policies.
          musicEl.muted = true;
          audio.mutedAutoplay = true;
          const mutedPlay = musicEl.play();
          if (mutedPlay && typeof mutedPlay.then === "function") {
            mutedPlay
              .then(() => {
                audio.musicFailCount = 0;
                window.setTimeout(() => {
                  if (!audio.enabled || !audio.musicEl) return;
                  audio.musicEl.muted = false;
                  audio.mutedAutoplay = false;
                }, 260);
              })
              .catch(() => {
                if (audio.musicEl) {
                  audio.musicEl.muted = false;
                }
                audio.mutedAutoplay = false;
              });
          }
        });
    }
  }

  function applyMusicForUiContext({ restart = false } = {}) {
    const nextContext = musicContextForUi();
    const changed = audio.musicContext !== nextContext;
    audio.musicContext = nextContext;
    audio.musicPlaylist = playlistForMusicContext(nextContext).slice();

    if (changed || restart) {
      audio.musicIndex = 0;
      audio.musicTrackSrc = "";
      audio.musicFailCount = 0;
    }

    if (!audio.enabled) {
      stopMusicPlayback();
      return;
    }

    playCurrentMusicTrack({ restartTrack: changed || restart });
  }

  function ensureAudioContext() {
    if (!audio.enabled) return false;
    if (audio.context) return true;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;

    const context = new AudioCtx();
    const master = context.createGain();
    master.gain.value = 0.4;
    master.connect(context.destination);

    const ambientGain = context.createGain();
    ambientGain.gain.value = 0.035;
    ambientGain.connect(master);

    const ambientLfoGain = context.createGain();
    ambientLfoGain.gain.value = 0.008;
    ambientLfoGain.connect(ambientGain.gain);

    const ambientLfo = context.createOscillator();
    ambientLfo.type = "sine";
    ambientLfo.frequency.value = 0.19;
    ambientLfo.connect(ambientLfoGain);

    const ambientOscA = context.createOscillator();
    ambientOscA.type = "triangle";
    ambientOscA.frequency.value = 55;
    ambientOscA.connect(ambientGain);

    const ambientOscB = context.createOscillator();
    ambientOscB.type = "sine";
    ambientOscB.frequency.value = 83;
    ambientOscB.connect(ambientGain);

    audio.context = context;
    audio.master = master;
    audio.ambientGain = ambientGain;
    audio.ambientLfoGain = ambientLfoGain;
    audio.ambientLfo = ambientLfo;
    audio.ambientOscA = ambientOscA;
    audio.ambientOscB = ambientOscB;
    return true;
  }

  function unlockAudio() {
    if (!audio.enabled) return;
    if (!ensureAudioContext()) return;

    const context = audio.context;
    if (!context) return;

    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    if (!audio.unlocked) {
      const now = context.currentTime;
      audio.ambientOscA.start(now);
      audio.ambientOscB.start(now);
      audio.ambientLfo.start(now);
      audio.unlocked = true;
    }

    if (audio.musicEl && audio.musicEl.muted && audio.enabled) {
      audio.musicEl.muted = false;
      audio.mutedAutoplay = false;
    }

    setSoundToggleUi();
  }

  function setAudioEnabled(nextEnabled) {
    audio.enabled = !!nextEnabled;
    setSoundToggleUi();
    try {
      window.localStorage.setItem(SOUND_STORAGE_KEY, audio.enabled ? "1" : "0");
    } catch (error) {
      // Ignore storage restrictions.
    }

    if (!audio.enabled) {
      if (audio.master && audio.context) {
        audio.master.gain.setTargetAtTime(0, audio.context.currentTime, 0.03);
      }
      stopMusicPlayback();
      return;
    }

    if (!ensureAudioContext()) return;
    unlockAudio();
    if (audio.master && audio.context) {
      audio.master.gain.setTargetAtTime(0.4, audio.context.currentTime, 0.04);
    }
    applyMusicForUiContext({ restart: false });
  }

  function scheduleTone({ type = "sine", freq = 220, gain = 0.1, attack = 0.004, release = 0.14, duration = 0.12 } = {}) {
    if (!audio.enabled || !audio.context || !audio.master) return;
    const context = audio.context;
    const now = context.currentTime;

    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.value = 0;

    osc.connect(amp);
    amp.connect(audio.master);

    amp.gain.linearRampToValueAtTime(gain, now + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

    osc.start(now);
    osc.stop(now + duration + release + 0.02);
  }

  function scheduleNoiseClick({ gain = 0.06, duration = 0.06 } = {}) {
    if (!audio.enabled || !audio.context || !audio.master) return;
    const context = audio.context;
    const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, frameCount, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
      const env = 1 - i / frameCount;
      data[i] = (Math.random() * 2 - 1) * env * env;
    }

    const src = context.createBufferSource();
    src.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 600;
    const amp = context.createGain();
    amp.gain.value = gain;

    src.connect(filter);
    filter.connect(amp);
    amp.connect(audio.master);
    src.start();
  }

  function playSfx(type, payload = {}) {
    if (!audio.enabled) return;
    unlockAudio();
    if (!audio.context) return;

    if (type === "card") {
      scheduleNoiseClick({ gain: 0.04, duration: 0.045 });
      scheduleTone({ type: "triangle", freq: 520, gain: 0.03, duration: 0.04, release: 0.08 });
      return;
    }

    if (type === "chip") {
      const amount = Math.max(0, Number(payload.amount) || 0);
      const intensity = clamp(amount / 180, 0.15, 1);
      scheduleNoiseClick({ gain: 0.05 + intensity * 0.04, duration: 0.05 });
      scheduleTone({ type: "square", freq: 260 + intensity * 120, gain: 0.05 + intensity * 0.04, duration: 0.05, release: 0.11 });
      return;
    }

    if (type === "fold") {
      scheduleTone({ type: "sawtooth", freq: 130, gain: 0.055, duration: 0.07, release: 0.13 });
      return;
    }

    if (type === "call") {
      scheduleTone({ type: "triangle", freq: 420, gain: 0.05, duration: 0.05, release: 0.11 });
      return;
    }

    if (type === "raise") {
      scheduleTone({ type: "triangle", freq: 420, gain: 0.06, duration: 0.05, release: 0.12 });
      scheduleTone({ type: "triangle", freq: 620, gain: 0.06, duration: 0.08, release: 0.14 });
      return;
    }

    if (type === "allin") {
      scheduleTone({ type: "sawtooth", freq: 200, gain: 0.085, duration: 0.08, release: 0.14 });
      scheduleTone({ type: "sawtooth", freq: 320, gain: 0.085, duration: 0.11, release: 0.16 });
      scheduleNoiseClick({ gain: 0.075, duration: 0.09 });
      return;
    }

    if (type === "win") {
      scheduleTone({ type: "triangle", freq: 392, gain: 0.08, duration: 0.08, release: 0.13 });
      scheduleTone({ type: "triangle", freq: 523, gain: 0.08, duration: 0.1, release: 0.14 });
      scheduleTone({ type: "triangle", freq: 659, gain: 0.08, duration: 0.14, release: 0.18 });
      return;
    }

    if (type === "stage") {
      scheduleTone({ type: "triangle", freq: 349, gain: 0.08, duration: 0.08, release: 0.14 });
      scheduleTone({ type: "triangle", freq: 523, gain: 0.085, duration: 0.12, release: 0.16 });
      scheduleTone({ type: "triangle", freq: 698, gain: 0.085, duration: 0.18, release: 0.2 });
      return;
    }

    if (type === "item_proc") {
      const procType = String(payload.type || "mult");
      if (procType === "gold") {
        scheduleTone({ type: "triangle", freq: 622, gain: 0.08, duration: 0.08, release: 0.12 });
        scheduleTone({ type: "triangle", freq: 784, gain: 0.085, duration: 0.11, release: 0.15 });
        scheduleNoiseClick({ gain: 0.048, duration: 0.055 });
        return;
      }
      if (procType === "allin") {
        scheduleTone({ type: "sawtooth", freq: 262, gain: 0.09, duration: 0.08, release: 0.14 });
        scheduleTone({ type: "sawtooth", freq: 392, gain: 0.09, duration: 0.1, release: 0.16 });
        scheduleNoiseClick({ gain: 0.07, duration: 0.08 });
        return;
      }
      if (procType === "shield") {
        scheduleTone({ type: "triangle", freq: 392, gain: 0.075, duration: 0.08, release: 0.13 });
        scheduleTone({ type: "triangle", freq: 494, gain: 0.078, duration: 0.1, release: 0.16 });
        scheduleNoiseClick({ gain: 0.046, duration: 0.05 });
        return;
      }
      if (procType === "bounty") {
        scheduleTone({ type: "triangle", freq: 466, gain: 0.078, duration: 0.08, release: 0.12 });
        scheduleTone({ type: "triangle", freq: 622, gain: 0.082, duration: 0.1, release: 0.15 });
        scheduleNoiseClick({ gain: 0.052, duration: 0.06 });
        return;
      }
      if (procType === "foresight") {
        scheduleTone({ type: "triangle", freq: 587, gain: 0.072, duration: 0.07, release: 0.12 });
        scheduleTone({ type: "triangle", freq: 740, gain: 0.076, duration: 0.09, release: 0.14 });
        scheduleNoiseClick({ gain: 0.043, duration: 0.045 });
        return;
      }
      scheduleTone({ type: "triangle", freq: 523, gain: 0.07, duration: 0.07, release: 0.12 });
      scheduleTone({ type: "triangle", freq: 659, gain: 0.07, duration: 0.09, release: 0.14 });
      scheduleNoiseClick({ gain: 0.04, duration: 0.04 });
    }
  }

  function showStageBanner(title, sub = "", tone = "stage-start", duration = 1700) {
    if (!el.stageBanner || !el.stageBannerTitle || !el.stageBannerSub) return;
    if (state.stageBannerTimer) {
      window.clearTimeout(state.stageBannerTimer);
      state.stageBannerTimer = null;
    }

    el.stageBanner.classList.remove("stage-clear", "stage-start", "balance-hot", "balance-cold", "balance-ok", "show");
    el.stageBannerTitle.textContent = title;
    el.stageBannerSub.textContent = sub;
    if (tone === "stage-clear") {
      el.stageBanner.classList.add("stage-clear");
    } else if (tone === "balance-hot" || tone === "balance-cold" || tone === "balance-ok") {
      el.stageBanner.classList.add(tone);
    } else {
      el.stageBanner.classList.add("stage-start");
    }

    window.requestAnimationFrame(() => {
      el.stageBanner.classList.add("show");
    });

    state.stageBannerTimer = window.setTimeout(() => {
      el.stageBanner.classList.remove("show");
    }, Math.max(900, duration));
  }

  function setPeek(active) {
    const localSeat = localControlledSeatIndex();
    const human = Number.isInteger(localSeat) ? state.players[localSeat] : null;
    const dealt = Number.isInteger(localSeat) && localSeat >= 0 ? state.dealtHoleCounts[localSeat] || 0 : 0;
    const canPeek = !!human && !state.handOver && human.hand.length === 2 && dealt >= 2 && !human.folded;
    const nextValue = !!active && canPeek;

    if (state.holePeek === nextValue) return;

    state.holePeek = nextValue;
    cue3D(nextValue ? "peekStart" : "peekEnd");
    sync3DTurnTimer();
    render();
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function clearDealLayer() {
    if (el.dealLayer) {
      el.dealLayer.innerHTML = "";
    }
  }

  function setDealerThrowing(active) {
    el.tableScene.classList.toggle("dealer-throw", !!active);
  }

  function has3DEffects() {
    const readyCanvas = !!document.querySelector("#poker3dViewport canvas");
    return !!(readyCanvas && window.Poker3D && typeof window.Poker3D.throwCard === "function");
  }

  function cue3D(type, payload = {}) {
    if (!window.Poker3D || typeof window.Poker3D.cue !== "function") return;
    const nextPayload = { type, ...payload };
    if (Number.isInteger(nextPayload.seatIndex)) {
      nextPayload.seatIndex = toViewSeatIndex(nextPayload.seatIndex);
    }
    window.Poker3D.cue(nextPayload);
  }

  async function throwCardToSeat(seatIndex, cardIndex) {
    if (has3DEffects()) {
      await window.Poker3D.throwCard({
        target: "seat",
        seatIndex: toViewSeatIndex(seatIndex),
        cardIndex,
        duration: 330
      });
      return;
    }
    await animateCardThrow(getSeatCardTarget(toViewSeatIndex(seatIndex), cardIndex));
  }

  async function throwCardToCommunity(cardIndex) {
    if (has3DEffects()) {
      await window.Poker3D.throwCard({
        target: "community",
        cardIndex,
        duration: 320
      });
      return;
    }
    await animateCardThrow(getCommunityCardTarget(cardIndex), { duration: 320, arcHeight: 22 });
  }

  function sync3DTableState() {
    if (!window.Poker3D || typeof window.Poker3D.setTableState !== "function") return;

    window.Poker3D.setTableState({
      dealerIndex: toViewSeatIndex(state.dealerIndex),
      communityVisible: state.communityVisible,
      communityCards: state.communityCards.slice(0, state.communityVisible).map((card) => ({
        rank: card.rank,
        suit: card.suit
      })),
      pot: state.pot,
      stage: state.stage
    });
  }

  function sync3DPlayerState(viewIndex, gameIndex, player, holeCount, revealCards, cards) {
    if (!window.Poker3D || typeof window.Poker3D.setPlayerState !== "function") return;
    const hidePeekHud = state.holePeek && !state.handOver;
    const itemIds = normalizePlayerItems(player)
      .map((item) => item && item.id)
      .filter(Boolean);

    window.Poker3D.setPlayerState(viewIndex, {
      isHuman: player.isHuman || canLocalControlSeat(gameIndex),
      folded: player.folded,
      allIn: !state.handOver && player.allIn && !player.folded,
      active: !state.handOver && gameIndex === state.activePlayerIndex,
      peeking: canLocalControlSeat(gameIndex) && state.holePeek && !state.handOver && !player.folded,
      holeCount,
      reveal: revealCards,
      actionLabel: hidePeekHud ? "" : player.lastAction || "",
      actionTone: hidePeekHud ? "" : player.actionTone || "",
      cards: (cards || []).map((card) => ({ rank: card.rank, suit: card.suit, isJoker: !!card.isJoker })),
      itemIds
    });
  }

  function sync3DTurnTimer() {
    if (!window.Poker3D || typeof window.Poker3D.setTurnTimer !== "function") return;

    for (let viewIndex = 0; viewIndex < state.players.length; viewIndex += 1) {
      const index = toGameSeatIndex(viewIndex);
      const player = state.players[index];
      if (!player) continue;
      const visible =
        !state.handOver &&
        !state.roundTransitioning &&
        !state.animatingDeal &&
        !state.holePeek &&
        index === state.turnTimerSeatIndex &&
        canAct(player);
      window.Poker3D.setTurnTimer(viewIndex, {
        visible,
        totalMs: TURN_TIME_MS,
        leftMs: visible ? state.turnTimerRemainingMs : 0
      });
    }
  }

  function clearPendingBotThink() {
    if (state.pendingBotThinkTimeoutId) {
      window.clearTimeout(state.pendingBotThinkTimeoutId);
      state.pendingBotThinkTimeoutId = null;
    }
  }

  function clearAutoNextHand() {
    if (state.autoNextHandTimeoutId) {
      window.clearTimeout(state.autoNextHandTimeoutId);
      state.autoNextHandTimeoutId = null;
    }
  }

  function canAutoStartNextHand() {
    return hasAuthoritativeControl() && state.handOver && !state.replayInProgress && !state.gameOver && !isEconomyModalOpen();
  }

  function scheduleAutoNextHand() {
    clearAutoNextHand();
    if (!canAutoStartNextHand()) return;
    const delay = NEXT_HAND_IDLE_TIMEOUT_MS;

    state.autoNextHandTimeoutId = window.setTimeout(() => {
      state.autoNextHandTimeoutId = null;
      if (!canAutoStartNextHand()) return;
      startHand();
    }, delay);
  }

  function stopTurnTimer() {
    if (state.turnTimerIntervalId) {
      window.clearInterval(state.turnTimerIntervalId);
      state.turnTimerIntervalId = null;
    }
    state.turnTimerDeadlineAt = 0;
    state.turnTimerRemainingMs = 0;
    state.turnTimerSeatIndex = -1;
    clearPendingBotThink();
    sync3DTurnTimer();
  }

  function computeTurnRemainingMs() {
    if (!state.turnTimerDeadlineAt) return 0;
    return Math.max(0, state.turnTimerDeadlineAt - Date.now());
  }

  function handleTurnTimeout() {
    if (!hasAuthoritativeControl()) return;
    if (state.handOver) return;
    const index = state.activePlayerIndex;
    const player = state.players[index];
    if (!player || !canAct(player)) return;

    stopTurnTimer();
    setStatus(`${player.name} timed out.`, "Auto-folded.");
    applyAction(player, "fold");
  }

  function startTurnTimer(seatIndex) {
    stopTurnTimer();
    state.turnTimerSeatIndex = seatIndex;
    state.turnTimerDeadlineAt = Date.now() + TURN_TIME_MS;
    state.turnTimerRemainingMs = TURN_TIME_MS;
    sync3DTurnTimer();

    state.turnTimerIntervalId = window.setInterval(() => {
      state.turnTimerRemainingMs = computeTurnRemainingMs();
      sync3DTurnTimer();
      if (state.turnTimerRemainingMs <= 0) {
        handleTurnTimeout();
      }
    }, 250);
  }

  function play3DAction(seatIndex, actionType) {
    if (!window.Poker3D || typeof window.Poker3D.playAction !== "function") return;
    window.Poker3D.playAction(toViewSeatIndex(seatIndex), actionType);
  }

  function throw3DBetChips(seatIndex, amount) {
    if (!window.Poker3D || typeof window.Poker3D.throwChips !== "function") return;
    if (amount <= 0) return;
    window.Poker3D.throwChips({ seatIndex: toViewSeatIndex(seatIndex), amount, duration: 560 });
  }

  function itemProcClass(effectType) {
    if (effectType === "gold") return "item-proc-gold";
    if (effectType === "allin") return "item-proc-allin";
    if (effectType === "shield") return "item-proc-shield";
    if (effectType === "bounty") return "item-proc-bounty";
    if (effectType === "foresight") return "item-proc-foresight";
    return "item-proc-mult";
  }

  function itemProcToneRgb(effectType) {
    if (effectType === "gold") return "255, 214, 122";
    if (effectType === "allin") return "255, 141, 126";
    if (effectType === "shield") return "162, 206, 255";
    if (effectType === "bounty") return "255, 216, 134";
    if (effectType === "foresight") return "146, 248, 206";
    return "121, 195, 255";
  }

  function itemProcRune(effectType) {
    if (effectType === "gold") return "✦";
    if (effectType === "allin") return "⚡";
    if (effectType === "shield") return "⌖";
    if (effectType === "bounty") return "⛃";
    if (effectType === "foresight") return "◉";
    return "✧";
  }

  function itemProcSparkCount(effectType) {
    if (effectType === "allin") return 18;
    if (effectType === "gold") return 14;
    if (effectType === "foresight") return 12;
    return 10;
  }

  function triggerOverlayItemProcBurst(seatIndex, effectType, label, toneClass) {
    if (!el.tableScene || !el.itemOverlayLayer || !Array.isArray(el.itemOverlaySlots)) return;
    if (!el.tableScene.classList.contains("mode-3d")) return;

    const viewSeatIndex = toViewSeatIndex(seatIndex);
    const slotEl = el.itemOverlaySlots.find((slot) => Number(slot.dataset.overlaySeat) === viewSeatIndex);
    if (!slotEl) return;

    const burst = document.createElement("span");
    burst.className = `item-overlay-proc-burst ${toneClass}`;
    burst.style.setProperty("--item-proc-rgb", itemProcToneRgb(effectType));

    const ring = document.createElement("span");
    ring.className = "item-overlay-proc-ring";
    burst.appendChild(ring);

    const glow = document.createElement("span");
    glow.className = "item-overlay-proc-glow";
    burst.appendChild(glow);

    const text = document.createElement("span");
    text.className = "item-overlay-proc-text";
    text.textContent = String(label || "아이템 발동");
    burst.appendChild(text);

    slotEl.appendChild(burst);
    window.setTimeout(() => {
      burst.remove();
    }, 1180);
  }

  function play3DItemEffect(seatIndex, effectType, label = "", itemId = "") {
    if (!window.Poker3D || typeof window.Poker3D.playItemEffect !== "function") return;
    window.Poker3D.playItemEffect(toViewSeatIndex(seatIndex), {
      type: effectType,
      label: String(label || ""),
      itemId: String(itemId || "")
    });
  }

  function triggerItemProcEffect(seatIndex, effectType, label, itemId = "") {
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= state.players.length) return;

    const viewSeatIndex = toViewSeatIndex(seatIndex);
    const seatEl = el.seats[viewSeatIndex];
    const inner = seatEl ? seatEl.querySelector(".seat-inner") : null;
    const toneClass = itemProcClass(effectType);

    if (seatEl && inner) {
      seatEl.classList.remove(
        "item-proc",
        "item-proc-mult",
        "item-proc-gold",
        "item-proc-allin",
        "item-proc-shield",
        "item-proc-bounty",
        "item-proc-foresight"
      );
      // Restart animation when effects trigger repeatedly.
      void seatEl.offsetWidth;
      seatEl.classList.add("item-proc", toneClass);

      const burst = document.createElement("div");
      burst.className = `item-proc-burst ${toneClass}`;
      burst.style.setProperty("--item-proc-rgb", itemProcToneRgb(effectType));

      const ring = document.createElement("span");
      ring.className = "item-proc-ring";
      burst.appendChild(ring);

      const shine = document.createElement("span");
      shine.className = "item-proc-shine";
      burst.appendChild(shine);

      const particles = document.createElement("span");
      particles.className = "item-proc-particles";
      const sparkCount = itemProcSparkCount(effectType);
      for (let i = 0; i < sparkCount; i += 1) {
        const spark = document.createElement("span");
        spark.className = "item-proc-spark";
        spark.style.setProperty("--spark-angle", `${(360 / sparkCount) * i + (Math.random() * 18 - 9)}deg`);
        spark.style.setProperty("--spark-dist", `${56 + Math.random() * 38}px`);
        spark.style.setProperty("--spark-delay", `${Math.random() * 0.08}s`);
        spark.style.setProperty("--spark-size", `${4 + Math.random() * 4}px`);
        particles.appendChild(spark);
      }
      burst.appendChild(particles);

      const rune = document.createElement("span");
      rune.className = "item-proc-rune";
      rune.textContent = itemProcRune(effectType);
      burst.appendChild(rune);

      const text = document.createElement("span");
      text.className = "item-proc-label";
      text.textContent = String(label || "아이템 발동");
      burst.appendChild(text);

      inner.appendChild(burst);

      window.setTimeout(() => {
        burst.remove();
      }, 980);

      window.setTimeout(() => {
        seatEl.classList.remove(
          "item-proc",
          "item-proc-mult",
          "item-proc-gold",
          "item-proc-allin",
          "item-proc-shield",
          "item-proc-bounty",
          "item-proc-foresight"
        );
      }, 860);
    }

    if (itemId) {
      trackItemProc(itemId);
    }
    triggerOverlayItemProcBurst(seatIndex, effectType, label, toneClass);
    play3DItemEffect(seatIndex, effectType, label, itemId);
    playSfx("item_proc", { type: effectType });
  }

  function pointFromRect(rect, layerRect, xRatio = 0.5, yRatio = 0.5) {
    return {
      x: rect.left - layerRect.left + rect.width * xRatio,
      y: rect.top - layerRect.top + rect.height * yRatio
    };
  }

  function getDealerOriginPoint() {
    if (!el.dealLayer) return { x: 0, y: 0 };
    const layerRect = el.dealLayer.getBoundingClientRect();
    const source = el.dealerHands || document.querySelector(".dealer-hands");
    if (!source) {
      return { x: layerRect.width * 0.5, y: layerRect.height * 0.2 };
    }
    return pointFromRect(source.getBoundingClientRect(), layerRect, 0.5, 0.4);
  }

  function getSeatCardTarget(seatIndex, cardIndex) {
    const layerRect = el.dealLayer.getBoundingClientRect();
    const cardsEl = el.seats[seatIndex]?.querySelector(".cards");
    if (!cardsEl) {
      return { x: layerRect.width * 0.5, y: layerRect.height * 0.7 };
    }

    const rect = cardsEl.getBoundingClientRect();
    const isHuman = state.players[seatIndex]?.isHuman;
    const xRatio = isHuman ? (cardIndex === 0 ? 0.36 : 0.64) : cardIndex === 0 ? 0.32 : 0.68;
    return pointFromRect(rect, layerRect, xRatio, 0.54);
  }

  function getCommunityCardTarget(cardIndex) {
    const layerRect = el.dealLayer.getBoundingClientRect();
    const rect = el.communityCards.getBoundingClientRect();
    const xRatio = (cardIndex + 0.5) / 5;
    return pointFromRect(rect, layerRect, xRatio, 0.56);
  }

  function getActiveDealOrder() {
    const first = nextIndex(state.dealerIndex, (player) => !player.folded);
    if (first === -1) return [];

    const order = [];
    let idx = first;
    do {
      if (!state.players[idx].folded) {
        order.push(idx);
      }
      idx = (idx + 1) % state.players.length;
    } while (idx !== first);

    return order;
  }

  function animateCardThrow(toPoint, { duration = 340, arcHeight = null } = {}) {
    if (!el.dealLayer) return Promise.resolve();

    const card = document.createElement("div");
    card.className = "deal-card";
    card.style.left = "0px";
    card.style.top = "0px";
    el.dealLayer.appendChild(card);

    const from = getDealerOriginPoint();
    const computedArc = arcHeight ?? Math.max(20, Math.abs(toPoint.x - from.x) * 0.08 + 10);
    const rotationStart = -18 + Math.random() * 14;
    const rotationEnd = -4 + Math.random() * 8;

    return new Promise((resolve) => {
      const start = performance.now();

      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;

        const x = from.x + (toPoint.x - from.x) * eased;
        const linearY = from.y + (toPoint.y - from.y) * eased;
        const y = linearY - Math.sin(Math.PI * t) * computedArc;
        const rot = rotationStart + (rotationEnd - rotationStart) * eased;
        const scale = 0.92 + 0.08 * eased;

        card.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;

        if (t < 1) {
          window.requestAnimationFrame(step);
          return;
        }

        card.remove();
        resolve();
      }

      window.requestAnimationFrame(step);
    });
  }

  async function animateHoleCards() {
    const order = getActiveDealOrder();
    if (order.length === 0) return;

    const handId = state.handId;
    state.animatingDeal = true;
    setDealerThrowing(true);

    try {
      for (let round = 0; round < 2; round += 1) {
        for (const seatIndex of order) {
          if (state.handId !== handId || state.handOver) return;

          await throwCardToSeat(seatIndex, round);
          playSfx("card");
          state.dealtHoleCounts[seatIndex] = Math.min(2, (state.dealtHoleCounts[seatIndex] || 0) + 1);
          render();
          await sleep(55);
        }
      }
    } finally {
      if (state.handId === handId) {
        state.animatingDeal = false;
      }
      setDealerThrowing(false);
      clearDealLayer();
    }
  }

  async function animateCommunityCards(count) {
    if (count <= 0) return;
    const handId = state.handId;
    state.animatingDeal = true;
    setDealerThrowing(true);

    try {
      for (let i = 0; i < count; i += 1) {
        if (state.handId !== handId || state.handOver) return;

        const cardIndex = state.communityVisible;
        await throwCardToCommunity(cardIndex);
        playSfx("card");
        state.communityVisible += 1;
        render();
        await sleep(70);
      }
    } finally {
      if (state.handId === handId) {
        state.animatingDeal = false;
      }
      setDealerThrowing(false);
      clearDealLayer();
    }
  }

  function postBlind(player, amount, label) {
    const posted = commitChips(player, amount);
    if (posted > 0) {
      setPlayerAction(player, `${label} ${toCurrency(posted)}`, "strong");
      logHistory(`${player.name} posts ${label} ${toCurrency(posted)}.`, "action");
      playSfx("chip", { amount: posted });

      if (hasItem(player, "blind_refund")) {
        const refundScale = itemCombinedScale("blind_refund", 0.45, 1.8);
        const refundRate = clamp(BLIND_REFUND_RATE * refundScale, 0.05, 0.65);
        const refund = Math.max(1, Math.floor(posted * refundRate));
        player.chips += refund;
        const seatIndex = state.players.indexOf(player);
        setPlayerAction(player, `${label} ${toCurrency(posted)} · 환급 +${toCurrency(refund)}`, "strong");
        logHistory(`${player.name} 블라인드 리베이트 발동: +${toCurrency(refund)} 환급.`, "info");
        if (seatIndex >= 0) {
          triggerItemProcEffect(seatIndex, "shield", `리베이트 +${toCurrency(refund)}`, "blind_refund");
        }
      }
    }
    return posted;
  }

  function commitChips(player, amount) {
    if (amount <= 0 || player.chips <= 0) return 0;
    const committed = Math.min(amount, player.chips);
    player.chips -= committed;
    player.currentBet += committed;
    player.invested += committed;
    state.pot += committed;
    if (player.chips === 0) {
      player.allIn = true;
    }
    return committed;
  }

  function resetStreetBets() {
    state.players.forEach((player) => {
      player.currentBet = 0;
      if (!player.folded && !player.allIn) {
        player.acted = false;
      } else {
        player.acted = true;
      }
    });
    state.currentBet = 0;
    state.minRaise = state.bigBlind;
  }

  async function startHand() {
    if (!hasAuthoritativeControl()) return;
    clearAutoNextHand();
    if (isEconomyModalOpen()) return;
    if (state.gameOver || isHeroBusted()) {
      triggerGameOver();
      render();
      return;
    }
    state.handId += 1;
    const handId = state.handId;
    stopTurnTimer();
    const stageIntro = applyPendingStageAdvance();
    applyBlindLevel(currentBlindLevelForHand(state.handId));
    state.handOver = false;
    state.waitingForHuman = false;
    state.actionLock = false;
    setPeek(false);
    state.animatingDeal = false;
    state.roundTransitioning = false;
    state.autoRunoutInProgress = false;
    state.replayInProgress = false;
    state.replayEntryId = null;
    state.multiplayer.pendingRemoteActions = [];
    state.handBloodCoinAwarded = false;
    state.markedLensUsedThisHand = false;
    state.markedLensReveal = null;
    state.riverForesightReveal = null;
    setHandWinnerIndices([]);
    clearEconomyState();
    state.communityCards = [];
    state.communityVisible = 0;
    state.pot = 0;
    state.stage = "preflop";
    state.currentBet = 0;
    state.minRaise = state.bigBlind;
    state.activePlayerIndex = -1;
    clearCurrentHandHistory();
    clearDealLayer();
    if (stageIntro) {
      logHistory(stageIntro, "stage");
    }

    state.dealerIndex = nextIndex(state.dealerIndex, (p) => p.chips > 0);

    state.players.forEach((player) => {
      player.wasAliveAtHandStart = player.chips > 0;
      player.hand = [];
      player.folded = player.chips <= 0;
      player.allIn = false;
      player.currentBet = 0;
      player.acted = player.folded;
      player.lastAction = "";
      player.actionTone = "";
      player.showdown = null;
      player.invested = 0;
      player.handStartChips = player.chips;
      player.aggressiveActionsThisHand = 0;
      player.reachedRiverThisHand = false;
      player.riverForesightUsedThisHand = false;
      player.wentAllInThisHand = false;
      player.insuranceRefundedThisHand = false;
    });
    state.dealtHoleCounts = state.players.map(() => 0);
    trackHandItemExposure();
    if (window.Poker3D && typeof window.Poker3D.resetForNewHand === "function") {
      window.Poker3D.resetForNewHand();
    }

    state.deck = shuffle(applyDeckModifiersToDeck(buildDeck()));
    const hero = humanPlayer();
    const heroAssistCards = hero && !hero.folded ? pickStageOneHeroAssistCards(state.deck) : null;

    for (let i = 0; i < 2; i += 1) {
      state.players.forEach((player, playerIndex) => {
        if (!player.folded) {
          if (heroAssistCards && player.isHuman) {
            const assisted = heroAssistCards[player.hand.length];
            if (assisted) {
              player.hand.push(assisted);
              return;
            }
          }
          player.hand.push(drawCard({ drawKind: "hole", street: "preflop", targetIndex: playerIndex }));
        }
      });
    }

    const sbIndex = nextIndex(state.dealerIndex, (p) => p.chips > 0);
    const bbIndex = nextIndex(sbIndex, (p) => p.chips > 0);
    state.smallBlindIndex = sbIndex;
    state.bigBlindIndex = bbIndex;

    logHistory(
      `Hand #${state.handId} starts. Stage ${state.tournamentStage + 1} ${currentStageProfile().name}. Level ${state.blindLevel + 1} (${toCurrency(state.smallBlind)}/${toCurrency(state.bigBlind)}).`,
      "street"
    );
    const drawMods = summarizeBoardIntervention();
    if (drawMods) {
      logHistory(`Draw mods active: ${drawMods}.`, "info");
    }
    const heroDeckMods = summarizeDeckMods(hero);
    if (heroDeckMods !== "none") {
      logHistory(`Hero deck mods: ${heroDeckMods}.`, "info");
    }
    if (state.handId === 1 || stageIntro) {
      const profile = currentStageProfile();
      const bonusText = profile.bonus > 0 ? ` | Bonus +${toCurrency(profile.bonus)}` : "";
      showStageBanner(
        `Stage ${state.tournamentStage + 1} · ${profile.name}`,
        `NPC ${toCurrency(profile.npcChips)}${bonusText}`,
        "stage-start",
        2300
      );
      const loadoutLine = npcLoadoutSummary();
      if (loadoutLine) {
        logHistory(`NPC relics: ${loadoutLine}.`, "info");
      }
      cue3D("stageStart");
      playSfx("stage");
    }
    logHistory(`Dealer button: ${state.players[state.dealerIndex].name}.`, "info");

    const sbPosted = postBlind(state.players[sbIndex], state.smallBlind, "SB");
    const bbPosted = postBlind(state.players[bbIndex], state.bigBlind, "BB");

    if (sbPosted > 0) {
      window.setTimeout(() => {
        if (state.handId !== handId || state.handOver) return;
        play3DAction(sbIndex, "bet");
        throw3DBetChips(sbIndex, sbPosted);
      }, 80);
    }

    if (bbPosted > 0) {
      window.setTimeout(() => {
        if (state.handId !== handId || state.handOver) return;
        play3DAction(bbIndex, "bet");
        throw3DBetChips(bbIndex, bbPosted);
      }, 180);
    }

    state.currentBet = Math.max(...state.players.map((p) => p.currentBet));
    state.minRaise = state.bigBlind;

    state.players.forEach((player) => {
      player.acted = !canAct(player);
    });

    const opener = nextIndex(bbIndex, (p) => canAct(p));
    setStatus(
      "Preflop started.",
      `Dealer ${state.players[state.dealerIndex].name} | SB ${state.players[sbIndex].name} ${toCurrency(state.smallBlind)} | BB ${state.players[bbIndex].name} ${toCurrency(state.bigBlind)}`
    );
    logHistory("Preflop action starts.", "street");
    cue3D("handStart");
    render();
    await animateHoleCards();
    if (state.handId !== handId || state.handOver) return;

    if (opener === -1) {
      // Everyone is all-in already.
      autoRunout();
      return;
    }

    beginTurn(opener);
  }

  function beginTurn(index) {
    if (state.handOver || state.animatingDeal || state.roundTransitioning) return;

    const player = state.players[index];
    if (!canAct(player)) {
      const next = nextIndex(index, (p) => canAct(p));
      if (next === -1) {
        concludeBettingRound();
      } else {
        beginTurn(next);
      }
      return;
    }

    state.activePlayerIndex = index;
    const humanControlled = isSeatHumanControlled(index);
    state.waitingForHuman = humanControlled;
    startTurnTimer(index);
    if (humanControlled) {
      cue3D("turn", { seatIndex: index });
    }

    if (humanControlled) {
      const toCall = Math.max(0, state.currentBet - player.currentBet);
      if (canLocalControlSeat(index)) {
        const hint = toCall > 0 ? `To call: ${toCurrency(toCall)}` : "No bet to call.";
        setStatus("Your turn.", hint);
      } else if (isMultiplayerHost()) {
        const hint = toCall > 0 ? `Waiting for remote call ${toCurrency(toCall)}.` : "Waiting for remote check/bet.";
        setStatus(`${player.name}'s turn.`, hint);
      }
      render();
      if (isMultiplayerHost() && !canLocalControlSeat(index)) {
        window.setTimeout(() => {
          if (state.handOver || state.activePlayerIndex !== index || !state.waitingForHuman) return;
          tryApplyPendingRemoteActionForSeat(index);
        }, 30);
      }
      return;
    }

    render();
    const handId = state.handId;
    const thinkDuration = NPC_MIN_THINK_MS + Math.floor(Math.random() * (NPC_MAX_THINK_MS - NPC_MIN_THINK_MS + 1));
    const safeDelay = Math.min(Math.max(thinkDuration, NPC_MIN_THINK_MS), Math.max(NPC_MIN_THINK_MS, TURN_TIME_MS - 400));
    state.pendingBotThinkTimeoutId = window.setTimeout(() => {
      state.pendingBotThinkTimeoutId = null;
      if (state.handId !== handId || state.handOver) return;
      if (index !== state.activePlayerIndex || state.waitingForHuman) return;
      botAct(index);
    }, safeDelay);
  }

  function humanAction(action, raiseTo = null) {
    if (state.gameOver || state.handOver || state.actionLock || state.animatingDeal || state.roundTransitioning) return;
    const seatIndex = state.activePlayerIndex;
    const player = state.players[seatIndex];
    if (!player || !state.waitingForHuman) return;
    if (!canLocalControlSeat(seatIndex)) return;

    if (multiplayerEnabled() && state.multiplayer.connected) {
      sendLocalActionToHost(action, raiseTo);
      return;
    }
    if (!hasAuthoritativeControl()) return;

    state.actionLock = true;
    const ok = applyAction(player, action, raiseTo);
    state.actionLock = false;

    if (!ok) {
      setStatus("Invalid action.", "Adjust your raise amount or choose another action.");
      render();
    }
  }

  function botAct(index) {
    const player = state.players[index];
    if (!player || state.handOver || !canAct(player)) return;

    const toCall = Math.max(0, state.currentBet - player.currentBet);
    const aggro = effectiveBotAggro(player);
    const aggroOffset = aggro - 1;
    let strength = estimateStrength(player);
    const roll = Math.random();

    if (state.stage === "preflop" && canUseSleightOfHand(player)) {
      const sleightThreshold = clamp(0.46 - aggroOffset * 0.08, 0.26, 0.6);
      const sleightChance = clamp(0.68 - aggroOffset * 0.2, 0.35, 0.86);
      if (strength < sleightThreshold && Math.random() < sleightChance) {
        if (useSleightOfHand(player, { bot: true })) {
          strength = estimateStrength(player);
        }
      }
    }

    if (canUseRiverForesight(player)) {
      const foresightChance = clamp(0.36 - aggroOffset * 0.08, 0.18, 0.52);
      const shouldUse = (state.stage === "turn" || strength < 0.72) && Math.random() < foresightChance;
      if (shouldUse) {
        useRiverForesight(player, { bot: true });
      }
    }

    if (toCall > 0) {
      const foldStrengthPreflop = clamp(0.42 - aggroOffset * 0.12, 0.24, 0.56);
      const foldStrengthPostflop = clamp(0.3 - aggroOffset * 0.1, 0.14, 0.46);
      const weakPreflopFold = clamp(0.72 - aggroOffset * 0.35, 0.22, 0.9);
      const weakPostflopFold = clamp(0.55 - aggroOffset * 0.32, 0.16, 0.8);
      const raiseChanceCalled = clamp(0.58 + aggroOffset * 0.34, 0.2, 0.92);
      const raiseStrengthCalled = clamp(0.76 - aggroOffset * 0.16, 0.5, 0.9);

      if (state.stage === "preflop" && strength < foldStrengthPreflop && roll < weakPreflopFold) {
        applyAction(player, "fold");
        return;
      }
      if (strength < foldStrengthPostflop && roll < weakPostflopFold) {
        applyAction(player, "fold");
        return;
      }
      if (strength > raiseStrengthCalled && player.chips > toCall + state.bigBlind && roll < raiseChanceCalled) {
        applyAction(player, "raise", botRaiseTarget(player, strength));
        return;
      }
      applyAction(player, "checkcall");
      return;
    }

    const raiseStrengthFree = clamp(0.68 - aggroOffset * 0.18, 0.42, 0.86);
    const raiseChanceFree = clamp(0.54 + aggroOffset * 0.32, 0.18, 0.9);
    if (strength > raiseStrengthFree && player.chips > state.bigBlind && roll < raiseChanceFree) {
      applyAction(player, "raise", botRaiseTarget(player, strength));
      return;
    }

    applyAction(player, "checkcall");
  }

  function botRaiseTarget(player, strength) {
    const maxTotal = player.currentBet + player.chips;
    if (maxTotal <= state.currentBet) return state.currentBet;

    const minTotal = state.currentBet === 0 ? state.bigBlind : state.currentBet + state.minRaise;
    const aggro = effectiveBotAggro(player);
    const aggroOffset = aggro - 1;
    const potPressure = clamp(0.24 + strength * 0.72 + aggroOffset * 0.22, 0.18, 1.25);
    let target = state.currentBet + Math.max(state.bigBlind, Math.round((state.pot * potPressure) / state.bigBlind) * state.bigBlind);

    if (state.currentBet === 0) {
      const openingSize = aggro < 0.9 ? state.bigBlind : state.bigBlind * 2;
      target = Math.max(target, openingSize);
    }

    target = Math.max(minTotal, Math.min(target, maxTotal));

    if (target < minTotal && maxTotal >= minTotal) {
      target = minTotal;
    }

    return target;
  }

  function applyAction(player, action, raiseTo = null) {
    if (!hasAuthoritativeControl()) return false;
    if (state.handOver) return false;
    if (!canAct(player)) return false;

    const prevBet = state.currentBet;
    const toCall = Math.max(0, state.currentBet - player.currentBet);
    const playerIndex = state.players.indexOf(player);
    const prevPot = state.pot;
    let reopened = false;
    let didAllIn = false;
    let actionCue = "check";

    if (action === "fold") {
      player.folded = true;
      player.acted = true;
      setPlayerAction(player, "Fold", "danger");
      logHistory(`${player.name} folds.`, "action");
      actionCue = "fold";
      if (player.isHuman) {
        setPeek(false);
      }
    } else if (action === "checkcall") {
      if (toCall === 0) {
        player.acted = true;
        setPlayerAction(player, "Check");
        logHistory(`${player.name} checks.`, "action");
        actionCue = "check";
      } else {
        const paid = commitChips(player, toCall);
        player.acted = true;

        if (paid < toCall) {
          setPlayerAction(player, `All-in ${toCurrency(player.currentBet)}`, "strong");
          logHistory(`${player.name} goes all-in for ${toCurrency(player.currentBet)}.`, "action");
          didAllIn = true;
          actionCue = "allin";
        } else {
          setPlayerAction(player, `Call ${toCurrency(paid)}`);
          logHistory(`${player.name} calls ${toCurrency(paid)}.`, "action");
          actionCue = "call";
        }
      }
    } else if (action === "raise") {
      const maxTotal = player.currentBet + player.chips;
      if (maxTotal <= state.currentBet) {
        return false;
      }

      const minTotal = state.currentBet === 0 ? state.bigBlind : state.currentBet + state.minRaise;
      const requested = Number.isFinite(raiseTo) ? Math.floor(raiseTo) : minTotal;
      let target = Math.min(Math.max(requested, player.currentBet), maxTotal);

      const isAllIn = target === maxTotal;
      if (target < minTotal && !isAllIn) {
        return false;
      }

      if (target <= state.currentBet && !isAllIn) {
        return false;
      }

      if (target <= player.currentBet) {
        return false;
      }

      const paid = commitChips(player, target - player.currentBet);
      if (paid <= 0) return false;

      target = player.currentBet;

      if (target > state.currentBet) {
        const raiseSize = target - prevBet;
        state.currentBet = target;

        if (prevBet === 0) {
          state.minRaise = Math.max(state.bigBlind, raiseSize);
          reopened = true;
        } else if (raiseSize >= state.minRaise) {
          state.minRaise = raiseSize;
          reopened = true;
        }
      }

      if (target <= prevBet) {
        player.acted = true;
        setPlayerAction(player, `Call ${toCurrency(toCall)}`);
        logHistory(`${player.name} calls ${toCurrency(toCall)}.`, "action");
        actionCue = "call";
      } else {
        player.acted = true;
        if (player.allIn) {
          setPlayerAction(player, `All-in ${toCurrency(target)}`, "strong");
          logHistory(`${player.name} shoves all-in to ${toCurrency(target)}.`, "action");
          didAllIn = true;
          actionCue = "allin";
        } else if (prevBet === 0) {
          setPlayerAction(player, `Bet ${toCurrency(target)}`, "strong");
          logHistory(`${player.name} bets to ${toCurrency(target)}.`, "action");
          actionCue = "bet";
        } else {
          setPlayerAction(player, `Raise ${toCurrency(target)}`, "strong");
          logHistory(`${player.name} raises to ${toCurrency(target)}.`, "action");
          actionCue = "raise";
        }
      }
    } else {
      return false;
    }

    if (reopened) {
      logHistory(`Action re-opened by ${player.name}.`, "info");
      state.players.forEach((p) => {
        if (p !== player && canAct(p)) {
          p.acted = false;
        }
      });
    }

    if (player.allIn && !player.folded) {
      player.wentAllInThisHand = true;
    }

    if (actionCue === "bet" || actionCue === "raise" || actionCue === "allin") {
      player.aggressiveActionsThisHand = Math.max(0, Math.floor(Number(player.aggressiveActionsThisHand) || 0)) + 1;
    }

    stopTurnTimer();
    state.waitingForHuman = false;
    play3DAction(playerIndex, actionCue);
    if (actionCue === "fold") {
      playSfx("fold");
    } else if (actionCue === "call") {
      playSfx("call");
    } else if (actionCue === "raise" || actionCue === "bet") {
      playSfx("raise");
    } else if (actionCue === "allin") {
      playSfx("allin");
    }
    const contributed = Math.max(0, state.pot - prevPot);
    if (contributed > 0) {
      throw3DBetChips(playerIndex, contributed);
      playSfx("chip", { amount: contributed });
    }
    if (didAllIn && player.isHuman) {
      cue3D("allin", { seatIndex: playerIndex });
    }

    if (checkSinglePlayerWin()) {
      render();
      return true;
    }

    if (isBettingRoundComplete()) {
      render();
      window.setTimeout(() => {
        if (!state.handOver && !state.roundTransitioning) {
          concludeBettingRound();
        }
      }, 750);
      return true;
    }

    const currentIdx = state.players.indexOf(player);
    const next = nextIndex(currentIdx, (p) => canAct(p));
    if (next === -1) {
      if (!state.roundTransitioning) {
        concludeBettingRound();
      }
      return true;
    }

    render();
    beginTurn(next);
    return true;
  }

  function isBettingRoundComplete() {
    const active = state.players.filter((player) => !player.folded);
    const eligible = active.filter((player) => canAct(player));

    if (eligible.length === 0) return true;

    return eligible.every((player) => player.acted && player.currentBet === state.currentBet);
  }

  function checkSinglePlayerWin() {
    const contenders = playersInHand();
    if (contenders.length !== 1) return false;

    const winner = contenders[0];
    const winnerIndex = state.players.indexOf(winner);
    setHandWinnerIndices([winnerIndex]);
    const baseWon = state.pot;
    let won = baseWon;
    const allInFactor = allInWinMultiplierFor(winner);
    if (allInFactor > 1) {
      won = Math.floor(won * allInFactor);
      logHistory(`${winner.name} all-in multiplier x${allInFactor} applied.`, "showdown");
      triggerItemProcEffect(winnerIndex, "allin", `올인 배수 x${formatMultiplier(allInFactor)}`, "allin_multiplier");
    }
    const itemMods = itemPayoutModifiersFor(winner, winnerIndex, null);
    if (itemMods.multiplier > 1) {
      won = Math.floor(won * itemMods.multiplier);
      logHistory(`${winner.name} item multiplier x${formatMultiplier(itemMods.multiplier)} applied.`, "showdown");
      const multIds = Array.isArray(itemMods.multiplierItemIds) ? [...new Set(itemMods.multiplierItemIds)] : [];
      triggerItemProcEffect(winnerIndex, "mult", `아이템 x${formatMultiplier(itemMods.multiplier)}`, multIds[0] || "");
      multIds.slice(1).forEach((itemId) => trackItemProc(itemId));
    }
    if (itemMods.flatBonus > 0) {
      won += itemMods.flatBonus;
      const flatIds = Array.isArray(itemMods.flatItemIds) ? [...new Set(itemMods.flatItemIds)] : [];
      triggerItemProcEffect(winnerIndex, "bounty", `아이템 +${toCurrency(itemMods.flatBonus)}`, flatIds[0] || "");
      flatIds.slice(1).forEach((itemId) => trackItemProc(itemId));
    }
    winner.chips += won;
    state.pot = 0;
    state.handOver = true;
    cue3D("showdown");

    setPlayerAction(winner, `Won ${toCurrency(won)}`, "strong");
    setStatus(`${winner.name} wins ${toCurrency(won)} chips.`, "Everyone else folded.");
    const itemSummary = itemMods.labels.length > 0 ? ` [${itemMods.labels.join(" · ")}]` : "";
    logHistory(`${winner.name} wins uncontested pot ${toCurrency(baseWon)} -> ${toCurrency(won)}.${itemSummary}`, "showdown");
    if (winner.isHuman) {
      playSfx("win");
    }
    finalizeHand();
    return true;
  }

  async function concludeBettingRound() {
    if (state.handOver || state.roundTransitioning) return;

    const handId = state.handId;
    state.roundTransitioning = true;

    if (state.stage === "preflop") {
      state.communityCards.push(
        drawCommunityCardForStreet("flop"),
        drawCard({ drawKind: "community", street: "flop" }),
        drawCard({ drawKind: "community", street: "flop" })
      );
      setStatus("Dealer throws the flop.", "Three cards hit the felt.");
      logHistory("Flop incoming.", "street");
      cue3D("boardFocus");
      render();
      await animateCommunityCards(3);

      if (state.handId !== handId || state.handOver) {
        state.roundTransitioning = false;
        render();
        return;
      }

      state.stage = "flop";
      setStatus("Flop dealt.", "Three community cards are on the felt.");
      logHistory(`Flop: ${state.communityCards.slice(0, 3).map(cardText).join(" ")}`, "street");
      state.roundTransitioning = false;
      setupNextStreet();
      return;
    }

    if (state.stage === "flop") {
      state.communityCards.push(drawCommunityCardForStreet("turn"));
      setStatus("Dealer fires the turn.", "Fourth board card incoming.");
      logHistory("Turn incoming.", "street");
      cue3D("boardFocus");
      render();
      await animateCommunityCards(1);

      if (state.handId !== handId || state.handOver) {
        state.roundTransitioning = false;
        render();
        return;
      }

      state.stage = "turn";
      setStatus("Turn card dealt.", "One more card before the river.");
      logHistory(`Turn: ${state.communityCards[3] ? cardText(state.communityCards[3]) : "-"}`, "street");
      state.roundTransitioning = false;
      setupNextStreet();
      return;
    }

    if (state.stage === "turn") {
      state.communityCards.push(drawCommunityCardForStreet("river"));
      setStatus("Dealer launches the river.", "Final board card incoming.");
      logHistory("River incoming.", "street");
      cue3D("boardFocus");
      render();
      await animateCommunityCards(1);

      if (state.handId !== handId || state.handOver) {
        state.roundTransitioning = false;
        render();
        return;
      }

      state.stage = "river";
      state.players.forEach((player) => {
        if (!player) return;
        if (!player.folded && player.wasAliveAtHandStart) {
          player.reachedRiverThisHand = true;
        }
      });
      setStatus("River card dealt.", "Final betting round.");
      logHistory(`River: ${state.communityCards[4] ? cardText(state.communityCards[4]) : "-"}`, "street");
      state.roundTransitioning = false;
      setupNextStreet();
      return;
    }

    state.roundTransitioning = false;
    if (state.stage === "river") {
      showdown();
      return;
    }

    render();
  }

  function setupNextStreet() {
    resetStreetBets();
    render();

    const contenders = playersInHand();
    if (contenders.length <= 1) {
      checkSinglePlayerWin();
      return;
    }

    const opener = nextIndex(state.dealerIndex, (p) => canAct(p));
    if (opener === -1) {
      if (!state.autoRunoutInProgress) {
        autoRunout();
      }
      return;
    }

    if (state.stage !== "preflop") {
      logHistory(`${state.stage.toUpperCase()} action starts.`, "street");
    }
    beginTurn(opener);
  }

  function autoRunout() {
    if (state.handOver || state.autoRunoutInProgress) return;

    const handId = state.handId;
    state.autoRunoutInProgress = true;

    const runout = async () => {
      try {
        while (!state.handOver && state.handId === handId) {
          const opener = nextIndex(state.dealerIndex, (player) => canAct(player));
          if (opener !== -1) {
            beginTurn(opener);
            return;
          }

          if (state.stage === "river") {
            showdown();
            return;
          }

          await sleep(620);
          await concludeBettingRound();
          await sleep(120);
        }
      } finally {
        state.autoRunoutInProgress = false;
      }
    };

    runout();
  }

  function buildSidePots() {
    const layers = state.players
      .map((player, index) => ({ index, amount: Math.max(0, player.invested || 0) }))
      .filter((entry) => entry.amount > 0)
      .sort((a, b) => a.amount - b.amount);

    if (layers.length === 0) return [];

    const pots = [];
    let previous = 0;

    while (layers.length > 0) {
      const level = layers[0].amount;
      const layerSize = level - previous;
      const contributors = layers.map((entry) => entry.index);
      const amount = layerSize * contributors.length;
      if (amount > 0) {
        pots.push({
          amount,
          contributors,
          eligible: contributors.filter((index) => !state.players[index].folded)
        });
      }
      previous = level;
      while (layers.length > 0 && layers[0].amount === level) {
        layers.shift();
      }
    }

    return pots;
  }

  function seatOrderFromButton(indices) {
    const set = new Set(indices);
    const ordered = [];
    for (let i = 1; i <= state.players.length; i += 1) {
      const index = (state.dealerIndex + i + state.players.length) % state.players.length;
      if (set.has(index)) {
        ordered.push(index);
      }
    }
    return ordered;
  }

  function handMultiplierFor(player, evalResult) {
    const mods = normalizedDeckMods(player);
    let multiplier = 1;

    mods.forEach((mod) => {
      if (mod.type !== "hand_multiplier") return;
      const byRank = Number.isInteger(mod.handRank) && mod.handRank === evalResult.rank;
      const byName = typeof mod.handName === "string" && mod.handName === evalResult.name;
      if (!byRank && !byName) return;

      const factor = Number(mod.multiplier);
      if (!Number.isFinite(factor) || factor <= 1) return;
      multiplier *= factor;
    });

    return Math.max(1, multiplier);
  }

  function handStartAverageChips() {
    const stacks = state.players
      .filter((player) => player && player.wasAliveAtHandStart)
      .map((player) => Math.max(0, Number(player.handStartChips) || 0))
      .filter((stack) => stack > 0);
    if (stacks.length <= 0) return 0;
    const sum = stacks.reduce((acc, stack) => acc + stack, 0);
    return sum / stacks.length;
  }

  function isUnderdogThisHand(player) {
    if (!player || !player.wasAliveAtHandStart) return false;
    const start = Math.max(0, Number(player.handStartChips) || 0);
    if (start <= 0) return false;
    const average = handStartAverageChips();
    if (average <= 0) return false;
    return start <= average * 0.8;
  }

  function itemPayoutModifiersFor(player, playerIndex, splitWinnerIndices) {
    let multiplier = 1;
    let flatBonus = 0;
    const labels = [];
    const multiplierItemIds = [];
    const flatItemIds = [];

    if (hasItem(player, "underdog_emblem") && isUnderdogThisHand(player)) {
      const scale = itemCombinedScale("underdog_emblem", 0.45, 1.9);
      const underdogMult = 1 + (UNDERDOG_EMBLEM_MULTIPLIER - 1) * scale;
      multiplier *= underdogMult;
      labels.push(`언더독 x${formatMultiplier(underdogMult)}`);
      multiplierItemIds.push("underdog_emblem");
    }

    if (hasItem(player, "triple_barrel")) {
      const aggroCount = Math.max(0, Math.floor(Number(player.aggressiveActionsThisHand) || 0));
      if (aggroCount >= 2) {
        const scale = itemCombinedScale("triple_barrel", 0.45, 1.9);
        const step = TRIPLE_BARREL_STEP * scale;
        const factor = 1 + Math.min(3, aggroCount) * step;
        multiplier *= factor;
        labels.push(`트리플 배럴 x${formatMultiplier(factor)}`);
        multiplierItemIds.push("triple_barrel");
      }
    }

    if (hasItem(player, "river_surfer") && player.reachedRiverThisHand) {
      const scale = itemCombinedScale("river_surfer", 0.45, 1.9);
      const bonus = Math.max(1, Math.floor(RIVER_SURFER_BONUS * scale));
      flatBonus += bonus;
      labels.push(`리버 생존 +${toCurrency(bonus)}`);
      flatItemIds.push("river_surfer");
    }

    if (splitWinnerIndices && splitWinnerIndices.has(playerIndex) && hasItem(player, "split_guard")) {
      const scale = itemCombinedScale("split_guard", 0.45, 1.9);
      const bonus = Math.max(1, Math.floor(SPLIT_GUARD_BONUS * scale));
      flatBonus += bonus;
      labels.push(`스플릿 가드 +${toCurrency(bonus)}`);
      flatItemIds.push("split_guard");
    }

    return {
      multiplier: Math.max(1, multiplier),
      flatBonus,
      labels,
      multiplierItemIds,
      flatItemIds
    };
  }

  function goldCardBonusFor(player, playerIndex, goldBonusPaidKeys) {
    const mods = normalizedDeckMods(player);
    let bonus = 0;

    mods.forEach((mod, modIndex) => {
      if (mod.type !== "gold_card") return;
      const rank = Number(mod.rank);
      const suit = String(mod.suit || "");
      if (!Number.isFinite(rank) || !suit) return;

      const key = `${playerIndex}:${modIndex}:${rank}${suit}`;
      if (goldBonusPaidKeys.has(key)) return;

      const ownsCard = (player.hand || []).some((card) => card && !card.isJoker && card.rank === rank && card.suit === suit);
      if (!ownsCard) return;

      const add = Math.max(0, Math.floor(Number(mod.bonus) || 0));
      if (add <= 0) return;

      goldBonusPaidKeys.add(key);
      bonus += add;
    });

    return bonus;
  }

  // Payout order is explicit:
  // base side-pot share -> deck hand multiplier -> all-in multiplier -> item multiplier -> gold-card bonus -> item flat bonus.
  function resolvePayoutAward({ player, playerIndex, evalResult, baseShare, goldBonusPaidKeys, splitWinnerIndices }) {
    const safeBase = Math.max(0, Math.floor(Number(baseShare) || 0));
    const handMult = handMultiplierFor(player, evalResult);
    const handMultiplied = Math.floor(safeBase * handMult);
    const allInMult = allInWinMultiplierFor(player);
    const multiplied = Math.floor(handMultiplied * allInMult);
    const itemMods = itemPayoutModifiersFor(player, playerIndex, splitWinnerIndices);
    const itemMult = itemMods.multiplier;
    const itemMultiplied = Math.floor(multiplied * itemMult);
    const goldBonus = goldCardBonusFor(player, playerIndex, goldBonusPaidKeys);
    const itemFlatBonus = itemMods.flatBonus;
    const total = itemMultiplied + goldBonus + itemFlatBonus;
    return {
      baseShare: safeBase,
      handMult,
      handMultiplied,
      allInMult,
      multiplied,
      itemMult,
      itemMultiplied,
      goldBonus,
      itemFlatBonus,
      itemLabels: itemMods.labels,
      itemMultiplierIds: itemMods.multiplierItemIds,
      itemFlatIds: itemMods.flatItemIds,
      total
    };
  }

  function showdown() {
    cue3D("showdown");
    const contenders = playersInHand();
    if (contenders.length === 0) {
      setHandWinnerIndices([]);
      state.handOver = true;
      finalizeHand();
      render();
      return;
    }

    const evaluated = contenders.map((player) => {
      const result = evaluateSeven([...player.hand, ...state.communityCards]);
      player.showdown = result;
      return { player, result, index: state.players.indexOf(player) };
    });

    evaluated.forEach((entry) => {
      const [a, b] = entry.player.hand;
      const cards = a && b ? `${cardText(a)} ${cardText(b)}` : "-- --";
      logHistory(`${entry.player.name} shows ${cards} (${entry.result.name}).`, "showdown");
    });

    let sidePots = buildSidePots();
    if (sidePots.length === 0 && state.pot > 0) {
      sidePots = [
        {
          amount: state.pot,
          contributors: state.players.map((_, index) => index),
          eligible: evaluated.map((entry) => entry.index)
        }
      ];
    }

    const payouts = new Map();
    const payoutDetails = new Map();
    const goldBonusPaidKeys = new Set();
    const splitWinnerIndices = new Set();
    let primaryWinners = [];
    let primaryName = "";

    sidePots.forEach((pot, potIndex) => {
      const eligibleEntries = evaluated.filter((entry) => pot.eligible.includes(entry.index));
      if (eligibleEntries.length === 0 || pot.amount <= 0) return;

      let best = eligibleEntries[0];
      for (let i = 1; i < eligibleEntries.length; i += 1) {
        if (compareEval(eligibleEntries[i].result, best.result) > 0) {
          best = eligibleEntries[i];
        }
      }

      const winners = eligibleEntries.filter((entry) => compareEval(entry.result, best.result) === 0);
      if (winners.length > 1) {
        winners.forEach((entry) => splitWinnerIndices.add(entry.index));
      }
      const payoutOrder = seatOrderFromButton(winners.map((entry) => entry.index))
        .map((index) => winners.find((entry) => entry.index === index))
        .filter(Boolean);

      const each = Math.floor(pot.amount / winners.length);
      let remainder = pot.amount - each * winners.length;
      payoutOrder.forEach((entry) => {
        const chip = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder -= 1;
        const baseShare = each + chip;
        const award = resolvePayoutAward({
          player: entry.player,
          playerIndex: entry.index,
          evalResult: entry.result,
          baseShare,
          goldBonusPaidKeys,
          splitWinnerIndices
        });

        payouts.set(entry.index, (payouts.get(entry.index) || 0) + award.total);
        if (!payoutDetails.has(entry.index)) {
          payoutDetails.set(entry.index, {
            base: 0,
            handMultiplied: 0,
            multiplied: 0,
            itemMultiplied: 0,
            allInApplied: 0,
            gold: 0,
            itemFlat: 0,
            itemLabels: [],
            itemMultiplierIds: [],
            itemFlatIds: [],
            total: 0
          });
        }
        const detail = payoutDetails.get(entry.index);
        detail.base += award.baseShare;
        detail.handMultiplied += award.handMultiplied;
        detail.multiplied += award.multiplied;
        detail.itemMultiplied += award.itemMultiplied;
        if (award.allInMult > 1) {
          detail.allInApplied += 1;
        }
        detail.gold += award.goldBonus;
        detail.itemFlat += award.itemFlatBonus;
        if (Array.isArray(award.itemLabels) && award.itemLabels.length > 0) {
          detail.itemLabels.push(...award.itemLabels);
        }
        if (Array.isArray(award.itemMultiplierIds) && award.itemMultiplierIds.length > 0) {
          detail.itemMultiplierIds.push(...award.itemMultiplierIds);
        }
        if (Array.isArray(award.itemFlatIds) && award.itemFlatIds.length > 0) {
          detail.itemFlatIds.push(...award.itemFlatIds);
        }
        detail.total += award.total;
      });

      const label = potIndex === 0 ? "Main pot" : `Side pot ${potIndex}`;
      const winnerNames = winners.map((entry) => entry.player.name).join(", ");
      logHistory(`${label} ${toCurrency(pot.amount)} -> ${winnerNames} (${best.result.name}).`, "showdown");

      if (potIndex === 0) {
        primaryWinners = winners.map((entry) => entry.player);
        primaryName = best.result.name;
      }
    });

    const heroWinningEntry = evaluated.find((entry) => entry.player.isHuman && primaryWinners.includes(entry.player));
    if (heroWinningEntry && !state.handBloodCoinAwarded) {
      const bonus = Math.max(0, Number(BLOOD_COIN_HIGH_HAND_BONUS[heroWinningEntry.result.rank]) || 0);
      if (bonus > 0) {
        state.handBloodCoinAwarded = true;
        addRunBloodCoins(bonus, `${heroWinningEntry.result.name} bonus`);
      }
    }

    payouts.forEach((amount, index) => {
      const player = state.players[index];
      player.chips += amount;
      setPlayerAction(player, `Won ${toCurrency(amount)}`, "strong");
    });

    setHandWinnerIndices([...payouts.keys()]);
    applyInsuranceRefunds();

    payouts.forEach((amount, index) => {
      const player = state.players[index];
      const detail = payoutDetails.get(index);
      if (!player || !detail) return;

      const handMultPart = detail.handMultiplied !== detail.base ? `, hand-mult ${toCurrency(detail.handMultiplied)}` : "";
      const allInPart = detail.multiplied !== detail.handMultiplied ? `, all-in mult ${toCurrency(detail.multiplied)}` : "";
      const itemMultPart = detail.itemMultiplied !== detail.multiplied ? `, item-mult ${toCurrency(detail.itemMultiplied)}` : "";
      const goldPart = detail.gold > 0 ? `, gold +${toCurrency(detail.gold)}` : "";
      const itemFlatPart = detail.itemFlat > 0 ? `, item +${toCurrency(detail.itemFlat)}` : "";
      const itemLabelPart = detail.itemLabels.length > 0 ? ` [${[...new Set(detail.itemLabels)].join(" · ")}]` : "";
      logHistory(
        `${player.name} payout ${toCurrency(amount)} (base ${toCurrency(detail.base)}${handMultPart}${allInPart}${itemMultPart}${goldPart}${itemFlatPart})${itemLabelPart}.`,
        "showdown"
      );

      const fxQueue = [];
      const handFactor = detail.base > 0 ? detail.handMultiplied / detail.base : 1;
      const allInFactor = detail.handMultiplied > 0 ? detail.multiplied / detail.handMultiplied : 1;
      const itemFactor = detail.multiplied > 0 ? detail.itemMultiplied / detail.multiplied : 1;
      const uniqueItemMultiplierIds = [...new Set(detail.itemMultiplierIds || [])];
      const uniqueItemFlatIds = [...new Set(detail.itemFlatIds || [])];
      if (handFactor > 1.001) {
        fxQueue.push({ type: "mult", label: `배수 x${formatMultiplier(handFactor)}` });
      }
      if (allInFactor > 1.001) {
        fxQueue.push({ type: "allin", label: `올인 x${formatMultiplier(allInFactor)}`, itemId: "allin_multiplier" });
      }
      if (itemFactor > 1.001) {
        fxQueue.push({
          type: "mult",
          label: `아이템 x${formatMultiplier(itemFactor)}`,
          itemId: uniqueItemMultiplierIds[0] || "",
          extraItemIds: uniqueItemMultiplierIds.slice(1)
        });
      }
      if (detail.gold > 0) {
        fxQueue.push({ type: "gold", label: `골드 +${toCurrency(detail.gold)}` });
      }
      if (detail.itemFlat > 0) {
        fxQueue.push({
          type: "bounty",
          label: `아이템 +${toCurrency(detail.itemFlat)}`,
          itemId: uniqueItemFlatIds[0] || "",
          extraItemIds: uniqueItemFlatIds.slice(1)
        });
      }
      fxQueue.forEach((fx, fxIndex) => {
        window.setTimeout(() => {
          triggerItemProcEffect(index, fx.type, fx.label, fx.itemId || "");
          if (Array.isArray(fx.extraItemIds) && fx.extraItemIds.length > 0) {
            fx.extraItemIds.forEach((itemId) => {
              trackItemProc(itemId);
            });
          }
        }, fxIndex * 220);
      });
    });

    state.handOver = true;

    if (primaryWinners.length === 1) {
      setStatus(
        `${primaryWinners[0].name} wins with ${primaryName}.`,
        `Board: ${state.communityCards.map(cardText).join(" ")}`
      );
    } else if (primaryWinners.length > 1) {
      setStatus(
        `Split pot (${primaryWinners.length} players) with ${primaryName}.`,
        `Winners: ${primaryWinners.map((w) => w.name).join(", ")}`
      );
    } else {
      setStatus("Hand complete.", `Board: ${state.communityCards.map(cardText).join(" ")}`);
    }

    state.pot = 0;
    if (primaryWinners.length > 0) {
      logHistory(`Hand complete on ${state.stage.toUpperCase()}.`, "showdown");
    }
    if (primaryWinners.some((winner) => winner.isHuman)) {
      playSfx("win");
    }
    finalizeHand();
    render();
  }

  function finalizeHand() {
    stopTurnTimer();
    setPeek(false);
    state.animatingDeal = false;
    state.roundTransitioning = false;
    state.autoRunoutInProgress = false;
    state.replayInProgress = false;
    state.replayEntryId = null;
    state.communityVisible = state.communityCards.length;
    state.dealtHoleCounts = state.players.map((player) => player.hand.length);
    state.lastHandLog = state.currentHandLog.slice();
    setDealerThrowing(false);
    clearDealLayer();
    maybeLogBalanceSummary();

    if (isHeroBusted()) {
      if (el.replayBtn) {
        el.replayBtn.disabled = state.lastHandLog.length === 0;
      }
      triggerGameOver();
      render();
      return;
    }

    queueTournamentAdvanceIfCleared();
    if (beginPostHandEconomyFlow()) {
      if (el.nextHandBtn) {
        el.nextHandBtn.disabled = true;
      }
      if (el.replayBtn) {
        el.replayBtn.disabled = true;
      }
      return;
    }

    el.nextHandBtn.disabled = false;
    if (el.replayBtn) {
      el.replayBtn.disabled = state.lastHandLog.length === 0;
    }
    scheduleAutoNextHand();
  }

  async function replayLastHand() {
    if (state.replayInProgress || state.lastHandLog.length === 0) return;
    if (!state.handOver) {
      setStatus("Replay is available after the hand ends.", "Finish this hand first.");
      return;
    }

    clearAutoNextHand();
    state.replayInProgress = true;
    state.replayEntryId = null;
    render();

    const entries = state.lastHandLog.slice(-Math.min(28, state.lastHandLog.length));
    setStatus("Replay started.", "Hand timeline is playing.");

    try {
      for (const entry of entries) {
        state.replayEntryId = entry.id;
        setStatus("Replay", entry.text);
        render();
        await sleep(620);
      }
      setStatus(
        "Replay complete.",
        `Auto-advance in ${Math.round(NEXT_HAND_IDLE_TIMEOUT_MS / 1000)}s or press Next Hand.`
      );
    } finally {
      state.replayInProgress = false;
      state.replayEntryId = null;
      render();
      scheduleAutoNextHand();
    }
  }

  function evaluateSevenNoJoker(cards) {
    const ranks = cards.map((c) => c.rank);
    const rankCount = new Map();
    const suitBuckets = new Map();

    cards.forEach((card) => {
      rankCount.set(card.rank, (rankCount.get(card.rank) || 0) + 1);
      if (!suitBuckets.has(card.suit)) suitBuckets.set(card.suit, []);
      suitBuckets.get(card.suit).push(card.rank);
    });

    const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);

    let flushSuit = null;
    let flushRanks = [];
    for (const [suit, suitRanks] of suitBuckets.entries()) {
      if (suitRanks.length >= 5) {
        const sorted = suitRanks.slice().sort((a, b) => b - a);
        if (!flushSuit || compareHighCardArrays(sorted, flushRanks) > 0) {
          flushSuit = suit;
          flushRanks = sorted;
        }
      }
    }

    if (flushSuit) {
      const straightFlushHigh = findStraightHigh(flushRanks);
      if (straightFlushHigh !== null) {
        return {
          rank: 8,
          values: [straightFlushHigh],
          name: HAND_NAME[8]
        };
      }
    }

    const quads = [...rankCount.entries()]
      .filter(([, count]) => count === 4)
      .map(([rank]) => rank)
      .sort((a, b) => b - a);

    if (quads.length > 0) {
      const quad = quads[0];
      const kicker = uniqueRanks.find((r) => r !== quad) || 0;
      return {
        rank: 7,
        values: [quad, kicker],
        name: HAND_NAME[7]
      };
    }

    const trips = [...rankCount.entries()]
      .filter(([, count]) => count >= 3)
      .map(([rank]) => rank)
      .sort((a, b) => b - a);

    const pairs = [...rankCount.entries()]
      .filter(([, count]) => count >= 2)
      .map(([rank]) => rank)
      .sort((a, b) => b - a);

    if (trips.length > 0) {
      const topTrip = trips[0];
      const possiblePair = pairs.filter((rank) => rank !== topTrip);
      if (trips.length > 1) {
        possiblePair.unshift(trips[1]);
      }
      if (possiblePair.length > 0) {
        return {
          rank: 6,
          values: [topTrip, Math.max(...possiblePair)],
          name: HAND_NAME[6]
        };
      }
    }

    if (flushSuit) {
      return {
        rank: 5,
        values: flushRanks.slice(0, 5),
        name: HAND_NAME[5]
      };
    }

    const straightHigh = findStraightHigh(uniqueRanks);
    if (straightHigh !== null) {
      return {
        rank: 4,
        values: [straightHigh],
        name: HAND_NAME[4]
      };
    }

    if (trips.length > 0) {
      const trip = trips[0];
      const kickers = uniqueRanks.filter((rank) => rank !== trip).slice(0, 2);
      return {
        rank: 3,
        values: [trip, ...kickers],
        name: HAND_NAME[3]
      };
    }

    if (pairs.length >= 2) {
      const topPair = pairs[0];
      const secondPair = pairs[1];
      const kicker = uniqueRanks.find((rank) => rank !== topPair && rank !== secondPair) || 0;
      return {
        rank: 2,
        values: [topPair, secondPair, kicker],
        name: HAND_NAME[2]
      };
    }

    if (pairs.length === 1) {
      const pair = pairs[0];
      const kickers = uniqueRanks.filter((rank) => rank !== pair).slice(0, 3);
      return {
        rank: 1,
        values: [pair, ...kickers],
        name: HAND_NAME[1]
      };
    }

    return {
      rank: 0,
      values: uniqueRanks.slice(0, 5),
      name: HAND_NAME[0]
    };
  }

  function evaluateSeven(cards) {
    const usableCards = (cards || []).filter(Boolean);
    const nonJokers = usableCards.filter((card) => !card.isJoker);
    const jokerCount = usableCards.length - nonJokers.length;

    if (jokerCount <= 0) {
      return evaluateSevenNoJoker(nonJokers);
    }

    const cappedJokers = Math.min(2, jokerCount);
    let bestResult = null;

    const search = (depth, replacementCards) => {
      if (depth >= cappedJokers) {
        const result = evaluateSevenNoJoker([...nonJokers, ...replacementCards]);
        if (!bestResult || compareEval(result, bestResult) > 0) {
          bestResult = result;
        }
        return;
      }

      for (const suit of SUITS) {
        for (const rank of RANKS) {
          replacementCards.push({ rank, suit, fromJoker: true });
          search(depth + 1, replacementCards);
          replacementCards.pop();
        }
      }
    };

    search(0, []);
    return bestResult || evaluateSevenNoJoker(nonJokers);
  }

  function findStraightHigh(rankList) {
    const set = new Set(rankList);
    if (set.has(14)) {
      set.add(1);
    }

    for (let high = 14; high >= 5; high -= 1) {
      let ok = true;
      for (let offset = 0; offset < 5; offset += 1) {
        if (!set.has(high - offset)) {
          ok = false;
          break;
        }
      }
      if (ok) return high;
    }

    return null;
  }

  function compareHighCardArrays(a, b) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      const av = a[i] || 0;
      const bv = b[i] || 0;
      if (av !== bv) return av - bv;
    }
    return 0;
  }

  function compareEval(a, b) {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const len = Math.max(a.values.length, b.values.length);
    for (let i = 0; i < len; i += 1) {
      const av = a.values[i] || 0;
      const bv = b.values[i] || 0;
      if (av !== bv) return av - bv;
    }
    return 0;
  }

  function estimateStrength(player) {
    if (state.stage === "preflop") {
      const [a, b] = player.hand;
      if (!a || !b) return 0.3;

      let score = 0.15;
      const high = Math.max(a.rank, b.rank);
      const low = Math.min(a.rank, b.rank);
      const pair = a.rank === b.rank;
      const suited = a.suit === b.suit;
      const gap = high - low;

      score += (high - 2) / 16 * 0.34;
      if (pair) score += 0.33;
      if (suited) score += 0.08;
      if (gap <= 2) score += 0.08;
      if (high >= 11 && low >= 10) score += 0.12;

      return clamp(score, 0.08, 0.97);
    }

    const evalResult = evaluateSeven([...player.hand, ...state.communityCards]);
    const baseByRank = {
      8: 0.99,
      7: 0.96,
      6: 0.92,
      5: 0.84,
      4: 0.78,
      3: 0.68,
      2: 0.58,
      1: 0.46,
      0: 0.26
    };

    let score = baseByRank[evalResult.rank] ?? 0.3;
    const topKicker = evalResult.values[0] || 8;
    score += (topKicker / 14) * 0.08;

    if (state.stage !== "river") {
      const flushDraw = hasFlushDraw([...player.hand, ...state.communityCards]);
      const straightDraw = hasStraightDraw([...player.hand, ...state.communityCards]);
      if (flushDraw) score += 0.07;
      if (straightDraw) score += 0.05;
    }

    return clamp(score, 0.06, 0.995);
  }

  function hasFlushDraw(cards) {
    const count = new Map();
    cards.forEach((card) => {
      count.set(card.suit, (count.get(card.suit) || 0) + 1);
    });
    return [...count.values()].some((v) => v === 4);
  }

  function hasStraightDraw(cards) {
    const ranks = [...new Set(cards.map((card) => card.rank))];
    const set = new Set(ranks);
    if (set.has(14)) set.add(1);

    let bestRun = 1;
    for (let high = 14; high >= 1; high -= 1) {
      let run = 0;
      for (let r = high; r >= 1; r -= 1) {
        if (set.has(r)) {
          run += 1;
          bestRun = Math.max(bestRun, run);
        } else {
          break;
        }
      }
    }

    return bestRun >= 4;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function render() {
    setSoundToggleUi();
    setPerformanceToggleUi();
    renderMetaLobby();
    renderMultiplayerPanel();
    if (el.startGameBtn) {
      el.startGameBtn.disabled = multiplayerEnabled() ? !isMultiplayerHost() : false;
    }
    if (el.stageInfo) {
      const stageProfile = currentStageProfile();
      const pending = state.pendingStageAdvance ? " · CLEAR" : "";
      el.stageInfo.textContent = `Stage ${state.tournamentStage + 1} · ${stageProfile.name}${pending}`;
    }
    el.blindInfo.textContent = `Blinds ${state.smallBlind} / ${state.bigBlind}`;
    if (el.blindLevel) {
      el.blindLevel.textContent = `Level ${state.blindLevel + 1} · Hand ${state.handId}`;
    }
    if (state.smallBlindIndex >= 0 && state.bigBlindIndex >= 0) {
      const sb = state.players[state.smallBlindIndex];
      const bb = state.players[state.bigBlindIndex];
      el.blindPositions.textContent = `SB ${sb.name} ${toCurrency(state.smallBlind)} / BB ${bb.name} ${toCurrency(state.bigBlind)}`;
    } else {
      el.blindPositions.textContent = "SB -- / BB --";
    }

    el.potAmount.textContent = toCurrency(state.pot);
    el.tableScene.classList.toggle("peeking", state.holePeek);

    renderCommunityCards();
    renderBoardMini();
    renderCornerCardsHud();
    renderInHandReadout();
    renderSeats();
    renderItemOverlays();
    renderShowdownPanel();
    renderLootModal();
    renderShopModal();
    renderControls();
    sync3DTableState();
    sync3DTurnTimer();
    setGameOverVisibility(state.gameOver);

    const canControlFlow = hasAuthoritativeControl() || (multiplayerEnabled() && isMultiplayerHost());
    el.nextHandBtn.disabled = !canControlFlow || state.gameOver || !state.handOver || state.replayInProgress || isEconomyModalOpen();
    if (el.replayBtn) {
      el.replayBtn.disabled =
        !canControlFlow ||
        multiplayerEnabled() ||
        state.gameOver ||
        !state.handOver ||
        state.replayInProgress ||
        isEconomyModalOpen() ||
        state.lastHandLog.length === 0;
    }
    if (el.autoTuneBtn) {
      const pendingCount = getPendingAutoTuneEntries(4).length;
      el.autoTuneBtn.textContent = pendingCount > 0 ? `Auto Tune ${pendingCount}` : "Auto Tune";
      el.autoTuneBtn.disabled =
        !canControlFlow ||
        multiplayerEnabled() ||
        state.gameOver ||
        !state.handOver ||
        state.replayInProgress ||
        isEconomyModalOpen() ||
        pendingCount <= 0;
    }
    queueMultiplayerSnapshot();
  }

  function renderShowdownPanel() {
    if (!el.showdownPanel) return;
    if (!state.handOver) {
      el.showdownPanel.classList.remove("show");
      el.showdownPanel.innerHTML = "";
      return;
    }

    const order = [0, 1, 3, 2].filter((index) => index < state.players.length);
    const rows = order
      .map((index) => {
        const player = state.players[index];
        if (!player) return "";

        const winner = /\bWon\b/i.test(player.lastAction);
        const rowClass = winner ? "showdown-row winner" : "showdown-row";
        const canReveal = !player.folded || !!player.showdown;
        const cardsHtml = canReveal
          ? player.hand
              .slice(0, 2)
              .map((card) => {
                const red = card.suit === "H" || card.suit === "D" ? " red" : "";
                const joker = isJokerCard(card) ? " joker" : "";
                return `<span class="showdown-card-tile${red}${joker}">${escapeHtml(cardText(card))}</span>`;
              })
              .join("")
          : `<span class="showdown-mucked">MUCKED</span>`;
        const handName = canReveal && player.showdown ? player.showdown.name : player.folded ? "Folded" : "No Show";
        const playerName = escapeHtml(playerDisplayName(player, index));
        const safeHandName = escapeHtml(handName);
        return `<div class="${rowClass}"><div class="showdown-player"><span>${playerName}</span><span class="showdown-hand-name">${safeHandName}</span></div><div class="showdown-cards">${cardsHtml}</div></div>`;
      })
      .filter(Boolean)
      .join("");

    if (!rows) {
      el.showdownPanel.classList.remove("show");
      el.showdownPanel.innerHTML = "";
      return;
    }

    el.showdownPanel.classList.add("show");
    el.showdownPanel.innerHTML = `<div class="showdown-head"><span>Showdown Cards</span><span>Hand #${state.handId}</span></div><div class="showdown-list">${rows}</div>`;
  }

  function renderLootModal() {
    if (!el.lootModal) return;
    const loot = state.currentLoot;
    if (!loot) {
      el.lootModal.classList.add("hidden");
      return;
    }

    const item = ITEM_DB[loot.itemId];
    const hero = humanPlayer();
    const hasDuplicate = !!(hero && item && hasItem(hero, item.id));
    const slotCount = itemSlotCount(hero);
    const usedSlots = normalizePlayerItemEntries(hero).length;
    const replaceOnEquip = slotCount > 0 && usedSlots >= slotCount;
    const canResolveLoot = multiplayerEnabled() ? state.multiplayer.connected : hasAuthoritativeControl();

    if (el.lootTitle) {
      el.lootTitle.textContent = item ? `Loot: ${item.name}` : "Loot Found";
    }
    if (el.lootSub) {
      const base = loot.sourceName ? `${loot.sourceName} went bust.` : "Opponent busted.";
      el.lootSub.textContent = `${base} Choose equip or sell.`;
    }
    if (el.lootItemIcon) {
      if (item) {
        el.lootItemIcon.innerHTML = itemArtMarkup(item, "loot");
      } else {
        el.lootItemIcon.textContent = "?";
      }
    }
    if (el.lootItemName) {
      el.lootItemName.textContent = item ? item.name : "Unknown Relic";
    }
    if (el.lootItemDesc) {
      el.lootItemDesc.textContent = item ? item.desc : "Relic data unavailable.";
    }
    if (el.lootItemEffect) {
      el.lootItemEffect.textContent = item ? item.effect_logic : "";
    }
    if (el.lootEquipBtn) {
      if (hasDuplicate) {
        el.lootEquipBtn.textContent = "Already Owned";
        el.lootEquipBtn.disabled = true;
      } else if (slotCount <= 0) {
        el.lootEquipBtn.textContent = "No Slot";
        el.lootEquipBtn.disabled = true;
      } else if (replaceOnEquip) {
        el.lootEquipBtn.textContent = "Equip (Replace)";
        el.lootEquipBtn.disabled = !canResolveLoot;
      } else {
        el.lootEquipBtn.textContent = "Equip";
        el.lootEquipBtn.disabled = !canResolveLoot;
      }
    }
    if (el.lootSellBtn) {
      el.lootSellBtn.textContent = `Sell +${toCurrency(Math.max(0, Number(loot.sellValue) || 0))}`;
      el.lootSellBtn.disabled = !canResolveLoot;
    }

    el.lootModal.classList.remove("hidden");
  }

  function renderShopModal() {
    if (!el.shopModal) return;
    if (!state.shopVisible) {
      el.shopModal.classList.add("hidden");
      return;
    }

    const hero = humanPlayer();
    const chips = hero ? hero.chips : 0;
    const cost = shopRerollCost();
    const profile = currentStageProfile();
    if (el.shopMeta) {
      el.shopMeta.textContent =
        `칩 ${toCurrency(chips)} · 스테이지 ${state.tournamentStage + 1} ${profile.name} · ` +
        `리롤 ${toCurrency(cost)} (${state.shopRerollsLeft}회 남음)`;
    }

    if (el.shopOffers) {
      const offersHtml = state.shopOffers
        .map((offer) => {
          const item = ITEM_DB[offer.id];
          if (!item) return "";
          const rarity = String(item.rarity || "normal").toLowerCase();
          const owned = !!(hero && hasItem(hero, item.id));
          const canAfford = chips >= offer.price;
          const disabled = (multiplayerEnabled() ? !state.multiplayer.connected : !hasAuthoritativeControl()) || owned || !canAfford;
          const buttonLabel = owned ? "보유중" : canAfford ? "구매" : "칩 부족";

          return (
            `<article class="shop-offer">` +
            `<div class="shop-offer-grid">` +
            `<div class="shop-offer-art-wrap">` +
              itemArtMarkup(item, "shop") +
            `</div>` +
            `<div class="shop-offer-body">` +
              `<div class="shop-offer-head">` +
                `<span class="shop-offer-name">${escapeHtml(item.name)}</span>` +
                `<span class="shop-offer-rarity ${escapeHtml(rarity)}">${escapeHtml(String(item.rarity || "normal").toUpperCase())}</span>` +
              `</div>` +
              `<div class="shop-offer-desc">${escapeHtml(item.desc)}</div>` +
              `<div class="shop-offer-effect">${escapeHtml(item.effect_logic)}</div>` +
              `<div class="shop-offer-footer">` +
                `<span class="shop-offer-price">${toCurrency(offer.price)}</span>` +
                `<button class="shop-buy-btn" type="button" data-buy-item="${escapeHtml(item.id)}" ${disabled ? "disabled" : ""}>${buttonLabel}</button>` +
              `</div>` +
            `</div>` +
            `</div>` +
            `</article>`
          );
        })
        .filter(Boolean)
        .join("");

      el.shopOffers.innerHTML = offersHtml || `<article class="shop-offer"><div class="shop-offer-desc">판매 가능한 아이템이 없습니다. 계속 진행하세요.</div></article>`;
    }

    if (el.shopRerollBtn) {
      const canReroll = state.shopRerollsLeft > 0 && chips >= cost;
      const canControl = multiplayerEnabled() ? state.multiplayer.connected : hasAuthoritativeControl();
      el.shopRerollBtn.disabled = !canControl || !canReroll;
      el.shopRerollBtn.textContent = `리롤 ${toCurrency(cost)} (${state.shopRerollsLeft})`;
    }
    if (el.shopCloseBtn) {
      const canControl = multiplayerEnabled() ? state.multiplayer.connected : hasAuthoritativeControl();
      el.shopCloseBtn.disabled = !canControl;
    }

    el.shopModal.classList.remove("hidden");
  }

  function renderCommunityCards() {
    el.communityCards.innerHTML = "";
    const visibleCards = state.communityCards.slice(0, state.communityVisible);
    visibleCards.forEach((card) => {
      el.communityCards.appendChild(makeCardNode(card, false));
    });
  }

  function renderBoardMini() {
    if (!el.boardMiniCards || !el.boardMiniLabel) return;

    const stageLabel = {
      idle: "BOARD",
      preflop: "BOARD PREFLOP",
      flop: "BOARD FLOP",
      turn: "BOARD TURN",
      river: "BOARD RIVER"
    };
    el.boardMiniLabel.textContent = stageLabel[state.stage] || "BOARD";

    const visibleCards = state.communityCards.slice(0, state.communityVisible);
    const hiddenCount = Math.max(0, 5 - visibleCards.length);

    const shown = visibleCards
      .map((card) => {
        const isRed = card.suit === "H" || card.suit === "D";
        const isJoker = isJokerCard(card);
        return `<span class="board-mini-card${isRed ? " red" : ""}${isJoker ? " joker" : ""}">${cardText(card)}</span>`;
      })
      .join("");

    const hidden = Array.from({ length: hiddenCount }, () => `<span class="board-mini-card back">★</span>`).join("");
    el.boardMiniCards.innerHTML = shown + hidden;
  }

  function makeCornerCardHtml(card, mode = "front") {
    if (mode === "empty") {
      return `<span class="corner-card empty">·</span>`;
    }

    if (mode === "back") {
      return `<span class="corner-card back">★</span>`;
    }

    if (!card) {
      return `<span class="corner-card empty">·</span>`;
    }

    const isRed = card.suit === "H" || card.suit === "D";
    const joker = isJokerCard(card) ? " joker" : "";
    return `<span class="corner-card${isRed ? " red" : ""}${joker}">${cardText(card)}</span>`;
  }

  function renderCornerCardsHud() {
    if (!el.cornerCardsHud || !el.cornerHeroCards || !el.cornerBoardCards) return;

    const seatIndex = localControlledSeatIndex();
    const localPlayer = seatIndex >= 0 ? state.players[seatIndex] : null;
    if (!localPlayer) {
      el.cornerCardsHud.style.display = "none";
      return;
    }

    el.cornerCardsHud.style.display = "";

    const dealt = seatIndex >= 0 ? state.dealtHoleCounts[seatIndex] || 0 : 0;
    const revealLocal = !localPlayer.folded && dealt > 0 && (state.holePeek || state.handOver || !!localPlayer.showdown);
    const heroCards = [];
    for (let i = 0; i < 2; i += 1) {
      const card = localPlayer.hand[i];
      if (!card || dealt <= i) {
        heroCards.push(makeCornerCardHtml(null, state.handOver ? "empty" : "back"));
        continue;
      }
      heroCards.push(makeCornerCardHtml(card, revealLocal ? "front" : "back"));
    }
    el.cornerHeroCards.innerHTML = heroCards.join("");

    const visibleBoard = state.communityCards.slice(0, state.communityVisible);
    const boardCards = visibleBoard.map((card) => makeCornerCardHtml(card, "front"));
    const hiddenCount = Math.max(0, 5 - visibleBoard.length);
    for (let i = 0; i < hiddenCount; i += 1) {
      boardCards.push(makeCornerCardHtml(null, "empty"));
    }
    el.cornerBoardCards.innerHTML = boardCards.join("");
  }

  function readoutStateForPlayer(player, index) {
    if (player.chips <= 0 && player.folded) return { label: "OUT", tone: "fold" };
    if (!state.handOver && index === state.activePlayerIndex) return { label: "TURN", tone: "turn" };
    if (!state.handOver && player.allIn && !player.folded) return { label: "ALL-IN", tone: "allin" };
    if (player.folded) return { label: "FOLD", tone: "fold" };
    if (state.handOver) {
      return /\bWon\b/i.test(player.lastAction || "") ? { label: "WIN", tone: "inpot" } : { label: "DONE", tone: "call" };
    }
    if (state.currentBet > 0 && player.currentBet === state.currentBet && player.currentBet > 0) return { label: "CALL", tone: "call" };
    if (player.currentBet > 0) return { label: "BET", tone: "call" };
    return { label: "IN", tone: "inpot" };
  }

  function renderInHandReadout() {
    if (!el.inHandReadout || !el.inHandList) return;

    const inHandCount = state.players.filter((player) => !player.folded).length;
    if (el.inHandTitle) {
      el.inHandTitle.textContent = `IN HAND ${inHandCount}`;
    }
    if (el.inHandMeta) {
      if (state.pendingStageAdvance) {
        el.inHandMeta.textContent = "NEXT STAGE";
      } else if (state.handOver) {
        el.inHandMeta.textContent = "HAND OVER";
      } else if (state.stage === "idle") {
        el.inHandMeta.textContent = "READY";
      } else {
        el.inHandMeta.textContent = state.stage.toUpperCase();
      }
    }

    const rows = state.players
      .map((player, index) => {
        const info = readoutStateForPlayer(player, index);
        const rowClasses = ["hand-readout-row"];
        if (!state.handOver && index === state.activePlayerIndex) rowClasses.push("active");
        if (player.folded) rowClasses.push("folded");
        if (!state.handOver && player.allIn && !player.folded) rowClasses.push("allin");
        if (canLocalControlSeat(index)) rowClasses.push("hero");

        const playerName = escapeHtml(playerDisplayName(player, index));
        return `<div class="${rowClasses.join(" ")}"><span class="name">${playerName}</span><span class="chips">${toCurrency(player.chips)}</span><span class="bet">${toCurrency(player.currentBet)}</span><span class="state"><span class="state-pill ${info.tone}">${info.label}</span></span></div>`;
      })
      .join("");

    el.inHandList.innerHTML = rows;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      if (char === "&") return "&amp;";
      if (char === "<") return "&lt;";
      if (char === ">") return "&gt;";
      if (char === '"') return "&quot;";
      return "&#39;";
    });
  }

  function normalizePlayerItems(player) {
    if (!player || !Array.isArray(player.items)) return [];
    return player.items
      .map((entry) => {
        const id = typeof entry === "string" ? entry : entry && entry.id;
        if (!id || !ITEM_DB[id]) return null;
        return ITEM_DB[id];
      })
      .filter(Boolean);
  }

  function itemThemeClass(item) {
    const id = String(item && item.id ? item.id : "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-");
    return id ? `item-${id}` : "item-generic";
  }

  function itemSymbol(item) {
    if (!item) return "?";
    if (typeof item.symbol === "string" && item.symbol) return item.symbol;
    if (typeof item.icon === "string" && item.icon) return item.icon;
    return "?";
  }

  function itemArtMarkup(item, variant = "slot") {
    if (!item) return "";
    const themeClass = escapeHtml(itemThemeClass(item));
    const symbol = escapeHtml(itemSymbol(item));
    const rarity = escapeHtml(String(item.rarity || "normal").toLowerCase());
    const variantClass = escapeHtml(`variant-${variant}`);
    return (
      `<span class="item-art ${themeClass} ${variantClass} rarity-${rarity}" aria-hidden="true">` +
        `<span class="item-art-glare"></span>` +
        `<span class="item-art-symbol">${symbol}</span>` +
      `</span>`
    );
  }

  function humanActionWindowOpen() {
    const heroIndex = localControlledSeatIndex();
    return (
      heroIndex >= 0 &&
      !state.gameOver &&
      !state.handOver &&
      !state.actionLock &&
      !state.animatingDeal &&
      !state.roundTransitioning &&
      !state.replayInProgress &&
      !isEconomyModalOpen() &&
      state.waitingForHuman &&
      state.activePlayerIndex === heroIndex
    );
  }

  function markedLensHandsRemaining() {
    if (state.handId <= 0) return 0;
    const mod = state.handId % 3;
    return mod === 0 ? 0 : 3 - mod;
  }

  function describeHumanItemUseState(player, itemId) {
    const base = {
      clickable: isClickableUseItemId(itemId),
      canUse: false,
      status: "패시브 · 자동 적용"
    };
    if (!base.clickable) return base;
    if (!humanActionWindowOpen()) {
      return { clickable: true, canUse: false, status: "내 턴에만 사용 가능" };
    }

    if (itemId === "sleight_of_hand") {
      if (state.stage !== "preflop") return { clickable: true, canUse: false, status: "프리플랍에서만 사용 가능" };
      if (player.folded || player.allIn) return { clickable: true, canUse: false, status: "현재 상태에서 사용 불가" };
      const playerIndex = state.players.indexOf(player);
      const dealt = playerIndex >= 0 ? state.dealtHoleCounts[playerIndex] || 0 : 0;
      if (dealt < 2 || player.hand.length < 2) return { clickable: true, canUse: false, status: "홀카드 2장 배분 후 사용 가능" };
      return { clickable: true, canUse: true, status: "사용 가능 · 클릭 시 소모" };
    }

    if (itemId === "marked_lenses") {
      if (state.handOver || state.stage === "idle") return { clickable: true, canUse: false, status: "핸드 진행 중에만 사용 가능" };
      if (state.markedLensUsedThisHand) return { clickable: true, canUse: false, status: "이번 핸드에서 이미 사용" };
      const remain = markedLensHandsRemaining();
      if (remain > 0) return { clickable: true, canUse: false, status: `${remain}핸드 후 사용 가능` };
      const playerIndex = state.players.indexOf(player);
      if (playerIndex < 0 || markedLensTargets(playerIndex).length <= 0) {
        return { clickable: true, canUse: false, status: "공개할 대상 없음" };
      }
      return { clickable: true, canUse: true, status: "사용 가능 · 클릭 시 소모" };
    }

    if (itemId === "river_foresight") {
      if (state.handOver || state.stage === "idle") return { clickable: true, canUse: false, status: "핸드 진행 중에만 사용 가능" };
      if (state.roundTransitioning || state.animatingDeal) return { clickable: true, canUse: false, status: "카드 연출 중 대기" };
      if (player.riverForesightUsedThisHand) return { clickable: true, canUse: false, status: "이번 핸드에서 이미 사용" };
      if (player.folded || player.allIn) return { clickable: true, canUse: false, status: "현재 상태에서 사용 불가" };
      if (!nextCommunityStreetFromStage(state.stage)) return { clickable: true, canUse: false, status: "이 스트리트에서는 사용 불가" };
      return { clickable: true, canUse: true, status: "사용 가능 · 클릭 시 소모" };
    }

    return base;
  }

  function tryUseHumanItemById(itemId) {
    const hero = humanPlayer();
    if (!hero || !itemId || !hasItem(hero, itemId)) return false;
    if (!isClickableUseItemId(itemId)) {
      setStatus("패시브 아이템.", "해당 아이템은 클릭 사용이 아닌 자동 적용입니다.");
      return false;
    }

    const stateInfo = describeHumanItemUseState(hero, itemId);
    if (!stateInfo.canUse) {
      setStatus("아이템 사용 불가.", stateInfo.status);
      return false;
    }

    if (itemId === "sleight_of_hand") return useSleightOfHand(hero);
    if (itemId === "marked_lenses") return useMarkedLenses(hero);
    if (itemId === "river_foresight") return useRiverForesight(hero);
    return false;
  }

  function trySellHumanItemById(itemId) {
    const hero = humanPlayer();
    if (!hero || !itemId || !hasItem(hero, itemId)) return false;
    return sellOwnedItem(hero, itemId);
  }

  function itemSlotsMarkup(player) {
    if (!player) return "";
    const slotCount = Math.max(0, Number(player.maxItemSlots) || 0);
    if (slotCount <= 0) return "";

    const items = normalizePlayerItems(player);
    const isHumanOwner = !!player.isHuman;
    const slots = [];
    for (let index = 0; index < slotCount; index += 1) {
      const item = items[index];
      if (!item) {
        slots.push('<span class="item-slot empty" aria-hidden="true"></span>');
        continue;
      }

      const rarity = escapeHtml(item.rarity || "normal");
      const name = escapeHtml(item.name || "Relic");
      const desc = escapeHtml(item.desc || "");
      const logic = escapeHtml(item.effect_logic || "");
      const itemId = escapeHtml(item.id || "");
      const sellValue = toCurrency(lootSellValue(item.id));
      const useState = isHumanOwner ? describeHumanItemUseState(player, item.id) : { clickable: false, canUse: false, status: "패시브" };
      const ownerType = isHumanOwner ? "hero" : "npc";
      const canUseClass = useState.canUse ? " can-use" : "";
      const interactiveClass = isHumanOwner ? " interactive" : "";
      const statusClass = useState.canUse ? "ready" : "cooldown";
      const modeText = useState.clickable ? (useState.canUse ? "클릭: 사용" : "클릭: 조건 미충족") : "패시브";

      slots.push(
        `<span class="item-slot filled rarity-${rarity}${interactiveClass}${canUseClass}" data-item-owner="${ownerType}" data-item-id="${itemId}" aria-label="${name}" title="${name}: ${logic}">` +
          itemArtMarkup(item, "slot") +
          `<span class="item-tooltip"><strong>${name}</strong><span>${desc}</span><em>${logic}</em><span class="item-tooltip-state ${statusClass}">${escapeHtml(useState.status)}</span>${isHumanOwner ? `<span class="item-tooltip-hint">${escapeHtml(modeText)} · Shift+클릭/우클릭: 판매 +${sellValue}</span>` : ""}</span>` +
          "</span>"
      );
    }

    return slots.join("");
  }

  function renderItemOverlays() {
    if (!el.itemOverlayLayer || !Array.isArray(el.itemOverlaySlots) || el.itemOverlaySlots.length === 0) return;
    const mode3D = el.tableScene.classList.contains("mode-3d");
    el.itemOverlayLayer.classList.toggle("show", mode3D);
    if (!mode3D) return;

    el.itemOverlaySlots.forEach((slotEl) => {
      const viewSeatIndex = Number(slotEl.dataset.overlaySeat);
      const seatIndex = Number.isInteger(viewSeatIndex) ? toGameSeatIndex(viewSeatIndex) : -1;
      const player = Number.isInteger(seatIndex) ? state.players[seatIndex] : null;
      if (!player) {
        slotEl.innerHTML = "";
        return;
      }
      slotEl.innerHTML = `<div class="item-slots compact">${itemSlotsMarkup(player)}</div>`;
      slotEl.classList.toggle("human", canLocalControlSeat(seatIndex));
      slotEl.classList.toggle("folded", !!player.folded);
      slotEl.classList.toggle("eliminated", player.chips <= 0 && state.handOver);
    });
  }

  function renderSeats() {
    const hidePeekHud = state.holePeek && !state.handOver;
    el.seats.forEach((seatEl, viewIndex) => {
      const i = toGameSeatIndex(viewIndex);
      const player = state.players[i];
      const inner = seatEl.querySelector(".seat-inner");
      const nameEl = seatEl.querySelector(".name");
      const blindBadgeEl = seatEl.querySelector(".blind-badge");
      const cardsEl = seatEl.querySelector(".cards");
      const chipsEl = seatEl.querySelector(".chips");
      const betEl = seatEl.querySelector(".bet");
      const actionEl = seatEl.querySelector(".action-tag");
      const itemSlotsEl = seatEl.querySelector(".item-slots");

      if (!player || !inner || !nameEl || !cardsEl || !chipsEl || !betEl || !actionEl || !blindBadgeEl) return;

      nameEl.textContent = playerDisplayName(player, i);
      chipsEl.textContent = `Chips ${toCurrency(player.chips)}`;
      betEl.textContent = player.currentBet > 0 ? `Bet ${toCurrency(player.currentBet)}` : "";

      let blindText = "";
      if (i === state.smallBlindIndex) blindText = `SB ${state.smallBlind}`;
      if (i === state.bigBlindIndex) blindText = `BB ${state.bigBlind}`;
      blindBadgeEl.textContent = blindText;
      blindBadgeEl.classList.toggle("show", !!blindText && !hidePeekHud);

      actionEl.textContent = hidePeekHud ? "" : player.lastAction || "";
      actionEl.className = "action-tag";
      if (!hidePeekHud && player.actionTone) {
        actionEl.classList.add(player.actionTone);
      }
      if (itemSlotsEl) {
        itemSlotsEl.innerHTML = itemSlotsMarkup(player);
        itemSlotsEl.classList.toggle("compact", !player.isHuman && !canLocalControlSeat(i));
      }

      cardsEl.innerHTML = "";
      cardsEl.classList.toggle(
        "peeking",
        canLocalControlSeat(i) && state.holePeek && !state.handOver && !player.folded
      );

      const isOwnSeat = canLocalControlSeat(i);
      const revealCards = isOwnSeat
        ? !player.folded && (state.holePeek || state.handOver || !!player.showdown)
        : state.handOver || !!player.showdown;
      const dealtCount = state.dealtHoleCounts[i] || 0;
      const visibleHoleCards = player.hand.slice(0, dealtCount);
      const lensRevealActive =
        !player.isHuman &&
        !!state.markedLensReveal &&
        state.markedLensReveal.handId === state.handId &&
        state.markedLensReveal.targetIndex === i;
      visibleHoleCards.forEach((card, cardIndex) => {
        const forceReveal = lensRevealActive && state.markedLensReveal && state.markedLensReveal.cardIndex === cardIndex;
        cardsEl.appendChild(makeCardNode(card, !(revealCards || forceReveal)));
      });

      seatEl.classList.toggle("active", !state.handOver && i === state.activePlayerIndex);
      seatEl.classList.toggle("dealer", i === state.dealerIndex);
      seatEl.classList.toggle("blind-sb", i === state.smallBlindIndex);
      seatEl.classList.toggle("blind-bb", i === state.bigBlindIndex);
      seatEl.classList.toggle("human", canLocalControlSeat(i));
      seatEl.classList.toggle("all-in", !state.handOver && player.allIn && !player.folded);
      seatEl.classList.toggle("folded", player.folded);
      seatEl.classList.toggle("eliminated", player.chips <= 0 && state.handOver);

      sync3DPlayerState(viewIndex, i, player, visibleHoleCards.length, revealCards, visibleHoleCards);
    });
  }

  function renderControls() {
    const localSeat = localControlledSeatIndex();
    const localPlayer = localSeat >= 0 ? state.players[localSeat] : null;
    if (!localPlayer) {
      el.foldBtn.disabled = true;
      el.checkCallBtn.disabled = true;
      el.raiseBtn.disabled = true;
      el.raiseRange.disabled = true;
      if (el.raiseInput) el.raiseInput.disabled = true;
      el.peekBtn.disabled = true;
      return;
    }

    const actionBlocked = state.gameOver || state.animatingDeal || state.roundTransitioning || state.replayInProgress || isEconomyModalOpen();
    const yourTurn =
      !state.handOver &&
      state.waitingForHuman &&
      !actionBlocked &&
      state.activePlayerIndex === localSeat &&
      canLocalControlSeat(localSeat);
    const dealt = state.dealtHoleCounts[localSeat] || 0;
    const canPeek = !state.handOver && !localPlayer.folded && localPlayer.hand.length === 2 && dealt >= 2 && !actionBlocked;

    if (!canPeek && state.holePeek) {
      setPeek(false);
    }

    el.foldBtn.disabled = !yourTurn;
    el.checkCallBtn.disabled = !yourTurn;
    el.peekBtn.disabled = !canPeek;
    el.peekBtn.classList.toggle("active", state.holePeek);

    if (!yourTurn) {
      el.raiseBtn.disabled = true;
      el.raiseRange.disabled = true;
      if (el.raiseInput) {
        el.raiseInput.disabled = true;
      }
      el.checkCallBtn.textContent = "Check";
      el.raiseBtn.textContent = state.currentBet === 0 ? "Bet To" : "Raise To";
      return;
    }

    el.raiseBtn.disabled = false;
    el.raiseRange.disabled = false;
    if (el.raiseInput) {
      el.raiseInput.disabled = false;
    }

    const toCall = Math.max(0, state.currentBet - localPlayer.currentBet);
    el.checkCallBtn.textContent = toCall > 0 ? `Call ${toCurrency(toCall)}` : "Check";

    const maxTotal = localPlayer.currentBet + localPlayer.chips;
    const strictMinTotal = state.currentBet === 0 ? state.bigBlind : state.currentBet + state.minRaise;
    const minTotal = Math.min(strictMinTotal, maxTotal);

    const canRaise = maxTotal > state.currentBet;

    if (!canRaise) {
      el.raiseBtn.disabled = true;
      el.raiseRange.disabled = true;
      if (el.raiseInput) {
        el.raiseInput.disabled = true;
        el.raiseInput.value = String(maxTotal);
      }
      el.raiseAmount.textContent = toCurrency(maxTotal);
      return;
    }

    el.raiseRange.min = String(minTotal);
    el.raiseRange.max = String(maxTotal);
    el.raiseRange.step = "1";
    if (el.raiseInput) {
      el.raiseInput.min = String(minTotal);
      el.raiseInput.max = String(maxTotal);
      el.raiseInput.step = "1";
    }

    const rangeValue = Number(el.raiseRange.value);
    const inputValue = el.raiseInput ? Number(el.raiseInput.value) : Number.NaN;
    let targetValue = Number.isFinite(inputValue) ? inputValue : rangeValue;
    if (!Number.isFinite(targetValue)) {
      targetValue = minTotal;
    }
    targetValue = clamp(Math.round(targetValue), minTotal, maxTotal);
    el.raiseRange.value = String(targetValue);
    if (el.raiseInput) {
      el.raiseInput.value = String(targetValue);
    }

    el.raiseAmount.textContent = toCurrency(targetValue);
    if (maxTotal < strictMinTotal) {
      el.raiseBtn.textContent = "All-in";
    } else {
      el.raiseBtn.textContent = state.currentBet === 0 ? "Bet To" : "Raise To";
    }
  }

  function makeCardNode(card, hidden) {
    const node = document.createElement("div");
    node.className = "card";

    if (hidden) {
      node.classList.add("back");
      node.textContent = "★";
      return node;
    }

    const red = card.suit === "H" || card.suit === "D";
    if (red) node.classList.add("red");
    if (isJokerCard(card)) node.classList.add("joker");
    node.textContent = cardText(card);
    return node;
  }

  function bindEvents() {
    el.nextHandBtn.addEventListener("click", () => {
      if (multiplayerEnabled()) {
        if (!isMultiplayerHost()) return;
        sendMultiplayerCommand("next_hand");
        return;
      }
      if (!hasAuthoritativeControl()) return;
      if (state.gameOver || isEconomyModalOpen()) return;
      clearAutoNextHand();
      el.nextHandBtn.disabled = true;
      startHand();
    });

    if (el.replayBtn) {
      el.replayBtn.addEventListener("click", () => {
        if (!hasAuthoritativeControl()) return;
        clearAutoNextHand();
        replayLastHand();
      });
    }

    if (el.skinSelect) {
      el.skinSelect.addEventListener("change", (event) => {
        applySkin(event.target.value);
      });
    }

    if (el.tutorialDismissBtn) {
      el.tutorialDismissBtn.addEventListener("click", () => {
        setTutorialVisibility(true);
      });
    }

    if (el.tutorialToggleBtn) {
      el.tutorialToggleBtn.addEventListener("click", () => {
        setTutorialVisibility(false);
      });
    }

    if (el.soundToggle) {
      el.soundToggle.addEventListener("click", () => {
        setAudioEnabled(!audio.enabled);
      });
    }

    if (el.performanceToggle) {
      el.performanceToggle.addEventListener("click", () => {
        applyPerformanceMode(state.performanceMode === "low" ? "high" : "low");
      });
    }

    if (el.autoTuneBtn) {
      el.autoTuneBtn.addEventListener("click", () => {
        if (!hasAuthoritativeControl()) return;
        if (el.autoTuneBtn.disabled) return;
        applyAutoBalanceTune(4);
      });
    }

    if (el.startGameBtn) {
      el.startGameBtn.addEventListener("click", () => {
        startGameFromHome();
      });
    }

    if (el.homeGuideBtn) {
      el.homeGuideBtn.addEventListener("click", () => {
        setHomeGuideVisible(!state.homeGuideVisible);
      });
    }

    if (el.homeGuideCloseBtn) {
      el.homeGuideCloseBtn.addEventListener("click", () => {
        setHomeGuideVisible(false);
      });
    }

    if (el.homeSoundBtn) {
      el.homeSoundBtn.addEventListener("click", () => {
        setAudioEnabled(!audio.enabled);
      });
    }

    if (el.upgradeBankrollBtn) {
      el.upgradeBankrollBtn.addEventListener("click", () => {
        if (!hasAuthoritativeControl()) return;
        tryBuyMetaUpgrade("bankroll");
      });
    }

    if (el.upgradeRerollBtn) {
      el.upgradeRerollBtn.addEventListener("click", () => {
        if (!hasAuthoritativeControl()) return;
        tryBuyMetaUpgrade("reroll");
      });
    }

    if (el.upgradeSlotsBtn) {
      el.upgradeSlotsBtn.addEventListener("click", () => {
        if (!hasAuthoritativeControl()) return;
        tryBuyMetaUpgrade("slots");
      });
    }

    if (el.restartRunBtn) {
      el.restartRunBtn.addEventListener("click", () => {
        if (multiplayerEnabled()) {
          if (!isMultiplayerHost()) return;
          sendMultiplayerCommand("restart_run");
          return;
        }
        if (!hasAuthoritativeControl()) return;
        restartRunFromGameOver();
      });
    }

    if (el.lootEquipBtn) {
      el.lootEquipBtn.addEventListener("click", () => {
        if (multiplayerEnabled()) {
          sendMultiplayerCommand("loot_equip");
          return;
        }
        if (!hasAuthoritativeControl()) return;
        resolveLootDecision("equip");
      });
    }

    if (el.lootSellBtn) {
      el.lootSellBtn.addEventListener("click", () => {
        if (multiplayerEnabled()) {
          sendMultiplayerCommand("loot_sell");
          return;
        }
        if (!hasAuthoritativeControl()) return;
        resolveLootDecision("sell");
      });
    }

    if (el.shopRerollBtn) {
      el.shopRerollBtn.addEventListener("click", () => {
        if (multiplayerEnabled()) {
          sendMultiplayerCommand("shop_reroll");
          return;
        }
        if (!hasAuthoritativeControl()) return;
        rerollShopOffers();
      });
    }

    if (el.shopCloseBtn) {
      el.shopCloseBtn.addEventListener("click", () => {
        if (multiplayerEnabled()) {
          sendMultiplayerCommand("shop_close");
          return;
        }
        if (!hasAuthoritativeControl()) return;
        closeShopModal();
      });
    }

    if (el.shopOffers) {
      el.shopOffers.addEventListener("click", (event) => {
        if (multiplayerEnabled()) {
          if (!state.multiplayer.connected) return;
        } else if (!hasAuthoritativeControl()) {
          return;
        }
        const target = event.target;
        if (!target || typeof target.closest !== "function") return;
        const button = target.closest("button[data-buy-item]");
        if (!button || button.disabled) return;
        const itemId = button.dataset.buyItem || "";
        if (multiplayerEnabled()) {
          sendMultiplayerCommand("shop_buy", { itemId });
          return;
        }
        buyShopOffer(itemId);
      });
    }

    if (el.mpCreateBtn) {
      el.mpCreateBtn.addEventListener("click", () => {
        connectMultiplayer("create");
      });
    }

    if (el.mpJoinBtn) {
      el.mpJoinBtn.addEventListener("click", () => {
        connectMultiplayer("join");
      });
    }

    if (el.mpQuickBtn) {
      el.mpQuickBtn.addEventListener("click", () => {
        void startQuickMatch();
      });
    }

    if (el.mpLeaveBtn) {
      el.mpLeaveBtn.addEventListener("click", () => {
        if (state.multiplayer.queueing) {
          void cancelQuickMatch();
          return;
        }
        leaveMultiplayerSession();
      });
    }

    if (el.mpNameInput) {
      el.mpNameInput.addEventListener("change", () => {
        state.multiplayer.displayName = normalizePlayerNameInput(el.mpNameInput.value);
        el.mpNameInput.value = state.multiplayer.displayName;
        saveMultiplayerSessionCache();
        renderMultiplayerPanel();
      });
      el.mpNameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          if (el.mpJoinBtn && !el.mpJoinBtn.disabled) {
            el.mpJoinBtn.click();
          }
        }
      });
    }

    if (el.mpRoomInput) {
      el.mpRoomInput.addEventListener("change", () => {
        state.multiplayer.roomCode = normalizeRoomCodeInput(el.mpRoomInput.value);
        el.mpRoomInput.value = state.multiplayer.roomCode;
        saveMultiplayerSessionCache();
        renderMultiplayerPanel();
      });
      el.mpRoomInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          if (el.mpJoinBtn && !el.mpJoinBtn.disabled) {
            el.mpJoinBtn.click();
          }
        }
      });
    }

    const primeAudio = () => {
      unlockAudio();
      applyMusicForUiContext({ restart: false });
    };
    window.addEventListener("pointerdown", primeAudio, { once: true, passive: true });
    window.addEventListener("keydown", primeAudio, { once: true });

    el.foldBtn.addEventListener("click", () => humanAction("fold"));
    el.checkCallBtn.addEventListener("click", () => humanAction("checkcall"));
    el.raiseBtn.addEventListener("click", () => {
      const fromInput = el.raiseInput ? Number(el.raiseInput.value) : Number.NaN;
      const fromRange = Number(el.raiseRange.value);
      const target = Number.isFinite(fromInput) ? fromInput : fromRange;
      humanAction("raise", Math.round(target));
    });

    el.raiseRange.addEventListener("input", () => {
      const value = Math.round(Number(el.raiseRange.value));
      if (el.raiseInput) {
        el.raiseInput.value = String(value);
      }
      el.raiseAmount.textContent = toCurrency(value);
    });

    if (el.raiseInput) {
      const syncRaiseInput = (snapToBounds = false) => {
        const min = Number(el.raiseRange.min) || 0;
        const max = Number(el.raiseRange.max) || min;
        let value = Number(el.raiseInput.value);
        if (!Number.isFinite(value)) value = min;
        value = Math.round(value);
        if (snapToBounds) {
          value = clamp(value, min, max);
        }
        el.raiseInput.value = String(value);
        el.raiseRange.value = String(clamp(value, min, max));
        el.raiseAmount.textContent = toCurrency(clamp(value, min, max));
      };

      el.raiseInput.addEventListener("input", () => {
        syncRaiseInput(false);
      });

      el.raiseInput.addEventListener("change", () => {
        syncRaiseInput(true);
      });

      el.raiseInput.addEventListener("blur", () => {
        syncRaiseInput(true);
      });
    }

    const startPeek = (event) => {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }
      if (el.peekBtn.disabled) return;
      setPeek(true);
      el.peekBtn.classList.add("active");
    };

    const endPeek = () => {
      setPeek(false);
      el.peekBtn.classList.remove("active");
    };

    el.peekBtn.addEventListener("mousedown", startPeek);
    el.peekBtn.addEventListener("mouseup", endPeek);
    el.peekBtn.addEventListener("mouseleave", endPeek);
    el.peekBtn.addEventListener("touchstart", startPeek, { passive: false });
    el.peekBtn.addEventListener("touchend", endPeek);
    el.peekBtn.addEventListener("touchcancel", endPeek);
    window.addEventListener("mouseup", endPeek);
    window.addEventListener("blur", endPeek);

    if (el.tableScene) {
      el.tableScene.addEventListener("click", (event) => {
        const target = event.target;
        if (!target || typeof target.closest !== "function") return;
        const slot = target.closest(".item-slot.filled[data-item-owner='hero']");
        if (!slot) return;
        const itemId = String(slot.dataset.itemId || "");
        if (!itemId) return;

        event.preventDefault();
        if (multiplayerEnabled()) {
          if (!state.multiplayer.connected) return;
          if (event.shiftKey) {
            sendMultiplayerCommand("sell_item", { itemId });
            return;
          }
          if (!isClickableUseItemId(itemId)) {
            setStatus("패시브 아이템.", "해당 아이템은 클릭 사용이 아닌 자동 적용입니다.");
            render();
            return;
          }
          sendMultiplayerCommand("use_item", { itemId });
          return;
        }
        if (!hasAuthoritativeControl()) return;
        if (event.shiftKey) {
          trySellHumanItemById(itemId);
          return;
        }
        tryUseHumanItemById(itemId);
      });

      el.tableScene.addEventListener("contextmenu", (event) => {
        const target = event.target;
        if (!target || typeof target.closest !== "function") return;
        const slot = target.closest(".item-slot.filled[data-item-owner='hero']");
        if (!slot) return;
        const itemId = String(slot.dataset.itemId || "");
        if (!itemId) return;

        event.preventDefault();
        if (multiplayerEnabled()) {
          if (!state.multiplayer.connected) return;
          sendMultiplayerCommand("sell_item", { itemId });
          return;
        }
        if (!hasAuthoritativeControl()) return;
        trySellHumanItemById(itemId);
      });
    }

    window.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "select" || tag === "textarea" || (target && target.isContentEditable)) return;

      const key = event.key.toLowerCase();
      if (state.homeVisible) {
        if (key === "escape" && state.homeGuideVisible) {
          event.preventDefault();
          setHomeGuideVisible(false);
          return;
        }
        if (key === "g" && el.homeGuideBtn) {
          event.preventDefault();
          el.homeGuideBtn.click();
          return;
        }
        if ((key === "enter" || key === " ") && el.startGameBtn && !state.homeGuideVisible && (tag === "body" || tag === "html" || tag === "")) {
          event.preventDefault();
          el.startGameBtn.click();
        }
        return;
      }
      if (key === "f" && !el.foldBtn.disabled) {
        event.preventDefault();
        el.foldBtn.click();
        return;
      }
      if (key === "c" && !el.checkCallBtn.disabled) {
        event.preventDefault();
        el.checkCallBtn.click();
        return;
      }
      if (key === "r" && !el.raiseBtn.disabled) {
        event.preventDefault();
        el.raiseBtn.click();
        return;
      }
      if (key === "n" && !el.nextHandBtn.disabled) {
        event.preventDefault();
        el.nextHandBtn.click();
        return;
      }
      if (key === "h" && el.replayBtn && !el.replayBtn.disabled) {
        event.preventDefault();
        el.replayBtn.click();
        return;
      }
      if (key === "p" && !event.repeat) {
        startPeek(event);
      }
    });

    window.addEventListener("keyup", (event) => {
      if (event.key.toLowerCase() === "p") {
        endPeek();
      }
    });

    window.addEventListener("beforeunload", () => {
      closeMultiplayerSocket();
    });
  }

  function bootstrap() {
    createPlayers();
    let mode3D = false;
    if (window.Poker3D && typeof window.Poker3D.init === "function") {
      // Make the viewport measurable before Three.js bootstraps to avoid a 1x1 renderer.
      el.tableScene.classList.add("mode-3d");
      mode3D = !!window.Poker3D.init({ containerId: "poker3dViewport" });
    }
    el.tableScene.classList.toggle("mode-3d", mode3D);
    if (mode3D) {
      window.requestAnimationFrame(() => {
        if (window.Poker3D && typeof window.Poker3D.resize === "function") {
          window.Poker3D.resize();
        }
        window.dispatchEvent(new Event("resize"));
      });
    }
    loadPreferences();
    loadMultiplayerSessionCache();
    initSeats();
    bindEvents();
    setHomeGuideVisible(false);
    setGameOverVisibility(false);
    setupHomeScreenArt();

    if (mode3D) {
      setStatus("Welcome.", "3D scene loaded. Press Start Game.");
    } else {
      setStatus("Welcome.", "WebGL fallback loaded. Press Start Game.");
    }
    render();

    el.nextHandBtn.disabled = true;
    setHomeVisibility(true);
    attemptMultiplayerAutoReconnect();
  }

  bootstrap();
})();
