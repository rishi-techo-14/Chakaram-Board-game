/**
 * Chakaram Game Engine - Turn-based 5x5 Tamil Daayam Rules & AI
 * 
 * Rules:
 * - 4 Players: Player 1 (South - Teak), Player 2 (North - Rosewood),
 *              Player 3 (East - Sandalwood), Player 4 (West - Red Cedar)
 * - 4 Coins per player (Total 16 coins)
 * - Safe Houses: 8 fortress tiles (4 corners + 4 edge midpoints)
 * - Entry Condition: Roll of 1 (Daayam), 5, 6, or 12 unlocks a coin from home to active path.
 * - Bonus Rolls: Rolling 1 (Daayam), 6, 12, or capturing an opponent awards an extra turn!
 * - Outer Perimeter (16 steps) -> Inner Ring (8 steps) -> Center Surya Chakram (Victory Goal).
 * - First player to crown all 4 coins at the center wins!
 */

class ChakaramGameEngine {
    constructor() {
        this.players = [
            { id: 1, name: 'தெற்கு வீரர் (Player 1)', wood: 'தேக்கு (Teak)', color: '#d4883b', isAI: false, startPos: { row: 4, col: 2 }, coins: [], crownedCount: 0 },
            { id: 2, name: 'வடக்கு வீரர் (Player 2)', wood: 'ஈட்டி (Rosewood)', color: '#542817', isAI: true, startPos: { row: 0, col: 2 }, coins: [], crownedCount: 0 },
            { id: 3, name: 'கிழக்கு வீரர் (Player 3)', wood: 'சந்தனம் (Sandalwood)', color: '#d9b177', isAI: true, startPos: { row: 2, col: 4 }, coins: [], crownedCount: 0 },
            { id: 4, name: 'மேற்கு வீரர் (Player 4)', wood: 'செம்மரம் (Red Cedar)', color: '#8a3420', isAI: true, startPos: { row: 2, col: 0 }, coins: [], crownedCount: 0 }
        ];

        this.currentTurnIndex = 0; // Index 0 to 3
        this.currentRoll = null;
        this.hasRolled = false;
        this.gameMode = '1P_VS_AI'; // '1P_VS_AI', '2P_LOCAL', '4P_LOCAL'
        this.isGameOver = false;
        this.winner = null;
        this.matchLogs = [];

        // Safe Houses on 5x5 board (8 total)
        this.safeTiles = new Set([
            '0,0', '0,4', '4,0', '4,4', // 4 Corners
            '0,2', '2,0', '2,4', '4,2'  // 4 Midpoints
        ]);

        // Precompute spiral paths for all 4 players
        this.playerPaths = this.generatePlayerPaths();

        // Callbacks for UI & 3D Scene
        this.onStateChange = null;
        this.onLogMessage = null;
        this.onMoveAvailable = null;
        this.onCoinMoved = null;
        this.onCapture = null;
        this.onCrowned = null;
        this.onGameOver = null;

        this.initCoins();
    }

    // Initialize 4 coins per player
    initCoins() {
        this.players.forEach(p => {
            p.coins = [];
            p.crownedCount = 0;
            for (let i = 0; i < 4; i++) {
                p.coins.push({
                    id: `${p.id}_${i}`,
                    playerId: p.id,
                    pawnIndex: i,
                    status: 'HOME', // 'HOME', 'ACTIVE', 'CROWNED'
                    pathStep: -1, // -1 means at HOME base
                    row: p.startPos.row,
                    col: p.startPos.col,
                    hasCutOpponent: false
                });
            }
        });
    }

    // Generate authentic 5x5 Tamil Daayam 25-step paths for each player
    generatePlayerPaths() {
        // Outer loop (16 steps counter-clockwise):
        // South: (4,2)->(4,1)->(4,0)->(3,0)->(2,0)->(1,0)->(0,0)->(0,1)->(0,2)->(0,3)->(0,4)->(1,4)->(2,4)->(3,4)->(4,4)->(4,3)
        // Inner ring (8 steps): (3,2)->(3,1)->(2,1)->(1,1)->(1,2)->(1,3)->(2,3)->(3,3)
        // Center (1 step): (2,2)
        const southPath = [
            // Outer 16 steps
            { r: 4, c: 2 }, { r: 4, c: 1 }, { r: 4, c: 0 }, { r: 3, c: 0 },
            { r: 2, c: 0 }, { r: 1, c: 0 }, { r: 0, c: 0 }, { r: 0, c: 1 },
            { r: 0, c: 2 }, { r: 0, c: 3 }, { r: 0, c: 4 }, { r: 1, c: 4 },
            { r: 2, c: 4 }, { r: 3, c: 4 }, { r: 4, c: 4 }, { r: 4, c: 3 },
            // Inner 8 steps
            { r: 3, c: 2 }, { r: 3, c: 1 }, { r: 2, c: 1 }, { r: 1, c: 1 },
            { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 3 },
            // Center Goal
            { r: 2, c: 2 }
        ];

        // Helper to rotate a coordinate around center (2,2)
        const rotateCoord = (coord, times) => {
            let { r, c } = coord;
            for (let i = 0; i < times; i++) {
                const newR = c;
                const newC = 4 - r;
                r = newR;
                c = newC;
            }
            return { r, c };
        };

        return {
            1: southPath, // South (0 deg)
            4: southPath.map(p => rotateCoord(p, 1)), // West (90 deg)
            2: southPath.map(p => rotateCoord(p, 2)), // North (180 deg)
            3: southPath.map(p => rotateCoord(p, 3))  // East (270 deg)
        };
    }

    setGameMode(mode) {
        this.gameMode = mode;
        if (mode === '1P_VS_AI') {
            this.players[0].isAI = false;
            this.players[1].isAI = true;
            this.players[2].isAI = true;
            this.players[3].isAI = true;
        } else if (mode === '2P_LOCAL') {
            this.players[0].isAI = false; // South
            this.players[1].isAI = false; // North
            this.players[2].isAI = true;
            this.players[3].isAI = true;
        } else if (mode === '4P_LOCAL') {
            this.players[0].isAI = false;
            this.players[1].isAI = false;
            this.players[2].isAI = false;
            this.players[3].isAI = false;
        }
        this.resetGame();
    }

    resetGame() {
        this.initCoins();
        this.currentTurnIndex = 0;
        this.currentRoll = null;
        this.hasRolled = false;
        this.isGameOver = false;
        this.winner = null;
        this.matchLogs = [];
        this.log('⚔️ புதிய ஆட்டம் துவங்கியது! (New Match Started)');
        if (this.onStateChange) this.onStateChange();
    }

    getCurrentPlayer() {
        return this.players[this.currentTurnIndex];
    }

    log(msg) {
        this.matchLogs.unshift(msg);
        if (this.matchLogs.length > 20) this.matchLogs.pop();
        if (this.onLogMessage) this.onLogMessage(msg);
    }

    // Called when 6 Chozhis are rolled
    handleRollResult(rollData) {
        if (this.isGameOver || this.hasRolled) return;

        this.currentRoll = rollData;
        this.hasRolled = true;

        const player = this.getCurrentPlayer();
        const score = rollData.points;

        this.log(`🎲 ${player.name} சோழி உருட்டினார்: ${score} புள்ளிகள்! (${rollData.upCount} வாய்)`);

        // Find legal moves for current player
        const legalMoves = this.getLegalMoves(player, score);

        if (legalMoves.length === 0) {
            this.log(`⚠️ நகர்த்த வழியில்லை! (No moves available for ${player.name})`);
            // Check if player gets a bonus roll despite no moves
            const hasBonusRoll = (score === 1 || score === 6 || score === 12);
            setTimeout(() => {
                if (hasBonusRoll) {
                    this.log(`🌟 கூடுதல் வாய்ப்பு! (Bonus Roll Awarded to ${player.name})`);
                    this.hasRolled = false;
                    this.currentRoll = null;
                    if (this.onStateChange) this.onStateChange();
                    if (player.isAI) this.triggerAIMove();
                } else {
                    this.nextTurn();
                }
            }, 900);
            return;
        }

        if (this.onMoveAvailable) {
            this.onMoveAvailable(legalMoves);
        }

        // If current player is AI, execute best move automatically
        if (player.isAI) {
            setTimeout(() => {
                const bestMove = this.chooseAIMove(legalMoves, score);
                this.executeMove(bestMove.coin, score);
            }, 800);
        }
    }

    // Determine legal moves for a player given a roll score
    getLegalMoves(player, score) {
        const moves = [];
        const path = this.playerPaths[player.id];
        const canUnlock = (score === 1 || score === 5 || score === 6 || score === 12);

        player.coins.forEach(coin => {
            if (coin.status === 'CROWNED') return;

            if (coin.status === 'HOME') {
                if (canUnlock) {
                    // Move from HOME to active start position (path step 0)
                    const targetCoord = path[0];
                    moves.push({
                        coin: coin,
                        type: 'UNLOCK',
                        targetStep: 0,
                        targetRow: targetCoord.r,
                        targetCol: targetCoord.c,
                        isCapture: this.checkCapture(player.id, targetCoord.r, targetCoord.c)
                    });
                }
            } else if (coin.status === 'ACTIVE') {
                const nextStep = coin.pathStep + score;
                if (nextStep < path.length) {
                    const targetCoord = path[nextStep];
                    const isCenterGoal = (nextStep === path.length - 1);
                    moves.push({
                        coin: coin,
                        type: isCenterGoal ? 'CROWN' : 'ADVANCE',
                        targetStep: nextStep,
                        targetRow: targetCoord.r,
                        targetCol: targetCoord.c,
                        isCapture: this.checkCapture(player.id, targetCoord.r, targetCoord.c)
                    });
                }
            }
        });

        return moves;
    }

    // Check if moving to (row, col) will capture an enemy coin
    checkCapture(myPlayerId, row, col) {
        const key = `${row},${col}`;
        if (this.safeTiles.has(key)) return null; // Safe house protects coins

        // Look for any enemy coin stationed on this tile
        for (const enemy of this.players) {
            if (enemy.id === myPlayerId) continue;
            for (const c of enemy.coins) {
                if (c.status === 'ACTIVE' && c.row === row && c.col === col) {
                    return c;
                }
            }
        }
        return null;
    }

    // AI Move Selection Heuristic
    chooseAIMove(legalMoves, score) {
        let bestMove = legalMoves[0];
        let maxScore = -999;

        legalMoves.forEach(move => {
            let moveValue = 0;

            // 1. Prioritize capturing enemy coins (Big bonus!)
            if (move.isCapture) moveValue += 50;

            // 2. Prioritize crowning coin at center
            if (move.type === 'CROWN') moveValue += 40;

            // 3. Prioritize unlocking from HOME
            if (move.type === 'UNLOCK') moveValue += 25;

            // 4. Moving to a safe house
            const isSafe = this.safeTiles.has(`${move.targetRow},${move.targetCol}`);
            if (isSafe) moveValue += 15;

            // 5. Advancing further along path
            moveValue += move.targetStep;

            if (moveValue > maxScore) {
                maxScore = moveValue;
                bestMove = move;
            }
        });

        return bestMove;
    }

    // Execute the chosen move
    executeMove(coin, score) {
        const player = this.players.find(p => p.id === coin.playerId);
        const path = this.playerPaths[player.id];
        const isUnlock = (coin.status === 'HOME');
        const targetStep = isUnlock ? 0 : coin.pathStep + score;
        const targetCoord = path[targetStep];
        const isGoal = (targetStep === path.length - 1);

        // Sub-path of coordinates for 3D hopping animation
        const hopPath = [];
        if (isUnlock) {
            hopPath.push(path[0]);
        } else {
            for (let s = coin.pathStep + 1; s <= targetStep; s++) {
                hopPath.push(path[s]);
            }
        }

        // Check for capture
        const capturedEnemyCoin = this.checkCapture(player.id, targetCoord.r, targetCoord.c);

        // Update coin logical state
        coin.status = isGoal ? 'CROWNED' : 'ACTIVE';
        coin.pathStep = targetStep;
        coin.row = targetCoord.r;
        coin.col = targetCoord.c;

        if (isGoal) {
            player.crownedCount++;
            this.log(`🏆 ${player.name} காய் சூரிய சக்கரத்தில் பழமானது! (Coin Crowned at Center: ${player.crownedCount}/4)`);
        } else if (isUnlock) {
            this.log(`🚀 ${player.name} காய் களம் புகுந்தது! (Coin Entered Board)`);
        } else {
            this.log(`♟️ ${player.name} காய் நகர்ந்தது (${score} கட்டங்கள்)`);
        }

        // Handle Capture
        if (capturedEnemyCoin) {
            const enemyPlayer = this.players.find(p => p.id === capturedEnemyCoin.playerId);
            capturedEnemyCoin.status = 'HOME';
            capturedEnemyCoin.pathStep = -1;
            capturedEnemyCoin.row = enemyPlayer.startPos.row;
            capturedEnemyCoin.col = enemyPlayer.startPos.col;
            this.log(`⚔️ வெட்டு! ${player.name} -> ${enemyPlayer.name} காயை வெட்டினார்! (Enemy Captured!)`);
            if (this.onCapture) this.onCapture(capturedEnemyCoin);
        }

        // Trigger 3D movement in scene
        if (this.onCoinMoved) {
            this.onCoinMoved({
                coin: coin,
                hopPath: hopPath,
                capturedCoin: capturedEnemyCoin,
                isGoal: isGoal,
                onComplete: () => {
                    this.afterMoveComplete(player, score, capturedEnemyCoin, isGoal);
                }
            });
        } else {
            this.afterMoveComplete(player, score, capturedEnemyCoin, isGoal);
        }
    }

    // Called after 3D animation finishes
    afterMoveComplete(player, score, capturedEnemyCoin, isGoal) {
        // Check for Game Over (all 4 coins crowned)
        if (player.crownedCount >= 4) {
            this.isGameOver = true;
            this.winner = player;
            this.log(`🎉 வெற்றி! ${player.name} ஆட்டத்தில் வாகை சூடினார்! (VICTORY!)`);
            if (this.onGameOver) this.onGameOver(player);
            if (this.onStateChange) this.onStateChange();
            return;
        }

        // Determine if player gets a bonus roll
        // Bonus roll condition: Rolled 1 (Daayam), 6, 12, or captured an opponent
        const getsBonus = (score === 1 || score === 6 || score === 12 || capturedEnemyCoin !== null);

        if (getsBonus) {
            this.log(`🌟 கூடுதல் உருட்டல் வாய்ப்பு! (Bonus Roll Awarded to ${player.name})`);
            this.hasRolled = false;
            this.currentRoll = null;
            if (this.onStateChange) this.onStateChange();

            if (player.isAI) {
                setTimeout(() => this.triggerAIMove(), 700);
            }
        } else {
            this.nextTurn();
        }
    }

    nextTurn() {
        this.hasRolled = false;
        this.currentRoll = null;
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;

        const nextPlayer = this.getCurrentPlayer();
        this.log(`👉 அடுத்த முறை: ${nextPlayer.name}`);

        if (this.onStateChange) this.onStateChange();

        // If next player is AI, automatically roll
        if (nextPlayer.isAI && !this.isGameOver) {
            setTimeout(() => this.triggerAIMove(), 800);
        }
    }

    triggerAIMove() {
        if (this.isGameOver) return;
        if (window.chakaramScene) {
            window.chakaramScene.rollChozhi();
        }
    }
}

window.ChakaramGameEngine = ChakaramGameEngine;
