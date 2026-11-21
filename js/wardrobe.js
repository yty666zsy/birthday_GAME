window.SB = window.SB || {};

/**
 * 自由换装与发型妆造引擎：
 * 真实纸娃娃多层合成（5套衣服 × 5种发型 × 5种发色 × 7种发饰 × 妆容眼镜），
 * 支持正面/背面/左侧/右侧(镜像)/闭眼睡颜五态与对话框动态头像，持久保存于 localStorage。
 */
window.SB.Wardrobe = (function () {
  const STORAGE_KEY = 'stardew_wardrobe_v1';
  const FW = 200;
  const FH = 260;
  const F_CX = 100;
  const SW = 176;
  const SH = 260;
  const S_NECK_X = 78;
  const FEET_Y = 252;

  const DEFAULT_LOOK = Object.freeze({
    outfit: 'classic',
    hair: 'braids',
    hairColor: 'natural',
    headwear: 'heart_clip',
    blush: 'soft',
    lip: 'natural',
    glasses: 'classic',
  });

  const OUTFITS = [
    {
      id: 'classic',
      name: '学院风蓝领结裙',
      badge: '经典原皮',
      swatch: '#9fd0f2',
      accent: '#ffffff',
      desc: '白衬衫配天蓝蝴蝶结、深灰百褶裙与小皮鞋',
    },
    {
      id: 'strawberry_princess',
      name: '草莓蕾丝公主裙',
      badge: '甜美蓬蓬',
      swatch: '#ffa8c4',
      accent: '#fff5e8',
      desc: '奶杏蕾丝彼得潘领、大蝴蝶结与粉玛丽珍鞋',
    },
    {
      id: 'cream_bear',
      name: '奶油小熊格纹套',
      badge: '秋日温柔',
      swatch: '#f7e6cf',
      accent: '#c48358',
      desc: '小熊刺绣奶油针织开衫配焦糖粉格百褶裙',
    },
    {
      id: 'lavender_puff',
      name: '薰衣草泡泡袖裙',
      badge: '法式优雅',
      swatch: '#cbb0f5',
      accent: '#ffffff',
      desc: '梦幻芋泥紫泡泡袖珍珠扣连衣裙与后腰丝带',
    },
    {
      id: 'bunny_pajama',
      name: '软萌粉兔家居服',
      badge: '毛绒睡衣',
      swatch: '#ffc4d6',
      accent: '#fff9fb',
      desc: '小兔口袋绒绒睡衣、圆屁股毛球尾与兔耳拖鞋',
    },
  ];

  const HAIRSTYLES = [
    {
      id: 'braids',
      name: '经典双麻花辫',
      icon: '🎀',
      hasBackLayer: true,
      crownY: 14,
      clipOffset: { x: 0, y: 0 },
      desc: '元气饱满的蓬松双麻花辫，超级减龄可爱',
    },
    {
      id: 'long_straight',
      name: '温柔公主长直发',
      icon: '✨',
      hasBackLayer: true,
      crownY: 13,
      clipOffset: { x: -4, y: 2 },
      desc: '丝滑垂顺的及腰公主切长发，温柔氛围拉满',
    },
    {
      id: 'twintails',
      name: '元气高双马尾',
      icon: '💕',
      hasBackLayer: true,
      crownY: 18,
      clipOffset: { x: -6, y: 5 },
      desc: '高高扎起的小粉皮筋卷双马尾，甜度爆表',
    },
    {
      id: 'double_buns',
      name: '俏皮双丸子头',
      icon: '🍡',
      hasBackLayer: false,
      crownY: 22,
      clipOffset: { x: -5, y: 7 },
      desc: '圆滚滚的对称双丸子发髻配细碎修饰龙须',
    },
    {
      id: 'bob_curl',
      name: '甜美内扣波波头',
      icon: '🌸',
      hasBackLayer: false,
      crownY: 14,
      clipOffset: { x: -2, y: 2 },
      desc: '贴合脸颊的 C 型内扣短发，清爽又俏皮',
    },
  ];

  const HAIR_COLORS = [
    { id: 'natural', name: '自然浓巧棕', swatch: '#4a3228', stops: null },
    {
      id: 'milk_tea',
      name: '温柔奶茶棕',
      swatch: '#a67b5b',
      stops: [[74, 48, 36], [148, 108, 82], [214, 178, 146]],
    },
    {
      id: 'sakura_pink',
      name: '草莓樱花粉',
      swatch: '#e88aa8',
      stops: [[118, 48, 72], [224, 130, 162], [255, 198, 218]],
    },
    {
      id: 'berry_purple',
      name: '梦幻芋泥紫',
      swatch: '#9c78c8',
      stops: [[62, 42, 92], [146, 112, 196], [212, 186, 248]],
    },
    {
      id: 'honey_gold',
      name: '蜂蜜亚麻金',
      swatch: '#dfb165',
      stops: [[112, 74, 34], [212, 162, 84], [250, 224, 152]],
    },
  ];

  const HEADWEARS = [
    { id: 'heart_clip', name: '黄色小爱心发卡', icon: '💛', desc: '小Q包同款标志性亮黄爱心发卡' },
    { id: 'pink_bow', name: '樱粉缎带蝴蝶结', icon: '🎀', desc: '蓬蓬大蝴蝶结发箍，少女心满分' },
    { id: 'birthday_crown', name: '生日皇冠发箍', icon: '👑', desc: '镶嵌粉钻的小公主生日皇冠' },
    { id: 'bunny_ears', name: '软萌兔耳发箍', icon: '🐰', desc: '竖起来的粉白毛绒兔子耳朵' },
    { id: 'strawberry_clips', name: '双侧小草莓发夹', icon: '🍓', desc: '左右鬓角一对红彤彤的小草莓夹' },
    { id: 'pearl_sakura', name: '珍珠樱花发夹', icon: '🌸', desc: '温柔淡雅的五瓣樱花配珍珠发卡' },
    { id: 'none', name: '清爽无发饰', icon: '✨', desc: '不戴任何头饰，展示原生发丝弧度' },
  ];

  const BLUSHES = [
    { id: 'soft', name: '自然桃气', icon: '🍑' },
    { id: 'strawberry', name: '草莓微醺腮红', icon: '🍓' },
    { id: 'heart_stamp', name: '爱心贴纸元气妆', icon: '💖' },
    { id: 'star_freckle', name: '星光碎钻腮红', icon: '✨' },
  ];

  const LIPS = [
    { id: 'natural', name: '原生水润', swatch: '#f5b8a8' },
    { id: 'cherry', name: '樱桃果汁唇釉', swatch: '#f2577a' },
    { id: 'peach', name: '白桃乌龙奶茶', swatch: '#f28b78' },
  ];

  const GLASSES_STYLES = [
    { id: 'classic', name: '经典黑棕圆框', icon: '👓' },
    { id: 'gold_rim', name: '温柔复古金丝边', icon: '✨' },
    { id: 'pink_rim', name: '草莓甜心粉框', icon: '🌸' },
    { id: 'pearl_chain', name: '珍珠眼镜链款', icon: '🫧' },
  ];

  const PRESETS = [
    {
      id: 'preset_default',
      name: '🎒 经典小Q包',
      look: { ...DEFAULT_LOOK },
    },
    {
      id: 'preset_birthday',
      name: '👑 生日公主派对',
      look: {
        outfit: 'strawberry_princess',
        hair: 'long_straight',
        hairColor: 'natural',
        headwear: 'birthday_crown',
        blush: 'heart_stamp',
        lip: 'cherry',
        glasses: 'pearl_chain',
      },
    },
    {
      id: 'preset_autumn',
      name: '🧸 奶油甜妹下午茶',
      look: {
        outfit: 'cream_bear',
        hair: 'twintails',
        hairColor: 'milk_tea',
        headwear: 'pink_bow',
        blush: 'strawberry',
        lip: 'peach',
        glasses: 'gold_rim',
      },
    },
    {
      id: 'preset_pajama',
      name: '🐰 晚安软萌兔兔',
      look: {
        outfit: 'bunny_pajama',
        hair: 'double_buns',
        hairColor: 'sakura_pink',
        headwear: 'bunny_ears',
        blush: 'star_freckle',
        lip: 'natural',
        glasses: 'pink_rim',
      },
    },
  ];

  const look = { ...DEFAULT_LOOK };
  const listeners = new Set();
  const imgCache = new Map();
  const tintCache = new Map();

  const viewCanvases = {
    front: document.createElement('canvas'),
    back: document.createElement('canvas'),
    side: document.createElement('canvas'),
    sleep: document.createElement('canvas'),
  };
  viewCanvases.front.width = FW; viewCanvases.front.height = FH;
  viewCanvases.back.width = FW; viewCanvases.back.height = FH;
  viewCanvases.side.width = SW; viewCanvases.side.height = SH;
  viewCanvases.sleep.width = FW; viewCanvases.sleep.height = FH;

  const portraitCanvas = document.createElement('canvas');
  portraitCanvas.width = 160;
  portraitCanvas.height = 160;
  let portraitDataUrl = 'assets/protagonist-portrait.png';

  const readyFlags = {
    front: false,
    back: false,
    side: false,
    sleep: false,
  };

  let rebuildQueued = false;

  function loadImg(src) {
    if (imgCache.has(src)) return imgCache.get(src);
    const img = new Image();
    const rec = { img, ready: false, failed: false };
    img.onload = () => {
      rec.ready = true;
      scheduleRebuild();
    };
    img.onerror = () => {
      rec.failed = true;
    };
    img.src = src;
    imgCache.set(src, rec);
    return rec;
  }

  function preloadAssets() {
    loadImg('assets/protagonist.png');
    loadImg('assets/protagonist-back.png');
    loadImg('assets/protagonist-side.png');
    loadImg('assets/protagonist-sleep.png');
    loadImg('assets/wardrobe/sleep_eyes_overlay.png');
    loadImg('assets/wardrobe/clip_heart_front.png');
    loadImg('assets/wardrobe/clip_heart_back.png');
    loadImg('assets/wardrobe/clip_heart_side.png');
    OUTFITS.forEach((o) => {
      loadImg(`assets/wardrobe/outfit_${o.id}_front.png`);
      loadImg(`assets/wardrobe/outfit_${o.id}_back.png`);
      loadImg(`assets/wardrobe/outfit_${o.id}_side.png`);
    });
    HAIRSTYLES.forEach((h) => {
      loadImg(`assets/wardrobe/hair_${h.id}_front_head.png`);
      loadImg(`assets/wardrobe/hair_${h.id}_back.png`);
      loadImg(`assets/wardrobe/hair_${h.id}_side.png`);
      if (h.hasBackLayer) {
        loadImg(`assets/wardrobe/hair_${h.id}_front_back.png`);
      }
    });
  }

  function hasValidId(list, id) {
    return list.some((x) => x.id === id);
  }

  function sanitizeLook(raw) {
    const clean = { ...DEFAULT_LOOK };
    if (!raw || typeof raw !== 'object') return clean;
    if (hasValidId(OUTFITS, raw.outfit)) clean.outfit = raw.outfit;
    if (hasValidId(HAIRSTYLES, raw.hair)) clean.hair = raw.hair;
    if (hasValidId(HAIR_COLORS, raw.hairColor)) clean.hairColor = raw.hairColor;
    if (hasValidId(HEADWEARS, raw.headwear)) clean.headwear = raw.headwear;
    if (hasValidId(BLUSHES, raw.blush)) clean.blush = raw.blush;
    if (hasValidId(LIPS, raw.lip)) clean.lip = raw.lip;
    if (hasValidId(GLASSES_STYLES, raw.glasses)) clean.glasses = raw.glasses;
    return clean;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      Object.assign(look, sanitizeLook(JSON.parse(raw)));
    } catch (_) {}
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(look));
    } catch (_) {}
  }

  function isDefaultLook(l = look) {
    return (
      l.outfit === DEFAULT_LOOK.outfit &&
      l.hair === DEFAULT_LOOK.hair &&
      l.hairColor === DEFAULT_LOOK.hairColor &&
      l.headwear === DEFAULT_LOOK.headwear &&
      l.blush === DEFAULT_LOOK.blush &&
      l.lip === DEFAULT_LOOK.lip &&
      l.glasses === DEFAULT_LOOK.glasses
    );
  }

  function lerpColor(stops, t) {
    const c0 = stops[0];
    const c1 = stops[1];
    const c2 = stops[2];
    if (t <= 0.5) {
      const u = t * 2;
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * u),
        Math.round(c0[1] + (c1[1] - c0[1]) * u),
        Math.round(c0[2] + (c1[2] - c0[2]) * u),
      ];
    }
    const u = (t - 0.5) * 2;
    return [
      Math.round(c1[0] + (c2[0] - c1[0]) * u),
      Math.round(c1[1] + (c2[1] - c1[1]) * u),
      Math.round(c1[2] + (c2[2] - c1[2]) * u),
    ];
  }

  function getTintedHairSource(src, colorId, mode) {
    const colObj = HAIR_COLORS.find((c) => c.id === colorId);
    const rec = loadImg(src);
    if (!rec.ready) return null;
    if (!colObj || !colObj.stops) return rec.img;

    const key = `${src}|${colorId}|${mode}`;
    if (tintCache.has(key)) return tintCache.get(key);

    const w = rec.img.naturalWidth;
    const h = rec.img.naturalHeight;
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext('2d');
    tctx.drawImage(rec.img, 0, 0);
    try {
      const imgData = tctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const stops = colObj.stops;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const a = d[i + 3];
          if (a < 20) continue;
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];

          // Preserve skin, cheeks, mouth & sclera
          if (r > 180 && g > 130 && r - b > 14 && r - g < 80) continue;
          // Preserve pink twintail scrunchies
          if (r > 185 && g < 195 && b > 120 && r - g > 30) continue;
          // Preserve eyes, pupils, eyeglasses frames & eyebrows inside face mask
          if (mode === 'front_head' && x >= 56 && x <= 144 && y >= 78 && y <= 144) continue;
          if (mode === 'side' && x >= 26 && x <= 74 && y >= 76 && y <= 136) continue;

          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 185) continue;
          // Map chocolate hair lum ~ [28..145] -> [0..1]
          const t = Math.max(0, Math.min(1, (lum - 26) / 114));
          const [nr, ng, nb] = lerpColor(stops, t);
          d[i] = nr;
          d[i + 1] = ng;
          d[i + 2] = nb;
        }
      }
      tctx.putImageData(imgData, 0, 0);
    } catch (_) {
      // Fallback safely on tainted canvas if ever opened from file://
    }
    tintCache.set(key, tmp);
    return tmp;
  }

  function drawStar(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx - 1), Math.round(cy - r), 2, r * 2);
    ctx.fillRect(Math.round(cx - r), Math.round(cy - 1), r * 2, 2);
  }

  function drawMakeupLayer(ctx, viewName, l) {
    ctx.save();
    if (viewName === 'front' || viewName === 'sleep') {
      if (l.blush === 'strawberry') {
        [72, 128].forEach((bx) => {
          const g = ctx.createRadialGradient(bx, 118, 1, bx, 118, 13);
          g.addColorStop(0, 'rgba(255, 110, 145, 0.55)');
          g.addColorStop(1, 'rgba(255, 110, 145, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(bx - 13, 108, 26, 20);
        });
      } else if (l.blush === 'heart_stamp') {
        [72, 128].forEach((bx) => {
          const g = ctx.createRadialGradient(bx, 118, 1, bx, 118, 11);
          g.addColorStop(0, 'rgba(255, 135, 165, 0.45)');
          g.addColorStop(1, 'rgba(255, 135, 165, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(bx - 11, 109, 22, 18);
        });
        // Tiny pink heart stamp on right cheek
        ctx.fillStyle = '#ff4d84';
        ctx.fillRect(128, 117, 3, 3);
        ctx.fillRect(132, 117, 3, 3);
        ctx.fillRect(127, 119, 9, 3);
        ctx.fillRect(129, 122, 5, 2);
        ctx.fillRect(131, 124, 1, 1);
      } else if (l.blush === 'star_freckle') {
        [71, 129].forEach((bx) => {
          const g = ctx.createRadialGradient(bx, 118, 1, bx, 118, 11);
          g.addColorStop(0, 'rgba(255, 148, 140, 0.44)');
          g.addColorStop(1, 'rgba(255, 148, 140, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(bx - 11, 109, 22, 18);
        });
        drawStar(ctx, 68, 118, 3, '#fff6b3');
        drawStar(ctx, 131, 117, 3, '#fff6b3');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(74, 122, 2, 2);
        ctx.fillRect(125, 122, 2, 2);
      }

      if (l.lip === 'cherry' || l.lip === 'peach') {
        ctx.fillStyle = l.lip === 'cherry' ? 'rgba(242, 68, 112, 0.85)' : 'rgba(242, 134, 112, 0.85)';
        ctx.beginPath();
        ctx.ellipse(F_CX, 133, 5.5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(F_CX - 2, 132, 2, 1);
      }
    } else if (viewName === 'side') {
      if (l.blush === 'strawberry') {
        const g = ctx.createRadialGradient(54, 111, 1, 54, 111, 12);
        g.addColorStop(0, 'rgba(255, 110, 145, 0.56)');
        g.addColorStop(1, 'rgba(255, 110, 145, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(42, 101, 24, 20);
      } else if (l.blush === 'heart_stamp') {
        ctx.fillStyle = '#ff4d84';
        ctx.fillRect(52, 110, 3, 3);
        ctx.fillRect(56, 110, 3, 3);
        ctx.fillRect(51, 112, 9, 3);
        ctx.fillRect(53, 115, 5, 2);
      } else if (l.blush === 'star_freckle') {
        drawStar(ctx, 54, 111, 3, '#fff6b3');
      }
      if (l.lip === 'cherry' || l.lip === 'peach') {
        ctx.fillStyle = l.lip === 'cherry' ? 'rgba(242, 68, 112, 0.85)' : 'rgba(242, 134, 112, 0.85)';
        ctx.fillRect(36, 125, 4, 2);
      }
    }
    ctx.restore();
  }

  function drawGlassesLayer(ctx, viewName, l) {
    if (l.glasses === 'classic') return;
    ctx.save();
    if (viewName === 'front' || viewName === 'sleep') {
      const col = l.glasses === 'gold_rim' ? '#f5cb5c' : l.glasses === 'pink_rim' ? '#ff85b3' : '#d6b376';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.6;
      [79, 121].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, 102, 17.5, 0.15, Math.PI - 0.15);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(ex, 102, 17.5, Math.PI + 0.25, Math.PI * 2 - 0.25);
        ctx.stroke();
      });
      // Nose bridge
      ctx.beginPath();
      ctx.moveTo(96, 100);
      ctx.quadraticCurveTo(100, 96, 104, 100);
      ctx.stroke();

      if (l.glasses === 'pink_rim') {
        ctx.fillStyle = '#ffd1e3';
        ctx.fillRect(60, 88, 4, 4);
        ctx.fillRect(136, 88, 4, 4);
      } else if (l.glasses === 'pearl_chain') {
        ctx.strokeStyle = '#fff5f8';
        ctx.lineWidth = 1.6;
        // Left & right temple pearl chains looping gently
        [
          [[59, 108], [52, 124], [58, 138]],
          [[141, 108], [148, 124], [142, 138]],
        ].forEach(([p0, pc, p1]) => {
          ctx.beginPath();
          ctx.moveTo(p0[0], p0[1]);
          ctx.quadraticCurveTo(pc[0], pc[1], p1[0], p1[1]);
          ctx.stroke();
        });
        [[56, 118], [54, 128], [144, 118], [146, 128]].forEach(([px, py]) => {
          ctx.fillStyle = '#fff2f7';
          ctx.beginPath();
          ctx.arc(px, py, 2.3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    } else if (viewName === 'side') {
      const col = l.glasses === 'gold_rim' ? '#f5cb5c' : l.glasses === 'pink_rim' ? '#ff85b3' : '#d6b376';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(39, 98, 7.5, 14.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      // Temple arm
      ctx.beginPath();
      ctx.moveTo(46, 97);
      ctx.lineTo(74, 96);
      ctx.stroke();
      if (l.glasses === 'pearl_chain') {
        ctx.strokeStyle = '#fff5f8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(48, 100);
        ctx.quadraticCurveTo(60, 124, 72, 130);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawBow(ctx, cx, cy, scale, mainCol, hiCol, outline) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.fillStyle = mainCol;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.2;
    // Left loop
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-18, -14, -22, 10, -2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right loop
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(18, -14, 22, 10, 2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Highlights & center knot
    ctx.fillStyle = hiCol;
    ctx.beginPath(); ctx.ellipse(-9, -1, 4, 2.2, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, -1, 4, 2.2, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = mainCol;
    ctx.beginPath(); ctx.roundRect(-5, -5, 10, 11, 4); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawHeadwearLayer(ctx, viewName, l) {
    if (l.headwear === 'none') return;
    const hMeta = HAIRSTYLES.find((h) => h.id === l.hair) || HAIRSTYLES[0];
    const crownY = hMeta.crownY || 14;
    const cOff = hMeta.clipOffset || { x: 0, y: 0 };

    if (l.headwear === 'heart_clip') {
      const clipName = viewName === 'sleep' ? 'front' : viewName;
      const clipRec = loadImg(`assets/wardrobe/clip_heart_${clipName}.png`);
      if (clipRec.ready) {
        const ox = clipName === 'back' ? -cOff.x : clipName === 'side' ? Math.round(cOff.x * 0.5) : cOff.x;
        ctx.drawImage(clipRec.img, ox, cOff.y);
      }
      return;
    }

    ctx.save();
    if (viewName === 'front' || viewName === 'sleep') {
      if (l.headwear === 'pink_bow') {
        // Soft headband arc across hair crown
        ctx.strokeStyle = '#ff88ae';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(F_CX, 68, 52, Math.PI + 0.55, Math.PI * 2 - 0.55);
        ctx.stroke();
        drawBow(ctx, F_CX + 18, crownY + 10, 1.05, '#ff77a3', '#ffd6e6', '#7a334e');
      } else if (l.headwear === 'birthday_crown') {
        const y0 = Math.max(4, crownY - 12);
        // Cute mini princess crown centered on crown!
        ctx.fillStyle = '#ffd54f';
        ctx.strokeStyle = '#7a4512';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(F_CX - 20, y0 + 20);
        ctx.lineTo(F_CX - 23, y0 + 4);
        ctx.lineTo(F_CX - 10, y0 + 11);
        ctx.lineTo(F_CX, y0);
        ctx.lineTo(F_CX + 10, y0 + 11);
        ctx.lineTo(F_CX + 23, y0 + 4);
        ctx.lineTo(F_CX + 20, y0 + 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Pink heart ruby & pearl tips
        ctx.fillStyle = '#ff578a';
        ctx.beginPath(); ctx.arc(F_CX, y0 + 14, 3.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff9f2';
        [[F_CX - 23, y0 + 3], [F_CX, y0 - 1], [F_CX + 23, y0 + 3]].forEach(([px, py]) => {
          ctx.beginPath(); ctx.arc(px, py, 2.8, 0, Math.PI * 2); ctx.fill();
        });
      } else if (l.headwear === 'bunny_ears') {
        const by = crownY + 10;
        // Thin plush headband
        ctx.strokeStyle = '#ffd6e6';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(F_CX, 68, 50, Math.PI + 0.6, Math.PI * 2 - 0.6);
        ctx.stroke();
        [-22, 22].forEach((dx, idx) => {
          ctx.save();
          ctx.translate(F_CX + dx, by);
          ctx.rotate(idx === 0 ? -0.18 : 0.18);
          ctx.fillStyle = '#fff9fb';
          ctx.strokeStyle = '#7a4459';
          ctx.lineWidth = 2.3;
          ctx.beginPath(); ctx.ellipse(0, -14, 8, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffa8c4';
          ctx.beginPath(); ctx.ellipse(0, -13, 4.2, 11, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        });
      } else if (l.headwear === 'strawberry_clips') {
        [63 + cOff.x * 0.4, 137 + cOff.x * 0.4].forEach((sx, i) => {
          const sy = 58 + cOff.y;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(i === 0 ? -0.35 : 0.35);
          ctx.fillStyle = '#ff4d72';
          ctx.strokeStyle = '#6e2336';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(0, 2, 7.5, 8.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#6cc765';
          ctx.fillRect(-5, -7, 10, 4);
          ctx.fillStyle = '#ffe5a3';
          ctx.fillRect(-3, 0, 2, 2); ctx.fillRect(1, 2, 2, 2); ctx.fillRect(-1, 5, 2, 2);
          ctx.restore();
        });
      } else if (l.headwear === 'pearl_sakura') {
        const fx = 132 + cOff.x;
        const fy = 52 + cOff.y;
        ctx.fillStyle = '#fff6fa';
        ctx.strokeStyle = '#9c5278';
        ctx.lineWidth = 1.6;
        for (let a = 0; a < 5; a++) {
          const ang = (a * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.ellipse(fx + Math.cos(ang) * 6.5, fy + Math.sin(ang) * 6.5, 5, 3.6, ang, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = '#ffd56b';
        ctx.beginPath(); ctx.arc(fx, fy, 3.2, 0, Math.PI * 2); ctx.fill();
      }
    } else if (viewName === 'back') {
      if (l.headwear === 'pink_bow') {
        drawBow(ctx, F_CX - 18, crownY + 11, 1.0, '#ff77a3', '#ffd6e6', '#7a334e');
      } else if (l.headwear === 'birthday_crown') {
        const y0 = Math.max(4, crownY - 12);
        ctx.fillStyle = '#ffd54f';
        ctx.strokeStyle = '#7a4512';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(F_CX - 19, y0 + 20);
        ctx.lineTo(F_CX - 21, y0 + 5);
        ctx.lineTo(F_CX - 9, y0 + 11);
        ctx.lineTo(F_CX, y0 + 1);
        ctx.lineTo(F_CX + 9, y0 + 11);
        ctx.lineTo(F_CX + 21, y0 + 5);
        ctx.lineTo(F_CX + 19, y0 + 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (l.headwear === 'bunny_ears') {
        const by = crownY + 10;
        [-22, 22].forEach((dx, idx) => {
          ctx.save();
          ctx.translate(F_CX + dx, by);
          ctx.rotate(idx === 0 ? -0.18 : 0.18);
          ctx.fillStyle = '#fff9fb';
          ctx.strokeStyle = '#7a4459';
          ctx.lineWidth = 2.3;
          ctx.beginPath(); ctx.ellipse(0, -14, 8, 17, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.restore();
        });
      } else if (l.headwear === 'pearl_sakura') {
        const fx = 66 - cOff.x;
        const fy = 52 + cOff.y;
        ctx.fillStyle = '#ffd8e8';
        ctx.strokeStyle = '#9c5278';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(fx, fy, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    } else if (viewName === 'side') {
      const sx = 72;
      if (l.headwear === 'pink_bow') {
        drawBow(ctx, sx + 8, crownY + 13, 0.88, '#ff77a3', '#ffd6e6', '#7a334e');
      } else if (l.headwear === 'birthday_crown') {
        const y0 = Math.max(4, crownY - 12);
        ctx.fillStyle = '#ffd54f';
        ctx.strokeStyle = '#7a4512';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(sx - 12, y0 + 20);
        ctx.lineTo(sx - 10, y0 + 4);
        ctx.lineTo(sx, y0 + 10);
        ctx.lineTo(sx + 10, y0 + 2);
        ctx.lineTo(sx + 14, y0 + 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ff578a';
        ctx.beginPath(); ctx.arc(sx, y0 + 14, 2.8, 0, Math.PI * 2); ctx.fill();
      } else if (l.headwear === 'bunny_ears') {
        ctx.save();
        ctx.translate(sx + 2, crownY + 10);
        ctx.rotate(0.15);
        ctx.fillStyle = '#fff9fb';
        ctx.strokeStyle = '#7a4459';
        ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.ellipse(0, -14, 7, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffa8c4';
        ctx.beginPath(); ctx.ellipse(-1, -13, 3.2, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (l.headwear === 'strawberry_clips') {
        ctx.fillStyle = '#ff4d72';
        ctx.strokeStyle = '#6e2336';
        ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.ellipse(72, 56 + cOff.y, 6, 7.5, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (l.headwear === 'pearl_sakura') {
        ctx.fillStyle = '#fff6fa';
        ctx.strokeStyle = '#9c5278';
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(74, 54 + cOff.y, 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd56b';
        ctx.beginPath(); ctx.arc(74, 54 + cOff.y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function composeView(viewName) {
    const can = viewCanvases[viewName];
    const ctx = can.getContext('2d');
    const isSide = viewName === 'side';
    const cw = isSide ? SW : FW;
    const ch = isSide ? SH : FH;
    ctx.clearRect(0, 0, cw, ch);

    // Lossless original fast path for classic untouched look
    if (isDefaultLook()) {
      const baseSrc =
        viewName === 'back'
          ? 'assets/protagonist-back.png'
          : viewName === 'side'
          ? 'assets/protagonist-side.png'
          : viewName === 'sleep'
          ? 'assets/protagonist-sleep.png'
          : 'assets/protagonist.png';
      const baseRec = loadImg(baseSrc);
      if (baseRec.ready) {
        const dx = Math.round((cw - baseRec.img.naturalWidth) / 2);
        const dy = Math.round(FEET_Y - baseRec.img.naturalHeight + 4);
        ctx.drawImage(baseRec.img, dx, dy);
        readyFlags[viewName] = true;
        return;
      }
    }

    const hMeta = HAIRSTYLES.find((h) => h.id === look.hair) || HAIRSTYLES[0];
    if (viewName === 'front' || viewName === 'sleep') {
      if (hMeta.hasBackLayer) {
        const hb = getTintedHairSource(`assets/wardrobe/hair_${look.hair}_front_back.png`, look.hairColor, 'hair');
        if (hb) ctx.drawImage(hb, 0, 0);
      }
      const bodyRec = loadImg(`assets/wardrobe/outfit_${look.outfit}_front.png`);
      if (bodyRec.ready) ctx.drawImage(bodyRec.img, 0, 0);

      const head = getTintedHairSource(`assets/wardrobe/hair_${look.hair}_front_head.png`, look.hairColor, 'front_head');
      if (head) ctx.drawImage(head, 0, 0);

      if (viewName === 'sleep') {
        const slOv = loadImg('assets/wardrobe/sleep_eyes_overlay.png');
        if (slOv.ready) ctx.drawImage(slOv.img, 0, 0);
      }
      drawMakeupLayer(ctx, viewName, look);
      drawGlassesLayer(ctx, viewName, look);
      drawHeadwearLayer(ctx, viewName, look);
      readyFlags[viewName] = Boolean(bodyRec.ready && head);
    } else if (viewName === 'back') {
      const bodyRec = loadImg(`assets/wardrobe/outfit_${look.outfit}_back.png`);
      if (bodyRec.ready) ctx.drawImage(bodyRec.img, 0, 0);
      const hb = getTintedHairSource(`assets/wardrobe/hair_${look.hair}_back.png`, look.hairColor, 'hair');
      if (hb) ctx.drawImage(hb, 0, 0);
      drawHeadwearLayer(ctx, 'back', look);
      readyFlags.back = Boolean(bodyRec.ready && hb);
    } else if (viewName === 'side') {
      const bodyRec = loadImg(`assets/wardrobe/outfit_${look.outfit}_side.png`);
      if (bodyRec.ready) ctx.drawImage(bodyRec.img, 0, 0);
      const hs = getTintedHairSource(`assets/wardrobe/hair_${look.hair}_side.png`, look.hairColor, 'side');
      if (hs) ctx.drawImage(hs, 0, 0);
      drawMakeupLayer(ctx, 'side', look);
      drawGlassesLayer(ctx, 'side', look);
      drawHeadwearLayer(ctx, 'side', look);
      readyFlags.side = Boolean(bodyRec.ready && hs);
    }
  }

  function refreshPortrait() {
    if (isDefaultLook()) {
      portraitDataUrl = 'assets/protagonist-portrait.png';
      return;
    }
    if (!readyFlags.front) return;
    const pctx = portraitCanvas.getContext('2d');
    pctx.clearRect(0, 0, 160, 160);
    // Warm cute boutique gradient backdrop behind head/shoulders
    const grad = pctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, '#ffe8f0');
    grad.addColorStop(1, '#ffd2e2');
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 160, 160);
    pctx.drawImage(viewCanvases.front, 14, 2, 172, 172, 0, 0, 160, 160);
    try {
      portraitDataUrl = portraitCanvas.toDataURL('image/png');
    } catch (_) {
      portraitDataUrl = 'assets/protagonist-portrait.png';
    }
  }

  function rebuildAll() {
    rebuildQueued = false;
    composeView('front');
    composeView('back');
    composeView('side');
    composeView('sleep');
    refreshPortrait();
    listeners.forEach((fn) => {
      try {
        fn({ ...look }, portraitDataUrl);
      } catch (_) {}
    });
  }

  function scheduleRebuild() {
    if (rebuildQueued) return;
    rebuildQueued = true;
    requestAnimationFrame(rebuildAll);
  }

  function setLook(partial) {
    Object.assign(look, sanitizeLook({ ...look, ...partial }));
    saveState();
    rebuildAll();
  }

  function resetLook() {
    Object.assign(look, DEFAULT_LOOK);
    saveState();
    rebuildAll();
  }

  function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)].id;
  }

  function randomizeLook() {
    Object.assign(look, {
      outfit: pickRandom(OUTFITS),
      hair: pickRandom(HAIRSTYLES),
      hairColor: pickRandom(HAIR_COLORS),
      headwear: pickRandom(HEADWEARS.filter((h) => h.id !== 'none')),
      blush: pickRandom(BLUSHES),
      lip: pickRandom(LIPS),
      glasses: pickRandom(GLASSES_STYLES),
    });
    saveState();
    rebuildAll();
  }

  function applyPreset(presetId) {
    const p = PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    Object.assign(look, sanitizeLook(p.look));
    saveState();
    rebuildAll();
  }

  function getLookSummary() {
    const o = OUTFITS.find((x) => x.id === look.outfit) || OUTFITS[0];
    const h = HAIRSTYLES.find((x) => x.id === look.hair) || HAIRSTYLES[0];
    const hw = HEADWEARS.find((x) => x.id === look.headwear) || HEADWEARS[0];
    const hc = HAIR_COLORS.find((x) => x.id === look.hairColor) || HAIR_COLORS[0];
    return `${h.name}（${hc.name}）+ ${o.name}${hw.id !== 'none' ? ' + ' + hw.name : ''}`;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  loadState();
  preloadAssets();
  rebuildAll();

  return {
    DEFAULT_LOOK,
    OUTFITS,
    HAIRSTYLES,
    HAIR_COLORS,
    HEADWEARS,
    BLUSHES,
    LIPS,
    GLASSES_STYLES,
    PRESETS,
    getLook: () => ({ ...look }),
    isDefaultLook: () => isDefaultLook(),
    setLook,
    resetLook,
    randomizeLook,
    applyPreset,
    getLookSummary,
    getViewCanvas: (viewName) => viewCanvases[viewName] || viewCanvases.front,
    isReady: (viewName) => Boolean(readyFlags[viewName]),
    getPortraitSrc: () => portraitDataUrl,
    subscribe,
  };
})();
