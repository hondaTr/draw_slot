import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

const COMMANDS = ['たたかう', 'じゅもん', 'どうぐ', 'にげる'];

function renderBossBattle({
  bossHp = 100,
  bossHit = false,
  bossGone = false,
  activeCmd = 0,
  partyStates = [],
  subLabel = '',
}) {
  const statusHtml = partyStates
    .map((p) => {
      const cls = p.dead ? 'is-dead' : p.warn ? 'is-warn' : p.active ? 'is-target' : '';
      return `
        <div class="dq-status-card ${cls}">
          <div class="dq-st-name">${escapeHtml(p.name)}</div>
          <div class="dq-st-row"><span>H</span><span>${p.dead ? '0' : p.hp}</span></div>
          <div class="dq-st-row"><span>M</span><span>${p.dead ? '0' : p.mp}</span></div>
          <div class="dq-st-row"><span>Lv</span><span>${p.lv}</span></div>
        </div>
      `;
    })
    .join('');

  const cmdHtml = COMMANDS.map((label, idx) => {
    const isAct = idx === activeCmd;
    return `<div class="dq-cmd ${isAct ? 'active' : ''}">${isAct ? '▶' : '　'} ${label}</div>`;
  }).join('');

  return `
    <div class="dq-status-bar">${statusHtml}</div>
    <div class="boss-hp-wrap">
      <div class="boss-hp-label"><span>まおう</span><span>HP ${bossHp}%</span></div>
      <div class="boss-hp-track"><div class="boss-hp-fill" style="width:${bossHp}%"></div></div>
    </div>
    <div class="dq-layout-row">
      <div class="dq-panel">
        <span class="dq-panel-title">コマンド</span>
        <div class="dq-command-box">${cmdHtml}</div>
      </div>
      <div class="sprite-wrap ${bossGone ? 'sprite-vanish' : bossHit ? 'sprite-hit' : 'sprite-float'}">
        ${getSpriteSvg('boss', 108)}
      </div>
    </div>
    ${subLabel ? `<div class="chest-aura-badge aura-gold">${escapeHtml(subLabel)}</div>` : ''}
  `;
}

export async function runBossScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('battle');
  stage.setQuestLabel('まおうのしろ・さいごのフロア');
  audio.playSe('encounter');

  const sampleParty = members.slice(0, 4).map((m, idx) => ({
    name: m.name,
    hp: 140 + idx * 12,
    mp: 32 + idx * 8,
    lv: 24 + idx,
    dead: false,
    warn: false,
    active: false,
  }));

  stage.setVisualHtml(renderBossBattle({ bossHp: 100, activeCmd: 0, partyStates: sampleParty, subLabel: 'まおうが あらわれた！' }));
  stage.shake('light');
  await stage.typeText(`まおうが あらわれた！\n「${drawTitle} を きめたければ わしを たおしてみよ！」`, { pauseAfterMs: 480 });

  audio.startBgm('battle');

  if (route === 'premier') {
    audio.playSe('critical');
    stage.flash('gold');
    stage.setVisualHtml(renderBossBattle({
      bossHp: 0,
      bossHit: true,
      activeCmd: 0,
      partyStates: sampleParty.map((p) => ({ ...p, active: p.name === winner.name })),
      subLabel: `${winner.name} の かいしんのいちげき！`,
    }));
    await stage.typeText(`1ターン目から「${winner.name}」の かいしんの いちげき！\nまおうを みごと うちたおした！`, { pauseAfterMs: 650 });
    return;
  }

  const rouletteNames = [...members.map((m) => m.name), decoy.name];
  for (let i = 0; i < 6; i++) {
    stage.checkAborted();
    const pick = rouletteNames[i % rouletteNames.length];
    audio.playSe('cursor');
    stage.setVisualHtml(renderBossBattle({
      bossHp: 100,
      activeCmd: i % 4,
      partyStates: sampleParty.map((p) => ({ ...p, active: p.name === pick })),
      subLabel: `${pick} の コマンドせんたく…`,
    }));
    await stage.wait(110 + i * 20);
  }

  if (isSafe) {
    audio.playSe('miss');
    const lowMpParty = sampleParty.map((p) => ({ ...p, mp: 0, warn: true }));
    stage.setVisualHtml(renderBossBattle({
      bossHp: 100,
      activeCmd: 1,
      partyStates: lowMpParty,
      subLabel: 'MPが たりない！',
    }));
    await stage.typeText(`「${decoy.name}」は ほのおの じゅもんを となえた！ ……しかし MPが たりない！`, { pauseAfterMs: 480 });

    audio.playSe('flee');
    stage.setVisualHtml(renderBossBattle({
      bossHp: 100,
      bossGone: true,
      activeCmd: 3,
      partyStates: lowMpParty,
      subLabel: 'まおうは さっていった',
    }));
    await stage.typeText('決着が つかないまま 戦闘は 終了した。\n今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  if (route === 'reverse') {
    stage.setVisualHtml(renderBossBattle({
      bossHp: 85,
      activeCmd: 0,
      partyStates: sampleParty,
      subLabel: `${decoy.name} の こうげき！`,
    }));
    audio.playSe('attack');
    await stage.typeText(`「${decoy.name}」の こうげき！ まおうに 1ダメージ！\nまおうの まもりが かたく、ダメージが とおらない！`, { pauseAfterMs: 480 });

    audio.stopBgm();
    audio.playSe('critical');
    stage.flash('red');
    stage.shake('heavy');
    const deadParty = sampleParty.map((p) => ({ ...p, dead: true }));
    stage.setVisualHtml(renderBossBattle({
      bossHp: 85,
      activeCmd: 3,
      partyStates: deadParty,
      subLabel: 'パーティは ぜんめつした…',
    }));
    audio.playSe('wipeout');
    await stage.typeText('まおうの こうげきで パーティは ぜんめつ した……\nしかし まだ ここで おわる わけには いかない！', { pauseAfterMs: 680 });

    stage.setBlackout(true);
    await stage.wait(400);
    stage.setTheme('church');
    stage.setQuestLabel('おうさまのまえ');
    stage.setBlackout(false);
    audio.playSe('revive');
    stage.setVisualHtml(`
      <div class="sprite-wrap sprite-float">${getSpriteSvg('church', 100)}</div>
      <div class="dq-panel"><span class="dq-panel-title">おうさま</span>おお ゆうしゃよ！ しんでしまうとは なにごとだ！</div>
    `);
    await stage.typeText('王の いのりによって パーティは よみがえった！', { pauseAfterMs: 500 });

    stage.setTheme('battle');
    audio.startBgm('battle');
    audio.playSe('critical');
    stage.flash('gold');
    stage.setVisualHtml(renderBossBattle({
      bossHp: 0,
      bossHit: true,
      activeCmd: 0,
      partyStates: sampleParty.map((p) => ({ ...p, active: p.name === winner.name })),
      subLabel: `${winner.name} の かいしんのいちげき！`,
    }));
    await stage.typeText(`再戦の いちげき！「${winner.name}」が まおうを うちたおした！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 650 });
    return;
  }

  audio.playSe('attack');
  stage.setVisualHtml(renderBossBattle({
    bossHp: 45,
    bossHit: true,
    activeCmd: 1,
    partyStates: sampleParty,
    subLabel: `${decoy.name} の じゅもん！`,
  }));
  await stage.typeText(`「${decoy.name}」の こうげきで まおうは 体勢を くずした！`, { pauseAfterMs: 480 });

  audio.playSe('critical');
  stage.flash('gold');
  stage.setVisualHtml(renderBossBattle({
    bossHp: 0,
    bossHit: true,
    activeCmd: 0,
    partyStates: sampleParty.map((p) => ({ ...p, active: p.name === winner.name })),
    subLabel: `${winner.name} の かいしんのいちげき！`,
  }));
  await stage.typeText(`そのスキに「${winner.name}」が かいしんの いちげき！\nまおうを たおし「${winner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 650 });
}
