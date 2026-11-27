import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderVoyageScene({ enemy = null, shipState = 'float', badge = 'ふねで たびにでよう', aura = 'aura-wood', caption = '' }) {
  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(badge)}</div>
    <div class="scene-row">
      <div class="sprite-wrap ${shipState === 'vanish' ? 'sprite-vanish' : 'sprite-float'}">
        ${getSpriteSvg('ship', 104)}
      </div>
      ${enemy ? `<div class="sprite-wrap sprite-bounce">${getSpriteSvg(enemy, 104)}</div>` : ''}
    </div>
    ${caption ? `<div class="name-scroll-box">${escapeHtml(caption)}</div>` : ''}
  `;
}

export async function runVoyageScenario(ctx) {
  const { stage, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('metal');
  stage.setQuestLabel('うみの上・船のたび');
  audio.startBgm('field');

  stage.setVisualHtml(renderVoyageScene({ badge: 'ふねで 出発！', caption: `お題：${drawTitle}` }));
  await stage.typeText(`「${drawTitle}」を きめる 島を さがして 船で こぎだした！\n（……なぜか 海では 2歩あるくごとに エンカウントする！）`, { pauseAfterMs: 700 });

  // プレミア：ルーラで直接飛んで一発
  if (route === 'premier') {
    audio.playSe('upgrade');
    stage.flash('gold');
    stage.setVisualHtml(renderVoyageScene({
      enemy: 'chest_gold',
      badge: 'ルーラで ぴゅーん！',
      aura: 'aura-gold',
      caption: winner.name,
    }));
    await stage.typeText(`「めんどくさいから ルーラで いいじゃん！」\nいっしゅんで 島に 到着！ メモには「${winner.name}」と かいてあった！`, { pauseAfterMs: 850 });
    return;
  }

  // あるある：ちずを さかさまに もっていた！
  await stage.wait(280);
  audio.playSe('step');
  stage.setVisualHtml(renderVoyageScene({
    badge: 'ちずを 見ながら すすむ…',
    aura: 'aura-red',
    caption: isSafe ? 'あれ？ 島が ないぞ？' : `${decoy.name} 島についた…？`,
  }));
  await stage.typeText('「ちずでは このあたりに 島が あるはずなんだが……」', { pauseAfterMs: 650 });

  // セーフ：ルーラで頭ぶつけて帰還
  if (isSafe) {
    audio.playSe('miss');
    stage.shake('light');
    stage.setVisualHtml(renderVoyageScene({
      badge: 'ごつん！！',
      aura: 'aura-wood',
      caption: 'てんじょうに あたまを ぶつけた！',
    }));
    await stage.typeText('いったん 戻ろうとして 船室のなかで ルーラを となえたら\nてんじょうに あたまを ぶつけた！ 今回は ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：クラーケンに遭遇＋ちずが逆さまだった！
  if (route === 'reverse') {
    audio.stopBgm();
    audio.playSe('encounter');
    stage.setTheme('battle');
    stage.shake('light');
    stage.setVisualHtml(renderVoyageScene({
      enemy: 'kraken',
      badge: 'だいおういか が あらわれた！',
      aura: 'aura-red',
      caption: '海エンカウント ばっかりだ！',
    }));
    await stage.typeText('また エンカウント！ 今度は クラーケンが あらわれた！\n「トヘロス かけるの わすれてた〜！」', { pauseAfterMs: 750 });

    audio.startBgm('battle');
    audio.playSe('critical');
    stage.flash('gold');
    stage.setVisualHtml(renderVoyageScene({
      enemy: 'chest_open_gold',
      badge: 'ちずを さかさまに もっていた！',
      aura: 'aura-gold',
      caption: winner.name,
    }));
    await stage.typeText(`なんとか 撃退して ちずを よく見たら さかさま だった！\n正しい 島に ついたら「${winner.name}」の 旗が たっていた！`, { pauseAfterMs: 850 });
    return;
  }

  // 通常：宝の島に到着
  audio.playSe('chest');
  stage.flash('gold');
  stage.setVisualHtml(renderVoyageScene({
    enemy: 'chest_gold',
    badge: '島に ついた！',
    aura: 'aura-gold',
    caption: winner.name,
  }));
  await stage.typeText(`やっと 島に ついた！\nたてふだに「今回の ${drawTitle}：${winner.name}」と かいてあった！`, { pauseAfterMs: 800 });
}
