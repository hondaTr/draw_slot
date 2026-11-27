import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderDharmaScene({
  badge = 'ダーマの神殿',
  candidate = '？？？',
  aura = 'aura-wood',
  priestGlow = false,
  drawTitle = '幹事',
  jobIdx = 4,
}) {
  const jobs = ['せんし', 'ぶとうか', 'まほうつかい', 'あそびにん', drawTitle];
  const jobHtml = jobs
    .map((j, idx) => `<div class="dq-cmd ${idx === jobIdx ? 'active' : ''}">${idx === jobIdx ? '▶' : '　'} ${escapeHtml(j)}</div>`)
    .join('');

  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(badge)}</div>
    <div class="dq-layout-row">
      <div class="sprite-wrap ${priestGlow ? 'sprite-glow-gold sprite-float' : 'sprite-bounce'}">
        ${getSpriteSvg('priest', 98)}
      </div>
      <div class="dq-panel">
        <span class="dq-panel-title">てんしょくさき</span>
        <div class="dq-list-box">${jobHtml}</div>
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

  stage.setVisualHtml(renderDharmaScene({ badge: '転職の祭壇', candidate: '神殿の光が ゆれている…', drawTitle, jobIdx: 4 }));
  await stage.typeText(`しんかん「ダーマの神殿へ ようこそ！ 新たな『${drawTitle}』への 転身を とりおこないます。」`, { pauseAfterMs: 500 });

  if (route === 'premier') {
    audio.playSe('upgrade');
    stage.flash('gold');
    stage.setVisualHtml(renderDharmaScene({
      badge: '条件を みたした！',
      candidate: winner.name,
      aura: 'aura-gold',
      priestGlow: true,
      drawTitle,
      jobIdx: 4,
    }));
    await stage.typeText(`「${winner.name}」の まえに 光の柱が おりてきた！\nしんかん「おめでとう！『${winner.name}』が『${drawTitle}』に きまりました！」`, { pauseAfterMs: 650 });
    return;
  }

  const pool = members.length > 0 ? members : [decoy];
  for (let i = 0; i < 6; i++) {
    stage.checkAborted();
    const m = pool[i % pool.length];
    audio.playSe('cursor');
    stage.setVisualHtml(renderDharmaScene({
      badge: '適性を しらべている…',
      candidate: m.name,
      aura: 'aura-red',
      drawTitle,
      jobIdx: i < 4 ? i : 4,
    }));
    await stage.wait(110 + i * 20);
  }

  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderDharmaScene({
      badge: '力が まだ たりないようだ',
      candidate: 'また 出直そう',
      aura: 'aura-wood',
      drawTitle,
      jobIdx: 4,
    }));
    await stage.typeText('しんかん「いまは だれも 転身の条件を みたしていないようです。」\n今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  if (route === 'reverse') {
    stage.setVisualHtml(renderDharmaScene({
      badge: '転職の儀 開始',
      candidate: decoy.name,
      aura: 'aura-gold',
      drawTitle,
      jobIdx: 4,
    }));
    await stage.typeText(`しんかん「では『${decoy.name}』さんを『${drawTitle}』に――」`, { pauseAfterMs: 480 });

    audio.playSe('miss');
    stage.setVisualHtml(renderDharmaScene({
      badge: 'レベル19だった！',
      candidate: `${decoy.name} → レベル20に たりません！`,
      aura: 'aura-red',
      drawTitle,
      jobIdx: 4,
    }));
    await stage.typeText(`しんかん「おっと、『${decoy.name}』さんは レベル19ですね！ あと1 たりません！」`, { pauseAfterMs: 520 });

    await stage.showCutin('レベル20いじょうの かたを 発見！', 850);
    audio.playSe('revive');
    stage.flash('gold');
    stage.setVisualHtml(renderDharmaScene({
      badge: '条件クリア！',
      candidate: winner.name,
      aura: 'aura-gold',
      priestGlow: true,
      drawTitle,
      jobIdx: 4,
    }));
    await stage.typeText(`しんかん「うしろにいた『${winner.name}』さんが ちょうど レベル20でした！」\n「${winner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 650 });
    return;
  }

  audio.playSe('revive');
  stage.flash('gold');
  stage.setVisualHtml(renderDharmaScene({
    badge: 'てんしょく せいこう！',
    candidate: winner.name,
    aura: 'aura-gold',
    priestGlow: true,
    drawTitle,
    jobIdx: 4,
  }));
  await stage.typeText(`しんかん「おめでとうございます！『${winner.name}』さんが『${drawTitle}』に きまりました！」`, { pauseAfterMs: 600 });
}
