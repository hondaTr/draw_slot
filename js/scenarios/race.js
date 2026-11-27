import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

const SLIME_SPRITES = ['slime_blue', 'slime_red', 'slime_green', 'slime_gold'];

function renderRaceScene({ lanes, badge = 'スライムレース！', aura = 'aura-gold' }) {
  const laneHtml = lanes
    .map((l) => {
      const leftPct = Math.max(4, Math.min(84, l.pos));
      return `
        <div class="race-lane">
          <span class="race-lane-name">${escapeHtml(l.name)}</span>
          <span class="race-runner ${l.sleeping ? 'sleeping' : ''}" style="left:${leftPct}%">
            ${getSpriteSvg(l.sprite, 32)}
          </span>
        </div>
      `;
    })
    .join('');

  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(badge)}</div>
    <div class="race-track">${laneHtml}</div>
  `;
}

export async function runRaceScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('field');
  stage.setQuestLabel('スライム格闘場・レース');
  audio.startBgm('casino');

  const runners = [];
  if (winner) runners.push(winner);
  if (decoy && decoy.id !== 'dummy_decoy' && !runners.some((r) => r.id === decoy.id)) {
    runners.push(decoy);
  }
  for (const m of members) {
    if (runners.length >= 5) break;
    if (!runners.some((r) => r.id === m.id)) runners.push(m);
  }

  const lanes = runners.map((m, idx) => ({
    id: m.id,
    name: m.name,
    sprite: SLIME_SPRITES[idx % SLIME_SPRITES.length],
    pos: 8,
    sleeping: false,
  }));

  const winLane = winner ? lanes.find((l) => l.id === winner.id) : null;
  const decoyLane = lanes.find((l) => l.id === decoy.id) || lanes[0];

  stage.setVisualHtml(renderRaceScene({ lanes, badge: `1着が「${drawTitle}」にきまる！`, aura: 'aura-gold' }));
  await stage.typeText(`スライムレースが はじまる！\n1着になった スライムが 今回の「${drawTitle}」だ！`, { pauseAfterMs: 650 });

  // プレミア：キメラのつばさワープ
  if (route === 'premier' && winLane) {
    audio.playSe('confirm');
    await stage.typeText('よーい…… どん！！', { pauseAfterMs: 350 });
    audio.playSe('upgrade');
    stage.flash('gold');
    winLane.pos = 84;
    winLane.sprite = 'slime_gold';
    stage.setVisualHtml(renderRaceScene({ lanes, badge: `キメラのつばさ！？ ${winLane.name} ゴール！`, aura: 'aura-gold' }));
    await stage.typeText(`「${winLane.name}」スライムが いきなり キメラのつばさを つかった！！\n（反則では？） そのまま 1着で ゴール！`, { pauseAfterMs: 850 });
    return;
  }

  audio.playSe('confirm');
  await stage.typeText('みんな いっせいに ぷるぷる 走りだした！', { pauseAfterMs: 450 });

  for (let step = 0; step < 6; step++) {
    stage.checkAborted();
    for (const lane of lanes) {
      if (route === 'reverse' && decoyLane && lane.id === decoyLane.id) {
        lane.pos += 11;
      } else if (route === 'reverse' && winLane && lane.id === winLane.id) {
        lane.pos += 5;
      } else if (!isSafe && winLane && lane.id === winLane.id) {
        lane.pos += 10 + Math.random() * 3;
      } else {
        lane.pos += 6 + Math.random() * 5;
      }
      lane.pos = Math.min(72, lane.pos);
    }
    audio.playSe('reelTick');
    stage.setVisualHtml(renderRaceScene({ lanes, badge: 'ぷるぷる 競争中…', aura: 'aura-red' }));
    await stage.wait(280);
  }

  // セーフ：ねむりのこなで全員寝る
  if (isSafe) {
    audio.playSe('miss');
    for (const lane of lanes) lane.sleeping = true;
    stage.setVisualHtml(renderRaceScene({ lanes, badge: 'Zzz... みんな ねてしまった！', aura: 'aura-wood' }));
    await stage.typeText('おや！？ みんな かってに「ぼーっと」して ねてしまった！\nレースは 中止！ 今回は ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：先頭が突然あそびだす（AI行動あるある）→ ピオリム逆転
  if (route === 'reverse' && winLane) {
    decoyLane.pos = 79;
    stage.setVisualHtml(renderRaceScene({ lanes, badge: `${decoyLane.name} が ゴール寸前！`, aura: 'aura-red' }));
    await stage.typeText(`「${decoyLane.name}」スライムが 先頭！ このまま ゴールか！？`, { pauseAfterMs: 700 });

    audio.playSe('miss');
    stage.setVisualHtml(renderRaceScene({ lanes, badge: `${decoyLane.name} は あそびはじめた！`, aura: 'aura-red' }));
    await stage.typeText(`しかし「${decoyLane.name}」スライムは ゴール前で とつぜん あそびはじめた！\n（めいれい させてくれ〜！）`, { pauseAfterMs: 700 });

    await stage.showCutin('ピオリム が かかった！！', 950);
    audio.playSe('upgrade');
    winLane.sprite = 'slime_gold';
    winLane.pos = 84;
    stage.flash('gold');
    stage.setVisualHtml(renderRaceScene({ lanes, badge: `ゴール！ 1着：${winLane.name}`, aura: 'aura-gold' }));
    await stage.typeText(`そのあいだに「${winLane.name}」スライムが すーっと 追いぬいて ゴール！\n「${winLane.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  if (winLane) {
    winLane.pos = 84;
    winLane.sprite = 'slime_gold';
  }
  audio.playSe('confirm');
  stage.flash('gold');
  stage.setVisualHtml(renderRaceScene({ lanes, badge: `1着ゴール：${winner.name}`, aura: 'aura-gold' }));
  await stage.typeText(`「${winner.name}」スライムが 1着で ゴールした！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 800 });
}
