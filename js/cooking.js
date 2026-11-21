window.SB = window.SB || {};

/**
 * 美乐蒂粉嫩小厨房 · 炒菜做饭与私房菜谱系统
 * 支持 12 种冰箱食材、8 道经典私房菜谱 + 自由创意小炒 + 互动控火颠勺评分 + localStorage 持久化
 */
window.SB.Cooking = (function () {
  const STORAGE_KEY = 'stardew_cooking_v1';

  const INGREDIENTS = [
    { id: 'tomato', name: '番茄', icon: '🍅', color: '#ff5d6c', tag: '蔬果' },
    { id: 'egg', name: '鸡蛋', icon: '🥚', color: '#ffd966', tag: '蛋奶' },
    { id: 'beef', name: '嫩肥牛', icon: '🥩', color: '#d96b5c', tag: '肉类' },
    { id: 'shrimp', name: '鲜虾仁', icon: '🦐', color: '#ff8a65', tag: '海鲜' },
    { id: 'veggie', name: '青菜', icon: '🥦', color: '#78c978', tag: '蔬果' },
    { id: 'mushroom', name: '鲜蘑菇', icon: '🍄', color: '#d8b494', tag: '蔬果' },
    { id: 'cream', name: '芝士奶油', icon: '🧀', color: '#ffe599', tag: '蛋奶' },
    { id: 'rice', name: '香米饭', icon: '🍚', color: '#fff8ec', tag: '主食' },
    { id: 'strawberry', name: '大草莓', icon: '🍓', color: '#ff4d79', tag: '蔬果' },
    { id: 'potato', name: '土豆', icon: '🥔', color: '#e3b878', tag: '蔬果' },
    { id: 'garlic', name: '葱姜蒜', icon: '🧄', color: '#f2e8d5', tag: '调味' },
    { id: 'chili', name: '秘制辣酱', icon: '🌶️', color: '#e63946', tag: '调味' },
  ];

  const RECIPES = [
    {
      id: 'tomato_egg',
      name: '黄金番茄炒蛋',
      icon: '🍅',
      badge: '🍳',
      ingredients: ['tomato', 'egg'],
      color: '#ff6b5c',
      accent: '#ffe066',
      desc: '酸甜多汁的红番茄裹着嫩滑金黄鸡蛋，国民第一下饭神器！',
      tasteLine: '哇！番茄酸甜出沙、鸡蛋嫩得像云朵一样，配两碗大米饭都没问题！',
    },
    {
      id: 'shrimp_egg',
      name: '滑蛋鲜虾仁',
      icon: '🦐',
      badge: '🥚',
      ingredients: ['shrimp', 'egg'],
      color: '#ff9a76',
      accent: '#fff0a8',
      desc: 'Q弹粉嫩的大虾仁遇上软嫩滑蛋，鲜掉眉毛的温柔家常菜～',
      tasteLine: '虾仁脆弹弹的，蛋液滑溜溜的，满口都是温柔鲜甜！',
    },
    {
      id: 'braised_beef_potato',
      name: '软糯土豆炖肥牛',
      icon: '🥘',
      badge: '🥔',
      ingredients: ['beef', 'potato', 'chili'],
      color: '#c96b4b',
      accent: '#f0c878',
      desc: '酱汁浓稠、土豆抿嘴就化，肥牛吸饱汤汁超治愈！',
      tasteLine: '土豆绵绵密密的，肥牛酱香浓郁，小Q包直接光盘行动！',
    },
    {
      id: 'cream_mushroom_soup',
      name: '法式奶油蘑菇浓汤',
      icon: '🥣',
      badge: '🍄',
      ingredients: ['mushroom', 'cream'],
      color: '#f5e4c8',
      accent: '#d8b494',
      desc: '在美乐蒂珐琅锅里咕嘟咕嘟熬出的奶香浓汤，暖胃又暖心！',
      tasteLine: '奶香和菌菇香气瞬间在嘴里化开，喝完浑身暖洋洋的～',
    },
    {
      id: 'golden_shrimp_rice',
      name: '粒粒黄金鲜虾炒饭',
      icon: '🍛',
      badge: '🦐',
      ingredients: ['rice', 'egg', 'shrimp'],
      color: '#ffd166',
      accent: '#ff8a65',
      desc: '大火快炒颠出满满锅气，每一粒米饭都裹着金黄蛋衣！',
      tasteLine: '颗粒分明、香气扑鼻！团团在客厅门口都馋得摇尾巴啦！',
    },
    {
      id: 'garlic_veggie',
      name: '蒜蓉清炒时蔬',
      icon: '🥗',
      badge: '🥦',
      ingredients: ['veggie', 'garlic'],
      color: '#7ed97e',
      accent: '#f7efd8',
      desc: '碧绿脆嫩的青菜爆炒蒜香，清爽解腻超健康！',
      tasteLine: '咔嚓咔嚓超清脆！蒜香味恰到好处，完美平衡大餐！',
    },
    {
      id: 'spicy_beef',
      name: '爆香小炒肥牛',
      icon: '🍲',
      badge: '🌶️',
      ingredients: ['beef', 'garlic', 'chili'],
      color: '#d64545',
      accent: '#ffad66',
      desc: '热油爆香葱姜蒜与秘制辣酱，鲜嫩肥牛下锅十秒锁汁！',
      tasteLine: '香辣过瘾、锅气十足！这火候拿捏得简直像大厨附体！',
    },
    {
      id: 'strawberry_pancake',
      name: '草莓奶油舒芙蕾松饼',
      icon: '🥞',
      badge: '🍓',
      ingredients: ['strawberry', 'cream', 'egg'],
      color: '#ff9ebb',
      accent: '#fff5e4',
      desc: '生日限定甜蜜料理！蓬松软嫩的松饼淋上奶油与新鲜大草莓～',
      tasteLine: 'duang duang 抖动的草莓奶油松饼！甜到心坎里啦，生日快乐！',
    },
  ];

  const state = {
    unlocked: {},       // recipeId -> { count, bestStars }
    lastDish: null,     // { id, name, icon, stars, color, accent, tasteLine, cookedAt }
    freshPrepBuff: false,
    riceReady: false,
    totalCooked: 0,
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        if (data.unlocked && typeof data.unlocked === 'object') state.unlocked = data.unlocked;
        if (data.lastDish && typeof data.lastDish === 'object') state.lastDish = data.lastDish;
        state.freshPrepBuff = Boolean(data.freshPrepBuff);
        state.riceReady = Boolean(data.riceReady);
        state.totalCooked = Number(data.totalCooked) || 0;
      }
    } catch (_) {
      // Ignore storage errors
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // Ignore storage errors
    }
  }

  function reset() {
    state.unlocked = {};
    state.lastDish = null;
    state.freshPrepBuff = false;
    state.riceReady = false;
    state.totalCooked = 0;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Ignore
    }
  }

  function getIngredient(id) {
    return INGREDIENTS.find((i) => i.id === id) || null;
  }

  function matchRecipe(ingredientIds) {
    const picked = new Set(ingredientIds || []);
    // Exact or superset match, prioritizing recipes with more matching ingredients
    let best = null;
    let bestLen = 0;
    for (const r of RECIPES) {
      const allPresent = r.ingredients.every((req) => picked.has(req));
      if (allPresent && r.ingredients.length >= bestLen) {
        // Prefer exact match if same length
        if (r.ingredients.length > bestLen || picked.size === r.ingredients.length) {
          best = r;
          bestLen = r.ingredients.length;
        }
      }
    }
    return best;
  }

  function evaluateCook({ ingredientIds, score, burned }) {
    const matched = matchRecipe(ingredientIds);
    const firstIng = getIngredient((ingredientIds && ingredientIds[0]) || 'tomato');
    const secondIng = getIngredient((ingredientIds && ingredientIds[1]) || 'egg');

    let finalScore = Math.max(0, Math.min(100, Math.round(score)));
    const usedFreshBuff = state.freshPrepBuff;
    if (usedFreshBuff) {
      finalScore = Math.min(100, finalScore + 12);
      state.freshPrepBuff = false;
    }

    if (burned) {
      const dish = {
        id: 'charred_mystery',
        name: '焦香炭烤神秘料理',
        icon: '💨',
        badge: '🔥',
        stars: 1,
        score: Math.min(finalScore, 48),
        color: '#6b534e',
        accent: '#d98a5f',
        isRecipe: false,
        usedFreshBuff,
        tasteLine: '哎呀火开太大有点焦香过头啦哈哈～没关系，吸油烟机开满，咱们再来一锅！',
        cookedAt: Date.now(),
      };
      recordCook(dish);
      return dish;
    }

    const stars = finalScore >= 82 ? 3 : finalScore >= 58 ? 2 : 1;

    if (matched) {
      const dish = {
        id: matched.id,
        name: matched.name,
        icon: matched.icon,
        badge: matched.badge,
        stars,
        score: finalScore,
        color: matched.color,
        accent: matched.accent,
        isRecipe: true,
        usedFreshBuff,
        tasteLine:
          stars === 3
            ? `🌟 完美三星！${matched.tasteLine}`
            : stars === 2
              ? `✨ 很香很好吃！${matched.tasteLine}`
              : `😋 虽然火候差一点点，但自己亲手炒的【${matched.name}】也超有成就感！`,
        cookedAt: Date.now(),
      };
      recordCook(dish);
      return dish;
    }

    const customName =
      firstIng && secondIng
        ? `小Q包特调 · ${firstIng.name}炒${secondIng.name}`
        : '小Q包私房创意小炒';

    const dish = {
      id: `custom_${(ingredientIds || []).slice().sort().join('_')}`,
      name: customName,
      icon: firstIng ? firstIng.icon : '🍳',
      badge: secondIng ? secondIng.icon : '✨',
      stars,
      score: finalScore,
      color: firstIng ? firstIng.color : '#ff9ebb',
      accent: secondIng ? secondIng.color : '#ffe066',
      isRecipe: false,
      usedFreshBuff,
      tasteLine:
        stars === 3
          ? `🌟 意想不到的神仙搭配！【${customName}】香气四溢，解锁独家创意美味！`
          : `😋 尝了一口【${customName}】，居然挺下饭的呢，下次试试按菜谱搭配解锁图鉴吧～`,
      cookedAt: Date.now(),
    };
    recordCook(dish);
    return dish;
  }

  function recordCook(dish) {
    state.totalCooked += 1;
    state.lastDish = dish;
    if (dish.isRecipe) {
      const prev = state.unlocked[dish.id] || { count: 0, bestStars: 0 };
      state.unlocked[dish.id] = {
        count: prev.count + 1,
        bestStars: Math.max(prev.bestStars, dish.stars),
      };
    }
    save();
  }

  function setFreshPrep(flag) {
    state.freshPrepBuff = Boolean(flag);
    save();
  }

  function setRiceReady(flag) {
    state.riceReady = Boolean(flag);
    save();
  }

  function getUnlockedCount() {
    return Object.keys(state.unlocked).length;
  }

  load();

  return {
    INGREDIENTS,
    RECIPES,
    getState: () => state,
    getIngredient,
    matchRecipe,
    evaluateCook,
    setFreshPrep,
    setRiceReady,
    getUnlockedCount,
    reset,
  };
})();
