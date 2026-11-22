window.SB = window.SB || {};

/**
 * 七房间甜美少女星露谷像素美术引擎（每间 768×512）
 * 客厅 / 卧室 / 甜心化妆衣帽间 / 草莓泡泡浴室 / 奶油书房 / 草莓甜品屋 / 奶油甜心厨房
 * 含定制 Q 版「团团」(八哥犬) 与「lucky」(美短猫) 立绘渲染
 */
window.SB.Art = (function () {
  const MapRef = window.SB.Map;
  const W = MapRef.WIDTH;   // 768 default
  const H = MapRef.HEIGHT;  // 512 default

  const staticCanvases = {};

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function outlinedBox(ctx, x, y, w, h, fill, border = '#5c2f22') {
    px(ctx, x, y, w, h, border);
    if (w > 2 && h > 2) px(ctx, x + 1, y + 1, w - 2, h - 2, fill);
  }

  function roundedBox(ctx, x, y, w, h, r, fill, border = null) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    ctx.fillStyle = fill;
    ctx.fill();
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawMiniHeart(ctx, cx, cy, color) {
    px(ctx, cx - 2, cy - 1, 2, 2, color);
    px(ctx, cx + 1, cy - 1, 2, 2, color);
    px(ctx, cx - 2, cy, 5, 2, color);
    px(ctx, cx - 1, cy + 2, 3, 1, color);
    px(ctx, cx, cy + 3, 1, 1, color);
  }

  function drawLaceTrim(ctx, x, y, w, color = '#fff9fb') {
    for (let sx = x; sx < x + w - 4; sx += 6) {
      px(ctx, sx, y, 4, 3, color);
    }
  }

  // 粉色蝴蝶结小猫贴纸/地垫（浴室主题）
  function drawKittyFace(ctx, cx, cy, r, bowColor = '#ff5f8f') {
    const outline = '#e8b3c4';
    const ear = (x1, y1, x2, y2, x3, y3, fill) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3);
      ctx.closePath(); ctx.fill();
    };
    // 耳朵（先描边再白心）
    ear(cx - r + 1, cy - r * 0.7, cx - r + 1, cy - r - 9, cx - r * 0.15, cy - r + 3, outline);
    ear(cx + r - 1, cy - r * 0.7, cx + r - 1, cy - r - 9, cx + r * 0.15, cy - r + 3, outline);
    ear(cx - r + 4, cy - r * 0.6, cx - r + 4, cy - r - 5, cx - r * 0.25, cy - r + 4, '#ffffff');
    ear(cx + r - 4, cy - r * 0.6, cx + r - 4, cy - r - 5, cx + r * 0.25, cy - r + 4, '#ffffff');
    // 头
    ctx.fillStyle = outline;
    ctx.beginPath(); ctx.arc(cx, cy, r + 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    // 眼睛 / 鼻子
    px(ctx, Math.round(cx - r * 0.42), cy - 3, 4, 5, '#4a3b40');
    px(ctx, Math.round(cx + r * 0.42) - 4, cy - 3, 4, 5, '#4a3b40');
    px(ctx, cx - 2, cy + 3, 4, 3, '#f7b74a');
    // 胡须
    px(ctx, cx - r - 6, cy - 2, 6, 1, '#d9b6c2');
    px(ctx, cx - r - 6, cy + 3, 6, 1, '#d9b6c2');
    px(ctx, cx + r, cy - 2, 6, 1, '#d9b6c2');
    px(ctx, cx + r, cy + 3, 6, 1, '#d9b6c2');
    // 蝴蝶结
    const bx = Math.round(cx + r * 0.5);
    const by = Math.round(cy - r - 6);
    ctx.fillStyle = bowColor;
    ctx.beginPath();
    ctx.moveTo(bx, by + 5); ctx.lineTo(bx - 8, by); ctx.lineTo(bx - 8, by + 10); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx + 3, by + 5); ctx.lineTo(bx + 11, by); ctx.lineTo(bx + 11, by + 10); ctx.closePath(); ctx.fill();
    px(ctx, bx, by + 2, 4, 6, '#ffd6e2');
  }

  function drawWallsAndFloorShell(ctx, style, roomW = W, roomH = H) {
    px(ctx, 0, 0, roomW, 8, style.capColor || '#5a2d1b');
    px(ctx, 0, 7, roomW, 2, style.capTrim || '#8a4c2d');

    px(ctx, 32, 8, roomW - 64, 58, style.wallA);
    for (let x = 32; x < roomW - 32; x += 16) {
      px(ctx, x, 8, 8, 58, style.wallB);
    }
    if (style.subwayTile) {
      for (let ty = 12; ty < 64; ty += 12) {
        px(ctx, 32, ty, roomW - 64, 1, 'rgba(255,255,255,0.65)');
        const off = ((ty / 12) % 2) * 12;
        for (let tx = 32 + off; tx < roomW - 36; tx += 24) {
          px(ctx, tx, ty, 1, 12, 'rgba(255,255,255,0.65)');
        }
      }
    }
    if (style.dots) {
      for (let x = 44; x < roomW - 44; x += 28) {
        px(ctx, x, 24, 3, 3, style.dotColor);
        px(ctx, x + 14, 42, 3, 3, style.dotColor);
      }
    }
    px(ctx, 32, 18, roomW - 64, 2, style.trimColor);
    for (let x = 38; x < roomW - 38; x += 24) {
      px(ctx, x, 21, 2, 2, style.accentHeart);
    }

    px(ctx, 32, 64, roomW - 64, 3, style.wainscotTop);
    px(ctx, 32, 67, roomW - 64, 21, style.wainscotMain);
    for (let x = 36; x < roomW - 40; x += 24) {
      px(ctx, x, 70, 18, 15, style.wainscotInner);
      px(ctx, x + 2, 72, 14, 11, style.wainscotPanel);
    }
    px(ctx, 32, 88, roomW - 64, 8, style.baseboardColor || '#6b381e');
    px(ctx, 32, 95, roomW - 64, 3, 'rgba(38, 16, 10, 0.25)');

    if (style.checkerFloor) {
      for (let y = 96; y < roomH - 32; y += 24) {
        for (let x = 32; x < roomW - 32; x += 24) {
          const even = ((x / 24 + y / 24) | 0) % 2 === 0;
          px(ctx, x, y, 24, 24, even ? style.floorA : style.floorB);
          px(ctx, x, y + 23, 24, 1, 'rgba(175, 115, 92, 0.2)');
          px(ctx, x + 23, y, 1, 24, 'rgba(175, 115, 92, 0.2)');
        }
      }
    } else {
      let rowIdx = 0;
      for (let y = 96; y < roomH - 32; y += 16) {
        const col = style.planks[rowIdx % style.planks.length];
        px(ctx, 32, y, roomW - 64, 16, col);
        px(ctx, 32, y + 15, roomW - 64, 1, style.seam);
        px(ctx, 32, y + 1, roomW - 64, 1, 'rgba(255, 240, 208, 0.22)');
        const offset = (rowIdx % 3) * 28 + 20;
        for (let x = 32 + offset; x < roomW - 36; x += 72) {
          px(ctx, x, y, 1, 16, style.seam);
        }
        rowIdx++;
      }
    }

    px(ctx, 32, 96, roomW - 64, 5, 'rgba(42, 18, 8, 0.16)');
    px(ctx, 32, 96, 6, roomH - 128, 'rgba(42, 18, 8, 0.12)');
    px(ctx, roomW - 38, 96, 6, roomH - 128, 'rgba(42, 18, 8, 0.12)');

    const sideOuter = style.sideOuter || '#4e2715';
    const sideInner = style.sideInner || '#784023';
    px(ctx, 0, 0, 32, roomH, sideOuter);
    px(ctx, 26, 8, 6, roomH - 8, sideInner);
    px(ctx, roomW - 32, 0, 32, roomH, sideOuter);
    px(ctx, roomW - 32, 8, 6, roomH - 8, sideInner);
    px(ctx, 0, roomH - 32, roomW, 32, sideOuter);
    px(ctx, 32, roomH - 32, roomW - 64, 6, sideInner);
  }

  function drawWindowStatic(ctx, x, y, w, h, curtainColor = '#f69eb6') {
    px(ctx, x - 3, y - 3, w + 6, h + 6, '#633319');
    px(ctx, x, y, w, h, '#9a562e');
    px(ctx, x + 5, y + 4, w - 10, h - 10, '#1f3260');
    px(ctx, x - 2, y - 1, 13, h - 2, curtainColor);
    px(ctx, x + 1, y - 1, 7, h - 4, '#ffc8d7');
    px(ctx, x + w - 11, y - 1, 13, h - 2, curtainColor);
    px(ctx, x + w - 8, y - 1, 7, h - 4, '#ffc8d7');
    px(ctx, x, y + Math.floor(h * 0.52), 9, 4, '#ffd659');
    px(ctx, x + w - 9, y + Math.floor(h * 0.52), 9, 4, '#ffd659');
    px(ctx, x - 6, y + h - 2, w + 12, 6, '#b86e3d');
    px(ctx, x - 6, y + h + 3, w + 12, 2, '#5c2e14');
    px(ctx, x + 14, y + h - 8, 8, 6, '#e58e73');
    px(ctx, x + 15, y + h - 13, 6, 5, '#72c96b');
    px(ctx, x + w - 22, y + h - 8, 8, 6, '#f2b880');
    px(ctx, x + w - 21, y + h - 14, 6, 6, '#ff85a6');
  }

  function drawStaticDoorways(ctx, room) {
    const roomW = room.width || W;
    const roomH = room.height || H;
    for (const d of room.doors) {
      const b = d.hitBox;
      const cx = Math.round(b.x + b.w / 2);
      const cy = Math.round(b.y + b.h / 2);
      if (d.direction === 'north') {
        outlinedBox(ctx, cx - 36, 28, 72, 68, '#784023', '#452010');
        outlinedBox(ctx, cx - 30, 34, 60, 62, '#2d1c2e', '#452010');
        px(ctx, cx - 26, 38, 52, 56, '#4d3142');
        px(ctx, cx - 18, 44, 36, 48, '#ffdca8');
        drawMiniHeart(ctx, cx, 31, '#ff85a6');
        outlinedBox(ctx, cx - 30, 96, 60, 16, '#f6c5ce', '#8d4d2c');
        px(ctx, cx - 26, 99, 52, 10, '#fff4ea');
      } else if (d.direction === 'south') {
        const mw = Math.min(60, b.w);
        const mx = Math.round(cx - mw / 2);
        outlinedBox(ctx, mx, roomH - 50, mw, 18, '#f6c5ce', '#8d4d2c');
        px(ctx, mx + 4, roomH - 47, mw - 8, 12, '#fff4ea');
        drawMiniHeart(ctx, cx, roomH - 43, '#e86882');
        outlinedBox(ctx, mx - 4, roomH - 34, mw + 8, 34, '#8b4e27', '#361a0c');
        px(ctx, mx + 4, roomH - 30, mw - 8, 26, '#ffdca8');
      } else if (d.direction === 'west') {
        outlinedBox(ctx, 2, cy - 34, 32, 68, '#784023', '#3d1c0d');
        px(ctx, 8, cy - 28, 24, 56, '#ffdca8');
        outlinedBox(ctx, 32, cy - 26, 14, 52, '#f6c5ce', '#8d4d2c');
        px(ctx, 35, cy - 22, 8, 44, '#fff4ea');
      } else if (d.direction === 'east') {
        outlinedBox(ctx, roomW - 34, cy - 34, 32, 68, '#784023', '#3d1c0d');
        px(ctx, roomW - 32, cy - 28, 24, 56, '#ffdca8');
        outlinedBox(ctx, roomW - 46, cy - 26, 14, 52, '#f6c5ce', '#8d4d2c');
        px(ctx, roomW - 43, cy - 22, 8, 44, '#fff4ea');
      }
    }
  }

  function buildLivingStatic() {
    const room = MapRef.ROOMS.living;
    const lw = room.width;   // 640 (20x16)
    const lh = room.height;  // 512
    const c = document.createElement('canvas');
    c.width = lw; c.height = lh;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 1. Serene French Cream Architectural Shell
    drawWallsAndFloorShell(ctx, {
      capColor: '#a6907c', capTrim: '#d9c7b2',
      wallA: '#fbf6ee', wallB: '#f5ede0', dots: true, dotColor: '#f3dce0',
      trimColor: '#e4d5c3', accentHeart: '#f2a4b6',
      wainscotTop: '#e8dac6', wainscotMain: '#f2e7d8', wainscotInner: '#faf3e9', wainscotPanel: '#ebdecb',
      baseboardColor: '#cdb9a2',
      planks: ['#efe5d6', '#eae0d0', '#f3eadc', '#e5dac8'], seam: '#d6c8b6',
      sideOuter: '#8c7666', sideInner: '#b59f8e',
    }, lw, lh);

    // 2. Arched Sunny Balcony Bay w/ Oatmeal Left Drape & Sheer Tulle (cols 4..9 -> x: 132..314, y: 12..94)
    roundedBox(ctx, 132, 12, 182, 82, 18, '#fffaf2', '#9c8674');
    roundedBox(ctx, 140, 18, 166, 70, 14, '#e4f2fb', '#b8cad6');
    px(ctx, 198, 20, 3, 66, 'rgba(255,255,255,0.65)');
    px(ctx, 256, 20, 3, 66, 'rgba(255,255,255,0.65)');
    for (let dx = 140; dx < 174; dx += 6) {
      px(ctx, dx, 18, 4, 70, ((dx / 6) | 0) % 2 === 0 ? '#ebdecb' : '#dfceb6');
    }
    px(ctx, 140, 56, 34, 4, '#d1b594');
    for (let sx = 176; sx < 304; sx += 7) {
      ctx.fillStyle = ((sx / 7) | 0) % 2 === 0 ? 'rgba(255, 255, 255, 0.72)' : 'rgba(248, 250, 255, 0.48)';
      ctx.fillRect(sx, 19, 5, 69);
    }
    px(ctx, 130, 88, 186, 6, '#efe5d6');

    // 3. Upper-Right French Carved Cream Plaster Fireplace (cols 11..12 -> x: 354..410, y: 12..94)
    outlinedBox(ctx, 354, 12, 56, 82, '#fffaf2', '#8c7664');
    outlinedBox(ctx, 372, 16, 20, 16, '#fffdf9', '#9c8470');
    drawMiniHeart(ctx, 382, 23, '#f07894');
    outlinedBox(ctx, 350, 42, 64, 7, '#f7efe3', '#8c7664');
    px(ctx, 358, 34, 6, 8, '#ffffff'); px(ctx, 359, 31, 2, 3, '#ffd2de'); px(ctx, 362, 31, 2, 3, '#ffd2de');
    px(ctx, 373, 38, 18, 4, '#88b87a');
    px(ctx, 400, 34, 4, 8, '#fff7e0');
    px(ctx, 357, 49, 6, 9, '#ff9ebb'); px(ctx, 357, 49, 6, 3, '#ffffff');
    px(ctx, 401, 49, 6, 9, '#a6daf0'); px(ctx, 401, 49, 6, 3, '#ffffff');
    roundedBox(ctx, 363, 56, 38, 36, 6, '#362320', '#7a6354');
    px(ctx, 360, 89, 44, 5, '#dfd0be');
    px(ctx, 369, 80, 26, 7, '#7d4d2c');
    px(ctx, 373, 75, 18, 6, '#96613a');

    // 4. Minimalist Framed Botanical Print above Jukebox Nook (x: 426..464, y: 18..54)
    outlinedBox(ctx, 426, 18, 38, 36, '#fffcf7', '#b58d67');
    px(ctx, 432, 24, 26, 24, '#f7efe3');
    px(ctx, 444, 28, 2, 16, '#739c6c'); px(ctx, 440, 32, 4, 3, '#8fbf86'); px(ctx, 446, 35, 4, 3, '#8fbf86');

    // 5. Right Side Wall Aesthetic Photo Accents behind Sofa (x: 470..480)
    [176, 224].forEach((ay, idx) => {
      outlinedBox(ctx, 470, ay, 10, 32, '#fffaf2', '#b58d67');
      px(ctx, 472, ay + 4, 6, 24, idx === 0 ? '#f6e7ec' : '#eef5ea');
    });

    // Subtle pastel party bunting on upper right corner
    const flagCols = ['#ffd2e0', '#ffe9a8', '#d5c7f5', '#bde8d2', '#ffd8be'];
    for (let i = 0, fx = 414; fx < lw - 42; fx += 18, i++) {
      const col = flagCols[i % flagCols.length];
      px(ctx, fx, 10, 10, 3, col); px(ctx, fx + 2, 13, 6, 3, col);
    }

    // 6. Cozy Layered Area Rugs (strictly y >= 96)
    // Dusty-Pink Togo Chair Mat (x: 182..262, y: 122..166)
    outlinedBox(ctx, 182, 122, 80, 44, '#f5c7d2', '#b8768c');
    px(ctx, 188, 128, 68, 32, '#fff9fb');

    // Cozy Oatmeal Textured Boucle Lounge Rug uniting TV Wall <-> Large Coffee Table <-> Cloud Sofa!
    outlinedBox(ctx, 102, 158, 284, 132, '#d4c3ad', '#9c8671');
    px(ctx, 108, 164, 272, 120, '#e8dccb');
    px(ctx, 114, 170, 260, 108, '#f2e8da');
    for (let ry = 176; ry < 274; ry += 10) {
      for (let rx = 120; rx < 368; rx += 14) {
        if (((rx + ry) & 1) === 0) px(ctx, rx, ry, 3, 2, '#dfd0bc');
      }
    }

    // Foreground Cream-Blush Dining & Cake Table Mat (cols 3..7, rows 10..11 -> x: 84..268, y: 304..396)
    outlinedBox(ctx, 84, 304, 184, 92, '#f2d0d9', '#b87f8d');
    px(ctx, 92, 312, 168, 76, '#fffaf2');
    [[94, 314], [256, 314], [94, 382], [256, 382]].forEach(([hx, hy]) => drawMiniHeart(ctx, hx, hy, '#eb8da3'));
    for (let fy = 310; fy < 390; fy += 6) {
      px(ctx, 80, fy, 4, 3, '#fffaf2'); px(ctx, 268, fy, 4, 3, '#fffaf2');
    }

    // 团团's Mint-Cream Pet Play & Feeding Mat (x: 364..502, y: 334..424)
    outlinedBox(ctx, 364, 334, 138, 90, '#bfe3cb', '#689e7b');
    px(ctx, 372, 342, 122, 74, '#fff9ec');

    // Centered French South Entryway Heart Mat & Double Door (x = 320)
    outlinedBox(ctx, 290, 456, 60, 20, '#f6c5ce', '#b57b88');
    px(ctx, 294, 459, 52, 14, '#fff7f2');
    drawMiniHeart(ctx, 320, 464, '#e86882');
    outlinedBox(ctx, 286, 478, 68, 34, '#b89f8c', '#6e5648');
    px(ctx, 292, 482, 26, 24, '#f5ecdf'); px(ctx, 322, 482, 26, 24, '#f5ecdf');
    px(ctx, 340, 492, 5, 5, '#e8b84b');

    drawStaticDoorways(ctx, room);
    staticCanvases.living = c;
    return c;
  }

  function buildBedroomStatic() {
    const room = MapRef.ROOMS.bedroom;
    const bw = room.width;   // 576
    const bh = room.height;  // 448
    const c = document.createElement('canvas');
    c.width = bw; c.height = bh;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Warm cream-pink French bedroom shell (pale ash wood + cream blush walls)
    drawWallsAndFloorShell(ctx, {
      capColor: '#6f4e45', capTrim: '#9c786c',
      wallA: '#f5e4dc', wallB: '#ecd7ce', dots: false,
      trimColor: '#fff8f2', accentHeart: '#e5a4b4',
      wainscotTop: '#e7d0c4', wainscotMain: '#d4b6aa', wainscotInner: '#c19f92', wainscotPanel: '#ceb0a3',
      baseboardColor: '#b59082',
      sideOuter: '#614138', sideInner: '#8a6559',
      planks: ['#dfc8b5', '#d7bfac', '#e6d1be', '#d2b9a5'], seam: '#bea18b',
    }, bw, bh);

    // Musical note wall print above upright piano (cols 6..8 -> x: 222..256)
    outlinedBox(ctx, 222, 18, 34, 40, '#fffbf6', '#b89486');
    px(ctx, 226, 23, 26, 30, '#fdf0f4');
    px(ctx, 236, 28, 3, 14, '#c7748b');
    px(ctx, 236, 27, 10, 3, '#c7748b');
    px(ctx, 243, 28, 3, 12, '#c7748b');
    px(ctx, 232, 39, 6, 5, '#c7748b');
    px(ctx, 240, 38, 6, 5, '#c7748b');

    // 1. Top back wall behind headboard (cols 11..15 -> x: 352..512): 3 aesthetic framed prints
    // Frame 1: "Good Things Take Time" quote
    outlinedBox(ctx, 368, 14, 34, 42, '#fffbf6', '#b89486');
    px(ctx, 372, 19, 26, 32, '#f9f2eb');
    px(ctx, 377, 25, 16, 2, '#9c7c70');
    px(ctx, 379, 30, 12, 2, '#9c7c70');
    px(ctx, 378, 35, 14, 2, '#9c7c70');
    drawMiniHeart(ctx, 385, 42, '#df8fa2');

    // Frame 2: Pink cotton clouds
    outlinedBox(ctx, 410, 14, 38, 42, '#fffbf6', '#b89486');
    px(ctx, 414, 19, 30, 32, '#f9d4df');
    px(ctx, 417, 30, 24, 14, '#ffeaf0');
    px(ctx, 422, 25, 14, 10, '#fff5f8');
    px(ctx, 414, 41, 30, 10, '#e6a6b8');

    // Frame 3: Pink ribbon bow
    outlinedBox(ctx, 456, 14, 34, 42, '#fffbf6', '#b89486');
    px(ctx, 460, 19, 26, 32, '#fdf1f4');
    px(ctx, 465, 28, 7, 7, '#de93a6');
    px(ctx, 474, 28, 7, 7, '#de93a6');
    px(ctx, 471, 30, 4, 4, '#c7748b');
    px(ctx, 469, 34, 3, 9, '#de93a6');
    px(ctx, 474, 34, 3, 9, '#de93a6');

    // 2. Left wall photo collage grid + perspective accent above desk (left wall x: 10..28 & top-left wall)
    const wallPhotos = [
      [40, 14, 18, 22, '#f7e4e8'], [62, 18, 14, 18, '#efe2d8'],
      [80, 14, 20, 22, '#f6dce4'], [44, 40, 22, 18, '#f0e5de'],
      [70, 40, 16, 18, '#fae8ee'], [90, 38, 16, 20, '#eddcd4'],
    ];
    for (const [fx, fy, fw, fh, col] of wallPhotos) {
      outlinedBox(ctx, fx, fy, fw, fh, col, '#a98578');
      px(ctx, fx + 3, fy + 3, fw - 6, fh - 8, '#d9b5b2');
    }
    // Left wall slanted collage strip along col 0 (x: 8..28, y: 98..236)
    const leftCards = [
      [10, 106, '#f6dce4'], [12, 130, '#f3e7de'],
      [10, 178, '#fae6ed'], [12, 204, '#ede0d6'],
    ];
    for (const [lx, ly, lcol] of leftCards) {
      outlinedBox(ctx, lx, ly, 16, 18, '#fffaf5', '#8c695e');
      px(ctx, lx + 2, ly + 2, 12, 12, lcol);
    }

    // Glowing Pink Neon Heart on left wall (x: 10..27, y: 152)
    px(ctx, 11, 154, 6, 5, '#ff78a8');
    px(ctx, 19, 154, 6, 5, '#ff78a8');
    px(ctx, 11, 157, 14, 6, '#ff99be');
    px(ctx, 13, 162, 10, 4, '#ff78a8');
    px(ctx, 16, 166, 4, 3, '#ff5c96');
    px(ctx, 13, 156, 3, 2, '#fff5f9');
    px(ctx, 20, 156, 3, 2, '#fff5f9');

    // Left desk nook short partition stub between desk cabinet (row 7) and West doorway (rows 9..10)
    outlinedBox(ctx, 28, 256, 68, 12, '#d9c6bc', '#7b584d');
    px(ctx, 32, 259, 60, 6, '#f2e5dd');

    // 3. Top-right mini polaroids beside Marble Bay Window
    for (let i = 0; i < 4; i++) {
      const mx = 532 + (i % 2) * 20;
      const my = 18 + Math.floor(i / 2) * 24;
      outlinedBox(ctx, mx, my, 15, 19, '#fffcf8', '#ab8b80');
      px(ctx, mx + 2, my + 2, 11, 11, i % 2 === 0 ? '#f4ced8' : '#e6d8cc');
    }

    // 4. East Marble Bay Window & Sill Base (cols 17..18, rows 2..5 -> x: 550..620, y: 74..192)
    outlinedBox(ctx, 550, 76, 60, 118, '#f1eae3', '#b39589');
    px(ctx, 560, 98, 22, 1, '#dfd2c8');
    px(ctx, 566, 136, 28, 1, '#dfd2c8');
    px(ctx, 558, 168, 24, 1, '#dfd2c8');
    px(ctx, 600, 82, 16, 104, '#1b2b4a');
    px(ctx, 604, 92, 2, 2, '#fff2b0');
    px(ctx, 610, 124, 2, 2, '#fff2b0');
    for (let cy = 80; cy < 184; cy += 8) {
      px(ctx, 590, cy, 12, 7, '#fffaf5');
      px(ctx, 592, cy + 2, 5, 4, '#ede2d9');
    }
    for (let iv = 0; iv < 5; iv++) {
      px(ctx, 560 + (iv % 2) * 8, 78 + iv * 9, 7, 7, '#649a58');
      px(ctx, 568 + (iv % 2) * 6, 82 + iv * 9, 6, 6, '#84ba72');
    }
    outlinedBox(ctx, 570, 146, 24, 20, '#f3b7c6', '#a86b7e');
    px(ctx, 574, 150, 16, 12, '#fbd2dc');
    px(ctx, 554, 166, 6, 6, '#fff8f2'); px(ctx, 568, 166, 6, 6, '#fff8f2');
    outlinedBox(ctx, 555, 168, 18, 16, '#fffcf8', '#bba398');
    px(ctx, 559, 174, 2, 2, '#5c4038'); px(ctx, 567, 174, 2, 2, '#5c4038');
    px(ctx, 563, 177, 2, 2, '#e28ea2');
    outlinedBox(ctx, 557, 181, 14, 10, '#fff9f2', '#bba398');

    // 5. Braided floral mat under Twin Junimos (cols 17..18, rows 6..7 -> x: 552..604, y: 198..250)
    outlinedBox(ctx, 552, 198, 52, 52, '#f9e3c6', '#bd8b67');
    px(ctx, 558, 204, 40, 40, '#fff7ec');

    // 6. Central Irregular Organic Cream-Pink Plush Rug (x: 236..482, y: 174..346)
    ctx.save();
    ctx.fillStyle = '#cf9ea8';
    ctx.beginPath();
    ctx.ellipse(362, 260, 122, 82, -0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e5bbc3';
    ctx.beginPath();
    ctx.ellipse(360, 258, 118, 78, -0.14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f3e2d8';
    ctx.beginPath();
    ctx.ellipse(338, 250, 80, 58, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e5bbc3';
    ctx.beginPath();
    ctx.ellipse(408, 286, 58, 40, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Lucky's little pink ceramic milk saucer & felt fish toy near rug edge
    outlinedBox(ctx, 254, 294, 14, 9, '#ffb3c7', '#8c556a');
    px(ctx, 257, 296, 8, 4, '#fffdf9');
    px(ctx, 284, 306, 9, 5, '#8acae8');

    // 7. Bottom-Left Entrance Woven Rainbow-Arch Rug (cols 1..2, rows 11..12 -> x: 36..102, y: 364..404)
    outlinedBox(ctx, 36, 366, 66, 36, '#e9dad0', '#9e7d70');
    px(ctx, 40, 370, 58, 28, '#f5ebe2');
    // Rainbow tuft arches
    px(ctx, 48, 376, 42, 4, '#d9a4a8');
    px(ctx, 54, 382, 30, 4, '#e5c1b8');
    px(ctx, 60, 388, 18, 4, '#c7a495');
    // Tassels on left/right edges
    for (let ty = 370; ty < 400; ty += 5) {
      px(ctx, 34, ty, 3, 2, '#f9f3eb');
      px(ctx, 101, ty, 3, 2, '#f9f3eb');
    }

    drawStaticDoorways(ctx, room);
    // Inward-swinging room door leaf at bottom-left entrance
    outlinedBox(ctx, 42, 412, 48, 8, '#cbb5aa', '#6e4e44');
    px(ctx, 46, 414, 32, 4, '#eadad0');

    staticCanvases.bedroom = c;
    return c;
  }

  function buildDressingStatic() {
    const room = MapRef.ROOMS.dressing;
    const dw = room.width;   // 512 (16x12)
    const dh = room.height;  // 384
    const c = document.createElement('canvas');
    c.width = dw; c.height = dh;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    drawWallsAndFloorShell(ctx, {
      wallA: '#fcecf4', wallB: '#f7dfec', dots: true, dotColor: '#ffffff',
      trimColor: '#f6a8c1', accentHeart: '#d87098',
      wainscotTop: '#f3bad0', wainscotMain: '#c77294', wainscotInner: '#a8597a', wainscotPanel: '#b86487',
      planks: ['#e8cbb0', '#dfbf9e', '#edd4ba', '#d8b795'], seam: '#b4875e',
    }, dw, dh);

    // Center Back-Wall Hollywood Arch Vanity Mirror (x: 204..308, y: 14..90 — strictly on back wall)
    roundedBox(ctx, 206, 14, 100, 76, 12, '#f5c770', '#7a3f54');
    roundedBox(ctx, 214, 21, 84, 64, 9, '#d6eef9', '#b88346');
    // Glass diagonal reflections
    px(ctx, 224, 28, 12, 34, 'rgba(255,255,255,0.68)');
    px(ctx, 240, 34, 6, 22, 'rgba(255,255,255,0.45)');
    px(ctx, 272, 26, 10, 12, 'rgba(255,255,255,0.5)');
    // Pink satin bow crest on top of vanity mirror
    px(ctx, 244, 10, 24, 6, '#ff7399');
    px(ctx, 253, 9, 6, 8, '#ffd2e1');
    drawMiniHeart(ctx, 256, 13, '#ffffff');

    // Delicate rose-gold wall sconces flanking center vanity
    [172, 336].forEach((sx) => {
      outlinedBox(ctx, sx, 26, 8, 20, '#fff7fb', '#8c4e66');
      px(ctx, sx + 1, 20, 6, 8, '#ffe6a3');
      px(ctx, sx + 3, 46, 2, 8, '#d49a4c');
    });

    // Boutique Wall Bow Artwork flanking outer wardrobes
    outlinedBox(ctx, 170, 56, 20, 16, '#fff7fb', '#b86e8a');
    drawMiniHeart(ctx, 180, 63, '#ff7799');
    outlinedBox(ctx, 326, 56, 20, 16, '#fff7fb', '#b86e8a');
    drawMiniHeart(ctx, 336, 63, '#c58be0');

    // Floor: Vanity Pink Velvet Mat (under stool & center table)
    outlinedBox(ctx, 202, 126, 108, 42, '#f7bfd1', '#b56982');
    px(ctx, 208, 132, 96, 30, '#fff7fa');

    // Floor: Center Scalloped Boutique Runway Rug (x: 136..376, y: 170..308)
    outlinedBox(ctx, 136, 170, 240, 136, '#e5a4bf', '#9c5278');
    px(ctx, 144, 178, 224, 120, '#fff6fa');
    drawLaceTrim(ctx, 148, 180, 216, '#ffd2e2');
    drawLaceTrim(ctx, 148, 293, 216, '#ffd2e2');
    px(ctx, 158, 190, 196, 96, '#fce2ee');
    drawMiniHeart(ctx, 256, 236, '#e86882');

    // Floor: Bottom-Left Mirror Lavender Rug
    outlinedBox(ctx, 36, 276, 76, 70, '#d8bdf2', '#7c579e');
    px(ctx, 42, 282, 64, 58, '#fff8fd');

    // Floor: Bottom-Right Accessory Bench Peach Mat
    outlinedBox(ctx, 344, 284, 112, 64, '#f8cfb8', '#b06d54');
    px(ctx, 350, 290, 100, 52, '#fff9f2');

    drawStaticDoorways(ctx, room);
    staticCanvases.dressing = c;
    return c;
  }

  function buildBathroomStatic() {
    const room = MapRef.ROOMS.bathroom;
    const bw = room.width;   // 512 (16x12)
    const bh = room.height;  // 384
    const c = document.createElement('canvas');
    c.width = bw; c.height = bh;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 1. Exterior frame + Back Porcelain Wall (y: 8..92) + Clean Grey-White Stone Floor (y: 96..352)
    px(ctx, 0, 0, bw, 8, '#5a5b63');
    px(ctx, 0, 7, bw, 2, '#8b8d97');

    // Back warm light-grey marble tile wall (no vertical pink stripes!)
    px(ctx, 32, 8, bw - 64, 84, '#d7d8dc');
    for (let tx = 32; tx < bw - 32; tx += 48) {
      px(ctx, tx, 8, 1, 84, 'rgba(255,255,255,0.45)');
      // Subtle diagonal natural marble veining per slab
      px(ctx, tx + 10, 22, 16, 1, '#c3c5cb');
      px(ctx, tx + 22, 54, 18, 1, '#c3c5cb');
    }
    for (let ty = 36; ty < 90; ty += 28) {
      px(ctx, 32, ty, bw - 64, 1, 'rgba(255,255,255,0.45)');
    }
    // Clean white stone baseboard & wet wall separation strip
    px(ctx, 32, 90, bw - 64, 6, '#b7b9c2');
    px(ctx, 32, 94, bw - 64, 3, 'rgba(30, 32, 42, 0.16)');

    // Large 32x32 Grey Porcelain Floor Tiles: Dry zone (32..304) vs Non-slip Wet zone (304..480)
    for (let y = 96; y < bh - 32; y += 32) {
      for (let x = 32; x < bw - 32; x += 32) {
        const isWet = x >= 304;
        const alt = (((x / 32) | 0) + ((y / 32) | 0)) % 2 === 0;
        const fill = isWet ? (alt ? '#c6ccd2' : '#bfc6cc') : (alt ? '#d8d9de' : '#d0d2d7');
        px(ctx, x, y, 32, 32, fill);
        px(ctx, x, y + 31, 32, 1, 'rgba(130, 134, 144, 0.28)');
        px(ctx, x + 31, y, 1, 32, 'rgba(130, 134, 144, 0.28)');
      }
    }
    // White marble water-retaining curb separating dry zone & wet shower/tub zone
    outlinedBox(ctx, 300, 96, 8, bh - 128, '#f5f2f4', '#9e9ea6');
    px(ctx, 302, 98, 4, bh - 132, '#ffffff');

    // Outer room border walls (cool slate marble)
    px(ctx, 0, 0, 32, bh, '#54555e');
    px(ctx, 26, 8, 6, bh - 8, '#7e808a');
    px(ctx, bw - 32, 0, 32, bh, '#54555e');
    px(ctx, bw - 32, 8, 6, bh - 8, '#7e808a');
    px(ctx, 0, bh - 32, bw, 32, '#54555e');
    px(ctx, 32, bh - 32, bw - 64, 6, '#7e808a');

    // 2. Back Wall Left: Window w/ Pink Gingham Lace Curtain + Tulip + Lamb + My Melody Basket (x: 42..100, y: 12..86)
    outlinedBox(ctx, 42, 12, 58, 72, '#1d2430', '#484a54');
    // Frosted daylight lower pane
    px(ctx, 46, 56, 50, 20, '#c8dceb');
    px(ctx, 50, 58, 42, 14, '#dfeef7');
    // Pink & white gingham curtain + white lace trim
    for (let cy = 14; cy < 62; cy += 6) {
      for (let cx = 44; cx < 96; cx += 6) {
        const p = (((cx - 44) / 6 + (cy - 14) / 6) | 0) % 2 === 0;
        px(ctx, cx, cy, 6, 6, p ? '#f5b8c7' : '#fff8fa');
      }
    }
    drawLaceTrim(ctx, 44, 24, 52, '#ffffff');
    drawLaceTrim(ctx, 44, 59, 52, '#ffffff');
    // Marble window sill & cute plushies/basket
    outlinedBox(ctx, 40, 74, 62, 10, '#e9e7ea', '#8f8f99');
    // Tiny pink tulip cup
    outlinedBox(ctx, 44, 67, 8, 9, '#ffd6e2', '#a45a72');
    px(ctx, 46, 62, 3, 5, '#72b86a');
    px(ctx, 46, 60, 4, 4, '#ff7fa3');
    // White fluffy lamb figurine
    px(ctx, 56, 64, 12, 11, '#fffaf5');
    px(ctx, 58, 67, 2, 2, '#4a3b40'); px(ctx, 64, 67, 2, 2, '#4a3b40');
    // My Melody pink bow storage basket
    outlinedBox(ctx, 72, 63, 24, 13, '#ffb8cc', '#9c5a70');
    px(ctx, 79, 64, 10, 4, '#ff6f99');
    px(ctx, 81, 68, 6, 5, '#ffffff');

    // Hanging Pink Facial Tissue Pack between window and mirror (x: 105..120, y: 38..68)
    outlinedBox(ctx, 106, 40, 14, 24, '#ffb7cc', '#9e6276');
    px(ctx, 109, 44, 8, 12, '#fff5f8');
    px(ctx, 111, 64, 4, 5, '#ffffff'); // pull tissue tab

    // 3. Back Wall Center: Pink Bow Bear Card above Smart LED Mirror & Black Fluted Cabinet (x: 142..244)
    outlinedBox(ctx, 160, 8, 30, 17, '#ffb8cc', '#9c5a70');
    px(ctx, 169, 11, 12, 11, '#fff3bf'); // bear head
    px(ctx, 172, 12, 6, 3, '#ff6b96');   // pink bow

    // Black-framed Smart Mirror + Side Open Shelving + Black Reeded Glass Door (x: 144..242, y: 26..88)
    outlinedBox(ctx, 144, 26, 98, 62, '#2c2d34', '#16171c');
    // Mirror glass panel (left)
    px(ctx, 147, 29, 54, 56, '#dcebf2');
    px(ctx, 154, 34, 8, 32, 'rgba(255,255,255,0.68)');
    px(ctx, 166, 52, 10, 18, 'rgba(255,255,255,0.45)');
    // Cute tiny white tooth sticker on mirror
    px(ctx, 191, 75, 6, 5, '#ffffff');
    // Open cabinet compartments (middle) + Pastel reed diffuser / cups
    px(ctx, 203, 29, 18, 56, '#f6f2f4');
    px(ctx, 203, 47, 18, 2, '#d8d2d6');
    px(ctx, 203, 66, 18, 2, '#d8d2d6');
    px(ctx, 208, 35, 7, 11, '#ffb8cb'); // reed diffuser
    px(ctx, 211, 31, 1, 5, '#8c5a46');
    px(ctx, 207, 52, 8, 12, '#8ed3eb'); // blue bottle
    px(ctx, 208, 70, 7, 12, '#f9c2d3'); // Melody cup
    // Right Black-Framed Vertical Fluted Glass Door (x: 223..239)
    px(ctx, 223, 29, 16, 56, '#3b424c');
    for (let vx = 225; vx < 238; vx += 3) {
      px(ctx, vx, 31, 1, 52, 'rgba(255,255,255,0.34)');
    }

    // 4. Right Dry Wall Hooks: Pastel Bath Towel Rail, Headband, Kitty Holder & Pink Hairdryer (x: 250..290)
    outlinedBox(ctx, 250, 20, 38, 18, '#ffdbe6', '#a87082');
    px(ctx, 254, 24, 30, 8, '#fff7fa'); // folded towel above
    // Hello Kitty wall shelf & pink headband + pink hairdryer
    outlinedBox(ctx, 252, 46, 12, 12, '#ffbfd2', '#a87082');
    px(ctx, 267, 45, 11, 11, '#ffffff');
    px(ctx, 274, 46, 4, 3, '#ff5f8f');
    px(ctx, 281, 44, 7, 18, '#ffb0c7'); // pink hairdryer handle/nozzle
    px(ctx, 278, 44, 9, 7, '#ffd6e2');
    outlinedBox(ctx, 253, 62, 12, 22, '#ffaac4', '#9e5e74'); // hanging pink hand towel

    // 5. Wet Rain Shower Wall Fixtures (cols 10..14 -> x: 318..474, y: 12..90)
    // Chrome shower rail + wide square overhead rain head + handheld shower + control valve
    px(ctx, 390, 22, 4, 58, '#a6bcc8');
    px(ctx, 390, 20, 14, 3, '#c8dae3');
    outlinedBox(ctx, 374, 24, 36, 9, '#d8e6ee', '#6e8390');
    px(ctx, 378, 26, 28, 4, '#ffffff');
    // Thermostat mixer bar & temperature dial
    outlinedBox(ctx, 378, 66, 28, 8, '#dbe8ef', '#6e8390');
    px(ctx, 368, 50, 6, 16, '#c3d5de'); // handheld wand
    // Pink wall shampoo & bath caddy (right side of shower)
    outlinedBox(ctx, 434, 52, 36, 12, '#ffd6e2', '#9c6278');
    px(ctx, 438, 42, 7, 11, '#ff9fbc');
    px(ctx, 448, 40, 8, 13, '#ffffff');
    px(ctx, 459, 43, 7, 10, '#ffe066');

    // 6. Floor Details (Walkable): Hello Kitty Bath Mat (center) + Wet Shower Mat & Drain
    // Hello Kitty Mat centered under vanity (x: 150..236, y: 162..208)
    ctx.fillStyle = '#d4a6b5';
    ctx.beginPath(); ctx.ellipse(193, 186, 42, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff9f5';
    ctx.beginPath(); ctx.ellipse(193, 185, 38, 18, 0, 0, Math.PI * 2); ctx.fill();
    drawKittyFace(ctx, 193, 186, 14, '#ff6896');

    // Shower stainless floor drain + Non-slip striped mat
    outlinedBox(ctx, 384, 164, 16, 14, '#d7e3ea', '#7c8f99');
    px(ctx, 388, 168, 8, 6, '#9eb2bd');
    roundedBox(ctx, 426, 148, 42, 46, 6, '#ffd8e4', '#c996a8');
    px(ctx, 430, 152, 34, 38, '#fff5f8');
    for (let my = 156; my < 186; my += 9) px(ctx, 434, my, 26, 4, '#f5b8cb');

    drawStaticDoorways(ctx, room);
    staticCanvases.bathroom = c;
    return c;
  }

  function buildStudyStatic() {
    const room = MapRef.ROOMS.study;
    const sw = room.width;   // 576 (18 cols)
    const sh = room.height;  // 416 (13 rows)
    const c = document.createElement('canvas');
    c.width = sw; c.height = sh;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 1. Warm French Cream & Blush Striped Wallpaper + Cream Wainscoting (y: 0..96)
    for (let sx = 0; sx < sw; sx += 16) {
      px(ctx, sx, 0, 8, 96, '#fcf6ee');
      px(ctx, sx + 8, 0, 8, 96, '#f9efe6');
    }
    // Ceiling crown molding & subtle rose-gold trim
    px(ctx, 0, 0, sw, 8, '#f0e2d5');
    px(ctx, 0, 8, sw, 2, '#e6b8c4');
    // Lower wainscoting panels (y: 66..96)
    px(ctx, 0, 66, sw, 30, '#f4e8dc');
    px(ctx, 0, 66, sw, 3, '#d9c2b2');
    for (let wx = 36; wx < sw - 36; wx += 44) {
      outlinedBox(ctx, wx, 72, 34, 18, '#faf2e8', '#dfd0c2');
    }

    // 2. Warm Honey-Oak Herringbone/Plank Wood Floor (y: 96..sh-32)
    px(ctx, 32, 96, sw - 64, sh - 128, '#d9b18c');
    const planks = ['#dfb995', '#d9b18c', '#e3c09e', '#d3a982'];
    for (let fy = 96; fy < sh - 32; fy += 16) {
      const rowIdx = ((fy - 96) / 16) | 0;
      for (let fx = 32; fx < sw; fx += 48) {
        const off = (rowIdx % 2) * 24;
        const rx = Math.max(32, fx - off);
        const rw = Math.min(sw - 32, fx - off + 48) - rx;
        if (rw <= 0) continue;
        const pCol = planks[(rowIdx + ((fx / 48) | 0)) % planks.length];
        px(ctx, rx, fy, rw, 16, pCol);
        px(ctx, rx, fy + 15, rw, 1, '#c49870');
        if (fx - off + 47 >= 32 && fx - off + 47 < sw - 32) {
          px(ctx, fx - off + 47, fy, 1, 16, '#c49870');
        }
      }
    }

    // Outer architectural walls (left, right, bottom)
    px(ctx, 0, 0, 32, sh, '#efe4d8');
    px(ctx, 30, 0, 2, sh, '#cbb7a6');
    px(ctx, sw - 32, 0, 32, sh, '#efe4d8');
    px(ctx, sw - 32, 0, 2, sh, '#cbb7a6');
    px(ctx, 0, sh - 32, sw, 32, '#ebe0d3');
    px(ctx, 0, sh - 32, sw, 3, '#cbb7a6');

    // 3. Sunlit French Arched Window Above Writing Desk (x: 378..510, y: 8..78)
    roundedBox(ctx, 378, 10, 132, 66, 26, '#d9f1ff', '#b89a84');
    roundedBox(ctx, 384, 15, 120, 56, 22, '#cceaff', '#ffffff');
    // Soft clouds & warm autumn courtyard foliage outside
    px(ctx, 396, 26, 24, 8, '#ffffff');
    px(ctx, 456, 22, 28, 8, '#ffffff');
    px(ctx, 386, 56, 116, 14, '#c3e0b2');
    px(ctx, 400, 50, 18, 12, '#f2b880'); // Autumn maple tree peek
    px(ctx, 442, 15, 4, 56, '#fff8f0');  // Center window mullion
    px(ctx, 384, 42, 120, 3, '#fff8f0');
    // Sheer cream-blush curtains framing both sides of arch
    px(ctx, 378, 12, 18, 64, '#fff2f5');
    px(ctx, 394, 12, 3, 64, '#f2cbd6');
    px(ctx, 492, 12, 18, 64, '#fff2f5');
    px(ctx, 491, 12, 3, 64, '#f2cbd6');
    // Diagonal soft golden sunbeam pool on floor below desk
    ctx.fillStyle = 'rgba(255, 244, 204, 0.24)';
    ctx.beginPath();
    ctx.moveTo(396, 156);
    ctx.lineTo(506, 156);
    ctx.lineTo(476, 232);
    ctx.lineTo(366, 232);
    ctx.closePath();
    ctx.fill();

    // 4. Fairy-Lit Wooden Corkboard & Polaroid Memory Wall (x: 164..284, y: 14..84)
    outlinedBox(ctx, 164, 16, 120, 68, '#e3be96', '#94623d');
    px(ctx, 168, 20, 112, 60, '#d6a87c');
    // Warm golden fairy string light wire draped across board
    px(ctx, 170, 24, 108, 1, '#7a4a24');
    [176, 198, 220, 242, 264].forEach((lx) => px(ctx, lx, 23, 4, 4, '#fff2a8'));
    // 4 colorful Polaroid memory snapshots pinned with pink/gold pins
    [
      { x: 173, y: 28, sky: '#f28b50', ground: '#639e68' },
      { x: 200, y: 31, sky: '#6db5e3', ground: '#b07b54' },
      { x: 227, y: 27, sky: '#ff9ebb', ground: '#ffd27f' },
      { x: 254, y: 32, sky: '#8fd485', ground: '#e0b36b' },
    ].forEach((m) => {
      px(ctx, m.x, m.y, 21, 25, '#fffaf0');
      px(ctx, m.x + 2, m.y + 2, 17, 13, m.sky);
      px(ctx, m.x + 2, m.y + 11, 17, 6, m.ground);
      px(ctx, m.x + 9, m.y - 1, 3, 3, '#ff5d7d');
    });
    // Lower ribbon strip w/ tiny pastel sticky notes & hearts
    px(ctx, 174, 62, 100, 1, '#8c5a36');
    px(ctx, 184, 63, 12, 11, '#ff9ebb');
    px(ctx, 216, 63, 12, 11, '#ffe066');
    px(ctx, 248, 63, 12, 11, '#85d2e8');
    drawMiniHeart(ctx, 174, 71, '#ff5d7d');
    drawMiniHeart(ctx, 271, 71, '#ffd152');

    // 5. Pastel Stardew Seasonal Birthday Calendar (x: 294..348, y: 18..82)
    outlinedBox(ctx, 294, 18, 54, 64, '#fff8eb', '#94623d');
    px(ctx, 298, 22, 46, 14, '#f07892');
    px(ctx, 302, 26, 7, 6, '#ffe57f'); px(ctx, 314, 27, 24, 4, '#fff9f2');
    for (let gx = 0; gx < 7; gx++) {
      for (let gy = 0; gy < 4; gy++) {
        const isBday = gx === 5 && gy === 2;
        px(ctx, 300 + gx * 6, 40 + gy * 9.5, 4.5, 7, isBday ? '#ff5d7d' : '#f7e4c6');
      }
    }
    px(ctx, 316, 12, 10, 5, '#ff85a6'); px(ctx, 319, 14, 4, 4, '#ffd452');

    // 6. Lush Cream-Pink Scalloped Center Study Rug (x: 154..414, y: 176..298)
    roundedBox(ctx, 154, 176, 260, 122, 28, '#f7d8e2', '#c98ca0');
    roundedBox(ctx, 164, 186, 240, 102, 22, '#fff7fa', '#f0b8c9');
    // Subtle diamond weave motif in rug center
    for (let rx = 186; rx < 386; rx += 28) {
      for (let ry = 200; ry < 276; ry += 24) {
        px(ctx, rx, ry, 6, 6, '#f9dce6');
      }
    }
    // Cozy sage-cream checkered mat under reading nook (x: 38..196, y: 298..380)
    roundedBox(ctx, 38, 298, 158, 82, 10, '#dcebd8', '#9eb898');
    for (let cy = 304; cy < 374; cy += 14) {
      for (let cx = 44; cx < 190; cx += 14) {
        if (((cx + cy) / 14 | 0) % 2 === 0) px(ctx, cx, cy, 12, 12, '#faf7ee');
      }
    }

    drawStaticDoorways(ctx, MapRef.ROOMS.study);
    staticCanvases.study = c;
    return c;
  }

  function buildTeaStatic() {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    drawWallsAndFloorShell(ctx, {
      wallA: '#fff1e0', wallB: '#ffe2e8', dots: true, dotColor: '#ffb7cb',
      trimColor: '#ff9ebb', accentHeart: '#e85d7c',
      wainscotTop: '#f5b8c8', wainscotMain: '#cc7a90', wainscotInner: '#b06177', wainscotPanel: '#bd6d84',
      checkerFloor: true, floorA: '#fff4ea', floorB: '#fbe0e6',
    });

    drawWindowStatic(ctx, 260, 16, 110, 54, '#ff9ebb');
    drawWindowStatic(ctx, 424, 16, 94, 54, '#ff9ebb');

    for (let ax = 36; ax < W - 44; ax += 18) {
      px(ctx, ax, 8, 18, 10, ((ax / 18) | 0) % 2 === 0 ? '#ff85a6' : '#fff8f2');
      px(ctx, ax + 2, 18, 14, 4, ((ax / 18) | 0) % 2 === 0 ? '#ff85a6' : '#fff8f2');
    }

    outlinedBox(ctx, 138, 292, 210, 136, '#bce3c5', '#5d946e');
    px(ctx, 146, 300, 194, 120, '#fff9ee');
    drawLaceTrim(ctx, 150, 304, 186, '#ffb7cb');

    outlinedBox(ctx, 492, 98, 182, 110, '#f7c5d8', '#b56e8a');
    px(ctx, 502, 108, 162, 90, '#fff7fa');

    outlinedBox(ctx, 522, 294, 174, 138, '#ffe085', '#c4833d');
    px(ctx, 530, 302, 158, 122, '#fff8e0');
    drawMiniHeart(ctx, 542, 314, '#e86882'); drawMiniHeart(ctx, 676, 314, '#e86882');

    drawStaticDoorways(ctx, MapRef.ROOMS.tea);
    staticCanvases.tea = c;
    return c;
  }

  function buildKitchenStatic() {
    const room = MapRef.ROOMS.kitchen;
    const kw = room.width;   // 448 (14 cols)
    const kh = room.height;  // 384 (12 rows)
    const c = document.createElement('canvas');
    c.width = kw; c.height = kh;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 1. Glossy Warm Ivory Ceramic Wall Tiles (y: 0..96) & Soft Warm-Grey Kitchen Floor Tiles (y: 96..384)
    px(ctx, 0, 0, kw, 96, '#faf6f2');
    for (let ty = 12; ty < 96; ty += 16) {
      px(ctx, 0, ty, kw, 1, '#ece3dc');
    }
    for (let tx = 0; tx < kw; tx += 32) {
      px(ctx, tx, 12, 1, 84, '#ece3dc');
    }
    // Subtle top molding & ceiling warm LED strip
    px(ctx, 0, 0, kw, 10, '#f3e7de');
    px(ctx, 0, 10, kw, 2, '#f4a9bf');

    // Clean modern ceramic kitchen floor tiles (light warm grey-beige like the photo)
    for (let fy = 96; fy < kh - 26; fy += 32) {
      for (let fx = 0; fx < kw; fx += 32) {
        const alt = (((fx / 32) | 0) + ((fy / 32) | 0)) % 2 === 0;
        px(ctx, fx, fy, 32, 32, alt ? '#f2ece6' : '#ebe4dd');
        px(ctx, fx, fy, 32, 1, '#e0d8d0');
        px(ctx, fx, fy, 1, 32, '#e0d8d0');
      }
    }

    // Outer architectural walls (left, right, bottom)
    px(ctx, 0, 0, 32, kh, '#ede3da');
    px(ctx, 30, 0, 2, kh, '#c7b5a8');
    px(ctx, kw - 32, 0, 32, kh, '#ede3da');
    px(ctx, kw - 32, 0, 2, kh, '#c7b5a8');
    px(ctx, 0, kh - 32, kw, 32, '#e8ddd3');
    px(ctx, 0, kh - 32, kw, 3, '#c7b5a8');

    // 2. Left Sunlit Kitchen Window w/ Pink Polka-Dot Roller Blind (x: 36..102, y: 8..74)
    outlinedBox(ctx, 36, 10, 64, 62, '#d9f0ff', '#a8968a');
    px(ctx, 38, 12, 60, 58, '#cbeaff');
    px(ctx, 46, 56, 44, 14, '#b8e0b0'); // Distant courtyard greenery
    px(ctx, 66, 12, 3, 58, '#ffffff');  // Window mullion
    // Pink Polka-Dot Roller Blind pulled halfway down (directly from reference photo!)
    px(ctx, 37, 11, 62, 36, '#f7b2c8');
    px(ctx, 37, 45, 62, 3, '#ff8eb3');
    for (let dy = 16; dy <= 38; dy += 10) {
      for (let dx = 42; dx <= 90; dx += 12) {
        px(ctx, dx + (dy % 20 === 6 ? 4 : 0), dy, 5, 5, '#fff5f8');
      }
    }
    // Cute Hello Kitty face decal peeking at lower window corner
    px(ctx, 42, 56, 14, 10, '#ffffff');
    px(ctx, 44, 54, 3, 3, '#ffffff'); px(ctx, 51, 54, 3, 3, '#ffffff');
    px(ctx, 50, 55, 5, 3, '#ff4d6d');

    // 3. Left Backsplash Wall Hooks: White Polka Potholder + Hello Kitty Hook + Pink My Melody Cutting Board (x: 104..156)
    // Mini potholder
    px(ctx, 108, 18, 4, 4, '#ff8eb3');
    outlinedBox(ctx, 105, 22, 11, 14, '#fff7fa', '#cfa0b0');
    px(ctx, 108, 25, 2, 2, '#ff7aa2'); px(ctx, 111, 30, 2, 2, '#ff7aa2');
    // Hello Kitty soap/sponge wall caddy
    outlinedBox(ctx, 104, 44, 16, 12, '#ffffff', '#bfa3ad');
    px(ctx, 114, 43, 5, 3, '#ff4d6d');
    px(ctx, 108, 49, 2, 2, '#3d2a30'); px(ctx, 114, 49, 2, 2, '#3d2a30'); px(ctx, 111, 51, 2, 2, '#ffcf56');
    // Hanging Pink My Melody Cutting Board (x: 124..154, y: 26..76)
    px(ctx, 137, 22, 4, 5, '#ffb7cb');
    outlinedBox(ctx, 124, 28, 30, 44, '#ffa3c0', '#b85c78');
    px(ctx, 127, 31, 24, 38, '#ffd4e3');
    // Melody rabbit hood inside cutting board
    px(ctx, 131, 34, 6, 12, '#ff8eb3'); px(ctx, 141, 34, 6, 12, '#ff8eb3');
    px(ctx, 130, 44, 18, 14, '#fff8fa');
    px(ctx, 134, 49, 2, 2, '#3d2a30'); px(ctx, 142, 49, 2, 2, '#3d2a30');
    px(ctx, 132, 58, 14, 5, '#c89be8'); // Cute bow

    // 4. Matte-Black Modern Range Hood Overhead (x: 170..312, y: 4..30) + Tiny Melody Figurine on Top
    outlinedBox(ctx, 174, 6, 134, 22, '#2d2b30', '#18161a');
    px(ctx, 178, 9, 126, 14, '#3e3b42');
    // Angled dark vent grille lines
    for (let gx = 186; gx < 296; gx += 8) {
      px(ctx, gx, 12, 4, 9, '#222026');
    }
    // Pink touch-panel icons + warm LED strip underneath
    px(ctx, 228, 8, 6, 2, '#ff9ebb'); px(ctx, 240, 8, 6, 2, '#ffe066'); px(ctx, 252, 8, 6, 2, '#ff9ebb');
    px(ctx, 178, 26, 126, 3, '#fff4cc');
    // Tiny pink Melody figurine perched on top of range hood!
    px(ctx, 184, 1, 8, 6, '#ff8eb3'); px(ctx, 186, 3, 4, 3, '#fff8fa');

    // 5. Hello Kitty Chef Wall Decals + Wooden 2-Tier Spice Rack + Pink "MY MELODY" Utensil Rail (x: 162..314, y: 32..88)
    // Left Hello Kitty wall decal (red bow + yellow overalls)
    px(ctx, 166, 36, 18, 14, '#ffffff');
    px(ctx, 166, 33, 5, 4, '#ffffff'); px(ctx, 179, 33, 5, 4, '#ffffff');
    px(ctx, 177, 34, 6, 4, '#e63946'); // Red bow
    px(ctx, 170, 42, 2, 2, '#2d2428'); px(ctx, 178, 42, 2, 2, '#2d2428'); px(ctx, 174, 44, 2, 2, '#ffd24d');
    px(ctx, 168, 50, 14, 10, '#ffcf56'); px(ctx, 170, 52, 10, 6, '#e63946');
    // Wooden 2-tier spice rack w/ pink-cap oil & soy sauce bottles (x: 192..226, y: 48..88)
    outlinedBox(ctx, 194, 52, 32, 34, '#f5d2b3', '#b8845c');
    px(ctx, 196, 68, 28, 3, '#d9a06e');
    // 3 cute pink-cap seasoning bottles
    [198, 207, 216].forEach((bx, idx) => {
      px(ctx, bx, 56, 6, 12, idx === 0 ? '#5c3a2a' : idx === 1 ? '#e8b04b' : '#f2d06b');
      px(ctx, bx + 1, 52, 4, 4, '#ff8eb3');
      px(ctx, bx + 1, 60, 4, 4, '#fff8fa');
    });
    // Pink "MY MELODY" Hanging Utensil Bar (x: 232..282, y: 36..78)
    outlinedBox(ctx, 232, 36, 50, 9, '#ffa3c0', '#c46c88');
    px(ctx, 236, 39, 42, 3, '#ffd9e6');
    // 5 hanging pastel pink kitchen tools (peeler, whisk, pasta spoon, slotted spoon, spatula)
    [237, 246, 255, 264, 273].forEach((ux, i) => {
      px(ctx, ux, 45, 3, 18, '#ff8eb3');
      if (i === 0) px(ctx, ux - 1, 63, 5, 7, '#ffd6e2');
      else if (i === 1) px(ctx, ux - 2, 62, 7, 10, '#ffb7cb');
      else if (i === 2) px(ctx, ux - 2, 63, 7, 9, '#ff8eb3');
      else if (i === 3) { px(ctx, ux - 2, 62, 7, 10, '#ff9ebb'); px(ctx, ux, 65, 3, 4, '#fff5f8'); }
      else px(ctx, ux - 2, 62, 7, 11, '#ff7aa2');
    });
    // Right Hello Kitty Chef decal & Pink Gingham Oven Mitt (x: 286..314, y: 36..86)
    outlinedBox(ctx, 294, 34, 16, 18, '#ff9ebb', '#b85c78'); // Oven mitt
    px(ctx, 296, 36, 12, 6, '#fff5f8');
    px(ctx, 288, 56, 14, 10, '#ffffff'); // Chef Kitty head
    px(ctx, 290, 50, 10, 6, '#ffffff');  // Chef hat
    px(ctx, 291, 61, 2, 2, '#2d2428'); px(ctx, 297, 61, 2, 2, '#2d2428');
    px(ctx, 290, 66, 10, 12, '#ffa3c0'); // Pink apron

    // 6. Signature Pink-and-White Striped My Melody Plush Kitchen Floor Mat (x: 120..294, y: 168..224)
    outlinedBox(ctx, 120, 168, 174, 56, '#ff9ebb', '#c96b88');
    for (let my = 172; my < 220; my += 8) {
      px(ctx, 123, my, 168, 4, '#fff9fb');
    }
    // Cute My Melody bunny face medallion on the floor mat!
    outlinedBox(ctx, 212, 176, 48, 38, '#ff8eb3', '#d46a8c');
    px(ctx, 218, 174, 10, 14, '#ff8eb3'); px(ctx, 244, 174, 10, 14, '#ff8eb3');
    px(ctx, 220, 184, 32, 22, '#fff9fb');
    px(ctx, 228, 193, 3, 3, '#3d2a30'); px(ctx, 241, 193, 3, 3, '#3d2a30');
    px(ctx, 234, 197, 4, 2, '#ffd24d');
    px(ctx, 222, 197, 5, 3, '#ffc2d4'); px(ctx, 245, 197, 5, 3, '#ffc2d4');
    // Tiny strawberry motifs on mat left edge
    drawMiniHeart(ctx, 146, 192, '#ff4d79');
    drawMiniHeart(ctx, 176, 200, '#ff7aa2');

    // 7. West Doorway back to Living Room
    drawStaticDoorways(ctx, MapRef.ROOMS.kitchen);
    staticCanvases.kitchen = c;
    return c;
  }

  function getStaticCanvas(roomId) {
    const resolved = roomId === 'tea' ? 'kitchen' : roomId;
    if (!staticCanvases[resolved]) {
      if (resolved === 'bedroom') buildBedroomStatic();
      else if (resolved === 'dressing') buildDressingStatic();
      else if (resolved === 'bathroom') buildBathroomStatic();
      else if (resolved === 'study') buildStudyStatic();
      else if (resolved === 'kitchen') buildKitchenStatic();
      else buildLivingStatic();
    }
    return staticCanvases[resolved];
  }

  function drawAmbientLighting(ctx, room, time, state) {
    const roomW = room.width || W;
    const roomH = room.height || H;
    const winMap = {
      living: [],
      bedroom: [],
      dressing: [],
      bathroom: [],
      study: [],
      kitchen: [],
    };
    const winPositions = winMap[room.id] || [];

    winPositions.forEach(([wx, wy, ww, wh], idx) => {
      if (idx === 0) px(ctx, wx + ww - 20, wy + 5, 8, 8, '#fff2b0');
      for (let s = 0; s < 4; s++) {
        const sx = wx + 12 + ((s * 19 + idx * 7) % (ww - 24));
        const sy = wy + 6 + ((s * 13) % (wh - 14));
        const b = 0.45 + 0.55 * Math.sin(time * 2.5 + s + idx);
        ctx.fillStyle = `rgba(255, 248, 200, ${b.toFixed(2)})`;
        ctx.fillRect(sx, sy, 2, 2);
      }
      px(ctx, wx + Math.floor(ww / 2) - 2, wy, 4, wh, '#9a562e');
      px(ctx, wx, wy + Math.floor(wh / 2) - 2, ww, 4, '#9a562e');

      ctx.save();
      ctx.fillStyle = 'rgba(255, 242, 195, 0.08)';
      ctx.beginPath();
      ctx.moveTo(wx + 8, wy + wh + 6);
      ctx.lineTo(wx + ww - 8, wy + wh + 6);
      ctx.lineTo(wx + ww + 16, wy + wh + 96);
      ctx.lineTo(wx - 4, wy + wh + 96);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    if (room.id !== 'bedroom' && room.id !== 'bathroom' && room.id !== 'dressing' && room.id !== 'living') {
      for (let i = 0, lx = 48; lx < roomW - 48; lx += 30, i++) {
        const on = Math.sin(time * 3.1 + i * 1.1) > -0.2;
        if (on) {
          ctx.fillStyle = 'rgba(255, 224, 130, 0.25)';
          ctx.fillRect(lx - 3, 6, 8, 8);
          px(ctx, lx, 9, 2, 2, '#fff5b8');
        }
      }
    }

    if (room.id === 'living') {
      // 1. Arched balcony sunlit daylight floor beam (x: 174..306)
      ctx.save();
      ctx.fillStyle = 'rgba(255, 248, 225, 0.24)';
      ctx.beginPath();
      ctx.moveTo(174, 88);
      ctx.lineTo(306, 88);
      ctx.lineTo(334, 188);
      ctx.lineTo(146, 188);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. French cream fireplace flames & warm glow (x = 382, y = 74)
      const f1 = Math.round(Math.sin(time * 9) * 2);
      const f2 = Math.round(Math.cos(time * 12) * 2);
      px(ctx, 372, 68 + f1, 20, 10, '#ff7738');
      px(ctx, 375, 63 + f2, 14, 12, '#ffa940');
      px(ctx, 378, 67 + f1, 8, 8, '#ffe97d');
      const fg = ctx.createRadialGradient(382, 78, 4, 382, 96, 62);
      fg.addColorStop(0, `rgba(255, 185, 110, ${(0.2 + 0.04 * Math.sin(time * 7)).toFixed(2)})`);
      fg.addColorStop(1, 'rgba(255, 160, 75, 0)');
      ctx.fillStyle = fg;
      ctx.fillRect(320, 34, 124, 130);

      // 3. Toggleable French cream warm cove strip + pleated floor lamp + left TV backlight + soft dining pendant pools
      const lampsOn = !state || state.livingLampsOn !== false;
      if (lampsOn) {
        const cg = ctx.createLinearGradient(0, 8, 0, 26);
        cg.addColorStop(0, 'rgba(255, 224, 162, 0.34)');
        cg.addColorStop(1, 'rgba(255, 224, 162, 0)');
        ctx.fillStyle = cg;
        ctx.fillRect(34, 8, roomW - 68, 20);

        // Tall pleated floor lamp radial glow (x = 304, y = 72)
        const flg = ctx.createRadialGradient(304, 72, 4, 304, 92, 62);
        flg.addColorStop(0, 'rgba(255, 228, 165, 0.28)');
        flg.addColorStop(1, 'rgba(255, 210, 135, 0)');
        ctx.fillStyle = flg;
        ctx.fillRect(240, 10, 128, 146);

        // Left-wall TV & floating console warm LED aura (x: 32..96, y: 162..288)
        const tvled = ctx.createRadialGradient(54, 224, 8, 72, 224, 72);
        tvled.addColorStop(0, 'rgba(255, 218, 152, 0.28)');
        tvled.addColorStop(1, 'rgba(255, 218, 152, 0)');
        ctx.fillStyle = tvled;
        ctx.fillRect(32, 152, 110, 144);

        // 3 soft warm pendant light pools illuminating Dining & Birthday Cake Tabletop (center x = 176)
        [136, 176, 216].forEach((pxX) => {
          const pg = ctx.createRadialGradient(pxX, 342, 4, pxX, 344, 42);
          pg.addColorStop(0, 'rgba(255, 232, 178, 0.22)');
          pg.addColorStop(1, 'rgba(255, 220, 150, 0)');
          ctx.fillStyle = pg;
          ctx.fillRect(pxX - 42, 300, 84, 84);
        });
      }
    } else if (room.id === 'bedroom') {
      // Soft evening rose-amber ambiance matching 布局2!
      // 1. Pink neon heart glow on left wall
      const neonPulse = 0.22 + 0.06 * Math.sin(time * 3.2);
      const ng = ctx.createRadialGradient(22, 160, 4, 34, 160, 62);
      ng.addColorStop(0, `rgba(255, 125, 172, ${neonPulse.toFixed(2)})`);
      ng.addColorStop(1, 'rgba(255, 125, 172, 0)');
      ctx.fillStyle = ng;
      ctx.fillRect(0, 96, 110, 128);

      // 2. Transparent RGB PC tower & sunset monitor screen glow
      const pcg = ctx.createRadialGradient(62, 148, 4, 66, 152, 64);
      pcg.addColorStop(0, 'rgba(255, 166, 205, 0.16)');
      pcg.addColorStop(1, 'rgba(255, 166, 205, 0)');
      ctx.fillStyle = pcg;
      ctx.fillRect(24, 80, 118, 140);

      // 3. Upper shelf trailing fairy lights + glowing cubby nightlight
      for (let i = 0; i < 4; i++) {
        const twinkle = 0.35 + 0.55 * Math.sin(time * 4.2 + i * 1.4);
        ctx.fillStyle = `rgba(255, 232, 160, ${twinkle.toFixed(2)})`;
        ctx.fillRect(138 + i * 7, 84 + (i % 2) * 5, 3, 3);
      }

      // Warm upright piano sheet-music glow
      const plg = ctx.createRadialGradient(240, 82, 4, 240, 96, 54);
      plg.addColorStop(0, 'rgba(255, 214, 170, 0.19)');
      plg.addColorStop(1, 'rgba(255, 200, 140, 0)');
      ctx.fillStyle = plg;
      ctx.fillRect(184, 32, 112, 120);

      // 4. Nightstand round orb lamp warm glow (toggleable!)
      const lampOn = !state || state.bedroomLampOn !== false;
      if (lampOn) {
        const lg = ctx.createRadialGradient(336, 92, 6, 336, 112, 108);
        lg.addColorStop(0, 'rgba(255, 224, 162, 0.28)');
        lg.addColorStop(0.55, 'rgba(255, 198, 138, 0.11)');
        lg.addColorStop(1, 'rgba(255, 180, 120, 0)');
        ctx.fillStyle = lg;
        ctx.fillRect(224, 10, 224, 210);
      }

      // 5. East bay window moonlight glow
      ctx.save();
      ctx.fillStyle = 'rgba(242, 234, 255, 0.06)';
      ctx.beginPath();
      ctx.moveTo(604, 84);
      ctx.lineTo(604, 186);
      ctx.lineTo(512, 198);
      ctx.lineTo(512, 96);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 6. Candle glow at bottom round table
      const cg = ctx.createRadialGradient(208, 384, 2, 208, 384, 34);
      cg.addColorStop(0, `rgba(255, 210, 120, ${(0.24 + 0.06 * Math.sin(time * 10)).toFixed(2)})`);
      cg.addColorStop(1, 'rgba(255, 190, 90, 0)');
      ctx.fillStyle = cg;
      ctx.fillRect(172, 350, 72, 72);
    } else if (room.id === 'bathroom') {
      // Soft window daylight glow
      ctx.save();
      ctx.fillStyle = 'rgba(232, 246, 255, 0.09)';
      ctx.beginPath();
      ctx.moveTo(42, 76);
      ctx.lineTo(100, 76);
      ctx.lineTo(108, 128);
      ctx.lineTo(36, 128);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Smart LED mirror backlit rim & warm face lighting
      const ledOn = !state || state.bathroomMirrorLed !== false;
      if (ledOn) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 253, 245, 0.96)';
        ctx.lineWidth = 2;
        ctx.strokeRect(150, 32, 48, 50);
        const mg = ctx.createRadialGradient(174, 60, 8, 174, 88, 86);
        mg.addColorStop(0, 'rgba(255, 246, 232, 0.22)');
        mg.addColorStop(1, 'rgba(255, 235, 220, 0)');
        ctx.fillStyle = mg;
        ctx.fillRect(102, 16, 150, 148);
        ctx.restore();
      }

      // Bathtub wooden caddy scented candle flicker
      const bcg = ctx.createRadialGradient(432, 286, 2, 432, 286, 36);
      bcg.addColorStop(0, `rgba(255, 204, 142, ${(0.22 + 0.05 * Math.sin(time * 9)).toFixed(2)})`);
      bcg.addColorStop(1, 'rgba(255, 180, 120, 0)');
      ctx.fillStyle = bcg;
      ctx.fillRect(394, 248, 76, 76);
    } else if (room.id === 'dressing') {
      // Warm boutique spotlight halos over Left Wardrobe, Center Hollywood Vanity & Right Wardrobe
      [96, 256, 416].forEach((cx, idx) => {
        const g = ctx.createRadialGradient(cx, 88, 6, cx, 108, 84);
        const pulse = idx === 1 ? 0.24 + 0.04 * Math.sin(time * 3.5) : 0.16;
        g.addColorStop(0, `rgba(255, 232, 186, ${pulse.toFixed(2)})`);
        g.addColorStop(1, 'rgba(255, 210, 175, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(cx - 86, 20, 172, 168);
      });
      // Twinkling Hollywood mirror bulbs around center vanity mirror (x: 208..304, y: 18..86)
      const bulbs = [
        [209, 24], [209, 44], [209, 64], [209, 82],
        [299, 24], [299, 44], [299, 64], [299, 82],
        [226, 17], [282, 17],
      ];
      bulbs.forEach(([bx, by], idx) => {
        const on = Math.sin(time * 4 + idx * 0.7) > -0.3;
        px(ctx, bx, by, 4, 4, on ? '#fff7bd' : '#ffd257');
      });
    } else if (room.id === 'study') {
      const pulse = 0.65 + 0.35 * Math.sin(time * 4);
      ctx.strokeStyle = `rgba(235, 72, 92, ${pulse.toFixed(2)})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(419, 59, 8, 10);
    }

    // Cozy Starry Night Mode Overlay (toggleable from HUD / Birthday Menu)
    if (state && state.nightMode) {
      // Starry night window skies in windowed rooms
      const nightWindows = {
        living: [{ x: 144, y: 20, w: 158, h: 66 }],
        study: [{ x: 398, y: 18, w: 92, h: 50 }],
        kitchen: [{ x: 40, y: 48, w: 56, h: 20 }],
      }[room.id] || [];

      nightWindows.forEach((nw) => {
        ctx.save();
        ctx.fillStyle = 'rgba(24, 30, 68, 0.72)';
        ctx.fillRect(nw.x, nw.y, nw.w, nw.h);
        // Crescent moon
        if (nw.h >= 40) {
          ctx.fillStyle = '#fff2a6';
          ctx.beginPath();
          ctx.arc(nw.x + nw.w - 22, nw.y + 18, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1b224f';
          ctx.beginPath();
          ctx.arc(nw.x + nw.w - 19, nw.y + 16, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        // Twinkling pixel stars
        for (let si = 0; si < 7; si++) {
          const sx = nw.x + 8 + ((si * 23) % Math.max(12, nw.w - 16));
          const sy = nw.y + 6 + ((si * 13) % Math.max(8, nw.h - 12));
          if (Math.sin(time * 3.5 + si * 1.3) > -0.2) {
            px(ctx, sx, sy, 2, 2, si % 2 === 0 ? '#fff7bd' : '#ffd2e6');
          }
        }
        ctx.restore();
      });

      // Gentle indigo-violet evening ambiance across the room
      ctx.fillStyle = 'rgba(18, 14, 46, 0.24)';
      ctx.fillRect(0, 0, roomW, roomH);

      // Warm golden sanctuary glow pools in the center & key cozy spots
      const glowSpots = {
        living: [[176, 308, 70], [304, 88, 65], [382, 86, 65]],
        bedroom: [[336, 114, 72], [432, 160, 64], [56, 150, 56]],
        dressing: [[256, 86, 78], [72, 290, 58]],
        bathroom: [[192, 92, 72], [386, 286, 60]],
        study: [[378, 96, 68], [62, 300, 68], [224, 50, 60]],
        kitchen: [[240, 88, 72], [378, 224, 52]],
      }[room.id] || [[roomW / 2, roomH / 2, 90]];

      glowSpots.forEach(([gx, gy, gr]) => {
        const rg = ctx.createRadialGradient(gx, gy, 4, gx, gy, gr);
        rg.addColorStop(0, 'rgba(255, 224, 156, 0.26)');
        rg.addColorStop(1, 'rgba(255, 200, 120, 0)');
        ctx.fillStyle = rg;
        ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
      });
    }
  }

  function drawBalloonBasket(ctx, bx, by, time, phase) {
    outlinedBox(ctx, bx, by + 18, 24, 18, '#b8683c', '#5c2f22');
    px(ctx, bx - 2, by + 16, 28, 5, '#d98452');
    px(ctx, bx, by + 3, 24, 14, '#569c54');
    px(ctx, bx + 3, by - 1, 7, 7, '#ff85a6');
    px(ctx, bx + 14, by, 7, 7, '#ffe066');
    px(ctx, bx + 9, by - 6, 7, 7, '#c59bf0');

    const balloons = [
      { dx: 3, dy: -32, col: '#ff85a6', hi: '#ffc7d6' },
      { dx: 12, dy: -42, col: '#ffe066', hi: '#fff4b3' },
      { dx: 21, dy: -29, col: '#c59bf0', hi: '#e3ccff' },
    ];
    for (let i = 0; i < balloons.length; i++) {
      const b = balloons[i];
      const sway = Math.round(Math.sin(time * 2.2 + i * 1.4 + phase) * 2.2);
      const bob = Math.round(Math.cos(time * 2.6 + i + phase) * 2);
      const cx = bx + b.dx + sway;
      const cy = by + b.dy + bob;
      ctx.strokeStyle = 'rgba(255, 245, 220, 0.78)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 12, by + 6);
      ctx.lineTo(cx, cy + 8);
      ctx.stroke();
      px(ctx, cx - 6, cy - 7, 12, 14, b.col);
      px(ctx, cx - 4, cy - 9, 8, 17, b.col);
      px(ctx, cx - 3, cy - 6, 3, 4, b.hi);
      px(ctx, cx - 1, cy + 8, 2, 2, b.col);
    }
  }

  function drawFloorLamp(ctx, x, y) {
    const g = ctx.createRadialGradient(x + 10, y + 14, 4, x + 10, y + 32, 42);
    g.addColorStop(0, 'rgba(255, 224, 145, 0.24)');
    g.addColorStop(1, 'rgba(255, 200, 110, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 30, y - 12, 82, 82);
    px(ctx, x + 3, y + 48, 14, 6, '#6e3d1e');
    px(ctx, x + 8, y + 14, 4, 36, '#d49a4c');
    outlinedBox(ctx, x, y, 20, 16, '#ffd4b8', '#8c5230');
  }

  function drawFlowerPot(ctx, x, y, bloomCol = '#ff85a6') {
    outlinedBox(ctx, x, y + 14, 22, 18, '#d98452', '#5c2f22');
    px(ctx, x + 2, y, 18, 14, '#569c54');
    px(ctx, x + 4, y - 6, 7, 7, bloomCol);
    px(ctx, x + 12, y - 4, 7, 7, '#ffe066');
  }

  function drawHiddenGiftBox(ctx, x, y, time, boxCol, ribbonCol, opened) {
    const bob = opened ? 0 : Math.round(Math.sin(time * 3.8 + x * 0.05) * 1.5);
    px(ctx, x + 2, y + 25, 24, 5, 'rgba(30, 12, 8, 0.22)');
    // Box body
    outlinedBox(ctx, x + 2, y + 8 + bob, 24, 18, boxCol, '#7a3f54');
    px(ctx, x + 12, y + 9 + bob, 4, 16, ribbonCol);
    px(ctx, x + 3, y + 16 + bob, 22, 3, ribbonCol);
    if (opened) {
      // Slightly ajar open lid w/ warm gold glow
      outlinedBox(ctx, x, y + 2, 26, 7, boxCol, '#7a3f54');
      px(ctx, x + 10, y + 6, 8, 4, '#ffe885');
    } else {
      // Closed lid + cute bow + golden sparkle
      outlinedBox(ctx, x, y + 5 + bob, 28, 7, boxCol, '#7a3f54');
      px(ctx, x + 12, y + 6 + bob, 4, 5, ribbonCol);
      px(ctx, x + 8, y + 1 + bob, 5, 4, ribbonCol);
      px(ctx, x + 15, y + 1 + bob, 5, 4, ribbonCol);
      if (Math.sin(time * 5.2 + y) > 0.2) {
        px(ctx, x + 22, y - 2 + bob, 4, 4, '#fff8b8');
      }
    }
  }

  function getDynamicDrawables(room, state, time) {
    const drawables = [];

    if (room.id === 'living') {
      // 1. Matte-White Ceramic Olive/Ficus Tree beside arched balcony (col 4, row 3)
      drawables.push({
        sortY: 126,
        draw(ctx) {
          px(ctx, 134, 120, 20, 5, 'rgba(40, 26, 18, 0.16)');
          roundedBox(ctx, 135, 100, 18, 22, 6, '#fffcf7', '#9c8674');
          px(ctx, 143, 68, 2, 34, '#8f6b4b');
          px(ctx, 138, 74, 6, 2, '#8f6b4b');
          px(ctx, 144, 64, 7, 2, '#8f6b4b');
          [[137, 66], [144, 56], [149, 62], [134, 72], [150, 70], [140, 60]].forEach(([lx, ly], i) => {
            px(ctx, lx, ly, 6, 5, i % 2 === 0 ? '#79a86b' : '#96bf82');
          });
        },
      });

      // 2. Dusty-Pink Tufted Togo Bunny Caterpillar Chair + Tiny White Puppy Figurine (cols 6..7, rows 3..4 -> x: 188..258)
      drawables.push({
        sortY: 142,
        draw(ctx) {
          px(ctx, 188, 152, 72, 7, 'rgba(45, 22, 28, 0.18)');
          roundedBox(ctx, 190, 100, 68, 54, 14, '#eab4bc', '#9c6270');
          for (let ry = 108; ry <= 144; ry += 9) {
            px(ctx, 196, ry, 56, 2, '#d495a0');
            px(ctx, 198, ry + 2, 52, 3, '#f7cfd5');
          }
          roundedBox(ctx, 212, 114, 24, 20, 8, '#ffffff', '#b59298');
          px(ctx, 216, 103, 5, 13, '#ffffff'); px(ctx, 227, 103, 5, 13, '#ffffff');
          px(ctx, 217, 105, 3, 9, '#ffd2de'); px(ctx, 228, 105, 3, 9, '#ffd2de');
          px(ctx, 219, 121, 2, 2, '#4a3840'); px(ctx, 227, 121, 2, 2, '#4a3840');
          px(ctx, 223, 124, 2, 2, '#f28da6');
          roundedBox(ctx, 256, 140, 12, 12, 4, '#ffffff', '#b8a29c');
          px(ctx, 258, 143, 2, 2, '#4a3840'); px(ctx, 263, 143, 2, 2, '#4a3840');
          px(ctx, 256, 138, 4, 4, '#efe5db');
        },
      });

      // 3. Sculptural White Tulip Side Table w/ Coral Tulips (col 8, row 3 -> x: 266..288)
      drawables.push({
        sortY: 126,
        draw(ctx) {
          px(ctx, 267, 120, 20, 5, 'rgba(40, 26, 18, 0.16)');
          px(ctx, 269, 118, 16, 4, '#fffaf2');
          px(ctx, 275, 102, 4, 16, '#ebe0d2');
          roundedBox(ctx, 265, 96, 24, 8, 4, '#fffdf9', '#a6907c');
          outlinedBox(ctx, 273, 86, 8, 11, '#fff3e8', '#b08e7a');
          px(ctx, 272, 81, 4, 5, '#ff738f'); px(ctx, 278, 82, 4, 5, '#ff94a8');
        },
      });

      // 4. Tall Cream Pleated Floor Lamp (col 9, row 3 -> x: 292..314)
      drawables.push({
        sortY: 126,
        draw(ctx) {
          px(ctx, 294, 121, 18, 5, 'rgba(40, 26, 18, 0.16)');
          px(ctx, 296, 118, 14, 5, '#c4a678');
          px(ctx, 302, 72, 3, 46, '#d4b482');
          ctx.save();
          ctx.fillStyle = !state || state.livingLampsOn !== false ? '#fff5d4' : '#f2eadc';
          ctx.strokeStyle = '#9c7d5c';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(295, 58); ctx.lineTo(312, 58); ctx.lineTo(317, 73); ctx.lineTo(290, 73);
          ctx.closePath(); ctx.fill(); ctx.stroke();
          for (let pxL = 296; pxL <= 310; pxL += 4) {
            px(ctx, pxL, 60, 1, 12, '#decbb0');
          }
          ctx.restore();
        },
      });

      // 5. Cream & Rose-Gold Jukebox (cols 13..14, rows 3..4 -> x: 422..470)
      drawables.push({
        sortY: 160,
        draw(ctx) {
          px(ctx, 420, 155, 54, 7, 'rgba(38, 22, 18, 0.2)');
          outlinedBox(ctx, 422, 94, 48, 64, '#fff8f0', '#946e68');
          outlinedBox(ctx, 426, 84, 40, 14, '#f5c7d2', '#946e68');
          px(ctx, 428, 90, 36, 32, '#f2c87a');
          px(ctx, 432, 94, 28, 24, '#33243e');
          const bars = ['#ff85a6', '#ffe066', '#8be0aa', '#8fd9ff'];
          for (let b = 0; b < 4; b++) {
            const bh = state.musicPlaying
              ? 5 + Math.round(Math.abs(Math.sin(time * 7 + b * 1.4)) * 14)
              : 4;
            px(ctx, 435 + b * 6, 116 - bh, 4, bh, bars[b]);
          }
          px(ctx, 430, 126, 32, 24, '#e6b8c4');
          for (let gy = 130; gy < 148; gy += 4) px(ctx, 432, gy, 28, 2, '#fff5dc');
        },
      });

      // 6. Left-Wall Recessed Cream Media Backdrop + Wide Smart TV + Long Floating Apricot Console (cols 1..2, rows 5..8 -> x: 32..88, y: 160..288)
      drawables.push({
        sortY: 288,
        draw(ctx) {
          // Recessed cream feature panel along left wall
          outlinedBox(ctx, 32, 160, 18, 126, '#fffaf2', '#b5a08c');
          // Floating apricot-cream low media console (soft shadow below right edge)
          px(ctx, 48, 283, 40, 5, 'rgba(45, 28, 20, 0.2)');
          outlinedBox(ctx, 48, 164, 38, 120, '#f7d5b4', '#946e54');
          px(ctx, 79, 166, 5, 116, '#fff7ec');
          [170, 208, 246].forEach((cy) => outlinedBox(ctx, 52, cy, 24, 32, '#f2c8a2', '#cf9f76'));
          // Vertical angled Wide-Bezel Smart TV screen mounted on left feature wall facing RIGHT toward Sofa!
          outlinedBox(ctx, 35, 180, 18, 86, '#2b2633', '#16131c');
          const scan = Math.floor(time * 2.5) % 3;
          px(ctx, 39, 185, 11, 76, scan === 0 ? '#d8effa' : scan === 1 ? '#e2f4fc' : '#cce8f7');
          px(ctx, 41, 198, 7, 50, '#f5d4e2');
          drawMiniHeart(ctx, 44, 223, '#ff6d94');
          // Console decor facing room: Switch handheld, yellow chick figurine & mini ceramic vase
          px(ctx, 64, 174, 8, 10, '#8be0ff'); px(ctx, 64, 184, 8, 4, '#ff738f');
          px(ctx, 64, 256, 8, 9, '#ffe066'); px(ctx, 67, 259, 2, 2, '#3d2414');
          px(ctx, 65, 270, 7, 8, '#96cf8a');
        },
      });

      // 7. Generous Center Pebble Cloud Low Coffee Table (cols 5..8, rows 6..7 -> x: 162..286, y: 194..254, 124x60!)
      drawables.push({
        sortY: 254,
        draw(ctx) {
          px(ctx, 166, 249, 116, 7, 'rgba(40, 26, 18, 0.16)');
          px(ctx, 178, 240, 6, 12, '#c7b096'); px(ctx, 264, 240, 6, 12, '#c7b096');
          roundedBox(ctx, 162, 196, 124, 48, 14, '#fffaf2', '#9c8674');
          px(ctx, 168, 202, 112, 36, '#fffdf9');
          // Decorative ceramic tray w/ teapot, cups, art book, fruit bowl & candle
          roundedBox(ctx, 174, 206, 46, 26, 6, '#f7ece0', '#cbb4a2');
          outlinedBox(ctx, 180, 208, 14, 12, '#ffb7cb', '#9e4c68'); // Teapot
          px(ctx, 202, 210, 8, 8, '#fff5d8'); px(ctx, 202, 221, 8, 8, '#ff9ebb'); // 2 teacups
          // Art magazine & strawberry tart
          px(ctx, 228, 206, 22, 14, '#f2e5d6'); px(ctx, 232, 210, 14, 5, '#ffa8c4');
          outlinedBox(ctx, 254, 206, 20, 14, '#fff2df', '#c4964c'); // Fruit & strawberry tart
          px(ctx, 258, 209, 5, 5, '#ff5778'); px(ctx, 265, 210, 5, 5, '#ffe066');
          // Warm scented candle & flower bud vase
          px(ctx, 234, 224, 8, 9, '#fff2c2'); px(ctx, 237, 221, 2, 3, '#ffa834');
          outlinedBox(ctx, 254, 223, 10, 10, '#fff3e8', '#b08e7a');
          px(ctx, 256, 218, 5, 5, '#ff738f');
        },
      });

      // 8. Right-Wall Plush Cream Boucle 3-Seater Cloud Sofa facing LEFT at TV (cols 12..14, rows 5..8 -> x: 390..476)
      drawables.push({
        sortY: 220,
        draw(ctx) {
          px(ctx, 386, 174, 8, 112, 'rgba(40, 26, 18, 0.16)');
          // Thick fluffy backrest flush against right wall + 3 vertical-aligned boucle seat cushions
          roundedBox(ctx, 390, 160, 86, 128, 14, '#efe5d6', '#947e6d');
          // Backrest bolster along right edge
          roundedBox(ctx, 452, 168, 22, 112, 9, '#f7efe3', '#c4b4a2');
          // 3 soft boucle seat cushions facing LEFT
          [176, 208, 240].forEach((cy) => {
            roundedBox(ctx, 394, cy, 56, 30, 8, '#fffdf9', '#c4b4a2');
          });
          // Chunky top & bottom armrests + blush throw blanket on lower armrest
          roundedBox(ctx, 390, 158, 78, 18, 8, '#fbf6ee', '#947e6d');
          roundedBox(ctx, 390, 270, 78, 18, 8, '#fbf6ee', '#947e6d');
          px(ctx, 394, 268, 42, 18, '#f5b8c8');
          drawLaceTrim(ctx, 396, 285, 38, '#fff7fa');
          // Chubby Panda Plush Pillow resting upright on top cushion (x: 428..450, y: 176..202)
          roundedBox(ctx, 428, 178, 22, 22, 8, '#ffffff', '#54464a');
          px(ctx, 429, 174, 6, 6, '#362d30'); px(ctx, 443, 174, 6, 6, '#362d30');
          px(ctx, 432, 184, 5, 4, '#362d30'); px(ctx, 441, 184, 5, 4, '#362d30');
          px(ctx, 430, 191, 18, 7, '#362d30');
          // Small velvet pink heart cushion on middle cushion
          px(ctx, 432, 218, 12, 11, '#ff9ebb'); drawMiniHeart(ctx, 438, 222, '#ffffff');
        },
      });

      // 9. Foreground Cream Dining & Birthday Party Table w/ 4 Boucle Cloud Chairs (cols 3..7, rows 10..11 -> x: 102..252, y: 312..386)
      drawables.push({
        sortY: 386,
        draw(ctx) {
          [
            [132, 306, 22, 16], [200, 306, 22, 16],
            [132, 372, 22, 16], [200, 372, 22, 16],
          ].forEach(([cx, cy, cw, ch]) => {
            roundedBox(ctx, cx, cy, cw, ch, 6, '#f9f2e7', '#9c8674');
            px(ctx, cx + 3, cy + 3, cw - 6, ch - 8, '#fffcf7');
          });
          px(ctx, 102, 378, 148, 8, 'rgba(38, 24, 18, 0.2)');
          px(ctx, 112, 366, 8, 16, '#b89f88'); px(ctx, 232, 366, 8, 16, '#b89f88');
          roundedBox(ctx, 102, 318, 148, 54, 8, '#fffaf2', '#9c8470');
          px(ctx, 106, 322, 140, 42, '#fffdf9');
          px(ctx, 106, 362, 140, 5, '#efe2d2');
          // Left: Newspaper placemat + tulips vase + clear glass cup
          outlinedBox(ctx, 112, 344, 26, 16, '#f5efe6', '#bfb4a6');
          px(ctx, 116, 348, 18, 2, '#9c9288'); px(ctx, 116, 353, 14, 2, '#9c9288');
          outlinedBox(ctx, 113, 325, 10, 11, '#fff5ea', '#a68d7a');
          px(ctx, 112, 319, 4, 6, '#ffd257'); px(ctx, 119, 320, 4, 6, '#ff98b6');
          px(ctx, 132, 329, 7, 9, '#d8eef7');
          // Right: Cloud tissue box + gold wire fruit basket w/ apples & oranges
          roundedBox(ctx, 214, 325, 24, 13, 5, '#f5ebdc', '#a6907c');
          px(ctx, 224, 322, 4, 4, '#ffffff');
          outlinedBox(ctx, 210, 344, 30, 16, '#f7ead6', '#c4964c');
          px(ctx, 214, 348, 7, 7, '#f25757');
          px(ctx, 224, 347, 7, 7, '#ffa438');
          px(ctx, 232, 350, 6, 6, '#ff738f');
          // Center: Iconic 2-tier Strawberry Birthday Cake & 5 animated candles (x = 176)
          px(ctx, 161, 326, 30, 20, '#ff96b0'); px(ctx, 161, 326, 30, 6, '#fffdf5');
          px(ctx, 164, 332, 4, 4, '#fffdf5'); px(ctx, 174, 332, 5, 5, '#fffdf5'); px(ctx, 185, 332, 4, 4, '#fffdf5');
          px(ctx, 165, 314, 22, 12, '#fffdf5'); px(ctx, 165, 318, 22, 6, '#ffc2cf');
          [167, 175, 183].forEach((sx) => px(ctx, sx, 311, 3, 3, '#e63946'));
          [167, 171, 175, 179, 183].forEach((cx, i) => {
            px(ctx, cx, 305, 2, 7, i % 2 === 0 ? '#78d2f0' : '#ffd257');
            if (!state.candlesBlown) {
              const flicker = Math.sin(time * 10 + i * 1.9) > 0 ? 0 : 1;
              px(ctx, cx, 300 + flicker, 2, 4, '#ffa834');
              px(ctx, cx, 301 + flicker, 2, 2, '#fff59d');
            } else {
              px(ctx, cx, 303, 1, 2, '#594a42');
            }
          });
          if (!state.candlesBlown) {
            ctx.fillStyle = 'rgba(255, 220, 120, 0.18)';
            ctx.beginPath(); ctx.arc(176, 304, 26, 0, Math.PI * 2); ctx.fill();
          }
        },
      });

      // 10. Foreground Right-Wall Cream Sideboard & Coffee/Dessert Bar (cols 12..14, rows 9..11 -> x: 394..476, y: 292..380)
      drawables.push({
        sortY: 380,
        draw(ctx) {
          px(ctx, 390, 296, 6, 82, 'rgba(40, 26, 18, 0.16)');
          outlinedBox(ctx, 394, 294, 82, 86, '#fffaf2', '#8c7462');
          px(ctx, 392, 294, 8, 86, '#ebdcc8'); // left edge oak top trim
          // Matte cabinet doors facing LEFT
          [300, 340].forEach((dy) => {
            outlinedBox(ctx, 400, dy, 28, 34, '#f7efe3', '#cfc0ae');
            px(ctx, 404, dy + 15, 3, 4, '#d4a652');
          });
          // Dried bouquet vase, pastel pink espresso machine + 2-tier macaron stand + candle on countertop!
          outlinedBox(ctx, 440, 296, 16, 16, '#f2e5d4', '#9c8370');
          px(ctx, 438, 284, 7, 12, '#ffe0a3'); px(ctx, 448, 282, 7, 14, '#f7d8b5'); px(ctx, 455, 287, 5, 10, '#fff2d8');
          outlinedBox(ctx, 436, 322, 22, 22, '#ffb8cc', '#8f5568');
          px(ctx, 440, 327, 13, 8, '#fff7f9'); px(ctx, 444, 336, 5, 5, '#ffffff');
          px(ctx, 438, 356, 22, 16, '#e8c47a');
          px(ctx, 441, 358, 5, 4, '#ff85a6'); px(ctx, 449, 358, 5, 4, '#c59bf0'); px(ctx, 445, 365, 6, 4, '#9ee0b8');
          px(ctx, 462, 362, 6, 8, '#fff4dc'); px(ctx, 464, 359, 2, 3, '#ffa834');
        },
      });

      // 11. 团团's Open Pink Suitcase (cols 9..10, row 11 -> x: 286..344, y: 334..394)
      drawables.push({
        sortY: 394,
        draw(ctx) {
          px(ctx, 288, 386, 54, 8, 'rgba(30, 12, 4, 0.22)');
          outlinedBox(ctx, 290, 334, 46, 26, '#e893ab', '#693446');
          px(ctx, 294, 338, 38, 18, '#363242');
          px(ctx, 298, 342, 22, 12, '#fff9fb');
          outlinedBox(ctx, 288, 358, 50, 32, '#d97e99', '#693446');
          px(ctx, 292, 362, 42, 22, '#363242');
          px(ctx, 296, 364, 34, 16, '#fff7fa');
          px(ctx, 306, 388, 14, 4, '#d4dce6');
          px(ctx, 296, 387, 5, 4, '#ffd257'); px(ctx, 326, 387, 5, 4, '#ffd257');
        },
      });

      // 12. 团团 Pet Feeding Bowls, Treat Jars & Cushion (col 11, row 11 -> x: 348..388, y: 350..392)
      drawables.push({
        sortY: 392,
        draw(ctx) {
          px(ctx, 348, 386, 42, 6, 'rgba(35, 22, 16, 0.16)');
          roundedBox(ctx, 346, 350, 28, 22, 7, '#ffe6ee', '#b0788a');
          px(ctx, 350, 354, 20, 14, '#fff7fa');
          px(ctx, 356, 359, 8, 4, '#ff9ebb');
          outlinedBox(ctx, 376, 352, 12, 12, '#ffeab5', '#9c6e3e');
          px(ctx, 377, 349, 10, 4, '#ff9ebb');
          roundedBox(ctx, 348, 376, 15, 10, 4, '#ffd2e1', '#9c5a70');
          px(ctx, 351, 378, 9, 5, '#a6e4ff');
          roundedBox(ctx, 368, 376, 15, 10, 4, '#bde8c8', '#5e8c68');
          px(ctx, 371, 378, 9, 5, '#b87646');
        },
      });

      drawables.push({
        sortY: 472,
        draw(ctx) {
          drawBalloonBasket(ctx, 36, 434, time, 0);
          drawBalloonBasket(ctx, 448, 434, time, 2.1);
        },
      });

      drawables.push({
        sortY: 128,
        draw(ctx) {
          drawHiddenGiftBox(ctx, 322, 98, time, '#ff85a6', '#ffe066', state.completedQuests.has('gift_living'));
        },
      });
    } else if (room.id === 'bedroom') {
      // 1. Top-left L-Shaped PC Desk + Transparent Pink RGB Tower + Trim Open Shelf (cols 1..5)
      drawables.push({
        sortY: 132,
        draw(ctx) {
          px(ctx, 34, 122, 154, 6, 'rgba(42, 22, 16, 0.2)');
          outlinedBox(ctx, 34, 78, 154, 46, '#f6efe9', '#9c786a');
          px(ctx, 38, 82, 146, 16, '#fffaf5');
          px(ctx, 96, 98, 88, 22, '#d9c6ba');

          // Transparent pink-lit RGB PC tower in top-left corner (x: 38..90, y: 80..118)
          outlinedBox(ctx, 38, 80, 52, 36, '#fff8f6', '#8d6e68');
          px(ctx, 43, 84, 42, 28, '#2d1c2b');
          const fanGlow = 0.72 + 0.25 * Math.sin(time * 3.5);
          ctx.fillStyle = `rgba(255, 164, 200, ${fanGlow.toFixed(2)})`;
          ctx.fillRect(46, 87, 36, 22);
          px(ctx, 50, 91, 10, 10, '#fff0f7');
          px(ctx, 64, 91, 12, 14, '#ffcce2');

          // Pink headphones stand (x: 96..112)
          px(ctx, 100, 93, 6, 3, '#c89b88');
          px(ctx, 102, 82, 2, 12, '#e6b8a2');
          outlinedBox(ctx, 97, 80, 12, 8, '#f4b6c6', '#8c5367');

          // Pink notebook + books (x: 116..132)
          outlinedBox(ctx, 116, 83, 14, 12, '#f5c2cf', '#9c6878');
          px(ctx, 120, 84, 6, 9, '#fff9f5');

          // Lush ivy pot on shelf (x: 138..164)
          outlinedBox(ctx, 144, 84, 14, 12, '#fffaf5', '#9c786a');
          px(ctx, 138, 76, 26, 12, '#5a944e');
          px(ctx, 142, 74, 18, 9, '#7dbb6e');
          px(ctx, 148, 95, 6, 10, '#6ba65d');
          px(ctx, 154, 97, 6, 12, '#84bd75');

          // Cubbies packed with books + glowing warm cubby nightlight (x: 98..184, y: 100..118)
          for (let bx = 98; bx < 146; bx += 8) {
            px(ctx, bx, 102, 6, 16, (bx % 16 === 0) ? '#f0c4cf' : '#e8d7ca');
          }
          px(ctx, 152, 101, 30, 17, '#ffdfb0');
          px(ctx, 163, 106, 8, 8, '#fff7dc');
        },
      });

      // French Cream-Pink Upright Piano (cols 6..8, row 3 -> x: 194..286, y: 66..126)
      drawables.push({
        sortY: 126,
        draw(ctx) {
          const isPlaying = state.playerActivity && state.playerActivity.type === 'play_piano';
          px(ctx, 194, 121, 92, 7, 'rgba(35, 16, 10, 0.24)');
          // Cream upright cabinet body
          outlinedBox(ctx, 194, 66, 92, 58, '#faf3ec', '#8c695e');
          px(ctx, 198, 70, 84, 28, '#f0d8df'); // soft blush molded upper front panel
          px(ctx, 202, 74, 34, 20, '#fff7f4');
          px(ctx, 244, 74, 34, 20, '#fff7f4');
          // Wooden metronome & mini tulip vase atop piano
          outlinedBox(ctx, 204, 58, 11, 10, '#c89b88', '#6e493c');
          px(ctx, 209, 60, 1, 6, '#fff4ea');
          outlinedBox(ctx, 266, 58, 12, 10, '#ffe6ee', '#9c6878');
          px(ctx, 269, 53, 5, 5, '#ff7fa6');
          // Open sheet music stand + music score
          outlinedBox(ctx, 226, 74, 28, 22, '#fffdf9', '#9c786a');
          for (let ly = 79; ly <= 89; ly += 3) {
            px(ctx, 229, ly, 22, 1, '#b8a098');
          }
          px(ctx, 234, 82, 2, 4, '#6e4e44');
          px(ctx, 242, 85, 2, 4, '#6e4e44');
          // Horizontal keybed + Crisp White & Black Piano Keys (y: 99..112)
          outlinedBox(ctx, 196, 98, 88, 16, '#fffaf6', '#7d594e');
          for (let kx = 200; kx < 278; kx += 7) {
            const lit = isPlaying && ((Math.floor(time * 6) + kx) % 4 === 0);
            px(ctx, kx, 100, 6, 12, lit ? '#ffd3e1' : '#ffffff');
            px(ctx, kx + 6, 100, 1, 12, '#cbbab2');
            if ((kx / 7 | 0) % 7 !== 2 && (kx / 7 | 0) % 7 !== 6 && kx < 272) {
              px(ctx, kx + 4, 100, 4, 7, '#4a3634');
            }
          }
          // Lower front panel & Rose-Gold Pedals
          px(ctx, 198, 114, 84, 8, '#ede0d6');
          px(ctx, 231, 119, 4, 4, '#e3b26f');
          px(ctx, 238, 119, 4, 4, '#e3b26f');
          px(ctx, 245, 119, 4, 4, '#e3b26f');
        },
      });

      // Pink Velvet Piano Bench (col 7, row 4 -> x: 222..258, y: 132..148)
      drawables.push({
        sortY: 146,
        draw(ctx) {
          px(ctx, 222, 143, 36, 6, 'rgba(30, 12, 4, 0.2)');
          px(ctx, 225, 139, 5, 8, '#f4ebe1');
          px(ctx, 250, 139, 5, 8, '#f4ebe1');
          outlinedBox(ctx, 222, 131, 36, 12, '#efc0cc', '#8f5e6d');
          px(ctx, 226, 133, 28, 7, '#fbe0e7');
        },
      });

      // Left vertical wing of L-desk + Monitor + Pink Mat + Under-desk 3-Drawer Cabinet w/ 2 Plants
      drawables.push({
        sortY: 254,
        draw(ctx) {
          px(ctx, 34, 222, 62, 6, 'rgba(42, 22, 16, 0.2)');
          outlinedBox(ctx, 34, 120, 62, 104, '#f8f2ec', '#9c786a');

          // Pink full desk mat (x: 56..90, y: 130..198)
          outlinedBox(ctx, 56, 132, 34, 66, '#f2bfc8', '#b88592');
          // Crisp white keyboard + pink mouse
          outlinedBox(ctx, 64, 144, 14, 38, '#fffdf9', '#baa3a0');
          for (let ky = 148; ky < 178; ky += 4) {
            px(ctx, 67, ky, 8, 2, '#e2d2ce');
          }
          outlinedBox(ctx, 74, 185, 8, 9, '#f6cad4', '#9c6878');

          // Ultrawide curved monitor along left desk edge (x: 37..48, y: 128..188)
          outlinedBox(ctx, 37, 128, 12, 62, '#ffffff', '#6d5852');
          const monHue = Math.sin(time * 2) > 0 ? '#f7c5d2' : '#fbcdd6';
          px(ctx, 41, 132, 6, 54, monHue);
          px(ctx, 41, 148, 6, 22, '#ffe9d6');

          // Pastel floral vase & adjustable desk lamp (y: 192..216)
          outlinedBox(ctx, 40, 194, 13, 14, '#e6b8a2', '#8c5e4d');
          px(ctx, 42, 189, 5, 5, '#ff8fab');
          px(ctx, 47, 190, 5, 5, '#ffd878');
          outlinedBox(ctx, 72, 200, 14, 14, '#fff8f2', '#9c786a');
          px(ctx, 75, 203, 8, 8, '#ffe2ad');

          // Under-desk white 3-drawer cabinet & 2 small potted plants on top (cols 1..2, rows 6..7 -> y: 220..254)
          outlinedBox(ctx, 34, 218, 58, 36, '#f2ebe5', '#8f6d62');
          px(ctx, 40, 222, 46, 8, '#ffffff');
          px(ctx, 40, 233, 46, 8, '#ffffff');
          px(ctx, 60, 244, 6, 2, '#c89b88');
          // Two lush mini potted plants atop cabinet
          outlinedBox(ctx, 42, 214, 13, 11, '#fffaf5', '#8c695e');
          px(ctx, 39, 204, 18, 12, '#629c56');
          px(ctx, 43, 201, 10, 7, '#84bf75');
          outlinedBox(ctx, 66, 214, 13, 11, '#f4dcd6', '#8c695e');
          px(ctx, 63, 205, 18, 11, '#71ab64');
        },
      });

      // Ergonomic White-Pink Swivel Chair (col 3, row 5 -> x: 96..128, y: 152..192)
      drawables.push({
        sortY: 188,
        draw(ctx) {
          px(ctx, 98, 184, 28, 7, 'rgba(30, 12, 4, 0.2)');
          // 5-star caster legs
          px(ctx, 102, 180, 20, 4, '#ece4dd');
          px(ctx, 99, 178, 4, 4, '#70605a');
          px(ctx, 121, 178, 4, 4, '#70605a');
          // Seat cushion
          outlinedBox(ctx, 98, 162, 26, 20, '#f4c7d0', '#8f5e6d');
          px(ctx, 102, 165, 18, 13, '#fae3e7');
          // Rounded curved cream-pink backrest (on right side facing monitor)
          outlinedBox(ctx, 116, 152, 12, 32, '#fff9f5', '#9c786a');
          px(ctx, 118, 156, 7, 24, '#f0c4cc');
        },
      });

      // Round Fluted Cream Nightstand + Glow Orb Nightlight (col 10, row 3 -> x: 320..352, y: 94..132)
      drawables.push({
        sortY: 132,
        draw(ctx) {
          px(ctx, 322, 124, 28, 7, 'rgba(35, 16, 10, 0.22)');
          outlinedBox(ctx, 322, 100, 28, 28, '#efe1d6', '#987265');
          for (let fx = 326; fx < 348; fx += 4) {
            px(ctx, fx, 108, 1, 18, '#d4bfb1');
          }
          outlinedBox(ctx, 324, 101, 12, 8, '#f5d2da', '#9c6878');
          const lampOn = !state || state.bedroomLampOn !== false;
          px(ctx, 331, 94, 12, 4, '#d9b89c');
          outlinedBox(
            ctx,
            328,
            79,
            18,
            17,
            lampOn ? '#fff6dc' : '#ded4cb',
            lampOn ? '#d9a468' : '#8c7870'
          );
          if (lampOn) {
            px(ctx, 332, 83, 10, 9, '#ffffff');
          }
        },
      });

      // French Upholstered Dusty-Pink Double Bed (cols 11..15, rows 3..6 -> x: 352..512, y: 74..224)
      drawables.push({
        sortY: 222,
        draw(ctx) {
          px(ctx, 352, 218, 160, 8, 'rgba(30, 12, 8, 0.24)');
          outlinedBox(ctx, 354, 74, 156, 148, '#e8d8d0', '#8d685c');
          px(ctx, 358, 78, 148, 26, '#dfd0c8');
          px(ctx, 362, 80, 140, 12, '#ede0d8');

          outlinedBox(ctx, 360, 100, 68, 30, '#da97a7', '#8c5366');
          px(ctx, 365, 104, 58, 20, '#e5aab8');
          outlinedBox(ctx, 436, 100, 68, 30, '#da97a7', '#8c5366');
          px(ctx, 441, 104, 58, 20, '#e5aab8');

          outlinedBox(ctx, 390, 118, 34, 24, '#f0c8d2', '#9c6878');
          for (let gx = 394; gx < 420; gx += 6) {
            px(ctx, gx, 121, 3, 18, '#df9eb0');
          }
          for (let gy = 122; gy < 140; gy += 6) {
            px(ctx, 393, gy, 28, 3, 'rgba(218, 145, 165, 0.65)');
          }
          px(ctx, 436, 118, 24, 24, '#fffaf6');
          px(ctx, 432, 122, 32, 16, '#fffaf6');
          outlinedBox(ctx, 442, 124, 12, 12, '#e29bad', '#b57285');

          outlinedBox(ctx, 358, 138, 148, 80, '#df9fac', '#8c5366');
          px(ctx, 362, 142, 140, 20, '#ebbac5');
          px(ctx, 358, 168, 148, 24, '#b87b8b');
          px(ctx, 362, 173, 140, 4, '#a16475');
          px(ctx, 362, 181, 140, 4, '#cc90a0');
          outlinedBox(ctx, 372, 178, 62, 34, '#f4ebe1', '#bfa79a');
          px(ctx, 378, 184, 50, 20, '#fcf6ef');
          for (let tx = 376; tx < 432; tx += 6) {
            px(ctx, tx, 211, 3, 4, '#fffaf2');
          }
        },
      });

      // Twin Bouncing Junimos at Sunny Bay Window Mat (cols 17..18, rows 6..7 -> x: 582, y: 224)
      drawables.push({
        sortY: 238,
        draw(ctx) {
          const hop = Math.round(Math.abs(Math.sin(time * 3.8)) * 5);
          const cx = 588;
          const cy = 232 - hop;
          ctx.fillStyle = 'rgba(30, 12, 4, 0.2)';
          ctx.beginPath(); ctx.ellipse(cx, 236, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
          px(ctx, cx - 1, cy - 23, 2, 5, '#417d38'); px(ctx, cx + 1, cy - 25, 5, 3, '#72c95b');
          px(ctx, cx - 10, cy - 18, 20, 18, '#64bd57'); px(ctx, cx - 12, cy - 15, 24, 12, '#64bd57');
          px(ctx, cx - 8, cy - 16, 16, 12, '#7ed96b');
          px(ctx, cx - 5, cy - 11, 2, 3, '#253b1e'); px(ctx, cx + 3, cy - 11, 2, 3, '#253b1e');
          px(ctx, cx - 7, cy - 7, 3, 2, '#ff9aa8'); px(ctx, cx + 4, cy - 7, 3, 2, '#ff9aa8');

          const hop2 = Math.round(Math.abs(Math.sin(time * 4.4 + 1.4)) * 4);
          const px2 = 564;
          const py2 = 236 - hop2;
          ctx.fillStyle = 'rgba(30, 12, 4, 0.16)';
          ctx.beginPath(); ctx.ellipse(px2, 238, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
          px(ctx, px2, py2 - 16, 2, 4, '#5a9952');
          px(ctx, px2 - 6, py2 - 12, 13, 12, '#ff94b2'); px(ctx, px2 - 8, py2 - 10, 17, 8, '#ff94b2');
          px(ctx, px2 - 4, py2 - 8, 2, 2, '#5c2635'); px(ctx, px2 + 3, py2 - 8, 2, 2, '#5c2635');
        },
      });

      // Bottom-Left Lush Broadleaf Floor Plant (col 3, row 12 -> x: 96..126, y: 374..416)
      drawables.push({
        sortY: 414,
        draw(ctx) {
          px(ctx, 100, 410, 22, 6, 'rgba(30, 12, 4, 0.2)');
          outlinedBox(ctx, 102, 396, 18, 16, '#ede4dc', '#8c695e');
          px(ctx, 96, 378, 30, 20, '#5a8f4e');
          px(ctx, 100, 372, 22, 14, '#75ad66');
          px(ctx, 94, 384, 10, 10, '#6aa35b');
          px(ctx, 118, 384, 10, 10, '#4f8245');
        },
      });

      // Puffy Cream Cloud Armchair + Dusty-Pink Flower Pillow (cols 4..5, row 12 -> x: 130..192, y: 366..416)
      drawables.push({
        sortY: 414,
        draw(ctx) {
          px(ctx, 130, 410, 62, 7, 'rgba(30, 12, 4, 0.22)');
          // Rounded puffy arms & backrest (3D top-down boucle segments)
          outlinedBox(ctx, 130, 372, 16, 40, '#f3eae1', '#9e8276');
          outlinedBox(ctx, 176, 372, 16, 40, '#f3eae1', '#9e8276');
          outlinedBox(ctx, 136, 366, 50, 18, '#f7f0e9', '#9e8276');
          // Deep seat cushion
          outlinedBox(ctx, 142, 380, 38, 32, '#ede0d5', '#9e8276');
          // Segmented vertical puffs
          px(ctx, 153, 382, 2, 28, '#dbcbc0');
          px(ctx, 166, 382, 2, 28, '#dbcbc0');
          // Pink flower-shaped cushion nestled inside chair
          px(ctx, 152, 386, 18, 16, '#d48d9b');
          px(ctx, 149, 389, 24, 10, '#d48d9b');
          px(ctx, 158, 391, 6, 6, '#e7b4be');
        },
      });

      // Round Cream Side Table w/ Lit Candle & Hardcover Book (col 6, row 12 -> x: 194..224, y: 374..414)
      drawables.push({
        sortY: 412,
        draw(ctx) {
          px(ctx, 196, 406, 24, 6, 'rgba(30, 12, 4, 0.18)');
          px(ctx, 205, 394, 6, 14, '#e3d2c5');
          outlinedBox(ctx, 194, 378, 28, 20, '#f5ece4', '#9e8276');
          // Small book + eucalyptus + glowing jar candle
          outlinedBox(ctx, 200, 387, 14, 9, '#fff9f2', '#bfa598');
          px(ctx, 211, 389, 6, 5, '#6aa35b');
          outlinedBox(ctx, 204, 379, 8, 8, '#fff2d8', '#b88c68');
          const flicker = Math.sin(time * 11) > 0 ? 0 : 1;
          px(ctx, 207, 376 + flicker, 2, 3, '#ffa834');
        },
      });

      // Bottom-Right 3-Door Built-In White Wardrobe (cols 10..18, row 12 -> x: 320..608, y: 378..420)
      drawables.push({
        sortY: 418,
        draw(ctx) {
          px(ctx, 320, 414, 288, 7, 'rgba(30, 12, 4, 0.22)');
          outlinedBox(ctx, 320, 380, 288, 38, '#f6efe8', '#987a6e');
          px(ctx, 324, 384, 280, 28, '#fffaf5');
          px(ctx, 416, 383, 2, 32, '#d8c9bd');
          px(ctx, 512, 383, 2, 32, '#d8c9bd');
          px(ctx, 408, 385, 4, 3, '#c89b88');
          px(ctx, 422, 385, 4, 3, '#c89b88');
          px(ctx, 504, 385, 4, 3, '#c89b88');
          px(ctx, 518, 385, 4, 3, '#c89b88');
        },
      });

      drawables.push({
        sortY: 414,
        draw(ctx) {
          drawHiddenGiftBox(ctx, 258, 384, time, '#c8a2f0', '#fff5cc', state.completedQuests.has('gift_bedroom'));
        },
      });
    } else if (room.id === 'dressing') {
      const Wardrobe = window.SB.Wardrobe;
      const curLook = Wardrobe && Wardrobe.getLook ? Wardrobe.getLook() : null;

      // 1. Left L-Shaped Cream-Pink Glass Wardrobe (upper cols 1..4 rows 3..4 + wing cols 1..2 rows 5..7)
      drawables.push({
        sortY: 160,
        draw(ctx) {
          px(ctx, 34, 154, 124, 6, 'rgba(30, 12, 4, 0.18)');
          outlinedBox(ctx, 34, 46, 124, 112, '#fff3f7', '#7a4459');
          px(ctx, 32, 42, 128, 7, '#f59eb6');
          drawMiniHeart(ctx, 96, 44, '#ffffff');
          // Left Glass Showcase: Hanging Outfits!
          outlinedBox(ctx, 40, 54, 54, 72, '#e6f5fc', '#b8768c');
          px(ctx, 42, 56, 50, 4, '#ffe69e'); // Closet strip LED glow
          px(ctx, 43, 62, 48, 2, '#d49a4c'); // Brass hanger rail
          // Mini hangers matching the real wardrobe outfits!
          const hangers = [
            { x: 47, col: curLook && curLook.outfit === 'classic' ? '#ffffff' : '#f4f8ff', hem: '#535868' },
            { x: 59, col: '#ff85a6', hem: '#ffeef3' },
            { x: 71, col: '#fff1dc', hem: '#cf9578' },
            { x: 83, col: '#c7a4f5', hem: '#f6eeff' },
          ];
          hangers.forEach((h) => {
            px(ctx, h.x + 2, 64, 2, 3, '#b88346');
            px(ctx, h.x - 1, 67, 8, 18, h.col);
            px(ctx, h.x - 2, 85, 10, 10, h.hem);
          });
          px(ctx, 45, 112, 14, 10, '#ffb8cb'); px(ctx, 64, 112, 16, 10, '#fff7f0'); // Folded sweaters
          // Right Glass Door: Pink Bunny Pajamas + Folded Knitwear + Rose Gold Handles
          outlinedBox(ctx, 98, 54, 54, 72, '#ffdde8', '#b8768c');
          px(ctx, 102, 58, 46, 36, '#e6f5fc');
          px(ctx, 106, 62, 16, 26, '#ffa8c2'); // Bunny pajama set
          px(ctx, 126, 64, 16, 24, '#ffd4e3'); // Tweed jacket
          px(ctx, 91, 88, 3, 8, '#ffd257'); px(ctx, 100, 88, 3, 8, '#ffd257');
          // Bottom drawers
          outlinedBox(ctx, 40, 130, 54, 22, '#f7c1d1', '#b8768c');
          px(ctx, 62, 140, 10, 2, '#ffd257');
          outlinedBox(ctx, 98, 130, 54, 22, '#f7c1d1', '#b8768c');
          px(ctx, 120, 140, 10, 2, '#ffd257');
        },
      });
      // Left Wardrobe Side Wing (cols 1..2, rows 5..7 -> x: 34..94, y: 158..252)
      drawables.push({
        sortY: 254,
        draw(ctx) {
          px(ctx, 34, 246, 60, 6, 'rgba(30, 12, 4, 0.2)');
          outlinedBox(ctx, 34, 158, 60, 92, '#fff3f7', '#7a4459');
          outlinedBox(ctx, 40, 164, 48, 52, '#e6f5fc', '#b8768c');
          px(ctx, 43, 168, 42, 2, '#d49a4c');
          px(ctx, 46, 170, 10, 26, '#ff98b6');
          px(ctx, 59, 170, 10, 26, '#90d4ee');
          px(ctx, 72, 170, 10, 26, '#c59bf0');
          outlinedBox(ctx, 40, 220, 48, 24, '#f7c1d1', '#b8768c');
          px(ctx, 58, 231, 12, 2, '#ffd257');
        },
      });

      // 2. Center Hollywood Vanity Desk (cols 6..9, row 3 -> x: 192..320, y: 88..130)
      drawables.push({
        sortY: 132,
        draw(ctx) {
          px(ctx, 194, 125, 124, 6, 'rgba(30, 12, 4, 0.2)');
          outlinedBox(ctx, 194, 92, 124, 34, '#f8bfd0', '#7a3f54');
          px(ctx, 196, 94, 120, 10, '#fff9f5'); // Marble tabletop
          drawLaceTrim(ctx, 198, 105, 116, '#ffffff');
          // Two vanity drawers w/ brass knobs
          outlinedBox(ctx, 200, 110, 52, 12, '#ffdbe6', '#b86e8a');
          px(ctx, 223, 115, 6, 2, '#ffd257');
          outlinedBox(ctx, 260, 110, 52, 12, '#ffdbe6', '#b86e8a');
          px(ctx, 283, 115, 6, 2, '#ffd257');
          // Tabletop cosmetics: perfume, blush, lipsticks, hairbrush & yellow heart clip tray
          px(ctx, 204, 86, 8, 10, '#d9b5ff'); px(ctx, 206, 83, 4, 3, '#ffd257');
          px(ctx, 216, 88, 6, 8, '#ff7399');
          px(ctx, 226, 90, 10, 6, '#ffc2d2'); // Cushion compact
          px(ctx, 278, 86, 6, 10, '#f5a8c8'); // Brush cup
          px(ctx, 288, 89, 14, 7, '#ffd447'); // Signature yellow heart hairclip!
          px(ctx, 306, 86, 7, 10, '#ff85a6'); // Rose spray
        },
      });

      // Center Velvet Bow Stool (under Vanity, sortY 136 < seated sit_vanity 144)
      drawables.push({
        sortY: 136,
        draw(ctx) {
          px(ctx, 241, 145, 30, 5, 'rgba(30, 12, 4, 0.2)');
          outlinedBox(ctx, 240, 130, 32, 16, '#ff8fab', '#7a3f54');
          px(ctx, 244, 132, 24, 8, '#ffc7d8');
          drawMiniHeart(ctx, 256, 140, '#ffffff');
        },
      });

      // 3. Right Cream-Pink Hairstyle & Boutique Wardrobe (cols 11..14, rows 3..4 -> x: 352..478, y: 46..158)
      drawables.push({
        sortY: 160,
        draw(ctx) {
          px(ctx, 354, 154, 124, 6, 'rgba(30, 12, 4, 0.18)');
          outlinedBox(ctx, 354, 46, 124, 112, '#fff3f7', '#7a4459');
          px(ctx, 352, 42, 128, 7, '#f59eb6');
          drawMiniHeart(ctx, 416, 44, '#ffffff');
          // Left Glass Showcase: Styling Wig Heads (straight / twintails / buns!)
          outlinedBox(ctx, 360, 54, 54, 72, '#e6f5fc', '#b8768c');
          px(ctx, 362, 56, 50, 4, '#ffe69e');
          // Upper shelf hair mannequins
          px(ctx, 367, 65, 12, 16, '#5c3c2e'); px(ctx, 370, 81, 6, 4, '#ffd7c2');
          px(ctx, 385, 62, 14, 16, '#f69eb6'); px(ctx, 389, 81, 6, 4, '#ffd7c2');
          px(ctx, 364, 86, 46, 3, '#d4a6b8');
          // Lower shelf party dresses + pastel crown/bow tray
          px(ctx, 368, 92, 14, 24, '#ffd4e3');
          px(ctx, 388, 92, 16, 24, '#c59bf0');
          px(ctx, 396, 89, 10, 5, '#ffd447'); // Crown preview
          // Right Glass Door: Jewelry & Handbag Showcase
          outlinedBox(ctx, 418, 54, 54, 72, '#ffdde8', '#b8768c');
          px(ctx, 422, 58, 46, 32, '#e6f5fc');
          px(ctx, 426, 66, 14, 12, '#ff85a6'); // Pink bow bag
          px(ctx, 446, 66, 16, 12, '#ffe066'); // Star clutch & clips
          px(ctx, 426, 94, 38, 12, '#ffffff'); // Pearl jewelry tray
          px(ctx, 411, 88, 3, 8, '#ffd257'); px(ctx, 420, 88, 3, 8, '#ffd257');
          outlinedBox(ctx, 360, 130, 54, 22, '#f7c1d1', '#b8768c');
          px(ctx, 382, 140, 10, 2, '#ffd257');
          outlinedBox(ctx, 418, 130, 54, 22, '#f7c1d1', '#b8768c');
          px(ctx, 440, 140, 10, 2, '#ffd257');
        },
      });

      // 4. Bottom-Left Full-Length Gold Arch Mirror & Lavender Pouf (cols 1..2, rows 9..10 -> x: 36..102, y: 266..346)
      drawables.push({
        sortY: 344,
        draw(ctx) {
          px(ctx, 38, 340, 40, 6, 'rgba(30, 12, 4, 0.22)');
          px(ctx, 40, 336, 6, 10, '#c8923f'); px(ctx, 70, 336, 6, 10, '#c8923f');
          roundedBox(ctx, 40, 268, 36, 72, 10, '#f3c158', '#7a4a18');
          roundedBox(ctx, 45, 273, 26, 62, 7, '#cceaf7', '#b58438');
          // Subtle miniature reflection of current dressed-up protagonist in the full-length mirror!
          if (Wardrobe && Wardrobe.isReady && Wardrobe.isReady('front')) {
            const refl = Wardrobe.getViewCanvas('front');
            if (refl) {
              ctx.save();
              ctx.globalAlpha = 0.42;
              ctx.drawImage(refl, 46, 286, 24, 36);
              ctx.restore();
            }
          }
          px(ctx, 48, 278, 7, 22, 'rgba(255,255,255,0.58)');
          drawMiniHeart(ctx, 58, 267, '#ff7396');
          // Tufted lavender velvet pouf beside mirror
          px(ctx, 79, 340, 24, 4, 'rgba(30, 12, 4, 0.18)');
          roundedBox(ctx, 78, 318, 26, 24, 8, '#cfaaf5', '#6b498c');
          px(ctx, 82, 321, 18, 8, '#e8d4ff');
        },
      });

      // 5. Bottom-Right Velvet Shoe Bench & Accessory Rack (cols 11..13, rows 9..10 -> x: 352..448, y: 288..346)
      drawables.push({
        sortY: 346,
        draw(ctx) {
          px(ctx, 354, 340, 92, 6, 'rgba(30, 12, 4, 0.2)');
          // Tufted pink ottoman seat & wood legs
          px(ctx, 358, 336, 6, 10, '#a66b46'); px(ctx, 436, 336, 6, 10, '#a66b46');
          outlinedBox(ctx, 354, 294, 92, 44, '#fff4f8', '#7a4459');
          outlinedBox(ctx, 354, 290, 92, 16, '#ffa8c4', '#7a3f54'); // Plush velvet cushion
          px(ctx, 358, 293, 84, 6, '#ffd2e1');
          // Handbags & Accessory boxes displayed on cushion edge / shelf below
          px(ctx, 362, 284, 14, 10, '#ff7399'); px(ctx, 366, 280, 6, 4, '#ffe6a3'); // Pink bag
          px(ctx, 384, 285, 16, 9, '#ffe066'); // Yellow heart jewelry box
          px(ctx, 424, 284, 14, 10, '#c59bf0'); // Lavender bag
          // Lower shoe rack shelf
          px(ctx, 360, 312, 80, 20, '#ffdde8');
          px(ctx, 366, 320, 12, 6, '#6b3b24'); // Mary Janes
          px(ctx, 386, 320, 14, 6, '#ff85a6'); // Pink slippers
          px(ctx, 408, 320, 12, 6, '#fff7f0'); // Cream loafers
          px(ctx, 426, 320, 10, 6, '#c59bf0'); // Lilac flats
        },
      });

      drawables.push({
        sortY: 350,
        draw(ctx) {
          drawHiddenGiftBox(ctx, 130, 320, time, '#ffb7cb', '#ff4d79', state.completedQuests.has('gift_dressing'));
        },
      });
    } else if (room.id === 'bathroom') {
      // 1. Smart Ceramic Toilet + Toilet Brush + Cute Bear Step Stool + Pink Strawberry Bin (cols 1..3, rows 3..4)
      drawables.push({
        sortY: 156,
        draw(ctx) {
          // Toilet brush holder (x: 42..53)
          outlinedBox(ctx, 42, 118, 10, 22, '#f2eef0', '#8f8f99');
          px(ctx, 46, 108, 2, 12, '#cbbba8');
          // Smart Toilet porcelain shadow & tank (x: 56..98, y: 90..146)
          px(ctx, 56, 138, 42, 7, 'rgba(35, 38, 48, 0.16)');
          roundedBox(ctx, 60, 88, 34, 18, 5, '#ffffff', '#8f929b');
          px(ctx, 73, 91, 8, 3, '#c9d4de'); // chrome flush bar
          // Open toilet lid with cute roll-paper Hello Kitty sticker (y: 96..118)
          outlinedBox(ctx, 64, 96, 26, 20, '#fdf9fb', '#9ca0a9');
          px(ctx, 71, 101, 12, 10, '#ffffff');
          px(ctx, 74, 104, 2, 2, '#4a3b40'); px(ctx, 79, 104, 2, 2, '#4a3b40');
          px(ctx, 79, 100, 5, 3, '#ff6896');
          // Sculpted oval seat & clear pale-blue water basin
          roundedBox(ctx, 58, 114, 38, 30, 12, '#ffffff', '#9498a2');
          ctx.save();
          ctx.fillStyle = '#e8edf2';
          ctx.beginPath(); ctx.ellipse(77, 128, 13, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#bfe7f7';
          ctx.beginPath(); ctx.ellipse(77, 130, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
          // Cream bear-face step stool tucked neatly in front of toilet (x: 58..96, y: 145..158)
          roundedBox(ctx, 58, 145, 38, 13, 4, '#f7f2eb', '#9c9288');
          px(ctx, 69, 149, 5, 4, '#b89474'); px(ctx, 81, 149, 5, 4, '#b89474');
          px(ctx, 76, 151, 2, 2, '#4a3b40');
          // Pink strawberry dome trash bin to right of toilet (x: 103..122, y: 120..148)
          roundedBox(ctx, 103, 124, 19, 24, 5, '#ffb7cb', '#9e6278');
          roundedBox(ctx, 104, 119, 17, 7, 3, '#ff88ab', '#9e6278');
          px(ctx, 111, 133, 4, 4, '#ff4d6d');
        },
      });

      // 2. Floating Matte-White Vanity Sink + Pink Sanrio Toiletries + Black Fluted Cabinet Door (cols 4..7, rows 3..4)
      drawables.push({
        sortY: 152,
        draw(ctx) {
          // Soft wall-hung floating shadow beneath cabinet
          px(ctx, 138, 145, 110, 5, 'rgba(35, 38, 48, 0.18)');
          // Floating white cabinet body (left 2 drawers + right black-framed fluted glass door)
          outlinedBox(ctx, 134, 104, 118, 41, '#ffffff', '#8f929b');
          px(ctx, 136, 124, 72, 1, '#dcdde2'); // drawer divider
          px(ctx, 162, 114, 18, 2, '#b6b8c2');
          px(ctx, 162, 134, 18, 2, '#b6b8c2');
          // Right black-framed vertical reeded glass cabinet section (x: 210..248, y: 107..141)
          outlinedBox(ctx, 210, 107, 38, 35, '#3b424c', '#1c1d22');
          px(ctx, 215, 124, 10, 14, '#e6f2f8');
          px(ctx, 228, 118, 14, 20, '#ffdbe6');
          for (let rx = 213; rx < 246; rx += 4) {
            px(ctx, rx, 109, 1, 31, 'rgba(255,255,255,0.28)');
          }

          // Top integrated porcelain sink slab & recessed basin (y: 88..106)
          outlinedBox(ctx, 132, 88, 122, 18, '#fdf9fb', '#9ca0a9');
          roundedBox(ctx, 152, 91, 66, 12, 5, '#e8f1f5', '#b4bec4');
          // Chrome arched faucet
          px(ctx, 183, 82, 4, 11, '#b8cad9');
          px(ctx, 179, 82, 6, 3, '#d7e3ea');

          // Packed cute pink countertop toiletries (matching media_1795170249416_a43e350c.jpg!)
          outlinedBox(ctx, 135, 79, 10, 11, '#ff9fbc', '#9e5e74'); // pink bow cotton pad box
          px(ctx, 148, 76, 8, 14, '#ff7ca6'); // tall My Melody sanitizer bottle
          px(ctx, 150, 72, 4, 4, '#ffd6e2');
          px(ctx, 198, 80, 6, 10, '#fff7ee'); // bear soap pump
          px(ctx, 206, 79, 7, 11, '#ffaac4'); // Hello Kitty toothbrush cup
          px(ctx, 208, 74, 2, 5, '#8ed3eb');
          outlinedBox(ctx, 224, 77, 24, 14, '#ffb7cb', '#9e5e74'); // 3-drawer pink organizer
          px(ctx, 226, 82, 20, 1, '#fff0f5');
          px(ctx, 226, 86, 20, 1, '#fff0f5');
        },
      });

      // 3. Slim Black-Framed Frosted Fluted Glass Dry/Wet Partition (col 9, rows 3..6 -> x: 296..308, y: 76..222)
      drawables.push({
        sortY: 222,
        draw(ctx) {
          ctx.save();
          // Outer charcoal slim aluminum frame
          ctx.fillStyle = '#2b2d34';
          ctx.fillRect(297, 74, 10, 148);
          // Translucent frosted glass core
          ctx.fillStyle = 'rgba(222, 238, 246, 0.78)';
          ctx.fillRect(299, 76, 6, 144);
          // Vertical reeded glass ribs
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.fillRect(300, 76, 2, 144);
          ctx.fillRect(303, 76, 1, 144);
          ctx.restore();
        },
      });

      // 4. Animated Walk-in Rain Shower Streams (when showerRunning or active shower)
      drawables.push({
        sortY: 205,
        draw(ctx) {
          const pouring = state.showerRunning || (state.playerActivity && state.playerActivity.type === 'shower');
          if (!pouring) return;
          ctx.save();
          for (let sx = 376; sx < 409; sx += 5) {
            const dropOff = (Math.floor(time * 28) + sx * 3) % 18;
            ctx.fillStyle = 'rgba(176, 232, 252, 0.65)';
            for (let sy = 34 + dropOff; sy < 172; sy += 22) {
              ctx.fillRect(sx, sy, 2, 9);
            }
          }
          // Floor splash ring around drain
          const r = 8 + (time * 18) % 10;
          ctx.strokeStyle = 'rgba(210, 244, 255, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(392, 172, r * 1.4, r * 0.6, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        },
      });

      // 5. Deep Soaking Strawberry Bubble Bathtub + Wooden Caddy + Rubber Ducky (cols 10..14, rows 8..10)
      drawables.push({
        sortY: 348,
        draw(ctx) {
          px(ctx, 318, 340, 152, 8, 'rgba(35, 38, 48, 0.22)');
          // Sculpted rounded porcelain bathtub shell (x: 314..470, y: 256..344)
          roundedBox(ctx, 314, 256, 156, 88, 24, '#ffffff', '#9498a2');
          // Tub pink-tinted rim & warm bubbly water interior
          ctx.save();
          ctx.fillStyle = '#fceef3';
          ctx.beginPath(); ctx.ellipse(392, 290, 70, 25, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#dfb8c6'; ctx.lineWidth = 2; ctx.stroke();

          ctx.fillStyle = '#bcecf7';
          ctx.beginPath(); ctx.ellipse(392, 291, 63, 20, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#daf6fb';
          ctx.beginPath(); ctx.ellipse(392, 287, 56, 14, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();

          // Standing brass/chrome tub filler tap on right rim
          px(ctx, 460, 266, 4, 34, '#b8cad9');
          px(ctx, 450, 265, 12, 4, '#d7e3ea');

          // Bobbing foam mounds + rubber ducky
          const bShift = Math.round(Math.sin(time * 2.8) * 1.5);
          [[336, 282], [354, 276], [376, 284], [398, 278], [418, 284], [438, 280]].forEach(([bx, by], idx) => {
            roundedBox(ctx, bx, by + (idx % 2 === 0 ? bShift : -bShift), 15, 10, 5, '#ffffff', '#e4eff5');
          });
          // Yellow rubber ducky
          px(ctx, 342, 277 + bShift, 11, 9, '#ffe066');
          px(ctx, 351, 280 + bShift, 4, 3, '#ff8833');
          px(ctx, 347, 279 + bShift, 2, 2, '#3a1e10');

          // Across-tub wooden caddy tray + scented candle & pink teacup (x: 416..446, y: 266..316)
          outlinedBox(ctx, 418, 266, 26, 48, '#e3be96', '#8f623d');
          outlinedBox(ctx, 424, 276, 14, 12, '#ffb7cb', '#9e5e74'); // candle jar
          px(ctx, 430, 271 + (Math.sin(time * 10) > 0 ? 0 : 1), 2, 4, '#ffa834');
          outlinedBox(ctx, 425, 294, 12, 12, '#fff7f0', '#b88592');
          px(ctx, 428, 297, 6, 6, '#ff8fab');

          // Cute pink heart emblem on tub front wall
          drawMiniHeart(ctx, 392, 326, '#f7b2c4');
        },
      });

      // 6. Bottom-Left Pink Woven Laundry Hamper & Plush Bunny Slippers (cols 1..2, row 10)
      drawables.push({
        sortY: 346,
        draw(ctx) {
          px(ctx, 38, 340, 32, 6, 'rgba(35, 38, 48, 0.16)');
          outlinedBox(ctx, 38, 308, 32, 34, '#ffc6d8', '#9e6278');
          px(ctx, 40, 304, 28, 5, '#ff9fbc');
          drawMiniHeart(ctx, 54, 324, '#ffffff');
          // Fluffy pink indoor slippers placed beside hamper
          roundedBox(ctx, 76, 328, 12, 16, 4, '#ffd6e2', '#b0758a');
          roundedBox(ctx, 90, 328, 12, 16, 4, '#ffd6e2', '#b0758a');
        },
      });

      drawables.push({
        sortY: 350,
        draw(ctx) {
          drawHiddenGiftBox(ctx, 98, 320, time, '#85d2e8', '#fff7e0', state.completedQuests.has('gift_bathroom'));
        },
      });
    } else if (room.id === 'study') {
      const lampOn = state.studyLampOn !== false;

      // 1. French Arched Tall Cream Bookshelf & Blind-Box Display (cols 1..4, rows 3..4 -> x: 36..156, y: 66..158)
      drawables.push({
        sortY: 158,
        draw(ctx) {
          px(ctx, 36, 152, 120, 8, 'rgba(40, 24, 20, 0.18)');
          roundedBox(ctx, 36, 66, 120, 90, 14, '#fff7ef', '#9c7860');
          // 3 recessed warm oak shelves
          px(ctx, 44, 76, 104, 20, '#ead8c8');
          px(ctx, 44, 100, 104, 20, '#ead8c8');
          px(ctx, 44, 124, 104, 26, '#f5e7da');
          // Lower French cabinet doors w/ rose-gold knobs
          outlinedBox(ctx, 44, 124, 50, 26, '#fffaf5', '#cbb4a2');
          outlinedBox(ctx, 98, 124, 50, 26, '#fffaf5', '#cbb4a2');
          px(ctx, 88, 136, 4, 4, '#e0b060'); px(ctx, 102, 136, 4, 4, '#e0b060');
          // Pastel books & blind-box figurines on shelves
          const bCols = ['#ff9ebb', '#ffe066', '#8cc9eb', '#a6d99c', '#c8a2f0', '#f7b29c'];
          for (let b = 0; b < 11; b++) {
            px(ctx, 47 + b * 7, 79 + (b % 2), 5, 16 - (b % 2), bCols[b % bCols.length]);
            px(ctx, 47 + b * 7, 103 + ((b + 1) % 2), 5, 16 - ((b + 1) % 2), bCols[(b + 2) % bCols.length]);
          }
          // Cute pink bunny & cream bear blind-box figurines on right side of shelves
          px(ctx, 128, 82, 12, 12, '#ffb7cb'); px(ctx, 130, 77, 3, 6, '#ffb7cb'); px(ctx, 135, 77, 3, 6, '#ffb7cb');
          px(ctx, 130, 106, 12, 12, '#d9a06e'); px(ctx, 130, 103, 4, 4, '#d9a06e'); px(ctx, 138, 103, 4, 4, '#d9a06e');
          // Trailing potted ivy & glass snow globe on top of bookcase
          px(ctx, 48, 56, 12, 12, '#bde8f8'); px(ctx, 49, 64, 10, 4, '#ff85a6');
          px(ctx, 134, 58, 14, 10, '#6db567'); px(ctx, 142, 66, 6, 16, '#84cc7e');
        },
      });

      // 2. Wide Sunlit French Cream Writing & Birthday Letter Desk (cols 11..16, rows 3..4 -> x: 356..536, y: 88..158)
      drawables.push({
        sortY: 158,
        draw(ctx) {
          px(ctx, 356, 150, 180, 9, 'rgba(40, 24, 20, 0.2)');
          // Cream-wood French writing desk
          outlinedBox(ctx, 356, 96, 180, 56, '#fff7ef', '#9c7860');
          px(ctx, 358, 98, 176, 26, '#f5e4d4');
          // Left & right drawers w/ brass handles
          outlinedBox(ctx, 362, 128, 46, 18, '#fffaf5', '#cbb4a2');
          outlinedBox(ctx, 484, 128, 46, 18, '#fffaf5', '#cbb4a2');
          px(ctx, 380, 135, 10, 3, '#e0b060'); px(ctx, 502, 135, 10, 3, '#e0b060');
          // Pink leather desk mat in center
          roundedBox(ctx, 412, 100, 68, 22, 4, '#ffd6e2', '#d48ca3');

          // Glowing wax-sealed Birthday Letter (questId: 'letter')
          outlinedBox(ctx, 428, 103, 34, 17, '#fff9e6', '#c9a66b');
          px(ctx, 442, 109, 6, 6, '#e34b52');
          if (!state.completedQuests.has('letter') && Math.sin(time * 5) > 0.3) {
            px(ctx, 444, 111, 2, 2, '#fff8bf');
          }

          // Left side of desk: Warm Pleated Cream Desk Lamp + Pen Cup
          if (lampOn) {
            ctx.fillStyle = 'rgba(255, 232, 158, 0.28)';
            ctx.beginPath();
            ctx.arc(378, 96, 24, 0, Math.PI * 2);
            ctx.fill();
          }
          px(ctx, 375, 94, 6, 14, '#e0b060');
          outlinedBox(ctx, 366, 80, 24, 15, lampOn ? '#fff2c2' : '#f2e8dc', '#b88a5a');
          // Pastel pen cup & washi tapes
          outlinedBox(ctx, 394, 98, 12, 12, '#ff9ebb', '#a6526d');
          px(ctx, 397, 92, 2, 7, '#ffe066'); px(ctx, 401, 93, 2, 6, '#85d2e8');

          // Right side of desk: Open Sticker Journal + Ceramic Sunflower Vase
          outlinedBox(ctx, 486, 101, 22, 16, '#fffaf0', '#c9a684');
          px(ctx, 496, 102, 2, 14, '#e0b090');
          px(ctx, 489, 105, 5, 5, '#ff85a6'); px(ctx, 500, 106, 5, 5, '#a6d99c');
          // Ceramic sunflower vase
          outlinedBox(ctx, 514, 98, 14, 14, '#fff5ec', '#bfa392');
          px(ctx, 520, 88, 3, 10, '#4d8c44');
          px(ctx, 515, 79, 13, 11, '#ffd43b'); px(ctx, 518, 82, 7, 6, '#6e3b1e');

          // Cream bouclé swivel study chair tucked in front of desk
          roundedBox(ctx, 430, 146, 32, 16, 6, '#fff2f5', '#b8768c');
          px(ctx, 436, 150, 20, 8, '#ffd6e2');
        },
      });

      // 3. Left-Wall Pastel Painting Easel & Rolling Pink Stationery Cart (cols 1..2, rows 6..8 -> x: 34..92, y: 192..288)
      drawables.push({
        sortY: 286,
        draw(ctx) {
          // Wooden artist easel w/ cherry-blossom mini canvas (y: 192..246)
          px(ctx, 42, 240, 42, 6, 'rgba(40, 24, 20, 0.16)');
          px(ctx, 48, 226, 4, 18, '#a6744c'); px(ctx, 74, 226, 4, 18, '#a6744c'); px(ctx, 61, 192, 4, 48, '#8c5d38');
          outlinedBox(ctx, 42, 196, 42, 32, '#fff9f2', '#9c6e4b');
          // Mini pastel sakura & sky painting on canvas!
          px(ctx, 45, 199, 36, 16, '#cde8ff');
          px(ctx, 45, 215, 36, 10, '#b8e0b0');
          px(ctx, 52, 204, 12, 10, '#ffb7cb'); px(ctx, 66, 207, 10, 8, '#ff9ebb');
          px(ctx, 57, 214, 3, 7, '#8c5a3c');

          // Rolling pink 3-tier stationery & washi-tape cart (y: 250..286)
          px(ctx, 36, 280, 52, 7, 'rgba(40, 24, 20, 0.18)');
          outlinedBox(ctx, 36, 252, 52, 30, '#ffd6e2', '#a6526d');
          px(ctx, 40, 282, 5, 4, '#47424a'); px(ctx, 79, 282, 5, 4, '#47424a');
          // Colorful markers, sticker sheets & pastel washi tape rolls!
          px(ctx, 40, 246, 8, 8, '#ff7aa2'); px(ctx, 50, 245, 8, 9, '#ffe066');
          px(ctx, 60, 246, 8, 8, '#8cc9eb'); px(ctx, 70, 247, 14, 7, '#fff7e8');
        },
      });

      // 4. Bottom-Left Plush Dusty-Pink Reading Chaise + Arched Floor Lamp + Chamomile Tea Table (cols 1..5, rows 9..11)
      drawables.push({
        sortY: 334,
        draw(ctx) {
          // Tall brass & cream arched floor lamp behind reading sofa (x: 36..62, y: 274..352)
          if (lampOn) {
            ctx.fillStyle = 'rgba(255, 236, 174, 0.25)';
            ctx.beginPath();
            ctx.arc(62, 300, 32, 0, Math.PI * 2);
            ctx.fill();
          }
          px(ctx, 42, 284, 4, 68, '#d9ab5b');
          px(ctx, 42, 282, 22, 4, '#d9ab5b');
          outlinedBox(ctx, 52, 286, 22, 14, lampOn ? '#fff2c2' : '#f2e8dc', '#b88a5a');

          // Plush dusty-pink tufted reading chaise (x: 54..142, y: 316..374)
          px(ctx, 54, 368, 88, 8, 'rgba(40, 24, 20, 0.2)');
          roundedBox(ctx, 54, 316, 88, 56, 12, '#f2a8be', '#9e546d');
          roundedBox(ctx, 62, 328, 72, 38, 8, '#ffc4d6', '#d47c98');
          // Yellow star pillow & soft cream knit throw
          roundedBox(ctx, 68, 330, 22, 18, 5, '#ffe585', '#c99e32');
          roundedBox(ctx, 104, 334, 24, 26, 5, '#fff5ea', '#cfb5a0');

          // Round cream milk-tea side table (x: 146..190, y: 332..374)
          px(ctx, 148, 368, 40, 7, 'rgba(40, 24, 20, 0.18)');
          roundedBox(ctx, 146, 336, 44, 34, 10, '#fff9f2', '#a67b5b');
          // Steaming chamomile teacup, open storybook & warm candle
          outlinedBox(ctx, 152, 328, 14, 12, '#ffb7cb', '#9e4c68');
          px(ctx, 155, 330, 8, 5, '#ffe085');
          outlinedBox(ctx, 170, 332, 14, 11, '#fff5d8', '#b88a5a');
        },
      });

      // 5. Bottom-Center Low Cream Vinyl Record Console & Potted Plant (cols 7..10, row 11 -> x: 226..348, y: 344..382)
      drawables.push({
        sortY: 382,
        draw(ctx) {
          px(ctx, 226, 376, 122, 7, 'rgba(40, 24, 20, 0.2)');
          outlinedBox(ctx, 226, 350, 122, 30, '#fff7ef', '#9c7860');
          px(ctx, 228, 352, 118, 8, '#f0d8c4');
          // Pastel pink suitcase vinyl turntable (spinning record!)
          outlinedBox(ctx, 236, 336, 42, 22, '#ffa3c0', '#9e4c68');
          ctx.fillStyle = '#2b262e';
          ctx.beginPath();
          ctx.arc(255, 347, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ff9ebb';
          ctx.beginPath();
          ctx.arc(255, 347, 3, 0, Math.PI * 2);
          ctx.fill();
          const armSwing = Math.sin(time * 4) * 0.8;
          px(ctx, 268, 340 + armSwing, 2, 10, '#e0e6ed');
          // Stacked aesthetic magazines & tulip vase
          outlinedBox(ctx, 286, 344, 24, 12, '#ffe066', '#b88a32');
          outlinedBox(ctx, 288, 340, 20, 6, '#c8a2f0', '#7a52a6');
          // Mini potted green plant on right end of console
          outlinedBox(ctx, 320, 344, 18, 14, '#f5d2b3', '#9c6e4b');
          px(ctx, 318, 330, 22, 16, '#6db567'); px(ctx, 324, 324, 12, 10, '#88cf82');
        },
      });

      // 6. Bottom-Right Birthday Treasure Chest, Ribbon Gift Mountain & Balloons (cols 12..16, rows 9..11)
      drawables.push({
        sortY: 376,
        draw(ctx) {
          px(ctx, 390, 368, 114, 9, 'rgba(30, 12, 4, 0.24)');
          outlinedBox(ctx, 394, 326, 48, 42, '#a65c2e', '#592b12');
          px(ctx, 396, 332, 44, 4, '#ffd24d');
          if (state.giftsOpenedCount > 0) {
            outlinedBox(ctx, 394, 310, 48, 16, '#874521', '#592b12');
            px(ctx, 398, 326, 40, 8, '#ffde59');
          } else {
            outlinedBox(ctx, 394, 320, 48, 14, '#b36332', '#592b12');
          }
          px(ctx, 414, 330, 8, 10, '#ffd24d');
          // Ribbon-wrapped birthday gift boxes
          outlinedBox(ctx, 448, 332, 30, 30, '#ff85a6', '#9e3656');
          px(ctx, 461, 333, 4, 28, '#ffe066'); px(ctx, 449, 345, 28, 4, '#ffe066');
          outlinedBox(ctx, 478, 340, 26, 24, '#73bce8', '#2d5c85');
          px(ctx, 489, 341, 4, 22, '#fff7e0'); px(ctx, 479, 350, 24, 4, '#fff7e0');
          outlinedBox(ctx, 454, 304, 24, 24, '#c8a2f0', '#6d4794');
          px(ctx, 464, 305, 4, 22, '#fff7e0'); px(ctx, 455, 314, 22, 4, '#fff7e0');
          // Pastel birthday balloon basket right beside gifts
          drawBalloonBasket(ctx, 512, 344, time, 0.8);
        },
      });
    } else if (room.id === 'kitchen') {
      const cookState = window.SB.Cooking ? window.SB.Cooking.getState() : null;
      const isCookingPose = state && state.playerActivity && state.playerActivity.type === 'cook';
      const isWashingPose = state && state.playerActivity && state.playerActivity.type === 'wash_veggies';

      // 1. L-Shaped Stainless Steel Sink & Prep Counter + Glossy Cabinets w/ Sanrio Stickers (cols 1..4, rows 3..4 + cols 1..2, row 5)
      drawables.push({
        sortY: 162,
        draw(ctx) {
          // Base cabinet shadow & glossy light-grey cabinet doors
          px(ctx, 32, 154, 128, 8, 'rgba(40, 24, 28, 0.16)');
          outlinedBox(ctx, 32, 118, 128, 42, '#eae6e3', '#968b86');
          px(ctx, 95, 120, 2, 38, '#c5bbb6');
          // Glossy cabinet pink Melody head sticker & Kitty poster!
          outlinedBox(ctx, 48, 128, 30, 22, '#ffb7cb', '#d46a8c');
          px(ctx, 54, 134, 18, 12, '#fff8fa');
          px(ctx, 59, 138, 2, 2, '#3d2a30'); px(ctx, 65, 138, 2, 2, '#3d2a30');
          outlinedBox(ctx, 110, 125, 34, 28, '#ffc2d4', '#d46a8c');
          px(ctx, 118, 132, 18, 14, '#ffffff');
          px(ctx, 128, 131, 6, 4, '#ff4d6d');

          // Brushed stainless steel countertop (x: 32..160, y: 92..122)
          outlinedBox(ctx, 32, 92, 128, 30, '#cfd5dc', '#7d858f');
          px(ctx, 34, 94, 124, 4, '#ebeff4');

          // Deep stainless steel sink basin (x: 38..94, y: 96..118)
          outlinedBox(ctx, 38, 96, 56, 22, '#9fa8b3', '#606873');
          px(ctx, 42, 100, 48, 15, isWashingPose ? '#8cd6f5' : '#b7c1cc');
          if (isWashingPose) {
            const ripple = Math.sin(time * 10) * 3;
            px(ctx, 52 + ripple, 105, 14, 3, '#e8f9ff');
            px(ctx, 64, 96, 4, 10, '#a8e6ff'); // Running water stream!
          }
          // Matte-black goose-neck faucet
          px(ctx, 64, 78, 4, 20, '#333138');
          px(ctx, 64, 78, 10, 4, '#333138');
          px(ctx, 72, 80, 3, 6, '#333138');

          // Dish drying rack & Pink Hello Kitty / Melody bowls (x: 98..154, y: 92..118)
          outlinedBox(ctx, 98, 94, 54, 22, '#e3e8ee', '#8c96a1');
          for (let rx = 102; rx < 148; rx += 6) px(ctx, rx, 96, 2, 18, '#b5bec8');
          // Pink Hello Kitty bowl w/ red bow
          outlinedBox(ctx, 102, 96, 22, 16, '#ffa3c0', '#b85c78');
          px(ctx, 106, 98, 14, 8, '#fff7fa');
          px(ctx, 114, 104, 5, 3, '#ff4d6d');
          // Pink Melody tumbler & dish soap bottle
          outlinedBox(ctx, 130, 90, 11, 22, '#ffb7cb', '#b85c78');
          px(ctx, 132, 87, 7, 4, '#fff8fa');
          outlinedBox(ctx, 144, 94, 8, 16, '#a8e3dc', '#5d946e');
        },
      });

      // 1b. Left L-Return Counter w/ Wooden Cutting Board & Fresh Prepped Veggies (cols 1..2, row 5 -> x: 32..96, y: 154..194)
      drawables.push({
        sortY: 194,
        draw(ctx) {
          px(ctx, 32, 188, 64, 8, 'rgba(40, 24, 28, 0.16)');
          outlinedBox(ctx, 32, 158, 64, 34, '#eae6e3', '#968b86');
          outlinedBox(ctx, 32, 146, 64, 20, '#cfd5dc', '#7d858f');
          px(ctx, 34, 148, 60, 3, '#ebeff4');
          // Warm wooden cutting board
          outlinedBox(ctx, 40, 148, 46, 15, '#c98e5b', '#7a4b2a');
          px(ctx, 44, 151, 38, 9, '#d9a06e');
          if (cookState && cookState.freshPrepBuff) {
            // Fresh washed chopped veggies ready to cook!
            px(ctx, 48, 152, 8, 6, '#78c978');
            px(ctx, 60, 152, 8, 6, '#ff5d6c');
            px(ctx, 72, 153, 6, 5, '#ffd966');
          } else {
            // Cute pink chef knife resting on board
            px(ctx, 52, 153, 18, 4, '#eef4fa');
            px(ctx, 70, 153, 8, 4, '#ff8eb3');
          }
          // Cute pink Melody cabinet sticker on L-return door
          outlinedBox(ctx, 46, 168, 34, 18, '#ffd4e3', '#c96b88');
          px(ctx, 54, 172, 18, 10, '#fff9fb');
        },
      });

      // 2. 2-Burner Stainless Gas Stove + Cream Enamel Pot & Pink My Melody Casserole Pot (cols 5..9, rows 3..4 -> x: 160..320, y: 88..162)
      drawables.push({
        sortY: 162,
        draw(ctx) {
          px(ctx, 160, 154, 160, 8, 'rgba(40, 24, 28, 0.18)');
          // Glossy white-grey lower cabinets w/ pink Hello Kitty posters (straight from reference photo!)
          outlinedBox(ctx, 160, 118, 160, 42, '#eae6e3', '#968b86');
          px(ctx, 212, 120, 2, 38, '#c5bbb6');
          px(ctx, 266, 120, 2, 38, '#c5bbb6');
          // Poster 1 & Poster 2 (pink Kitty cards)
          outlinedBox(ctx, 172, 124, 28, 30, '#ffb7cb', '#d46a8c');
          px(ctx, 178, 132, 16, 12, '#ffffff'); px(ctx, 186, 130, 5, 4, '#ff4d6d');
          outlinedBox(ctx, 224, 124, 28, 30, '#ffb7cb', '#d46a8c');
          px(ctx, 230, 132, 16, 12, '#ffffff'); px(ctx, 238, 130, 5, 4, '#ff4d6d');
          // Right drawer handle
          px(ctx, 278, 128, 30, 3, '#47424a');
          px(ctx, 278, 144, 30, 3, '#47424a');

          // Brushed stainless steel stovetop counter (x: 160..320, y: 92..122)
          outlinedBox(ctx, 160, 92, 160, 30, '#cfd5dc', '#7d858f');
          px(ctx, 162, 94, 156, 3, '#ebeff4');
          // Pink Melody silicone prep mat on far-right counter edge
          outlinedBox(ctx, 294, 96, 22, 22, '#fff5f8', '#ff9ebb');
          px(ctx, 298, 100, 14, 14, '#ffb7cb');

          // Recessed 2-burner gas cooktop plate (x: 174..290, y: 94..119)
          outlinedBox(ctx, 174, 94, 116, 25, '#dfe5ec', '#7a838e');
          // Cast-iron burner grates
          outlinedBox(ctx, 186, 98, 38, 16, '#36333a', '#1f1d22');
          outlinedBox(ctx, 240, 98, 38, 16, '#36333a', '#1f1d22');
          // Metallic silver rotary knobs
          px(ctx, 228, 111, 5, 5, '#6d7580'); px(ctx, 229, 112, 3, 3, '#eef3f8');
          px(ctx, 235, 111, 5, 5, '#6d7580'); px(ctx, 236, 112, 3, 3, '#eef3f8');

          // Animated gas flame when cooking or gentle simmer flame!
          const flicker = Math.sin(time * 16) > 0 ? 1 : 0;
          if (isCookingPose) {
            px(ctx, 194, 109, 22, 4, '#4db8ff');
            px(ctx, 198 + flicker, 106, 14, 4, '#ff9f43');
            px(ctx, 248, 109, 22, 4, '#4db8ff');
            px(ctx, 252 - flicker, 106, 14, 4, '#ff9f43');
          } else {
            px(ctx, 198, 110, 14, 2, '#62c4ff');
          }

          // LEFT BURNER: Cream-Pink Ombre Enamel Pot w/ Melody Lid Knob (x: 188..224, y: 84..112)
          const boil = Math.sin(time * 7) > 0 ? 0 : 1;
          outlinedBox(ctx, 188, 92, 34, 18, '#ffe6de', '#a66b60');
          px(ctx, 190, 94, 30, 7, '#fff7f0');
          px(ctx, 190, 102, 30, 6, '#f8c4c0');
          px(ctx, 184, 96, 4, 4, '#a66b60'); px(ctx, 222, 96, 4, 4, '#a66b60'); // Side handles
          outlinedBox(ctx, 190, 88 + boil, 30, 6, '#fff9f5', '#a66b60'); // Lid
          px(ctx, 202, 82 + boil, 6, 7, '#ff9ebb'); // Cute Melody figurine lid knob!
          px(ctx, 203, 84 + boil, 4, 3, '#ffffff');

          // RIGHT BURNER: Pink My Melody Bunny-Ear Casserole Pot (x: 242..278, y: 86..112)
          const potBob = isCookingPose ? (Math.sin(time * 14) * 2) : 0;
          outlinedBox(ctx, 242, 93 + potBob, 34, 17, '#ffa3c0', '#a64d68');
          px(ctx, 238, 97 + potBob, 4, 4, '#a64d68'); px(ctx, 276, 97 + potBob, 4, 4, '#a64d68');
          // Melody pink dome lid w/ cute white face & top bow knob!
          outlinedBox(ctx, 244, 85 + potBob, 30, 10, '#ff8eb3', '#a64d68');
          px(ctx, 250, 88 + potBob, 18, 6, '#fff8fa');
          px(ctx, 254, 90 + potBob, 2, 2, '#3d2a30'); px(ctx, 262, 90 + potBob, 2, 2, '#3d2a30');
          px(ctx, 255, 81 + potBob, 8, 5, '#ffd4e3'); // Top knob
        },
      });

      // 3. Tall Cream-Pink Retro Double-Door Fridge Covered in Sanrio Magnets (cols 10..12, rows 3..5 -> x: 322..414, y: 66..190)
      drawables.push({
        sortY: 192,
        draw(ctx) {
          px(ctx, 324, 184, 88, 10, 'rgba(40, 24, 28, 0.22)');
          outlinedBox(ctx, 324, 68, 88, 120, '#ffdbe6', '#8f5266');
          // Top freezer door
          outlinedBox(ctx, 328, 72, 80, 40, '#ffe8f0', '#d998ad');
          px(ctx, 332, 75, 10, 34, '#fff7fa'); // Glossy sheen
          px(ctx, 356, 98, 24, 4, '#d7e2ec'); // Chrome freezer handle
          // Bottom fridge double-door
          outlinedBox(ctx, 328, 116, 80, 68, '#fff0f5', '#d998ad');
          px(ctx, 367, 116, 2, 68, '#d998ad');
          px(ctx, 360, 128, 4, 20, '#d7e2ec'); px(ctx, 372, 128, 4, 20, '#d7e2ec');
          // Cute Polaroid photos, Hello Kitty & strawberry magnets, grocery note!
          outlinedBox(ctx, 334, 78, 12, 14, '#ffffff', '#bfa3ad');
          px(ctx, 336, 80, 8, 8, '#8cc9eb');
          drawMiniHeart(ctx, 392, 84, '#ff4d79');
          outlinedBox(ctx, 334, 124, 14, 16, '#fff8d6', '#cfa36b'); // Grocery sticky note
          px(ctx, 336, 128, 10, 2, '#b8845c'); px(ctx, 336, 132, 8, 2, '#b8845c');
          px(ctx, 382, 126, 14, 12, '#ffffff'); // Kitty magnet
          px(ctx, 390, 125, 5, 3, '#ff4d6d');
          px(ctx, 384, 152, 10, 10, '#ff6b8b'); // Strawberry magnet
          px(ctx, 386, 150, 6, 3, '#69b86c');
        },
      });

      // 4. Packed Multi-Tier Kitchen Appliance & Pantry Rack (cols 11..12, rows 6..9 -> x: 350..414, y: 194..316)
      drawables.push({
        sortY: 316,
        draw(ctx) {
          px(ctx, 352, 308, 62, 10, 'rgba(40, 24, 28, 0.2)');
          // Cream-wood & rose-gold 3-tier baker's rack frame
          outlinedBox(ctx, 352, 196, 60, 118, '#fff7f2', '#9c6e58');
          px(ctx, 354, 232, 56, 4, '#d9a06e');
          px(ctx, 354, 270, 56, 4, '#d9a06e');
          px(ctx, 354, 306, 56, 4, '#d9a06e');

          // Top tier: Pink Mini Rice Cooker (x: 360..404, y: 198..230)
          outlinedBox(ctx, 362, 204, 38, 28, '#ffa3c0', '#9e4c68');
          outlinedBox(ctx, 366, 200, 30, 8, '#ffd4e3', '#9e4c68');
          px(ctx, 376, 218, 10, 6, '#fff8fa');
          const riceOn = cookState && cookState.riceReady;
          px(ctx, 379, 220, 4, 3, riceOn ? '#5ce67a' : '#ffb84d'); // Glowing indicator LED

          // Middle tier: Retro Pink Microwave / Toaster Oven (x: 356..408, y: 238..268)
          outlinedBox(ctx, 356, 238, 52, 30, '#ffd4e3', '#9e4c68');
          outlinedBox(ctx, 360, 243, 32, 20, '#ffcf7d', '#7a4a2e'); // Warm oven window
          px(ctx, 366, 252, 18, 8, '#fff2c2');
          px(ctx, 396, 246, 6, 6, '#fff8fa'); px(ctx, 396, 256, 6, 6, '#fff8fa'); // Knobs

          // Bottom tier: Spice jars, strawberry jam, noodle boxes & hanging pink dish towel
          outlinedBox(ctx, 358, 280, 14, 24, '#ff7aa2', '#8f3d56'); // Strawberry jam
          px(ctx, 360, 277, 10, 4, '#fff8fa');
          outlinedBox(ctx, 375, 284, 14, 20, '#ffe066', '#9c7824'); // Noodle box
          outlinedBox(ctx, 392, 282, 14, 22, '#a8e3dc', '#4e8a7d'); // Tea / sugar jar
        },
      });

      // 5. South Serving Pass-Through Counter + Live Plated Freshly Cooked Dish + Pink Flip-Top Trash Bin (cols 5..10, row 10)
      drawables.push({
        sortY: 354,
        draw(ctx) {
          px(ctx, 160, 348, 152, 8, 'rgba(40, 24, 28, 0.2)');
          // Narrow cream-wood serving counter (x: 160..312, y: 318..352)
          outlinedBox(ctx, 160, 322, 152, 30, '#fff5ec', '#9c6e58');
          outlinedBox(ctx, 158, 316, 156, 12, '#f5d2b3', '#9c6e58');
          px(ctx, 160, 318, 152, 4, '#fff8ef');

          // Left: Pink quilted tissue box + strawberry milk carton
          outlinedBox(ctx, 166, 308, 24, 14, '#ffb7cb', '#a64d68');
          px(ctx, 174, 304, 8, 6, '#ffffff');
          outlinedBox(ctx, 194, 306, 12, 16, '#ffd4e3', '#a64d68');
          px(ctx, 196, 303, 8, 4, '#ff6b8b');

          // Center: White ceramic dinner plate dynamically showing the freshly cooked dish!
          outlinedBox(ctx, 214, 312, 46, 16, '#ffffff', '#bfa3ad');
          px(ctx, 218, 315, 38, 10, '#f5eef0');
          if (cookState && cookState.lastDish) {
            const d = cookState.lastDish;
            px(ctx, 222, 313, 30, 10, d.color || '#ff9ebb');
            px(ctx, 226, 311, 22, 6, d.accent || '#ffe066');
            px(ctx, 232, 314, 6, 4, '#78c978'); // Fresh garnish!
            // Golden star sparkle if 3-star dish!
            if (d.stars >= 3) {
              const glow = Math.sin(time * 6) > 0 ? '#ffe066' : '#fff8cc';
              px(ctx, 236, 304, 4, 4, glow);
            }
          } else {
            // Empty plate w/ tiny pink fork & spoon waiting for dinner
            px(ctx, 230, 317, 14, 4, '#ffd4e3');
          }

          // Right: Cute bowl of steamed rice (if riceReady!) & pink chopsticks
          if (cookState && cookState.riceReady) {
            outlinedBox(ctx, 268, 312, 22, 14, '#ffa3c0', '#a64d68');
            px(ctx, 271, 309, 16, 6, '#ffffff');
          }
          px(ctx, 294, 316, 14, 2, '#d98452');
          px(ctx, 294, 320, 14, 2, '#d98452');

          // Beside counter (col 10, row 10): Pink Cherry Flip-Top Trash Bin
          outlinedBox(ctx, 318, 322, 26, 30, '#ffb7cb', '#a64d68');
          outlinedBox(ctx, 316, 318, 30, 8, '#ff8eb3', '#a64d68');
          px(ctx, 328, 334, 6, 6, '#ff4d6d'); // Cherry decal
        },
      });

      // 6. Bottom-Left Rolling Pink Veggie/Fruit Utility Cart + Cream Bear Step Stool (cols 1..3, row 10)
      drawables.push({
        sortY: 354,
        draw(ctx) {
          px(ctx, 36, 348, 88, 8, 'rgba(40, 24, 28, 0.2)');
          // Rolling pink metal utility cart (x: 36..92, y: 314..352)
          outlinedBox(ctx, 36, 318, 56, 30, '#ffd4e3', '#a64d68');
          px(ctx, 40, 348, 6, 5, '#47424a'); px(ctx, 82, 348, 6, 5, '#47424a'); // Caster wheels
          // Fresh colorful veggies & fruits piled in top basket!
          px(ctx, 40, 312, 10, 9, '#ff5d6c'); px(ctx, 43, 310, 4, 3, '#69b86c'); // Tomatoes
          px(ctx, 52, 311, 12, 10, '#78c978'); // Bok choy / broccoli
          px(ctx, 66, 313, 10, 8, '#fff4d4'); // Eggs
          px(ctx, 78, 312, 10, 9, '#ff4d79'); px(ctx, 80, 310, 5, 3, '#69b86c'); // Strawberries

          // Cute cream bear step stool right beside cart (x: 98..126, y: 326..350)
          outlinedBox(ctx, 98, 326, 28, 22, '#fff5e6', '#9c7856');
          px(ctx, 104, 332, 6, 5, '#c99362'); px(ctx, 114, 332, 6, 5, '#c99362'); // Bear ears
        },
      });

      drawables.push({
        sortY: 350,
        draw(ctx) {
          drawHiddenGiftBox(ctx, 130, 320, time, '#ffe066', '#ff6b8b', state.completedQuests.has('gift_kitchen'));
        },
      });
    }

    return drawables;
  }

  function drawBedCoverOverlay(ctx, time) {
    // Draws the cozy French pink duvet + mauve knit throw + cream blanket over the sleeping protagonist
    const breathe = Math.round(Math.sin(time * 2.1) * 0.7);
    ctx.save();
    ctx.translate(0, breathe);
    outlinedBox(ctx, 358, 146, 148, 72, '#df9fac', '#8c5366');
    px(ctx, 362, 148, 140, 14, '#ebbac5');
    // Knit throw & fringed blanket
    px(ctx, 358, 168, 148, 24, '#b87b8b');
    px(ctx, 362, 173, 140, 4, '#a16475');
    px(ctx, 362, 181, 140, 4, '#cc90a0');
    outlinedBox(ctx, 372, 178, 62, 34, '#f4ebe1', '#bfa79a');
    px(ctx, 378, 184, 50, 20, '#fcf6ef');
    for (let tx = 376; tx < 432; tx += 6) {
      px(ctx, tx, 211, 3, 4, '#fffaf2');
    }
    ctx.restore();
  }

  function drawBathtubFrontOverlay(ctx, time) {
    // Draws the front half of bubbles, yellow ducky, wooden caddy tray & porcelain wall over the soaking protagonist
    const bShift = Math.round(Math.sin(time * 2.8) * 1.5);
    ctx.save();
    // Front thick bubble foam layer overlapping protagonist lower torso
    [[334, 292], [354, 295], [374, 291], [394, 294], [412, 292], [430, 295]].forEach(([bx, by], idx) => {
      roundedBox(ctx, bx, by + (idx % 2 === 0 ? bShift : -bShift), 18, 12, 6, '#ffffff', '#e4eff5');
    });
    px(ctx, 342, 282 + bShift, 11, 9, '#ffe066');
    px(ctx, 351, 285 + bShift, 4, 3, '#ff8833');
    px(ctx, 347, 284 + bShift, 2, 2, '#3a1e10');

    // Front bathtub rim & wall (y: 304..344)
    roundedBox(ctx, 314, 304, 156, 40, 14, '#ffffff', '#9498a2');
    px(ctx, 322, 306, 140, 7, '#fceef3');
    drawMiniHeart(ctx, 392, 326, '#f7b2c4');

    // Re-draw wooden caddy tray neatly on top of rim
    outlinedBox(ctx, 418, 266, 26, 48, '#e3be96', '#8f623d');
    outlinedBox(ctx, 424, 276, 14, 12, '#ffb7cb', '#9e5e74');
    px(ctx, 430, 271 + (Math.sin(time * 10) > 0 ? 0 : 1), 2, 4, '#ffa834');
    outlinedBox(ctx, 425, 294, 12, 12, '#fff7f0', '#b88592');
    px(ctx, 428, 297, 6, 6, '#ff8fab');
    ctx.restore();
  }

  function drawShowerOverlay(ctx, time) {
    // Draws foreground glistening rain droplets & bubble shampoo tuft while showering
    ctx.save();
    for (let sx = 376; sx < 409; sx += 7) {
      const dropOff = (Math.floor(time * 30) + sx * 5) % 20;
      ctx.fillStyle = 'rgba(204, 244, 255, 0.72)';
      for (let sy = 40 + dropOff; sy < 174; sy += 24) {
        ctx.fillRect(sx, sy, 2, 8);
      }
    }
    ctx.restore();
  }

  function drawBadgesAndHighlights(ctx, room, state, time) {
    const roomW = room.width || W;
    const activeIds = new Set();
    if (state.hoveredId) activeIds.add(state.hoveredId);
    if (state.nearbyId) activeIds.add(state.nearbyId);

    for (const d of room.doors) {
      const hovered = state.hoveredDoorId === d.id;
      const pendingCount = MapRef.getRoomPendingQuestCount(d.targetRoom, state.completedQuests);
      const bob = Math.round(Math.sin(time * 4 + d.hitBox.x) * 2);

      if (hovered) {
        const b = d.hitBox;
        ctx.save();
        ctx.strokeStyle = '#ffe566';
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        ctx.restore();
      }

      if (d.badgePos) {
        const label =
          d.direction === 'north'
            ? `▲ ${d.shortName}`
            : d.direction === 'south'
              ? `▼ ${d.shortName}`
              : d.direction === 'west'
                ? `◀ ${d.shortName}`
                : `${d.shortName} ▶`;
        ctx.save();
        ctx.font = 'bold 10px monospace';
        const tw = ctx.measureText(label).width;
        const bw = Math.max(36, Math.round(tw + 10));
        const bx = Math.max(4, Math.min(roomW - bw - 4, Math.round(d.badgePos.x - bw / 2)));
        const by = Math.round(d.badgePos.y + bob);

        outlinedBox(ctx, bx, by - 9, bw, 15, '#fff0be', '#5b2c0d');
        ctx.fillStyle = '#4a2511';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + bw / 2, by - 1);

        if (pendingCount > 0) {
          outlinedBox(ctx, bx + bw - 5, by - 14, 11, 11, '#ffd94f', '#5c2b14');
          px(ctx, bx + bw, by - 12, 2, 4, '#8a251b');
          px(ctx, bx + bw, by - 7, 2, 2, '#8a251b');
        }
        ctx.restore();
      }
    }

    for (const item of room.interactables) {
      if (activeIds.has(item.id)) {
        const b = item.hitBox;
        const pad = item.id === state.nearbyId ? 3 + Math.sin(time * 6) * 1.2 : 2;
        ctx.save();
        ctx.strokeStyle = item.id === state.nearbyId ? '#ffe566' : 'rgba(255, 240, 160, 0.78)';
        ctx.lineWidth = 2;
        const l = 8;
        const x1 = b.x - pad;
        const y1 = b.y - pad;
        const x2 = b.x + b.w + pad;
        const y2 = b.y + b.h + pad;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + l); ctx.lineTo(x1, y1); ctx.lineTo(x1 + l, y1);
        ctx.moveTo(x2 - l, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + l);
        ctx.moveTo(x1, y2 - l); ctx.lineTo(x1, y2); ctx.lineTo(x1 + l, y2);
        ctx.moveTo(x2 - l, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - l);
        ctx.stroke();
        ctx.restore();
      }

      if (item.questId && item.badgePos) {
        const done = state.completedQuests.has(item.questId);
        const bob = done ? 0 : Math.round(Math.sin(time * 4.5 + item.badgePos.x) * 2.5);
        const bx = item.badgePos.x;
        const by = item.badgePos.y + bob;

        if (!done) {
          px(ctx, bx - 7, by - 14, 14, 13, '#5c2b14');
          px(ctx, bx - 6, by - 13, 12, 11, '#ffd94f');
          px(ctx, bx - 2, by - 3, 4, 3, '#5c2b14');
          px(ctx, bx - 1, by - 3, 2, 2, '#ffd94f');
          px(ctx, bx - 1, by - 11, 2, 5, '#8a251b');
          px(ctx, bx - 1, by - 5, 2, 2, '#8a251b');
        } else {
          px(ctx, bx - 6, by - 11, 12, 11, '#31572c');
          px(ctx, bx - 5, by - 10, 10, 9, '#88d46e');
          px(ctx, bx - 3, by - 5, 2, 2, '#ffffff');
          px(ctx, bx - 1, by - 4, 2, 2, '#ffffff');
          px(ctx, bx + 1, by - 7, 2, 3, '#ffffff');
        }
      }
    }
  }

  function renderStatic(ctx, room) {
    ctx.drawImage(getStaticCanvas(room.id), 0, 0);
  }

  return {
    renderStatic,
    drawAmbientLighting,
    getDynamicDrawables,
    drawBedCoverOverlay,
    drawBathtubFrontOverlay,
    drawShowerOverlay,
    drawBadgesAndHighlights,
  };
})();
