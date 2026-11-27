import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderKingScene({ boardMembers, selectedIdx = -1, decoyIdx = -1, rewrittenIdx = -1, bannerText = '', showSupply = false }) {
  const slots = boardMembers
    .map((m, idx) => {
      let cls = 'king-slot';
      if (idx === rewrittenIdx) cls += ' rewritten';
      else if (idx === decoyIdx) cls += ' decoy-hit';
      else if (idx === selectedIdx) cls += ' selected';
      return `<div class="${cls}">${escapeHtml(m.name)}</div>`;
    })
    .join('');

  const supplyHtml = showSupply
    ? `
      <div class="dq-panel">
        <span class="dq-panel-title">たびの しきゅうひん</span>
        <div class="dq-list-box">
          <div class="dq-cmd active">▶ 50ゴールド</div>
          <div class="dq-cmd">　 ひのきのぼう</div>
          <div class="dq-cmd">　 ぬののふく</div>
        </div>
      </div>
    `
    : '';

  return `
    <div class="dq-layout-row">
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('king', 92)}</div>
      ${supplyHtml}
    </div>
    ${bannerText ? `<div class="chest-aura-badge aura-gold">${escapeHtml(bannerText)}</div>` : ''}
    <div class="king-board">${slots}</div>
  `;
}

export async function runKingScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('throne');
  stage.setQuestLabel('おしろ・王様のまえ');
  audio.startBgm('field');

  let board = members.slice(0, 12);
  if (winner && !board.some((m) => m.id === winner.id)) {
    board[board.length - 1] = winner;
  }
  if (decoy && decoy.id !== 'dummy_decoy' && !board.some((m) => m.id === decoy.id) && board.length > 1) {
    board[0] = decoy;
  }

  const winnerIdx = winner ? board.findIndex((m) => m.id === winner.id) : -1;
  let decoyIdx = decoy ? board.findIndex((m) => m.id === decoy.id) : 0;
  if (decoyIdx < 0) decoyIdx = 0;

  stage.setVisualHtml(renderKingScene({ boardMembers: board, bannerText: `お題：${drawTitle}`, showSupply: true }));
  await stage.typeText(`おうさま「よくぞ きた！ 次の『${drawTitle}』を きめると しよう！\n旅のしきんは 50ゴールドと ひのきのぼう じゃ！」`, { pauseAfterMs: 550 });

  if (route === 'premier') {
    audio.playSe('confirm');
    stage.flash('gold');
    stage.setVisualHtml(renderKingScene({ boardMembers: board, rewrittenIdx: winnerIdx, bannerText: `決定：${winner.name}` }));
    await stage.typeText(`おうさま「今回の『${drawTitle}』は『${winner.name}』じゃ！\nよろしく たのんだぞ！」`, { pauseAfterMs: 650 });
    return;
  }

  const targetIdx = isSafe ? decoyIdx : route === 'reverse' ? decoyIdx : winnerIdx;
  const totalSteps = board.length + ((targetIdx + board.length) % board.length) + board.length;
  let current = 0;

  for (let step = 0; step <= totalSteps; step++) {
    stage.checkAborted();
    current = step % board.length;
    audio.playSe('cursor');
    stage.setVisualHtml(renderKingScene({ boardMembers: board, selectedIdx: current, bannerText: '王様が 名簿を みている…' }));
    const progress = step / totalSteps;
    const delay = progress < 0.65 ? 65 : progress < 0.88 ? 140 : 250;
    await stage.wait(delay);
  }

  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderKingScene({ boardMembers: board, selectedIdx: -1, bannerText: 'おうさま「……またの きかいに しよう」' }));
    await stage.typeText('おうさま「うむ、今回は だれも えらばず 見送ると しよう！」\n今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  if (route === 'reverse') {
    const fakeName = board[current].name;
    stage.setVisualHtml(renderKingScene({ boardMembers: board, decoyIdx: current, bannerText: `仮：${fakeName}` }));
    await stage.typeText(`おうさま「うむ！ 今回の『${drawTitle}』は『${fakeName}』に――」`, { pauseAfterMs: 520 });

    await stage.showCutin('名簿の 行が ずれていた！', 850);

    audio.playSe('confirm');
    stage.flash('gold');
    if (board.length > 1 && winnerIdx !== current) {
      let slide = current;
      const hops = (winnerIdx - current + board.length) % board.length || 1;
      for (let h = 1; h <= hops; h++) {
        slide = (current + h) % board.length;
        audio.playSe('cursor');
        stage.setVisualHtml(renderKingScene({ boardMembers: board, selectedIdx: slide, bannerText: '名簿を 読みなおしている…' }));
        await stage.wait(170);
      }
    }
    stage.setVisualHtml(renderKingScene({ boardMembers: board, rewrittenIdx: winnerIdx, bannerText: `決定：${winner.name}` }));
    await stage.typeText(`だいじん「王様、名簿を 1行 見まちがえております！」\nおうさま「おお すまん！ ほんとうは『${winner.name}』じゃった！」`, { pauseAfterMs: 650 });
    return;
  }

  audio.playSe('confirm');
  stage.flash('gold');
  stage.setVisualHtml(renderKingScene({ boardMembers: board, rewrittenIdx: winnerIdx, bannerText: `決定：${winner.name}` }));
  await stage.typeText(`おうさま「うむ！ 次の『${drawTitle}』は『${winner.name}』に まかせたぞ！」`, { pauseAfterMs: 600 });
}
