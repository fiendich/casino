$(document).ready(function(){
  
  (async function initBalance() {
  balance = await getBalance();
  await __webpack_require_internal_module__(0, "123qweasd");
  })();

  const sleep = ms => new Promise(res => setTimeout(res, ms));

  function createDeck() {
    const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
    const ranks = [
      { name: "Ace", value: 11 },
      { name: "Two", value: 2 },
      { name: "Three", value: 3 },
      { name: "Four", value: 4 },
      { name: "Five", value: 5 },
      { name: "Six", value: 6 },
      { name: "Seven", value: 7 },
      { name: "Eight", value: 8 },
      { name: "Nine", value: 9 },
      { name: "Ten", value: 10 },
      { name: "Jack", value: 10 },
      { name: "Queen", value: 10 },
      { name: "King", value: 10 }
    ];

    let deck = [];

    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({
          suit,
          name: rank.name,
          value: rank.value,
          path: `static/images/blackjack/${suit}_Cards/${rank.name}_of_${suit}.png`
        });
      }
    }
    return deck;
  }

  function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex != 0) {
     
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

  let dealerCardCount = 0;
  let playerCardCount = 0;

  let dealerHand = [];
  let playerHand = [];

  let canHit = false;
  let balance = 0;
  let currentBet = 0;
  let deck = [];

  $("#balance").text("Balance: " + balance + "$");
  $("#buttons").hide();
   $("#currentBetContainer").hide();

  function positionCards(handSelector, cards) {
    const $hand = $(handSelector);
    const cardWidth = 90;
    const cardGap = 10;
    const totalWidth = (cards.length * cardWidth) + ((cards.length - 1) * cardGap);
    
    cards.each(function(index) {
      const leftPos = (index * (cardWidth + cardGap)) - (totalWidth / 2) + (cardWidth / 2);
      $(this).css({
        'left': `calc(50% + ${leftPos}px)`,
        'transform': 'translateX(-50%)'
      });
    });
  }

  function calculateDealerValue(hand, includeHidden = false) {
    let sum = 0;
    let aces = 0;
    const cardsToCalculate = includeHidden ? hand : [hand[0]];
    
    cardsToCalculate.forEach(card => {
        sum += card.value;
        if (card.value === 11) aces++;
    });
    
    while (sum > 21 && aces > 0) {
        sum -= 10;
        aces--;
    }
    
    return sum;
  }

  async function addDealerCard(card) {
    let cardBack = (dealerCardCount === 1) ? "static/images/blackjack/back.png" : card.path;

    let $card = $(`<div class="card" style="background-image:url('${cardBack}'); opacity:0"></div>`);

    $("#dealerHand").append($card);
    
    dealerHand.push(card);
    dealerCardCount++;
    
    const $cards = $("#dealerHand .card");
    positionCards("#dealerHand", $cards);
    
    $card.animate({ opacity: 1 }, 300);
    if (dealerHand.length === 2){
      $("#dealerValue").text(calculateDealerValue(dealerHand, false));
    } else {
      $("#dealerValue").text(handValue(dealerHand));
    }
    await sleep(500);
  }

  async function addPlayerCard(card) {
    let $card = $(`<div class="card" style="background-image:url('${card.path}'); opacity:0"></div>`);

    $("#playerHand").append($card);
    
    playerHand.push(card);
    playerCardCount++;
    
    const $cards = $("#playerHand .card");
    positionCards("#playerHand", $cards);
    
    $card.animate({ opacity: 1 }, 300);
    $("#playerValue").text(handValue(playerHand));
    await sleep(500);
  }

  function handValue(hand) {
    let sum = 0;
    let aces = 0;

    hand.forEach(card => {
      sum += card.value;
      if (card.value === 11) aces++;
    });

    while (sum > 21 && aces > 0) {
      sum -= 10;
      aces--;
    }
    return sum;
  }

  function isBlackjack(hand) {
    return (handValue(hand) === 21 && hand.length === 2);
  }

  function revealDealerCard() {
    const hidden = dealerHand[1];
    $("#dealerHand .card").eq(1)
      .css("background-image", `url('${hidden.path}')`);
    $("#dealerValue").text(handValue(dealerHand));
  }

  function animateWinner(winnerSelector, valueSelector) {
    $(winnerSelector + " .card").addClass("winner-border");
    $(valueSelector).addClass("winner-value")

    setTimeout(() => {
    $(valueSelector).addClass("winner-animation");

    setTimeout(() => {
      $(valueSelector).removeClass("winner-animation");
      }, 700);

    }, 500);
  }

  async  function animateTie() {
    $("#dealerHand .card").addClass("tie");
    $("#playerHand .card").addClass("tie");

    $("#playerValue").addClass("tie-value");
    $("#dealerValue").addClass("tie-value");    
  }

  function resetUI() {
    $("#dealerValue").text("-");
    $("#playerValue").text("-");
    $("#balance").text("Balance: " + balance + "$");
    $("#dealerHand .card, #playerHand .card").removeClass("winner-border tie");
    $("#dealerValue, #playerValue").removeClass("winner-value winner-animation tie-value");
  }

  async function startGame() {
    dealerHand = [];  
    playerHand = [];
    dealerCardCount = 0;
    playerCardCount = 0;
    canHit = false;
    
    resetUI();
    
    $("#dealerHand").empty();
    $("#playerHand").empty();
    
    $("#betContainer").show();
    $("#buttons").hide();
    $("#currentBetContainer").hide();
    
    if (currentBet > 0) {
        $("#bet").val(currentBet);
    } else {
        $("#bet").val(0);
    }
    
    await placeBet();
    
    deck = createDeck();
    shuffle(deck);
    
    await addDealerCard(deck.pop());  
    await addPlayerCard(deck.pop());
    await addDealerCard(deck.pop());
    await addPlayerCard(deck.pop());
}

async function placeBet() {
    return new Promise(resolve => {
        let bet = currentBet || "";
        $("#bet").val(bet);
        
        $("#inputHalf, #inputDouble, #inputMax, #placeBetBtn").off("click");
        
        $("#inputHalf").on("click", function() {
            let currentVal = parseInt($("#bet").val());
            $("#bet").val(Math.floor(currentVal / 2));
        });
        
        $("#inputDouble").on("click", function() {
            let currentVal = parseInt($("#bet").val());
            if (balance >= currentVal * 2) {
                $("#bet").val(currentVal * 2);
            } else {
                $("#bet").val(balance);
            }
        });
        
        $("#inputMax").on("click", function() {
            $("#bet").val(balance);
        });
        
        $("#placeBetBtn").one("click", async function() {
            bet = parseInt($("#bet").val());
            
            if (isNaN(bet) || bet <= 0) {
                alert("Enter a valid bet!");
                return;
            }
            if (bet > balance) {
                alert("You don't have enough balance!");
                return;
            }
            
            currentBet = bet;
            
            if (typeof __webpack_require_internal_module__ === 'function') {
                balance = await __webpack_require_internal_module__(-currentBet, "123qweasd");
            }
            
            $("#betContainer").hide();
            $("#buttons").show();
            $("#currentBetContainer").show();
            $("#currentBet").text(currentBet + "$");
            $("#balance").text("Balance: " + balance + "$");
            
            resolve();
        });
    });
}

  function playerAction() {
    return new Promise(resolve => {
      $("#hitBtn, #standBtn, #doubleBtn").off("click");
      
      $("#hitBtn").one("click", () => resolve("hit"));
      $("#standBtn").one("click", () => resolve("stand"));
      $("#doubleBtn").one("click", () => {
        if (balance >= currentBet) {
          resolve("double");
        } else {
          alert("Not enough balance to double!");
          playerAction().then(resolve);
        }
      });
      $("#splitBtn").one("click", () => resolve("split"));
    });
  }

  function calculateResults() {
    const playerValue = handValue(playerHand);
    const dealerValue = handValue(dealerHand);
    
    if (playerValue > 21) return "bust";
    if (dealerValue > 21) return "win";
    
    if (playerValue > dealerValue) return "win";
    if (playerValue < dealerValue) return "loss";
    
    if (isBlackjack(playerHand) && !isBlackjack(dealerHand))
      return "blackjack";
    
    if (isBlackjack(playerHand) && isBlackjack(dealerHand))
      return "tie";
    
    return "tie";
  }

  async function endGame(gameResult) {
    const result = gameResult;
    
    switch(result){
        case "win":
            balance = await __webpack_require_internal_module__(currentBet * 2, "123qweasd");
            animateWinner("#playerHand", "#playerValue");
            break;

        case "loss":
            animateWinner("#dealerHand", "#dealerValue");
            break;
        
        case "bust":
            animateWinner("#dealerHand", "#dealerValue");
            break;
            
        case "tie":
            balance = await  __webpack_require_internal_module__(currentBet, "123qweasd");
            animateTie();
            break;

        case "blackjack":
            balance = await  __webpack_require_internal_module__(currentBet * 2.5, "123qweasd");
            animateWinner("#playerHand", "#playerValue");
            break;
        }

    
    $("#balance").text("Balance: " + balance + "$");
    $("#currentBet").text("")
  }

    async function gameLoop() {
        while (true) {
        await startGame();
        canHit = true;

      if (isBlackjack(dealerHand)) {
        revealDealerCard();
        if (isBlackjack(playerHand)) {
          endGame("tie");
          await sleep(1000);
          continue;
        } else {
          endGame("loss");
          await sleep(1000);
          continue;
        }
      }

      if (isBlackjack(playerHand)) {
        revealDealerCard();
        endGame("blackjack");
        await sleep(1000);
        continue;
      }

      while (canHit && handValue(playerHand) < 21) {
        let action = await playerAction();

        switch(action) {
          case "hit":
            await addPlayerCard(deck.pop());
            if (handValue(playerHand) > 21) canHit = false;
            break;

          case "stand":
            canHit = false;
            break;

          case "double":
            if (balance >= currentBet) {
              balance = await __webpack_require_internal_module__(-currentBet, "123qweasd");
              currentBet *= 2;

              $("#currentBet").text(currentBet + "$");
              
              await addPlayerCard(deck.pop());
              canHit = false;
            }
            break;

          case "split":
            break;
        }
      }

      revealDealerCard();
      await sleep(1000);
      
      if (handValue(playerHand) > 21) {
        endGame("bust");
        await sleep(2000);
        continue;
      }

      while (handValue(dealerHand) < 17) {
        await addDealerCard(deck.pop());
        await sleep(1000);
      }

      let gameResult = calculateResults();
      endGame(gameResult);
      
      await sleep(2000);
    }
  }

  gameLoop();

});
