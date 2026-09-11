/**
 * 3D Scene Builder for Chakaram (Chowka Bara)
 * Top-Down View ONLY • Authentic Wooden Board (Matching Image 1)
 *
 * Features:
 * - Fixed Top-Down Camera framing the board, resting places, and side chozhi tray
 * - Light natural birchwood board matching Image 1 with 4 midpoint floral emblems & center mandala
 * - Chozhi rolling tray placed to the RIGHT of the board in plain sight (NOT in center)
 * - Carved resting yard coin slots that EMPTY when a coin enters the board and RE-FILL when captured
 * - Restored original tactile hardwood turned coin designs and sizes
 */

class Chakaram3DScene {
  constructor(container, gridSize = 5) {
    this.container = container;
    this.gridSize = gridSize; // 5 or 7
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    // 3D Groups
    this.boardGroup = null;
    this.tiles = [];
    this.homeYards = {}; // yardIndex / side -> yard group
    this.pawnMap = new Map(); // coinId -> pawnGroup mesh

    // Cowrie Shells (Chozhi) - To the RIGHT of the board
    this.chozhiGroup = null;
    this.chozhiShells = [];
    this.isRollingChozhi = false;
    this.targetShellStates = [];
    this.chozhiTrayMesh = null;

    // State
    this.isCoinAnimating = false;

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Callbacks
    this.onPawnClicked = null;
    this.onChozhiRolled = null;

    window.chakaramScene = this;
    this.init();
  }

  init() {
    // 1. Scene with soft neutral studio background (matching Image 1)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xd2cbc1);

    // 2. Camera: STRICT TOP-DOWN VIEW ONLY
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    this.setTopDownCamera();

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls: Locked to Top-Down (No orbit/tilt)
    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(
        this.camera,
        this.renderer.domElement,
      );
      this.controls.enableRotate = false; // Strictly Top-Down!
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
      this.controls.minDistance = 8;
      this.controls.maxDistance = 25;
      this.controls.target.set(0.6, 0, 0);
    }

    // 5. Studio Lighting
    this.setupLighting();

    // 6. Build Initial Board
    this.rebuildBoard(this.gridSize);

    // 7. Event Listeners
    window.addEventListener("resize", this.onResize.bind(this));
    this.renderer.domElement.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this),
    );
    this.renderer.domElement.addEventListener(
      "click",
      this.onPointerClick.bind(this),
    );

    // 8. Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setTopDownCamera() {
    if (!this.camera) return;
    // Perfect top-down framing showing the board and the right-side Chozhi tray
    if (this.gridSize === 7) {
      this.camera.position.set(0.6, 19.5, 0.001);
    } else {
      this.camera.position.set(0.6, 16.5, 0.001);
    }
    if (this.controls) {
      this.controls.target.set(0.6, 0, 0);
      this.controls.update();
    }
  }

  // --- REBUILD BOARD ---
  rebuildBoard(gridSize) {
    this.gridSize = gridSize;
    this.setTopDownCamera();

    if (this.boardGroup) {
      this.scene.remove(this.boardGroup);
    }
    if (this.chozhiGroup) {
      this.scene.remove(this.chozhiGroup);
    }
    Object.values(this.homeYards).forEach((yard) => this.scene.remove(yard));
    this.homeYards = {};

    this.buildMatrixBoard();
    this.buildHomeYards();
    this.buildStartingPawns();
    this.buildSideChozhiDice();
  }

  // --- AUTHENTIC WOODEN BOARD (MATCHING IMAGE 1) ---
  buildMatrixBoard() {
    this.boardGroup = new THREE.Group();
    const N = this.gridSize;
    const mid = Math.floor(N / 2);

    const tileSize = N === 7 ? 1.05 : 1.25;
    const totalSpan = N * tileSize;
    const baseWidth = totalSpan + 0.55;
    const baseHeight = 0.32;

    this.boardBaseWidth = baseWidth;
    this.tileSize = tileSize;

    // Wooden Peedam base with natural birch side
    const peedamGeo = new THREE.BoxGeometry(baseWidth, baseHeight, baseWidth);
    const woodSideCanvas = ProceduralTextures.createWoodTexture(
      "sandalwood",
      256,
      256,
    );
    const woodSideTex = new THREE.CanvasTexture(woodSideCanvas);

    const peedamMat = new THREE.MeshStandardMaterial({
      map: woodSideTex,
      roughness: 0.65,
      metalness: 0.05,
    });
    const peedam = new THREE.Mesh(peedamGeo, peedamMat);
    peedam.position.y = baseHeight / 2;
    peedam.receiveShadow = true;
    peedam.castShadow = true;
    this.boardGroup.add(peedam);

    // Thin raised wooden rim around the board (as seen in Image 1)
    const rimGeo = new THREE.BoxGeometry(
      baseWidth + 0.08,
      0.04,
      baseWidth + 0.08,
    );
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xc8a882,
      roughness: 0.5,
      metalness: 0.1,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.position.y = baseHeight;
    this.boardGroup.add(rimMesh);

    // 5x5 / 7x7 Grid Tiles
    const startOffset = -((N - 1) / 2) * tileSize;
    this.tiles = [];

    const engine = window.chakaramEngine;

    for (let row = 0; row < N; row++) {
      this.tiles[row] = [];
      for (let col = 0; col < N; col++) {
        const isCenter = row === mid && col === mid;
        // Safe houses at the 4 midpoints (as in Image 1)
        const isMidpoint =
          ((row === 0 || row === N - 1) && col === mid) ||
          ((col === 0 || col === N - 1) && row === mid);
        const isSafe = isMidpoint;

        const tileCanvas = ProceduralTextures.createTileTexture(
          row,
          col,
          N,
          false,
          isSafe,
          isCenter,
          false,
        );
        const tileTex = new THREE.CanvasTexture(tileCanvas);

        const topMat = new THREE.MeshStandardMaterial({
          map: tileTex,
          roughness: 0.62,
          metalness: 0.08,
        });

        const tileThickness = 0.12;
        const tileGeo = new THREE.BoxGeometry(
          tileSize,
          tileThickness,
          tileSize,
        );
        const mats = [
          peedamMat,
          peedamMat,
          topMat,
          peedamMat,
          peedamMat,
          peedamMat,
        ];
        const tileMesh = new THREE.Mesh(tileGeo, mats);

        const posX = startOffset + col * tileSize;
        const posZ = startOffset + row * tileSize;
        const posY = baseHeight + tileThickness / 2;

        tileMesh.position.set(posX, posY, posZ);
        tileMesh.castShadow = true;
        tileMesh.receiveShadow = true;

        tileMesh.userData = {
          row,
          col,
          index: row * N + col + 1,
          baseY: posY,
          isCenter: isCenter,
          isSafeHouse: isSafe,
          tileSize: tileSize,
        };

        this.boardGroup.add(tileMesh);
        this.tiles[row][col] = tileMesh;
      }
    }

    this.scene.add(this.boardGroup);
  }

  // --- CARVED HOME RESTING YARDS WITH VISIBLE SLOTS ---
  buildHomeYards() {
    this.homeYards = {};
    const baseOffset = this.boardBaseWidth / 2 + 0.75;

    // 4 Sides: South (P1), West (P2), North (P3), East (P4)
    const yardConfigs = [
      { side: "SOUTH", x: 0, z: baseOffset, color: 0xd4883b },
      { side: "WEST", x: -baseOffset, z: 0, color: 0xa8422b },
      { side: "NORTH", x: 0, z: -baseOffset, color: 0x7c3a21 },
      { side: "EAST", x: baseOffset, z: 0, color: 0xd9b177 },
    ];

    yardConfigs.forEach((cfg) => {
      const yardGroup = new THREE.Group();

      // Yard base
      const yardW = 2.0;
      const yardH = 0.15;
      const yardGeo = new THREE.CylinderGeometry(
        yardW / 2,
        yardW / 2 + 0.05,
        yardH,
        32,
      );
      const yardMat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        roughness: 0.5,
        metalness: 0.1,
      });
      const yardBase = new THREE.Mesh(yardGeo, yardMat);
      yardBase.position.y = yardH / 2;
      yardBase.receiveShadow = true;
      yardBase.castShadow = true;
      yardGroup.add(yardBase);

      // Carve 4 distinct indented coin spots / resting slots
      const slotOffsets = [
        [-0.35, -0.35],
        [0.35, -0.35],
        [-0.35, 0.35],
        [0.35, 0.35],
      ];

      yardGroup.userData.slots = [];

      slotOffsets.forEach(([sx, sz], sIdx) => {
        // Indented circular spot (empty depression)
        const spotGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.03, 20);
        const spotMat = new THREE.MeshStandardMaterial({
          color: 0x221a14,
          roughness: 0.85,
          metalness: 0.1,
        });
        const spotMesh = new THREE.Mesh(spotGeo, spotMat);
        spotMesh.position.set(sx, yardH + 0.01, sz);
        spotMesh.receiveShadow = true;
        yardGroup.add(spotMesh);

        // Brass thin indicator ring around slot
        const ringGeo = new THREE.RingGeometry(0.22, 0.25, 20);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xd4af37,
          side: THREE.DoubleSide,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(sx, yardH + 0.02, sz);
        yardGroup.add(ringMesh);

        yardGroup.userData.slots.push({
          index: sIdx,
          x: sx,
          z: sz,
          isOccupied: true,
          spotMesh: spotMesh,
        });
      });

      yardGroup.position.set(cfg.x, 0, cfg.z);
      yardGroup.userData.side = cfg.side;
      yardGroup.userData.baseY = yardH;

      this.scene.add(yardGroup);
      this.homeYards[cfg.side] = yardGroup;
    });
  }

  // --- RESTORE ORIGINAL HARDWOOD COIN MODELS & SIZES ---
  buildStartingPawns() {
    this.pawnMap.clear();

    const woodTypes = ["teak", "cedar", "rosewood", "sandalwood"];
    const woodMaterials = woodTypes.map((type) => {
      const canvas = ProceduralTextures.createWoodTexture(type, 512, 512);
      return new THREE.MeshStandardMaterial({
        map: new THREE.CanvasTexture(canvas),
        roughness: 0.38,
        metalness: 0.04,
      });
    });

    const engine = window.chakaramEngine;
    const activePlayers = engine
      ? engine.players
      : [
          { id: 1, side: "SOUTH", name: "தெற்கு" },
          { id: 2, side: "WEST", name: "மேற்கு" },
          { id: 3, side: "NORTH", name: "வடக்கு" },
          { id: 4, side: "EAST", name: "கிழக்கு" },
        ];

    activePlayers.forEach((player, pIdx) => {
      const yardGroup = this.homeYards[player.side];
      if (!yardGroup) return;

      const mat = woodMaterials[pIdx % woodMaterials.length];
      const shapeType =
        pIdx === 0 || pIdx === 1 ? "spool" : pIdx === 2 ? "knob" : "bullet";

      for (let slotIdx = 0; slotIdx < 4; slotIdx++) {
        const pawnGroup = new THREE.Group();
        const coinId = `${player.id}_${slotIdx}`;

        // Restore original lathe shapes and proportions
        if (shapeType === "spool") {
          const baseGeo = new THREE.CylinderGeometry(0.1, 0.16, 0.2, 18);
          const base = new THREE.Mesh(baseGeo, mat);
          base.position.y = 0.1;
          base.castShadow = true;
          pawnGroup.add(base);

          const topGeo = new THREE.CylinderGeometry(0.15, 0.09, 0.18, 18);
          const top = new THREE.Mesh(topGeo, mat);
          top.position.y = 0.29;
          top.castShadow = true;
          pawnGroup.add(top);
        } else if (shapeType === "knob") {
          const bodyGeo = new THREE.CylinderGeometry(0.09, 0.16, 0.28, 18);
          const body = new THREE.Mesh(bodyGeo, mat);
          body.position.y = 0.14;
          body.castShadow = true;
          pawnGroup.add(body);

          const knobGeo = new THREE.SphereGeometry(0.11, 16, 14);
          const knob = new THREE.Mesh(knobGeo, mat);
          knob.position.y = 0.32;
          knob.castShadow = true;
          pawnGroup.add(knob);
        } else {
          const bodyGeo = new THREE.CylinderGeometry(0.13, 0.16, 0.24, 18);
          const body = new THREE.Mesh(bodyGeo, mat);
          body.position.y = 0.12;
          body.castShadow = true;
          pawnGroup.add(body);

          const domeGeo = new THREE.SphereGeometry(
            0.13,
            16,
            12,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2,
          );
          const dome = new THREE.Mesh(domeGeo, mat);
          dome.position.y = 0.24;
          dome.castShadow = true;
          pawnGroup.add(dome);
        }

        // Selection Halo
        const ringGeo = new THREE.RingGeometry(0.18, 0.26, 24);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffd700,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0,
        });
        const selectionRing = new THREE.Mesh(ringGeo, ringMat);
        selectionRing.position.y = 0.01;
        pawnGroup.add(selectionRing);

        const slot = yardGroup.userData.slots[slotIdx];
        pawnGroup.position.set(slot.x, yardGroup.userData.baseY, slot.z);

        pawnGroup.userData = {
          isPawn: true,
          coinId: coinId,
          playerId: player.id,
          slotIndex: slotIdx,
          homeYard: yardGroup,
          isInHomeYard: true,
          currentTile: null,
          selectionRing: selectionRing,
          isMovable: false,
        };

        yardGroup.add(pawnGroup);
        this.pawnMap.set(coinId, pawnGroup);
      }
    });
  }

  // --- CHOZHI ROLLING TRAY PLACED BESIDE THE BOARD (NOT IN CENTER) ---
  buildSideChozhiDice() {
    this.chozhiGroup = new THREE.Group();
    const numShells = this.gridSize === 7 ? 6 : 4;

    // Elegant brass tray
    const trayRadius = 1.35;
    const trayH = 0.14;

    const trayBaseGeo = new THREE.CylinderGeometry(
      trayRadius,
      trayRadius * 0.94,
      trayH,
      36,
    );
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.88,
    });
    this.chozhiTrayMesh = new THREE.Mesh(trayBaseGeo, brassMat);
    this.chozhiTrayMesh.position.y = trayH / 2;
    this.chozhiTrayMesh.receiveShadow = true;
    this.chozhiTrayMesh.castShadow = true;
    this.chozhiGroup.add(this.chozhiTrayMesh);

    const trayRimGeo = new THREE.TorusGeometry(trayRadius - 0.03, 0.05, 16, 36);
    trayRimGeo.rotateX(Math.PI / 2);
    const trayRim = new THREE.Mesh(trayRimGeo, brassMat);
    trayRim.position.y = trayH;
    this.chozhiGroup.add(trayRim);

    const velvetGeo = new THREE.CylinderGeometry(
      trayRadius - 0.08,
      trayRadius - 0.08,
      0.03,
      36,
    );
    const velvetMat = new THREE.MeshStandardMaterial({
      color: 0x6e1a1a,
      roughness: 0.95,
      metalness: 0.02,
    });
    const velvetMesh = new THREE.Mesh(velvetGeo, velvetMat);
    velvetMesh.position.y = trayH + 0.01;
    velvetMesh.receiveShadow = true;
    this.chozhiGroup.add(velvetMesh);

    // Solid Cowrie Shell Models
    const shellTextureCanvas = ProceduralTextures.createCompleteChozhiTexture(
      1024,
      512,
    );
    const shellTex = new THREE.CanvasTexture(shellTextureCanvas);
    const solidShellMaterial = new THREE.MeshStandardMaterial({
      map: shellTex,
      roughness: 0.16,
      metalness: 0.04,
    });

    const baseSphere = new THREE.SphereGeometry(0.32, 28, 20);
    const posAttr = baseSphere.attributes.position;
    const uvAttr = baseSphere.attributes.uv;

    for (let i = 0; i < posAttr.count; i++) {
      let px = posAttr.getX(i);
      let py = posAttr.getY(i);
      let pz = posAttr.getZ(i);

      px *= 1.55;
      pz *= 0.92;

      const taper = Math.max(
        0.25,
        1.0 - Math.pow(Math.abs(px) / 0.55, 2) * 0.42,
      );
      py *= taper;
      pz *= taper;

      if (py >= 0) {
        const distFromCenterSlit = Math.abs(pz);
        if (distFromCenterSlit < 0.12) {
          py = py * 0.22 - 0.03 * (1.0 - distFromCenterSlit / 0.12);
        } else {
          py = py * 0.52;
        }
      } else {
        py = py * 0.82;
      }

      posAttr.setXYZ(i, px, py, pz);

      const u = (px / 1.55 + 0.32) / 0.64;
      let v = 0.5;
      if (py >= 0) {
        v = 0.5 + Math.min(0.5, (Math.abs(pz) / 0.32) * 0.5);
      } else {
        v = 0.5 - Math.min(0.5, (Math.abs(py) / 0.32) * 0.5);
      }
      uvAttr.setXY(i, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
    }
    baseSphere.computeVertexNormals();

    this.chozhiShells = [];
    let shellPositions = [];

    if (numShells === 4) {
      shellPositions = [
        [-0.42, -0.38],
        [0.42, -0.38],
        [-0.42, 0.38],
        [0.42, 0.38],
      ];
    } else {
      shellPositions = [
        [-0.55, -0.38],
        [0.0, -0.48],
        [0.55, -0.38],
        [-0.55, 0.38],
        [0.0, 0.48],
        [0.55, 0.38],
      ];
    }

    const shellBaseY = trayH + 0.16;

    for (let i = 0; i < numShells; i++) {
      const shellMesh = new THREE.Mesh(baseSphere.clone(), solidShellMaterial);
      const [sx, sz] = shellPositions[i];

      shellMesh.position.set(sx, shellBaseY, sz);
      shellMesh.castShadow = true;
      shellMesh.receiveShadow = true;

      const isUpViewing = i % 2 === 0;
      shellMesh.rotation.x = isUpViewing ? 0 : Math.PI;
      shellMesh.rotation.y =
        (Math.random() - 0.5) * 0.4 + (i * Math.PI) / numShells;

      shellMesh.userData = {
        index: i,
        baseX: sx,
        baseZ: sz,
        baseY: shellBaseY,
        isUpViewing: isUpViewing,
      };

      this.chozhiGroup.add(shellMesh);
      this.chozhiShells.push(shellMesh);
    }

    // Position Chozhi tray to the RIGHT of the board in direct sight
    const posX = this.boardBaseWidth / 2 + 1.85;
    this.chozhiGroup.position.set(posX, 0, 0);
    this.scene.add(this.chozhiGroup);
  }

  // --- NON-OVERLAPPING COIN LAYOUT ON TILES ---
  layoutCoinsOnTile(tile) {
    if (!tile) return;
    const pawns = tile.children.filter((c) => c.userData && c.userData.isPawn);
    const count = pawns.length;
    if (count === 0) return;

    const factor = this.gridSize === 7 ? 0.68 : 0.88;
    let offsets = [];

    if (count === 1) {
      offsets = [[0, 0]];
    } else if (count === 2) {
      offsets = [
        [-0.22 * factor, 0],
        [0.22 * factor, 0],
      ];
    } else if (count === 3) {
      offsets = [
        [0, -0.2 * factor],
        [-0.2 * factor, 0.18 * factor],
        [0.2 * factor, 0.18 * factor],
      ];
    } else if (count === 4) {
      offsets = [
        [-0.22 * factor, -0.22 * factor],
        [0.22 * factor, -0.22 * factor],
        [-0.22 * factor, 0.22 * factor],
        [0.22 * factor, 0.22 * factor],
      ];
    } else {
      for (let i = 0; i < count; i++) {
        const angle = (i * Math.PI * 2) / count;
        offsets.push([
          Math.cos(angle) * 0.28 * factor,
          Math.sin(angle) * 0.28 * factor,
        ]);
      }
    }

    pawns.forEach((pawn, idx) => {
      const [ox, oz] = offsets[idx] || [0, 0];
      pawn.position.set(ox, 0.08, oz);
    });
  }

  setMovableCoins(legalMoves) {
    this.pawnMap.forEach((pawn) => {
      pawn.userData.isMovable = false;
      pawn.userData.selectionRing.material.opacity = 0;
    });

    if (!legalMoves || legalMoves.length === 0) return;

    legalMoves.forEach((move) => {
      const pawn = this.pawnMap.get(move.coin.id);
      if (pawn) {
        pawn.userData.isMovable = true;
        pawn.userData.legalMove = move;
        pawn.userData.selectionRing.material.opacity = 0.88;
      }
    });
  }

  // --- ANIMATE COIN HOPPING & EMPTYING RESTING SLOTS ---
  animatePawnMovement(
    coinId,
    hopPath,
    capturedCoin,
    isGoal,
    isUnlock,
    onComplete,
  ) {
    const pawn = this.pawnMap.get(coinId);
    if (!pawn || !hopPath || hopPath.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    this.isCoinAnimating = true;
    this.setMovableCoins([]);

    const originTile = pawn.userData.currentTile;
    const originYard = pawn.userData.homeYard;
    const slotIdx = pawn.userData.slotIndex;

    // If unlocking from resting yard, mark that slot as EMPTY!
    if (pawn.userData.isInHomeYard && originYard) {
      originYard.userData.slots[slotIdx].isOccupied = false;
    }

    let currentHopIdx = 0;

    const executeSingleHop = () => {
      if (currentHopIdx >= hopPath.length) {
        const finalCoord = hopPath[hopPath.length - 1];
        const finalTile = this.tiles[finalCoord.r][finalCoord.c];

        finalTile.attach(pawn);
        pawn.userData.currentTile = finalTile;
        pawn.userData.isInHomeYard = false;

        if (originTile) this.layoutCoinsOnTile(originTile);
        this.layoutCoinsOnTile(finalTile);

        if (isGoal) {
          this.animateCrownedPawn(pawn);
        }

        if (capturedCoin) {
          this.animateCapturedPawn(capturedCoin.id, () => {
            this.layoutCoinsOnTile(finalTile);
            this.isCoinAnimating = false;
            if (onComplete) onComplete();
          });
        } else {
          this.isCoinAnimating = false;
          if (onComplete) onComplete();
        }
        return;
      }

      const nextCoord = hopPath[currentHopIdx];
      const nextTile = this.tiles[nextCoord.r][nextCoord.c];

      this.scene.attach(pawn);

      const startPos = pawn.position.clone();
      const targetPos = new THREE.Vector3(
        nextTile.position.x,
        nextTile.position.y + 0.16,
        nextTile.position.z,
      );

      const hopDuration = 200; // ms
      const startTime = performance.now();

      const hopStep = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / hopDuration);

        const ease =
          progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;
        const hopArc = Math.sin(progress * Math.PI) * 0.45;

        pawn.position.x = THREE.MathUtils.lerp(startPos.x, targetPos.x, ease);
        pawn.position.z = THREE.MathUtils.lerp(startPos.z, targetPos.z, ease);
        pawn.position.y =
          THREE.MathUtils.lerp(startPos.y, targetPos.y, ease) + hopArc;

        if (progress < 1.0) {
          requestAnimationFrame(hopStep);
        } else {
          pawn.position.copy(targetPos);
          if (window.templeAudio) {
            window.templeAudio.playStoneClack();
          }
          currentHopIdx++;
          setTimeout(executeSingleHop, 18);
        }
      };

      requestAnimationFrame(hopStep);
    };

    executeSingleHop();
  }

  // Capture Return Arc Animation (Returns to empty resting slot)
  animateCapturedPawn(capturedCoinId, onComplete) {
    const pawn = this.pawnMap.get(capturedCoinId);
    if (!pawn) {
      if (onComplete) onComplete();
      return;
    }

    if (window.templeAudio) {
      window.templeAudio.playCaptureSound();
    }

    const yard = pawn.userData.homeYard;
    const slotIdx = pawn.userData.slotIndex;
    const slot = yard.userData.slots[slotIdx];

    this.scene.attach(pawn);

    const startPos = pawn.position.clone();
    const targetPos = new THREE.Vector3(
      yard.position.x + slot.x,
      yard.position.y + yard.userData.baseY,
      yard.position.z + slot.z,
    );

    const duration = 500; // ms
    const startTime = performance.now();

    const captureAnim = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const arc = Math.sin(progress * Math.PI) * 1.5;

      pawn.position.x = THREE.MathUtils.lerp(startPos.x, targetPos.x, progress);
      pawn.position.z = THREE.MathUtils.lerp(startPos.z, targetPos.z, progress);
      pawn.position.y =
        THREE.MathUtils.lerp(startPos.y, targetPos.y, progress) + arc;
      pawn.rotation.y += 0.25;

      if (progress < 1.0) {
        requestAnimationFrame(captureAnim);
      } else {
        yard.attach(pawn);
        pawn.position.set(slot.x, yard.userData.baseY, slot.z);
        pawn.userData.isInHomeYard = true;
        pawn.userData.currentTile = null;
        slot.isOccupied = true; // Re-occupy slot!

        if (window.templeAudio) {
          window.templeAudio.playStoneClack();
        }
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(captureAnim);
  }

  animateCrownedPawn(pawn) {
    pawn.scale.set(1.2, 1.2, 1.2);
    if (window.templeAudio) {
      window.templeAudio.playTempleBell(1.5);
    }
  }

  resetAllPawns() {
    this.pawnMap.forEach((pawn) => {
      const yard = pawn.userData.homeYard;
      const slotIdx = pawn.userData.slotIndex;
      const slot = yard.userData.slots[slotIdx];

      yard.attach(pawn);
      pawn.position.set(slot.x, yard.userData.baseY, slot.z);
      pawn.scale.set(1, 1, 1);
      pawn.userData.selectionRing.material.opacity = 0;
      pawn.userData.isMovable = false;
      pawn.userData.isInHomeYard = true;
      pawn.userData.currentTile = null;
      slot.isOccupied = true;
    });

    const N = this.gridSize;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        this.layoutCoinsOnTile(this.tiles[r][c]);
      }
    }
  }

  // --- ROLL COWRIE SHELLS IN SIDE TRAY ---
  rollChozhi() {
    if (this.isRollingChozhi || this.isCoinAnimating) return;
    this.isRollingChozhi = true;

    if (window.templeAudio) {
      window.templeAudio.playChozhiRattle();
    }

    const numShells = this.chozhiShells.length; // 4 or 6
    let upCount = 0;
    let points = 0;

    if (numShells === 4) {
      const rollDistribution = [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 0];
      upCount =
        rollDistribution[Math.floor(Math.random() * rollDistribution.length)];
      points = upCount === 0 ? 8 : upCount;
    } else {
      const rollDistribution = [
        1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4,
        4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 0, 0,
      ];
      upCount =
        rollDistribution[Math.floor(Math.random() * rollDistribution.length)];
      points = upCount === 0 ? 12 : upCount;
    }

    const downCount = numShells - upCount;
    const indices = [];
    for (let k = 0; k < numShells; k++) indices.push(k);
    indices.sort(() => Math.random() - 0.5);
    const upIndices = new Set(indices.slice(0, upCount));

    this.targetShellStates = [];
    for (let i = 0; i < numShells; i++) {
      const isUp = upIndices.has(i);
      this.targetShellStates.push({
        isUpViewing: isUp,
        targetRotX: isUp ? 0 : Math.PI,
        targetRotZ: (Math.random() - 0.5) * 0.1,
        targetRotY: Math.random() * Math.PI * 2,
        jitterX: (Math.random() - 0.5) * 0.18,
        jitterZ: (Math.random() - 0.5) * 0.18,
        spinSpeed: 7 + Math.random() * 5,
      });
    }

    const rollDuration = 1.05;
    const startTime = performance.now();

    const rollAnim = (now) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(1.0, elapsed / rollDuration);

      this.chozhiShells.forEach((shell, i) => {
        const target = this.targetShellStates[i];

        if (progress < 0.6) {
          const tossP = progress / 0.6;
          const tossHeight = Math.sin(tossP * Math.PI) * 1.3;
          shell.position.y = shell.userData.baseY + tossHeight;
          shell.rotation.x += target.spinSpeed * 0.02;
          shell.rotation.y += 0.14;
          shell.rotation.z += 0.06;
          shell.position.x =
            shell.userData.baseX + Math.sin(tossP * 5 + i) * 0.08;
          shell.position.z =
            shell.userData.baseZ + Math.cos(tossP * 5 + i) * 0.08;
        } else if (progress < 0.85) {
          const bounceP = (progress - 0.6) / 0.25;
          const bounceHeight =
            Math.sin(bounceP * Math.PI) * 0.18 * (1 - bounceP);
          shell.position.y = shell.userData.baseY + bounceHeight;

          shell.position.x = THREE.MathUtils.lerp(
            shell.position.x,
            shell.userData.baseX + target.jitterX,
            0.25,
          );
          shell.position.z = THREE.MathUtils.lerp(
            shell.position.z,
            shell.userData.baseZ + target.jitterZ,
            0.25,
          );

          shell.rotation.x = THREE.MathUtils.lerp(
            shell.rotation.x,
            target.targetRotX,
            0.3,
          );
          shell.rotation.z = THREE.MathUtils.lerp(
            shell.rotation.z,
            target.targetRotZ,
            0.3,
          );
          shell.rotation.y = THREE.MathUtils.lerp(
            shell.rotation.y,
            target.targetRotY,
            0.3,
          );
        } else {
          const settleP = (progress - 0.85) / 0.15;
          shell.position.y = shell.userData.baseY;
          shell.position.x = THREE.MathUtils.lerp(
            shell.position.x,
            shell.userData.baseX + target.jitterX,
            settleP,
          );
          shell.position.z = THREE.MathUtils.lerp(
            shell.position.z,
            shell.userData.baseZ + target.jitterZ,
            settleP,
          );

          shell.rotation.x = THREE.MathUtils.lerp(
            shell.rotation.x,
            target.targetRotX,
            settleP,
          );
          shell.rotation.z = THREE.MathUtils.lerp(
            shell.rotation.z,
            target.targetRotZ,
            settleP,
          );
          shell.rotation.y = THREE.MathUtils.lerp(
            shell.rotation.y,
            target.targetRotY,
            settleP,
          );
        }
      });

      if (progress < 1.0) {
        requestAnimationFrame(rollAnim);
      } else {
        this.isRollingChozhi = false;
        this.chozhiShells.forEach((shell, i) => {
          const target = this.targetShellStates[i];
          shell.rotation.x = target.targetRotX;
          shell.rotation.z = target.targetRotZ;
          shell.rotation.y = target.targetRotY;
          shell.position.y = shell.userData.baseY;
          shell.userData.isUpViewing = target.isUpViewing;
        });

        const engine = window.chakaramEngine;
        const isBonus = engine
          ? engine.isBonusRoll(points)
          : points === 1 ||
            points === 4 ||
            points === 8 ||
            points === 6 ||
            points === 12;

        if (isBonus && window.templeAudio) {
          window.templeAudio.playTempleBell(1.4);
        }

        if (this.onChozhiRolled) {
          this.onChozhiRolled({
            points: points,
            upCount: upCount,
            downCount: downCount,
            numShells: numShells,
            isDaayam: points === 1,
            isChowka:
              (numShells === 4 && points === 4) ||
              (numShells === 6 && points === 6),
            isAshta: numShells === 4 && points === 8,
            isBaara: numShells === 6 && points === 12,
            isBonus: isBonus,
          });
        }
      }
    };

    requestAnimationFrame(rollAnim);
  }

  setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xfff6ec, 1.35);
    this.scene.add(this.ambientLight);

    this.mainDirLight = new THREE.DirectionalLight(0xfffaee, 1.4);
    this.mainDirLight.position.set(3, 20, 5);
    this.mainDirLight.castShadow = true;
    this.mainDirLight.shadow.mapSize.width = 2048;
    this.mainDirLight.shadow.mapSize.height = 2048;
    this.mainDirLight.shadow.bias = -0.0004;
    this.scene.add(this.mainDirLight);
  }

  onMouseMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const pawns = Array.from(this.pawnMap.values());
    const intersects = this.raycaster.intersectObjects(pawns, true);

    if (intersects.length > 0) {
      let hitObj = intersects[0].object;
      while (hitObj.parent && !hitObj.userData.isPawn) {
        hitObj = hitObj.parent;
      }
      if (hitObj.userData.isPawn && hitObj.userData.isMovable) {
        document.body.style.cursor = "pointer";
        return;
      }
    }

    // Check side tray hover
    if (this.chozhiGroup) {
      const chozhiIntersects = this.raycaster.intersectObjects(
        this.chozhiGroup.children,
        true,
      );
      if (chozhiIntersects.length > 0) {
        document.body.style.cursor = "pointer";
        return;
      }
    }

    document.body.style.cursor = "default";
  }

  onPointerClick(event) {
    if (this.isCoinAnimating) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Chozhi Tray Click -> Roll
    if (this.chozhiGroup) {
      const chozhiIntersects = this.raycaster.intersectObjects(
        this.chozhiGroup.children,
        true,
      );
      if (chozhiIntersects.length > 0) {
        const engine = window.chakaramEngine;
        if (engine && !engine.hasRolled && !engine.getCurrentPlayer().isAI) {
          this.rollChozhi();
        }
        return;
      }
    }

    // 2. Movable Pawn Click -> Execute Move!
    const pawns = Array.from(this.pawnMap.values());
    const intersects = this.raycaster.intersectObjects(pawns, true);

    if (intersects.length > 0) {
      let hitObj = intersects[0].object;
      while (hitObj.parent && !hitObj.userData.isPawn) {
        hitObj = hitObj.parent;
      }

      if (
        hitObj.userData.isPawn &&
        hitObj.userData.isMovable &&
        this.onPawnClicked
      ) {
        this.onPawnClicked(hitObj.userData.coinId, hitObj.userData.legalMove);
        return;
      }
    }
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate(time) {
    requestAnimationFrame(this.animate);
    const sec = time * 0.001;

    this.pawnMap.forEach((pawn) => {
      if (pawn.userData.isMovable) {
        const ring = pawn.userData.selectionRing;
        const pulse = (Math.sin(sec * 6) + 1) * 0.5;
        ring.material.opacity = 0.5 + pulse * 0.45;
        ring.scale.set(1 + pulse * 0.18, 1 + pulse * 0.18, 1);
      }
    });

    if (this.controls) {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Chakaram3DScene = Chakaram3DScene;
