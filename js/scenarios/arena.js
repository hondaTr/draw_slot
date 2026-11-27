import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

const FIGHTER_SPRITES = ['slime_blue', 'slime_red', 'slime_green', 'slime_gold', 'metal'];

function renderArenaScene({
  roster = [],
  left = null,
  right = null,
  leftHit = false,
  rightHit = false,
  badge = 'モンスター闘技場・決勝戦！',
  aura = 'aura-gold',
}) {
  const rosterHtml = roster
    .map((r) => {
      const cls = r.status === 'fighting' ? 'fighting' : r.status === 'eliminated' ? 'eliminated' : '';
      return `<span class="arena-badge ${cls}">${escapeHtml(r.name)}</span>`;
    })
    .join('');

  const renderCorner = (f, isHit) => {
    if (!f) return '';
    const hpPct = Math.max(0, Math.min(100, Math.round((f.hp / f.maxHp) * 100)));
    return `
      <div class="arena-fighter">
        <div class="arena-fighter-name">${escapeHtml(f.name)}</div>
        <div class="arena-hp-bar">
          <div class="arena-hp-fill ${hpPct <= 25 ? 'is-low' : ''}" style="width:${hpPct}%"></div>
        </div>
        <div class="arena-hp-num">HP ${f.hp} / ${f.maxHp}</div>
        <div class="sprite-wrap ${isHit ? 'sprite-hit' : 'sprite-bounce'}">
          ${getSpriteSvg(f.sprite, 76)}
        </div>
      </div>
    `;
  };

  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(badge)}</div>
    <div class="arena-roster">${rosterHtml}</div>
    ${
      left && right
        ? `
      <div class="arena-ring">
        ${renderCorner(left, leftHit)}
        <div class="arena-vs">VS</div>
        ${renderCorner(right, rightHit)}
      </div>
    `
        : ''
    }
  `;
}

export async function runArenaScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('arena');
  stage.setQuestLabel('王都・モンスター闘技場');
  audio.startBgm('battle');

  const finalistA = isSafe ? decoy : winner;
  const finalistB = decoy && finalistA && decoy.id !== finalistA.id
    ? decoy
    : { id: 'dummy_challenger', name: 'さすらいのけんし' };

  const roster = members.map((m) => ({
    id: m.id,
    name: m.name,
    status: 'alive',
  }));

  stage.setVisualHtml(renderArenaScene({
    roster,
    badge: `勝ちぬいた 1名が「${drawTitle}」に！`,
  }));
  await stage.typeText(`モンスター闘技場 トーナメント かいさい！\n優勝者が 今回の「${drawTitle}」に きまる！`, { pauseAfterMs: 480 });

  // 予選ダイジェスト：決勝の2人以外が脱落していく
  const nonFinalists = roster.filter((r) => r.id !== finalistA.id && r.id !== finalistB.id);
  if (nonFinalists.length > 0) {
    audio.playSe('attack');
    nonFinalists.forEach((r) => {
      r.status = 'eliminated';
    });
    roster.forEach((r) => {
      if (r.id === finalistA.id || r.id === finalistB.id) r.status = 'fighting';
    });
    stage.setVisualHtml(renderArenaScene({
      roster,
      badge: `決勝進出は「${finalistA.name}」と「${finalistB.name}」！`,
    }));
    await stage.typeText(`はげしい 予選を 勝ちぬいたのは「${finalistA.name}」と「${finalistB.name}」！`, { pauseAfterMs: 500 });
  } else {
    roster.forEach((r) => {
      r.status = 'fighting';
    });
  }

  const left = {
    name: finalistA.name,
    hp: 100,
    maxHp: 100,
    sprite: FIGHTER_SPRITES[0],
  };
  const right = {
    name: finalistB.name,
    hp: 100,
    maxHp: 100,
    sprite: FIGHTER_SPRITES[1],
  };

  stage.setVisualHtml(renderArenaScene({
    roster,
    left,
    right,
    badge: '決勝戦・ゴングが 鳴った！',
  }));
  audio.playSe('confirm');
  await stage.wait(360);

  // プレミア：一撃決着
  if (route === 'premier') {
    audio.playSe('critical');
    stage.flash('gold');
    right.hp = 0;
    const loserEntry = roster.find((r) => r.id === finalistB.id);
    if (loserEntry) loserEntry.status = 'eliminated';
    stage.setVisualHtml(renderArenaScene({
      roster,
      left,
      right,
      rightHit: true,
      badge: `優勝：${left.name}！`,
    }));
    await stage.typeText(`開幕「${left.name}」の かいしんの いちげき！\n一撃で 勝負を きめて 優勝した！`, { pauseAfterMs: 650 });
    return;
  }

  // 第1合：お互い削り合う
  audio.playSe('attack');
  right.hp = 62;
  stage.setVisualHtml(renderArenaScene({
    roster,
    left,
    right,
    rightHit: true,
    badge: `${left.name} の こうげき！`,
  }));
  await stage.typeText(`まずは「${left.name}」の こうげき！ 38の ダメージ！`, { pauseAfterMs: 420 });

  audio.playSe('attack');
  left.hp = 54;
  stage.setVisualHtml(renderArenaScene({
    roster,
    left,
    right,
    leftHit: true,
    badge: `${right.name} の 反撃！`,
    aura: 'aura-red',
  }));
  await stage.typeText(`「${right.name}」も 負けていない！ 46の ダメージを 与えた！`, { pauseAfterMs: 450 });

  // セーフ：相打ちで引き分け
  if (isSafe) {
    audio.playSe('critical');
    stage.shake('light');
    left.hp = 0;
    right.hp = 0;
    roster.forEach((r) => {
      r.status = 'eliminated';
    });
    stage.setVisualHtml(renderArenaScene({
      roster,
      left,
      right,
      leftHit: true,
      rightHit: true,
      badge: 'なんと 両者 相打ち！！',
      aura: 'aura-wood',
    }));
    await stage.typeText('両者の こうげきが 同時に ヒット！ なんと 相打ちで 引き分けになった！\n今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  // 逆転：HP1で踏みとどまり → 逆転の会心の一撃
  if (route === 'reverse') {
    audio.playSe('critical');
    stage.flash('red');
    stage.shake('heavy');
    left.hp = 1;
    stage.setVisualHtml(renderArenaScene({
      roster,
      left,
      right,
      leftHit: true,
      badge: `${left.name} 大ピンチ！ HPのこり 1！`,
      aura: 'aura-red',
    }));
    await stage.typeText(`「${right.name}」の つうこんの いちげき！！\n……しかし「${left.name}」は HP1で ふみとどまった！！`, { pauseAfterMs: 580 });

    await stage.showCutin('きせきの かいしんのいちげき！！', 850);
  } else {
    await stage.typeText('おたがい あと一歩！ 決勝は ついに クライマックスへ！', { pauseAfterMs: 420 });
  }

  audio.playSe('critical');
  stage.flash('gold');
  stage.shake('light');
  right.hp = 0;
  const loserEntry = roster.find((r) => r.id === finalistB.id);
  if (loserEntry) loserEntry.status = 'eliminated';
  stage.setVisualHtml(renderArenaScene({
    roster,
    left,
    right,
    rightHit: true,
    badge: `優勝：${left.name}！`,
    aura: 'aura-gold',
  }));
  await stage.typeText(`「${left.name}」の かいしんの いちげきが きまった！\n闘技場を 制した「${left.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 650 });
}
