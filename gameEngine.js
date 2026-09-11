/**
 * Chakaram (Chowka Bara) Game Engine
 * Supporting both 5x5 and 7x7 Boards, 2 to 4 Players (1, 2, or 3 AIs / Pass & Play / Online)
 *
 * Rules:
 * - Starting a coin: Throwing 1 or 5 ONLY unlocks a coin from the Home Yard onto the board!
 * - 5x5 Board: 4 Cowrie Shells (Rolls: 1, 2, 3, 4, 8). Extra roll on 1, 4, 8, or capture.
 * - 7x7 Board: 6 Cowrie Shells (Rolls: 1, 2, 3, 4, 5, 6, 12). Extra roll on 1, 5, 6, 12, or capture.
 * - Cut / Capture Requirement: A player MUST capture (cut) an opponent coin to enter inner tracks!
 * - Safe Houses: 4 Midpoint entry houses (with flower emblems) and center goal.
 * - Winner: First player to crown all 4 coins at the central Surya Chakram!
 */

class ChakaramGameEngine {
  constructor(gridSize = 5, playerCount = 4, aiCount = 3) {
    this.gridSize = gridSize; // 5 or 7
    this.playerCount = playerCount; // 2, 3, or 4
    this.aiCount = aiCount; // 0 (pass&play), 1, 2, 3
    this.players = [];
    this.currentTurnIndex = 0;
    this.currentRoll = null;
    this.hasRolled = false;
    this.isGameOver = false;
    this.winner = null;
    this.roomCode = null;

    // Callbacks
    this.onStateChange = null;
    this.onLogMessage = null;
    this.onMoveAvailable = null;
    this.onCoinMoved = null;
    this.onCapture = null;
    this.onCrowned = null;
    this.onGameOver = null;

    this.initBoardConfig();
    this.initPlayers();
  }

  setMatchConfig(gridSize, playerCount, aiCount, roomCode = null) {
    this.gridSize = parseInt(gridSize, 10) || 5;
    this.playerCount = parseInt(playerCount, 10) || 4;
    this.aiCount = parseInt(aiCount, 10);
    this.roomCode = roomCode;
    this.initBoardConfig();
    this.initPlayers();
    this.resetGame();
  }

  initBoardConfig() {
    const N = this.gridSize;
    const mid = Math.floor(N / 2);

    this.safeTiles = new Set();

    if (N === 5) {
      // 5x5: 4 Midpoint safe houses + Center
      const safes = [
        "0,2",
        "2,0",
        "2,4",
        "4,2", // 4 Midpoints
        "2,2", // Center Goal
      ];
      safes.forEach((k) => this.safeTiles.add(k));
    } else {
      // 7x7: 4 Midpoints + Middle ring safe houses + Center
      const safes = [
        "0,3",
        "3,0",
        "3,6",
        "6,3",
        "1,1",
        "1,5",
        "5,1",
        "5,5",
        "1,3",
        "3,1",
        "3,5",
        "5,3",
        "2,2",
        "2,4",
        "4,2",
        "4,4",
        "3,3",
      ];
      safes.forEach((k) => this.safeTiles.add(k));
    }

    this.playerTracks = this.generateAllPlayerTracks();
  }

  // Configure 2, 3, or 4 active players
  initPlayers() {
    const N = this.gridSize;
    const mid = Math.floor(N / 2);

    const allDefinitions = [
      {
        id: 1,
        name: "தெற்கு (You)",
        wood: "தேக்கு (Teak)",
        color: "#d4883b",
        isAI: false,
        startPos: { row: N - 1, col: mid },
        side: "SOUTH",
        yardIndex: 0,
      },
      {
        id: 2,
        name: "மேற்கு (P2)",
        wood: "செம்மரம் (Red Cedar)",
        color: "#a8422b",
        isAI: true,
        startPos: { row: mid, col: 0 },
        side: "WEST",
        yardIndex: 1,
      },
      {
        id: 3,
        name: "வடக்கு (P3)",
        wood: "ஈட்டி (Rosewood)",
        color: "#7c3a21",
        isAI: true,
        startPos: { row: 0, col: mid },
        side: "NORTH",
        yardIndex: 2,
      },
      {
        id: 4,
        name: "கிழக்கு (P4)",
        wood: "சந்தனம் (Sandalwood)",
        color: "#d9b177",
        isAI: true,
        startPos: { row: mid, col: N - 1 },
        side: "EAST",
        yardIndex: 3,
      },
    ];

    if (this.playerCount === 2) {
      // 2 Players: South vs North (opposite across board!)
      this.players = [
        allDefinitions[0], // South (P1)
        {
          ...allDefinitions[2],
          id: 2,
          name: this.aiCount >= 1 ? "வடக்கு (AI)" : "வடக்கு (P2)",
        }, // North (P2)
      ];
    } else if (this.playerCount === 3) {
      // 3 Players: South, West, North
      this.players = [allDefinitions[0], allDefinitions[1], allDefinitions[2]];
    } else {
      // 4 Players: South, West, North, East
      this.players = allDefinitions.map((p) => ({ ...p }));
    }

    // Apply AI assignment based on aiCount
    // P1 is always Human (South)
    this.players[0].isAI = false;
    for (let i = 1; i < this.players.length; i++) {
      if (this.aiCount === 0) {
        // Pass and Play
        this.players[i].isAI = false;
        this.players[i].name = `${this.players[i].side} (P${i + 1})`;
      } else {
        // AI opponent
        this.players[i].isAI = true;
        this.players[i].name = `${this.players[i].side} (AI)`;
      }
    }

    this.initCoins();
  }

  initCoins() {
    this.players.forEach((p) => {
      p.coins = [];
      p.crownedCount = 0;
      p.hasCutOpponent = false;
      for (let i = 0; i < 4; i++) {
        p.coins.push({
          id: `${p.id}_${i}`,
          playerId: p.id,
          pawnIndex: i,
          status: "HOME", // 'HOME', 'ACTIVE', 'CROWNED'
          track: "OUTER",
          trackStep: -1,
          row: p.startPos.row,
          col: p.startPos.col,
          slotIndex: i, // resting spot index in home yard (0, 1, 2, 3)
        });
      }
    });
  }

  // Generate concentric tracks
  generateAllPlayerTracks() {
    const N = this.gridSize;

    const rotateCoord = (coord, times) => {
      let { r, c } = coord;
      for (let i = 0; i < times; i++) {
        const nr = c;
        const nc = N - 1 - r;
        r = nr;
        c = nc;
      }
      return { r, c };
    };

    const rotateTrack = (track, times) => {
      return track.map((pt) => rotateCoord(pt, times));
    };

    if (N === 5) {
      const southOuter = [
        { r: 4, c: 2 },
        { r: 4, c: 1 },
        { r: 4, c: 0 },
        { r: 3, c: 0 },
        { r: 2, c: 0 },
        { r: 1, c: 0 },
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
        { r: 0, c: 3 },
        { r: 0, c: 4 },
        { r: 1, c: 4 },
        { r: 2, c: 4 },
        { r: 3, c: 4 },
        { r: 4, c: 4 },
        { r: 4, c: 3 },
      ];

      const southInner = [
        { r: 3, c: 2 },
        { r: 3, c: 1 },
        { r: 2, c: 1 },
        { r: 1, c: 1 },
        { r: 1, c: 2 },
        { r: 1, c: 3 },
        { r: 2, c: 3 },
        { r: 3, c: 3 },
      ];

      const center = [{ r: 2, c: 2 }];

      return {
        SOUTH: { outer: southOuter, inner: southInner, center: center },
        WEST: {
          outer: rotateTrack(southOuter, 1),
          inner: rotateTrack(southInner, 1),
          center: center,
        },
        NORTH: {
          outer: rotateTrack(southOuter, 2),
          inner: rotateTrack(southInner, 2),
          center: center,
        },
        EAST: {
          outer: rotateTrack(southOuter, 3),
          inner: rotateTrack(southInner, 3),
          center: center,
        },
      };
    } else {
      const southOuter = [
        { r: 6, c: 3 },
        { r: 6, c: 2 },
        { r: 6, c: 1 },
        { r: 6, c: 0 },
        { r: 5, c: 0 },
        { r: 4, c: 0 },
        { r: 3, c: 0 },
        { r: 2, c: 0 },
        { r: 1, c: 0 },
        { r: 0, c: 0 },
        { r: 0, c: 1 },
        { r: 0, c: 2 },
        { r: 0, c: 3 },
        { r: 0, c: 4 },
        { r: 0, c: 5 },
        { r: 0, c: 6 },
        { r: 1, c: 6 },
        { r: 2, c: 6 },
        { r: 3, c: 6 },
        { r: 4, c: 6 },
        { r: 5, c: 6 },
        { r: 6, c: 6 },
        { r: 6, c: 5 },
        { r: 6, c: 4 },
      ];

      const southMiddle = [
        { r: 5, c: 3 },
        { r: 5, c: 4 },
        { r: 5, c: 5 },
        { r: 4, c: 5 },
        { r: 3, c: 5 },
        { r: 2, c: 5 },
        { r: 1, c: 5 },
        { r: 1, c: 4 },
        { r: 1, c: 3 },
        { r: 1, c: 2 },
        { r: 1, c: 1 },
        { r: 2, c: 1 },
        { r: 3, c: 1 },
        { r: 4, c: 1 },
        { r: 5, c: 1 },
        { r: 5, c: 2 },
      ];

      const southInner = [
        { r: 4, c: 3 },
        { r: 4, c: 2 },
        { r: 3, c: 2 },
        { r: 2, c: 2 },
        { r: 2, c: 3 },
        { r: 2, c: 4 },
        { r: 3, c: 4 },
        { r: 4, c: 4 },
      ];

      const center = [{ r: 3, c: 3 }];

      return {
        SOUTH: {
          outer: southOuter,
          middle: southMiddle,
          inner: southInner,
          center: center,
        },
        WEST: {
          outer: rotateTrack(southOuter, 1),
          middle: rotateTrack(southMiddle, 1),
          inner: rotateTrack(southInner, 1),
          center: center,
        },
        NORTH: {
          outer: rotateTrack(southOuter, 2),
          middle: rotateTrack(southMiddle, 2),
          inner: rotateTrack(southInner, 2),
          center: center,
        },
        EAST: {
          outer: rotateTrack(southOuter, 3),
          middle: rotateTrack(southMiddle, 3),
          inner: rotateTrack(southInner, 3),
          center: center,
        },
      };
    }
  }

  resetGame() {
    this.initCoins();
    this.currentTurnIndex = 0;
    this.currentRoll = null;
    this.hasRolled = false;
    this.isGameOver = false;
    this.winner = null;
    if (this.onStateChange) this.onStateChange();
  }

  getCurrentPlayer() {
    return this.players[this.currentTurnIndex];
  }

  isBonusRoll(score) {
    if (this.gridSize === 5) {
      return score === 1 || score === 4 || score === 8;
    } else {
      return score === 1 || score === 5 || score === 6 || score === 12;
    }
  }

  // STRICT RULE: ONLY 1 OR 5 UNLOCKS A COIN FROM HOME!
  isUnlockRoll(score) {
    return score === 1 || score === 5;
  }

  handleRollResult(rollData) {
    if (this.isGameOver || this.hasRolled) return;

    this.currentRoll = rollData;
    this.hasRolled = true;

    const player = this.getCurrentPlayer();
    const score = rollData.points;

    const legalMoves = this.getLegalMoves(player, score);

    if (legalMoves.length === 0) {
      const hasHomeCoins = player.coins.some((c) => c.status === "HOME");
      const hasActiveCoins = player.coins.some((c) => c.status === "ACTIVE");

      if (hasHomeCoins && !hasActiveCoins) {
        if (this.onLogMessage) this.onLogMessage("NEED_1_OR_5");
      } else {
        if (this.onLogMessage) this.onLogMessage("NO_MOVES");
      }

      const hasBonus = this.isBonusRoll(score);
      setTimeout(() => {
        if (hasBonus) {
          if (this.onLogMessage) this.onLogMessage("BONUS_ROLL");
          this.hasRolled = false;
          this.currentRoll = null;
          if (this.onStateChange) this.onStateChange();
          if (player.isAI) this.triggerAIMove();
        } else {
          this.nextTurn();
        }
      }, 850);
      return;
    }

    if (this.onMoveAvailable) {
      this.onMoveAvailable(legalMoves);
    }

    if (player.isAI) {
      setTimeout(() => {
        const bestMove = this.chooseAIMove(legalMoves, score);
        this.executeMove(bestMove.coin, score, bestMove);
      }, 700);
    }
  }

  getLegalMoves(player, score) {
    const moves = [];
    const tracks = this.playerTracks[player.side];
    const canUnlock = this.isUnlockRoll(score);
    const hasCut = player.hasCutOpponent;

    player.coins.forEach((coin) => {
      if (coin.status === "CROWNED") return;

      if (coin.status === "HOME") {
        if (canUnlock) {
          const startCoord = tracks.outer[0];
          const cap = this.checkCapture(player.id, startCoord.r, startCoord.c);
          moves.push({
            coin: coin,
            type: "UNLOCK",
            destTrack: "OUTER",
            destStep: 0,
            destCoord: startCoord,
            hopCoords: [startCoord],
            isCapture: cap,
          });
        }
      } else if (coin.status === "ACTIVE") {
        const sim = this.simulatePathAdvance(player, coin, score, hasCut);
        if (sim) {
          moves.push(sim);
        }
      }
    });

    return moves;
  }

  simulatePathAdvance(player, coin, score, hasCut) {
    const tracks = this.playerTracks[player.side];
    const N = this.gridSize;

    let curTrack = coin.track;
    let curStep = coin.trackStep;
    let rem = score;
    const hopCoords = [];

    if (N === 5) {
      while (rem > 0) {
        if (curTrack === "OUTER") {
          if (curStep + rem < tracks.outer.length) {
            for (let s = curStep + 1; s <= curStep + rem; s++) {
              hopCoords.push(tracks.outer[s]);
            }
            curStep += rem;
            rem = 0;
          } else {
            const stepsToEnd = tracks.outer.length - 1 - curStep;
            for (let s = curStep + 1; s < tracks.outer.length; s++) {
              hopCoords.push(tracks.outer[s]);
            }
            rem -= stepsToEnd + 1;

            if (hasCut) {
              curTrack = "INNER";
              curStep = 0;
              hopCoords.push(tracks.inner[0]);
            } else {
              curTrack = "OUTER";
              curStep = 0;
              hopCoords.push(tracks.outer[0]);
            }
          }
        } else if (curTrack === "INNER") {
          if (curStep + rem < tracks.inner.length) {
            for (let s = curStep + 1; s <= curStep + rem; s++) {
              hopCoords.push(tracks.inner[s]);
            }
            curStep += rem;
            rem = 0;
          } else {
            const stepsToEnd = tracks.inner.length - 1 - curStep;
            for (let s = curStep + 1; s < tracks.inner.length; s++) {
              hopCoords.push(tracks.inner[s]);
            }
            rem -= stepsToEnd + 1;

            curTrack = "CENTER";
            curStep = 0;
            hopCoords.push(tracks.center[0]);
            rem = 0;
          }
        } else if (curTrack === "CENTER") {
          return null;
        }
      }
    } else {
      // 7x7 tracks
      while (rem > 0) {
        if (curTrack === "OUTER") {
          if (curStep + rem < tracks.outer.length) {
            for (let s = curStep + 1; s <= curStep + rem; s++) {
              hopCoords.push(tracks.outer[s]);
            }
            curStep += rem;
            rem = 0;
          } else {
            const stepsToEnd = tracks.outer.length - 1 - curStep;
            for (let s = curStep + 1; s < tracks.outer.length; s++) {
              hopCoords.push(tracks.outer[s]);
            }
            rem -= stepsToEnd + 1;

            if (hasCut) {
              curTrack = "MIDDLE";
              curStep = 0;
              hopCoords.push(tracks.middle[0]);
            } else {
              curTrack = "OUTER";
              curStep = 0;
              hopCoords.push(tracks.outer[0]);
            }
          }
        } else if (curTrack === "MIDDLE") {
          if (curStep + rem < tracks.middle.length) {
            for (let s = curStep + 1; s <= curStep + rem; s++) {
              hopCoords.push(tracks.middle[s]);
            }
            curStep += rem;
            rem = 0;
          } else {
            const stepsToEnd = tracks.middle.length - 1 - curStep;
            for (let s = curStep + 1; s < tracks.middle.length; s++) {
              hopCoords.push(tracks.middle[s]);
            }
            rem -= stepsToEnd + 1;

            curTrack = "INNER";
            curStep = 0;
            hopCoords.push(tracks.inner[0]);
          }
        } else if (curTrack === "INNER") {
          if (curStep + rem < tracks.inner.length) {
            for (let s = curStep + 1; s <= curStep + rem; s++) {
              hopCoords.push(tracks.inner[s]);
            }
            curStep += rem;
            rem = 0;
          } else {
            const stepsToEnd = tracks.inner.length - 1 - curStep;
            for (let s = curStep + 1; s < tracks.inner.length; s++) {
              hopCoords.push(tracks.inner[s]);
            }
            rem -= stepsToEnd + 1;

            curTrack = "CENTER";
            curStep = 0;
            hopCoords.push(tracks.center[0]);
            rem = 0;
          }
        } else if (curTrack === "CENTER") {
          return null;
        }
      }
    }

    const destCoord = hopCoords[hopCoords.length - 1];
    const isGoal = curTrack === "CENTER";
    const cap = isGoal
      ? null
      : this.checkCapture(player.id, destCoord.r, destCoord.c);

    return {
      coin: coin,
      type: isGoal ? "CROWN" : "ADVANCE",
      destTrack: curTrack,
      destStep: curStep,
      destCoord: destCoord,
      hopCoords: hopCoords,
      isCapture: cap,
    };
  }

  checkCapture(myPlayerId, row, col) {
    const key = `${row},${col}`;
    if (this.safeTiles.has(key)) return null;

    for (const enemy of this.players) {
      if (enemy.id === myPlayerId) continue;
      for (const c of enemy.coins) {
        if (c.status === "ACTIVE" && c.row === row && c.col === col) {
          return c;
        }
      }
    }
    return null;
  }

  chooseAIMove(legalMoves, score) {
    let bestMove = legalMoves[0];
    let maxScore = -999;

    legalMoves.forEach((move) => {
      let val = 0;

      if (move.isCapture) {
        val += 60;
        const player = this.players.find((p) => p.id === move.coin.playerId);
        if (player && !player.hasCutOpponent) val += 40;
      }

      if (move.type === "CROWN") val += 50;
      if (move.destTrack === "INNER" || move.destTrack === "MIDDLE") val += 30;
      if (this.safeTiles.has(`${move.destCoord.r},${move.destCoord.c}`))
        val += 15;
      if (move.type === "UNLOCK") val += 20;

      val += move.destStep;

      if (val > maxScore) {
        maxScore = val;
        bestMove = move;
      }
    });

    return bestMove;
  }

  executeMove(coin, score, chosenMove = null) {
    const player = this.players.find((p) => p.id === coin.playerId);
    const move =
      chosenMove ||
      this.getLegalMoves(player, score).find((m) => m.coin.id === coin.id);

    if (!move) return;

    const isUnlock = move.type === "UNLOCK";
    const isGoal = move.type === "CROWN";
    const targetCoord = move.destCoord;
    const capturedEnemy = move.isCapture;

    coin.status = isGoal ? "CROWNED" : "ACTIVE";
    coin.track = move.destTrack;
    coin.trackStep = move.destStep;
    coin.row = targetCoord.r;
    coin.col = targetCoord.c;

    if (isGoal) {
      player.crownedCount++;
    }

    if (capturedEnemy) {
      const enemyPlayer = this.players.find(
        (p) => p.id === capturedEnemy.playerId,
      );
      capturedEnemy.status = "HOME";
      capturedEnemy.track = "OUTER";
      capturedEnemy.trackStep = -1;
      capturedEnemy.row = enemyPlayer.startPos.row;
      capturedEnemy.col = enemyPlayer.startPos.col;

      player.hasCutOpponent = true;

      if (this.onCapture) this.onCapture(capturedEnemy);
    }

    if (this.onCoinMoved) {
      this.onCoinMoved({
        coin: coin,
        hopPath: move.hopCoords,
        capturedCoin: capturedEnemy,
        isGoal: isGoal,
        isUnlock: isUnlock,
        onComplete: () => {
          this.afterMoveComplete(player, score, capturedEnemy, isGoal);
        },
      });
    } else {
      this.afterMoveComplete(player, score, capturedEnemy, isGoal);
    }
  }

  afterMoveComplete(player, score, capturedEnemy, isGoal) {
    if (player.crownedCount >= 4) {
      this.isGameOver = true;
      this.winner = player;
      if (this.onGameOver) this.onGameOver(player);
      if (this.onStateChange) this.onStateChange();
      return;
    }

    const hasBonus = this.isBonusRoll(score) || capturedEnemy !== null;

    if (hasBonus) {
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
    if (this.onStateChange) this.onStateChange();

    if (nextPlayer.isAI && !this.isGameOver) {
      setTimeout(() => this.triggerAIMove(), 750);
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
