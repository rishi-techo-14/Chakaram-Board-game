/**
 * Procedural Texture Generator for Chakaram (Chowka Bara)
 * Faithfully matches authentic handcrafted wooden board in Image 1:
 * - Light natural birchwood with subtle organic woodgrain
 * - Clean, thin black grid lines
 * - 4 Midpoint Safe Houses: Authentic 4-petal floral circle emblems (as seen in Image 1)
 * - Center Goal: Intricate circular mandala / lotus rosette emblem (as seen in Image 1)
 * - Carved hardwood resting yard bases with indented coin slots
 * - Realistic UV-Mapped Cowrie Shell (சோழி / Chozhi) Texture
 * - Lathe-turned hardwood textures (Teak, Rosewood, Sandalwood, Red Cedar)
 */

class ProceduralTextures {
  // 1. Turned Hardwood Grain Texture for 3D Game Pawns / Coins
  static createWoodTexture(woodColorType = "teak", width = 512, height = 512) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    let baseColor = "#b57642";
    let grainColor = "#7a421c";
    let ringColor = "rgba(70, 32, 10, 0.25)";

    if (woodColorType === "rosewood") {
      baseColor = "#4a2313";
      grainColor = "#240d05";
      ringColor = "rgba(25, 8, 3, 0.45)";
    } else if (woodColorType === "sandalwood") {
      baseColor = "#d9b177";
      grainColor = "#a37943";
      ringColor = "rgba(110, 75, 30, 0.2)";
    } else if (woodColorType === "cedar") {
      baseColor = "#8a3420";
      grainColor = "#4a150a";
      ringColor = "rgba(45, 10, 5, 0.35)";
    }

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += 3) {
      ctx.fillStyle = grainColor;
      ctx.globalAlpha = 0.15 + Math.sin(y * 0.08) * 0.1;
      ctx.fillRect(0, y, width, 2);
    }

    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      const yStart = Math.random() * height;
      ctx.moveTo(0, yStart);
      ctx.bezierCurveTo(
        width * 0.33,
        yStart + (Math.random() - 0.5) * 40,
        width * 0.66,
        yStart + (Math.random() - 0.5) * 40,
        width,
        yStart + (Math.random() - 0.5) * 20,
      );
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2 + Math.random() * 3;
      ctx.stroke();
    }

    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#ffffff";
    for (let ly = 10; ly < height; ly += 25) {
      ctx.fillRect(0, ly, width, 3);
    }

    ctx.globalAlpha = 1.0;
    return canvas;
  }

  // 2. Authentic Light Natural Birch/Pine or Custom Wood Board Texture (Matching Image 1)
  static createNaturalBoardWoodTexture(
    theme = "birch",
    width = 1024,
    height = 1024,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createLinearGradient(0, 0, width, height);

    let fiberColor = "rgba(175, 140, 95, 0.08)";
    let waveColor = "rgba(160, 125, 80, 0.14)";

    if (theme === "teak") {
      grad.addColorStop(0, "#d29656");
      grad.addColorStop(0.3, "#dfaa6c");
      grad.addColorStop(0.7, "#cc8e4c");
      grad.addColorStop(1, "#b87c3d");
      fiberColor = "rgba(110, 60, 20, 0.12)";
      waveColor = "rgba(90, 45, 15, 0.22)";
    } else if (theme === "rosewood") {
      grad.addColorStop(0, "#5a3020");
      grad.addColorStop(0.3, "#6e3c28");
      grad.addColorStop(0.7, "#522919");
      grad.addColorStop(1, "#441e10");
      fiberColor = "rgba(25, 10, 5, 0.25)";
      waveColor = "rgba(20, 8, 4, 0.35)";
    } else if (theme === "sandalwood") {
      grad.addColorStop(0, "#f0d8ae");
      grad.addColorStop(0.3, "#f7e4c2");
      grad.addColorStop(0.7, "#ecd0a4");
      grad.addColorStop(1, "#e2be8f");
      fiberColor = "rgba(150, 115, 70, 0.08)";
      waveColor = "rgba(140, 100, 55, 0.15)";
    } else {
      // Default 'birch' (Matching Image 1)
      grad.addColorStop(0, "#ebd8be");
      grad.addColorStop(0.3, "#f2e2cb");
      grad.addColorStop(0.7, "#ebd5b8");
      grad.addColorStop(1, "#e5cca8");
      fiberColor = "rgba(175, 140, 95, 0.08)";
      waveColor = "rgba(160, 125, 80, 0.14)";
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle longitudinal fine wood fibers
    ctx.fillStyle = fiberColor;
    for (let x = 0; x < width; x += 2) {
      if (Math.random() > 0.4) {
        ctx.fillRect(x, 0, 1.5, height);
      }
    }

    // Soft organic woodgrain waves
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 3;
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * width;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.bezierCurveTo(
        sx + (Math.random() - 0.5) * 80,
        height * 0.33,
        sx + (Math.random() - 0.5) * 80,
        height * 0.66,
        sx + (Math.random() - 0.5) * 40,
        height,
      );
      ctx.stroke();
    }

    return canvas;
  }

  // Traditional South Indian Pulli Kolam Floor Texture
  static createKolamFloorTexture(size = 1024) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Warm Terracotta Red Base
    ctx.fillStyle = "#8a3c2a";
    ctx.fillRect(0, 0, size, size);

    // Subtle tile seams
    ctx.strokeStyle = "rgba(70, 24, 15, 0.4)";
    ctx.lineWidth = 3;
    const tileSize = size / 4;
    for (let x = 0; x <= size; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }

    const cx = size / 2;
    const cy = size / 2;

    ctx.strokeStyle = "rgba(255, 252, 244, 0.88)";
    ctx.fillStyle = "rgba(255, 252, 244, 0.92)";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Outer Kolam Borders
    ctx.strokeRect(cx - 420, cy - 420, 840, 840);
    ctx.strokeRect(cx - 435, cy - 435, 870, 870);

    // 16 Petal Lotus / Sikku curves
    const petals = 16;
    for (let p = 0; p < petals; p++) {
      const angle = (p * Math.PI * 2) / petals;
      const rInner = 240;
      const rOuter = 400;

      const x1 = cx + Math.cos(angle) * rInner;
      const y1 = cy + Math.sin(angle) * rInner;
      const x2 = cx + Math.cos(angle + Math.PI / petals) * rOuter;
      const y2 = cy + Math.sin(angle + Math.PI / petals) * rOuter;
      const x3 = cx + Math.cos(angle + (Math.PI * 2) / petals) * rInner;
      const y3 = cy + Math.sin(angle + (Math.PI * 2) / petals) * rInner;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(x2, y2, x3, y3);
      ctx.stroke();
    }

    // Pulli (Dot matrix) in concentric mandala
    const dotRings = [120, 200, 280, 360];
    dotRings.forEach((r) => {
      const count = Math.floor((r * Math.PI * 2) / 36);
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count;
        ctx.beginPath();
        ctx.arc(
          cx + Math.cos(a) * r,
          cy + Math.sin(a) * r,
          3.2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    });

    return canvas;
  }

  // 3. COMPLETE AUTHENTIC BOARD TILE TEXTURE (Matching Image 1)
  static createTileTexture(
    row,
    col,
    gridSize = 5,
    isSelected = false,
    isSafeHouse = false,
    isCenter = false,
    isStart = false,
    boardTheme = "birch",
  ) {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // Draw natural wood base
    const woodBase = this.createNaturalBoardWoodTexture(boardTheme, size, size);
    ctx.drawImage(woodBase, 0, 0);

    const cx = size / 2;
    const cy = size / 2;

    // Thin, crisp black grid border line (as seen in Image 1)
    ctx.strokeStyle = isSelected ? "#d4af37" : "#221c17";
    ctx.lineWidth = isSelected ? 8 : 3.5;
    if (isSelected) {
      ctx.shadowColor = "rgba(212, 175, 55, 0.8)";
      ctx.shadowBlur = 10;
    }
    ctx.strokeRect(3, 3, size - 6, size - 6);
    ctx.shadowBlur = 0;

    if (isCenter) {
      // Center Goal: Intricate circular rosette / mandala (as seen in Image 1)
      this.drawCenterMandala(ctx, cx, cy);
    } else if (isSafeHouse) {
      // Midpoint Safe House: 4-petal floral circle emblem (as seen in Image 1)
      this.drawMidpointFlowerEmblem(ctx, cx, cy);
    }

    return canvas;
  }

  // Authentic 4-Petal Floral Circle Emblem (Matching Image 1 Midpoint Safe Houses)
  static drawMidpointFlowerEmblem(ctx, cx, cy) {
    ctx.save();

    // Elegant slate-blue / charcoal engraving color matching Image 1
    const emblemColor = "#5e7284";
    const emblemFill = "rgba(94, 114, 132, 0.38)";

    const outerR = 175;

    // Outer crisp circle
    ctx.strokeStyle = emblemColor;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    // Inner concentric thin circle
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR - 18, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle hatched radial ring between circles
    const hatchCount = 48;
    for (let i = 0; i < hatchCount; i++) {
      const angle = (i * Math.PI * 2) / hatchCount;
      const x1 = cx + Math.cos(angle) * (outerR - 18);
      const y1 = cy + Math.sin(angle) * (outerR - 18);
      const x2 = cx + Math.cos(angle) * outerR;
      const y2 = cy + Math.sin(angle) * outerR;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Center tiny ring
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.stroke();

    // 4 Symmetrical Flower Petals along cardinal axes (Top, Bottom, Left, Right)
    const petalAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const petalLen = 135;
    const petalWidth = 36;

    petalAngles.forEach((angle) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Petal shape (teardrop lobe)
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.bezierCurveTo(
        45,
        -petalWidth,
        petalLen - 20,
        -petalWidth,
        petalLen,
        0,
      );
      ctx.bezierCurveTo(petalLen - 20, petalWidth, 45, petalWidth, 18, 0);
      ctx.fillStyle = emblemFill;
      ctx.fill();
      ctx.strokeStyle = emblemColor;
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Inner spine of petal
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.lineTo(petalLen - 10, 0);
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Small hatching on petal tips
      ctx.beginPath();
      ctx.moveTo(petalLen - 35, -12);
      ctx.lineTo(petalLen - 35, 12);
      ctx.moveTo(petalLen - 20, -8);
      ctx.lineTo(petalLen - 20, 8);
      ctx.stroke();

      ctx.restore();
    });

    ctx.restore();
  }

  // Intricate Circular Mandala / Rosette (Matching Image 1 Center Goal)
  static drawCenterMandala(ctx, cx, cy) {
    ctx.save();

    const emblemColor = "#5e7284";
    const emblemFill = "rgba(94, 114, 132, 0.42)";

    // Outer scalloped mandala border
    const outerR = 195;
    ctx.strokeStyle = emblemColor;
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    // Scalloped petal wreath
    const petals = 24;
    for (let p = 0; p < petals; p++) {
      const a1 = (p * Math.PI * 2) / petals;
      const a2 = ((p + 1) * Math.PI * 2) / petals;
      const amid = (a1 + a2) / 2;

      const x1 = cx + Math.cos(a1) * outerR;
      const y1 = cy + Math.sin(a1) * outerR;
      const x2 = cx + Math.cos(a2) * outerR;
      const y2 = cy + Math.sin(a2) * outerR;
      const xm = cx + Math.cos(amid) * (outerR - 18);
      const ym = cy + Math.sin(amid) * (outerR - 18);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(xm, ym, x2, y2);
      ctx.stroke();
    }

    // Inner circle
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.stroke();

    // Radiating 8-fold lotus petals
    const lobes = 8;
    for (let l = 0; l < lobes; l++) {
      const angle = (l * Math.PI * 2) / lobes;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.bezierCurveTo(50, -28, 105, -24, 130, 0);
      ctx.bezierCurveTo(105, 24, 50, 28, 25, 0);
      ctx.fillStyle = emblemFill;
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(120, 0);
      ctx.lineWidth = 2.0;
      ctx.stroke();

      ctx.restore();
    }

    // Center hub
    ctx.fillStyle = emblemColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ecd5b5";
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 4. REALISTIC UV-MAPPED TEXTURE FOR SOLID COWRIE SHELL (சோழி)
  static createCompleteChozhiTexture(width = 1024, height = 512) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#f8f5ee";
    ctx.fillRect(0, 0, width, height);

    // --- DORSAL BACK (முதுகு) ---
    const topH = height / 2;
    const cx = width / 2;
    const cyTop = topH / 2;

    const dorsalGrad = ctx.createRadialGradient(cx, cyTop, 25, cx, cyTop, 360);
    dorsalGrad.addColorStop(0, "#fdfcf7");
    dorsalGrad.addColorStop(0.35, "#f5efdc");
    dorsalGrad.addColorStop(0.7, "#e4d6b9");
    dorsalGrad.addColorStop(0.9, "#d0bd9a");
    dorsalGrad.addColorStop(1, "#bfa882");
    ctx.fillStyle = dorsalGrad;
    ctx.fillRect(0, 0, width, topH);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.ellipse(cx, cyTop - 20, 210, 65, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(180, 150, 110, 0.25)";
    for (let s = 0; s < 30; s++) {
      const rx = cx + (Math.random() - 0.5) * 360;
      const ry = cyTop + (Math.random() - 0.5) * 120;
      ctx.beginPath();
      ctx.arc(rx, ry, 2 + Math.random() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- VENTRAL MOUTH (வாய்) ---
    const cyBot = topH + topH / 2;

    const ventralGrad = ctx.createRadialGradient(cx, cyBot, 35, cx, cyBot, 360);
    ventralGrad.addColorStop(0, "#fbf8f0");
    ventralGrad.addColorStop(0.6, "#eae1d0");
    ventralGrad.addColorStop(1, "#d5c6af");
    ctx.fillStyle = ventralGrad;
    ctx.fillRect(0, topH, width, topH);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(90, cyBot);
    ctx.bezierCurveTo(
      width * 0.35,
      cyBot - 14,
      width * 0.65,
      cyBot + 14,
      width - 90,
      cyBot,
    );
    ctx.strokeStyle = "#22140a";
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.restore();

    const teethCount = 28;
    const startX = 130;
    const endX = width - 130;
    const step = (endX - startX) / teethCount;

    for (let i = 0; i <= teethCount; i++) {
      const x = startX + i * step;
      const curveOffset = Math.sin((i / teethCount) * Math.PI);
      const toothLength = 52 * curveOffset + 12;

      ctx.beginPath();
      ctx.moveTo(x, cyBot - 5);
      ctx.lineTo(x + (Math.random() - 0.5) * 2, cyBot - 5 - toothLength);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, cyBot + 5);
      ctx.lineTo(x + (Math.random() - 0.5) * 2, cyBot + 5 + toothLength);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6.5;
      ctx.stroke();
    }

    return canvas;
  }
}

window.ProceduralTextures = ProceduralTextures;
