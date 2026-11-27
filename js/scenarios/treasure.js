import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderChestScene({
  chestSprite = 'chest_wood',
  auraClass = 'aura-wood',
  auraLabel = '宝箱',
  banner = '',
  showItems = false,
  dropItemIdx = 0,
  showFieldCmd = false,
}) {
  const items = ['やくそう', 'ひのきのぼう', 'せいすい', 'たいまつ'];
  const itemsHtml = showItems
    ? `
      <div class="dq-panel">
        <span class="dq-panel-title">どうぐ</span>
        <div class="dq-list-box">
          ${items.map((it, i) => `<div class="dq-cmd ${i === dropItemIdx ? 'active' : ''}">${i === dropItemIdx ? '▶' : '　'} ${it}</div>`).join('')}
        </div>
      </div>
    `
    : '';

  const cmdHtml = showFieldCmd
    ? `
      <div class="dq-panel">
        <span class="dq-panel-title">コマンド</span>
        <div class="dq-list-box">
          <div class="dq-cmd active">▶ しらべる</div>
          <div class="dq-cmd">　 じゅもん</div>
          <div class="dq-cmd">　 どうぐ</div>
        </div>
      </div>
    `
    : '';

  return `
    <div class="dq-layout-row">
      ${cmdHtml}
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('hero', 90)}</div>
      <div class="sprite-wrap ${chestSprite === 'chest_rainbow' ? 'sprite-glow-rainbow sprite-float' : chestSprite === 'chest_gold' ? 'sprite-glow-gold' : ''}">
        ${getSpriteSvg(chestSprite, 102)}
      </div>
      ${itemsHtml}
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
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('hero', 96)}</div>
    </div>
  `);
  audio.playSe('step');
  await stage.typeText(`ゆうしゃは「${drawTitle}」を きめるため\n洞窟の おくへ すすんだ。`, { pauseAfterMs: 480 });

  audio.playSe('step');
  stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_wood', auraClass: 'aura-wood', auraLabel: '宝箱を みつけた！', showFieldCmd: true }));
  await stage.typeText('行き止まりに ひとつの 宝箱が おいてあった！\nゆうしゃは ▶「しらべる」を えらんだ！', { pauseAfterMs: 520 });

  if (route === 'premier') {
    audio.playSe('chest');
    stage.flash('gold');
    stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_rainbow', auraClass: 'aura-rainbow', auraLabel: 'かぎが かかっていない！', banner: winner.name }));
    await stage.typeText(`ゆうしゃは 宝箱を あけた！\nめずらしく わなも かぎも なく「${winner.name}」の名前が そのまま 入っていた！`, { pauseAfterMs: 650 });
    return;
  }

  await stage.wait(220);
  stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_red', auraClass: 'aura-red', auraLabel: 'しかし もちものが いっぱいだった！', showItems: true, dropItemIdx: 0 }));
  audio.playSe('miss');
  await stage.typeText('しかし もちものが いっぱいだった！\n▶「やくそう」を すてて もういちど あけた！', { pauseAfterMs: 550 });

  if (isSafe) {
    audio.playSe('chest');
    stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_empty', auraClass: 'aura-wood', auraLabel: 'からっぽ だった…', banner: 'なにも はいっていない' }));
    await stage.typeText('……なんと 宝箱は からっぽ だった！\nもう だれかが さきに あけた あとだったようだ！ 今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  if (route === 'reverse') {
    audio.playSe('chest');
    stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_open_gold', auraClass: 'aura-gold', auraLabel: 'なかに入っていたのは…', banner: decoy.name }));
    await stage.typeText(`宝箱の なかには「${decoy.name}」の 名前が みえた……！`, { pauseAfterMs: 600 });

    audio.stopBgm();
    audio.playSe('encounter');
    stage.setTheme('battle');
    stage.shake('heavy');
    stage.setVisualHtml(`
      <div class="dq-layout-row">
        <div class="dq-panel">
          <span class="dq-panel-title">コマンド</span>
          <div class="dq-command-box">
            <div class="dq-cmd active">▶ たたかう</div>
            <div class="dq-cmd">　 じゅもん</div>
            <div class="dq-cmd">　 どうぐ</div>
            <div class="dq-cmd">　 にげる</div>
          </div>
        </div>
        <div class="sprite-wrap sprite-shake">${getSpriteSvg('mimic', 108)}</div>
      </div>
      <div class="chest-aura-badge aura-red">ひとくいばこ が あらわれた！</div>
    `);
    await stage.typeText(`なんと！「${decoy.name}」に みえたのは ひとくいばこ だった！`, { pauseAfterMs: 580 });

    audio.startBgm('battle');
    audio.playSe('critical');
    stage.flash('white');
    stage.setVisualHtml(`
      <div class="scene-row">
        <div class="sprite-wrap sprite-bounce">${getSpriteSvg('hero', 92)}</div>
        <div class="sprite-wrap sprite-hit">${getSpriteSvg('mimic', 96)}</div>
      </div>
    `);
    await stage.typeText('ゆうしゃの かいしんの いちげきで ひとくいばこを うちたおした！', { pauseAfterMs: 520 });

    audio.stopBgm();
    stage.setTheme('dungeon');
    audio.playSe('chest');
    stage.flash('gold');
    stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_open_gold', auraClass: 'aura-gold', auraLabel: 'ほんものの 紙きれを おとした！', banner: winner.name }));
    await stage.typeText(`ひとくいばこが おとした 紙きれには「${winner.name}」と かかれていた！\nほんとうの「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 650 });
    return;
  }

  audio.playSe('chest');
  stage.flash('gold');
  stage.setVisualHtml(renderChestScene({ chestSprite: 'chest_open_gold', auraClass: 'aura-gold', auraLabel: 'なかみを みつけた！', banner: winner.name }));
  await stage.typeText(`宝箱の なかから「${winner.name}」と かかれた 紙きれを みつけた！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 600 });
}
