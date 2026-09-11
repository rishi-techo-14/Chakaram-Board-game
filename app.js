/**
 * Application Manager for Chakaram Game
 * Connects 3D WebGL scene, Turn-Based Game Engine, UI HUD, audio engine, and player controls.
 */

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('webgl-container');
    const scene = new Chakaram3DScene(container);
    const engine = new ChakaramGameEngine();
    window.chakaramEngine = engine;

    // UI Elements
    const turnPill = document.getElementById('turn-pill');
    const turnDot = document.getElementById('turn-dot');
    const turnPlayerName = document.getElementById('turn-player-name');
    const turnStatusText = document.getElementById('turn-status-text');

    const rollBtn = document.getElementById('btn-roll-chozhi');
    const scoreCard = document.getElementById('score-card');
    const scoreNumber = document.getElementById('score-number');
    const scoreDesc = document.getElementById('score-desc');
    const chozhiVisual = document.getElementById('chozhi-visual');
    const matchLogList = document.getElementById('match-log-list');

    const modeSelector = document.getElementById('game-mode-select');
    const victoryModal = document.getElementById('victory-modal');
    const winnerTitle = document.getElementById('winner-title');
    const winnerDesc = document.getElementById('winner-desc');
    const btnPlayAgain = document.getElementById('btn-play-again');

    const welcomeModal = document.getElementById('welcome-modal');
    const btnDismissWelcome = document.getElementById('btn-dismiss-welcome');
    const btnStartGameHeader = document.getElementById('btn-start-game-header');

    const tamilNumsMap = { 0: '௦', 1: '௧', 2: '௨', 3: '௩', 4: '௪', 5: '௫', 6: '௬', 12: '௰௨' };

    // --- GAME ENGINE & 3D SCENE BINDINGS ---

    // 1. Chozhi Roll Result from 3D Scene -> Send to Game Engine
    scene.onChozhiRolled = (result) => {
        engine.handleRollResult(result);
        displayRollResult(result);
    };

    // 2. Movable Coins Available -> Highlight in 3D Scene
    engine.onMoveAvailable = (legalMoves) => {
        scene.setMovableCoins(legalMoves);
        const player = engine.getCurrentPlayer();
        if (!player.isAI) {
            scoreCard.classList.add('prompt-glow');
            scoreDesc.innerHTML = '👆 <strong>ஒளிரும் காயைத் தொடவும்</strong> (Click a glowing coin to move)';
            turnStatusText.textContent = '👆 காயைத் தொடவும் (Select Coin)';
        }
    };

    // 3. Pawn Clicked in 3D Scene -> Execute Move
    scene.onPawnClicked = (coinId, legalMove) => {
        if (!engine.hasRolled || engine.getCurrentPlayer().isAI || scene.isCoinAnimating) return;
        scoreCard.classList.remove('prompt-glow');
        engine.executeMove(legalMove.coin, engine.currentRoll.points);
    };

    // 4. Coin Moved in Game Engine -> Trigger 3D Hopping in Scene
    engine.onCoinMoved = (data) => {
        scene.animatePawnMovement(
            data.coin.id,
            data.hopPath,
            data.capturedCoin,
            data.isGoal,
            data.onComplete
        );
    };

    // 5. Game State Changed -> Update Full UI HUD
    engine.onStateChange = () => {
        updateUI();
    };

    // 6. Match Log Entry -> Append to UI Ticker
    engine.onLogMessage = (msg) => {
        if (matchLogList) {
            const li = document.createElement('li');
            li.textContent = msg;
            matchLogList.prepend(li);
            while (matchLogList.children.length > 7) {
                matchLogList.removeChild(matchLogList.lastChild);
            }
        }
    };

    // 7. Game Over -> Trigger Victory Ceremony
    engine.onGameOver = (winner) => {
        if (victoryModal) {
            winnerTitle.textContent = `🏆 ${winner.name} வெற்றி பெற்றார்!`;
            winnerDesc.textContent = `${winner.wood} காய்கள் அனைத்தும் சூரிய சக்கரத்தை அடைந்து வாகை சூடின! (All 4 coins crowned at Surya Chakram!)`;
            victoryModal.classList.add('visible');
        }
        if (window.templeAudio) {
            window.templeAudio.playTempleBell(2.0);
        }
    };

    // --- DISPLAY ROLL NUMBER AFTER EACH ROLL ---
    function displayRollResult(r) {
        const pts = r.points;
        const tamilGlyph = tamilNumsMap[pts] || pts;

        let numText = `எண்: ${tamilGlyph} (${pts})`;
        let descText = `மேல்நோக்கிய வாய்: ${r.upCount} | கீழ்நோக்கிய முதுகு: ${r.downCount}`;

        if (r.isDaayam) {
            numText = `🌟 தாயக்கட்டை! (1)`;
            descText = `1 வாய் மேல்நோக்கி • களம் புகும் வாய்ப்பு! (Bonus Roll)`;
        } else if (r.isSix) {
            numText = `✨ ௬ புள்ளிகள் (6)`;
            descText = `அனைத்து 6 வாய்களும் மேல்நோக்கி! (All UP • Bonus Roll)`;
        } else if (r.isTwelve) {
            numText = `🔥 பன்னிரண்டு! (12)`;
            descText = `அனைத்து 6 வாய்களும் கீழ்நோக்கி! (All DOWN • Bonus Roll)`;
        }

        if (scoreNumber) scoreNumber.textContent = numText;
        if (scoreDesc) scoreDesc.textContent = descText;

        // Shell icons display
        let shellIcons = '';
        for (let i = 0; i < r.upCount; i++) shellIcons += '<span class="shell-icon shell-open" title="வாய் (UP)">🐚</span>';
        for (let j = 0; j < r.downCount; j++) shellIcons += '<span class="shell-icon shell-closed" title="முதுகு (DOWN)">🌑</span>';
        if (chozhiVisual) chozhiVisual.innerHTML = shellIcons;
    }

    // --- UI HUD UPDATES ---
    function updateUI() {
        const player = engine.getCurrentPlayer();

        // 1. Turn Indicator Pill
        if (turnPlayerName) {
            turnPlayerName.textContent = player.name;
            turnDot.style.background = player.color;
            turnDot.style.boxShadow = `0 0 10px ${player.color}`;
            turnPill.style.borderColor = player.color;

            if (player.isAI) {
                turnStatusText.textContent = '🤖 கணினி சிந்திக்கிறது... (AI Playing)';
            } else if (engine.hasRolled) {
                turnStatusText.textContent = '👆 காயைத் தொடவும் (Select Coin)';
            } else {
                turnStatusText.textContent = '🎲 உருட்ட தயார் (Ready to Roll)';
            }
        }

        // 2. Roll Button State (Strictly disabled while any coin needs to move or AI is playing)
        if (rollBtn) {
            if (player.isAI) {
                rollBtn.disabled = true;
                rollBtn.textContent = '🤖 கணினி முறை (AI Turn)';
            } else if (engine.hasRolled) {
                rollBtn.disabled = true;
                rollBtn.textContent = '♟️ காயைத் தொடவும் (Move Coin)';
            } else if (scene.isCoinAnimating || scene.isRollingChozhi) {
                rollBtn.disabled = true;
                rollBtn.textContent = '⏳ நகர்கிறது... (Moving)';
            } else {
                rollBtn.disabled = false;
                rollBtn.textContent = '🎲 சோழி உருட்டு (Roll 6 Chozhi)';
            }
        }

        // 3. Update 4 Player Status Chips
        engine.players.forEach(p => {
            const chip = document.getElementById(`player-chip-${p.id}`);
            const crownBadge = document.getElementById(`player-crowns-${p.id}`);
            const homeBadge = document.getElementById(`player-home-${p.id}`);
            const activeBadge = document.getElementById(`player-active-${p.id}`);

            if (chip) {
                chip.classList.toggle('active-turn', p.id === player.id);
            }
            if (crownBadge) crownBadge.textContent = `${p.crownedCount}/4`;
            if (homeBadge) {
                const homeCount = p.coins.filter(c => c.status === 'HOME').length;
                homeBadge.textContent = homeCount;
            }
            if (activeBadge) {
                const actCount = p.coins.filter(c => c.status === 'ACTIVE').length;
                activeBadge.textContent = actCount;
            }
        });

        // 4. Reset score card prompt when roll is pending
        if (!engine.hasRolled && !player.isAI) {
            scoreCard.classList.remove('prompt-glow');
            if (scoreNumber && !engine.currentRoll) scoreNumber.textContent = '🎲 உருட்ட தயார்';
            if (scoreDesc && !engine.currentRoll) scoreDesc.textContent = 'Click button or brass tray to roll';
        }
    }

    // --- EVENT LISTENERS ---

    // Roll Button Listener
    if (rollBtn) {
        rollBtn.addEventListener('click', () => {
            if (!engine.hasRolled && !engine.getCurrentPlayer().isAI && !scene.isCoinAnimating && !scene.isRollingChozhi) {
                scene.rollChozhi();
            }
        });
    }

    // Game Mode Switcher
    if (modeSelector) {
        modeSelector.addEventListener('change', (e) => {
            engine.setGameMode(e.target.value);
            scene.resetAllPawns();
            if (window.templeAudio) window.templeAudio.playStoneClack();
        });
    }

    // Welcome Modal Handlers
    const startNewGame = () => {
        if (welcomeModal) welcomeModal.classList.remove('visible');
        if (victoryModal) victoryModal.classList.remove('visible');
        engine.resetGame();
        scene.resetAllPawns();
        if (window.templeAudio) window.templeAudio.playTempleBell(1.2);
    };

    if (btnDismissWelcome) btnDismissWelcome.addEventListener('click', startNewGame);
    if (btnStartGameHeader) btnStartGameHeader.addEventListener('click', () => {
        if (welcomeModal) welcomeModal.classList.add('visible');
    });
    if (btnPlayAgain) btnPlayAgain.addEventListener('click', startNewGame);

    // Camera Preset Buttons
    document.querySelectorAll('[data-camera]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-camera]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            scene.setCameraPreset(btn.getAttribute('data-camera'));
            if (window.templeAudio) window.templeAudio.playStoneClack();
        });
    });

    // Material / Stone Theme Switchers
    document.querySelectorAll('[data-theme]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            scene.setTheme(btn.getAttribute('data-theme'));
        });
    });

    // Atmosphere Lighting Switchers
    document.querySelectorAll('[data-atmosphere]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-atmosphere]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            scene.setAtmosphere(btn.getAttribute('data-atmosphere'));
        });
    });

    // Audio Controls
    const btnMute = document.getElementById('btn-audio-mute');
    if (btnMute) {
        btnMute.addEventListener('click', () => {
            const isMuted = window.templeAudio.toggleMute();
            btnMute.innerHTML = isMuted ? '🔇 ஒலி முடக்கு (Muted)' : '🔔 ஒலி (Sound On)';
            btnMute.classList.toggle('btn-highlight', isMuted);
        });
    }

    // Initial render
    updateUI();
});
