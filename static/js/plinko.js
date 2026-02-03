$(document).ready(function() {

    (async function initBalance() {
        balance = await getBalance();
        await __webpack_require_internal_module__(0, "123qweasd");
    })();


    const canvas = document.getElementById('plinko');
    const ctx = canvas.getContext('2d');
    
    // 1. TRACK CURRENT RISK
    let currentRisk = 'low'; 
    
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        drawPlinkoBoard();
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
        
        // Update the currentRisk variable
        currentRisk = $(this).data('risk');
        console.log('Risk changed to:', currentRisk);
        
        // Redraw the board immediately
        drawPlinkoBoard();
    });
    
    $('.risk-option[data-risk="low"]').addClass('active');
    
    function drawPlinkoBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const pegRadius = 4;
        
        const rowCount = 16; 
        const startPegs = 3; 
        const slotCount = 17; 
        
        const boardWidth = width * 0.85; 
        const spacing = boardWidth / slotCount;

        const topMargin = 50;
        const bottomMargin = 100;
        const playAreaHeight = height - topMargin - bottomMargin;
        const rowSpacing = playAreaHeight / (rowCount - 1);

        // --- DRAW PEGS ---
        ctx.fillStyle = '#ffffff';
        for (let row = 0; row < rowCount; row++) {
            const pegsInRow = startPegs + row;
            const y = topMargin + (row * rowSpacing);
            const rowWidth = (pegsInRow - 1) * spacing;
            const startX = (width - rowWidth) / 2;

            for (let col = 0; col < pegsInRow; col++) {
                const x = startX + col * spacing;
                ctx.shadowColor = '#4FC3F7';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(x - 1, y - 1, pegRadius * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
            }
        }

        // --- DRAW MULTIPLIER SLOTS ---
        const slotHeight = 35;
        const slotY = height - 80;
        
        const lastRowPegCount = startPegs + (rowCount - 1); 
        const lastRowWidth = (lastRowPegCount - 1) * spacing;
        const lastRowStartX = (width - lastRowWidth) / 2;

        // Get the specific array for the current risk
        const activeMultipliers = multipliers[currentRisk];

        for (let i = 0; i < slotCount; i++) {
            const x = lastRowStartX + (i * spacing);
            const rectX = x + 2;
            const rectWidth = spacing - 4;

            ctx.save(); 

            // White shadow/glow
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 2;

            ctx.fillStyle = multiplierColors[i % multiplierColors.length];
            roundRect(ctx, rectX, slotY, rectWidth, slotHeight, 6).fill();

            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // Inner highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(rectX + 6, slotY + 2);
            ctx.lineTo(rectX + rectWidth - 6, slotY + 2);
            ctx.stroke();

            // Border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; 
            ctx.lineWidth = 1;
            roundRect(ctx, rectX, slotY, rectWidth, slotHeight, 6).stroke();

            // Multiplier text - NOW DYNAMIC
            ctx.fillStyle = 'black';
            ctx.font = 'bold 11px Arial'; // Slightly smaller font for large numbers
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
        })
        
        
        console.log('Drop button clicked - add ball dropping logic here');
        // You'll add ball creation here later
});