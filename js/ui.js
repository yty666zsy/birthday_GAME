window.SB = window.SB || {};

/**
 * 星露谷风格 UI 系统：开场门扉、底部对话框、信件、蛋糕、礼物宝箱、照片墙、电视、日历、点唱机、委托日志与终极烟花彩蛋
 */
window.SB.UI = (function () {
  const STORAGE_KEY = 'stardew_birthday_room_v1';
  const PC_NOTES_KEY = 'stardew_pc_notes_v1';
  const DEFAULT_PC_NOTES = [
    { id: 'n1', text: '🎂 祝小Q包张哼哼生日快乐！每天都要像今天一样闪闪发光呀～', pinned: true },
    { id: 'n2', text: '🐶🐱 今晚记得给团团和 lucky 加餐小肉干和小鱼干！', pinned: true },
    { id: 'n3', text: '🎹 新买的法式奶油立式钢琴音色超温柔，试试弹一首《生日快乐歌》吧！', pinned: true },
  ];

  let cfg = null;
  let audio = null;
  let particles = null;
  let callbacks = {};

  // Persistent room state
  const state = {
    completedQuests: new Set(),
    openedGifts: new Set(),
    candlesBlown: false,
    finaleTriggered: false,
    junimoIndex: 0,
    gachaIndex: 0,
    currentRoomId: 'living',
    activeModalOpen: false,
    activeDialogueOpen: false,
    hoveredId: null,
    hoveredDoorId: null,
    nearbyId: null,
    musicPlaying: false,
    giftsOpenedCount: 0,
    livingLampsOn: true,
    bedroomLampOn: true,
    studyLampOn: true,
    bathroomMirrorLed: true,
    showerRunning: false,
    nightMode: false,
    birthdayWish: '',
    playerActivity: null,
    pianoOpen: false,
    pcOpen: false,
    wardrobeOpen: false,
    cookingOpen: false,
    pcWallpaper: 'sakura',
    pcNotes: DEFAULT_PC_NOTES.slice(),
    pcLikes: { girl: 99, pug: 52, cat: 66, junimo: 88 },
  };

  // DOM refs
  const els = {};
  let cakeAnimRaf = null;
  let tvAnimRaf = null;
  let pcGameRaf = null;
  let wardrobePreviewRaf = null;
  let cookingRaf = null;
  let pianoAutoTimer = null;
  let pianoKeyHandler = null;
  let pcKeyHandler = null;
  let cookingKeyHandler = null;
  let activeExtraAction = null;
  let showingProtagonistAvatar = true;
  let typingTimer = null;
  let typingFullText = '';
  let typingDone = true;
  let activeChoices = false;
  let pendingDialogueClose = null;
  let pendingFinaleAfterClose = false;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.completedQuests)) {
        data.completedQuests.forEach((id) => state.completedQuests.add(id));
      }
      if (Array.isArray(data.openedGifts)) {
        data.openedGifts.forEach((id) => state.openedGifts.add(id));
      }
      state.candlesBlown = Boolean(data.candlesBlown);
      state.finaleTriggered = Boolean(data.finaleTriggered);
      state.giftsOpenedCount = state.openedGifts.size;
    } catch (_) {}
    try {
      const rawNotes = localStorage.getItem(PC_NOTES_KEY);
      if (rawNotes) {
        const parsed = JSON.parse(rawNotes);
        if (Array.isArray(parsed) && parsed.length > 0) state.pcNotes = parsed;
      }
    } catch (_) {}
  }

  function savePcNotes() {
    try {
      localStorage.setItem(PC_NOTES_KEY, JSON.stringify(state.pcNotes));
    } catch (_) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          completedQuests: Array.from(state.completedQuests),
          openedGifts: Array.from(state.openedGifts),
          candlesBlown: state.candlesBlown,
          finaleTriggered: state.finaleTriggered,
        })
      );
    } catch (_) {}
  }

  function resetProgress() {
    state.completedQuests.clear();
    state.openedGifts.clear();
    state.candlesBlown = false;
    state.finaleTriggered = false;
    state.giftsOpenedCount = 0;
    pendingFinaleAfterClose = false;
    saveProgress();
    updateHud();
  }

  function parseBirthdayInfo() {
    const dateStr = cfg.birthdayDate || '2026-11-20';
    const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
    const month = Number.isFinite(m) ? m : 1;
    const day = Number.isFinite(d) ? d : 1;
    const year = Number.isFinite(y) ? y : new Date().getFullYear();

    let season = '冬';
    if (month >= 3 && month <= 5) season = '春';
    else if (month >= 6 && month <= 8) season = '夏';
    else if (month >= 9 && month <= 11) season = '秋';

    // Countdown relative to today's local date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let nextBday = new Date(today.getFullYear(), month - 1, day);
    if (nextBday < today) {
      nextBday = new Date(today.getFullYear() + 1, month - 1, day);
    }
    const diffDays = Math.round((nextBday - today) / 86400000);
    const stardewDay = Math.min(28, Math.max(1, day));

    let countdownText = '';
    if (diffDays === 0) {
      countdownText = `🎉 就是今天！${cfg.celebrantName}生日快乐！`;
    } else if (diffDays === 1) {
      countdownText = '✨ 就在明天！距离生日还有 1 天';
    } else {
      countdownText = `✨ 距离下一次生日还有 ${diffDays} 天`;
    }

    return { year, month, day, stardewDay, season, countdownText };
  }

  function updateHud() {
    const binfo = parseBirthdayInfo();
    const total = cfg.quests.length;
    const doneCount = state.completedQuests.size;

    els.hudSeason.textContent = `${binfo.season}季`;
    els.hudDatePrefix.textContent = `${binfo.month}月${binfo.day}日 · `;
    els.hudNameText.textContent = cfg.celebrantName;
    els.questBtnLabel.textContent = `委托 ${doneCount}/${total}`;

    if (doneCount >= total) {
      els.questBtn.classList.add('quest-complete');
    } else {
      els.questBtn.classList.remove('quest-complete');
    }

    state.musicPlaying = audio.isPlaying();
    if (state.musicPlaying) {
      els.musicBtn.classList.add('music-on');
      els.musicBtn.textContent = '♫ 播放';
    } else {
      els.musicBtn.classList.remove('music-on');
      els.musicBtn.textContent = '♪ 音乐';
    }
  }

  function markQuestDone(questId) {
    if (!questId || state.completedQuests.has(questId)) return false;
    state.completedQuests.add(questId);
    saveProgress();
    updateHud();
    audio.questDone();
    if (state.completedQuests.size >= cfg.quests.length && !state.finaleTriggered) {
      pendingFinaleAfterClose = true;
    }
    return true;
  }

  function setCurrentRoom(room) {
    if (!room) return;
    state.currentRoomId = room.id;
    state.hoveredId = null;
    state.hoveredDoorId = null;
    state.nearbyId = null;
    setNearbyPrompt(null);
    if (els.roomBannerName) {
      els.roomBannerName.textContent = `${room.icon || '🏠'} ${room.name}`;
    }
  }

  function openFloorMapModal() {
    const MapRef = window.SB.Map;
    const roomMeta = [
      { id: 'dressing', posClass: 'map-room-pos-nw', desc: '梳妆台 · 左右衣柜 · 自由换装' },
      { id: 'bedroom', posClass: 'map-room-pos-north', desc: '公主床 · 钢琴 · lucky' },
      { id: 'bathroom', posClass: 'map-room-pos-ne', desc: '淋浴间 · 浴缸 · 洗手台 · 马桶' },
      { id: 'study', posClass: 'map-room-pos-west', desc: '生日来信 · 照片墙 · 礼物宝箱' },
      { id: 'living', posClass: 'map-room-pos-center', desc: '法式奶油客厅 · 蛋糕 · 沙发 · 团团' },
      { id: 'kitchen', posClass: 'map-room-pos-east', desc: '大冰箱 · 洗菜池 · 炒菜做饭' },
    ];

    openModalFrame('小Q包张哼哼的小家 · 六室平面图', (body) => {
      const tip = el('div', '');
      tip.style.fontSize = '13px';
      tip.style.marginBottom = '12px';
      tip.textContent = '你可以直接从房间里的木门走过去，也可以点击下方房间卡片快速串门！';
      body.appendChild(tip);

      const grid = el('div', 'map-cross-grid');
      roomMeta.forEach((meta) => {
        const room = MapRef.getRoom(meta.id);
        const pending = MapRef.getRoomPendingQuestCount(meta.id, state.completedQuests);
        const isCur = state.currentRoomId === meta.id;

        const card = el(
          'button',
          `map-room-card ${meta.posClass} ${isCur ? 'current' : ''}`
        );
        card.appendChild(el('span', 'map-room-icon', room.icon));
        card.appendChild(el('span', 'map-room-title', room.name));
        card.appendChild(el('span', 'map-room-sub', meta.desc));

        if (pending > 0) {
          card.appendChild(el('span', 'map-quest-badge', `! ${pending}`));
        } else if (isCur) {
          card.appendChild(el('span', 'map-quest-badge', '当前'));
        }

        card.addEventListener('click', () => {
          closeModal();
          if (!isCur && callbacks.onTeleportRoom) {
            callbacks.onTeleportRoom(meta.id);
          }
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);

      const footer = el('div', 'modal-footer-actions');
      const closeBtn = el('button', 'sd-btn secondary', '回到当前房间');
      closeBtn.addEventListener('click', () => closeModal());
      footer.appendChild(closeBtn);
      body.appendChild(footer);
    });
  }

  function isBlockingInput() {
    return (
      !els.welcomeOverlay.classList.contains('hidden') ||
      state.activeModalOpen ||
      state.activeDialogueOpen
    );
  }

  function setNearbyPrompt(item) {
    state.nearbyId = item ? item.id : null;
    if (!item || state.playerActivity) {
      els.interactPrompt.classList.add('hidden');
      els.touchInteractBtn.classList.add('hidden');
      return;
    }
    els.interactPrompt.classList.remove('hidden');
    els.interactPromptText.textContent = item.label;

    els.touchInteractBtn.classList.remove('hidden');
    els.touchInteractBtn.textContent = `✨ ${item.label}`;
  }

  function setActivityState(activity) {
    state.playerActivity = activity || null;
    activeExtraAction = activity && activity.extraAction ? activity.extraAction : null;
    if (activity) {
      if (els.activityLabel) els.activityLabel.textContent = activity.label || '';
      if (els.activityExtraBtn) {
        if (activeExtraAction) {
          els.activityExtraBtn.textContent = activeExtraAction.label;
          els.activityExtraBtn.classList.remove('hidden');
        } else {
          els.activityExtraBtn.classList.add('hidden');
        }
      }
      if (els.activityBar) els.activityBar.classList.remove('hidden');
      els.interactPrompt.classList.add('hidden');
      els.touchInteractBtn.classList.add('hidden');
    } else {
      if (els.activityExtraBtn) els.activityExtraBtn.classList.add('hidden');
      if (els.activityBar) els.activityBar.classList.add('hidden');
    }
  }

  function cleanupModalResources() {
    if (cakeAnimRaf) {
      cancelAnimationFrame(cakeAnimRaf);
      cakeAnimRaf = null;
    }
    if (tvAnimRaf) {
      cancelAnimationFrame(tvAnimRaf);
      tvAnimRaf = null;
    }
    if (pcGameRaf) {
      cancelAnimationFrame(pcGameRaf);
      pcGameRaf = null;
    }
    if (wardrobePreviewRaf) {
      cancelAnimationFrame(wardrobePreviewRaf);
      wardrobePreviewRaf = null;
    }
    if (cookingRaf) {
      cancelAnimationFrame(cookingRaf);
      cookingRaf = null;
    }
    if (pianoAutoTimer) {
      clearTimeout(pianoAutoTimer);
      pianoAutoTimer = null;
    }
    if (pianoKeyHandler) {
      window.removeEventListener('keydown', pianoKeyHandler);
      pianoKeyHandler = null;
    }
    if (pcKeyHandler) {
      window.removeEventListener('keydown', pcKeyHandler);
      window.removeEventListener('keyup', pcKeyHandler);
      pcKeyHandler = null;
    }
    if (cookingKeyHandler) {
      window.removeEventListener('keydown', cookingKeyHandler);
      cookingKeyHandler = null;
    }
    if (state.pianoOpen && audio && audio.setBgmDuck) {
      audio.setBgmDuck(false);
    }
    if (audio && audio.stopVoiceWish) {
      audio.stopVoiceWish();
    }
    state.pianoOpen = false;
    state.pcOpen = false;
    state.wardrobeOpen = false;
    state.cookingOpen = false;
  }

  function getProtagonistPortrait() {
    const Wardrobe = window.SB.Wardrobe;
    return (Wardrobe && Wardrobe.getPortraitSrc && Wardrobe.getPortraitSrc()) || 'assets/protagonist-portrait.png';
  }

  function closeModal() {
    cleanupModalResources();
    if (els.modalCard) els.modalCard.classList.remove('wide-modal');
    els.modalBackdrop.classList.add('hidden');
    els.modalBody.innerHTML = '';
    state.activeModalOpen = false;
    audio.close();

    if (pendingFinaleAfterClose && !state.finaleTriggered) {
      pendingFinaleAfterClose = false;
      setTimeout(() => openFinaleModal(), 260);
    }
  }

  function openModalFrame(titleText, buildBodyFn, wide = false) {
    closeDialogue(true);
    cleanupModalResources();
    if (els.modalCard) els.modalCard.classList.toggle('wide-modal', Boolean(wide));
    els.modalTitle.textContent = titleText;
    els.modalBody.innerHTML = '';
    buildBodyFn(els.modalBody);
    els.modalBackdrop.classList.remove('hidden');
    state.activeModalOpen = true;
    audio.open();
  }

  // -------------------- Dialogue Box --------------------
  function startDialogueTyping(speaker, text, avatarSrc, hasChoices) {
    if (state.activeModalOpen) closeModal();
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    activeChoices = Boolean(hasChoices);
    els.dialogueSpeaker.textContent = speaker;
    showingProtagonistAvatar = !avatarSrc || avatarSrc === 'assets/protagonist-portrait.png';
    els.dialogueAvatar.src = showingProtagonistAvatar ? getProtagonistPortrait() : avatarSrc;
    els.dialogueText.textContent = '';
    typingFullText = text;
    typingDone = false;

    if (els.dialogueChoices) {
      els.dialogueChoices.innerHTML = '';
      els.dialogueChoices.classList.toggle('hidden', !activeChoices);
    }
    els.dialogueNext.classList.toggle('hidden', activeChoices);
    els.dialogueNext.textContent = '▶ 点击 / 空格跳过';

    els.dialogueBackdrop.classList.remove('hidden');
    state.activeDialogueOpen = true;

    let idx = 0;
    typingTimer = setInterval(() => {
      idx += 1;
      els.dialogueText.textContent = typingFullText.slice(0, idx);
      if (idx % 3 === 0) audio.blip();
      if (idx >= typingFullText.length) {
        clearInterval(typingTimer);
        typingTimer = null;
        typingDone = true;
        if (!activeChoices) {
          els.dialogueNext.textContent = '▼ 点击 / 空格继续';
        }
      }
    }, 28);
  }

  function showDialogue(speaker, text, avatarSrc, onDone) {
    pendingDialogueClose = onDone || null;
    startDialogueTyping(speaker, text, avatarSrc, false);
  }

  function showDialogueChoices(speaker, text, choices, avatarSrc) {
    pendingDialogueClose = null;
    startDialogueTyping(speaker, text, avatarSrc, true);
    if (!els.dialogueChoices) return;

    (choices || []).forEach((ch) => {
      const btn = el(
        'button',
        `dialogue-choice-btn ${ch.primary ? 'primary' : 'secondary'}`,
        ch.label
      );
      btn.type = 'button';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDialogue(true);
        if (ch.onSelect) ch.onSelect();
      });
      els.dialogueChoices.appendChild(btn);
    });
  }

  function advanceOrCloseDialogue() {
    if (!state.activeDialogueOpen) return;
    if (!typingDone) {
      if (typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
      }
      els.dialogueText.textContent = typingFullText;
      typingDone = true;
      if (!activeChoices) {
        els.dialogueNext.textContent = '▼ 点击 / 空格继续';
      }
      return;
    }
    if (activeChoices) return;
    closeDialogue(false);
  }

  function closeDialogue(silent) {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    if (els.dialogueChoices) {
      els.dialogueChoices.innerHTML = '';
      els.dialogueChoices.classList.add('hidden');
    }
    els.dialogueNext.classList.remove('hidden');
    activeChoices = false;
    els.dialogueBackdrop.classList.add('hidden');
    state.activeDialogueOpen = false;
    const cb = pendingDialogueClose;
    pendingDialogueClose = null;
    if (!silent) {
      audio.close();
      if (cb) cb();
      if (pendingFinaleAfterClose && !state.finaleTriggered) {
        pendingFinaleAfterClose = false;
        setTimeout(() => openFinaleModal(), 260);
      }
    }
  }

  // -------------------- Specific Interactive Modals --------------------
  function openLetterModal() {
    const l = cfg.letter;
    openModalFrame(l.title, (body) => {
      const sheet = el('div', 'letter-sheet');
      const seal = el('div', 'letter-seal-badge', '🎂');
      sheet.appendChild(seal);
      sheet.appendChild(el('div', 'letter-salutation', l.salutation));
      l.paragraphs.forEach((p) => {
        sheet.appendChild(el('p', '', p));
      });
      const sigText = `${l.signOff}\n—— ${cfg.senderName}（${l.senderTitle}）`;
      const sig = el('div', 'letter-signature', sigText);
      sig.style.whiteSpace = 'pre-line';
      sheet.appendChild(sig);
      body.appendChild(sheet);

      const footer = el('div', 'modal-footer-actions');
      const okBtn = el('button', 'sd-btn green', '收好这封信 💌');
      okBtn.addEventListener('click', () => {
        markQuestDone('letter');
        closeModal();
      });
      footer.appendChild(okBtn);
      body.appendChild(footer);
    });
    markQuestDone('letter');
  }

  function drawCakeCanvas(canvas, t) {
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    const w = canvas.width;
    const h = canvas.height;
    c.clearRect(0, 0, w, h);

    // Night room backdrop inside cake viewer
    c.fillStyle = '#241b36';
    c.fillRect(0, 0, w, h);
    // Warm table cloth
    c.fillStyle = '#fff3d6';
    c.fillRect(0, 146, w, 64);
    c.fillStyle = '#f2b8c2';
    c.fillRect(0, 146, w, 6);

    // Cake plate
    c.fillStyle = '#d4e2f0';
    c.fillRect(46, 150, 168, 12);
    c.fillStyle = '#ffffff';
    c.fillRect(54, 146, 152, 6);

    // Bottom sponge tier
    c.fillStyle = '#f295a3';
    c.fillRect(66, 102, 128, 44);
    c.fillStyle = '#fffdf7';
    c.fillRect(66, 102, 128, 12);
    // Cream drips
    [72, 92, 114, 136, 158, 178].forEach((dx, idx) => {
      c.fillRect(dx, 114, 10, idx % 2 === 0 ? 12 : 8);
    });

    // Top cream tier
    c.fillStyle = '#fffdf7';
    c.fillRect(84, 68, 92, 34);
    c.fillStyle = '#ffb7c5';
    c.fillRect(84, 84, 92, 10);

    // Strawberries along top rim
    [88, 106, 124, 142, 160].forEach((sx) => {
      c.fillStyle = '#e63946';
      c.fillRect(sx, 62, 10, 8);
      c.fillStyle = '#5eb857';
      c.fillRect(sx + 2, 59, 6, 3);
    });

    // Candles
    const count = Math.max(3, Math.min(7, cfg.cake.candleCount || 5));
    const startX = 130 - ((count - 1) * 16) / 2;
    for (let i = 0; i < count; i++) {
      const cx = Math.round(startX + i * 16);
      c.fillStyle = i % 2 === 0 ? '#78d5f5' : '#ffd257';
      c.fillRect(cx - 3, 38, 6, 26);
      c.fillStyle = '#ffffff';
      c.fillRect(cx - 3, 44, 6, 3);
      c.fillRect(cx - 3, 54, 6, 3);

      if (!state.candlesBlown) {
        const sway = Math.round(Math.sin(t * 9 + i * 1.3) * 1.5);
        // Warm glow halo
        c.fillStyle = 'rgba(255, 224, 112, 0.28)';
        c.beginPath();
        c.arc(cx + sway, 28, 12, 0, Math.PI * 2);
        c.fill();
        // Flame
        c.fillStyle = '#ff9824';
        c.fillRect(cx - 3 + sway, 24, 6, 11);
        c.fillStyle = '#fff59d';
        c.fillRect(cx - 1 + sway, 27, 3, 7);
      } else {
        // Blown wick + faint wisps
        c.fillStyle = '#5c4d45';
        c.fillRect(cx - 1, 34, 2, 4);
        const rise = ((t * 25 + i * 7) % 16);
        c.fillStyle = `rgba(225, 220, 230, ${(0.55 - rise / 32).toFixed(2)})`;
        c.fillRect(cx - 2 + Math.round(Math.sin(t * 4 + i) * 2), 30 - Math.round(rise), 4, 4);
      }
    }
  }

  function openCakeModal() {
    openModalFrame(cfg.cake.title, (body) => {
      const stage = el('div', 'cake-stage');
      const canvas = el('canvas', 'cake-canvas');
      canvas.width = 260;
      canvas.height = 200;
      stage.appendChild(canvas);

      const statusBox = el('div', 'cake-status-box');
      const statusTitle = el('div', '');
      statusTitle.style.fontWeight = 'bold';
      statusTitle.style.marginBottom = '4px';
      const statusSub = el('div', '');
      statusBox.appendChild(statusTitle);
      statusBox.appendChild(statusSub);
      stage.appendChild(statusBox);

      const actions = el('div', 'modal-footer-actions');
      const blowBtn = el('button', 'sd-btn red');
      actions.appendChild(blowBtn);
      stage.appendChild(actions);
      body.appendChild(stage);

      function syncCakeUI() {
        if (!state.candlesBlown) {
          statusTitle.textContent = '🕯️ 蜡烛正在闪闪发光';
          statusSub.textContent = cfg.cake.wishHint;
          blowBtn.textContent = '许愿并吹灭蜡烛 🎂';
          blowBtn.className = 'sd-btn red';
        } else {
          statusTitle.textContent = cfg.cake.afterBlowTitle;
          statusSub.textContent = cfg.cake.afterBlowText;
          blowBtn.textContent = '重新点亮蜡烛 🕯️';
          blowBtn.className = 'sd-btn secondary';
        }
      }

      // Birthday Wish & Keepsake Polaroid Postcard Card
      const wishBox = el('div', 'cake-wish-box');
      wishBox.appendChild(el('div', 'cake-wish-title', '✨ 写下今年的生日愿望（可生成专属纪念明信片）：'));
      const wishInput = document.createElement('input');
      wishInput.type = 'text';
      wishInput.className = 'cake-wish-input';
      wishInput.maxLength = 60;
      wishInput.placeholder = '输入你的生日愿望，或点下方快捷心愿…';
      wishInput.value = state.birthdayWish || localStorage.getItem('stardew_birthday_wish_v1') || '';
      wishBox.appendChild(wishInput);

      const chipRow = el('div', 'cake-wish-chips');
      (cfg.wishPresets || []).forEach((txt) => {
        const chip = el('button', 'cake-wish-chip', txt);
        chip.type = 'button';
        chip.addEventListener('click', () => {
          wishInput.value = txt;
          audio.blip();
        });
        chipRow.appendChild(chip);
      });
      wishBox.appendChild(chipRow);

      const postcardBtn = el('button', 'sd-btn', '📸 封存心愿 & 生成纪念明信片');
      postcardBtn.type = 'button';
      postcardBtn.addEventListener('click', () => {
        const val = wishInput.value.trim() || (cfg.wishPresets && cfg.wishPresets[0]) || '新的一岁永远被温柔与偏爱包围！';
        state.birthdayWish = val;
        try {
          localStorage.setItem('stardew_birthday_wish_v1', val);
        } catch (_) {}
        audio.questDone();
        openPostcardModal(val);
      });
      wishBox.appendChild(postcardBtn);
      stage.appendChild(wishBox);

      blowBtn.addEventListener('click', () => {
        if (!state.candlesBlown) {
          state.candlesBlown = true;
          saveProgress();
          audio.candleBlow();
          particles.spawnSmoke(208, 304, 14);
          particles.spawnConfetti(208, 310, 58);
          markQuestDone('cake');
        } else {
          state.candlesBlown = false;
          saveProgress();
          audio.open();
        }
        syncCakeUI();
      });

      syncCakeUI();

      const start = performance.now();
      function anim(now) {
        if (!state.activeModalOpen) return;
        drawCakeCanvas(canvas, (now - start) / 1000);
        cakeAnimRaf = requestAnimationFrame(anim);
      }
      cakeAnimRaf = requestAnimationFrame(anim);
    });
  }

  function openRoomGift(questId) {
    const gifts = cfg.gifts || [];
    const target = gifts.find((g) => g.questId === questId) || gifts[0];
    if (target) {
      const newlyOpened = !state.openedGifts.has(target.id);
      if (newlyOpened) {
        state.openedGifts.add(target.id);
        state.giftsOpenedCount = state.openedGifts.size;
        saveProgress();
        audio.giftOpen();
      } else {
        audio.blip();
      }
      if (target.questId) markQuestDone(target.questId);
      openGiftsModal(target.id);
      return;
    }
    openGiftsModal();
  }

  function openGiftsModal(focusGiftId = null) {
    openModalFrame('六室隐藏礼物收集册 · 礼物宝箱', (body) => {
      const gifts = cfg.gifts || [];
      let selectedId = focusGiftId || (gifts[0] ? gifts[0].id : null);

      const countNotice = el('div', '');
      countNotice.style.marginBottom = '10px';
      countNotice.style.fontSize = '13px';
      body.appendChild(countNotice);

      const grid = el('div', 'gift-grid');
      const detail = el('div', 'gift-detail-card');
      body.appendChild(grid);
      body.appendChild(detail);

      function renderDetail(gift) {
        detail.innerHTML = '';
        if (!gift) return;
        const opened = state.openedGifts.has(gift.id);

        const titleRow = el('div', 'gift-detail-title');
        if (gift.icon) {
          const ic = document.createElement('img');
          ic.src = gift.icon;
          ic.width = 28;
          ic.height = 28;
          ic.style.imageRendering = 'pixelated';
          titleRow.appendChild(ic);
        } else {
          titleRow.appendChild(el('span', '', gift.emoji || '🎁'));
        }
        titleRow.appendChild(el('span', '', opened ? gift.name : `未发现的礼物（${gift.roomHint || '小屋角落'}）`));
        if (opened && gift.quality) {
          const q = el('span', 'gift-quality-tag', gift.quality);
          q.style.position = 'static';
          titleRow.appendChild(q);
        }
        detail.appendChild(titleRow);

        if (opened) {
          const tag = el('div', '', `${gift.tagline}${gift.roomHint ? ` · 来自【${gift.roomHint}】` : ''}`);
          tag.style.fontSize = '12px';
          tag.style.color = '#94522e';
          tag.style.marginBottom = '6px';
          detail.appendChild(tag);
          detail.appendChild(el('div', '', gift.message));
        } else {
          const hint = el('div', '', `这份礼物藏在【${gift.roomHint || '某个房间'}】，去那个房间点一下闪闪发光的礼物盒就能拆开啦！`);
          hint.style.marginBottom = '8px';
          detail.appendChild(hint);
          if (gift.roomId && gift.roomId !== state.currentRoomId && callbacks.onTeleportRoom) {
            const goBtn = el('button', 'sd-btn secondary', `🚪 立刻前往寻找`);
            goBtn.addEventListener('click', () => {
              closeModal();
              callbacks.onTeleportRoom(gift.roomId);
            });
            detail.appendChild(goBtn);
          }
        }
      }

      function renderGrid() {
        grid.innerHTML = '';
        countNotice.textContent = `已找到并拆开 ${state.openedGifts.size} / ${gifts.length} 份藏在各房间的生日礼物！`;

        gifts.forEach((gift) => {
          const opened = state.openedGifts.has(gift.id);
          const btn = el(
            'button',
            `gift-slot ${opened ? 'opened' : 'unopened'} ${selectedId === gift.id ? 'selected' : ''}`
          );

          if (opened) {
            if (gift.icon) {
              const img = document.createElement('img');
              img.src = gift.icon;
              img.alt = gift.name;
              btn.appendChild(img);
            } else {
              btn.appendChild(el('span', 'gift-emoji', gift.emoji || '🎁'));
            }
            btn.appendChild(el('span', 'gift-slot-name', gift.name));
            if (gift.quality) {
              btn.appendChild(el('span', 'gift-quality-tag', gift.quality));
            }
          } else {
            btn.appendChild(el('span', 'gift-emoji', '🎁'));
            btn.appendChild(el('span', 'gift-slot-name', gift.roomHint ? gift.roomHint.split('·')[0].trim() : '未拆封'));
          }

          btn.addEventListener('click', () => {
            selectedId = gift.id;
            audio.blip();
            renderGrid();
            renderDetail(gift);
          });
          grid.appendChild(btn);
        });
      }

      const openAllBtn = el('button', 'sd-btn secondary', '一键拆开全部礼盒 ✨');
      openAllBtn.addEventListener('click', () => {
        gifts.forEach((g) => {
          state.openedGifts.add(g.id);
          if (g.questId) markQuestDone(g.questId);
        });
        state.giftsOpenedCount = state.openedGifts.size;
        saveProgress();
        audio.giftOpen();
        particles.spawnConfetti(320, 240, 42);
        renderGrid();
        renderDetail(gifts.find((g) => g.id === selectedId) || gifts[0]);
      });

      const footer = el('div', 'modal-footer-actions');
      footer.appendChild(openAllBtn);
      body.appendChild(footer);

      renderGrid();
      const focusObj = gifts.find((g) => g.id === selectedId) || gifts[0];
      renderDetail(focusObj);
    });
  }

  function openBirthdayMenuModal() {
    openModalFrame(`🎂 ${cfg.celebrantName} · 生日主题菜单`, (body) => {
      const gifts = cfg.gifts || [];
      const quests = cfg.quests || [];
      const intro = el(
        'div',
        'bday-menu-intro',
        `欢迎来到为 ${cfg.celebrantName} 准备的生日小屋！这里可以随时查看生日来信、照片回忆墙、全屋礼物收集册与生日委托进度～`
      );
      body.appendChild(intro);

      const grid = el('div', 'bday-menu-grid');
      const items = [
        {
          icon: '💌',
          title: '生日来信',
          sub: state.completedQuests.has('letter') ? '已阅读 · 再读一遍' : '一封写给你的长信 ✨',
          highlight: true,
          onClick: () => openLetterModal(),
        },
        {
          icon: '🖼️',
          title: '照片回忆墙',
          sub: state.completedQuests.has('memories') ? '已翻看 · 回味美好瞬间' : '4 段闪闪发光的回忆 ✨',
          highlight: true,
          onClick: () => openMemoriesModal(),
        },
        {
          icon: '🎁',
          title: '六室礼物收集册',
          sub: `已找到 ${state.openedGifts.size} / ${gifts.length} 份隐藏礼物`,
          highlight: false,
          onClick: () => openGiftsModal(),
        },
        {
          icon: '🎂',
          title: '生日许愿蛋糕',
          sub: state.completedQuests.has('cake') ? '已许愿吹蜡烛 ✨' : '点亮蜡烛许个愿吧',
          highlight: false,
          onClick: () => openCakeModal(),
        },
        {
          icon: '📜',
          title: '生日特别委托',
          sub: `已完成 ${state.completedQuests.size} / ${quests.length} 项`,
          highlight: false,
          onClick: () => openQuestModal(),
        },
        {
          icon: '🎵',
          title: '生日点唱机',
          sub: '切换八音盒与温暖旋律',
          highlight: false,
          onClick: () => openJukeboxModal(),
        },
        {
          icon: '👗',
          title: '衣帽间换装',
          sub: '自由搭配衣服发型发饰',
          highlight: false,
          onClick: () => openWardrobeModal('outfit'),
        },
        {
          icon: '🍳',
          title: '厨房私房菜谱',
          sub: '查看炒菜食谱与解锁图鉴',
          highlight: false,
          onClick: () => openCookingModal('recipes'),
        },
        {
          icon: '📸',
          title: '许愿纪念明信片',
          sub: state.birthdayWish ? '已封存心愿 · 查看/保存明信片' : '写下生日愿望生成拍立得 ✨',
          highlight: true,
          onClick: () => openPostcardModal(state.birthdayWish || localStorage.getItem('stardew_birthday_wish_v1') || ''),
        },
        {
          icon: '📻',
          title: '亲友祝福电台',
          sub: '听听团团、lucky 与大家的祝福',
          highlight: false,
          onClick: () => openBlessingsModal(),
        },
        {
          icon: '🫙',
          title: '情绪夸夸罐',
          sub: '随时抽一张被偏爱的暖心纸条 💖',
          highlight: true,
          onClick: () => openComfortJarModal(),
        },
        {
          icon: '⏳',
          title: '时光胶囊信件',
          sub: '写一封信给明年今天的自己 💌',
          highlight: false,
          onClick: () => openTimeCapsuleModal(),
        },
        {
          icon: state.nightMode ? '☀️' : '🌙',
          title: state.nightMode ? '切回白天阳光' : '切到星空夜晚',
          sub: state.nightMode ? '当前：浪漫星空夜灯模式' : '点亮满屋暖灯与窗外星空 ✨',
          highlight: false,
          onClick: () => {
            toggleNightMode();
            openBirthdayMenuModal();
          },
        },
      ];

      items.forEach((it) => {
        const card = el('button', `bday-menu-card ${it.highlight ? 'highlight' : ''}`);
        card.type = 'button';
        card.innerHTML = `
          <span class="bday-menu-ico">${it.icon}</span>
          <div class="bday-menu-meta">
            <div class="bday-menu-title">${it.title}</div>
            <div class="bday-menu-sub">${it.sub}</div>
          </div>
        `;
        card.addEventListener('click', () => {
          audio.blip();
          it.onClick();
        });
        grid.appendChild(card);
      });

      body.appendChild(grid);
    });
  }

  function toggleNightMode() {
    state.nightMode = !state.nightMode;
    audio.blip();
    if (els.timeModeBtn) {
      els.timeModeBtn.textContent = state.nightMode ? '🌙 星空夜' : '☀️ 白天';
      els.timeModeBtn.classList.toggle('night-on', state.nightMode);
    }
  }

  function openPostcardModal(wishText) {
    const finalWish = (wishText || '').trim() || (cfg.wishPresets && cfg.wishPresets[0]) || '新的一岁天天开心，永远被偏爱！';
    state.birthdayWish = finalWish;

    openModalFrame('📸 专属生日许愿纪念明信片', (body) => {
      const wrap = el('div', 'postcard-wrap');
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 500;
      canvas.className = 'postcard-canvas';
      wrap.appendChild(canvas);

      function renderPostcard() {
        const ctx = canvas.getContext('2d');
        // Warm cream Polaroid background
        const grad = ctx.createLinearGradient(0, 0, 0, 500);
        grad.addColorStop(0, '#fff4f8');
        grad.addColorStop(1, '#fff8eb');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 760, 500);

        // Outer Stardew wood-pink frame
        ctx.strokeStyle = '#9c5268';
        ctx.lineWidth = 8;
        ctx.strokeRect(10, 10, 740, 480);
        ctx.strokeStyle = '#ffd0df';
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 20, 720, 460);

        // Inner night/pastel sky snapshot box
        const sky = ctx.createLinearGradient(0, 42, 0, 315);
        sky.addColorStop(0, state.nightMode ? '#29224d' : '#ffdbe8');
        sky.addColorStop(1, state.nightMode ? '#52386e' : '#fff3dc');
        ctx.fillStyle = sky;
        ctx.fillRect(38, 40, 684, 272);
        ctx.strokeStyle = '#c48499';
        ctx.lineWidth = 3;
        ctx.strokeRect(38, 40, 684, 272);

        // Soft floor rug inside snapshot
        ctx.fillStyle = '#ffeaf2';
        ctx.fillRect(38, 250, 684, 62);
        ctx.fillStyle = '#f5bfd1';
        ctx.fillRect(38, 250, 684, 5);

        // Twinkling stars & hearts in postcard sky
        const stars = [[88, 74], [160, 104], [240, 68], [520, 72], [610, 96], [670, 66], [380, 62]];
        stars.forEach(([sx, sy], i) => {
          ctx.fillStyle = i % 2 === 0 ? '#ffe066' : '#ff9ebb';
          ctx.fillRect(sx - 2, sy - 6, 4, 12);
          ctx.fillRect(sx - 6, sy - 2, 12, 4);
        });

        // Header stamp
        ctx.fillStyle = state.nightMode ? '#fff2b0' : '#9e3656';
        ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🎂 ${cfg.birthdayDate || '2026-11-20'} · ${cfg.celebrantName}的生日小屋纪念`, 380, 78);

        // Draw protagonist (live dressed-up look!) + 团团 + lucky
        const Wardrobe = window.SB.Wardrobe;
        const girlCanvas = Wardrobe && Wardrobe.isReady && Wardrobe.isReady('front')
          ? Wardrobe.getViewCanvas('front')
          : null;

        const pugImg = new Image();
        pugImg.src = 'assets/pets/pug.png';
        const catImg = new Image();
        catImg.src = 'assets/pets/shorthair.png';
        const girlFallback = new Image();
        girlFallback.src = 'assets/protagonist.png';

        function drawCast() {
          // Re-paint floor strip & cast cleanly
          ctx.fillStyle = '#ffeaf2';
          ctx.fillRect(42, 255, 676, 54);
          // Shadows
          ctx.fillStyle = 'rgba(80, 35, 50, 0.16)';
          [245, 380, 515].forEach((cx) => {
            ctx.beginPath();
            ctx.ellipse(cx, 286, 34, 8, 0, 0, Math.PI * 2);
            ctx.fill();
          });

          if (pugImg.complete && pugImg.naturalWidth) {
            const ph = 92;
            const pw = Math.round(ph * (pugImg.naturalWidth / pugImg.naturalHeight));
            ctx.drawImage(pugImg, 245 - pw / 2, 286 - ph, pw, ph);
          }
          const gSrc = girlCanvas || (girlFallback.complete && girlFallback.naturalWidth ? girlFallback : null);
          if (gSrc) {
            const gw = gSrc.width || gSrc.naturalWidth;
            const gh = gSrc.height || gSrc.naturalHeight;
            const dh = 148;
            const dw = Math.round(dh * (gw / gh));
            ctx.drawImage(gSrc, 380 - dw / 2, 288 - dh, dw, dh);
          }
          if (catImg.complete && catImg.naturalWidth) {
            const ch = 92;
            const cw = Math.round(ch * (catImg.naturalWidth / catImg.naturalHeight));
            ctx.drawImage(catImg, 515 - cw / 2, 286 - ch, cw, ch);
          }
        }

        pugImg.onload = drawCast;
        catImg.onload = drawCast;
        girlFallback.onload = drawCast;
        drawCast();

        // Wish text block at bottom Polaroid margin
        ctx.fillStyle = '#7a2944';
        ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`“ ${finalWish} ”`, 380, 368);

        ctx.fillStyle = '#a65c74';
        ctx.font = '16px "Microsoft YaHei", sans-serif';
        ctx.fillText(`—— 许愿人：${cfg.celebrantName} · 陪伴宠物：团团 & lucky · ${cfg.senderName}献上`, 380, 412);

        ctx.fillStyle = '#d47a96';
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.fillText('✨ 愿你新的一岁，被全世界温柔和偏爱包围 ✨', 380, 450);
      }

      renderPostcard();

      const actions = el('div', 'modal-footer-actions');
      const saveBtn = el('button', 'sd-btn', '📥 保存纪念明信片 (.png)');
      saveBtn.type = 'button';
      saveBtn.addEventListener('click', () => {
        try {
          const link = document.createElement('a');
          link.download = `${cfg.celebrantName}-生日纪念明信片.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          audio.questDone();
        } catch (_) {}
      });
      const editBtn = el('button', 'sd-btn secondary', '✏️ 修改心愿');
      editBtn.type = 'button';
      editBtn.addEventListener('click', () => openCakeModal());
      actions.appendChild(saveBtn);
      actions.appendChild(editBtn);
      wrap.appendChild(actions);

      body.appendChild(wrap);
    }, true);
  }

  function openBlessingsModal() {
    openModalFrame('📻 亲友与宠物 · 生日祝福电台', (body) => {
      const vw = cfg.voiceWish || {};
      let voicePlaying = false;

      // Featured Voice Message Easter Egg Card
      const voiceBox = el('div', 'voice-wish-card');
      const vHead = el('div', 'voice-wish-head');
      vHead.innerHTML = `
        <div>
          <div class="voice-wish-title">${vw.title || '🎙️ 专属生日语音留言'}</div>
          <div class="voice-wish-sub">${vw.subtitle || '点击播放偷偷录给你的生日悄悄话～'}</div>
        </div>
      `;
      const playVoiceBtn = el('button', 'sd-btn', '▶ 播放语音留言');
      playVoiceBtn.type = 'button';
      vHead.appendChild(playVoiceBtn);
      voiceBox.appendChild(vHead);

      const wave = el('div', 'voice-wave');
      for (let i = 0; i < 12; i++) {
        wave.appendChild(el('span', 'voice-bar'));
      }
      voiceBox.appendChild(wave);

      const transcript = el('div', 'voice-transcript hidden', vw.transcript || '');
      voiceBox.appendChild(transcript);

      playVoiceBtn.addEventListener('click', () => {
        if (voicePlaying) {
          audio.stopVoiceWish();
          voicePlaying = false;
          voiceBox.classList.remove('playing');
          playVoiceBtn.textContent = '▶ 播放语音留言';
          return;
        }
        voicePlaying = true;
        voiceBox.classList.add('playing');
        transcript.classList.remove('hidden');
        playVoiceBtn.textContent = '⏹ 停止播放';
        audio.playVoiceWish(vw.audioSrc, () => {
          voicePlaying = false;
          voiceBox.classList.remove('playing');
          playVoiceBtn.textContent = '▶ 再听一遍';
        });
      });

      body.appendChild(voiceBox);

      const list = cfg.friendsBlessings || [];
      const intro = el('div', 'bday-menu-intro', '点击下方每一张电台贺卡，也能收听大家写给你的祝福哦～');
      body.appendChild(intro);

      const stack = el('div', 'blessings-stack');
      list.forEach((b) => {
        const card = el('button', `blessing-card ${b.featured ? 'featured' : ''}`);
        card.type = 'button';
        card.innerHTML = `
          <div class="blessing-head">
            <span class="blessing-avatar">${b.avatar || '💌'}</span>
            <div>
              <div class="blessing-from">${b.from}</div>
              <div class="blessing-tag">${b.tag}</div>
            </div>
          </div>
          <div class="blessing-msg">${b.message}</div>
        `;
        card.addEventListener('click', () => {
          audio.junimo();
          card.classList.add('played');
        });
        stack.appendChild(card);
      });
      body.appendChild(stack);
    });
  }

  function openTimeCapsuleModal() {
    const STORAGE_KEY = 'stardew_time_capsule_v1';
    let saved = { text: '', savedAt: '' };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) saved = JSON.parse(raw) || saved;
    } catch (_) {}

    openModalFrame('⏳ 时光胶囊 · 写给明年今天的一封信', (body) => {
      const wrap = el('div', 'capsule-wrap');
      const banner = el(
        'div',
        'bday-menu-intro',
        `写下想对「明年今日（2027-11-20）」的 ${cfg.celebrantName} 说的话吧！封存后可以保存成带火漆印章的纪念信纸图片～`
      );
      wrap.appendChild(banner);

      const area = document.createElement('textarea');
      area.className = 'capsule-textarea';
      area.rows = 5;
      area.maxLength = 260;
      area.placeholder = '比如：明年的小Q包也要每天开开心心、身体健康、和团团 lucky 一起继续闪闪发光呀！';
      area.value = saved.text || '';
      wrap.appendChild(area);

      const sealStatus = el(
        'div',
        'capsule-status',
        saved.text ? `💌 已封存于 ${saved.savedAt || '今天'}（可随时修改或导出图片）` : '🕯️ 尚未封存 · 写好后点击下方红色火漆封存'
      );
      wrap.appendChild(sealStatus);

      const actions = el('div', 'modal-footer-actions');
      const sealBtn = el('button', 'sd-btn red', '💌 火漆封存时光胶囊');
      sealBtn.type = 'button';
      const exportBtn = el('button', 'sd-btn', '📥 导出胶囊信纸 (.png)');
      exportBtn.type = 'button';

      sealBtn.addEventListener('click', () => {
        const txt = area.value.trim();
        if (!txt) {
          area.focus();
          return;
        }
        const stamp = new Date().toISOString().slice(0, 10);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: txt, savedAt: stamp }));
        } catch (_) {}
        sealStatus.textContent = `✨ 已用玫瑰金火漆封存（${stamp} → 2027-11-20 开启）`;
        audio.questDone();
      });

      exportBtn.addEventListener('click', () => {
        const txt = area.value.trim() || '明年的今天，也请继续被温柔和偏爱包围吧！';
        const c = document.createElement('canvas');
        c.width = 720;
        c.height = 460;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff6ea';
        ctx.fillRect(0, 0, 720, 460);
        ctx.strokeStyle = '#9c5268';
        ctx.lineWidth = 8;
        ctx.strokeRect(12, 12, 696, 436);
        ctx.strokeStyle = '#f0b2c6';
        ctx.lineWidth = 3;
        ctx.strokeRect(24, 24, 672, 412);

        ctx.fillStyle = '#8f2d50';
        ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⏳ 时光胶囊 · 寄给 2027-11-20 的 ${cfg.celebrantName}`, 360, 74);

        ctx.fillStyle = '#b8768c';
        ctx.font = '15px "Microsoft YaHei", sans-serif';
        ctx.fillText(`封存日期：${cfg.birthdayDate || '2026-11-20'}`, 360, 104);

        // Word-wrap message lines cleanly
        ctx.fillStyle = '#5b2c0d';
        ctx.font = '20px "Microsoft YaHei", sans-serif';
        const chars = Array.from(txt);
        const lines = [];
        let cur = '';
        for (const ch of chars) {
          if (ch === '\n' || cur.length >= 24) {
            lines.push(cur);
            cur = ch === '\n' ? '' : ch;
          } else {
            cur += ch;
          }
        }
        if (cur) lines.push(cur);
        lines.slice(0, 7).forEach((ln, idx) => {
          ctx.fillText(ln, 360, 165 + idx * 34);
        });

        // Red wax seal stamp
        ctx.fillStyle = '#d9485f';
        ctx.beginPath();
        ctx.arc(610, 376, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffe58f';
        ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
        ctx.fillText('♥', 610, 384);

        try {
          const link = document.createElement('a');
          link.download = `${cfg.celebrantName}-时光胶囊信件.png`;
          link.href = c.toDataURL('image/png');
          link.click();
          audio.questDone();
        } catch (_) {}
      });

      actions.appendChild(sealBtn);
      actions.appendChild(exportBtn);
      wrap.appendChild(actions);
      body.appendChild(wrap);
    });
  }

  function openComfortJarModal() {
    const notes = cfg.comfortNotes || ['💖 你今天也是世界上最棒的小女孩！'];
    let idx = Math.floor(Math.random() * notes.length);

    openModalFrame('🫙 专属情绪夸夸罐 · 被偏爱时刻', (body) => {
      const wrap = el('div', 'comfort-jar-wrap');
      const jarIcon = el('div', 'comfort-jar-icon', '🫙✨');
      const slip = el('div', 'comfort-slip');
      slip.textContent = notes[idx];

      const drawBtn = el('button', 'sd-btn', '✨ 再抽一张暖心纸条');
      drawBtn.type = 'button';
      drawBtn.addEventListener('click', () => {
        idx = (idx + 1) % notes.length;
        slip.classList.remove('pop');
        void slip.offsetWidth;
        slip.classList.add('pop');
        slip.textContent = notes[idx];
        audio.junimo();
      });

      wrap.appendChild(jarIcon);
      wrap.appendChild(slip);
      wrap.appendChild(drawBtn);
      body.appendChild(wrap);
    });
  }

  function drawMemoryScene(canvas, sceneType) {
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    const w = canvas.width;
    const h = canvas.height;
    c.clearRect(0, 0, w, h);

    if (sceneType === 'sunset') {
      c.fillStyle = '#f28c5c';
      c.fillRect(0, 0, w, h * 0.45);
      c.fillStyle = '#ffc178';
      c.fillRect(0, h * 0.45, w, h * 0.25);
      c.fillStyle = '#ffe596';
      c.beginPath();
      c.arc(w * 0.72, h * 0.44, 18, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#4f7a49';
      c.fillRect(0, h * 0.68, w, h * 0.32);
      c.fillStyle = '#2d4732';
      c.fillRect(36, h * 0.56, 8, 28);
      c.fillRect(30, h * 0.46, 20, 14);
    } else if (sceneType === 'cafe') {
      c.fillStyle = '#5c3c28';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#6da3c7';
      c.fillRect(18, 14, 108, 56);
      c.fillStyle = '#9ecae6';
      for (let rx = 24; rx < 120; rx += 16) {
        c.fillRect(rx, 20, 2, 10);
        c.fillRect(rx + 6, 38, 2, 10);
      }
      c.fillStyle = '#b57445';
      c.fillRect(0, 82, w, 46);
      c.fillStyle = '#fff5df';
      c.fillRect(110, 68, 24, 18);
      c.fillStyle = '#f5a9b8';
      c.fillRect(72, 72, 26, 14);
    } else if (sceneType === 'starry') {
      c.fillStyle = '#18244d';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffe885';
      [[24, 22], [68, 16], [112, 30], [164, 18], [190, 44], [46, 52]].forEach(([sx, sy]) => {
        c.fillRect(sx, sy, 3, 3);
      });
      c.fillStyle = '#fff4b8';
      c.beginPath();
      c.arc(42, 28, 10, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#183f35';
      c.beginPath();
      c.moveTo(0, h);
      c.lineTo(0, h * 0.72);
      c.lineTo(w * 0.55, h * 0.62);
      c.lineTo(w, h * 0.78);
      c.lineTo(w, h);
      c.closePath();
      c.fill();
    } else {
      c.fillStyle = '#6cc2eb';
      c.fillRect(0, 0, w, h * 0.55);
      c.fillStyle = '#ffffff';
      c.fillRect(28, 18, 34, 12);
      c.fillRect(142, 24, 28, 10);
      c.fillStyle = '#7ac45c';
      c.fillRect(0, h * 0.55, w, h * 0.45);
      // Picnic blanket
      c.fillStyle = '#fff3e6';
      c.fillRect(58, 76, 100, 36);
      c.fillStyle = '#e86666';
      for (let bx = 58; bx < 158; bx += 20) {
        c.fillRect(bx, 76, 10, 36);
      }
    }
  }

  function openMemoriesModal() {
    const items = cfg.memories || [];
    let index = 0;

    openModalFrame('照片回忆墙 · 珍藏片段', (body) => {
      const frame = el('div', 'polaroid-frame');
      const media = el('div', 'polaroid-media');
      const title = el('div', 'polaroid-title');
      const date = el('div', 'polaroid-date');
      const caption = el('div', 'polaroid-caption');
      frame.appendChild(media);
      frame.appendChild(title);
      frame.appendChild(date);
      frame.appendChild(caption);
      body.appendChild(frame);

      const nav = el('div', 'polaroid-nav');
      const prevBtn = el('button', 'sd-btn secondary', '◀ 上一张');
      const dots = el('div', 'polaroid-dots');
      const nextBtn = el('button', 'sd-btn secondary', '下一张 ▶');
      nav.appendChild(prevBtn);
      nav.appendChild(dots);
      nav.appendChild(nextBtn);
      body.appendChild(nav);

      function renderCard() {
        const m = items[index];
        media.innerHTML = '';
        if (m.image) {
          const img = document.createElement('img');
          img.src = m.image;
          img.alt = m.title;
          media.appendChild(img);
        } else {
          const canvas = document.createElement('canvas');
          canvas.width = 220;
          canvas.height = 132;
          drawMemoryScene(canvas, m.sceneType || 'sunset');
          media.appendChild(canvas);
        }
        title.textContent = m.title;
        date.textContent = m.date;
        caption.textContent = m.caption;

        dots.innerHTML = '';
        items.forEach((_, idx) => {
          const d = el('span', `polaroid-dot ${idx === index ? 'active' : ''}`);
          dots.appendChild(d);
        });
      }

      prevBtn.addEventListener('click', () => {
        index = (index - 1 + items.length) % items.length;
        audio.blip();
        renderCard();
      });
      nextBtn.addEventListener('click', () => {
        index = (index + 1) % items.length;
        audio.blip();
        renderCard();
      });

      renderCard();
    });
    markQuestDone('memories');
  }

  function openCalendarModal() {
    const info = parseBirthdayInfo();
    openModalFrame('鹈鹕镇季节日历', (body) => {
      const board = el('div', 'cal-board');
      const header = el('div', 'cal-header');
      const leftHead = el('div', '');
      leftHead.appendChild(el('div', '', `${info.season}季 · ${info.year}年`));
      const bigMonth = el('div', '', `${info.month} 月`);
      bigMonth.style.fontSize = '24px';
      bigMonth.style.fontWeight = 'bold';
      leftHead.appendChild(bigMonth);

      const rightHead = el('div', '', cfg.age ? `${cfg.age}岁生日纪念` : '特别委托日');
      rightHead.style.fontSize = '14px';
      header.appendChild(leftHead);
      header.appendChild(rightHead);
      board.appendChild(header);

      const weekdays = el('div', 'cal-weekdays');
      ['一', '二', '三', '四', '五', '六', '日'].forEach((wd) => {
        weekdays.appendChild(el('div', '', wd));
      });
      board.appendChild(weekdays);

      const grid = el('div', 'cal-days');
      for (let d = 1; d <= 28; d++) {
        const cell = el('div', `cal-day ${d === info.stardewDay ? 'is-birthday' : ''}`);
        cell.textContent = d === info.stardewDay ? `${d} 🎂` : String(d);
        grid.appendChild(cell);
      }
      board.appendChild(grid);
      body.appendChild(board);

      body.appendChild(el('div', 'cal-countdown', info.countdownText));
    });
    markQuestDone('calendar');
  }

  function drawTvScreen(canvas, style, t) {
    const c = canvas.getContext('2d');
    c.imageSmoothingEnabled = false;
    const w = canvas.width;
    const h = canvas.height;
    c.clearRect(0, 0, w, h);

    if (style === 'fortune') {
      c.fillStyle = '#251a45';
      c.fillRect(0, 0, w, h);
      // Floating glowing stars
      for (let i = 0; i < 8; i++) {
        const sx = (i * 29 + Math.floor(t * 16)) % w;
        const sy = 14 + (i * 19) % (h - 28);
        c.fillStyle = i % 2 === 0 ? '#ffd859' : '#c69bff';
        c.fillRect(sx, sy, 4, 4);
      }
      // Crystal ball
      c.fillStyle = '#73d2f3';
      c.beginPath();
      c.arc(w / 2, h / 2 - 4, 24, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#ffffff';
      c.fillRect(w / 2 - 10, h / 2 - 14, 6, 6);
      c.fillStyle = '#8f522a';
      c.fillRect(w / 2 - 16, h / 2 + 18, 32, 8);
    } else if (style === 'weather') {
      c.fillStyle = '#5ebae6';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffe55c';
      c.beginPath();
      c.arc(w * 0.78, 28, 16, 0, Math.PI * 2);
      c.fill();
      const drift = Math.round(Math.sin(t * 2) * 8);
      c.fillStyle = '#ffffff';
      c.fillRect(28 + drift, 26, 48, 16);
      c.fillRect(38 + drift, 18, 28, 12);
      c.fillStyle = '#6ec255';
      c.fillRect(0, h - 24, w, 24);
    } else {
      c.fillStyle = '#33203d';
      c.fillRect(0, 0, w, h);
      c.fillStyle = '#ff6b8b';
      c.fillRect(0, 0, w, 14);
      c.fillStyle = '#ffd54f';
      c.fillRect(w / 2 - 24, h / 2 - 6, 48, 28);
      c.fillStyle = '#fffdf5';
      c.fillRect(w / 2 - 20, h / 2 - 14, 40, 12);
      const blink = Math.sin(t * 8) > 0;
      c.fillStyle = blink ? '#ff9824' : '#ffe57f';
      c.fillRect(w / 2 - 2, h / 2 - 24, 4, 10);
    }
  }

  function openTvModal() {
    const channels = cfg.tvChannels || [];
    let activeIdx = 0;

    openModalFrame('复古 CRT 电视机', (body) => {
      const bezel = el('div', 'tv-bezel');
      const canvas = el('canvas', 'tv-screen-canvas');
      canvas.width = 224;
      canvas.height = 126;
      bezel.appendChild(canvas);
      body.appendChild(bezel);

      const tabs = el('div', 'tv-tabs');
      const infoBox = el('div', 'gift-detail-card');
      body.appendChild(tabs);
      body.appendChild(infoBox);

      function renderChannel() {
        const ch = channels[activeIdx];
        tabs.innerHTML = '';
        channels.forEach((cItem, idx) => {
          const btn = el(
            'button',
            `sd-btn ${idx === activeIdx ? '' : 'secondary'}`,
            cItem.name
          );
          btn.style.fontSize = '12px';
          btn.style.padding = '6px 10px';
          btn.addEventListener('click', () => {
            activeIdx = idx;
            audio.blip();
            renderChannel();
          });
          tabs.appendChild(btn);
        });

        infoBox.innerHTML = '';
        const h = el('div', 'gift-detail-title', ch.headline);
        infoBox.appendChild(h);
        infoBox.appendChild(el('div', '', ch.body));
      }

      renderChannel();

      const start = performance.now();
      function anim(now) {
        if (!state.activeModalOpen) return;
        const ch = channels[activeIdx];
        drawTvScreen(canvas, ch.screenStyle, (now - start) / 1000);
        tvAnimRaf = requestAnimationFrame(anim);
      }
      tvAnimRaf = requestAnimationFrame(anim);
    });
  }

  function openJukeboxModal() {
    openModalFrame('复古点唱机 · 生日歌单', (body) => {
      const tracks = audio.TRACKS;
      const listEl = el('div', 'track-list');
      body.appendChild(listEl);

      const ctrlRow = el('div', 'modal-footer-actions');
      const toggleBtn = el('button', 'sd-btn green');
      ctrlRow.appendChild(toggleBtn);
      body.appendChild(ctrlRow);

      const volRow = el('div', 'volume-row');
      volRow.appendChild(el('span', '', '🔊 音量'));
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0';
      slider.max = '100';
      slider.value = String(Math.round(audio.getVolume() * 100));
      volRow.appendChild(slider);
      body.appendChild(volRow);

      function renderTracks() {
        listEl.innerHTML = '';
        const curIdx = audio.getCurrentTrackIndex();
        const playing = audio.isPlaying();

        tracks.forEach((tr, idx) => {
          const row = el(
            'button',
            `track-item ${idx === curIdx ? 'active' : ''}`
          );
          const left = el('div', '');
          const name = el('div', '', tr.name);
          name.style.fontWeight = 'bold';
          const sub = el('div', '', tr.subtitle);
          sub.style.fontSize = '12px';
          sub.style.color = '#7b5336';
          left.appendChild(name);
          left.appendChild(sub);

          const right = el('span', '', idx === curIdx && playing ? '♫ 正在播放' : '▶ 点播');
          row.appendChild(left);
          row.appendChild(right);

          row.addEventListener('click', () => {
            audio.selectTrack(idx);
            markQuestDone('jukebox');
            updateHud();
            renderTracks();
          });
          listEl.appendChild(row);
        });

        toggleBtn.textContent = playing ? '⏸ 暂停音乐' : '▶ 播放当前曲目';
        toggleBtn.className = playing ? 'sd-btn secondary' : 'sd-btn green';
      }

      toggleBtn.addEventListener('click', () => {
        audio.togglePlay();
        if (audio.isPlaying()) markQuestDone('jukebox');
        updateHud();
        renderTracks();
      });

      slider.addEventListener('input', () => {
        audio.setVolume(Number(slider.value) / 100);
      });

      renderTracks();
      markQuestDone('jukebox');
      updateHud();
    });
  }

  function openQuestModal() {
    openModalFrame('生日特别委托 · 探索进度', (body) => {
      const quests = cfg.quests || [];
      const doneCount = state.completedQuests.size;

      const banner = el('div', 'quest-header-banner');
      const jImg = document.createElement('img');
      jImg.src = 'assets/sprites/junimo.gif';
      jImg.alt = '祝尼魔';
      banner.appendChild(jImg);
      const bText = el('div', '');
      bText.appendChild(
        el(
          'div',
          '',
          doneCount >= quests.length
            ? '🎉 全部委托已完成！整间屋子的祝福都属于你！'
            : `已完成 ${doneCount} / ${quests.length} 项特别委托，集齐全部即可解锁终极惊喜！`
        )
      );
      banner.appendChild(bText);
      body.appendChild(banner);

      const bar = el('div', 'quest-progress-bar');
      const fill = el('div', 'quest-progress-fill');
      fill.style.width = `${Math.round((doneCount / quests.length) * 100)}%`;
      bar.appendChild(fill);
      body.appendChild(bar);

      quests.forEach((q) => {
        const isDone = state.completedQuests.has(q.id);
        const row = el('div', `quest-item ${isDone ? 'done' : ''}`);
        row.appendChild(el('div', 'quest-check', isDone ? '✓' : ''));
        row.appendChild(el('span', 'quest-title-text', q.title));
        row.appendChild(el('span', 'quest-hint', q.locationHint));
        body.appendChild(row);
      });

      const footer = el('div', 'modal-footer-actions');
      if (doneCount >= quests.length) {
        const replayFinale = el('button', 'sd-btn', '🌟 重温终极生日惊喜');
        replayFinale.addEventListener('click', () => {
          closeModal();
          openFinaleModal();
        });
        footer.appendChild(replayFinale);
      }
      const resetBtn = el('button', 'sd-btn secondary', '重置探索进度');
      resetBtn.addEventListener('click', () => {
        resetProgress();
        closeModal();
        openQuestModal();
      });
      footer.appendChild(resetBtn);
      body.appendChild(footer);
    });
  }

  function launchRoomFireworks() {
    const spots = [
      [180, 140], [384, 110], [580, 145], [270, 250], [500, 250],
    ];
    spots.forEach(([fx, fy], idx) => {
      setTimeout(() => {
        particles.spawnConfetti(fx, fy, 45);
        audio.firework();
      }, idx * 240);
    });
  }

  function openFinaleModal() {
    state.finaleTriggered = true;
    saveProgress();
    launchRoomFireworks();

    openModalFrame(cfg.finale.title, (body) => {
      const wrap = el('div', 'finale-wrap');
      const icons = el('div', 'finale-stardrop');
      const portrait = document.createElement('img');
      portrait.src = 'assets/protagonist-portrait.png';
      portrait.alt = cfg.celebrantName;
      portrait.className = 'welcome-portrait';
      portrait.style.width = '76px';
      portrait.style.height = '76px';

      const star = document.createElement('img');
      star.src = 'assets/icons/starfruit.png';
      star.alt = '星之果实';
      star.className = 'finale-star-img';

      const junimo = document.createElement('img');
      junimo.src = 'assets/sprites/junimo.gif';
      junimo.alt = '祝尼魔';
      junimo.className = 'welcome-junimo';

      icons.appendChild(portrait);
      icons.appendChild(star);
      icons.appendChild(junimo);
      wrap.appendChild(icons);

      wrap.appendChild(el('div', 'finale-quote', cfg.finale.stardropLine));

      const letterBox = el('div', 'finale-body');
      cfg.finale.message.forEach((p) => {
        letterBox.appendChild(el('p', '', p));
      });
      const sign = el('div', 'letter-signature', `—— 永远祝你快乐的 ${cfg.senderName}`);
      letterBox.appendChild(sign);
      wrap.appendChild(letterBox);

      const actions = el('div', 'modal-footer-actions');
      const fwBtn = el('button', 'sd-btn', cfg.finale.buttonReplay);
      fwBtn.addEventListener('click', () => launchRoomFireworks());
      const keepBtn = el('button', 'sd-btn green', cfg.finale.buttonClose);
      keepBtn.addEventListener('click', () => closeModal());
      actions.appendChild(fwBtn);
      actions.appendChild(keepBtn);
      wrap.appendChild(actions);

      body.appendChild(wrap);
    });
  }

  function openPianoModal() {
    const WHITE_KEYS = [
      { note: 'C4', solfege: '1', freq: 261.63, hint: 'A', code: 'KeyA' },
      { note: 'D4', solfege: '2', freq: 293.66, hint: 'S', code: 'KeyS' },
      { note: 'E4', solfege: '3', freq: 329.63, hint: 'D', code: 'KeyD' },
      { note: 'F4', solfege: '4', freq: 349.23, hint: 'F', code: 'KeyF' },
      { note: 'G4', solfege: '5', freq: 392.0, hint: 'G', code: 'KeyG' },
      { note: 'A4', solfege: '6', freq: 440.0, hint: 'H', code: 'KeyH' },
      { note: 'B4', solfege: '7', freq: 493.88, hint: 'J', code: 'KeyJ' },
      { note: 'C5', solfege: '1̇', freq: 523.25, hint: 'K', code: 'KeyK' },
      { note: 'D5', solfege: '2̇', freq: 587.33, hint: 'L', code: 'KeyL' },
      { note: 'E5', solfege: '3̇', freq: 659.25, hint: ';', code: 'Semicolon' },
      { note: 'F5', solfege: '4̇', freq: 698.46, hint: "'", code: 'Quote' },
      { note: 'G5', solfege: '5̇', freq: 783.99, hint: '\\', code: 'Backslash' },
    ];
    const BLACK_KEYS = [
      { note: 'C#4', wIdx: 0, freq: 277.18, hint: 'W', code: 'KeyW' },
      { note: 'D#4', wIdx: 1, freq: 311.13, hint: 'E', code: 'KeyE' },
      { note: 'F#4', wIdx: 3, freq: 369.99, hint: 'T', code: 'KeyT' },
      { note: 'G#4', wIdx: 4, freq: 415.3, hint: 'Y', code: 'KeyY' },
      { note: 'A#4', wIdx: 5, freq: 466.16, hint: 'U', code: 'KeyU' },
      { note: 'C#5', wIdx: 7, freq: 554.37, hint: 'O', code: 'KeyO' },
      { note: 'D#5', wIdx: 8, freq: 622.25, hint: 'P', code: 'KeyP' },
      { note: 'F#5', wIdx: 10, freq: 739.99, hint: '[', code: 'BracketLeft' },
    ];
    const ALL_KEYS = [...WHITE_KEYS, ...BLACK_KEYS];
    const BY_NOTE = Object.fromEntries(ALL_KEYS.map((k) => [k.note, k]));
    const BY_CODE = Object.fromEntries(ALL_KEYS.map((k) => [k.code, k]));

    const SONGS = {
      birthday: {
        name: '🎂 生日快乐歌',
        notes: [
          ['G4', 340], ['G4', 180], ['A4', 440], ['G4', 440], ['C5', 440], ['B4', 760],
          ['G4', 340], ['G4', 180], ['A4', 440], ['G4', 440], ['D5', 440], ['C5', 760],
          ['G4', 340], ['G4', 180], ['G5', 440], ['E5', 440], ['C5', 440], ['B4', 440], ['A4', 740],
          ['F5', 340], ['F5', 180], ['E5', 440], ['C5', 440], ['D5', 440], ['C5', 860],
        ],
      },
      twinkle: {
        name: '⭐ 小星星',
        notes: [
          ['C4', 380], ['C4', 380], ['G4', 380], ['G4', 380], ['A4', 380], ['A4', 380], ['G4', 720],
          ['F4', 380], ['F4', 380], ['E4', 380], ['E4', 380], ['D4', 380], ['D4', 380], ['C4', 720],
        ],
      },
      lullaby: {
        name: '🌙 暖炉摇篮曲',
        notes: [
          ['G4', 440], ['B4', 440], ['D5', 560], ['E5', 320], ['D5', 760],
          ['B4', 440], ['A4', 440], ['G4', 760],
          ['E4', 440], ['G4', 440], ['A4', 560], ['B4', 320], ['A4', 760], ['G4', 820],
        ],
      },
    };

    openModalFrame('🎹 小Q包张哼哼的法式奶油立式钢琴', (body) => {
      state.pianoOpen = true;
      if (audio.setBgmDuck) audio.setBgmDuck(true);

      let currentSongKey = 'birthday';
      let guideEnabled = true;
      let guideIndex = 0;
      let autoPlaying = false;
      const keyEls = {};

      const panel = el('div', 'piano-panel');
      const topBar = el('div', 'piano-top-bar');
      const songTabs = el('div', 'piano-song-tabs');
      const controlsRow = el('div', 'piano-controls-row');
      topBar.appendChild(songTabs);
      topBar.appendChild(controlsRow);

      const statusStrip = el('div', 'piano-status-strip');
      const notePill = el('span', 'piano-note-pill', '♪ 等待弹奏…');
      const progressText = el('span', 'piano-progress-text', '');
      statusStrip.appendChild(notePill);
      statusStrip.appendChild(progressText);

      const shell = el('div', 'piano-keyboard-shell');
      const kb = el('div', 'piano-keyboard');
      const whiteRow = el('div', 'piano-white-keys');
      const blackRow = el('div', 'piano-black-keys');

      WHITE_KEYS.forEach((k) => {
        const btn = el('button', 'piano-key-white');
        btn.type = 'button';
        btn.dataset.note = k.note;
        btn.appendChild(el('span', 'piano-key-solfege', k.solfege));
        btn.appendChild(el('span', 'piano-key-hint', k.hint));
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          triggerKey(k, false);
        });
        whiteRow.appendChild(btn);
        keyEls[k.note] = btn;
      });

      BLACK_KEYS.forEach((k) => {
        const btn = el('button', 'piano-key-black');
        btn.type = 'button';
        btn.dataset.note = k.note;
        btn.style.left = `${((k.wIdx + 1) / WHITE_KEYS.length) * 100}%`;
        btn.textContent = k.hint;
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          triggerKey(k, false);
        });
        blackRow.appendChild(btn);
        keyEls[k.note] = btn;
      });

      kb.appendChild(whiteRow);
      kb.appendChild(blackRow);
      shell.appendChild(kb);

      const autoBtn = el('button', 'piano-action-btn', '▶ 自动演奏');
      autoBtn.type = 'button';
      const guideBtn = el('button', 'piano-guide-toggle on', '✨ 跟弹提示：开');
      guideBtn.type = 'button';
      controlsRow.appendChild(autoBtn);
      controlsRow.appendChild(guideBtn);

      function syncGuideHighlight() {
        ALL_KEYS.forEach((k) => keyEls[k.note]?.classList.remove('guided'));
        const song = SONGS[currentSongKey];
        if (!song) return;
        const target = song.notes[guideIndex];
        if (guideEnabled && !autoPlaying && target) {
          keyEls[target[0]]?.classList.add('guided');
          const keyMeta = BY_NOTE[target[0]];
          progressText.textContent = `跟弹进度 ${guideIndex}/${song.notes.length} · 下一音 ${keyMeta ? keyMeta.note : target[0]}`;
        } else if (autoPlaying) {
          progressText.textContent = `自动演奏《${song.name}》中…`;
        } else {
          progressText.textContent = '自由弹奏模式 · 点按琴键或按键盘 A~L';
        }
      }

      function stopAutoPlay() {
        autoPlaying = false;
        if (pianoAutoTimer) {
          clearTimeout(pianoAutoTimer);
          pianoAutoTimer = null;
        }
        autoBtn.textContent = '▶ 自动演奏';
        autoBtn.classList.remove('playing');
        syncGuideHighlight();
      }

      function flashKey(note) {
        const btn = keyEls[note];
        if (!btn) return;
        btn.classList.add('active');
        setTimeout(() => btn.classList.remove('active'), 190);
      }

      function triggerKey(keyMeta, fromAuto) {
        if (!keyMeta) return;
        audio.unlock();
        audio.playPianoNote(keyMeta.freq, fromAuto ? 0.9 : 1.35, 0.9);
        flashKey(keyMeta.note);
        if (particles && state.currentRoomId === 'bedroom') {
          particles.spawnMusicNote(240, 76);
        }
        notePill.textContent = `♪ ${keyMeta.note}${keyMeta.solfege ? ` (${keyMeta.solfege})` : ''}`;

        if (!fromAuto && guideEnabled) {
          if (autoPlaying) stopAutoPlay();
          const song = SONGS[currentSongKey];
          const expected = song.notes[guideIndex];
          if (expected && expected[0] === keyMeta.note) {
            guideIndex += 1;
            if (guideIndex >= song.notes.length) {
              guideIndex = 0;
              if (particles) {
                particles.spawnConfetti(240, 118, 28);
                particles.spawnHearts(240, 128, 6);
              }
              callbacks.onTriggerEmote?.('happy');
              notePill.textContent = `🎉 完整弹完《${song.name}》啦！`;
            }
          }
          syncGuideHighlight();
        }
      }

      function startAutoPlay() {
        if (autoPlaying) {
          stopAutoPlay();
          return;
        }
        const song = SONGS[currentSongKey];
        if (!song) return;
        autoPlaying = true;
        guideIndex = 0;
        autoBtn.textContent = '⏹ 停止演奏';
        autoBtn.classList.add('playing');
        syncGuideHighlight();

        let step = 0;
        function playStep() {
          if (!state.pianoOpen || !autoPlaying) return;
          if (step >= song.notes.length) {
            stopAutoPlay();
            notePill.textContent = `✨ 《${song.name}》演奏完毕！`;
            if (particles) particles.spawnHearts(240, 120, 5);
            return;
          }
          const [noteName, durMs] = song.notes[step];
          step += 1;
          triggerKey(BY_NOTE[noteName], true);
          pianoAutoTimer = setTimeout(playStep, durMs);
        }
        playStep();
      }

      Object.entries(SONGS).forEach(([id, song]) => {
        const tab = el('button', `piano-tab-btn ${id === currentSongKey ? 'active' : ''}`, song.name);
        tab.type = 'button';
        tab.addEventListener('click', () => {
          currentSongKey = id;
          guideIndex = 0;
          stopAutoPlay();
          songTabs.querySelectorAll('.piano-tab-btn').forEach((b) => b.classList.remove('active'));
          tab.classList.add('active');
          syncGuideHighlight();
        });
        songTabs.appendChild(tab);
      });

      autoBtn.addEventListener('click', startAutoPlay);
      guideBtn.addEventListener('click', () => {
        guideEnabled = !guideEnabled;
        guideBtn.textContent = guideEnabled ? '✨ 跟弹提示：开' : '✨ 跟弹提示：关';
        guideBtn.classList.toggle('on', guideEnabled);
        syncGuideHighlight();
      });

      pianoKeyHandler = (e) => {
        if (!state.pianoOpen || e.repeat) return;
        const meta = BY_CODE[e.code];
        if (meta) {
          e.preventDefault();
          triggerKey(meta, false);
        }
      };
      window.addEventListener('keydown', pianoKeyHandler);

      panel.appendChild(topBar);
      panel.appendChild(statusStrip);
      panel.appendChild(shell);
      panel.appendChild(
        el('div', 'piano-tips', '💻 键盘对应：白键 A S D F G H J K L ; \' \\ ｜ 黑键 W E T Y U O P [ （手机可直接点击琴键）')
      );

      syncGuideHighlight();
      body.appendChild(panel);
    }, true);
  }

  function openComputerModal() {
    const APPS = [
      { id: 'notes', emoji: '📝', label: '生日便签' },
      { id: 'album', emoji: '📷', label: '萌宠相册' },
      { id: 'wallpaper', emoji: '🌸', label: '换壁纸' },
      { id: 'game', emoji: '🍓', label: '接草莓' },
    ];
    const WALLPAPERS = [
      { id: 'sakura', name: '樱花晚霞渐变', cls: 'pc-wall-sakura' },
      { id: 'night', name: '星露谷暖夜空', cls: 'pc-wall-night' },
      { id: 'strawberry', name: '奶油草莓格纹', cls: 'pc-wall-strawberry' },
      { id: 'sky', name: '晴空云朵泡泡', cls: 'pc-wall-sky' },
    ];

    openModalFrame('🖥️ 小Q包张哼哼的粉色桌面电脑', (body) => {
      state.pcOpen = true;
      let activeApp = 'notes';

      const shell = el('div', 'pc-monitor-shell');
      const bezelTop = el('div', 'pc-bezel-top');
      const ledLabel = el('span', '');
      const led = el('span', 'pc-led-dot');
      ledLabel.appendChild(led);
      ledLabel.appendChild(document.createTextNode('Q-BAO STUDIO · 27" 曲面带鱼屏'));
      bezelTop.appendChild(ledLabel);
      bezelTop.appendChild(el('span', '', 'Wi-Fi 满格 🎀 11月20日'));

      const wallObj = WALLPAPERS.find((w) => w.id === state.pcWallpaper) || WALLPAPERS[0];
      const screen = el('div', `pc-screen ${wallObj.cls}`);
      const mainGrid = el('div', 'pc-desktop-main');
      const iconCol = el('div', 'pc-desktop-icons');
      const appWin = el('div', 'pc-app-window');
      const winBar = el('div', 'pc-win-titlebar');
      const winTitle = el('span', '', '');
      const winBody = el('div', 'pc-win-body');
      appWin.appendChild(winBar);
      appWin.appendChild(winBody);
      winBar.appendChild(winTitle);
      winBar.appendChild(el('span', '', '● ● ●'));

      mainGrid.appendChild(iconCol);
      mainGrid.appendChild(appWin);

      const taskbar = el('div', 'pc-taskbar');
      taskbar.appendChild(el('span', '', '🌸 小Q包OS 生日特别版'));
      const bgmQuickBtn = el(
        'button',
        'pc-album-like-btn',
        audio.isPlaying() ? '♫ 音乐播放中（点此暂停）' : '♫ 播放生日bgm'
      );
      bgmQuickBtn.type = 'button';
      bgmQuickBtn.addEventListener('click', () => {
        audio.togglePlay();
        updateHud();
        bgmQuickBtn.textContent = audio.isPlaying() ? '♫ 音乐播放中（点此暂停）' : '♫ 播放生日bgm';
      });
      taskbar.appendChild(bgmQuickBtn);

      screen.appendChild(mainGrid);
      screen.appendChild(taskbar);
      shell.appendChild(bezelTop);
      shell.appendChild(screen);

      function stopPcGame() {
        if (pcGameRaf) {
          cancelAnimationFrame(pcGameRaf);
          pcGameRaf = null;
        }
        if (pcKeyHandler) {
          window.removeEventListener('keydown', pcKeyHandler);
          window.removeEventListener('keyup', pcKeyHandler);
          pcKeyHandler = null;
        }
      }

      function renderNotesApp() {
        winTitle.textContent = '📝 桌面便签板（自动保存）';
        winBody.innerHTML = '';

        const list = el('div', 'pc-notes-list');
        function drawList() {
          list.innerHTML = '';
          state.pcNotes.forEach((n) => {
            const card = el('div', 'pc-note-card');
            card.appendChild(el('span', '', n.text));
            if (!n.pinned) {
              const del = el('button', 'pc-note-del', '删除');
              del.type = 'button';
              del.addEventListener('click', () => {
                state.pcNotes = state.pcNotes.filter((item) => item.id !== n.id);
                savePcNotes();
                drawList();
              });
              card.appendChild(del);
            }
            list.appendChild(card);
          });
        }
        drawList();
        winBody.appendChild(list);

        const form = el('form', 'pc-note-form');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'pc-note-input';
        input.maxLength = 60;
        input.placeholder = '写一条给小Q包的生日便签或愿望…';
        const submit = el('button', 'sd-btn', '贴上便签');
        submit.type = 'submit';
        form.appendChild(input);
        form.appendChild(submit);

        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const val = input.value.trim();
          if (!val) return;
          state.pcNotes.unshift({ id: `u_${Date.now()}`, text: val, pinned: false });
          savePcNotes();
          audio.keyClick?.();
          input.value = '';
          drawList();
        });
        winBody.appendChild(form);
      }

      function renderAlbumApp() {
        winTitle.textContent = '📷 我的房间萌宠相册';
        winBody.innerHTML = '';
        const cards = [
          { id: 'girl', name: '小Q包张哼哼', img: 'assets/protagonist-portrait.png' },
          { id: 'pug', name: '小八哥 团团', img: 'assets/pets/pug-portrait.png' },
          { id: 'cat', name: '美短 lucky', img: 'assets/pets/shorthair-portrait.png' },
          { id: 'junimo', name: '神秘祝尼魔', img: 'assets/sprites/junimo.gif' },
        ];
        const grid = el('div', 'pc-album-grid');
        cards.forEach((c) => {
          const box = el('div', 'pc-album-card');
          const im = document.createElement('img');
          im.src = c.img;
          im.alt = c.name;
          box.appendChild(im);
          box.appendChild(el('div', '', c.name));
          const likeBtn = el('button', 'pc-album-like-btn', `♥ 点赞 (${state.pcLikes[c.id] || 0})`);
          likeBtn.type = 'button';
          likeBtn.addEventListener('click', () => {
            state.pcLikes[c.id] = (state.pcLikes[c.id] || 0) + 1;
            audio.blip();
            likeBtn.textContent = `♥ 点赞 (${state.pcLikes[c.id]})`;
          });
          box.appendChild(likeBtn);
          grid.appendChild(box);
        });
        winBody.appendChild(grid);
      }

      function renderWallpaperApp() {
        winTitle.textContent = '🌸 个性化桌面壁纸与氛围';
        winBody.innerHTML = '';
        const wGrid = el('div', 'pc-wall-grid');
        WALLPAPERS.forEach((w) => {
          const b = el('button', `pc-wall-btn ${state.pcWallpaper === w.id ? 'active' : ''}`, w.name);
          b.type = 'button';
          b.addEventListener('click', () => {
            state.pcWallpaper = w.id;
            WALLPAPERS.forEach((x) => screen.classList.remove(x.cls));
            screen.classList.add(w.cls);
            audio.keyClick?.();
            renderWallpaperApp();
          });
          wGrid.appendChild(b);
        });
        winBody.appendChild(wGrid);
        winBody.appendChild(el('p', '', '🎵 快速切换室内音乐专辑：'));
        const tracksRow = el('div', 'piano-song-tabs');
        audio.TRACKS.forEach((t, idx) => {
          const tb = el('button', 'piano-tab-btn', t.name);
          tb.type = 'button';
          tb.addEventListener('click', () => {
            audio.selectTrack(idx);
            updateHud();
            bgmQuickBtn.textContent = '♫ 音乐播放中（点此暂停）';
          });
          tracksRow.appendChild(tb);
        });
        winBody.appendChild(tracksRow);
      }

      function renderCatchGameApp() {
        winTitle.textContent = '🍓 电脑小游戏：接草莓蛋糕大赛';
        winBody.innerHTML = '';
        const wrap = el('div', 'pc-game-wrap');
        const hudRow = el('div', 'pc-game-hud');
        const scoreEl = el('span', '', '得分：0');
        const timeEl = el('span', '', '倒计时：20s');
        const restartBtn = el('button', 'pc-album-like-btn', '重新开始');
        restartBtn.type = 'button';
        hudRow.appendChild(scoreEl);
        hudRow.appendChild(timeEl);
        hudRow.appendChild(restartBtn);

        const gc = document.createElement('canvas');
        gc.id = 'pc-game-canvas';
        gc.width = 420;
        gc.height = 196;
        const gctx = gc.getContext('2d');

        wrap.appendChild(hudRow);
        wrap.appendChild(gc);
        wrap.appendChild(el('div', 'piano-tips', '用鼠标 / 手指滑动屏幕或按 ← → 键接住掉落的 🍓 (+1) 和 🎂 (+3)！'));
        winBody.appendChild(wrap);

        let basketX = 210;
        let score = 0;
        let timeLeft = 20;
        let finished = false;
        let spawnTimer = 0;
        const drops = [];
        const downKeys = new Set();

        function resetGame() {
          basketX = 210;
          score = 0;
          timeLeft = 20;
          finished = false;
          spawnTimer = 0.2;
          drops.length = 0;
          scoreEl.textContent = '得分：0';
          timeEl.textContent = '倒计时：20s';
        }
        restartBtn.addEventListener('click', resetGame);

        gc.addEventListener('pointermove', (e) => {
          const r = gc.getBoundingClientRect();
          basketX = Math.max(28, Math.min(gc.width - 28, ((e.clientX - r.left) / r.width) * gc.width));
        });
        gc.addEventListener('pointerdown', (e) => {
          const r = gc.getBoundingClientRect();
          basketX = Math.max(28, Math.min(gc.width - 28, ((e.clientX - r.left) / r.width) * gc.width));
        });

        pcKeyHandler = (e) => {
          if (!state.pcOpen || activeApp !== 'game') return;
          if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
            if (e.type === 'keydown') downKeys.add(e.code);
            else downKeys.delete(e.code);
          }
        };
        window.addEventListener('keydown', pcKeyHandler);
        window.addEventListener('keyup', pcKeyHandler);

        let prev = performance.now();
        function frame(now) {
          if (!state.pcOpen || activeApp !== 'game') return;
          const dt = Math.min(0.05, Math.max(0.001, (now - prev) / 1000));
          prev = now;

          if (!finished) {
            timeLeft = Math.max(0, timeLeft - dt);
            timeEl.textContent = `倒计时：${Math.ceil(timeLeft)}s`;
            if (downKeys.has('ArrowLeft')) basketX = Math.max(28, basketX - 240 * dt);
            if (downKeys.has('ArrowRight')) basketX = Math.min(gc.width - 28, basketX + 240 * dt);

            spawnTimer -= dt;
            if (spawnTimer <= 0) {
              spawnTimer = 0.45 + Math.random() * 0.35;
              const isCake = Math.random() < 0.24;
              drops.push({
                x: 24 + Math.random() * (gc.width - 48),
                y: -12,
                vy: 76 + Math.random() * 68,
                icon: isCake ? '🎂' : '🍓',
                pts: isCake ? 3 : 1,
              });
            }

            for (let i = drops.length - 1; i >= 0; i--) {
              const d = drops[i];
              d.y += d.vy * dt;
              if (d.y >= 158 && d.y <= 184 && Math.abs(d.x - basketX) <= 32) {
                score += d.pts;
                scoreEl.textContent = `得分：${score}`;
                audio.keyClick?.();
                drops.splice(i, 1);
                continue;
              }
              if (d.y > gc.height + 16) drops.splice(i, 1);
            }

            if (timeLeft <= 0) {
              finished = true;
              audio.giftOpen();
              if (particles) particles.spawnHearts(64, 156, 4);
            }
          }

          gctx.clearRect(0, 0, gc.width, gc.height);
          gctx.fillStyle = '#fff5f8';
          gctx.fillRect(0, 0, gc.width, gc.height);
          gctx.fillStyle = '#f8dce5';
          gctx.fillRect(0, 174, gc.width, 22);

          gctx.font = '20px sans-serif';
          gctx.textAlign = 'center';
          gctx.textBaseline = 'middle';
          drops.forEach((d) => gctx.fillText(d.icon, d.x, d.y));

          // Cute pink woven basket
          gctx.fillStyle = '#d98452';
          gctx.strokeStyle = '#6e3d1e';
          gctx.lineWidth = 2;
          gctx.beginPath();
          gctx.roundRect(basketX - 28, 162, 56, 22, 6);
          gctx.fill();
          gctx.stroke();
          gctx.fillStyle = '#ff9ebb';
          gctx.fillRect(basketX - 25, 164, 50, 5);

          if (finished) {
            gctx.fillStyle = 'rgba(72, 26, 45, 0.78)';
            gctx.fillRect(0, 0, gc.width, gc.height);
            gctx.fillStyle = '#fff5e2';
            gctx.font = 'bold 18px sans-serif';
            gctx.fillText(`🎉 时间到！小Q包得分：${score} 分！`, gc.width / 2, 84);
            gctx.font = '13px sans-serif';
            gctx.fillText('点击右上方「重新开始」再来一局～', gc.width / 2, 118);
          }

          pcGameRaf = requestAnimationFrame(frame);
        }
        pcGameRaf = requestAnimationFrame(frame);
      }

      function switchApp(appId) {
        stopPcGame();
        activeApp = appId;
        iconCol.querySelectorAll('.pc-icon-btn').forEach((b) => {
          b.classList.toggle('active', b.dataset.app === appId);
        });
        if (appId === 'notes') renderNotesApp();
        else if (appId === 'album') renderAlbumApp();
        else if (appId === 'wallpaper') renderWallpaperApp();
        else if (appId === 'game') renderCatchGameApp();
      }

      APPS.forEach((app) => {
        const btn = el('button', `pc-icon-btn ${app.id === activeApp ? 'active' : ''}`);
        btn.type = 'button';
        btn.dataset.app = app.id;
        btn.appendChild(el('span', 'pc-icon-emoji', app.emoji));
        btn.appendChild(el('span', '', app.label));
        btn.addEventListener('click', () => {
          audio.keyClick?.();
          switchApp(app.id);
        });
        iconCol.appendChild(btn);
      });

      switchApp('notes');
      body.appendChild(shell);
    }, true);
  }

  // -------------------- Interactive Wardrobe & Vanity Dress-Up Studio --------------------
  function openWardrobeModal(initialTab = 'outfit') {
    const Wardrobe = window.SB.Wardrobe;
    if (!Wardrobe) return;

    openModalFrame('💄 小Q包张哼哼的自由换装搭配间', (body) => {
      state.wardrobeOpen = true;
      let activeTab = ['outfit', 'hair', 'headwear', 'makeup'].includes(initialTab) ? initialTab : 'outfit';
      let viewMode = 'front'; // 'front' | 'left' | 'back' | 'right' | 'spin'
      let spinElapsed = 0;
      let lastTs = performance.now();
      const sparkles = [];

      function burstSparkles(count = 14) {
        for (let i = 0; i < count; i++) {
          const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
          const spd = 28 + Math.random() * 54;
          sparkles.push({
            x: 110 + Math.cos(ang) * (18 + Math.random() * 24),
            y: 132 + Math.sin(ang) * (24 + Math.random() * 34),
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 16,
            life: 0.45 + Math.random() * 0.45,
            maxLife: 0.9,
            col: i % 3 === 0 ? '#ffd54f' : i % 3 === 1 ? '#ff77a3' : '#c59bf0',
          });
        }
      }

      const studio = el('div', 'wardrobe-studio');

      // LEFT STAGE: Animated Mirror Preview + Turntable + Summary + Random/Reset
      const stageCol = el('div', 'wardrobe-stage-col');
      const mirrorFrame = el('div', 'wardrobe-mirror-frame');
      const previewCanvas = document.createElement('canvas');
      previewCanvas.className = 'wardrobe-preview-canvas';
      previewCanvas.width = 220;
      previewCanvas.height = 264;
      mirrorFrame.appendChild(previewCanvas);
      stageCol.appendChild(mirrorFrame);

      const viewBar = el('div', 'wardrobe-view-bar');
      const viewOpts = [
        { id: 'front', label: '正面' },
        { id: 'left', label: '左侧' },
        { id: 'back', label: '背面' },
        { id: 'right', label: '右侧' },
        { id: 'spin', label: '🌀 转圈' },
      ];
      viewOpts.forEach((v) => {
        const vb = el('button', `wardrobe-view-btn ${v.id === viewMode ? 'active' : ''}`, v.label);
        vb.type = 'button';
        vb.dataset.view = v.id;
        vb.addEventListener('click', () => {
          audio.blip();
          viewMode = v.id;
          spinElapsed = 0;
          viewBar.querySelectorAll('.wardrobe-view-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.view === viewMode);
          });
        });
        viewBar.appendChild(vb);
      });
      stageCol.appendChild(viewBar);

      const summaryPill = el('div', 'wardrobe-summary-pill', Wardrobe.getLookSummary());
      stageCol.appendChild(summaryPill);

      const stageActions = el('div', 'wardrobe-stage-actions');
      const randomBtn = el('button', 'sd-btn secondary wardrobe-mini-btn', '🎲 随机搭配');
      randomBtn.type = 'button';
      randomBtn.addEventListener('click', () => {
        audio.open();
        Wardrobe.randomizeLook();
        burstSparkles(18);
        renderControls();
      });
      const resetBtn = el('button', 'sd-btn secondary wardrobe-mini-btn', '↺ 恢复默认');
      resetBtn.type = 'button';
      resetBtn.addEventListener('click', () => {
        audio.blip();
        Wardrobe.resetLook();
        burstSparkles(10);
        renderControls();
      });
      stageActions.appendChild(randomBtn);
      stageActions.appendChild(resetBtn);
      stageCol.appendChild(stageActions);

      // RIGHT PANEL: Category Tabs + Free Mix-and-Match Controls
      const controlsCol = el('div', 'wardrobe-controls-col');
      const tabBar = el('div', 'wardrobe-tabs');
      const tabs = [
        { id: 'outfit', label: '👗 换衣服' },
        { id: 'hair', label: '💇‍♀️ 换发型' },
        { id: 'headwear', label: '🎀 发饰眼镜' },
        { id: 'makeup', label: '💄 妆容套装' },
      ];
      tabs.forEach((t) => {
        const tb = el('button', `wardrobe-tab-btn ${t.id === activeTab ? 'active' : ''}`, t.label);
        tb.type = 'button';
        tb.dataset.tab = t.id;
        tb.addEventListener('click', () => {
          audio.blip();
          activeTab = t.id;
          tabBar.querySelectorAll('.wardrobe-tab-btn').forEach((b) => {
            b.classList.toggle('active', b.dataset.tab === activeTab);
          });
          renderControls();
        });
        tabBar.appendChild(tb);
      });
      controlsCol.appendChild(tabBar);

      const panelBody = el('div', 'wardrobe-panel');
      controlsCol.appendChild(panelBody);

      function applyChange(patch, playGift = false) {
        if (playGift) audio.open();
        else audio.blip();
        Wardrobe.setLook(patch);
        burstSparkles(14);
        renderControls();
      }

      function renderControls() {
        const cur = Wardrobe.getLook();
        summaryPill.textContent = Wardrobe.getLookSummary();
        panelBody.innerHTML = '';

        if (activeTab === 'outfit') {
          panelBody.appendChild(el('div', 'wardrobe-section-title', '选择想穿的服装（衣柜现挂 5 套）'));
          const grid = el('div', 'wardrobe-grid');
          Wardrobe.OUTFITS.forEach((o) => {
            const card = el('button', `wardrobe-card ${cur.outfit === o.id ? 'active' : ''}`);
            card.type = 'button';
            card.dataset.outfitId = o.id;
            const head = el('div', 'wardrobe-card-head');
            const swatch = el('span', 'wardrobe-swatch');
            swatch.style.background = `linear-gradient(135deg, ${o.swatch} 55%, ${o.accent} 55%)`;
            head.appendChild(swatch);
            head.appendChild(el('span', 'wardrobe-card-badge', o.badge));
            card.appendChild(head);
            card.appendChild(el('div', 'wardrobe-card-title', o.name));
            card.appendChild(el('div', 'wardrobe-card-desc', o.desc));
            card.addEventListener('click', () => applyChange({ outfit: o.id }));
            grid.appendChild(card);
          });
          panelBody.appendChild(grid);
        } else if (activeTab === 'hair') {
          panelBody.appendChild(el('div', 'wardrobe-section-title', '百变少女发型'));
          const grid = el('div', 'wardrobe-grid');
          Wardrobe.HAIRSTYLES.forEach((h) => {
            const card = el('button', `wardrobe-card ${cur.hair === h.id ? 'active' : ''}`);
            card.type = 'button';
            card.dataset.hairId = h.id;
            const head = el('div', 'wardrobe-card-head');
            head.appendChild(el('span', 'wardrobe-card-emoji', h.icon));
            head.appendChild(el('span', 'wardrobe-card-badge', cur.hair === h.id ? '使用中' : '切换'));
            card.appendChild(head);
            card.appendChild(el('div', 'wardrobe-card-title', h.name));
            card.appendChild(el('div', 'wardrobe-card-desc', h.desc));
            card.addEventListener('click', () => applyChange({ hair: h.id }));
            grid.appendChild(card);
          });
          panelBody.appendChild(grid);

          panelBody.appendChild(el('div', 'wardrobe-section-title', '随心染发色彩'));
          const colorRow = el('div', 'wardrobe-color-row');
          Wardrobe.HAIR_COLORS.forEach((c) => {
            const btn = el('button', `wardrobe-pill-btn ${cur.hairColor === c.id ? 'active' : ''}`);
            btn.type = 'button';
            btn.dataset.hairColorId = c.id;
            const dot = el('span', 'wardrobe-color-dot');
            dot.style.background = c.swatch;
            btn.appendChild(dot);
            btn.appendChild(el('span', '', c.name));
            btn.addEventListener('click', () => applyChange({ hairColor: c.id }));
            colorRow.appendChild(btn);
          });
          panelBody.appendChild(colorRow);
        } else if (activeTab === 'headwear') {
          panelBody.appendChild(el('div', 'wardrobe-section-title', '发卡与可爱头饰'));
          const grid = el('div', 'wardrobe-grid compact');
          Wardrobe.HEADWEARS.forEach((hw) => {
            const card = el('button', `wardrobe-card compact ${cur.headwear === hw.id ? 'active' : ''}`);
            card.type = 'button';
            card.dataset.headwearId = hw.id;
            const head = el('div', 'wardrobe-card-head');
            head.appendChild(el('span', 'wardrobe-card-emoji', hw.icon));
            card.appendChild(head);
            card.appendChild(el('div', 'wardrobe-card-title', hw.name));
            card.appendChild(el('div', 'wardrobe-card-desc', hw.desc));
            card.addEventListener('click', () => applyChange({ headwear: hw.id }));
            grid.appendChild(card);
          });
          panelBody.appendChild(grid);

          panelBody.appendChild(el('div', 'wardrobe-section-title', '圆框眼镜装饰'));
          const gRow = el('div', 'wardrobe-pill-row');
          Wardrobe.GLASSES_STYLES.forEach((gl) => {
            const btn = el('button', `wardrobe-pill-btn ${cur.glasses === gl.id ? 'active' : ''}`, `${gl.icon} ${gl.name}`);
            btn.type = 'button';
            btn.addEventListener('click', () => applyChange({ glasses: gl.id }));
            gRow.appendChild(btn);
          });
          panelBody.appendChild(gRow);
        } else if (activeTab === 'makeup') {
          panelBody.appendChild(el('div', 'wardrobe-section-title', '甜美腮红与面部贴纸'));
          const blushRow = el('div', 'wardrobe-pill-row');
          Wardrobe.BLUSHES.forEach((bl) => {
            const btn = el('button', `wardrobe-pill-btn ${cur.blush === bl.id ? 'active' : ''}`, `${bl.icon} ${bl.name}`);
            btn.type = 'button';
            btn.addEventListener('click', () => applyChange({ blush: bl.id }));
            blushRow.appendChild(btn);
          });
          panelBody.appendChild(blushRow);

          panelBody.appendChild(el('div', 'wardrobe-section-title', '水嫩果冻唇彩'));
          const lipRow = el('div', 'wardrobe-color-row');
          Wardrobe.LIPS.forEach((lp) => {
            const btn = el('button', `wardrobe-pill-btn ${cur.lip === lp.id ? 'active' : ''}`);
            btn.type = 'button';
            const dot = el('span', 'wardrobe-color-dot');
            dot.style.background = lp.swatch;
            btn.appendChild(dot);
            btn.appendChild(el('span', '', lp.name));
            btn.addEventListener('click', () => applyChange({ lip: lp.id }));
            lipRow.appendChild(btn);
          });
          panelBody.appendChild(lipRow);

          panelBody.appendChild(el('div', 'wardrobe-section-title', '一键推荐灵感套装'));
          const pGrid = el('div', 'wardrobe-preset-grid');
          Wardrobe.PRESETS.forEach((pr) => {
            const btn = el('button', 'wardrobe-preset-btn', pr.name);
            btn.type = 'button';
            btn.addEventListener('click', () => {
              audio.open();
              Wardrobe.applyPreset(pr.id);
              burstSparkles(20);
              renderControls();
            });
            pGrid.appendChild(btn);
          });
          panelBody.appendChild(pGrid);
        }
      }

      renderControls();
      studio.appendChild(stageCol);
      studio.appendChild(controlsCol);
      body.appendChild(studio);

      const footer = el('div', 'modal-footer-actions');
      const applyBtn = el('button', 'sd-btn', '✨ 换上这身美美出门');
      applyBtn.type = 'button';
      applyBtn.addEventListener('click', () => {
        closeModal();
        audio.open();
        const pos = callbacks.onGetPlayerPos ? callbacks.onGetPlayerPos() : { x: 256, y: 220 };
        particles.spawnHearts(pos.x, pos.y - 34, 8);
        particles.spawnConfetti(pos.x, pos.y - 26, 14);
        callbacks.onTriggerEmote?.('spin');
      });
      footer.appendChild(applyBtn);
      body.appendChild(footer);

      // Animated mirror preview loop
      const pctx = previewCanvas.getContext('2d');
      function renderPreview(now) {
        if (!state.wardrobeOpen) return;
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
        lastTs = now;
        spinElapsed += dt;

        pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Soft studio halo inside arched mirror backdrop
        const bgGrad = pctx.createRadialGradient(110, 128, 12, 110, 132, 118);
        bgGrad.addColorStop(0, '#fff9fc');
        bgGrad.addColorStop(0.65, '#ffe5f0');
        bgGrad.addColorStop(1, '#f7cade');
        pctx.fillStyle = bgGrad;
        pctx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Soft shadow floor oval
        pctx.fillStyle = 'rgba(130, 72, 96, 0.18)';
        pctx.beginPath();
        pctx.ellipse(110, 238, 44, 10, 0, 0, Math.PI * 2);
        pctx.fill();

        let eff = viewMode;
        if (viewMode === 'spin') {
          const seq = ['front', 'left', 'back', 'right'];
          eff = seq[Math.floor(spinElapsed * 1.6) % 4];
        }
        const srcKey = eff === 'left' || eff === 'right' ? 'side' : eff;
        const flipX = eff === 'right';
        const srcCanvas = Wardrobe.getViewCanvas(srcKey);

        if (srcCanvas) {
          const drawH = 216;
          const drawW = Math.round(drawH * (srcCanvas.width / srcCanvas.height));
          const bob = Math.sin(now * 0.0038) * 2.2;
          pctx.save();
          pctx.translate(110, 240 - bob);
          pctx.scale(flipX ? -1 : 1, 1);
          pctx.imageSmoothingEnabled = true;
          pctx.imageSmoothingQuality = 'high';
          pctx.drawImage(srcCanvas, -drawW / 2, -drawH, drawW, drawH);
          pctx.restore();
        }

        // Draw sparkle burst particles
        for (let i = sparkles.length - 1; i >= 0; i--) {
          const sp = sparkles[i];
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          sp.vy += 45 * dt;
          sp.life -= dt;
          if (sp.life <= 0) {
            sparkles.splice(i, 1);
            continue;
          }
          pctx.save();
          pctx.globalAlpha = Math.max(0, sp.life / sp.maxLife);
          drawMiniPreviewSparkle(pctx, sp.x, sp.y, 4, sp.col);
          pctx.restore();
        }

        wardrobePreviewRaf = requestAnimationFrame(renderPreview);
      }

      function drawMiniPreviewSparkle(c, x, y, r, col) {
        c.fillStyle = col;
        c.fillRect(Math.round(x - 1), Math.round(y - r), 2, r * 2);
        c.fillRect(Math.round(x - r), Math.round(y - 1), r * 2, 2);
      }

      wardrobePreviewRaf = requestAnimationFrame(renderPreview);
    }, true);
  }

  // -------------------- Interactive Stir-Fry & Cooking Modal --------------------
  function openCookingModal(initialTab = 'cook', prefillRecipeId = null) {
    const Cooking = window.SB.Cooking;
    if (!Cooking) return;

    openModalFrame('美乐蒂粉嫩小厨房 · 炒菜做饭台', (body) => {
      state.cookingOpen = true;
      let activeTab = initialTab === 'recipes' ? 'recipes' : 'cook';
      let phase = 'prep'; // 'prep' | 'wok' | 'result'
      let selected = [];
      let lastResult = null;

      if (prefillRecipeId) {
        const rec = Cooking.RECIPES.find((r) => r.id === prefillRecipeId);
        if (rec) selected = rec.ingredients.slice();
      } else {
        // Default convenient starter selection so user can even click "开火" right away or customize
        selected = ['tomato', 'egg'];
      }

      const root = el('div', 'cook-studio');
      body.appendChild(root);

      function stopWokLoop() {
        if (cookingRaf) {
          cancelAnimationFrame(cookingRaf);
          cookingRaf = null;
        }
        if (cookingKeyHandler) {
          window.removeEventListener('keydown', cookingKeyHandler);
          cookingKeyHandler = null;
        }
      }

      function render() {
        stopWokLoop();
        root.innerHTML = '';

        const cState = Cooking.getState();
        // Top Tabs
        const tabBar = el('div', 'cook-tabs');
        const tabCook = el('button', `cook-tab ${activeTab === 'cook' ? 'active' : ''}`, '🍳 炒菜做饭');
        const tabRecipes = el(
          'button',
          `cook-tab ${activeTab === 'recipes' ? 'active' : ''}`,
          `📖 私房菜谱 (${Cooking.getUnlockedCount()}/${Cooking.RECIPES.length})`
        );
        tabCook.type = 'button';
        tabRecipes.type = 'button';
        tabCook.addEventListener('click', () => {
          audio.blip();
          activeTab = 'cook';
          render();
        });
        tabRecipes.addEventListener('click', () => {
          audio.blip();
          activeTab = 'recipes';
          render();
        });
        tabBar.appendChild(tabCook);
        tabBar.appendChild(tabRecipes);
        root.appendChild(tabBar);

        if (activeTab === 'recipes') {
          renderRecipeBook();
        } else if (phase === 'wok') {
          renderWokMiniGame();
        } else if (phase === 'result' && lastResult) {
          renderDishResult(lastResult);
        } else {
          renderPrepPhase(cState);
        }
      }

      function renderPrepPhase(cState) {
        const wrap = el('div', 'cook-prep-wrap');

        // Status banner (Fresh wash buff + Rice status)
        const banner = el('div', 'cook-status-bar');
        const buffTag = el(
          'span',
          `cook-pill ${cState.freshPrepBuff ? 'active' : ''}`,
          cState.freshPrepBuff ? '✨ 已在水槽洗净备菜（美味度 +12！）' : '💧 提示：先去洗菜池洗菜可获 +12 新鲜加成'
        );
        const riceTag = el(
          'span',
          `cook-pill ${cState.riceReady ? 'active' : ''}`,
          cState.riceReady ? '🍚 电饭煲香米饭已焖好' : '🍚 电饭煲待焖饭'
        );
        banner.appendChild(buffTag);
        banner.appendChild(riceTag);
        wrap.appendChild(banner);

        // Quick-Fill Recipe Chips
        const quickTitle = el('div', 'cook-section-title', '✨ 一键选经典菜谱（或下方自由搭 2~4 种食材）：');
        wrap.appendChild(quickTitle);

        const quickRow = el('div', 'cook-quick-recipes');
        Cooking.RECIPES.forEach((rec) => {
          const isMatched =
            selected.length === rec.ingredients.length &&
            rec.ingredients.every((id) => selected.includes(id));
          const btn = el(
            'button',
            `cook-recipe-chip ${isMatched ? 'selected' : ''}`,
            `${rec.icon} ${rec.name}`
          );
          btn.type = 'button';
          btn.addEventListener('click', () => {
            audio.chop();
            selected = rec.ingredients.slice();
            render();
          });
          quickRow.appendChild(btn);
        });
        wrap.appendChild(quickRow);

        // Fridge Ingredients Grid (12 items)
        const ingTitle = el('div', 'cook-section-title', `🧊 冰箱新鲜食材（已选 ${selected.length}/4）：`);
        wrap.appendChild(ingTitle);

        const grid = el('div', 'cook-ing-grid');
        Cooking.INGREDIENTS.forEach((ing) => {
          const isPicked = selected.includes(ing.id);
          const card = el('button', `cook-ing-card ${isPicked ? 'selected' : ''}`);
          card.type = 'button';
          card.innerHTML = `<span class="cook-ing-ico">${ing.icon}</span><span class="cook-ing-name">${ing.name}</span>`;
          card.addEventListener('click', () => {
            if (isPicked) {
              selected = selected.filter((x) => x !== ing.id);
              audio.blip();
            } else {
              if (selected.length >= 4) {
                audio.close();
                return;
              }
              selected = [...selected, ing.id];
              audio.chop();
            }
            render();
          });
          grid.appendChild(card);
        });
        wrap.appendChild(grid);

        // Preview & Start Cooking Bar
        const matched = Cooking.matchRecipe(selected);
        const footer = el('div', 'cook-prep-footer');
        const preview = el('div', 'cook-prep-preview');
        const pickedIcons = selected.map((id) => {
          const it = Cooking.getIngredient(id);
          return it ? `${it.icon}${it.name}` : '';
        }).join(' + ');

        preview.innerHTML = selected.length < 2
          ? `<div class="cook-preview-title">请至少选择 2 种食材下锅哦～</div>`
          : `<div class="cook-preview-title">${matched ? `📖 将烹饪：【${matched.icon} ${matched.name}】` : '✨ 将烹饪：【小Q包自由创意小炒】'}</div>
             <div class="cook-preview-sub">${pickedIcons}</div>`;
        footer.appendChild(preview);

        const startBtn = el('button', 'sd-btn sd-btn-primary cook-start-btn', '🔥 开火下锅炒菜！');
        startBtn.type = 'button';
        startBtn.disabled = selected.length < 2;
        startBtn.addEventListener('click', () => {
          if (selected.length < 2) return;
          audio.sizzle();
          if (callbacks.onStartActivity) {
            callbacks.onStartActivity({ type: 'cook', x: 240, y: 176, dir: 'up', label: '炒菜中' });
          }
          phase = 'wok';
          render();
        });
        footer.appendChild(startBtn);
        wrap.appendChild(footer);

        root.appendChild(wrap);
      }

      function renderWokMiniGame() {
        const matched = Cooking.matchRecipe(selected);
        const ingObjs = selected.map((id) => Cooking.getIngredient(id)).filter(Boolean);

        const wrap = el('div', 'cook-wok-wrap');
        const head = el(
          'div',
          'cook-wok-head',
          `🔥 正在烹饪：${matched ? `${matched.icon} ${matched.name}` : '✨ 自由创意小炒'} — 控火保持在绿色黄金区并点击颠勺！`
        );
        wrap.appendChild(head);

        // Animated Wok Canvas
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 176;
        canvas.className = 'cook-wok-canvas';
        wrap.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // Meters: Heat Gauge & Progress Bar
        const meters = el('div', 'cook-meters');

        const heatRow = el('div', 'cook-meter-row');
        const heatLabel = el('div', 'cook-meter-label', '🔥 锅内火候：中温黄金区');
        const heatTrack = el('div', 'cook-heat-track');
        const heatSweet = el('div', 'cook-heat-sweet'); // 42%..76%
        const heatPointer = el('div', 'cook-heat-pointer');
        heatTrack.appendChild(heatSweet);
        heatTrack.appendChild(heatPointer);
        heatRow.appendChild(heatLabel);
        heatRow.appendChild(heatTrack);

        const progRow = el('div', 'cook-meter-row');
        const progLabel = el('div', 'cook-meter-label', '🍳 炒菜熟度：0%');
        const progTrack = el('div', 'cook-prog-track');
        const progFill = el('div', 'cook-prog-fill');
        progTrack.appendChild(progFill);
        progRow.appendChild(progLabel);
        progRow.appendChild(progTrack);

        meters.appendChild(heatRow);
        meters.appendChild(progRow);
        wrap.appendChild(meters);

        // Controls
        const ctrlRow = el('div', 'cook-controls');

        const fireGroup = el('div', 'cook-fire-group');
        const fireBtns = {};
        [
          { lv: 1, label: '🌡️ 小火' },
          { lv: 2, label: '🔥 中火' },
          { lv: 3, label: '🔥🔥 大火' },
        ].forEach((f) => {
          const b = el('button', `cook-fire-btn ${f.lv === 2 ? 'active' : ''}`, f.label);
          b.type = 'button';
          b.addEventListener('click', () => {
            fireLevel = f.lv;
            audio.blip();
            Object.entries(fireBtns).forEach(([k, btn]) => {
              btn.classList.toggle('active', Number(k) === fireLevel);
            });
          });
          fireBtns[f.lv] = b;
          fireGroup.appendChild(b);
        });
        ctrlRow.appendChild(fireGroup);

        const actionGroup = el('div', 'cook-action-group');
        const tossBtn = el('button', 'sd-btn sd-btn-primary cook-toss-btn', '🍳 颠勺翻炒 (空格)');
        tossBtn.type = 'button';
        const seasonBtn = el('button', 'sd-btn cook-season-btn', '🧂 撒调料 (等待时机)');
        seasonBtn.type = 'button';
        seasonBtn.disabled = true;

        actionGroup.appendChild(tossBtn);
        actionGroup.appendChild(seasonBtn);
        ctrlRow.appendChild(actionGroup);
        wrap.appendChild(ctrlRow);

        root.appendChild(wrap);

        // Mini-Game Simulation State
        let fireLevel = 2;          // 1 low, 2 med, 3 high
        let heat = 52;              // 0..100, sweet spot 42..76
        let progress = 0;           // 0..100
        let score = 58;             // 0..100
        let burnMeter = 0;          // 0..100 (>=100 burns!)
        let tossAnim = 0;           // 0..1 bounce animation
        let seasonPromptActive = false;
        let seasonPromptsTriggered = 0;
        let seasonWindowTimer = 0;
        let seasonSparkle = 0;
        let finished = false;
        let lastTime = performance.now();

        const chunks = ingObjs.concat(ingObjs).slice(0, 6).map((ing, idx) => ({
          icon: ing.icon,
          color: ing.color,
          x: 146 + (idx % 3) * 32 + (Math.random() * 10 - 5),
          y: 108,
          vy: 0,
          vx: 0,
          rot: 0,
        }));
        const puffs = [];

        function doToss() {
          if (finished) return;
          audio.sizzle();
          tossAnim = 1;
          heat = Math.max(18, heat - 7);
          const inSweet = heat >= 42 && heat <= 76;
          progress = Math.min(100, progress + (inSweet ? 14 : 9));
          score = Math.min(100, score + (inSweet ? 5.5 : 2));
          chunks.forEach((ch) => {
            ch.vy = -(165 + Math.random() * 85);
            ch.vx = (Math.random() - 0.5) * 65;
          });
          for (let i = 0; i < 4; i++) {
            puffs.push({
              x: 150 + Math.random() * 60,
              y: 96,
              vy: -(28 + Math.random() * 24),
              life: 0,
              maxLife: 0.75,
              col: inSweet ? '#fff9e6' : '#ffe6eb',
            });
          }
          if (particles && particles.spawnSteam) particles.spawnSteam(240, 98, 2);
        }

        function doSeason() {
          if (finished || !seasonPromptActive) return;
          seasonPromptActive = false;
          seasonSparkle = 1;
          score = Math.min(100, score + 14);
          progress = Math.min(100, progress + 6);
          seasonBtn.disabled = true;
          seasonBtn.classList.remove('ready');
          seasonBtn.textContent = '✨ 完美撒调料 +14！';
          audio.questDone();
        }

        tossBtn.addEventListener('click', doToss);
        seasonBtn.addEventListener('click', doSeason);

        cookingKeyHandler = (e) => {
          if (e.code === 'Space') {
            e.preventDefault();
            doToss();
          } else if (e.key === '1') {
            fireBtns[1].click();
          } else if (e.key === '2') {
            fireBtns[2].click();
          } else if (e.key === '3') {
            fireBtns[3].click();
          } else if ((e.key === 'e' || e.key === 'E') && seasonPromptActive) {
            doSeason();
          }
        };
        window.addEventListener('keydown', cookingKeyHandler);

        function finishCooking(burned) {
          if (finished) return;
          finished = true;
          stopWokLoop();
          lastResult = Cooking.evaluateCook({
            ingredientIds: selected,
            score,
            burned,
          });
          if (!burned) {
            audio.dishDone();
            if (particles) {
              particles.spawnConfetti(240, 118, 26);
              particles.spawnHearts(240, 128, 6);
            }
          } else {
            audio.close();
            if (particles) particles.spawnSteam(240, 94, 8);
          }
          phase = 'result';
          render();
        }

        function tick(now) {
          const dt = Math.min(0.05, (now - lastTime) / 1000);
          lastTime = now;

          // Update heat based on fire level
          const delta = fireLevel === 1 ? -11 : fireLevel === 2 ? 4.5 : 19;
          heat = Math.max(10, Math.min(100, heat + delta * dt));

          const inSweet = heat >= 42 && heat <= 76;
          if (inSweet) {
            progress = Math.min(100, progress + 7.2 * dt);
            score = Math.min(100, score + 2.2 * dt);
            burnMeter = Math.max(0, burnMeter - 12 * dt);
          } else if (heat > 76) {
            progress = Math.min(100, progress + 5.0 * dt);
            score = Math.max(20, score - 5 * dt);
            if (heat > 90) burnMeter += 34 * dt;
          } else {
            progress = Math.min(100, progress + 2.5 * dt);
            burnMeter = Math.max(0, burnMeter - 16 * dt);
          }

          // Trigger seasoning bonus prompts at ~35% and ~72%
          if (
            !seasonPromptActive &&
            ((seasonPromptsTriggered === 0 && progress >= 32) ||
              (seasonPromptsTriggered === 1 && progress >= 68))
          ) {
            seasonPromptsTriggered += 1;
            seasonPromptActive = true;
            seasonWindowTimer = 3.2;
            seasonBtn.disabled = false;
            seasonBtn.classList.add('ready');
            seasonBtn.textContent = '🧂 快点撒调料！+14 (E)';
            audio.blip();
          }

          if (seasonPromptActive) {
            seasonWindowTimer -= dt;
            if (seasonWindowTimer <= 0) {
              seasonPromptActive = false;
              seasonBtn.disabled = true;
              seasonBtn.classList.remove('ready');
              seasonBtn.textContent = '🧂 撒调料 (等待时机)';
            }
          }

          if (burnMeter >= 100) {
            finishCooking(true);
            return;
          }
          if (progress >= 100) {
            finishCooking(false);
            return;
          }

          // Update UI gauges
          heatPointer.style.left = `${heat.toFixed(1)}%`;
          heatLabel.textContent =
            heat > 88
              ? '🔥 警告！火太大快糊锅啦，快调小火或颠勺！'
              : inSweet
                ? '✨ 黄金火候区！锅气满满～'
                : heat < 42
                  ? '🌡️ 火候偏小，调大一点火吧～'
                  : '🔥 火候偏旺，点颠勺降降温！';
          progLabel.textContent = `🍳 炒菜熟度：${Math.round(progress)}%`;
          progFill.style.width = `${progress.toFixed(1)}%`;

          // Animate wok, chunks & steam on Canvas
          tossAnim = Math.max(0, tossAnim - dt * 3.8);
          seasonSparkle = Math.max(0, seasonSparkle - dt * 1.8);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Cozy pink-cream tile background inside mini-game
          ctx.fillStyle = '#fff5f8';
          ctx.fillRect(0, 0, 360, 176);
          ctx.strokeStyle = '#f5dce5';
          ctx.lineWidth = 1;
          for (let gx = 0; gx < 360; gx += 36) {
            ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, 138); ctx.stroke();
          }
          for (let gy = 0; gy < 138; gy += 28) {
            ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(360, gy); ctx.stroke();
          }
          // Stainless countertop base
          ctx.fillStyle = '#cfd5dc';
          ctx.fillRect(0, 138, 360, 38);
          ctx.fillStyle = '#ebeff4';
          ctx.fillRect(0, 138, 360, 5);
          // Cast-iron stove burner
          ctx.fillStyle = '#36333a';
          ctx.fillRect(118, 134, 124, 14);

          // Dancing gas flames scaled by fireLevel
          const flameCount = fireLevel === 1 ? 4 : fireLevel === 2 ? 7 : 10;
          const flameH = fireLevel === 1 ? 10 : fireLevel === 2 ? 17 : 26;
          for (let i = 0; i < flameCount; i++) {
            const fx = 132 + (i * 96) / Math.max(1, flameCount - 1);
            const fh = flameH + Math.sin(now * 0.02 + i * 1.7) * 4;
            ctx.fillStyle = '#4db8ff';
            ctx.beginPath();
            ctx.arc(fx, 135, 6, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = fireLevel === 3 ? '#ff595e' : '#ff9f43';
            ctx.beginPath();
            ctx.moveTo(fx - 5, 134);
            ctx.lineTo(fx, 134 - fh);
            ctx.lineTo(fx + 5, 134);
            ctx.fill();
          }

          // Wok body w/ cute pink handle (bounces & tilts on toss!)
          const wokLift = Math.sin(tossAnim * Math.PI) * 18;
          const wokTilt = -Math.sin(tossAnim * Math.PI) * 0.16;
          ctx.save();
          ctx.translate(180, 122 - wokLift);
          ctx.rotate(wokTilt);
          // Pink Melody handle
          ctx.fillStyle = '#ff8eb3';
          ctx.strokeStyle = '#9e4c68';
          ctx.lineWidth = 2;
          ctx.fillRect(62, -16, 46, 11);
          ctx.strokeRect(62, -16, 46, 11);
          // Wok bowl
          ctx.fillStyle = '#4a4652';
          ctx.beginPath();
          ctx.arc(0, -14, 68, 0.06 * Math.PI, 0.94 * Math.PI);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#25232a';
          ctx.lineWidth = 3;
          ctx.stroke();
          // Glossy rim
          ctx.fillStyle = '#6f6a7a';
          ctx.fillRect(-66, -16, 132, 6);
          ctx.restore();

          // Update & draw tumbling ingredients
          ctx.font = '24px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          chunks.forEach((ch) => {
            ch.vy += 480 * dt;
            ch.x += ch.vx * dt;
            ch.y += ch.vy * dt;
            if (ch.y > 106 - wokLift) {
              ch.y = 106 - wokLift;
              ch.vy = 0;
              ch.vx *= 0.6;
            }
            ch.x = Math.max(128, Math.min(232, ch.x));
            ctx.fillText(ch.icon, ch.x, ch.y);
          });

          // Steam / Smoke puffs
          if (Math.random() < dt * (heat > 85 ? 10 : 4)) {
            puffs.push({
              x: 138 + Math.random() * 84,
              y: 94,
              vy: -(24 + Math.random() * 20),
              life: 0,
              maxLife: 0.9,
              col: heat > 88 ? 'rgba(90, 80, 85, 0.55)' : 'rgba(255, 255, 255, 0.72)',
            });
          }
          for (let i = puffs.length - 1; i >= 0; i--) {
            const p = puffs[i];
            p.life += dt;
            if (p.life >= p.maxLife) {
              puffs.splice(i, 1);
              continue;
            }
            p.y += p.vy * dt;
            ctx.globalAlpha = 1 - p.life / p.maxLife;
            ctx.fillStyle = p.col;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6 + p.life * 8, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;

          // Golden seasoning sparkle burst
          if (seasonSparkle > 0) {
            ctx.fillStyle = `rgba(255, 215, 74, ${seasonSparkle.toFixed(2)})`;
            ctx.font = 'bold 18px sans-serif';
            ctx.fillText('✨ 完美调味 +14！ ✨', 180, 34 - (1 - seasonSparkle) * 14);
          }

          cookingRaf = requestAnimationFrame(tick);
        }

        cookingRaf = requestAnimationFrame(tick);
      }

      function renderDishResult(dish) {
        const wrap = el('div', 'cook-result-wrap');
        const starsStr = '★'.repeat(dish.stars) + '☆'.repeat(3 - dish.stars);
        const card = el('div', 'cook-result-card');
        card.innerHTML = `
          <div class="cook-result-badge">${dish.icon}</div>
          <div class="cook-result-stars">${starsStr}</div>
          <div class="cook-result-name">${dish.name}</div>
          <div class="cook-result-score">美味度：${dish.score} / 100${dish.usedFreshBuff ? '（含洗菜新鲜 +12！）' : ''}</div>
          <div class="cook-result-comment">${dish.tasteLine}</div>
          <div class="cook-result-note">🍽️ 已自动盛盘摆在厨房下方【出餐台】上，冒着热气等你品尝！</div>
        `;
        wrap.appendChild(card);

        const btns = el('div', 'cook-result-actions');
        const againBtn = el('button', 'sd-btn sd-btn-primary', '🍳 再炒一道菜');
        const serveBtn = el('button', 'sd-btn', '🍽️ 端上出餐台看看');
        againBtn.type = 'button';
        serveBtn.type = 'button';
        againBtn.addEventListener('click', () => {
          audio.blip();
          phase = 'prep';
          render();
        });
        serveBtn.addEventListener('click', () => {
          closeModal();
        });
        btns.appendChild(againBtn);
        btns.appendChild(serveBtn);
        wrap.appendChild(btns);

        root.appendChild(wrap);
      }

      function renderRecipeBook() {
        const cState = Cooking.getState();
        const wrap = el('div', 'cook-book-wrap');
        const summary = el(
          'div',
          'cook-book-summary',
          `已解锁 ${Cooking.getUnlockedCount()} / ${Cooking.RECIPES.length} 道经典私房菜 · 累计烹饪 ${cState.totalCooked} 次`
        );
        wrap.appendChild(summary);

        const grid = el('div', 'cook-book-grid');
        Cooking.RECIPES.forEach((rec) => {
          const info = cState.unlocked[rec.id];
          const unlocked = Boolean(info);
          const card = el('div', `cook-book-card ${unlocked ? 'unlocked' : ''}`);
          const ingNames = rec.ingredients
            .map((id) => {
              const it = Cooking.getIngredient(id);
              return it ? `${it.icon}${it.name}` : id;
            })
            .join(' + ');
          const stars = unlocked ? '★'.repeat(info.bestStars) + '☆'.repeat(3 - info.bestStars) : '未解锁';

          card.innerHTML = `
            <div class="cook-book-top">
              <span class="cook-book-ico">${rec.icon}</span>
              <div>
                <div class="cook-book-name">${rec.name}</div>
                <div class="cook-book-stars">${stars}${unlocked ? ` · 做过 ${info.count} 次` : ''}</div>
              </div>
            </div>
            <div class="cook-book-ing">食材：${ingNames}</div>
            <div class="cook-book-desc">${rec.desc}</div>
          `;
          const cookThisBtn = el('button', 'sd-btn cook-book-btn', '🍳 去炒这道菜');
          cookThisBtn.type = 'button';
          cookThisBtn.addEventListener('click', () => {
            audio.blip();
            selected = rec.ingredients.slice();
            activeTab = 'cook';
            phase = 'prep';
            render();
          });
          card.appendChild(cookThisBtn);
          grid.appendChild(card);
        });
        wrap.appendChild(grid);
        root.appendChild(wrap);
      }

      render();
    }, true);
  }

  // Main dispatch when player interacts with an item in the room
  function triggerInteractable(item) {
    if (!item) return;
    switch (item.id) {
      case 'letter':
        openLetterModal();
        break;
      case 'cake':
        openCakeModal();
        break;
      case 'gifts':
        particles.spawnConfetti(458, 330, 26);
        openRoomGift('gifts');
        break;
      case 'gift_living':
        particles.spawnConfetti(335, 110, 24);
        openRoomGift('gift_living');
        break;
      case 'gift_bedroom':
        particles.spawnConfetti(272, 392, 24);
        openRoomGift('gift_bedroom');
        break;
      case 'gift_dressing':
        particles.spawnConfetti(144, 330, 24);
        openRoomGift('gift_dressing');
        break;
      case 'gift_bathroom':
        particles.spawnConfetti(112, 330, 24);
        openRoomGift('gift_bathroom');
        break;
      case 'gift_kitchen':
        particles.spawnConfetti(144, 330, 24);
        openRoomGift('gift_kitchen');
        break;
      case 'memories':
        openMemoriesModal();
        break;
      case 'calendar':
        openCalendarModal();
        break;
      case 'jukebox':
        openJukeboxModal();
        break;
      case 'tv':
        openTvModal();
        break;
      case 'junimo': {
        const quotes = cfg.junimoQuotes || ['啾咪～生日快乐！'];
        const quote = quotes[state.junimoIndex % quotes.length];
        state.junimoIndex += 1;
        audio.junimo();
        particles.spawnHearts(582, 206, 6);
        callbacks.onTriggerEmote?.('happy');
        showDialogue('祝尼魔朋友', quote, 'assets/sprites/junimo.gif', () => {
          markQuestDone('junimo');
        });
        break;
      }
      case 'pug': {
        const px = item.pet ? item.pet.x : 604;
        const py = item.pet ? item.pet.y - 34 : 348;
        window.SB.Pets?.triggerHappy('pug', particles);
        audio.bark();
        particles.spawnHearts(px, py, 6);
        callbacks.onTriggerEmote?.('happy');
        showDialogue(
          cfg.extraDialogues.pug.speaker,
          cfg.extraDialogues.pug.text,
          'assets/pets/pug-portrait.png'
        );
        break;
      }
      case 'shorthair': {
        const cx = item.pet ? item.pet.x : 352;
        const cy = item.pet ? item.pet.y - 34 : 232;
        window.SB.Pets?.triggerHappy('shorthair', particles);
        audio.meow();
        particles.spawnHearts(cx, cy, 6);
        callbacks.onTriggerEmote?.('happy');
        showDialogue(
          cfg.extraDialogues.shorthair.speaker,
          cfg.extraDialogues.shorthair.text,
          'assets/pets/shorthair-portrait.png'
        );
        break;
      }
      case 'pc':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.pc.text,
          [
            {
              label: '🖥️ 坐下打开电脑',
              primary: true,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'sit_pc',
                  label: '💻 坐在转椅上看电脑中…',
                  x: 108,
                  y: 180,
                  exitPos: { x: 144, y: 176 },
                  dir: 'left',
                  extraAction: { label: '🖥️ 打开电脑屏幕', onClick: openComputerModal },
                });
                openComputerModal();
              },
            },
            {
              label: '💺 只坐转椅发呆',
              primary: false,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'sit_pc',
                  label: '💻 坐在转椅上看电脑中…',
                  x: 108,
                  y: 180,
                  exitPos: { x: 144, y: 176 },
                  dir: 'left',
                  extraAction: { label: '🖥️ 打开电脑屏幕', onClick: openComputerModal },
                });
              },
            },
            { label: '先到处看看', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'piano':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.piano.text,
          [
            {
              label: '🎹 坐下弹钢琴',
              primary: true,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'play_piano',
                  label: '🎹 坐在琴凳上弹奶油立式钢琴…',
                  x: 240,
                  y: 152,
                  exitPos: { x: 240, y: 176 },
                  dir: 'up',
                  extraAction: { label: '🎹 弹出琴键', onClick: openPianoModal },
                });
                openPianoModal();
              },
            },
            { label: '先到处看看', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'nightstand':
        state.bedroomLampOn = !state.bedroomLampOn;
        audio.open();
        if (state.bedroomLampOn) {
          particles.spawnHearts(336, 74, 4);
        }
        showDialogue(
          cfg.celebrantName,
          state.bedroomLampOn
            ? '「啪嗒」拧开了床头小圆球夜灯，整个奶油粉色卧室一下子暖烘烘的，像包裹在晚霞里一样～'
            : '「啪嗒」轻轻关掉小圆球灯，霓虹心形灯和星光屏幕把房间映得好安静呀～',
          'assets/protagonist-portrait.png'
        );
        break;
      case 'baywindow':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.baywindow.text,
          [
            {
              label: '🧸 坐飘窗抱小白熊',
              primary: true,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'bay_window',
                  label: '🧸 靠在飘窗上抱小白熊看夜景…',
                  x: 570,
                  y: 172,
                  exitPos: { x: 528, y: 176 },
                  dir: 'right',
                });
              },
            },
            { label: '先到处看看', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'armchair':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.armchair.text,
          [
            {
              label: '🛋️ 窝进云朵沙发椅',
              primary: true,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'armchair',
                  label: '🛋️ 窝在云朵沙发椅闻香薰发呆…',
                  x: 161,
                  y: 402,
                  exitPos: { x: 144, y: 368 },
                  dir: 'down',
                });
              },
            },
            { label: '先到处看看', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'wardrobe_bed':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.wardrobe_bed.text,
          [
            {
              label: '👗 打开自由换装搭配间',
              primary: true,
              onSelect: () => openWardrobeModal('outfit'),
            },
            { label: '先逛逛卧室', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'windowseat':
        audio.open();
        particles.spawnHearts(112, 356, 5);
        showDialogue(
          cfg.celebrantName,
          cfg.extraDialogues.windowseat.text,
          'assets/protagonist-portrait.png'
        );
        break;
      case 'vanity':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.vanity.text,
          [
            {
              label: '💄 打开梳妆台化妆 & 换发型',
              primary: true,
              onSelect: () => openWardrobeModal('makeup'),
            },
            {
              label: '🪞 坐上圆凳照照镜子',
              primary: false,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'sit_vanity',
                  label: '💄 正坐在好莱坞梳妆台前化妆打扮…',
                  x: 256,
                  y: 142,
                  exitPos: { x: 256, y: 174 },
                  dir: 'up',
                  extraAction: { label: '💄 打开换装台', onClick: () => openWardrobeModal('makeup') },
                });
              },
            },
            { label: '先到处逛逛', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'wardrobe_left':
      case 'wardrobe':
        audio.open();
        openWardrobeModal('outfit');
        break;
      case 'wardrobe_right':
        audio.open();
        openWardrobeModal('hair');
        break;
      case 'accessories':
        audio.open();
        particles.spawnHearts(400, 304, 5);
        openWardrobeModal('headwear');
        break;
      case 'mirror': {
        const Wardrobe = window.SB.Wardrobe;
        const lookDesc = Wardrobe && Wardrobe.getLookSummary ? Wardrobe.getLookSummary() : '今日甜美穿搭';
        showDialogueChoices(
          cfg.celebrantName,
          `${cfg.extraDialogues.mirror.text}\n当前穿搭：【${lookDesc}】`,
          [
            {
              label: '💃 360° 试衣转圈展示',
              primary: true,
              onSelect: () => {
                audio.open();
                particles.spawnHearts(68, 300, 8);
                particles.spawnConfetti(68, 300, 14);
                callbacks.onTriggerEmote?.('spin');
              },
            },
            {
              label: '👗 打开自由换装搭配间',
              primary: false,
              onSelect: () => openWardrobeModal('outfit'),
            },
            { label: '先逛逛', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      }
      case 'sink':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.sink.text,
          [
            {
              label: '🫧 洗手洗脸照镜子',
              primary: true,
              onSelect: () => {
                audio.bubble();
                particles.spawnBubbles(192, 108, 6);
                callbacks.onStartActivity?.({
                  type: 'wash_face',
                  label: '🫧 在发光镜柜前洗手洗脸中…',
                  x: 192,
                  y: 174,
                  exitPos: { x: 192, y: 184 },
                  dir: 'up',
                });
              },
            },
            {
              label: state.bathroomMirrorLed ? '💡 关掉镜前补光灯' : '💡 打开镜前补光灯',
              primary: false,
              onSelect: () => {
                state.bathroomMirrorLed = !state.bathroomMirrorLed;
                audio.open();
                if (state.bathroomMirrorLed) particles.spawnHearts(174, 58, 3);
              },
            },
            { label: '先到处看看', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'toilet':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.toilet.text,
          [
            {
              label: '🚽 坐上马桶休息',
              primary: true,
              onSelect: () => {
                audio.open();
                callbacks.onStartActivity?.({
                  type: 'sit_toilet',
                  label: '🚽 安安静静上个厕所（起身自动冲水）…',
                  x: 77,
                  y: 150,
                  exitPos: { x: 80, y: 182 },
                  dir: 'down',
                });
              },
            },
            { label: '先到处看看', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'shower':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.shower.text,
          [
            {
              label: '🚿 打开花洒洗热水澡',
              primary: true,
              onSelect: () => {
                state.showerRunning = true;
                audio.bubble();
                particles.spawnSteam(392, 134, 4);
                particles.spawnBubbles(392, 168, 8);
                callbacks.onStartActivity?.({
                  type: 'shower',
                  label: '🚿 正在雨林花洒下洗热水澡…',
                  x: 392,
                  y: 162,
                  exitPos: { x: 352, y: 208 },
                  dir: 'down',
                });
              },
            },
            {
              label: state.showerRunning ? '💧 关掉花洒水流' : '💧 试着打开花洒水',
              primary: false,
              onSelect: () => {
                state.showerRunning = !state.showerRunning;
                audio.bubble();
              },
            },
            { label: '先到处看看', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'bathtub':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.bathtub.text,
          [
            {
              label: '🛁 泡个草莓泡泡澡',
              primary: true,
              onSelect: () => {
                audio.bubble();
                particles.spawnBubbles(386, 290, 12);
                particles.spawnSteam(386, 282, 4);
                callbacks.onStartActivity?.({
                  type: 'bath',
                  label: '🛁 泡在草莓泡泡浴池里暖呼呼发呆…',
                  x: 386,
                  y: 314,
                  exitPos: { x: 352, y: 240 },
                  dir: 'down',
                });
              },
            },
            {
              label: '🦆 捏捏小黄鸭',
              primary: false,
              onSelect: () => {
                audio.junimo();
                particles.spawnBubbles(348, 282, 8);
                particles.spawnHearts(348, 266, 4);
              },
            },
            { label: '先到处看看', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'bookshelf':
        audio.open();
        showDialogueChoices(
          cfg.celebrantName,
          '顶天立地的法式拱门奶油书架！排满了粉嫩精装童话书、手账集、玻璃雪花球，还有排排坐的兔兔和小熊盲盒手办～',
          [
            {
              label: '📚 站着捧读童话手账',
              primary: true,
              onSelect: () => {
                audio.blip();
                particles.spawnHearts(96, 114, 5);
                callbacks.onStartActivity?.({
                  type: 'read_book',
                  label: '📖 正站在书架前认真翻看童话手账…',
                  x: 108,
                  y: 176,
                  dir: 'up',
                });
                showDialogue(
                  cfg.celebrantName,
                  '翻开夹着干花书签的《星露谷秋日童话》，书页里还偷偷藏着一张写着“小Q包天天开心”的小纸条呢！',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            {
              label: '🎀 摇一摇书架顶上的雪花球',
              onSelect: () => {
                audio.junimo();
                particles.spawnConfetti(60, 74, 16);
                showDialogue(
                  cfg.celebrantName,
                  '哗啦啦～雪花球里飘起细碎的粉色樱花亮片，在书房暖光下闪闪发亮！',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            { label: '先逛逛书房', onSelect: () => {} },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'craft_desk':
        audio.open();
        showDialogueChoices(
          cfg.celebrantName,
          '靠墙的手账与水彩画架角！画架上夹着刚画了一半的樱花天空小画，粉色滚轮推车里塞满了彩色马克笔和和纸胶带～',
          [
            {
              label: '🎨 给团团和 lucky 添几笔小画',
              primary: true,
              onSelect: () => {
                audio.junimo();
                particles.spawnHearts(66, 214, 6);
                if (callbacks.onStartActivity) {
                  callbacks.onStartActivity({ type: 'sit_study', x: 106, y: 242, dir: 'left', label: '画画中' });
                }
                showDialogue(
                  cfg.celebrantName,
                  '刷刷刷～在樱花树下画上了摇尾巴的团团和眯眯眼的 lucky！这幅《小Q包的幸福小家》可以裱起来挂客厅啦！',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            {
              label: '✍️ 贴一页今日份生日手账',
              onSelect: () => {
                audio.blip();
                particles.spawnConfetti(66, 252, 18);
                showDialogue(
                  cfg.celebrantName,
                  '贴上草莓蛋糕贴纸和闪粉胶带，工工整整写下：“今天的风很甜，生日快乐呀小Q包张哼哼！”',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            { label: '稍后再画', onSelect: () => {} },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'readingnook':
        audio.open();
        showDialogueChoices(
          cfg.celebrantName,
          '软乎乎的樱花粉拉扣阅读沙发！配着暖黄拱形落地灯、星星抱枕和冒着热气的洋甘菊花茶，窝在这里能看一下午书～',
          [
            {
              label: '📖 窝进软垫沙发看书喝茶',
              primary: true,
              onSelect: () => {
                audio.junimo();
                particles.spawnHearts(102, 330, 6);
                if (callbacks.onStartActivity) {
                  callbacks.onStartActivity({ type: 'sit_reading', x: 98, y: 356, dir: 'down', label: '看书喝茶中' });
                }
                showDialogue(
                  cfg.celebrantName,
                  '陷进软绵绵的粉色沙发里，抿一口温热的洋甘菊茶，整个世界都安静温柔下来啦～',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            {
              label: state.studyLampOn ? '💡 关掉书房暖光灯' : '💡 打开书房暖光灯',
              onSelect: () => {
                state.studyLampOn = !state.studyLampOn;
                audio.blip();
              },
            },
            { label: '先到处看看', onSelect: () => {} },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'record_shelf':
        audio.open();
        showDialogueChoices(
          cfg.celebrantName,
          '低矮的法式奶油黑胶唱片边柜，摆着复古粉色手提唱片机、时尚画报和郁金香花瓶～',
          [
            {
              label: '💿 放一首《鹈鹕镇暖炉晚风》黑胶',
              primary: true,
              onSelect: () => {
                audio.selectTrack(2);
                updateHud();
                particles.spawnMusicNote(256, 336);
                particles.spawnHearts(256, 326, 4);
                showDialogue(
                  cfg.celebrantName,
                  '轻轻落下唱针～温柔舒缓的黑胶旋律在书房里流淌开来，配着窗外阳光简直太惬意啦！',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            {
              label: '🎵 切回《八音盒 · 生日快乐歌》',
              onSelect: () => {
                audio.selectTrack(1);
                updateHud();
                particles.spawnMusicNote(256, 336);
              },
            },
            { label: '保持当前音乐', onSelect: () => {} },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'plushies':
        audio.junimo();
        particles.spawnHearts(568, 118, 7);
        showDialogue(
          cfg.celebrantName,
          cfg.extraDialogues.plushies.text,
          'assets/protagonist-portrait.png'
        );
        break;
      case 'teatable':
        audio.open();
        particles.spawnHearts(240, 336, 6);
        showDialogue(
          cfg.celebrantName,
          cfg.extraDialogues.teatable.text,
          'assets/protagonist-portrait.png'
        );
        break;
      case 'fridge':
        audio.open();
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.fridge.text,
          [
            {
              label: '🍳 拿食材去灶台炒菜',
              primary: true,
              onSelect: () => {
                openCookingModal('cook');
              },
            },
            {
              label: '🍓 偷吃一颗冰镇大草莓',
              onSelect: () => {
                audio.blip();
                particles.spawnHearts(368, 128, 6);
                showDialogue(
                  cfg.celebrantName,
                  '冰冰凉凉的奶油大草莓！一口咬下去满嘴甜汁，做饭动力瞬间充满 100%！',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            { label: '关上冰箱门', onSelect: () => {} },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'kitchensink':
        audio.bubble();
        particles.spawnBubbles(92, 118, 5);
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.kitchensink.text,
          [
            {
              label: '🥬 洗菜备菜（下道菜美味度 +12）',
              primary: true,
              onSelect: () => {
                if (window.SB.Cooking) window.SB.Cooking.setFreshPrep(true);
                audio.chop();
                particles.spawnBubbles(92, 118, 8);
                if (callbacks.onStartActivity) {
                  callbacks.onStartActivity({ type: 'wash_veggies', x: 108, y: 176, dir: 'up', label: '洗菜备菜' });
                }
                showDialogue(
                  cfg.celebrantName,
                  '哗啦啦～把新鲜蔬菜洗得水灵灵的，整齐切好摆在木菜板上啦！下一道菜获得【✨ 新鲜美味 +12】加成！',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            {
              label: '🍳 直接去灶台炒菜',
              onSelect: () => {
                openCookingModal('cook');
              },
            },
            { label: '先逛逛厨房', onSelect: () => {} },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'stove':
        audio.sizzle();
        particles.spawnSteam(240, 96, 6);
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.stove.text,
          [
            {
              label: '🍳 开火炒菜做饭！',
              primary: true,
              onSelect: () => {
                openCookingModal('cook');
              },
            },
            {
              label: '📖 翻看私房菜谱图鉴',
              onSelect: () => {
                openCookingModal('recipes');
              },
            },
            { label: '先闻闻香味', onSelect: () => {} },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'pantry': {
        const cookState = window.SB.Cooking ? window.SB.Cooking.getState() : null;
        audio.open();
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.pantry.text,
          [
            {
              label: cookState && cookState.riceReady ? '🍚 再焖一锅香喷喷米饭' : '🍚 按下粉色电饭煲焖饭',
              primary: true,
              onSelect: () => {
                if (window.SB.Cooking) window.SB.Cooking.setRiceReady(true);
                audio.bake();
                particles.spawnSteam(378, 204, 8);
                showDialogue(
                  cfg.celebrantName,
                  '叮咚～粉色电饭煲焖好一锅粒粒晶莹的东北香米饭！出餐台已经盛好满满一碗啦！',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            {
              label: '📖 查看私房菜谱图鉴',
              onSelect: () => {
                openCookingModal('recipes');
              },
            },
            { label: '先离开', onSelect: () => {} },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      }
      case 'serving_table': {
        const cookState = window.SB.Cooking ? window.SB.Cooking.getState() : null;
        const dish = cookState && cookState.lastDish;
        if (!dish) {
          audio.blip();
          showDialogueChoices(
            cfg.celebrantName,
            `${cfg.extraDialogues.serving_table.text} 现在盘子还是空的，去美乐蒂灶台炒一道拿手好菜吧！`,
            [
              {
                label: '🍳 去灶台炒菜',
                primary: true,
                onSelect: () => openCookingModal('cook'),
              },
              { label: '稍后再做', onSelect: () => {} },
            ],
            'assets/protagonist-portrait.png'
          );
        } else {
          const starsStr = '★'.repeat(dish.stars) + '☆'.repeat(3 - dish.stars);
          audio.dishDone();
          particles.spawnHearts(236, 314, 7);
          showDialogueChoices(
            cfg.celebrantName,
            `盘子里盛着刚出锅的【${dish.icon} ${dish.name}】（${starsStr} · 美味度 ${dish.score}）！热气腾腾的，好香呀～`,
            [
              {
                label: '🥢 端起筷子原地开吃！',
                primary: true,
                onSelect: () => {
                  audio.junimo();
                  particles.spawnHearts(236, 310, 8);
                  callbacks.onStartActivity?.({
                    type: 'eat_meal',
                    label: `🍽️ 正在香喷喷地品尝【${dish.name}】…`,
                    x: 236,
                    y: 300,
                    dir: 'down',
                  });
                  showDialogue(cfg.celebrantName, dish.tasteLine, 'assets/protagonist-portrait.png');
                },
              },
              {
                label: '🐾 端给团团和 lucky 闻闻香',
                onSelect: () => {
                  audio.bark();
                  particles.spawnHearts(236, 308, 10);
                  showDialogue(
                    cfg.celebrantName,
                    '团团在客厅门口闻到香味狂摇小卷尾，卧室里的 lucky 也喵喵探头！今天的小Q包大厨满分！',
                    'assets/protagonist-portrait.png'
                  );
                },
              },
              {
                label: '🍳 再去炒一道新菜',
                onSelect: () => openCookingModal('cook'),
              },
            ],
            'assets/protagonist-portrait.png'
          );
        }
        break;
      }
      case 'veggie_cart':
        audio.chop();
        particles.spawnHearts(76, 316, 4);
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.veggie_cart.text,
          [
            {
              label: '🍳 拿上新鲜食材去炒菜',
              primary: true,
              onSelect: () => openCookingModal('cook'),
            },
            { label: '太可爱啦', onSelect: () => {} },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'gacha': {
        const list = cfg.gachaCapsules || ['🎉 扭出【今日份好运】！'];
        const capsule = list[state.gachaIndex % list.length];
        state.gachaIndex += 1;
        audio.gacha();
        particles.spawnConfetti(192, 110, 26);
        showDialogue(
          '粉色好运扭蛋机',
          capsule,
          'assets/protagonist-portrait.png'
        );
        break;
      }
      case 'bed':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.bed.text,
          [
            {
              label: '🛏️ 盖被子睡一觉',
              primary: true,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'sleep',
                  label: '🛏️ 正在法式粉床盖被子睡觉（Zzz…）',
                  x: 404,
                  y: 164,
                  exitPos: { x: 336, y: 176 },
                  dir: 'down',
                });
              },
            },
            { label: '先到处看看', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'fireplace':
        audio.open();
        particles.spawnHearts(382, 74, 4);
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.fireplace.text,
          [
            {
              label: '🔥 蹲在壁炉前烤火取暖',
              primary: true,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'warm_fire',
                  label: '🔥 正在法式奶油壁炉前暖呼呼地烤火…',
                  x: 382,
                  y: 138,
                  dir: 'up',
                });
              },
            },
            { label: '先逛逛客厅', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'sofa':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.sofa.text,
          [
            {
              label: '🛋️ 窝进云朵沙发抱熊猫',
              primary: true,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'sit_sofa',
                  label: '🛋️ 窝在奶油云朵沙发里抱着胖熊猫看电视…',
                  x: 416,
                  y: 232,
                  exitPos: { x: 368, y: 232 },
                  dir: 'left',
                  extraAction: { label: '📺 遥控看电视', onClick: openTvModal },
                });
              },
            },
            {
              label: '📺 直接遥控打开电视',
              primary: false,
              onSelect: () => openTvModal(),
            },
            { label: '先逛逛', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'pink_sofa':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.pink_sofa.text,
          [
            {
              label: '🐰 坐进阳光粉色毛毛虫椅',
              primary: true,
              onSelect: () => {
                callbacks.onStartActivity?.({
                  type: 'sit_pink_sofa',
                  label: '🐰 窝在拱门白纱阳光下的粉色毛毛虫椅里抱兔兔…',
                  x: 224,
                  y: 140,
                  exitPos: { x: 224, y: 176 },
                  dir: 'down',
                });
              },
            },
            { label: '先逛逛', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'sideboard':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.sideboard.text,
          [
            {
              label: '☕ 冲一杯冰草莓拿铁',
              primary: true,
              onSelect: () => {
                audio.bubble();
                particles.spawnSteam(432, 324, 4);
                particles.spawnHearts(432, 336, 5);
                callbacks.onStartActivity?.({
                  type: 'sip_coffee',
                  label: '☕ 正在奶油餐边柜旁小口喝冰草莓拿铁…',
                  x: 372,
                  y: 336,
                  dir: 'right',
                });
                showDialogue(
                  cfg.celebrantName,
                  '粉粉的咖啡机「滋啦」打好绵密奶泡，加了两颗大草莓的冰拿铁超清甜，喝一口元气满满～',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            {
              label: '🍰 尝一颗法式马卡龙',
              primary: false,
              onSelect: () => {
                audio.open();
                particles.spawnHearts(432, 336, 6);
                callbacks.onTriggerEmote?.('love');
                showDialogue(
                  cfg.celebrantName,
                  '从双层金边点心架拿了一颗覆盆子玫瑰马卡龙，酥脆的外壳配甜甜的夹心，幸福到转圈圈！',
                  'assets/protagonist-portrait.png'
                );
              },
            },
            { label: '先逛逛', primary: false },
          ],
          'assets/protagonist-portrait.png'
        );
        break;
      case 'floor_lamp':
        state.livingLampsOn = !state.livingLampsOn;
        audio.open();
        if (state.livingLampsOn) {
          particles.spawnHearts(304, 74, 4);
        }
        showDialogue(
          cfg.celebrantName,
          state.livingLampsOn
            ? '打开了百褶落地灯、餐桌暖灯光与电视背景氛围灯带～整间奶油客厅瞬间泡进温柔的暖金光晕里！'
            : '关掉了屋里的氛围暖灯，只留着拱形落地窗的白纱自然阳光和壁炉小火苗，清爽又通透！',
          'assets/protagonist-portrait.png'
        );
        break;
      case 'pet_corner':
        showDialogueChoices(
          cfg.celebrantName,
          cfg.extraDialogues.pet_corner.text,
          [
            {
              label: '🦴 给团团加餐小肉干',
              primary: true,
              onSelect: () => {
                audio.giftOpen();
                window.SB.Pets?.triggerHappy('pug', particles);
                particles.spawnHearts(364, 366, 6);
                showDialogue(
                  '团团',
                  '汪呜呜～！（听见小零食罐响，小八哥团团欢快地摇着小卷尾哒哒跑过来，三两口吃掉香喷喷小肉干，开心地舔了舔小Q包张哼哼的手心！）',
                  'assets/pets/pug-portrait.png'
                );
              },
            },
            { label: '先逛逛', primary: false },
          ],
          'assets/pets/pug-portrait.png'
        );
        break;
      case 'door':
        showDialogue(
          cfg.celebrantName,
          cfg.extraDialogues.door.text,
          'assets/protagonist-portrait.png'
        );
        break;
      default:
        break;
    }
  }

  function init(deps) {
    cfg = window.SB.CONFIG;
    audio = deps.audio;
    particles = deps.particles;
    callbacks = deps.callbacks || {};

    // Cache DOM elements
    els.welcomeOverlay = document.getElementById('welcome-overlay');
    els.welcomeTitle = document.getElementById('welcome-title');
    els.welcomeBadge = document.getElementById('welcome-badge');
    els.welcomeSubtitle = document.getElementById('welcome-subtitle');
    els.enterRoomBtn = document.getElementById('enter-room-btn');

    els.hudDateCard = document.getElementById('hud-date-card');
    els.hudSeason = document.getElementById('hud-season');
    els.hudDatePrefix = document.getElementById('hud-date-prefix');
    els.hudNameText = document.getElementById('hud-name-text');
    els.roomBanner = document.getElementById('room-banner');
    els.roomBannerName = document.getElementById('room-banner-name');
    els.poseBtn = document.getElementById('pose-btn');
    els.poseMenu = document.getElementById('pose-menu');
    els.birthdayMenuBtn = document.getElementById('birthday-menu-btn');
    els.timeModeBtn = document.getElementById('time-mode-btn');
    els.questBtn = document.getElementById('hud-quest-btn');
    els.questBtnLabel = document.getElementById('hud-quest-label');
    els.musicBtn = document.getElementById('hud-music-btn');
    els.helpBtn = document.getElementById('hud-help-btn');
    els.controlsToast = document.getElementById('controls-toast');

    els.interactPrompt = document.getElementById('interact-prompt');
    els.interactPromptText = document.getElementById('interact-prompt-text');
    els.touchInteractBtn = document.getElementById('touch-interact-btn');
    els.activityBar = document.getElementById('activity-bar');
    els.activityLabel = document.getElementById('activity-label');
    els.activityExtraBtn = document.getElementById('activity-extra-btn');
    els.activityExitBtn = document.getElementById('activity-exit-btn');

    els.dialogueBackdrop = document.getElementById('dialogue-backdrop');
    els.dialogueBox = document.getElementById('dialogue-box');
    els.dialogueAvatar = document.getElementById('dialogue-avatar');
    els.dialogueSpeaker = document.getElementById('dialogue-speaker');
    els.dialogueText = document.getElementById('dialogue-text');
    els.dialogueChoices = document.getElementById('dialogue-choices');
    els.dialogueNext = document.getElementById('dialogue-next');

    els.modalBackdrop = document.getElementById('modal-backdrop');
    els.modalCard = document.getElementById('modal-card');
    els.modalTitle = document.getElementById('modal-title');
    els.modalBody = document.getElementById('modal-body');
    els.modalCloseBtn = document.getElementById('modal-close-btn');

    // Fill welcome copy from config
    els.welcomeTitle.textContent = cfg.welcome.title;
    els.welcomeBadge.textContent = `致 ${cfg.celebrantName} 的生日特别委托`;
    els.welcomeSubtitle.textContent = cfg.welcome.subtitle;
    els.enterRoomBtn.textContent = `🚪 ${cfg.welcome.buttonText}`;

    loadProgress();
    updateHud();

    // Events
    els.enterRoomBtn.addEventListener('click', () => {
      els.welcomeOverlay.classList.add('hidden');
      audio.startBgm();
      updateHud();
      if (callbacks.onEnterRoom) callbacks.onEnterRoom();
    });

    els.hudDateCard.addEventListener('click', () => openCalendarModal());
    if (els.roomBanner) {
      els.roomBanner.addEventListener('click', () => openFloorMapModal());
    }
    if (els.birthdayMenuBtn) {
      els.birthdayMenuBtn.addEventListener('click', () => openBirthdayMenuModal());
    }
    if (els.timeModeBtn) {
      els.timeModeBtn.addEventListener('click', () => toggleNightMode());
    }
    els.questBtn.addEventListener('click', () => openQuestModal());
    els.musicBtn.addEventListener('click', () => {
      audio.togglePlay();
      updateHud();
    });
    els.helpBtn.addEventListener('click', () => {
      els.controlsToast.classList.toggle('hidden');
    });

    els.modalCloseBtn.addEventListener('click', () => closeModal());
    els.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === els.modalBackdrop) closeModal();
    });

    els.dialogueBox.addEventListener('click', () => advanceOrCloseDialogue());
    els.dialogueBackdrop.addEventListener('click', (e) => {
      if (e.target === els.dialogueBackdrop) advanceOrCloseDialogue();
    });
    if (els.poseBtn && els.poseMenu) {
      els.poseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.blip();
        els.poseMenu.classList.toggle('hidden');
      });
      els.poseMenu.querySelectorAll('.pose-item').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          els.poseMenu.classList.add('hidden');
          const emote = btn.dataset.emote;
          if (emote) callbacks.onTriggerEmote?.(emote);
        });
      });
      document.addEventListener('pointerdown', (e) => {
        if (!els.poseMenu.contains(e.target) && e.target !== els.poseBtn) {
          els.poseMenu.classList.add('hidden');
        }
      });
    }
    if (els.activityExtraBtn) {
      els.activityExtraBtn.addEventListener('click', () => {
        activeExtraAction?.onClick?.();
      });
    }
    if (els.activityExitBtn) {
      els.activityExitBtn.addEventListener('click', () => {
        callbacks.onExitActivity?.();
      });
    }

    const Wardrobe = window.SB.Wardrobe;
    if (Wardrobe && Wardrobe.subscribe) {
      const syncPortraits = (_, portraitSrc) => {
        const src = portraitSrc || 'assets/protagonist-portrait.png';
        document.querySelectorAll('.welcome-portrait').forEach((img) => {
          img.src = src;
        });
        if (state.activeDialogueOpen && showingProtagonistAvatar && els.dialogueAvatar) {
          els.dialogueAvatar.src = src;
        }
      };
      Wardrobe.subscribe(syncPortraits);
      syncPortraits(Wardrobe.getLook(), Wardrobe.getPortraitSrc());
    }
  }

  return {
    state,
    init,
    updateHud,
    setCurrentRoom,
    isBlockingInput,
    setNearbyPrompt,
    setActivityState,
    triggerInteractable,
    advanceOrCloseDialogue,
    closeDialogue,
    closeModal,
    openQuestModal,
    openFloorMapModal,
    openPianoModal,
    openComputerModal,
    openWardrobeModal,
    showDialogue,
    showDialogueChoices,
  };
})();
