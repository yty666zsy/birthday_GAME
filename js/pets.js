(function () {
  window.SB = window.SB || {};

  function loadImage(src) {
    const img = new Image();
    const state = { img, ready: false };
    img.onload = () => {
      state.ready = true;
    };
    img.src = src;
    return state;
  }

  const SPRITES = {
    pug: loadImage('assets/pets/pug.png'),
    shorthair: loadImage('assets/pets/shorthair.png')
  };

  const PETS = {
    pug: {
      id: 'pug',
      name: '团团',
      label: '小八哥 团团',
      roomId: 'living',
      x: 332,
      y: 412,
      home: { x: 332, y: 412 },
      bounds: { minX: 258, maxX: 382, minY: 398, maxY: 446 },
      speed: 52,
      scale: 0.255,
      state: 'idle', // 'idle' | 'walk' | 'nap' | 'happy'
      stateTimer: 1.6,
      happyTimer: 0,
      greetCooldown: 0,
      greetBubble: 0,
      stepTimer: 0,
      zzzTimer: 0.6,
      tx: 332,
      ty: 412,
      facing: 1,
      walkPhase: 0,
      phaseOffset: 0.4,
      napChance: 0.26,
      greetRadius: 86
    },
    shorthair: {
      id: 'shorthair',
      name: 'lucky',
      label: '美短猫咪 lucky',
      roomId: 'bedroom',
      x: 352,
      y: 266,
      home: { x: 352, y: 266 },
      bounds: { minX: 220, maxX: 500, minY: 204, maxY: 356 },
      speed: 58,
      scale: 0.245,
      state: 'idle',
      stateTimer: 1.2,
      happyTimer: 0,
      greetCooldown: 0,
      greetBubble: 0,
      stepTimer: 0,
      zzzTimer: 0.8,
      tx: 352,
      ty: 266,
      facing: -1,
      walkPhase: 0,
      phaseOffset: 1.9,
      napChance: 0.34,
      greetRadius: 90
    }
  };

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function canStandAt(pet, x, y, MapRef) {
    if (!MapRef || typeof MapRef.isCircleFree !== 'function') return true;
    return MapRef.isCircleFree(x, y, 10, 6, pet.roomId);
  }

  function pickWalkTarget(pet, MapRef, preferX, preferY) {
    const b = pet.bounds;
    for (let i = 0; i < 16; i += 1) {
      let cx;
      let cy;
      if (preferX != null && preferY != null && i < 6) {
        const ang = randRange(0, Math.PI * 2);
        const rad = randRange(24, 52);
        cx = clamp(preferX + Math.cos(ang) * rad, b.minX, b.maxX);
        cy = clamp(preferY + Math.sin(ang) * rad, b.minY, b.maxY);
      } else {
        cx = randRange(b.minX, b.maxX);
        cy = randRange(b.minY, b.maxY);
      }
      if (Math.hypot(cx - pet.x, cy - pet.y) < 18) continue;
      if (canStandAt(pet, cx, cy, MapRef)) {
        pet.tx = cx;
        pet.ty = cy;
        return true;
      }
    }
    pet.tx = pet.home.x;
    pet.ty = pet.home.y;
    return false;
  }

  function startNextBehavior(pet, MapRef) {
    const roll = Math.random();
    if (roll < pet.napChance) {
      pet.state = 'nap';
      pet.stateTimer = randRange(3.2, 5.8);
      pet.zzzTimer = 0.7;
      return;
    }
    if (roll < 0.78 && pickWalkTarget(pet, MapRef)) {
      pet.state = 'walk';
      pet.stateTimer = randRange(2.4, 4.4);
      return;
    }
    pet.state = 'idle';
    pet.stateTimer = randRange(1.4, 3.0);
  }

  function updatePet(pet, dt, time, isActiveRoom, player, ParticlesRef, MapRef) {
    pet.greetCooldown = Math.max(0, pet.greetCooldown - dt);
    pet.greetBubble = Math.max(0, pet.greetBubble - dt);

    if (pet.state === 'happy') {
      pet.happyTimer -= dt;
      if (player) {
        const dx = player.x - pet.x;
        if (Math.abs(dx) > 4) pet.facing = dx >= 0 ? 1 : -1;
      }
      if (pet.happyTimer <= 0) {
        pet.state = 'idle';
        pet.stateTimer = randRange(1.2, 2.2);
      }
      return;
    }

    // Proximity curiosity when protagonist is nearby in the same room
    if (isActiveRoom && player) {
      const dist = Math.hypot(player.x - pet.x, player.y - pet.y);
      const isSleeping = player.activity && player.activity.type === 'sleep';
      if (!isSleeping && dist < pet.greetRadius && pet.greetCooldown <= 0) {
        pet.greetBubble = 2.4;
        pet.greetCooldown = 6.5;
        if (Math.abs(player.x - pet.x) > 4) {
          pet.facing = player.x >= pet.x ? 1 : -1;
        }
        if (pet.state === 'nap') {
          pet.state = 'idle';
          pet.stateTimer = 1.4;
        }
        if (dist > 44 && pet.state !== 'walk' && pickWalkTarget(pet, MapRef, player.x, player.y)) {
          pet.state = 'walk';
          pet.stateTimer = 2.2;
        }
        if (ParticlesRef && typeof ParticlesRef.spawnHearts === 'function') {
          ParticlesRef.spawnHearts(pet.x, pet.y - 34, 1);
        }
      }
    }

    if (pet.state === 'walk') {
      pet.stateTimer -= dt;
      const dx = pet.tx - pet.x;
      const dy = pet.ty - pet.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 4 || pet.stateTimer <= 0) {
        pet.state = 'idle';
        pet.stateTimer = randRange(1.4, 3.2);
        return;
      }

      const vx = (dx / dist) * pet.speed;
      const vy = (dy / dist) * pet.speed;
      if (Math.abs(vx) > 2) pet.facing = vx >= 0 ? 1 : -1;

      const nx = pet.x + vx * dt;
      const ny = pet.y + vy * dt;

      if (canStandAt(pet, nx, ny, MapRef)) {
        pet.x = nx;
        pet.y = ny;
      } else if (canStandAt(pet, nx, pet.y, MapRef)) {
        pet.x = nx;
      } else if (canStandAt(pet, pet.x, ny, MapRef)) {
        pet.y = ny;
      } else {
        pet.state = 'idle';
        pet.stateTimer = 1.1;
        return;
      }

      pet.walkPhase += dt * 13;
      pet.stepTimer -= dt;
      if (pet.stepTimer <= 0) {
        pet.stepTimer = 0.24;
        if (isActiveRoom && ParticlesRef && typeof ParticlesRef.spawnFootstep === 'function') {
          ParticlesRef.spawnFootstep(pet.x, pet.y + 1);
        }
      }
      return;
    }

    if (pet.state === 'nap') {
      pet.stateTimer -= dt;
      pet.zzzTimer -= dt;
      if (pet.zzzTimer <= 0) {
        pet.zzzTimer = 1.35;
        if (isActiveRoom && ParticlesRef && typeof ParticlesRef.spawnZzz === 'function') {
          ParticlesRef.spawnZzz(pet.x + 8, pet.y - 26);
        }
      }
      if (pet.stateTimer <= 0) {
        pet.state = 'idle';
        pet.stateTimer = randRange(1.2, 2.4);
      }
      return;
    }

    // Idle
    pet.stateTimer -= dt;
    if (pet.stateTimer <= 0) {
      startNextBehavior(pet, MapRef);
    }
  }

  function update(dt, time, activeRoomId, player, ParticlesRef, MapRef) {
    Object.values(PETS).forEach((pet) => {
      updatePet(pet, dt, time, pet.roomId === activeRoomId, player, ParticlesRef, MapRef);
    });
  }

  function getPetsInRoom(roomId) {
    return Object.values(PETS).filter((p) => p.roomId === roomId);
  }

  function buildInteractionTarget(pet) {
    return {
      id: pet.id,
      kind: 'pet',
      label: pet.id === 'pug' ? '摸摸团团' : '撸撸 lucky',
      shortLabel: pet.name,
      pet,
      hitBox: { x: pet.x - 20, y: pet.y - 42, w: 40, h: 46 },
      anchor: { x: pet.x, y: pet.y - 16 },
      standSpot: { col: Math.floor(pet.x / 32), row: Math.floor(pet.y / 32) },
      interactRadius: 68,
    };
  }

  function findPetAtPoint(wx, wy, roomId) {
    const list = getPetsInRoom(roomId);
    for (const pet of list) {
      if (wx >= pet.x - 24 && wx <= pet.x + 24 && wy >= pet.y - 46 && wy <= pet.y + 12) {
        return buildInteractionTarget(pet);
      }
    }
    return null;
  }

  function findNearestPet(wx, wy, roomId, maxDist = 66) {
    let best = null;
    let bestDist = maxDist;
    for (const pet of getPetsInRoom(roomId)) {
      const dist = Math.hypot(wx - pet.x, wy - pet.y);
      if (dist <= bestDist) {
        bestDist = dist;
        best = buildInteractionTarget(pet);
      }
    }
    return best;
  }

  function triggerHappy(petId, ParticlesRef) {
    const pet = PETS[petId];
    if (!pet) return;
    pet.state = 'happy';
    pet.happyTimer = 1.65;
    pet.greetBubble = 2.0;
    if (ParticlesRef && typeof ParticlesRef.spawnHearts === 'function') {
      ParticlesRef.spawnHearts(pet.x, pet.y - 36, 4);
    }
  }

  function drawCuteBubble(ctx, x, y, text, tint) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 250, 244, 0.94)';
    ctx.strokeStyle = '#6d4430';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(x - 11, y - 16, 22, 16, 6);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = tint || '#e75a84';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - 8);
    ctx.restore();
  }

  function drawPet(ctx, pet, time) {
    const sprite = SPRITES[pet.id];
    const ready = sprite && sprite.ready;

    const bob =
      pet.state === 'walk'
        ? Math.abs(Math.sin(pet.walkPhase)) * 3.8
        : pet.state === 'happy'
        ? Math.abs(Math.sin((1.65 - pet.happyTimer) * Math.PI * 3.4)) * 9.5
        : pet.state === 'nap'
        ? Math.sin(time * 2.1 + pet.phaseOffset) * 0.5
        : Math.sin(time * 3.2 + pet.phaseOffset) * 1.1;

    const sway =
      pet.state === 'walk'
        ? Math.sin(pet.walkPhase) * 0.06
        : pet.state === 'happy'
        ? Math.sin((1.65 - pet.happyTimer) * 14) * 0.09
        : 0;

    const scaleX = pet.state === 'nap' ? 1.07 : 1;
    const scaleY = pet.state === 'nap' ? 0.85 : 1 + Math.sin(time * 3.2 + pet.phaseOffset) * 0.02;

    // Ground contact shadow
    ctx.fillStyle = 'rgba(54, 30, 18, 0.24)';
    ctx.beginPath();
    ctx.ellipse(pet.x, pet.y + 1, Math.max(12, 16 - bob * 0.35), 5.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (ready) {
      const iw = sprite.img.naturalWidth * pet.scale;
      const ih = sprite.img.naturalHeight * pet.scale;

      ctx.save();
      ctx.translate(pet.x, pet.y - bob);
      ctx.rotate(sway);
      ctx.scale(pet.facing * scaleX, scaleY);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sprite.img, -iw / 2, -ih + 4, iw, ih);
      ctx.imageSmoothingEnabled = false;
      ctx.restore();

      // Nap closed-eye / sleepy sparkle touch or tail wiggle
      if (pet.state === 'nap') {
        ctx.fillStyle = 'rgba(255, 224, 240, 0.85)';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('z', pet.x + 13, pet.y - ih * 0.65 + Math.sin(time * 2.5) * 2);
      }
    } else {
      ctx.fillStyle = pet.id === 'pug' ? '#d8c2a4' : '#b7b9be';
      ctx.beginPath();
      ctx.arc(pet.x, pet.y - 12 - bob, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floating name tag on hover/happy/greet or subtle bubble
    if (pet.state === 'happy') {
      drawCuteBubble(ctx, pet.x, pet.y - 52 - bob, '♥', '#e74c78');
    } else if (pet.greetBubble > 0) {
      const symbol = pet.id === 'pug' ? '汪!' : '喵~';
      drawCuteBubble(ctx, pet.x, pet.y - 50 - bob, symbol, '#a64d79');
    }
  }

  function createDrawablesForRoom(roomId, time) {
    return getPetsInRoom(roomId).map((pet) => ({
      sortY: pet.y,
      draw(ctx) {
        drawPet(ctx, pet, time);
      }
    }));
  }

  window.SB.Pets = {
    update,
    getPetsInRoom,
    findPetAtPoint,
    findNearestPet,
    triggerHappy,
    createDrawablesForRoom
  };
})();
