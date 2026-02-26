const STARTING_CHIPS = 1500;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const TURN_TIME_MS = 30000;
const NPC_MIN_THINK_MS = 900;
const NPC_MAX_THINK_MS = 1800;
const BLIND_LEVELS = [
  { small: 10, big: 20 },
  { small: 15, big: 30 },
  { small: 25, big: 50 },
  { small: 40, big: 80 },
  { small: 60, big: 120 },
  { small: 100, big: 200 }
];
const HANDS_PER_LEVEL = 4;
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const SUITS = ["S", "H", "D", "C"];
const HAND_NAME = {
  8: "Straight Flush",
  7: "Four of a Kind",
  6: "Full House",
  5: "Flush",
  4: "Straight",
  3: "Three of a Kind",
  2: "Two Pair",
  1: "One Pair",
  0: "High Card"
};

const HOST_SEAT_INDEX = 2;
const REMOTE_SEAT_ORDER = [0, 1, 3];
const SESSION_TTL_MS = 2 * 60 * 1000;
const HISTORY_LIMIT = 220;
const HISTORY_MAX = 180;
const BASE_PLAYER_NAMES = ["Viper", "Rook", "You", "Jade"];
const MATCH_QUEUE_WAIT_TTL_MS = 75 * 1000;
const MATCH_QUEUE_MATCH_TTL_MS = 3 * 60 * 1000;
const REQUEST_RATE_WINDOW_MS = 5000;
const REQUEST_RATE_STATE_TTL_MS = 2 * 60 * 1000;
const WS_UPGRADE_LIMIT_PER_WINDOW = 40;
const QUEUE_REQUEST_LIMIT_PER_WINDOW = 60;
const MAX_WS_MESSAGE_CHARS = 4096;
const FEATURE_PHASE5_ECONOMY = true;
const SHOP_OFFER_COUNT = 3;
const SHOP_BASE_REROLL_COST = 120;
const SHOP_STAGE_REROLL_STEP = 35;
const SHOP_DEFAULT_REROLLS = 1;
const LOOT_SELL_MULTIPLIER = 0.68;
const LOOT_SELL_MIN = 60;
const HERO_STARTER_ITEMS = ["sleight_of_hand", "marked_lenses"];
const ITEM_RARITY_ORDER = ["normal", "rare", "epic", "legendary"];
const SUIT_SYMBOL = {
  S: "\u2660",
  H: "\u2665",
  D: "\u2666",
  C: "\u2663",
  J: "\ud83c\udccf"
};
const ITEM_DB = Object.freeze({
  suit_magnet: { id: "suit_magnet", name: "Suit Magnet", rarity: "normal", price: 170 },
  blind_refund: { id: "blind_refund", name: "Blind Refund", rarity: "normal", price: 190 },
  pair_hunter: { id: "pair_hunter", name: "Pair Hunter", rarity: "normal", price: 210 },
  suit_tailor: { id: "suit_tailor", name: "Suit Tailor", rarity: "normal", price: 205 },
  heavy_dice: { id: "heavy_dice", name: "Heavy Dice", rarity: "rare", price: 280 },
  turn_hunter: { id: "turn_hunter", name: "Turn Hunter", rarity: "rare", price: 330 },
  sleight_of_hand: { id: "sleight_of_hand", name: "Sleight of Hand", rarity: "rare", price: 300 },
  marked_lenses: { id: "marked_lenses", name: "Marked Lenses", rarity: "normal", price: 220 },
  royal_taste: { id: "royal_taste", name: "Royal Taste", rarity: "epic", price: 460 },
  underdog_emblem: { id: "underdog_emblem", name: "Underdog Emblem", rarity: "rare", price: 360 },
  river_surfer: { id: "river_surfer", name: "River Surfer", rarity: "rare", price: 320 },
  split_guard: { id: "split_guard", name: "Split Guard", rarity: "rare", price: 300 },
  allin_multiplier: { id: "allin_multiplier", name: "All-in Multiplier", rarity: "epic", price: 500 },
  triple_barrel: { id: "triple_barrel", name: "Triple Barrel", rarity: "epic", price: 520 },
  river_foresight: { id: "river_foresight", name: "River Foresight", rarity: "rare", price: 340 },
  insurance_contract: { id: "insurance_contract", name: "Insurance Contract", rarity: "rare", price: 360 },
  bounty_hunter: { id: "bounty_hunter", name: "Bounty Hunter", rarity: "rare", price: 330 }
});
const ITEM_IDS = Object.freeze(Object.keys(ITEM_DB));
const INSURANCE_REFUND_RATE = 0.35;
const INSURANCE_MIN_ALLIN_INVEST = 200;
const BOUNTY_CHIP_BONUS = 220;
const BLIND_REFUND_RATE = 0.2;
const RIVER_SURFER_BONUS = 140;
const SPLIT_GUARD_BONUS = 90;
const UNDERDOG_EMBLEM_MULTIPLIER = 1.25;
const TRIPLE_BARREL_STEP = 0.08;

const GAME_STATE_KEYS = [
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
  "economyOwnerSeatIndex",
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

const globalMetrics = {
  websocketUpgrades: 0,
  roomsCreated: 0,
  connectionsOpened: 0,
  connectionsClosed: 0,
  reconnects: 0,
  actionsReceived: 0,
  commandsReceived: 0,
  acksReceived: 0,
  snapshotsSent: 0,
  deltasSent: 0,
  rateLimited: 0,
  errorsSent: 0
};

const requestRateBuckets = new Map();

function deepClone(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function normalizeRoomCode(raw) {
  const code = String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  if (code.length < 4) return "";
  return code;
}

function normalizePlayerName(raw) {
  const name = String(raw || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  return name || "Player";
}

function normalizeOrigin(rawOrigin) {
  const origin = String(rawOrigin || "").trim();
  if (!origin) return "";
  try {
    return new URL(origin).origin;
  } catch (error) {
    return "";
  }
}

function parseAllowedOrigins(raw) {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);
}

function getRequestIp(request) {
  const cfIp = String(request.headers.get("CF-Connecting-IP") || "").trim();
  if (cfIp) return cfIp;
  const xff = String(request.headers.get("X-Forwarded-For") || "").trim();
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

function allowRequestRate(ip, scope, limit, windowMs = REQUEST_RATE_WINDOW_MS) {
  const now = Date.now();
  const safeIp = ip || "unknown";
  const key = `${scope}:${safeIp}`;
  const existing = requestRateBuckets.get(key);
  let bucket = existing;

  if (!bucket || now - safeInt(bucket.windowStart, 0) > windowMs) {
    bucket = { windowStart: now, countInWindow: 0, lastSeen: now };
  }

  bucket.countInWindow += 1;
  bucket.lastSeen = now;
  requestRateBuckets.set(key, bucket);

  if (requestRateBuckets.size > 5000) {
    for (const [bucketKey, value] of requestRateBuckets.entries()) {
      if (!value || now - safeInt(value.lastSeen, now) > REQUEST_RATE_STATE_TTL_MS) {
        requestRateBuckets.delete(bucketKey);
      }
    }
  }

  return bucket.countInWindow <= limit;
}

function isAllowedRequestOrigin(request, env) {
  const requestUrl = new URL(request.url);
  const originHeader = normalizeOrigin(request.headers.get("Origin"));
  if (!originHeader) {
    return true;
  }

  const configured = parseAllowedOrigins(env && env.ALLOWED_ORIGINS);
  if (configured.length > 0) {
    return configured.includes(originHeader);
  }

  return originHeader === requestUrl.origin;
}

function safeInt(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = Math.floor(Number(value));
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function toCurrency(value) {
  const safe = Math.max(0, Math.floor(Number(value) || 0));
  return safe.toLocaleString("en-US");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rankLabel(rank) {
  if (rank === 14) return "A";
  if (rank === 13) return "K";
  if (rank === 12) return "Q";
  if (rank === 11) return "J";
  if (rank === 0) return "\ud83c\udccf";
  return String(rank);
}

function cardText(card) {
  if (!card) return "--";
  if (card.isJoker || card.rank === 0 || card.suit === "J") return "\ud83c\udccf";
  const suit = SUIT_SYMBOL[card.suit] || card.suit || "?";
  return `${rankLabel(card.rank)}${suit}`;
}

function secureRandomUnit() {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] / 0x100000000;
}

function secureRandomIntInclusive(min, max) {
  const low = Math.floor(Math.min(min, max));
  const high = Math.floor(Math.max(min, max));
  const span = high - low + 1;
  if (span <= 1) return low;

  const maxUnbiased = Math.floor(0x100000000 / span) * span;
  const bytes = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(bytes);
    const value = bytes[0];
    if (value < maxUnbiased) {
      return low + (value % span);
    }
  }
}

function randomBetween(min, max) {
  return secureRandomIntInclusive(min, max);
}

function randomRoomCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let room = "";
  for (let i = 0; i < length; i += 1) {
    room += chars[secureRandomIntInclusive(0, chars.length - 1)];
  }
  return room;
}

function buildPatch(prevState, nextState) {
  const patch = {};
  GAME_STATE_KEYS.forEach((key) => {
    const prevValue = prevState ? prevState[key] : undefined;
    const nextValue = nextState[key];
    const changed = JSON.stringify(prevValue) !== JSON.stringify(nextValue);
    if (changed) {
      patch[key] = nextValue;
    }
  });
  return patch;
}

function sidePotOrderFromDealer(dealerIndex, winnerIndices, seatCount) {
  const set = new Set(winnerIndices);
  const ordered = [];
  for (let i = 1; i <= seatCount; i += 1) {
    const idx = (dealerIndex + i + seatCount) % seatCount;
    if (set.has(idx)) ordered.push(idx);
  }
  return ordered;
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

function findStraightHigh(rankList) {
  const set = new Set(rankList);
  if (set.has(14)) set.add(1);

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
      return { rank: 8, values: [straightFlushHigh], name: HAND_NAME[8] };
    }
  }

  const quads = [...rankCount.entries()]
    .filter(([, count]) => count === 4)
    .map(([rank]) => rank)
    .sort((a, b) => b - a);

  if (quads.length > 0) {
    const quad = quads[0];
    const kicker = uniqueRanks.find((r) => r !== quad) || 0;
    return { rank: 7, values: [quad, kicker], name: HAND_NAME[7] };
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
      return { rank: 6, values: [topTrip, Math.max(...possiblePair)], name: HAND_NAME[6] };
    }
  }

  if (flushSuit) {
    return { rank: 5, values: flushRanks.slice(0, 5), name: HAND_NAME[5] };
  }

  const straightHigh = findStraightHigh(uniqueRanks);
  if (straightHigh !== null) {
    return { rank: 4, values: [straightHigh], name: HAND_NAME[4] };
  }

  if (trips.length > 0) {
    const trip = trips[0];
    const kickers = uniqueRanks.filter((rank) => rank !== trip).slice(0, 2);
    return { rank: 3, values: [trip, ...kickers], name: HAND_NAME[3] };
  }

  if (pairs.length >= 2) {
    const topPair = pairs[0];
    const secondPair = pairs[1];
    const kicker = uniqueRanks.find((rank) => rank !== topPair && rank !== secondPair) || 0;
    return { rank: 2, values: [topPair, secondPair, kicker], name: HAND_NAME[2] };
  }

  if (pairs.length === 1) {
    const pair = pairs[0];
    const kickers = uniqueRanks.filter((rank) => rank !== pair).slice(0, 3);
    return { rank: 1, values: [pair, ...kickers], name: HAND_NAME[1] };
  }

  return { rank: 0, values: uniqueRanks.slice(0, 5), name: HAND_NAME[0] };
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

class HoldemEngine {
  constructor(room) {
    this.room = room;
    this.statusMain = "Welcome.";
    this.statusSub = "Host can start a multiplayer hand.";
    this.turnTimerId = null;
    this.turnCountdownId = null;
    this.botThinkId = null;
    this.state = {
      turnTimerRemainingMs: 0,
      turnTimerSeatIndex: -1
    };
    this.resetRun();
  }

  resetRun() {
    this.clearTimers();
    this.state = {
      players: BASE_PLAYER_NAMES.map((name, index) => this.makePlayer(name, index === HOST_SEAT_INDEX)),
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
      turnTimerRemainingMs: 0,
      turnTimerSeatIndex: -1,
      dealtHoleCounts: [0, 0, 0, 0],
      communityVisible: 0,
      currentHandLog: [],
      lastHandLog: [],
      historySeq: 0,
      gameOver: false,
      lootQueue: [],
      currentLoot: null,
      economySeatQueue: [],
      economyOwnerSeatIndex: -1,
      shopVisible: false,
      shopOffers: [],
      shopRerollsLeft: 0,
      shopBySeat: {},
      markedLensUsedThisHand: false,
      markedLensReveal: null,
      riverForesightReveal: null,
      handWinnerIndices: [],
      handBloodCoinAwarded: false,
      runBloodCoins: 0,
      lastSettledBloodCoins: 0
    };
    this.syncRosterFromRoom();
    this.seedEconomyLoadout();
    this.setStatus("Welcome.", "Host can start a multiplayer hand.");
  }

  makePlayer(name, isHuman) {
    return {
      name,
      isHuman,
      chips: STARTING_CHIPS,
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
      maxItemSlots: 4,
      botArchetype: "",
      botAggroBase: 1,
      wasAliveAtHandStart: true,
      handStartChips: STARTING_CHIPS,
      aggressiveActionsThisHand: 0,
      reachedRiverThisHand: false,
      sleightUsedRun: false,
      riverForesightUsedThisHand: false,
      wentAllInThisHand: false,
      insuranceRefundedThisHand: false
    };
  }

  playerAtSeat(seatIndex) {
    if (!Number.isInteger(seatIndex)) return null;
    if (seatIndex < 0 || seatIndex >= this.state.players.length) return null;
    return this.state.players[seatIndex] || null;
  }

  isSeatAlive(seatIndex) {
    const player = this.playerAtSeat(seatIndex);
    return !!(player && player.chips > 0);
  }

  controlledAliveSeatIndices() {
    const seats = [];
    this.state.players.forEach((player, seatIndex) => {
      if (!player || player.chips <= 0) return;
      if (!this.room.isSeatControlled(seatIndex)) return;
      seats.push(seatIndex);
    });
    return seats;
  }

  itemCombinedScale(_itemId, min = 0.3, max = 2.2) {
    return clamp(1, min, max);
  }

  isEconomyOpen() {
    const hasSeatShop = !!(
      this.state.shopBySeat &&
      typeof this.state.shopBySeat === "object" &&
      Object.values(this.state.shopBySeat).some((entry) => entry && entry.visible)
    );
    return !!(this.state.currentLoot || this.state.shopVisible || hasSeatShop);
  }

  clearEconomyUiState() {
    this.state.currentLoot = null;
    this.state.shopVisible = false;
    this.state.shopOffers = [];
    this.state.shopRerollsLeft = 0;
    this.state.shopBySeat = {};
  }

  clearEconomyState() {
    this.state.lootQueue = [];
    this.clearEconomyUiState();
    this.state.economySeatQueue = [];
    this.state.economyOwnerSeatIndex = -1;
  }

  isEconomyOwnerSeat(seatIndex) {
    return Number.isInteger(seatIndex) && seatIndex === safeInt(this.state.economyOwnerSeatIndex, -1, -1, this.state.players.length - 1);
  }

  pickNextEconomyOwnerSeat() {
    const queue = Array.isArray(this.state.economySeatQueue) ? this.state.economySeatQueue : [];
    while (queue.length > 0) {
      const nextSeat = safeInt(queue.shift(), -1, -1, this.state.players.length - 1);
      if (nextSeat < 0) continue;
      if (!this.room.isSeatControlled(nextSeat)) continue;
      if (!this.isSeatAlive(nextSeat)) continue;
      return nextSeat;
    }
    return -1;
  }

  advanceEconomyOwner() {
    this.clearEconomyUiState();

    while (true) {
      const ownerSeat = this.pickNextEconomyOwnerSeat();
      if (ownerSeat < 0) {
        this.finishPostHandEconomyFlow();
        return false;
      }

      this.state.economyOwnerSeatIndex = ownerSeat;
      if (this.openNextLootModalFromQueue()) return true;
      if (this.openShopModal()) return true;
    }
  }

  rarityRank(rarity) {
    const normalized = String(rarity || "normal").toLowerCase();
    const index = ITEM_RARITY_ORDER.indexOf(normalized);
    return index >= 0 ? index : 0;
  }

  stageRarityCap() {
    const stage = safeInt(this.state.tournamentStage, 0, 0, 12);
    if (stage <= 0) return "normal";
    if (stage === 1) return "rare";
    return "epic";
  }

  buildShopPool() {
    const capRank = this.rarityRank(this.stageRarityCap());
    return ITEM_IDS.filter((itemId) => this.rarityRank(ITEM_DB[itemId] && ITEM_DB[itemId].rarity) <= capRank);
  }

  normalizePlayerItemEntries(player) {
    if (!player || !Array.isArray(player.items)) return [];
    return player.items
      .map((entry) => {
        const id = typeof entry === "string" ? entry : entry && entry.id;
        if (!id || !ITEM_DB[id]) return null;
        return { id };
      })
      .filter(Boolean);
  }

  itemSlotCount(player) {
    if (!player) return 0;
    return Math.max(1, safeInt(player.maxItemSlots, 4, 1, 6));
  }

  compactPlayerItems(player) {
    if (!player) return [];
    const maxSlots = this.itemSlotCount(player);
    const entries = this.normalizePlayerItemEntries(player).slice(0, maxSlots);
    player.items = entries.map((entry) => ({ id: entry.id }));
    return player.items;
  }

  hasItem(player, itemId) {
    if (!player || !itemId) return false;
    return this.normalizePlayerItemEntries(player).some((entry) => entry.id === itemId);
  }

  removeOneItemFromPlayer(player, itemId) {
    if (!player || !itemId || !Array.isArray(player.items)) return false;
    const index = player.items.findIndex((entry) => {
      const id = typeof entry === "string" ? entry : entry && entry.id;
      return id === itemId;
    });
    if (index < 0) return false;
    player.items.splice(index, 1);
    this.compactPlayerItems(player);
    return true;
  }

  consumeItemOnUse(player, itemId) {
    if (!this.removeOneItemFromPlayer(player, itemId)) return false;
    const item = ITEM_DB[itemId];
    if (item) {
      this.logHistory(`${player.name} consumed ${item.name}.`, "item");
    }
    return true;
  }

  sellOwnedItemForSeat(seatIndex, itemId) {
    const player = this.playerAtSeat(seatIndex);
    if (!player || !itemId || !ITEM_DB[itemId]) {
      return { ok: false, message: "Invalid item." };
    }
    if (!this.removeOneItemFromPlayer(player, itemId)) {
      return { ok: false, message: "Item not owned." };
    }

    const amount = this.lootSellValue(itemId);
    player.chips += amount;
    this.setPlayerAction(player, `Sell +${toCurrency(amount)}`, "strong");
    this.logHistory(`${player.name} sold ${ITEM_DB[itemId].name} for +${toCurrency(amount)}.`, "shop");
    this.setStatus(`${player.name} sold item.`, `+${toCurrency(amount)} chips.`);
    return { ok: true };
  }

  pullRandomItemFromPlayer(player) {
    const entries = this.normalizePlayerItemEntries(player);
    if (entries.length <= 0) {
      player.items = [];
      return null;
    }

    const pickIndex = secureRandomIntInclusive(0, entries.length - 1);
    const [picked] = entries.splice(pickIndex, 1);
    player.items = entries.map((entry) => ({ id: entry.id }));
    return picked || null;
  }

  equipItemToPlayer(player, itemId, { allowReplace = true } = {}) {
    if (!player || !itemId || !ITEM_DB[itemId]) {
      return { ok: false, reason: "invalid_item", replacedId: null };
    }

    const maxSlots = this.itemSlotCount(player);
    if (maxSlots <= 0) {
      return { ok: false, reason: "no_slot", replacedId: null };
    }

    const entries = this.compactPlayerItems(player).map((entry) => ({ id: entry && entry.id })).filter((entry) => !!entry.id);
    if (entries.some((entry) => entry.id === itemId)) {
      return { ok: false, reason: "duplicate", replacedId: null };
    }

    let replacedId = null;
    if (entries.length >= maxSlots) {
      if (!allowReplace) {
        return { ok: false, reason: "no_slot", replacedId: null };
      }
      const removed = entries.shift();
      replacedId = removed ? removed.id : null;
    }

    entries.push({ id: itemId });
    player.items = entries;
    return { ok: true, reason: "equipped", replacedId };
  }

  lootSellValue(itemId) {
    const item = ITEM_DB[itemId];
    if (!item) return LOOT_SELL_MIN;
    return Math.max(LOOT_SELL_MIN, Math.round((Number(item.price) || 0) * LOOT_SELL_MULTIPLIER));
  }

  normalizeDrawContext(drawContext = null) {
    if (!drawContext || typeof drawContext !== "object") {
      return {
        drawKind: "generic",
        street: this.state.stage,
        targetIndex: -1
      };
    }
    return {
      drawKind: drawContext.drawKind || drawContext.kind || "generic",
      street: drawContext.street || this.state.stage,
      targetIndex: Number.isInteger(drawContext.targetIndex) ? drawContext.targetIndex : -1
    };
  }

  playersAffectingDraw(context) {
    if (context.drawKind === "hole" && context.targetIndex >= 0) {
      const target = this.playerAtSeat(context.targetIndex);
      return target ? [target] : [];
    }

    if (context.drawKind === "community") {
      const inHand = this.playersInHand();
      if (inHand.length > 0) return inHand;
    }

    return this.state.players.filter((player) => !!player && player.chips > 0);
  }

  buildDrawEffects(context) {
    const affectedPlayers = this.playersAffectingDraw(context);
    const effects = {
      suitMagnetCount: 0,
      heavyDiceCount: 0,
      turnHunterCount: 0,
      royalTasteActive: false,
      pairHunterActive: false,
      suitTailorActive: false
    };

    affectedPlayers.forEach((player) => {
      if (this.hasItem(player, "suit_magnet")) {
        effects.suitMagnetCount += 1;
      }
      if (this.hasItem(player, "heavy_dice")) {
        effects.heavyDiceCount += 1;
      }
      if (this.hasItem(player, "turn_hunter")) {
        effects.turnHunterCount += 1;
      }
    });

    if (context.drawKind === "hole" && context.targetIndex >= 0) {
      const target = this.playerAtSeat(context.targetIndex);
      effects.royalTasteActive = this.hasItem(target, "royal_taste");
      effects.pairHunterActive = this.hasItem(target, "pair_hunter");
      effects.suitTailorActive = this.hasItem(target, "suit_tailor");
    }

    return effects;
  }

  drawWeightForCard(card, context, effects) {
    let weight = 1;
    const street = String(context.street || "");
    const onBoardStreet = street === "flop" || street === "turn" || street === "river";

    if (context.drawKind === "community" && onBoardStreet) {
      if (effects.suitMagnetCount > 0 && card.suit === "S") {
        weight *= 1 + 0.3 * effects.suitMagnetCount * this.itemCombinedScale("suit_magnet", 0.4, 2.2);
      }

      if ((street === "turn" || street === "river") && effects.heavyDiceCount > 0) {
        if (card.rank >= 2 && card.rank <= 5) {
          const damp = this.itemCombinedScale("heavy_dice", 0.4, 2.2);
          weight *= Math.max(0, 1 - damp);
        }
      }

      if ((street === "turn" || street === "river") && effects.turnHunterCount > 0 && card.rank >= 10) {
        weight *= 1 + 0.12 * effects.turnHunterCount * this.itemCombinedScale("turn_hunter", 0.4, 2.2);
      }
    }

    if (context.drawKind === "hole" && street === "preflop" && effects.royalTasteActive) {
      if (card.rank >= 11 || card.rank === 14) {
        weight *= 1 + (1.55 - 1) * this.itemCombinedScale("royal_taste", 0.4, 2.2);
      }
    }

    if (context.drawKind === "hole" && street === "preflop" && context.targetIndex >= 0) {
      const target = this.playerAtSeat(context.targetIndex);
      const holeCount = target && Array.isArray(target.hand) ? target.hand.length : 0;
      const anchor = target && holeCount > 0 ? target.hand[0] : null;
      if (anchor && holeCount === 1) {
        if (effects.pairHunterActive && card.rank === anchor.rank) {
          weight *= 1 + (1.55 - 1) * this.itemCombinedScale("pair_hunter", 0.4, 2.2);
        }
        if (effects.suitTailorActive && card.suit === anchor.suit) {
          weight *= 1 + (1.45 - 1) * this.itemCombinedScale("suit_tailor", 0.4, 2.2);
        }
      }
    }

    return weight;
  }

  nextCommunityStreetFromStage(stage = this.state.stage) {
    if (stage === "preflop") return "flop";
    if (stage === "flop") return "turn";
    if (stage === "turn") return "river";
    return null;
  }

  consumeReservedCommunityCardForStreet(street) {
    if (!this.state.riverForesightReveal) return null;
    if (this.state.riverForesightReveal.street !== street) return null;
    const card = this.state.riverForesightReveal.card || null;
    this.state.riverForesightReveal = null;
    return card;
  }

  drawCommunityCardForStreet(street) {
    const reserved = this.consumeReservedCommunityCardForStreet(street);
    if (reserved) return reserved;
    return this.drawCard({ drawKind: "community", street });
  }

  canUseSleightOfHand(player, playerIndex) {
    if (!player || !this.hasItem(player, "sleight_of_hand")) return false;
    if (this.state.handOver || this.state.stage !== "preflop") return false;
    if (player.folded || player.allIn) return false;
    const dealt = this.state.dealtHoleCounts[playerIndex] || 0;
    return dealt >= 2 && Array.isArray(player.hand) && player.hand.length >= 2;
  }

  pickSleightReplaceIndex(player) {
    if (!player || !Array.isArray(player.hand) || player.hand.length < 2) return 0;
    const a = player.hand[0];
    const b = player.hand[1];
    if (!a || !b) return 0;
    if (a.rank === b.rank) return secureRandomUnit() < 0.5 ? 0 : 1;
    return a.rank < b.rank ? 0 : 1;
  }

  sleightRankValue(card) {
    if (!card) return 0;
    if (card.isJoker || card.rank === 0 || card.suit === "J") return 18;
    const rank = Number(card.rank) || 0;
    return rank === 1 ? 14 : rank;
  }

  sleightHoleComboScore(cardA, cardB) {
    if (!cardA || !cardB) return -999;
    const ra = this.sleightRankValue(cardA);
    const rb = this.sleightRankValue(cardB);
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

  drawImprovedSleightCard(playerIndex, replaceIndex) {
    const player = this.playerAtSeat(playerIndex);
    if (!player || !Array.isArray(player.hand) || player.hand.length < 2) return null;
    const keepIndex = replaceIndex === 0 ? 1 : 0;
    const keepCard = player.hand[keepIndex];
    const oldCard = player.hand[replaceIndex];
    if (!keepCard || !oldCard) return null;

    const baseScore = this.sleightHoleComboScore(keepCard, oldCard);
    let bestScore = baseScore;
    const improved = [];

    for (let i = 0; i < this.state.deck.length; i += 1) {
      const candidate = this.state.deck[i];
      const score = this.sleightHoleComboScore(keepCard, candidate);
      if (score <= baseScore + 0.01) continue;
      if (score > bestScore + 0.01) {
        bestScore = score;
      }
      improved.push({ index: i, score });
    }

    if (improved.length <= 0) return null;
    const bestBand = improved.filter((entry) => entry.score >= bestScore - 2.2);
    const pool = bestBand.length > 0 ? bestBand : improved;
    const picked = pool[secureRandomIntInclusive(0, pool.length - 1)];
    if (!picked) return null;
    return this.state.deck.splice(picked.index, 1)[0] || null;
  }

  useSleightOfHandForSeat(seatIndex) {
    const player = this.playerAtSeat(seatIndex);
    if (!player) return { ok: false, message: "Invalid seat." };
    if (!this.canUseSleightOfHand(player, seatIndex)) {
      return { ok: false, message: "Sleight of Hand unavailable." };
    }

    const replaceIndex = this.pickSleightReplaceIndex(player);
    const discarded = player.hand[replaceIndex];
    if (!discarded) return { ok: false, message: "No hole card to replace." };
    const keepIndex = replaceIndex === 0 ? 1 : 0;
    const keepCard = player.hand[keepIndex];
    const beforeScore = this.sleightHoleComboScore(keepCard, discarded);

    this.state.deck.push(discarded);
    this.shuffle(this.state.deck);

    const upgradedCard = this.drawImprovedSleightCard(seatIndex, replaceIndex);
    const nextCard = upgradedCard || this.drawCard({ drawKind: "hole", street: "preflop", targetIndex: seatIndex });
    if (!nextCard) return { ok: false, message: "Deck exhausted." };

    player.hand[replaceIndex] = nextCard;
    const afterScore = this.sleightHoleComboScore(keepCard, nextCard);
    const improved = afterScore > beforeScore + 0.01;
    this.setPlayerAction(player, "Sleight", "strong");
    this.logHistory(
      `${player.name} uses Sleight of Hand (${cardText(discarded)} -> ${cardText(nextCard)} ${improved ? "improved" : "kept"}).`,
      "item"
    );
    this.consumeItemOnUse(player, "sleight_of_hand");
    return { ok: true };
  }

  markedLensTargetsForSeat(seatIndex) {
    const targets = [];
    for (let i = 0; i < this.state.players.length; i += 1) {
      if (i === seatIndex) continue;
      const player = this.state.players[i];
      if (!player || player.folded) continue;
      const dealt = this.state.dealtHoleCounts[i] || 0;
      if (dealt <= 0 || !Array.isArray(player.hand) || player.hand.length <= 0) continue;
      targets.push(i);
    }
    return targets;
  }

  canUseMarkedLenses(player, seatIndex) {
    if (!player || !this.hasItem(player, "marked_lenses")) return false;
    if (this.state.handOver || this.state.stage === "idle") return false;
    if (this.state.markedLensUsedThisHand) return false;
    if (this.state.handId <= 0 || this.state.handId % 3 !== 0) return false;
    if (player.folded) return false;
    return this.markedLensTargetsForSeat(seatIndex).length > 0;
  }

  useMarkedLensesForSeat(seatIndex) {
    const player = this.playerAtSeat(seatIndex);
    if (!player) return { ok: false, message: "Invalid seat." };
    if (!this.canUseMarkedLenses(player, seatIndex)) {
      return { ok: false, message: "Marked Lenses unavailable." };
    }

    const targets = this.markedLensTargetsForSeat(seatIndex);
    if (targets.length <= 0) return { ok: false, message: "No target." };
    const targetIndex = targets[secureRandomIntInclusive(0, targets.length - 1)];
    const target = this.playerAtSeat(targetIndex);
    if (!target) return { ok: false, message: "Target unavailable." };

    const dealt = Math.max(1, Math.min(2, this.state.dealtHoleCounts[targetIndex] || target.hand.length));
    const cardIndex = secureRandomIntInclusive(0, dealt - 1);
    const revealed = target.hand[cardIndex];
    if (!revealed) return { ok: false, message: "Target card unavailable." };

    this.state.markedLensUsedThisHand = true;
    this.state.markedLensReveal = {
      handId: this.state.handId,
      targetIndex,
      cardIndex,
      ownerSeatIndex: seatIndex
    };
    this.setPlayerAction(player, "Lenses", "strong");
    this.logHistory(`${player.name} marked lenses reveal ${target.name}: ${cardText(revealed)}.`, "item");
    this.consumeItemOnUse(player, "marked_lenses");
    return { ok: true };
  }

  canUseRiverForesight(player) {
    if (!player || !this.hasItem(player, "river_foresight")) return false;
    if (this.state.handOver || this.state.stage === "idle") return false;
    if (this.state.roundTransitioning || this.state.animatingDeal) return false;
    if (player.riverForesightUsedThisHand) return false;
    if (player.folded || player.allIn) return false;
    const nextStreet = this.nextCommunityStreetFromStage(this.state.stage);
    if (!nextStreet) return false;
    if (this.state.riverForesightReveal && this.state.riverForesightReveal.handId === this.state.handId) return true;
    return this.state.deck.length > 0;
  }

  useRiverForesightForSeat(seatIndex) {
    const player = this.playerAtSeat(seatIndex);
    if (!player) return { ok: false, message: "Invalid seat." };
    if (!this.canUseRiverForesight(player)) {
      return { ok: false, message: "River Foresight unavailable." };
    }

    const street = this.nextCommunityStreetFromStage(this.state.stage);
    if (!street) return { ok: false, message: "No next street." };
    let revealed = null;
    if (
      this.state.riverForesightReveal &&
      this.state.riverForesightReveal.handId === this.state.handId &&
      this.state.riverForesightReveal.street === street
    ) {
      revealed = this.state.riverForesightReveal.card || null;
    } else {
      revealed = this.drawCard({ drawKind: "community", street });
      if (!revealed) return { ok: false, message: "Deck exhausted." };
      this.state.riverForesightReveal = {
        handId: this.state.handId,
        street,
        card: revealed
      };
    }

    player.riverForesightUsedThisHand = true;
    this.setPlayerAction(player, "Foresight", "strong");
    this.logHistory(`${player.name} foresight locks ${street.toUpperCase()} ${cardText(revealed)}.`, "item");
    this.consumeItemOnUse(player, "river_foresight");
    return { ok: true };
  }

  useOwnedItemForSeat(seatIndex, itemId) {
    const player = this.playerAtSeat(seatIndex);
    if (!player || !itemId || !ITEM_DB[itemId]) {
      return { ok: false, message: "Invalid item." };
    }
    if (!this.hasItem(player, itemId)) {
      return { ok: false, message: "Item not owned." };
    }

    if (itemId === "sleight_of_hand") return this.useSleightOfHandForSeat(seatIndex);
    if (itemId === "marked_lenses") return this.useMarkedLensesForSeat(seatIndex);
    if (itemId === "river_foresight") return this.useRiverForesightForSeat(seatIndex);
    return { ok: false, message: "Passive item auto-applies." };
  }

  shopRerollCost() {
    return SHOP_BASE_REROLL_COST + safeInt(this.state.tournamentStage, 0, 0, 30) * SHOP_STAGE_REROLL_STEP;
  }

  shopPriceForItem(itemId) {
    const item = ITEM_DB[itemId];
    if (!item) return 0;
    const base = Math.max(80, safeInt(item.price, 0, 0, 100000));
    const stage = safeInt(this.state.tournamentStage, 0, 0, 30);
    return Math.round(base * (1 + stage * 0.12));
  }

  rollShopOffers() {
    const pool = this.buildShopPool();
    if (pool.length <= 0) return [];

    const used = new Set();
    const offers = [];
    let attempts = 0;
    const maxAttempts = Math.max(pool.length * 4, SHOP_OFFER_COUNT * 3);

    while (offers.length < SHOP_OFFER_COUNT && attempts < maxAttempts) {
      attempts += 1;
      const candidate = pool[secureRandomIntInclusive(0, pool.length - 1)];
      if (!candidate || used.has(candidate)) continue;
      used.add(candidate);
      offers.push({
        id: candidate,
        price: this.shopPriceForItem(candidate)
      });
    }

    return offers;
  }

  seedEconomyLoadout() {
    const pool = this.buildShopPool();
    const controlledSeats = new Set();
    this.state.players.forEach((_, index) => {
      if (this.room.isSeatControlled(index)) {
        controlledSeats.add(index);
      }
    });
    if (controlledSeats.size <= 0) {
      controlledSeats.add(HOST_SEAT_INDEX);
    }

    this.state.players.forEach((player, index) => {
      if (!player) return;
      player.maxItemSlots = 4;
      player.items = [];

      if (controlledSeats.has(index)) {
        HERO_STARTER_ITEMS.forEach((itemId) => {
          if (ITEM_DB[itemId]) {
            player.items.push({ id: itemId });
          }
        });
        this.compactPlayerItems(player);
        return;
      }

      if (pool.length > 0) {
        const itemId = pool[secureRandomIntInclusive(0, pool.length - 1)];
        if (itemId && ITEM_DB[itemId]) {
          player.items = [{ id: itemId }];
        }
      }
      this.compactPlayerItems(player);
    });
  }

  ensureControlledSeatLoadout(seatIndex) {
    const player = this.playerAtSeat(seatIndex);
    if (!player) return;
    player.maxItemSlots = Math.max(4, safeInt(player.maxItemSlots, 4, 1, 8));
    const existing = this.normalizePlayerItemEntries(player);
    if (existing.length > 0) {
      this.compactPlayerItems(player);
      return;
    }
    HERO_STARTER_ITEMS.forEach((itemId) => {
      if (ITEM_DB[itemId]) {
        player.items.push({ id: itemId });
      }
    });
    this.compactPlayerItems(player);
  }

  collectBustLootEvents() {
    const events = [];

    this.state.players.forEach((player, index) => {
      if (!player) return;

      const bustedThisHand = !!player.wasAliveAtHandStart && player.chips <= 0;
      player.wasAliveAtHandStart = player.chips > 0;
      if (!bustedThisHand) return;

      if (this.room.isSeatControlled(index)) {
        this.logHistory(`${player.name} busted.`, "loot");
        return;
      }

      const pulled = this.pullRandomItemFromPlayer(player);
      if (!pulled || !ITEM_DB[pulled.id]) {
        this.logHistory(`${player.name} busted with no relic to loot.`, "loot");
        return;
      }

      const item = ITEM_DB[pulled.id];
      events.push({
        sourceIndex: index,
        sourceName: player.name,
        itemId: item.id,
        sellValue: this.lootSellValue(item.id)
      });
      this.logHistory(`${player.name} busted. Loot available: ${item.name}.`, "loot");
    });

    return events;
  }

  openNextLootModalFromQueue() {
    if (!this.isEconomyOwnerSeat(this.state.economyOwnerSeatIndex)) {
      this.state.currentLoot = null;
      return false;
    }
    const next = Array.isArray(this.state.lootQueue) ? this.state.lootQueue.shift() : null;
    if (!next) {
      this.state.currentLoot = null;
      return false;
    }

    const item = ITEM_DB[next.itemId];
    this.state.currentLoot = next;
    this.state.shopVisible = false;
    this.state.shopOffers = [];
    this.state.shopRerollsLeft = 0;
    if (item) {
      this.setStatus(`${next.sourceName} busted.`, `Loot: ${item.name}`);
    } else {
      this.setStatus(`${next.sourceName} busted.`, "Loot available.");
    }
    return true;
  }

  openShopModal() {
    if (!FEATURE_PHASE5_ECONOMY || this.state.gameOver) return false;
    const ownerSeat = safeInt(this.state.economyOwnerSeatIndex, -1, -1, this.state.players.length - 1);
    const queueSeats = Array.isArray(this.state.economySeatQueue) ? this.state.economySeatQueue.slice() : [];
    const seats = [];

    if (ownerSeat >= 0) {
      seats.push(ownerSeat);
    }

    queueSeats.forEach((rawSeat) => {
      const seat = safeInt(rawSeat, -1, -1, this.state.players.length - 1);
      if (seat < 0) return;
      if (seats.includes(seat)) return;
      seats.push(seat);
    });

    if (seats.length <= 0) return false;

    let openedCount = 0;
    seats.forEach((seat) => {
      if (!this.room.isSeatControlled(seat)) return;
      if (!this.isSeatAlive(seat)) return;
      const offers = this.rollShopOffers();
      if (offers.length <= 0) return;
      this.state.shopBySeat[String(seat)] = {
        visible: true,
        offers,
        rerollsLeft: SHOP_DEFAULT_REROLLS
      };
      openedCount += 1;
      const player = this.playerAtSeat(seat);
      const playerName = player ? player.name : `Seat ${seat + 1}`;
      this.logHistory(`${playerName} black market opens with ${offers.length} offers.`, "shop");
    });

    this.state.currentLoot = null;
    this.state.economySeatQueue = [];
    this.state.economyOwnerSeatIndex = -1;
    this.state.shopVisible = false;
    this.state.shopOffers = [];
    this.state.shopRerollsLeft = 0;

    if (openedCount <= 0) return false;
    this.setStatus("Black market open.", "Each player now has a personal shop.");
    return true;
  }

  finishPostHandEconomyFlow() {
    this.clearEconomyState();
    this.setStatus("Hand complete.", "Host can start next hand.");
  }

  continuePostHandEconomyFlow() {
    if (this.openNextLootModalFromQueue()) return true;
    if (this.openShopModal()) return true;
    return this.advanceEconomyOwner();
  }

  beginPostHandEconomyFlow() {
    if (!FEATURE_PHASE5_ECONOMY || this.state.gameOver) return false;

    this.clearEconomyState();
    const controlledSeats = this.controlledAliveSeatIndices();
    if (controlledSeats.length <= 0) return false;

    const lootEvents = this.collectBustLootEvents();
    if (lootEvents.length > 0) {
      this.state.lootQueue = lootEvents.slice();
    }

    this.state.economySeatQueue = controlledSeats.slice();
    return this.advanceEconomyOwner();
  }

  resolveLootDecision(mode, seatIndex) {
    if (!this.state.currentLoot) {
      return { ok: false, message: "No loot to resolve." };
    }
    if (!this.isEconomyOwnerSeat(seatIndex)) {
      return { ok: false, message: "Not your loot turn." };
    }

    const hero = this.playerAtSeat(seatIndex);
    if (!hero || !this.room.isSeatControlled(seatIndex)) {
      return { ok: false, message: "Invalid player seat." };
    }

    const loot = this.state.currentLoot;
    const item = ITEM_DB[loot.itemId];
    const sellAmount = Math.max(0, safeInt(loot.sellValue, 0, 0, 1000000));
    this.state.currentLoot = null;

    if (!hero || !item) {
      this.continuePostHandEconomyFlow();
      return { ok: true };
    }

    if (mode === "equip") {
      const equipResult = this.equipItemToPlayer(hero, item.id, { allowReplace: true });
      if (equipResult.ok) {
        const replaced = equipResult.replacedId && ITEM_DB[equipResult.replacedId] ? ITEM_DB[equipResult.replacedId].name : "";
        this.setStatus(`Equipped ${item.name}.`, replaced ? `${replaced} replaced.` : "Inventory updated.");
        this.logHistory(
          replaced ? `Loot equipped: ${item.name} (replaced ${replaced}).` : `Loot equipped: ${item.name}.`,
          "loot"
        );
      } else {
        hero.chips += sellAmount;
        this.setStatus(`Duplicate ${item.name}.`, `Auto-sold for +${toCurrency(sellAmount)}.`);
        this.logHistory(`Duplicate loot ${item.name} auto-sold for ${toCurrency(sellAmount)}.`, "loot");
      }
    } else {
      hero.chips += sellAmount;
      this.setStatus(`Sold ${item.name}.`, `+${toCurrency(sellAmount)} chips.`);
      this.logHistory(`Loot sold: ${item.name} for ${toCurrency(sellAmount)}.`, "loot");
    }

    this.continuePostHandEconomyFlow();
    return { ok: true };
  }

  buyShopOffer(itemId, seatIndex) {
    if (!itemId) {
      return { ok: false, message: "Shop is not open." };
    }
    const hero = this.playerAtSeat(seatIndex);
    if (!hero) {
      return { ok: false, message: "Player seat unavailable." };
    }
    if (!this.room.isSeatControlled(seatIndex)) {
      return { ok: false, message: "Seat is bot-controlled." };
    }
    if (hero.chips <= 0) {
      return { ok: false, message: "Player is busted." };
    }

    const seatShop = this.state.shopBySeat && this.state.shopBySeat[String(seatIndex)];
    if (!seatShop || !seatShop.visible || !Array.isArray(seatShop.offers)) {
      return { ok: false, message: "Shop is not open." };
    }

    const offerIndex = seatShop.offers.findIndex((offer) => offer && offer.id === itemId);
    if (offerIndex < 0) {
      return { ok: false, message: "Offer not found." };
    }

    const offer = seatShop.offers[offerIndex];
    const item = ITEM_DB[itemId];
    if (!item) {
      return { ok: false, message: "Invalid item." };
    }
    if (hero.chips < offer.price) {
      return { ok: false, message: "Not enough chips." };
    }

    const equipResult = this.equipItemToPlayer(hero, item.id, { allowReplace: true });
    if (!equipResult.ok) {
      return { ok: false, message: equipResult.reason === "duplicate" ? "Already owned." : "No item slot available." };
    }

    hero.chips -= offer.price;
    seatShop.offers.splice(offerIndex, 1);
    const replaced = equipResult.replacedId && ITEM_DB[equipResult.replacedId] ? ITEM_DB[equipResult.replacedId].name : "";
    this.setStatus(`${hero.name} purchased ${item.name}.`, replaced ? `${replaced} replaced.` : `-${toCurrency(offer.price)} chips.`);
    this.logHistory(
      replaced
        ? `${hero.name} shop buy: ${item.name} for ${toCurrency(offer.price)} (replaced ${replaced}).`
        : `${hero.name} shop buy: ${item.name} for ${toCurrency(offer.price)}.`,
      "shop"
    );
    return { ok: true };
  }

  rerollShopOffers(seatIndex) {
    const hero = this.playerAtSeat(seatIndex);
    if (!hero) {
      return { ok: false, message: "Player seat unavailable." };
    }
    if (!this.room.isSeatControlled(seatIndex)) {
      return { ok: false, message: "Seat is bot-controlled." };
    }

    const seatShop = this.state.shopBySeat && this.state.shopBySeat[String(seatIndex)];
    if (!seatShop || !seatShop.visible) {
      return { ok: false, message: "Shop is not open." };
    }

    const cost = this.shopRerollCost();
    if (safeInt(seatShop.rerollsLeft, 0, 0, 20) <= 0) {
      return { ok: false, message: "No rerolls left." };
    }
    if (hero.chips < cost) {
      return { ok: false, message: "Not enough chips." };
    }

    hero.chips -= cost;
    seatShop.rerollsLeft = Math.max(0, safeInt(seatShop.rerollsLeft, 0, 0, 20) - 1);
    seatShop.offers = this.rollShopOffers();
    this.setStatus("Shop rerolled.", `${hero.name} spent ${toCurrency(cost)} chips.`);
    this.logHistory(`${hero.name} rerolled shop: -${toCurrency(cost)} chips.`, "shop");
    return { ok: true };
  }

  closeShopModal(seatIndex) {
    const closer = this.playerAtSeat(seatIndex);
    const seatShop = this.state.shopBySeat && this.state.shopBySeat[String(seatIndex)];
    if (!seatShop || !seatShop.visible) {
      return { ok: false, message: "Shop is not open." };
    }

    seatShop.visible = false;
    seatShop.offers = [];
    seatShop.rerollsLeft = 0;
    this.logHistory(closer ? `${closer.name} closed black market.` : "Black market closed.", "shop");

    const hasOpenSeatShop = Object.values(this.state.shopBySeat || {}).some((entry) => entry && entry.visible);
    if (hasOpenSeatShop || this.state.currentLoot) {
      this.setStatus("Black market open.", "Other players are still shopping.");
      return { ok: true };
    }

    this.finishPostHandEconomyFlow();
    return { ok: true };
  }

  handStartAverageChips() {
    const stacks = this.state.players
      .filter((player) => !!player && player.wasAliveAtHandStart)
      .map((player) => Math.max(0, Number(player.handStartChips) || 0))
      .filter((stack) => stack > 0);
    if (stacks.length <= 0) return 0;
    const sum = stacks.reduce((acc, stack) => acc + stack, 0);
    return sum / stacks.length;
  }

  isUnderdogThisHand(player) {
    if (!player || !player.wasAliveAtHandStart) return false;
    const start = Math.max(0, Number(player.handStartChips) || 0);
    if (start <= 0) return false;
    const average = this.handStartAverageChips();
    if (average <= 0) return false;
    return start <= average * 0.8;
  }

  allInWinMultiplierFor(player) {
    if (!player) return 1;
    if (!this.hasItem(player, "allin_multiplier")) return 1;
    if (!player.wentAllInThisHand) return 1;
    const scale = this.itemCombinedScale("allin_multiplier", 0.45, 1.9);
    const bonus = (2 - 1) * scale;
    return clamp(1 + bonus, 1, 3);
  }

  itemPayoutModifiersFor(player, playerIndex, splitWinnerIndices) {
    let multiplier = 1;
    let flatBonus = 0;
    const labels = [];

    if (this.hasItem(player, "underdog_emblem") && this.isUnderdogThisHand(player)) {
      const scale = this.itemCombinedScale("underdog_emblem", 0.45, 1.9);
      const underdogMult = 1 + (UNDERDOG_EMBLEM_MULTIPLIER - 1) * scale;
      multiplier *= underdogMult;
      labels.push(`Underdog x${Math.round(underdogMult * 100) / 100}`);
    }

    if (this.hasItem(player, "triple_barrel")) {
      const aggroCount = Math.max(0, Math.floor(Number(player.aggressiveActionsThisHand) || 0));
      if (aggroCount >= 2) {
        const scale = this.itemCombinedScale("triple_barrel", 0.45, 1.9);
        const step = TRIPLE_BARREL_STEP * scale;
        const factor = 1 + Math.min(3, aggroCount) * step;
        multiplier *= factor;
        labels.push(`Triple x${Math.round(factor * 100) / 100}`);
      }
    }

    if (this.hasItem(player, "river_surfer") && player.reachedRiverThisHand) {
      const scale = this.itemCombinedScale("river_surfer", 0.45, 1.9);
      const bonus = Math.max(1, Math.floor(RIVER_SURFER_BONUS * scale));
      flatBonus += bonus;
      labels.push(`River +${toCurrency(bonus)}`);
    }

    if (splitWinnerIndices && splitWinnerIndices.has(playerIndex) && this.hasItem(player, "split_guard")) {
      const scale = this.itemCombinedScale("split_guard", 0.45, 1.9);
      const bonus = Math.max(1, Math.floor(SPLIT_GUARD_BONUS * scale));
      flatBonus += bonus;
      labels.push(`Split +${toCurrency(bonus)}`);
    }

    return {
      multiplier: Math.max(1, multiplier),
      flatBonus,
      labels
    };
  }

  resolvePayoutAward({ player, playerIndex, baseShare, splitWinnerIndices }) {
    const safeBase = Math.max(0, Math.floor(Number(baseShare) || 0));
    const allInMult = this.allInWinMultiplierFor(player);
    const allInApplied = Math.floor(safeBase * allInMult);
    const itemMods = this.itemPayoutModifiersFor(player, playerIndex, splitWinnerIndices);
    const itemApplied = Math.floor(allInApplied * itemMods.multiplier);
    const total = itemApplied + itemMods.flatBonus;
    return {
      baseShare: safeBase,
      allInMult,
      allInApplied,
      itemMult: itemMods.multiplier,
      itemApplied,
      itemFlatBonus: itemMods.flatBonus,
      itemLabels: itemMods.labels,
      total
    };
  }

  applyInsuranceRefunds() {
    this.state.players.forEach((player, index) => {
      if (!player || !this.hasItem(player, "insurance_contract")) return;
      if (!player.wentAllInThisHand || player.folded || player.chips > 0) return;
      if (player.insuranceRefundedThisHand) return;

      const invested = Math.max(0, Math.floor(Number(player.invested) || 0));
      if (invested < INSURANCE_MIN_ALLIN_INVEST) return;

      const scale = this.itemCombinedScale("insurance_contract", 0.45, 1.8);
      const refundRate = clamp(INSURANCE_REFUND_RATE * scale, 0.08, 0.85);
      const refund = Math.max(1, Math.floor(invested * refundRate));
      player.chips += refund;
      player.insuranceRefundedThisHand = true;
      this.setPlayerAction(player, `Insurance +${toCurrency(refund)}`, "strong");
      this.logHistory(`${player.name} insurance refund +${toCurrency(refund)}.`, "showdown");
      if (index === this.state.activePlayerIndex) {
        this.setStatus(`${player.name} insured.`, `+${toCurrency(refund)} refund.`);
      }
    });
  }

  applyBountyHunterRewardsForBust(bustedIndex) {
    const busted = this.playerAtSeat(bustedIndex);
    if (!busted) return;

    const winners = Array.isArray(this.state.handWinnerIndices) ? this.state.handWinnerIndices : [];
    winners.forEach((winnerIndex) => {
      if (winnerIndex === bustedIndex) return;
      const hunter = this.playerAtSeat(winnerIndex);
      if (!hunter || hunter.chips <= 0) return;
      if (!this.hasItem(hunter, "bounty_hunter")) return;

      const rewardScale = this.itemCombinedScale("bounty_hunter", 0.45, 1.9);
      const reward = Math.max(1, Math.floor(BOUNTY_CHIP_BONUS * rewardScale));
      hunter.chips += reward;
      this.setPlayerAction(hunter, `Bounty +${toCurrency(reward)}`, "strong");
      this.logHistory(`${hunter.name} bounty on ${busted.name}: +${toCurrency(reward)}.`, "loot");
    });
  }

  applyBountyHunterRewardsForHandBusts() {
    this.state.players.forEach((player, seatIndex) => {
      if (!player || !player.wasAliveAtHandStart) return;
      if (player.chips > 0) return;
      this.applyBountyHunterRewardsForBust(seatIndex);
    });
  }

  syncRosterFromRoom() {
    this.state.players.forEach((player, index) => {
      const fallback = BASE_PLAYER_NAMES[index] || player.name || `Seat ${index + 1}`;
      player.name = this.room.getSeatDisplayName(index, fallback);
    });

    if (!this.state.shopBySeat || typeof this.state.shopBySeat !== "object") {
      this.state.shopBySeat = {};
      return;
    }

    Object.keys(this.state.shopBySeat).forEach((key) => {
      const seat = safeInt(key, -1, -1, this.state.players.length - 1);
      if (seat < 0) {
        delete this.state.shopBySeat[key];
        return;
      }
      if (!this.room.isSeatControlled(seat) || !this.isSeatAlive(seat)) {
        delete this.state.shopBySeat[key];
      }
    });
  }

  setStatus(main, sub = "") {
    this.statusMain = String(main || "");
    this.statusSub = String(sub || "");
  }

  logHistory(text, type = "info") {
    if (!text) return;
    this.state.historySeq += 1;
    this.state.currentHandLog.push({ id: this.state.historySeq, text, type });
    if (this.state.currentHandLog.length > HISTORY_MAX) {
      this.state.currentHandLog.splice(0, this.state.currentHandLog.length - HISTORY_MAX);
    }
  }

  clearTimers() {
    if (this.turnTimerId) {
      clearTimeout(this.turnTimerId);
      this.turnTimerId = null;
    }
    if (this.turnCountdownId) {
      clearInterval(this.turnCountdownId);
      this.turnCountdownId = null;
    }
    if (this.botThinkId) {
      clearTimeout(this.botThinkId);
      this.botThinkId = null;
    }
    if (this.state && typeof this.state === "object") {
      this.state.turnTimerRemainingMs = 0;
      this.state.turnTimerSeatIndex = -1;
    }
  }

  hasAtLeastTwoAlive() {
    return this.state.players.filter((player) => player.chips > 0).length >= 2;
  }

  applyBlindLevelForHand(handId) {
    const levelIndex = Math.max(0, Math.floor((Math.max(1, handId) - 1) / HANDS_PER_LEVEL));
    const level = BLIND_LEVELS[Math.min(levelIndex, BLIND_LEVELS.length - 1)] || { small: SMALL_BLIND, big: BIG_BLIND };
    this.state.blindLevel = levelIndex;
    this.state.smallBlind = level.small;
    this.state.bigBlind = level.big;
  }

  buildDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit });
      }
    }
    return deck;
  }

  shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = secureRandomIntInclusive(0, i);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  drawCard(drawContext = null) {
    if (!this.state.deck.length) return null;

    const context = this.normalizeDrawContext(drawContext);
    const effects = this.buildDrawEffects(context);
    const weighted = [];
    let totalWeight = 0;

    for (let i = 0; i < this.state.deck.length; i += 1) {
      const card = this.state.deck[i];
      const weight = this.drawWeightForCard(card, context, effects);
      if (weight > 0) {
        weighted.push({ index: i, weight });
        totalWeight += weight;
      }
    }

    if (weighted.length === 0 || totalWeight <= 0) {
      return this.state.deck.pop();
    }

    let roll = secureRandomUnit() * totalWeight;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) {
        return this.state.deck.splice(entry.index, 1)[0] || null;
      }
    }

    const last = weighted[weighted.length - 1];
    return this.state.deck.splice(last.index, 1)[0] || null;
  }

  nextIndex(from, predicate) {
    const n = this.state.players.length;
    if (n <= 0) return -1;
    const start = from >= 0 ? from : 0;
    for (let i = 1; i <= n; i += 1) {
      const idx = (start + i + n) % n;
      if (predicate(this.state.players[idx], idx)) return idx;
    }
    return -1;
  }

  canAct(player) {
    if (!player) return false;
    if (player.folded || player.allIn) return false;
    return player.chips > 0;
  }

  playersInHand() {
    return this.state.players.filter((player) => !player.folded && (player.chips > 0 || player.allIn));
  }

  commitChips(player, amount) {
    const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
    if (safeAmount <= 0 || player.chips <= 0) return 0;
    const committed = Math.min(safeAmount, player.chips);
    player.chips -= committed;
    player.currentBet += committed;
    player.invested += committed;
    this.state.pot += committed;
    if (player.chips === 0) {
      player.allIn = true;
    }
    return committed;
  }

  setPlayerAction(player, label, tone = "") {
    player.lastAction = label;
    player.actionTone = tone;
  }

  postBlind(player, amount, label) {
    const posted = this.commitChips(player, amount);
    if (posted > 0) {
      this.setPlayerAction(player, `${label} ${toCurrency(posted)}`, "strong");
      this.logHistory(`${player.name} posts ${label} ${toCurrency(posted)}.`, "action");

      if (this.hasItem(player, "blind_refund")) {
        const refundScale = this.itemCombinedScale("blind_refund", 0.45, 1.8);
        const refundRate = clamp(BLIND_REFUND_RATE * refundScale, 0.05, 0.65);
        const refund = Math.max(1, Math.floor(posted * refundRate));
        player.chips += refund;
        this.setPlayerAction(player, `${label} ${toCurrency(posted)} +${toCurrency(refund)}`, "strong");
        this.logHistory(`${player.name} blind refund +${toCurrency(refund)}.`, "item");
      }
    }
    return posted;
  }

  startHand() {
    if (!this.hasAtLeastTwoAlive()) {
      this.resetRun();
      this.room.pushStateUpdate({ forceSnapshot: true });
    }

    this.clearTimers();
    this.state.handId += 1;
    this.applyBlindLevelForHand(this.state.handId);

    this.state.handOver = false;
    this.state.gameOver = false;
    this.state.stage = "preflop";
    this.state.currentBet = 0;
    this.state.minRaise = this.state.bigBlind;
    this.state.activePlayerIndex = -1;
    this.state.waitingForHuman = false;
    this.state.actionLock = false;
    this.state.holePeek = false;
    this.state.animatingDeal = false;
    this.state.roundTransitioning = false;
    this.state.autoRunoutInProgress = false;
    this.state.replayInProgress = false;
    this.state.replayEntryId = null;
    this.state.communityCards = [];
    this.state.communityVisible = 0;
    this.state.pot = 0;
    this.state.handWinnerIndices = [];
    this.state.currentHandLog = [];
    this.state.historySeq = 0;
    this.state.markedLensUsedThisHand = false;
    this.state.markedLensReveal = null;
    this.state.riverForesightReveal = null;
    this.state.dealtHoleCounts = this.state.players.map(() => 0);
    this.clearEconomyState();

    this.state.players.forEach((player) => {
      player.wasAliveAtHandStart = player.chips > 0;
      player.handStartChips = player.chips;
      player.hand = [];
      player.folded = player.chips <= 0;
      player.allIn = false;
      player.currentBet = 0;
      player.acted = player.folded;
      player.lastAction = "";
      player.actionTone = "";
      player.showdown = null;
      player.invested = 0;
      player.aggressiveActionsThisHand = 0;
      player.reachedRiverThisHand = false;
      player.riverForesightUsedThisHand = false;
      player.wentAllInThisHand = false;
      player.insuranceRefundedThisHand = false;
    });

    this.state.deck = this.shuffle(this.buildDeck());

    this.state.dealerIndex = this.nextIndex(this.state.dealerIndex, (p) => p.chips > 0);
    if (this.state.dealerIndex < 0) {
      this.state.gameOver = true;
      this.state.handOver = true;
      this.setStatus("No active players.", "Cannot start hand.");
      this.room.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    for (let round = 0; round < 2; round += 1) {
      this.state.players.forEach((player, seatIndex) => {
        if (player.folded) return;
        const card = this.drawCard({ drawKind: "hole", street: "preflop", targetIndex: seatIndex });
        if (!card) return;
        player.hand.push(card);
        this.state.dealtHoleCounts[seatIndex] = Math.min(2, (this.state.dealtHoleCounts[seatIndex] || 0) + 1);
      });
    }

    const sbIndex = this.nextIndex(this.state.dealerIndex, (p) => p.chips > 0);
    const bbIndex = this.nextIndex(sbIndex, (p) => p.chips > 0);
    this.state.smallBlindIndex = sbIndex;
    this.state.bigBlindIndex = bbIndex;

    this.postBlind(this.state.players[sbIndex], this.state.smallBlind, "SB");
    this.postBlind(this.state.players[bbIndex], this.state.bigBlind, "BB");

    this.state.currentBet = Math.max(...this.state.players.map((p) => p.currentBet));
    this.state.minRaise = this.state.bigBlind;

    this.state.players.forEach((player) => {
      player.acted = !this.canAct(player);
    });

    this.logHistory(
      `Hand #${this.state.handId} starts. Level ${this.state.blindLevel + 1} (${toCurrency(this.state.smallBlind)}/${toCurrency(this.state.bigBlind)}).`,
      "street"
    );
    this.logHistory(`Dealer button: ${this.state.players[this.state.dealerIndex].name}.`, "info");

    const opener = this.nextIndex(bbIndex, (p) => this.canAct(p));
    const sbName = this.state.players[sbIndex] ? this.state.players[sbIndex].name : "-";
    const bbName = this.state.players[bbIndex] ? this.state.players[bbIndex].name : "-";
    this.setStatus(
      "Preflop started.",
      `Dealer ${this.state.players[this.state.dealerIndex].name} | SB ${sbName} ${toCurrency(this.state.smallBlind)} | BB ${bbName} ${toCurrency(this.state.bigBlind)}`
    );

    if (opener < 0) {
      this.concludeBettingRound();
      return;
    }

    this.beginTurn(opener);
  }

  startTurnTimer(seatIndex) {
    this.clearTimers();
    this.state.turnTimerSeatIndex = seatIndex;
    this.state.turnTimerRemainingMs = TURN_TIME_MS;

    const startedAt = Date.now();
    this.turnCountdownId = setInterval(() => {
      if (this.state.handOver || this.state.activePlayerIndex !== seatIndex || !this.state.waitingForHuman) {
        this.clearTimers();
        return;
      }
      const remaining = Math.max(0, TURN_TIME_MS - (Date.now() - startedAt));
      this.state.turnTimerRemainingMs = remaining;
      this.room.pushStateUpdate();
      if (remaining <= 0) {
        this.handleTurnTimeout(seatIndex);
      }
    }, 1000);

    this.turnTimerId = setTimeout(() => {
      this.handleTurnTimeout(seatIndex);
    }, TURN_TIME_MS + 60);
  }

  startBotThinkTimer(seatIndex, thinkMs) {
    this.clearTimers();
    const durationMs = Math.max(250, safeInt(thinkMs, NPC_MIN_THINK_MS, 250, 12000));
    this.state.turnTimerSeatIndex = seatIndex;
    this.state.turnTimerRemainingMs = durationMs;

    const startedAt = Date.now();
    this.turnCountdownId = setInterval(() => {
      if (this.state.handOver || this.state.activePlayerIndex !== seatIndex || this.state.waitingForHuman) {
        this.clearTimers();
        return;
      }
      const remaining = Math.max(0, durationMs - (Date.now() - startedAt));
      this.state.turnTimerRemainingMs = remaining;
      this.room.pushStateUpdate();
      if (remaining <= 0 && this.turnCountdownId) {
        clearInterval(this.turnCountdownId);
        this.turnCountdownId = null;
      }
    }, 500);

    this.botThinkId = setTimeout(() => {
      this.botThinkId = null;
      if (this.turnCountdownId) {
        clearInterval(this.turnCountdownId);
        this.turnCountdownId = null;
      }
      if (this.state.handOver) return;
      if (this.state.activePlayerIndex !== seatIndex || this.state.waitingForHuman) return;
      this.botAct(seatIndex);
    }, durationMs);
  }

  handleTurnTimeout(seatIndex) {
    if (this.state.handOver) return;
    if (this.state.activePlayerIndex !== seatIndex) return;
    const player = this.state.players[seatIndex];
    if (!player || !this.canAct(player)) return;

    this.clearTimers();
    this.setStatus(`${player.name} timed out.`, "Auto-folded.");
    this.applyAction(player, "fold", null);
  }

  beginTurn(index) {
    if (this.state.handOver) return;

    const player = this.state.players[index];
    if (!this.canAct(player)) {
      const next = this.nextIndex(index, (p) => this.canAct(p));
      if (next < 0) {
        this.concludeBettingRound();
      } else {
        this.beginTurn(next);
      }
      return;
    }

    this.state.activePlayerIndex = index;
    const isHumanSeat = this.room.isSeatControlled(index);
    this.state.waitingForHuman = isHumanSeat;

    const toCall = Math.max(0, this.state.currentBet - player.currentBet);
    if (isHumanSeat) {
      const hint = toCall > 0 ? `To call: ${toCurrency(toCall)}` : "No bet to call.";
      this.setStatus(`${player.name}'s turn.`, hint);
      this.startTurnTimer(index);
      this.room.pushStateUpdate();
      return;
    }

    const delay = randomBetween(NPC_MIN_THINK_MS, NPC_MAX_THINK_MS);
    this.setStatus(`${player.name} is thinking...`, "");
    this.startBotThinkTimer(index, delay);
    this.room.pushStateUpdate();
  }

  estimateStrength(player) {
    if (this.state.stage === "preflop") {
      const [a, b] = player.hand;
      if (!a || !b) return 0.3;
      let score = 0.15;
      const high = Math.max(a.rank, b.rank);
      const low = Math.min(a.rank, b.rank);
      const pair = a.rank === b.rank;
      const suited = a.suit === b.suit;
      const gap = high - low;
      score += ((high - 2) / 16) * 0.34;
      if (pair) score += 0.33;
      if (suited) score += 0.08;
      if (gap <= 2) score += 0.08;
      if (high >= 11 && low >= 10) score += 0.12;
      return clamp(score, 0.08, 0.97);
    }

    const evalResult = evaluateSeven([...player.hand, ...this.state.communityCards]);
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
    return clamp(score, 0.06, 0.995);
  }

  botRaiseTarget(player, strength) {
    const maxTotal = player.currentBet + player.chips;
    if (maxTotal <= this.state.currentBet) return this.state.currentBet;

    const minTotal = this.state.currentBet === 0 ? this.state.bigBlind : this.state.currentBet + this.state.minRaise;
    const pressure = clamp(0.22 + strength * 0.72, 0.18, 1.2);
    let target = this.state.currentBet + Math.max(this.state.bigBlind, Math.round((this.state.pot * pressure) / this.state.bigBlind) * this.state.bigBlind);

    if (this.state.currentBet === 0) {
      target = Math.max(target, this.state.bigBlind * 2);
    }

    target = Math.max(minTotal, Math.min(target, maxTotal));
    return target;
  }

  botAct(index) {
    const player = this.state.players[index];
    if (!player || this.state.handOver || !this.canAct(player)) return;

    if (this.state.stage === "preflop" && this.canUseSleightOfHand(player, index)) {
      if (secureRandomUnit() < 0.42) {
        this.useSleightOfHandForSeat(index);
      }
    }
    if (this.canUseRiverForesight(player)) {
      const shouldUseForesight = (this.state.stage === "turn" || this.state.stage === "flop") && secureRandomUnit() < 0.28;
      if (shouldUseForesight) {
        this.useRiverForesightForSeat(index);
      }
    }

    const toCall = Math.max(0, this.state.currentBet - player.currentBet);
    const strength = this.estimateStrength(player);
    const roll = secureRandomUnit();

    if (toCall > 0) {
      if (strength < 0.28 && roll < 0.64) {
        this.applyAction(player, "fold", null);
        return;
      }
      if (strength > 0.74 && player.chips > toCall + this.state.bigBlind && roll < 0.56) {
        this.applyAction(player, "raise", this.botRaiseTarget(player, strength));
        return;
      }
      this.applyAction(player, "checkcall", null);
      return;
    }

    if (strength > 0.67 && player.chips > this.state.bigBlind && roll < 0.5) {
      this.applyAction(player, "raise", this.botRaiseTarget(player, strength));
      return;
    }

    this.applyAction(player, "checkcall", null);
  }

  processActionFromSeat(seatIndex, action, raiseTo = null) {
    if (this.state.handOver) return { ok: false, message: "Hand is over." };
    if (this.state.activePlayerIndex !== seatIndex) return { ok: false, message: "Not your turn." };
    if (!this.state.waitingForHuman) return { ok: false, message: "Seat is currently bot-controlled." };

    const player = this.state.players[seatIndex];
    if (!player || !this.canAct(player)) return { ok: false, message: "Player cannot act." };

    const ok = this.applyAction(player, action, raiseTo);
    if (!ok) return { ok: false, message: "Invalid action." };
    return { ok: true };
  }

  applyAction(player, action, raiseTo = null) {
    if (this.state.handOver) return false;
    if (!this.canAct(player)) return false;

    const prevBet = this.state.currentBet;
    const toCall = Math.max(0, this.state.currentBet - player.currentBet);
    const prevPot = this.state.pot;
    let reopened = false;
    let didAllIn = false;
    let actionCue = "check";

    if (action === "fold") {
      player.folded = true;
      player.acted = true;
      this.setPlayerAction(player, "Fold", "danger");
      this.logHistory(`${player.name} folds.`, "action");
      actionCue = "fold";
    } else if (action === "checkcall") {
      if (toCall === 0) {
        player.acted = true;
        this.setPlayerAction(player, "Check", "");
        this.logHistory(`${player.name} checks.`, "action");
        actionCue = "check";
      } else {
        const paid = this.commitChips(player, toCall);
        player.acted = true;
        if (paid < toCall) {
          this.setPlayerAction(player, `All-in ${toCurrency(player.currentBet)}`, "strong");
          this.logHistory(`${player.name} goes all-in for ${toCurrency(player.currentBet)}.`, "action");
          didAllIn = true;
          actionCue = "allin";
        } else {
          this.setPlayerAction(player, `Call ${toCurrency(paid)}`, "");
          this.logHistory(`${player.name} calls ${toCurrency(paid)}.`, "action");
          actionCue = "call";
        }
      }
    } else if (action === "raise") {
      const maxTotal = player.currentBet + player.chips;
      if (maxTotal <= this.state.currentBet) return false;

      const minTotal = this.state.currentBet === 0 ? this.state.bigBlind : this.state.currentBet + this.state.minRaise;
      const requested = Number.isFinite(raiseTo) ? Math.floor(raiseTo) : minTotal;
      let target = Math.min(Math.max(requested, player.currentBet), maxTotal);
      const isAllIn = target === maxTotal;

      if (target < minTotal && !isAllIn) return false;
      if (target <= this.state.currentBet && !isAllIn) return false;
      if (target <= player.currentBet) return false;

      const paid = this.commitChips(player, target - player.currentBet);
      if (paid <= 0) return false;

      target = player.currentBet;
      if (target > this.state.currentBet) {
        const raiseSize = target - prevBet;
        this.state.currentBet = target;
        if (prevBet === 0) {
          this.state.minRaise = Math.max(this.state.bigBlind, raiseSize);
          reopened = true;
        } else if (raiseSize >= this.state.minRaise) {
          this.state.minRaise = raiseSize;
          reopened = true;
        }
      }

      player.acted = true;
      if (target <= prevBet) {
        this.setPlayerAction(player, `Call ${toCurrency(toCall)}`, "");
        this.logHistory(`${player.name} calls ${toCurrency(toCall)}.`, "action");
        actionCue = "call";
      } else if (player.allIn) {
        this.setPlayerAction(player, `All-in ${toCurrency(target)}`, "strong");
        this.logHistory(`${player.name} shoves all-in to ${toCurrency(target)}.`, "action");
        didAllIn = true;
        actionCue = "allin";
      } else if (prevBet === 0) {
        this.setPlayerAction(player, `Bet ${toCurrency(target)}`, "strong");
        this.logHistory(`${player.name} bets to ${toCurrency(target)}.`, "action");
        actionCue = "bet";
      } else {
        this.setPlayerAction(player, `Raise ${toCurrency(target)}`, "strong");
        this.logHistory(`${player.name} raises to ${toCurrency(target)}.`, "action");
        actionCue = "raise";
      }
    } else {
      return false;
    }

    if (reopened) {
      this.logHistory(`Action re-opened by ${player.name}.`, "info");
      this.state.players.forEach((p) => {
        if (p !== player && this.canAct(p)) {
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

    this.clearTimers();
    this.state.waitingForHuman = false;

    if (didAllIn && this.state.activePlayerIndex >= 0) {
      this.setStatus(`${player.name} shoves all-in!`, `${toCurrency(this.state.pot)} in the pot.`);
    }

    if (this.checkSinglePlayerWin()) {
      return true;
    }

    if (this.isBettingRoundComplete()) {
      this.concludeBettingRound();
      return true;
    }

    const currentIdx = this.state.players.indexOf(player);
    const next = this.nextIndex(currentIdx, (p) => this.canAct(p));
    if (next < 0) {
      this.concludeBettingRound();
      return true;
    }

    const contributed = Math.max(0, this.state.pot - prevPot);
    if (contributed > 0) {
      this.setStatus(`${player.name} acted.`, `Pot +${toCurrency(contributed)} (total ${toCurrency(this.state.pot)}).`);
    }

    this.beginTurn(next);
    return true;
  }

  isBettingRoundComplete() {
    const active = this.state.players.filter((player) => !player.folded);
    const eligible = active.filter((player) => this.canAct(player));
    if (eligible.length === 0) return true;
    return eligible.every((player) => player.acted && player.currentBet === this.state.currentBet);
  }

  checkSinglePlayerWin() {
    const contenders = this.playersInHand();
    if (contenders.length !== 1) return false;

    const winner = contenders[0];
    const winnerIndex = this.state.players.indexOf(winner);
    const baseWon = this.state.pot;
    this.state.pot = 0;
    const award = this.resolvePayoutAward({
      player: winner,
      playerIndex: winnerIndex,
      baseShare: baseWon,
      splitWinnerIndices: null
    });
    const won = award.total;
    winner.chips += won;
    this.state.handWinnerIndices = [winnerIndex];
    this.setPlayerAction(winner, `Won ${toCurrency(won)}`, "strong");
    const labelPart = Array.isArray(award.itemLabels) && award.itemLabels.length > 0 ? ` [${award.itemLabels.join(" · ")}]` : "";
    this.logHistory(
      `${winner.name} wins uncontested pot ${toCurrency(baseWon)} -> ${toCurrency(won)}.${labelPart}`,
      "showdown"
    );
    this.finishHand();
    return true;
  }

  resetStreetBets() {
    this.state.players.forEach((player) => {
      player.currentBet = 0;
      if (!player.folded && !player.allIn) {
        player.acted = false;
      } else {
        player.acted = true;
      }
    });
    this.state.currentBet = 0;
    this.state.minRaise = this.state.bigBlind;
  }

  revealCommunity(count, street) {
    for (let i = 0; i < count; i += 1) {
      const card = street ? this.drawCard({ drawKind: "community", street }) : this.drawCard();
      if (!card) break;
      this.state.communityCards.push(card);
    }
    this.state.communityVisible = this.state.communityCards.length;
  }

  concludeBettingRound() {
    if (this.state.handOver) return;
    this.clearTimers();
    this.state.activePlayerIndex = -1;
    this.state.waitingForHuman = false;

    if (this.state.stage === "river") {
      this.showdown();
      return;
    }

    if (this.state.stage === "preflop") {
      this.state.communityCards.push(
        this.drawCommunityCardForStreet("flop"),
        this.drawCard({ drawKind: "community", street: "flop" }),
        this.drawCard({ drawKind: "community", street: "flop" })
      );
      this.state.communityCards = this.state.communityCards.filter(Boolean);
      this.state.communityVisible = this.state.communityCards.length;
      this.state.stage = "flop";
      this.logHistory(`Flop: ${this.state.communityCards.slice(0, 3).map((c) => cardText(c)).join(" ")}`, "street");
    } else if (this.state.stage === "flop") {
      const turnCard = this.drawCommunityCardForStreet("turn");
      if (turnCard) {
        this.state.communityCards.push(turnCard);
        this.state.communityVisible = this.state.communityCards.length;
      }
      this.state.stage = "turn";
      const card = this.state.communityCards[3];
      this.logHistory(`Turn: ${card ? cardText(card) : "-"}`, "street");
    } else if (this.state.stage === "turn") {
      const riverCard = this.drawCommunityCardForStreet("river");
      if (riverCard) {
        this.state.communityCards.push(riverCard);
        this.state.communityVisible = this.state.communityCards.length;
      }
      this.state.stage = "river";
      const card = this.state.communityCards[4];
      this.logHistory(`River: ${card ? cardText(card) : "-"}`, "street");
    }

    this.state.players.forEach((player) => {
      if (!player || player.folded) return;
      if (this.state.stage === "river" && player.wasAliveAtHandStart) {
        player.reachedRiverThisHand = true;
      }
    });

    this.resetStreetBets();
    const opener = this.nextIndex(this.state.dealerIndex, (player) => this.canAct(player));
    if (opener < 0) {
      this.concludeBettingRound();
      return;
    }

    this.logHistory(`${this.state.stage.toUpperCase()} action starts.`, "street");
    this.beginTurn(opener);
  }

  buildSidePots() {
    const layers = this.state.players
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
          eligible: contributors.filter((index) => !this.state.players[index].folded)
        });
      }
      previous = level;
      while (layers.length > 0 && layers[0].amount === level) {
        layers.shift();
      }
    }

    return pots;
  }

  showdown() {
    const contenders = this.playersInHand();
    if (contenders.length === 0) {
      this.state.handWinnerIndices = [];
      this.finishHand();
      return;
    }

    const evaluated = contenders.map((player) => {
      const result = evaluateSeven([...player.hand, ...this.state.communityCards]);
      player.showdown = result;
      return { player, result, index: this.state.players.indexOf(player) };
    });

    evaluated.forEach((entry) => {
      const [a, b] = entry.player.hand;
      const cards = a && b ? `${a.rank}${a.suit} ${b.rank}${b.suit}` : "-- --";
      this.logHistory(`${entry.player.name} shows ${cards} (${entry.result.name}).`, "showdown");
    });

    let sidePots = this.buildSidePots();
    if (sidePots.length === 0 && this.state.pot > 0) {
      sidePots = [{
        amount: this.state.pot,
        contributors: this.state.players.map((_, index) => index),
        eligible: evaluated.map((entry) => entry.index)
      }];
    }

    const payouts = new Map();
    const payoutDetails = new Map();
    const splitWinnerIndices = new Set();
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
      const orderedWinnerIndices = sidePotOrderFromDealer(
        this.state.dealerIndex,
        winners.map((entry) => entry.index),
        this.state.players.length
      );

      const each = Math.floor(pot.amount / winners.length);
      let remainder = pot.amount - each * winners.length;
      orderedWinnerIndices.forEach((index) => {
        const chip = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder -= 1;
        const baseShare = each + chip;
        const entry = evaluated.find((v) => v.index === index);
        if (!entry) return;
        const award = this.resolvePayoutAward({
          player: entry.player,
          playerIndex: index,
          baseShare,
          splitWinnerIndices
        });
        payouts.set(index, (payouts.get(index) || 0) + award.total);
        if (!payoutDetails.has(index)) {
          payoutDetails.set(index, {
            base: 0,
            allInApplied: 0,
            itemApplied: 0,
            itemFlat: 0,
            itemLabels: [],
            total: 0
          });
        }
        const detail = payoutDetails.get(index);
        detail.base += award.baseShare;
        detail.allInApplied += award.allInApplied;
        detail.itemApplied += award.itemApplied;
        detail.itemFlat += award.itemFlatBonus;
        if (Array.isArray(award.itemLabels) && award.itemLabels.length > 0) {
          detail.itemLabels.push(...award.itemLabels);
        }
        detail.total += award.total;
      });

      const label = potIndex === 0 ? "Main pot" : `Side pot ${potIndex}`;
      const winnerNames = winners.map((entry) => entry.player.name).join(", ");
      this.logHistory(`${label} ${toCurrency(pot.amount)} -> ${winnerNames} (${best.result.name}).`, "showdown");
    });

    const winnerIndices = [...payouts.keys()];
    winnerIndices.forEach((index) => {
      const player = this.state.players[index];
      const won = payouts.get(index) || 0;
      player.chips += won;
      this.setPlayerAction(player, `Won ${toCurrency(won)}`, "strong");

      const detail = payoutDetails.get(index);
      if (!detail) return;
      const allInPart = detail.allInApplied !== detail.base ? `, all-in ${toCurrency(detail.allInApplied)}` : "";
      const itemMultPart = detail.itemApplied !== detail.allInApplied ? `, item-mult ${toCurrency(detail.itemApplied)}` : "";
      const itemFlatPart = detail.itemFlat > 0 ? `, item +${toCurrency(detail.itemFlat)}` : "";
      const labelPart = detail.itemLabels.length > 0 ? ` [${[...new Set(detail.itemLabels)].join(" · ")}]` : "";
      this.logHistory(
        `${player.name} payout ${toCurrency(won)} (base ${toCurrency(detail.base)}${allInPart}${itemMultPart}${itemFlatPart})${labelPart}.`,
        "showdown"
      );
    });

    this.state.handWinnerIndices = winnerIndices;
    this.applyInsuranceRefunds();
    this.state.pot = 0;
    this.setStatus("Showdown complete.", winnerIndices.length > 0 ? `Winners: ${winnerIndices.map((idx) => this.state.players[idx].name).join(", ")}` : "No winners");
    this.finishHand();
  }

  finishHand() {
    this.clearTimers();
    this.state.handOver = true;
    this.state.waitingForHuman = false;
    this.state.activePlayerIndex = -1;
    this.state.turnTimerSeatIndex = -1;
    this.state.turnTimerRemainingMs = 0;
    this.state.communityVisible = this.state.communityCards.length;
    this.state.dealtHoleCounts = this.state.players.map((player) => player.hand.length);
    this.state.lastHandLog = this.state.currentHandLog.slice();
    this.applyBountyHunterRewardsForHandBusts();

    const alive = this.state.players.filter((player) => player.chips > 0).length;
    if (alive <= 1) {
      this.state.gameOver = true;
      this.setStatus("Run ended.", "Only one stack remains. Host can start again.");
    } else {
      const openedEconomy = this.beginPostHandEconomyFlow();
      if (!openedEconomy) {
        this.setStatus("Hand complete.", "Host can start next hand.");
      }
    }

    this.room.pushStateUpdate({ forceSnapshot: true });
  }
}

function buildDefaultRateState() {
  return {
    windowStart: Date.now(),
    countInWindow: 0,
    actionTimestamps: [],
    ackTimestamps: []
  };
}

function logEvent(kind, payload = {}) {
  const line = {
    ts: new Date().toISOString(),
    kind,
    ...payload
  };
  console.log(JSON.stringify(line));
}

function maskGameForSeat(gameState, seatIndex) {
  const cloned = deepClone(gameState);
  if (!cloned || typeof cloned !== "object") return cloned;
  if (!Array.isArray(cloned.players)) return cloned;

  const isHandOver = !!cloned.handOver;
  const economyOwnerSeat = Number.isInteger(cloned.economyOwnerSeatIndex) ? cloned.economyOwnerSeatIndex : -1;
  const lensReveal = cloned.markedLensReveal && typeof cloned.markedLensReveal === "object"
    ? cloned.markedLensReveal
    : null;
  cloned.players.forEach((player, index) => {
    if (!player || !Array.isArray(player.hand)) return;
    player.isHuman = index === seatIndex;
    const canReveal = isHandOver || !!player.showdown || index === seatIndex;
    if (canReveal) return;
    player.hand = player.hand.map((card, cardIndex) => {
      const revealByLens = !!(
        lensReveal &&
        lensReveal.handId === cloned.handId &&
        lensReveal.ownerSeatIndex === seatIndex &&
        lensReveal.targetIndex === index &&
        lensReveal.cardIndex === cardIndex
      );
      if (revealByLens) {
        return card;
      }
      return { rank: 2, suit: "S", isMasked: true };
    });
  });

  if (economyOwnerSeat >= 0 && economyOwnerSeat !== seatIndex) {
    cloned.currentLoot = null;
  }

  const seatShopMap = cloned.shopBySeat && typeof cloned.shopBySeat === "object" ? cloned.shopBySeat : {};
  const seatShop = seatShopMap[String(seatIndex)];
  const hasSeatShop = !!(seatShop && seatShop.visible);
  cloned.shopVisible = hasSeatShop;
  cloned.shopOffers = hasSeatShop && Array.isArray(seatShop.offers) ? seatShop.offers : [];
  cloned.shopRerollsLeft = hasSeatShop ? safeInt(seatShop.rerollsLeft, 0, 0, 20) : 0;
  delete cloned.shopBySeat;

  return cloned;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const requestIp = getRequestIp(request);

    if (url.pathname === "/api/multiplayer/health") {
      return Response.json({ ok: true, mode: "authoritative" });
    }

    if (url.pathname === "/api/multiplayer/metrics") {
      const adminToken = String(env.ADMIN_METRICS_TOKEN || "").trim();
      if (adminToken) {
        const provided =
          String(request.headers.get("x-admin-token") || "").trim() ||
          String(url.searchParams.get("token") || "").trim();
        if (provided !== adminToken) {
          return new Response("Not found", { status: 404 });
        }
      }
      return Response.json({ ok: true, metrics: globalMetrics });
    }

    if (url.pathname === "/api/multiplayer/queue") {
      if (!isAllowedRequestOrigin(request, env)) {
        return new Response("Forbidden origin", { status: 403 });
      }
      if (!allowRequestRate(requestIp, "queue", QUEUE_REQUEST_LIMIT_PER_WINDOW)) {
        globalMetrics.rateLimited += 1;
        return new Response("Too Many Requests", { status: 429 });
      }
      const id = env.MATCHMAKER.idFromName("global-quickmatch-v1");
      const stub = env.MATCHMAKER.get(id);
      return stub.fetch(request);
    }

    if (url.pathname === "/api/multiplayer/ws") {
      if (!isAllowedRequestOrigin(request, env)) {
        return new Response("Forbidden origin", { status: 403 });
      }
      if (!allowRequestRate(requestIp, "ws_upgrade", WS_UPGRADE_LIMIT_PER_WINDOW)) {
        globalMetrics.rateLimited += 1;
        return new Response("Too Many Requests", { status: 429 });
      }
      if ((request.headers.get("Upgrade") || "").toLowerCase() !== "websocket") {
        return new Response("Expected websocket upgrade", { status: 426 });
      }

      const roomCode = normalizeRoomCode(url.searchParams.get("room"));
      if (!roomCode) {
        return new Response("Invalid room code. Use 4-8 alphanumeric chars.", { status: 400 });
      }

      globalMetrics.websocketUpgrades += 1;
      const id = env.POKER_ROOM.idFromName(roomCode);
      const stub = env.POKER_ROOM.get(id);
      return stub.fetch(request);
    }

    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Asset binding not configured.", { status: 500 });
  }
};

export class MatchmakerQueue {
  constructor(state) {
    this.state = state;
    this.entries = new Map();
  }

  cleanup() {
    const now = Date.now();
    const remove = [];

    for (const [ticket, entry] of this.entries.entries()) {
      if (!entry || typeof entry !== "object") {
        remove.push(ticket);
        continue;
      }

      if (entry.status === "matched") {
        if (now - safeInt(entry.matchedAt, now) > MATCH_QUEUE_MATCH_TTL_MS) {
          remove.push(ticket);
        }
        continue;
      }

      if (now - safeInt(entry.lastSeen, now) > MATCH_QUEUE_WAIT_TTL_MS) {
        remove.push(ticket);
      }
    }

    remove.forEach((ticket) => this.entries.delete(ticket));
  }

  oldestWaitingTicket() {
    let picked = null;
    for (const [ticket, entry] of this.entries.entries()) {
      if (!entry || entry.status !== "waiting") continue;
      if (!picked || safeInt(entry.createdAt, Number.MAX_SAFE_INTEGER) < safeInt(picked.entry.createdAt, Number.MAX_SAFE_INTEGER)) {
        picked = { ticket, entry };
      }
    }
    return picked;
  }

  waitingPayload(entry) {
    const waitSec = Math.max(0, Math.floor((Date.now() - safeInt(entry.createdAt, Date.now())) / 1000));
    return {
      ok: true,
      status: "waiting",
      ticket: entry.ticket,
      waitSeconds: waitSec
    };
  }

  matchedPayload(entry) {
    return {
      ok: true,
      status: "matched",
      ticket: entry.ticket,
      roomCode: entry.roomCode,
      role: entry.role
    };
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/multiplayer/queue") {
      return new Response("Not found", { status: 404 });
    }

    this.cleanup();

    if (request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch (error) {
        body = {};
      }

      const name = normalizePlayerName(body && body.name);
      const ticket = String((body && body.ticket) || "").trim();
      if (ticket) {
        const existing = this.entries.get(ticket);
        if (existing) {
          existing.lastSeen = Date.now();
          return Response.json(existing.status === "matched" ? this.matchedPayload(existing) : this.waitingPayload(existing));
        }
      }

      const waiting = this.oldestWaitingTicket();
      if (waiting) {
        const roomCode = waiting.entry.roomCode || randomRoomCode(6);
        waiting.entry.status = "matched";
        waiting.entry.roomCode = roomCode;
        waiting.entry.role = "host";
        waiting.entry.matchedAt = Date.now();
        waiting.entry.lastSeen = Date.now();

        const ticketId = crypto.randomUUID();
        const challenger = {
          ticket: ticketId,
          status: "matched",
          role: "client",
          roomCode,
          name,
          createdAt: Date.now(),
          lastSeen: Date.now(),
          matchedAt: Date.now()
        };
        this.entries.set(ticketId, challenger);

        logEvent("quickmatch_matched", { roomCode });
        return Response.json(this.matchedPayload(challenger));
      }

      const newTicket = crypto.randomUUID();
      const entry = {
        ticket: newTicket,
        status: "waiting",
        role: "pending",
        roomCode: "",
        name,
        createdAt: Date.now(),
        lastSeen: Date.now(),
        matchedAt: 0
      };
      this.entries.set(newTicket, entry);
      logEvent("quickmatch_waiting", { ticket: newTicket });
      return Response.json(this.waitingPayload(entry), { status: 202 });
    }

    if (request.method === "GET") {
      const ticket = String(url.searchParams.get("ticket") || "").trim();
      if (!ticket) {
        return Response.json({ ok: false, message: "Missing ticket." }, { status: 400 });
      }
      const entry = this.entries.get(ticket);
      if (!entry) {
        return Response.json({ ok: false, status: "expired", message: "Queue ticket expired." }, { status: 404 });
      }
      entry.lastSeen = Date.now();
      return Response.json(entry.status === "matched" ? this.matchedPayload(entry) : this.waitingPayload(entry));
    }

    if (request.method === "DELETE") {
      const ticket = String(url.searchParams.get("ticket") || "").trim();
      if (!ticket) {
        return Response.json({ ok: false, message: "Missing ticket." }, { status: 400 });
      }
      const exists = this.entries.has(ticket);
      if (exists) {
        this.entries.delete(ticket);
      }
      return Response.json({ ok: true, cancelled: exists });
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
}

export class PokerRoom {
  constructor(state) {
    this.state = state;
    this.roomCode = "";
    this.seq = 1;
    this.hostToken = "";
    this.clients = new Map();
    this.sessions = new Map();
    this.engine = new HoldemEngine(this);
  }

  getSeatDisplayName(seatIndex, fallback) {
    for (const session of this.sessions.values()) {
      if (session.seatIndex !== seatIndex) continue;
      if (session.name) return session.name;
    }
    return fallback;
  }

  isSeatControlled(seatIndex) {
    for (const client of this.clients.values()) {
      if (client.seatIndex === seatIndex) return true;
    }
    return false;
  }

  findSessionByToken(token) {
    if (!token) return null;
    return this.sessions.get(token) || null;
  }

  purgeStaleSessions() {
    const now = Date.now();
    const toDelete = [];
    for (const [token, session] of this.sessions.entries()) {
      if (session.connectedClientId) continue;
      if (now - session.lastSeen <= SESSION_TTL_MS) continue;
      toDelete.push(token);
    }

    toDelete.forEach((token) => {
      const session = this.sessions.get(token);
      if (!session) return;
      if (this.hostToken === token) {
        this.hostToken = "";
      }
      this.sessions.delete(token);
    });

    this.ensureHostToken();
  }

  ensureHostToken() {
    const host = this.sessions.get(this.hostToken);
    if (host) return;

    let chosen = null;
    for (const session of this.sessions.values()) {
      if (!chosen) chosen = session;
      if (session.connectedClientId && (!chosen.connectedClientId || session.connectedAt < chosen.connectedAt)) {
        chosen = session;
      }
    }

    this.hostToken = chosen ? chosen.token : "";
    for (const session of this.sessions.values()) {
      session.isHost = session.token === this.hostToken;
    }
  }

  getHostClientId() {
    if (!this.hostToken) return "";
    const session = this.sessions.get(this.hostToken);
    if (!session || !session.connectedClientId) return "";
    return session.connectedClientId;
  }

  getHostSeatIndex() {
    if (!this.hostToken) return HOST_SEAT_INDEX;
    const session = this.sessions.get(this.hostToken);
    if (!session || !Number.isInteger(session.seatIndex) || session.seatIndex < 0) {
      return HOST_SEAT_INDEX;
    }
    return session.seatIndex;
  }

  assignSeat(isHost) {
    if (isHost) return HOST_SEAT_INDEX;

    const occupied = new Set();
    const now = Date.now();
    for (const session of this.sessions.values()) {
      if (session.seatIndex < 0) continue;
      const reserved = session.connectedClientId || now - session.lastSeen <= SESSION_TTL_MS;
      if (!reserved) continue;
      occupied.add(session.seatIndex);
    }

    for (const seat of REMOTE_SEAT_ORDER) {
      if (!occupied.has(seat)) return seat;
    }

    return -1;
  }

  listMembers() {
    return [...this.clients.values()]
      .sort((a, b) => a.connectedAt - b.connectedAt)
      .map((client) => ({
        id: client.id,
        name: client.name,
        seatIndex: client.seatIndex,
        isHost: client.sessionToken === this.hostToken
      }));
  }

  serializeSeatAssignments() {
    const result = {};
    for (const client of this.clients.values()) {
      if (!Number.isInteger(client.seatIndex) || client.seatIndex < 0) continue;
      result[String(client.seatIndex)] = client.id;
    }
    return result;
  }

  sendToClient(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.ws) return;
    try {
      client.ws.send(JSON.stringify(payload));
    } catch (error) {
      // Ignore disconnected socket write errors.
    }
  }

  sendError(clientId, message, code = "bad_request") {
    globalMetrics.errorsSent += 1;
    this.sendToClient(clientId, {
      type: "error",
      code,
      message: String(message || "Unknown error")
    });
  }

  trimSessionHistory(session) {
    if (!Array.isArray(session.history)) {
      session.history = [];
      return;
    }
    if (session.history.length > HISTORY_LIMIT) {
      session.history.splice(0, session.history.length - HISTORY_LIMIT);
    }
  }

  pushStateUpdate({ forceSnapshot = false } = {}) {
    this.engine.syncRosterFromRoom();

    const outbound = [];
    const statusMain = this.engine.statusMain;
    const statusSub = this.engine.statusSub;

    for (const client of this.clients.values()) {
      const session = this.sessions.get(client.sessionToken);
      if (!session) continue;

      const publicState = maskGameForSeat(this.engine.state, client.seatIndex);
      const previous = session.lastPublicState;

      if (forceSnapshot || !previous) {
        outbound.push({
          clientId: client.id,
          session,
          message: {
            type: "snapshot",
            game: publicState,
            statusMain,
            statusSub
          },
          state: publicState,
          snapshot: true
        });
        continue;
      }

      const patch = buildPatch(previous, publicState);
      const statusChanged = session.lastStatusMain !== statusMain || session.lastStatusSub !== statusSub;
      if (Object.keys(patch).length === 0 && !statusChanged) {
        continue;
      }

      outbound.push({
        clientId: client.id,
        session,
        message: {
          type: "delta",
          patch,
          statusMain,
          statusSub
        },
        state: publicState,
        snapshot: false
      });
    }

    if (outbound.length === 0) return;

    this.seq += 1;

    outbound.forEach((entry) => {
      entry.message.seq = this.seq;
      this.sendToClient(entry.clientId, entry.message);

      entry.session.lastPublicState = entry.state;
      entry.session.lastStatusMain = statusMain;
      entry.session.lastStatusSub = statusSub;
      entry.session.history.push(deepClone(entry.message));
      this.trimSessionHistory(entry.session);

      if (entry.snapshot) {
        globalMetrics.snapshotsSent += 1;
      } else {
        globalMetrics.deltasSent += 1;
      }
    });
  }

  sendRecoveryState(clientId, lastAck) {
    const client = this.clients.get(clientId);
    if (!client) return;
    const session = this.sessions.get(client.sessionToken);
    if (!session) return;

    const ack = safeInt(lastAck, 0, 0, Number.MAX_SAFE_INTEGER);
    const history = Array.isArray(session.history) ? session.history : [];
    const oldest = history.length > 0 ? safeInt(history[0].seq, 0) : 0;

    if (ack > 0 && history.length > 0 && oldest <= ack + 1) {
      const missing = history.filter((entry) => safeInt(entry.seq, 0) > ack);
      if (missing.length > 0) {
        missing.forEach((entry) => {
          this.sendToClient(clientId, entry);
          if (entry.type === "snapshot") globalMetrics.snapshotsSent += 1;
          if (entry.type === "delta") globalMetrics.deltasSent += 1;
        });
        return;
      }
    }

    const fullState = maskGameForSeat(this.engine.state, client.seatIndex);
    const snapshot = {
      type: "snapshot",
      seq: this.seq,
      game: fullState,
      statusMain: this.engine.statusMain,
      statusSub: this.engine.statusSub
    };
    this.sendToClient(clientId, snapshot);
    globalMetrics.snapshotsSent += 1;

    session.lastPublicState = fullState;
    session.lastStatusMain = this.engine.statusMain;
    session.lastStatusSub = this.engine.statusSub;
  }

  broadcastRoomUpdate() {
    const members = this.listMembers();
    const seatAssignments = this.serializeSeatAssignments();
    const hostClientId = this.getHostClientId();

    for (const client of this.clients.values()) {
      const session = this.sessions.get(client.sessionToken);
      this.sendToClient(client.id, {
        type: "room_update",
        roomCode: this.roomCode,
        hostClientId,
        yourRole: session && session.isHost ? "host" : "client",
        yourSeatIndex: client.seatIndex,
        members,
        seatAssignments
      });
    }
  }

  allowClientMessage(client, kind = "generic") {
    if (!client || !client.rate) return false;

    const now = Date.now();
    const rate = client.rate;

    if (now - rate.windowStart > REQUEST_RATE_WINDOW_MS) {
      rate.windowStart = now;
      rate.countInWindow = 0;
    }

    rate.countInWindow += 1;
    if (rate.countInWindow > 70) {
      globalMetrics.rateLimited += 1;
      return false;
    }

    if (kind === "action") {
      rate.actionTimestamps = rate.actionTimestamps.filter((ts) => now - ts < 2000);
      if (rate.actionTimestamps.length >= 12) {
        globalMetrics.rateLimited += 1;
        return false;
      }
      rate.actionTimestamps.push(now);
    }

    if (kind === "ack") {
      if (!Array.isArray(rate.ackTimestamps)) {
        rate.ackTimestamps = [];
      }
      rate.ackTimestamps = rate.ackTimestamps.filter((ts) => now - ts < 2000);
      if (rate.ackTimestamps.length >= 45) {
        globalMetrics.rateLimited += 1;
        return false;
      }
      rate.ackTimestamps.push(now);
    }

    return true;
  }

  processCommand(client, payload) {
    if (!client) return;

    const session = this.sessions.get(client.sessionToken);
    if (!session) {
      this.sendError(client.id, "Session unavailable.", "forbidden");
      return;
    }

    const command = String((payload && payload.command) || payload || "");
    const itemIdRaw = payload && typeof payload === "object" ? payload.itemId : "";
    const itemId = String(itemIdRaw || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    const hostOnlyCommands = new Set(["start_game", "next_hand", "restart_run"]);
    const hostOnly = hostOnlyCommands.has(command);

    if (hostOnly && !session.isHost) {
      this.sendError(client.id, "Only host can run this command.", "forbidden");
      return;
    }

    globalMetrics.commandsReceived += 1;
    logEvent("command", {
      room: this.roomCode,
      clientId: client.id,
      seatIndex: client.seatIndex,
      command,
      itemId: itemId || undefined
    });

    if (command === "start_game") {
      if (this.engine.state.handId > 0 || !this.engine.state.handOver) {
        this.sendError(client.id, "Game already started. Use next hand.", "invalid_state");
        return;
      }
      this.engine.startHand();
      this.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    if (command === "next_hand") {
      if (!this.engine.state.handOver) {
        this.sendError(client.id, "Current hand is still in progress.", "invalid_state");
        return;
      }
      if (this.engine.isEconomyOpen()) {
        this.sendError(client.id, "Resolve loot/shop before starting next hand.", "invalid_state");
        return;
      }
      this.engine.startHand();
      this.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    if (command === "restart_run") {
      if (!this.engine.state.handOver) {
        this.sendError(client.id, "Cannot restart during an active hand.", "invalid_state");
        return;
      }
      this.engine.resetRun();
      this.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    if (command === "loot_equip" || command === "loot_sell") {
      const result = this.engine.resolveLootDecision(command === "loot_equip" ? "equip" : "sell", client.seatIndex);
      if (!result.ok) {
        this.sendError(client.id, result.message || "Loot action rejected.", "invalid_state");
        return;
      }
      this.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    if (command === "shop_buy") {
      if (!itemId || !ITEM_DB[itemId]) {
        this.sendError(client.id, "Invalid shop item.", "bad_command");
        return;
      }
      const result = this.engine.buyShopOffer(itemId, client.seatIndex);
      if (!result.ok) {
        this.sendError(client.id, result.message || "Shop purchase rejected.", "invalid_state");
        return;
      }
      this.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    if (command === "shop_reroll") {
      const result = this.engine.rerollShopOffers(client.seatIndex);
      if (!result.ok) {
        this.sendError(client.id, result.message || "Shop reroll rejected.", "invalid_state");
        return;
      }
      this.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    if (command === "shop_close") {
      const result = this.engine.closeShopModal(client.seatIndex);
      if (!result.ok) {
        this.sendError(client.id, result.message || "Shop close rejected.", "invalid_state");
        return;
      }
      this.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    if (command === "use_item") {
      if (!itemId || !ITEM_DB[itemId]) {
        this.sendError(client.id, "Invalid item id.", "bad_command");
        return;
      }
      const result = this.engine.useOwnedItemForSeat(client.seatIndex, itemId);
      if (!result.ok) {
        this.sendError(client.id, result.message || "Item use rejected.", "invalid_state");
        return;
      }
      this.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    if (command === "sell_item") {
      if (!itemId || !ITEM_DB[itemId]) {
        this.sendError(client.id, "Invalid item id.", "bad_command");
        return;
      }
      const result = this.engine.sellOwnedItemForSeat(client.seatIndex, itemId);
      if (!result.ok) {
        this.sendError(client.id, result.message || "Item sell rejected.", "invalid_state");
        return;
      }
      this.pushStateUpdate({ forceSnapshot: true });
      return;
    }

    this.sendError(client.id, "Unknown command.", "bad_command");
  }

  processAction(client, payload) {
    if (!client) return;

    globalMetrics.actionsReceived += 1;

    const action = String(payload.action || "");
    if (!["fold", "checkcall", "raise"].includes(action)) {
      this.sendError(client.id, "Unsupported action.", "bad_action");
      return;
    }

    const raiseTo = Number.isFinite(Number(payload.raiseTo)) ? Math.floor(Number(payload.raiseTo)) : null;
    const result = this.engine.processActionFromSeat(client.seatIndex, action, raiseTo);
    if (!result.ok) {
      this.sendError(client.id, result.message || "Action rejected.", "action_rejected");
      return;
    }

    logEvent("action", {
      room: this.roomCode,
      clientId: client.id,
      seatIndex: client.seatIndex,
      action,
      raiseTo
    });
    this.pushStateUpdate();
  }

  handleMessage(clientId, event) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const raw = typeof event.data === "string" ? event.data : String(event.data || "");
    if (!raw) {
      this.sendError(client.id, "Empty payload.", "bad_payload");
      return;
    }
    if (raw.length > MAX_WS_MESSAGE_CHARS) {
      this.sendError(client.id, "Payload too large.", "payload_too_large");
      return;
    }

    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      this.sendError(client.id, "Invalid JSON payload.", "bad_json");
      return;
    }

    if (!payload || typeof payload !== "object") {
      this.sendError(client.id, "Invalid payload.", "bad_payload");
      return;
    }

    const type = String(payload.type || "");

    const rateKind = type === "action" ? "action" : type === "ack" ? "ack" : "generic";
    if (!this.allowClientMessage(client, rateKind)) {
      this.sendError(client.id, "Rate limit exceeded.", "rate_limited");
      return;
    }

    if (type === "ack") {
      globalMetrics.acksReceived += 1;
      const session = this.sessions.get(client.sessionToken);
      if (session) {
        session.lastAck = Math.max(session.lastAck || 0, safeInt(payload.seq, 0));
        session.lastSeen = Date.now();
      }
      return;
    }

    if (type === "ping") {
      this.sendToClient(client.id, { type: "pong", ts: Date.now() });
      return;
    }

    if (type === "action" || type === "command") {
      const clientSeq = safeInt(payload.client_seq, 0, 0, Number.MAX_SAFE_INTEGER);
      if (!clientSeq) {
        this.sendError(client.id, "Missing client sequence.", "bad_seq");
        return;
      }
      if (clientSeq <= client.lastClientSeq) {
        this.sendError(client.id, "Out-of-order or duplicated command.", "stale_seq");
        return;
      }
      client.lastClientSeq = clientSeq;
    }

    if (type === "action") {
      this.processAction(client, payload);
      return;
    }

    if (type === "command") {
      this.processCommand(client, payload);
      return;
    }

    if (type === "request_snapshot") {
      this.sendRecoveryState(client.id, 0);
      return;
    }

    this.sendError(client.id, "Unknown message type.", "bad_type");
  }

  onDisconnect(clientId, reason = "disconnect") {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.clients.delete(clientId);
    globalMetrics.connectionsClosed += 1;

    const session = this.sessions.get(client.sessionToken);
    if (session) {
      session.connectedClientId = "";
      session.lastSeen = Date.now();
    }

    this.purgeStaleSessions();
    this.ensureHostToken();
    this.broadcastRoomUpdate();
    this.engine.syncRosterFromRoom();

    if (
      !this.engine.state.handOver &&
      this.engine.state.waitingForHuman &&
      Number.isInteger(client.seatIndex) &&
      client.seatIndex === this.engine.state.activePlayerIndex
    ) {
      this.engine.beginTurn(client.seatIndex);
      return;
    }

    this.pushStateUpdate();
    logEvent("disconnect", { room: this.roomCode, clientId, reason });
  }

  async fetch(request) {
    const url = new URL(request.url);
    const roomCode = normalizeRoomCode(url.searchParams.get("room"));
    if (!roomCode) {
      return new Response("Invalid room code.", { status: 400 });
    }

    this.roomCode = roomCode;
    this.purgeStaleSessions();

    const name = normalizePlayerName(url.searchParams.get("name"));
    const mode = String(url.searchParams.get("mode") || "join");
    const reconnectToken = String(url.searchParams.get("token") || "").trim();
    const lastAck = safeInt(url.searchParams.get("last_ack"), 0);

    let session = reconnectToken ? this.findSessionByToken(reconnectToken) : null;
    let reconnect = false;

    if (session && session.connectedClientId) {
      session = null;
    }

    if (session) {
      reconnect = true;
      session.name = name || session.name;
      session.lastSeen = Date.now();
      globalMetrics.reconnects += 1;
    } else {
      const token = crypto.randomUUID();
      const shouldHost = this.sessions.size === 0 || (mode === "create" && !this.hostToken);
      session = {
        token,
        name,
        seatIndex: this.assignSeat(shouldHost),
        isHost: shouldHost,
        connectedClientId: "",
        connectedAt: Date.now(),
        lastSeen: Date.now(),
        lastAck: 0,
        history: [],
        lastPublicState: null,
        lastStatusMain: "",
        lastStatusSub: ""
      };
      this.sessions.set(token, session);
      if (shouldHost) {
        this.hostToken = token;
      }
      globalMetrics.roomsCreated += this.sessions.size === 1 ? 1 : 0;
    }

    this.ensureHostToken();

    const pair = new WebSocketPair();
    const clientSocket = pair[0];
    const serverSocket = pair[1];
    serverSocket.accept();

    const clientId = crypto.randomUUID();
    const client = {
      id: clientId,
      ws: serverSocket,
      name: session.name,
      seatIndex: session.seatIndex,
      sessionToken: session.token,
      connectedAt: Date.now(),
      lastClientSeq: 0,
      rate: buildDefaultRateState()
    };

    this.clients.set(clientId, client);
    session.connectedClientId = clientId;
    session.lastSeen = Date.now();

    serverSocket.addEventListener("message", (event) => {
      this.handleMessage(clientId, event);
    });
    serverSocket.addEventListener("close", () => {
      this.onDisconnect(clientId, "close");
    });
    serverSocket.addEventListener("error", () => {
      this.onDisconnect(clientId, "error");
    });

    globalMetrics.connectionsOpened += 1;
    logEvent("connect", {
      room: this.roomCode,
      clientId,
      seatIndex: client.seatIndex,
      reconnect,
      host: session.isHost
    });

    this.engine.syncRosterFromRoom();
    this.engine.ensureControlledSeatLoadout(client.seatIndex);

    this.sendToClient(clientId, {
      type: "session",
      roomCode: this.roomCode,
      clientId,
      token: session.token,
      role: session.isHost ? "host" : "client",
      hostClientId: this.getHostClientId(),
      yourSeatIndex: client.seatIndex,
      members: this.listMembers(),
      seatAssignments: this.serializeSeatAssignments()
    });

    this.broadcastRoomUpdate();
    this.sendRecoveryState(clientId, reconnect ? lastAck : 0);

    return new Response(null, {
      status: 101,
      webSocket: clientSocket
    });
  }
}
