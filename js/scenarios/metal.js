import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderMetalScene({ monster = 'metal', monsterState = 'float', label = 'はぐれメタルが あらわれた！', attacker = '' }) {
  const spriteCls =
    monsterState === 'vanish'
      ? 'sprite-vanish'
      : monsterState === 'hit'
      ? 'sprite-hit'
      : 'sprite-float';

  return `
    <div class="chest-aura-badge aura-gold">${escapeHtml(label)}</div>
    <div class="scene-row">
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('hero', 94)}</div>
      <div class="sprite-wrap ${spriteCls}">${getSpriteSvg(monster, 108)}</div>
    </div>
    ${attacker ? `<div class="name-scroll-box">${escapeHtml(attacker)}</div>` : ''}
  `;
}

export async function runMetalScenario(ctx) {
  const { stage, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('metal');
  stage.setQuestLabel('メタルのめいきゅう');
  audio.playSe('encounter');

  const isKing = route === 'premier';
  const monsterType = isKing ? 'king_metal' : 'metal';
  const monsterName = isKing ? 'メタルキング' : 'はぐれメタル';

  stage.setVisualHtml(renderMetalScene({
    monster: monsterType,
    monsterState: 'float',
    label: `${monsterName} が あらわれた！`,
    attacker: 'にげるまえに たおしたい！',
  }));
  await stage.typeText(`${monsterName}が あらわれた！\n（たおせたら ${drawTitle} が きまるぞ！）`, { pauseAfterMs: 700 });

  audio.startBgm('battle');

  // プレミア：1ターン目まじん斬りが当たった！
  if (isKing) {
    await stage.typeText(`「${winner.name}」は いちかばちか まじん斬りを はなった！`, { pauseAfterMs: 600 });
    audio.playSe('critical');
    stage.flash('gold');
    stage.shake('light');
    stage.setVisualHtml(renderMetalScene({
      monster: 'king_metal',
      monsterState: 'hit',
      label: 'めずらしく あたった！！',
      attacker: `${winner.name} の かいしんのいちげき！`,
    }));
    await stage.typeText(`めったに 当たらない まじん斬りが あたった！！\n「${winner.name}」が メタルキングを たおして「${drawTitle}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  // 1手目：1ダメージ or ミス（あるある）
  stage.setVisualHtml(renderMetalScene({
    monster: 'metal',
    monsterState: 'float',
    label: 'こうげき！',
    attacker: `${decoy.name} の こうげき！`,
  }));
  audio.playSe('attack');
  await stage.wait(280);
  audio.playSe('miss');
  await stage.typeText(`「${decoy.name}」の こうげき！ ……${monsterName}に 1の ダメージ！\n（どくばり でも 1ダメージ…）`, { pauseAfterMs: 700 });

  // セーフ：お約束の即逃走
  if (isSafe) {
    audio.playSe('flee');
    stage.setVisualHtml(renderMetalScene({
      monster: 'metal',
      monsterState: 'vanish',
      label: 'お約束の 即逃走！',
      attacker: `${monsterName} は にげだした！`,
    }));
    await stage.typeText(`${monsterName}は 1ターン目に さっさと にげだした！\n（だいたい いつも こうなる！） 今回は ぜんいん セーフ！`, { pauseAfterMs: 850 });
    return;
  }

  // 逆転：にげだした！ → もう1ぴき のこっていた！（仲間B）
  if (route === 'reverse') {
    audio.playSe('flee');
    stage.setVisualHtml(renderMetalScene({
      monster: 'metal',
      monsterState: 'vanish',
      label: 'にげられた…！？',
      attacker: `${monsterName} は にげだした！`,
    }));
    await stage.typeText(`${monsterName}は にげだした！\n「あーあ、きょうも 経験値ゼロか…」と おもった そのとき！`, { pauseAfterMs: 850 });

    await stage.showCutin('はぐれメタルB が のこっていた！', 950);
    stage.setVisualHtml(renderMetalScene({
      monster: 'metal',
      monsterState: 'float',
      label: 'なぜか ようすを みている！',
      attacker: `${winner.name} の こうげき！`,
    }));
    await stage.typeText(`1ぴきだけ 逃げそびれて ようすを みていた！\nそこに「${winner.name}」の どくばりが きゅうしょに 刺さった！！`, { pauseAfterMs: 700 });
  } else {
    stage.setVisualHtml(renderMetalScene({
      monster: 'metal',
      monsterState: 'float',
      label: 'ようすを みている…',
      attacker: `${winner.name} の こうげき！`,
    }));
    await stage.typeText(`${monsterName}は なぜか にげずに ようすを みている！\n「${winner.name}」が きゅうしょを ねらった！`, { pauseAfterMs: 700 });
  }

  audio.playSe('critical');
  stage.flash('gold');
  stage.setVisualHtml(renderMetalScene({
    monster: 'metal',
    monsterState: 'hit',
    label: 'かいしんの いちげき！！',
    attacker: `${winner.name} が たおした！`,
  }));
  await stage.typeText(`かいしんの いちげき！！\n${monsterName}を たおし、「${winner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 800 });
}
