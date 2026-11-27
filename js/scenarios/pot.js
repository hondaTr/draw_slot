import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderPotScene({ rightSprite = 'pot', badge = 'だれかの いえ（勝手に入った）', aura = 'aura-wood', note = '', showVillager = false }) {
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
  stage.setQuestLabel('名もなき村・だれかの民家');
  audio.startBgm('field');

  stage.setVisualHtml(renderPotScene({ rightSprite: 'pot', badge: 'あいさつもせず 他人の家に入った', note: 'ツボが ならんでいる…' }));
  await stage.typeText('ゆうしゃは 知らない人の いえに かってに あがりこんだ！\n（RPGでは よくあること）', { pauseAfterMs: 650 });

  // プレミア：1個目のツボから一発
  if (route === 'premier') {
    audio.playSe('attack');
    stage.shake('light');
    audio.playSe('chest');
    stage.setVisualHtml(renderPotScene({
      rightSprite: 'scroll',
      badge: '1個目のツボを わった！',
      aura: 'aura-gold',
      note: `${winner.name} のメモ`,
    }));
    await stage.typeText(`ガシャン！ 1個目の ツボを わったら メモが でてきた！\n「次の ${drawTitle} は ${winner.name}」と かいてある！`, { pauseAfterMs: 800 });
    return;
  }

  // ツボを順番に割る
  audio.playSe('attack');
  stage.shake('light');
  stage.setVisualHtml(renderPotScene({ rightSprite: 'pot', badge: '1個目のツボ… ガシャン！', note: 'やくそう を みつけた！' }));
  await stage.typeText('ツボを もちあげて なげた！\nしかし 中身は「やくそう」だった。', { pauseAfterMs: 600 });

  audio.playSe('attack');
  stage.shake('light');
  stage.setVisualHtml(renderPotScene({ rightSprite: 'pot', badge: '2個目のツボ… ガシャン！', note: '5ゴールド を てにいれた！' }));
  await stage.typeText('つづいて となりの ツボも わった！\n5ゴールド を てにいれた！ ……まだ メモはない。', { pauseAfterMs: 650 });

  // セーフ：ちいさなメダルしか出ない
  if (isSafe) {
    audio.playSe('cursor');
    stage.setVisualHtml(renderPotScene({
      rightSprite: 'scroll',
      badge: 'タンスも かってに しらべた！',
      aura: 'aura-wood',
      note: 'ちいさな メダル（メモなし）',
    }));
    await stage.typeText('タンスの中まで くまなく しらべたが「ちいさな メダル」しか なかった！\nメモは みつからなかった！ 今回は ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：家主に怒られて外に出される → 外のタルから本命
  if (route === 'reverse') {
    audio.playSe('confirm');
    stage.setVisualHtml(renderPotScene({
      rightSprite: 'scroll',
      badge: 'タンスの 引き出しを しらべた！',
      aura: 'aura-gold',
      note: `メモ：${decoy.name} ？`,
    }));
    await stage.typeText(`タンスの おくから「${decoy.name}」の 名前メモを みつけた……！`, { pauseAfterMs: 700 });

    audio.playSe('encounter');
    stage.shake('light');
    stage.setVisualHtml(renderPotScene({
      rightSprite: 'pot',
      showVillager: true,
      badge: '家主「ちょっと まって！！」',
      aura: 'aura-red',
      note: 'ツボを わらないで ください！',
    }));
    await stage.typeText(`家主「ちょっと！ かってに 人のうちの ツボを わらないで ください！！」\n（めずらしく おこられた！）`, { pauseAfterMs: 750 });

    stage.setVisualHtml(renderPotScene({
      rightSprite: 'scroll',
      badge: '家の外にある タルを しらべた…',
      aura: 'aura-gold',
      note: `ほんとうのメモ：${winner.name}`,
    }));
    audio.playSe('chest');
    await stage.typeText(`おいだされた 家のまえの タルを なんとなく しらべたら…\n「ほんとうの ${drawTitle} は ${winner.name}」と かかれた メモを みつけた！`, { pauseAfterMs: 850 });
    return;
  }

  // 通常：タンスから発見
  audio.playSe('chest');
  stage.setVisualHtml(renderPotScene({
    rightSprite: 'scroll',
    badge: 'タンスの 中を しらべた！',
    aura: 'aura-gold',
    note: winner.name,
  }));
  await stage.typeText(`タンスの なかから おきわすれられた メモを みつけた！\n「今回の ${drawTitle}：${winner.name}」と かいてある！`, { pauseAfterMs: 800 });
}
