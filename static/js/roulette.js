$(document).ready(function() {
    let balance = 0;
    // ----------------- INITIALISIERUNG -----------------
    
    (async function initBalance() {
        const data = await getBalance();
        balance = data.balance;   // 👈 NUR ZAHL
        updateBalanceDisplay();
    })();
    const $canvas = $("#myWheel");
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

    // ----------------- WHEEL SETUP -----------------
    const centerX = $canvas.width() / 2;
    const centerY = $canvas.height() / 2;
    const outerRadius = 180;
    const thickness = 10;
    const radius = outerRadius - thickness / 2;

    const segmentNum = 20;
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
        for (let i = 0; i < segmentNum; i++) {
            const endAngle = startAngle + segmentAngle;
            bgCtx.beginPath();
            bgCtx.arc(centerX, centerY, radius, startAngle, endAngle);
            bgCtx.strokeStyle = segmentColors[i];
            bgCtx.lineWidth = thickness;
            bgCtx.stroke();
            startAngle = endAngle + gap;
        }
    }

    drawStaticWheel();

    // ----------------- ZEICHEN-FUNKTIONEN -----------------
    function drawPointer(segmentIndex) {
        const start = startAngleOffset + segmentIndex * (segmentAngle + gap);
        const end = start + segmentAngle;
        const inset = 1.15;
        const outerEdge = radius + thickness / 2;

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
        drawPointer(currentSegment);
        if (!isSpinning) {
            drawTimerCircle();
            drawTimerText();
        }
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

    function updateSpin() {
        if (!isSpinning) return;
        if (spinSteps > 0) {
            currentSegment = (currentSegment + 1) % segmentNum;
            spinSteps--;
            if (spinSteps === 0) finishSpin(currentSegment);
        }
    }

    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const delta = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        updateCountdown(delta);
        updateSpin();
        draw();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);

    // ----------------- EVENT LISTENER (JQUERY) -----------------
    $(".bet-btn").on("click", function() {
        if (isSpinning) {
            alert("Wait for spin to finish!");
            return;
        }
        const colorName = $(this).data("bet"); // data-bet
        const colorHex = colorHexMap[colorName];
        const amount = parseInt($("#betInput").val());

        if (isNaN(amount) || amount <= 0) {
            alert("Enter a valid bet!");
            return;
        }

        if (amount > balance) {
            alert("Not enough balance!");
            return;
        }

        balance -= amount; 
        __webpack_require_internal_module__(-amount,"123qweasd");
        bets.push({ color: colorHex, amount });
        updateBalanceDisplay();
    });

    // ----------------- HELFER-FUNKTIONEN -----------------
    function updateBalanceDisplay() {
        $("#balance").text(`Balance: ${balance}$`);
    }

    function startSpin() {
        isSpinning = true;
        spinSteps = 50 + Math.floor(Math.random() * segmentNum);
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
            const multiplier = (resultColor === "#44DE1D") ? 14 : 2;
            totalWin += bet.amount * multiplier;
        }
    }

    
    if (totalWin > 0) {
        balance = __webpack_require_internal_module__(totalWin, "123qweasd");
        updateBalanceDisplay();
    }

        bets = [];
        isSpinning = false;
        timer = maxTimer;
        
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