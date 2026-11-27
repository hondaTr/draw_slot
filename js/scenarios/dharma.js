import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderDharmaScene({ badge = 'ダーマの神殿', candidate = '？？？', aura = 'aura-wood', priestGlow = false }) {
  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(badge)}</div>
    <div class="scene-row">
      <div class="sprite-wrap ${priestGlow ? 'sprite-glow-gold sprite-float' : 'sprite-bounce'}">
        ${getSpriteSvg('priest', 104)}
      </div>
      <div class="sprite-wrap sprite-bounce">
        ${getSpriteSvg('hero', 92)}
      </div>
    </div>
    <div class="name-scroll-box">${escapeHtml(candidate)}</div>
  `;
}

export async function runDharmaScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('church');
  stage.setQuestLabel('ダーマの神殿');
  audio.startBgm('field');

  stage.setVisualHtml(renderDharmaScene({ badge: '転職のカウンター', candidate: 'つぎの かた どうぞ〜' }));
  await stage.typeText(`しんかん「ダーマの神殿へ ようこそ！ どの職業……ではなく『${drawTitle}』に てんしょく しますか？」`, { pauseAfterMs: 700 });

  // プレミア：あそびにんだけはレベル不問でなれるあるある
  if (route === 'premier') {
    audio.playSe('upgrade');
    stage.flash('gold');
    stage.setVisualHtml(renderDharmaScene({
      badge: '「あそびにん」なら すぐ なれる！',
      candidate: winner.name,
      aura: 'aura-gold',
      priestGlow: true,
    }));
    await stage.typeText(`しんかん「あ、ごめんなさい。いま 空いてるのが『${drawTitle}』だけなんです！」\nというわけで「${winner.name}」が すんなり 決定した！`, { pauseAfterMs: 850 });
    return;
  }

  const pool = members.length > 0 ? members : [decoy];
  for (let i = 0; i < 7; i++) {
    stage.checkAborted();
    const m = pool[i % pool.length];
    audio.playSe('cursor');
    stage.setVisualHtml(renderDharmaScene({
      badge: '名簿を めくっている…',
      candidate: m.name,
      aura: 'aura-red',
    }));
    await stage.wait(130 + i * 24);
  }

  // セーフ：きょうは ゆうきゅうきゅうか
  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderDharmaScene({
      badge: '神殿の シャッターが しまった',
      candidate: '本日は ゆうきゅうきゅうか',
      aura: 'aura-wood',
    }));
    await stage.typeText('しんかん「あ、5時になったので きょうの 受付は おしまいです！」\nなんと 神殿が 閉まってしまった！ 今回は ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：レベル20に たりません！
  if (route === 'reverse') {
    stage.setVisualHtml(renderDharmaScene({
      badge: '転職の手続き中…',
      candidate: decoy.name,
      aura: 'aura-gold',
    }));
    await stage.typeText(`しんかん「はい、『${decoy.name}』さんを『${drawTitle}』に――」`, { pauseAfterMs: 700 });

    audio.playSe('miss');
    stage.setVisualHtml(renderDharmaScene({
      badge: 'レベル19だった！（あと1！）',
      candidate: `${decoy.name} → レベル20に たりません！`,
      aura: 'aura-red',
    }));
    await stage.typeText(`しんかん「おっと、『${decoy.name}』さんは レベル19ですね！ 20に たりません！」\n（あるある！ レベル1つ たりない！）`, { pauseAfterMs: 750 });

    await stage.showCutin('では レベル20いじょうの かた！', 950);
    audio.playSe('revive');
    stage.flash('gold');
    stage.setVisualHtml(renderDharmaScene({
      badge: 'ちょうど レベル20 だった！',
      candidate: winner.name,
      aura: 'aura-gold',
      priestGlow: true,
    }));
    await stage.typeText(`しんかん「後ろに ならんでいた『${winner.name}』さんは レベル20ですね！ 決定です！」\nこうして「${winner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  // 通常
  audio.playSe('revive');
  stage.flash('gold');
  stage.setVisualHtml(renderDharmaScene({
    badge: 'てんしょく せいこう！',
    candidate: winner.name,
    aura: 'aura-gold',
    priestGlow: true,
  }));
  await stage.typeText(`しんかん「おめでとうございます！『${winner.name}』さんは『${drawTitle}』に なりました！」`, { pauseAfterMs: 800 });
}
