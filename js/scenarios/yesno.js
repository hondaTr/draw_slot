import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderYesNoScene({ speaker = '村長', line = 'ひきうけて くれますね？', options = ['はい', 'いいえ'], activeIdx = 1, targetName = '' }) {
  const optsHtml = options
    .map((label, idx) => {
      const isAct = idx === activeIdx;
      return `<div class="yesno-opt ${isAct ? 'active' : ''}">${isAct ? '▶' : '　'} ${escapeHtml(label)}</div>`;
    })
    .join('');

  return `
    ${targetName ? `<div class="chest-aura-badge aura-gold">こえをかけられた人：${escapeHtml(targetName)}</div>` : ''}
    <div class="scene-row">
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('villager', 96)}</div>
      <div class="yesno-box">${optsHtml}</div>
    </div>
    <div class="name-scroll-box">${escapeHtml(speaker)}「${escapeHtml(line)}」</div>
  `;
}

export async function runYesNoScenario(ctx) {
  const { stage, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('throne');
  stage.setQuestLabel('はじまりの村・村長のいえ');
  audio.startBgm('field');

  // プレミア：最初から「はい／はい」
  if (route === 'premier') {
    stage.setVisualHtml(renderYesNoScene({
      line: `${winner.name} さん、${drawTitle} を おねがいしますよ？`,
      options: ['はい', 'はい'],
      activeIdx: 0,
      targetName: winner.name,
    }));
    await stage.typeText(`村長「${winner.name} さん、今回の『${drawTitle}』を ひきうけて くれますね？」\n……よく見たら 選択肢が 両方とも「はい」になっている！`, { pauseAfterMs: 800 });
    audio.playSe('confirm');
    return;
  }

  const firstPerson = route === 'reverse' ? decoy.name : isSafe ? decoy.name : winner.name;

  // 1回目：「いいえ」を選ぶ
  stage.setVisualHtml(renderYesNoScene({
    line: `今回の ${drawTitle} を やってくれますね？`,
    options: ['はい', 'いいえ'],
    activeIdx: 1,
    targetName: firstPerson,
  }));
  await stage.typeText(`村長「${firstPerson} さん、今回の『${drawTitle}』を ひきうけて くれますね？」`, { pauseAfterMs: 650 });

  audio.playSe('cursor');
  await stage.typeText(`▶「いいえ」を えらんだ！\n村長「そんな ひどい！ どうか おねがいしますよ！」`, { pauseAfterMs: 650 });

  // 2回目：また「いいえ」を選ぶがループする
  audio.playSe('cursor');
  stage.setVisualHtml(renderYesNoScene({
    line: '……やって くれますよね？',
    options: ['はい', 'いいえ'],
    activeIdx: 1,
    targetName: firstPerson,
  }));
  await stage.typeText(`もういちど ▶「いいえ」を えらんだ！\n村長「おや、きこえなかったかな？ もういちど ききますよ？」`, { pauseAfterMs: 700 });

  // セーフ：3回目で本当にあきらめる（めずらしい）
  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderYesNoScene({
      line: '……わかりました。では またの きかいに。',
      options: ['はい', 'いいえ'],
      activeIdx: 1,
      targetName: 'だれも えらばれない',
    }));
    await stage.typeText('村長「……そんなに いやなら しかたありませんね」\nめずらしく 村長が ひきさがった！ 今回は ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：最初の人が断りきった瞬間、隣の人に質問が移り「はい／はい」になる
  if (route === 'reverse') {
    await stage.showCutin('では となりの あなた！', 950);
    audio.playSe('confirm');
    stage.setVisualHtml(renderYesNoScene({
      line: `${winner.name} さんなら やってくれますよね？`,
      options: ['はい', 'はい'],
      activeIdx: 0,
      targetName: winner.name,
    }));
    await stage.typeText(`村長「わかりました！ では となりにいた『${winner.name}』さん、おねがいしますね？」\n……選択肢が「はい」と「はい」しかない！ 断れない！`, { pauseAfterMs: 850 });
    return;
  }

  // 通常：カーソルが勝手に「はい」へ動く
  await stage.wait(350);
  audio.playSe('cursor');
  stage.setVisualHtml(renderYesNoScene({
    line: 'わかって くれましたか！ ありがとう！',
    options: ['はい', 'いいえ'],
    activeIdx: 0,
    targetName: winner.name,
  }));
  audio.playSe('confirm');
  await stage.typeText(`カーソルが かってに ▶「はい」に うごいて 決定された！！\n村長「ありがとう！ さっそく『${drawTitle}』を よろしく たのみます！」`, { pauseAfterMs: 800 });
}
