/**
 * Application Manager for Chakaram (Chowka Bara) 3D
 * Connects 3D Scene, Rules Engine, Home Wizard, Quit Button, Settings, and Clean UI.
 */

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("webgl-container");

  // Default configuration
  let selectedType = "AI";
  let selectedAICount = 3; // 1, 2, or 3
  let selectedPlayerCount = 4; // 2, 3, or 4
  let selectedGridSize = 5; // 5 or 7
  let roomCode = null;

  const engine = new ChakaramGameEngine(selectedGridSize, 4, 3);
  const scene = new Chakaram3DScene(container, selectedGridSize);
  window.chakaramEngine = engine;
  window.chakaramScene = scene;

  // UI Elements
  const homeModal = document.getElementById("home-modal");
  const homeStep1 = document.getElementById("home-step-1");
  const homeStep2 = document.getElementById("home-step-2");
  const step2TypeTitle = document.getElementById("step2-type-title");
  const btnBackStep = document.getElementById("btn-back-step");
  const btnStartFinal = document.getElementById("btn-start-final");

  const configAISection = document.getElementById("config-ai-section");
  const configLocalSection = document.getElementById("config-local-section");
  const configOnlineSection = document.getElementById("config-online-section");
  const generatedRoomCode = document.getElementById("generated-room-code");

  const headerBoardBadge = document.getElementById("header-board-badge");
  const btnQuitGame = document.getElementById("btn-quit-game");
  const btnOpenSettings = document.getElementById("btn-open-settings");
  const settingsModal = document.getElementById("settings-modal");
  const btnCloseSettings = document.getElementById("btn-close-settings");
  const btnToggleSound = document.getElementById("btn-toggle-sound");

  const hintToast = document.getElementById("hint-toast");
  const victoryModal = document.getElementById("victory-modal");
  const winnerTitle = document.getElementById("winner-title");
  const winnerDesc = document.getElementById("winner-desc");
  const btnPlayAgain = document.getElementById("btn-play-again");

  // Side Chozhi Elements
  const chozhiDockTitle = document.getElementById("chozhi-dock-title");
  const sideShellsRow = document.getElementById("side-shells-row");
  const sideScoreBox = document.getElementById("side-score-box");
  const btnRollChozhi = document.getElementById("btn-roll-chozhi");

  const tamilNumMap = {
    1: "௧",
    2: "௨",
    3: "௩",
    4: "௪",
    5: "௫",
    6: "௬",
    8: "௮",
    12: "௰௨",
  };

  // --- GAME ENGINE & 3D SCENE EVENT BINDINGS ---

  scene.onChozhiRolled = (result) => {
    engine.handleRollResult(result);
    displayRollResult(result);
  };

  engine.onMoveAvailable = (legalMoves) => {
    scene.setMovableCoins(legalMoves);
    const player = engine.getCurrentPlayer();
    if (!player.isAI) {
      showToast("👆 ஒளிரும் காயைத் தொடவும் (Select glowing coin)");
    }
  };

  scene.onPawnClicked = (coinId, legalMove) => {
    if (
      !engine.hasRolled ||
      engine.getCurrentPlayer().isAI ||
      scene.isCoinAnimating
    )
      return;
    hideToast();
    engine.executeMove(legalMove.coin, engine.currentRoll.points, legalMove);
  };

  engine.onCoinMoved = (data) => {
    hideToast();
    scene.animatePawnMovement(
      data.coin.id,
      data.hopPath,
      data.capturedCoin,
      data.isGoal,
      data.isUnlock,
      data.onComplete,
    );
  };

  engine.onStateChange = () => {
    updateUI();
  };

  engine.onLogMessage = (code) => {
    if (code === "NEED_1_OR_5") {
      showToast("⚠️ 1 அல்லது 5 உருட்ட வேண்டும் (Need 1 or 5 to enter)");
    } else if (code === "NO_MOVES") {
      showToast("⚠️ நகர்த்த வழியில்லை (No moves)");
    } else if (code === "BONUS_ROLL") {
      showToast("🌟 கூடுதல் வாய்ப்பு! (Bonus Roll)");
    }
  };

  engine.onGameOver = (winner) => {
    if (victoryModal) {
      winnerTitle.textContent = `🏆 ${winner.name} வெற்றி பெற்றார்!`;
      winnerDesc.textContent = `${winner.wood} காய்கள் அனைத்தும் சூரிய சக்கரத்தை அடைந்து வாகை சூடின!`;
      victoryModal.classList.add("visible");
    }
    if (window.templeAudio) {
      window.templeAudio.playTempleBell(2.0);
    }
  };

  function showToast(text) {
    if (hintToast) {
      hintToast.textContent = text;
      hintToast.classList.add("visible");
      setTimeout(() => {
        if (hintToast) hintToast.classList.remove("visible");
      }, 2500);
    }
  }

  function hideToast() {
    if (hintToast) hintToast.classList.remove("visible");
  }

  // --- DISPLAY ROLL SCORE IN SIDE DOCK ---
  function displayRollResult(r) {
    const pts = r.points;
    const tamilGlyph = tamilNumMap[pts] || pts;

    if (sideScoreBox) {
      sideScoreBox.textContent = `${tamilGlyph} (${pts})`;
    }

    let shellsHTML = "";
    for (let i = 0; i < r.upCount; i++) {
      shellsHTML +=
        '<span class="shell-icon shell-open" title="வாய் (UP)">🐚</span>';
    }
    for (let j = 0; j < r.downCount; j++) {
      shellsHTML +=
        '<span class="shell-icon shell-closed" title="முதுகு (DOWN)">🌑</span>';
    }
    if (sideShellsRow) sideShellsRow.innerHTML = shellsHTML;
  }

  // --- REFRESH CLEAN PLAYER CARDS & HUD ---
  function updateUI() {
    const player = engine.getCurrentPlayer();

    // 1. Header Badge
    if (headerBoardBadge) {
      const shells = engine.gridSize === 7 ? "6 சோழி" : "4 சோழி";
      headerBoardBadge.textContent = `${engine.gridSize}x${engine.gridSize} • ${shells}`;
    }

    if (chozhiDockTitle) {
      chozhiDockTitle.textContent =
        engine.gridSize === 7 ? "சோழிகள் (6 Chozhi)" : "சோழிகள் (4 Chozhi)";
    }

    // 2. Roll Button State
    if (btnRollChozhi) {
      if (player.isAI) {
        btnRollChozhi.disabled = true;
        btnRollChozhi.textContent = "🤖 சிந்திக்கிறது...";
      } else if (engine.hasRolled) {
        btnRollChozhi.disabled = true;
        btnRollChozhi.textContent = "👆 காயைத் தொடவும்";
      } else if (scene.isCoinAnimating || scene.isRollingChozhi) {
        btnRollChozhi.disabled = true;
        btnRollChozhi.textContent = "⏳ நகர்கிறது...";
      } else {
        btnRollChozhi.disabled = false;
        btnRollChozhi.textContent = "🎲 சோழி உருட்டு (Roll)";
      }
    }

    // 3. Update Clean Player Cards (Show only active players)
    for (let pId = 1; pId <= 4; pId++) {
      const corner = document.getElementById(`player-corner-${pId}`);
      const card = document.getElementById(`card-p${pId}`);
      const nameEl = document.getElementById(`name-p${pId}`);
      const subEl = document.getElementById(`sub-p${pId}`);

      const activeP = engine.players.find((p) => p.id === pId);

      if (!activeP) {
        if (corner) corner.style.display = "none";
        continue;
      }

      if (corner) corner.style.display = "block";

      const isCurrent = activeP.id === player.id;
      if (card) {
        card.classList.toggle("active-turn", isCurrent);
      }

      if (nameEl) {
        nameEl.textContent = activeP.name;
      }

      if (subEl) {
        let statusText = isCurrent
          ? activeP.isAI
            ? "சிந்திக்கிறது..."
            : "உருட்ட தயார்"
          : "காத்திருக்கிறது";
        if (activeP.hasCutOpponent) {
          statusText += " • ⚔️ வெட்டு";
        }
        subEl.textContent = statusText;
      }
    }

    if (!engine.hasRolled && !player.isAI) {
      hideToast();
      if (sideScoreBox && !engine.currentRoll) sideScoreBox.textContent = "🎲";
    }
  }

  // --- HOME WIZARD FLOW ---

  // Step 1: Mode choices
  document.querySelectorAll(".menu-btn-choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedType = btn.getAttribute("data-type");
      openStep2(selectedType);
    });
  });

  function openStep2(type) {
    homeStep1.style.display = "none";
    homeStep2.classList.add("active");

    if (type === "AI") {
      step2TypeTitle.textContent = "Play vs AI (கணினியுடன்)";
      configAISection.style.display = "block";
      configLocalSection.style.display = "none";
      configOnlineSection.style.display = "none";
    } else if (type === "LOCAL") {
      step2TypeTitle.textContent = "Pass & Play (நண்பர்களுடன்)";
      configAISection.style.display = "none";
      configLocalSection.style.display = "block";
      configOnlineSection.style.display = "none";
    } else if (type === "ONLINE") {
      step2TypeTitle.textContent = "Online using Code";
      configAISection.style.display = "none";
      configLocalSection.style.display = "none";
      configOnlineSection.style.display = "block";
      roomCode = "CHKR-" + Math.floor(1000 + Math.random() * 9000);
      if (generatedRoomCode) generatedRoomCode.textContent = roomCode;
    }
  }

  if (btnBackStep) {
    btnBackStep.addEventListener("click", () => {
      homeStep2.classList.remove("active");
      homeStep1.style.display = "flex";
    });
  }

  // AI Count Pills
  document.querySelectorAll("[data-ai]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-ai]")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedAICount = parseInt(btn.getAttribute("data-ai"), 10);
    });
  });

  // Local Player Count Pills
  document.querySelectorAll("[data-players]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-players]")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedPlayerCount = parseInt(btn.getAttribute("data-players"), 10);
    });
  });

  // Board Size Pills (5x5 or 7x7)
  document.querySelectorAll("[data-grid]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("[data-grid]")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedGridSize = parseInt(btn.getAttribute("data-grid"), 10);
    });
  });

  // START MATCH FROM WIZARD
  if (btnStartFinal) {
    btnStartFinal.addEventListener("click", () => {
      let pCount = 4;
      let aiCount = 3;

      if (selectedType === "AI") {
        pCount = selectedAICount + 1;
        aiCount = selectedAICount;
      } else if (selectedType === "LOCAL") {
        pCount = selectedPlayerCount;
        aiCount = 0;
      } else if (selectedType === "ONLINE") {
        pCount = 2;
        aiCount = 0;
      }

      engine.setMatchConfig(selectedGridSize, pCount, aiCount, roomCode);
      scene.rebuildBoard(selectedGridSize);

      // Initialize shells row
      const numShells = selectedGridSize === 7 ? 6 : 4;
      let initialShells = "";
      for (let i = 0; i < numShells / 2; i++)
        initialShells += '<span class="shell-icon shell-open">🐚</span>';
      for (let j = 0; j < numShells / 2; j++)
        initialShells += '<span class="shell-icon shell-closed">🌑</span>';
      if (sideShellsRow) sideShellsRow.innerHTML = initialShells;

      homeModal.classList.remove("visible");
      updateUI();
      if (window.templeAudio) window.templeAudio.playTempleBell(1.2);
    });
  }

  // --- QUIT BUTTON (RETURNS TO HOME MENU) ---
  if (btnQuitGame) {
    btnQuitGame.addEventListener("click", () => {
      homeStep2.classList.remove("active");
      homeStep1.style.display = "flex";
      homeModal.classList.add("visible");
    });
  }

  // Play Again button
  if (btnPlayAgain) {
    btnPlayAgain.addEventListener("click", () => {
      if (victoryModal) victoryModal.classList.remove("visible");
      homeStep2.classList.remove("active");
      homeStep1.style.display = "flex";
      homeModal.classList.add("visible");
    });
  }

  // --- SETTINGS MODAL ---
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener("click", () => {
      if (settingsModal) settingsModal.classList.add("visible");
    });
  }
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener("click", () => {
      if (settingsModal) settingsModal.classList.remove("visible");
    });
  }
  if (btnToggleSound) {
    btnToggleSound.addEventListener("click", () => {
      const isMuted = window.templeAudio.toggleMute();
      btnToggleSound.textContent = isMuted
        ? "ஒலி முடக்கம் (Muted)"
        : "ஒலி இயக்கம் (On)";
    });
  }

  // Roll Button Listener
  if (btnRollChozhi) {
    btnRollChozhi.addEventListener("click", () => {
      if (
        !engine.hasRolled &&
        !engine.getCurrentPlayer().isAI &&
        !scene.isCoinAnimating &&
        !scene.isRollingChozhi
      ) {
        scene.rollChozhi();
      }
    });
  }

  // Initial render
  updateUI();
});
