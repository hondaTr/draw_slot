import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

// 7列 x 5行 のダンジョンマップ定義
// '#' = 壁, '.' = 通路, 'S' = スタート, 'D' = 仮の部屋/中継, 'H' = 隠し扉, 'G' = 最深部の部屋, 'W' = ワープ床
const BASE_GRID = [
  ['#', '#', '#', '.', '.', '.', 'G'],
  ['S', '.', '.', '.', '#', '#', '.'],
  ['#', '#', '.', '#', '#', '#', 'H'],
  ['#', '.', '.', '.', '.', '.', 'D'],
  ['#', '#', '#', '#', '#', '#', '#'],
];

function renderDungeonScene({
  heroPos,
  visitedSet,
  secretOpen = false,
  warpActive = false,
  goalName = '？？？',
  decoyRoomName = '',
  badge = '迷宮の おくへ すすもう',
  aura = 'aura-wood',
}) {
  let tilesHtml = '';
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 7; x++) {
      const cell = BASE_GRID[y][x];
      const key = `${x},${y}`;
      const isHero = heroPos.x === x && heroPos.y === y;
      const isVisited = visitedSet.has(key);

      let cls = 'dungeon-tile';
      let content = '';
      const dist = Math.abs(heroPos.x - x) + Math.abs(heroPos.y - y);

      if (cell === '#') {
        cls += ' tile-wall';
      } else if (cell === 'H' && !secretOpen) {
        cls += ' tile-wall';
      } else {
        cls += ' tile-floor';
        if (cell === 'H' && secretOpen) cls += ' secret-open';
        if (isVisited) cls += ' tile-visited';
        if (cell === 'G') {
          cls += ' goal-tile';
          if (!isHero) {
            content = `<span class="tile-goal-tag">${escapeHtml(goalName)}</span>`;
          }
        } else if (cell === 'D' && decoyRoomName) {
          cls += ' decoy-tile';
          if (!isHero) {
            content = `<span class="tile-goal-tag">${escapeHtml(decoyRoomName)}</span>`;
          }
        } else if (cell === 'W' || (warpActive && x === 5 && y === 0)) {
          cls += ' warp-tile';
        }
      }

      if (!isVisited && dist > 2 && cell !== 'G') {
        cls += ' tile-dim';
      }

      if (isHero) {
        content = `<span class="tile-hero">${getSpriteSvg('hero', 28)}</span>`;
      }

      tilesHtml += `<div class="${cls}">${content}</div>`;
    }
  }

  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(badge)}</div>
    <div class="dungeon-map">${tilesHtml}</div>
  `;
}

async function walkPath(stage, path, visitedSet, stateObj, stepMs = 210) {
  for (const pos of path) {
    stage.checkAborted();
    visitedSet.add(`${pos.x},${pos.y}`);
    audio.playSe('step');
    stage.setVisualHtml(renderDungeonScene({
      ...stateObj,
      heroPos: pos,
      visitedSet,
    }));
    await stage.wait(stepMs);
  }
}

export async function runDungeonScenario(ctx) {
  const { stage, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('dungeon');
  stage.setQuestLabel('迷宮のダンジョン・地下5階');
  audio.startBgm('field');

  const visited = new Set(['0,1']);
  let heroPos = { x: 0, y: 1 };

  stage.setVisualHtml(renderDungeonScene({
    heroPos,
    visitedSet: visited,
    goalName: '？？？',
    badge: `「${drawTitle}」がいる 最深部を めざそう！`,
  }));
  await stage.typeText(`ゆうしゃは「${drawTitle}」が まっている 迷宮のおくへ ふみだした！`, { pauseAfterMs: 450 });

  // プレミア：スタート直後に隠し扉が開いて一直線
  if (route === 'premier') {
    audio.playSe('upgrade');
    stage.flash('gold');
    const shortcut = [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
    ];
    await walkPath(stage, shortcut, visited, {
      secretOpen: true,
      goalName: winner.name,
      badge: '最短ルートを 発見した！',
      aura: 'aura-gold',
    }, 170);

    audio.playSe('chest');
    stage.setVisualHtml(renderDungeonScene({
      heroPos: { x: 6, y: 0 },
      visitedSet: visited,
      secretOpen: true,
      goalName: winner.name,
      badge: `最深部に いたのは「${winner.name}」！`,
      aura: 'aura-gold',
    }));
    await stage.typeText(`迷宮の最深部に たどりついた！\nそこに いたのは「${winner.name}」だった！`, { pauseAfterMs: 650 });
    return;
  }

  // 分かれ道まで進む
  await walkPath(stage, [
    { x: 1, y: 1 },
    { x: 2, y: 1 },
  ], visited, {
    goalName: '？？？',
    badge: '分かれ道に でた…',
  }, 210);

  // セーフ：手前のワープ床で入口へ戻される
  if (isSafe) {
    await walkPath(stage, [
      { x: 3, y: 1 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
    ], visited, {
      goalName: '？？？',
      badge: 'あともう少しで 最深部だ！',
      aura: 'aura-gold',
    }, 210);

    audio.playSe('miss');
    stage.setBlackout(true);
    await stage.wait(360);
    stage.setBlackout(false);
    stage.setVisualHtml(renderDungeonScene({
      heroPos: { x: 0, y: 1 },
      visitedSet: visited,
      warpActive: true,
      goalName: '？？？',
      badge: 'ワープ床を ふんで 入口へ もどされた！',
      aura: 'aura-red',
    }));
    await stage.typeText('なんと 部屋のてまえの ワープ床を ふんでしまい、入口へ もどされた！\n今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  // 逆転：下の部屋（decoy）へ行くが行き止まり → 隠し通路が開いて最深部（winner）へ
  if (route === 'reverse') {
    await walkPath(stage, [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 6, y: 3 },
    ], visited, {
      decoyRoomName: decoy.name,
      goalName: '？？？',
      badge: `おくの部屋に「${decoy.name}」の名が…？`,
      aura: 'aura-gold',
    }, 190);
    await stage.typeText(`南のおくの 部屋で「${decoy.name}」の なまえを みつけた！\n……しかし ここは 行き止まりのようだ。`, { pauseAfterMs: 520 });

    await stage.showCutin('かべの スイッチで 隠し通路が ひらいた！', 850);
    audio.playSe('upgrade');

    await walkPath(stage, [
      { x: 6, y: 2 },
      { x: 6, y: 1 },
      { x: 6, y: 0 },
    ], visited, {
      secretOpen: true,
      decoyRoomName: decoy.name,
      goalName: winner.name,
      badge: 'ほんとうの 最深部へ！',
      aura: 'aura-gold',
    }, 220);

    audio.playSe('chest');
    stage.flash('gold');
    stage.setVisualHtml(renderDungeonScene({
      heroPos: { x: 6, y: 0 },
      visitedSet: visited,
      secretOpen: true,
      decoyRoomName: decoy.name,
      goalName: winner.name,
      badge: `最深部に いたのは「${winner.name}」！`,
      aura: 'aura-gold',
    }));
    await stage.typeText(`隠し通路の さきにある ほんとうの最深部に たどりついた！\nそこに いたのは「${winner.name}」だった！`, { pauseAfterMs: 650 });
    return;
  }

  // 通常：正しいルートで最深部へ到達
  await walkPath(stage, [
    { x: 3, y: 1 },
    { x: 3, y: 0 },
    { x: 4, y: 0 },
    { x: 5, y: 0 },
    { x: 6, y: 0 },
  ], visited, {
    goalName: winner.name,
    badge: '最深部に とうちゃく！',
    aura: 'aura-gold',
  }, 200);

  audio.playSe('chest');
  stage.flash('gold');
  await stage.typeText(`迷宮の おくで まっている「${winner.name}」を みつけた！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 600 });
}
