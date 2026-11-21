window.SB = window.SB || {};

/**
 * 六房间完整甜美少女套房地图（紧凑温馨实景比例）
 * 空间分布（3×2）：
 *   [甜心化妆衣帽间] — [法式奶油少女卧室] — [草莓泡泡浴室]
 *                            |
 *   [奶油书房回忆间] — [法式奶油甜心客厅] — [美乐蒂粉嫩小厨房]
 */
window.SB.Map = (function () {
  const TILE = 32;
  const COLS = 24;
  const ROWS = 16;
  const WIDTH = COLS * TILE;   // 768 default
  const HEIGHT = ROWS * TILE;  // 512 default

  const ROOM_ORDER = ['living', 'bedroom', 'dressing', 'bathroom', 'study', 'kitchen'];

  function makeBaseGrid(cols = COLS, rows = ROWS) {
    const g = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let c = 0; c < cols; c++) {
      g[0][c] = 1;
      g[1][c] = 1;
      g[2][c] = 1;
      g[rows - 1][c] = 1;
    }
    for (let r = 0; r < rows; r++) {
      g[r][0] = 1;
      g[r][cols - 1] = 1;
    }
    return g;
  }

  function blockRect(grid, colStart, rowStart, colSpan, rowSpan) {
    const rows = grid.length;
    const cols = grid[0] ? grid[0].length : COLS;
    for (let r = rowStart; r < rowStart + rowSpan; r++) {
      for (let c = colStart; c < colStart + colSpan; c++) {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          grid[r][c] = 1;
        }
      }
    }
  }

  const ROOMS = {
    living: {
      id: 'living',
      name: '法式奶油甜心客厅',
      shortName: '客厅',
      icon: '🎂',
      cols: 16,
      rows: 16,
      width: 16 * TILE,   // 512（紧凑温馨法式奶油客厅：电视墙到沙发比例更真实！）
      height: 16 * TILE,  // 512
      grid: makeBaseGrid(16, 16),
      spawn: { x: 256, y: 420 },
      doors: [
        {
          id: 'to-bedroom',
          direction: 'north',
          label: '前往 法式奶油少女卧室',
          shortName: '卧室',
          targetRoom: 'bedroom',
          targetSpawn: { x: 64, y: 378 },
          hitBox: { x: 44, y: 30, w: 64, h: 68 },
          triggerRect: { x: 48, y: 94, w: 56, h: 16 },
          standSpot: { col: 2, row: 3 },
          badgePos: { x: 76, y: 24 },
        },
        {
          id: 'to-study',
          direction: 'west',
          label: '前往 奶油书房与回忆间',
          shortName: '书房',
          targetRoom: 'study',
          targetSpawn: { x: 494, y: 224 },
          hitBox: { x: 0, y: 384, w: 38, h: 64 },
          triggerRect: { x: 28, y: 388, w: 20, h: 56 },
          standSpot: { col: 1, row: 12 },
          badgePos: { x: 20, y: 372 },
        },
        {
          id: 'to-kitchen',
          direction: 'east',
          label: '前往 美乐蒂粉嫩小厨房',
          shortName: '厨房',
          targetRoom: 'kitchen',
          targetSpawn: { x: 74, y: 256 },
          hitBox: { x: 474, y: 384, w: 38, h: 64 },
          triggerRect: { x: 464, y: 388, w: 20, h: 56 },
          standSpot: { col: 14, row: 12 },
          badgePos: { x: 490, y: 372 },
        },
      ],
      interactables: [
        {
          id: 'cake',
          questId: 'cake',
          label: '许愿吹蜡烛',
          shortLabel: '蛋糕',
          hitBox: { x: 100, y: 302, w: 152, h: 86 },
          standSpot: { col: 5, row: 12 },
          anchor: { x: 176, y: 348 },
          badgePos: { x: 176, y: 292 },
          interactRadius: 72,
        },
        {
          id: 'jukebox',
          questId: 'jukebox',
          label: '操作奶油点唱机',
          shortLabel: '点唱机',
          hitBox: { x: 418, y: 80, w: 58, h: 82 },
          standSpot: { col: 12, row: 4 },
          anchor: { x: 446, y: 124 },
          badgePos: { x: 446, y: 72 },
          interactRadius: 68,
        },
        {
          id: 'tv',
          questId: null,
          label: '看左侧悬浮奶油电视墙',
          shortLabel: '电视',
          hitBox: { x: 32, y: 160, w: 62, h: 128 },
          standSpot: { col: 3, row: 7 },
          anchor: { x: 64, y: 224 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'sofa',
          questId: null,
          label: '窝进奶油云朵沙发看电视抱熊猫',
          shortLabel: '云朵沙发',
          hitBox: { x: 386, y: 160, w: 92, h: 128 },
          standSpot: { col: 11, row: 7 },
          anchor: { x: 428, y: 224 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'pink_sofa',
          questId: null,
          label: '躺进阳光粉色毛毛虫椅',
          shortLabel: '粉沙发',
          hitBox: { x: 184, y: 94, w: 78, h: 66 },
          standSpot: { col: 6, row: 5 },
          anchor: { x: 224, y: 132 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'sideboard',
          questId: null,
          label: '在奶油餐边柜冲咖啡吃甜点',
          shortLabel: '餐边柜',
          hitBox: { x: 388, y: 292, w: 90, h: 90 },
          standSpot: { col: 11, row: 10 },
          anchor: { x: 432, y: 336 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'floor_lamp',
          questId: null,
          label: '开关百褶落地灯与氛围灯带',
          shortLabel: '落地灯',
          hitBox: { x: 288, y: 58, w: 32, h: 72 },
          standSpot: { col: 9, row: 4 },
          anchor: { x: 304, y: 104 },
          badgePos: null,
          interactRadius: 64,
        },
        {
          id: 'fireplace',
          questId: null,
          label: '烤烤法式奶油壁炉暖火',
          shortLabel: '壁炉',
          hitBox: { x: 354, y: 16, w: 60, h: 106 },
          standSpot: { col: 11, row: 4 },
          anchor: { x: 384, y: 92 },
          badgePos: null,
          interactRadius: 66,
        },
        {
          id: 'pet_corner',
          questId: null,
          label: '给团团加餐小肉干',
          shortLabel: '小食盆',
          hitBox: { x: 344, y: 346, w: 40, h: 48 },
          standSpot: { col: 10, row: 12 },
          anchor: { x: 364, y: 368 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'door',
          questId: null,
          label: '望望法式大门外',
          shortLabel: '大门',
          hitBox: { x: 224, y: 468, w: 64, h: 42 },
          standSpot: { col: 7, row: 14 },
          anchor: { x: 256, y: 474 },
          badgePos: null,
          interactRadius: 56,
        },
        {
          id: 'gift_living',
          questId: 'gift_living',
          label: '拆开阳台边的隐藏生日礼物',
          shortLabel: '隐藏礼物',
          hitBox: { x: 320, y: 98, w: 30, h: 30 },
          standSpot: { col: 10, row: 4 },
          anchor: { x: 335, y: 113 },
          badgePos: { x: 335, y: 88 },
          interactRadius: 64,
        },
      ],
    },

    bedroom: {
      id: 'bedroom',
      name: '法式奶油少女卧室',
      shortName: '卧室',
      icon: '🛏️',
      cols: 20,
      rows: 14,
      width: 20 * TILE,   // 640
      height: 14 * TILE,  // 448
      grid: makeBaseGrid(20, 14),
      spawn: { x: 64, y: 378 },
      doors: [
        {
          id: 'to-living-south',
          direction: 'south',
          label: '返回 法式奶油甜心客厅',
          shortName: '客厅',
          targetRoom: 'living',
          targetSpawn: { x: 76, y: 128 },
          hitBox: { x: 34, y: 406, w: 60, h: 40 },
          triggerRect: { x: 40, y: 406, w: 48, h: 14 },
          standSpot: { col: 2, row: 12 },
          badgePos: { x: 64, y: 392 },
        },
        {
          id: 'to-dressing-west',
          direction: 'west',
          label: '前往 甜心化妆衣帽间',
          shortName: '衣帽间',
          targetRoom: 'dressing',
          targetSpawn: { x: 438, y: 224 },
          hitBox: { x: 0, y: 288, w: 38, h: 64 },
          triggerRect: { x: 28, y: 292, w: 20, h: 56 },
          standSpot: { col: 1, row: 9 },
          badgePos: { x: 22, y: 274 },
        },
        {
          id: 'to-bathroom-east',
          direction: 'east',
          label: '前往 草莓泡泡浴室与卫生间',
          shortName: '浴室',
          targetRoom: 'bathroom',
          targetSpawn: { x: 74, y: 224 },
          hitBox: { x: 602, y: 288, w: 38, h: 64 },
          triggerRect: { x: 592, y: 292, w: 20, h: 56 },
          standSpot: { col: 18, row: 9 },
          badgePos: { x: 618, y: 274 },
        },
      ],
      interactables: [
        {
          id: 'pc',
          questId: null,
          label: '坐在转椅上看电脑',
          shortLabel: '电脑桌',
          hitBox: { x: 34, y: 98, w: 94, h: 124 },
          standSpot: { col: 4, row: 5 },
          anchor: { x: 96, y: 170 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'piano',
          questId: null,
          label: '坐下弹奶油立式钢琴',
          shortLabel: '立式钢琴',
          hitBox: { x: 192, y: 68, w: 96, h: 86 },
          standSpot: { col: 7, row: 5 },
          anchor: { x: 240, y: 118 },
          badgePos: null,
          interactRadius: 70,
        },
        {
          id: 'nightstand',
          questId: null,
          label: '开关床头小圆球夜灯',
          shortLabel: '床头灯',
          hitBox: { x: 318, y: 94, w: 36, h: 42 },
          standSpot: { col: 9, row: 4 },
          anchor: { x: 336, y: 118 },
          badgePos: null,
          interactRadius: 62,
        },
        {
          id: 'bed',
          questId: null,
          label: '盖被子躺床休息',
          shortLabel: '法式软床',
          hitBox: { x: 352, y: 74, w: 162, h: 152 },
          standSpot: { col: 10, row: 5 },
          anchor: { x: 432, y: 166 },
          badgePos: null,
          interactRadius: 72,
        },
        {
          id: 'baywindow',
          questId: null,
          label: '抱抱飘窗小白熊',
          shortLabel: '飘窗',
          hitBox: { x: 550, y: 72, w: 60, h: 118 },
          standSpot: { col: 16, row: 5 },
          anchor: { x: 580, y: 146 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'junimo',
          questId: null,
          label: '摸摸祝尼魔',
          shortLabel: '祝尼魔',
          hitBox: { x: 554, y: 194, w: 52, h: 60 },
          standSpot: { col: 16, row: 7 },
          anchor: { x: 582, y: 224 },
          badgePos: null,
          interactRadius: 66,
        },
        {
          id: 'armchair',
          questId: null,
          label: '窝进奶油云朵沙发椅',
          shortLabel: '云朵椅',
          hitBox: { x: 128, y: 366, w: 88, h: 52 },
          standSpot: { col: 4, row: 11 },
          anchor: { x: 160, y: 392 },
          badgePos: null,
          interactRadius: 66,
        },
        {
          id: 'wardrobe_bed',
          questId: null,
          label: '打开三门白色大衣柜',
          shortLabel: '卧房衣柜',
          hitBox: { x: 320, y: 378, w: 288, h: 46 },
          standSpot: { col: 14, row: 11 },
          anchor: { x: 464, y: 396 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'gift_bedroom',
          questId: 'gift_bedroom',
          label: '拆开云朵椅旁的隐藏生日礼物',
          shortLabel: '隐藏礼物',
          hitBox: { x: 256, y: 382, w: 32, h: 32 },
          standSpot: { col: 8, row: 11 },
          anchor: { x: 272, y: 398 },
          badgePos: { x: 272, y: 372 },
          interactRadius: 64,
        },
      ],
    },

    dressing: {
      id: 'dressing',
      name: '甜心化妆衣帽间',
      shortName: '化妆衣帽间',
      icon: '💄',
      cols: 16,
      rows: 12,
      width: 16 * TILE,   // 512
      height: 12 * TILE,  // 384
      grid: makeBaseGrid(16, 12),
      spawn: { x: 438, y: 224 },
      doors: [
        {
          id: 'to-bedroom-east',
          direction: 'east',
          label: '返回 法式奶油少女卧室',
          shortName: '卧室',
          targetRoom: 'bedroom',
          targetSpawn: { x: 74, y: 320 },
          hitBox: { x: 474, y: 192, w: 38, h: 64 },
          triggerRect: { x: 464, y: 196, w: 20, h: 56 },
          standSpot: { col: 14, row: 6 },
          badgePos: { x: 490, y: 178 },
        },
      ],
      interactables: [
        {
          id: 'vanity',
          questId: null,
          label: '用中心好莱坞梳妆台化妆/换发型',
          shortLabel: '梳妆台',
          hitBox: { x: 192, y: 66, w: 128, h: 66 },
          standSpot: { col: 7, row: 4 },
          anchor: { x: 256, y: 112 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'wardrobe_left',
          questId: null,
          label: '打开左侧衣服衣柜（自由换装）',
          shortLabel: '左衣柜',
          hitBox: { x: 34, y: 66, w: 126, h: 186 },
          standSpot: { col: 3, row: 5 },
          anchor: { x: 96, y: 152 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'wardrobe_right',
          questId: null,
          label: '打开右侧发型与礼服衣柜',
          shortLabel: '右衣柜',
          hitBox: { x: 352, y: 66, w: 126, h: 92 },
          standSpot: { col: 11, row: 5 },
          anchor: { x: 414, y: 118 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'mirror',
          questId: null,
          label: '在公主落地全身镜前试衣转圈',
          shortLabel: '全身镜',
          hitBox: { x: 36, y: 274, w: 68, h: 74 },
          standSpot: { col: 3, row: 9 },
          anchor: { x: 68, y: 312 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'accessories',
          questId: null,
          label: '搭配发卡发饰与包包鞋子',
          shortLabel: '饰品柜',
          hitBox: { x: 352, y: 288, w: 96, h: 60 },
          standSpot: { col: 10, row: 9 },
          anchor: { x: 400, y: 318 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'gift_dressing',
          questId: 'gift_dressing',
          label: '拆开全身镜旁的隐藏生日礼物',
          shortLabel: '隐藏礼物',
          hitBox: { x: 128, y: 318, w: 32, h: 32 },
          standSpot: { col: 4, row: 9 },
          anchor: { x: 144, y: 334 },
          badgePos: { x: 144, y: 308 },
          interactRadius: 64,
        },
      ],
    },

    bathroom: {
      id: 'bathroom',
      name: '草莓泡泡浴室',
      shortName: '浴室',
      icon: '🛁',
      cols: 16,
      rows: 12,
      width: 16 * TILE,   // 512（紧凑温馨干湿分离小浴室）
      height: 12 * TILE,  // 384
      grid: makeBaseGrid(16, 12),
      spawn: { x: 74, y: 224 },
      doors: [
        {
          id: 'to-bedroom-west',
          direction: 'west',
          label: '返回 梦幻少女卧室',
          shortName: '卧室',
          targetRoom: 'bedroom',
          targetSpawn: { x: 564, y: 320 },
          hitBox: { x: 0, y: 192, w: 38, h: 64 },
          triggerRect: { x: 28, y: 194, w: 20, h: 60 },
          standSpot: { col: 1, row: 6 },
          badgePos: { x: 22, y: 178 },
        },
      ],
      interactables: [
        {
          id: 'toilet',
          questId: null,
          label: '使用粉嫩智能马桶',
          shortLabel: '马桶',
          hitBox: { x: 40, y: 92, w: 84, h: 68 },
          standSpot: { col: 2, row: 5 },
          anchor: { x: 80, y: 132 },
          badgePos: null,
          interactRadius: 64,
        },
        {
          id: 'sink',
          questId: null,
          label: '在发光镜柜前洗漱',
          shortLabel: '洗手台',
          hitBox: { x: 132, y: 88, w: 122, h: 66 },
          standSpot: { col: 6, row: 5 },
          anchor: { x: 192, y: 130 },
          badgePos: null,
          interactRadius: 66,
        },
        {
          id: 'shower',
          questId: null,
          label: '打开花洒淋浴冲澡',
          shortLabel: '淋浴间',
          hitBox: { x: 318, y: 84, w: 152, h: 124 },
          standSpot: { col: 11, row: 5 },
          anchor: { x: 392, y: 146 },
          badgePos: null,
          interactRadius: 72,
        },
        {
          id: 'bathtub',
          questId: null,
          label: '泡个草莓泡泡浴',
          shortLabel: '泡泡浴缸',
          hitBox: { x: 314, y: 254, w: 158, h: 96 },
          standSpot: { col: 11, row: 7 },
          anchor: { x: 386, y: 296 },
          badgePos: null,
          interactRadius: 72,
        },
        {
          id: 'gift_bathroom',
          questId: 'gift_bathroom',
          label: '拆开脏衣篮旁的隐藏生日礼物',
          shortLabel: '隐藏礼物',
          hitBox: { x: 96, y: 318, w: 32, h: 32 },
          standSpot: { col: 3, row: 9 },
          anchor: { x: 112, y: 334 },
          badgePos: { x: 112, y: 308 },
          interactRadius: 64,
        },
      ],
    },

    study: {
      id: 'study',
      name: '奶油书房与回忆间',
      shortName: '书房',
      icon: '💌',
      cols: 18,
      rows: 13,
      width: 18 * TILE,   // 576（温馨紧凑法式奶油少女书房与手账回忆间）
      height: 13 * TILE,  // 416
      grid: makeBaseGrid(18, 13),
      spawn: { x: 494, y: 224 },
      doors: [
        {
          id: 'to-living-east',
          direction: 'east',
          label: '返回 法式奶油甜心客厅',
          shortName: '客厅',
          targetRoom: 'living',
          targetSpawn: { x: 74, y: 416 },
          hitBox: { x: 538, y: 192, w: 38, h: 64 },
          triggerRect: { x: 528, y: 196, w: 20, h: 56 },
          standSpot: { col: 16, row: 6 },
          badgePos: { x: 554, y: 178 },
        },
      ],
      interactables: [
        {
          id: 'bookshelf',
          questId: null,
          label: '翻翻法式拱门书架与手办',
          shortLabel: '拱门书架',
          hitBox: { x: 34, y: 74, w: 124, h: 86 },
          standSpot: { col: 3, row: 5 },
          anchor: { x: 96, y: 124 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'memories',
          questId: 'memories',
          label: '翻看灯串拍立得照片墙',
          shortLabel: '照片墙',
          hitBox: { x: 164, y: 16, w: 120, h: 72 },
          standSpot: { col: 6, row: 3 },
          anchor: { x: 224, y: 82 },
          badgePos: { x: 224, y: 12 },
          interactRadius: 68,
        },
        {
          id: 'calendar',
          questId: null,
          label: '查看粉嫩季节生日日历',
          shortLabel: '日历',
          hitBox: { x: 292, y: 18, w: 56, h: 66 },
          standSpot: { col: 9, row: 3 },
          anchor: { x: 320, y: 82 },
          badgePos: null,
          interactRadius: 64,
        },
        {
          id: 'letter',
          questId: 'letter',
          label: '在窗前书桌阅读生日来信',
          shortLabel: '生日来信',
          hitBox: { x: 356, y: 84, w: 182, h: 76 },
          standSpot: { col: 13, row: 5 },
          anchor: { x: 444, y: 126 },
          badgePos: { x: 444, y: 76 },
          interactRadius: 72,
        },
        {
          id: 'craft_desk',
          questId: null,
          label: '在画架与手账推车写手账画画',
          shortLabel: '手账画架',
          hitBox: { x: 34, y: 192, w: 64, h: 94 },
          standSpot: { col: 3, row: 7 },
          anchor: { x: 66, y: 240 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'readingnook',
          questId: null,
          label: '窝进软垫阅读沙发看书喝茶',
          shortLabel: '阅读角',
          hitBox: { x: 36, y: 294, w: 156, h: 88 },
          standSpot: { col: 6, row: 10 },
          anchor: { x: 116, y: 342 },
          badgePos: null,
          interactRadius: 72,
        },
        {
          id: 'record_shelf',
          questId: null,
          label: '播放轻柔奶油黑胶唱片',
          shortLabel: '黑胶唱片机',
          hitBox: { x: 224, y: 344, w: 128, h: 42 },
          standSpot: { col: 8, row: 10 },
          anchor: { x: 288, y: 364 },
          badgePos: null,
          interactRadius: 66,
        },
        {
          id: 'gifts',
          questId: 'gifts',
          label: '拆开丝带生日礼物宝箱',
          shortLabel: '礼物宝箱',
          hitBox: { x: 386, y: 296, w: 156, h: 88 },
          standSpot: { col: 11, row: 10 },
          anchor: { x: 458, y: 344 },
          badgePos: { x: 454, y: 288 },
          interactRadius: 72,
        },
      ],
    },

    kitchen: {
      id: 'kitchen',
      name: '美乐蒂粉嫩小厨房',
      shortName: '厨房',
      icon: '🍳',
      cols: 14,
      rows: 12,
      width: 14 * TILE,   // 448（超紧凑真实小户型L型厨房）
      height: 12 * TILE,  // 384
      grid: makeBaseGrid(14, 12),
      spawn: { x: 74, y: 256 },
      doors: [
        {
          id: 'to-living-west',
          direction: 'west',
          label: '返回 法式奶油甜心客厅',
          shortName: '客厅',
          targetRoom: 'living',
          targetSpawn: { x: 444, y: 416 },
          hitBox: { x: 0, y: 224, w: 38, h: 64 },
          triggerRect: { x: 28, y: 228, w: 18, h: 56 },
          standSpot: { col: 1, row: 7 },
          badgePos: { x: 20, y: 212 },
        },
      ],
      interactables: [
        {
          id: 'kitchensink',
          questId: null,
          label: '在窗边不锈钢水槽洗菜备菜',
          shortLabel: '洗菜池',
          hitBox: { x: 32, y: 86, w: 124, h: 100 },
          standSpot: { col: 3, row: 5 },
          anchor: { x: 96, y: 136 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'stove',
          questId: null,
          label: '在美乐蒂灶台开火炒菜做饭',
          shortLabel: '炒菜灶台',
          hitBox: { x: 160, y: 78, w: 160, h: 82 },
          standSpot: { col: 7, row: 5 },
          anchor: { x: 240, y: 124 },
          badgePos: null,
          interactRadius: 70,
        },
        {
          id: 'fridge',
          questId: null,
          label: '打开贴满贴纸的双门冰箱拿食材',
          shortLabel: '大冰箱',
          hitBox: { x: 320, y: 68, w: 96, h: 122 },
          standSpot: { col: 10, row: 6 },
          anchor: { x: 368, y: 132 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'pantry',
          questId: null,
          label: '用电饭煲焖饭 & 翻看私房菜谱',
          shortLabel: '电器架',
          hitBox: { x: 350, y: 192, w: 66, h: 126 },
          standSpot: { col: 10, row: 7 },
          anchor: { x: 384, y: 252 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'serving_table',
          questId: null,
          label: '品尝出餐台刚出锅的美味佳肴',
          shortLabel: '出餐台',
          hitBox: { x: 160, y: 312, w: 188, h: 42 },
          standSpot: { col: 7, row: 9 },
          anchor: { x: 240, y: 332 },
          badgePos: null,
          interactRadius: 68,
        },
        {
          id: 'veggie_cart',
          questId: null,
          label: '看看粉色滚轮小推车里的新鲜果蔬',
          shortLabel: '果蔬推车',
          hitBox: { x: 34, y: 312, w: 94, h: 42 },
          standSpot: { col: 3, row: 9 },
          anchor: { x: 76, y: 332 },
          badgePos: null,
          interactRadius: 64,
        },
        {
          id: 'gift_kitchen',
          questId: 'gift_kitchen',
          label: '拆开小推车旁的隐藏生日礼物',
          shortLabel: '隐藏礼物',
          hitBox: { x: 128, y: 318, w: 32, h: 32 },
          standSpot: { col: 4, row: 9 },
          anchor: { x: 144, y: 334 },
          badgePos: { x: 144, y: 308 },
          interactRadius: 64,
        },
      ],
    },
  };

  // Living Room Footprints (16x16 紧凑温馨法式奶油客厅：电视墙 <-> 大茶几 <-> 云朵沙发比例更贴近实景！)
  blockRect(ROOMS.living.grid, 4, 3, 1, 1);   // Matte-White Ceramic Olive Tree
  blockRect(ROOMS.living.grid, 6, 3, 2, 2);   // Dusty-Pink Togo Bunny Lounge Chair & Puppy Figurine
  blockRect(ROOMS.living.grid, 8, 3, 1, 1);   // White Sculptural Tulip Side Table
  blockRect(ROOMS.living.grid, 9, 3, 1, 1);   // Tall Cream Pleated Floor Lamp
  blockRect(ROOMS.living.grid, 10, 3, 1, 1);  // Hidden Birthday Gift in Living Room
  blockRect(ROOMS.living.grid, 11, 3, 2, 1);  // French Carved Cream Fireplace
  blockRect(ROOMS.living.grid, 13, 3, 2, 2);  // French Cream & Rose-Gold Jukebox
  blockRect(ROOMS.living.grid, 1, 5, 2, 4);   // Left Wall Recessed Cream TV Wall & Floating Apricot Console
  blockRect(ROOMS.living.grid, 5, 6, 4, 2);   // Generous Center Pebble Cloud Coffee Table (128x64!)
  blockRect(ROOMS.living.grid, 12, 5, 3, 4);  // Right Wall Cream Boucle Cloud 3-Seater Sofa (facing LEFT at TV!)
  blockRect(ROOMS.living.grid, 3, 10, 5, 2);  // Foreground Cream Dining & Birthday Cake Table + 4 Boucle Chairs
  blockRect(ROOMS.living.grid, 12, 9, 3, 3);  // Foreground Right Wall Cream Sideboard & Coffee/Macaron Bar
  blockRect(ROOMS.living.grid, 9, 11, 2, 1);  // 团团 Open Pink Suitcase
  blockRect(ROOMS.living.grid, 11, 11, 1, 1); // 团团 Snack Bowls, Treat Jars & Cushion
  blockRect(ROOMS.living.grid, 1, 14, 1, 1);  // Bottom-Left Pastel Party Balloon Basket
  blockRect(ROOMS.living.grid, 14, 14, 1, 1); // Bottom-Right Pastel Party Balloon Basket

  // Bedroom Footprints (20x14 cozy French cream-pink bedroom w/ upright piano)
  blockRect(ROOMS.bedroom.grid, 1, 3, 2, 4);   // Left L-shaped PC Desk, RGB Tower & Lower Cabinet
  blockRect(ROOMS.bedroom.grid, 3, 3, 3, 1);   // Upper Open Shelf (headphones, ivy, fairy lights)
  blockRect(ROOMS.bedroom.grid, 3, 5, 1, 1);   // Ergonomic Swivel PC Chair
  blockRect(ROOMS.bedroom.grid, 6, 3, 3, 1);   // Cream-Pink French Upright Piano
  blockRect(ROOMS.bedroom.grid, 7, 4, 1, 1);   // Velvet Piano Bench
  blockRect(ROOMS.bedroom.grid, 10, 3, 1, 1);  // Fluted Nightstand + Warm Orb Lamp
  blockRect(ROOMS.bedroom.grid, 11, 3, 5, 4);  // French Upholstered Pink Double Bed
  blockRect(ROOMS.bedroom.grid, 17, 3, 2, 3);  // Marble Bay Window w/ Trailing Ivy & White Bear
  blockRect(ROOMS.bedroom.grid, 17, 6, 2, 2);  // Twin Junimos Floral Bay-Window Corner
  blockRect(ROOMS.bedroom.grid, 3, 12, 1, 1);  // Bottom-left Lush Broadleaf Plant
  blockRect(ROOMS.bedroom.grid, 4, 12, 2, 1);  // Puffy Cream Cloud Armchair w/ Flower Pillow
  blockRect(ROOMS.bedroom.grid, 6, 12, 1, 1);  // Round Side Table w/ Candle & Book
  blockRect(ROOMS.bedroom.grid, 10, 12, 9, 1); // 3-Door Built-in White Wardrobe
  blockRect(ROOMS.bedroom.grid, 8, 12, 1, 1);  // Hidden Birthday Gift in Bedroom

  // Dressing Room Footprints (16x12 紧凑精致衣帽间：中间好莱坞梳妆台 + 左右对称衣柜 + 全身镜 + 饰品换鞋凳)
  blockRect(ROOMS.dressing.grid, 1, 3, 4, 2);   // Left Glass Wardrobe (upper section)
  blockRect(ROOMS.dressing.grid, 1, 5, 2, 3);   // Left Glass Wardrobe (side wing)
  blockRect(ROOMS.dressing.grid, 6, 3, 4, 1);   // Center Hollywood Vanity Table (row 4 clear for plush stool seating)
  blockRect(ROOMS.dressing.grid, 11, 3, 4, 2);  // Right Boutique Hairstyle & Handbag Wardrobe
  blockRect(ROOMS.dressing.grid, 1, 9, 2, 2);   // Bottom-Left Gold Arch Mirror & Lavender Pouf
  blockRect(ROOMS.dressing.grid, 11, 9, 3, 2);  // Bottom-Right Velvet Shoe Ottoman & Handbag Stand
  blockRect(ROOMS.dressing.grid, 4, 10, 1, 1);  // Hidden Birthday Gift in Dressing Room

  // Bathroom Footprints (16x12 紧凑粉白干湿分离小浴室：马桶 + 悬浮洗手台 + 长虹隔断淋浴 + 泡澡浴池)
  blockRect(ROOMS.bathroom.grid, 1, 3, 3, 2);   // Smart Toilet + Brush + Bear Step Stool + Pink Trash Bin
  blockRect(ROOMS.bathroom.grid, 4, 3, 4, 2);   // Floating White Vanity Sink + Black Fluted Glass Door
  blockRect(ROOMS.bathroom.grid, 8, 3, 1, 1);   // Wall Towel & Hairdryer Station Corner
  blockRect(ROOMS.bathroom.grid, 9, 3, 1, 4);   // Slim Black-Framed Frosted Glass Dry/Wet Partition
  blockRect(ROOMS.bathroom.grid, 10, 3, 5, 1);  // Rain Shower Wall Bar & Corner Caddy Wall
  blockRect(ROOMS.bathroom.grid, 10, 8, 5, 3);  // Deep Soaking Strawberry Bubble Bathtub
  blockRect(ROOMS.bathroom.grid, 1, 10, 2, 1);  // Bottom-Left Pink Laundry Hamper & Plush Slippers
  blockRect(ROOMS.bathroom.grid, 3, 10, 1, 1);  // Hidden Birthday Gift in Bathroom

  // Study Footprints (18x13 温馨法式奶油少女书房与手账回忆间)
  blockRect(ROOMS.study.grid, 1, 3, 4, 2);     // French Arched Tall Bookshelf & Plushie Display
  blockRect(ROOMS.study.grid, 11, 3, 6, 2);    // Wide Sunlit Writing & Birthday Letter Desk + Pleated Lamp
  blockRect(ROOMS.study.grid, 1, 6, 2, 3);     // Painting Easel & Rolling Pink Stationery Cart
  blockRect(ROOMS.study.grid, 1, 9, 5, 3);     // Plush Dusty-Pink Reading Chaise + Arched Floor Lamp + Tea Table
  blockRect(ROOMS.study.grid, 7, 11, 4, 1);    // Low Cream Vinyl Record Console & Potted Plant
  blockRect(ROOMS.study.grid, 12, 9, 5, 3);    // Birthday Treasure Chest, Ribbon Gift Mountain & Balloons

  // Kitchen Footprints (14x12 超紧凑真实小户型 L 型粉嫩美乐蒂厨房)
  blockRect(ROOMS.kitchen.grid, 1, 3, 4, 2);   // Window Stainless Sink + Dish Drying Rack + Cutting Board
  blockRect(ROOMS.kitchen.grid, 1, 5, 2, 1);   // Left L-Return Counter + Pink Kitty Bowls & Tumbler
  blockRect(ROOMS.kitchen.grid, 5, 3, 5, 2);   // 2-Burner Gas Stove + Cream & Pink Melody Enamel Pots
  blockRect(ROOMS.kitchen.grid, 10, 3, 3, 3);  // Tall Cream-Pink Retro Double-Door Fridge w/ Magnets
  blockRect(ROOMS.kitchen.grid, 11, 6, 2, 4);  // Multi-Tier Appliance & Pantry Rack (Rice Cooker, Microwave, Spices)
  blockRect(ROOMS.kitchen.grid, 5, 10, 6, 1);  // South Serving Pass-Through Counter + Plated Dish + Pink Trash Bin
  blockRect(ROOMS.kitchen.grid, 1, 10, 3, 1);  // Rolling Pink Veggie/Fruit Utility Cart + Mini Step Stool
  blockRect(ROOMS.kitchen.grid, 4, 10, 1, 1);  // Hidden Birthday Gift in Kitchen

  let currentRoomId = 'living';

  function getRoom(id) {
    if (id === 'tea') return ROOMS.kitchen;
    return ROOMS[id] || ROOMS.living;
  }

  function getCurrentRoom() {
    return ROOMS[currentRoomId];
  }

  function setCurrentRoom(id) {
    const resolved = id === 'tea' ? 'kitchen' : id;
    if (ROOMS[resolved]) currentRoomId = resolved;
    return ROOMS[currentRoomId];
  }

  function getRoomPendingQuestCount(roomId, completedSet) {
    const room = ROOMS[roomId];
    if (!room) return 0;
    let count = 0;
    for (const item of room.interactables) {
      if (item.questId && !completedSet.has(item.questId)) {
        count += 1;
      }
    }
    return count;
  }

  function isTileWalkable(col, row, roomId = currentRoomId) {
    const room = getRoom(roomId);
    const cols = room.cols || COLS;
    const rows = room.rows || ROWS;
    if (col < 0 || col >= cols || row < 0 || row >= rows) return false;
    return room.grid[row][col] === 0;
  }

  function isCircleFree(wx, wy, rx = 10, ry = 6, roomId = currentRoomId) {
    const corners = [
      [wx - rx, wy - ry],
      [wx + rx, wy - ry],
      [wx - rx, wy + ry],
      [wx + rx, wy + ry],
    ];
    for (const [cx, cy] of corners) {
      const col = Math.floor(cx / TILE);
      const row = Math.floor(cy / TILE);
      if (!isTileWalkable(col, row, roomId)) return false;
    }
    return true;
  }

  function findDoorAtPoint(wx, wy, roomId = currentRoomId) {
    const room = getRoom(roomId);
    for (const d of room.doors) {
      const b = d.hitBox;
      if (wx >= b.x - 8 && wx <= b.x + b.w + 8 && wy >= b.y - 8 && wy <= b.y + b.h + 8) {
        return d;
      }
    }
    return null;
  }

  function findDoorTrigger(wx, wy, roomId = currentRoomId) {
    const room = getRoom(roomId);
    for (const d of room.doors) {
      const r = d.triggerRect;
      if (wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h) {
        return d;
      }
    }
    return null;
  }

  function findInteractableAtPoint(wx, wy, roomId = currentRoomId) {
    const room = getRoom(roomId);
    for (const item of room.interactables) {
      const b = item.hitBox;
      if (wx >= b.x - 6 && wx <= b.x + b.w + 6 && wy >= b.y - 6 && wy <= b.y + b.h + 6) {
        return item;
      }
    }
    return null;
  }

  function findNearestInteractable(wx, wy, roomId = currentRoomId) {
    const room = getRoom(roomId);
    let best = null;
    let bestDist = Infinity;
    for (const item of room.interactables) {
      const b = item.hitBox;
      const cx = Math.max(b.x, Math.min(wx, b.x + b.w));
      const cy = Math.max(b.y, Math.min(wy, b.y + b.h));
      const dist = Math.hypot(wx - cx, wy - cy);
      if (dist <= item.interactRadius && dist < bestDist) {
        best = item;
        bestDist = dist;
      }
    }
    return best;
  }

  function findNearestWalkableTile(col, row, roomId = currentRoomId) {
    if (isTileWalkable(col, row, roomId)) return { col, row };
    for (let radius = 1; radius <= 6; radius++) {
      let best = null;
      let bestD = Infinity;
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nc = col + dc;
          const nr = row + dr;
          if (isTileWalkable(nc, nr, roomId)) {
            const d = dc * dc + dr * dr;
            if (d < bestD) {
              bestD = d;
              best = { col: nc, row: nr };
            }
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  function findPath(startCol, startRow, goalCol, goalRow, roomId = currentRoomId) {
    const start = findNearestWalkableTile(startCol, startRow, roomId);
    const goal = findNearestWalkableTile(goalCol, goalRow, roomId);
    if (!start || !goal) return [];
    if (start.col === goal.col && start.row === goal.row) return [];

    const key = (c, r) => `${c},${r}`;
    const open = [{ col: start.col, row: start.row, g: 0, f: Math.hypot(goal.col - start.col, goal.row - start.row) }];
    const gScore = new Map([[key(start.col, start.row), 0]]);
    const cameFrom = new Map();
    const closed = new Set();

    const dirs = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414],
    ];

    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      const cur = open.shift();
      const ck = key(cur.col, cur.row);
      if (cur.col === goal.col && cur.row === goal.row) {
        const path = [];
        let trace = ck;
        while (trace && trace !== key(start.col, start.row)) {
          const [tc, tr] = trace.split(',').map(Number);
          path.push({ x: (tc + 0.5) * TILE, y: (tr + 0.5) * TILE, col: tc, row: tr });
          trace = cameFrom.get(trace);
        }
        path.reverse();
        return path;
      }
      closed.add(ck);

      for (const [dc, dr, cost] of dirs) {
        const nc = cur.col + dc;
        const nr = cur.row + dr;
        if (!isTileWalkable(nc, nr, roomId)) continue;
        if (dc !== 0 && dr !== 0) {
          if (!isTileWalkable(cur.col + dc, cur.row, roomId) || !isTileWalkable(cur.col, cur.row + dr, roomId)) {
            continue;
          }
        }
        const nk = key(nc, nr);
        if (closed.has(nk)) continue;
        const tentativeG = cur.g + cost;
        if (tentativeG < (gScore.get(nk) ?? Infinity)) {
          cameFrom.set(nk, ck);
          gScore.set(nk, tentativeG);
          const f = tentativeG + Math.hypot(goal.col - nc, goal.row - nr);
          const existing = open.find((n) => n.col === nc && n.row === nr);
          if (existing) {
            existing.g = tentativeG;
            existing.f = f;
          } else {
            open.push({ col: nc, row: nr, g: tentativeG, f });
          }
        }
      }
    }
    return [];
  }

  return {
    TILE,
    COLS,
    ROWS,
    WIDTH,
    HEIGHT,
    ROOMS,
    ROOM_ORDER,
    getRoom,
    getCurrentRoom,
    setCurrentRoom,
    getRoomPendingQuestCount,
    isTileWalkable,
    isCircleFree,
    findDoorAtPoint,
    findDoorTrigger,
    findInteractableAtPoint,
    findNearestInteractable,
    findNearestWalkableTile,
    findPath,
  };
})();
