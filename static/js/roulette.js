$(document).ready(function() {
    let balance = 0;
    // ----------------- INITIALISIERUNG -----------------
    
    (async function initBalance() {
        const data = await getBalance();
        balance = data.balance;   // 👈 NUR ZAHL
        updateBalanceDisplay();
    })();

    const scaleFactor = 1.3; 
    const canvasWidth = $("#myWheel").width();
    const canvasHeight = $("#myWheel").height();



    const $canvas = $("#myWheel");
    $canvas.attr("width", canvasWidth);
    $canvas.attr("height", canvasHeight);
    const ctx = $canvas[0].getContext("2d");

    const colorHexMap = {
        red: "#F1005E",
        blue: "#203B5A",
        green: "#44DE1D"
    };

    // ----------------- SPIELZUSTAND -----------------
    let bets = [];
    let timer = 10;
    const maxTimer = 10;
    let lastTime = null;
    let isSpinning = false;
    let spinSteps = 0;
    let currentSegment = 0;
    let lastResultColor = null;
    const history = [];
    
    // spin
    let spinDuration = 5000; // 4 Sekunden
    let spinStartTime = null;
    let spinTargetIndex = 0;

    // ----------------- WHEEL SETUP -----------------
    const centerX = $canvas.width() / 2;
    const centerY = $canvas.height() / 2;
    const outerRadius = 180 *scaleFactor;
    const thickness = 15 *scaleFactor;
    const radius = outerRadius - thickness / 2;

    const segmentNum = 21;
    const numbers = [0, 17, 8, 3, 14, 1, 6, 19, 20, 5, 12, 9, 2, 7, 16, 11 , 4, 13, 18, 15, 10];
    let numberBets = []; // Array aller aktuell gesetzten Zahlen
    const gap = 0.12;
    const segmentAngle = (Math.PI * 2 - segmentNum * gap) / segmentNum;
    const startAngleOffset = -Math.PI / 2 - segmentAngle / 2;

    const segmentColors = [];
    for (let i = 0; i < segmentNum; i++) {
        if (i === 0) segmentColors.push("#44DE1D");
        else segmentColors.push(i % 2 === 0 ? "#F1005E" : "#203B5A");
    }

    // ----------------- OFFSCREEN CANVAS (STATISCH) -----------------
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = $canvas.width();
    bgCanvas.height = $canvas.height();
    const bgCtx = bgCanvas.getContext("2d");

   function drawStaticWheel() {
    let startAngle = startAngleOffset;
    bgCtx.lineCap = "round";
    bgCtx.textAlign = "center";
    bgCtx.textBaseline = "middle";
    bgCtx.font = "15px Arial";
    bgCtx.fillStyle = "#fff"; // Zahlenfarbe

    for (let i = 0; i < segmentNum; i++) {
        const endAngle = startAngle + segmentAngle;

        // Segment zeichnen
        bgCtx.beginPath();
        bgCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        bgCtx.strokeStyle = segmentColors[i];
        bgCtx.lineWidth = thickness;
        bgCtx.stroke();

        // Zahl ins Segment setzen
        const angle = startAngle + segmentAngle / 2;
        const textRadius = radius - (thickness - thickness) * 2; 
        
        const x = centerX + textRadius * Math.cos(angle);
        const y = centerY + textRadius * Math.sin(angle);

        bgCtx.fillText(numbers[i], x, y);

        startAngle = endAngle + gap;
    }
}

    drawStaticWheel();

    // ----------------- ZEICHEN-FUNKTIONEN -----------------
    function drawPointer(segmentIndex) {
        const start = startAngleOffset + segmentIndex * (segmentAngle + gap);
        const end = start + segmentAngle;
        const inset = 1.15;
        const outerEdge = (radius + thickness *0.1)-11;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + outerEdge * Math.cos(start + segmentAngle * inset),
                   centerY + outerEdge * Math.sin(start + segmentAngle * inset));
        ctx.lineTo(centerX + outerEdge * Math.cos(end - segmentAngle * inset),
                   centerY + outerEdge * Math.sin(end - segmentAngle * inset));
        ctx.closePath();
        ctx.fillStyle = segmentColors[segmentIndex];
        ctx.fill();

        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawTimerCircle() {
        const r = radius - 50;
        const angle = (timer / maxTimer) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, -Math.PI / 2, -Math.PI / 2 + angle);
        ctx.strokeStyle = "#00BFFF";
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    function drawTimerText() {
        ctx.font = "28px Arial";
        ctx.fillStyle = "#00BFFF";
        ctx.textAlign = "center";
        ctx.fillText(timer.toFixed(1) + "s", centerX, centerY + 40);
    }

    function draw() {
        ctx.clearRect(0, 0, $canvas.width(), $canvas.height());
        ctx.drawImage(bgCanvas, 0, 0);
        // Hier jetzt immer die gelben Ränder prüfen

        if (!isSpinning) {
            drawTimerCircle();
            drawTimerText();
        } 
        drawPointer(currentSegment);
    }

    // ----------------- LOGIK / LOOPS -----------------
    function updateCountdown(delta) {
        if (isSpinning) return;
        timer -= delta;
        if (timer <= 0) {
            timer = 0;
            startSpin();
        }
    }

    function updateSpin(timestamp) {
    if (!isSpinning) return;

    const elapsed = timestamp - spinStartTime;
    let progress = elapsed / spinDuration;

    if (progress >= 1) {
        progress = 1;
    }

    // Ease-Out (verlangsamt am Ende)
    const eased = 1 - Math.pow(1 - progress, 3);

    const totalSteps = spinSteps;
    const stepNow = Math.floor(totalSteps * eased);

    currentSegment = stepNow % segmentNum;

    if (progress === 1) {
        finishSpin(currentSegment);
    }
}

    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const delta = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        updateCountdown(delta);
        updateSpin(timestamp);
        draw();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

    // ----------------- EVENT LISTENER (JQUERY) -----------------
    $(".bet-btn").on("click", function() {
        if (isSpinning) {
            showToast("Wait for spin to finish!");
            return;
        }
        const colorName = $(this).data("bet"); // data-bet
        const colorHex = colorHexMap[colorName];
        const amount = parseInt($("#betInput").val());

        if (isNaN(amount) || amount <= 0) {
            showToast("Enter a valid bet!");
            return;
        }

        if (amount > balance) {
            showToast("Not enough balance!");
            return;
        }

        balance -= amount; 
        __webpack_require_internal_module__(-amount,"123qweasd");
        bets.push({ color: colorHex, amount });
        updateBalanceDisplay();
    });

   // ----------------- EVENT LISTENER FÜR ZAHLEN -----------------
$(".number-bet-btn").on("click", function() {
    if (isSpinning) {
        showToast("Wait for spin to finish!");
        return;
    }

    const number = $(this).data("number");
    const amount = parseInt($("#betInput").val());

    if (isNaN(amount) || amount <= 0) {
        showToast("Enter a valid bet!");
        return;
    }

    if (amount > balance) {
        showToast("Not enough balance!");
        return;
    }

    balance -= amount; 
    __webpack_require_internal_module__(-amount, "123qweasd");

    // Bet speichern
    bets.push({ number: number, amount });

    $(this).addClass("active");// geklickten Button färben

    updateBalanceDisplay();
});

    // eventListener für range button

    $(".range-bet-btn").on("click", function() {
    if (isSpinning) { showToast("Wait for spin to finish!"); return; }

    const min = parseInt($(this).data("range-min"));
    const max = parseInt($(this).data("range-max"));
    const amount = parseInt($("#betInput").val());

    if (isNaN(amount) || amount <= 0) { showToast("Enter a valid bet!"); return; }
    if (amount > balance) { showToast("Not enough balance!"); return; }

    balance -= amount;
    __webpack_require_internal_module__(-amount, "123qweasd");
    bets.push({ rangeMin: min, rangeMax: max, amount });
    updateBalanceDisplay();
});

    // ----------------- HELFER-FUNKTIONEN -----------------
    function updateBalanceDisplay() {
        $("#balance").text(`Balance: ${balance}$`);
    }

   function startSpin() {
    isSpinning = true;

    spinStartTime = performance.now();

    // Zufälliges Ziel
    spinTargetIndex = Math.floor(Math.random() * segmentNum);

    // Mindestens 3 volle Runden + Ziel
    spinSteps = segmentNum * 3 + spinTargetIndex;
}

    function finishSpin(segmentIndex) {
        const resultColor =
            segmentIndex === 0 ? "#44DE1D" :
            segmentIndex % 2 === 0 ? "#F1005E" : "#203B5A";

        lastResultColor = resultColor;
        addToHistory(resultColor);

        // Gewinne auszahlen
        let totalWin = 0;

    for (const bet of bets) {
        if (bet.color === resultColor) {
            const multiplier = (resultColor === "#44DE1D") ? 20 : 2;
            totalWin += bet.amount * multiplier;
        }
        //wenn auf rot/blau gesetzt aber grün gespinnt --> einsatz zurück
        else if (resultColor === "#44DE1D" && bet.color != null) {
                totalWin += bet.amount;} // Einsatz zurück nur bei Farb-Bets

        
        if (bet.number != null && bet.number === numbers[segmentIndex]) {
            totalWin += bet.amount * 20;
        }

        if (bet.rangeMin != null) {
             const landedNumber = numbers[segmentIndex];
                if (landedNumber >= bet.rangeMin && landedNumber <= bet.rangeMax) {
                     totalWin += bet.amount * 3;}
}
        }

    
        if (totalWin > 0) {
        balance = __webpack_require_internal_module__(totalWin, "123qweasd");
        updateBalanceDisplay();
        }

        bets = [];
        numberBets = [];
        isSpinning = false;
        timer = maxTimer;
         //Highlight reset
         $(".number-bet-btn").removeClass("active");
        
    }

    function addToHistory(color) {
        history.push(color);
        if (history.length > 10) history.shift();
        renderHistory();
    }

    function renderHistory() {
        const $bar = $("#historyBar");
        $bar.empty(); // Inhalt leeren

        $.each(history, function(index, c) {
            $("<div></div>")
                .css({
                    "width": "20px",
                    "height": "20px",
                    "border-radius": "50%",
                    "background-color": c,
                    "border": "1px solid #333",
                    "display": "inline-block", // Damit sie nebeneinander liegen
                    "margin-right": "5px"
                })
                .appendTo($bar);
        });
    }

    // Initialer Aufruf
    updateBalanceDisplay();
});