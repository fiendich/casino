$(document).ready(function() {
    let balance = null;

    (async function initBalance() {
        const data = await getBalance();
        balance = data.balance;
        await __webpack_require_internal_module__(0, "123qweasd");
        updateBalanceDisplay();
        $("#balance").animate({"opacity":"1"}, 300);
    })();

    const scaleFactor = 1.3;
    const $canvas = $("#myWheel");
    $canvas.attr("width", $canvas.width()).attr("height", $canvas.height());
    const ctx = $canvas[0].getContext("2d");

    const colorHexMap = { red: "#B40000", blue: "#203B5A", green: "#44DE1D" };

    let bets = [];
    let timer = 10;
    const MAXTIMER = 10;
    let lastTime = null;
    let isSpinning = false;
    let isFinishing = false;
    let currentSegment = 0;
    const history = [];
    let pendingBalanceUpdate = null;
    let spinDuration = 3500;
    let spinStartTime = null;
    let spinTargetIndex = 0;
    let spinSteps = 0;

    const centerX = $canvas.width() / 2;
    const centerY = $canvas.height() / 2;
    const outerRadius = 180 * scaleFactor;
    const thickness = 15 * scaleFactor;
    const radius = outerRadius - thickness / 2;
    const segmentNum = 21;
    const numbers = [0, 17, 8, 3, 14, 1, 6, 19, 20, 5, 12, 9, 2, 7, 16, 11, 4, 13, 18, 15, 10];
    const gap = 0.12;
    const segmentAngle = (Math.PI * 2 - segmentNum * gap) / segmentNum;
    const startAngleOffset = -Math.PI / 2 - segmentAngle / 2;

    const segmentColors = numbers.map((num, i) => {
        if (i === 0) return "#44DE1D";
        return num % 2 !== 0 ? "#203B5A" : "#B40000";
    });

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
        bgCtx.fillStyle = "#fff";
        for (let i = 0; i < segmentNum; i++) {
            const endAngle = startAngle + segmentAngle;
            bgCtx.beginPath();
            bgCtx.arc(centerX, centerY, radius, startAngle, endAngle);
            bgCtx.strokeStyle = segmentColors[i];
            bgCtx.lineWidth = thickness;
            bgCtx.stroke();
            const angle = startAngle + segmentAngle / 2;
            bgCtx.fillText(numbers[i], centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
            startAngle = endAngle + gap;
        }
    }
    drawStaticWheel();

    function drawPointer(idx) {
        const start = startAngleOffset + idx * (segmentAngle + gap);
        const end = start + segmentAngle;
        const inset = 1.23;
        const outerEdge = (radius + thickness * 0.1) - 8.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + outerEdge * Math.cos(start + segmentAngle * inset), centerY + outerEdge * Math.sin(start + segmentAngle * inset));
        ctx.lineTo(centerX + outerEdge * Math.cos(end - segmentAngle * inset), centerY + outerEdge * Math.sin(end - segmentAngle * inset));
        ctx.closePath();
        ctx.fillStyle = segmentColors[idx];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawTimerCircle() {
        const r = radius - 50;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, -Math.PI / 2, -Math.PI / 2 + (timer / MAXTIMER) * Math.PI * 2);
        ctx.strokeStyle = "#00BFFF";
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    function draw() {
        ctx.clearRect(0, 0, $canvas.width(), $canvas.height());
        ctx.drawImage(bgCanvas, 0, 0);
        if (!isSpinning) {
            drawTimerCircle();
            ctx.font = "28px Arial";
            ctx.fillStyle = "#00BFFF";
            ctx.textAlign = "center";
            ctx.fillText(timer.toFixed(1) + "s", centerX, centerY + 40);
        }
        drawPointer(currentSegment);
    }

    function updateCountdown(delta) {
        if (isSpinning) return;
        timer -= delta;
        if (timer <= 0) { timer = 0; startSpin(); }
    }

    function updateSpin(timestamp) {
        if (!isSpinning || isFinishing) return;
        const progress = Math.min((timestamp - spinStartTime) / spinDuration, 1);
        if (progress >= 1) { currentSegment = spinTargetIndex; finishSpin(currentSegment); return; }
        currentSegment = Math.round(spinSteps * (1 - Math.pow(1 - progress, 3.5))) % segmentNum;
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

    function startSpin() {
        isSpinning = true;
        spinStartTime = performance.now();
        spinTargetIndex = Math.floor(Math.random() * segmentNum);
        spinSteps = segmentNum * 6 + spinTargetIndex;
    }

    function finishSpin(segmentIndex) {
        if (isFinishing) return;
        isFinishing = true;
        const landedNumber = numbers[segmentIndex];
        const resultColor = landedNumber === 0 ? "#44DE1D" : landedNumber % 2 !== 0 ? "#203B5A" : "#B40000";
        addToHistory(resultColor, landedNumber);

        let totalWin = 0;
        for (const bet of bets) {
            if (bet.color === resultColor) totalWin += bet.amount * (resultColor === "#44DE1D" ? 20 : 2);
            else if (resultColor === "#44DE1D" && bet.color != null) totalWin += bet.amount;
            if (bet.number != null && bet.number === landedNumber) totalWin += bet.amount * 20;
            if (bet.rangeMin != null && landedNumber >= bet.rangeMin && landedNumber <= bet.rangeMax) totalWin += bet.amount * 3;
        }

        if (totalWin > 0) __webpack_require_internal_module__(totalWin, "123qweasd");

        isSpinning = false;
        isFinishing = false;
        timer = MAXTIMER;
        bets = [];
        $(".number-bet-btn, .bet-btn[data-bet], .range-bet-btn").css({ "filter": "", "background": "", "border": "", "box-shadow": "" });

        if (totalWin > 0) {
            const check = setInterval(() => {
                if (pendingBalanceUpdate !== null) {
                    balance = pendingBalanceUpdate;
                    pendingBalanceUpdate = null;
                    updateBalanceDisplay();
                    clearInterval(check);
                }
            }, 50);
        }
    }

    function updateBalanceDisplay() {
        $("#balance").text(`${(parseFloat(balance) || 0).toFixed(2)}$`);
    }

    function addToHistory(color, number) {
        history.push({color, number});
        if (history.length > 10) history.shift();
        const $bar = $("#historyBar").empty();
        $.each(history, (i, e) => $("<div>").css({
            width: "32px", height: "32px", borderRadius: "50%", backgroundColor: e.color,
            border: "2px solid rgba(255,255,255,0.2)", display: "inline-flex",
            alignItems: "center", justifyContent: "center", color: "#fff",
            fontSize: "11px", fontWeight: "bold", marginRight: "5px",
            boxShadow: `0 0 8px ${e.color}88`, animation: "popIn 0.3s ease"
        }).text(e.number).appendTo($bar));
    }

    // ---- BET HIGHLIGHTS ----
    const colorSpectrums = {
        red:      { dark: [180, 0, 0],   light: [255, 45, 85]  },
        blue:     { dark: [32, 59, 90],  light: [80, 160, 255] },
        green:    { dark: [68, 222, 29], light: [160, 255, 100] },
        "#B40000":{ dark: [180, 0, 0],   light: [255, 45, 85]  },
        "#203B5A":{ dark: [32, 59, 90],  light: [80, 160, 255] },
        "#44DE1D":{ dark: [68, 222, 29], light: [160, 255, 100] }
    };

    function applyHighlight($el, amount, maxAmount) {
        const spectrum = $el.hasClass("red-num") ? colorSpectrums.red :
                         $el.hasClass("blue-num") ? colorSpectrums.blue :
                         $el.hasClass("green-num") ? colorSpectrums.green :
                         colorSpectrums[$el.data("bet") ? colorHexMap[$el.data("bet")] : null] || colorSpectrums.blue;
        const p = Math.min(0.15 + (amount / maxAmount) * 0.85, 1.0);
        const r = Math.round(spectrum.dark[0] + (spectrum.light[0] - spectrum.dark[0]) * p);
        const g = Math.round(spectrum.dark[1] + (spectrum.light[1] - spectrum.dark[1]) * p);
        const b = Math.round(spectrum.dark[2] + (spectrum.light[2] - spectrum.dark[2]) * p);
        const dr = Math.round(r * 0.6), dg = Math.round(g * 0.6), db = Math.round(b * 0.6);
        $el.css({ background: `linear-gradient(145deg, rgb(${r},${g},${b}), rgb(${dr},${dg},${db}))`, filter: "", border: "2px solid #FFD700", boxShadow: "0 0 10px rgba(255,215,0,0.6)" });
    }

    function updateNumberBetHighlights() {
        const map = {};
        bets.filter(b => b.number != null).forEach(b => map[b.number] = (map[b.number] || 0) + b.amount);
        const max = Math.max(...Object.values(map));
        $(".number-bet-btn").each(function() {
            const num = parseInt($(this).data("number"));
            if (!map[num]) { $(this).css({ background: "", border: "", boxShadow: "" }); return; }
            applyHighlight($(this), map[num], max);
        });
    }

    function updateColorBetHighlights() {
        const map = {};
        bets.filter(b => b.color != null).forEach(b => map[b.color] = (map[b.color] || 0) + b.amount);
        const max = Math.max(...Object.values(map));
        $(".bet-btn[data-bet]").each(function() {
            const hex = colorHexMap[$(this).data("bet")];
            if (!map[hex]) { $(this).css({ background: "", border: "", boxShadow: "" }); return; }
            applyHighlight($(this), map[hex], max);
        });
    }

    function updateRangeBetHighlights() {
        const map = {};
        bets.filter(b => b.rangeMin != null).forEach(b => { const k = `${b.rangeMin}-${b.rangeMax}`; map[k] = (map[k] || 0) + b.amount; });
        const max = Math.max(...Object.values(map));
        $(".range-bet-btn").each(function() {
            const key = `${$(this).data("range-min")}-${$(this).data("range-max")}`;
            if (!map[key]) { $(this).css({ background: "", border: "", boxShadow: "" }); return; }
            applyHighlight($(this), map[key], max);
        });
    }

    // ---- EVENT LISTENERS ----
    $(".bet-btn").on("click", function() {
        const colorName = $(this).data("bet");
        if (!colorName || isSpinning) { if (isSpinning) showToast("Wait for spin to finish!"); return; }
        const amount = parseFloat($("#betInput").val());
        if (isNaN(amount) || amount <= 0) { showToast("Enter a valid bet!"); return; }
        if (amount > balance) { showToast("Not enough balance!"); return; }
        balance -= amount;
        __webpack_require_internal_module__(-amount, "123qweasd");
        bets.push({ color: colorHexMap[colorName], amount });
        updateBalanceDisplay();
        updateColorBetHighlights();
    });

    $(".number-bet-btn").on("click", function() {
        if (isSpinning) { showToast("Wait for spin to finish!"); return; }
        const amount = parseFloat($("#betInput").val());
        if (isNaN(amount) || amount <= 0) { showToast("Enter a valid bet!"); return; }
        if (amount > balance) { showToast("Not enough balance!"); return; }
        balance -= amount;
        __webpack_require_internal_module__(-amount, "123qweasd");
        bets.push({ number: $(this).data("number"), amount });
        $(this).addClass("active");
        updateBalanceDisplay();
        updateNumberBetHighlights();
    });

    $(".range-bet-btn").on("click", function() {
        if (isSpinning) { showToast("Wait for spin to finish!"); return; }
        const amount = parseFloat($("#betInput").val());
        if (isNaN(amount) || amount <= 0) { showToast("Enter a valid bet!"); return; }
        if (amount > balance) { showToast("Not enough balance!"); return; }
        balance -= amount;
        __webpack_require_internal_module__(-amount, "123qweasd");
        bets.push({ rangeMin: parseInt($(this).data("range-min")), rangeMax: parseInt($(this).data("range-max")), amount });
        updateBalanceDisplay();
        updateRangeBetHighlights();
    });

    $("#inputHalf").on("click", () => $("#betInput").val(Math.max(1, Math.floor(parseFloat($("#betInput").val()) / 2))));
    $("#inputDouble").on("click", () => $("#betInput").val(Math.min((parseFloat($("#betInput").val()) || 0) * 2, balance)));
    $("#inputMax").on("click", () => $("#betInput").val(balance));

    updateBalanceDisplay();

    window.testDistribution = function(spinCount = 1000) {
        console.log(`🚀 Starting ${spinCount} spin test...`);
        const colorCount = { "#44DE1D": 0, "#B40000": 0, "#203B5A": 0 };
        const numberCount = {};
        const rangeCount = { "0-6": 0, "7-13": 0, "14-20": 0 };
        numbers.forEach(n => numberCount[n] = 0);

        for (let i = 0; i < spinCount; i++) {
            const landedNumber = numbers[Math.floor(Math.random() * segmentNum)];
            const color = landedNumber === 0 ? "#44DE1D" : landedNumber % 2 !== 0 ? "#203B5A" : "#B40000";
            colorCount[color]++;
            numberCount[landedNumber]++;
            if (landedNumber <= 6) rangeCount["0-6"]++;
            else if (landedNumber <= 13) rangeCount["7-13"]++;
            else rangeCount["14-20"]++;
        }

        const colorNames = { "#44DE1D": "Green", "#B40000": "Red  ", "#203B5A": "Blue " };
        const colorExp = { "#44DE1D": (1/21*100).toFixed(2), "#B40000": (10/21*100).toFixed(2), "#203B5A": (10/21*100).toFixed(2) };
        console.log(`\n===== COLOR (${spinCount} spins) =====`);
        for (const [hex, count] of Object.entries(colorCount))
            console.log(`${colorNames[hex]} | ${count} | ${(count/spinCount*100).toFixed(2)}% | expected ${colorExp[hex]}%`);

        console.log(`\n===== RANGES =====`);
        for (const [range, count] of Object.entries(rangeCount))
            console.log(`${range} | ${count} | ${(count/spinCount*100).toFixed(2)}% | expected ${(7/21*100).toFixed(2)}%`);

        console.log(`\n===== NUMBERS =====`);
        for (let n = 0; n <= 20; n++)
            console.log(`${n} | ${numberCount[n]} | ${(numberCount[n]/spinCount*100).toFixed(2)}% | expected ${(1/21*100).toFixed(2)}%`);
    };
});