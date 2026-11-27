import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

const SLIME_SPRITES = ['slime_blue', 'slime_red', 'slime_green', 'slime_gold'];

export async function runRaceScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('field');
  stage.setQuestLabel('モンスター格闘場・スライムレース');
  audio.startBgm('casino');

  // 有効メンバー全員を出走させる
  const runners = members.map((m, idx) => ({
    id: m.id,
    name: m.name,
    sprite: SLIME_SPRITES[idx % SLIME_SPRITES.length],
    pos: 8,
    boost: false,
    sleeping: false,
  }));

  const count = runners.length;
  const densityClass = count >= 10 ? 'is-dense' : count >= 6 ? 'is-compact' : '';
  const spriteSize = count >= 10 ? 20 : count >= 6 ? 24 : 30;

  const lanesHtml = runners
    .map(
      (r, idx) => `
      <div class="race-lane" data-lane-idx="${idx}">
        <span class="race-rank" data-rank-idx="${idx}">${idx + 1}</span>
        <span class="race-lane-name">${escapeHtml(r.name)}</span>
        <span class="race-runner" data-runner-idx="${idx}" style="left:${r.pos}%">
          ${getSpriteSvg(r.sprite, spriteSize)}
        </span>
      </div>
    `
    )
    .join('');

  stage.setVisualHtml(`
    <div class="chest-aura-badge aura-gold" id="race-badge">全${count}ひき 出走！ 1着が「${escapeHtml(drawTitle)}」</div>
    <div class="race-header">
      <span id="race-leader">出走ゲート たいき中…</span>
      <span id="race-phase">距離：100m</span>
    </div>
    <div class="race-track ${densityClass}">${lanesHtml}</div>
  `);

  const updateDom = (badgeText, phaseText) => {
    const badgeEl = document.getElementById('race-badge');
    const leaderEl = document.getElementById('race-leader');
    const phaseEl = document.getElementById('race-phase');
    if (badgeEl && badgeText) badgeEl.textContent = badgeText;
    if (phaseEl && phaseText) phaseEl.textContent = phaseText;

    // 順位計算
    const order = runners
      .map((r, i) => ({ i, pos: r.pos, name: r.name }))
      .sort((a, b) => b.pos - a.pos);

    const rankMap = new Map();
    order.forEach((o, rankIdx) => rankMap.set(o.i, rankIdx + 1));

    if (leaderEl && order.length > 0) {
      const top2 = order[1] ? ` / 2位：${order[1].name}` : '';
      leaderEl.textContent = `1位：${order[0].name}${top2}`;
    }

    runners.forEach((r, idx) => {
      const runnerEl = document.querySelector(`[data-runner-idx="${idx}"]`);
      const rankEl = document.querySelector(`[data-rank-idx="${idx}"]`);
      const rank = rankMap.get(idx) || idx + 1;
      if (runnerEl) {
        runnerEl.style.left = `${Math.max(4, Math.min(88, r.pos))}%`;
        runnerEl.classList.toggle('is-boosting', r.boost);
        runnerEl.classList.toggle('sleeping', r.sleeping);
      }
      if (rankEl) {
        rankEl.textContent = `${rank}`;
        rankEl.classList.toggle('top1', rank === 1);
      }
    });
  };

  const winRunner = winner ? runners.find((r) => r.id === winner.id) : null;
  const decoyRunner = runners.find((r) => r.id === decoy.id) || runners[0];

  await stage.typeText(`全${count}ひきの スライムが ゲートに ならんだ！\n1着で ゴールした 者が 今回の「${drawTitle}」だ！`, { pauseAfterMs: 450 });

  // カウントダウン
  for (const label of ['3…', '2…', '1…']) {
    audio.playSe('cursor');
    updateDom(`ゲートオープンまで ${label}`, 'スタート前');
    await stage.wait(280);
  }
  audio.playSe('confirm');
  updateDom('スタート！！', '序盤');

  // プレミア：キメラのつばさワープ
  if (route === 'premier' && winRunner) {
    await stage.wait(250);
    audio.playSe('upgrade');
    stage.flash('gold');
    winRunner.pos = 88;
    winRunner.boost = true;
    const winIdx = runners.indexOf(winRunner);
    const runnerEl = document.querySelector(`[data-runner-idx="${winIdx}"]`);
    if (runnerEl) runnerEl.innerHTML = getSpriteSvg('slime_gold', spriteSize);
    updateDom(`いきなり ワープ！ ${winRunner.name} ゴール！`, 'ゴール！');
    await stage.typeText(`「${winRunner.name}」スライムが ふしぎな 風に のって 一瞬で ゴールした！`, { pauseAfterMs: 650 });
    return;
  }

  // 序盤〜終盤（抜きつ抜かれつの8ステップ）
  for (let step = 0; step < 8; step++) {
    stage.checkAborted();
    for (const r of runners) {
      let delta = 5 + Math.random() * 6;
      if (route === 'reverse') {
        if (decoyRunner && r.id === decoyRunner.id) {
          delta = step < 6 ? 9.5 + Math.random() * 2 : 2;
        } else if (winRunner && r.id === winRunner.id) {
          delta = step < 5 ? 5.5 : 10;
        }
      } else if (!isSafe && winRunner && r.id === winRunner.id) {
        delta = step < 3 ? 7 + Math.random() * 4 : 9.5 + Math.random() * 3;
      }
      r.pos = Math.min(76, r.pos + delta);
      r.boost = delta >= 9.5;
    }
    audio.playSe('reelTick');
    const phaseLabel = step < 3 ? '序盤' : step < 6 ? '中盤・混戦！' : '終盤スパート！';
    updateDom(step >= 6 ? '最後の 直線だ！！' : '抜きつ抜かれつの デッドヒート！', phaseLabel);
    await stage.wait(230);
  }

  // セーフ：ふしぎな霧で全員寝る
  if (isSafe) {
    audio.playSe('miss');
    runners.forEach((r) => {
      r.boost = false;
      r.sleeping = true;
    });
    updateDom('ふしぎな 霧が たちこめた！', 'レース中断');
    await stage.typeText('なんと ふしぎな 霧で 全員 ねむってしまった！\nレースは 引き分け！ 今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  // 逆転：先頭がようすを見はじめる → 一気に加速
  if (route === 'reverse' && winRunner) {
    decoyRunner.pos = 81;
    decoyRunner.boost = false;
    updateDom(`${decoyRunner.name} が ゴール寸前！`, 'ゴール目前');
    await stage.typeText(`先頭は「${decoyRunner.name}」スライム！ このまま 逃げ切るか！？`, { pauseAfterMs: 480 });

    audio.playSe('miss');
    updateDom(`${decoyRunner.name} は ようすを みている！`, 'まさかの失速');
    await stage.typeText(`しかし「${decoyRunner.name}」スライムは ゴール前で なぜか ようすを みはじめた！`, { pauseAfterMs: 480 });

    await stage.showCutin('かいしんの スパート！！', 800);
    audio.playSe('upgrade');
    winRunner.pos = 88;
    winRunner.boost = true;
    const winIdx = runners.indexOf(winRunner);
    const runnerEl = document.querySelector(`[data-runner-idx="${winIdx}"]`);
    if (runnerEl) runnerEl.innerHTML = getSpriteSvg('slime_gold', spriteSize);
    stage.flash('gold');
    updateDom(`逆転ゴール！ 1着：${winRunner.name}`, 'ゴール！');
    await stage.typeText(`一気に 加速した「${winRunner.name}」スライムが ごぼう抜きで ゴール！\n「${winRunner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 650 });
    return;
  }

  // 通常ゴール
  if (winRunner) {
    winRunner.pos = 88;
    winRunner.boost = true;
    const winIdx = runners.indexOf(winRunner);
    const runnerEl = document.querySelector(`[data-runner-idx="${winIdx}"]`);
    if (runnerEl) runnerEl.innerHTML = getSpriteSvg('slime_gold', spriteSize);
  }
  audio.playSe('confirm');
  stage.flash('gold');
  updateDom(`1着ゴール：${winner.name}`, 'ゴール！');
  await stage.typeText(`「${winner.name}」スライムが 1着で ゴールした！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 600 });
}
