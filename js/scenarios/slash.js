import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

function renderSlashScene({ nameText = '……', slashClass = '', badge = '静寂のなか、刀に 手をかけた', aura = 'aura-wood', drawn = false }) {
  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(badge)}</div>
    <div class="sprite-wrap ${drawn ? 'sprite-glow-gold' : ''}">
      ${getSpriteSvg(drawn ? 'sword_drawn' : 'hero', 86)}
    </div>
    <div class="slash-stage">
      <div class="slash-line ${slashClass}"></div>
      <div class="name-scroll-box" style="border:none;background:transparent;">${escapeHtml(nameText)}</div>
    </div>
  `;
}

export async function runSlashScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('night');
  stage.setQuestLabel('月明かりの道場');
  audio.stopBgm();

  stage.setVisualHtml(renderSlashScene({ nameText: '集中……', badge: `お題：${drawTitle}` }));
  await stage.typeText(`月明かりのもと、剣士は 静かに 目を とじた。`, { pauseAfterMs: 450 });

  // プレミア：一瞬の居合
  if (route === 'premier') {
    await stage.wait(350);
    audio.playSe('critical');
    stage.setVisualHtml(renderSlashScene({
      nameText: winner.name,
      slashClass: 'active',
      badge: '一閃',
      aura: 'aura-gold',
      drawn: true,
    }));
    await stage.typeText(`目にも とまらぬ 一閃！\n「${winner.name}」の名が 静かに うかびあがった！`, { pauseAfterMs: 700 });
    return;
  }

  // 候補名が切り替わる
  const pool = members.length > 0 ? members : [decoy];
  for (let i = 0; i < 6; i++) {
    stage.checkAborted();
    audio.playSe('cursor');
    stage.setVisualHtml(renderSlashScene({
      nameText: pool[i % pool.length].name,
      badge: '息をととのえている…',
      aura: 'aura-red',
    }));
    await stage.wait(140 + i * 25);
  }

  // セーフ：空を切って納刀
  if (isSafe) {
    audio.playSe('attack');
    stage.setVisualHtml(renderSlashScene({
      nameText: '風のみが ながれた',
      slashClass: 'active',
      badge: 'まだ そのときではない',
      aura: 'aura-wood',
    }));
    await stage.wait(450);
    await stage.typeText('刃は 空を 切り、剣士は 静かに 刀を おさめた。\n今回は 見送り＝ぜんいん セーフ！', { pauseAfterMs: 700 });
    return;
  }

  // 逆転：一の太刀が弾かれる → 二の太刀で決定
  if (route === 'reverse') {
    audio.playSe('attack');
    stage.setVisualHtml(renderSlashScene({
      nameText: decoy.name,
      slashClass: 'active',
      badge: '一の太刀！',
      aura: 'aura-red',
    }));
    await stage.wait(380);
    audio.playSe('miss');
    await stage.typeText(`一の太刀は「${decoy.name}」の まえで 弾かれた！\n剣士は すかさず 構えなおす！`, { pauseAfterMs: 550 });

    audio.playSe('critical');
    stage.flash('gold');
    stage.setVisualHtml(renderSlashScene({
      nameText: winner.name,
      slashClass: 'second',
      badge: '二の太刀・一閃！',
      aura: 'aura-gold',
      drawn: true,
    }));
    await stage.typeText(`逆袈裟の 二の太刀が きまった！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 750 });
    return;
  }

  // 通常：一閃で決着
  audio.playSe('critical');
  stage.flash('gold');
  stage.setVisualHtml(renderSlashScene({
    nameText: winner.name,
    slashClass: 'active',
    badge: '一閃',
    aura: 'aura-gold',
    drawn: true,
  }));
  await stage.typeText(`一閃！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 700 });
}
