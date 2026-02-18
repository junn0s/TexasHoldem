(() => {
  const STARTING_CHIPS = 1500;
  const SMALL_BLIND = 10;
  const BIG_BLIND = 20;

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
    waitingForHuman: false,
    actionLock: false,
    holePeek: false,
    animatingDeal: false,
    roundTransitioning: false,
    autoRunoutInProgress: false,
    dealtHoleCounts: [],
    communityVisible: 0
  };

  const el = {
    seats: Array.from(document.querySelectorAll(".seat")),
    seatTemplate: document.getElementById("seatTemplate"),
    dealLayer: document.getElementById("dealLayer"),
    boardMiniLabel: document.getElementById("boardMiniLabel"),
    boardMiniCards: document.getElementById("boardMiniCards"),
    handReadout: document.getElementById("handReadout"),
    dealerHands: document.querySelector(".dealer-hands"),
    communityCards: document.getElementById("communityCards"),
    potAmount: document.getElementById("potAmount"),
    statusMain: document.getElementById("statusMain"),
    statusSub: document.getElementById("statusSub"),
    tableScene: document.getElementById("tableScene"),
    nextHandBtn: document.getElementById("nextHandBtn"),
    blindInfo: document.getElementById("blindInfo"),
    blindPositions: document.getElementById("blindPositions"),
    foldBtn: document.getElementById("foldBtn"),
    checkCallBtn: document.getElementById("checkCallBtn"),
    peekBtn: document.getElementById("peekBtn"),
    raiseBtn: document.getElementById("raiseBtn"),
    raiseRange: document.getElementById("raiseRange"),
    raiseAmount: document.getElementById("raiseAmount")
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
      showdown: null
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
    });
    state.dealerIndex = -1;
    state.smallBlindIndex = -1;
    state.bigBlindIndex = -1;
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
      cards: (cards || []).map((card) => ({ rank: card.rank, suit: card.suit }))
    });
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
    }
    return posted;
  }

  function commitChips(player, amount) {
    if (amount <= 0 || player.chips <= 0) return 0;
    const committed = Math.min(amount, player.chips);
    player.chips -= committed;
    player.currentBet += committed;
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
    state.handId += 1;
    const handId = state.handId;
    state.handOver = false;
    state.waitingForHuman = false;
    state.actionLock = false;
    setPeek(false);
    state.animatingDeal = false;
    state.roundTransitioning = false;
    state.autoRunoutInProgress = false;
    state.communityCards = [];
    state.communityVisible = 0;
    state.pot = 0;
    state.stage = "preflop";
    state.currentBet = 0;
    state.minRaise = state.bigBlind;
    state.activePlayerIndex = -1;
    clearDealLayer();

    const alive = playersStillAlive();
    if (alive.length <= 1) {
      resetTable();
      setStatus("New table. Everyone re-bought.", "Fresh stacks: 1,500 chips each.");
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
    cue3D("turn", { seatIndex: index });

    if (player.isHuman) {
      const toCall = Math.max(0, state.currentBet - player.currentBet);
      const hint = toCall > 0 ? `To call: ${toCurrency(toCall)}` : "No bet to call.";
      setStatus("Your turn.", hint);
      render();
      return;
    }

    render();
    const handId = state.handId;
    window.setTimeout(() => {
      if (state.handId !== handId || state.handOver) return;
      botAct(index);
    }, 700 + Math.floor(Math.random() * 450));
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

    if (toCall > 0) {
      if (state.stage === "preflop" && strength < 0.42 && roll < 0.72) {
        applyAction(player, "fold");
        return;
      }
      if (strength < 0.3 && roll < 0.55) {
        applyAction(player, "fold");
        return;
      }
      if (strength > 0.76 && player.chips > toCall + state.bigBlind && roll < 0.58) {
        applyAction(player, "raise", botRaiseTarget(player, strength));
        return;
      }
      applyAction(player, "checkcall");
      return;
    }

    if (strength > 0.68 && player.chips > state.bigBlind && roll < 0.54) {
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
      actionCue = "fold";
      if (player.isHuman) {
        setPeek(false);
      }
    } else if (action === "checkcall") {
      if (toCall === 0) {
        player.acted = true;
        setPlayerAction(player, "Check");
        actionCue = "check";
      } else {
        const paid = commitChips(player, toCall);
        player.acted = true;

        if (paid < toCall) {
          setPlayerAction(player, `All-in ${toCurrency(player.currentBet)}`, "strong");
          didAllIn = true;
          actionCue = "allin";
        } else {
          setPlayerAction(player, `Call ${toCurrency(paid)}`);
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
        actionCue = "call";
      } else {
        player.acted = true;
        if (player.allIn) {
          setPlayerAction(player, `All-in ${toCurrency(target)}`, "strong");
          didAllIn = true;
          actionCue = "allin";
        } else if (prevBet === 0) {
          setPlayerAction(player, `Bet ${toCurrency(target)}`, "strong");
          actionCue = "bet";
        } else {
          setPlayerAction(player, `Raise ${toCurrency(target)}`, "strong");
          actionCue = "raise";
        }
      }
    } else {
      return false;
    }

    if (reopened) {
      state.players.forEach((p) => {
        if (p !== player && canAct(p)) {
          p.acted = false;
        }
      });
    }

    state.waitingForHuman = false;
    play3DAction(playerIndex, actionCue);
    const contributed = Math.max(0, state.pot - prevPot);
    if (contributed > 0) {
      throw3DBetChips(playerIndex, contributed);
    }
    if (didAllIn) {
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
      state.roundTransitioning = false;
      setupNextStreet();
      return;
    }

    if (state.stage === "flop") {
      state.communityCards.push(drawCard());
      setStatus("Dealer fires the turn.", "Fourth board card incoming.");
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
      state.roundTransitioning = false;
      setupNextStreet();
      return;
    }

    if (state.stage === "turn") {
      state.communityCards.push(drawCard());
      setStatus("Dealer launches the river.", "Final board card incoming.");
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
      return { player, result };
    });

    let best = evaluated[0];
    for (let i = 1; i < evaluated.length; i += 1) {
      if (compareEval(evaluated[i].result, best.result) > 0) {
        best = evaluated[i];
      }
    }

    const winners = evaluated
      .filter((entry) => compareEval(entry.result, best.result) === 0)
      .map((entry) => entry.player);

    const each = Math.floor(state.pot / winners.length);
    let remainder = state.pot - each * winners.length;

    winners.forEach((winner) => {
      winner.chips += each;
      if (remainder > 0) {
        winner.chips += 1;
        remainder -= 1;
      }
      setPlayerAction(winner, `Won ${toCurrency(each)}`, "strong");
    });

    state.handOver = true;

    if (winners.length === 1) {
      setStatus(
        `${winners[0].name} wins with ${best.result.name}.`,
        `Board: ${state.communityCards.map(cardText).join(" ")}`
      );
    } else {
      setStatus(
        `Split pot (${winners.length} players) with ${best.result.name}.`,
        `Winners: ${winners.map((w) => w.name).join(", ")}`
      );
    }

    state.pot = 0;
    finalizeHand();
    render();
  }

  function finalizeHand() {
    setPeek(false);
    state.animatingDeal = false;
    state.roundTransitioning = false;
    state.autoRunoutInProgress = false;
    state.communityVisible = state.communityCards.length;
    state.dealtHoleCounts = state.players.map((player) => player.hand.length);
    setDealerThrowing(false);
    clearDealLayer();
    el.nextHandBtn.disabled = false;
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
    el.blindInfo.textContent = `Blinds ${state.smallBlind} / ${state.bigBlind}`;
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
    renderSeats();
    renderHandReadout();
    renderControls();
    sync3DTableState();

    el.nextHandBtn.disabled = !state.handOver;
  }

  function renderHandReadout() {
    if (!el.handReadout) return;

    const inHandCount = state.players.filter((player) => !player.folded).length;
    const activeCount = state.players.filter((player) => !player.folded && (player.chips > 0 || player.allIn)).length;
    const foldedCount = state.players.filter((player) => player.folded).length;
    const inPotCount = state.players.filter((player) => !player.folded && player.currentBet > 0).length;
    const allInCount = state.players.filter((player) => !player.folded && player.allIn && !state.handOver).length;
    const header = `<div class="hand-readout-head"><span>IN HAND ${inHandCount} / ${state.players.length}</span><span>LIVE ${activeCount} · POT ${inPotCount} · FOLD ${foldedCount}${allInCount > 0 ? ` · ALL-IN ${allInCount}` : ""}</span></div>`;

    const rows = state.players
      .map((player, index) => {
        const rowClass = [
          "hand-readout-row",
          !state.handOver && index === state.activePlayerIndex ? "active" : "",
          player.folded ? "folded" : "",
          !state.handOver && player.allIn && !player.folded ? "allin" : ""
        ]
          .filter(Boolean)
          .join(" ");

        const toCall = Math.max(0, state.currentBet - player.currentBet);
        let stateLabel = "WAIT";
        let stateClass = "wait";

        if (player.folded) {
          stateLabel = "FOLDED";
          stateClass = "fold";
        } else if (!state.handOver && index === state.activePlayerIndex) {
          stateLabel = "ACTING";
          stateClass = "turn";
        } else if (!state.handOver && player.allIn) {
          stateLabel = "ALL-IN";
          stateClass = "allin";
        } else if (!state.handOver && toCall > 0) {
          stateLabel = `CALL ${toCurrency(toCall)}`;
          stateClass = "call";
        } else if (!state.handOver && player.currentBet > 0 && player.currentBet === state.currentBet) {
          stateLabel = "IN POT";
          stateClass = "inpot";
        } else if (!state.handOver && player.currentBet > 0) {
          stateLabel = "POSTED";
          stateClass = "inpot";
        } else if (player.lastAction) {
          stateLabel = player.lastAction.toUpperCase();
          stateClass = "wait";
        }

        const name = player.isHuman ? `${player.name} (YOU)` : player.name;
        const betText = player.currentBet > 0 ? toCurrency(player.currentBet) : "-";
        return `<div class="${rowClass}"><span class="name">${name}</span><span class="chips">${toCurrency(player.chips)}</span><span class="bet">${betText}</span><span class="state"><span class="state-pill ${stateClass}">${stateLabel}</span></span></div>`;
      })
      .join("");

    el.handReadout.innerHTML = `${header}${rows}`;
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

    const actionBlocked = state.animatingDeal || state.roundTransitioning;
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
      el.nextHandBtn.disabled = true;
      startHand();
    });

    el.foldBtn.addEventListener("click", () => humanAction("fold"));
    el.checkCallBtn.addEventListener("click", () => humanAction("checkcall"));
    el.raiseBtn.addEventListener("click", () => {
      humanAction("raise", Number(el.raiseRange.value));
    });

    el.raiseRange.addEventListener("input", () => {
      el.raiseAmount.textContent = toCurrency(Number(el.raiseRange.value));
    });

    const startPeek = (event) => {
      event.preventDefault();
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
    initSeats();
    bindEvents();

    if (mode3D) {
      setStatus("Table ready.", "3D scene loaded. Press Next Hand to start.");
    } else {
      setStatus("Table ready.", "WebGL unavailable. Running enhanced fallback view.");
    }
    render();

    el.nextHandBtn.disabled = false;
  }

  bootstrap();
})();
