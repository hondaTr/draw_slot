import { audio } from '../audio.js';
import { escapeHtml } from '../stage.js';

function renderCasino({ reels, locked = [false, false, false], spinning = [false, false, false], lampText = 'カジノのスロット', isReach = false }) {
  const cols = reels
    .map((r, i) => {
      const cls = `reel-col ${locked[i] ? 'locked' : ''} ${spinning[i] ? 'spinning' : ''}`;
      return `
        <div class="${cls}">
          <div class="reel-cell-sub">${escapeHtml(r.top)}</div>
          <div class="reel-cell-main">${escapeHtml(r.mid)}</div>
          <div class="reel-cell-sub">${escapeHtml(r.bot)}</div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="casino-machine">
      <div class="casino-lamp ${isReach ? 'reach' : ''}">${escapeHtml(lampText)}</div>
      <div class="casino-reels">${cols}</div>
    </div>
  `;
}

export async function runCasinoScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('casino');
  stage.setQuestLabel('まちのカジノ・100コインスロット');
  audio.startBgm('casino');

  const poolNames = members.map((m) => m.name);
  const pickAt = (idx) => poolNames[((idx % poolNames.length) + poolNames.length) % poolNames.length];

  const makeReel = (midName, offset = 0) => ({
    top: pickAt(poolNames.indexOf(midName) + 1 + offset),
    mid: midName,
    bot: pickAt(poolNames.indexOf(midName) + 2 + offset),
  });

  // プレミア：セーブしてやり直す手間いらず、一発揃え
  if (route === 'premier') {
    stage.setVisualHtml(renderCasino({
      reels: [makeReel('？？？'), makeReel('？？？'), makeReel('？？？')],
      spinning: [true, true, true],
      lampText: 'コインを 1まい いれた',
    }));
    await stage.typeText('「セーブしたし 1回だけ まわしてみよう！」と コインを いれた！', { pauseAfterMs: 500 });

    audio.playSe('upgrade');
    stage.flash('gold');
    const winReel = makeReel(winner.name);
    stage.setVisualHtml(renderCasino({
      reels: [winReel, winReel, winReel],
      locked: [true, true, true],
      lampText: `そろった！「${winner.name}」`,
      isReach: true,
    }));
    await stage.typeText(`リセットするまでもなく 1発で「${winner.name}」が そろった！！\nそのまま「${drawTitle}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  let r0 = makeReel(pickAt(0));
  let r1 = makeReel(pickAt(1));
  let r2 = makeReel(pickAt(2));

  for (let t = 0; t < 5; t++) {
    stage.checkAborted();
    r0 = makeReel(pickAt(t));
    r1 = makeReel(pickAt(t + 1));
    r2 = makeReel(pickAt(t + 2));
    audio.playSe('reelTick');
    stage.setVisualHtml(renderCasino({
      reels: [r0, r1, r2],
      spinning: [true, true, true],
      lampText: 'リールが まわっている…',
    }));
    await stage.wait(120);
  }

  const targetLeftMid = isSafe || route === 'reverse' ? decoy.name : winner.name;

  audio.playSe('reelStop');
  r0 = makeReel(targetLeftMid);
  stage.setVisualHtml(renderCasino({
    reels: [r0, r1, r2],
    locked: [true, false, false],
    spinning: [false, true, true],
    lampText: `左リール「${targetLeftMid}」`,
  }));
  await stage.typeText(`まず 左に「${targetLeftMid}」が とまった！`, { pauseAfterMs: 450 });

  for (let t = 0; t < 4; t++) {
    stage.checkAborted();
    r1 = makeReel(pickAt(t + 2));
    r2 = makeReel(pickAt(t + 3));
    audio.playSe('reelTick');
    stage.setVisualHtml(renderCasino({
      reels: [r0, r1, r2],
      locked: [true, false, false],
      spinning: [false, true, true],
      lampText: 'まん中も そろうか…？',
    }));
    await stage.wait(120);
  }

  audio.playSe('reelStop');
  audio.playSe('upgrade');
  r1 = makeReel(targetLeftMid, 1);
  stage.setVisualHtml(renderCasino({
    reels: [r0, r1, r2],
    locked: [true, true, false],
    spinning: [false, false, true],
    lampText: `リーチ！「${targetLeftMid}」`,
    isReach: true,
  }));
  await stage.typeText(`真ん中も「${targetLeftMid}」で リーチ！\n（これが はずれたら 教会に もどって やりなおしだな…）`, { pauseAfterMs: 700 });

  for (let t = 0; t < 7; t++) {
    stage.checkAborted();
    r2 = makeReel(pickAt(t));
    audio.playSe('reelTick');
    stage.setVisualHtml(renderCasino({
      reels: [r0, r1, r2],
      locked: [true, true, false],
      spinning: [false, false, true],
      lampText: 'もうすぐ とまる…！',
      isReach: true,
    }));
    await stage.wait(110 + t * 22);
  }

  // セーフ：コインが尽きた
  if (isSafe) {
    audio.playSe('reelStop');
    const missIdx = Math.max(0, poolNames.indexOf(targetLeftMid)) + 1;
    const missName = members.length > 1 ? pickAt(missIdx) : 'はずれ';
    r2 = { top: targetLeftMid, mid: missName, bot: 'セーフ' };
    stage.setVisualHtml(renderCasino({
      reels: [r0, r1, r2],
      locked: [true, true, true],
      lampText: '1コマ ずれて はずれ！',
    }));
    audio.playSe('miss');
    await stage.typeText('1コマ ずれて はずれた！ コインも つきた……\nきょうは ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：コインが切れたと思ったら足元に1枚落ちていた！
  if (route === 'reverse') {
    audio.playSe('reelStop');
    const fakeMiss = members.length > 1 ? pickAt(poolNames.indexOf(targetLeftMid) + 1) : '？？？';
    r2 = { top: winner.name, mid: fakeMiss, bot: targetLeftMid };
    stage.setVisualHtml(renderCasino({
      reels: [r0, r1, r2],
      locked: [true, true, true],
      lampText: 'コインが なくなってしまった…',
    }));
    audio.playSe('miss');
    await stage.typeText('1コマ ずれて コインが なくなった！\n……とおもったら 足元に 1枚 おちていた！！', { pauseAfterMs: 850 });

    await stage.showCutin('ラスト1枚で まわした！', 900);
    audio.playSe('upgrade');
    stage.flash('gold');

    const winReel = makeReel(winner.name);
    stage.setVisualHtml(renderCasino({
      reels: [winReel, winReel, winReel],
      locked: [true, true, true],
      lampText: `そろった！「${winner.name}」`,
      isReach: true,
    }));
    await stage.typeText(`なんと ラスト1枚で「${winner.name}」が 3つ そろった！！\n「${winner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  // 通常：素直に揃う
  audio.playSe('reelStop');
  stage.flash('gold');
  r2 = makeReel(winner.name, 2);
  stage.setVisualHtml(renderCasino({
    reels: [r0, r1, r2],
    locked: [true, true, true],
    lampText: `そろった！「${winner.name}」`,
    isReach: true,
  }));
  await stage.typeText(`「${winner.name}」が 3つ そろった！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 800 });
}
