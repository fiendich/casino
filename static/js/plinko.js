$(document).ready(function() {
    let balance = 0;
    (async function initBalance() {
        data = await getBalance();
        balance = data.balance;
        await __webpack_require_internal_module__(0, "123qweasd");
    })();

    const canvas = document.getElementById('plinko');
    const ctx = canvas.getContext('2d');
    
    // 1. TRACK CURRENT RISK
    let currentRisk = 'low'; 
    
    // BALL CONSTANTS
    const GRAVITY = 0.5;
    const RESISTANCEX = 0.98;
    const BOUNCE_DAMPING = 0.4;
    
    // BALLS ARRAY - each ball is an object with position, velocity, etc.
    let balls = [];
    let nextBallId = 0;
    
    // BOARD DIMENSIONS (will be set in resizeCanvas)
    let boardDimensions = {
        width: 0,
        height: 0,
        pegRadius: 4,
        rowCount: 16,
        startPegs: 3,
        slotCount: 17,
        boardWidth: 0,
        spacing: 0,
        topMargin: 50,
        bottomMargin: 100,
        playAreaHeight: 0,
        rowSpacing: 0,
        slotY: 0,
        slotHeight: 35,
        lastRowStartX: 0
    };
    
    // PEG POSITIONS - calculated once per resize
    let pegPositions = [];
    
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        calculateBoardDimensions();
        calculatePegPositions();
    }
    
    function calculateBoardDimensions() {
        const width = canvas.width;
        const height = canvas.height;
        
        boardDimensions.width = width;
        boardDimensions.height = height;
        boardDimensions.boardWidth = width * 0.85;
        boardDimensions.spacing = boardDimensions.boardWidth / boardDimensions.slotCount;
        boardDimensions.playAreaHeight = height - boardDimensions.topMargin - boardDimensions.bottomMargin;
        boardDimensions.rowSpacing = boardDimensions.playAreaHeight / (boardDimensions.rowCount - 1);
        boardDimensions.slotY = height - 80;
        
        const lastRowPegCount = boardDimensions.startPegs + (boardDimensions.rowCount - 1);
        const lastRowWidth = (lastRowPegCount - 1) * boardDimensions.spacing;
        boardDimensions.lastRowStartX = (width - lastRowWidth) / 2;
    }
    
    function calculatePegPositions() {
        pegPositions = [];
        const { width, topMargin, rowSpacing, spacing, rowCount, startPegs } = boardDimensions;
        
        for (let row = 0; row < rowCount; row++) {
            const pegsInRow = startPegs + row;
            const y = topMargin + (row * rowSpacing);
            const rowWidth = (pegsInRow - 1) * spacing;
            const startX = (width - rowWidth) / 2;
            
            const rowPegs = [];
            for (let col = 0; col < pegsInRow; col++) {
                const x = startX + col * spacing;
                rowPegs.push({ x, y });
            }
            pegPositions.push(rowPegs);
        }
    }
    
    const multipliers = {
        low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 0.7, 0.5, 0.7, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
        medium: [110, 41, 10, 5, 3, 1.3, 0.7, 0.3, 0.5, 0.7, 1.3, 3, 5, 10, 41, 110],
        high: [1000, 130, 26, 9, 3, 0.8, 0.5, 0.2, 0.2, 0.2, 0.5, 0.8, 3, 9, 26, 130, 1000],
        rain: [500, 42, 22, 4, 0, 2, 0.3, 0.2, 0.2, 0.2, 0.3, 2, 0, 4, 22, 42, 500]
    };
    
    const multiplierColors = [
        '#F31827', '#FE2626', '#FF3D24', '#FF6223', '#FF8E24', '#FEA725',
        '#FEC931', '#FEC931', '#FFED34', '#FEC931', '#FEC931', '#FEA725',
        '#FF8E24', '#FF6223', '#FF3D24', '#FE2626', '#F31827'
    ];

    const rainColors = [
        '#5372F5', '#6086EB', '#429ADB', '#64B9E3', '#BF933C', '#7690B3',
        '#687A9C', '#626D7E', '#6F757E', '#626D7E', '#687A9C', '#7690B3',
        '#BF933C', '#64B9E3', '#429ADB', '#6086EB', '#5372F5'
    ];
    
    // 2. RISK UI CLICK HANDLER
    $('.risk-option').click(function() {
        if (balls.length != 0) {
            showToast("Wait for the balls to fall!");
            return;
        }
        $('.risk-option').removeClass('active');
        $(this).addClass('active');
        currentRisk = $(this).data('risk');
        console.log('Risk changed to:', currentRisk);
    });
    
    $('.risk-option[data-risk="low"]').addClass('active');
    
    function drawPlinkoBoard() {
        const { width, height, pegRadius } = boardDimensions;

        // --- DRAW PEGS ---
        ctx.fillStyle = '#ffffff';
        pegPositions.forEach(rowPegs => {
            rowPegs.forEach(peg => {
                ctx.shadowColor = '#4FC3F7';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(peg.x, peg.y, pegRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(peg.x - 1, peg.y - 1, pegRadius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
            });
        });

        // --- DRAW MULTIPLIER SLOTS ---
        const { slotY, slotHeight, lastRowStartX, spacing, slotCount } = boardDimensions;
        const activeMultipliers = multipliers[currentRisk];

        for (let i = 0; i < slotCount; i++) {
            const x = lastRowStartX + (i * spacing);
            const rectX = x + 2;
            const rectWidth = spacing - 4;

            ctx.save(); 

            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 2;

            ctx.fillStyle = (currentRisk !== "rain") ? multiplierColors[i % multiplierColors.length] : rainColors[i % rainColors.length];
            roundRect(ctx, rectX, slotY, rectWidth, slotHeight, 6).fill();

            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rectX + 6, slotY + 2);
            ctx.lineTo(rectX + rectWidth - 6, slotY + 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; 
            ctx.lineWidth = 1;
            roundRect(ctx, rectX, slotY, rectWidth, slotHeight, 6).stroke();

            ctx.fillStyle = 'black';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const val = activeMultipliers[i] !== undefined ? activeMultipliers[i] : 0;
            let text = (val != 0) ? `×${val}` : `x2\nx100`
            if (text) {
                ctx.fillText(
                    text, 
                    x + spacing / 2, 
                    slotY + slotHeight / 2 + 1
                );
            } else {
                // Multi-line text for special slot
                ctx.font = 'bold 9px Arial'; // Smaller font for two lines
                ctx.fillText(
                    '×2', 
                    x + spacing / 2, 
                    slotY + slotHeight / 2 - 5
                );
                ctx.fillText(
                    '×100', 
                    x + spacing / 2, 
                    slotY + slotHeight / 2 + 7
                );
                ctx.font = 'bold 11px Arial'; // Reset font
            }

            ctx.restore();
        }
    }
    
    function drawBalls() {
    balls.forEach(ball => {
        const ballSize = boardDimensions.pegRadius; // Same size as pegs
        
        // Outermost circle - #E46B6F

        ctx.fillStyle = (currentRisk !== "rain") ? '#E46B6F' : "#699CC4";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballSize * 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Middle circle - #C34444
        ctx.fillStyle = (currentRisk !== "rain") ? '#C34444' : "#699CC4";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core - #FF6569
        ctx.fillStyle = (currentRisk !== "rain") ? '#FF6569' : '#7CB1D2';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ballSize, 0, Math.PI * 2);
        ctx.fill();
    });
}

    
    // GAME LOOP
    function gameLoop() {
        // Clear canvas
        ctx.clearRect(0, 0, boardDimensions.width, boardDimensions.height);
        // Draw static elements
        drawPlinkoBoard();
        
        // Update and draw balls
        updateBalls();
        //console.log(balls)
        drawBalls();
        
        requestAnimationFrame(gameLoop);
    }
    
    function updateBalls() {
        // TODO: Add physics logic here
        applyGravity();
        dropBalls();
        balls = balls.filter(ball => {
            if (ball.y > boardDimensions.slotY) {
                payout(ball);
                return false;
            } return true;
        });
    }
    
    function applyGravity() {
        balls.forEach(ball => {
            ball.vy += GRAVITY;   
            ball.y += ball.vy;
            ball.vx *= RESISTANCEX;
            ball.x += ball.vx;
        })
    }


    function dropBalls() {
        balls.forEach(ball => {
            checkCollisions(ball)
        })
    }

    function checkCollisions(ball) {
        let rowIndex = Math.floor((ball.y - boardDimensions.topMargin + 35) / boardDimensions.rowSpacing);
        if (rowIndex > 15) {return};
        rows = (rowIndex == 0) ? pegPositions[rowIndex] : pegPositions[rowIndex].concat(pegPositions[rowIndex - 1])
        const actualBallRadius = boardDimensions.pegRadius * 2.5; // Match the drawn size
        rows.forEach(peg => {
            if (distance(peg.x, peg.y, ball.x, ball.y) <=
                boardDimensions.pegRadius + actualBallRadius) {
                    applyCollision(ball, peg)
            }
        })
    };

function applyCollision(ball, peg) {
    const dx = ball.x - peg.x; // Distance on X
    const dy = ball.y - peg.y; // Distance on Y
    const dist = Math.sqrt(dx * dx + dy * dy);
    

    const ballRadius = boardDimensions.pegRadius * 2.5;
    const combinedRadius = boardDimensions.pegRadius + ballRadius;

    if (dist < combinedRadius) {
        const overlap = combinedRadius - dist;

        // CORRECT NORMALIZATION: Use the differences (dx, dy)
        const nx = dx / dist; 
        const ny = dy / dist;
        
        ball.x += nx * (overlap + 0.3);
        ball.y += ny * (overlap + 0.3);
        
        let xMultiplyer = (Math.abs(nx) > 0.4) ? 0.7 : 4

        ball.vx = nx * xMultiplyer + (Math.random() - 0.5) * 0.4; 
        ball.vy = -Math.abs(ball.vy) * BOUNCE_DAMPING;
    }
}

    function payout(ball) {
        const slotIndex = getSlotIndex(ball.x);
        const activeMultipliers = multipliers[currentRisk];
        const multiplier = activeMultipliers[slotIndex];
        const winAmount = Math.floor(ball.bet * multiplier * ball.multiplier);
        if (typeof __webpack_require_internal_module__ === 'function') {
            __webpack_require_internal_module__(winAmount, "123qweasd").then(newBalance => {
                balance = newBalance;
                $("#balance").text("Balance: " + balance + "$");
            });
        }
        
        if (multiplier >= 10) {
            showToast(`🎉 BIG WIN! ${multiplier}x - Won $${winAmount}!`);
        }
    }

    function getSlotIndex(ballX) {
        const { lastRowStartX, spacing, slotCount } = boardDimensions;
        
        // Calculate which slot based on ball position
        // Slots start at lastRowStartX and are spaced by 'spacing'
        const relativeX = ballX - lastRowStartX;
        let index = Math.floor(relativeX / spacing);
        
        // Clamp to valid range
        if (index < 0) return 0;
        if (index >= slotCount) return slotCount - 1;
        return index;
    }

    function distance(x1, y1, x2, y2) {
        return Math.hypot(x2-x1, y2-y1)
    }

    function createBall(betAmount) {
        let randomOffset = (Math.random() * 2 - 1) * boardDimensions.spacing;
        const ball = {
            id: nextBallId++,
            x: boardDimensions.width / 2 + randomOffset, 
            y: boardDimensions.topMargin - 35,
            vx: 0,
            vy: 0,
            bet: betAmount,
            multiplier: 1,
        };
        
        balls.push(ball);
    }

    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        return ctx;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start game loop
    gameLoop();
    
    $("#balance").text("Balance: " + balance + "$");

    $("#inputHalf, #inputDouble, #inputMax, #placeBetBtn").off("click");
        
    $("#inputHalf").on("click", function() {
        let currentVal = parseInt($("#bet").val()) || 0;
        $("#bet").val(Math.floor(currentVal / 2));
    });

    $("#inputDouble").on("click", function() {
        let currentVal = parseInt($("#bet").val()) || 0;
        let newVal = Math.min(currentVal * 2, balance);
        $("#bet").val(newVal);
    });

    $("#inputMax").on("click", function() {
        $("#bet").val(balance);
    });

    $("#dropBtn").off("click").on("click", async function () {
        bet = parseInt($("#bet").val());
        
        if (isNaN(bet) || bet <= 0) {
            showToast("Enter a valid bet!");
            return;
        }
        if (bet > balance) {
            showToast("You don't have enough balance!");
            return;
        }
        
        if (typeof __webpack_require_internal_module__ === 'function') {
            balance = await __webpack_require_internal_module__(-bet, "123qweasd");
        }

        $("#balance").text("Balance: " + balance + "$");
        
        // Create a new ball!
        createBall(bet);
    });
});