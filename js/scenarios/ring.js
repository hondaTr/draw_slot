import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderRingScene({
  candidates,
  focusIdx = -1,
  badge = '夜の屋敷・選択のとき',
  showRing = true,
  caption = '',
  confirmChoice = -1, // -1: 非表示, 0: はい, 1: いいえ
}) {
  const listHtml = candidates
    .map((m, idx) => `<div class="ring-person ${idx === focusIdx ? 'focused' : ''}">${escapeHtml(m.name)}</div>`)
    .join('');

  const confirmHtml =
    confirmChoice >= 0
      ? `
        <div class="yesno-box">
          <div class="yesno-opt ${confirmChoice === 0 ? 'active' : ''}">${confirmChoice === 0 ? '▶' : '　'} はい</div>
          <div class="yesno-opt ${confirmChoice === 1 ? 'active' : ''}">${confirmChoice === 1 ? '▶' : '　'} いいえ</div>
        </div>
      `
      : '';

  return `
    <div class="chest-aura-badge aura-gold">${escapeHtml(badge)}</div>
    <div class="dq-layout-row">
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('hero', 84)}</div>
      ${showRing ? `<div class="sprite-wrap sprite-float">${getSpriteSvg('ring', 74)}</div>` : ''}
      ${confirmHtml}
    </div>
    <div class="ring-candidates">${listHtml}</div>
    ${caption ? `<div class="name-scroll-box">${escapeHtml(caption)}</div>` : ''}
  `;
}

export async function runRingScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('night');
  stage.setQuestLabel('夜の屋敷・広間');
  audio.startBgm('field');

  let candidates = members.slice(0, 8);
  if (winner && !candidates.some((m) => m.id === winner.id)) {
    candidates[candidates.length - 1] = winner;
  }
  if (decoy && decoy.id !== 'dummy_decoy' && !candidates.some((m) => m.id === decoy.id) && candidates.length > 1) {
    candidates[0] = decoy;
  }

  const winnerIdx = winner ? candidates.findIndex((m) => m.id === winner.id) : -1;
  let decoyIdx = decoy ? candidates.findIndex((m) => m.id === decoy.id) : 0;
  if (decoyIdx < 0) decoyIdx = 0;

  stage.setVisualHtml(renderRingScene({ candidates, badge: 'しずかな夜が ふけていく…' }));
  await stage.typeText(`朝までに 次の「${drawTitle}」を きめなければならない……\nゆうしゃは 指輪を てに みんなの まえを ゆっくり 歩いた。`, { pauseAfterMs: 520 });

  if (route === 'premier') {
    audio.playSe('step');
    stage.setVisualHtml(renderRingScene({
      candidates,
      focusIdx: winnerIdx,
      badge: '迷いのない 一歩',
      caption: winner.name,
      confirmChoice: 0,
    }));
    await stage.wait(420);
    audio.playSe('revive');
    stage.flash('gold');
    await stage.typeText(`ゆうしゃは 迷うことなく「${winner.name}」の まえで 立ち止まり\nしずかに 指輪を さしだした。`, { pauseAfterMs: 650 });
    return;
  }

  const stopIdx = isSafe || route === 'reverse' ? decoyIdx : winnerIdx;
  const steps = Math.min(candidates.length, 5);
  for (let i = 0; i < steps; i++) {
    stage.checkAborted();
    audio.playSe('step');
    stage.setVisualHtml(renderRingScene({
      candidates,
      focusIdx: i % candidates.length,
      badge: 'ひとりひとりの 顔を 見つめている…',
    }));
    await stage.wait(240);
  }

  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderRingScene({
      candidates,
      focusIdx: -1,
      badge: '空が しらみはじめた…',
      showRing: false,
      caption: 'また 今夜に しよう',
    }));
    await stage.typeText('考えているうちに 外が あかるくなってきた。\n今回は 決めずに 見送ることにした。', { pauseAfterMs: 650 });
    return;
  }

  if (route === 'reverse' && candidates.length > 1 && winnerIdx !== decoyIdx) {
    stage.setVisualHtml(renderRingScene({
      candidates,
      focusIdx: stopIdx,
      badge: `${candidates[stopIdx].name} に 指輪を わたしますか？`,
      caption: `${candidates[stopIdx].name} …？`,
      confirmChoice: 1,
    }));
    audio.playSe('cursor');
    await stage.typeText(`「${candidates[stopIdx].name}」の まえで 足を とめた。\n▶「いいえ」……もう少しだけ 考えよう。`, { pauseAfterMs: 600 });

    audio.playSe('step');
    stage.setVisualHtml(renderRingScene({
      candidates,
      focusIdx: winnerIdx,
      badge: `${winner.name} に 指輪を わたしますか？`,
      caption: winner.name,
      confirmChoice: 0,
    }));
    await stage.wait(320);
    audio.playSe('revive');
    stage.flash('gold');
    await stage.typeText(`ゆうしゃは ▶「はい」を えらび、「${winner.name}」に 指輪を さしだした！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 680 });
    return;
  }

  stage.setVisualHtml(renderRingScene({
    candidates,
    focusIdx: winnerIdx,
    badge: `${winner.name} に 指輪を わたしますか？`,
    caption: winner.name,
    confirmChoice: 0,
  }));
  audio.playSe('revive');
  stage.flash('gold');
  await stage.typeText(`ゆうしゃは ▶「はい」を えらび、「${winner.name}」に 指輪を さしだした。\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 650 });
}
