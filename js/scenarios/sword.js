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

  stage.setVisualHtml(renderSwordScene({ drawn: false, challenger: 'だれが 引きぬくか…', badge: '台座に ささった 剣' }));
  await stage.typeText(`もりのおくの 台座に 古い剣が ささっている。\n引きぬいた者が 今回の「${drawTitle}」だ！`, { pauseAfterMs: 520 });

  if (route === 'premier') {
    audio.playSe('revive');
    stage.flash('gold');
    stage.setVisualHtml(renderSwordScene({
      drawn: true,
      challenger: winner.name,
      badge: '剣が 共鳴した！',
      aura: 'aura-gold',
    }));
    await stage.typeText(`「${winner.name}」が 手をかざしただけで 剣が まっすぐ 引きぬかれた！`, { pauseAfterMs: 650 });
    return;
  }

  const firstChallenger = members.length > 1 ? decoy.name : 'たびのしょうにん';
  stage.setVisualHtml(renderSwordScene({
    drawn: false,
    challenger: `${firstChallenger} が 挑戦！`,
    badge: 'しかし そうび できない！',
    aura: 'aura-red',
  }));
  audio.playSe('miss');
  await stage.typeText(`まず「${firstChallenger}」が 剣に 手をかけた！\n……しかし「${firstChallenger} は これを そうび できない！」`, { pauseAfterMs: 550 });

  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderSwordScene({
      drawn: false,
      challenger: 'びくとも しない…',
      badge: 'まだ ときが きていないようだ',
      aura: 'aura-wood',
    }));
    await stage.typeText('だれが 引いても 剣は うごかなかった。\n今回は 見送り＝ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  if (route === 'reverse') {
    stage.setVisualHtml(renderSwordScene({
      drawn: true,
      challenger: `${firstChallenger} が 抜いた！`,
      badge: 'しかし のろわれていた！',
      aura: 'aura-red',
    }));
    audio.playSe('wipeout');
    await stage.typeText(`おや？「${firstChallenger}」が 引いたら ぬけた！\n……しかし「のろわれていた！ てから はなれない！」`, { pauseAfterMs: 600 });

    await stage.showCutin('きよめの 光が のろいを はらった！', 850);
    audio.playSe('revive');
    stage.flash('gold');
    stage.setVisualHtml(renderSwordScene({
      drawn: true,
      challenger: winner.name,
      badge: '真の 使い手！',
      aura: 'aura-gold',
    }));
    await stage.typeText(`のろいが とけた 剣を となりの「${winner.name}」に わたすと ぴたりと おさまった！\n「${winner.name}」が 今回の「${drawTitle}」に きまった！`, { pauseAfterMs: 650 });
    return;
  }

  audio.playSe('revive');
  stage.flash('gold');
  stage.setVisualHtml(renderSwordScene({
    drawn: true,
    challenger: winner.name,
    badge: '引きぬき せいこう！',
    aura: 'aura-gold',
  }));
  await stage.typeText(`「${winner.name}」が みごと 剣を 引きぬいた！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 600 });
}
