import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderVoyageScene({ enemy = null, shipState = 'float', badge = '海へ でよう', aura = 'aura-wood', caption = '' }) {
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

  stage.setVisualHtml(renderVoyageScene({ badge: '出航！ 宝の島を めざす', caption: `お題：${drawTitle}` }));
  await stage.typeText(`「${drawTitle}」を きめる 島を さがして 船で こぎだした！\n波を けって 未知の 海域へ すすんでいく！`, { pauseAfterMs: 520 });

  if (route === 'premier') {
    audio.playSe('upgrade');
    stage.flash('gold');
    stage.setVisualHtml(renderVoyageScene({
      enemy: 'chest_gold',
      badge: '追い風に のって 到着！',
      aura: 'aura-gold',
      caption: winner.name,
    }));
    await stage.typeText(`順風満帆で あっというまに 島に 到着！\nたてふだには「${winner.name}」と かいてあった！`, { pauseAfterMs: 650 });
    return;
  }

  await stage.wait(220);
  audio.playSe('step');
  stage.setVisualHtml(renderVoyageScene({
    badge: '海図を みて すすむ…',
    aura: 'aura-red',
    caption: isSafe ? '濃い 霧が たちこめてきた…' : `${decoy.name} の 方角へ…`,
  }));
  await stage.typeText('「海図では このあたりに 島が あるはずなのだが……」', { pauseAfterMs: 500 });

  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderVoyageScene({
      badge: '濃い霧で 前が みえない',
      aura: 'aura-wood',
      caption: 'いったん 港へ ひきかえした',
    }));
    await stage.typeText('濃い 霧に はばまれ、港へ ひきかえすことにした。\n今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  if (route === 'reverse') {
    audio.stopBgm();
    audio.playSe('encounter');
    stage.setTheme('battle');
    stage.shake('light');
    stage.setVisualHtml(renderVoyageScene({
      enemy: 'kraken',
      badge: 'クラーケンが あらわれた！',
      aura: 'aura-red',
      caption: 'おおきな 触手が 船に せまる！',
    }));
    await stage.typeText('巨大な クラーケンが 航路を ふさいだ！', { pauseAfterMs: 550 });

    audio.startBgm('battle');
    audio.playSe('critical');
    stage.flash('gold');
    stage.setVisualHtml(renderVoyageScene({
      enemy: 'chest_open_gold',
      badge: '海図を さかさまに もっていた！',
      aura: 'aura-gold',
      caption: winner.name,
    }));
    await stage.typeText(`クラーケンを 退けて 海図を みなおしたら さかさま だった！\n正しい 島に あった 旗には「${winner.name}」の 名が しるされていた！`, { pauseAfterMs: 650 });
    return;
  }

  audio.playSe('chest');
  stage.flash('gold');
  stage.setVisualHtml(renderVoyageScene({
    enemy: 'chest_gold',
    badge: '島に とうちゃく！',
    aura: 'aura-gold',
    caption: winner.name,
  }));
  await stage.typeText(`宝の島に とうちゃく！\nたてふだには「今回の ${drawTitle}：${winner.name}」と かいてあった！`, { pauseAfterMs: 600 });
}
