(() => {
  const STARTING_CHIPS = 1500;
  const SMALL_BLIND = 10;
  const BIG_BLIND = 20;
  const TURN_TIME_MS = 30000;
  const AUTO_NEXT_HAND_DELAY_MS = 2600;
  const NPC_MIN_THINK_MS = 2000;
  const NPC_MAX_THINK_MS = 11000;
  const HANDS_PER_LEVEL = 3;
  const BLIND_LEVELS = [
    { small: 10, big: 20 },
    { small: 15, big: 30 },
    { small: 25, big: 50 },
    { small: 40, big: 80 },
    { small: 60, big: 120 },
    { small: 100, big: 200 }
  ];
  const TOURNAMENT_STAGES = [
    { name: "Back Room", npcChips: 1500, bonus: 0, botAggro: 1.0 },
    { name: "Main Floor", npcChips: 2200, bonus: 220, botAggro: 1.14 },
    { name: "VIP Lounge", npcChips: 3200, bonus: 340, botAggro: 1.28 },
    { name: "Boss Table", npcChips: 4600, bonus: 520, botAggro: 1.42 }
  ];
  const HISTORY_MAX = 180;
  const HISTORY_PREVIEW = 22;
  const SKIN_STORAGE_KEY = "underground-holdem-skin";
  const TUTORIAL_STORAGE_KEY = "underground-holdem-tutorial-dismissed";
  const SOUND_STORAGE_KEY = "underground-holdem-sound-enabled";

  const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
  const SUITS = ["S", "H", "D", "C"];
  const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };

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
    autoNextHandTimeoutId: null
  };

  const el = {
    seats: Array.from(document.querySelectorAll(".seat")),
    seatTemplate: document.getElementById("seatTemplate"),
    dealLayer: document.getElementById("dealLayer"),
    boardMiniLabel: document.getElementById("boardMiniLabel"),
    boardMiniCards: document.getElementById("boardMiniCards"),
    cornerCardsHud: document.getElementById("cornerCardsHud"),
    cornerHeroCards: document.getElementById("cornerHeroCards"),
    cornerBoardCards: document.getElementById("cornerBoardCards"),
    dealerHands: document.querySelector(".dealer-hands"),
    communityCards: document.getElementById("communityCards"),
    potAmount: document.getElementById("potAmount"),
    statusMain: document.getElementById("statusMain"),
    statusSub: document.getElementById("statusSub"),
    stageBanner: document.getElementById("stageBanner"),
    stageBannerTitle: document.getElementById("stageBannerTitle"),
    stageBannerSub: document.getElementById("stageBannerSub"),
    showdownPanel: document.getElementById("showdownPanel"),
    tableScene: document.getElementById("tableScene"),
    nextHandBtn: document.getElementById("nextHandBtn"),
    stageInfo: document.getElementById("stageInfo"),
    blindInfo: document.getElementById("blindInfo"),
    blindLevel: document.getElementById("blindLevel"),
    blindPositions: document.getElementById("blindPositions"),
    replayBtn: document.getElementById("replayBtn"),
    tutorialPanel: document.getElementById("tutorialPanel"),
    tutorialDismissBtn: document.getElementById("tutorialDismissBtn"),
    tutorialToggleBtn: document.getElementById("tutorialToggleBtn"),
    skinSelect: document.getElementById("skinSelect"),
    soundToggle: document.getElementById("soundToggle"),
    foldBtn: document.getElementById("foldBtn"),
    checkCallBtn: document.getElementById("checkCallBtn"),
    peekBtn: document.getElementById("peekBtn"),
    raiseBtn: document.getElementById("raiseBtn"),
    raiseRange: document.getElementById("raiseRange"),
    raiseAmount: document.getElementById("raiseAmount")
  };

  const audio = {
    context: null,
    master: null,
    ambientGain: null,
    ambientLfoGain: null,
    ambientOscA: null,
    ambientOscB: null,
    ambientLfo: null,
    enabled: true,
    unlocked: false
  };

  function createPlayers() {
    state.players = [
      makePlayer("Viper", false),
      makePlayer("Rook", false),
      makePlayer("You", true),
      makePlayer("Jade", false)
    ];
  }

  function makePlayer(name, isHuman) {
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
      invested: 0
    };
  }

  function resetTable() {
    state.players.forEach((player) => {
      player.chips = STARTING_CHIPS;
      player.hand = [];
      player.folded = false;
      player.allIn = false;
      player.currentBet = 0;
      player.acted = false;
      player.lastAction = "";
      player.actionTone = "";
      player.showdown = null;
      player.invested = 0;
    });
    state.dealerIndex = -1;
    state.smallBlindIndex = -1;
    state.bigBlindIndex = -1;
    state.blindLevel = 0;
    state.smallBlind = SMALL_BLIND;
    state.bigBlind = BIG_BLIND;
    state.tournamentStage = 0;
    state.pendingStageAdvance = false;
    state.dealtHoleCounts = state.players.map(() => 0);
    state.communityVisible = 0;
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

  function drawCard() {
    return state.deck.pop();
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

  function toCurrency(value) {
    return value.toLocaleString("en-US");
  }

  function rankLabel(rank) {
    if (rank === 14) return "A";
    if (rank === 13) return "K";
    if (rank === 12) return "Q";
    if (rank === 11) return "J";
    return String(rank);
  }

  function cardText(card) {
    return `${rankLabel(card.rank)}${SUIT_SYMBOL[card.suit]}`;
  }

  function setStatus(main, sub = "") {
    el.statusMain.textContent = main;
    el.statusSub.textContent = sub;
  }

  function setPlayerAction(player, text, tone = "") {
    player.lastAction = text;
    player.actionTone = tone;
  }

  function currentBlindLevelForHand(handId) {
    const index = Math.floor(Math.max(0, handId - 1) / HANDS_PER_LEVEL);
    return Math.min(BLIND_LEVELS.length - 1, index);
  }

  function applyBlindLevel(levelIndex) {
    const safeIndex = Math.max(0, Math.min(BLIND_LEVELS.length - 1, levelIndex));
    const level = BLIND_LEVELS[safeIndex];
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
      botAggro: Math.min(2.1, base.botAggro + extra * 0.12)
    };
  }

  function currentStageProfile() {
    return stageProfileFor(state.tournamentStage);
  }

  function humanPlayer() {
    return state.players.find((player) => player.isHuman) || null;
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
    state.pendingStageAdvance = true;
    logHistory(`Stage ${state.tournamentStage + 1} clear. Next: Stage ${state.tournamentStage + 2} ${nextProfile.name}.`, "stage");
    setStatus(`Stage ${state.tournamentStage + 1} clear!`, `Press Next Hand to enter Stage ${state.tournamentStage + 2}.`);
    showStageBanner(
      `Stage ${state.tournamentStage + 1} Clear`,
      `Next: Stage ${state.tournamentStage + 2} · ${nextProfile.name}`,
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
    });

    state.dealerIndex = -1;
    state.smallBlindIndex = -1;
    state.bigBlindIndex = -1;

    const bonusText = profile.bonus > 0 ? ` | Bonus +${toCurrency(profile.bonus)}` : "";
    return `Stage ${state.tournamentStage + 1} - ${profile.name}: NPC stacks ${toCurrency(profile.npcChips)}${bonusText}`;
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

  function loadPreferences() {
    let storedSkin = "classic";
    let tutorialHidden = false;
    let soundEnabled = true;
    try {
      storedSkin = window.localStorage.getItem(SKIN_STORAGE_KEY) || "classic";
      tutorialHidden = window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
      soundEnabled = window.localStorage.getItem(SOUND_STORAGE_KEY) !== "0";
    } catch (error) {
      // Ignore storage restrictions.
    }
    applySkin(storedSkin);
    setTutorialVisibility(tutorialHidden);
    audio.enabled = soundEnabled;
    setSoundToggleUi();
  }

  function setSoundToggleUi() {
    if (!el.soundToggle) return;
    el.soundToggle.textContent = audio.enabled ? "Sound On" : "Sound Off";
    el.soundToggle.classList.toggle("off", !audio.enabled);
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
      return;
    }

    if (!ensureAudioContext()) return;
    unlockAudio();
    if (audio.master && audio.context) {
      audio.master.gain.setTargetAtTime(0.4, audio.context.currentTime, 0.04);
    }
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
    }
  }

  function showStageBanner(title, sub = "", tone = "stage-start", duration = 1700) {
    if (!el.stageBanner || !el.stageBannerTitle || !el.stageBannerSub) return;
    if (state.stageBannerTimer) {
      window.clearTimeout(state.stageBannerTimer);
      state.stageBannerTimer = null;
    }

    el.stageBanner.classList.remove("stage-clear", "stage-start", "show");
    el.stageBannerTitle.textContent = title;
    el.stageBannerSub.textContent = sub;
    el.stageBanner.classList.add(tone === "stage-clear" ? "stage-clear" : "stage-start");

    window.requestAnimationFrame(() => {
      el.stageBanner.classList.add("show");
    });

    state.stageBannerTimer = window.setTimeout(() => {
      el.stageBanner.classList.remove("show");
    }, Math.max(900, duration));
  }

  function setPeek(active) {
    const human = state.players.find((p) => p.isHuman);
    const humanIndex = state.players.findIndex((p) => p.isHuman);
    const dealt = humanIndex >= 0 ? state.dealtHoleCounts[humanIndex] || 0 : 0;
    const canPeek = !!human && !state.handOver && human.hand.length === 2 && dealt >= 2 && !human.folded;
    const nextValue = !!active && canPeek;

    if (state.holePeek === nextValue) return;

    state.holePeek = nextValue;
    cue3D(nextValue ? "peekStart" : "peekEnd");
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
    window.Poker3D.cue({ type, ...payload });
  }

  async function throwCardToSeat(seatIndex, cardIndex) {
    if (has3DEffects()) {
      await window.Poker3D.throwCard({
        target: "seat",
        seatIndex,
        cardIndex,
        duration: 330
      });
      return;
    }
    await animateCardThrow(getSeatCardTarget(seatIndex, cardIndex));
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
      dealerIndex: state.dealerIndex,
      communityVisible: state.communityVisible,
      communityCards: state.communityCards.slice(0, state.communityVisible).map((card) => ({
        rank: card.rank,
        suit: card.suit
      })),
      pot: state.pot,
      stage: state.stage
    });
  }

  function sync3DPlayerState(index, player, holeCount, revealCards, cards) {
    if (!window.Poker3D || typeof window.Poker3D.setPlayerState !== "function") return;

    window.Poker3D.setPlayerState(index, {
      isHuman: player.isHuman,
      folded: player.folded,
      allIn: !state.handOver && player.allIn && !player.folded,
      active: !state.handOver && index === state.activePlayerIndex,
      peeking: player.isHuman && state.holePeek && !state.handOver && !player.folded,
      holeCount,
      reveal: revealCards,
      actionLabel: player.lastAction || "",
      actionTone: player.actionTone || "",
      cards: (cards || []).map((card) => ({ rank: card.rank, suit: card.suit }))
    });
  }

  function sync3DTurnTimer() {
    if (!window.Poker3D || typeof window.Poker3D.setTurnTimer !== "function") return;

    state.players.forEach((player, index) => {
      const visible =
        !state.handOver &&
        !state.roundTransitioning &&
        !state.animatingDeal &&
        index === state.turnTimerSeatIndex &&
        canAct(player);
      window.Poker3D.setTurnTimer(index, {
        visible,
        totalMs: TURN_TIME_MS,
        leftMs: visible ? state.turnTimerRemainingMs : 0
      });
    });
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
    return state.handOver && !state.pendingStageAdvance && !state.replayInProgress;
  }

  function scheduleAutoNextHand() {
    clearAutoNextHand();
    if (!canAutoStartNextHand()) return;

    state.autoNextHandTimeoutId = window.setTimeout(() => {
      state.autoNextHandTimeoutId = null;
      if (!canAutoStartNextHand()) return;
      startHand();
    }, AUTO_NEXT_HAND_DELAY_MS);
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
    window.Poker3D.playAction(seatIndex, actionType);
  }

  function throw3DBetChips(seatIndex, amount) {
    if (!window.Poker3D || typeof window.Poker3D.throwChips !== "function") return;
    if (amount <= 0) return;
    window.Poker3D.throwChips({ seatIndex, amount, duration: 560 });
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
    clearAutoNextHand();
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

    const alive = playersStillAlive();
    if (alive.length <= 1) {
      resetTable();
      applyBlindLevel(currentBlindLevelForHand(state.handId));
      setStatus("Run reset.", "You busted or table ended. Stage returns to 1.");
      logHistory("Run reset: all players re-bought to 1,500 chips (Stage 1).", "stage");
    }

    state.dealerIndex = nextIndex(state.dealerIndex, (p) => p.chips > 0);

    state.players.forEach((player) => {
      player.hand = [];
      player.folded = player.chips <= 0;
      player.allIn = false;
      player.currentBet = 0;
      player.acted = player.folded;
      player.lastAction = "";
      player.actionTone = "";
      player.showdown = null;
      player.invested = 0;
    });
    state.dealtHoleCounts = state.players.map(() => 0);
    if (window.Poker3D && typeof window.Poker3D.resetForNewHand === "function") {
      window.Poker3D.resetForNewHand();
    }

    state.deck = shuffle(buildDeck());

    for (let i = 0; i < 2; i += 1) {
      state.players.forEach((player) => {
        if (!player.folded) {
          player.hand.push(drawCard());
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
    if (state.handId === 1 || stageIntro) {
      const profile = currentStageProfile();
      const bonusText = profile.bonus > 0 ? ` | Bonus +${toCurrency(profile.bonus)}` : "";
      showStageBanner(
        `Stage ${state.tournamentStage + 1} · ${profile.name}`,
        `NPC ${toCurrency(profile.npcChips)}${bonusText}`,
        "stage-start",
        2300
      );
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
    state.waitingForHuman = player.isHuman;
    startTurnTimer(index);
    if (player.isHuman) {
      cue3D("turn", { seatIndex: index });
    }

    if (player.isHuman) {
      const toCall = Math.max(0, state.currentBet - player.currentBet);
      const hint = toCall > 0 ? `To call: ${toCurrency(toCall)}` : "No bet to call.";
      setStatus("Your turn.", hint);
      render();
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
    if (state.handOver || state.actionLock || state.animatingDeal || state.roundTransitioning) return;
    const player = state.players[state.activePlayerIndex];
    if (!player || !player.isHuman || !state.waitingForHuman) return;

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
    const strength = estimateStrength(player);
    const roll = Math.random();
    const aggro = currentStageProfile().botAggro || 1;
    const aggroDelta = Math.max(0, aggro - 1);

    if (toCall > 0) {
      const weakPreflopFold = clamp(0.72 - aggroDelta * 0.24, 0.36, 0.72);
      const weakPostflopFold = clamp(0.55 - aggroDelta * 0.22, 0.24, 0.55);
      const raiseChanceCalled = clamp(0.58 + aggroDelta * 0.24, 0.58, 0.9);
      const raiseStrengthCalled = 0.76 - aggroDelta * 0.08;

      if (state.stage === "preflop" && strength < 0.42 && roll < weakPreflopFold) {
        applyAction(player, "fold");
        return;
      }
      if (strength < 0.3 && roll < weakPostflopFold) {
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

    const raiseStrengthFree = 0.68 - aggroDelta * 0.1;
    const raiseChanceFree = clamp(0.54 + aggroDelta * 0.22, 0.54, 0.88);
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
    let target = state.currentBet + Math.max(state.bigBlind, Math.round((state.pot * (0.3 + strength)) / state.bigBlind) * state.bigBlind);

    if (state.currentBet === 0) {
      target = Math.max(target, state.bigBlind * 2);
    }

    target = Math.max(minTotal, Math.min(target, maxTotal));

    if (target < minTotal && maxTotal >= minTotal) {
      target = minTotal;
    }

    return target;
  }

  function applyAction(player, action, raiseTo = null) {
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
    const won = state.pot;
    winner.chips += won;
    state.pot = 0;
    state.handOver = true;
    cue3D("showdown");

    setPlayerAction(winner, `Won ${toCurrency(won)}`, "strong");
    setStatus(`${winner.name} wins ${toCurrency(won)} chips.`, "Everyone else folded.");
    logHistory(`${winner.name} wins uncontested pot ${toCurrency(won)}.`, "showdown");
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
      state.communityCards.push(drawCard(), drawCard(), drawCard());
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
      state.communityCards.push(drawCard());
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
      state.communityCards.push(drawCard());
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

  function showdown() {
    cue3D("showdown");
    const contenders = playersInHand();
    if (contenders.length === 0) {
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
      const payoutOrder = seatOrderFromButton(winners.map((entry) => entry.index))
        .map((index) => winners.find((entry) => entry.index === index))
        .filter(Boolean);

      const each = Math.floor(pot.amount / winners.length);
      let remainder = pot.amount - each * winners.length;
      payoutOrder.forEach((entry) => {
        const bonus = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder -= 1;
        payouts.set(entry.index, (payouts.get(entry.index) || 0) + each + bonus);
      });

      const label = potIndex === 0 ? "Main pot" : `Side pot ${potIndex}`;
      const winnerNames = winners.map((entry) => entry.player.name).join(", ");
      logHistory(`${label} ${toCurrency(pot.amount)} -> ${winnerNames} (${best.result.name}).`, "showdown");

      if (potIndex === 0) {
        primaryWinners = winners.map((entry) => entry.player);
        primaryName = best.result.name;
      }
    });

    payouts.forEach((amount, index) => {
      const player = state.players[index];
      player.chips += amount;
      setPlayerAction(player, `Won ${toCurrency(amount)}`, "strong");
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
    queueTournamentAdvanceIfCleared();
    state.lastHandLog = state.currentHandLog.slice();
    setDealerThrowing(false);
    clearDealLayer();
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
      setStatus("Replay complete.", state.pendingStageAdvance ? "Use Next Hand to continue." : "Next hand starts automatically.");
    } finally {
      state.replayInProgress = false;
      state.replayEntryId = null;
      render();
      scheduleAutoNextHand();
    }
  }

  function evaluateSeven(cards) {
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
    renderSeats();
    renderShowdownPanel();
    renderControls();
    sync3DTableState();

    el.nextHandBtn.disabled = !state.handOver || state.replayInProgress;
    if (el.replayBtn) {
      el.replayBtn.disabled = !state.handOver || state.replayInProgress || state.lastHandLog.length === 0;
    }
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
                return `<span class="showdown-card-tile${red}">${cardText(card)}</span>`;
              })
              .join("")
          : `<span class="showdown-mucked">MUCKED</span>`;
        const handName = canReveal && player.showdown ? player.showdown.name : player.folded ? "Folded" : "No Show";
        const playerName = player.isHuman ? `${player.name} (YOU)` : player.name;
        return `<div class="${rowClass}"><div class="showdown-player"><span>${playerName}</span><span class="showdown-hand-name">${handName}</span></div><div class="showdown-cards">${cardsHtml}</div></div>`;
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
        return `<span class="board-mini-card${isRed ? " red" : ""}">${cardText(card)}</span>`;
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
    return `<span class="corner-card${isRed ? " red" : ""}">${cardText(card)}</span>`;
  }

  function renderCornerCardsHud() {
    if (!el.cornerCardsHud || !el.cornerHeroCards || !el.cornerBoardCards) return;

    const humanIndex = state.players.findIndex((player) => player.isHuman);
    const human = humanIndex >= 0 ? state.players[humanIndex] : null;
    if (!human) {
      el.cornerCardsHud.style.display = "none";
      return;
    }

    el.cornerCardsHud.style.display = "";

    const dealt = humanIndex >= 0 ? state.dealtHoleCounts[humanIndex] || 0 : 0;
    const revealHero = !human.folded && (state.holePeek || state.handOver || !!human.showdown);
    const heroCards = [];
    for (let i = 0; i < 2; i += 1) {
      const card = human.hand[i];
      if (!card || dealt <= i) {
        heroCards.push(makeCornerCardHtml(null, state.handOver ? "empty" : "back"));
        continue;
      }
      heroCards.push(makeCornerCardHtml(card, revealHero ? "front" : "back"));
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

  function renderSeats() {
    el.seats.forEach((seatEl, i) => {
      const player = state.players[i];
      const inner = seatEl.querySelector(".seat-inner");
      const nameEl = seatEl.querySelector(".name");
      const blindBadgeEl = seatEl.querySelector(".blind-badge");
      const cardsEl = seatEl.querySelector(".cards");
      const chipsEl = seatEl.querySelector(".chips");
      const betEl = seatEl.querySelector(".bet");
      const actionEl = seatEl.querySelector(".action-tag");

      if (!player || !inner || !nameEl || !cardsEl || !chipsEl || !betEl || !actionEl || !blindBadgeEl) return;

      nameEl.textContent = player.isHuman ? `${player.name} (YOU)` : player.name;
      chipsEl.textContent = `Chips ${toCurrency(player.chips)}`;
      betEl.textContent = player.currentBet > 0 ? `Bet ${toCurrency(player.currentBet)}` : "";

      let blindText = "";
      if (i === state.smallBlindIndex) blindText = `SB ${state.smallBlind}`;
      if (i === state.bigBlindIndex) blindText = `BB ${state.bigBlind}`;
      blindBadgeEl.textContent = blindText;
      blindBadgeEl.classList.toggle("show", !!blindText);

      actionEl.textContent = player.lastAction || "";
      actionEl.className = "action-tag";
      if (player.actionTone) {
        actionEl.classList.add(player.actionTone);
      }

      cardsEl.innerHTML = "";
      cardsEl.classList.toggle("peeking", player.isHuman && state.holePeek && !state.handOver && !player.folded);

      const revealHumanCards = player.isHuman && (state.holePeek || state.handOver || !!player.showdown);
      const revealCards = player.isHuman ? revealHumanCards : state.handOver || !!player.showdown;
      const dealtCount = state.dealtHoleCounts[i] || 0;
      const visibleHoleCards = player.hand.slice(0, dealtCount);
      visibleHoleCards.forEach((card) => {
        cardsEl.appendChild(makeCardNode(card, !revealCards));
      });

      seatEl.classList.toggle("active", !state.handOver && i === state.activePlayerIndex);
      seatEl.classList.toggle("dealer", i === state.dealerIndex);
      seatEl.classList.toggle("blind-sb", i === state.smallBlindIndex);
      seatEl.classList.toggle("blind-bb", i === state.bigBlindIndex);
      seatEl.classList.toggle("human", player.isHuman);
      seatEl.classList.toggle("all-in", !state.handOver && player.allIn && !player.folded);
      seatEl.classList.toggle("folded", player.folded);
      seatEl.classList.toggle("eliminated", player.chips <= 0 && state.handOver);

      sync3DPlayerState(i, player, visibleHoleCards.length, revealCards, visibleHoleCards);
    });
  }

  function renderControls() {
    const humanIndex = state.players.findIndex((player) => player.isHuman);
    const human = humanIndex >= 0 ? state.players[humanIndex] : null;
    if (!human) return;

    const actionBlocked = state.animatingDeal || state.roundTransitioning || state.replayInProgress;
    const yourTurn = !state.handOver && state.waitingForHuman && !actionBlocked;
    const dealt = state.dealtHoleCounts[humanIndex] || 0;
    const canPeek = !state.handOver && !human.folded && human.hand.length === 2 && dealt >= 2 && !actionBlocked;

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
      return;
    }

    el.raiseBtn.disabled = false;
    el.raiseRange.disabled = false;

    const toCall = Math.max(0, state.currentBet - human.currentBet);
    el.checkCallBtn.textContent = toCall > 0 ? `Call ${toCurrency(toCall)}` : "Check";

    const maxTotal = human.currentBet + human.chips;
    const strictMinTotal = state.currentBet === 0 ? state.bigBlind : state.currentBet + state.minRaise;
    const minTotal = Math.min(strictMinTotal, maxTotal);

    const canRaise = maxTotal > state.currentBet;

    if (!canRaise) {
      el.raiseBtn.disabled = true;
      el.raiseRange.disabled = true;
      el.raiseAmount.textContent = toCurrency(maxTotal);
      return;
    }

    el.raiseRange.min = String(minTotal);
    el.raiseRange.max = String(maxTotal);

    const currentValue = Number(el.raiseRange.value);
    if (currentValue < minTotal || currentValue > maxTotal) {
      el.raiseRange.value = String(minTotal);
    }

    el.raiseAmount.textContent = toCurrency(Number(el.raiseRange.value));
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
    node.textContent = cardText(card);
    return node;
  }

  function bindEvents() {
    el.nextHandBtn.addEventListener("click", () => {
      clearAutoNextHand();
      el.nextHandBtn.disabled = true;
      startHand();
    });

    if (el.replayBtn) {
      el.replayBtn.addEventListener("click", () => {
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

    const primeAudio = () => {
      unlockAudio();
    };
    window.addEventListener("pointerdown", primeAudio, { once: true, passive: true });
    window.addEventListener("keydown", primeAudio, { once: true });

    el.foldBtn.addEventListener("click", () => humanAction("fold"));
    el.checkCallBtn.addEventListener("click", () => humanAction("checkcall"));
    el.raiseBtn.addEventListener("click", () => {
      humanAction("raise", Number(el.raiseRange.value));
    });

    el.raiseRange.addEventListener("input", () => {
      el.raiseAmount.textContent = toCurrency(Number(el.raiseRange.value));
    });

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

    window.addEventListener("keydown", (event) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      const tag = target && target.tagName ? target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "select" || tag === "textarea" || (target && target.isContentEditable)) return;

      const key = event.key.toLowerCase();
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
    initSeats();
    bindEvents();

    if (mode3D) {
      setStatus("Table ready.", "3D scene loaded. Press Next Hand or N.");
    } else {
      setStatus("Table ready.", "WebGL unavailable. Running enhanced fallback view.");
    }
    render();

    el.nextHandBtn.disabled = false;
  }

  bootstrap();
})();
