import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderSwordScene({ drawn = false, challenger = '？？？', badge = '台座にささった剣', aura = 'aura-wood' }) {
  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(badge)}</div>
    <div class="scene-row">
      <div class="sprite-wrap sprite-bounce">${getSpriteSvg('hero', 94)}</div>
      <div class="sprite-wrap ${drawn ? 'sprite-glow-gold sprite-float' : ''}">
        ${getSpriteSvg(drawn ? 'sword_drawn' : 'sword_stone', 104)}
      </div>
    </div>
    <div class="name-scroll-box">${escapeHtml(challenger)}</div>
  `;
}

export async function runSwordScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('throne');
  stage.setQuestLabel('まよいのもり・台座のまえ');
  audio.startBgm('field');

  stage.setVisualHtml(renderSwordScene({ drawn: false, challenger: 'だれが ぬけるかな？', badge: '台座に ささった 剣' }));
  await stage.typeText(`もりのおくに 古い剣が ささっている…\n引きぬいた人が 今回の「${drawTitle}」だ！`, { pauseAfterMs: 700 });

  // プレミア：実はぬくまでもなく ただ置いてあっただけ
  if (route === 'premier') {
    audio.playSe('confirm');
    stage.flash('gold');
    stage.setVisualHtml(renderSwordScene({
      drawn: true,
      challenger: winner.name,
      badge: 'あれ、すぽっと ぬけた！',
      aura: 'aura-gold',
    }));
    await stage.typeText(`「${winner.name}」が さわったら すぽっと ぬけた！\n（ささっていた のではなく ただ置いてあっただけ みたいだ）`, { pauseAfterMs: 850 });
    return;
  }

  const firstChallenger = members.length > 1 ? decoy.name : 'たびのしょうにん';
  stage.setVisualHtml(renderSwordScene({
    drawn: false,
    challenger: `${firstChallenger} が そうびしようとした…`,
    badge: 'しかし そうび できない！',
    aura: 'aura-red',
  }));
  audio.playSe('miss');
  await stage.typeText(`まず「${firstChallenger}」が 抜こうとした！\n……しかし「${firstChallenger} は これを そうび できない！」（お約束！）`, { pauseAfterMs: 750 });

  // セーフ：よく見たら ただの「ひのきのぼう」だった
  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderSwordScene({
      drawn: false,
      challenger: 'よくみたら ただの「きのぼう」だった',
      badge: 'なんだ これ…',
      aura: 'aura-wood',
    }));
    await stage.typeText('みんなで よく 見てみたら、ささっていたのは ただの「ひのきのぼう」だった！\nきょうは 解散！ ぜんいん セーフ！', { pauseAfterMs: 850 });
    return;
  }

  // 逆転：のろわれていた！ → じつは ぬけた人のところに しかけた呪いだった
  if (route === 'reverse') {
    stage.setVisualHtml(renderSwordScene({
      drawn: true,
      challenger: `${firstChallenger} が ぬいた！`,
      badge: '……あれ？ おかしいぞ？',
      aura: 'aura-red',
    }));
    audio.playSe('wipeout');
    await stage.typeText(`おや？「${firstChallenger}」が もういちど 引いたら ぬけた！\n……しかし「のろわれていた！ てから はなれない！」`, { pauseAfterMs: 800 });

    await stage.showCutin('シャナク！ のろいを といた！', 950);
    audio.playSe('revive');
    stage.flash('gold');
    stage.setVisualHtml(renderSwordScene({
      drawn: true,
      challenger: winner.name,
      badge: 'ほんものが でてきた！',
      aura: 'aura-gold',
    }));
    await stage.typeText(`のろいが とけた 剣を となりの「${winner.name}」に わたしてみたら ピッタリ！\n「${winner.name}」が 今回の「${drawTitle}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  // 通常：めでたく抜ける
  audio.playSe('revive');
  stage.flash('gold');
  stage.setVisualHtml(renderSwordScene({
    drawn: true,
    challenger: winner.name,
    badge: 'みごと 引きぬいた！',
    aura: 'aura-gold',
  }));
  await stage.typeText(`「${winner.name}」が スッと 剣を 引きぬいた！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 800 });
}
