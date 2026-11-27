import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderBossBattle({ bossHp = 100, bossHit = false, bossGone = false, targetName = 'コマンド？', partyStates = [] }) {
  const cards = partyStates
    .map((p) => {
      const cls = p.dead ? 'dead' : p.active ? 'active-target' : '';
      return `<div class="mini-status-card ${cls}">${escapeHtml(p.name)}<br><small>${p.dead ? 'しに' : 'げんき'}</small></div>`;
    })
    .join('');

  return `
    <div class="boss-hp-wrap">
      <div class="boss-hp-label"><span>まおう</span><span>HP ${bossHp}%</span></div>
      <div class="boss-hp-track"><div class="boss-hp-fill" style="width:${bossHp}%"></div></div>
    </div>
    <div class="scene-row">
      <div class="sprite-wrap">${getSpriteSvg('hero', 88)}</div>
      <div class="sprite-wrap ${bossGone ? 'sprite-vanish' : bossHit ? 'sprite-hit' : 'sprite-float'}">
        ${getSpriteSvg('boss', 112)}
      </div>
    </div>
    <div class="name-scroll-box">${escapeHtml(targetName)}</div>
    <div class="party-status-row">${cards}</div>
  `;
}

export async function runBossScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('battle');
  stage.setQuestLabel('まおうのしろ・さいごのフロア');
  audio.playSe('encounter');

  const sampleParty = members.slice(0, 4).map((m) => ({ name: m.name, dead: false, active: false }));

  stage.setVisualHtml(renderBossBattle({ bossHp: 100, targetName: 'まおう が あらわれた！', partyStates: sampleParty }));
  stage.shake('light');
  await stage.typeText(`まおうが あらわれた！\n「よく きたな！ ${drawTitle} を きめたければ わしを たおしてみよ！」`, { pauseAfterMs: 700 });

  audio.startBgm('battle');

  // プレミア：つうこんのいちげき…じゃなく「にげだした」と思わせて味方の会心
  if (route === 'premier') {
    audio.playSe('critical');
    stage.flash('gold');
    stage.setVisualHtml(renderBossBattle({ bossHp: 0, bossHit: true, targetName: `${winner.name} の かいしんのいちげき！`, partyStates: sampleParty }));
    await stage.typeText(`1ターン目から「${winner.name}」の かいしんの いちげき！！\n（なんと まおうは まだ しゃべりおわっていなかった！）`, { pauseAfterMs: 850 });
    return;
  }

  // あるある：にげる → まわりこまれる ／ MPがたりない
  await stage.typeText('まずは ようすを みるため ▶「にげる」を えらんだ！\n……しかし まわりこまれて しまった！', { pauseAfterMs: 650 });

  const rouletteNames = [...members.map((m) => m.name), decoy.name];
  for (let i = 0; i < 8; i++) {
    stage.checkAborted();
    const pick = rouletteNames[i % rouletteNames.length];
    audio.playSe('cursor');
    stage.setVisualHtml(renderBossBattle({ bossHp: 100, targetName: `${pick} の こうどう`, partyStates: sampleParty }));
    await stage.wait(110 + i * 20);
  }

  // セーフ：「しかし なにも おこらなかった」
  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderBossBattle({ bossHp: 100, targetName: 'MPが たりない！', partyStates: sampleParty }));
    await stage.typeText(`「${decoy.name}」は メラゾーマを となえた！ ……しかし MPが たりない！`, { pauseAfterMs: 650 });

    audio.playSe('flee');
    stage.setVisualHtml(renderBossBattle({ bossHp: 100, bossGone: true, targetName: 'まおうは ようすを みている…', partyStates: sampleParty }));
    await stage.typeText('おたがい グダグダになって 戦闘が おわってしまった！\n今回は ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：全滅 → セーブわすれてた！？ → 教会で復活
  if (route === 'reverse') {
    stage.setVisualHtml(renderBossBattle({ bossHp: 85, targetName: `${decoy.name} の こうげき！`, partyStates: sampleParty }));
    audio.playSe('attack');
    await stage.typeText(`「${decoy.name}」の こうげき！ ……まおうに 1ダメージ！\n（ぶきを そうびしわすれていた！）`, { pauseAfterMs: 700 });

    audio.stopBgm();
    audio.playSe('critical');
    stage.flash('red');
    stage.shake('heavy');
    const deadParty = sampleParty.map((p) => ({ ...p, dead: true }));
    stage.setVisualHtml(renderBossBattle({ bossHp: 85, targetName: 'ぜんめつ した…', partyStates: deadParty }));
    audio.playSe('wipeout');
    await stage.typeText('まおうの こうげきで パーティは ぜんめつ した……\n（しまった！ 3時間まえから セーブしてない！！）', { pauseAfterMs: 950 });

    stage.setBlackout(true);
    await stage.wait(500);
    stage.setTheme('church');
    stage.setQuestLabel('おうさまのまえ（もどされた）');
    stage.setBlackout(false);
    audio.playSe('revive');
    stage.setVisualHtml(`
      <div class="sprite-wrap sprite-float">${getSpriteSvg('church', 104)}</div>
      <div class="name-scroll-box">おお ゆうしゃよ しんでしまうとは なにごとだ！</div>
    `);
    await stage.typeText('「おお ゆうしゃよ！ しんでしまうとは なにごとだ！」\n……さいわい おこられずに 所持金はんぶんで もどされた！', { pauseAfterMs: 750 });

    stage.setTheme('battle');
    audio.startBgm('battle');
    audio.playSe('critical');
    stage.flash('gold');
    stage.setVisualHtml(renderBossBattle({ bossHp: 0, bossHit: true, targetName: `${winner.name} が とどめ！`, partyStates: sampleParty }));
    await stage.typeText(`気を取り直して 再戦！ 今度は「${winner.name}」が きっちり とどめを さした！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  // 通常：パルプンテ／会心の一撃
  audio.playSe('attack');
  stage.setVisualHtml(renderBossBattle({ bossHp: 50, bossHit: true, targetName: `${decoy.name} は パルプンテを となえた！`, partyStates: sampleParty }));
  await stage.typeText(`「${decoy.name}」は ヤケクソで パルプンテを となえた！\n……なんと まおうが 転んでしまった！`, { pauseAfterMs: 700 });

  audio.playSe('critical');
  stage.flash('gold');
  stage.setVisualHtml(renderBossBattle({ bossHp: 0, bossHit: true, targetName: `${winner.name} の かいしんのいちげき！`, partyStates: sampleParty }));
  await stage.typeText(`そのスキに「${winner.name}」が かいしんの いちげき！\nまおうを たおし「${winner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 800 });
}
