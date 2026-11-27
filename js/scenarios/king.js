import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderKingScene({ boardMembers, selectedIdx = -1, decoyIdx = -1, rewrittenIdx = -1, bannerText = '' }) {
  const slots = boardMembers
    .map((m, idx) => {
      let cls = 'king-slot';
      if (idx === rewrittenIdx) cls += ' rewritten';
      else if (idx === decoyIdx) cls += ' decoy-hit';
      else if (idx === selectedIdx) cls += ' selected';
      return `<div class="${cls}">${escapeHtml(m.name)}</div>`;
    })
    .join('');

  return `
    <div class="scene-row">
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('king', 96)}</div>
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

  stage.setVisualHtml(renderKingScene({ boardMembers: board, bannerText: `お題：${drawTitle}` }));
  await stage.typeText(`おうさま「よくぞ きた！ 次の『${drawTitle}』を きめると しよう！」\n「なお 旅のしきんは 50ゴールドと ひのきのぼう じゃ！（少なっ）」`, { pauseAfterMs: 750 });

  // プレミア：会話連打で同じことをもう一度聞くあるある → 即決定
  if (route === 'premier') {
    audio.playSe('confirm');
    stage.flash('gold');
    stage.setVisualHtml(renderKingScene({ boardMembers: board, rewrittenIdx: winnerIdx, bannerText: `もういちど ききますか？ → いいえ` }));
    await stage.typeText(`おうさま「今回の『${drawTitle}』は『${winner.name}』じゃ！\n……わしの はなしを もういちど きくかね？」（Aボタン連打で 2回きいてしまった！）`, { pauseAfterMs: 850 });
    return;
  }

  const targetIdx = isSafe ? decoyIdx : route === 'reverse' ? decoyIdx : winnerIdx;
  const totalSteps = board.length * 2 + ((targetIdx + board.length) % board.length) + board.length;
  let current = 0;

  for (let step = 0; step <= totalSteps; step++) {
    stage.checkAborted();
    current = step % board.length;
    audio.playSe('cursor');
    stage.setVisualHtml(renderKingScene({ boardMembers: board, selectedIdx: current, bannerText: '王様が 名簿を みている…' }));
    const progress = step / totalSteps;
    const delay = progress < 0.65 ? 75 : progress < 0.88 ? 165 : 300;
    await stage.wait(delay);
  }

  // セーフ：王様が同じセリフを言うだけのNPC化
  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderKingScene({ boardMembers: board, selectedIdx: -1, bannerText: 'おうさま「きょうは いい てんきじゃのう」' }));
    await stage.typeText('おうさま「……きょうは いい てんきじゃのう」\n王様が 世間話しか しなくなった！ 今回は ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：老眼でとなりの人を見ていた（1コマ滑り）
  if (route === 'reverse') {
    const fakeName = board[current].name;
    stage.setVisualHtml(renderKingScene({ boardMembers: board, decoyIdx: current, bannerText: `仮：${fakeName} かな？` }));
    await stage.typeText(`おうさま「うむ！ 今回の『${drawTitle}』は『${fakeName}』に――」`, { pauseAfterMs: 750 });

    await stage.showCutin('ろうがんで みまちがえた！！', 1000);

    audio.playSe('confirm');
    stage.flash('gold');
    if (board.length > 1 && winnerIdx !== current) {
      let slide = current;
      const hops = (winnerIdx - current + board.length) % board.length || 1;
      for (let h = 1; h <= hops; h++) {
        slide = (current + h) % board.length;
        audio.playSe('cursor');
        stage.setVisualHtml(renderKingScene({ boardMembers: board, selectedIdx: slide, bannerText: 'めがねを かけなおした…' }));
        await stage.wait(210);
      }
    }
    stage.setVisualHtml(renderKingScene({ boardMembers: board, rewrittenIdx: winnerIdx, bannerText: `決定：${winner.name}` }));
    await stage.typeText(`だいじん「王様、めがねが ズレております！」\nおうさま「おっと すまん！ ほんとうは『${winner.name}』じゃった！！」`, { pauseAfterMs: 850 });
    return;
  }

  // 通常：確定
  audio.playSe('confirm');
  stage.flash('gold');
  stage.setVisualHtml(renderKingScene({ boardMembers: board, rewrittenIdx: winnerIdx, bannerText: `決定：${winner.name}` }));
  await stage.typeText(`おうさま「うむ！ 次の『${drawTitle}』は『${winner.name}』に まかせたぞ！」`, { pauseAfterMs: 800 });
}
