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
    const BALL_RADIUS = 6;
    const GRAVITY = 0.3;
    const BOUNCE_DAMPING = 0.7;
    const HORIZONTAL_BOUNCE = 0.5;
    
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
    
    // Calculate which slot a ball landed in based on x position
    function getSlotIndex(ballX) {
        const { lastRowStartX, spacing, slotCount } = boardDimensions;
        
        for (let i = 0; i < slotCount; i++) {
            const slotCenterX = lastRowStartX + (i * spacing);
            const slotLeft = slotCenterX - spacing / 2;
            const slotRight = slotCenterX + spacing / 2;
            
            if (ballX >= slotLeft && ballX < slotRight) {
                return i;
            }
        }
        
        // Edge cases
        if (ballX < lastRowStartX) return 0;
        if (ballX >= lastRowStartX + (slotCount - 1) * spacing) return slotCount - 1;
        
        return Math.floor((ballX - lastRowStartX) / spacing);
    }
    
    const multipliers = {
        low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
        medium: [110, 41, 10, 5, 3, 1.5, 0.5, 0.3, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
        high: [1000, 130, 26, 9, 4, 2, 0.5, 0.2, 0.2, 0.2, 0.5, 2, 4, 9, 26, 130, 1000],
        rain: [5000, 250, 15, 1.2, 0.7, 0.5, 0.2, 0.2, 0.2, 0.2, 0.2, 0.5, 0.7, 1.2, 15, 250, 5000]
    };
    
    const multiplierColors = [
        '#F31827', '#FE2626', '#FF3D24', '#FF6223', '#FF8E24', '#FEA725',
        '#FEC931', '#FEC931', '#FFED34', '#FEC931', '#FEC931', '#FEA725',
        '#FF8E24', '#FF6223', '#FF3D24', '#FE2626', '#F31827'
    ];
    
    // 2. RISK UI CLICK HANDLER
    $('.risk-option').click(function() {
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

            ctx.fillStyle = multiplierColors[i % multiplierColors.length];
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
            ctx.fillText(
                `×${val}`, 
                x + spacing / 2, 
                slotY + slotHeight / 2 + 1
            );

            ctx.restore();
        }
    }
    
    function drawBalls() {
        balls.forEach(ball => {
            // Draw ball shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(ball.x + 2, ball.y + 2, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw ball
            const gradient = ctx.createRadialGradient(
                ball.x - BALL_RADIUS * 0.3, 
                ball.y - BALL_RADIUS * 0.3, 
                0,
                ball.x, 
                ball.y, 
                BALL_RADIUS
            );
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            
            // Ball highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(ball.x - BALL_RADIUS * 0.4, ball.y - BALL_RADIUS * 0.4, BALL_RADIUS * 0.3, 0, Math.PI * 2);
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
        drawBalls();
        
        requestAnimationFrame(gameLoop);
    }
    
    function updateBalls() {
        // TODO: Add physics logic here
        // - Apply gravity
        // - Check collisions with pegs
        // - Check if ball reached bottom
        // - Remove finished balls and award winnings
        
        balls = balls.filter(ball => {
            // For now, just keep all balls
            // Later: return false to remove balls that finished
            return true;
        });
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
            finished: false
        };
        
        balls.push(ball);
        console.log('Ball created:', ball);
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