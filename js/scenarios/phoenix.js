import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

const ORB_COLORS = ['blue', 'red', 'yellow', 'green', 'purple', 'silver'];

function renderPhoenixScene({ litCount = 0, showBird = false, birdGlow = false, badge = '6つのオーブを ささげる祭壇', caption = '' }) {
  const gemsHtml = ORB_COLORS.map((c, idx) => {
    const lit = idx < litCount ? 'lit' : '';
    return `<span class="orb-gem orb-${c} ${lit}"></span>`;
  }).join('');

  return `
    <div class="chest-aura-badge aura-gold">${escapeHtml(badge)}</div>
    <div class="orb-altar">${gemsHtml}</div>
    <div class="scene-row">
      <div class="sprite-wrap ${birdGlow ? 'sprite-glow-gold sprite-float' : 'sprite-float'}">
        ${getSpriteSvg(showBird ? 'phoenix' : 'orb', 104)}
      </div>
    </div>
    ${caption ? `<div class="name-scroll-box">${escapeHtml(caption)}</div>` : ''}
  `;
}

export async function runPhoenixScenario(ctx) {
  const { stage, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('night');
  stage.setQuestLabel('さいはてのほこら・不死鳥の祭壇');
  audio.startBgm('field');

  stage.setVisualHtml(renderPhoenixScene({ litCount: 0, badge: 'しずまりかえった 祭壇' }));
  await stage.typeText(`6つの オーブが そろうとき、次の「${drawTitle}」を つげる 不死鳥が めざめる。`, { pauseAfterMs: 500 });

  // プレミア：最初から共鳴
  if (route === 'premier') {
    audio.playSe('revive');
    stage.flash('gold');
    stage.setVisualHtml(renderPhoenixScene({
      litCount: 6,
      showBird: true,
      birdGlow: true,
      badge: '6つのオーブが ひかり輝いた！',
      caption: winner.name,
    }));
    await stage.typeText(`オーブが 一斉に ひかりをはなち、不死鳥が 夜空へ まいあがった！\nつばさの 軌跡に「${winner.name}」の名が えがかれる！`, { pauseAfterMs: 750 });
    return;
  }

  // 1〜5個まで順番に灯る
  for (let i = 1; i <= 5; i++) {
    stage.checkAborted();
    audio.playSe('cursor');
    stage.setVisualHtml(renderPhoenixScene({
      litCount: i,
      badge: `オーブが ${i}つ ともった…`,
      caption: i >= 4 && !isSafe ? (route === 'reverse' ? `${decoy.name} の 名が よぎる…` : 'あと ひとつ…') : '',
    }));
    await stage.wait(260);
  }

  // セーフ：最後の1つがまだだった
  if (isSafe) {
    audio.playSe('miss');
    stage.setVisualHtml(renderPhoenixScene({
      litCount: 5,
      badge: '最後の 1つが ともらない',
      caption: 'まだ ときが きていないようだ',
    }));
    await stage.typeText('6つめの オーブが まだ 見つかっていなかった！\n今回は ぜんいん セーフ！', { pauseAfterMs: 700 });
    return;
  }

  // 逆転：一度光が消えかける → 静かな暗転 → 再点火して不死鳥飛翔
  if (route === 'reverse') {
    audio.playSe('miss');
    stage.setBlackout(true);
    stage.setVisualHtml(renderPhoenixScene({
      litCount: 0,
      badge: '光が ふっと きえた…',
      caption: `${decoy.name} では なかったのか…`,
    }));
    await stage.wait(650);
    stage.setBlackout(false);

    await stage.showCutin('6つの光が ひとつに むすばれる！', 850);
    audio.playSe('revive');
    stage.flash('gold');
    stage.setVisualHtml(renderPhoenixScene({
      litCount: 6,
      showBird: true,
      birdGlow: true,
      badge: '不死鳥 飛翔',
      caption: winner.name,
    }));
    await stage.typeText(`消えかけた 光が 再び もえあがり、不死鳥が たかく はばたいた！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 750 });
    return;
  }

  // 通常：6つ目点灯 → 不死鳥出現
  audio.playSe('revive');
  stage.flash('gold');
  stage.setVisualHtml(renderPhoenixScene({
    litCount: 6,
    showBird: true,
    birdGlow: true,
    badge: '6つのオーブが そろった！',
    caption: winner.name,
  }));
  await stage.typeText(`6つめの オーブが ともり、不死鳥が 夜空へ とびたった！\n「${winner.name}」が 今回の「${drawTitle}」に きまった！`, { pauseAfterMs: 700 });
}
