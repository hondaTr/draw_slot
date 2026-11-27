import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderPotScene({ rightSprite = 'pot', badge = 'だれかの いえ', aura = 'aura-wood', note = '', showVillager = false }) {
  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(badge)}</div>
    <div class="scene-row">
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('hero', 92)}</div>
      <div class="sprite-wrap">${getSpriteSvg(rightSprite, 96)}</div>
      ${showVillager ? `<div class="sprite-wrap sprite-shake">${getSpriteSvg('villager', 92)}</div>` : ''}
    </div>
    ${note ? `<div class="name-scroll-box">${escapeHtml(note)}</div>` : ''}
  `;
}

export async function runPotScenario(ctx) {
  const { stage, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('field');
  stage.setQuestLabel('名もなき村・民家');
  audio.startBgm('field');

  stage.setVisualHtml(renderPotScene({ rightSprite: 'pot', badge: '民家に はいった', note: 'ツボが ならんでいる' }));
  await stage.typeText('ゆうしゃは 村の 民家に あがりこんだ。', { pauseAfterMs: 450 });

  if (route === 'premier') {
    audio.playSe('attack');
    stage.shake('light');
    audio.playSe('chest');
    stage.setVisualHtml(renderPotScene({
      rightSprite: 'scroll',
      badge: '1個目のツボを わった！',
      aura: 'aura-gold',
      note: winner.name,
    }));
    await stage.typeText(`ガシャン！ 1個目の ツボから メモが でてきた！\n「今回の ${drawTitle}：${winner.name}」と かいてある！`, { pauseAfterMs: 650 });
    return;
  }

  audio.playSe('attack');
  stage.shake('light');
  stage.setVisualHtml(renderPotScene({ rightSprite: 'pot', badge: '1個目のツボ… ガシャン！', note: 'やくそう を みつけた' }));
  await stage.typeText('ツボを わった！ ……中身は「やくそう」だった。', { pauseAfterMs: 450 });

  audio.playSe('attack');
  stage.shake('light');
  stage.setVisualHtml(renderPotScene({ rightSprite: 'pot', badge: '2個目のツボ… ガシャン！', note: '5ゴールド を てにいれた' }));
  await stage.typeText('となりの ツボも わった！ 5ゴールド を てにいれた！', { pauseAfterMs: 450 });

  if (isSafe) {
    audio.playSe('cursor');
    stage.setVisualHtml(renderPotScene({
      rightSprite: 'scroll',
      badge: 'タンスの 中を しらべた',
      aura: 'aura-wood',
      note: 'ちいさな メダル',
    }));
    await stage.typeText('タンスからは「ちいさな メダル」しか 見つからなかった。\n今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  if (route === 'reverse') {
    audio.playSe('confirm');
    stage.setVisualHtml(renderPotScene({
      rightSprite: 'scroll',
      badge: 'タンスの 引き出しを しらべた',
      aura: 'aura-gold',
      note: `メモ：${decoy.name} ？`,
    }));
    await stage.typeText(`タンスの おくから「${decoy.name}」の メモを みつけた……！`, { pauseAfterMs: 520 });

    audio.playSe('encounter');
    stage.shake('light');
    stage.setVisualHtml(renderPotScene({
      rightSprite: 'pot',
      showVillager: true,
      badge: '家主「かってに ツボを わらないでください！」',
      aura: 'aura-red',
      note: 'おいだされて しまった！',
    }));
    await stage.typeText('家主「ちょっと！ かってに 人のうちの ツボを わらないで ください！」', { pauseAfterMs: 580 });

    stage.setVisualHtml(renderPotScene({
      rightSprite: 'scroll',
      badge: '家の外の タルを しらべた…',
      aura: 'aura-gold',
      note: winner.name,
    }));
    audio.playSe('chest');
    await stage.typeText(`おいだされた 家のまえの タルから ほんとうの メモを みつけた！\n「今回の ${drawTitle}：${winner.name}」と かいてある！`, { pauseAfterMs: 650 });
    return;
  }

  audio.playSe('chest');
  stage.setVisualHtml(renderPotScene({
    rightSprite: 'scroll',
    badge: 'タンスの 中を しらべた！',
    aura: 'aura-gold',
    note: winner.name,
  }));
  await stage.typeText(`タンスから メモを みつけた！\n「今回の ${drawTitle}：${winner.name}」と かいてある！`, { pauseAfterMs: 600 });
}
