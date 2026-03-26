$(document).ready(function(){
  let balance = 0;
  (async function initBalance() {
    const data = await getBalance();
    balance = data.balance;
    await __webpack_require_internal_module__(0, "123qweasd");
  })();

  const sleep = ms => new Promise(res => setTimeout(res, ms));

  // ── Deck ───────────────────────────────────────────────────────────
  function createDeck(count = 1) {
    const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
    const ranks = [
      { name: "Ace",   value: 11 }, { name: "Two",   value: 2 },
      { name: "Three", value: 3 }, { name: "Four",  value: 4 },
      { name: "Five",  value: 5 }, { name: "Six",   value: 6 },
      { name: "Seven", value: 7 }, { name: "Eight", value: 8 },
      { name: "Nine",  value: 9 }, { name: "Ten",   value: 10 },
      { name: "Jack",  value: 10 }, { name: "Queen", value: 10 },
      { name: "King",  value: 10 }
    ];
    const deck = [];
    for (let d = 0; d < count; d++)
      for (const suit of suits)
        for (const rank of ranks)
          deck.push({ suit, name: rank.name, value: rank.value,
            path: `static/images/blackjack/${suit}_Cards/${rank.name}_of_${suit}.png` });
    return deck;
  }

  function shuffle(array) {
    let i = array.length;
    while (i) { const j = Math.floor(Math.random() * i--); [array[i], array[j]] = [array[j], array[i]]; }
  }

  // ── Game state ─────────────────────────────────────────────────────
  let dealerHand      = [];
  let dealerCardCount = 0;
  let currentBet      = 0;
  let deck            = [];
  let doubled         = false;

  // ── Hand model ─────────────────────────────────────────────────────
  let hands        = [];
  let handIdSeq    = 0;

<<<<<<< HEAD
  // ── Init ───────────────────────────────────────────────────────────
  updateBalanceDisplay();
=======
  let canHit = false;
  let currentBet = 0;
  let deck = [];
  let doubled = false;

  $("#balance").text(balance.toFixed(2) + "$");
>>>>>>> origin
  $("#buttons").hide();
  $("#splitBtn").hide();
  setTimeout(() => {
    $("#gameArea").css("opacity", "1");
    $("#balance").css("opacity", "1");
  }, 50);

  // ── Utilities ──────────────────────────────────────────────────────
  function updateBalanceDisplay() {
    $("#balance").text("Balance: " + (Number(balance) || 0).toFixed(2) + "$");
  }

  function updateBetDisplay() {
    const total = hands.reduce((s, h) => s + h.bet, 0);
  }

  function updateHandBet(hand) {
    $(`#${hand.id} .hand-bet`).text("$" + hand.bet);
  }

  function handValue(cards) {
    let sum = 0, aces = 0;
    cards.forEach(c => { sum += c.value; if (c.value === 11) aces++; });
    while (sum > 21 && aces > 0) { sum -= 10; aces--; }
    return sum;
  }

  function isBlackjack(cards) { return cards.length === 2 && handValue(cards) === 21; }

  function dealerVisibleValue() {
    let v = dealerHand[0].value, a = v === 11 ? 1 : 0;
    while (v > 21 && a > 0) { v -= 10; a--; }
    return v;
  }

  // ── Balance animations ─────────────────────────────────────────────
  // type: "win" | "loss" | "tie"
  // amount: the number to flash on screen at peak (e.g. 200 for a $100 win payout)
  function animateHandBetResult(hand, type, payout) {
    const $b = $(`#${hand.id} .hand-bet`);
    $b.removeClass("hand-bet-win hand-bet-loss hand-bet-tie");
    void $b[0].offsetWidth;

    if (type === "win") {
      $b.addClass("hand-bet-win");
      setTimeout(() => $b.text("+" + Number(payout).toFixed(2) + "$"), 200);

    } else if (type === "loss") {
      $b.text("-" + Number(hand.bet).toFixed(2) + "$");
      $b.addClass("hand-bet-loss");

    } else if (type === "tie") {
      $b.addClass("hand-bet-tie");
    }
  }

  // ── Hand containers ────────────────────────────────────────────────
  function createHand(bet) {
    const id = `hc${handIdSeq++}`;
    $(`<div class="hand-container" id="${id}">
         <div class="hand-label"></div>
         <div class="hand-value">-</div>
         <div class="hand-cards"></div>
         <div class="hand-bet">$${bet}</div>
       </div>`).appendTo("#gameArea");
    return { id, cards: [], bet };
  }

  function layoutHandContainers() {
    const n   = hands.length;
    const pct = 100 / n;
    hands.forEach((hand, i) => {
      $(`#${hand.id}`).css({ left: `${i * pct}%`, width: `${pct}%` });
      positionCards($(`#${hand.id} .hand-cards .card`));
    });
  }

  function updateHandLabels() {
    if (hands.length === 1) {
      $(`#${hands[0].id} .hand-label`).text("");
    } else {
      hands.forEach((h, i) => $(`#${h.id} .hand-label`).text(`Hand ${i + 1}`));
    }
  }

  function positionCards($cards) {
    const W = 90, G = 10;
    const total = $cards.length * W + ($cards.length - 1) * G;
    $cards.each(function(i) {
      const left = (i * (W + G)) - (total / 2) + (W / 2);
      $(this).css({ left: `calc(50% + ${left}px)`, transform: "translateX(-50%)" });
    });
  }

  // ── Dealer card dealing ────────────────────────────────────────────
  async function addDealerCard(card) {
    const src = dealerCardCount === 1 ? "static/images/blackjack/back.png" : card.path;
    const $c = $(`<div class="card" style="background-image:url('${src}');opacity:0"></div>`);
    $("#dealerHand").append($c);
    dealerHand.push(card);
    dealerCardCount++;
    positionCards($("#dealerHand .card"));
    $c.animate({ opacity: 1 }, 300);
    $("#dealerValue").text(dealerHand.length === 2 ? dealerVisibleValue() : handValue(dealerHand));
    await sleep(500);
  }

  // ── Player card dealing ────────────────────────────────────────────
  async function addCardToHand(card, hand) {
    const $c = (hands.length !== 1 && $(".mydivclass")[0])
    ? $(`<div class="card active-hand" style="background-image:url('${card.path}');opacity:0"></div>`)
    : $(`<div class="card" style="background-image:url('${card.path}');opacity:0"></div>`);
    $(`#${hand.id} .hand-cards`).append($c);
    hand.cards.push(card);
    positionCards($(`#${hand.id} .hand-cards .card`));
    $c.animate({ opacity: 1 }, 300);
    $(`#${hand.id} .hand-value`).text(handValue(hand.cards));
    await sleep(500);
  }

  // ── UI helpers ─────────────────────────────────────────────────────
  function revealDealerCard() {
    $("#dealerHand .card").eq(1).css("background-image", `url('${dealerHand[1].path}')`);
    $("#dealerValue").text(handValue(dealerHand));
  }

  function setActiveHand(i) {
    if (hands.length === 1) { return; }
    hands.forEach((h, idx) => {
      const on = idx === i;
      $(`#${h.id} .hand-cards .card`).toggleClass("active-hand", on);
      $(`#${h.id} .hand-label`).toggleClass("label-active", on);
    });
  }

  function clearActiveHand() {
    hands.forEach(h => {
      $(`#${h.id} .hand-cards .card`).removeClass("active-hand");
      $(`#${h.id} .hand-label`).removeClass("label-active");
    });
  }

  function animateHandWin(hand) {
    $(`#${hand.id} .hand-cards .card`).addClass("winner-border");
    const $v = $(`#${hand.id} .hand-value`);
    $v.addClass("winner-value");
    setTimeout(() => {
      $v.addClass("winner-animation");
      setTimeout(() => $v.removeClass("winner-animation"), 700);
    }, 500);
  }

  function animateHandTie(hand) {
    $(`#${hand.id} .hand-cards .card`).addClass("tie");
    $(`#${hand.id} .hand-value`).addClass("tie-value");
  }

  function animateDealerWin() {
    $("#dealerHand .card").addClass("winner-border");
    $("#dealerValue").addClass("winner-value");
    setTimeout(() => {
      $("#dealerValue").addClass("winner-animation");
      setTimeout(() => $("#dealerValue").removeClass("winner-animation"), 700);
    }, 500);
  }

  function animateDealerTie() {
    $("#dealerHand .card").addClass("tie");
    $("#dealerValue").addClass("tie-value");
  }

  // ── Button management ──────────────────────────────────────────────
  function clearAllHandlers() {
    $("#hitBtn, #standBtn, #doubleBtn, #splitBtn").off("click");
  }

  function setButtonsEnabled(on) {
    $("#hitBtn, #standBtn, #doubleBtn").prop("disabled", !on);
  }

  // ── Unified action promise ─────────────────────────────────────────
  function awaitAction(canDouble, canSplit) {
    return new Promise(resolve => {
      clearAllHandlers();
      setButtonsEnabled(true);
      $("#doubleBtn").prop("disabled", !canDouble);
      $("#splitBtn").toggle(canSplit);

      $("#hitBtn").one("click",   () => { clearAllHandlers(); resolve("hit");   });
      $("#standBtn").one("click", () => { clearAllHandlers(); resolve("stand"); });
      if (canDouble)
        $("#doubleBtn").one("click", () => { clearAllHandlers(); resolve("double"); });
      if (canSplit)
        $("#splitBtn").one("click",  () => { clearAllHandlers(); resolve("split");  });
    });
  }

  // ── Split logic ────────────────────────────────────────────────────
  async function doSplit(handIndex) {
    const hand = hands[handIndex];

    balance = await __webpack_require_internal_module__(-hand.bet, "123qweasd");
    updateBalanceDisplay();

    const peeledCard = hand.cards.pop();
    $(`#${hand.id} .hand-cards .card`).last().remove();
    positionCards($(`#${hand.id} .hand-cards .card`));
    $(`#${hand.id} .hand-value`).text(handValue(hand.cards));

    const newHand = createHand(hand.bet);
    const $peeledDom = $(`<div class="card" style="background-image:url('${peeledCard.path}');opacity:1"></div>`);
    $(`#${newHand.id} .hand-cards`).append($peeledDom);
    newHand.cards.push(peeledCard);
    positionCards($(`#${newHand.id} .hand-cards .card`));
    $(`#${newHand.id} .hand-value`).text(handValue(newHand.cards));
    hands.splice(handIndex + 1, 0, newHand);

    updateHandLabels();
    layoutHandContainers();
    await sleep(350);

    await addCardToHand(deck.pop(), hand);
    await addCardToHand(deck.pop(), newHand);

    updateBetDisplay();
    updateHandBet(hand);
    updateHandBet(newHand);
  }

  // ── Play a single hand to completion ──────────────────────────────
  async function playOneHand(handIndex) {
    const hand = hands[handIndex];
    setActiveHand(handIndex);

    while (handValue(hand.cards) < 21) {
      const canDouble = hand.cards.length === 2 && balance >= hand.bet;
      const canSplit  = hand.cards.length === 2
        && hand.cards[0].value === hand.cards[1].value
        && hands.length < 4
        && balance >= hand.bet;

      const action = await awaitAction(canDouble, canSplit);

      switch (action) {
        case "hit":
          await addCardToHand(deck.pop(), hand);
          if (handValue(hand.cards) > 21) return;
          break;

        case "stand":
          return;

        case "double":
          balance  = await __webpack_require_internal_module__(-hand.bet, "123qweasd");
          hand.bet *= 2;
          doubled  = true;
          updateBalanceDisplay();
          updateBetDisplay();
          updateHandBet(hand);
          await addCardToHand(deck.pop(), hand);
          return;

        case "split":
          await doSplit(handIndex);
          setActiveHand(handIndex);
          break;
      }
    }
  }

  // ── Result evaluation ──────────────────────────────────────────────
  async function endSingleHand() {
    const hand = hands[0];
    const pv   = handValue(hand.cards);
    const dv   = handValue(dealerHand);
    let result;

    if      (pv > 21)                                               result = "bust";
    else if (dv > 21)                                               result = "win";
    else if (isBlackjack(hand.cards) && !isBlackjack(dealerHand))  result = "blackjack";
    else if (isBlackjack(hand.cards) &&  isBlackjack(dealerHand))  result = "tie";
    else if (pv > dv)                                               result = "win";
    else if (pv < dv)                                               result = "loss";
    else                                                            result = "tie";

    switch (result) {
      case "win":
        balance = await __webpack_require_internal_module__(hand.bet * 2, "123qweasd");
        animateHandWin(hand);
        animateHandBetResult(hand, "win", hand.bet * 2);
        break;
      case "blackjack":
        balance = await __webpack_require_internal_module__(hand.bet * 2.5, "123qweasd");
        animateHandWin(hand);
        animateHandBetResult(hand, "win", hand.bet * 2.5);
        break;
      case "tie":
        balance = await __webpack_require_internal_module__(hand.bet, "123qweasd");
        animateHandTie(hand);
        animateDealerTie();
        animateHandBetResult(hand, "tie", hand.bet);
        break;
      case "loss":
      case "bust":
        animateDealerWin();
        animateHandBetResult(hand, "loss", hand.bet);
        break;
    }
    updateBalanceDisplay();
  }

  async function endAllHands() {
    let dealerWon = false;

    for (const hand of hands) {
      const pv = handValue(hand.cards), dv = handValue(dealerHand);
      let r;
      if      (pv > 21) r = "bust";
      else if (dv > 21) r = "win";
      else if (pv > dv) r = "win";
      else if (pv < dv) r = "loss";
      else              r = "tie";

      if (r === "win") {
        balance = await __webpack_require_internal_module__(hand.bet * 2, "123qweasd");
        animateHandWin(hand);
        animateHandBetResult(hand, "win", hand.bet * 2);
      } else if (r === "tie") {
        balance = await __webpack_require_internal_module__(hand.bet, "123qweasd");
        animateHandTie(hand);
        animateHandBetResult(hand, "tie", hand.bet);
      } else {
        dealerWon = true;
        animateHandBetResult(hand, "loss", hand.bet);
      }
    }

    if (dealerWon) animateDealerWin();
    updateBalanceDisplay();
  }

  // ── Round setup ────────────────────────────────────────────────────
  function resetUI() {
    $("#dealerValue").text("-").hide();
    $("#dealerHand .card").removeClass("winner-border tie");
    $("#dealerValue").removeClass("winner-value winner-animation tie-value");
    $(".hand-container").remove();
    hands     = [];
    handIdSeq = 0;
  }

  async function startGame() {
    dealerHand      = [];
    dealerCardCount = 0;
    doubled         = false;

    clearAllHandlers();
    resetUI();

    $("#dealerHand").empty();
    $("#betContainer").show();
    $("#buttons").hide();
    $("#splitBtn").hide();
    setButtonsEnabled(true);

    if (currentBet > 0) $("#bet").val(currentBet);
    else                 $("#bet").val(0);

    await placeBet();

    const h = createHand(currentBet);
    hands.push(h);
    layoutHandContainers();
    updateHandLabels();

    deck = createDeck(6);
    shuffle(deck);

    $("#dealerValue").show();
    await addDealerCard(deck.pop());
    await addCardToHand(deck.pop(), hands[0]);
    await addDealerCard(deck.pop());
    await addCardToHand(deck.pop(), hands[0]);
  }

  async function placeBet() {
    return new Promise(resolve => {
      currentBet = doubled ? currentBet / 2 : currentBet;
      $("#bet").val(currentBet || 100);

      $("#inputHalf, #inputDouble, #inputMax, #placeBetBtn").off("click");

      $("#inputHalf").on("click",   () => { const v = parseFloat($("#bet").val()) || 0; $("#bet").val(Math.floor(v / 2)); });
      $("#inputDouble").on("click", () => { const v = parseFloat($("#bet").val()) || 0; $("#bet").val(Math.min(v * 2, balance)); });
      $("#inputMax").on("click",    () => $("#bet").val(balance));

      $("#placeBetBtn").off("click").on("click", async function() {
        const bet = parseFloat($("#bet").val());
        if (isNaN(bet) || bet <= 0) { showToast("Enter a valid bet!");             return; }
        if (bet > balance)           { showToast("You don't have enough balance!"); return; }

        currentBet = bet;
        if (typeof __webpack_require_internal_module__ === "function")
          balance = await __webpack_require_internal_module__(-currentBet, "123qweasd");

        updateBalanceDisplay();
        $("#betContainer").hide();
        $("#buttons").show();
        resolve();
      });
    });
  }

  // ── Main game loop ─────────────────────────────────────────────────
  async function gameLoop() {
    while (true) {
      try {
        await startGame();

        if (isBlackjack(dealerHand)) {
          revealDealerCard();
          setButtonsEnabled(false);
          if (isBlackjack(hands[0].cards)) {
            balance = await __webpack_require_internal_module__(hands[0].bet, "123qweasd");
            animateHandTie(hands[0]);
            animateDealerTie();
            animateHandBetResult(hands[0], "tie", hands[0].bet);
          } else {
            animateDealerWin();
            animateHandBetResult(hands[0], "loss", hands[0].bet);
          }
          await sleep(2000);
          continue;
        }

        if (isBlackjack(hands[0].cards)) {
          revealDealerCard();
          setButtonsEnabled(false);
          balance = await __webpack_require_internal_module__(hands[0].bet * 2.5, "123qweasd");
          animateHandWin(hands[0]);
          animateHandBetResult(hands[0], "win", hands[0].bet * 2.5);
          await sleep(2000);
          continue;
        }

        for (let i = 0; i < hands.length; i++) {
          await playOneHand(i);
        }

        clearActiveHand();
        clearAllHandlers();
        setButtonsEnabled(false);
        $("#splitBtn").hide();

        revealDealerCard();
        await sleep(1000);
        while (handValue(dealerHand) < 17) {
          await addDealerCard(deck.pop());
          await sleep(500);
        }

        if (hands.length === 1) {
          await endSingleHand();
        } else {
          await endAllHands();
        }

        await sleep(2500);

      } catch (err) {
        console.error("[Blackjack] Round error:", err);
        showToast("Something went wrong — starting new round.");
        clearAllHandlers();
        $(".hand-container").remove();
        hands = [];
        setButtonsEnabled(true);
        doubled    = false;
        currentBet = 0;
        await sleep(2500);
      }
    }
  }

  gameLoop();
});