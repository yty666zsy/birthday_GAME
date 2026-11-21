window.SB = window.SB || {};

/**
 * 主循环、四房间场景平滑切换、响应式 DPR 画布与智能镜头、主角操控（键盘 + 点击寻路 + 虚拟摇杆）
 */
(function () {
  const MapRef = window.SB.Map;
  const Wardrobe = window.SB.Wardrobe;
  const Art = window.SB.Art;
  const Pets = window.SB.Pets;
  const Particles = window.SB.Particles;
  const Audio = window.SB.Audio;
  const UI = window.SB.UI;

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const interactPrompt = document.getElementById('interact-prompt');
  const touchInteractBtn = document.getElementById('touch-interact-btn');
  const joystickBase = document.getElementById('joystick-base');
  const joystickKnob = document.getElementById('joystick-knob');

  function loadSprite(src) {
    const img = new Image();
    const s = { img, ready: false };
    img.onload = () => {
      s.ready = true;
    };
    img.src = src;
    return s;
  }

  // Preload protagonist 3-view + sleep sprites
  const sprites = {
    front: loadSprite('assets/protagonist.png'),
    back: loadSprite('assets/protagonist-back.png'),
    side: loadSprite('assets/protagonist-side.png'),
    sleep: loadSprite('assets/protagonist-sleep.png'),
  };

  const view = {
    cssW: window.innerWidth,
    cssH: window.innerHeight,
    dpr: 1,
    scale: 1,
    camX: MapRef.WIDTH / 2,
    camY: MapRef.HEIGHT / 2,
    offsetX: 0,
    offsetY: 0,
  };

  const startRoom = MapRef.getCurrentRoom();
  const player = {
    x: startRoom.spawn.x,
    y: startRoom.spawn.y,
    speed: 128,
    dir: 'down', // 'down' | 'up' | 'left' | 'right'
    moving: false,
    walkPhase: 0,
    stepTimer: 0,
    path: [],
    pendingInteract: null,
    pendingDoor: null,
    activity: null,
    emote: null, // { type, elapsed, duration, noteTimer }
  };
  let activityParticleTimer = 0;

  const fade = {
    phase: 'idle', // 'idle' | 'out' | 'in'
    alpha: 0,
    pendingRoom: null,
    pendingSpawn: null,
  };
  let doorCooldown = 0;

  const keys = new Set();
  const joystick = {
    active: false,
    pointerId: null,
    vx: 0,
    vy: 0,
  };
  let nearbyItem = null;
  let lastTime = performance.now();

  function updateCanvasSize() {
    view.cssW = Math.max(320, window.innerWidth);
    view.cssH = Math.max(320, window.innerHeight);
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(view.cssW * view.dpr);
    canvas.height = Math.round(view.cssH * view.dpr);
  }

  function updateCamera(dt, instant = false) {
    const room = MapRef.getCurrentRoom();
    const roomW = room.width || MapRef.WIDTH;
    const roomH = room.height || MapRef.HEIGHT;
    const isDesktop = view.cssW >= 720 && view.cssW >= view.cssH * 0.9;
    if (isDesktop) {
      view.scale = Math.max(
        0.65,
        Math.min(1.58, (view.cssW - 24) / roomW, (view.cssH - 96) / roomH)
      );
      view.camX = roomW / 2;
      view.camY = roomH / 2;
      view.offsetX = view.cssW / 2 - view.camX * view.scale;
      view.offsetY = view.cssH / 2 + 16 - view.camY * view.scale;
    } else {
      const targetScale = Math.max(view.cssW / 400, (view.cssH - 130) / roomH);
      view.scale = Math.max(0.9, Math.min(1.85, targetScale));

      const halfVisW = view.cssW / (2 * view.scale);
      const halfVisH = view.cssH / (2 * view.scale);

      let targetCamX = player.x;
      let targetCamY = player.y - 12;

      if (halfVisW * 2 >= roomW) {
        targetCamX = roomW / 2;
      } else {
        targetCamX = Math.max(halfVisW, Math.min(roomW - halfVisW, targetCamX));
      }

      if (halfVisH * 2 >= roomH) {
        targetCamY = roomH / 2;
      } else {
        targetCamY = Math.max(halfVisH, Math.min(roomH - halfVisH, targetCamY));
      }

      if (instant) {
        view.camX = targetCamX;
        view.camY = targetCamY;
      } else {
        const lerp = 1 - Math.exp(-8 * dt);
        view.camX += (targetCamX - view.camX) * lerp;
        view.camY += (targetCamY - view.camY) * lerp;
      }

      view.offsetX = view.cssW / 2 - view.camX * view.scale;
      view.offsetY = view.cssH / 2 - view.camY * view.scale;
    }
  }

  function screenToWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    return {
      x: (sx - view.offsetX) / view.scale,
      y: (sy - view.offsetY) / view.scale,
    };
  }

  function triggerEmote(type) {
    if (player.activity) return;
    const durations = { wave: 1.8, spin: 1.6, love: 1.6, dance: 2.6, happy: 0.75 };
    const dur = durations[type] || 1.4;
    player.emote = { type, elapsed: 0, duration: dur, noteTimer: 0 };

    if (type === 'love') {
      Audio.open();
      Particles.spawnHearts(player.x, player.y - 46, 6);
    } else if (type === 'wave') {
      Audio.blip();
      Particles.spawnHearts(player.x + 12, player.y - 44, 2);
    } else if (type === 'spin') {
      Audio.open();
      Particles.spawnConfetti(player.x, player.y - 28, 12);
    } else if (type === 'dance') {
      Audio.junimo();
      Particles.spawnMusicNote(player.x, player.y - 48);
    }
  }

  function faceTowardAnchor(anchor) {
    if (!anchor) return;
    const dx = anchor.x - player.x;
    const dy = anchor.y - player.y;
    if (Math.abs(dy) > Math.abs(dx) * 1.15) {
      player.dir = dy < 0 ? 'up' : 'down';
    } else if (Math.abs(dx) > 4) {
      player.dir = dx < 0 ? 'left' : 'right';
    }
  }

  function ensurePlayerFree() {
    if (MapRef.isCircleFree(player.x, player.y, 10, 6)) return;
    const col = Math.floor(player.x / MapRef.TILE);
    const row = Math.floor(player.y / MapRef.TILE);
    const safe = MapRef.findNearestWalkableTile ? MapRef.findNearestWalkableTile(col, row) : null;
    if (safe) {
      player.x = (safe.col + 0.5) * MapRef.TILE;
      player.y = (safe.row + 0.5) * MapRef.TILE;
    } else {
      const room = MapRef.getCurrentRoom();
      player.x = room.spawn.x;
      player.y = room.spawn.y;
    }
  }

  function startActivity(act) {
    if (!act) return;
    const savedExit = MapRef.isCircleFree(player.x, player.y, 10, 6)
      ? { x: player.x, y: player.y }
      : null;
    const storedAct = act.exitPos || !savedExit ? act : Object.assign({}, act, { exitPos: savedExit });
    player.path = [];
    player.pendingInteract = null;
    player.pendingDoor = null;
    player.moving = false;
    player.emote = null;
    player.activity = storedAct;
    player.x = storedAct.x;
    player.y = storedAct.y;
    player.dir = storedAct.dir || (storedAct.facingLeft ? 'left' : 'down');
    activityParticleTimer = 0.25;
    nearbyItem = null;
    UI.setNearbyPrompt(null);
    UI.setActivityState(storedAct);
    Audio.open();
    Particles.spawnHearts(storedAct.x, storedAct.y - 34, 3);
  }

  function exitActivity() {
    if (!player.activity) return;
    const endedType = player.activity.type;
    if (player.activity.exitPos) {
      player.x = player.activity.exitPos.x;
      player.y = player.activity.exitPos.y;
    }
    ensurePlayerFree();
    if (endedType === 'shower') {
      UI.state.showerRunning = false;
    } else if (endedType === 'sit_toilet') {
      Audio.bubble();
    }
    player.activity = null;
    player.dir = 'down';
    activityParticleTimer = 0;
    UI.setActivityState(null);
  }

  function transitionToRoom(targetRoomId, targetSpawn) {
    if (fade.phase !== 'idle') return;
    if (player.activity) exitActivity();
    const room = MapRef.getRoom(targetRoomId);
    if (!room) return;
    Audio.door();
    player.path = [];
    player.pendingInteract = null;
    player.pendingDoor = null;
    player.moving = false;
    fade.phase = 'out';
    fade.pendingRoom = room.id;
    fade.pendingSpawn = targetSpawn || room.spawn;
  }

  function updateFade(dt) {
    if (fade.phase === 'out') {
      fade.alpha = Math.min(1, fade.alpha + dt / 0.18);
      if (fade.alpha >= 1) {
        const nextRoom = MapRef.setCurrentRoom(fade.pendingRoom);
        player.x = fade.pendingSpawn.x;
        player.y = fade.pendingSpawn.y;
        ensurePlayerFree();
        nearbyItem = null;
        Particles.clearTransient();
        UI.setCurrentRoom(nextRoom);
        updateCamera(1, true);
        doorCooldown = 0.55;
        fade.phase = 'in';
      }
    } else if (fade.phase === 'in') {
      fade.alpha = Math.max(0, fade.alpha - dt / 0.22);
      if (fade.alpha <= 0) {
        fade.phase = 'idle';
        fade.pendingRoom = null;
        fade.pendingSpawn = null;
      }
    }
  }

  function getDirectMoveVector() {
    let dx = 0;
    let dy = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      return { vx: dx / len, vy: dy / len };
    }
    if (joystick.active && Math.hypot(joystick.vx, joystick.vy) > 0.12) {
      return { vx: joystick.vx, vy: joystick.vy };
    }
    return null;
  }

  function movePlayerBy(dx, dy) {
    ensurePlayerFree();
    if (Math.abs(dx) > 0.02 || Math.abs(dy) > 0.02) {
      if (Math.abs(dx) > Math.abs(dy) * 1.15) {
        player.dir = dx < 0 ? 'left' : 'right';
      } else if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        player.dir = dy < 0 ? 'up' : 'down';
      } else if (Math.abs(dx) > Math.abs(dy)) {
        player.dir = dx < 0 ? 'left' : 'right';
      } else {
        player.dir = dy < 0 ? 'up' : 'down';
      }
    }

    const nx = player.x + dx;
    if (MapRef.isCircleFree(nx, player.y, 10, 6)) {
      player.x = nx;
    }
    const ny = player.y + dy;
    if (MapRef.isCircleFree(player.x, ny, 10, 6)) {
      player.y = ny;
    }
  }

  function updatePlayer(dt) {
    if (doorCooldown > 0) doorCooldown = Math.max(0, doorCooldown - dt);

    if (player.emote) {
      player.emote.elapsed += dt;
      if (player.emote.type === 'dance') {
        player.emote.noteTimer += dt;
        if (player.emote.noteTimer >= 0.48) {
          player.emote.noteTimer = 0;
          Particles.spawnMusicNote(player.x, player.y - 48);
        }
      }
      if (player.emote.elapsed >= player.emote.duration) {
        player.emote = null;
      }
    }

    if (UI.isBlockingInput() || fade.phase !== 'idle') {
      player.moving = false;
      return;
    }

    const direct = getDirectMoveVector();

    if (player.activity) {
      if (direct) {
        exitActivity();
      } else {
        player.moving = false;
        activityParticleTimer -= dt;
        if (activityParticleTimer <= 0) {
          if (player.activity.type === 'sleep') {
            activityParticleTimer = 1.2;
            Particles.spawnZzz(player.x + 10, player.y - 46);
          } else if (player.activity.type === 'bath') {
            activityParticleTimer = 1.1;
            Particles.spawnBubbles(player.x, player.y - 18, 2);
            Particles.spawnSteam(player.x, player.y - 34, 1);
          } else if (player.activity.type === 'shower') {
            activityParticleTimer = 0.85;
            Particles.spawnSteam(player.x, player.y - 26, 2);
            Particles.spawnBubbles(player.x, player.y + 4, 2);
          } else if (player.activity.type === 'wash_face') {
            activityParticleTimer = 1.4;
            Particles.spawnBubbles(192, 108, 2);
          } else if (player.activity.type === 'wash_veggies') {
            activityParticleTimer = 1.1;
            Particles.spawnBubbles(92, 118, 2);
          } else if (player.activity.type === 'cook') {
            activityParticleTimer = 0.85;
            Particles.spawnSteam(240, 102, 2);
          } else if (player.activity.type === 'play_piano') {
            activityParticleTimer = 1.1;
            Particles.spawnMusicNote(240, 76);
          } else if (player.activity.type === 'sit_pc') {
            activityParticleTimer = 2.3;
            Particles.spawnMusicNote(56, 146);
          } else if (player.activity.type === 'sit_vanity') {
            activityParticleTimer = 1.6;
            Particles.spawnHearts(player.x, player.y - 44, 2);
          } else if (player.activity.type === 'sit_sofa' || player.activity.type === 'sit_pink_sofa') {
            activityParticleTimer = 2.0;
            Particles.spawnHearts(player.x, player.y - 42, 1);
          } else {
            activityParticleTimer = 2.4;
            Particles.spawnHearts(player.x, player.y - 44, 1);
          }
        }
        return;
      }
    }

    let moved = false;

    if (direct) {
      player.emote = null;
      if (player.path.length > 0 || player.pendingInteract || player.pendingDoor) {
        player.path = [];
        player.pendingInteract = null;
        player.pendingDoor = null;
      }
      movePlayerBy(direct.vx * player.speed * dt, direct.vy * player.speed * dt);
      moved = true;

      if (doorCooldown <= 0) {
        const doorHit = MapRef.findDoorTrigger(player.x, player.y);
        if (doorHit) {
          transitionToRoom(doorHit.targetRoom, doorHit.targetSpawn);
          return;
        }
      }
    } else if (player.path.length > 0) {
      player.emote = null;
      const wp = player.path[0];
      const dx = wp.x - player.x;
      const dy = wp.y - player.y;
      const dist = Math.hypot(dx, dy);
      const stepDist = player.speed * dt;
      if (dist <= Math.max(3, stepDist)) {
        player.x = wp.x;
        player.y = wp.y;
        player.path.shift();
        if (player.path.length === 0) {
          if (player.pendingDoor) {
            const d = player.pendingDoor;
            player.pendingDoor = null;
            transitionToRoom(d.targetRoom, d.targetSpawn);
            return;
          }
          if (player.pendingInteract) {
            const item = player.pendingInteract;
            player.pendingInteract = null;
            faceTowardAnchor(item.anchor);
            UI.triggerInteractable(item);
          }
        }
      } else {
        movePlayerBy((dx / dist) * stepDist, (dy / dist) * stepDist);
      }
      moved = true;
    }

    player.moving = moved;
    if (moved) {
      player.walkPhase += dt * 13;
      player.stepTimer += dt;
      if (player.stepTimer >= 0.28) {
        player.stepTimer = 0;
        Audio.step();
        Particles.spawnFootstep(player.x, player.y + 1);
      }
    } else {
      player.walkPhase = 0;
      player.stepTimer = 0.16;
    }

    const room = MapRef.getCurrentRoom();
    const nearItem = MapRef.findNearestInteractable(player.x, player.y);
    const nearPet = Pets ? Pets.findNearestPet(player.x, player.y, room.id) : null;
    let nextNear = nearItem;
    if (nearPet && (!nearItem || Math.hypot(nearPet.anchor.x - player.x, nearPet.anchor.y - player.y) < Math.hypot(nearItem.anchor.x - player.x, nearItem.anchor.y - player.y))) {
      nextNear = nearPet;
    }
    if ((nextNear ? nextNear.id : null) !== (nearbyItem ? nearbyItem.id : null)) {
      nearbyItem = nextNear;
      UI.setNearbyPrompt(nearbyItem);
    }
  }

  function drawEmoteTag(renderCtx, x, y, text) {
    renderCtx.save();
    renderCtx.fillStyle = 'rgba(255, 248, 242, 0.96)';
    renderCtx.strokeStyle = '#7a3f54';
    renderCtx.lineWidth = 1.5;
    renderCtx.beginPath();
    renderCtx.roundRect(x - 14, y - 16, 28, 16, 6);
    renderCtx.fill();
    renderCtx.stroke();
    renderCtx.fillStyle = '#d64572';
    renderCtx.font = 'bold 10px sans-serif';
    renderCtx.textAlign = 'center';
    renderCtx.textBaseline = 'middle';
    renderCtx.fillText(text, x, y - 8);
    renderCtx.restore();
  }

  function drawHeadBubbleTuft(renderCtx, px, py) {
    renderCtx.save();
    renderCtx.fillStyle = '#ffffff';
    renderCtx.strokeStyle = '#cfe6f2';
    renderCtx.lineWidth = 1;
    [[px - 5, py + 1, 5], [px + 4, py + 1, 5], [px, py - 2, 6]].forEach(([bx, by, r]) => {
      renderCtx.beginPath();
      renderCtx.arc(bx, by, r, 0, Math.PI * 2);
      renderCtx.fill();
      renderCtx.stroke();
    });
    renderCtx.restore();
  }

  function drawProtagonist(renderCtx, time) {
    const px = player.x;
    const py = player.y;
    const act = player.activity;
    const isSleep = act && act.type === 'sleep';
    const isBath = act && act.type === 'bath';
    const isShower = act && act.type === 'shower';
    const isWash = act && act.type === 'wash_face';
    const isToilet = act && act.type === 'sit_toilet';
    const isPiano = act && act.type === 'play_piano';
    const isVanity = act && act.type === 'sit_vanity';
    const isSeated = act && (act.type === 'sit_pc' || act.type === 'armchair' || act.type === 'bay_window' || act.type === 'sit_sofa' || act.type === 'sit_pink_sofa' || act.type === 'sit_reading' || isPiano || isToilet || isVanity);

    if (!isSleep && !isBath) {
      renderCtx.fillStyle = isSeated ? 'rgba(28, 12, 5, 0.22)' : 'rgba(28, 12, 5, 0.34)';
      renderCtx.beginPath();
      renderCtx.ellipse(Math.round(px), Math.round(py + (isSeated ? -2 : 1)), isSeated ? 11 : 13, 5, 0, 0, Math.PI * 2);
      renderCtx.fill();
    }

    // Determine effective view direction (down | up | left | right)
    let effDir = player.dir;
    if (player.emote && player.emote.type === 'spin') {
      const seq = ['down', 'left', 'up', 'right'];
      effDir = seq[Math.floor(player.emote.elapsed * 5.2) % 4];
    } else if (player.emote && (player.emote.type === 'wave' || player.emote.type === 'love' || player.emote.type === 'happy')) {
      effDir = 'down';
    } else if (player.emote && player.emote.type === 'dance') {
      const seq = ['left', 'down', 'right', 'down'];
      effDir = seq[Math.floor(player.emote.elapsed * 4.5) % 4];
    }

    // Select view key + live composited Wardrobe canvas (with raw sprite fallback)
    let viewName = 'front';
    let flipX = false;
    if (isSleep || isBath || isShower) {
      viewName = 'sleep';
    } else if (effDir === 'up') {
      viewName = 'back';
    } else if (effDir === 'left') {
      viewName = 'side';
      flipX = false;
    } else if (effDir === 'right') {
      viewName = 'side';
      flipX = true;
    }

    const useWardrobe = Boolean(Wardrobe && Wardrobe.isReady && Wardrobe.isReady(viewName));
    const drawSource = useWardrobe ? Wardrobe.getViewCanvas(viewName) : null;
    const chosen = sprites[viewName] && sprites[viewName].ready ? sprites[viewName] : sprites.front;

    if (!useWardrobe && (!chosen || !chosen.ready)) {
      renderCtx.fillStyle = '#ffd573';
      renderCtx.beginPath();
      renderCtx.arc(px, py - 24, 12, 0, Math.PI * 2);
      renderCtx.fill();
      if (isSleep) Art.drawBedCoverOverlay(renderCtx, time);
      else if (isBath) Art.drawBathtubFrontOverlay(renderCtx, time);
      else if (isShower) Art.drawShowerOverlay(renderCtx, time);
      return;
    }

    let drawH;
    let drawW;
    let yDrawOff;
    if (useWardrobe) {
      drawH = (isSleep || isBath) ? 56 : (isSeated || isShower || isWash) ? 60 : 64;
      drawW = Math.round(drawH * (drawSource.width / drawSource.height));
      yDrawOff = -drawH + 4;
    } else {
      drawH = (isSleep || isBath) ? 54 : (isSeated || isShower || isWash) ? 58 : 62;
      drawW = Math.round(drawH * (chosen.img.naturalWidth / chosen.img.naturalHeight));
      yDrawOff = -drawH + 3;
    }

    let bounce = Math.sin(time * 2.4) * 0.6;
    let tilt = 0;
    let scaleY = 1;
    const yShift = isBath ? 2 : isSeated ? 4 : 0;

    if (isSleep || isBath) {
      bounce = Math.sin(time * 2.1) * 0.7;
      tilt = isBath ? 0 : -0.05;
    } else if (isShower || isWash || (act && (act.type === 'cook' || act.type === 'wash_veggies'))) {
      bounce = Math.abs(Math.sin(time * 5.2)) * 1.4;
      tilt = Math.sin(time * 4.2) * 0.05;
    } else if (isPiano) {
      bounce = Math.abs(Math.sin(time * 5.2)) * 1.6;
      tilt = Math.sin(time * 4.5) * 0.075;
    } else if (act && act.type === 'sit_pc') {
      bounce = Math.abs(Math.sin(time * 9)) * 0.9;
      tilt = -0.05;
    } else if (isVanity) {
      bounce = Math.sin(time * 3.1) * 0.9;
    } else if (player.moving) {
      bounce = Math.abs(Math.sin(player.walkPhase)) * 3.8;
      tilt = (effDir === 'left' || effDir === 'right')
        ? Math.sin(player.walkPhase) * 0.045
        : Math.sin(player.walkPhase) * 0.065;
      scaleY = 1 - Math.abs(Math.sin(player.walkPhase)) * 0.04;
    } else if (player.emote) {
      const e = player.emote;
      if (e.type === 'happy' || e.type === 'love') {
        bounce = Math.abs(Math.sin(e.elapsed * 9.5)) * 9;
      } else if (e.type === 'wave') {
        bounce = Math.abs(Math.sin(e.elapsed * 7)) * 4;
        tilt = Math.sin(e.elapsed * 10) * 0.09;
      } else if (e.type === 'dance') {
        bounce = Math.abs(Math.sin(e.elapsed * 8.5)) * 5.5;
        tilt = Math.sin(e.elapsed * 8.5) * 0.09;
      } else if (e.type === 'spin') {
        bounce = Math.abs(Math.sin(e.elapsed * 10)) * 5;
      }
    }

    renderCtx.save();
    renderCtx.translate(px, py + yShift - bounce);
    if (tilt !== 0) renderCtx.rotate(tilt);
    renderCtx.scale(flipX ? -1 : 1, scaleY);

    renderCtx.imageSmoothingEnabled = true;
    renderCtx.imageSmoothingQuality = 'high';
    renderCtx.drawImage(useWardrobe ? drawSource : chosen.img, -drawW / 2, yDrawOff, drawW, drawH);
    renderCtx.imageSmoothingEnabled = false;
    renderCtx.restore();

    if (isBath) {
      drawHeadBubbleTuft(renderCtx, px, py + yShift - drawH + 2 - bounce);
      Art.drawBathtubFrontOverlay(renderCtx, time);
    } else if (isShower) {
      drawHeadBubbleTuft(renderCtx, px, py - drawH + 2 - bounce);
      Art.drawShowerOverlay(renderCtx, time);
    } else if (isSleep) {
      Art.drawBedCoverOverlay(renderCtx, time);
    } else if (isToilet) {
      drawEmoteTag(renderCtx, px, py - 60, '✨');
    } else if (player.emote) {
      if (player.emote.type === 'wave') drawEmoteTag(renderCtx, px, py - 66 - bounce, 'Hi~');
      else if (player.emote.type === 'love') drawEmoteTag(renderCtx, px, py - 66 - bounce, '♥');
      else if (player.emote.type === 'dance') drawEmoteTag(renderCtx, px, py - 66 - bounce, '♪');
    }
  }

  function getProtagonistSortY() {
    if (!player.activity) return player.y;
    switch (player.activity.type) {
      case 'sleep':
        return 223;
      case 'bath':
        return 349;
      case 'shower':
        return 186;
      case 'wash_face':
        return 174;
      case 'sit_toilet':
        return 159;
      case 'play_piano':
        return 152;
      case 'sit_vanity':
        return 144;
      case 'sit_sofa':
        return 236;
      case 'sit_pink_sofa':
        return 148;
      case 'sit_pc':
        return 190;
      case 'armchair':
        return 416;
      case 'bay_window':
        return 210;
      default:
        return player.y;
    }
  }

  function renderFrame(time) {
    const room = MapRef.getCurrentRoom();

    ctx.save();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, view.cssW, view.cssH);

    ctx.translate(view.offsetX, view.offsetY);
    ctx.scale(view.scale, view.scale);
    ctx.imageSmoothingEnabled = false;

    Art.renderStatic(ctx, room);
    Art.drawAmbientLighting(ctx, room, time, UI.state);
    Particles.drawGroundRipples(ctx);

    const drawables = Art.getDynamicDrawables(room, UI.state, time);
    if (Pets) {
      drawables.push(...Pets.createDrawablesForRoom(room.id, time));
    }
    drawables.push({
      sortY: getProtagonistSortY(),
      draw: (c) => drawProtagonist(c, time),
    });
    drawables.sort((a, b) => a.sortY - b.sortY);
    for (const d of drawables) {
      d.draw(ctx);
    }

    Particles.drawForeground(ctx, time);
    Art.drawBadgesAndHighlights(ctx, room, UI.state, time);
    ctx.restore();

    // Smooth room fade transition veil
    if (fade.alpha > 0.01) {
      ctx.save();
      ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      ctx.fillStyle = `rgba(22, 14, 28, ${fade.alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, view.cssW, view.cssH);
      ctx.restore();
    }
  }

  function loop(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    const time = now / 1000;
    const room = MapRef.getCurrentRoom();

    updateFade(dt);
    updatePlayer(dt);
    if (Pets) {
      Pets.update(dt, time, room.id, player, Particles, MapRef);
    }
    updateCamera(dt);
    Particles.update(dt, time, UI.state, room);
    renderFrame(time);

    requestAnimationFrame(loop);
  }

  function handleRoomTap(clientX, clientY) {
    if (UI.isBlockingInput() || fade.phase !== 'idle') return;
    Audio.unlock();
    const room = MapRef.getCurrentRoom();
    const roomW = room.width || MapRef.WIDTH;
    const roomH = room.height || MapRef.HEIGHT;
    const pt = screenToWorld(clientX, clientY);
    if (pt.x < 0 || pt.x > roomW || pt.y < 0 || pt.y > roomH) return;

    if (player.activity) {
      exitActivity();
    }

    // 1. Check doorways first
    const door = MapRef.findDoorAtPoint(pt.x, pt.y);
    if (door) {
      const b = door.hitBox;
      const cx = Math.max(b.x, Math.min(player.x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(player.y, b.y + b.h));
      if (Math.hypot(player.x - cx, player.y - cy) <= 52) {
        transitionToRoom(door.targetRoom, door.targetSpawn);
        return;
      }
      const startCol = Math.floor(player.x / MapRef.TILE);
      const startRow = Math.floor(player.y / MapRef.TILE);
      const path = MapRef.findPath(startCol, startRow, door.standSpot.col, door.standSpot.row);
      if (path.length > 0) {
        player.path = path;
        player.pendingDoor = door;
        player.pendingInteract = null;
        Particles.spawnRipple(
          (door.standSpot.col + 0.5) * MapRef.TILE,
          (door.standSpot.row + 0.5) * MapRef.TILE
        );
      } else {
        transitionToRoom(door.targetRoom, door.targetSpawn);
      }
      return;
    }

    // 2. Check dynamic pets & furniture / quest interactables
    const petHit = Pets ? Pets.findPetAtPoint(pt.x, pt.y, room.id) : null;
    const hit = petHit || MapRef.findInteractableAtPoint(pt.x, pt.y);
    if (hit) {
      const b = hit.hitBox;
      const cx = Math.max(b.x, Math.min(player.x, b.x + b.w));
      const cy = Math.max(b.y, Math.min(player.y, b.y + b.h));
      if (Math.hypot(player.x - cx, player.y - cy) <= hit.interactRadius) {
        faceTowardAnchor(hit.anchor);
        UI.triggerInteractable(hit);
        return;
      }

      const startCol = Math.floor(player.x / MapRef.TILE);
      const startRow = Math.floor(player.y / MapRef.TILE);
      const path = MapRef.findPath(startCol, startRow, hit.standSpot.col, hit.standSpot.row);
      if (path.length > 0) {
        player.path = path;
        player.pendingInteract = hit;
        player.pendingDoor = null;
        Particles.spawnRipple(hit.anchor.x, hit.anchor.y);
      } else {
        UI.triggerInteractable(hit);
      }
      return;
    }

    // 3. Walk to ground tile
    const goalCol = Math.floor(pt.x / MapRef.TILE);
    const goalRow = Math.floor(pt.y / MapRef.TILE);
    const startCol = Math.floor(player.x / MapRef.TILE);
    const startRow = Math.floor(player.y / MapRef.TILE);
    const path = MapRef.findPath(startCol, startRow, goalCol, goalRow);
    if (path.length > 0) {
      player.path = path;
      player.pendingInteract = null;
      player.pendingDoor = null;
      Particles.spawnRipple(pt.x, pt.y);
    }
  }

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || UI.isBlockingInput()) {
      UI.state.hoveredId = null;
      UI.state.hoveredDoorId = null;
      canvas.style.cursor = 'default';
      return;
    }
    const room = MapRef.getCurrentRoom();
    const pt = screenToWorld(e.clientX, e.clientY);
    const door = MapRef.findDoorAtPoint(pt.x, pt.y);
    const petHit = door || !Pets ? null : Pets.findPetAtPoint(pt.x, pt.y, room.id);
    const hit = door ? null : (petHit || MapRef.findInteractableAtPoint(pt.x, pt.y));
    UI.state.hoveredDoorId = door ? door.id : null;
    UI.state.hoveredId = hit ? hit.id : null;
    canvas.style.cursor = door || hit ? 'pointer' : 'default';
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    handleRoomTap(e.clientX, e.clientY);
  });

  // Virtual Joystick Pointer Events
  function updateJoystickFromClient(clientX, clientY) {
    const rect = joystickBase.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    joystick.vx = dx / maxR;
    joystick.vy = dy / maxR;
  }

  function resetJoystick() {
    joystick.active = false;
    joystick.pointerId = null;
    joystick.vx = 0;
    joystick.vy = 0;
    joystickKnob.style.transform = 'translate(0px, 0px)';
  }

  joystickBase.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    Audio.unlock();
    joystick.active = true;
    joystick.pointerId = e.pointerId;
    if (joystickBase.setPointerCapture) {
      try {
        joystickBase.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
    updateJoystickFromClient(e.clientX, e.clientY);
  });

  joystickBase.addEventListener('pointermove', (e) => {
    if (!joystick.active || e.pointerId !== joystick.pointerId) return;
    e.preventDefault();
    updateJoystickFromClient(e.clientX, e.clientY);
  });

  joystickBase.addEventListener('pointerup', (e) => {
    if (e.pointerId === joystick.pointerId) resetJoystick();
  });
  joystickBase.addEventListener('pointercancel', resetJoystick);

  window.addEventListener('keydown', (e) => {
    const tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      if (e.code === 'Escape') e.target.blur();
      return;
    }
    if (UI.state.pianoOpen || UI.state.pcOpen || UI.state.wardrobeOpen) {
      if (e.code === 'Escape') UI.closeModal();
      return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) {
      e.preventDefault();
    }
    keys.add(e.code);

    if (e.code === 'Escape') {
      if (UI.state.activeModalOpen) UI.closeModal();
      else if (UI.state.activeDialogueOpen) UI.closeDialogue(true);
      else if (player.activity) exitActivity();
      return;
    }

    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      if (UI.state.activeDialogueOpen) {
        UI.advanceOrCloseDialogue();
        return;
      }
      if (!UI.isBlockingInput() && nearbyItem) {
        UI.triggerInteractable(nearbyItem);
        return;
      }
    }

    if (!UI.isBlockingInput()) {
      if (e.code === 'Digit1') triggerEmote('wave');
      else if (e.code === 'Digit2') triggerEmote('spin');
      else if (e.code === 'Digit3') triggerEmote('love');
      else if (e.code === 'Digit4') triggerEmote('dance');
    }

    if (e.code === 'KeyQ' && !UI.state.activeDialogueOpen) {
      if (UI.state.activeModalOpen) UI.closeModal();
      else UI.openQuestModal();
    }

    if (e.code === 'Tab' && !UI.state.activeDialogueOpen) {
      if (UI.state.activeModalOpen) UI.closeModal();
      else UI.openFloorMapModal();
    }

    if (e.code === 'KeyM') {
      Audio.togglePlay();
      UI.updateHud();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
  });

  window.addEventListener('blur', () => {
    keys.clear();
    resetJoystick();
  });

  interactPrompt.addEventListener('click', () => {
    if (!UI.isBlockingInput() && nearbyItem) {
      UI.triggerInteractable(nearbyItem);
    }
  });

  touchInteractBtn.addEventListener('click', () => {
    if (!UI.isBlockingInput() && nearbyItem) {
      UI.triggerInteractable(nearbyItem);
    }
  });

  window.addEventListener('resize', updateCanvasSize);

  updateCanvasSize();
  updateCamera(1, true);
  UI.init({
    audio: Audio,
    particles: Particles,
    callbacks: {
      onEnterRoom() {
        const cfg = window.SB.CONFIG;
        Particles.spawnConfetti(player.x, player.y - 36, 26);
        UI.showDialogue(
          cfg.celebrantName,
          `哇，整套七室甜美小屋都装扮好啦！客厅有「团团」和生日蛋糕，卧室有「lucky」和祝尼魔，还连着化妆衣帽间、泡泡浴室、书房、甜品屋和甜心厨房呢！`,
          'assets/protagonist-portrait.png'
        );
      },
      onTeleportRoom(targetRoomId) {
        const room = MapRef.getRoom(targetRoomId);
        if (room) transitionToRoom(room.id, room.spawn);
      },
      onStartActivity(act) {
        startActivity(act);
      },
      onExitActivity() {
        exitActivity();
      },
      onTriggerEmote(type) {
        triggerEmote(type);
      },
      onGetPlayerPos() {
        return { x: player.x, y: player.y };
      },
    },
  });
  UI.setCurrentRoom(startRoom);

  requestAnimationFrame(loop);
})();
