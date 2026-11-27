import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

const METAL_COMMANDS = ['たたかう', 'とくぎ', 'どうぐ', 'にげる'];

function renderMetalScene({
  monster = 'metal',
  monsterState = 'float',
  label = 'はぐれメタルが あらわれた！',
  partyStates = [],
  activeCmd = 0,
}) {
  const spriteCls =
    monsterState === 'vanish'
      ? 'sprite-vanish'
      : monsterState === 'hit'
      ? 'sprite-hit'
      : 'sprite-float';

  const statusHtml = partyStates
    .map((p) => `
      <div class="dq-status-card ${p.active ? 'is-target' : ''}">
        <div class="dq-st-name">${escapeHtml(p.name)}</div>
        <div class="dq-st-row"><span>H</span><span>${p.hp}</span></div>
        <div class="dq-st-row"><span>M</span><span>${p.mp}</span></div>
      </div>
    `)
    .join('');

  const cmdHtml = METAL_COMMANDS.map((c, idx) => {
    const isAct = idx === activeCmd;
    return `<div class="dq-cmd ${isAct ? 'active' : ''}">${isAct ? '▶' : '　'} ${c}</div>`;
  }).join('');

  return `
    <div class="dq-status-bar">${statusHtml}</div>
    <div class="dq-layout-row">
      <div class="dq-panel">
        <span class="dq-panel-title">コマンド</span>
        <div class="dq-command-box">${cmdHtml}</div>
      </div>
      <div class="sprite-wrap ${spriteCls}">${getSpriteSvg(monster, 108)}</div>
    </div>
    <div class="chest-aura-badge aura-gold">${escapeHtml(label)}</div>
  `;
}

export async function runMetalScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('metal');
  stage.setQuestLabel('メタルのめいきゅう');
  audio.playSe('encounter');

  const isKing = route === 'premier';
  const monsterType = isKing ? 'king_metal' : 'metal';
  const monsterName = isKing ? 'メタルキング' : 'はぐれメタル';

  const sampleParty = members.slice(0, 4).map((m, idx) => ({
    name: m.name,
    hp: 150 + idx * 10,
    mp: 24 + idx * 6,
    active: false,
  }));

  stage.setVisualHtml(renderMetalScene({
    monster: monsterType,
    monsterState: 'float',
    label: `${monsterName} が あらわれた！`,
    partyStates: sampleParty,
    activeCmd: 0,
  }));
  await stage.typeText(`${monsterName}が あらわれた！\nたおせたら「${drawTitle}」が きまるぞ！`, { pauseAfterMs: 480 });

  audio.startBgm('battle');

  if (isKing) {
    stage.setVisualHtml(renderMetalScene({
      monster: 'king_metal',
      monsterState: 'float',
      label: `${winner.name} の こんしんのいちげき！`,
      partyStates: sampleParty.map((p) => ({ ...p, active: p.name === winner.name })),
      activeCmd: 1,
    }));
    await stage.typeText(`「${winner.name}」は こんしんの いちげきを はなった！`, { pauseAfterMs: 420 });
    audio.playSe('critical');
    stage.flash('gold');
    stage.shake('light');
    stage.setVisualHtml(renderMetalScene({
      monster: 'king_metal',
      monsterState: 'hit',
      label: 'かいしんの いちげき！',
      partyStates: sampleParty.map((p) => ({ ...p, active: p.name === winner.name })),
      activeCmd: 1,
    }));
    await stage.typeText(`こんしんの いちげきが みごと あたった！\n「${winner.name}」が メタルキングを たおし「${drawTitle}」に きまった！`, { pauseAfterMs: 650 });
    return;
  }

  stage.setVisualHtml(renderMetalScene({
    monster: 'metal',
    monsterState: 'float',
    label: `${decoy.name} の こうげき！`,
    partyStates: sampleParty.map((p) => ({ ...p, active: p.name === decoy.name })),
    activeCmd: 0,
  }));
  audio.playSe('attack');
  await stage.wait(220);
  audio.playSe('miss');
  await stage.typeText(`「${decoy.name}」の こうげき！ ${monsterName}に 1の ダメージ！`, { pauseAfterMs: 480 });

  if (isSafe) {
    audio.playSe('flee');
    stage.setVisualHtml(renderMetalScene({
      monster: 'metal',
      monsterState: 'vanish',
      label: `${monsterName} は にげだした！`,
      partyStates: sampleParty,
      activeCmd: 3,
    }));
    await stage.typeText(`${monsterName}は すばやく にげだした！\n今回は ぜんいん セーフ！`, { pauseAfterMs: 650 });
    return;
  }

  if (route === 'reverse') {
    audio.playSe('flee');
    stage.setVisualHtml(renderMetalScene({
      monster: 'metal',
      monsterState: 'vanish',
      label: `${monsterName} は にげだした！`,
      partyStates: sampleParty,
      activeCmd: 3,
    }));
    await stage.typeText(`${monsterName}は にげだした！ ……と思われた そのとき！`, { pauseAfterMs: 550 });

    await stage.showCutin('はぐれメタルB が のこっていた！', 850);
    stage.setVisualHtml(renderMetalScene({
      monster: 'metal',
      monsterState: 'float',
      label: 'はぐれメタルB は ようすを みている！',
      partyStates: sampleParty.map((p) => ({ ...p, active: p.name === winner.name })),
      activeCmd: 1,
    }));
    await stage.typeText(`もう1ぴきが 逃げそびれて ようすを みていた！\n「${winner.name}」が すかさず きゅうしょを ついた！`, { pauseAfterMs: 500 });
  } else {
    stage.setVisualHtml(renderMetalScene({
      monster: 'metal',
      monsterState: 'float',
      label: `${monsterName} は ようすを みている…`,
      partyStates: sampleParty.map((p) => ({ ...p, active: p.name === winner.name })),
      activeCmd: 1,
    }));
    await stage.typeText(`${monsterName}は ようすを みている！\n「${winner.name}」が するどい いちげきを はなった！`, { pauseAfterMs: 480 });
  }

  audio.playSe('critical');
  stage.flash('gold');
  stage.setVisualHtml(renderMetalScene({
    monster: 'metal',
    monsterState: 'hit',
    label: `${winner.name} の かいしんの いちげき！`,
    partyStates: sampleParty.map((p) => ({ ...p, active: p.name === winner.name })),
    activeCmd: 1,
  }));
  await stage.typeText(`かいしんの いちげき！\n${monsterName}を たおし、「${winner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 600 });
}
