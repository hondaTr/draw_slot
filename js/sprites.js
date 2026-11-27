// ピクセルグリッドからインラインSVGドット絵を生成するスプライト集

function gridToSvg(grid, palette, sizePx = 96) {
  const rows = grid.length;
  const cols = grid[0].length;
  let rects = '';
  for (let y = 0; y < rows; y++) {
    const line = grid[y];
    for (let x = 0; x < cols; x++) {
      const ch = line[x];
      if (ch === '.' || !palette[ch]) continue;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[ch]}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges">${rects}</svg>`;
}

// 勇者スプライト
const HERO_GRID = [
  '....BBBB....',
  '...BBBBBB...',
  '...BWWWWB...',
  '..SSPPPPSS..',
  '..SPBPPBPS..',
  '...PPPPPP...',
  '..CCCCCCCC..',
  '.CCYYCCYYCC.',
  '.SSCCCCCCSS.',
  '..CCCCCCCC..',
  '...BB..BB...',
  '..DDD..DDD..',
];

const HERO_PALETTE = {
  B: '#3b82f6', // 青い帽子・服
  W: '#ffd93d', // 金の紋章
  S: '#94a3b8', // 鎧・剣の銀
  P: '#f8c8a0', // 肌
  C: '#1d4ed8', // マント・胴
  Y: '#eab308', // ベルト
  D: '#78350f', // ブーツ
};

// 宝箱（木・赤・金・虹）
const CHEST_CLOSED_GRID = [
  '............',
  '..OOOOOOOO..',
  '.OBBBBBBBBO.',
  '.OBBBYYBBBO.',
  '.OFFFFFFFFO.',
  '.OYYGGGGYYO.',
  '.OBBBYYBBBO.',
  '.OBBBBBBBBO.',
  '.OBBBBBBBBO.',
  '..OOOOOOOO..',
  '............',
  '............',
];

const CHEST_OPEN_GRID = [
  '..OOOOOOOO..',
  '.OBBBBBBBBO.',
  '.OFFFFFFFFO.',
  '.OOOOOOOOOO.',
  '.OSSSSSSSSO.',
  '.OSGGGGGGSO.',
  '.OYYGGGGYYO.',
  '.OBBBBBBBBO.',
  '.OBBBBBBBBO.',
  '..OOOOOOOO..',
  '............',
  '............',
];

const CHEST_PALETTES = {
  wood: { O: '#451a03', B: '#92400e', F: '#78350f', Y: '#d97706', G: '#fbbf24', S: '#1e1b18' },
  red: { O: '#450a0a', B: '#dc2626', F: '#991b1b', Y: '#ffd93d', G: '#fef08a', S: '#1e1b18' },
  gold: { O: '#713f12', B: '#facc15', F: '#ca8a04', Y: '#ffffff', G: '#fef9c3', S: '#422006' },
  rainbow: { O: '#ffffff', B: '#c084fc', F: '#4deeea', Y: '#ffd93d', G: '#ff4757', S: '#2ed573' },
  empty: { O: '#334155', B: '#64748b', F: '#475569', Y: '#94a3b8', G: '#0f172a', S: '#090d16' },
};

// ミミック
const MIMIC_GRID = [
  '..OOOOOOOO..',
  '.ORRRRRRRRO.',
  '.ORWWORWWRO.',
  '.ORWWRRWWRO.',
  '.OWWWWWWWWO.',
  '.OPPPPPPPPO.',
  '.OWWWWWWWWO.',
  '.ORRRRRRRRO.',
  '.ORRRRRRRRO.',
  '..OOOOOOOO..',
  '..R..RR..R..',
  '............',
];

const MIMIC_PALETTE = {
  O: '#1f0814',
  R: '#991b1b',
  W: '#f8fafc',
  P: '#f43f5e',
};

// 魔王 / ボス
const BOSS_GRID = [
  '.Y........Y.',
  '.YY..PP..YY.',
  '..YPPPPPPY..',
  '..PPWPPWPP..',
  '..PPRRRRPP..',
  '.PPPPPPPPPP.',
  'CCPPPPPPPPCC',
  'CCCPPPPPACCC',
  '.CCPPPPPPCC.',
  '..PPPPPPPP..',
  '..PP....PP..',
  '.DDD....DDD.',
];

const BOSS_PALETTE = {
  Y: '#ffd93d',
  P: '#6b21a8',
  W: '#ff2e43',
  R: '#f8fafc',
  C: '#991b1b',
  A: '#a855f7',
  D: '#312e81',
};

// メタル系スライム
const METAL_GRID = [
  '.....SS.....',
  '....SSSS....',
  '...SSSSSS...',
  '..SSWWWSSS..',
  '.SSWKBWKBSS.',
  '.SSWWWWWWSS.',
  'SSSSMMMMSSSS',
  'SSSMMMMMMMSS',
  'SSDDDDDDDDSS',
  '.DDDDDDDDDD.',
  '..DDDDDDDD..',
  '............',
];

const METAL_PALETTE = {
  S: '#e2e8f0',
  W: '#ffffff',
  K: '#0f172a',
  B: '#38bdf8',
  M: '#94a3b8',
  D: '#475569',
};

// キングメタル（プレミア）
const KING_METAL_GRID = [
  '...Y.YY.Y...',
  '...YYYYYY...',
  '...SSSSSS...',
  '..SSSSSSSS..',
  '.SSWKBWKBSS.',
  '.SSWWWWWWSS.',
  'SSSSMMMMSSSS',
  'SSSMMRRMMMSS',
  'SSDDDDDDDDSS',
  '.DDDDDDDDDD.',
  '..DDDDDDDD..',
  '............',
];

const KING_METAL_PALETTE = {
  ...METAL_PALETTE,
  Y: '#ffd93d',
  R: '#ef4444',
};

// 王様
const KING_GRID = [
  '...Y.YY.Y...',
  '...YYYYYY...',
  '...PPPPPP...',
  '..PWKPPKWP..',
  '..PPPPPPPP..',
  '..WWWWWWWW..',
  '.RRRRRRRRRR.',
  '.RRYRRRRRYR.',
  '.RRRRRRRRRR.',
  '..RRRRRRRR..',
  '...BB..BB...',
  '..DDD..DDD..',
];

const KING_PALETTE = {
  Y: '#ffd93d',
  P: '#f8c8a0',
  W: '#f8fafc',
  K: '#1e293b',
  R: '#dc2626',
  B: '#3b82f6',
  D: '#78350f',
};

// 教会・女神の十字架 / 光
const CHURCH_GRID = [
  '.....YY.....',
  '....YYYY....',
  '..YYYYYYYY..',
  '..YYYYYYYY..',
  '....YYYY....',
  '....YYYY....',
  '....YYYY....',
  '...SSSSSS...',
  '..SSSSSSSS..',
  '..SSSSSSSS..',
  '.CCCCCCCCCC.',
  '............',
];

const CHURCH_PALETTE = {
  Y: '#fef08a',
  S: '#cbd5e1',
  C: '#475569',
};

// ダーマの神官
const PRIEST_GRID = [
  '....YYYY....',
  '...YYYYYY...',
  '..YPPPPPPY..',
  '..PKPPPPKP..',
  '...PPPPPP...',
  '..WWWWWWWW..',
  '.WWYYYYYYWW.',
  '.WWCCCCCCWW.',
  '.WWCCCCCCWW.',
  '..CCCCCCCC..',
  '..CCCCCCCC..',
  '...DD..DD...',
];

const PRIEST_PALETTE = {
  Y: '#eab949',
  P: '#f8c8a0',
  K: '#1e293b',
  W: '#e8eef7',
  C: '#67c6d8',
  D: '#78350f',
};

// スライム（レース用）
const SLIME_GRID = [
  '............',
  '.....SS.....',
  '....SSSS....',
  '...SSSSSS...',
  '..SSSSSSSS..',
  '.SSWKBWKBSS.',
  '.SSWWWWWWSS.',
  'SSSSMMMMSSSS',
  'SSSMMMMMMMSS',
  'SSDDDDDDDDSS',
  '.DDDDDDDDDD.',
  '............',
];

const SLIME_PALETTES = {
  blue: { S: '#60a5fa', W: '#ffffff', K: '#0f172a', B: '#0f172a', M: '#3b82f6', D: '#1d4ed8' },
  red: { S: '#f87171', W: '#ffffff', K: '#0f172a', B: '#0f172a', M: '#ef4444', D: '#b91c1c' },
  green: { S: '#4ade80', W: '#ffffff', K: '#0f172a', B: '#0f172a', M: '#22c55e', D: '#15803d' },
  gold: { S: '#fde047', W: '#ffffff', K: '#0f172a', B: '#0f172a', M: '#eab308', D: '#a16207' },
};

// 台座の伝説の剣 / 引き抜かれた剣
const SWORD_STONE_GRID = [
  '.....YY.....',
  '.....SS.....',
  '.....SS.....',
  '....YYYY....',
  '.....SS.....',
  '.....SS.....',
  '...CCCCCC...',
  '..CCCCCCCC..',
  '.CCCDDDDCCC.',
  '.CCCCCCCCCC.',
  'CCCCCCCCCCCC',
  '............',
];

const SWORD_DRAWN_GRID = [
  '.....WW.....',
  '....WSSW....',
  '....WSSW....',
  '....WSSW....',
  '....WSSW....',
  '....WSSW....',
  '..YYYYYYYY..',
  '....YYYY....',
  '.....YY.....',
  '.....YY.....',
  '....YYYY....',
  '............',
];

const SWORD_PALETTE = {
  Y: '#eab949',
  S: '#cbd5e1',
  W: '#e8eef7',
  C: '#64748b',
  D: '#334155',
};

// 帆船
const SHIP_GRID = [
  '.....WW.....',
  '....WWWW....',
  '...WWWWWW...',
  '..WWWWWWWW..',
  '.....YY.....',
  '.BBBBBBBBBB.',
  '.BYYYYYYYYB.',
  '..BBBBBBBB..',
  '...BBBBBB...',
  '.CCCCCCCCCC.',
  'CCCCCCCCCCCC',
  '............',
];

const SHIP_PALETTE = {
  W: '#e8eef7',
  Y: '#eab949',
  B: '#92400e',
  C: '#38bdf8',
};

// クラーケン
const KRAKEN_GRID = [
  '...PPPPPP...',
  '..PPPPPPPP..',
  '.PPWPPPPWPP.',
  '.PPKPPPPKPP.',
  '.PPPPPPPPPP.',
  '..PPPRRPPP..',
  '.P.PP..PP.P.',
  'P..P.PP.P..P',
  'P.P..PP..P.P',
  '.P..P..P..P.',
  '....P..P....',
  '............',
];

const KRAKEN_PALETTE = {
  P: '#7e22ce',
  W: '#fef08a',
  K: '#0f172a',
  R: '#df6470',
};

// じゅもん巻物
const SCROLL_GRID = [
  '..YYYYYYYY..',
  '.YWWWWWWWWY.',
  '.YWKKKKKKWY.',
  '..YWWWWWWY..',
  '..YWKKKKWY..',
  '..YWWWWWWY..',
  '..YWKKKKWY..',
  '..YWWWWWWY..',
  '.YWWWWWWWWY.',
  '..YYYYYYYY..',
  '............',
  '............',
];

const SCROLL_PALETTE = {
  Y: '#eab949',
  W: '#f1e7c6',
  K: '#451a03',
};

// 民家のツボ
const POT_GRID = [
  '....BBBB....',
  '...BBBBBB...',
  '....BBBB....',
  '..BBBBBBBB..',
  '.BBBBYYBBBB.',
  '.BBBBBBBBBB.',
  '.BBBBBBBBBB.',
  '.BBBBBBBBBB.',
  '..BBBBBBBB..',
  '...BBBBBB...',
  '..DDDDDDDD..',
  '............',
];

const POT_PALETTE = {
  B: '#b45309',
  Y: '#eab949',
  D: '#451a03',
};

// 村長・家主
const VILLAGER_GRID = [
  '....GGGG....',
  '...GGGGGG...',
  '...PPPPPP...',
  '..PKPPPPKP..',
  '...PPPPPP...',
  '..GGGGGGGG..',
  '..CCCCCCCC..',
  '.CCCCCCCCCC.',
  '.CCCCCCCCCC.',
  '..CCCCCCCC..',
  '...BB..BB...',
  '..DDD..DDD..',
];

const VILLAGER_PALETTE = {
  G: '#94a3b8',
  P: '#f8c8a0',
  K: '#1e293b',
  C: '#4ec483',
  B: '#64748b',
  D: '#78350f',
};

// 指輪（DQ5選択イベントモチーフ）
const RING_GRID = [
  '.....CC.....',
  '....CDDC....',
  '....CCCC....',
  '...YYYYYY...',
  '..YY....YY..',
  '.YY......YY.',
  '.YY......YY.',
  '.YY......YY.',
  '..YY....YY..',
  '...YYYYYY...',
  '............',
  '............',
];

const RING_PALETTE = {
  C: '#67c6d8',
  D: '#e8eef7',
  Y: '#eab949',
};

// 不死鳥（ラーミアモチーフ）
const PHOENIX_GRID = [
  '.....YY.....',
  '..O..YY..O..',
  '.OOYYYYYYOO.',
  'OOOYYYYYYOOO',
  'OO.OYYYYO.OO',
  'O...YYYY...O',
  '....RRRR....',
  '...RRRRRR...',
  '..RR.YY.RR..',
  '.R...YY...R.',
  '.....YY.....',
  '............',
];

const PHOENIX_PALETTE = {
  Y: '#eab949',
  O: '#f59e0b',
  R: '#df6470',
};

// オーブ
const ORB_GRID = [
  '....WWWW....',
  '..WWCCCCWW..',
  '.WCCCCCCCCW.',
  '.WCCWWWWCCW.',
  'WCCWWCCWWCCW',
  'WCCCCCCCCCCW',
  'WCCCCCCCCCCW',
  '.WCCCCCCCCW.',
  '.WCCCCCCCCW.',
  '..WWCCCCWW..',
  '....WWWW....',
  '............',
];

const ORB_PALETTE = {
  W: '#e8eef7',
  C: '#eab949',
};

export function getSpriteSvg(name, sizePx = 96) {
  switch (name) {
    case 'hero':
      return gridToSvg(HERO_GRID, HERO_PALETTE, sizePx);
    case 'chest_wood':
      return gridToSvg(CHEST_CLOSED_GRID, CHEST_PALETTES.wood, sizePx);
    case 'chest_red':
      return gridToSvg(CHEST_CLOSED_GRID, CHEST_PALETTES.red, sizePx);
    case 'chest_gold':
      return gridToSvg(CHEST_CLOSED_GRID, CHEST_PALETTES.gold, sizePx);
    case 'chest_rainbow':
      return gridToSvg(CHEST_CLOSED_GRID, CHEST_PALETTES.rainbow, sizePx);
    case 'chest_open_gold':
      return gridToSvg(CHEST_OPEN_GRID, CHEST_PALETTES.gold, sizePx);
    case 'chest_empty':
      return gridToSvg(CHEST_OPEN_GRID, CHEST_PALETTES.empty, sizePx);
    case 'mimic':
      return gridToSvg(MIMIC_GRID, MIMIC_PALETTE, sizePx);
    case 'boss':
      return gridToSvg(BOSS_GRID, BOSS_PALETTE, sizePx);
    case 'metal':
      return gridToSvg(METAL_GRID, METAL_PALETTE, sizePx);
    case 'king_metal':
      return gridToSvg(KING_METAL_GRID, KING_METAL_PALETTE, sizePx);
    case 'king':
      return gridToSvg(KING_GRID, KING_PALETTE, sizePx);
    case 'church':
      return gridToSvg(CHURCH_GRID, CHURCH_PALETTE, sizePx);
    case 'priest':
      return gridToSvg(PRIEST_GRID, PRIEST_PALETTE, sizePx);
    case 'slime_blue':
      return gridToSvg(SLIME_GRID, SLIME_PALETTES.blue, sizePx);
    case 'slime_red':
      return gridToSvg(SLIME_GRID, SLIME_PALETTES.red, sizePx);
    case 'slime_green':
      return gridToSvg(SLIME_GRID, SLIME_PALETTES.green, sizePx);
    case 'slime_gold':
      return gridToSvg(SLIME_GRID, SLIME_PALETTES.gold, sizePx);
    case 'sword_stone':
      return gridToSvg(SWORD_STONE_GRID, SWORD_PALETTE, sizePx);
    case 'sword_drawn':
      return gridToSvg(SWORD_DRAWN_GRID, SWORD_PALETTE, sizePx);
    case 'ship':
      return gridToSvg(SHIP_GRID, SHIP_PALETTE, sizePx);
    case 'kraken':
      return gridToSvg(KRAKEN_GRID, KRAKEN_PALETTE, sizePx);
    case 'scroll':
      return gridToSvg(SCROLL_GRID, SCROLL_PALETTE, sizePx);
    case 'pot':
      return gridToSvg(POT_GRID, POT_PALETTE, sizePx);
    case 'villager':
      return gridToSvg(VILLAGER_GRID, VILLAGER_PALETTE, sizePx);
    case 'ring':
      return gridToSvg(RING_GRID, RING_PALETTE, sizePx);
    case 'phoenix':
      return gridToSvg(PHOENIX_GRID, PHOENIX_PALETTE, sizePx);
    case 'orb':
      return gridToSvg(ORB_GRID, ORB_PALETTE, sizePx);
    default:
      return gridToSvg(HERO_GRID, HERO_PALETTE, sizePx);
  }
}
