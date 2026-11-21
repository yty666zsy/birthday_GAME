window.SB = window.SB || {};

/**
 * 轻量级像素粒子系统：壁炉火星、阳光微尘、脚步灰尘、爱心、音符、蜡烛烟雾、礼花彩带、地面点击波纹
 */
window.SB.Particles = (function () {
  const list = [];
  const ripples = [];
  const dustMotes = [];

  // Initialize floating sunlight dust motes across the 768×512 room
  for (let i = 0; i < 28; i++) {
    dustMotes.push({
      x: 50 + Math.random() * 668,
      y: 70 + Math.random() * 380,
      vx: (Math.random() - 0.5) * 6,
      vy: -2 - Math.random() * 4,
      size: Math.random() < 0.7 ? 1 : 2,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function clearTransient() {
    list.length = 0;
    ripples.length = 0;
  }

  function add(opts) {
    if (list.length > 260) list.shift();
    list.push({
      x: opts.x,
      y: opts.y,
      vx: opts.vx || 0,
      vy: opts.vy || 0,
      gravity: opts.gravity || 0,
      life: 0,
      maxLife: opts.maxLife || 1,
      size: opts.size || 2,
      color: opts.color || '#ffd966',
      kind: opts.kind || 'square',
      text: opts.text || '',
    });
  }

  function spawnRipple(x, y) {
    ripples.push({ x, y, life: 0, maxLife: 0.55 });
  }

  function spawnFootstep(x, y) {
    for (let i = 0; i < 2; i++) {
      add({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 3,
        vx: (Math.random() - 0.5) * 14,
        vy: -8 - Math.random() * 10,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.15,
        size: 2,
        color: '#d9b583',
        kind: 'square',
      });
    }
  }

  function spawnHearts(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      add({
        x: x + (Math.random() - 0.5) * 22,
        y: y - Math.random() * 10,
        vx: (Math.random() - 0.5) * 16,
        vy: -22 - Math.random() * 18,
        maxLife: 1.0 + Math.random() * 0.4,
        size: 3,
        color: i % 2 === 0 ? '#ff5d73' : '#ff94a8',
        kind: 'heart',
      });
    }
  }

  function spawnMusicNote(x, y) {
    const symbols = ['♪', '♫', '♩'];
    add({
      x: x + (Math.random() - 0.5) * 14,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: -20 - Math.random() * 10,
      maxLife: 1.35,
      size: 9,
      color: ['#ffd859', '#ff94b8', '#89e0ff'][Math.floor(Math.random() * 3)],
      kind: 'text',
      text: symbols[Math.floor(Math.random() * symbols.length)],
    });
  }

  function spawnSmoke(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      add({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 16,
        vy: -18 - Math.random() * 16,
        maxLife: 0.9 + Math.random() * 0.4,
        size: 3,
        color: i % 2 === 0 ? '#ebe4dc' : '#c9c0b8',
        kind: 'square',
      });
    }
  }

  function spawnBubbles(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      add({
        x: x + (Math.random() - 0.5) * 80,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 12,
        vy: -14 - Math.random() * 14,
        maxLife: 1.4 + Math.random() * 0.6,
        size: 3 + Math.floor(Math.random() * 3),
        color: i % 2 === 0 ? '#d8f6ff' : '#ffe0ee',
        kind: 'bubble',
      });
    }
  }

  function spawnSteam(x, y, count = 2) {
    for (let i = 0; i < count; i++) {
      add({
        x: x + (Math.random() - 0.5) * 14,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: -14 - Math.random() * 10,
        maxLife: 0.9 + Math.random() * 0.3,
        size: 3,
        color: '#fff9f2',
        kind: 'square',
      });
    }
  }

  function spawnConfetti(x, y, count = 42) {
    const colors = ['#ff6b8b', '#ffd54f', '#64d2ff', '#7ce08a', '#ffa45b', '#d99bff'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI + Math.random() * Math.PI * 2;
      const speed = 45 + Math.random() * 110;
      add({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 45,
        gravity: 135,
        maxLife: 1.4 + Math.random() * 0.9,
        size: Math.random() < 0.5 ? 3 : 2,
        color: colors[i % colors.length],
        kind: i % 5 === 0 ? 'star' : 'square',
      });
    }
  }

  function spawnEmber(x, y) {
    add({
      x: x + (Math.random() - 0.5) * 26,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: -16 - Math.random() * 14,
      maxLife: 0.7 + Math.random() * 0.4,
      size: 2,
      color: Math.random() < 0.6 ? '#ffb84d' : '#ff6a33',
      kind: 'square',
    });
  }

  function spawnZzz(x, y) {
    const glyphs = ['Z', 'z', 'z'];
    add({
      x: x + (Math.random() - 0.5) * 8,
      y,
      vx: 6 + Math.random() * 6,
      vy: -16 - Math.random() * 8,
      maxLife: 1.55,
      size: 10,
      color: Math.random() < 0.5 ? '#ffe7f6' : '#e6d7ff',
      kind: 'zzz',
      text: glyphs[Math.floor(Math.random() * glyphs.length)],
    });
  }

  function update(dt, time, state, room) {
    const roomW = (room && room.width) || 768;
    const roomH = (room && room.height) || 512;
    const minX = 40;
    const maxX = Math.max(80, roomW - 40);
    const minY = 58;
    const maxY = Math.max(120, roomH - 56);

    // Update dust motes within the active room's bounds
    for (const m of dustMotes) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.y < minY || m.y > maxY) m.y = maxY - Math.random() * 32;
      if (m.x < minX) m.x = maxX - 10;
      if (m.x > maxX) m.x = minX + Math.random() * Math.max(40, maxX - minX - 20);
    }

    // Periodic fireplace embers (living room only)
    if (state && state.currentRoomId === 'living' && Math.random() < dt * 4.5) {
      spawnEmber(382, 82);
    }

    // Periodic music notes from jukebox (living room only)
    if (state && state.currentRoomId === 'living' && state.musicPlaying && Math.random() < dt * 2.2) {
      spawnMusicNote(446, 92);
    }

    // Periodic bathtub & shower ambiance (bathroom only)
    if (state && state.currentRoomId === 'bathroom') {
      if (Math.random() < dt * 2.5) {
        spawnBubbles(386, 290, 1);
      }
      if (Math.random() < dt * 1.4) {
        spawnSteam(386, 282, 1);
      }
      if (state.showerRunning || (state.playerActivity && state.playerActivity.type === 'shower')) {
        if (Math.random() < dt * 3.5) spawnSteam(392, 134, 1);
        if (Math.random() < dt * 4.5) spawnBubbles(392, 168, 1);
      }
    }

    // Periodic warm pot & rice-cooker steam (compact 14x12 Sanrio kitchen)
    if (state && state.currentRoomId === 'kitchen') {
      if (Math.random() < dt * 2.8) {
        spawnSteam(214, 94, 1);
      }
      if (Math.random() < dt * 2.0) {
        spawnSteam(274, 96, 1);
      }
      const cookState = window.SB.Cooking ? window.SB.Cooking.getState() : null;
      if (cookState && cookState.riceReady && Math.random() < dt * 2.2) {
        spawnSteam(378, 204, 1);
      }
      if (cookState && cookState.lastDish && Math.random() < dt * 1.8) {
        spawnSteam(236, 314, 1);
      }
    }

    // Periodic cozy chamomile tea steam & vinyl music notes (study only)
    if (state && state.currentRoomId === 'study') {
      if (Math.random() < dt * 1.5) {
        spawnSteam(159, 326, 1);
      }
      if (state.musicPlaying && Math.random() < dt * 0.9) {
        spawnMusicNote(256, 336);
      }
    }

    // Update active particles
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        list.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    // Update ground target ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.life += dt;
      if (r.life >= r.maxLife) {
        ripples.splice(i, 1);
      }
    }
  }

  function drawGroundRipples(ctx) {
    for (const r of ripples) {
      const t = r.life / r.maxLife;
      const radius = 3 + t * 11;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = '#ffe57f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(Math.round(r.x), Math.round(r.y), radius, radius * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawForeground(ctx, time) {
    // Ambient dust motes
    for (const m of dustMotes) {
      const alpha = 0.16 + 0.18 * Math.sin(time * 1.8 + m.phase);
      if (alpha <= 0) continue;
      ctx.fillStyle = `rgba(255, 244, 196, ${alpha.toFixed(2)})`;
      ctx.fillRect(Math.round(m.x), Math.round(m.y), m.size, m.size);
    }

    // Dynamic particles
    for (const p of list) {
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      const px = Math.round(p.x);
      const py = Math.round(p.y);
      if (p.kind === 'heart') {
        ctx.fillStyle = p.color;
        ctx.fillRect(px - 2, py - 1, 2, 2);
        ctx.fillRect(px + 1, py - 1, 2, 2);
        ctx.fillRect(px - 3, py, 7, 2);
        ctx.fillRect(px - 2, py + 2, 5, 1);
        ctx.fillRect(px - 1, py + 3, 3, 1);
        ctx.fillRect(px, py + 4, 1, 1);
      } else if (p.kind === 'star') {
        ctx.fillStyle = p.color;
        ctx.fillRect(px - 2, py, 5, 1);
        ctx.fillRect(px, py - 2, 1, 5);
      } else if (p.kind === 'bubble') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 1, py - 1, 1, 1);
      } else if (p.kind === 'zzz') {
        const scale = 0.8 + (p.life / p.maxLife) * 0.45;
        ctx.fillStyle = p.color;
        ctx.font = `bold ${Math.round(11 * scale)}px "Fusion Pixel", sans-serif`;
        ctx.fillText(p.text || 'z', px, py);
      } else if (p.kind === 'text') {
        ctx.fillStyle = p.color;
        ctx.font = 'bold 11px monospace';
        ctx.fillText(p.text, px, py);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(px, py, p.size, p.size);
      }
      ctx.restore();
    }
  }

  return {
    clearTransient,
    spawnRipple,
    spawnFootstep,
    spawnHearts,
    spawnMusicNote,
    spawnSmoke,
    spawnBubbles,
    spawnSteam,
    spawnConfetti,
    spawnEmber,
    spawnZzz,
    update,
    drawGroundRipples,
    drawForeground,
  };
})();
