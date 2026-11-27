import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderChestScene({ chestSprite = 'chest_wood', auraClass = 'aura-wood', auraLabel = '木の宝箱', banner = '' }) {
  return `
    <div class="scene-row">
      <div class="sprite-wrap sprite-bounce">
        ${getSpriteSvg('hero', 96)}
      </div>
      <div class="sprite-wrap ${chestSprite === 'chest_rainbow' ? 'sprite-glow-rainbow sprite-float' : chestSprite === 'chest_gold' ? 'sprite-glow-gold' : ''}">
        ${getSpriteSvg(chestSprite, 108)}
      </div>
    </div>
    ${auraLabel ? `<div class="chest-aura-badge ${auraClass}">${escapeHtml(auraLabel)}</div>` : ''}
    ${banner ? `<div class="name-scroll-box">${escapeHtml(banner)}</div>` : ''}
  `;
}

export async function runTreasureScenario(ctx) {
  const { stage, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('dungeon');
  stage.setQuestLabel('ダンジョンのおく・宝箱のまえ');
  audio.startBgm('field');

  stage.setVisualHtml(`
    <div class="scene-row">
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('hero', 100)}</div>
    </div>
  `);
  audio.playSe('step');
  await stage.typeText(`ゆうしゃは「${drawTitle}」を きめるため\n洞窟の おくへ すすんだ。`, { pauseAfterMs: 600 });

  audio.playSe('step');
  stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_wood', auraClass: 'aura-wood', auraLabel: '宝箱を みつけた！' }));
  await stage.typeText('行き止まりに ひとつの 宝箱が おいてあった！', { pauseAfterMs: 650 });

  // プレミア：実はカギがいらずそのまま開く
  if (route === 'premier') {
    audio.playSe('chest');
    stage.flash('gold');
    stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_rainbow', auraClass: 'aura-rainbow', auraLabel: 'かぎが かかっていない！', banner: winner.name }));
    await stage.typeText(`ゆうしゃは 宝箱を あけた！\nめずらしく わなも かぎも なく「${winner.name}」の名前が そのまま 入っていた！`, { pauseAfterMs: 850 });
    return;
  }

  // いったん「もちものが いっぱい」あるある！
  await stage.wait(300);
  stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_red', auraClass: 'aura-red', auraLabel: 'しかし もちものが いっぱいだった！' }));
  audio.playSe('miss');
  await stage.typeText('ゆうしゃは 宝箱を あけた！ ……しかし もちものが いっぱいだった！\nしかたなく「やくそう」を 1つ すてて もういちど あけた！', { pauseAfterMs: 750 });

  // セーフ：だれか先にあけていて空っぽ
  if (isSafe) {
    audio.playSe('chest');
    stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_empty', auraClass: 'aura-wood', auraLabel: 'からっぽ だった…', banner: '（なにも はいっていない）' }));
    await stage.typeText('……なんと 宝箱は からっぽ だった！\nもう だれかが さきに あけた あとだったようだ！ 今回は ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：ひとくいばこ（ミミック）だった！
  if (route === 'reverse') {
    audio.playSe('chest');
    stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_open_gold', auraClass: 'aura-gold', auraLabel: 'なかに入っていたのは…', banner: decoy.name }));
    await stage.typeText(`宝箱の なかには「${decoy.name}」の 名前が みえた……！`, { pauseAfterMs: 850 });

    audio.stopBgm();
    audio.playSe('encounter');
    stage.setTheme('battle');
    stage.shake('heavy');
    stage.setVisualHtml(`
      <div class="scene-row">
        <div class="sprite-wrap">${getSpriteSvg('hero', 92)}</div>
        <div class="sprite-wrap sprite-shake">${getSpriteSvg('mimic', 112)}</div>
      </div>
      <div class="chest-aura-badge aura-red">なんと 宝箱は ひとくいばこ だった！！</div>
    `);
    await stage.typeText(`なんと！「${decoy.name}」に みえたのは ひとくいばこ（ミミック）だった！\n（インパス を かけわすれていた！）`, { pauseAfterMs: 750 });

    audio.startBgm('battle');
    audio.playSe('critical');
    stage.flash('white');
    stage.setVisualHtml(`
      <div class="scene-row">
        <div class="sprite-wrap sprite-bounce">${getSpriteSvg('hero', 96)}</div>
        <div class="sprite-wrap sprite-hit">${getSpriteSvg('mimic', 100)}</div>
      </div>
    `);
    await stage.typeText('ザラキが くるまえに なんとか ひとくいばこを たおした！', { pauseAfterMs: 650 });

    audio.stopBgm();
    stage.setTheme('dungeon');
    audio.playSe('chest');
    stage.flash('gold');
    stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_open_gold', auraClass: 'aura-gold', auraLabel: 'ほんものの 紙きれを おとした！', banner: winner.name }));
    await stage.typeText(`ひとくいばこが おとした 紙きれには「${winner.name}」と かかれていた！\nほんとうの「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  // 通常：めでたく発見
  audio.playSe('chest');
  stage.flash('gold');
  stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_open_gold', auraClass: 'aura-gold', auraLabel: 'なかみを みつけた！', banner: winner.name }));
  await stage.typeText(`宝箱の なかから「${winner.name}」と かかれた 紙きれを みつけた！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 800 });
}
